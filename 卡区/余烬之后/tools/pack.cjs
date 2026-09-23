const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const YAML = require('yaml');
const { readChunks, embedCard, extractCards, isCardChunk } = require('./png.cjs');
const config = require('../card.config.cjs');
const { verifyEjsEntries } = require('./ejs-check.cjs');
const { frontendLoader } = require('./loader.cjs');
const cardDir = path.resolve(__dirname, '..');
const { version, releaseName, worldbookName, artifactStem } = require('./release-info.cjs');
const { cardPosition, bindWorldbook } = require('./worldbook.cjs');
const output = path.join(cardDir, 'release', version);
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashes = {};
function source(relative) {
  const file = path.resolve(cardDir, relative);
  assert(file.startsWith(cardDir + path.sep), '源文件越出本卡目录');
  const bytes = fs.readFileSync(file);
  sourceHashes[relative.replaceAll('\\', '/')] = digest(bytes);
  return bytes;
}
const manifest = YAML.parse(source('世界书条目清单.yaml').toString('utf8'));
const entries = manifest.条目.map((entry, id) => {
  const extensions = ['.yaml', '.txt'].filter(ext => fs.existsSync(path.join(cardDir, entry.文件 + ext)));
  assert.equal(extensions.length, 1, `条目文件不唯一: ${entry.文件}`);
  const position = cardPosition(entry.插入位置);
  return {
    id,
    keys: [],
    secondary_keys: [],
    comment: entry.名称,
    content: bindWorldbook(source(entry.文件 + extensions[0]).toString('utf8'), worldbookName),
    enabled: entry.启用,
    constant: true,
    selective: true,
    insertion_order: position.insertion_order,
    position: position.position,
    use_regex: true,
    extensions: {
      ...position.extensions,
      probability: 100,
      useProbability: true,
      prevent_recursion: true,
      exclude_recursion: true,
      display_index: id,
      selectiveLogic: 0,
    },
  };
});
verifyEjsEntries(entries);
const html = source(`build/${version}/界面/状态栏/index.html`).toString('utf8');
const coverHtml = source(`build/${version}/界面/封面/index.html`).toString('utf8');
const coverLoader = frontendLoader(coverHtml, '封面');
const loader = frontendLoader(html, '状态栏');
const bodyHtml = source(`build/${version}/界面/正文/index.html`).toString('utf8');
const bodyLoader = frontendLoader(bodyHtml, '交锋记录', '$("body").attr("data-branch","$1").attr("data-event","$2");');
const dossierLoader = frontendLoader(bodyHtml, '档案卡片', '$("body").attr("data-kind","$1").attr("data-id","$2");');
const script = (name, id, file) => ({
  type: 'script',
  enabled: true,
  name,
  id,
  content: source(`build/${version}/${file}`).toString('utf8'),
  info: '',
  button: { enabled: false, buttons: [] },
  data: {},
});
const card = {
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    name: releaseName,
    description:
      '',
    personality: '',
    scenario: '',
    first_mes: config.marker,
    mes_example: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    creator: config.creator,
    creator_notes: config.notes,
    character_version: version,
    tags: ['余烬之后', '多元世界', 'MVU', '开发版'],
    character_book: { name: worldbookName, entries },
    extensions: {
      world: worldbookName,
      tavern_helper: {
        scripts: [
          script('余烬之后 · MVU', '0979b3fc-57af-4b09-8ca1-84f3649b67e0', '脚本/MVU/index.js'),
          script('余烬之后 · 变量结构', '490cf826-94fb-4baa-8573-4b207916a21d', '脚本/变量结构/index.js'),
        ],
        variables: {},
      },
      regex_scripts: [
        {
          id: '0ab9cf00-989f-4d8f-8830-258c321b0923',
          scriptName: '余烬之后 · 档案小卡',
          findRegex: '/<EmbersCard\\s+type="(ability|gain|item|entity|character|note|combat|check|death|travel|growth|quest|snapshot)"\\s+id="([\\w-]+)"\\s*\\/>/g',
          replaceString: dossierLoader,
          trimStrings: [], placement: [2], disabled: false, markdownOnly: true,
          promptOnly: false, runOnEdit: true, substituteRegex: 0, minDepth: null, maxDepth: null,
        },
        {
          id: 'ed14f25b-e550-4ba0-b442-cd96da3dcf81',
          scriptName: '余烬之后 · 独立封面',
          findRegex: '/<EmbersCover\\/>/g',
          replaceString: coverLoader,
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null,
        },
        {
          id: 'c388645c-4963-4d87-8060-3d788278ac87',
          scriptName: '余烬之后 · 状态栏',
          findRegex: '/<EmbersPanel\\/>/g',
          replaceString: loader,
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null,
        },
        {
          id: '2749e147-fd4e-4b6e-83d7-55173cd19524',
          scriptName: '余烬之后 · 交锋记录',
          findRegex:
            '/<DACombat>\\s*\\{\\s*"分支ID"\\s*:\\s*"([\\w-]+)"\\s*,\\s*"事件ID"\\s*:\\s*"([\\w-]+)"\\s*\\}\\s*<\\/DACombat>/g',
          replaceString: bodyLoader,
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null,
        },
        {
          id: 'fc9022b0-eb56-4260-8085-29e4b782a29e',
          scriptName: '余烬之后 · 隐藏变量更新块',
          findRegex: '/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/g',
          replaceString: '',
          trimStrings: [],
          placement: [2],
          disabled: false,
          markdownOnly: true,
          promptOnly: false,
          runOnEdit: true,
          substituteRegex: 0,
          minDepth: null,
          maxDepth: null,
        },
      ],
    },
  },
};
source('card.config.cjs');
source('package.json');
const avatar = source(config.avatar);
const packed = embedCard(avatar, card);
assert.deepEqual(extractCards(packed).ccv3, card);
assert.deepEqual(
  readChunks(packed)
    .filter(c => !isCardChunk(c))
    .map(c => c.raw),
  readChunks(avatar)
    .filter(c => !isCardChunk(c))
    .map(c => c.raw),
  '打包改变了头像图像块',
);
fs.mkdirSync(output, { recursive: true });
const pngName = `${artifactStem}.png`;
const jsonName = `${artifactStem}.json`;
fs.writeFileSync(path.join(output, pngName), packed);
fs.writeFileSync(path.join(output, jsonName), JSON.stringify(card, null, 2) + '\n');
fs.writeFileSync(
  path.join(output, 'manifest.json'),
  JSON.stringify(
    {
      name: releaseName,
      worldbookName,
      version,
      stage: 'local-release',
      avatarSHA256: digest(avatar),
      artifacts: { [pngName]: digest(packed), [jsonName]: digest(fs.readFileSync(path.join(output, jsonName))) },
      inputs: sourceHashes,
      worldbookEntries: entries.length,
      externalRuntimeDependencies: ['Tavern Helper', 'MagVarUpdate', 'mvu_zod', 'EJS prompt template'],
    },
    null,
    2,
  ) + '\n',
);
fs.writeFileSync(
  path.join(output, '联调说明.txt'),
  config.notes +
    `\n当前卡名与主世界书：${releaseName}。EJS调用绑定到该版本世界书。\n开局：新建聊天，在独立封面选择角色与开局，预览开局要求后发送，AI正式生成第一幕。封面与回复状态栏分开。旧版聊天不自动迁移。\n测试顺序：开局→表达行动或对白→查看游戏时间与本轮变化。日常耗时与已发生行动自动结算；可选方案在行动页确认。\n验证记录及完整玩法范围见本卡README.md与docs/${version}测试说明.md。\n游戏时间按剧情耗时推进，不取电脑时间。封面直接内嵌原头像，头像原文件与图像块不被改写。\n`,
);
console.log(
  `Packed ${config.name} ${version}: ${entries.length} worldbook entries; PNG payload and image chunks verified.\n${path.join(output, pngName)}`,
);
