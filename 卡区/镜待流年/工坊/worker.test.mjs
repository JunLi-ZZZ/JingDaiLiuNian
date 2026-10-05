import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import worker from './worker.mjs';

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('./migrations/002-storage.sql', import.meta.url), 'utf8');
const discordMigration = readFileSync(new URL('./migrations/003-discord.sql', import.meta.url), 'utf8');
const maintenanceMigration = readFileSync(new URL('./migrations/004-author-maintenance.sql', import.meta.url), 'utf8');
const ADMIN = 'test-only-admin-token-not-a-real-secret-123';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
function packageData() {
  return { format: 'jdnl-portrait-group', version: 1, group: { name: '测试组', items: [
    { id: '测试角色-常服', name: '测试角色', tag: '常服', caption: '', url: PNG },
  ] } };
}

function environment({ migrations = true, base = true } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  if (base) sqlite.exec(schema);
  if (migrations) {
    sqlite.exec(migration);
    sqlite.exec(discordMigration);
    sqlite.exec(maintenanceMigration);
  }
  const db = {
    prepare(query) {
      return {
        bind(...values) {
          return {
            first: async () => sqlite.prepare(query).get(...values) || null,
            all: async () => ({ results: sqlite.prepare(query).all(...values) }),
            run: async () => ({ meta: sqlite.prepare(query).run(...values) }),
            execute: () => sqlite.prepare(query).run(...values),
          };
        },
        first: async () => sqlite.prepare(query).get() || null,
        all: async () => ({ results: sqlite.prepare(query).all() }),
        run: async () => ({ meta: sqlite.prepare(query).run() }),
        execute: () => sqlite.prepare(query).run(),
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = statements.map(statement => ({ meta: statement.execute() })); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const bucket = {
    reads: [],
    objects: new Map([['approved/image.webp', new Uint8Array([1, 2, 3])]]),
    async get(key) {
      this.reads.push(key);
      const bytes = this.objects.get(key);
      return bytes ? { body: bytes, size: bytes.length } : null;
    },
    async put(key, value) { this.objects.set(key, value); },
    async delete(key) { this.objects.delete(key); },
    async list({ prefix }) { return { objects: [...this.objects.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })), truncated: false }; },
  };
  return { sqlite, DB: db, PORTRAITS_BUCKET: bucket, ADMIN_TOKEN: ADMIN };
}

async function request(path, env) {
  return worker.fetch(new Request(`https://example.workers.dev${path}`), env);
}

async function adminRequest(path, env, method = 'GET', data) {
  return worker.fetch(new Request(`https://example.workers.dev/admin/api${path}`, {
    method, headers: { authorization: `Bearer ${ADMIN}`, origin: 'https://example.workers.dev', ...(data ? { 'content-type': 'application/json' } : {}) },
    body: data ? JSON.stringify(data) : undefined,
  }), env);
}

test('admin setup completes missing migrations with the same structure as SQL files', async () => {
  const env = environment({ migrations: false });
  const expected = environment();
  const response = await adminRequest('/setup', env, 'POST');
  assert.equal(response.status, 200);
  const structures = sqlite => sqlite.prepare("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name")
    .all().map(row => ({ ...row, sql: row.sql.replace(/\s+/g, ' ').trim() }));
  assert.deepEqual(structures(env.sqlite), structures(expected.sqlite));
  assert.equal((await adminRequest('/summary', env)).status, 200);
});

test('admin setup repairs missing triggers and preserves existing quota, assets and sessions', async () => {
  const env = environment();
  const { group_id } = await (await adminRequest('/submissions', env, 'POST', packageData())).json();
  env.sqlite.exec(`UPDATE workshop_quota SET limit_bytes = 123456;
    INSERT INTO workshop_users (discord_id, display_name) VALUES ('123456789012345678', 'Existing');
    INSERT INTO workshop_sessions VALUES ('existing-session', '123456789012345678', 'csrf', 9999999999);
    DROP TRIGGER reserve_storage_limit; DROP TRIGGER player_upload_limit;`);
  const snapshot = table => env.sqlite.prepare('SELECT * FROM ' + table).all();
  const tables = ['portrait_groups', 'portrait_assets', 'portrait_submissions', 'storage_reservations', 'workshop_users', 'workshop_sessions', 'workshop_quota'];
  const before = tables.map(snapshot);
  for (let i = 0; i < 2; i++) assert.equal((await adminRequest('/setup', env, 'POST')).status, 200);
  assert.deepEqual(tables.map(snapshot), before);
  assert.ok(env.sqlite.prepare('SELECT id FROM portrait_groups WHERE id = ?').get(group_id));
  assert.throws(() => env.sqlite.prepare('INSERT INTO storage_reservations (group_id, byte_size) VALUES (?, ?)').run('over-quota', 123456), /workshop_capacity_exceeded/);
  env.sqlite.exec("UPDATE workshop_users SET blocked = 1");
  assert.throws(() => env.sqlite.prepare('INSERT INTO player_upload_attempts (group_id, user_id, request_key, byte_size) VALUES (?, ?, ?, ?)')
    .run('blocked-upload', '123456789012345678', 'blocked-key', 1), /player_blocked/);
});

test('admin setup rejects unauthorized, cross-origin and arbitrary SQL requests', async () => {
  const env = environment({ migrations: false });
  const call = (headers, body) => worker.fetch(new Request('https://example.workers.dev/admin/api/setup', { method: 'POST', headers, body }), env);
  assert.equal((await call({ origin: 'https://example.workers.dev' })).status, 401);
  assert.equal((await call({ authorization: `Bearer ${ADMIN}`, origin: 'https://other.example' })).status, 403);
  assert.equal((await call({ authorization: `Bearer ${ADMIN}` })).status, 403);
  assert.equal((await adminRequest('/setup', env, 'POST', { sql: 'DROP TABLE portrait_groups' })).status, 400);
  assert.equal(env.sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'workshop_users'").get().n, 0);
  assert.equal((await adminRequest('/setup', env)).status, 404);
});

test('admin setup accepts an empty transport stream but rejects actual body bytes', async () => {
  const env = environment({ migrations: false });
  const call = body => worker.fetch(new Request('https://example.workers.dev/admin/api/setup', {
    method: 'POST', headers: { authorization: `Bearer ${ADMIN}`, origin: 'https://example.workers.dev' }, body,
  }), env);
  assert.notEqual(new Request('https://example.workers.dev', { method: 'POST', body: new Uint8Array() }).body, null);
  assert.equal((await call(new Uint8Array())).status, 200);
  for (const body of [' ', 'DROP TABLE portrait_groups', new Uint8Array([0])]) {
    const response = await call(body);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'setup_body_not_allowed');
  }
  assert.equal((await adminRequest('/summary', env)).status, 200);
});

test('setup and the storage SQL can be rerun even when existing assets fill the quota', async () => {
  const env = environment();
  assert.equal((await adminRequest('/submissions', env, 'POST', packageData())).status, 201);
  env.sqlite.exec('UPDATE workshop_quota SET limit_bytes = (SELECT SUM(byte_size) FROM storage_reservations)');
  assert.equal((await adminRequest('/setup', env, 'POST')).status, 200);
  assert.doesNotThrow(() => env.sqlite.exec(migration));
});

test('admin setup reports absent base tables and rolls back failed migrations', async () => {
  const empty = environment({ base: false, migrations: false });
  const response = await adminRequest('/setup', empty, 'POST');
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'base_schema_missing');
  const env = environment({ migrations: false });
  env.sqlite.exec('CREATE VIEW oauth_states AS SELECT 1 AS incompatible');
  assert.equal((await adminRequest('/setup', env, 'POST')).status, 503);
  assert.equal(env.sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'workshop_quota'").get().n, 0);
});

test('schema accepts groups, assets and review records', () => {
  const env = environment();
  for (const table of ['portrait_groups', 'portrait_assets', 'portrait_submissions', 'moderation_events']) {
    assert.equal(env.sqlite.prepare('SELECT name FROM sqlite_master WHERE name = ?').get(table)?.name, table);
  }
});

test('public endpoints expose only published groups and assets', async () => {
  const env = environment();
  env.sqlite.exec(`
    INSERT INTO portrait_groups (id, name, status) VALUES
      ('group-a', 'Approved', 'published'), ('group-b', 'Hidden', 'pending');
    INSERT INTO portrait_assets (id, group_id, portrait_id, character_name, tag, r2_key, content_type, byte_size, status) VALUES
      ('asset-a', 'group-a', 'pose-a', 'Character', 'Pose', 'approved/image.webp', 'image/webp', 3, 'published'),
      ('asset-b', 'group-a', 'pose-b', 'Character', 'Pose', 'pending/image.webp', 'image/webp', 3, 'pending'),
      ('asset-c', 'group-b', 'pose-c', 'Character', 'Pose', 'hidden/image.webp', 'image/webp', 3, 'published');
  `);

  assert.deepEqual(await (await request('/health', env)).json(), { status: 'ok' });
  const listing = await (await request('/groups', env)).json();
  assert.equal(listing.groups.length, 1);
  assert.equal(listing.groups[0].name, 'Approved');
  assert.equal(listing.groups[0].asset_count, 1);

  const detail = await (await request('/groups/group-a', env)).json();
  assert.deepEqual(detail.assets.map(asset => asset.id), ['asset-a']);
  assert.equal((await request('/groups/group-b', env)).status, 404);

  const image = await request('/assets/asset-a', env);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/webp');
  assert.deepEqual(env.PORTRAITS_BUCKET.reads, ['approved/image.webp']);
  assert.equal((await request('/assets/asset-b', env)).status, 404);
  assert.equal((await request('/assets/asset-c', env)).status, 404);
  assert.deepEqual(env.PORTRAITS_BUCKET.reads, ['approved/image.webp']);
});

test('unconfigured bindings fail closed', async () => {
  const response = await request('/groups', {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'bindings_unavailable' });
});

test('admin API fails closed without a secret or with a wrong token', async () => {
  const env = environment();
  assert.equal((await request('/admin/api/summary', env)).status, 401);
  env.ADMIN_TOKEN = '';
  assert.equal((await adminRequest('/summary', env)).status, 503);
});

test('upload, preview, publish, export, withdraw and delete form a complete lifecycle', async () => {
  const env = environment();
  const response = await adminRequest('/submissions', env, 'POST', packageData());
  assert.equal(response.status, 201);
  const { group_id } = await response.json();
  const asset = env.sqlite.prepare('SELECT id FROM portrait_assets WHERE group_id = ?').get(group_id);
  assert.equal((await request(`/groups/${group_id}`, env)).status, 404);
  assert.equal((await request(`/assets/${asset.id}`, env)).status, 404);
  assert.equal((await adminRequest(`/assets/${asset.id}`, env)).status, 200);

  assert.equal((await adminRequest(`/groups/${group_id}/moderate`, env, 'POST', { action: 'publish' })).status, 200);
  const exported = await (await request(`/groups/${group_id}/export`, env)).json();
  assert.equal(exported.format, 'jdnl-portrait-group');
  assert.equal(exported.group.items[0].id, '测试角色-常服');
  assert.equal(exported.group.items[0].name, '测试角色');
  assert.equal(exported.group.items[0].url, `https://example.workers.dev/assets/${asset.id}`);

  assert.equal((await adminRequest(`/groups/${group_id}/moderate`, env, 'POST', { action: 'withdraw' })).status, 200);
  assert.equal((await request(`/groups/${group_id}/export`, env)).status, 404);
  assert.equal((await request(`/assets/${asset.id}`, env)).status, 404);
  assert.equal((await adminRequest(`/groups/${group_id}`, env, 'DELETE')).status, 200);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM moderation_events').get().count, 2);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM portrait_submissions').get().count, 1);
  assert.equal((await adminRequest(`/groups/${group_id}/moderate`, env, 'POST', { action: 'publish' })).status, 409);
  assert.equal([...env.PORTRAITS_BUCKET.objects.keys()].some(key => key.startsWith('portraits/')), false);
});

