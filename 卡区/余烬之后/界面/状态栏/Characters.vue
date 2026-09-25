<script setup lang="ts">
import {ref,computed} from 'vue';
import {characterGroups} from '../../src/archive-tools';
import ArchiveRemove from './ArchiveRemove.vue';
import { CharacterDossierSchema } from '../../src/schema';
import { characterArchive, characterEntity } from '../../src/character-dossier';
import { entityMetrics } from '../../src/output-cards';
import type {Schema,LibraryEntry} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
const props=defineProps<{state:Schema;latest?:boolean;category?:string}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit];archive:[entry:LibraryEntry]}>();
const search=ref(''),editing=ref(''),draft=ref(''),error=ref('');
const groups=computed(()=>characterGroups(props.state,search.value));
const people=computed(()=>props.category==='生物'?[]:groups.value.people);
const creatures=computed(()=>props.category==='生物'?groups.value.creatures:groups.value.entities);
const entityEdit=ref(''),entityName=ref(''),entityCategory=ref<'人物'|'生物'>('人物'),dossierId=ref(''),entityBase=ref<Schema>();
function editEntity(id:string){const e=props.state._实体[id];entityEdit.value=id;entityName.value=e.名称;entityCategory.value=e.类别==='生物'?'生物':'人物';dossierId.value=Object.entries(props.state.叙事.人物档案).find(([key,p])=>(p.实体ID||key)===id)?.[0]||'';entityBase.value=_.cloneDeep(props.state);}
function saveEntity(){if(entityBase.value)emit('edit',{kind:'classify',id:entityEdit.value,name:entityName.value,category:entityCategory.value,dossierId:dossierId.value,base:entityBase.value});entityEdit.value='';}
function begin(id:string){editing.value=id;draft.value=JSON.stringify(props.state.叙事.人物档案[id],null,2);error.value='';}
function save(){try{const dossier=CharacterDossierSchema.parse(JSON.parse(draft.value));emit('edit',{kind:'character',id:editing.value,dossier});editing.value='';}catch(e){error.value=String(e);}}
function archive(id:string){
 emit('archive',characterArchive(props.state,id));
}
function metrics(id:string){
 const e=characterEntity(props.state,id);
 if(!e)return [];
 return [...entityMetrics(e),...(e.战斗?[
  {label:'命中',value:Math.round(e.战斗.命中率*100)+'%'},{label:'闪避',value:Math.round(e.战斗.闪避率*100)+'%'},
  {label:'暴击',value:Math.round(e.战斗.暴击率*100)+'%'},{label:'暴击倍率',value:e.战斗.暴击倍率+'×'},
 ]:[])];
}
</script>
<template><section class="characters"><h3>{{category==='生物'?'旅途生灵':'旅途中的人'}}</h3><p>{{category==='生物'?'本地生物与当前数值记录。':'身份与性情留在档案，经历与约定随旅途延续。'}}</p><input v-model="search" placeholder="搜索姓名、别名或身份" aria-label="搜索人物" />
<details v-for="[id,p] in people" :key="id"><summary><span>{{p.在场?'在场':'别处'}} · {{p.身份}}</span><strong>{{p.名称}}</strong><small>{{p.近况}}</small></summary><div class="body">
<dl v-if="metrics(id).length" class="person-metrics"><div v-for="metric in metrics(id)" :key="metric.label"><dt>{{metric.label}}</dt><dd>{{metric.value}}</dd></div></dl>
<p v-for="field in (['性别','年龄','种族','来源世界','外貌','性格','动机','说话方式','能力与局限','背景经历','日常喜好','已知信息','关系经历'] as const)" :key="field"><b>{{field}}</b><br />{{p[field] || '尚未记录'}}</p>
<button :disabled="latest===false" @click="begin(id)">编辑人物档案</button><button :disabled="latest===false" @click="archive(id)">整理为世界书档案</button><button v-if="characterEntity(state,id)" :disabled="latest===false" @click="editEntity(p.实体ID||id)">编辑实体分类</button><ArchiveRemove :id="id" :state="state" :latest="latest" category="character" @edit="emit('edit',$event)" />
</div></details>
<details v-for="[id,e] in creatures" :key="id"><summary><span>{{e.类别}} · {{e.生命阶段}}</span><strong>{{e.名称}}</strong></summary><div class="body"><p>{{e.档案.外貌}}</p><dl class="person-metrics"><div v-for="metric in metrics(id)" :key="metric.label"><dt>{{metric.label}}</dt><dd>{{metric.value}}</dd></div></dl><button :disabled="latest===false" @click="editEntity(id)">编辑实体分类</button><ArchiveRemove :id="id" :state="state" :latest="latest" category="entity" @edit="emit('edit',$event)" /></div></details>
<p v-if="!people.length && !creatures.length">重要人物出场后，会由本轮变量更新收录到这里。</p>
<section v-if="entityEdit" class="entity-editor"><h4>编辑实体分类</h4><label>实体名称<input v-model="entityName" /></label><label>类别<select v-model="entityCategory" aria-label="类别"><option>人物</option><option>生物</option></select></label><label>关联人物档案<select v-model="dossierId" aria-label="关联人物档案"><option value="">不新增关联</option><option v-for="[id,p] in Object.entries(state.叙事.人物档案)" :key="id" :value="id">{{p.名称}} · {{id}}</option></select></label><button :disabled="latest===false || !entityName.trim()" @click="saveEntity">保存实体分类</button><button @click="entityEdit=''">取消</button></section>
<section v-if="editing"><h4>编辑档案</h4><textarea v-model="draft" aria-label="人物档案编辑" /><p role="alert">{{error}}</p><button :disabled="latest===false" @click="save">保存修改</button><button @click="editing=''">取消</button></section>
</section></template>
<style scoped>
.entity-editor{padding:14px;border:1px solid #bdcbb5;background:#f4f7ef}.entity-editor label{display:grid;gap:6px;margin:10px 0}.entity-editor select{max-width:100%;padding:9px;border:1px solid #bdcbb5;background:#fafcf8}.characters{font:13px/1.8 sans-serif;color:#324735}h3{font:22px serif}input,textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #c1d0bc;border-radius:4px;background:#fafcf8;font:inherit;color:inherit}textarea{min-height:300px;font:12px/1.8 monospace}details{margin:12px 0;border:1px solid #c1d0bc;border-radius:5px;background:#f0f4e9;overflow:hidden}summary{cursor:pointer;padding:14px 18px;list-style:none}summary span,summary small{display:block;color:#718366;font-size:11px}summary strong{font:20px/1.8 serif}.body{border-top:1px solid #c1d0bc;padding:14px 18px;background:#f8faf4}.body p{white-space:pre-wrap}button{padding:9px 12px;margin:4px;border:1px solid #b9cbb2;border-radius:4px;background:#e2eadb;color:#304733;cursor:pointer}button:disabled{opacity:.5}
.person-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;border-bottom:1px solid #c1d0bc;padding-bottom:14px}.person-metrics dt{font-size:11px;color:#718366}.person-metrics dd{margin:0;font:17px/1.8 serif}@media(max-width:400px){.person-metrics{grid-template-columns:repeat(2,1fr)}}
</style>
