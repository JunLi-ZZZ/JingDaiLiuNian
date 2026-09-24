<script setup lang="ts">
import { ref,computed,watch,onBeforeUnmount } from 'vue';
import { AbilityDesignSchema, type AbilityDesign, type InitialAbilityChoice } from '../../src/ability-design';
import { abilityPresets } from '../../src/ability-presets';
import { grades } from '../../src/grades';
const props=defineProps<{profile:unknown;scenario:unknown;ready?:boolean;preview?:boolean;requestAbility?:(wish:string,profile:unknown,scenario:unknown)=>Promise<AbilityDesign>;cancelGeneration?:()=>void}>();
const selection=defineModel<InitialAbilityChoice>({required:true});
const emit=defineEmits<{busy:[value:boolean]}>();
const mode=ref(selection.value.mode==='designed'?'custom':selection.value.mode),wish=ref(''),busy=ref(false),error=ref('');
const draft=ref<AbilityDesign>(selection.value.design?JSON.parse(JSON.stringify(selection.value.design)):AbilityDesignSchema.parse({grade:'凡尘',usage:'主动',description:'待构思',trigger:'主动运用',limitations:'',principle:'依据自定义能力的实际机理。',name:'未命名能力'}));
const modes=[['origin','起源涅槃'],['devour','吞噬进化'],['synthesis','合成进化'],['custom','自定义能力'],['random','随机灵感'],['none','暂不选择']];
const editable=computed(()=>!['origin','none'].includes(mode.value));
let token=0;
const saved=new Map<string,{design:AbilityDesign;wish:string}>();
function sync(){selection.value=mode.value==='origin'?{mode:'origin'}:mode.value==='none'?{mode:'none'}:{mode:'designed',design:JSON.parse(JSON.stringify(draft.value))};}
function choose(value:string){
  if(value===mode.value)return;
  saved.set(mode.value,{design:JSON.parse(JSON.stringify(draft.value)),wish:wish.value});
  if(busy.value)cancel();else ++token;
  mode.value=value;error.value='';
  const cached=saved.get(value);
  if(cached){draft.value=cached.design;wish.value=cached.wish;}
  else{
    if(abilityPresets[value])draft.value=structuredClone(abilityPresets[value]);
    else if(['custom','random'].includes(value))draft.value={name:'',grade:'凡尘',usage:'主动',description:'',trigger:'主动运用',limitations:'',principle:'依据能力本身的作用机理。',cost:0,cooldown:0};
    wish.value='';
  }
  sync();
}
watch(draft,sync,{deep:true});
async function generate(){
  const current=++token,context=JSON.stringify([props.profile,props.scenario]);busy.value=true;emit('busy',true);error.value='';
  try{
    if(!props.requestAbility)throw Error('请在酒馆中连接模型后生成；也可直接填写能力设定');
    const input=[draft.value.name?JSON.stringify(draft.value):'',wish.value].filter(Boolean).join('\n');
    const result=await props.requestAbility(input,props.profile,props.scenario);
    if(current!==token)return;
    if(context!==JSON.stringify([props.profile,props.scenario]))throw Error('人物或场景已经改变，请按当前设定重新构思');
    draft.value=AbilityDesignSchema.parse(result);sync();
  }catch(reason){if(current===token)error.value=reason instanceof Error?reason.message:String(reason);}
  finally{if(current===token){busy.value=false;emit('busy',false);}}
}
function cancel(){++token;busy.value=false;emit('busy',false);try{props.cancelGeneration?.();}catch{error.value='已停止接收结果，远端请求未能中断。';}}
onBeforeUnmount(()=>{if(busy.value)cancel();});
function toggle(key:'utility'|'strike'|'conversion',enabled:boolean){
  if(!enabled){delete draft.value[key];return;}
  if(key==='utility')draft.value.utility={bonus:0};
  if(key==='strike')draft.value.strike={mechanism:'impact',power:1,fixed:0,seconds:6};
  if(key==='conversion')draft.value.conversion={mechanism:'impact',capacity:10,storage:20,multiplier:1};
}
</script>
<template>
<section class="initial-ability">
  <header><span>YOUR FIRST GIFT</span><h2>带什么力量启程</h2><p>选一个起点，或写下自己的构想。能力可以在旅途中继续成长。</p></header>
  <div class="ability-modes"><button v-for="[id,label] in modes" :key="id" type="button" :aria-pressed="mode===id" @click="choose(id)">{{label}}</button></div>
  <p v-if="mode==='origin'" class="summary">起源涅槃将致命经历转为新的能力。默认故事从第一次死亡后的归泊庭开始。</p>
  <p v-else-if="mode==='none'" class="summary">从自身的身份与经历启程，途中再学习、邂逅或发现新的力量。</p>
  <template v-else>
    <label class="wish">能力构想<textarea v-model="wish" rows="3" placeholder="想让能力怎样作用？可以写一句灵感，也可以给出完整设定；留白可自由构思。" /></label>
    <div class="generate-row"><button type="button" :disabled="busy||(!preview&&!ready)" @click="generate">{{busy?'正在构思…':preview?'演示构思能力':'AI 构思 / 重拟能力'}}</button><button v-if="busy" type="button" @click="cancel">取消</button></div>
    <fieldset v-if="editable" :disabled="busy" class="design">
      <legend>能力档案 · 可直接编辑</legend>
      <label>能力名称<input v-model="draft.name" maxlength="80" /></label>
      <label>本质序列<select v-model="draft.grade"><option v-for="grade in grades" :key="grade">{{grade}}</option></select></label>
      <label class="wide">作用<textarea v-model="draft.description" rows="4" maxlength="2000" /></label>
      <details class="wide"><summary>机理、条件与数值</summary><div class="fields">
        <label class="wide">形成机理<textarea v-model="draft.principle" rows="2" maxlength="1000" /></label>
        <label>触发条件<textarea v-model="draft.trigger" rows="2" maxlength="600" /></label><label>代价与局限<textarea v-model="draft.limitations" rows="2" maxlength="1000" /></label>
        <label>运用方式<select v-model="draft.usage"><option>主动</option><option>被动</option><option>复合</option></select></label>
        <label>能量消耗<input v-model.number="draft.cost" type="number" min="0" max="100000" /></label><label>冷却（当地秒）<input v-model.number="draft.cooldown" type="number" min="0" max="86400" /></label>
        <div class="wide toggles"><label><input type="checkbox" :checked="!!draft.utility" @change="toggle('utility',($event.target as HTMLInputElement).checked)" />专项检定</label><label><input type="checkbox" :checked="!!draft.strike" @change="toggle('strike',($event.target as HTMLInputElement).checked)" />直接攻防</label><label><input type="checkbox" :checked="!!draft.conversion" @change="toggle('conversion',($event.target as HTMLInputElement).checked)" />转化储能</label><label><input v-model="draft.travel" type="checkbox" />位面旅行</label><label><input v-model="draft.transformation" type="checkbox" />素材转为能力</label></div>
        <label v-if="draft.utility">检定加值<input v-model.number="draft.utility.bonus" type="number" min="0" max="8" /></label>
        <template v-if="draft.strike"><label>攻击机制ID<input v-model="draft.strike.mechanism" /></label><label>攻击倍率<input v-model.number="draft.strike.power" type="number" min="0.01" max="100" step="0.1" /></label><label>固定伤害<input v-model.number="draft.strike.fixed" type="number" min="0" /></label><label>动作耗时（秒）<input v-model.number="draft.strike.seconds" type="number" min="0.01" /></label></template>
        <template v-if="draft.conversion"><label>转化机制ID<input v-model="draft.conversion.mechanism" /></label><label>单次转化量<input v-model.number="draft.conversion.capacity" type="number" min="0.01" /></label><label>储能上限<input v-model.number="draft.conversion.storage" type="number" min="0.01" /></label><label>释放倍率<input v-model.number="draft.conversion.multiplier" type="number" min="0.01" step="0.1" /></label></template>
      </div></details>
    </fieldset>
  </template>
  <p v-if="error" role="alert">{{error}}</p>