test('concurrent submissions cannot overrun the storage quota', async () => {
  const env = environment();
  const size = Buffer.from(PNG.split(',')[1], 'base64').length;
  env.sqlite.prepare('UPDATE workshop_quota SET limit_bytes = ?').run(size);
  const responses = await Promise.all([adminRequest('/submissions', env, 'POST', packageData()), adminRequest('/submissions', env, 'POST', packageData())]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
  assert.equal(env.sqlite.prepare('SELECT SUM(byte_size) AS used FROM storage_reservations').get().used, size);
});

test('bad formats, duplicate IDs, external URLs and oversize images are rejected before R2 writes', async () => {
  const env = environment();
  const invalid = [
    { ...packageData(), version: 2 },
    { ...packageData(), group: { name: 'empty', items: [] } },
  ];
  const duplicate = packageData(); duplicate.group.items.push({ ...duplicate.group.items[0] }); invalid.push(duplicate);
  const external = packageData(); external.group.items[0].url = 'http://localhost/secret'; invalid.push(external);
  const fake = packageData(); fake.group.items[0].url = 'data:image/png;base64,SGVsbG8='; invalid.push(fake);
  for (const data of invalid) assert.equal((await adminRequest('/submissions', env, 'POST', data)).status, 400);
  const oversize = packageData(); oversize.group.items[0].url = 'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64');
  assert.equal((await adminRequest('/submissions', env, 'POST', oversize)).status, 413);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
});

