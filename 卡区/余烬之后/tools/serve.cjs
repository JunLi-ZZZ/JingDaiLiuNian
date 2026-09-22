const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../build', require('../package.json').version);
const routes = new Map([
  ['/', '预览/index.html'],
  ['/preview', '预览/index.html'],
  ['/workshop', '预览/工坊.html'],
  ['/cards', '预览/卡片.html'],
  ['/cover', '预览/开局.html'],
  ['/status', '界面/状态栏/index.html'],
]);
const server = http.createServer((request, response) => {
  const file = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!file) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  try {
    const body = fs.readFileSync(path.join(root, file));
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch {
    response.writeHead(503);
    response.end('Build this card first.');
  }
});
server.listen(Number(process.env.EMBERS_PREVIEW_PORT || 8137), '127.0.0.1', () => console.log('Embers preview: http://127.0.0.1:'+server.address().port+'/'));
