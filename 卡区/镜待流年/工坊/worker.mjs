const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_IMAGE = 20 * 1024 * 1024;
const MAX_BODY = 42 * 1024 * 1024;
const MAX_ITEMS = 24;
const MAX_DRAFT_ITEMS = 2000;
const MAX_MANIFEST_BODY = 2 * 1024 * 1024;
const DISCORD_CLIENT_ID = '1556568349285027932';
const SESSION_COOKIE = '__Host-jdnl-session';
const STATE_COOKIE = '__Host-jdnl-oauth';
const SESSION_SECONDS = 7 * 24 * 60 * 60;

class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; }
}

// Keep migrations inline so the dashboard's single-file Worker needs no imports.
// Each trigger is one prepared statement; its internal semicolons must not be split.
const SETUP_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS workshop_quota (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    limit_bytes INTEGER NOT NULL CHECK (limit_bytes > 0)
  )`,
  `INSERT OR IGNORE INTO workshop_quota (id, limit_bytes) VALUES (1, 8000000000)`,
  `CREATE TABLE IF NOT EXISTS storage_reservations (
    group_id TEXT PRIMARY KEY,
    byte_size INTEGER NOT NULL CHECK (byte_size > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `INSERT OR IGNORE INTO storage_reservations (group_id, byte_size)
    SELECT a.group_id, SUM(a.byte_size) FROM portrait_assets a
    WHERE NOT EXISTS (SELECT 1 FROM storage_reservations r WHERE r.group_id = a.group_id)
    GROUP BY a.group_id`,
  `CREATE TRIGGER IF NOT EXISTS reserve_storage_limit
    BEFORE INSERT ON storage_reservations
    WHEN COALESCE((SELECT SUM(byte_size) FROM storage_reservations), 0) + NEW.byte_size
      > (SELECT limit_bytes FROM workshop_quota WHERE id = 1)
    BEGIN
      SELECT RAISE(ABORT, 'workshop_capacity_exceeded');
    END`,
  `CREATE TABLE IF NOT EXISTS workshop_users (
    discord_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_states (
    state_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at)`,
  `CREATE TABLE IF NOT EXISTS workshop_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),
    csrf_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_workshop_sessions_expiry ON workshop_sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS login_limits (
    key_hash TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_login_limits_expiry ON login_limits(expires_at)`,
  `CREATE TABLE IF NOT EXISTS portrait_group_owners (
    group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
    user_id TEXT NOT NULL REFERENCES workshop_users(discord_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_portrait_owners_user ON portrait_group_owners(user_id)`,
  `CREATE TABLE IF NOT EXISTS player_upload_attempts (
    group_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),
    request_key TEXT NOT NULL,
    byte_size INTEGER NOT NULL CHECK (byte_size > 0),
    outcome TEXT NOT NULL DEFAULT 'writing' CHECK (outcome IN ('writing', 'complete', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, request_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_player_upload_attempts_user_time ON player_upload_attempts(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_player_upload_attempts_time ON player_upload_attempts(created_at)`,
  `CREATE TRIGGER IF NOT EXISTS player_upload_limit
    BEFORE INSERT ON player_upload_attempts
    BEGIN
      SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1
        THEN RAISE(ABORT, 'player_blocked') END;
      SELECT CASE WHEN (SELECT COUNT(*) FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 day')) >= 5
        THEN RAISE(ABORT, 'player_daily_limit') END;
      SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 37748736
        THEN RAISE(ABORT, 'player_daily_limit') END;
      SELECT CASE WHEN EXISTS (SELECT 1 FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 minute'))
        THEN RAISE(ABORT, 'player_rate_limit') END;
      SELECT CASE WHEN (SELECT COUNT(*) FROM portrait_groups g JOIN portrait_group_owners o ON o.group_id = g.id
        WHERE o.user_id = NEW.user_id AND g.status = 'pending') +
        (SELECT COUNT(*) FROM player_upload_attempts a WHERE a.user_id = NEW.user_id
        AND a.outcome = 'writing' AND a.created_at >= datetime('now', '-1 hour')
        AND NOT EXISTS (SELECT 1 FROM portrait_groups g WHERE g.id = a.group_id)) >= 3
        THEN RAISE(ABORT, 'player_pending_limit') END;
      SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts
        WHERE created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 268435456
        THEN RAISE(ABORT, 'player_global_daily_limit') END;
    END`,
  `CREATE TABLE IF NOT EXISTS portrait_group_revisions (
    group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
    source_group_id TEXT NOT NULL REFERENCES portrait_groups(id),
    source_status TEXT NOT NULL,
    CHECK (group_id <> source_group_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_portrait_revisions_source ON portrait_group_revisions(source_group_id)`,
  `CREATE TRIGGER IF NOT EXISTS portrait_revision_insert
    BEFORE INSERT ON portrait_group_revisions
    BEGIN
      SELECT CASE WHEN NOT EXISTS (
        SELECT 1 FROM portrait_groups g
        JOIN portrait_group_owners old_owner ON old_owner.group_id = g.id
        JOIN portrait_group_owners new_owner ON new_owner.group_id = NEW.group_id
        WHERE g.id = NEW.source_group_id AND g.status = NEW.source_status AND g.status <> 'draft'
          AND old_owner.user_id = new_owner.user_id
          AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = g.id)
      ) THEN RAISE(ABORT, 'revision_source_unavailable') END;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.group_id
        WHERE r.source_group_id = NEW.source_group_id AND g.status IN ('pending', 'published')
      ) THEN RAISE(ABORT, 'revision_already_exists') END;
    END`,
  `CREATE TRIGGER IF NOT EXISTS portrait_revision_publish_check
    BEFORE UPDATE OF status ON portrait_groups
    WHEN NEW.status = 'published' AND OLD.status <> 'published'
    BEGIN
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.group_id
        WHERE r.source_group_id = NEW.id AND g.status = 'published'
      ) THEN RAISE(ABORT, 'revision_superseded') END;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.source_group_id
        WHERE r.group_id = NEW.id AND (g.status <> r.source_status
          OR NOT EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = g.id))
      ) THEN RAISE(ABORT, 'revision_source_unavailable') END;
    END`,
  `CREATE TRIGGER IF NOT EXISTS portrait_revision_publish
    AFTER UPDATE OF status ON portrait_groups
    WHEN NEW.status = 'published' AND OLD.status <> 'published'
    BEGIN
      UPDATE portrait_groups SET status = 'withdrawn', published_at = NULL
        WHERE id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_assets SET status = 'withdrawn'
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now')
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      INSERT INTO moderation_events (id, submission_id, action, note)
        SELECT lower(hex(randomblob(16))), s.id, 'replaced', NEW.id FROM portrait_submissions s
        JOIN portrait_group_revisions r ON r.source_group_id = s.group_id WHERE r.group_id = NEW.id;
    END`,
  `CREATE TABLE IF NOT EXISTS portrait_upload_drafts (
    group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id),
    manifest_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `DROP TRIGGER IF EXISTS player_upload_limit`,
  `CREATE TRIGGER player_upload_limit
    BEFORE INSERT ON player_upload_attempts
    BEGIN
      SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1
        THEN RAISE(ABORT, 'player_blocked') END;
      SELECT CASE WHEN (SELECT COUNT(*) FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 day')) >= 5
        THEN RAISE(ABORT, 'player_daily_limit') END;
      SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 2147483648
        THEN RAISE(ABORT, 'player_daily_limit') END;
      SELECT CASE WHEN EXISTS (SELECT 1 FROM player_upload_attempts WHERE user_id = NEW.user_id
        AND created_at >= datetime('now', '-1 minute'))
        THEN RAISE(ABORT, 'player_rate_limit') END;
      SELECT CASE WHEN (SELECT COUNT(*) FROM portrait_groups g JOIN portrait_group_owners o ON o.group_id = g.id
        WHERE o.user_id = NEW.user_id AND g.status = 'pending') +
        (SELECT COUNT(*) FROM player_upload_attempts a WHERE a.user_id = NEW.user_id
        AND a.outcome = 'writing' AND a.created_at >= datetime('now', '-1 hour')) >= 3
        THEN RAISE(ABORT, 'player_pending_limit') END;
      SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM player_upload_attempts
        WHERE created_at >= datetime('now', '-1 day')), 0) + NEW.byte_size > 4294967296
        THEN RAISE(ABORT, 'player_global_daily_limit') END;
    END`,
  `CREATE TRIGGER IF NOT EXISTS portrait_draft_finalize
    BEFORE UPDATE OF status ON portrait_groups
    WHEN OLD.status = 'draft' AND NEW.status = 'pending'
    BEGIN
      SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM portrait_upload_drafts WHERE group_id = NEW.id)
        OR (SELECT COUNT(*) FROM portrait_assets WHERE group_id = NEW.id) <
           json_array_length((SELECT manifest_json FROM portrait_upload_drafts WHERE group_id = NEW.id))
        THEN RAISE(ABORT, 'upload_incomplete') END;
    END`,
  `CREATE TABLE IF NOT EXISTS portrait_append_revisions (
    group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id)
  )`,
  `DROP TRIGGER IF EXISTS portrait_revision_publish`,
  `CREATE TRIGGER portrait_revision_publish
    AFTER UPDATE OF status ON portrait_groups
    WHEN NEW.status = 'published' AND OLD.status <> 'published'
      AND NOT EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
    BEGIN
      UPDATE portrait_groups SET status = 'withdrawn', published_at = NULL
        WHERE id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_assets SET status = 'withdrawn'
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now')
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      INSERT INTO moderation_events (id, submission_id, action, note)
        SELECT lower(hex(randomblob(16))), s.id, 'replaced', NEW.id FROM portrait_submissions s
        JOIN portrait_group_revisions r ON r.source_group_id = s.group_id WHERE r.group_id = NEW.id;
    END`,
  `CREATE TRIGGER IF NOT EXISTS portrait_append_publish_check
    BEFORE UPDATE OF status ON portrait_groups
    WHEN NEW.status = 'published' AND OLD.status <> 'published'
      AND EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
    BEGIN
      SELECT CASE WHEN (SELECT status FROM portrait_groups WHERE id =
        (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)) <> 'published'
        THEN RAISE(ABORT, 'revision_source_unavailable') END;
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM portrait_assets old JOIN portrait_assets added ON old.portrait_id = added.portrait_id
        WHERE old.group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)
          AND added.group_id = NEW.id
      ) THEN RAISE(ABORT, 'portrait_id_conflict') END;
    END`,
  `CREATE TRIGGER IF NOT EXISTS portrait_append_publish
    AFTER UPDATE OF status ON portrait_groups
    WHEN NEW.status = 'published' AND OLD.status <> 'published'
      AND EXISTS (SELECT 1 FROM portrait_append_revisions WHERE group_id = NEW.id)
    BEGIN
      UPDATE portrait_assets SET sort_order = sort_order +
        (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM portrait_assets WHERE group_id =
          (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id))
        WHERE group_id = NEW.id;
      UPDATE portrait_groups SET cover_asset_id =
        (SELECT cover_asset_id FROM portrait_groups WHERE id =
          (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id))
        WHERE id = NEW.id;
      UPDATE portrait_assets SET group_id = NEW.id, status = 'published'
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE storage_reservations SET byte_size = byte_size + COALESCE((SELECT byte_size FROM storage_reservations
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id)), 0)
        WHERE group_id = NEW.id;
      DELETE FROM storage_reservations WHERE group_id =
        (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_groups SET status = 'withdrawn', published_at = NULL, cover_asset_id = NULL
        WHERE id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now')
        WHERE group_id = (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = NEW.id);
      INSERT INTO moderation_events (id, submission_id, action, note)
        SELECT lower(hex(randomblob(16))), s.id, 'appended', NEW.id FROM portrait_submissions s
        JOIN portrait_group_revisions r ON r.source_group_id = s.group_id WHERE r.group_id = NEW.id;
    END`,
  `CREATE TABLE IF NOT EXISTS portrait_group_stats (
    group_id TEXT PRIMARY KEY REFERENCES portrait_groups(id) ON DELETE CASCADE,
    download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_portrait_group_stats_hot ON portrait_group_stats(download_count DESC, use_count DESC)`,
];

const CHARACTER_SETUP_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS character_workshop_quota (\n  id INTEGER PRIMARY KEY CHECK (id = 1),\n  limit_bytes INTEGER NOT NULL CHECK (limit_bytes > 0)\n)",
  "INSERT OR IGNORE INTO character_workshop_quota VALUES (1, 67108864)",
  "CREATE TABLE IF NOT EXISTS character_packages (\n  id TEXT PRIMARY KEY,\n  user_id TEXT NOT NULL REFERENCES workshop_users(discord_id),\n  request_key TEXT NOT NULL,\n  name TEXT NOT NULL,\n  description TEXT NOT NULL DEFAULT '',\n  author_name TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'withdrawn')),\n  payload TEXT NOT NULL,\n  content_hash TEXT NOT NULL,\n  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 262144),\n  entry_count INTEGER NOT NULL CHECK (entry_count BETWEEN 1 AND 32),\n  portrait_group_id TEXT,\n  source_id TEXT REFERENCES character_packages(id),\n  source_status TEXT,\n  family_id TEXT NOT NULL,\n  note TEXT NOT NULL DEFAULT '',\n  download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),\n  created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  published_at TEXT,\n  UNIQUE (user_id, request_key)\n)",
  "CREATE INDEX IF NOT EXISTS idx_character_packages_public ON character_packages(status, published_at DESC, id DESC)",
  "CREATE INDEX IF NOT EXISTS idx_character_packages_author ON character_packages(user_id, created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_character_packages_source ON character_packages(source_id, status)",
  "CREATE TABLE IF NOT EXISTS character_moderation_events (\n  id TEXT PRIMARY KEY,\n  package_id TEXT NOT NULL REFERENCES character_packages(id),\n  action TEXT NOT NULL,\n  note TEXT NOT NULL DEFAULT '',\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n)",
  "CREATE TRIGGER IF NOT EXISTS character_submission_limits\nBEFORE INSERT ON character_packages\nBEGIN\n  SELECT CASE WHEN (SELECT blocked FROM workshop_users WHERE discord_id = NEW.user_id) = 1\n    THEN RAISE(ABORT, 'player_blocked') END;\n  SELECT CASE WHEN EXISTS (SELECT 1 FROM character_packages WHERE user_id = NEW.user_id AND created_at >= datetime('now', '-1 minute'))\n    THEN RAISE(ABORT, 'player_rate_limit') END;\n  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE user_id = NEW.user_id AND created_at >= datetime('now', '-1 day')) >= 5\n    THEN RAISE(ABORT, 'player_daily_limit') END;\n  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE user_id = NEW.user_id AND status = 'pending') >= 3\n    THEN RAISE(ABORT, 'player_pending_limit') END;\n  SELECT CASE WHEN (SELECT COUNT(*) FROM character_packages WHERE created_at >= datetime('now', '-1 day')) >= 200\n    THEN RAISE(ABORT, 'player_global_daily_limit') END;\n  SELECT CASE WHEN COALESCE((SELECT SUM(byte_size) FROM character_packages), 0) + NEW.byte_size > (SELECT limit_bytes FROM character_workshop_quota WHERE id = 1)\n    THEN RAISE(ABORT, 'workshop_capacity_exceeded') END;\n  SELECT CASE WHEN NEW.source_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM character_packages WHERE id = NEW.source_id AND user_id = NEW.user_id AND status IN ('published', 'withdrawn', 'rejected'))\n    THEN RAISE(ABORT, 'revision_source_unavailable') END;\n  SELECT CASE WHEN NEW.source_id IS NOT NULL AND EXISTS (SELECT 1 FROM character_packages WHERE source_id = NEW.source_id AND status IN ('pending', 'published'))\n    THEN RAISE(ABORT, 'revision_already_exists') END;\nEND",
  "CREATE TRIGGER IF NOT EXISTS character_revision_publish_check\nBEFORE UPDATE OF status ON character_packages\nWHEN NEW.status = 'published' AND OLD.status <> 'published'\nBEGIN\n  SELECT CASE WHEN EXISTS (SELECT 1 FROM character_packages WHERE source_id = NEW.id AND status = 'published')\n    THEN RAISE(ABORT, 'revision_superseded') END;\n  SELECT CASE WHEN NEW.source_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM character_packages WHERE id = NEW.source_id AND user_id = NEW.user_id AND status = NEW.source_status)\n    THEN RAISE(ABORT, 'revision_source_unavailable') END;\nEND",
  "CREATE TRIGGER IF NOT EXISTS character_revision_publish\nAFTER UPDATE OF status ON character_packages\nWHEN NEW.status = 'published' AND OLD.status <> 'published' AND NEW.source_id IS NOT NULL\nBEGIN\n  UPDATE character_packages SET status = 'withdrawn', published_at = NULL WHERE id = NEW.source_id;\n  INSERT INTO character_moderation_events (id, package_id, action, note)\n    VALUES (lower(hex(randomblob(16))), NEW.source_id, 'superseded', NEW.id);\nEND"
];

async function setupDatabase(request, db) {
  requireSameOrigin(request);
  // Cloudflare can provide a stream even for a zero-byte POST.
  if (request.body !== null) {
    const reader = request.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.byteLength) throw new ApiError(400, 'setup_body_not_allowed');
      }
    } finally {
      try { await reader.cancel(); } finally { reader.releaseLock(); }
    }
  }
  const base = await db.prepare(`SELECT COUNT(*) AS count FROM sqlite_master
    WHERE type = 'table' AND name IN ('portrait_groups', 'portrait_assets', 'portrait_submissions', 'moderation_events')`).first();
  if (base.count !== 4) throw new ApiError(409, 'base_schema_missing');
  const columns = await db.prepare('PRAGMA table_info(character_packages)').all();
  const categoryStatements = columns.results.some(column => column.name === 'category') ? [] : [
    "ALTER TABLE character_packages ADD COLUMN category TEXT NOT NULL DEFAULT 'character' CHECK (category IN ('character', 'plane', 'other'))",
  ];
  await db.batch([...SETUP_STATEMENTS, ...CHARACTER_SETUP_STATEMENTS, ...categoryStatements,
    'CREATE INDEX IF NOT EXISTS idx_character_packages_category ON character_packages(status, category, published_at DESC, id DESC)',
  ].map(sql => db.prepare(sql).bind()));
  return privateJson({ status: 'ready' });
}

const now = () => Math.floor(Date.now() / 1000);
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
async function hashToken(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('');
}
function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}
function readCookie(request, name) {
  return (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1) || '';
}
function redirect(location, cookies = []) {
  const headers = new Headers({ location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
  for (const value of cookies) headers.append('set-cookie', value);
  return new Response(null, { status: 303, headers });
}
function privateJson(data, status = 200) {
  const response = json(data, status);
  response.headers.delete('access-control-allow-origin');
  response.headers.set('vary', 'Cookie');
  return response;
}
function requireSameOrigin(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError(403, 'origin_not_allowed');
}
async function getSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return env.DB.prepare(`SELECT s.token_hash, s.csrf_token, u.discord_id, u.display_name, u.blocked
    FROM workshop_sessions s JOIN workshop_users u ON u.discord_id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(await hashToken(token), now()).first();
}
async function requirePlayer(request, env, write = false) {
  const session = await getSession(request, env);
  if (!session) throw new ApiError(401, 'login_required');
  if (write) {
    requireSameOrigin(request);
    if (request.headers.get('x-csrf-token') !== session.csrf_token) throw new ApiError(403, 'csrf_failed');
  }
  return session;
}
async function cleanupAuth(db) {
  const timestamp = now();
  await db.batch([
    db.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').bind(timestamp),
    db.prepare('DELETE FROM workshop_sessions WHERE expires_at <= ?').bind(timestamp),
    db.prepare('DELETE FROM login_limits WHERE expires_at <= ?').bind(timestamp),
    db.prepare(`DELETE FROM player_upload_attempts WHERE outcome = 'failed' AND created_at < datetime('now', '-7 days')
      AND NOT EXISTS (SELECT 1 FROM storage_reservations r WHERE r.group_id = player_upload_attempts.group_id)` ).bind(),
  ]);
}
async function discordStart(request, env) {
  if (typeof env.DISCORD_CLIENT_SECRET !== 'string' || env.DISCORD_CLIENT_SECRET.length < 16) throw new ApiError(503, 'discord_not_configured');
  await cleanupAuth(env.DB);
  const timestamp = now();
  const ip = request.headers.get('cf-connecting-ip');
  // Cloudflare supplies this header; do not accept an arbitrary forwarded IP instead.
  const key = await hashToken(`${ip || 'unknown'}:${Math.floor(timestamp / 3600)}`);
  const limit = await env.DB.prepare(`INSERT INTO login_limits (key_hash, attempts, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key_hash) DO UPDATE SET attempts = attempts + 1 RETURNING attempts`).bind(key, timestamp + 3600).first();
  if (limit.attempts > 30) throw new ApiError(429, 'login_rate_limit');
  const state = randomToken();
  await env.DB.prepare('INSERT INTO oauth_states (state_hash, expires_at) VALUES (?, ?)').bind(await hashToken(state), timestamp + 600).run();
  const target = new URL('https://discord.com/oauth2/authorize');
  target.search = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID || DISCORD_CLIENT_ID,
    redirect_uri: new URL('/auth/discord/callback', request.url).href,
    response_type: 'code', scope: 'identify', state,
  }).toString();
  return redirect(target.href, [cookie(STATE_COOKIE, state, 600)]);
}
async function discordCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || '';
  if (!/^[a-f0-9]{64}$/.test(state) || readCookie(request, STATE_COOKIE) !== state) throw new ApiError(400, 'invalid_oauth_state');
  const consumed = await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash = ? AND expires_at > ? RETURNING state_hash')
    .bind(await hashToken(state), now()).first();
  if (!consumed) throw new ApiError(400, 'invalid_oauth_state');
  const clearState = cookie(STATE_COOKIE, '', 0);
  if (url.searchParams.has('error')) return redirect('/submit?login=cancelled', [clearState]);
  const code = url.searchParams.get('code');
  if (!code || code.length > 2048 || !env.DISCORD_CLIENT_SECRET) return redirect('/submit?login=failed', [clearState]);
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID || DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code,
        redirect_uri: new URL('/auth/discord/callback', request.url).href }),
    });
    if (!response.ok) return redirect('/submit?login=failed', [clearState]);
    const auth = await response.json();
    if (typeof auth.access_token !== 'string' || auth.token_type?.toLowerCase() !== 'bearer' || !String(auth.scope).split(' ').includes('identify')) {
      return redirect('/submit?login=failed', [clearState]);
    }
    const profileResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { authorization: 'Bearer ' + auth.access_token }, signal: AbortSignal.timeout(15000),
    });
    if (!profileResponse.ok) return redirect('/submit?login=failed', [clearState]);
    const profile = await profileResponse.json();
    if (!/^\d{15,22}$/.test(profile.id) || typeof profile.username !== 'string') return redirect('/submit?login=failed', [clearState]);
    const displayName = (profile.global_name || profile.username).slice(0, 80);
    const token = randomToken(), csrf = randomToken();
    const statements = [
      env.DB.prepare(`INSERT INTO workshop_users (discord_id, display_name) VALUES (?, ?)
        ON CONFLICT(discord_id) DO UPDATE SET display_name = excluded.display_name`).bind(profile.id, displayName),
      env.DB.prepare('INSERT INTO workshop_sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)')
        .bind(await hashToken(token), profile.id, csrf, now() + SESSION_SECONDS),
    ];
    const oldToken = readCookie(request, SESSION_COOKIE);
    if (/^[a-f0-9]{64}$/.test(oldToken)) statements.push(env.DB.prepare('DELETE FROM workshop_sessions WHERE token_hash = ?').bind(await hashToken(oldToken)));
    await env.DB.batch(statements);
    // Discord access/refresh tokens are not saved or sent to the browser.
    return redirect('/submit', [clearState, cookie(SESSION_COOKIE, token, SESSION_SECONDS)]);
  } catch {
    return redirect('/submit?login=failed', [clearState]);
  }
}