test('failed R2 uploads clean objects and release reservations', async () => {
  const env = environment();
  const data = packageData(); data.group.items.push({ ...data.group.items[0], id: 'second' });
  let count = 0;
  env.PORTRAITS_BUCKET.put = async function (key, bytes) { this.objects.set(key, bytes); if (++count === 2) throw new Error('simulated upload failure'); };
  assert.equal((await adminRequest('/submissions', env, 'POST', data)).status, 503);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
  assert.equal([...env.PORTRAITS_BUCKET.objects.keys()].some(key => key.startsWith('portraits/')), false);
});

test('failed cleanup retains the quota reservation for later recovery', async () => {
  const env = environment();
  env.PORTRAITS_BUCKET.put = async () => { throw new Error('simulated upload failure'); };
  env.PORTRAITS_BUCKET.delete = async () => { throw new Error('simulated delete failure'); };
  assert.equal((await adminRequest('/submissions', env, 'POST', packageData())).status, 503);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 1);
  const id = env.sqlite.prepare('SELECT group_id FROM storage_reservations').get().group_id;
  assert.equal((await adminRequest(`/groups/${id}`, env, 'DELETE')).status, 409);
});

test('admin page contains no token and cross-origin authenticated writes are blocked', async () => {
  const env = environment();
  const response = await request('/admin', env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.includes(ADMIN), false);
  assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  const attack = new Request('https://example.workers.dev/admin/api/submissions', {
    method: 'POST', headers: { origin: 'https://other.example', authorization: `Bearer ${ADMIN}` },
  });
  assert.equal((await worker.fetch(attack, env)).status, 403);
});

