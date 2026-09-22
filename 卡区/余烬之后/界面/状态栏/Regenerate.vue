<script setup lang="ts">
import { computed, ref, shallowRef, onBeforeUnmount } from 'vue';
import { Schema } from '../../src/schema';
import { parseRepair, applyRepairPatch, repairPrompt, repairIssues, assertLocalRepair } from '../../src/variable-repair';
import { readRuntime } from '../../src/runtime-store';
import { stateChanges } from '../../src/state-changes';
import type { ArchiveEdit } from '../../src/settlement';
const props=defineProps<{state:Schema;latest:boolean;busy:boolean;story?:string}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const working=ref(false), hint=ref(''), draft=ref(''), error=ref('');
const baseline=shallowRef<Schema|null>(null);
let generationId='';
const candidate=computed(()=>{
  if(!draft.value || !baseline.value) return null;
  try {
    const patch=parseRepair(draft.value);
    const session=applyRepairPatch({stat_data:baseline.value,death_adaptation_runtime:readRuntime({stat_data:baseline.value})!},patch);
    return {patch,session,error:''};
  }catch(e){return {error:e instanceof Error?e.message:String(e)};}
});
const changes=computed(()=>candidate.value?.session ? stateChanges(baseline.value,candidate.value.session.stat_data):[]);
const issues=computed(()=>{try{return repairIssues(baseline.value || props.state,draft.value?parseRepair(draft.value):[]);}catch{return [];}});
async function generate() {
  error.value='';working.value=true;
  if(!baseline.value || !_.isEqual(props.state,baseline.value)){baseline.value=_.cloneDeep(props.state);draft.value='';}
  generationId='embers-repair-'+crypto.randomUUID();
  const id=generationId;
  try {
    const previous=draft.value?parseRepair(draft.value):[];
    if(!repairIssues(baseline.value,previous).length){draft.value=JSON.stringify(previous,null,2);return;}
    const response=await generateRaw({generation_id:id,should_silence:true,
      ordered_prompts:repairPrompt(baseline.value,props.story||'',hint.value,previous)});
    if(generationId!==id)return;
    if(typeof response!=='string') throw Error('AI没有返回文本');
    const addition=parseRepair(response);
    assertLocalRepair(baseline.value,previous,addition);
    draft.value=JSON.stringify([...(previous as unknown[]),...(addition as unknown[])],null,2);
  } catch(e){if(generationId===id)error.value=e instanceof Error?e.message:String(e);}
  finally {if(generationId===id)working.value=false;}
}
function cancel(){if(generationId)stopGenerationById(generationId);generationId='';working.value=false;}
function apply(){
  if(!candidate.value?.session || !baseline.value)return;
  if(!_.isEqual(props.state,baseline.value)){error.value='存档已变化，请重新生成或重新核对候选。';return;}
  emit('edit',{kind:'regenerate',patch:candidate.value.patch,base:baseline.value});
}
onBeforeUnmount(cancel);
</script>
<template>
 <section v-if="state._待修复" class="regenerate">
  <h4>修复失败变量</h4><p>保留本轮已有更新，只修正报错字段；合并校验后预览结果，确认再保存。</p>
  <details v-if="issues.length" class="issue-details"><summary>{{issues.length}} 处待修正 · 查看字段</summary><ul class="issue-list"><li v-for="issue in issues" :key="issue.路径"><code>{{issue.路径}}</code><span>{{issue.原因}}</span></li></ul></details>
  <label>补充依据（可选）<textarea v-model="hint" placeholder="补充这项变化在正文中的依据或正确值。" maxlength="2000" /></label>
  <button v-if="!working" :disabled="!latest || busy" @click="generate">{{issues.length?'让 AI 修复报错项':'预览原更新重试'}}</button><button v-else @click="cancel">停止生成</button>
  <p v-if="error" role="alert">{{error}}</p>
  <template v-if="draft"><details><summary>查看或编辑候选补丁</summary><textarea v-model="draft" class="code" aria-label="候选变量补丁" /></details>
   <p v-if="candidate?.error" role="alert">尚未通过校验：{{candidate.error}}</p>
   <template v-else><p>校验通过 · {{changes.length}} 项状态变化</p><p v-for="(change,index) in changes" :key="index">{{change.label}}：{{change.before}} → {{change.after}}</p><p>原更新与局部修正一起保存。</p></template>
   <button :disabled="!latest || busy || working || !candidate?.session" @click="apply">确认保存修复结果</button>
  </template>
 </section>
</template>
<style scoped>
.issue-list{padding-left:18px}.issue-list code{display:block;overflow-wrap:anywhere}.issue-list span{font-size:11px;color:#8f4936}
.regenerate{padding:16px;margin:12px 0 20px;border:1px solid #bfcfbc;border-radius:6px;background:#e8efe3;font:12px/1.8 sans-serif}h4{margin:0;font-size:16px}label{display:grid;gap:6px}textarea{box-sizing:border-box;width:100%;min-height:65px;padding:10px;background:#fafcf8;border:1px solid #b8c6b2;border-radius:4px;font:inherit;color:#304437}.code{min-height:260px;font:12px/1.6 monospace}button{background:#304b3e;color:white;border:0;border-radius:4px;padding:10px 14px;margin-top:10px;cursor:pointer}button:disabled{opacity:.5;cursor:default}details{margin-top:12px}summary{cursor:pointer}[role=alert]{color:#9d402d}
</style>
