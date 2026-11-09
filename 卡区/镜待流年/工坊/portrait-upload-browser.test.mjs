import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import worker from './worker.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.JDNL_PLAYWRIGHT_MODULE || 'playwright');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
let uploads = 0, finishes = 0, manifests = 0, historyRequests = 0;
let activeGroups = [{ id: 'pending-qa', name: '正常待审核投稿', status: 'pending', asset_count: 23 }];
const historyGroups = Array.from({ length: 25 }, (_, n) => ({ id: 'archive-' + n, name: '已清空旧记录 ' + n, status: 'withdrawn', asset_count: 0 }));
const server = http.createServer(async (req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (req.url === '/submit') {
    const response = await worker.fetch(new Request('https://qa.example/submit'), {});
    res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
  }
  const json = (value, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
  if (req.url === '/account/api/me') return json({ user: { id: 'qa-user', name: '隔离测试作者', blocked: false }, csrf_token: 'qa-csrf', uploads_enabled: true });
  const url = new URL(req.url, 'http://qa.local');
  if (url.pathname === '/account/api/submissions' && req.method === 'GET') {
    if (url.searchParams.get('view') === 'history') {
      historyRequests++; const offset = Number(url.searchParams.get('cursor') || 0);
      return json({ groups: historyGroups.slice(offset, offset + 20), next_cursor: offset + 20 < historyGroups.length ? String(offset + 20) : null });
    }
    return json({ groups: url.searchParams.get('view') === 'active' ? activeGroups : [...historyGroups, ...activeGroups], next_cursor: null });
  }
  if (url.pathname === '/account/api/groups/pending-qa' && req.method === 'DELETE') {
    historyGroups.unshift({ ...activeGroups[0], status: 'withdrawn', asset_count: 0 }); activeGroups = []; return json({ status: 'deleted' });
  }
  if (req.url === '/account/api/submissions' && req.method === 'POST') {
    manifests++; for await (const chunk of req) {} return json({ group_id: 'qa-draft', status: 'draft', uploaded_ids: [] }, 201);
  }
  if (req.method === 'PUT') {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), png); uploads++; return json({ uploaded: true });
  }
  if (req.url.endsWith('/finish')) { finishes++; return json({ status: 'pending' }, 201); }
  return json({ error: 'not_found' }, 404);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: process.env.JDNL_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const browserErrors = [], checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); });
  await page.goto(origin + '/submit'); await page.waitForFunction(() => !document.getElementById('work').hidden);
  await page.waitForSelector('#groups article');
  assert.equal(await page.locator('#groups article').count(), 1);
  assert.match(await page.locator('#groups').textContent(), /正常待审核投稿/);
  assert(!(await page.locator('#history').evaluate(element => element.open)));
  assert.equal(historyRequests, 0); checks.push('Active submissions remain visible without loading cleared history');
  await page.locator('#history summary').click(); await page.waitForFunction(() => document.querySelectorAll('#history-groups article').length === 20);
  await page.locator('#history-more').click(); await page.waitForFunction(() => document.querySelectorAll('#history-groups article').length === 25);
  assert.equal(historyRequests, 2); checks.push('Cleared history loads only on demand and paginates separately');
  await page.locator('#history summary').click();
  await page.screenshot({ path: new URL('../../../_release/v232/history-preview.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
  const payload = { format: 'jdnl-portrait-group', version: 1, group: { name: '上传回归组', items: [{ id: 'entry-1', name: '光辉', tag: '出场', url: 'data:image/png;base64,' + png.toString('base64') }] } };
  await page.locator('#package').setInputFiles({ name: 'group.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
  await page.locator('#rights').check(); await page.locator('#submit').click();
  await page.waitForFunction(() => /上传成功|连接中断|失败/.test(document.getElementById('status').textContent));
  const status = await page.locator('#status').textContent();
  fs.writeFileSync(new URL('../../../_local_previews/workshop-20261109/upload-result.json', import.meta.url), JSON.stringify({ status, manifests, uploads, finishes, browserErrors }, null, 2));
  const embeddedUploads = uploads;
  await page.locator('#package').setInputFiles([]);
  await page.locator('#group-name').fill('本地批量图片'); await page.locator('#images').setInputFiles({ name: '出场.png', mimeType: 'image/png', buffer: png });
  await page.locator('#rights').check(); await page.locator('#submit').click();
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('上传成功'));
  console.log(JSON.stringify({ embeddedStatus: status, embeddedUploads, directFileUploads: uploads - embeddedUploads, browserErrors }));
  assert.equal(uploads - embeddedUploads, 1, 'Direct file upload must stay functional');
  assert.equal(embeddedUploads, 1, 'Embedded group image must upload under production CSP. Status: ' + status);
  assert.equal(finishes, 2); checks.push('JSON group uploads embedded image under production CSP', 'Direct file upload stays functional');
  assert(!(await page.locator('#history').evaluate(element => element.open)));
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#groups article').getByRole('button', { name: '删除云端图片', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('groups').textContent === '暂无当前投稿');
  assert.equal(await page.locator('#groups article').count(), 0);
  assert(!(await page.locator('#history').evaluate(element => element.open)));
  checks.push('Deleting images moves the empty record out of the active list immediately');
  console.log(JSON.stringify({ checks, uploads, finishes, browserErrors }));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
