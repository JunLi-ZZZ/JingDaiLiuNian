<script setup lang="ts">
import { ref,shallowRef,onBeforeUnmount } from 'vue';
import type { Schema } from '../../src/schema';
import type { ArchiveEdit } from '../../src/settlement';
import { editSession } from '../../src/settlement';
import { readRuntime } from '../../src/runtime-store';
import { evolutionPrompt,parseEvolution,type EvolutionCandidate } from '../../src/evolution-generation';
import GradeBadge from './GradeBadge.vue';
const props=defineProps<{state:Schema;abilityId:string;latest?:boolean;preview?:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const opened=ref(false),working=ref(false),wish=ref(''),error=ref('');
const baseline=shallowRef<Schema|null>(null),choices=ref<EvolutionCandidate[]>([]);
let request='';
let origin='';
function context(){
  const id=getCurrentMessageId(),message=getChatMessages(id,{include_swipes:true})[0];
  return JSON.stringify([SillyTavern.getCurrentChatId(),getLastMessageId(),id,message?.swipe_id,message?.swipes?.[message.swipe_id]]);
}
function candidate(choice:EvolutionCandidate){
  if(!baseline.value)throw Error('请先生成进化方案');
  return editSession({stat_data:baseline.value,death_adaptation_runtime:readRuntime({stat_data:baseline.value})!},{kind:'evolution',abilityId:props.abilityId,...choice,base:baseline.value});
}
function stop(){if(request && typeof stopGenerationById==='function')stopGenerationById(request);request='';working.value=false;}
async function generate(){
  opened.value=true;error.value='';choices.value=[];working.value=true;
  baseline.value=_.cloneDeep(props.state);
  const id=request='embers-evolution-'+crypto.randomUUID();
  try{
    if(props.preview)throw Error('进化会调用酒馆当前模型，请在导入的卡片中使用。');
    origin=context();
    const story=getChatMessages(getCurrentMessageId())[0]?.message||'';
    const response=await generateRaw({generation_id:id,should_silence:true,ordered_prompts:evolutionPrompt(baseline.value,props.abilityId,wish.value,story.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g,''))});
    if(request!==id)return;
    if(context()!==origin || !_.isEqual(props.state,baseline.value))throw Error('场景或能力已变化，请根据当前情况重新生成');
    if(typeof response!=='string')throw Error('AI没有返回进化方案');
    const parsed=parseEvolution(response);for(const choice of parsed)candidate(choice);
    choices.value=parsed;
  }catch(e){if(request===id)error.value=e instanceof Error?e.message:String(e);}
  finally{if(request===id)working.value=false;}
}
function select(choice:EvolutionCandidate){
  try{
    if(!baseline.value || context()!==origin || !_.isEqual(props.state,baseline.value))throw Error('场景或能力已变化，请重新生成');
    candidate(choice);
    emit('edit',{kind:'evolution',abilityId:props.abilityId,...choice,base:baseline.value});
  }catch(e){error.value=e instanceof Error?e.message:String(e);}
}
onBeforeUnmount(stop);
</script>
<template>
 <section class="evolution">
  <button v-if="!opened" :disabled="latest===false" @click="generate">进化</button>
  <template v-else>
   <p>结合这项能力的经历与当前处境，推演新的可能。</p>
   <label>你的想法（可选）<textarea v-model="wish" maxlength="1600" placeholder="留空即可直接生成，也可以写下你希望能力发生的变化。" /></label>
   <button v-if="working" @click="stop">停止推演</button>
   <button v-else :disabled="latest===false" @click="generate">{{choices.length?'重新推演':'生成进化方案'}}</button>
   <p v-if="error" role="alert">{{error}}</p>
   <article v-for="choice in choices" :key="choice.direction" class="evolution-choice">
    <h4>{{choice.design.name||state._能力[abilityId].名称}} · {{choice.direction}} <GradeBadge :grade="candidate(choice).stat_data._能力[abilityId].品阶" /></h4>
    <p>{{choice.design.principle}}</p><p>{{choice.design.description}}</p>
    <dl><dt>契机</dt><dd>{{choice.design.evidence}}</dd><dt>触发</dt><dd>{{choice.design.trigger}}</dd><dt>条件与代价</dt><dd>{{choice.design.limitations}}</dd></dl>
    <details><summary>数值变化</summary><p v-if="choice.design.cost!==undefined">能量消耗 {{choice.design.cost}}</p><p v-if="choice.design.cooldown!==undefined">冷却 {{choice.design.cooldown}}秒</p><p v-if="choice.design.utility">专项检定加值 {{choice.design.utility.bonus}}</p><p v-if="choice.design.strike">攻击倍率 {{choice.design.strike.power}} · 固定伤害 {{choice.design.strike.fixed}} · 耗时 {{choice.design.strike.seconds}}秒 · {{choice.design.strike.mechanism}}</p><p v-if="choice.design.conversion">单次转化 {{choice.design.conversion.capacity}} · 储能上限 {{choice.design.conversion.storage}} · 释放倍率 {{choice.design.conversion.multiplier}} · {{choice.design.conversion.mechanism}}</p></details>
    <button :disabled="latest===false||working" @click="select(choice)">选择这项进化</button>
   </article>
  </template>
 </section>
</template>
<style scoped>
.evolution{margin-top:16px;border-top:1px solid #9daa9580;padding-top:12px;font:12px/1.8 sans-serif}.evolution-choice{margin-top:14px;border:1px solid #bbc4ae;padding:16px;background:#f4f3e9;border-radius:5px}h4{font:600 17px/1.7 serif;margin:0 0 8px}button{padding:9px 14px;border:0;border-radius:4px;background:#304b3e;color:#fff;cursor:pointer}button:disabled{opacity:.5}label{display:grid;gap:6px}textarea{box-sizing:border-box;width:100%;min-height:65px;padding:8px;border:1px solid #a8b69e;background:#f9faf3;color:#304437;font:inherit;margin-bottom:10px}dl{margin:10px 0}dt{font-weight:bold;color:#61745a}dd{margin:0 0 6px;overflow-wrap:anywhere}summary{cursor:pointer}details{margin:10px 0}[role=alert]{color:#9d402d}
</style>
