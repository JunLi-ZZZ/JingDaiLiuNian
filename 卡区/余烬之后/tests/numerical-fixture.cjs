const path = require('node:path');
const { loadTs } = require('../tools/runtime.cjs');
const { createOpening: opening } = loadTs(path.join(__dirname, '../src/opening.ts'));
// 原有数值回归使用中性存活场景，双母默认开局单独覆盖。
exports.createOpening = (choice, branch) => {
  const session = opening({...choice, scenario:{模式:'自定义',位面ID:'main',场景:'测试场',机缘:'测试获得种核'}}, branch);
  delete session.stat_data._能力['terminal-affinity'];
  delete session.stat_data._实体.player.能力ID['terminal-affinity'];
  delete session.stat_data._时空.位面目录.harbor;
  delete session.stat_data._锚点.harbor;
  return session;
};
