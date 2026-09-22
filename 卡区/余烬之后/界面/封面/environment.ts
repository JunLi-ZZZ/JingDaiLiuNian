export type EnvironmentCheck = { name: string; ready: boolean; detail: string };
export type CoverEnvironment = { checks: EnvironmentCheck[]; elapsed: boolean; error: string };

export function inspectEnvironment(bound: boolean): EnvironmentCheck[] {
  const parent = window.parent as Window & {
    EjsTemplate?: typeof EjsTemplate;
    EmbersRuntime?: { active: boolean };
    Mvu?: typeof Mvu;
  };
  const helper =
    typeof getChatMessages === 'function' &&
    typeof createChatMessages === 'function' &&
    typeof triggerSlash === 'function';
  const ejs = typeof EjsTemplate === 'undefined' ? parent.EjsTemplate : EjsTemplate;
  const features = ejs?.getFeatures?.();
  const ejsReady = !!features?.enabled && !!features?.generate_enabled;
  const schemaReady = parent.EmbersRuntime?.active === true;
  const mvuReady = bound && typeof Mvu !== 'undefined' && typeof Mvu.getMvuData === 'function';
  let dataReady = false;
  let dataDetail = '等待本卡初始变量；请检查绑定世界书与 [InitVar] 条目';
  if (helper && mvuReady) {
    const data = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
    dataReady = data?.stat_data?._卡标识 === 'death-adaptation';
    if (data?.stat_data && !dataReady) dataDetail = '当前楼层不是本卡存档，请新建《余烬之后》聊天';
  }
  return [
    { name: '酒馆助手', ready: helper, detail: helper ? '界面与聊天接口已连接' : '请启用酒馆助手及前端界面渲染' },
    {
      name: '提示词模板 · EJS',
      ready: ejsReady,
      detail: ejsReady ? '动态世界书与生成处理已启用' : '请安装/启用提示词模板，并开启“处理生成内容”',
    },
    {
      name: 'MVU 变量框架',
      ready: mvuReady,
      detail: mvuReady ? '变量框架已就绪' : '等待 MVU；请启用本卡 MVU 脚本并检查公共依赖网络',
    },
    {
      name: '本卡变量结构',
      ready: schemaReady,
      detail: schemaReady ? '结构校验与数值保护已就绪' : '请启用“余烬之后 · 变量结构”脚本，等待依赖加载',
    },
    { name: '初始存档', ready: dataReady, detail: dataReady ? '角色与开局可以保存' : dataDetail },
  ];
}