function text(value, maximum, required = false) {
  if (typeof value !== 'string' || value.trim().length > maximum || (required && !value.trim())) {
    throw new ApiError(400, 'invalid_metadata');
  }
  return value.trim();
}

async function readJson(request, maximum = MAX_BODY) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'json_required');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'body_required');
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new ApiError(413, 'request_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, 'invalid_json'); }
}

function verifyImageBytes(bytes, type) {
  if (!IMAGE_TYPES.has(type)) throw new ApiError(415, 'invalid_image');
  if (!bytes.length || bytes.length > MAX_IMAGE) throw new ApiError(413, 'image_too_large');
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const valid = type === 'image/png' ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
    : type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : type === 'image/gif' ? ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    : type === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    : ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12));
  if (!valid) throw new ApiError(400, 'invalid_image');
}

function decodeImage(url) {
  if (typeof url !== 'string') throw new ApiError(400, 'local_images_required');
  const match = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
  if (!match) throw new ApiError(400, 'local_images_required');
  if (match[2].length > Math.ceil(MAX_IMAGE / 3) * 4) throw new ApiError(413, 'image_too_large');
  let binary;
  try { binary = atob(match[2]); } catch { throw new ApiError(400, 'invalid_image'); }
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  verifyImageBytes(bytes, match[1]);
  return { bytes, contentType: match[1] };
}

async function readImage(request) {
  const type = request.headers.get('content-type')?.split(';')[0]?.trim();
  if (!IMAGE_TYPES.has(type)) throw new ApiError(415, 'invalid_image');
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_IMAGE) throw new ApiError(413, 'image_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'body_required');
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_IMAGE) { await reader.cancel(); throw new ApiError(413, 'image_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  verifyImageBytes(bytes, type);
  return { bytes, contentType: type };
}

async function requireAdmin(request, env) {
  if (typeof env.ADMIN_TOKEN !== 'string' || env.ADMIN_TOKEN.length < 32) throw new ApiError(503, 'admin_not_configured');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new ApiError(403, 'origin_not_allowed');
  const supplied = request.headers.get('authorization') || '';
  const hash = async value => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const a = await hash(supplied), b = await hash(`Bearer ${env.ADMIN_TOKEN}`);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  if (difference) throw new ApiError(401, 'unauthorized');
}

function json(data, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
    },
  });
}

function isId(value) {
  return /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

function encodeCursor(value) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeCursor(value) {
  if (!value || !/^[A-Za-z0-9_-]{1,240}$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
    const result = JSON.parse(atob(padded));
    return result && typeof result === 'object' ? result : null;
  } catch { return null; }
}

async function listGroups(db, url) {
  const requested = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested) || 20, 1), 50) : 20;
  const cursor = url.searchParams.get('cursor') || '';
  const sort = url.searchParams.get('sort') || 'latest';
  if (!['latest', 'hot'].includes(sort)) return json({ error: 'invalid_sort' }, 400);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const decoded = cursor ? decodeCursor(cursor) : null;
  if (cursor && (!decoded || typeof decoded.id !== 'string')) return json({ error: 'invalid_cursor' }, 400);
  const where = ["g.status = 'published'"];
  const values = [];
  if (query) {
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    where.push(`(g.name LIKE ? ESCAPE '\\' OR g.description LIKE ? ESCAPE '\\' OR g.author_name LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM portrait_assets search_a WHERE search_a.group_id = g.id AND search_a.status = 'published'
        AND (search_a.character_name LIKE ? ESCAPE '\\' OR search_a.tag LIKE ? ESCAPE '\\')))`);
    values.push(pattern, pattern, pattern, pattern, pattern);
  }
  if (decoded) {
    if (sort === 'latest' && typeof decoded.published_at === 'string') {
      where.push('(g.published_at < ? OR (g.published_at = ? AND g.id < ?))');
      values.push(decoded.published_at, decoded.published_at, decoded.id);
    } else if (sort === 'hot' && Number.isInteger(decoded.hot_score)) {
      where.push('(COALESCE(s.download_count, 0) * 4 + COALESCE(s.use_count, 0) * 6 < ? OR (COALESCE(s.download_count, 0) * 4 + COALESCE(s.use_count, 0) * 6 = ? AND g.id < ?))');
      values.push(decoded.hot_score, decoded.hot_score, decoded.id);
    } else return json({ error: 'invalid_cursor' }, 400);
  }
  const order = sort === 'hot'
    ? 'hot_score DESC, g.id DESC'
    : 'g.published_at DESC, g.id DESC';
  const rows = await db.prepare(`
    SELECT g.id, g.name, g.description, g.author_name, g.cover_asset_id,
           g.published_at, COUNT(a.id) AS asset_count,
           COALESCE(s.download_count, 0) AS download_count,
           COALESCE(s.use_count, 0) AS use_count,
           COALESCE(s.download_count, 0) * 4 + COALESCE(s.use_count, 0) * 6 AS hot_score
    FROM portrait_groups g
    LEFT JOIN portrait_assets a ON a.group_id = g.id AND a.status = 'published'
    LEFT JOIN portrait_group_stats s ON s.group_id = g.id
    WHERE ${where.join(' AND ')}
    GROUP BY g.id
    ORDER BY ${order}
    LIMIT ?
  `).bind(...values, limit + 1).all();
  const groups = rows.results.slice(0, limit);
  const last = groups.at(-1);
  const nextCursor = rows.results.length > limit && last
    ? encodeCursor(sort === 'hot' ? { hot_score: Number(last.hot_score), id: last.id } : { published_at: last.published_at, id: last.id })
    : null;
  return json({
    sort, q: query, groups: groups.map(group => ({ ...group, cover_url: group.cover_asset_id ? `/assets/${group.cover_asset_id}` : null })),
    next_cursor: nextCursor,
  });
}

async function getGroup(db, id, admin = false) {
  if (!isId(id)) return json({ error: 'invalid_id' }, 400);
  const group = await db.prepare(`
    SELECT id, name, description, author_name, cover_asset_id, published_at
    FROM portrait_groups WHERE id = ? AND (? = 1 OR status = 'published')
  `).bind(id, admin ? 1 : 0).first();
  if (!group) return json({ error: 'not_found' }, 404);
  const assets = await db.prepare(`
    SELECT id, portrait_id, character_name, tag, caption, width, height, byte_size
    FROM portrait_assets
    WHERE group_id = ? AND (? = 1 OR status = 'published')
    ORDER BY sort_order, id
  `).bind(id, admin ? 1 : 0).all();
  return json({
    group: { ...group, cover_url: group.cover_asset_id ? `/assets/${group.cover_asset_id}` : null },
    assets: assets.results.map(asset => ({ ...asset, url: `${admin ? '/admin/api' : ''}/assets/${asset.id}` })),
  });
}

async function getAsset(db, bucket, id, admin = false) {
  if (!isId(id)) return json({ error: 'invalid_id' }, 400);
  const asset = await db.prepare(`
    SELECT a.r2_key, a.content_type
    FROM portrait_assets a
    JOIN portrait_groups g ON g.id = a.group_id
    WHERE a.id = ? AND (? = 1 OR (a.status = 'published' AND g.status = 'published'))
  `).bind(id, admin ? 1 : 0).first();
  if (!asset || !IMAGE_TYPES.has(asset.content_type)) return json({ error: 'not_found' }, 404);
  const object = await bucket.get(asset.r2_key);
  if (!object) return json({ error: 'not_found' }, 404);
  return new Response(object.body, {
    headers: {
      'content-type': asset.content_type,
      'content-length': String(object.size),
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
    },
  });
}

