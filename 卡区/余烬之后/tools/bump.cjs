const fs = require('node:fs');
const path = require('node:path');
const target = process.argv[2];
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(target || '')) {
  console.error('用法：npm run bump -- 0.2.0（仅修改本卡版本，不构建、不提交、不推送）');
  process.exit(1);
}
const filename = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(filename, 'utf8'));
const old = pkg.version;
const compare = (a, b) => {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
};
if (target === old) {
  console.log(`已是 ${target}，无需升版。`);
  process.exit(0);
}
if (compare(target, old) < 0 || !target.split('.').every(part => Number.isSafeInteger(Number(part)))) {
  console.error('新版本必须高于当前版本，且每段为安全整数。');
  process.exit(1);
}
pkg.version = target;
fs.writeFileSync(filename, JSON.stringify(pkg, null, 2) + '\n');
console.log(`余烬之后 ${old} -> ${target}`);
console.log(`卡名 / 世界书名：余烬之后 v${target}`);
console.log(`构建目录：build/${target}；卡包：release/${target}/余烬之后-${target}.png`);
console.log('下一步：npm run pack。本脚本仅修改本卡package.json；所有发布名称由同一版本派生。');
