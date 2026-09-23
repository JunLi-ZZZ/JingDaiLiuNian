const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// 本卡模板只使用 <% ... %> 语句块。按EJS的共享函数作用域检查组合后的代码。
function scriptBody(content) {
  return [...content.matchAll(/<%([\s\S]*?)%>/g)].map(([, body]) => {
    if (/^[=_#-]/.test(body)) throw Error('EJS检查器遇到新标签类型，请扩展编译检查');
    return body;
  }).join('\n');
}

function verifyEjsEntries(entries) {
  const templates = entries.filter(entry => entry.enabled && entry.content.includes('<%'));
  for (const entry of templates) new AsyncFunction(scriptBody(entry.content));
  const combined = templates.map(entry => scriptBody(entry.content)).join('\n');
  // 也检查重复进入同一提示词时是否与自己或外部局部变量撞名。
  new AsyncFunction('const library={},state={},actor={},recent="";\n' + combined + '\n' + combined);
  return templates.length;
}

module.exports = { scriptBody, verifyEjsEntries };