async function exportGroup(db, id, requestUrl) {
  const response = await getGroup(db, id);
  if (response.status !== 200) return response;
  const request = new URL(requestUrl);
  const intent = request.searchParams.get('intent');
  if (intent === 'download' || intent === 'use') {
    await db.prepare(`INSERT INTO portrait_group_stats (group_id, download_count, use_count)
      SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM portrait_groups WHERE id = ? AND status = 'published')
      ON CONFLICT(group_id) DO UPDATE SET download_count = download_count + excluded.download_count,
        use_count = use_count + excluded.use_count, updated_at = datetime('now')`)
      .bind(id, intent === 'download' ? 1 : 0, intent === 'use' ? 1 : 0, id).run();
  }
  const { group, assets } = await response.json();
  return json({
    format: 'jdnl-portrait-group', version: 1,
    group: { id: group.id, name: group.name, items: assets.map(asset => ({
      id: asset.portrait_id, name: asset.character_name, tag: asset.tag,
      caption: asset.caption, url: new URL(asset.url, requestUrl).href,
    })) },
  });
}

async function submitGroup(request, env, player = null, sourceId = null) {
  const payload = await readJson(request);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new ApiError(400, 'invalid_group_package');
  let requestKey;
  if (player) {
    if (player.blocked) throw new ApiError(403, 'player_blocked');
    if (env.PLAYER_UPLOADS_ENABLED === 'false') throw new ApiError(503, 'player_uploads_paused');
    if (payload.rights_confirmed !== true) throw new ApiError(400, 'rights_confirmation_required');
    requestKey = request.headers.get('x-request-id');
    if (!/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey || '')) throw new ApiError(400, 'invalid_request_id');
    const previous = await env.DB.prepare(`SELECT a.group_id, a.outcome, g.status FROM player_upload_attempts a
      LEFT JOIN portrait_groups g ON g.id = a.group_id WHERE a.user_id = ? AND a.request_key = ?`).bind(player.discord_id, requestKey).first();
    if (previous) {
      if (previous.outcome === 'failed') throw new ApiError(409, 'previous_upload_failed');
      if (!previous.status) throw new ApiError(409, 'upload_incomplete');
      return json({ group_id: previous.group_id, status: previous.status, repeated: true });
    }
  }
  let source;
  if (sourceId) {
    await requireOwner(env, player, sourceId);
    source = await env.DB.prepare('SELECT status FROM portrait_groups WHERE id = ?').bind(sourceId).first();
    const assets = await env.DB.prepare('SELECT COUNT(*) AS n FROM portrait_assets WHERE group_id = ?').bind(sourceId).first();
    if (source.status === 'draft' || !assets.n) throw new ApiError(409, 'revision_source_unavailable');
    const revision = await env.DB.prepare(`SELECT g.id FROM portrait_group_revisions r JOIN portrait_groups g ON g.id = r.group_id
      WHERE r.source_group_id = ? AND g.status IN ('pending', 'published')`).bind(sourceId).first();
    if (revision) throw new ApiError(409, 'revision_already_exists');
  }
  if (payload?.format !== 'jdnl-portrait-group' || payload.version !== 1) throw new ApiError(400, 'invalid_group_package');
  const incoming = payload.group;
  if (!incoming || !Array.isArray(incoming.items) || !incoming.items.length || incoming.items.length > MAX_ITEMS) {
    throw new ApiError(400, 'invalid_item_count');
  }
  const name = text(incoming.name, 100, true);
  const description = text(payload.description || '', 1000);
  const author = player ? player.display_name : text(payload.author_name || '', 80);
  const used = new Set();
  const groupId = crypto.randomUUID();
  let total = 0;
  const assets = incoming.items.map((item, index) => {
    if (!item || typeof item !== 'object') throw new ApiError(400, 'invalid_metadata');
    const portraitId = text(item.id, 80, true);
    if (!/^[\p{L}\p{N}_-]+$/u.test(portraitId) || used.has(portraitId)) throw new ApiError(400, 'invalid_portrait_id');
    used.add(portraitId);
    const image = decodeImage(item.url);
    total += image.bytes.length;
    const id = crypto.randomUUID();
    return { id, portraitId, name: text(item.name, 80, true), tag: text(item.tag, 120, true),
      caption: text(item.caption || '', 1000), key: `portraits/${groupId}/${id}`, index, ...image };
  });
  const reserve = env.DB.prepare('INSERT INTO storage_reservations (group_id, byte_size) VALUES (?, ?)').bind(groupId, total);
  if (player) {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO player_upload_attempts (group_id, user_id, request_key, byte_size) VALUES (?, ?, ?, ?)')
        .bind(groupId, player.discord_id, requestKey, total), reserve,
    ]);
  } else await reserve.run();
  let committing = false;
  try {
    for (const asset of assets) {
      await env.PORTRAITS_BUCKET.put(asset.key, asset.bytes, { httpMetadata: { contentType: asset.contentType } });
    }
    const submissionId = crypto.randomUUID();
    const statements = [env.DB.prepare(`
      INSERT INTO portrait_groups (id, name, description, author_name, status, cover_asset_id)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).bind(groupId, name, description, author, assets[0].id)];
    for (const asset of assets) statements.push(env.DB.prepare(`
      INSERT INTO portrait_assets
        (id, group_id, portrait_id, character_name, tag, caption, r2_key, content_type, byte_size, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(asset.id, groupId, asset.portraitId, asset.name, asset.tag, asset.caption, asset.key, asset.contentType, asset.bytes.length, asset.index));
    statements.push(env.DB.prepare(`
      INSERT INTO portrait_submissions (id, group_id, submitter_name) VALUES (?, ?, ?)
    `).bind(submissionId, groupId, author));
    if (player) statements.push(
      env.DB.prepare('INSERT INTO portrait_group_owners (group_id, user_id) VALUES (?, ?)').bind(groupId, player.discord_id),
      env.DB.prepare("UPDATE player_upload_attempts SET outcome = 'complete' WHERE group_id = ?").bind(groupId),
    );
    if (sourceId) statements.push(env.DB.prepare(
      'INSERT INTO portrait_group_revisions (group_id, source_group_id, source_status) VALUES (?, ?, ?)'
    ).bind(groupId, sourceId, source.status));
    // An ambiguous commit response must not trigger object deletion after a successful DB commit.
    committing = true;
    await env.DB.batch(statements);
    return json({ group_id: groupId, submission_id: submissionId, status: 'pending', byte_size: total }, 201);
  } catch (error) {
    const revisionError = ['revision_source_unavailable', 'revision_already_exists'].find(code => String(error?.message).includes(code));
    if (revisionError) committing = false;
    if (!committing) {
      try {
        for (const asset of assets) await env.PORTRAITS_BUCKET.delete(asset.key);
        await env.DB.prepare('DELETE FROM storage_reservations WHERE group_id = ?').bind(groupId).run();
        if (player) {
          await env.DB.prepare("UPDATE player_upload_attempts SET outcome = 'failed' WHERE group_id = ?").bind(groupId).run();
          throw revisionError ? new ApiError(409, revisionError) : new ApiError(503, 'upload_failed');
        }
      } catch (cleanupError) {
        if (cleanupError instanceof ApiError) throw cleanupError;
        console.error('Workshop upload cleanup incomplete', cleanupError);
      }
    }
    throw error;
  }
}

async function startDraft(request, env, player, sourceId = null) {
  if (player.blocked) throw new ApiError(403, 'player_blocked');
  if (env.PLAYER_UPLOADS_ENABLED === 'false') throw new ApiError(503, 'player_uploads_paused');
  const requestKey = request.headers.get('x-request-id');
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey || '')) throw new ApiError(400, 'invalid_request_id');
  const existing = await env.DB.prepare(`SELECT a.group_id, a.outcome, g.status FROM player_upload_attempts a
    LEFT JOIN portrait_groups g ON g.id = a.group_id WHERE a.user_id = ? AND a.request_key = ?`)
    .bind(player.discord_id, requestKey).first();
  if (existing) {
    if (!existing.status) throw new ApiError(409, 'upload_incomplete');
    const uploaded = await env.DB.prepare('SELECT portrait_id FROM portrait_assets WHERE group_id = ?').bind(existing.group_id).all();
    return privateJson({ group_id: existing.group_id, status: existing.status,
      uploaded_ids: uploaded.results.map(row => row.portrait_id), repeated: true });
  }
  const payload = await readJson(request, MAX_MANIFEST_BODY);
  if (payload?.rights_confirmed !== true) throw new ApiError(400, 'rights_confirmation_required');
  if (payload?.format !== 'jdnl-portrait-manifest' || payload.version !== 1) throw new ApiError(400, 'invalid_group_package');
  const incoming = payload.group;
  if (!incoming || !Array.isArray(incoming.items) || !incoming.items.length || incoming.items.length > MAX_DRAFT_ITEMS) {
    throw new ApiError(400, 'invalid_item_count');
  }
  const name = text(incoming.name, 100, true);
  const description = text(payload.description || '', 1000);
  const used = new Set();
  let total = 0;
  const manifest = incoming.items.map(item => {
    if (!item || typeof item !== 'object') throw new ApiError(400, 'invalid_metadata');
    const id = text(item.id, 80, true);
    if (!/^[\p{L}\p{N}_-]+$/u.test(id) || used.has(id)) throw new ApiError(400, 'invalid_portrait_id');
    used.add(id);
    if (!Number.isSafeInteger(item.byte_size) || item.byte_size < 1 || item.byte_size > MAX_IMAGE || !IMAGE_TYPES.has(item.content_type)) {
      throw new ApiError(400, 'invalid_image');
    }
    total += item.byte_size;
    return { id, name: text(item.name, 80, true), tag: text(item.tag, 120, true),
      caption: text(item.caption || '', 1000), byte_size: item.byte_size,
      content_type: item.content_type, asset_id: crypto.randomUUID() };
  });
  if (sourceId) {
    await requireOwner(env, player, sourceId);
    const source = await env.DB.prepare(`SELECT status FROM portrait_groups WHERE id = ? AND status = 'published'
      AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = ?)`).bind(sourceId, sourceId).first();
    if (!source) throw new ApiError(409, 'revision_source_unavailable');
    const sourceIds = await env.DB.prepare('SELECT portrait_id FROM portrait_assets WHERE group_id = ?').bind(sourceId).all();
    if (sourceIds.results.some(asset => used.has(asset.portrait_id))) throw new ApiError(409, 'portrait_id_conflict');
  }
  const groupId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`INSERT INTO portrait_groups (id, name, description, author_name, status, cover_asset_id)
      VALUES (?, ?, ?, ?, 'draft', ?)`).bind(groupId, name, description, player.display_name, manifest[0].asset_id),
    env.DB.prepare('INSERT INTO player_upload_attempts (group_id, user_id, request_key, byte_size) VALUES (?, ?, ?, ?)')
      .bind(groupId, player.discord_id, requestKey, total),
    env.DB.prepare('INSERT INTO storage_reservations (group_id, byte_size) VALUES (?, ?)').bind(groupId, total),
    env.DB.prepare('INSERT INTO portrait_group_owners (group_id, user_id) VALUES (?, ?)').bind(groupId, player.discord_id),
    env.DB.prepare('INSERT INTO portrait_upload_drafts (group_id, manifest_json) VALUES (?, ?)').bind(groupId, JSON.stringify(manifest)),
  ];
  if (sourceId) statements.push(env.DB.prepare(`INSERT INTO portrait_group_revisions
    (group_id, source_group_id, source_status) VALUES (?, ?, ?)`).bind(groupId, sourceId,
    (await env.DB.prepare('SELECT status FROM portrait_groups WHERE id = ?').bind(sourceId).first()).status));
  if (sourceId) statements.push(env.DB.prepare('INSERT INTO portrait_append_revisions (group_id) VALUES (?)').bind(groupId));
  await env.DB.batch(statements);
  return privateJson({ group_id: groupId, status: 'draft', uploaded_ids: [], byte_size: total }, 201);
}

async function draftManifest(env, player, id) {
  await requireOwner(env, player, id);
  const draft = await env.DB.prepare(`SELECT d.manifest_json FROM portrait_upload_drafts d
    JOIN portrait_groups g ON g.id = d.group_id WHERE d.group_id = ? AND g.status = 'draft'`).bind(id).first();
  if (!draft) throw new ApiError(409, 'draft_unavailable');
  return JSON.parse(draft.manifest_json);
}

async function uploadDraftImage(request, env, player, id, portraitId) {
  if (player.blocked || env.PLAYER_UPLOADS_ENABLED === 'false') throw new ApiError(403, 'player_uploads_paused');
  const manifest = await draftManifest(env, player, id);
  const index = manifest.findIndex(item => item.id === portraitId);
  if (index < 0) throw new ApiError(404, 'not_found');
  const item = manifest[index];
  const image = await readImage(request);
  if (image.bytes.length !== item.byte_size || image.contentType !== item.content_type) throw new ApiError(400, 'image_mismatch');
  const existing = await env.DB.prepare('SELECT id FROM portrait_assets WHERE group_id = ? AND portrait_id = ?')
    .bind(id, portraitId).first();
  if (existing) return privateJson({ uploaded: true, repeated: true });
  const key = `portraits/${id}/${crypto.randomUUID()}`;
  await env.PORTRAITS_BUCKET.put(key, image.bytes, { httpMetadata: { contentType: image.contentType } });
  try {
    const result = await env.DB.prepare(`INSERT INTO portrait_assets
      (id, group_id, portrait_id, character_name, tag, caption, r2_key, content_type, byte_size, sort_order, status)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft'
      WHERE EXISTS (SELECT 1 FROM portrait_groups WHERE id = ? AND status = 'draft')
        AND EXISTS (SELECT 1 FROM portrait_upload_drafts WHERE group_id = ?)`)
      .bind(item.asset_id, id, item.id, item.name, item.tag, item.caption, key, item.content_type, item.byte_size, index, id, id).run();
    if (!result.meta.changes) throw new ApiError(409, 'draft_unavailable');
  } catch (error) {
    await env.PORTRAITS_BUCKET.delete(key);
    const winner = await env.DB.prepare('SELECT id FROM portrait_assets WHERE group_id = ? AND portrait_id = ?')
      .bind(id, portraitId).first();
    if (winner) return privateJson({ uploaded: true, repeated: true });
    throw error;
  }
  return privateJson({ uploaded: true });
}

async function finishDraft(env, player, id) {
  const manifest = await draftManifest(env, player, id);
  const uploaded = await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(byte_size), 0) AS bytes FROM portrait_assets WHERE group_id = ?')
    .bind(id).first();
  if (uploaded.n !== manifest.length || uploaded.bytes !== manifest.reduce((sum, item) => sum + item.byte_size, 0)) {
    throw new ApiError(409, 'upload_incomplete');
  }
  const revision = await env.DB.prepare('SELECT source_group_id, source_status FROM portrait_group_revisions WHERE group_id = ?').bind(id).first();
  if (revision) {
    const source = await env.DB.prepare('SELECT status FROM portrait_groups WHERE id = ?').bind(revision.source_group_id).first();
    if (source?.status !== revision.source_status) throw new ApiError(409, 'revision_source_unavailable');
  }
  const submissionId = crypto.randomUUID();
  const results = await env.DB.batch([
    env.DB.prepare("UPDATE portrait_groups SET status = 'pending' WHERE id = ? AND status = 'draft'").bind(id),
    env.DB.prepare("UPDATE portrait_assets SET status = 'pending' WHERE group_id = ?").bind(id),
    env.DB.prepare(`INSERT INTO portrait_submissions (id, group_id, submitter_name)
      SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM portrait_upload_drafts WHERE group_id = ?)`)
      .bind(submissionId, id, player.display_name, id),
    env.DB.prepare("UPDATE player_upload_attempts SET outcome = 'complete' WHERE group_id = ?").bind(id),
    env.DB.prepare('DELETE FROM portrait_upload_drafts WHERE group_id = ?').bind(id),
  ]);
  if (!results[2].meta.changes) throw new ApiError(409, 'draft_unavailable');
  return privateJson({ group_id: id, submission_id: submissionId, status: 'pending' }, 201);
}