test('cleanup locks publishing and can resume after an R2 failure', async () => {
  const env = environment();
  const { group_id } = await (await adminRequest('/submissions', env, 'POST', packageData())).json();
  await adminRequest(`/groups/${group_id}/moderate`, env, 'POST', { action: 'publish' });
  const originalDelete = env.PORTRAITS_BUCKET.delete;
  env.PORTRAITS_BUCKET.delete = async () => {
    const response = await adminRequest(`/groups/${group_id}/moderate`, env, 'POST', { action: 'publish' });
    assert.equal(response.status, 409);
    assert.equal((await request(`/groups/${group_id}`, env)).status, 404);
    throw new Error('simulated cleanup interruption');
  };
  assert.equal((await adminRequest(`/groups/${group_id}`, env, 'DELETE')).status, 503);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM moderation_events').get().count, 1);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 1);
  env.PORTRAITS_BUCKET.delete = originalDelete;
  assert.equal((await adminRequest(`/groups/${group_id}`, env, 'DELETE')).status, 200);
  assert.equal(env.sqlite.prepare('SELECT status FROM portrait_groups WHERE id = ?').get(group_id).status, 'withdrawn');
});

test('additive storage migration can be rerun without changing an existing quota', () => {
  const env = environment();
  env.sqlite.exec('UPDATE workshop_quota SET limit_bytes = 123456 WHERE id = 1');
  env.sqlite.exec(migration);
  assert.equal(env.sqlite.prepare('SELECT limit_bytes FROM workshop_quota WHERE id = 1').get().limit_bytes, 123456);
});

