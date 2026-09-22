const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require(process.env.DEATH_ADAPTATION_PLAYWRIGHT || 'playwright');
const { frontendLoader } = require('../tools/loader.cjs');
const root = path.resolve(__dirname, '..');
const finish = ts.transpileModule(fs.readFileSync(path.join(root, '界面/loaded.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace('export ', '');
const loader = label => frontendLoader(`<div id="app">${label}已加载</div><script>${finish};finishLoading();</script>`, label);
(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/jquery.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(fs.readFileSync(require.resolve('jquery/dist/jquery.min.js'))); }
    else if (req.url === '/lib.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(fs.readFileSync(path.join(root, 'build/verification/tavern-lib.js'))); }
    else { res.setHeader('Content-Type', 'text/html;charset=utf-8'); res.end('<body></body>'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(async html => {
      const { showdown, DOMPurify } = await import('/lib.js');
      const rendered = DOMPurify.sanitize(new showdown.Converter().makeHtml(html));
      document.body.innerHTML = rendered;
      // 与现场观测一致，酒馆会为消息HTML里的class加custom-前缀。
      document.querySelectorAll('[class]').forEach(el => { el.className = el.className.split(/\s+/).map(x => 'custom-' + x).join(' '); });
    }, loader('封面') + '\n' + loader('状态栏'));
    assert.equal(await page.locator('[data-embers-note]').count(), 2);
    assert((await page.locator('body').innerText()).length < 500);
    assert.equal(await page.locator('pre').first().isVisible(), false);
    async function mount(label) {
      await page.evaluate(label => {
        const shell = document.querySelector(`[data-embers-shell="${label}"]`);
        const pre = shell.querySelector('pre');
        const wrapper = document.createElement('div'); wrapper.className = 'TH-render';
        pre.replaceWith(wrapper); wrapper.append(pre);
        const frame = document.createElement('iframe'); frame.id = 'TH-message--' + label;
        frame.srcdoc = '<script src="/jquery.js"></script>' + pre.querySelector('code').textContent;
        wrapper.append(frame);
      }, label);
      await page.locator(`[data-embers-shell="${label}"] [data-embers-note]`).waitFor({ state: 'detached' });
    }
    await mount('封面');
    assert.equal(await page.locator('[data-embers-shell="状态栏"] [data-embers-note]').count(), 1);
    await mount('状态栏');
    assert.equal(await page.locator('[data-embers-note]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: real iframe mount removes only its own loading note after ST class prefix rewriting; other message stays pending until ready.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
