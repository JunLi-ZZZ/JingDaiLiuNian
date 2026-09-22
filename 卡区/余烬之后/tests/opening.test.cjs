const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const { createOpening, initializeOpening } = loadTs(path.resolve(__dirname, '../src/opening.ts'));
const { createUninitializedState } = loadTs(path.resolve(__dirname, '../src/presets.ts'));
const clone = value => JSON.parse(JSON.stringify(value));
function host() {
  let data = { initialized_lorebooks: { 余烬之后: ['kept'] }, stat_data: createUninitializedState(), other: 42 };
  let context = { chatId: 'chat-a', latestMessageId: 0 };
  let queue = Promise.resolve();
  let writes = 0;
  return {
    exclusive: (_key, fn) => {
      const next = queue.then(fn);
      queue = next.catch(() => {});
      return next;
    },
    context: () => context,
    read: () => clone(data),
    write: async next => {
      writes++;
      data = clone(next);
    },
    setContext: value => {
      context = value;
    },
    getWrites: () => writes,
  };
}
const target = { chatId: 'chat-a', messageId: 0 };
const { publishOpening, defaultOpeningDraft, parseOpeningDraft, openingPrompt } = loadTs(
  path.resolve(__dirname, '../src/opening-story.ts'),
);
function storyHost() {
  const port = host();
  let selected = 'cover-a';
  let published;
  let appends = 0;
  return Object.assign(port, {
    selection: () => selected,
    setSelection: value => {
      selected = value;
    },
    story: () => published,
    append: async (message, data, extra) => {
      appends++;
      published = clone({ message_id: 1, message, data, extra });
      port.setContext({ chatId: 'chat-a', latestMessageId: 1 });
    },
    appends: () => appends,
  });
}
const storyTarget = { ...target, selection: 'cover-a' };

test('开场白和初始快照一次创建为新剧情楼层，封面不变且重复确认不重复发布', async () => {
  const port = storyHost();
  const before = port.read();
  const [one, two] = await Promise.all([
    publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'story-a'),
    publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'story-b'),
  ]);
  assert.equal(port.appends(), 1);
  assert.deepEqual(port.read(), before);
  assert.equal(one.messageId, 1);
  assert.equal(two.data.stat_data._结算.分支ID, 'story-a');
  assert.equal(port.story().message, defaultOpeningDraft.正文 + '\n\n<EmbersPanel/>');
  assert(!port.story().message.includes('<EmbersCover/>'));
  assert.equal(one.data.stat_data._初始化完成, true);
  assert.equal(one.data.initialized_lorebooks.余烬之后[0], 'kept');
  assert.equal(one.data.stat_data._实体.player.生命.当前, 0);
  assert.equal(one.data.stat_data._时空.当前地点.位面ID, "harbor");
});

test('自定义开局同时定位玩家、复苏锚点和游戏时钟，世界与大纲只保存在本局', () => {
  for (const plane of ['cangming', 'opening-world']) {
    const state = createOpening(
      {
        mode: '自定义',
        profile: { 姓名: '澄', 性别: '女性', 种族: '人类' },
        scenario: {
          模式: '自定义',
          位面ID: plane,
          世界名称: '书海',
          世界设定: '漂浮的书页构成群岛',
          城市: '',
          场景: '旧书馆',
          起始时间: '03:25',
          机缘: '偶然拾到夹在书中的起源种核',
          大纲: '守门人递出一封未拆的信',
        },
      },
      `world-${plane}`,
    ).stat_data;
    assert.equal(state._实体.player.位面ID, plane);
    assert.equal(state._锚点.start.位面ID, plane);
    assert.equal(state._实体.player.地点ID, state._时空.当前地点.地点ID);
    assert.equal(state._时空.位面目录[plane].时钟.本地基准秒, 3 * 3600 + 25 * 60);
    assert.equal(state._时空.起源时刻秒, 0);
    assert.equal(state._开局.场景设定.大纲, '守门人递出一封未拆的信');
    assert.equal(state._开局.机缘记录, '偶然拾到夹在书中的起源种核');
  }
  assert.throws(() => createOpening({ mode: '默认', scenario: { 模式: '自定义', 位面ID: 'opening-world' } }, 'bad'));
  assert.throws(() => createOpening({ mode: '默认', scenario: { 模式: '自定义', 起始时间: '24:01' } }, 'bad'));
});

