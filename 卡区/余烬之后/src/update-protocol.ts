/** 只兼容明确的 JSONPatch 对象包装；仍交给 MVU 执行、Zod 校验和本卡结算。 */
export function bridgeUpdateCommands(content: string, commands: Mvu.CommandInfo[]): string {
  if (commands.length) return '';
  const blocks = [...content.matchAll(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/gi)];
  if (!blocks.length) return '';
  const additions: Mvu.CommandInfo[] = [];
  try {
    for (const block of blocks) {
      const inner = block[1].trim();
      if (/<JSON_?Patch>/i.test(inner)) throw Error('JSONPatch 未被 MVU 识别，请检查数组格式');
      const object = JSON.parse(inner.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
      if (!object || !Array.isArray(object.JSONPatch)) throw Error('缺少 JSONPatch 数组');
      if (object.JSONPatch.length > 100) throw Error('变量操作超过100项');
      for (const patch of object.JSONPatch) {
        const parts = typeof patch.path === 'string' && patch.path.startsWith('/')
          ? patch.path.slice(1).split('/').map((p: string) => p.replace(/~1/g, '/').replace(/~0/g, '~')) : [];
        if (!['叙事', '待审提案'].includes(parts[0]) || parts.some((p: string) => !p || ['__proto__', 'prototype', 'constructor'].includes(p)))
          throw Error('变量路径须位于叙事或待审提案');
        const path = parts.map((p: string) => '[' + JSON.stringify(p) + ']').join('');
        const base = { full_match: JSON.stringify(patch), reason: 'json_patch' };
        if (patch.op === 'remove') additions.push({ ...base, type: 'delete', args: [path] });
        else {
          if (!Object.hasOwn(patch, 'value')) throw Error('变量操作缺少value');
          if (patch.op === 'replace') additions.push({ ...base, type: 'set', args: [path, JSON.stringify(patch.value)] });
          else if (patch.op === 'insert' || patch.op === 'add') {
            const parent = parts.slice(0, -1).map((p: string) => '[' + JSON.stringify(p) + ']').join('');
            if (!parent) throw Error('新增记录需要父路径');
            additions.push({ ...base, type: 'insert', args: [parent, JSON.stringify(parts.at(-1)), JSON.stringify(patch.value)] });
          } else throw Error('不支持的变量操作类型');
        }
      }
    }
    commands.push(...additions);
    return '';
  } catch (error) {
    return '变量更新未解析：' + (error instanceof Error ? error.message : String(error));
  }
}

export function updateReceiptStatus(content: string, receipt: string, expected: string, error: string): string {
  if (error) return error;
  if (!/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/i.test(content)) return '本楼未提供变量更新。';
  return receipt === expected ? '本轮变量已处理。' : '本楼有更新文本，尚未确认保存；请检查变量脚本或更新格式。';
}