const ORIGIN = 'https://example.workers.dev';
const DISCORD_USER = '1556568349285027932';
const digest = value => createHash('sha256').update(value).digest('hex');
function playerSession(env, id = DISCORD_USER) {
  const token = crypto.randomUUID().replaceAll('-', '').repeat(2);
  const csrf = crypto.randomUUID();
  env.sqlite.prepare('INSERT OR IGNORE INTO workshop_users (discord_id, display_name) VALUES (?, ?)').run(id, 'Test author');
  env.sqlite.prepare('INSERT INTO workshop_sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)')
    .run(digest(token), id, csrf, Math.floor(Date.now() / 1000) + 600);
  return { token, csrf, id };
}
function playerRequest(path, env, session, method = 'GET', data, key = crypto.randomUUID(), extraHeaders = {}) {
  return worker.fetch(new Request(ORIGIN + '/account/api' + path, {
    method, headers: { cookie: '__Host-jdnl-session=' + session.token, origin: ORIGIN,
      'x-csrf-token': session.csrf, 'x-request-id': key,
      ...(data !== undefined ? { 'content-type': 'application/json' } : {}), ...extraHeaders },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  }), env);
}
function playerPackage() { return { ...packageData(), rights_confirmed: true, author_name: 'Forged author' }; }
function authEnvironment() { return { ...environment(), DISCORD_CLIENT_SECRET: 'test-only-discord-secret-123456789' }; }
async function beginLogin(env) {
  const response = await request('/auth/discord', env);
  assert.equal(response.status, 303);
  const target = new URL(response.headers.get('location'));
  return { response, target, state: target.searchParams.get('state') };
}
function callback(env, state, query = 'code=test-code', cookieState = state) {
  return worker.fetch(new Request(ORIGIN + '/auth/discord/callback?state=' + state + '&' + query,
    { headers: { cookie: '__Host-jdnl-oauth=' + cookieState } }), env);
}

test('Discord authorize uses only identify, a private state cookie and hashed database state', async () => {
  const env = authEnvironment();
  const { response, target, state } = await beginLogin(env);
  assert.equal(target.origin, 'https://discord.com');
  assert.equal(target.searchParams.get('client_id'), DISCORD_USER);
  assert.equal(target.searchParams.get('scope'), 'identify');
  assert.equal(target.searchParams.get('redirect_uri'), ORIGIN + '/auth/discord/callback');
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.equal(env.sqlite.prepare('SELECT state_hash FROM oauth_states').get().state_hash, digest(state));
  assert.equal((await request('/auth/discord', environment())).status, 503);
});

test('Discord callback creates a session without storing Discord credentials; replay and wrong-browser states fail', async t => {
  const env = authEnvironment();
  const { state } = await beginLogin(env);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    if (String(url).endsWith('/oauth2/token')) {
      assert.equal(options.body.get('client_secret'), env.DISCORD_CLIENT_SECRET);
      assert.equal(options.body.get('grant_type'), 'authorization_code');
      return Response.json({ access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'Bearer', scope: 'identify' });
    }
    assert.equal(options.headers.authorization, 'Bearer test-access-token');
    return Response.json({ id: DISCORD_USER, username: 'test-user', global_name: 'Display name' });
  });
  assert.equal((await callback(env, state, 'code=test-code', 'different-browser')).status, 400);
  assert.equal(calls, 0);
  const response = await callback(env, state);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/submit');
  const cookies = response.headers.getSetCookie();
  const token = cookies.find(value => value.startsWith('__Host-jdnl-session=')).split(';')[0].split('=')[1];
  assert.match(token, /^[a-f0-9]{64}$/);
  const stored = env.sqlite.prepare('SELECT * FROM workshop_sessions').get();
  assert.equal(stored.token_hash, digest(token));
  assert.equal(JSON.stringify(stored).includes('test-access-token'), false);
  assert.equal(JSON.stringify(stored).includes('test-refresh-token'), false);
  assert.equal((await callback(env, state)).status, 400);
  assert.equal(calls, 2);
  const me = await (await playerRequest('/me', env, { token })).json();
  assert.equal(me.user.name, 'Display name');
});

test('cancelled, expired and failed Discord login never create a session', async t => {
  const env = authEnvironment();
  let login = await beginLogin(env);
  assert.equal((await callback(env, login.state, 'error=access_denied')).headers.get('location'), '/submit?login=cancelled');
  login = await beginLogin(env);
  env.sqlite.exec('UPDATE oauth_states SET expires_at = 0');
  assert.equal((await callback(env, login.state)).status, 400);
  login = await beginLogin(env);
  t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }));
  assert.equal((await callback(env, login.state)).headers.get('location'), '/submit?login=failed');
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM workshop_sessions').get().count, 0);
});