test('生成失败、宏或变量正文、空开场、历史与切页均不写开局', async () => {
  const port = storyHost();
  for (const content of [
    '',
    '短文',
    defaultOpeningDraft.正文 + '<UpdateVariable>bad</UpdateVariable>',
    defaultOpeningDraft.正文 + '{{user}}',
  ]) {
    await assert.rejects(
      publishOpening(port, storyTarget, { mode: '默认' }, { ...defaultOpeningDraft, 正文: content }, 'invalid'),
    );
  }
  assert.equal(port.appends(), 0);
  assert.throws(() => parseOpeningDraft('not-json'), /未返回完整/);
  assert.equal(
    parseOpeningDraft('```json\n' + JSON.stringify(defaultOpeningDraft) + '\n```').正文,
    defaultOpeningDraft.正文,
  );
  port.setSelection('cover-b');
  await assert.rejects(publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'invalid'), /封面/);
  port.setSelection('cover-a');
  port.setContext({ chatId: 'chat-a', latestMessageId: 2 });
  await assert.rejects(publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'invalid'), /已有剧情/);
  port.setContext({ chatId: 'other', latestMessageId: 0 });
  await assert.rejects(
    publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'invalid'),
    /聊天已切换/,
  );
  assert.equal(port.appends(), 0);
});

test('创建请求报错后保留草稿可重试；已落盘再报错时重试不创建第二条', async () => {
  const port = storyHost();
  const append = port.append;
  port.append = async () => {
    throw Error('写入失败');
  };
  await assert.rejects(publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'retry'), /写入失败/);
  assert.equal(port.read().stat_data._初始化完成, false);
  port.append = async (...args) => {
    await append(...args);
    throw Error('回包失败');
  };
  await assert.rejects(publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'retry'), /回包失败/);
  const saved = await publishOpening(port, storyTarget, { mode: '默认' }, defaultOpeningDraft, 'retry-again');
  assert.equal(saved.data.stat_data._结算.分支ID, 'retry');
  assert.equal(port.appends(), 1);
});

test('草稿提示词使用所选世界和角色，不要求玩家行动或输出MVU更新', () => {
  const prompt = openingPrompt(
    '开场白',
    {
      mode: '自定义',
      profile: { 姓名: '白露', 种族: '龙', 性别: '未指定' },
      scenario: {
        模式: '自定义',
        位面ID: 'xiguang',
        场景: '港口',
        城市: '',
        构想: '寻找一封信',
      },
    },
    '世界资料样本',
  );
  assert(prompt.includes('世界资料样本'));
  assert(prompt.includes('白露'));
  assert(prompt.includes('曦光穹界'));
  assert(prompt.includes('与玩家直接相关的现场'));
  assert(!prompt.includes('星见市的普通居民'));
});

test('姓名和性别逐局独立，代词偏好不反推性别；旧档案可补空字段', () => {
  const { Schema } = loadTs(path.resolve(__dirname, '../src/schema.ts'));
  for (const [gender, preference, expected] of [
    ['男性', '', '他'],
    ['女性', '按性别', '她'],
    ['非二元', '', '只用名字'],
    ['无性别', 'TA', 'TA'],
    ['', '', '只用名字'],
    ['未指定', '她', '她'],
    ['男性', '只用名字', '只用名字'],
    ['自定义性别', '伊', '伊'],
  ]) {
    const state = createOpening(
      {
        mode: '自定义',
        profile: {
          姓名: '  潮生  ',
          种族: '元素生命',
          性别: gender,
          叙事代词: preference,
          称呼: '  阿潮 ',
        },
      },
      'identity',
    ).stat_data;
    assert.equal(state._开局.档案.姓名, '潮生');
    assert.equal(state._实体.player.名称, '潮生');
    assert.equal(state._开局.档案.性别, gender);
    assert.equal(state._开局.档案.叙事代词, expected);
    assert.equal(state._开局.档案.称呼, '阿潮');
    assert.equal(state._开局.档案.外貌, '');
    assert.equal(state._开局.档案.身份, '');
  }
  assert.equal(createOpening({ mode: '默认' }, 'default').stat_data._开局.档案.姓名, '归来者');
  assert.equal(Schema.shape._开局.unwrap().shape.档案.parse({ 姓名: '旧存档' }).叙事代词, '');
});