async function moderateGroup(request, env, id, forcedAction) {
  if (!isId(id)) throw new ApiError(400, 'invalid_id');
  const payload = forcedAction ? { action: forcedAction } : await readJson(request);
  const states = { publish: ['published', 'approved'], reject: ['rejected', 'rejected'], withdraw: ['withdrawn', 'withdrawn'] };
  const state = states[payload?.action];
  if (!state) throw new ApiError(400, 'invalid_action');
  const note = text(payload.note || '', 1000);
  const submission = await env.DB.prepare('SELECT id FROM portrait_submissions WHERE group_id = ?').bind(id).first();
  if (!submission) throw new ApiError(404, 'not_found');
  const assetCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM portrait_assets WHERE group_id = ?').bind(id).first();
  if (!assetCount.count) throw new ApiError(409, 'group_has_no_assets');
  const results = await env.DB.batch([
    env.DB.prepare("UPDATE portrait_groups SET status = ?, published_at = CASE WHEN ? = 'published' THEN datetime('now') ELSE NULL END WHERE id = ? AND status <> 'draft' AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = portrait_groups.id)")
      .bind(state[0], state[0], id),
    env.DB.prepare("UPDATE portrait_assets SET status = ? WHERE group_id = ? AND EXISTS (SELECT 1 FROM portrait_groups WHERE id = ? AND status <> 'draft')").bind(state[0], id, id),
    env.DB.prepare("UPDATE portrait_submissions SET status = ?, note = ?, reviewed_at = datetime('now') WHERE id = ? AND EXISTS (SELECT 1 FROM portrait_groups WHERE id = ? AND status <> 'draft') AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = ?)")
      .bind(state[1], note, submission.id, id, id),
    env.DB.prepare("INSERT INTO moderation_events (id, submission_id, action, note) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM portrait_groups WHERE id = ? AND status <> 'draft') AND EXISTS (SELECT 1 FROM portrait_assets WHERE group_id = ?)")
      .bind(crypto.randomUUID(), submission.id, payload.action, note, id, id),
  ]);
  if (!results[0].meta.changes) throw new ApiError(409, 'group_being_cleaned');
  return json({ group_id: id, status: state[0] });
}

async function deleteGroup(env, id) {
  if (!isId(id)) throw new ApiError(400, 'invalid_id');
  const reservation = await env.DB.prepare("SELECT group_id, created_at < datetime('now', '-1 hour') AS stale FROM storage_reservations WHERE group_id = ?").bind(id).first();
  const group = await env.DB.prepare('SELECT id FROM portrait_groups WHERE id = ?').bind(id).first();
  if (!reservation && !group) throw new ApiError(404, 'not_found');
  if (!group && !reservation.stale) throw new ApiError(409, 'upload_may_be_in_progress');
  // Invalidate the upload manifest before listing R2, so a concurrent PUT cannot
  // create an object after the listing and escape cleanup.
  await env.DB.batch([
    env.DB.prepare("UPDATE portrait_groups SET status = 'draft', published_at = NULL WHERE id = ?").bind(id),
    env.DB.prepare('DELETE FROM portrait_upload_drafts WHERE group_id = ?').bind(id),
  ]);
  const prefix = `portraits/${id}/`;
  let cursor;
  do {
    const listed = await env.PORTRAITS_BUCKET.list({ prefix, cursor });
    for (const object of listed.objects) {
      const owner = await env.DB.prepare('SELECT group_id FROM portrait_assets WHERE r2_key = ?').bind(object.key).first();
      if (!owner || owner.group_id === id) await env.PORTRAITS_BUCKET.delete(object.key);
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  // Also handle assets imported before the standard key convention was introduced.
  const assets = await env.DB.prepare('SELECT r2_key FROM portrait_assets WHERE group_id = ?').bind(id).all();
  for (const asset of assets.results) await env.PORTRAITS_BUCKET.delete(asset.r2_key);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM portrait_assets WHERE group_id = ?').bind(id),
    env.DB.prepare('DELETE FROM portrait_upload_drafts WHERE group_id = ?').bind(id),
    env.DB.prepare('DELETE FROM storage_reservations WHERE group_id = ?').bind(id),
    env.DB.prepare("UPDATE player_upload_attempts SET outcome = 'failed' WHERE group_id = ? AND outcome = 'writing'").bind(id),
    env.DB.prepare("UPDATE portrait_groups SET status = 'withdrawn', cover_asset_id = NULL WHERE id = ?").bind(id),
    env.DB.prepare("UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now') WHERE group_id = ?").bind(id),
  ]);
  return json({ group_id: id, status: 'deleted' });
}

async function adminSummary(db, url) {
  const quota = await db.prepare(`SELECT limit_bytes,
    COALESCE((SELECT SUM(byte_size) FROM storage_reservations), 0) AS reserved_bytes,
    (SELECT COUNT(*) FROM portrait_groups) AS total_count,
    (SELECT COUNT(*) FROM portrait_groups WHERE status = 'pending') AS pending_count,
    (SELECT COUNT(*) FROM portrait_groups WHERE status = 'published') AS published_count,
    (SELECT COUNT(*) FROM portrait_groups WHERE status = 'rejected') AS rejected_count,
    (SELECT COUNT(*) FROM portrait_groups WHERE status = 'withdrawn') AS withdrawn_count,
    (SELECT COUNT(*) FROM portrait_groups WHERE status = 'draft') AS draft_count,
    (SELECT COUNT(*) FROM storage_reservations r LEFT JOIN portrait_groups g ON g.id = r.group_id
      WHERE g.id IS NULL AND r.created_at < datetime('now', '-1 hour')) AS incomplete_uploads_count
    FROM workshop_quota WHERE id = 1`).first();
  const status = url.searchParams.get('status') || 'pending';
  if (!['all', 'pending', 'published', 'rejected', 'withdrawn', 'draft'].includes(status)) return json({ error: 'invalid_status' }, 400);
  const requested = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested) || 30, 1), 50) : 30;
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const cursorValue = url.searchParams.get('cursor') || '';
  const cursor = cursorValue ? decodeCursor(cursorValue) : null;
  if (cursorValue && (!cursor || !isId(cursor.id) || typeof cursor.created_at !== 'string')) return json({ error: 'invalid_cursor' }, 400);
  const where = [];
  const values = [];
  if (status !== 'all') { where.push('g.status = ?'); values.push(status); }
  if (query) {
    const like = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    where.push(`(g.name LIKE ? ESCAPE '\\' OR g.description LIKE ? ESCAPE '\\' OR g.author_name LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM portrait_assets a WHERE a.group_id = g.id AND (a.character_name LIKE ? ESCAPE '\\' OR a.tag LIKE ? ESCAPE '\\'))) `);
    values.push(like, like, like, like, like);
  }
  if (cursor) {
    where.push('(g.created_at < ? OR (g.created_at = ? AND g.id < ?))');
    values.push(cursor.created_at, cursor.created_at, cursor.id);
  }
  const groups = await db.prepare(`SELECT g.id, g.name, g.description, g.status, g.author_name, g.created_at, g.published_at,
    o.user_id, u.blocked, (SELECT COUNT(*) FROM portrait_assets a WHERE a.group_id = g.id) AS asset_count
    FROM portrait_groups g LEFT JOIN portrait_group_owners o ON o.group_id = g.id
    LEFT JOIN workshop_users u ON u.discord_id = o.user_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY g.created_at DESC, g.id DESC LIMIT ?`).bind(...values, limit + 1).all();
  const page = groups.results.slice(0, limit);
  const last = page.at(-1);
  const nextCursor = groups.results.length > limit && last
    ? encodeCursor({ created_at: last.created_at, id: last.id }) : null;
  const orphans = await db.prepare(`SELECT r.group_id, r.byte_size FROM storage_reservations r
    LEFT JOIN portrait_groups g ON g.id = r.group_id WHERE g.id IS NULL
    AND r.created_at < datetime('now', '-1 hour') LIMIT 100`).all();
  return json({ quota, status_counts: {
    all: Number(quota.total_count), pending: Number(quota.pending_count), published: Number(quota.published_count),
    rejected: Number(quota.rejected_count), withdrawn: Number(quota.withdrawn_count), draft: Number(quota.draft_count),
  }, groups: page, next_cursor: nextCursor, q: query, status,
  incomplete_uploads: orphans.results, incomplete_uploads_count: Number(quota.incomplete_uploads_count),
  limits: { image_bytes: MAX_IMAGE, request_bytes: MAX_BODY, item_count: MAX_ITEMS } });
}

async function requireOwner(env, player, id) {
  if (!isId(id)) throw new ApiError(400, 'invalid_id');
  const owner = await env.DB.prepare('SELECT group_id FROM portrait_group_owners WHERE group_id = ? AND user_id = ?').bind(id, player.discord_id).first();
  if (!owner) throw new ApiError(404, 'not_found');
}
async function playerApi(request, env, parts) {
  if (parts.length === 3 && parts[2] === 'me' && request.method === 'GET') {
    const session = await getSession(request, env);
    return privateJson({ user: session ? { id: session.discord_id, name: session.display_name, blocked: !!session.blocked } : null,
      csrf_token: session?.csrf_token || null, uploads_enabled: env.PLAYER_UPLOADS_ENABLED !== 'false' });
  }
  const player = await requirePlayer(request, env, request.method !== 'GET');
  if (parts[2] === 'characters') return characterApi(request, env, parts.slice(3), player);
  if (parts.length === 3 && parts[2] === 'logout' && request.method === 'POST') {
    await env.DB.prepare('DELETE FROM workshop_sessions WHERE token_hash = ?').bind(player.token_hash).run();
    const response = privateJson({ status: 'logged_out' });
    response.headers.set('set-cookie', cookie(SESSION_COOKIE, '', 0));
    return response;
  }
  if (parts.length === 3 && parts[2] === 'submissions') {
    if (request.method === 'POST') return request.headers.get('x-upload-format') === 'manifest'
      ? startDraft(request, env, player) : submitGroup(request, env, player);
    if (request.method === 'GET') {
      const url = new URL(request.url), cursor = url.searchParams.get('cursor') || '';
      if (cursor && !isId(cursor)) throw new ApiError(400, 'invalid_cursor');
      const rows = await env.DB.prepare(`SELECT g.id, g.name, g.description, g.status, g.created_at, s.note,
        (SELECT source_group_id FROM portrait_group_revisions WHERE group_id = g.id) AS source_group_id,
        (SELECT r.group_id FROM portrait_group_revisions r JOIN portrait_groups next ON next.id = r.group_id
          WHERE r.source_group_id = g.id AND next.status IN ('pending', 'published') LIMIT 1) AS replacement_id,
        (SELECT COUNT(*) FROM portrait_assets WHERE group_id = g.id) AS asset_count
        FROM portrait_group_owners o JOIN portrait_groups g ON g.id = o.group_id
        LEFT JOIN portrait_submissions s ON s.group_id = g.id
        WHERE o.user_id = ? AND g.id > ? ORDER BY g.id LIMIT 21`).bind(player.discord_id, cursor).all();
      return privateJson({ groups: rows.results.slice(0, 20), next_cursor: rows.results.length > 20 ? rows.results[19].id : null });
    }
  }
  if (parts.length === 6 && parts[2] === 'drafts' && parts[4] === 'assets' && request.method === 'PUT') {
    let portraitId;
    try { portraitId = decodeURIComponent(parts[5]); } catch { throw new ApiError(400, 'invalid_portrait_id'); }
    return uploadDraftImage(request, env, player, parts[3], portraitId);
  }
  if (parts.length === 5 && parts[2] === 'drafts' && parts[4] === 'finish' && request.method === 'POST') {
    return finishDraft(env, player, parts[3]);
  }
  if (parts.length === 4 && parts[2] === 'groups' && request.method === 'GET') {
    await requireOwner(env, player, parts[3]);
    const response = await getGroup(env.DB, parts[3], true);
    if (!response.ok) return response;
    const data = await response.json();
    for (const asset of data.assets) asset.url = '/account/api/assets/' + asset.id;
    return privateJson(data);
  }
  if (parts.length === 4 && parts[2] === 'assets' && request.method === 'GET') {
    const asset = await env.DB.prepare('SELECT group_id FROM portrait_assets WHERE id = ?').bind(parts[3]).first();
    if (!asset) throw new ApiError(404, 'not_found');
    await requireOwner(env, player, asset.group_id);
    return getAsset(env.DB, env.PORTRAITS_BUCKET, parts[3], true);
  }
  if (parts.length === 5 && parts[2] === 'groups' && parts[4] === 'withdraw' && request.method === 'POST') {
    await requireOwner(env, player, parts[3]);
    return moderateGroup(request, env, parts[3], 'withdraw');
  }
  if (parts.length === 5 && parts[2] === 'groups' && parts[4] === 'update' && request.method === 'POST') {
    await requireOwner(env, player, parts[3]);
    return request.headers.get('x-upload-format') === 'manifest'
      ? startDraft(request, env, player, parts[3]) : submitGroup(request, env, player, parts[3]);
  }
  if (parts.length === 4 && parts[2] === 'groups' && request.method === 'DELETE') {
    await requireOwner(env, player, parts[3]);
    return deleteGroup(env, parts[3]);
  }
  throw new ApiError(404, 'not_found');
}

