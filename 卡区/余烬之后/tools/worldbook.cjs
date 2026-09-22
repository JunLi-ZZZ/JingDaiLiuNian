const assert = require('node:assert/strict');

function cardPosition(position) {
  const type = position.类型;
  assert(['角色定义之前', '角色定义之后', '指定深度'].includes(type), `未知插入位置: ${type}`);
  assert(Number.isSafeInteger(position.顺序), '条目顺序必须是整数');
  const atDepth = type === '指定深度';
  if (atDepth) {
    assert.equal(position.深度, 0, '本卡指令使用D0，不插入互动历史中间');
    assert.equal(position.角色, 'system');
  }
  return {
    position: type === '角色定义之后' ? 'after_char' : 'before_char',
    insertion_order: position.顺序,
    extensions: { position: atDepth ? 4 : type === '角色定义之后' ? 1 : 0, depth: atDepth ? 0 : 4, role: 0 },
  };
}

// 发布时把EJS调用绑定到本版本世界书，保留稳定条目名用于存档中的位面引用。
function bindWorldbook(content, worldbookName) {
  if (!content.trimStart().startsWith('@@preprocessing')) return content;
  return content.replace(/getwi\(/g, `getwi(${JSON.stringify(worldbookName)}, `);
}
module.exports = { cardPosition, bindWorldbook };
