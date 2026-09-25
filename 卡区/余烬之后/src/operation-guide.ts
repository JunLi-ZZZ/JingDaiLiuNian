import { AbilityDesignSchema } from './ability-design';
import { OperationSchema } from './schema';
import { grades } from './grades';
/** 由运行时schema派生字段契约；规则与校验共享数据来源。 */
export function operationGuide(kinds:string[]=[]):string {
  const describe=(s:any,key=''):string=>{
    if(key==='design' && s.properties?.grade)return '能力定义';
    if(s.type==='object' && s.properties)return '{'+Object.entries(s.properties).map(([key,value])=>key+(s.required?.includes(key)?'':'?')+':'+describe(value,key)).join(', ')+'}';
    if(s.type==='object' && typeof s.additionalProperties==='object')return '{[ID]:'+describe(s.additionalProperties)+'}';
    if(s.type==='array')return '['+describe(s.items)+']';
    let result=s.const!==undefined?JSON.stringify(s.const):s.enum?s.enum.join('|'):s.anyOf?s.anyOf.map(describe).join('|'):s.type||'值';
    if(s.minimum!==undefined)result+=' ≥'+s.minimum;
    if(s.exclusiveMinimum!==undefined)result+=' >'+s.exclusiveMinimum;
    if(s.maximum!==undefined)result+=' ≤'+s.maximum;
    if(s.minLength!==undefined)result+=' 长度≥'+s.minLength;
    if(s.default!==undefined)result+=' 默认'+JSON.stringify(s.default);
    return result;
  };
  const selected=OperationSchema.options.filter(s=>kinds.length ? kinds.includes(s.shape.kind.value) : s.shape.kind.value!=='encounter');
  const lines=selected.map(s=>{
    const json:any=z.toJSONSchema(s,{io:'input'});
    return s.shape.kind.value+': '+Object.entries(json.properties).map(([key,value])=>key+(json.required?.includes(key)?'':'?')+'='+(key==='grade'?grades.join('|'):describe(value,key))).join('；');
  }).join('\n');
  return lines+(selected.some(s=>['define','compose'].includes(s.shape.kind.value))?'\n能力定义='+describe(z.toJSONSchema(AbilityDesignSchema,{io:'input'})):'');
}
