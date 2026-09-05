<template>
  <section class="dh" :class="{ 'dh-room': page === 'room' }">
    <template v-if="page === 'profile'">
      <div class="dh-profile-scroll">
        <div class="dh-banner" :style="backdrop"><button class="dh-icon" title="返回首页" @click="$emit('home')"><span v-html="backIcon"></span></button><span>{{ platform }}</span><button class="dh-icon" title="观看历史" @click="$emit('history')"><span v-html="historyIcon"></span></button></div>
        <div class="dh-profile">
          <div class="dh-identity"><div class="dh-avatar">{{ name.slice(0, 1) }}</div><button class="dh-soft" @click="editBio">编辑资料</button></div>
          <h2>{{ name }}</h2><p class="dh-id">{{ platform }}号：{{ account }}</p>
          <button class="dh-bio" @click="editBio">{{ bio || '填写个人简介' }}</button>
          <div class="dh-stats"><span><b>{{ follows }}</b>关注</span><span><b>{{ liked.length }}</b>喜欢</span><span><b>{{ sessions.length }}</b>场直播</span></div>
          <div class="dh-shortcuts"><button @click="$emit('history')"><span v-html="historyIcon"></span>观看历史</button><button @click="prepare"><span v-html="icons.live"></span>{{ active ? '返回直播' : '开直播' }}<i v-if="active" /></button></div>
        </div>
        <nav class="dh-tabs" aria-label="个人主页"><button v-for="tab in profileTabs" :key="tab" :class="{ on: profileTab === tab }" @click="profileTab = tab">{{ tab }} <small>{{ tab === '直播' ? sessions.length : tab === '喜欢' ? liked.length : saved.length }}</small></button></nav>
        <template v-if="profileTab === '直播'">
          <div v-if="!sessions.length" class="dh-empty"><span v-html="icons.live"></span><p>还没有直播记录</p><button class="dh-primary" @click="prepare">开启第一场直播</button></div>
          <div v-else class="dh-records"><button v-for="item in sessions" :key="item.id" class="dh-record" @click="openRoom(item.id)"><div class="dh-thumb" :style="backdrop"><span>{{ item.visibility === 'private' ? '私密' : '公开' }}</span><b v-html="icons.live"></b></div><div><strong>{{ item.title }}</strong><small>{{ stamp(item.startedAt) }}</small><small :class="{ 'dh-live': item.status === 'live' }">{{ item.status === 'live' ? (item.pending ? '直播中 · 正在生成' : '直播中') : '已结束' }} · {{ item.events.filter(e => e.kind === 'gift').length }} 次收礼</small></div><span class="dh-chevron">›</span></button></div>
        </template>
        <template v-else>
          <div v-if="!selectedVideos.length" class="dh-empty"><span v-html="icons.star"></span><p>暂无{{ profileTab }}内容</p></div>
          <div v-else class="dh-video-grid"><button v-for="video in selectedVideos" :key="video._i" :style="backdrop" @click="$emit('video', video)"><span>{{ video.type === 'live' ? '直播' : '视频' }}</span><strong>{{ video.caption || video.title || video.content }}</strong><small>@{{ video.creator }}</small></button></div>
        </template>
      </div>
    </template>

    <template v-else-if="page === 'setup'">
      <header class="dh-header"><button class="dh-icon" title="返回个人主页" @click="page = 'profile'"><span v-html="backIcon"></span></button><strong>开直播</strong><span class="dh-header-spacer" /></header>
      <div class="dh-setup">
        <div class="dh-setup-cover" :style="backdrop"><span class="dh-outline">{{ platform }}直播</span><div class="dh-camera-mark" v-html="icons.live"></div><span>{{ name }}</span></div>
        <button class="dh-field" @click="editField('title', '直播标题', false)"><small>直播标题</small><b>{{ setup.title || '给直播起个名字' }}</b><span>›</span></button>
        <button class="dh-field dh-field-multi" @click="editField('brief', '想播什么？', true)"><small>直播内容</small><b>{{ setup.brief || '想播什么？' }}</b><span>›</span></button>
        <div class="dh-setting"><span>谁可以看</span><div class="dh-segment"><button :class="{ on: setup.visibility === 'public' }" @click="setup.visibility = 'public'">公开</button><button v-if="mode === 'r18'" :class="{ on: setup.visibility === 'private' }" @click="setup.visibility = 'private'">私密</button></div></div>
        <p v-if="setup.visibility === 'private'" class="dh-access">所有已知亲密角色可见</p>
        <label class="dh-setting"><span>参考最近正文</span><input v-model="setup.referenceStory" type="checkbox" role="switch" /></label>
      </div>
      <footer class="dh-setup-footer"><button class="dh-primary" :disabled="!setup.brief.trim()" @click="start">开始直播</button></footer>
    </template>

    <template v-else-if="room">
      <header class="dh-host-header"><button class="dh-host-identity" title="直播信息" @click="showInfo = !showInfo"><span class="dh-mini-avatar">{{ name.slice(0, 1) }}</span><span><b>{{ name }}</b><small>{{ room.status === 'live' ? '主播' : '直播回放' }} · {{ room.visibility === 'private' ? '私密' : '公开' }}</small></span></button><button class="dh-online" title="在线观众" @click="showAudience = !showAudience">{{ room.viewers }} 人</button><button class="dh-icon" title="收起直播间" @click="page = 'profile'"><span v-html="backIcon"></span></button></header>
      <div class="dh-host-meta"><span :class="{ 'dh-live': room.status === 'live' }">{{ room.status === 'live' ? '直播中' : '已结束' }}</span><span>{{ elapsed }} · {{ room.likes }} 赞</span></div>
      <div v-if="showInfo" class="dh-info"><b>{{ room.title }}</b><p>{{ room.brief }}</p><small>{{ room.visibility === 'private' ? '所有已知亲密角色可见' : '所有人可见' }}</small></div>
      <div v-if="showAudience" class="dh-info"><b>在线观众</b><p>{{ room.audience.join('、') || '暂无入场观众' }}</p></div>
      <div class="dh-stage" :style="backdrop"><div class="dh-stage-caption"><small>{{ room.title }}</small><p>{{ room.screen || '等待直播画面' }}</p></div></div>
      <div ref="chatEl" class="dh-chat" aria-live="polite">
        <div class="dh-chat-notice">{{ room.visibility === 'private' ? '私密直播 · 已知亲密角色可见' : '欢迎来到直播间' }}</div>
        <div v-for="event in room.events" :key="event.id" class="dh-message" :class="['dh-msg-' + event.kind, { 'dh-msg-failed': event.status === 'failed' }]">
          <template v-if="event.kind === 'continue'"><small>继续直播</small></template>
          <template v-else><span v-if="['chat', 'action', 'start'].includes(event.kind)" class="dh-host-badge">主播</span><b>{{ event.name }}</b><small v-if="event.kind === 'action' || event.kind === 'start'"> 直播内容</small><span v-if="event.replyTo"> 回复 {{ event.replyTo }}</span><span>：{{ event.text }}</span><span v-if="event.kind === 'gift'" class="dh-gift"> {{ giftLabel(event.gift) }} ×{{ event.quantity }}</span></template>
          <button v-if="event.status === 'failed'" class="dh-retry" @click="retry">重试</button>
        </div>
        <div v-if="room.pending" class="dh-loading" role="status" aria-label="正在生成直播反馈"><i /><i /><i /></div>
      </div>
      <div v-if="room.error" class="dh-error" role="alert"><span>生成未完成</span><button @click="retry">重试</button><button @click="withdraw">撤回本次</button></div>
      <footer class="dh-controls">
        <template v-if="room.status === 'live'">
          <div class="dh-input-tabs"><button :class="{ on: inputMode === 'action' }" @click="inputMode = 'action'">直播内容</button><button :class="{ on: inputMode === 'chat' }" @click="inputMode = 'chat'">发弹幕</button><button class="dh-end" @click="confirmEnd = true">结束</button></div>
          <div class="dh-compose"><button class="dh-draft" :disabled="!!room.pending || !!room.error" @click="editInput">{{ drafts[inputMode] || (inputMode === 'action' ? '此刻做什么、说什么…' : '发条弹幕…') }}</button><button class="dh-icon" title="继续直播" :disabled="!!room.pending || !!room.error" @click="run('continue', '')"><span v-html="icons.video"></span></button><button class="dh-icon" title="分享到故事" :disabled="!room.screen" @click="share"><span v-html="shareIcon"></span></button></div>
        </template>
        <button v-else class="dh-primary" :disabled="!room.screen" @click="share">分享到故事</button>
      </footer>
      <div v-if="confirmEnd" class="dh-modal-shade" @click.self="confirmEnd = false"><div class="dh-modal"><h3>结束本场直播？</h3><p>{{ room.pending ? '本轮仍在生成，结束后不再接收本轮结果。' : '本场记录将保留在个人主页。' }}</p><button class="dh-primary" @click="end">结束直播</button><button class="dh-soft" @click="confirmEnd = false">继续直播</button></div></div>
    </template>
    <p v-if="error" class="dh-local-error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { generateHostTurn, hostId, hostStorageKey, readHostSessions, recoverHostSessions, subscribeHostSessions, writeHostSession, type HostSession, type HostInput } from './hostLive';