test('login rate limit and incremental Discord migration are enforced', async () => {
  const env = authEnvironment();
  env.sqlite.exec(discordMigration);
  for (let i = 0; i < 30; i++) assert.equal((await request('/auth/discord', env)).status, 303);
  assert.equal((await request('/auth/discord', env)).status, 429);
});

test('player writes require both same-origin and CSRF; logout invalidates the session', async () => {
  const env = environment(), session = playerSession(env);
  assert.equal((await request('/account/api/submissions', env)).status, 401);
  assert.equal((await playerRequest('/logout', env, session, 'POST', undefined, undefined, { origin: 'https://attack.example' })).status, 403);
  assert.equal((await playerRequest('/logout', env, session, 'POST', undefined, undefined, { 'x-csrf-token': 'wrong' })).status, 403);
  const me = await playerRequest('/me', env, session);
  assert.equal(me.headers.has('access-control-allow-origin'), false);
  assert.equal(me.headers.get('cache-control'), 'no-store');
  assert.equal((await playerRequest('/logout', env, session, 'POST')).status, 200);
  assert.equal((await playerRequest('/submissions', env, session)).status, 401);
});

test('player upload is attributed to the account, pending stays private and owners are isolated', async () => {
  const env = environment(), session = playerSession(env), other = playerSession(env, '1556568349285027999');
  const upload = await playerRequest('/submissions', env, session, 'POST', playerPackage());
  assert.equal(upload.status, 201);
  assert.equal(upload.headers.has('access-control-allow-origin'), false);
  const { group_id } = await upload.json();
  assert.equal(env.sqlite.prepare('SELECT author_name FROM portrait_groups WHERE id = ?').get(group_id).author_name, 'Test author');
  const asset = env.sqlite.prepare('SELECT id FROM portrait_assets WHERE group_id = ?').get(group_id).id;
  assert.equal((await request('/groups/' + group_id, env)).status, 404);
  assert.equal((await request('/assets/' + asset, env)).status, 404);
  assert.equal((await playerRequest('/groups/' + group_id, env, session)).status, 200);
  const image = await playerRequest('/assets/' + asset, env, session);
  assert.equal(image.status, 200);
  assert.equal(image.headers.has('access-control-allow-origin'), false);
  assert.equal((await playerRequest('/groups/' + group_id, env, other)).status, 404);
  assert.equal((await playerRequest('/assets/' + asset, env, other)).status, 404);
  assert.equal((await playerRequest('/groups/' + group_id + '/withdraw', env, other, 'POST')).status, 404);
  assert.equal((await playerRequest('/groups/' + group_id + '/withdraw', env, session, 'POST')).status, 200);
  assert.equal(env.sqlite.prepare('SELECT status FROM portrait_groups WHERE id = ?').get(group_id).status, 'withdrawn');
});

test('author update stays private until approval and atomically replaces its source', async () => {
  const env = environment(), session = playerSession(env);
  const { group_id: original } = await (await playerRequest('/submissions', env, session, 'POST', playerPackage())).json();
  assert.equal((await adminRequest('/groups/' + original + '/moderate', env, 'POST', { action: 'publish' })).status, 200);
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-2 minutes')");
  const key = crypto.randomUUID(), payload = playerPackage(); payload.group.name = '新版';
  const response = await playerRequest('/groups/' + original + '/update', env, session, 'POST', payload, key);
  assert.equal(response.status, 201);
  const { group_id: updated } = await response.json();
  assert.equal((await request('/groups/' + original, env)).status, 200);
  assert.equal((await request('/groups/' + updated, env)).status, 404);
  assert.equal((await playerRequest('/groups/' + original + '/update', env, session, 'POST', payload, key)).status, 200);
  assert.equal((await playerRequest('/groups/' + original + '/update', env, session, 'POST', payload)).status, 409);
  assert.equal((await adminRequest('/groups/' + updated + '/moderate', env, 'POST', { action: 'publish' })).status, 200);
  assert.equal((await request('/groups/' + updated, env)).status, 200);
  assert.equal((await request('/groups/' + original, env)).status, 404);
  assert.equal(env.sqlite.prepare('SELECT status FROM portrait_submissions WHERE group_id = ?').get(original).status, 'withdrawn');
  assert.equal((await adminRequest('/groups/' + original + '/moderate', env, 'POST', { action: 'publish' })).status, 409);
  const listing = await (await playerRequest('/submissions', env, session)).json();
  assert.equal(listing.groups.find(g => g.id === updated).source_group_id, original);
  assert.equal(listing.groups.find(g => g.id === original).replacement_id, updated);
});

