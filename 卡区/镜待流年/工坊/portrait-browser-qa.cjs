const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../../src/镜待流年');
const files = ['界面/shared/portrait-catalog.ts', '界面/shared/portrait-storage.ts', '界面/shared/portrait-workshop.ts', '脚本/立绘渲染/selection.ts', '脚本/立绘渲染/runtime.ts', '脚本/立绘渲染/dom.ts', '脚本/立绘渲染/index.ts'];
const scripts = () => {
  const definitions = files.map(file => {
    const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
    return `modules[${JSON.stringify(path.basename(file, '.ts'))}] = function(exports, require) { ${source}\n };`;
  }).join('\n');
  return `const modules = {}, cache = {}; ${definitions}\nfunction require(name) { const key=name.split('/').pop(); if(cache[key]) return cache[key]; const exports={}; cache[key]=exports; modules[key](exports,require); return exports; } window.productionModules={require};`;
};
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
let recovered = false;
const counts = {};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/modules.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(scripts()); return; }
  if (url.pathname === '/harness.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(path.join(__dirname, 'portrait-browser-fixture.js'))); return; }
  if (url.pathname === '/recover') { recovered = true; res.end('ok'); return; }
  if (url.pathname === '/reset') { recovered = false; for (const key of Object.keys(counts)) delete counts[key]; res.end('ok'); return; }
  if (url.pathname === '/counts') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(counts)); return; }
  if (url.pathname === '/asset.png') { res.setHeader('Content-Type', 'image/png'); res.end(Buffer.from(png.split(',')[1], 'base64')); return; }
  if (url.pathname.startsWith('/asset/')) {
    const id = url.pathname.split('/').pop(); counts[id] = (counts[id] || 0) + 1;
    if (id.startsWith('bad') || id.startsWith('recover') && !recovered) { res.writeHead(404); res.end('missing'); return; }
    const color = id.includes('second') ? '#927261' : '#657966';
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="200"><rect width="420" height="200" fill="${color}"/><text x="210" y="95" fill="white" text-anchor="middle" font-size="24">合成立绘 · ${id.replace(/[^a-zA-Z0-9_-]/g, '')}</text><text x="210" y="133" fill="#eee" text-anchor="middle" font-size="16">仅用于生产脚本隔离验证</text></svg>`); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="zh"><meta charset="utf-8"><title>镜待流年 · 实装验证</title><style>body{margin:24px;background:#f4f0e7;color:#493f35;font:15px/1.6 system-ui}main{max-width:1050px;margin:auto}h1{font-size:25px}button{padding:8px 16px;cursor:pointer}.controls{display:flex;gap:12px}.mes{margin:12px 0;padding:12px;background:#fff;border:1px solid #d9cebb;border-radius:8px}.mes_text{max-width:650px}.pass{color:#276535}.fail{color:#b32121}#results{columns:2;padding-left:23px}#prompt{font-size:12px;white-space:pre-wrap}#summary{font-weight:bold}.jdnl-portrait img{max-height:200px!important}@media(max-width:650px){body{margin:12px}#results{columns:1}.controls{flex-wrap:wrap}}</style><main><h1>镜待流年 · 分类立绘实装验证</h1><p>运行的是当前生产脚本。酒馆上下文采用隔离适配器，本页面数据仅存于独立本地测试源。</p><div class="controls"><button id="run">运行集成测试</button><button id="reload">刷新验证持久化</button></div><p id="summary">准备测试</p><ol id="results"></ol><section id="chat"></section><details><summary>实际注入目录</summary><pre id="prompt"></pre></details></main><script src="/modules.js"></script><script src="/harness.js"></script></html>`);
});
const port = Number(process.env.JDNL_PORTRAIT_QA_PORT || 18797);
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Production QA: http://127.0.0.1:${server.address().port}/`));
process.on('SIGINT', () => server.close());
