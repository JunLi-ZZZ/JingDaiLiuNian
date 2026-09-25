<script setup lang="ts">
import {computed,ref,onBeforeUnmount} from 'vue';
import type {Schema} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
import {missingCards,applyCardRecovery,cardRecoveryPrompt} from '../../src/card-recovery';
import type {MissingCard} from '../../src/card-recovery';
import {parseRepair} from '../../src/variable-repair';
import {resolveDossierCard} from '../../src/output-cards';
const props=defineProps<{state:Schema;story:string;latest:boolean;busy:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const targets=computed(()=>missingCards(props.state,props.story));
const selected=ref<MissingCard>(),base=ref<Schema>(),draft=ref(''),hint=ref(''),error=ref(''),working=ref(false);
let generation='';
const preview=computed(()=>{
 if(!selected.value || !base.value || !draft.value)return null;
 try{const candidate=parseRepair(draft.value),next=applyCardRecovery(base.value,selected.value,candidate);
 return {candidate,card:resolveDossierCard(next,selected.value.kind,selected.value.id),error:''};}
 catch(e){return {error:e instanceof Error?e.message:String(e)};}
});
function select(target:MissingCard){cancel();selected.value=target;base.value=_.cloneDeep(props.state);draft.value='';error.value='';}
async function generate(){
 if(!selected.value)return;
 if(!base.value || !_.isEqual(props.state,base.value))base.value=_.cloneDeep(props.state);
 error.value='';draft.value='';working.value=true;const id=generation='embers-supplement-'+crypto.randomUUID();
 try{
  const response=await generateRaw({generation_id:id,should_silence:true,max_chat_history:0,
   overrides:{world_info_before:'',world_info_after:'',persona_description:'',chat_history:{with_depth_entries:false,prompts:[],author_note:''}},
   ordered_prompts:cardRecoveryPrompt(base.value,selected.value,props.story,hint.value)});
  if(generation!==id)return;
  if(typeof response!=='string')throw Error('AI没有返回文本');
  draft.value=JSON.stringify(parseRepair(response),null,2);
 }catch(e){if(generation===id)error.value=e instanceof Error?e.message:String(e);}
 finally{if(generation===id)working.value=false;}
}
function cancel(){if(generation)stopGenerationById(generation);generation='';working.value=false;}
function apply(){if(preview.value?.card && selected.value && base.value)emit('edit',{kind:'supplement',target:selected.value,candidate:preview.value.candidate,base:base.value});}
onBeforeUnmount(cancel);
</script>
<template><section v-if="targets.length" class="missing-archives">
 <h4>补全正文档案 · {{targets.length}} 项</h4><p>正文引用的资料尚未入档。选择一项生成或关联已有资料，核对后保存。</p>
 <button v-for="target in targets" :key="target.kind+target.id" :aria-pressed="selected?.id===target.id && selected?.kind===target.kind" @click="select(target)">{{target.kind==='note'?'见闻':'人物'}} · {{target.id}}</button>
 <div v-if="selected" class="candidate"><label>补充依据（选填）<textarea v-model="hint" maxlength="2000" /></label>
 <button v-if="!working" :disabled="!latest || busy || !!state._待修复" @click="generate">让 AI 补全这一项</button><button v-else @click="cancel">停止补全</button>
 <p v-if="state._待修复">本轮还有失败更新，请先修复下方批次，再核对缺失档案。</p><p v-if="error" role="alert">{{error}}</p>
 <template v-if="draft"><details><summary>查看或编辑候选档案</summary><textarea v-model="draft" aria-label="候选补全档案" class="code" /></details>
 <p v-if="preview?.error" role="alert">{{preview.error}}</p>
 <article v-if="preview?.card"><small>{{preview.card.kind}} · {{preview.candidate && (preview.candidate as any).existingId?'关联已有档案':'新增档案'}}</small><h4>{{preview.card.title}}</h4><p>{{preview.card.description}}</p><p>{{preview.card.detail}}</p></article>
 <button :disabled="!latest || busy || working || !preview?.card || !!state._待修复" @click="apply">确认保存这项档案</button></template>
 </div>
</section></template>
<style scoped>
.missing-archives{padding:16px;margin-bottom:18px;border:1px solid #c0cab6;border-radius:6px;background:#eef2e7;font:13px/1.8 sans-serif;color:#324735}h4{margin:0;font:18px/1.6 serif}button{padding:9px 12px;border:1px solid #aebfa6;border-radius:4px;background:#e0e9d9;color:#304733;cursor:pointer;margin:6px 6px 0 0;overflow-wrap:anywhere}button[aria-pressed=true]{background:#304b3e;color:white}button:disabled{opacity:.5;cursor:default}.candidate{margin-top:14px;padding-top:12px;border-top:1px solid #c0cab6}label{display:grid}textarea{box-sizing:border-box;width:100%;padding:10px;min-height:65px;border:1px solid #b7c5b1;background:#fafcf8;color:inherit;font:inherit}.code{min-height:180px;font:12px/1.6 monospace}article{padding:14px;background:#fafcf8;border-left:3px solid #829686;margin-top:12px}p{white-space:pre-wrap}summary{cursor:pointer}[role=alert]{color:#993e2e}
</style>
