const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(require.resolve('playwright', { paths: ['C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'] }));

const root = path.resolve(__dirname, '../../../src/镜待流年');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const modules = `
  const portraitStorage = (() => { const exports = {}; ${compile('界面/shared/portrait-storage.ts')} return exports; })();
  const portraitDom = (() => { const exports = {}; ${compile('脚本/立绘渲染/dom.ts')} return exports; })();
  const portraitWorkshop = (() => { const exports = {}; ${compile('界面/shared/portrait-workshop.ts')} return exports; })();
  window.portraitStorage = portraitStorage;
  window.portraitWorkshop = portraitWorkshop;
  (() => { const exports = {}; const require = name => name.endsWith('/dom') ? portraitDom : portraitStorage;
    ${compile('脚本/立绘渲染/index.ts')}
  })();
`;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

async function main() {
  const server = http.createServer((req, res) => {
    if (req.url === '/asset.png') { res.setHeader('Content-Type', 'image/png'); res.setHeader('Access-Control-Allow-Origin', '*'); res.end(Buffer.from(png.split(',')[1], 'base64')); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head></head><body><div class="mes_text"><p>段落一</p><p>&lt;portrait id="奥罗拉-日常"&gt;</p><p>段落二</p></div></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => {
      window.$ = callback => typeof callback === 'function' ? callback() : { one: () => {} };
      window.injectPrompts = prompts => { window.promptText = prompts[0].content; return { uninject() { window.promptText = ''; } }; };
    });
    await page.addScriptTag({ content: modules });
    const portable = await page.evaluate(async port => {
      const group = await window.portraitWorkshop.portablePortraitGroup({ id: 'cloud', name: '云端', items: [{ id: 'cloud-1', name: '图片', tag: '日常', url: `http://127.0.0.1:${port}/asset.png` }] });
      return group.items[0].url;
    }, server.address().port);
    assert.equal(portable, png);
    const saved = await page.evaluate(async png => {
      const large = 'data:image/png;base64,' + 'A'.repeat(1_600_000);
      await window.portraitStorage.savePortraitGroups([{ id: 'default', name: '默认组', items: [{ id: 'large', name: '大图', tag: '日常', url: large }] }]);
      const fromDb = await window.portraitStorage.loadPortraitGroups();
      await window.portraitStorage.savePortraitGroups([{ id: 'default', name: '默认组', items: [{ id: '奥罗拉-日常', name: '奥罗拉', tag: '日常', url: png }] }]);
      return [fromDb[0].items[0].url.length, localStorage.getItem('jdnl_portrait_groups_v1')];
    }, png);
    assert.equal(saved[0], 1_600_022);
    assert.equal(saved[1], null);
    await page.waitForFunction(() => document.querySelector('.jdnl-portrait img')?.getAttribute('src')?.startsWith('data:image/png'));
    assert.equal(await page.locator('.jdnl-portrait').count(), 1);
    assert.equal(await page.locator('.mes_text p').count(), 3);
    assert.equal(await page.evaluate(() => window.promptText.includes('奥罗拉-日常')), true);
    const reactiveSaved = await page.evaluate(async () => {
      const wrappedItems = new Proxy([{ id: 'proxy', name: '代理项', tag: '日常', url: 'https://example.com/p.png' }], {
        get(target, key, receiver) {
          if (key === 'map') return callback => new Proxy(Array.prototype.map.call(target, callback), {});
          return Reflect.get(target, key, receiver);
        },
      });
      await window.portraitStorage.savePortraitGroups([{ id: 'default', name: '默认组', items: wrappedItems }]);
      return (await window.portraitStorage.loadPortraitGroups())[0].items[0].id;
    });
    assert.equal(reactiveSaved, 'proxy');
    assert.deepEqual(errors, []);
    console.log('PASS: 1.6 MB IndexedDB round trip; portrait marker renders at paragraph; prompt uses current catalog');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