// Character packages contain plain lore text only. Images stay in the existing portrait workshop.
const LORE_CATEGORIES = { character: '角色', plane: '位面', other: '其他' };
const CATEGORY_ORDER = { plane: 10000, character: 11000, other: 12000 };
function defaultLoreSettings() {
    return { category: 'auto', activation: 'selective', order: 'auto', position: 'before_character_definition', role: 'system', depth: 0,
        scan_depth: 'same_as_global', probability: 100, secondary_logic: 'and_any', secondary_keys: [],
        prevent_incoming: true, prevent_outgoing: true, delay_until: null, sticky: null, cooldown: null, delay: null };
}
function parseLoreCategory(value) {
    if (value === undefined)
        return 'character';
    if (typeof value === 'string' && Object.hasOwn(LORE_CATEGORIES, value))
        return value;
    throw new Error('设定分类需要为角色、位面或其他');
}
function parseLoreSettings(value) {
    const result = defaultLoreSettings();
    if (value === undefined)
        return result;
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('世界书配置无效');
    const raw = value;
    const choices = { category: ['auto', ...Object.keys(LORE_CATEGORIES)], activation: ['selective', 'constant'],
        position: ['before_character_definition', 'after_character_definition', 'before_example_messages', 'after_example_messages', 'before_author_note', 'after_author_note', 'at_depth'],
        role: ['system', 'user', 'assistant'], secondary_logic: ['and_any', 'and_all', 'not_any', 'not_all'] };
    for (const [key, allowed] of Object.entries(choices))
        if (raw[key] !== undefined) {
            if (typeof raw[key] !== 'string' || !allowed.includes(raw[key]))
                throw new Error('世界书配置选项无效：' + key);
            Object.assign(result, { [key]: raw[key] });
        }
    for (const [key, min, max] of [['order', 0, 999999], ['depth', 0, 1000], ['scan_depth', 0, 1000], ['probability', 0, 100], ['delay_until', 1, 1000], ['sticky', 1, 1000], ['cooldown', 1, 1000], ['delay', 1, 1000]]) {
        const input = raw[key];
        if (input === undefined)
            continue;
        if ((key === 'order' && input === 'auto') || (key === 'scan_depth' && input === 'same_as_global'))
            continue;
        if (['delay_until', 'sticky', 'cooldown', 'delay'].includes(key) && input === null)
            continue;
        if (typeof input !== 'number' || !Number.isInteger(input) || input < min || input > max)
            throw new Error('世界书数值无效：' + key);
        Object.assign(result, { [key]: input });
    }
    for (const key of ['prevent_incoming', 'prevent_outgoing'])
        if (raw[key] !== undefined) {
            if (typeof raw[key] !== 'boolean')
                throw new Error('递归开关无效');
            result[key] = raw[key];
        }
    if (raw.secondary_keys !== undefined) {
        if (!Array.isArray(raw.secondary_keys) || raw.secondary_keys.length > 20 || !raw.secondary_keys.every(key => typeof key === 'string' && key.trim() && key.length <= 80 && !/<%|\{\{|<\s*script/i.test(key)))
            throw new Error('次要关键词无效');
        result.secondary_keys = [...new Set(raw.secondary_keys.map(key => key.trim()))];
    }
    return result;
}
function normalizeCharacterPackage(value) {
  const invalid = () => { throw new ApiError(400, 'invalid_character_package'); };
  if (!value || value.format !== 'jdnl-character-package' || value.version !== 1) invalid();
  const character = value.character;
  if (!character || typeof character !== 'object' || Array.isArray(character)) invalid();
  const field = (value, max, required = true) => {
    if (!required && value === undefined) return '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) invalid();
    if (/<%|%>|<\s*\/?\s*(?:script|iframe|object|embed)\b|\{\{(?!\s*(?:user|char)\s*\}\})|@@(?:preprocessing|generate)/i.test(value)) {
      throw new ApiError(400, 'executable_lore_not_allowed');
    }
    return value.trim();
  };
  const name = field(character.name, 80), description = field(character.description, 1000, false);
  let category;
  try { category = parseLoreCategory(character.category); } catch { throw new ApiError(400, 'invalid_lore_settings'); }
  if (!Array.isArray(character.entries) || !character.entries.length || character.entries.length > 32) invalid();
  const ids = new Set();
  const entries = character.entries.map(entry => {
    if (!entry || typeof entry !== 'object') invalid();
    const id = field(entry.id, 80);
    if (!/^[\p{L}\p{N}_-]+$/u.test(id) || ids.has(id)) invalid();
    ids.add(id);
    if (entry.keywords !== undefined && (!Array.isArray(entry.keywords) || entry.keywords.length > 20)) invalid();
    const keys = (entry.keywords || []).map(key => field(key, 80));
    let settings;
    try { settings = parseLoreSettings(entry.settings); } catch { throw new ApiError(400, 'invalid_lore_settings'); }
    return { id, name: field(entry.name, 100), keywords: [...new Set(keys.length ? keys : [name])], content: field(entry.content, 30000), settings };
  });
  const portrait_group_id = character.portrait_group_id || null;
  if (portrait_group_id !== null && (typeof portrait_group_id !== 'string' || !isId(portrait_group_id))) invalid();
  const result = { format: 'jdnl-character-package', version: 1, character: { name, description, category, entries, portrait_group_id } };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > 262144) throw new ApiError(413, 'character_package_too_large');
  return result;
}

async function listCharacters(db, url, player = null, admin = false) {
  const sort = url.searchParams.get('sort') || 'latest';
  if (!['latest', 'hot'].includes(sort)) throw new ApiError(400, 'invalid_sort');
  const status = player || admin ? url.searchParams.get('status') || (admin ? 'pending' : 'all') : 'published';
  if (!['pending', 'published', 'rejected', 'withdrawn', 'all'].includes(status)) throw new ApiError(400, 'invalid_status');
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const queryKey = (await hashToken(query)).slice(0, 16);
  const categoryFilter = url.searchParams.get('category') || 'all';
  if (!['all', 'character', 'plane', 'other'].includes(categoryFilter)) throw new ApiError(400, 'invalid_lore_settings');
  const limit = Math.max(1, Math.min(30, Math.floor(Number(url.searchParams.get('limit'))) || 20));
  const cursor = url.searchParams.get('cursor');
  const decoded = cursor ? decodeCursor(cursor) : null;
  if (cursor && (!decoded || !isId(decoded.id) || decoded.sort !== sort || decoded.status !== status || decoded.q !== queryKey || decoded.c !== categoryFilter)) throw new ApiError(400, 'invalid_cursor');
  const where = [], values = [];
  if (player) { where.push('p.user_id = ?'); values.push(player.discord_id); }
  if (status !== 'all') { where.push('p.status = ?'); values.push(status); }
  if (categoryFilter !== 'all') { where.push('p.category = ?'); values.push(categoryFilter); }
  if (query) {
    where.push(`(p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\' OR p.author_name LIKE ? ESCAPE '\\')`);
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`; values.push(pattern, pattern, pattern);
  }
  const column = sort === 'hot' ? 'p.download_count' : "COALESCE(p.published_at, p.created_at)";
  if (decoded) {
    if (sort === 'hot' ? !Number.isInteger(decoded.order) || decoded.order < 0 : typeof decoded.order !== 'string') throw new ApiError(400, 'invalid_cursor');
    where.push(`(${column} < ? OR (${column} = ? AND p.id < ?))`); values.push(decoded.order, decoded.order, decoded.id);
  }
  const rows = await db.prepare(`SELECT p.id, p.name, p.description, p.author_name, p.status, p.entry_count, p.portrait_group_id,
    p.created_at, p.published_at, p.download_count, p.source_id, p.family_id, p.category, ${column} AS page_order
    ${player || admin ? ', p.note, p.user_id' : ''} FROM character_packages p
    WHERE ${where.length ? where.join(' AND ') : '1=1'} ORDER BY ${column} DESC, p.id DESC LIMIT ?`).bind(...values, limit + 1).all();
  const items = rows.results.slice(0, limit), last = items.at(-1);
  const result = { packages: items.map(({ page_order, ...item }) => item), sort, q: query,
    next_cursor: rows.results.length > limit && last ? encodeCursor({ id: last.id, order: last.page_order, sort, status, q: queryKey, c: categoryFilter }) : null };
  if (player || admin) {
    const counts = await db.prepare(`SELECT status, COUNT(*) AS n FROM character_packages ${player ? 'WHERE user_id = ?' : ''} GROUP BY status`)
      .bind(...(player ? [player.discord_id] : [])).all();
    result.status_counts = Object.fromEntries(counts.results.map(row => [row.status, row.n]));
  }
  return player || admin ? privateJson(result) : json(result);
}

async function characterDetail(env, id, player = null, admin = false) {
  if (!isId(id)) throw new ApiError(400, 'invalid_id');
  const row = await env.DB.prepare(`SELECT * FROM character_packages WHERE id = ? ${admin ? '' : player ? 'AND user_id = ?' : "AND status = 'published'"}`)
    .bind(id, ...(player && !admin ? [player.discord_id] : [])).first();
  if (!row) throw new ApiError(404, 'not_found');
  const portrait = row.portrait_group_id ? await env.DB.prepare("SELECT id, name FROM portrait_groups WHERE id = ? AND status = 'published'").bind(row.portrait_group_id).first() : null;
  const { payload, user_id, request_key, byte_size, note, ...metadata } = row;
  const result = { package: { ...metadata, ...(player || admin ? { user_id, note } : {}) }, content: JSON.parse(payload), portrait };
  return player || admin ? privateJson(result) : json(result);
}

async function submitCharacter(request, env, player) {
  if (player.blocked) throw new ApiError(403, 'player_blocked');
  if (env.PLAYER_UPLOADS_ENABLED === 'false') throw new ApiError(503, 'player_uploads_paused');
  const requestKey = request.headers.get('x-request-id') || '';
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(requestKey)) throw new ApiError(400, 'request_id_required');
  const raw = await readJson(request, 270336);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ApiError(400, 'invalid_character_package');
  if (raw.rights_confirmed !== true) throw new ApiError(400, 'rights_required');
  const normalized = normalizeCharacterPackage(raw), payload = JSON.stringify(normalized), contentHash = await hashToken(payload);
  const sourceId = raw.source_id || null;
  if (sourceId !== null && (typeof sourceId !== 'string' || !isId(sourceId))) throw new ApiError(400, 'invalid_id');
  const existing = await env.DB.prepare('SELECT id, content_hash, source_id FROM character_packages WHERE user_id = ? AND request_key = ?').bind(player.discord_id, requestKey).first();
  if (existing) {
    if (existing.content_hash !== contentHash || existing.source_id !== sourceId) throw new ApiError(409, 'request_id_conflict');
    return privateJson({ id: existing.id, reused: true });
  }
  const c = normalized.character;
  if (c.portrait_group_id && !await env.DB.prepare("SELECT id FROM portrait_groups WHERE id = ? AND status = 'published'").bind(c.portrait_group_id).first()) throw new ApiError(409, 'portrait_not_published');
  const source = sourceId ? await env.DB.prepare('SELECT family_id, status FROM character_packages WHERE id = ? AND user_id = ?').bind(sourceId, player.discord_id).first() : null;
  if (sourceId && !source) throw new ApiError(404, 'not_found');
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO character_packages (id, user_id, request_key, name, description, author_name, payload, content_hash, byte_size, entry_count, portrait_group_id, source_id, source_status, family_id, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, player.discord_id, requestKey, c.name, c.description, player.display_name,
      payload, contentHash, new TextEncoder().encode(payload).byteLength, c.entries.length, c.portrait_group_id, sourceId, source?.status || null, source?.family_id || id, c.category).run();
  } catch (error) {
    // A concurrent retry with the same key must return the original submission.
    if (String(error.message).includes('character_packages.user_id, character_packages.request_key')) {
      const retry = await env.DB.prepare('SELECT id, content_hash, source_id FROM character_packages WHERE user_id = ? AND request_key = ?').bind(player.discord_id, requestKey).first();
      if (retry?.content_hash === contentHash && retry.source_id === sourceId) return privateJson({ id: retry.id, reused: true });
      throw new ApiError(409, 'request_id_conflict');
    }
    throw error;
  }
  return privateJson({ id, status: 'pending' }, 201);
}

async function moderateCharacter(request, env, id, player = null) {
  if (!isId(id)) throw new ApiError(400, 'invalid_id');
  const raw = await readJson(request, 4096), action = raw.action;
  if (!(player ? ['withdraw'] : ['publish', 'reject', 'withdraw']).includes(action)) throw new ApiError(400, 'invalid_action');
  const row = await env.DB.prepare(`SELECT * FROM character_packages WHERE id = ? ${player ? 'AND user_id = ?' : ''}`).bind(id, ...(player ? [player.discord_id] : [])).first();
  if (!row) throw new ApiError(404, 'not_found');
  if (action === 'publish' && row.portrait_group_id && !await env.DB.prepare("SELECT id FROM portrait_groups WHERE id = ? AND status = 'published'").bind(row.portrait_group_id).first()) throw new ApiError(409, 'portrait_not_published');
  if (action === 'reject' && row.status !== 'pending') throw new ApiError(409, 'invalid_status_transition');
  const status = { publish: 'published', reject: 'rejected', withdraw: 'withdrawn' }[action];
  const note = text(raw.note || '', 1000);
  await env.DB.batch([
    env.DB.prepare(`UPDATE character_packages SET status = ?, note = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, datetime('now')) ELSE NULL END WHERE id = ? AND status = ?`).bind(status, note, status, id, row.status),
    env.DB.prepare('INSERT INTO character_moderation_events (id, package_id, action, note) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), id, action, note),
  ]);
  return privateJson({ status });
}

async function characterApi(request, env, parts, player = null, admin = false) {
  const url = new URL(request.url);
  if (!parts.length && request.method === 'GET') return listCharacters(env.DB, url, player, admin);
  if (!parts.length && request.method === 'POST' && player) return submitCharacter(request, env, player);
  if (parts.length === 1 && request.method === 'GET') return characterDetail(env, parts[0], player, admin);
  if (parts.length === 2 && parts[1] === 'export' && request.method === 'GET' && !player && !admin) {
    const detail = await (await characterDetail(env, parts[0])).json();
    if (url.searchParams.get('intent') === 'download') await env.DB.prepare("UPDATE character_packages SET download_count = download_count + 1 WHERE id = ? AND status = 'published'").bind(parts[0]).run();
    return json(detail.content);
  }
  if (parts.length === 2 && parts[1] === 'moderate' && request.method === 'POST' && (admin || player)) return moderateCharacter(request, env, parts[0], player);
  throw new ApiError(404, 'not_found');
}

function characterPortalClient(admin, defaultSettings) {
  const $ = id => document.getElementById(id);
  const categories = { character: '角色', plane: '位面', other: '其他' };
  const labels = { pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', all: '全部' };
  const errors = { login_required: '请先使用 Discord 登录', csrf_failed: '登录状态已改变，请刷新页面', unauthorized: '管理员口令无效',
    invalid_character_package: '角色包字段无效，请检查角色名、条目、关键词和内容', executable_lore_not_allowed: '只接收设定文本，不接收脚本、EJS 或可执行宏',
    player_blocked: '此账号已暂停投稿', player_uploads_paused: '当前已暂停玩家投稿', player_rate_limit: '每分钟最多投稿一次',
    player_daily_limit: '每 24 小时最多投稿 5 次', player_pending_limit: '最多保留 3 个待审角色包', player_global_daily_limit: '今日收稿额度已满',
    capacity_exceeded: '角色工坊文字容量已满', rights_required: '请确认分享权限', request_id_conflict: '请求内容已改变，请重新提交',
    portrait_not_published: '配套立绘组尚未发布或已撤回，请先提交立绘审核或去掉组 ID', revision_already_exists: '此稿已有待审或已发布更新',
    revision_source_unavailable: '原稿状态已改变，请刷新后重新编辑', revision_superseded: '此稿已被新版替代',
    character_package_too_large: '角色包超过 256 KiB', invalid_lore_settings: '世界书配置无效，请检查分类、数值范围和递归开关', service_unavailable: '云端暂不可用；升级后请先到原管理页补全数据库结构' };
  let token = '', csrf = '', currentUser = null, sourceId = null, cursor = '', filter = admin ? 'pending' : 'all';
  let requestKey = '', submittedBody = '', loading = false;
  const status = message => { $('status').textContent = message; };
  const node = (tag, text, className) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; if (className) element.className = className; return element; };
  async function api(path, method = 'GET', body, key) {
    const response = await fetch((admin ? '/admin/api' : '/account/api') + path, {
      method, headers: { ...(admin ? { Authorization: 'Bearer ' + token } : { 'X-CSRF-Token': csrf }),
        ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'X-Request-ID': key } : {}) }, body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json(); if (!response.ok) throw new Error(errors[data.error] || data.error); return data;
  }
  function button(label, action) {
    const control = node('button', label); control.type = 'button';
    control.onclick = async () => { control.disabled = true; try { await action(); } catch (error) { status(error.message); } finally { control.disabled = false; } }; return control;
  }
  function addEntry(value = {}) {
    const section = node('fieldset'); section.dataset.entryId = value.id || crypto.randomUUID(); section.append(node('legend', '世界书条目'));
    for (const [key, title, initial, multiline] of [['name', '条目名', value.name || '角色档案'], ['keywords', '关键词（逗号分隔）', (value.keywords || []).join('，')], ['content', '设定内容', value.content || '', true]]) {
      const label = node('label', title), input = node(multiline ? 'textarea' : 'input'); input.dataset.field = key; input.value = initial; input.required = true;
      input.maxLength = key === 'content' ? 30000 : key === 'name' ? 100 : 1640; if (multiline) input.rows = 8;
      if (key === 'keywords') { input.required = false; input.placeholder = '留空自动使用资料名称'; }
      label.append(input); section.append(label);
    }
    const settings = { ...defaultSettings, ...value.settings };
    const details = node('details'), summary = node('summary', '世界书配置 · 自动分类与顺序 / 高级设置'); details.append(summary);
    const choices = {
      category: [['auto', '跟随资料分类'], ['character', '角色'], ['plane', '位面'], ['other', '其他']],
      activation: [['selective', '关键词触发（绿灯）'], ['constant', '常驻（蓝灯）']],
      position: [['before_character_definition', '角色定义之前'], ['after_character_definition', '角色定义之后'], ['before_example_messages', '示例消息之前'], ['after_example_messages', '示例消息之后'], ['before_author_note', '作者注释之前'], ['after_author_note', '作者注释之后'], ['at_depth', '指定聊天深度']],
      role: [['system', '系统'], ['user', '用户'], ['assistant', '助手']],
      secondary_logic: [['and_any', '任意一个存在'], ['and_all', '全部存在'], ['not_any', '全部不存在'], ['not_all', '并非全部存在']],
    };
    const names = { category: '条目分类', activation: '激活方式', position: '插入位置', role: '消息身份', secondary_logic: '次要关键词逻辑', order: '插入顺序（留空自动）',
      scan_depth: '扫描深度（留空跟随全局）', probability: '激活概率（%）', depth: '插入深度', secondary_keys: '次要关键词（逗号分隔）',
      prevent_incoming: '禁止被其他条目递归激活', prevent_outgoing: '禁止继续递归激活其他条目', delay_until: '延迟递归层数（留空关闭）', sticky: '黏性楼层数（留空关闭）', cooldown: '冷却楼层数（留空关闭）', delay: '延迟激活楼层数（留空关闭）' };
    for (const key of Object.keys(defaultSettings)) {
      const label = node('label', names[key]), input = node(choices[key] ? 'select' : 'input'); input.dataset.setting = key; input.setAttribute('aria-label', names[key]);
      if (choices[key]) for (const [id, title] of choices[key]) { const option = node('option', title); option.value = id; input.append(option); }
      if (typeof defaultSettings[key] === 'boolean') { input.type = 'checkbox'; input.checked = settings[key]; }
      else if (key === 'secondary_keys') { input.value = (settings[key] || []).join('，'); }
      else { if (!choices[key]) { input.type = 'number'; input.min = ['sticky', 'cooldown', 'delay', 'delay_until'].includes(key) ? 1 : 0; input.max = key === 'order' ? 999999 : key === 'probability' ? 100 : 1000; } input.value = key === 'order' && settings[key] === 'auto' || key === 'scan_depth' && settings[key] === 'same_as_global' || settings[key] === null ? '' : settings[key]; }
      label.append(input); details.append(label);
    }
    section.append(details);
    section.append(button('移除此条目', () => { if ($('entries').children.length > 1) section.remove(); })); $('entries').append(section);
  }
  function fillEditor(content, source = null) {
    $('character-name').value = content.character.name; $('description').value = content.character.description || '';
    $('package-category').value = content.character.category || 'character';
    $('portrait-id').value = content.character.portrait_group_id || ''; $('entries').replaceChildren(); content.character.entries.forEach(addEntry);
    sourceId = source; $('revision').textContent = source ? '正在编辑更新稿：审核通过前，旧版继续公开。' : '新角色投稿';
  }
  function payload() {
    return { format: 'jdnl-character-package', version: 1, character: { name: $('character-name').value.trim(), description: $('description').value.trim(), category: $('package-category').value,
      portrait_group_id: $('portrait-id').value.trim() || null, entries: Array.from($('entries').children, section => ({ id: section.dataset.entryId,
        name: section.querySelector('[data-field="name"]').value.trim(), keywords: section.querySelector('[data-field="keywords"]').value.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean),
        content: section.querySelector('[data-field="content"]').value.trim(), settings: Object.fromEntries(Array.from(section.querySelectorAll('[data-setting]'), input => {
          const key = input.dataset.setting, raw = input.value;
          return [key, input.type === 'checkbox' ? input.checked : key === 'secondary_keys' ? raw.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean)
            : key === 'order' && raw === '' ? 'auto' : key === 'scan_depth' && raw === '' ? 'same_as_global'
              : ['sticky', 'cooldown', 'delay', 'delay_until'].includes(key) && raw === '' ? null : input.type === 'number' ? Number(raw) : raw];
        })) })) } };
  }
  async function preview(id) {
    const data = await api('/characters/' + id); $('preview').replaceChildren(node('h2', data.package.name));
    $('preview').append(node('p', '作者：' + data.package.author_name + (data.package.note ? ' · 审核备注：' + data.package.note : '')));
    for (const entry of data.content.character.entries) {
      const settings = { ...defaultSettings, ...entry.settings }, category = settings.category === 'auto' ? data.content.character.category || 'character' : settings.category;
      $('preview').append(node('h3', entry.name), node('small', categories[category] + ' · ' + (settings.order === 'auto' ? '自动顺序' : '顺序 ' + settings.order) + ' · ' + settings.position + ' · ' + (settings.activation === 'constant' ? '常驻' : '关键词触发') + ' · 概率 ' + settings.probability + '%'), node('p', '关键词：' + entry.keywords.join('、')), node('pre', entry.content));
    }
    if (data.content.character.portrait_group_id) {
      $('preview').append(node('p', data.portrait ? '配套立绘：' + data.portrait.name : '配套立绘尚未发布或已撤回'));
      const link = node('a', admin ? '前往立绘管理核对组 ID：' + data.content.character.portrait_group_id : '前往立绘投稿页'); link.href = admin ? '/admin' : '/submit'; link.target = '_blank'; link.rel = 'noopener'; $('preview').append(link);
    }
    status('角色设定已载入预览');
  }
  async function refresh(more = false) {
    if (loading) return; loading = true;
    try {
      const params = new URLSearchParams({ status: filter, q: $('query').value.trim(), limit: '20', category: $('category-filter').value }); if (more && cursor) params.set('cursor', cursor);
      const data = await api('/characters?' + params); if (!more) $('groups').replaceChildren();
      for (const control of $('filters').children) { const key = control.dataset.status; control.textContent = labels[key] + (key === 'all' ? '' : ' ' + (data.status_counts[key] || 0)); control.setAttribute('aria-pressed', String(filter === key)); }
      for (const item of data.packages) {
        const row = node('article'), actions = node('div', undefined, 'actions');
        row.append(node('h3', item.name), node('p', `${labels[item.status]} · ${categories[item.category || 'character']} · ${item.author_name} · ${item.entry_count} 条${item.portrait_group_id ? ' · 附立绘' : ''}`));
        if (item.description) row.append(node('p', item.description)); if (item.note) row.append(node('p', '审核备注：' + item.note));
        actions.append(button('预览设定', () => preview(item.id)));
        if (!admin && item.status !== 'pending') actions.append(button('基于此稿编辑更新', async () => { const data = await api('/characters/' + item.id); fillEditor(data.content, item.id); $('character-name').focus(); status('已读取原稿，可修改后提交新版本'); }));
        for (const [action, label] of (admin ? [['publish', '发布'], ['reject', '拒绝'], ['withdraw', '撤回']] : [['withdraw', '撤回']])) {
          if (action === 'reject' && item.status !== 'pending' || action === 'withdraw' && item.status === 'withdrawn' || action === 'publish' && item.status === 'published') continue;
          actions.append(button(label, async () => {
            const note = admin ? prompt('审核备注（可留空）', '') : ''; if (note === null || !confirm(label + '“' + item.name + '”？')) return;
            await api('/characters/' + item.id + '/moderate', 'POST', { action, note }); $('preview').replaceChildren(); await refresh(); status('已' + label);
          }));
        }
        if (admin) actions.append(button('暂停此作者投稿', async () => { if (!confirm('暂停此作者的角色与立绘投稿权限？')) return; await api('/users/' + item.user_id + '/block', 'POST', { blocked: true }); status('作者投稿已暂停，可在原工坊管理页恢复'); }));
        row.append(actions); $('groups').append(row);
      }
      cursor = data.next_cursor || ''; $('more').hidden = !cursor; if (!$('groups').children.length) $('groups').textContent = '暂无此状态的角色包';
    } finally { loading = false; }
  }
  for (const key of ['pending', 'published', 'rejected', 'withdrawn', 'all']) {
    const control = button(labels[key], async () => { filter = key; await refresh(); }); control.dataset.status = key; $('filters').append(control);
  }
  $('search').onsubmit = event => { event.preventDefault(); refresh().catch(error => status(error.message)); };
  $('more').onclick = () => refresh(true).catch(error => status(error.message)); $('refresh').onclick = () => refresh().catch(error => status(error.message));
  $('category-filter').onchange = () => refresh().catch(error => status(error.message));
  if (admin) {
    $('login').onsubmit = async event => {
      event.preventDefault(); token = $('token').value.trim();
      try { await refresh(); $('work').hidden = false; $('login').hidden = true; $('token').value = ''; status('已登录角色审核'); } catch (error) { token = ''; status(error.message); }
    };
    $('logout').onclick = () => { token = ''; $('work').hidden = true; $('login').hidden = false; $('groups').replaceChildren(); $('preview').replaceChildren(); status('已退出'); };
  } else {
    addEntry();
    $('add-entry').onclick = () => { if ($('entries').children.length < 32) addEntry(); };
    $('new-character').onclick = () => { fillEditor({ character: { name: '', description: '', entries: [{ id: crypto.randomUUID(), name: '角色档案', keywords: [], content: '' }] } }); status('已新建编辑表单'); };
    $('package').onchange = async () => {
      const file = $('package').files[0]; if (!file) return;
      try {
        if (file.size > 262144) throw new Error('角色包超过 256 KiB'); const content = JSON.parse(await file.text());
        if (content.format !== 'jdnl-character-package' || content.version !== 1 || !Array.isArray(content.character?.entries) || !content.character.entries.length || content.character.entries.length > 32) throw new Error('角色包格式无效');
        fillEditor(content); status('角色包已导入表单，可核对后提交');
      } catch (error) { status(error.message); } finally { $('package').value = ''; }
    };
    $('upload').onsubmit = async event => {
      event.preventDefault(); const control = $('submit'); control.disabled = true;
      try {
        const body = { ...payload(), rights_confirmed: $('rights').checked, source_id: sourceId }, serialized = JSON.stringify(body);
        if (serialized !== submittedBody) { requestKey = crypto.randomUUID(); submittedBody = serialized; }
        const result = await api('/characters', 'POST', body, requestKey); await refresh(); status('角色包已提交审核：' + result.id);
      } catch (error) { status(error.message); } finally { control.disabled = !currentUser || !!currentUser.blocked; }
    };
    $('logout').onclick = async () => { try { await api('/logout', 'POST'); location.reload(); } catch (error) { status(error.message); } };
    api('/me').then(async data => {
      currentUser = data.user; csrf = data.csrf_token || ''; if (!currentUser) { status('请先登录 Discord；返回立绘投稿页后，可从页头进入角色工坊'); return; }
      $('login').hidden = true; $('work').hidden = false; $('account-name').textContent = currentUser.name;
      $('submit').disabled = currentUser.blocked || !data.uploads_enabled; await refresh(); status(currentUser.blocked ? '此账号已暂停投稿' : '已登录');
    }).catch(error => status(error.message));
  }
}

function characterPage(admin = false) {
  const nonce = crypto.randomUUID(), title = admin ? '角色工坊 · 审核管理' : '角色工坊 · 投稿与我的角色';
  const response = adminPage(!admin), headers = new Headers(response.headers);
  headers.set('content-security-policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style nonce="${nonce}">*{box-sizing:border-box}body{margin:0;background:#f3f5f7;color:#26353d;font:14px/1.7 system-ui,sans-serif}main{max-width:900px;margin:auto;padding:24px 18px}h1{font-size:22px}h2{font-size:18px}h3{font-size:15px}a{color:#276580}nav,.actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}button{font:inherit;border:1px solid #b5c7ce;border-radius:5px;background:white;color:#24596c;padding:7px 12px;cursor:pointer}button[aria-pressed=true]{background:#dcecf2}button:disabled{opacity:.5;cursor:default}label{display:block;margin:10px 0}input,textarea,select{width:100%;font:inherit;padding:8px;border:1px solid #c7d1d9;border-radius:4px;background:white;color:inherit}textarea{resize:vertical}fieldset{border:1px solid #c7d1d9;margin:12px 0;min-width:0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;padding:12px;background:#fff;border-left:2px solid #94aeb7}article{padding:16px 0;border-bottom:1px solid #c7d1d9}small{color:#667780}p{overflow-wrap:anywhere}input[type=checkbox]{width:auto}.actions input{flex:1;min-width:100px}#status{position:sticky;bottom:0;background:#e6eef2;padding:10px;border-left:3px solid #44788c}#preview:empty{display:none}#preview{margin-top:20px;border-top:2px solid #94aeb7}[hidden]{display:none!important}</style>
  <main><h1>${title}</h1><nav><a href="${admin ? '/admin' : '/submit'}">立绘${admin ? '管理' : '投稿'}</a><a href="/characters-submit">角色投稿</a>${admin ? '' : '<a href="/characters-admin">管理员入口</a>'}</nav>
  ${admin ? '<form id="login"><label>管理员口令<input id="token" type="password" autocomplete="off" required></label><button>登录</button><p>首次升级后，先在立绘管理页点击“补全数据库结构”。</p></form>' : '<section id="login"><a href="/auth/discord">使用 Discord 登录</a></section>'}
  <section id="work" hidden><div class="actions"><span id="account-name"></span><button id="refresh">刷新</button><button id="logout">退出</button></div>
  ${admin ? '' : '<h2>提交角色设定</h2><p>角色设定审核通过后公开。配套图片先在立绘投稿页上传并审核发布，再填写组 ID。</p><form id="upload"><p id="revision">新角色投稿</p><label>导入本地角色包<input id="package" type="file" accept="application/json,.json"></label><button id="new-character" type="button">新建角色</button><label>资料名称<input id="character-name" maxlength="80" required></label><label>资料分类<select id="package-category"><option value="character">角色</option><option value="plane">位面</option><option value="other">其他</option></select></label><label>简介<textarea id="description" maxlength="1000" rows="2"></textarea></label><label>配套已发布立绘组 ID（可选）<input id="portrait-id" maxlength="80"></label><div id="entries"></div><button id="add-entry" type="button">添加条目</button><label><input id="rights" type="checkbox" required>我有权公开分享这些设定，同意审核后公开。</label><button id="submit">提交审核</button></form>'}
  <h2>${admin ? '角色审核与发布' : '我的角色投稿'}</h2><form id="search" class="actions"><input id="query" maxlength="100" placeholder="搜索角色、作者或简介" aria-label="搜索角色投稿"><button>搜索</button></form><label>分类筛选<select id="category-filter"><option value="all">全部分类</option><option value="character">角色</option><option value="plane">位面</option><option value="other">其他</option></select></label><div id="filters" class="actions"></div><div id="groups"></div><button id="more" hidden>加载更多</button><section id="preview" aria-label="角色设定预览"></section></section><p id="status" role="status">未登录</p></main>
  <script nonce="${nonce}">(${characterPortalClient.toString()})(${admin}, ${JSON.stringify(defaultLoreSettings())});</script></html>`, { headers });
}

