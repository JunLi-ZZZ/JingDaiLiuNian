<script setup lang="ts">
import { ref, computed, reactive, onBeforeUnmount } from 'vue';
import type { Schema, LibraryEntry } from '../../src/schema';
import { parseLibrary, saveLibrary } from '../../src/library';
import { characterGroups, planeGroups, workshopPrompt, exportLibrary } from '../../src/workshop-model';
import examples from '../../assets/workshop-examples.json';
import type { ArchiveEdit } from '../../src/settlement';
const props=defineProps<{state:Schema;latest?:boolean;preview?:boolean;chatId?:string;messageId?:number;selection?:string;persist?:(edit:ArchiveEdit)=>Promise<boolean|undefined>;seed?:LibraryEntry;standalone?:boolean}>();
const kind=ref<'character'|'plane'>(props.seed?.kind || 'character'), name=ref(''), concept=ref('');
const choices=reactive<{character:Record<string,string>;plane:Record<string,string>}>({character:{},plane:{}});
const groups=computed(()=>kind.value==='character'?characterGroups:planeGroups);
const active=computed(()=>choices[kind.value]);
const selectedCount=computed(()=>Object.values(active.value).filter(Boolean).length);
const custom=reactive<Record<string,string>>({});
const include=ref(!props.standalone), draft=ref(props.seed?JSON.stringify(props.seed,null,2):''), working=ref(false),saving=ref(false),error=ref(''),notice=ref('');
const search=ref('');
const localDrafts=ref<LibraryEntry[]>([]);
try{localDrafts.value=JSON.parse(localStorage.getItem('embers-workshop-v2')||'[]').map((x:unknown)=>parseLibrary(JSON.stringify(x))).slice(-20);}catch{ /* 新环境从空草稿架开始。 */ }
function remember(entry:LibraryEntry){
 localDrafts.value=[...localDrafts.value.filter(x=>x.id!==entry.id),entry].slice(-20);
 try{localStorage.setItem('embers-workshop-v2',JSON.stringify(localDrafts.value));}catch{notice.value='草稿已生成，可先下载保存。';}
}
function toggle(key:string, option:string){
 const values=(active.value[key]||'').split('、').filter(Boolean);
 active.value[key]=(values.includes(option)?values.filter(x=>x!==option):[...values,option]).join('、');
}
function changeField(key:keyof LibraryEntry,value:unknown){
 if(candidate.value?.value)draft.value=JSON.stringify({...candidate.value.value,[key]:value},null,2);
}
function download(){
 if(!candidate.value?.value)return;
 const entry=candidate.value.value;remember(entry);
 const url=URL.createObjectURL(new Blob([exportLibrary(entry)],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=entry.name.replace(/[\\/:*?"<>|]/g,'_')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 notice.value='已导出完整设定，可继续交给作者修改。';
}
async function copy(){
 try{if(candidate.value?.value){await navigator.clipboard.writeText(exportLibrary(candidate.value.value));notice.value='已复制完整档案';}}
 catch{notice.value='浏览器未允许复制，可使用下载档案。';}
}

let generationId='';
const candidate=computed(()=>{if(!draft.value)return null;try{return {value:parseLibrary(draft.value),error:''};}catch(e){return {error:e instanceof Error?e.message:String(e)};}});
const shelf=computed(()=>Object.values(props.state._资料库).filter(x=>!search.value||(x.name+x.summary).includes(search.value)).slice(-30));
function check(){
 if(props.preview || props.standalone)return;
 const msg=getChatMessages(props.messageId!,{include_swipes:true})[0];
 if(SillyTavern.getCurrentChatId()!==props.chatId || getLastMessageId()!==props.messageId || JSON.stringify([msg?.swipe_id,msg?.swipes[msg.swipe_id]])!==props.selection)throw Error('聊天或消息页已切换，请回到生成时的楼层');
}
async function generate(){
 error.value='';notice.value='';working.value=true;
 generationId='embers-library-'+crypto.randomUUID();const id=generationId;
 try{
  check();
  if(props.preview){
    draft.value=JSON.stringify(examples[kind.value],null,2);remember(parseLibrary(draft.value));notice.value='示例草稿 · 正式卡会调用酒馆当前模型';return;
  }
  const response=await generateRaw({generation_id:id,should_silence:true,
   ordered_prompts:workshopPrompt(kind.value,name.value,concept.value,active.value,include.value && !props.standalone ? props.state : undefined)});
  if(generationId!==id)return;check();
  if(typeof response!=='string')throw Error('AI没有返回文字草稿');
  draft.value=response;
  const parsed=parseLibrary(response);draft.value=JSON.stringify(parsed,null,2);remember(parsed);
 }catch(e){if(generationId===id)error.value=e instanceof Error?e.message:String(e);}
 finally{if(generationId===id)working.value=false;}
}
async function save(){
 if(!candidate.value?.value)return;saving.value=true;error.value='';
 try{
  if(props.preview){notice.value='预览已通过校验；正式卡会写入聊天世界书并登记按需调用。';return;}
  check();
  const entry=candidate.value.value;
  const existing=props.state._资料库[entry.id];
  if(existing && existing.kind!==entry.kind)throw Error('该ID已用于另一类档案，请在草稿中更换ID');
  const saved=await navigator.locks.request('embers-library:'+props.chatId,()=>saveLibrary({
   check,book:()=>getOrCreateChatWorldbook('current','余烬之后·潮镜·'+props.chatId),
   read:getWorldbook,update:(book,fn)=>updateWorldbookWith(book,fn),
   create:(book,item)=>createWorldbookEntries(book,[item]),
   persist:async reference=>!!await props.persist?.({kind:'library',entry:reference}),
  },entry));
  notice.value='已保存到 '+saved.book+'。提及名称'+(entry.kind==='plane'?'或进入该位面':'或在场')+'时按需调入。';
 }catch(e){error.value=e instanceof Error?e.message:String(e);}
 finally{saving.value=false;}
}
async function load(id:string){
 error.value='';
 try{check();const ref=props.state._资料库[id];const e=(await getWorldbook(ref.book)).find(x=>x.name===ref.entry);check();if(!e)throw Error('条目不存在');draft.value=JSON.stringify({...ref,content:e.content.replace(ref.name+'\n'+(ref.kind==='plane'?'位面ID：':'人物档案ID：')+ref.id+'\n','')},null,2);}
 catch(e){error.value=String(e);}
}
function cancel(){if(working.value && !props.preview && generationId)stopGenerationById(generationId);generationId='';working.value=false;}
onBeforeUnmount(cancel);
</script>
<template>
 <section class="workshop">
  <header><div class="mirror-seal" aria-hidden="true">◈</div><div><span>潮 镜 / 设 定 工 坊</span><h3>一念成形，万象有名</h3><p>{{standalone?'在故事开始之前，写下值得相遇的人与世界。':'从旅途生长出的构想，也能成为下一次归来的坐标。'}}</p></div></header>
  <div class="choices"><button aria-label="生成角色" :aria-pressed="kind==='character'" @click="kind='character'"><b>01</b> 生成角色 <small>身世 · 性情 · 牵挂</small></button><button aria-label="生成位面" :aria-pressed="kind==='plane'" @click="kind='plane'"><b>02</b> 生成位面 <small>地理 · 文明 · 法则</small></button></div>
  <label class="idea">一个念头就够了 <textarea v-model="concept" maxlength="8000" :placeholder="kind==='character'?'例如：替亡者送信的邮差，怕水，却住在一座永远下雨的城。也可以留空，让潮镜自由构想。':'例如：巨鲸背上的城市群，鲸群迁徙就是四季。留空也能直接生成完整世界。'" /></label>
  <div class="quick"><label>想用的名字<input v-model="name" maxlength="80" placeholder="留空，由 AI 拟名" /></label><div class="generate"><button v-if="!working" :aria-label="preview?'载入示例草稿':'生成草稿'" class="primary" :disabled="saving" @click="generate">{{preview?'载入示例草稿':selectedCount || concept || name?'按构想生成':'随机生成完整档案'}} <span aria-hidden="true">↗</span></button><button v-else @click="cancel">停止生成</button><small>{{selectedCount?selectedCount+' 项偏好已指定':'全部属性可由 AI 协调生成'}}</small></div></div>
  <label v-if="!standalone" class="check"><input v-model="include" type="checkbox" />参考当前世界与人物</label>
  <details class="preferences"><summary><span>想得更具体？展开自定义</span><small>{{selectedCount}} 项已选</small></summary>
   <p class="hint">每项都可留空，也可以选择建议或直接写自己的设定。</p>
   <details v-for="group in groups" :key="group.name" class="option-group"><summary>{{group.name}}</summary><div class="field-grid">
    <div v-for="field in group.fields" :key="field.key" class="field" :class="{wide:field.multiple}">
     <template v-if="field.multiple"><span>{{field.label}}</span><div class="tags"><button v-for="option in field.options" :key="option" :aria-pressed="(active[field.key]||'').split('、').includes(option)" @click="toggle(field.key,option)">{{option}}</button></div><input v-model="active[field.key]" :aria-label="field.label" placeholder="可补充自定义，多个用顿号分隔" /></template>
     <label v-else>{{field.label}}<select v-if="field.options && !custom[kind+field.key]" v-model="active[field.key]" :aria-label="field.label"><option value="">随机／自然生成</option><option v-for="option in field.options" :key="option">{{option}}</option></select><input v-else v-model="active[field.key]" :aria-label="field.label" placeholder="留空自然生成，或输入自己的设定" /></label>
     <button v-if="field.options && !field.multiple" class="text-button" @click="custom[kind+field.key]=custom[kind+field.key]?'':'yes';active[field.key]=''">{{custom[kind+field.key]?'使用建议选项':'自定义这一项'}}</button>
    </div>
   </div></details>
  </details>
  <p v-if="error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
  <section v-if="draft" class="draft">
   <div class="draft-top"><span>待定稿 / {{candidate?.value?.kind==='plane'?'位面志':'人物志'}}</span><small>可编辑 · 可导出 · 可继续打磨</small></div>
   <template v-if="candidate?.value"><h3>{{candidate.value.name}}</h3><p class="abstract">{{candidate.value.summary}}</p>
    <div class="manuscript"><section v-for="(part,index) in candidate.value.content.split(/^# /m).filter(Boolean)" :key="index"><h4>{{part.split('\n')[0]}}</h4><p>{{part.split('\n').slice(1).join('\n')}}</p></section></div>
    <details class="editor"><summary>修改档案</summary><label>档案名称<input :value="candidate.value.name" @change="changeField('name',($event.target as HTMLInputElement).value)" /></label><label>档案简介<textarea :value="candidate.value.summary" @change="changeField('summary',($event.target as HTMLTextAreaElement).value)" /></label><label>完整设定<textarea class="manuscript-edit" :value="candidate.value.content" @change="changeField('content',($event.target as HTMLTextAreaElement).value)" /></label></details>
   </template><p v-else role="alert">{{candidate?.error}}</p>
   <details class="raw"><summary>{{candidate?.value?'高级：索引与原始数据':'编辑 AI 返回内容'}}</summary><textarea v-model="draft" class="code" aria-label="潮镜档案草稿" /></details>
   <div class="result-actions"><button :disabled="!candidate?.value" @click="copy">复制档案</button><button :disabled="!candidate?.value" @click="download">下载设定 .md</button><button v-if="!standalone" class="primary" :disabled="!candidate?.value || saving || working || latest===false" @click="save">{{saving?'正在保存…':'保存到世界书'}}</button><button :disabled="!candidate?.value" @click="candidate?.value && remember(candidate.value);notice='已存入本地草稿架'">保留草稿</button></div>
   <small>{{standalone?'导出的完整档案可以继续交给作者完善，再作为正式世界书设定。':'保存后按场景调用。也可以先导出完善，再放入正式世界书。'}}</small>
  </section>
  <details class="shelf"><summary>本地草稿架 · {{localDrafts.length}}</summary><p class="hint">最近20份草稿保留在当前浏览器中，下载可长期保存。</p><article v-for="entry in [...localDrafts].reverse()" :key="entry.id"><div><h4>{{entry.name}} <small>{{entry.kind==='plane'?'位面':'人物'}}</small></h4><p>{{entry.summary}}</p></div><button @click="draft=JSON.stringify(entry,null,2)">继续编辑</button></article></details>
  <details v-if="!standalone" class="shelf"><summary>已保存世界书档案 · {{Object.keys(state._资料库).length}}</summary><input v-model="search" placeholder="搜索名称或简介" /><article v-for="entry in shelf" :key="entry.id"><div><h4>{{entry.name}}</h4><p>{{entry.summary}}</p></div><button :disabled="preview" @click="load(entry.id)">取回编辑</button></article></details>
 </section>
</template>
<style scoped>
.workshop{--ink:#d8e2df;--muted:#93a6a2;--line:#435351;--gold:#d3b786;background:#182b2e;color:var(--ink);padding:28px;font:13px/1.9 'Microsoft YaHei',sans-serif;border:1px solid #52615a;border-radius:3px;overflow-wrap:anywhere}
header{display:flex;align-items:center;gap:20px;border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:24px}.mirror-seal{width:64px;height:64px;border:1px solid #9caa9380;border-radius:50%;display:grid;place-content:center;font:45px serif;color:var(--gold);box-shadow:0 0 0 6px #72897b12;flex-shrink:0}header span{color:var(--gold);font-size:10px;letter-spacing:3px}h3{font:400 25px/1.6 'SimSun',serif;margin:4px 0}header p{margin:6px 0 0;color:var(--muted);font-size:12px}.choices{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.choices button{display:block;text-align:left;padding:16px;font-size:17px}.choices b{font:italic 20px serif;margin-right:9px;opacity:.55}.choices small{display:block;color:var(--muted);font-size:10px;margin-left:31px}.choices button[aria-pressed=true]{background:#30433f;border-color:var(--gold)}label,.field{display:grid;gap:8px}input,textarea,select{box-sizing:border-box;width:100%;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:3px;background:#102226;color:var(--ink);font:inherit}textarea{resize:vertical;min-height:90px}input::placeholder,textarea::placeholder{color:#839893}button{font:inherit;cursor:pointer;border:1px solid var(--line);border-radius:3px;padding:9px 15px;background:#24383a;color:var(--ink)}button:disabled{opacity:.45;cursor:default}.primary{background:#d1bb8a;color:#18282a;border-color:#d1bb8a}.primary span{margin-left:20px}.quick{display:grid;grid-template-columns:1fr 1fr;align-items:end;gap:20px;margin:18px 0}.generate{display:grid;gap:5px}.generate small{font-size:10px;color:var(--muted)}.check{display:flex;align-items:center;margin:14px 0;font-size:12px}.check input{width:auto;accent-color:#ceb485}summary{cursor:pointer;list-style:none}summary::before{content:'+';margin-right:12px;color:var(--gold)}details[open]>summary::before{content:'−'}.preferences{border-block:1px solid var(--line);margin-top:24px}.preferences>summary{display:flex;align-items:center;padding:16px 0}.preferences>summary small{margin-left:auto;color:var(--muted)}.hint{color:var(--muted);font-size:11px}.option-group{border-top:1px solid #394c4b}.option-group>summary{padding:14px 2px}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:10px 0 22px}.field.wide{grid-column:1/-1}.text-button{padding:0;border:0;background:none;color:#c2b188;text-align:right;font-size:10px}.tags{display:flex;flex-wrap:wrap;gap:6px}.tags button{padding:5px 10px;font-size:11px}.tags button[aria-pressed=true]{background:#526352;border-color:#c3b88c}.draft{margin-top:28px;background:#f5f1e7;color:#283e3c;border:1px solid #c5b895;padding:24px;box-shadow:0 8px 22px #00101424}.draft-top{display:flex;justify-content:space-between;gap:10px;color:#9c7b46;font-size:10px;border-bottom:1px solid #ccc6b2;padding-bottom:12px}.draft>h3{font-size:29px}.abstract{font-family:serif;color:#617266}.manuscript section{border-top:1px solid #d6cebc;padding:8px 0}.manuscript h4{font:600 14px/1.8 serif;color:#8b673a}.manuscript p{white-space:pre-wrap;font-size:12px;line-height:2}.draft summary{color:#6c644e;padding:10px 0}.draft input,.draft textarea{background:#fffef9;color:#2d423e;border-color:#c8c3b4}.editor label{margin:12px 0}.manuscript-edit,.code{min-height:330px}.code{font:12px/1.8 monospace}.draft .result-actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.draft small{color:#7e8372}.shelf{border-top:1px solid var(--line);margin-top:24px;padding-top:16px}.shelf article{display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--line);padding:12px 0}.shelf article>div{flex:1}.shelf h4{margin:0}.shelf p{font-size:11px;color:var(--muted)}[role=alert]{color:#f2b49f}[role=status]{padding:10px;background:#31473e}
@media(max-width:520px){.workshop{padding:17px}header{gap:12px}.mirror-seal{width:44px;height:44px;font-size:30px}h3{font-size:21px}.choices{gap:8px}.choices button{padding:11px;font-size:14px}.choices small{margin-left:0}.quick,.field-grid{grid-template-columns:1fr}.draft{padding:16px}.draft-top{flex-direction:column}.preferences>summary small{display:none}}
</style>
