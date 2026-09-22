const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const z = require('zod');
const lodash = require('lodash');

// 离线校验使用与浏览器一致的 z/_ 全局；不执行酒馆脚本入口。
const cache = new Map();
function loadTs(filename) {
  const absolute = path.resolve(filename);
  if (cache.has(absolute)) return cache.get(absolute);
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: absolute,
  });
  const module = { exports: {} };
  cache.set(absolute, module.exports);
  vm.runInNewContext(
    compiled.outputText,
    {
      exports: module.exports,
      module,
      z,
      _: lodash,
      require: id => (id.startsWith('.') ? loadTs(path.resolve(path.dirname(absolute), `${id}.ts`)) : require(id)),
    },
    { filename: absolute },
  );
  return module.exports;
}
module.exports = { loadTs };