</section>
</template>
<style scoped>
.initial-ability{margin-top:28px;padding:24px;border:1px solid #c9c7b8;background:linear-gradient(140deg,#f5f1e7,#eef4ef);color:#293f3a;overflow-wrap:anywhere}header{padding:0;background:none}header span{font-size:10px;letter-spacing:.2em;color:#897447}h2{font:500 23px SimSun,serif;margin:10px 0}p{font-size:13px;line-height:1.85}.ability-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}button{border:1px solid #bac8bf;padding:11px;background:#fafbf6;color:#2c483d;font:inherit;cursor:pointer}button[aria-pressed=true]{background:#304d44;color:#faf4e5;border-color:#304d44}button:disabled{opacity:.5;cursor:wait}.summary{padding:10px 0}.wish{display:grid;gap:8px;margin-top:20px}.generate-row{display:flex;gap:8px;margin:12px 0}fieldset.design{margin:18px 0 0;padding:18px 0 0;border:0;border-top:1px solid #c4c7b9}.design,.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.wide{grid-column:1/-1}label{display:grid;gap:7px;font-size:12px;min-width:0}input,textarea,select{box-sizing:border-box;width:100%;min-width:0;border:1px solid #bbc9c0;background:#fffefa;color:#243b32;padding:10px;font:inherit;line-height:1.7}textarea{resize:vertical}summary{cursor:pointer;padding:8px 0;color:#576d61}.fields{padding-top:12px}.toggles{display:flex;flex-wrap:wrap;gap:14px}.toggles label{display:flex;align-items:center}.toggles input{width:auto}[role=alert]{color:#843b30}@media(max-width:430px){.initial-ability{padding:16px}.ability-modes{grid-template-columns:repeat(2,minmax(0,1fr))}.design,.fields{grid-template-columns:1fr}.wide{grid-column:auto}}
</style>
