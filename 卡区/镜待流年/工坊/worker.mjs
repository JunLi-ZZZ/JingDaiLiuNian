const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_GROUP = 12 * 1024 * 1024;
const MAX_BODY = 18 * 1024 * 1024;
const MAX_ITEMS = 24;
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
  await db.batch(SETUP_STATEMENTS.map(sql => db.prepare(sql).bind()));
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

async function readJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'json_required');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'body_required');
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new ApiError(413, 'request_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, 'invalid_json'); }
}

function decodeImage(url) {
  if (typeof url !== 'string') throw new ApiError(400, 'local_images_required');
  const match = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
  if (!match) throw new ApiError(400, 'local_images_required');
  if (match[2].length > Math.ceil(MAX_IMAGE / 3) * 4) throw new ApiError(413, 'image_too_large');
  let binary;
  try { binary = atob(match[2]); } catch { throw new ApiError(400, 'invalid_image'); }
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  if (!bytes.length || bytes.length > MAX_IMAGE) throw new ApiError(413, 'image_too_large');
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const valid = match[1] === 'image/png' ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
    : match[1] === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : match[1] === 'image/gif' ? ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    : match[1] === 'image/webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    : ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12));
  if (!valid) throw new ApiError(400, 'invalid_image');
  return { bytes, contentType: match[1] };
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

async function listGroups(db, url) {
  const requested = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested) || 20, 1), 50) : 20;
  const cursor = url.searchParams.get('cursor') || '';
  if (cursor && !isId(cursor)) return json({ error: 'invalid_cursor' }, 400);

  const rows = await db.prepare(`
    SELECT g.id, g.name, g.description, g.author_name, g.cover_asset_id,
           g.published_at, COUNT(a.id) AS asset_count
    FROM portrait_groups g
    LEFT JOIN portrait_assets a ON a.group_id = g.id AND a.status = 'published'
    WHERE g.status = 'published' AND g.id > ?
    GROUP BY g.id
    ORDER BY g.id
    LIMIT ?
  `).bind(cursor, limit + 1).all();
  const groups = rows.results.slice(0, limit);
  return json({
    groups: groups.map(group => ({ ...group, cover_url: group.cover_asset_id ? `/assets/${group.cover_asset_id}` : null })),
    next_cursor: rows.results.length > limit ? groups.at(-1).id : null,
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

async function exportGroup(db, id, origin) {
  const response = await getGroup(db, id);
  if (response.status !== 200) return response;
  const { group, assets } = await response.json();
  return json({
    format: 'jdnl-portrait-group', version: 1,
    group: { id: group.id, name: group.name, items: assets.map(asset => ({
      id: asset.portrait_id, name: asset.character_name, tag: asset.tag,
      caption: asset.caption, url: new URL(asset.url, origin).href,
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
    if (total > MAX_GROUP) throw new ApiError(413, 'group_too_large');
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
  // Draft acts as a persistent cleanup lock, including when R2 deletion needs a retry.
  await env.DB.prepare("UPDATE portrait_groups SET status = 'draft', published_at = NULL WHERE id = ?").bind(id).run();
  const prefix = `portraits/${id}/`;
  let cursor;
  do {
    const listed = await env.PORTRAITS_BUCKET.list({ prefix, cursor });
    for (const object of listed.objects) await env.PORTRAITS_BUCKET.delete(object.key);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  // Also handle assets imported before the standard key convention was introduced.
  const assets = await env.DB.prepare('SELECT r2_key FROM portrait_assets WHERE group_id = ?').bind(id).all();
  for (const asset of assets.results) await env.PORTRAITS_BUCKET.delete(asset.r2_key);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM portrait_assets WHERE group_id = ?').bind(id),
    env.DB.prepare('DELETE FROM storage_reservations WHERE group_id = ?').bind(id),
    env.DB.prepare("UPDATE portrait_groups SET status = 'withdrawn', cover_asset_id = NULL WHERE id = ?").bind(id),
    env.DB.prepare("UPDATE portrait_submissions SET status = 'withdrawn', reviewed_at = datetime('now') WHERE group_id = ?").bind(id),
  ]);
  return json({ group_id: id, status: 'deleted' });
}

async function adminSummary(db) {
  const quota = await db.prepare(`SELECT limit_bytes,
    COALESCE((SELECT SUM(byte_size) FROM storage_reservations), 0) AS reserved_bytes
    FROM workshop_quota WHERE id = 1`).first();
  const groups = await db.prepare(`SELECT g.id, g.name, g.status, g.author_name, g.created_at, o.user_id, u.blocked,
    (SELECT COUNT(*) FROM portrait_assets a WHERE a.group_id = g.id) AS asset_count
    FROM portrait_groups g LEFT JOIN portrait_group_owners o ON o.group_id = g.id
    LEFT JOIN workshop_users u ON u.discord_id = o.user_id ORDER BY g.created_at DESC, g.id LIMIT 100`).all();
  const orphans = await db.prepare(`SELECT r.group_id, r.byte_size FROM storage_reservations r
    LEFT JOIN portrait_groups g ON g.id = r.group_id WHERE g.id IS NULL
    AND r.created_at < datetime('now', '-1 hour') LIMIT 100`).all();
  return json({ quota, groups: groups.results, incomplete_uploads: orphans.results,
    limits: { image_bytes: MAX_IMAGE, group_bytes: MAX_GROUP, item_count: MAX_ITEMS } });
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
  if (parts.length === 3 && parts[2] === 'logout' && request.method === 'POST') {
    await env.DB.prepare('DELETE FROM workshop_sessions WHERE token_hash = ?').bind(player.token_hash).run();
    const response = privateJson({ status: 'logged_out' });
    response.headers.set('set-cookie', cookie(SESSION_COOKIE, '', 0));
    return response;
  }
  if (parts.length === 3 && parts[2] === 'submissions') {
    if (request.method === 'POST') return submitGroup(request, env, player);
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
    return submitGroup(request, env, player, parts[3]);
  }
  if (parts.length === 4 && parts[2] === 'groups' && request.method === 'DELETE') {
    await requireOwner(env, player, parts[3]);
    return deleteGroup(env, parts[3]);
  }
  throw new ApiError(404, 'not_found');
}

function adminClient() {
  const byId = id => document.getElementById(id);
  let token = '';
  const urls = [];
  const errors = {
    unauthorized: '管理员口令不正确', admin_not_configured: '尚未配置 ADMIN_TOKEN Secret（至少 32 字符）',
    local_images_required: '组包必须包含本地图片；请先在图库用本地图片导出，直链暂不支持投稿',
    image_too_large: '单张图片超过 2 MiB', group_too_large: '整组图片超过 12 MiB',
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
  async function refresh() {
    const data = await (await api('/summary')).json();
    const gib = value => (value / 1024 ** 3).toFixed(2);
    byId('quota').textContent = '已占用及预留 ' + gib(data.quota.reserved_bytes) + ' GiB / ' + gib(data.quota.limit_bytes) + ' GiB';
    const list = byId('groups'); list.replaceChildren();
    const labels = { pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', draft: '清理待完成' };
    for (const group of data.groups) {
      const row = document.createElement('article');
      const title = document.createElement('h3'); title.textContent = group.name;
      const metadata = document.createElement('p');
      metadata.textContent = (labels[group.status] || group.status) + ' · ' + group.asset_count + ' 张 · ' + (group.author_name || '未署名');
      const actions = document.createElement('div'); actions.className = 'actions';
      actions.append(button('查看图片', () => preview(group.id)));
      for (const [action, label] of [['publish', '发布'], ['reject', '拒绝'], ['withdraw', '撤回']]) {
        const control = button(label, async () => {
          if (!confirm(label + '“' + group.name + '”？')) return;
          await api('/groups/' + group.id + '/moderate', 'POST', { action });
          clearPreview(); await refresh(); status('已' + label);
        });
        control.disabled = !group.asset_count;
        actions.append(control);
      }
      if (group.asset_count) actions.append(button('清理图片', async () => {
        if (!confirm('清理“' + group.name + '”的全部云端图片？此操作不可恢复，审核记录保留。')) return;
        await api('/groups/' + group.id, 'DELETE'); clearPreview(); await refresh(); status('已清理图片并释放容量');
      }, true));
      if (group.user_id) actions.append(button(group.blocked ? '恢复作者投稿' : '暂停作者投稿', async () => {
        if (!confirm((group.blocked ? '恢复' : '暂停') + '此作者的投稿权限？')) return;
        await api('/users/' + group.user_id + '/block', 'POST', { blocked: !group.blocked });
        await refresh(); status('作者投稿权限已更新');
      }, !group.blocked));
      row.append(title, metadata, actions); list.append(row);
    }
    for (const upload of data.incomplete_uploads) {
      const row = document.createElement('article');
      const label = document.createElement('p'); label.textContent = '未完成上传：' + upload.group_id;
      row.append(label, button('清理残留', async () => {
        if (!confirm('删除此次未完成上传的残留图片并释放预留容量？')) return;
        await api('/groups/' + upload.group_id, 'DELETE'); await refresh(); status('残留已清理');
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
      await refresh(); byId('work').hidden = false; byId('login').hidden = true; byId('token').value = '';
      status(setup ? '数据库结构已补全，已登录' : '已登录');
    } catch (error) { token = ''; status(error.message); }
    finally { loggingIn = false; controls.forEach(control => { control.disabled = false; }); }
  }
  byId('login').onsubmit = event => { event.preventDefault(); void login(); };
  byId('setup').onclick = () => login(true);
  byId('logout').onclick = () => {
    token = ''; clearPreview(); byId('groups').replaceChildren(); byId('work').hidden = true; byId('login').hidden = false; status('已退出');
  };
  byId('refresh').onclick = () => refresh().catch(error => status(error.message));
  byId('upload').onsubmit = async event => {
    event.preventDefault(); const file = byId('package').files[0]; if (!file) return;
    const control = byId('submit'); control.disabled = true; status('上传中…');
    try {
      if (file.size > 18 * 1024 * 1024) throw new Error('组包过大');
      const payload = JSON.parse(await file.text());
      payload.author_name = byId('author').value; payload.description = byId('description').value;
      await api('/submissions', 'POST', payload); await refresh(); status('已收稿，等待审核');
      byId('package').value = '';
    } catch (error) { status(error.message); }
    finally { control.disabled = false; }
  };
}

function playerClient() {
  const byId = id => document.getElementById(id);
  let csrf = '', user = null, busy = false, updateId = '';
  const urls = [];
  const labels = { pending: '待审核', published: '已发布', rejected: '已拒绝', withdrawn: '已撤回', draft: '清理待完成' };
  const errors = {
    login_required: '登录已过期，请重新登录', csrf_failed: '登录状态已变化，请刷新页面',
    discord_not_configured: 'Discord 登录尚未配置完成', player_blocked: '此账号已暂停投稿',
    player_uploads_paused: '工坊暂时停止接收投稿', rights_confirmation_required: '请确认图片分享权',
    player_daily_limit: '已达到最近 24 小时投稿额度（5 次 / 36 MiB）', player_rate_limit: '请至少间隔一分钟再投稿',
    player_pending_limit: '最多保留 3 组待审核投稿', player_global_daily_limit: '工坊今日收稿额度已满，请稍后再试',
    local_images_required: '投稿组包需要包含图片数据，不能使用图片直链',
    image_too_large: '单图最多 2 MiB', group_too_large: '整组图片最多 12 MiB', request_too_large: '组包最多 18 MiB',
    invalid_item_count: '每组需要 1 至 24 张图片', invalid_image: '图片格式或文件头无效',
    invalid_metadata: '名称、标签或说明不符合长度要求', invalid_portrait_id: '立绘 ID 无效或重复',
    invalid_group_package: '不是镜待流年版本 1 立绘组包', capacity_exceeded: '云端容量不足',
    upload_incomplete: '上次上传尚未确认完成，请查看我的投稿；没有记录时联系管理员检查残留',
    upload_failed: '上传失败，已清理本次云端图片，可以重试', previous_upload_failed: '上次上传已失败，再点提交即可重试',
    group_has_no_assets: '图片已被清理', group_being_cleaned: '该组正在清理', not_found: '该投稿不存在',
    revision_source_unavailable: '原投稿已变化或图片已清理，请刷新后重新选择',
    revision_already_exists: '已有待审更新或已被新版替换，请维护对应新版',
    service_unavailable: '服务暂时不可用，请稍后重试',
  };
  const status = message => { byId('status').textContent = message; };
  async function api(path, method = 'GET', body, requestId) {
    const response = await fetch('/account/api' + path, {
      method, credentials: 'same-origin', signal: AbortSignal.timeout(method === 'POST' ? 90000 : 20000),
      headers: { ...(method !== 'GET' ? { 'x-csrf-token': csrf } : {}), ...(body ? { 'content-type': 'application/json' } : {}),
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
  function clearPreview() {
    urls.splice(0).forEach(url => URL.revokeObjectURL(url));
    byId('preview').replaceChildren();
  }
  async function preview(id) {
    clearPreview();
    const { group, assets } = await (await api('/groups/' + id)).json();
    const heading = document.createElement('h2'); heading.textContent = group.name; byId('preview').append(heading);
    for (const asset of assets) {
      const image = document.createElement('img'); image.alt = asset.character_name + ' · ' + asset.tag;
      const response = await api('/assets/' + asset.id);
      const url = URL.createObjectURL(await response.blob()); urls.push(url); image.src = url;
      const figure = document.createElement('figure'), caption = document.createElement('figcaption'); caption.textContent = image.alt;
      figure.append(image, caption); byId('preview').append(figure);
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
        title.textContent = group.name; metadata.textContent = (labels[group.status] || group.status) + ' · ' + group.asset_count + ' 张';
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
              updateId = group.id; byId('update-target').textContent = '更新：' + group.name;
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
  byId('upload').onsubmit = async event => {
    event.preventDefault();
    const file = byId('package').files[0]; if (!file || !user || busy) return;
    busy = true; byId('submit').disabled = true; status('正在上传…');
    let keyName;
    try {
      if (file.size > 18 * 1024 * 1024) throw new Error(errors.request_too_large);
      const content = await file.text();
      const target = updateId;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([target, content, byId('description').value, byId('rights').checked])));
      keyName = 'jdnl-submission-' + user.id + '-' + Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
      let key = sessionStorage.getItem(keyName);
      if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(keyName, key); }
      const payload = JSON.parse(content);
      payload.description = byId('description').value;
      payload.rights_confirmed = byId('rights').checked;
      const result = await (await api(target ? '/groups/' + target + '/update' : '/submissions', 'POST', payload, key)).json();
      sessionStorage.removeItem(keyName);
      byId('package').value = ''; byId('package-name').textContent = ''; byId('rights').checked = false;
      resetUpdate(); await refresh();
      status(result.repeated ? '已确认上次投稿：' + (labels[result.status] || result.status) : target
        ? '更新已提交审核，审核通过后替换旧版；本地图库保持不变' : '上传成功，等待审核；本地图库保持不变');
    } catch (error) {
      if (keyName && ['upload_failed', 'previous_upload_failed'].includes(error.code)) sessionStorage.removeItem(keyName);
      status(error.name === 'TimeoutError' || error.name === 'TypeError' ? '连接中断，请刷新我的投稿核对状态；重新提交同一文件不会重复入库' : error.message);
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
  <form id="upload"><div id="update-mode" class="bar" hidden><span id="update-target"></span><button id="cancel-update" type="button">取消更新</button></div><label for="package">本地立绘组包</label><input id="package" type="file" accept="application/json,.json" required><small id="package-name"></small>
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
  #status{position:sticky;bottom:0;margin-top:20px;padding:10px;background:#e6eef2;border-left:3px solid #44788c;overflow-wrap:anywhere}
  #preview{display:flex;gap:16px;flex-wrap:wrap;margin-top:24px}#preview h2{width:100%}figure{width:220px;margin:0}figure img{width:100%;height:260px;object-fit:contain;background:#e8edf1}figcaption{overflow-wrap:anywhere}
  [hidden]{display:none!important}@media(max-width:480px){figure{width:100%}figure img{height:320px}}
  </style><header><h1>${title}</h1></header><main>${player ? playerBody : `
  <form id="login"><label for="token">管理员口令</label><input id="token" type="password" autocomplete="off" required><div class="actions"><button>登录</button><button id="setup" type="button">补全数据库结构</button></div></form>
  <section id="work" hidden><div class="bar"><span id="quota"></span><button id="refresh">刷新</button><button id="logout">退出</button></div>
  <h2>导入投稿</h2><form id="upload"><label for="package">立绘组包</label><input id="package" type="file" accept="application/json,.json" required>
  <label for="author">作者</label><input id="author" maxlength="80"><label for="description">组说明</label><textarea id="description" maxlength="1000"></textarea><button id="submit">上传待审组</button></form>
  <h2>审核与发布</h2><div id="groups"></div><div id="preview"></div></section>`}<div id="status" role="status">未登录</div></main>
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
        if (parts.length === 3 && parts[2] === 'setup' && request.method === 'POST') return await setupDatabase(request, env.DB);
        if (parts.length === 3 && parts[2] === 'summary' && request.method === 'GET') return await adminSummary(env.DB);
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
      if (parts.length === 3 && parts[0] === 'groups' && parts[2] === 'export') return await exportGroup(env.DB, parts[1], url.origin);
      if (parts.length === 2 && parts[0] === 'groups') return await getGroup(env.DB, parts[1]);
      if (parts.length === 2 && parts[0] === 'assets') return await getAsset(env.DB, env.PORTRAITS_BUCKET, parts[1]);
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      const respond = parts[0] === 'account' || parts[0] === 'auth' ? privateJson : json;
      if (error instanceof ApiError) return respond({ error: error.message }, error.status);
      const message = String(error?.message);
      if (message.includes('workshop_capacity_exceeded')) return respond({ error: 'capacity_exceeded' }, 409);
      for (const code of ['revision_source_unavailable', 'revision_already_exists', 'revision_superseded']) {
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
