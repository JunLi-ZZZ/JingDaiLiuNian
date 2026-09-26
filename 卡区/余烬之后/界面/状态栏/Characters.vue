<script setup lang="ts">
import {ref,computed} from 'vue';
import {rosterEntries} from '../../src/archive-tools';
import ArchiveRemove from './ArchiveRemove.vue';
import CharacterStats from './CharacterStats.vue';
import { CharacterDossierSchema } from '../../src/schema';
import { characterArchive, characterEntity, characterAttributes } from '../../src/character-dossier';
import { entityMetrics } from '../../src/output-cards';
import type {Schema,LibraryEntry} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
const props=defineProps<{state:Schema;latest?:boolean;category?:string}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit];archive:[entry:LibraryEntry]}>();
const search=ref(''),editing=ref(''),draft=ref(''),error=ref('');
const showAway=ref(false);
const roster=computed(()=>rosterEntries(props.state,search.value).filter(r=>r.group===(props.category||'同伴') && (r.group==='同伴'||r.present||showAway.value)));
const fields=['性别','年龄','种族','来源世界','外貌','性格','动机','说话方式','能力与局限','背景经历','日常喜好','已知信息','关系经历'] as const;
function transfer(id:string){emit('edit',{kind:'roster',id,group:props.category==='同伴'?'附近的人':'同伴',base:_.cloneDeep(props.state)});}
const entityEdit=ref(''),entityName=ref(''),entityCategory=ref<'人物'|'生物'>('人物'),dossierId=ref(''),entityBase=ref<Schema>();
function editEntity(id:string){const e=props.state._实体[id];entityEdit.value=id;entityName.value=e.名称;entityCategory.value=e.类别==='生物'?'生物':'人物';dossierId.value=Object.entries(props.state.叙事.人物档案).find(([key,p])=>(p.实体ID||key)===id)?.[0]||'';entityBase.value=_.cloneDeep(props.state);}
function saveEntity(){if(entityBase.value)emit('edit',{kind:'classify',id:entityEdit.value,name:entityName.value,category:entityCategory.value,dossierId:dossierId.value,base:entityBase.value});entityEdit.value='';}
function begin(id:string){editing.value=id;draft.value=JSON.stringify({...props.state.叙事.人物档案[id],属性:characterAttributes(props.state,id)},null,2);error.value='';}
function save(){try{const dossier=CharacterDossierSchema.parse(JSON.parse(draft.value));emit('edit',{kind:'character',id:editing.value,dossier});editing.value='';}catch(e){error.value=String(e);}}
function archive(id:string){
 emit('archive',characterArchive(props.state,id));
}
function metrics(id:string){return entityMetrics(characterEntity(props.state,id),characterAttributes(props.state,id));}
</script>
<template><section class="characters"><h3>{{category||'同伴'}}</h3><p>{{category==='附近的人'?'本段旅途中相遇的人与生灵，离场后资料留存供查阅。':'相识与约定长久留存，同行或暂别都可以在这里找到。'}}</p><input v-model="search" placeholder="搜索姓名、别名或身份" aria-label="搜索人物" />
<label v-if="category==='附近的人'"><input v-model="showAway" class="away-check" type="checkbox" /> 查看已离场档案</label>
<details v-for="record in roster" :key="record.id"><summary><span>{{record.present?'在场':'别处'}} · {{record.dossier?.身份||record.entity?.档案.身份||record.entity?.档案.种族}}</span><strong>{{record.name}}</strong><small>{{record.dossier?.近况}}</small><dl class="person-metrics"><div v-for="metric in metrics(record.id).slice(0,4)" :key="metric.label"><dt>{{metric.label}}</dt><dd>{{metric.value}}</dd></div></dl></summary><div class="body">
<dl v-if="metrics(record.id).length>4" class="person-metrics"><div v-for="metric in metrics(record.id).slice(4)" :key="metric.label"><dt>{{metric.label}}</dt><dd>{{metric.value}}</dd></div></dl>
<template v-if="record.dossier"><p v-for="field in fields" :key="field"><b>{{field}}</b><br />{{record.dossier[field] || '尚未记录'}}</p></template><p v-else>{{record.entity?.档案.外貌}}</p>
<button :disabled="latest===false" @click="transfer(record.id)">{{category==='同伴'?'移至附近的人':'加入同伴'}}</button>
<CharacterStats v-if="record.dossier && !characterAttributes(state,record.id)" :id="record.id" :state="state" :latest="latest" @edit="emit('edit',$event)" />
<template v-if="record.dossier"><button :disabled="latest===false" @click="begin(record.id)">编辑人物档案</button><button :disabled="latest===false" @click="archive(record.id)">整理为世界书档案</button></template>
<button v-if="record.entity" :disabled="latest===false" @click="editEntity(record.entityId)">编辑名称与关联</button>
<ArchiveRemove :id="record.id" :state="state" :latest="latest" :category="record.category" @edit="emit('edit',$event)" />
</div></details>
<p v-if="!roster.length">{{category==='同伴'?'尚未收录同伴。':'此处暂无已记录的人物。'}}</p>
<section v-if="entityEdit" class="entity-editor"><h4>编辑实体分类</h4><label>实体名称<input v-model="entityName" /></label><label>类别<select v-model="entityCategory" aria-label="类别"><option>人物</option><option>生物</option></select></label><label>关联人物档案<select v-model="dossierId" aria-label="关联人物档案"><option value="">不新增关联</option><option v-for="[id,p] in Object.entries(state.叙事.人物档案)" :key="id" :value="id">{{p.名称}} · {{id}}</option></select></label><button :disabled="latest===false || !entityName.trim()" @click="saveEntity">保存实体分类</button><button @click="entityEdit=''">取消</button></section>
<section v-if="editing"><h4>编辑档案</h4><textarea v-model="draft" aria-label="人物档案编辑" /><p role="alert">{{error}}</p><button :disabled="latest===false" @click="save">保存修改</button><button @click="editing=''">取消</button></section>
</section></template>
<style scoped>
.away-check{width:auto;margin:12px 6px 12px 0}.entity-editor{padding:14px;border:1px solid #bdcbb5;background:#f4f7ef}.entity-editor label{display:grid;gap:6px;margin:10px 0}.entity-editor select{max-width:100%;padding:9px;border:1px solid #bdcbb5;background:#fafcf8}.characters{font:13px/1.8 sans-serif;color:#324735}h3{font:22px serif}input,textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #c1d0bc;border-radius:4px;background:#fafcf8;font:inherit;color:inherit}textarea{min-height:300px;font:12px/1.8 monospace}details{margin:12px 0;border:1px solid #c1d0bc;border-radius:5px;background:#f0f4e9;overflow:hidden}summary{cursor:pointer;padding:14px 18px;list-style:none}summary span,summary small{display:block;color:#718366;font-size:11px}summary strong{font:20px/1.8 serif}.body{border-top:1px solid #c1d0bc;padding:14px 18px;background:#f8faf4}.body p{white-space:pre-wrap}button{padding:9px 12px;margin:4px;border:1px solid #b9cbb2;border-radius:4px;background:#e2eadb;color:#304733;cursor:pointer}button:disabled{opacity:.5}
.person-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;border-bottom:1px solid #c1d0bc;padding-bottom:14px}.person-metrics dt{font-size:11px;color:#718366}.person-metrics dd{margin:0;font:17px/1.8 serif}@media(max-width:400px){.person-metrics{grid-template-columns:repeat(2,1fr)}}
</style>
