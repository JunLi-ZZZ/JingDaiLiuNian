const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.DEATH_ADAPTATION_PLAYWRIGHT || 'playwright');

(async () => {
  // 使用独立无头浏览器和临时上下文，不连接用户现有酒馆或浏览器资料。
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const output = path.resolve(__dirname, '../build/verification');
  fs.mkdirSync(output, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const file = path.resolve(__dirname, '../build', require('../package.json').version, '预览/index.html');
    await page.goto(pathToFileURL(file).href);
    const button = name => page.getByRole('button', { name, exact: true });
    const clock = () => page.locator('.time').innerText();
    assert.equal(await clock(), '17:50:00');
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    await button('遭遇雷击').click();
    assert.equal(await clock(), '17:50:06');
    assert.match(await page.locator('.revival').innerText(), /10分/);
    assert.match(await page.getByRole('article', { name: '战斗结算卡片' }).innerText(), /100 → 0/);
    assert.equal(await button('复苏').isEnabled(), false);
    await button('经过五分钟').click();
    assert.equal(await clock(), '17:55:06');
    assert.match(await page.locator('.task').innerText(), /已失效/);
    await button('经过五分钟').click();
    await button('复苏').click();
    assert.equal(await clock(), '18:00:06');
    await button('遭遇雷击').click();
    assert.match(await page.locator('.vitals').innerText(), /100 \/ 100/);
    await button('能力').click();
    await page.locator('summary').filter({hasText:'电荷转移'}).click();
    assert.match(await page.locator('.folio[open] .inline-detail').innerText(), /被动转移/);
    await button('释放储能').click();
    await button('行囊').click();
    assert.match(await page.locator('.tab-content').innerText(), /遗留在现场/);
    await button('见闻').click();
    await page.locator('summary').filter({hasText:'巡雷兽'}).click();
    await button('归来').click();
    assert.match(await page.locator('.tab-content').innerText(), /已经归来/);
    await button('默认主角重新开始').click();
    await button('凝力一击').click();
    assert.match(await page.locator('.combat-stats').innerText(), /40 \/ 50/);
    await button('凝力一击').click();
    assert.match(await page.getByRole('status').innerText(), /冷却/);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await button('概览').click();
      await page.screenshot({ path: path.join(output, `mobile-${width}.png`), fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow at ${width}`);
      await button('自定义主角').click();
      await page.getByLabel('姓名', { exact: true }).fill('长名测试旅人ABCDEFGHIJKLMN');
      await page.getByLabel('种族', { exact: true }).fill('元素生命');
      await button('以此角色重新开始').click();
      assert.match(await page.locator('.identity').innerText(), /长名测试旅人/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    }
    assert.deepEqual(errors, []);
    console.log('Preview passed: combat, game clock, death/revival, tabs, custom profile, 1280/390/320px.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
