import { OperationSchema } from './schema';
/** 由运行时schema派生字段契约；规则与校验共享数据来源。 */
export function operationGuide(kinds:string[]=[]):string {
  const describe=(s:any):string=>{
    if(s.type==='object' && s.properties)return '{'+Object.entries(s.properties).map(([key,value])=>key+(s.required?.includes(key)?'':'?')+':'+describe(value)).join(', ')+'}';
    if(s.type==='array')return '['+describe(s.items)+']';
    let result=s.const!==undefined?JSON.stringify(s.const):s.enum?s.enum.join('|'):s.anyOf?s.anyOf.map(describe).join('|'):s.type||'值';
    if(s.minimum!==undefined)result+=' ≥'+s.minimum;
    if(s.exclusiveMinimum!==undefined)result+=' >'+s.exclusiveMinimum;
    if(s.maximum!==undefined)result+=' ≤'+s.maximum;
    if(s.minLength!==undefined)result+=' 长度≥'+s.minLength;
    if(s.default!==undefined)result+=' 默认'+JSON.stringify(s.default);
    return result;
  };
  return OperationSchema.options.filter(s=>!kinds.length || kinds.includes(s.shape.kind.value)).map(s=>{
    const json:any=z.toJSONSchema(s,{io:'input'});
    return s.shape.kind.value+': '+Object.entries(json.properties).map(([key,value])=>key+(json.required?.includes(key)?'':'?')+'='+describe(value)).join('；');
  }).join('\n');
}