test('author maintenance checks ownership and CSRF; deletion frees storage but preserves audit history', async () => {
  const env = environment(), session = playerSession(env), other = playerSession(env, '1556568349285027999');
  const { group_id: id } = await (await playerRequest('/submissions', env, session, 'POST', playerPackage())).json();
  for (const [path, method, payload] of [['/groups/' + id, 'DELETE'], ['/groups/' + id + '/update', 'POST', playerPackage()]]) {
    assert.equal((await playerRequest(path, env, other, method, payload)).status, 404);
    assert.equal((await playerRequest(path, env, session, method, payload, undefined, { 'x-csrf-token': 'wrong' })).status, 403);
  }
  env.sqlite.exec('UPDATE workshop_users SET blocked = 1');
  assert.equal((await playerRequest('/groups/' + id + '/update', env, session, 'POST', playerPackage())).status, 403);
  const asset = env.sqlite.prepare('SELECT id, r2_key FROM portrait_assets WHERE group_id = ?').get(id);
  assert.equal((await playerRequest('/groups/' + id, env, session, 'DELETE')).status, 200);
  assert.equal(env.PORTRAITS_BUCKET.objects.has(asset.r2_key), false);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM storage_reservations').get().n, 0);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM portrait_submissions WHERE group_id = ?').get(id).n, 1);
  assert.equal((await playerRequest('/assets/' + asset.id, env, session)).status, 404);
  assert.equal((await playerRequest('/groups/' + id, env, session, 'DELETE')).status, 200);
});

test('failed or rejected updates preserve their source, and source deletion invalidates approval', async () => {
  const env = environment(), session = playerSession(env);
  const { group_id: id } = await (await playerRequest('/submissions', env, session, 'POST', playerPackage())).json();
  await adminRequest('/groups/' + id + '/moderate', env, 'POST', { action: 'publish' });
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-2 minutes')");
  const put = env.PORTRAITS_BUCKET.put; env.PORTRAITS_BUCKET.put = async () => { throw new Error('simulated failure'); };
  assert.equal((await playerRequest('/groups/' + id + '/update', env, session, 'POST', playerPackage())).status, 503);
  assert.equal((await request('/groups/' + id, env)).status, 200);
  env.PORTRAITS_BUCKET.put = put;
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-2 minutes')");
  const { group_id: update } = await (await playerRequest('/groups/' + id + '/update', env, session, 'POST', playerPackage())).json();
  await adminRequest('/groups/' + update + '/moderate', env, 'POST', { action: 'reject' });
  assert.equal((await request('/groups/' + id, env)).status, 200);
  await playerRequest('/groups/' + id, env, session, 'DELETE');
  assert.equal((await adminRequest('/groups/' + update + '/moderate', env, 'POST', { action: 'publish' })).status, 409);
  assert.equal((await request('/groups/' + update, env)).status, 404);
});

test('concurrent updates allow one pending replacement and clean rejected transaction objects', async () => {
  const env = environment(), session = playerSession(env);
  const { group_id: id } = await (await playerRequest('/submissions', env, session, 'POST', playerPackage())).json();
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-2 minutes')");
  let injected = false;
  const put = env.PORTRAITS_BUCKET.put;
  env.PORTRAITS_BUCKET.put = async (...args) => {
    if (!injected) {
      injected = true;
      env.sqlite.exec(`INSERT INTO portrait_groups (id, name, status) VALUES ('racing', 'Race', 'pending');
        INSERT INTO portrait_group_owners VALUES ('racing', '${session.id}');
        INSERT INTO portrait_group_revisions VALUES ('racing', '${id}', 'pending');`);
    }
    return put.apply(env.PORTRAITS_BUCKET, args);
  };
  const response = await playerRequest('/groups/' + id + '/update', env, session, 'POST', playerPackage());
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'revision_already_exists');
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM storage_reservations').get().n, 1);
  assert.equal(env.PORTRAITS_BUCKET.objects.size, 2);
});

