// bump_version.mjs
// 版本号统一提升脚本
// 用法: node bump_version.mjs <新版本号>
// 示例: node bump_version.mjs v56
//
// 自动从 package.json 检测当前 CDN 版本号，
// 从 tavern_sync.yaml 检测当前卡片名称，
// 然后替换所有相关文件中的版本引用。
//
// ============================================
// 维护注意：如果以后新增了含版本号的文件，
// 在下方 REPLACEMENTS 数组中追加条目即可。
// ============================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname);

// ---- 参数解析 ----
const newVersion = process.argv[2];
if (!newVersion || !/^v\d+$/.test(newVersion)) {
  console.error('用法: node bump_version.mjs <新版本号>');
  console.error('示例: node bump_version.mjs v56');
  process.exit(1);
}

// ---- 检测当前版本 ----
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const cdnMatch = pkg.scripts.postbuild.match(/镜待流年_(v\d+)/);
if (!cdnMatch) {
  console.error('❌ 无法从 package.json postbuild 检测当前 CDN 版本');
  process.exit(1);
}
const oldCdnVersion = cdnMatch[1];

const syncContent = readFileSync(resolve(ROOT, 'tavern_sync.yaml'), 'utf8');
const cardMatch = syncContent.match(/酒馆中的名称:\s*(\S+)/);
const cardName = cardMatch ? cardMatch[1] : '镜待流年';
const oldCardVersion = cardName.match(/v\d+$/)?.[0] || '';

const oldCardName = oldCardVersion ? `镜待流年${oldCardVersion}` : '镜待流年';
const newCardName = `镜待流年${newVersion}`;

if (oldCdnVersion === newVersion && oldCardName === newCardName) {
  console.log(`ℹ  已经是 ${newVersion}，无需更新。`);
  process.exit(0);
}

console.log(`镜待流年: ${oldCdnVersion} → ${newVersion}`);
console.log(`卡片名称: ${oldCardName} → ${newCardName}`);
console.log('---');

// ---- 替换列表 ----
const REPLACEMENTS = [
  // CDN 路径（下划线分隔: 镜待流年_v55 → 镜待流年_v56）
  {
    file: 'package.json',
    desc: 'postbuild 目标路径',
    old: `镜待流年_${oldCdnVersion}`,
    nw: `镜待流年_${newVersion}`,
    all: false,
  },
  {
    file: '卡区/镜待流年/index.yaml',
    desc: 'CDN URL（状态栏/封面/变量结构）',
    old: `镜待流年_${oldCdnVersion}`,
    nw: `镜待流年_${newVersion}`,
    all: true,
  },
  // 卡片/世界书名称
  {
    file: '卡区/镜待流年/界面/状态栏/App.vue',
    desc: 'wbName fallback（状态栏 卡区）',
    old: `wbName = '${oldCardName}'`,
    nw: `wbName = '${newCardName}'`,
    all: false,
  },
  {
    file: 'src/镜待流年/界面/状态栏/App.vue',
    desc: 'wbName fallback（状态栏 src）',
    old: `wbName = '${oldCardName}'`,
    nw: `wbName = '${newCardName}'`,
    all: false,
  },
  {
    file: '卡区/镜待流年/界面/shared/MirrorPanel.vue',
    desc: 'wbName fallback（MirrorPanel 卡区，2处）',
    old: `wbName = '${oldCardName}'`,
    nw: `wbName = '${newCardName}'`,
    all: true,
  },
  {
    file: 'src/镜待流年/界面/shared/MirrorPanel.vue',
    desc: 'wbName fallback（MirrorPanel src，2处）',
    old: `wbName = '${oldCardName}'`,
    nw: `wbName = '${newCardName}'`,
    all: true,
  },
  {
    file: 'tavern_sync.yaml',
    desc: '同步配置键名',
    old: `  ${oldCardName}:`,
    nw: `  ${newCardName}:`,
    all: false,
  },
  {
    file: 'tavern_sync.yaml',
    desc: '酒馆中的名称',
    old: `酒馆中的名称: ${oldCardName}`,
    nw: `酒馆中的名称: ${newCardName}`,
    all: false,
  },
  {
    file: 'tavern_sync.yaml',
    desc: '导出文件路径',
    old: `/卡区/镜待流年/${oldCardName}`,
    nw: `/卡区/镜待流年/${newCardName}`,
    all: false,
  },
];

// ---- 执行替换 ----
let changed = 0;
for (const { file, desc, old, nw, all } of REPLACEMENTS) {
  const filePath = resolve(ROOT, file);
  if (!existsSync(filePath)) {
    console.error(`⚠  跳过（文件不存在）: ${file}`);
    continue;
  }
  const content = readFileSync(filePath, 'utf8');
  const newContent = all ? content.replaceAll(old, nw) : content.replace(old, nw);
  if (newContent === content) {
    console.error(`⚠  未找到匹配: ${file} — ${desc}`);
    console.error(`   查找: ${old}`);
    continue;
  }
  writeFileSync(filePath, newContent, 'utf8');
  changed += all ? (content.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 1;
  console.log(`✓  ${file}`);
  console.log(`   ${desc}`);
}

console.log('---');
console.log(`完成。共修改 ${changed} 处。`);
console.log(`下一步: pnpm build → git commit → git push`);