const props = defineProps<{ name: string; account: string; mode: 'normal' | 'r18'; follows: number; feed: any[]; wallpaper: string; icons: Record<string, string>; api: any }>();
const emit = defineEmits(['home', 'history', 'video', 'share', 'subpage']);
const page = ref('profile');
const profileTab = ref('直播');
const profileTabs = ['直播', '喜欢', '收藏'];
const sessions = ref<HostSession[]>([]);
const selectedId = ref('');
const bio = ref('');
const error = ref('');
const showInfo = ref(false);
const showAudience = ref(false);
const confirmEnd = ref(false);
const inputMode = ref<'action' | 'chat'>('action');
const drafts = reactive({ action: '', chat: '' });
const setup = reactive({ title: '', brief: '', visibility: 'public' as 'public' | 'private', referenceStory: false });
const chatEl = ref<HTMLElement>();
const now = ref(Date.now());
let storageKey = '';
let scope = '';
let unsubscribe: (() => void) | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
const platform = computed(() => props.mode === 'r18' ? '抖阴' : '抖音');
const backdrop = computed(() => props.wallpaper ? { backgroundImage: `url("${props.wallpaper}")` } : {});
const room = computed(() => sessions.value.find(item => item.id === selectedId.value));
const active = computed(() => sessions.value.find(item => item.status === 'live'));
const liked = computed(() => props.feed.filter(item => item.isLiked && !item.pending));
const saved = computed(() => props.feed.filter(item => item.isSaved && !item.pending));
const selectedVideos = computed(() => profileTab.value === '喜欢' ? liked.value : saved.value);
const elapsed = computed(() => {
  const seconds = Math.max(0, Math.floor(((room.value?.endedAt || now.value) - (room.value?.startedAt || now.value)) / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
});
const backIcon = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12 4.95 4.95-1.414 1.415L8 12l6.364-6.364 1.414 1.414z"/></svg>';
const historyIcon = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 1-9.8 12h2.05A8 8 0 1 0 6.34 6.34L9 9H2V2l2.92 2.92A9.97 9.97 0 0 1 12 2m-1 5h2v5.17l3.41 3.42L15 17l-4-4z"/></svg>';
const shareIcon = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 14H9a5 5 0 0 0-5 5v1H2v-1A11 11 0 0 1 13 8V3l9 8-9 8zm2 .55L18.99 11 15 7.45V10h-2a8.97 8.97 0 0 0-6.19 2.46A7 7 0 0 1 9 12h6z"/></svg>';
const stamp = (value: number) => new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const giftLabel = (key?: string) => { const gift = props.api.gifts.find((item: any) => item.k === key); return gift ? `${gift.icon} ${gift.name}` : ''; };
function refresh() { try { sessions.value = readHostSessions(storageKey); } catch (e) { error.value = String(e); } }
function load() {
  try {
    scope = props.api.scope();
    storageKey = hostStorageKey(scope, props.mode);
    recoverHostSessions(storageKey);
    refresh();
    bio.value = localStorage.getItem(storageKey + ':bio') || '';
    const draft = JSON.parse(localStorage.getItem(storageKey + ':setup') || '{}');
    Object.assign(setup, { title: '', brief: '', visibility: 'public', referenceStory: props.api.referenceStory() }, draft);
    if (props.mode !== 'r18') setup.visibility = 'public';
    selectedId.value = ''; page.value = 'profile'; error.value = '';
  } catch (e) { error.value = String(e); }
}
function editBio() {
  props.api.openIME({ placeholder: '个人简介', getValue: () => bio.value, setValue: (v: string) => { bio.value = v; localStorage.setItem(storageKey + ':bio', v); }, allowEmpty: true, multiline: true });
}
function editField(field: 'title' | 'brief', placeholder: string, multiline: boolean) {
  props.api.openIME({ placeholder, getValue: () => setup[field], setValue: (v: string) => { setup[field] = v; }, multiline, allowEmpty: true });
}
function prepare() { refresh(); if (active.value) openRoom(active.value.id); else page.value = 'setup'; }
function openRoom(id: string) { selectedId.value = id; page.value = 'room'; showInfo.value = false; showAudience.value = false; confirmEnd.value = false; drafts.action = ''; drafts.chat = ''; }
function start() {
  try {
    refresh();
    if (active.value) { openRoom(active.value.id); return; }
    if (!setup.brief.trim()) return;
    props.api.generation();
    const item: HostSession = { id: hostId(), mode: props.mode, creator: props.name, title: setup.title.trim() || `${props.name}的直播间`, brief: setup.brief.trim(), visibility: setup.visibility, referenceStory: setup.referenceStory, style: props.api.style(), startedAt: Date.now(), status: 'live', screen: '', memory: '', events: [], audience: [], viewers: 0, likes: 0 };
    writeHostSession(storageKey, item); openRoom(item.id); void run('start', item.brief);
  } catch (e) { error.value = String(e); }
}
async function run(kind: HostInput, text: string, retry = false) {
  if (!room.value) return;
  error.value = '';
  try { await generateHostTurn(storageKey, room.value.id, kind, text, props.api.generation(), retry); }
  catch (e) { error.value = String(e); }
  refresh();
}
function retry() { if (room.value?.request) void run(room.value.request.kind, room.value.request.text, true); }
function withdraw() {
  if (!room.value || room.value.pending) return;
  const item = JSON.parse(JSON.stringify(room.value));
  const pending = item.request;
  if (pending?.kind === 'chat' || pending?.kind === 'action') { drafts[pending.kind as 'chat' | 'action'] = pending.text; inputMode.value = pending.kind; }
  item.events = item.events.filter((event: any) => event.id !== pending?.eventId);
  item.request = undefined; item.error = ''; writeHostSession(storageKey, item);
}
function editInput() {
  const kind = inputMode.value;
  props.api.openIME({ placeholder: kind === 'action' ? '直播内容' : '发送弹幕', getValue: () => drafts[kind], setValue: (v: string) => { drafts[kind] = v; }, multiline: true, onSubmit: () => {
    const value = drafts[kind].trim();
    if (!value || room.value?.pending || room.value?.error) return;
    void run(kind, value);
    if (room.value?.request?.text === value) drafts[kind] = '';
  } });
}
function end() { if (room.value) writeHostSession(storageKey, { ...room.value, status: 'ended', endedAt: Date.now(), pending: undefined }); confirmEnd.value = false; }
function share() { if (room.value) emit('share', JSON.parse(JSON.stringify(room.value))); }
watch(() => props.mode, load);
watch(page, value => emit('subpage', value !== 'profile'));
watch(setup, () => { if (storageKey) { try { localStorage.setItem(storageKey + ':setup', JSON.stringify(setup)); } catch (e) { error.value = String(e); } } });
watch(() => [room.value?.events.length, room.value?.pending], () => nextTick(() => { if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight; }));
onMounted(() => { load(); unsubscribe = subscribeHostSessions(refresh); timer = setInterval(() => { now.value = Date.now(); if (props.api.scope() !== scope) load(); }, 1000); });
onUnmounted(() => { unsubscribe?.(); clearInterval(timer); });
defineExpose({ prepare });
</script>

<style scoped>
.dh{padding-top:28px}
.dh{display:flex;flex:1;flex-direction:column;min-height:0;background:#151517;color:#f7f7f8;font-family:inherit;font-size:13px;letter-spacing:0;position:relative;overflow:hidden}.dh *{box-sizing:border-box;letter-spacing:0}.dh button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}.dh button:disabled{opacity:.38;cursor:default}.dh button:focus-visible{outline:2px solid #29d9cf;outline-offset:-2px}.dh svg{width:100%;height:100%;display:block}.dh-icon{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:50%!important}.dh-icon>span{display:block;width:23px;height:23px}.dh-profile-scroll{overflow-y:auto;flex:1;min-height:0}.dh-banner{height:104px;background-size:cover;background-position:center 44%;display:flex;justify-content:space-between;align-items:flex-start;padding:9px 10px;background-color:#323a3a}.dh-banner>span{font-size:12px;padding-top:9px;text-shadow:0 1px 3px #000}.dh-banner .dh-icon{background:#0004}.dh-profile{padding:0 16px 13px}.dh-identity{display:flex;justify-content:space-between;align-items:center;margin-top:-29px;position:relative}.dh-avatar{height:76px;width:76px;display:grid;place-items:center;border-radius:50%;border:4px solid #151517;background:#45484c;color:white;font-size:28px}.dh-soft{background:#303034!important;border-radius:5px;padding:8px 18px!important;font-size:12px!important}.dh-identity .dh-soft{margin-top:25px}.dh h2{font-size:21px;line-height:1.3;margin:9px 0 5px;font-weight:700;overflow-wrap:anywhere}.dh-id{font-size:10px;color:#939399;margin:0 0 12px}.dh-bio{text-align:left;color:#b9b9c0!important;font-size:12px!important;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}.dh-stats{display:flex;gap:24px;margin:16px 0;color:#a9a9af;font-size:11px}.dh-stats b{font-size:16px;color:#fafafa;margin-right:5px}.dh-shortcuts{display:flex;gap:9px}.dh-shortcuts button{display:flex;align-items:center;justify-content:center;gap:7px;background:#252528;border-radius:5px;padding:9px 7px;flex:1;font-size:12px;white-space:nowrap}.dh-shortcuts span{width:18px;height:18px}.dh-shortcuts i{width:5px;height:5px;border-radius:50%;background:#ff4161}.dh-tabs{display:flex;border-bottom:1px solid #ffffff13;position:sticky;top:0;background:#151517;z-index:1;height:43px}.dh-tabs button{flex:1;color:#99999f;font-size:12px;position:relative}.dh-tabs button.on{color:white;font-weight:600}.dh-tabs button.on:after{content:'';position:absolute;height:3px;width:30px;background:#f6f6f6;bottom:0;left:calc(50% - 15px)}.dh-tabs small{font-weight:400;font-size:10px}.dh-empty{text-align:center;padding:32px 15px;color:#95959e}.dh-empty>span{display:block;width:34px;height:34px;margin:auto;color:#66666f}.dh-empty p{margin:13px 0 19px;font-size:12px}.dh-primary{padding:12px 18px!important;background:#fa3159!important;color:white!important;border-radius:5px;font-weight:600!important}.dh-records{padding:0 12px}.dh-record{width:100%;display:flex;align-items:center;gap:11px;text-align:left;padding:12px 0!important;border-bottom:1px solid #ffffff0d!important}.dh-thumb{width:69px;height:80px;flex-shrink:0;background-size:cover;background-position:center;border-radius:4px;position:relative;background-color:#323a3a;display:grid;place-items:center}.dh-thumb>span{position:absolute;top:4px;left:4px;font-size:9px;padding:2px 4px;background:#0008;border-radius:2px}.dh-thumb>b{width:26px;height:26px;filter:drop-shadow(0 1px 4px #000)}.dh-record>div:nth-child(2){min-width:0;flex:1}.dh-record strong{font-size:13px;display:block;overflow-wrap:anywhere;line-height:1.5}.dh-record small{display:block;color:#919198;font-size:10px;margin-top:7px}.dh-chevron{color:#aaa;font-size:22px}.dh-live{color:#ff617a!important}.dh-video-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px}.dh-video-grid button{aspect-ratio:3/4;display:flex;flex-direction:column;justify-content:space-between;text-align:left;padding:8px;background-size:cover;background-color:#323a3a;background-blend-mode:multiply;gap:5px;overflow:hidden}.dh-video-grid span,.dh-video-grid small{font-size:9px}.dh-video-grid strong{font-size:11px;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow-wrap:anywhere}.dh-header{display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #ffffff10;flex-shrink:0}.dh-header strong{font-size:15px}.dh-header-spacer{width:34px}.dh-setup{flex:1;min-height:0;overflow:auto;padding:16px}.dh-setup-cover{height:140px;border-radius:6px;background-size:cover;background-position:center 44%;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background-color:#323a3a}.dh-outline{align-self:flex-start;font-size:10px;padding:3px 6px;background:#0006;border:1px solid #fff4;border-radius:3px}.dh-camera-mark{width:32px;height:32px;filter:drop-shadow(0 1px 4px #000)}.dh-setup-cover>span:last-child{font-size:12px}.dh-field{display:grid!important;grid-template-columns:minmax(0,1fr) 15px;text-align:left;width:100%;padding:17px 0!important;border-bottom:1px solid #ffffff14!important;gap:7px 10px}.dh-field small{grid-column:1;font-size:11px;color:#92929c}.dh-field b{grid-column:1;font-weight:400;font-size:14px;overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.5}.dh-field>span{grid-column:2;grid-row:1/3;align-self:center;color:#999;font-size:22px}.dh-field-multi b{font-size:12px}.dh-setting{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:15px 0;font-size:12px}.dh-segment{display:flex;padding:3px;background:#29292e;border-radius:5px}.dh-segment button{padding:5px 12px;border-radius:3px;font-size:11px;color:#aaa}.dh-segment .on{background:#505057;color:white}.dh-access{font-size:11px;color:#f7b6c4;margin:-5px 0 6px}.dh-setting input{appearance:none;width:34px;height:20px;border-radius:20px;background:#45454b;position:relative;cursor:pointer;margin:0;flex-shrink:0}.dh-setting input:before{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .15s}.dh-setting input:checked{background:#fa3159}.dh-setting input:checked:before{transform:translateX(14px)}.dh-setup-footer{padding:12px 16px 18px;border-top:1px solid #ffffff0d;flex-shrink:0}.dh-setup-footer button{width:100%}.dh-host-header{display:flex;align-items:center;gap:8px;padding:8px 10px;flex-shrink:0}.dh-host-identity{display:flex;align-items:center;gap:7px;min-width:0;flex:1;text-align:left}.dh-mini-avatar{width:33px;height:33px;display:grid;place-items:center;background:#4a4a52;border-radius:50%;flex-shrink:0}.dh-host-identity>span:last-child{min-width:0}.dh-host-identity b{font-size:12px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dh-host-identity small{font-size:9px;color:#b8b8bf;display:block;margin-top:3px}.dh-online{font-size:10px!important;background:#ffffff12!important;border-radius:16px;padding:6px 9px!important;flex-shrink:0}.dh-host-meta{display:flex;justify-content:space-between;padding:0 13px 9px;font-size:10px;color:#acacb6;flex-shrink:0}.dh-stage{flex:0 1 42%;min-height:110px;overflow:auto;background-size:cover;background-position:center;position:relative;background-color:#323a3a}.dh-stage-caption{padding:12px 14px;background:#080a0ed9;min-height:100%}.dh-stage-caption small{color:#ddd9d3;font-size:10px}.dh-stage p{white-space:pre-wrap;font-size:13px;line-height:1.85;margin:9px 0 0;overflow-wrap:anywhere}.dh-chat{flex:1;min-height:50px;overflow:auto;padding:9px 12px}.dh-chat-notice{font-size:10px;color:#b1a280;margin-bottom:8px}.dh-message{font-size:12px;line-height:1.8;margin-bottom:5px;overflow-wrap:anywhere}.dh-message>b{font-weight:400;color:#bdc3e0}.dh-message small{font-size:10px;color:#9999a4}.dh-host-badge{font-size:9px;background:#fa315928;color:#ff8197;padding:2px 4px;border-radius:3px;margin-right:4px}.dh-msg-start,.dh-msg-action{border-left:2px solid #29d9cf77;padding-left:6px;color:#d2d2d8}.dh-msg-gift{color:#ffe3a2}.dh-gift{white-space:nowrap}.dh-msg-join{color:#a5aece;font-size:11px}.dh-msg-failed{opacity:.7}.dh-retry{color:#ff8e99!important;font-size:10px!important;margin-left:6px}.dh-controls{padding:7px 10px 13px;border-top:1px solid #ffffff10;flex-shrink:0;background:#19191c}.dh-controls>.dh-primary{width:100%}.dh-input-tabs{display:flex;gap:17px;align-items:center;padding:2px 3px 10px;font-size:11px}.dh-input-tabs button{color:#868690;font-size:11px}.dh-input-tabs .on{color:white}.dh-end{margin-left:auto;color:#ff8599!important}.dh-compose{display:flex;align-items:center;gap:4px}.dh-draft{background:#2c2c31!important;border-radius:18px;flex:1;min-width:0;height:35px;text-align:left;padding:0 13px!important;font-size:11px!important;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#b6b6c0!important}.dh-info{padding:10px 14px;background:#25252b;border-top:1px solid #ffffff0d;max-height:105px;overflow:auto;flex-shrink:0;font-size:11px}.dh-info p{line-height:1.6;white-space:pre-wrap;margin:5px 0}.dh-info small{color:#b9a9b2}.dh-loading{display:flex;gap:4px;padding:8px 0}.dh-loading i{height:4px;width:4px;background:#b4b4bc;border-radius:50%;animation:dh-pulse 1s infinite}.dh-loading i:nth-child(2){animation-delay:.15s}.dh-loading i:nth-child(3){animation-delay:.3s}@keyframes dh-pulse{50%{opacity:.2}}.dh-error{background:#55242c;color:#ffd7de;padding:7px 12px;display:flex;align-items:center;gap:12px;font-size:10px;flex-shrink:0}.dh-error>span{flex:1}.dh-error button{text-decoration:underline;font-size:10px}.dh-modal-shade{position:absolute;inset:0;z-index:4;background:#0009;display:flex;align-items:center;justify-content:center;padding:23px}.dh-modal{background:#28282e;padding:22px;border-radius:8px;width:100%}.dh-modal h3{font-size:16px;margin:0 0 10px}.dh-modal p{font-size:12px;color:#aaaab4;line-height:1.7}.dh-modal button{display:block;width:100%;margin-top:10px}.dh-local-error{background:#55242c;color:#ffd7de;font-size:11px;padding:8px;margin:0;overflow-wrap:anywhere;max-height:65px;overflow:auto;flex-shrink:0}
@media(prefers-reduced-motion:reduce){.dh-loading i{animation:none}}
</style>