test('duplicate and concurrent request keys cannot duplicate an upload or its quota', async () => {
  const env = environment(), session = playerSession(env), key = crypto.randomUUID();
  const responses = await Promise.all([playerRequest('/submissions', env, session, 'POST', playerPackage(), key),
    playerRequest('/submissions', env, session, 'POST', playerPackage(), key)]);
  assert.equal(responses.filter(response => response.status === 201).length, 1);
  const repeated = await playerRequest('/submissions', env, session, 'POST', playerPackage(), key);
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).repeated, true);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM portrait_groups').get().count, 1);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 1);
  // Idempotency survives later logins, even after the daily quota window.
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-3 days')");
  await beginLogin({ ...env, DISCORD_CLIENT_SECRET: 'test-only-discord-secret-123456789' });
  assert.equal((await playerRequest('/submissions', env, session, 'POST', playerPackage(), key)).status, 200);
});

test('rights confirmation, account blocks and the global upload switch fail before R2 writes', async () => {
  const env = environment(), session = playerSession(env);
  assert.equal((await playerRequest('/submissions', env, session, 'POST', packageData())).status, 400);
  assert.equal((await playerRequest('/submissions', env, session, 'POST', null)).status, 400);
  env.PLAYER_UPLOADS_ENABLED = 'false';
  assert.equal((await playerRequest('/submissions', env, session, 'POST', playerPackage())).status, 503);
  delete env.PLAYER_UPLOADS_ENABLED;
  assert.equal((await adminRequest('/users/' + session.id + '/block', env, 'POST', { blocked: true })).status, 200);
  assert.equal((await playerRequest('/submissions', env, session, 'POST', playerPackage())).status, 403);
  assert.equal((await playerRequest('/me', env, session)).status, 200);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
});

test('player upload failure can be retried with a new key and does not consume pending slots', async () => {
  const env = environment(), session = playerSession(env), key = crypto.randomUUID();
  const originalPut = env.PORTRAITS_BUCKET.put;
  env.PORTRAITS_BUCKET.put = async () => { throw new Error('simulated player upload failure'); };
  const response = await playerRequest('/submissions', env, session, 'POST', playerPackage(), key);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'upload_failed');
  assert.equal(env.sqlite.prepare('SELECT outcome FROM player_upload_attempts').get().outcome, 'failed');
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
  assert.equal((await playerRequest('/submissions', env, session, 'POST', playerPackage(), key)).status, 409);
  env.sqlite.exec("UPDATE player_upload_attempts SET created_at = datetime('now', '-2 minutes')");
  env.PORTRAITS_BUCKET.put = originalPut;
  assert.equal((await playerRequest('/submissions', env, session, 'POST', playerPackage())).status, 201);
});

test('player rate, daily byte, count, pending and global quotas are enforced atomically', async () => {
  async function denied(seed, expected) {
    const env = environment(), session = playerSession(env);
    seed(env, session);
    const response = await playerRequest('/submissions', env, session, 'POST', playerPackage());
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error, expected);
    assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS count FROM storage_reservations').get().count, 0);
  }
  const seedAttempt = (env, session, n, bytes, time) => env.sqlite.prepare(
    'INSERT INTO player_upload_attempts (group_id, user_id, request_key, byte_size, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('previous-' + n, session.id, 'previous-key-' + n, bytes, time);
  const ago = minutes => new Date(Date.now() - minutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
  await denied((env, session) => seedAttempt(env, session, 0, 1, ago(0)), 'player_rate_limit');
  await denied((env, session) => { for (let n = 0; n < 5; n++) seedAttempt(env, session, n, 1, ago(120)); }, 'player_daily_limit');
  await denied((env, session) => seedAttempt(env, session, 0, 37748736, ago(120)), 'player_daily_limit');
  await denied((env, session) => { for (let n = 0; n < 3; n++) seedAttempt(env, session, n, 1, ago(2)); }, 'player_pending_limit');
  await denied(env => {
    for (let n = 0; n < 8; n++) {
      seedAttempt(env, playerSession(env, '155656834928502799' + n), n, 33554432, ago(120));
    }
  }, 'player_global_daily_limit');
});