test('未解析的身份宏不能进入存档，失败后可改用实际姓名且只保存一次', async () => {
  const port = host();
  for (const name of ['{{user}}', '<user>', '{{char}}', '名字{{user}}']) {
    await assert.rejects(
      initializeOpening(
        port,
        target,
        {
          mode: '自定义',
          profile: { 姓名: name, 种族: '人类' },
        },
        'bad-macro',
      ),
      /实际文字/,
    );
  }
  assert.equal(port.getWrites(), 0);
  const saved = await initializeOpening(
    port,
    target,
    {
      mode: '自定义',
      profile: { 姓名: '林澈', 种族: '人类', 性别: '女性' },
    },
    'real-name',
  );
  assert.equal(saved.stat_data._开局.档案.姓名, '林澈');
  assert.equal(saved.stat_data._开局.档案.叙事代词, '她');
  assert.equal(port.getWrites(), 1);
});

test('开局保留自定义身份，不继承默认身份、试演敌人、死亡、能力和任务', () => {
  const state = createOpening(
    {
      mode: '自定义',
      scenario: {模式:'自定义',场景:'远海',机缘:'潮汐带来的种核'},
      profile: {
        姓名: '旅人',
        种族: '元素生命',
        经历: '来自远海',
        性格标签: '谨慎、好奇',
        原有能力: '潮汐感知',
        随身物品: '海螺',
        体貌: '可变形态',
      },
    },
    'custom',
  ).stat_data;
  assert.equal(state._开局.档案.身份, '');
  assert.equal(state._开局.档案.经历, '来自远海');
  assert.equal(state._开局.档案.原有能力, '潮汐感知');
  assert.equal(state._开局.档案.随身物品, '海螺');
  assert.equal(state._开局.档案.性格标签, '谨慎、好奇');
  assert.deepEqual(Object.keys(state._物品), []);
  assert.deepEqual(Object.keys(state._实体), ['player']);
  for (const field of ['_任务', '_死亡记录']) assert.deepEqual(Object.keys(state[field]), []);
  assert.deepEqual(Object.keys(state._能力), ['origin-rebirth', 'basic-attack', 'terminal-affinity']);
  assert.equal(state._实体.player.生命.当前, 100);
  assert.equal(state._实体.player.资源.energy.当前, 50);
  assert.equal(state._时空.起源时刻秒, 0);
});
test('开局保存同一个MVU快照，保留框架元数据；重新打开不覆盖', async () => {
  const port = host();
  const saved = await initializeOpening(port, target, { mode: '默认' }, 'branch-a');
  assert.equal(saved.other, 42);
  assert.equal(saved.initialized_lorebooks.余烬之后[0], 'kept');
  assert.equal(saved.stat_data._初始化完成, true);
  assert(saved.death_adaptation_runtime.events);
  const again = await initializeOpening(
    port,
    target,
    { mode: '自定义', profile: { 姓名: '不应覆盖', 种族: '龙' } },
    'branch-b',
  );
  assert.equal(again.stat_data._开局.档案.姓名, '归来者');
  assert.equal(port.getWrites(), 1);
});
test('并发开局只落盘一次，失败和历史楼层不写入', async () => {
  const port = host();
  await Promise.all([
    initializeOpening(port, target, { mode: '默认' }, 'a'),
    initializeOpening(port, target, { mode: '默认' }, 'b'),
  ]);
  assert.equal(port.getWrites(), 1);
  const bad = host();
  await assert.rejects(initializeOpening(bad, target, { mode: '自定义', profile: {} }, 'empty'));
  assert.equal(bad.getWrites(), 0);
  bad.setContext({ chatId: 'chat-a', latestMessageId: 2 });
  await assert.rejects(initializeOpening(bad, target, { mode: '默认' }, 'old'), /历史楼层/);
  bad.setContext({ chatId: 'chat-b', latestMessageId: 0 });
  await assert.rejects(initializeOpening(bad, target, { mode: '默认' }, 'other'), /聊天已切换/);
  assert.equal(bad.getWrites(), 0);
});
test('存档写入失败或回读不一致时提示失败', async () => {
  const fail = host();
  fail.write = async () => {
    throw Error('磁盘失败');
  };
  await assert.rejects(initializeOpening(fail, target, { mode: '默认' }, 'a'), /磁盘失败/);
  const ignored = host();
  ignored.write = async () => {};
  await assert.rejects(initializeOpening(ignored, target, { mode: '默认' }, 'a'), /回读校验/);
});

