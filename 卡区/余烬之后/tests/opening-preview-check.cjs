const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.DEATH_ADAPTATION_PLAYWRIGHT || 'playwright');
const { loadTs } = require('../tools/runtime.cjs');
const { createUninitializedState } = loadTs(path.resolve(__dirname, '../src/presets.ts'));
const { defaultOpeningDraft } = loadTs(path.resolve(__dirname, '../src/opening-story.ts'));
const { extractCards } = require('../tools/png.cjs');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const config = require('../card.config.cjs');

(async () => {
  fs.mkdirSync(path.join(root, 'build/verification'), { recursive: true });
  const server = http.createServer((req, res) => {
    const files = {
      '/cover': '预览/开局.html',
      '/runtime-cover': '界面/封面/index.html',
      '/status': '界面/状态栏/index.html',
    };
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.url === '/lib.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(fs.readFileSync(path.join(root, 'build/verification/tavern-lib.js'))); return; }
    if (req.url === '/loader') {
      res.end('<html><head></head><body></body></html>');
      return;
    }
    if (!files[req.url]) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.end(fs.readFileSync(path.join(root, 'build', version, files[req.url])));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const base = `http://127.0.0.1:${server.address().port}`;
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/cover');
      await page.locator('.cover-art').evaluate(image => image.decode());
      assert.deepEqual(Buffer.from((await page.locator('.cover-art').getAttribute('src')).split(',')[1], 'base64'), fs.readFileSync(path.join(root, 'assets/头像.png')));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(root, 'build/verification', `cover-ready-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: '开始旅途', exact: true }).click();
      await page.getByLabel('自定义角色', { exact: true }).check();
      await page.getByLabel('姓名', { exact: true }).fill('潮生');
      await page.getByLabel('种族', { exact: true }).fill('元素生命');
      await page.getByRole('button', { name: '非二元', exact: true }).click();
      await page.getByLabel('自定义开局', { exact: true }).check();
      await page.getByLabel('开局位面', { exact: true }).selectOption('cangming');
      await page.getByLabel('开局地点', { exact: true }).fill('雨夜驿站');
      await page.getByRole('button', { name: '预览开局要求', exact: true }).click();
      assert.match(await page.getByLabel('开局要求', { exact: true }).inputValue(), /雨夜驿站/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(root, 'build/verification', `opening-request-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: '发送开局并生成', exact: true }).click();
      await page.getByRole('heading', { name: '开局要求已发送', exact: true }).waitFor();
    }
    const hosted = await browser.newPage();
    hosted.on('pageerror', error => errors.push(error.message));
    await hosted.addInitScript(
      ({ initial, draft }) => {
        const clone = value => JSON.parse(JSON.stringify(value));
        const initialMessages = () => [
          {
            message_id: 0,
            role: 'assistant',
            message: '<EmbersCover/>',
            data: { initialized_lorebooks: { 余烬之后: ['kept'] }, stat_data: clone(initial) },
            extra: {},
          },
        ];
        const messages = () => JSON.parse(sessionStorage.getItem('messages') || JSON.stringify(initialMessages()));
        const view = () => Number(sessionStorage.getItem('view') || 0);
        const data = option => messages()[option?.message_id ?? view()]?.data;
        window.waitGlobalInitialized = async () => {
          if (sessionStorage.getItem('missingMvu')) await new Promise(resolve => { window.resolveMvu = resolve; });
        };
        window.toastr = { info() {}, success() {}, error() {} };
        window.EjsTemplate = { getFeatures: () => ({ enabled: !sessionStorage.getItem('disabledEjs'), generate_enabled: true }) };
        window.EmbersRuntime = { active: true };
        window.SillyTavern = { getCurrentChatId: () => sessionStorage.getItem('chat') || 'mock-chat' };
        window.getCurrentMessageId = view;
        window.getLastMessageId = () => messages().length - 1;
        window.getChatMessages = (id, options) => {
          const m = messages()[Math.min(id, messages().length - 1)]; // 已安装4.8.5会把越界索引截到末楼
          return m ? [options?.include_swipes ? { ...m, swipe_id: 0, swipes: [m.message] } : m] : [];
        };
        window.getVariables = data;
        window.substitudeMacros = text => {
          if (text !== '{{user}}') throw Error('wrong macro');
          return sessionStorage.getItem('personaName') || '酒馆名字';
        };
        window.Mvu = {
          getMvuData: data,
          replaceMvuData: async (value, option) => {
            const all = messages();
            all[option.message_id].data = clone(value);
            sessionStorage.setItem('messages', JSON.stringify(all));
            sessionStorage.setItem('writes', String(Number(sessionStorage.getItem('writes') || 0) + 1));
          },
        };
        window.createChatMessages = async entries => {
          if (sessionStorage.getItem('appendFail')) throw Error('模拟保存失败');
          const all = messages();
          for (const e of entries) {
            // 消息事件可能重新继承前楼，验证首楼先初始化的重要性。
            all.push({ ...clone(e), data: clone(all[all.length - 1].data), message_id: all.length });
          }
          sessionStorage.setItem('messages', JSON.stringify(all));
          sessionStorage.setItem('appends', String(Number(sessionStorage.getItem('appends') || 0) + entries.length));
        };
        window.triggerSlash = async command => {
          if (command !== '/trigger') throw Error('unexpected slash');
          sessionStorage.setItem('triggers', String(Number(sessionStorage.getItem('triggers') || 0) + 1));
          if (sessionStorage.getItem('triggerFail')) throw Error('模拟AI连接失败');
          const all = messages();
          all.push({ message_id: all.length, role: 'assistant', message: draft.正文 + '\n\n<EmbersPanel/>', data: Object.fromEntries(Object.entries(clone(all[all.length - 1].data)).filter(([key]) => ['stat_data', 'schema', 'initialized_lorebooks', 'display_data', 'delta_data'].includes(key))), extra: {} });
          sessionStorage.setItem('messages', JSON.stringify(all));
        };
        window.generateRaw = async options => {
          sessionStorage.setItem('lastRequest', JSON.stringify(options));
          if (sessionStorage.getItem('generationFail')) throw Error('模拟连接失败');
          if (sessionStorage.getItem('generationPending'))
            await new Promise(resolve => {
              window.resolveGeneration = resolve;
            });
          return options.ordered_prompts[1].content.includes('大纲')
            ? '旧书馆的守门人保管着一封待认领的信。是否追查由玩家决定。'
            : JSON.stringify(draft);
        };
        window.stopGenerationById = id => sessionStorage.setItem('cancelledId', id);
      },
      { initial: createUninitializedState(), draft: defaultOpeningDraft },
    );
    async function reset() {
      await hosted.goto(base + '/loader');
      await hosted.evaluate(() => sessionStorage.clear());
      await hosted.goto(base + '/runtime-cover');
    }
    async function openEditor() {
      await hosted.getByRole('button', { name: '开始旅途', exact: true }).click();
    }
    async function defaultPreview() {
      await hosted.getByRole('button', { name: '预览开局要求', exact: true }).click();
    }
    const saved = () => hosted.evaluate(() => JSON.parse(sessionStorage.getItem('messages'))[2].data);
    await reset();
    await hosted.evaluate(() => sessionStorage.setItem('personaName', '{{user}}'));
    await openEditor();
    await hosted.getByRole('heading', { name: '归来者', exact: true }).waitFor();
    for (const [gender, pronoun] of [
      ['男性', '他'],
      ['女性', '她'],
      ['非二元', '只用名字'],
      ['未指定', '只用名字'],
    ]) {
      await reset();
      await openEditor();
      if (gender === '男性') await hosted.screenshot({ path: path.join(root, 'build/verification/environment-ready.png'), fullPage: true });
      await hosted.getByLabel('自定义角色', { exact: true }).check();
      await hosted.getByRole('button', { name: '使用酒馆名字', exact: true }).click();
      assert.equal(await hosted.getByLabel('姓名', { exact: true }).inputValue(), '酒馆名字');
      await hosted.getByLabel('姓名', { exact: true }).fill('本局旅人');
      await hosted.getByLabel('种族', { exact: true }).fill('人类');
      await hosted.getByRole('button', { name: gender, exact: true }).click();
      await defaultPreview();
      assert.equal(await hosted.evaluate(() => sessionStorage.getItem('messages')), null);
      await hosted.getByRole('button', { name: '发送开局并生成', exact: true }).click();
      await hosted.getByRole('heading', { name: '开局要求已发送', exact: true }).waitFor();
      assert.equal(await hosted.locator('.return-panel').count(), 0);
      assert.equal(await hosted.evaluate(() => sessionStorage.getItem('appends')), '1');
      assert.equal(
        await hosted.evaluate(() => JSON.parse(sessionStorage.getItem('messages'))[0].data.stat_data._初始化完成),
        true,
      );
      await hosted.waitForFunction(() => JSON.parse(sessionStorage.getItem('messages')).length === 3);
      assert.equal(await hosted.evaluate(() => JSON.parse(sessionStorage.getItem('messages'))[1].role), 'user');
      await hosted.reload();
      await hosted.getByRole('heading', { name: '开局要求已发送', exact: true }).waitFor();
      await hosted.evaluate(() => {
        sessionStorage.setItem('personaName', '另一个名字');
        sessionStorage.setItem('view', '2');
      });
      await hosted.goto(base + '/status');
      await hosted.getByRole('button', { name: /旅途手记/ }).click();
      await hosted.getByRole('heading', { name: '本局旅人', exact: true }).waitFor();
      assert.equal(await hosted.locator('.book-cover').count(), 0);
      assert.equal((await saved()).stat_data._开局.档案.叙事代词, pronoun);
    }
    // 生成错误保留输入，不创建消息；所选世界显式进入生成上下文。
    await reset();
    await openEditor();
    await hosted.getByLabel('自定义开局', { exact: true }).check();
    await hosted.getByLabel('开局位面', { exact: true }).selectOption('opening-world');
    await hosted.getByLabel('世界名称', { exact: true }).fill('书海');
    await hosted.getByLabel('世界设定', { exact: true }).fill('漂浮的书页构成群岛');
    await hosted.getByLabel('开局地点', { exact: true }).fill('旧书馆');
    await hosted.getByLabel('开局构想', { exact: true }).fill('一封来历不明的信');
    await hosted.evaluate(() => sessionStorage.setItem('generationFail', '1'));
    await hosted.getByRole('button', { name: 'AI 整理开局大纲', exact: true }).click();
    await hosted.getByRole('alert').waitFor();
    assert.match(await hosted.getByRole('alert').innerText(), /模拟连接失败/);
    assert.equal(await hosted.getByLabel('开局构想', { exact: true }).inputValue(), '一封来历不明的信');
    assert.equal(await hosted.evaluate(() => sessionStorage.getItem('messages')), null);
    await hosted.evaluate(() => sessionStorage.removeItem('generationFail'));
    await hosted.getByRole('button', { name: 'AI 整理开局大纲', exact: true }).click();
    await hosted.waitForFunction(() =>
      document.querySelector('textarea[placeholder^="可手写"]').value.includes('守门人'),
    );
    const request = await hosted.evaluate(() => JSON.parse(sessionStorage.getItem('lastRequest')));
    assert(request.ordered_prompts[0].content.includes('漂浮的书页构成群岛'));
    assert.equal(request.overrides.chat_history.with_depth_entries, false);
    assert.equal(request.max_chat_history, 0);
    await hosted.evaluate(() => sessionStorage.setItem('generationPending', '1'));
    await hosted.getByRole('button', { name: 'AI 整理开局大纲', exact: true }).click();
    await hosted.getByRole('button', { name: '取消生成', exact: true }).click();
    await hosted.evaluate(() => { sessionStorage.removeItem('generationPending'); window.resolveGeneration(); });
    assert(await hosted.evaluate(() => !!sessionStorage.getItem('cancelledId')));
    await hosted.getByRole('button', { name: '预览开局要求', exact: true }).click();
    await hosted.evaluate(() => sessionStorage.setItem('appendFail', '1'));
    await hosted.getByRole('button', { name: '发送开局并生成', exact: true }).click();
    await hosted.getByRole('alert').waitFor();
    assert.match(await hosted.getByRole('alert').innerText(), /模拟保存失败/);
    assert.equal(await hosted.evaluate(() => JSON.parse(sessionStorage.getItem('messages')).length), 1);
    await hosted.evaluate(() => { sessionStorage.removeItem('appendFail'); sessionStorage.setItem('triggerFail', '1'); });
    await hosted.getByRole('button', { name: '发送开局并生成', exact: true }).click();
    await hosted.getByRole('heading', { name: '开局要求已发送', exact: true }).waitFor();
    await hosted.getByRole('alert').waitFor();
    assert.match(await hosted.getByRole('alert').innerText(), /模拟AI连接失败/);
    assert.equal(await hosted.evaluate(() => JSON.parse(sessionStorage.getItem('messages')).length), 2);
    await hosted.evaluate(() => sessionStorage.removeItem('triggerFail'));
    await hosted.getByRole('button', { name: '请求 AI 开场', exact: true }).click();
    await hosted.waitForFunction(() => JSON.parse(sessionStorage.getItem('messages')).length === 3);
    assert.equal(await hosted.evaluate(() => sessionStorage.getItem('appends')), '1');
    assert.equal((await saved()).stat_data._时空.当前地点.位面ID, 'opening-world');
    assert.equal((await saved()).death_adaptation_runtime, undefined);
    assert((await saved()).stat_data._运行账本.rules);
    // MVU未就绪也能显示封面和编辑；恢复依赖后保留输入。
    await hosted.goto(base + '/loader');
    await hosted.evaluate(() => { sessionStorage.clear(); sessionStorage.setItem('missingMvu', '1'); sessionStorage.setItem('disabledEjs', '1'); });
    await hosted.goto(base + '/runtime-cover');
    await openEditor();
    await defaultPreview();
    assert(!(await hosted.getByRole('button', { name: '发送开局并生成', exact: true }).isEnabled()));
    await hosted.evaluate(() => { sessionStorage.removeItem('missingMvu'); sessionStorage.removeItem('disabledEjs'); window.resolveMvu(); });
    assert.equal(await hosted.getByRole('region', { name: '环境检测' }).count(), 0);
    await hosted.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
    // 最终PNG中提取两个独立正则入口，执行载荷而不是只看源文件。
    const card = extractCards(
      fs.readFileSync(path.join(root, 'release', version, `${config.name}-${version}.png`)),
    ).ccv3;
    assert.equal(card.data.first_mes, '<EmbersCover/>');
    const regexes = card.data.extensions.regex_scripts;
    const coverRegex = regexes.find(r => r.scriptName.endsWith('独立封面'));
    const statusRegex = regexes.find(r => r.scriptName.endsWith('状态栏'));
    const decodeLoader = async replacement => {
      // 使用当前酒馆自带的Showdown与DOMPurify处理壳，模拟助手接管前的消息HTML。
      const formatted = await hosted.evaluate(async replacement => {
        const { showdown, DOMPurify } = await import('/lib.js');
        return DOMPurify.sanitize(new showdown.Converter().makeHtml(replacement));
      }, replacement);
      await hosted.setContent(formatted);
      assert.match(await hosted.locator('body').innerText(), /正在加载/);
      assert((await hosted.locator('body').innerText()).length < 500);
      assert.equal(await hosted.locator('pre').isVisible(), false);
      return hosted.locator('pre code').textContent();
    };
    const runLoader = async replacement => {
      const html = await decodeLoader(replacement);
      await hosted.addScriptTag({ path: require.resolve('jquery/dist/jquery.min.js') });
      await hosted.addScriptTag({ content: html.match(/<script>([\s\S]*?)<\/script>/)[1] });
    };
    await hosted.goto(base + '/loader');
    await hosted.evaluate(() => sessionStorage.clear());
    await runLoader(coverRegex.replaceString);
    await openEditor();
    await defaultPreview();
    await hosted.getByRole('button', { name: '发送开局并生成', exact: true }).click();
    await hosted.getByRole('heading', { name: '开局要求已发送', exact: true }).waitFor();
    await hosted.waitForFunction(() => JSON.parse(sessionStorage.getItem('messages')).length === 3);
    await hosted.evaluate(() => sessionStorage.setItem('view', '2'));
    await hosted.goto(base + '/loader');
    await runLoader(statusRegex.replaceString);
    await hosted.getByRole('button', { name: /旅途手记/ }).click();
    await hosted.getByRole('heading', { name: '酒馆名字', exact: true }).waitFor();
    assert.equal((await saved()).stat_data._开局.档案.姓名, '酒馆名字');
    assert.equal((await saved()).stat_data._时空.当前地点.位面ID, 'harbor');
    assert.equal((await saved()).stat_data._实体.player.生命阶段, '重构中');
    await hosted.screenshot({path:path.join(root,'build/verification/default-harbor.png'),fullPage:true});
    const neutral = require('./numerical-fixture.cjs').createOpening({mode:'默认'},'ui-state');
    await hosted.evaluate(value => {
      const messages=JSON.parse(sessionStorage.getItem('messages'));
      messages[2].data={...messages[2].data,...value};
      sessionStorage.setItem('messages',JSON.stringify(messages));
    }, JSON.parse(JSON.stringify(neutral)));
    await hosted.getByRole('button',{name:'行动',exact:true}).click();
    async function confirmProposal(id, operation) {
      await hosted.evaluate(
        ({ id, operation }) => {
          const messages = JSON.parse(sessionStorage.getItem('messages'));
          const data = messages[2].data;
          data.stat_data.待审提案[id] = {
            类型: '行动',
            主体ID: 'player',
            目标ID: {},
            能力ID: null,
            玩家原文引用: '继续行动',
            内容: '浏览器验证当前场景行动',
            操作: operation,
            预期状态版本: data.stat_data._结算.状态版本,
          };
          sessionStorage.setItem('messages', JSON.stringify(messages));
        },
        { id, operation },
      );
      await hosted.getByRole('button', { name: '按当前状态确认执行', exact: true }).click();
      await hosted.waitForFunction(
        id => !JSON.parse(sessionStorage.getItem('messages'))[2].data.stat_data.待审提案[id],
        id,
      );
      return saved();
    }
    let state = await confirmProposal('enc', { kind: 'encounter', name: '雷兽', tier: '致命', mechanism: 'electric' });
    const enemy = state.stat_data._结算.遭遇ID;
    await hosted.evaluate(() => {
      Math.random = () => 0.5;
    });
    state = await confirmProposal('hit', {
      kind: 'strike',
      actorId: enemy,
      targetId: 'player',
      abilityId: Object.keys(state.stat_data._实体[enemy].能力ID)[0],
    });
    assert.equal(state.stat_data._实体.player.生命阶段, '重构中');
    await hosted.getByRole('article', { name: '战斗结算卡片' }).waitFor();
    assert.match(await hosted.getByRole('article', { name: '战斗结算卡片' }).innerText(), /100 → 0/);
    await confirmProposal('wait', { kind: 'advance', seconds: 600 });
    state = await confirmProposal('revive', { kind: 'revive' });
    assert.equal(state.stat_data._实体.player.生命.当前, 100);
    assert.equal(state.stat_data._时空.起源时刻秒, 606);
    await hosted.goto(base + '/status');
    await hosted.getByRole('button', { name: /旅途手记/ }).click();
    await hosted.getByRole('heading', { name: '归来者', exact: true }).waitFor();
    assert.equal(await hosted.locator('.time').innerText(), '18:00:06');
    for (const width of [1280, 390, 320]) {
      await hosted.setViewportSize({ width, height: 900 });
      assert(await hosted.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await hosted.screenshot({
        path: path.join(root, 'build/verification', `settlement-${width}.png`),
        fullPage: true,
      });
    }

    await hosted.getByRole('button',{name:'能力',exact:true}).click();
    await hosted.locator('summary').filter({hasText:'电荷转移'}).click();
    const folio=hosted.locator('.folio[open]').filter({hasText:'电荷转移'});
    assert.equal(await folio.locator('.inline-detail').count(),1);
    assert.equal(await hosted.locator('.expanded').count(),0);
    const header=await folio.locator('summary').first().boundingBox(),child=await folio.locator('.inline-detail').boundingBox();
    assert(Math.abs(header.y+header.height-child.y)<=2);
    await hosted.screenshot({path:path.join(root,'build/verification/inline-ability-320.png'),fullPage:true});
    await hosted.getByRole('button',{name:'行动',exact:true}).click();
    await hosted.evaluate(()=>{
      const messages=JSON.parse(sessionStorage.getItem('messages')),s=messages[2].data.stat_data;
      const narrative=JSON.parse(JSON.stringify(s.叙事));
      narrative.本轮时间={起算起源秒:s._时空.起源时刻秒,经过本地秒:30};
      narrative.本轮结算={起算状态版本:s._结算.状态版本,操作:[{kind:'channel',abilityId:'adapt-player-electric',amount:20,purpose:'给门锁供电'}]};
      s._更新错误='没有可释放的储能';
      s._待修复={版本:s._结算.状态版本,原因:s._更新错误,输入:{叙事:narrative,待审提案:{}}};
      sessionStorage.setItem('messages',JSON.stringify(messages));
    });
    await hosted.getByRole('button',{name:'保存校正并重试',exact:true}).waitFor();
    await hosted.getByLabel('校正项目',{exact:true}).selectOption('adapt-player-electric');
    await hosted.getByLabel('校正后的当前值',{exact:false}).fill('30');
    await hosted.getByLabel('依据',{exact:true}).fill('此前接触电箱已吸收30点，变量漏记');
    await hosted.getByRole('button',{name:'保存校正并重试',exact:true}).click();
    await hosted.waitForFunction(()=>JSON.parse(sessionStorage.getItem('messages'))[2].data.stat_data._待修复===null);
    state=await saved();
    assert.equal(state.stat_data._实体.player.资源['adapt-player-electric'].当前,10);
    assert.equal(state.stat_data._时空.起源时刻秒,636);
    await hosted.screenshot({path:path.join(root,'build/verification/correction-320.png'),fullPage:true});
    const bodyRegex = regexes.find(r => r.scriptName.endsWith('交锋记录'));
    const token = `<DACombat>${JSON.stringify({ 分支ID: state.stat_data._结算.分支ID, 事件ID: 'm2-hit' })}</DACombat>`;
    const replacement = token.replace(new RegExp(bodyRegex.findRegex.slice(1, -2), 'g'), bodyRegex.replaceString);
    await hosted.goto(base + '/loader');
    await runLoader(replacement);
    await hosted.getByRole('article', { name: '战斗结算卡片' }).waitFor();
    assert.match(await hosted.getByRole('article', { name: '战斗结算卡片' }).innerText(), /100 → 0/);
    const dossierRegex=regexes.find(r=>r.scriptName.endsWith('档案小卡'));
    const dossierToken='<EmbersCard type="ability" id="adapt-player-electric"/>';
    const dossierReplacement=dossierToken.replace(new RegExp(dossierRegex.findRegex.slice(1,-2),'g'),dossierRegex.replaceString);
    assert.notEqual(dossierReplacement,dossierToken);
    await hosted.goto(base+'/loader');
    await runLoader(dossierReplacement);
    await hosted.locator('.dossier summary').click();
    assert.match(await hosted.locator('.dossier').innerText(),/电荷转移/);
    assert.match(await hosted.locator('.dossier').innerText(),/稀有/);
    await hosted.screenshot({path:path.join(root,'build/verification/body-ability-320.png'),fullPage:true});
    const gainToken='<EmbersCard type="gain" id="adapt-player-electric"/>';
    const gainReplacement=gainToken.replace(new RegExp(dossierRegex.findRegex.slice(1,-2),'g'),dossierRegex.replaceString);
    assert.notEqual(gainReplacement,gainToken);
    await hosted.goto(base+'/loader');await runLoader(gainReplacement);
    await hosted.locator('.dossier[open]').waitFor();
    assert.match(await hosted.locator('.dossier').innerText(),/能力获得/);
    const characterToken='<EmbersCard type="character" id="tide-ferryman"/>';
    const characterReplacement=characterToken.replace(new RegExp(dossierRegex.findRegex.slice(1,-2),'g'),dossierRegex.replaceString);
    await hosted.goto(base+'/loader');await runLoader(characterReplacement);
    await hosted.locator('.card-pending summary').waitFor();
    assert.equal(await hosted.locator('.card-pending[open]').count(),0);
    assert(!(await hosted.locator('body').innerText()).includes('此条目尚未收录'));
    assert.notEqual(await hosted.locator('.card-pending summary').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 0)');
    await hosted.evaluate(()=>{
      const messages=JSON.parse(sessionStorage.getItem('messages'));
      messages[2].data.stat_data.叙事.人物档案={'tide-ferryman':{名称:'闻潮',身份:'渡潮人',外貌:'墨绿短衣',近况:'修补潮镜'}};
      sessionStorage.setItem('messages',JSON.stringify(messages));
    });
    await hosted.locator('.dossier summary').click();
    assert.match(await hosted.locator('.dossier').innerText(),/闻潮/);
    await hosted.evaluate(() => {
      window.$ = window.jQuery;
      window._ = {
        cloneDeep: value => JSON.parse(JSON.stringify(value)),
        isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      };
      window.initializeGlobal = (name, value) => { window[name] = value; };
      window.eventOn = (_event, callback) => {
        window.policyCallback = callback;
        return { stop() {} };
      };
      window.Mvu.events = { VARIABLE_UPDATE_ENDED: 'updated' };
    });
    await hosted.route('https://testingcf.jsdelivr.net/**', route =>
      route.fulfill({
        contentType: 'application/javascript',
        headers: { 'access-control-allow-origin': '*' },
        body: 'export function registerMvuSchema(schema){ window.registeredCardSchema = schema; }',
      }),
    );
    await hosted.addScriptTag({ type: 'module', content: card.data.extensions.tavern_helper.scripts[1].content });
    await hosted.waitForFunction(() => !!window.registeredCardSchema && !!window.policyCallback);
    assert(
      await hosted.evaluate(() => {
        const old = JSON.parse(sessionStorage.getItem('messages'))[2].data;
        const next = JSON.parse(JSON.stringify(old));
        next.stat_data._实体.player.生命.当前 = 1;
        next.stat_data.叙事.天气 = '雨';
        next.death_adaptation_runtime = {};
        window.policyCallback(next, old);
        return (
          next.stat_data._实体.player.生命.当前 === 100 &&
          next.stat_data.叙事.天气 === '雨' &&
          !!next.death_adaptation_runtime.events['m2-hit']
        );
      }),
    );
    assert.deepEqual(errors, []);
    console.log(
      'Passed: separate cover/story/status PNG loaders; user-request openings; identity/macros; AI outline/error/cancel mocked; initialized cover inheritance; generation retry; slow dependencies; hidden loaders; three widths; combat/death/revival/body/schema policy; inline ability details with no gap; correction and original-batch retry; dossier card from packed regex. No live Tavern or model calls.',
    );
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
