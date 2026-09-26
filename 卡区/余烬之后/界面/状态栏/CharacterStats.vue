<script setup lang="ts">
import {computed,onBeforeUnmount,ref} from 'vue';
import {CharacterAttributesSchema} from '../../src/schema';
import type {Schema} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
import {parseRepair} from '../../src/variable-repair';
import {entityMetrics} from '../../src/output-cards';
const props=defineProps<{state:Schema;id:string;latest?:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const base=ref<Schema>(),draft=ref(''),error=ref(''),working=ref(false),hint=ref('');
let generation='';
const preview=computed(()=>{try{return CharacterAttributesSchema.parse(parseRepair(draft.value));}catch{return null;}});
const metrics=computed(()=>preview.value?entityMetrics(undefined,preview.value):[]);
async function generate(){
 base.value=_.cloneDeep(props.state);error.value='';draft.value='';working.value=true;
 const id=generation='embers-character-stats-'+crypto.randomUUID();
 try{
  const response=await generateRaw({generation_id:id,should_silence:true,max_chat_history:0,
   overrides:{world_info_before:'',world_info_after:'',persona_description:'',chat_history:{with_depth_entries:false,prompts:[],author_note:''}},
   ordered_prompts:[{role:'system',content:'为指定角色补全初始属性。按身份、种族、能力、经历与当前身体情况协调定标，采用全知资料视角；生命和能量分别填写当前值与上限，概率取0到1。输出符合字段结构的属性JSON对象。'},
    {role:'user',content:JSON.stringify({人物:base.value.叙事.人物档案[props.id],当前位面:base.value._时空.位面目录[base.value._时空.当前地点.位面ID],字段:z.toJSONSchema(CharacterAttributesSchema,{io:'input'}),补充:hint.value})}]});
  if(generation!==id)return;
  if(typeof response!=='string')throw Error('AI没有返回文本');
  draft.value=JSON.stringify(CharacterAttributesSchema.parse(parseRepair(response)),null,2);
 }catch(e){if(generation===id)error.value=e instanceof Error?e.message:String(e);}
 finally{if(generation===id)working.value=false;}
}
function cancel(){if(generation)stopGenerationById(generation);generation='';working.value=false;}
function apply(){if(base.value && preview.value)emit('edit',{kind:'character-stats',id:props.id,attributes:preview.value,base:base.value});}
onBeforeUnmount(cancel);
</script>
<template><details class="stats-recovery"><summary>补全此角色属性</summary><div>
 <p>此档案尚未登记数值。生成后先核对，再保存到当前角色。</p>
 <label>定标补充（选填）<input v-model="hint" maxlength="1200" /></label>
 <button v-if="!working" :disabled="latest===false || !!state._待修复" @click="generate">让 AI 补全属性</button><button v-else @click="cancel">停止补全</button>
 <p v-if="error" role="alert">{{error}}</p>
 <template v-if="draft"><dl><div v-for="m in metrics" :key="m.label"><dt>{{m.label}}</dt><dd>{{m.value}}</dd></div></dl>
 <label>候选属性（可编辑）<textarea v-model="draft" aria-label="候选角色属性" /></label>
 <p v-if="!preview" role="alert">请核对属性格式与数值范围。</p>
 <button :disabled="latest===false || working || !preview || !!state._待修复" @click="apply">确认保存角色属性</button></template>
 </div></details></template>
<style scoped>
.stats-recovery{border:1px solid #bdcbb5;background:#f4f7ef;margin:12px 0;border-radius:4px;font:13px/1.8 sans-serif}summary{cursor:pointer;padding:12px}.stats-recovery>div{padding:0 12px 12px}label{display:grid;gap:6px}input,textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid #bdcbb5;background:#fafcf8;color:#324735;font:inherit}textarea{min-height:220px;font:12px/1.7 monospace}button{padding:9px;margin:8px 0;border:1px solid #b9cbb2;background:#e2eadb;color:#304733;border-radius:4px;cursor:pointer}button:disabled{opacity:.5}dl{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}dt{font-size:11px}dd{margin:0;font:17px/1.8 serif}[role=alert]{color:#993e2e}
</style>