const { openingRequest, sendOpeningRequest } = loadTs(path.resolve(__dirname, '../src/opening-request.ts'));
function requestHost() {
  const port = storyHost();
  const append = port.append;
  port.request = () => port.story() && { ...port.story(), role: 'user' };
  port.append = async (message, data, extra) => {
    // 模拟消息事件从前一楼重新继承变量，而非简单保留传入data。
    assert.equal(port.read().stat_data._初始化完成, true);
    await append(message, port.read(), extra);
  };
  return port;
}
test('用户开局要求发送前初始化首楼，消息事件重新继承时不会回到未开局，重复提交不重复发消息', async () => {
  const port = requestHost();
  const choice = { mode: '默认' };
  const request = openingRequest(choice);
  await Promise.all([
    sendOpeningRequest(port, storyTarget, choice, request, 'new-a'),
    sendOpeningRequest(port, storyTarget, choice, request, 'new-b'),
  ]);
  assert.equal(port.appends(), 1);
  assert.equal(port.request().role, 'user');
  assert.equal(port.read().stat_data._初始化完成, true);
  assert.equal(port.request().data.stat_data._初始化完成, true);
  assert(port.request().data.death_adaptation_runtime);
  assert.equal(port.request().data.stat_data._结算.分支ID, 'new-a');
  assert.match(request, /请为《余烬之后》写出正式开场白/);
});
test('开局要求保存失败不发消息，发送失败可重试，已发送后报错不会再次发送', async () => {
  const port = requestHost();
  const choice = { mode: '默认' };
  const request = openingRequest(choice);
  const write = port.write;
  port.write = async () => {};
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request, 'a'), /回读/);
  assert.equal(port.appends(), 0);
  port.write = write;
  const append = port.append;
  port.append = async () => { throw Error('发送失败'); };
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request, 'b'), /发送失败/);
  assert.equal(port.appends(), 0);
  port.append = async (...args) => { await append(...args); throw Error('回包失败'); };
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request, 'c'), /回包失败/);
  await sendOpeningRequest(port, storyTarget, choice, request, 'd');
  assert.equal(port.appends(), 1);
});
test('开局要求包含自定义档案和大纲，历史聊天、切页、未替换宏不能发送', async () => {
  const port = requestHost();
  const choice = { mode: '自定义', profile: { 姓名: '潮生', 种族: '元素生命', 性别: '非二元' }, scenario: { 模式: '自定义', 位面ID: 'cangming', 场景: '雨夜驿站', 大纲: '一封误送的信' } };
  const request = openingRequest(choice);
  for (const text of ['潮生', '元素生命', '非二元', '苍溟界', '雨夜驿站', '一封误送的信']) assert(request.includes(text));
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request + '{{user}}', 'bad'), /宏/);
  port.setSelection('changed');
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request, 'bad'), /封面/);
  port.setSelection('cover-a');
  port.setContext({ chatId: 'chat-a', latestMessageId: 3 });
  await assert.rejects(sendOpeningRequest(port, storyTarget, choice, request, 'bad'), /已有剧情/);
  assert.equal(port.appends(), 0);
});