function adminClient() {
  const byId = id => document.getElementById(id);
  let token = '';
  let statusFilter = 'pending';
  let summaryCursor = '';
  let summaryQuery = '';
  const urls = [];
  const errors = {
    unauthorized: '管理员口令不正确', admin_not_configured: '尚未配置 ADMIN_TOKEN Secret（至少 32 字符）',
    local_images_required: '组包必须包含本地图片；请先在图库用本地图片导出，直链暂不支持投稿',
    image_too_large: '单张图片超过 20 MiB',
    request_too_large: '组包过大', invalid_item_count: '每组需要 1 至 24 张立绘',
    capacity_exceeded: '存储额度不足', invalid_image: '图片类型或文件头不正确',
    invalid_group_package: '不是版本 1 的镜待流年立绘组包', invalid_metadata: '名称、标签或说明不符合长度要求',
    invalid_portrait_id: '立绘 ID 为空、重复或含不支持的符号', service_unavailable: '服务不可用，请检查数据库迁移和 Worker 日志',
    group_has_no_assets: '该组已清空，不能再次发布', upload_may_be_in_progress: '上传可能仍在进行，请至少一小时后再清理',
    group_being_cleaned: '该组正在清理，请完成图片清理后再操作',
    revision_source_unavailable: '原投稿状态已变化或图片已清理，请让作者重新提交更新',
    revision_already_exists: '已有待审核或已发布的更新版', revision_superseded: '该组已被新版替换，请维护新版',
    base_schema_missing: '基础表尚未建齐，请先在 D1 执行 schema.sql，再补全结构',
    setup_body_not_allowed: '补全接口只执行内置迁移，不接收自定义内容',
  };
  const status = message => { byId('status').textContent = message; };
  async function api(path, method = 'GET', body) {
    const response = await fetch('/admin/api' + path, {
      method, headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(errors[data.error] || data.error);
    }
    return response;
  }
  function button(label, action, danger = false) {
    const element = document.createElement('button');
    element.textContent = label;
    element.className = danger ? 'danger' : '';
    element.onclick = async () => {
      element.disabled = true;
      try { await action(); } catch (error) { status(error.message); }
      finally { element.disabled = false; }
    };
    return element;
  }
  function clearPreview() {
    urls.splice(0).forEach(url => URL.revokeObjectURL(url));
    byId('preview').replaceChildren();
  }
  async function preview(id) {
    clearPreview();
    const { group, assets } = await (await api('/groups/' + id)).json();
    const heading = document.createElement('h2'); heading.textContent = group.name;
    byId('preview').append(heading);
    for (const asset of assets) {
      const figure = document.createElement('figure');
      const caption = document.createElement('figcaption');
      caption.textContent = asset.character_name + ' · ' + asset.tag + (asset.caption ? ' · ' + asset.caption : '');
      const image = document.createElement('img'); image.alt = caption.textContent;
      const response = await api('/assets/' + asset.id);
      const url = URL.createObjectURL(await response.blob()); urls.push(url); image.src = url;
      figure.append(image, caption); byId('preview').append(figure);
    }
    status('已载入待审图片');
  }
  async function refresh(reset = false) {
    if (reset) summaryCursor = '';
    const params = new URLSearchParams({ status: statusFilter, limit: '30' });
    if (summaryQuery) params.set('q', summaryQuery);
    if (summaryCursor) params.set('cursor', summaryCursor);
    const data = await (await api('/summary?' + params)).json();
    const gib = value => (value / 1024 ** 3).toFixed(2);
    byId('quota').textContent = '已占用及预留 ' + gib(data.quota.reserved_bytes) + ' GiB / ' + gib(data.quota.limit_bytes) + ' GiB';
    const list = byId('groups');
    if (!summaryCursor) list.replaceChildren();
    const counts = data.status_counts || {};
    for (const key of ['pending', 'published', 'rejected', 'withdrawn', 'draft', 'all']) {
      const control = byId('filter-' + key);
      if (control) { control.textContent = (key === 'all' ? '全部' : ({ pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', draft: '清理待完成' }[key])) + ' ' + (counts[key] || 0); control.classList.toggle('active', statusFilter === key); }
    }
    const labels = { pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', draft: '清理待完成' };
    for (const group of data.groups) {
      const row = document.createElement('article');
      const title = document.createElement('h3'); title.textContent = group.name;
      const metadata = document.createElement('p');
      metadata.textContent = (labels[group.status] || group.status) + ' · ' + group.asset_count + ' 张 · ' + (group.author_name || '未署名') + ' · 立绘组 ID：' + group.id;
      const actions = document.createElement('div'); actions.className = 'actions';
      actions.append(button('查看图片', () => preview(group.id)));
      for (const [action, label] of [['publish', '发布'], ['reject', '拒绝'], ['withdraw', '撤回']]) {
        const control = button(label, async () => {
          if (!confirm(label + '“' + group.name + '”？')) return;
          await api('/groups/' + group.id + '/moderate', 'POST', { action });
          clearPreview(); await refresh(true); status('已' + label);
        });
        control.disabled = !group.asset_count;
        actions.append(control);
      }
      if (group.asset_count) actions.append(button('清理图片', async () => {
        if (!confirm('清理“' + group.name + '”的全部云端图片？此操作不可恢复，审核记录保留。')) return;
        await api('/groups/' + group.id, 'DELETE'); clearPreview(); await refresh(true); status('已清理图片并释放容量');
      }, true));
      if (group.user_id) actions.append(button(group.blocked ? '恢复作者投稿' : '暂停作者投稿', async () => {
        if (!confirm((group.blocked ? '恢复' : '暂停') + '此作者的投稿权限？')) return;
        await api('/users/' + group.user_id + '/block', 'POST', { blocked: !group.blocked });
        await refresh(true); status('作者投稿权限已更新');
      }, !group.blocked));
      row.append(title, metadata, actions); list.append(row);
    }
    summaryCursor = data.next_cursor || '';
    const more = byId('summary-more');
    if (more) more.hidden = !summaryCursor;
    if (!summaryCursor) for (const upload of data.incomplete_uploads) {
      const row = document.createElement('article');
      const label = document.createElement('p'); label.textContent = '未完成上传：' + upload.group_id;
      row.append(label, button('清理残留', async () => {
        if (!confirm('删除此次未完成上传的残留图片并释放预留容量？')) return;
        await api('/groups/' + upload.group_id, 'DELETE'); await refresh(true); status('残留已清理');
      }, true)); list.append(row);
    }
    if (!list.children.length) list.textContent = '暂无投稿';
  }
  let loggingIn = false;
  async function login(setup = false) {
    if (loggingIn || !byId('login').reportValidity()) return;
    loggingIn = true; token = byId('token').value.trim();
    const controls = Array.from(byId('login').querySelectorAll('button'));
    controls.forEach(control => { control.disabled = true; });
    try {
      if (setup) { status('正在补全数据库结构…'); await api('/setup', 'POST'); }
      await refresh(true); byId('work').hidden = false; byId('login').hidden = true; byId('token').value = '';
      status(setup ? '数据库结构已补全，已登录' : '已登录');
    } catch (error) { token = ''; status(error.message); }
    finally { loggingIn = false; controls.forEach(control => { control.disabled = false; }); }
  }
  byId('login').onsubmit = event => { event.preventDefault(); void login(); };
  byId('setup').onclick = () => login(true);
  byId('logout').onclick = () => {
    token = ''; clearPreview(); byId('groups').replaceChildren(); byId('work').hidden = true; byId('login').hidden = false; status('已退出');
  };
  byId('refresh').onclick = () => refresh(true).catch(error => status(error.message));
  for (const key of ['pending', 'published', 'rejected', 'withdrawn', 'draft', 'all']) {
    byId('filter-' + key)?.addEventListener('click', () => { statusFilter = key; void refresh(true).catch(error => status(error.message)); });
  }
  byId('summary-search').onsubmit = event => { event.preventDefault(); summaryQuery = byId('summary-query').value.trim(); void refresh(true).catch(error => status(error.message)); };
  byId('summary-more').onclick = () => refresh().catch(error => status(error.message));
  byId('upload').onsubmit = async event => {
    event.preventDefault(); const file = byId('package').files[0]; if (!file) return;
    const control = byId('submit'); control.disabled = true; status('上传中…');
    try {
      if (file.size > 42 * 1024 * 1024) throw new Error('组包超过 42 MiB');
      const payload = JSON.parse(await file.text());
      payload.author_name = byId('author').value; payload.description = byId('description').value;
      await api('/submissions', 'POST', payload); await refresh(true); status('已收稿，等待审核');
      byId('package').value = '';
    } catch (error) { status(error.message); }
    finally { control.disabled = false; }
  };
}

function playerClient() {
  const byId = id => document.getElementById(id);
  let csrf = '', user = null, busy = false, updateId = '';
  const urls = [];
  const labels = { pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', draft: '上传中的草稿' };
  const errors = {
    login_required: '登录已过期，请重新登录', csrf_failed: '登录状态已变化，请刷新页面',
    discord_not_configured: 'Discord 登录尚未配置完成', player_blocked: '此账号已暂停投稿',
    player_uploads_paused: '工坊暂时停止接收投稿', rights_confirmation_required: '请确认图片分享权',
    player_daily_limit: '已达到最近 24 小时投稿额度（5 次 / 2 GiB）', player_rate_limit: '请至少间隔一分钟再新建投稿',
    player_pending_limit: '最多保留 3 组待审核投稿', player_global_daily_limit: '工坊今日收稿额度已满，请稍后再试',
    local_images_required: '投稿组包需要包含图片数据，不能使用图片直链',
    image_too_large: '单图最多 20 MiB', request_too_large: '图片清单过大',
    invalid_item_count: '每组需要 1 至 2000 张图片', invalid_image: '图片格式或文件头无效', image_mismatch: '图片与清单中登记的大小或格式不一致',
    draft_unavailable: '草稿已提交或删除，请刷新投稿列表',
    invalid_metadata: '名称、标签或说明不符合长度要求', invalid_portrait_id: '立绘 ID 无效或重复',
    invalid_group_package: '不是镜待流年版本 1 立绘组包', capacity_exceeded: '云端容量不足',
    upload_incomplete: '图片尚未全部上传；重新选择相同文件可继续',
    upload_failed: '上传失败，已清理本次云端图片，可以重试', previous_upload_failed: '上次上传已失败，再点提交即可重试',
    group_has_no_assets: '图片已被清理', group_being_cleaned: '该组正在清理', not_found: '该投稿不存在',
    revision_source_unavailable: '原投稿已变化或图片已清理，请刷新后重新选择',
    revision_already_exists: '已有待审更新或已被新版替换，请维护对应新版',
    portrait_id_conflict: '新增图片的引用 ID 与原组重复；更新组包只需选择新增图片',
    service_unavailable: '服务暂时不可用，请稍后重试',
  };
  const status = message => { byId('status').textContent = message; };
  async function api(path, method = 'GET', body, requestId) {
    const response = await fetch('/account/api' + path, {
      method, credentials: 'same-origin', signal: AbortSignal.timeout(method === 'POST' ? 90000 : 20000),
      headers: { ...(method !== 'GET' ? { 'x-csrf-token': csrf } : {}), ...(body ? { 'content-type': 'application/json' } : {}),
        ...(body?.format === 'jdnl-portrait-manifest' ? { 'x-upload-format': 'manifest' } : {}),
        ...(requestId ? { 'x-request-id': requestId } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const data = await response.json();
      const error = new Error(errors[data.error] || '请求失败（' + response.status + '）');
      error.code = data.error; throw error;
    }
    return response;
  }
  async function putImage(groupId, item, blob) {
    const response = await fetch('/account/api/drafts/' + groupId + '/assets/' + encodeURIComponent(item.id), {
      method: 'PUT', credentials: 'same-origin', signal: AbortSignal.timeout(90000),
      headers: { 'x-csrf-token': csrf, 'content-type': item.content_type }, body: blob,
    });
    if (!response.ok) {
      const data = await response.json();
      const error = new Error(errors[data.error] || '上传图片失败（' + response.status + '）');
      error.code = data.error; throw error;
    }
  }
  function clearPreview() {
    urls.splice(0).forEach(url => URL.revokeObjectURL(url));
    byId('preview').replaceChildren();
  }
  async function preview(id) {
    clearPreview();
    const { group, assets } = await (await api('/groups/' + id)).json();
    const heading = document.createElement('h2'); heading.textContent = group.name; byId('preview').append(heading);
    for (const asset of assets.slice(0, 12)) {
      const image = document.createElement('img'); image.alt = asset.character_name + ' · ' + asset.tag;
      const response = await api('/assets/' + asset.id);
      const url = URL.createObjectURL(await response.blob()); urls.push(url); image.src = url;
      const figure = document.createElement('figure'), caption = document.createElement('figcaption'); caption.textContent = image.alt;
      figure.append(image, caption); byId('preview').append(figure);
    }
    if (assets.length > 12) {
      const note = document.createElement('p'); note.textContent = '仅预览前 12 张，共 ' + assets.length + ' 张'; byId('preview').append(note);
    }
  }
  async function refresh() {
    const data = await (await api('/me')).json();
    user = data.user; csrf = data.csrf_token || '';
    byId('login').hidden = !!user; byId('work').hidden = !user;
    if (!user) { byId('groups').replaceChildren(); clearPreview(); return; }
    byId('account-name').textContent = user.name;
    byId('submit').disabled = user.blocked || !data.uploads_enabled || busy;
    byId('paused').hidden = !user.blocked && data.uploads_enabled;
    byId('paused').textContent = user.blocked ? errors.player_blocked : errors.player_uploads_paused;
    let cursor = '', count = 0;
    const list = byId('groups'); list.replaceChildren();
    async function loadMore() {
      const listing = await (await api('/submissions' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''))).json();
      for (const group of listing.groups) {
        count++;
        const row = document.createElement('article'), title = document.createElement('h3'), metadata = document.createElement('p');
        title.textContent = group.name; metadata.textContent = (labels[group.status] || group.status) + ' · ' + group.asset_count + ' 张 · 立绘组 ID：' + group.id;
        if (group.source_group_id) metadata.textContent += ' · 更新版';
        if (group.replacement_id) metadata.textContent += ' · 已提交新版';
        const actions = document.createElement('div'); actions.className = 'actions';
        if (group.asset_count) {
          const view = document.createElement('button'); view.textContent = '查看图片';
          view.onclick = async () => { view.disabled = true; try { await preview(group.id); } catch (error) { status(error.message); } finally { view.disabled = false; } };
          actions.append(view);
          if (!group.replacement_id && group.status !== 'draft') {
            const update = document.createElement('button'); update.textContent = '更新组包';
            update.dataset.update = group.id;
            update.disabled = busy || user.blocked || !data.uploads_enabled;
            update.onclick = () => {
              updateId = group.id; byId('update-target').textContent = '追加到“' + group.name + '”：只选择新增图片或仅含新增图片的组包；旧图会保留';
              byId('update-mode').hidden = false; byId('description').value = group.description || '';
              byId('submit').textContent = '提交更新审核';
              byId('upload').scrollIntoView({ behavior: 'smooth', block: 'start' });
              byId('package').focus();
            }; actions.append(update);
          }
          if (['pending', 'published'].includes(group.status)) {
            const withdraw = document.createElement('button'); withdraw.textContent = '撤回投稿';
            withdraw.onclick = async () => {
              if (!confirm('撤回“' + group.name + '”？云端图片将不再公开，本地图库保持不变。')) return;
              withdraw.disabled = true;
              try { await api('/groups/' + group.id + '/withdraw', 'POST'); clearPreview(); await refresh(); status('已撤回投稿'); }
              catch (error) { status(error.message); withdraw.disabled = false; }
            }; actions.append(withdraw);
          }
        }
        if (group.asset_count || group.status === 'draft') {
          const remove = document.createElement('button'); remove.textContent = '删除云端图片'; remove.className = 'danger';
          remove.onclick = async () => {
            if (!confirm('永久删除“' + group.name + '”的云端图片并释放容量？无法恢复，本地图库不受影响。')) return;
            remove.disabled = true;
            try { await api('/groups/' + group.id, 'DELETE'); clearPreview(); if (updateId === group.id) resetUpdate(); await refresh(); status('云端图片已删除，容量已释放；本地图库保持不变'); }
            catch (error) { status(error.message); remove.disabled = false; }
          }; actions.append(remove);
        }
        row.append(title, metadata);
        if (group.note) { const note = document.createElement('p'); note.textContent = '审核意见：' + group.note; row.append(note); }
        row.append(actions); list.append(row);
      }
      cursor = listing.next_cursor || '';
      byId('more').hidden = !cursor;
      if (!count) list.textContent = '暂无投稿';
    }
    byId('more').onclick = async () => {
      byId('more').disabled = true; try { await loadMore(); } catch (error) { status(error.message); } finally { byId('more').disabled = false; }
    };
    await loadMore();
  }
  byId('logout').onclick = async () => {
    try { await api('/logout', 'POST'); clearPreview(); await refresh(); status('已退出'); } catch (error) { status(error.message); }
  };
  byId('refresh').onclick = () => refresh().catch(error => status(error.message));
  function resetUpdate() {
    updateId = ''; byId('update-mode').hidden = true; byId('submit').textContent = '提交审核';
  }
  byId('cancel-update').onclick = () => { if (!busy) resetUpdate(); };
  byId('package').onchange = () => {
    const file = byId('package').files[0]; byId('package-name').textContent = file ? file.name : '';
  };
  byId('images').onchange = () => {
    const files = byId('images').files; byId('image-count').textContent = files.length ? files.length + ' 张图片' : '';
  };
  async function uploadSource() {
    const file = byId('package').files[0], files = [...byId('images').files];
    if (file && files.length) throw new Error('组包和批量图片请二选一');
    if (!file && !files.length) throw new Error('请选择组包或图片');
    if (file) {
      const parsed = JSON.parse(await file.text());
      if (parsed.format !== 'jdnl-portrait-group' || parsed.version !== 1 || !Array.isArray(parsed.group?.items)) {
        throw new Error(errors.invalid_group_package);
      }
      const items = parsed.group.items.map(item => {
        const match = /^data:(image\/(?:png|jpeg|gif|webp|avif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(item.url || '');
        if (!match) throw new Error(errors.local_images_required);
        const size = Math.floor(match[2].length * 3 / 4) - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
        return { id: item.id, name: item.name, tag: item.tag, caption: item.caption || '',
          byte_size: size, content_type: match[1], url: item.url };
      });
      return { name: parsed.group.name, items,
        signature: file.name + ':' + file.size + ':' + file.lastModified,
        image: async item => (await fetch(item.url)).blob() };
    }
    const name = byId('group-name').value.trim();
    if (!name) throw new Error('批量图片需要填写组名');
    const used = new Set();
    const items = files.map(file => {
      const tag = file.name.replace(/\.[^.]+$/, '');
      const stem = tag.normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'image';
      let id = stem, suffix = 2;
      while (used.has(id)) id = stem + '-' + suffix++;
      used.add(id);
      const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' })[file.name.split('.').at(-1).toLowerCase()];
      return { id, name, tag, caption: '', byte_size: file.size, content_type: type, file };
    });
    return { name, items, signature: files.map(file => file.name + ':' + file.size + ':' + file.lastModified).join('|'),
      image: async item => item.file };
  }
  byId('upload').onsubmit = async event => {
    event.preventDefault();
    if (!user || busy) return;
    busy = true; byId('submit').disabled = true; status('正在上传…');
    let keyName;
    try {
      const source = await uploadSource();
      if (!source.items.length || source.items.length > 2000) throw new Error(errors.invalid_item_count);
      if (source.items.some(item => item.byte_size < 1 || item.byte_size > 20 * 1024 * 1024)) throw new Error(errors.image_too_large);
      const target = updateId;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([target, source.name, source.signature, byId('description').value])));
      keyName = 'jdnl-submission-' + user.id + '-' + Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
      let key = sessionStorage.getItem(keyName);
      if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(keyName, key); }
      const manifest = { format: 'jdnl-portrait-manifest', version: 1,
        group: { name: source.name, items: source.items.map(({ id, name, tag, caption, byte_size, content_type }) =>
          ({ id, name, tag, caption, byte_size, content_type })) },
        description: byId('description').value, rights_confirmed: byId('rights').checked };
      const draft = await (await api(target ? '/groups/' + target + '/update' : '/submissions', 'POST', manifest, key)).json();
      if (draft.status === 'draft') {
        const uploaded = new Set(draft.uploaded_ids);
        for (let index = 0; index < source.items.length; index++) {
          const item = source.items[index];
          if (uploaded.has(item.id)) continue;
          status('正在上传图片 ' + (index + 1) + ' / ' + source.items.length + '：' + item.name + ' · ' + item.tag);
          const blob = await source.image(item);
          for (let attempt = 0; ; attempt++) {
            try { await putImage(draft.group_id, item, blob); break; }
            catch (error) { if (attempt >= 2 || ['image_mismatch', 'invalid_image', 'image_too_large'].includes(error.code)) throw error;
              await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1))); }
          }
        }
      }
      const result = draft.status === 'draft' ? await (await api('/drafts/' + draft.group_id + '/finish', 'POST')).json() : draft;
      sessionStorage.removeItem(keyName);
      byId('package').value = ''; byId('package-name').textContent = '';
      byId('images').value = ''; byId('image-count').textContent = ''; byId('rights').checked = false;
      resetUpdate(); await refresh();
      status(result.repeated ? '已确认上次投稿：' + (labels[result.status] || result.status) : target
        ? '新增图片已提交审核；通过后追加到原组，本地图库保持不变' : '上传成功，等待审核；本地图库保持不变');
    } catch (error) {
      if (keyName && ['upload_failed', 'previous_upload_failed', 'draft_unavailable'].includes(error.code)) sessionStorage.removeItem(keyName);
      status(error.name === 'TimeoutError' || error.name === 'TypeError' ? '连接中断；重新选择相同文件可续传，或在“我的投稿”删除草稿' : error.message);
    } finally {
      busy = false;
      if (user) {
        const disabled = !!user.blocked || !byId('paused').hidden;
        byId('submit').disabled = disabled;
        byId('groups').querySelectorAll('[data-update]').forEach(button => { button.disabled = disabled; });
      }
    }
  };
  const login = new URL(location.href).searchParams.get('login');
  refresh().then(() => status(login === 'cancelled' ? '已取消登录' : login === 'failed' ? '登录未完成，请重试或检查 Discord 配置' : user ? '已登录' : '未登录'))
    .catch(error => status(error.message));
}

function adminPage(player = false) {
  const nonce = crypto.randomUUID();
  const title = '镜待流年 · ' + (player ? '工坊投稿' : '工坊管理');
  const playerBody = `<section id="login"><a class="login-link" href="/auth/discord">使用 Discord 登录</a></section>
  <section id="work" hidden><div class="bar"><span id="account-name"></span><button id="refresh">刷新</button><button id="logout">退出</button></div>
  <p id="paused" hidden role="alert"></p><h2>提交立绘组</h2>
  <form id="upload"><div id="update-mode" class="bar" hidden><span id="update-target"></span><button id="cancel-update" type="button">取消更新</button></div><label for="package">本地立绘组包</label><input id="package" type="file" accept="application/json,.json"><small id="package-name"></small>
  <p>大量 CG 可直接批量选择图片。每张文件名用作标签和引用 ID，组名用作角色名；组包与批量图片二选一。</p>
  <label for="group-name">批量图片组名</label><input id="group-name" maxlength="100" placeholder="角色名或画集名">
  <label for="images">批量图片</label><input id="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple><small id="image-count"></small>
  <label for="description">说明</label><textarea id="description" maxlength="1000"></textarea>
  <label class="check"><input id="rights" type="checkbox" required>我有权分享这些图片，同意审核后公开，内容符合平台及法律要求</label>
  <button id="submit">提交审核</button></form><h2>我的投稿</h2><div id="groups"></div><button id="more" hidden>加载更多</button><div id="preview"></div></section>`;
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title><style nonce="${nonce}">
  *{box-sizing:border-box}body{margin:0;color:#202830;background:#f3f5f7;font:14px/1.6 system-ui,sans-serif}
  header{padding:20px max(20px,calc((100% - 960px)/2));border-bottom:1px solid #d7dfe5;background:white}
  h1{font-size:22px;margin:0}h2{font-size:18px}h3{font-size:16px;margin:0}main{max-width:960px;margin:auto;padding:24px 20px}
  label{display:block;margin-top:12px;color:#495760}input,textarea{font:inherit;width:100%;border:1px solid #c7d1d9;border-radius:4px;background:white;padding:9px;margin:4px 0 10px}
  textarea{min-height:80px;resize:vertical}button{font:inherit;padding:7px 12px;border:1px solid #b9c7d2;border-radius:4px;background:white;color:#24596c;cursor:pointer}
  .login-link{display:inline-block;padding:10px 16px;border-radius:4px;background:#356a80;color:white;text-decoration:none}.check{display:flex;gap:8px;align-items:flex-start;margin-bottom:16px}.check input{width:18px;height:18px;flex:0 0 18px;margin:3px 0}#paused{color:#a23645}small{overflow-wrap:anywhere}
  button:disabled{opacity:.5;cursor:default}.danger{color:#ad3545}article{padding:16px 0;border-bottom:1px solid #d7dfe5}article p{margin:4px 0 10px;color:#63717b}
  .actions{display:flex;gap:8px;flex-wrap:wrap}.bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.bar span{margin-right:auto}
  #summary-filters{margin:10px 0 4px}#summary-filters button.active{background:#dcecf2;color:#1d596e;border-color:#44788c}
  #status{position:sticky;bottom:0;margin-top:20px;padding:10px;background:#e6eef2;border-left:3px solid #44788c;overflow-wrap:anywhere}
  #preview{display:flex;gap:16px;flex-wrap:wrap;margin-top:24px}#preview h2{width:100%}figure{width:220px;margin:0}figure img{width:100%;height:260px;object-fit:contain;background:#e8edf1}figcaption{overflow-wrap:anywhere}
  [hidden]{display:none!important}@media(max-width:480px){figure{width:100%}figure img{height:320px}}
  </style><header><h1>${title}</h1><nav><a href="${player ? '/characters-submit' : '/characters-admin'}">${player ? '角色设定投稿 / 我的角色' : '角色设定审核管理'}</a></nav></header><main>${player ? playerBody : `
  <form id="login"><label for="token">管理员口令</label><input id="token" type="password" autocomplete="off" required><div class="actions"><button>登录</button><button id="setup" type="button">补全数据库结构</button></div></form>
  <section id="work" hidden><div class="bar"><span id="quota"></span><button id="refresh">刷新</button><button id="logout">退出</button></div>
  <h2>导入投稿</h2><form id="upload"><label for="package">立绘组包</label><input id="package" type="file" accept="application/json,.json" required>
  <label for="author">作者</label><input id="author" maxlength="80"><label for="description">组说明</label><textarea id="description" maxlength="1000"></textarea><button id="submit">上传待审组</button></form>
  <h2>审核与发布</h2><form id="summary-search" class="bar"><input id="summary-query" maxlength="100" placeholder="搜索组名、作者、角色或标签" aria-label="搜索投稿"><button>搜索</button></form>
  <div id="summary-filters" class="actions"><button id="filter-pending" type="button">待审核</button><button id="filter-published" type="button">已发布</button><button id="filter-rejected" type="button">已拒绝</button><button id="filter-withdrawn" type="button">已撤回</button><button id="filter-draft" type="button">清理待完成</button><button id="filter-all" type="button">全部</button></div>
  <div id="groups"></div><button id="summary-more" hidden>加载更多</button><div id="preview"></div></section>`}<div id="status" role="status">未登录</div></main>
  <script nonce="${nonce}">(${(player ? playerClient : adminClient).toString()})();</script></html>`;
  return new Response(html, { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
    'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src blob: 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY',
  } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    try {
      if (parts.length === 1 && parts[0] === 'admin' && request.method === 'GET') return adminPage();
      if (parts.length === 1 && parts[0] === 'submit' && request.method === 'GET') return adminPage(true);
      if (parts.length === 1 && parts[0] === 'characters-submit' && request.method === 'GET') return characterPage();
      if (parts.length === 1 && parts[0] === 'characters-admin' && request.method === 'GET') return characterPage(true);
      if (!env.DB || !env.PORTRAITS_BUCKET) return json({ error: 'bindings_unavailable' }, 503);
      if (parts[0] === 'auth' && parts[1] === 'discord' && request.method === 'GET') {
        if (parts.length === 2) return await discordStart(request, env);
        if (parts.length === 3 && parts[2] === 'callback') return await discordCallback(request, env);
      }
      if (parts[0] === 'account' && parts[1] === 'api') {
        const response = await playerApi(request, env, parts);
        response.headers.delete('access-control-allow-origin');
        response.headers.set('vary', 'Cookie');
        return response;
      }
      if (parts[0] === 'admin' && parts[1] === 'api') {
        await requireAdmin(request, env);
        if (parts[2] === 'characters') return await characterApi(request, env, parts.slice(3), null, true);
        if (parts.length === 3 && parts[2] === 'setup' && request.method === 'POST') return await setupDatabase(request, env.DB);
        if (parts.length === 3 && parts[2] === 'summary' && request.method === 'GET') return await adminSummary(env.DB, url);
        if (parts.length === 3 && parts[2] === 'submissions' && request.method === 'POST') return await submitGroup(request, env);
        if (parts.length === 4 && parts[2] === 'groups' && request.method === 'GET') return await getGroup(env.DB, parts[3], true);
        if (parts.length === 4 && parts[2] === 'assets' && request.method === 'GET') return await getAsset(env.DB, env.PORTRAITS_BUCKET, parts[3], true);
        if (parts.length === 5 && parts[2] === 'groups' && parts[4] === 'moderate' && request.method === 'POST') return await moderateGroup(request, env, parts[3]);
        if (parts.length === 4 && parts[2] === 'groups' && request.method === 'DELETE') return await deleteGroup(env, parts[3]);
        if (parts.length === 5 && parts[2] === 'users' && parts[4] === 'block' && request.method === 'POST') {
          if (!/^\d{15,22}$/.test(parts[3])) throw new ApiError(400, 'invalid_id');
          const payload = await readJson(request);
          if (typeof payload.blocked !== 'boolean') throw new ApiError(400, 'invalid_metadata');
          const result = await env.DB.prepare('UPDATE workshop_users SET blocked = ? WHERE discord_id = ?').bind(payload.blocked ? 1 : 0, parts[3]).run();
          if (!result.meta.changes) throw new ApiError(404, 'not_found');
          return json({ status: 'updated' });
        }
        return json({ error: 'not_found' }, 404);
      }
      if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
      if (parts.length === 0) return json({ service: 'jingdai-workshop', status: 'ok' });
      if (parts.length === 1 && parts[0] === 'health') {
        await env.DB.prepare('SELECT 1').first();
        return json({ status: 'ok' });
      }
      if (parts.length === 1 && parts[0] === 'groups') return await listGroups(env.DB, url);
      if (parts[0] === 'characters') return await characterApi(request, env, parts.slice(1));
      if (parts.length === 3 && parts[0] === 'groups' && parts[2] === 'export') return await exportGroup(env.DB, parts[1], url.href);
      if (parts.length === 2 && parts[0] === 'groups') return await getGroup(env.DB, parts[1]);
      if (parts.length === 2 && parts[0] === 'assets') return await getAsset(env.DB, env.PORTRAITS_BUCKET, parts[1]);
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      const respond = parts[0] === 'account' || parts[0] === 'auth' ? privateJson : json;
      if (error instanceof ApiError) return respond({ error: error.message }, error.status);
      const message = String(error?.message);
      if (message.includes('workshop_capacity_exceeded')) return respond({ error: 'capacity_exceeded' }, 409);
      if (message.includes('upload_incomplete')) return respond({ error: 'upload_incomplete' }, 409);
      for (const code of ['revision_source_unavailable', 'revision_already_exists', 'revision_superseded', 'portrait_id_conflict']) {
        if (message.includes(code)) return respond({ error: code }, 409);
      }
      for (const code of ['player_blocked', 'player_daily_limit', 'player_rate_limit', 'player_pending_limit', 'player_global_daily_limit']) {
        if (message.includes(code)) return respond({ error: code }, code === 'player_blocked' ? 403 : 429);
      }
      if (message.includes('player_upload_attempts.user_id, player_upload_attempts.request_key')) return respond({ error: 'upload_incomplete' }, 409);
      console.error('Workshop request failed', error);
      return respond({ error: 'service_unavailable' }, 503);
    }
  },
};
