<script setup lang="ts">
import {ref,computed} from 'vue';
import { CharacterDossierSchema } from '../../src/schema';
import type {Schema,LibraryEntry} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
const props=defineProps<{state:Schema;latest?:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit];archive:[entry:LibraryEntry]}>();
const search=ref(''),editing=ref(''),draft=ref(''),error=ref('');
const people=computed(()=>Object.entries(props.state.叙事.人物档案).filter(([,p])=>!search.value||(p.名称+p.别名.join(' ')+p.身份).includes(search.value)).slice(-60));
function begin(id:string){editing.value=id;draft.value=JSON.stringify(props.state.叙事.人物档案[id],null,2);error.value='';}
function save(){try{const dossier=CharacterDossierSchema.parse(JSON.parse(draft.value));emit('edit',{kind:'character',id:editing.value,dossier});editing.value='';}catch(e){error.value=String(e);}}
function archive(id:string){
 const p=props.state.叙事.人物档案[id];
 emit('archive',{id,kind:'character',name:p.名称,aliases:p.别名,planeId:p.位面ID,summary:p.身份+'；'+p.近况,content:Object.entries(p).filter(([key])=>!['在场','位面ID','别名'].includes(key)).map(([key,value])=>key+'：'+value).join('\n')});
}
</script>
<template><section class="characters"><h3>旅途中的人</h3><p>身份与性情留在档案，经历与约定随旅途延续。</p><input v-model="search" placeholder="搜索姓名、别名或身份" aria-label="搜索人物" />
<details v-for="[id,p] in people" :key="id"><summary><span>{{p.在场?'在场':'别处'}} · {{p.身份}}</span><strong>{{p.名称}}</strong><small>{{p.近况}}</small></summary><div class="body">
<p v-for="field in (['性别','年龄','种族','来源世界','外貌','性格','动机','说话方式','能力与局限','背景经历','日常喜好','已知信息','关系经历'] as const)" :key="field"><b>{{field}}</b><br />{{p[field] || '尚未记录'}}</p>
<button :disabled="latest===false" @click="begin(id)">编辑人物档案</button><button :disabled="latest===false" @click="archive(id)">整理为世界书档案</button>
</div></details><p v-if="!people.length">重要人物出场后，会由本轮变量更新收录到这里。</p>
<section v-if="editing"><h4>编辑档案</h4><textarea v-model="draft" aria-label="人物档案编辑" /><p role="alert">{{error}}</p><button :disabled="latest===false" @click="save">保存修改</button><button @click="editing=''">取消</button></section>
</section></template>
<style scoped>
.characters{font:13px/1.8 sans-serif;color:#324735}h3{font:22px serif}input,textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #c1d0bc;border-radius:4px;background:#fafcf8;font:inherit;color:inherit}textarea{min-height:300px;font:12px/1.8 monospace}details{margin:12px 0;border:1px solid #c1d0bc;border-radius:5px;background:#f0f4e9;overflow:hidden}summary{cursor:pointer;padding:14px 18px;list-style:none}summary span,summary small{display:block;color:#718366;font-size:11px}summary strong{font:20px/1.8 serif}.body{border-top:1px solid #c1d0bc;padding:14px 18px;background:#f8faf4}.body p{white-space:pre-wrap}button{padding:9px 12px;margin:4px;border:1px solid #b9cbb2;border-radius:4px;background:#e2eadb;color:#304733;cursor:pointer}button:disabled{opacity:.5}
</style>
