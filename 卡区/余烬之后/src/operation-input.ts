/** 接受等价的JSON序列化形态，动作含义始终由显式对象给出。 */
export function normalizeOperations(value:unknown):unknown {
  const decode=(input:unknown):unknown=>{
    if(typeof input!=='string')return input;
    const trimmed=input.trim();
    if(!trimmed.startsWith('{') && !trimmed.startsWith('['))return input;
    try{return JSON.parse(trimmed);}catch{return input;}
  };
  const decoded=decode(value);
  const numeric=new Set(['amount','rate','seconds','difficulty','before','value','cost','cooldown','power','capacity']);
  const operation=(item:unknown):unknown=>{
    const result=decode(item);
    if(!result || typeof result!=='object' || Array.isArray(result))return result;
    return Object.fromEntries(Object.entries(result).map(([key,v])=>[key,numeric.has(key) && typeof v==='string' && /^-?\d+(?:\.\d+)?$/.test(v.trim())?Number(v):v]));
  };
  if(Array.isArray(decoded))return decoded.map(operation);
  if(decoded && typeof decoded==='object' && '操作' in decoded)return {...decoded,操作:normalizeOperations(decoded.操作)};
  return decoded;
}
