/** 仅格式化已筛选的提示词视图；不把完整账本带入上下文。可独立序列化给EJS。 */
export function formatPromptView(view:any):string {
  const entries=(o:any):[string,any][]=>Object.entries(o||{});
  const clean=(v:any):any=>{
    if(Array.isArray(v))return v.map(clean).filter(x=>x!==undefined);
    if(v && typeof v==='object')return Object.fromEntries(entries(v).map(([k,x])=>[k,clean(x)]).filter(([,x])=>x!==undefined));
    return v===null || v===undefined || v===''?undefined:v;
  };
  const lines=(value:any,indent=0):string=>{
    const prefix=' '.repeat(indent);
    if(Array.isArray(value))return value.map(x=>prefix+'- '+(typeof x==='object'?'\n'+lines(x,indent+2):String(x))).join('\n');
    return entries(value).map(([key,v])=>{
      if(v===undefined || (v && typeof v==='object' && !Object.keys(v).length))return '';
      if(typeof v==='object')return prefix+key+':\n'+lines(v,indent+2);
      return prefix+key+': '+String(v).replace(/\n/g,'\n'+prefix+'  ');
    }).filter(Boolean).join('\n');
  };
  const ability=Object.fromEntries(entries(view._能力).map(([id,a])=>{
    const effect=Object.values(a.效果||{}).map((e:any)=>{
      const p=e.参数||{};
      if(e.规则ID==='combat-strike-1')return '攻击：'+p.机制ID+'；倍率'+p.倍率+'，固定伤害'+p.固定伤害+'，耗时'+p.耗时本地秒+'秒';
      if(e.规则ID==='trial-convert')return '转化：'+p.mechanism+'，单次上限'+p.capacity;
      if(e.规则ID==='trial-release')return '储能释放：倍率'+p.multiplier;
      if(e.规则ID==='world-crossing')return '跨位面旅行；冷却采用虚海秒';
      if(e.规则ID==='general-utility')return '技艺运用；专项检定加值'+(p.检定加值||0);
      return lines(p);
    }).filter(Boolean).join('；');
    return [id,{名称:a.名称,品阶:a.品阶,掌握:'Lv.'+a.等级+'，熟练'+a.熟练度+'/'+a.等级*5,进化:a.进化方向,来源:a.来源?.类型,来历:a.来源?.说明,用法:a.用法,描述:a.描述,触发:a.触发条件,作用:effect,消耗:a.消耗,冷却:a.冷却本地秒?(a.冷却本地秒+(a.效果?.travel?'虚海秒':'当地秒')):undefined,条件:a.限制}];
  }));
  const actors=Object.fromEntries(entries(view._实体).map(([id,a])=>[id,{名称:a.名称,档案:a.档案,状态:a.生命阶段,生命:a.生命?a.生命.当前+'/'+a.生命.上限:undefined,战斗:a.战斗,资源:Object.fromEntries(entries(a.资源).map(([key,r])=>[key,r.名称+' '+r.当前+'/'+(r.上限??'∞')+' '+r.单位])),状态效果:a.状态,装备:a.装备}]));
  const cooldown=entries(view._结算?.冷却结束).map(([id,end])=>id+' 剩余'+Math.max(0,end-view._时空.起源时刻秒)+'虚海秒');
  const plane=entries(view._时空?.位面目录)[0];
  const clock=plane?.[1]?.时钟;
  const local=clock?clock.本地基准秒+(view._时空.起源时刻秒-clock.起源基准秒)*clock.本地每起源秒:0;
  const calendar=clock?.历法,minutes=calendar?.每小时分钟||60,seconds=calendar?.每分钟秒||60,hours=calendar?.每天小时||24;
  const dayIndex=Math.floor(local/(hours*minutes*seconds));
  let date='历时 '+Math.floor(local)+' 秒';
  if(calendar?.每月天数?.length){
    const yearDays=calendar.每月天数.reduce((sum:number,n:number)=>sum+n,0);
    let day=dayIndex%yearDays,month=0;
    while(day>=calendar.每月天数[month])day-=calendar.每月天数[month++];
    date=calendar.名称+' '+(calendar.元年+Math.floor(dayIndex/yearDays))+'年'+(month+1)+'月'+(day+1)+'日';
  }
  const time=String(Math.floor(local/(minutes*seconds))%hours).padStart(2,'0')+':'+String(Math.floor(local/seconds)%minutes).padStart(2,'0')+':'+String(Math.floor(local)%seconds).padStart(2,'0');
  const snapshot=clean({
    当前世界:plane?{名称:plane[1].名称,位面ID:plane[0],地点:view._时空.当前地点,当地时间:date+(calendar?' '+time:''),流速:clock?.本地每起源秒,背景:plane[1].简介}:undefined,
    主角:{ID:view._开局?.主角ID,...view._开局?.档案,伴生灵ID:view._开局?.伴生灵ID},
    人物与数值:actors,
    能力:ability,其余能力索引:view.能力索引,
    物品:view._物品,任务:view._任务,
    最近死亡:Object.fromEntries(entries(view._死亡记录).map(([id,d])=>[id,{实体ID:d.实体ID,位面ID:d.位面ID,地点ID:d.地点ID,死因:Object.values(d.因果链||{}).map((c:any)=>({机制:c.机制ID,作用:c.作用条件,伤害:c.实际伤害,致死:c.直接致死})),衍生能力:Object.keys(d.授予能力ID||{})}])),
    复苏:view._复苏?{状态:view._复苏.阶段,剩余虚海秒:view._复苏.完成起源秒==null?'尚未确定':Math.max(0,view._复苏.完成起源秒-view._时空.起源时刻秒)}:undefined,
    冷却:cooldown.length?cooldown:undefined,
    档案概况:view.档案概况,
    最近结果:view.最近结果?.map((e:any)=>e.结果),
  });
  const editable=clean({...view.叙事,待审提案:view.待审提案});
  return '<当前状态>\n'+lines(snapshot)+'\n结算版本: '+view._结算?.状态版本+'\n</当前状态>\n<叙事记录>\n'+lines(editable)+'\n</叙事记录>'+
    (view.上轮结算反馈?'\n<待处理更新>\n'+view.上轮结算反馈+'\n'+lines(clean(view.待修复操作))+'\n</待处理更新>':'');
}
