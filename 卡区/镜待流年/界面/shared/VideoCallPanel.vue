<template>
  <section v-if="room" class="vc" :class="{ 'vc-connected': !!room.screen }">
    <header class="vc-header"><button title="收起通话" aria-label="收起通话" @click="$emit('close')"><i class="fa-solid fa-chevron-left" /></button><div><b>{{ room.contact }}</b><small>{{ room.status === 'ended' ? '通话记录' : room.pending ? '对方正在回应' : room.status === 'calling' ? '等待接通' : '视频通话' }}</small></div><span>{{ elapsed }}</span></header>
    <div v-if="!room.screen" class="vc-waiting"><div class="vc-avatar">{{ room.contact.slice(0, 1) }}</div><b>{{ room.contact }}</b></div>
    <div v-else class="vc-screen"><small>对方画面</small><p>{{ room.screen }}</p></div>
    <div ref="logEl" class="vc-log" aria-live="polite"><div v-for="line in historyLines" :key="line.id" class="vc-line" :class="{ 'vc-mine': line.name === room.owner }"><small>{{ line.name }}</small><p>{{ line.text }}</p><button v-if="line.status === 'failed' && room.status !== 'ended'" @click="retry">重试</button></div><div v-if="room.pending" class="vc-loading" role="status" aria-label="正在生成"><i /><i /><i /></div></div>
    <div v-if="room.error" class="vc-error" role="alert"><span>{{ room.error }}</span><button @click="retry">重试</button><button @click="withdraw">撤回</button></div>
    <details v-if="room.failedRaw" class="vc-raw"><summary>查看未解析的回复</summary><p>{{ room.failedRaw }}</p></details>
    <footer class="vc-controls" v-if="room.status !== 'ended'"><button :disabled="!!room.pending || !!room.error" @click="input"><i class="fa-solid fa-comment" /><span>说点什么</span></button><button :disabled="!!room.pending || !!room.error" @click="run('continue', '')"><i class="fa-solid fa-play" /><span>继续</span></button><button class="vc-hang" @click="hang"><i class="fa-solid fa-phone-slash" /><span>挂断</span></button></footer>
    <footer v-else class="vc-ended">通话已结束</footer>
    <p v-if="error" class="vc-error">{{ error }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { CALL_SYNC, endCall, readCalls, runVideoCall, saveCall, type VideoCall } from './videoCall';
const props = defineProps<{ storageKey: string; callId: string; api: { generate: (options: any) => Promise<string>; openIME: (options: any) => void } }>();
defineEmits(['close']);
const room = ref<VideoCall>(); const draft = ref(''); const error = ref(''); const logEl = ref<HTMLElement>(); const now = ref(Date.now());
const historyLines = computed(() => (room.value?.lines || []).filter((line, index, list) => !(index === list.length - 1 && line.name === room.value?.contact && line.text === room.value?.screen)));
let timer: ReturnType<typeof setInterval>;
const elapsed = computed(() => { const secs = Math.max(0, Math.floor(((room.value?.endedAt || now.value) - (room.value?.startedAt || now.value)) / 1000)); return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`; });
function load() { room.value = readCalls(props.storageKey).find(item => item.id === props.callId); }
async function run(kind: 'message' | 'continue', text: string, retry = false) {
  error.value = '';
  try { await runVideoCall(props.storageKey, props.callId, kind, text, props.api.generate, retry); }
  catch (e) { error.value = String(e); }
}
function retry() { void run('message', '', true); }
function withdraw() {
  const call = room.value; if (!call || call.pending) return;
  draft.value = call.request?.text || ''; call.lines = call.lines.filter(line => line.id !== call.request?.id);
  call.request = undefined; call.error = ''; call.failedRaw = ''; saveCall(props.storageKey, call);
}
function input() { props.api.openIME({ placeholder: '通话中的话或动作', getValue: () => draft.value, setValue: (v: string) => { draft.value = v; }, multiline: true, onSubmit: () => { const text = draft.value.trim(); if (text) { void run('message', text); draft.value = ''; } } }); }
function hang() { endCall(props.storageKey, props.callId); }
watch(() => [room.value?.lines.length, room.value?.pending], () => nextTick(() => { if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight; }));
onMounted(() => { load(); window.parent.addEventListener(CALL_SYNC, load); timer = setInterval(() => { now.value = Date.now(); }, 1000); });
onUnmounted(() => { window.parent.removeEventListener(CALL_SYNC, load); clearInterval(timer); });
</script>
<style scoped>
.vc{position:absolute;inset:0;z-index:80;display:flex;flex-direction:column;min-height:0;background:#292f32;color:#f5f7f8;padding-top:28px;font-size:13px;font-family:inherit;letter-spacing:0}.vc *{box-sizing:border-box;letter-spacing:0}.vc button{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.vc button:disabled{opacity:.35;cursor:default}.vc-header{display:flex;align-items:center;gap:12px;padding:10px 12px;flex-shrink:0;background:#242b2f;color:#fff}.vc-header>button{width:28px;height:32px;flex-shrink:0}.vc-header>div{flex:1;min-width:0}.vc-header b{font-size:14px;overflow-wrap:anywhere}.vc-header small{display:block;font-size:10px;color:#c1cacf;margin-top:4px}.vc-header>span{font-size:11px;font-variant-numeric:tabular-nums}.vc-waiting{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px}.vc-avatar{width:68px;height:68px;background:#53676b;border-radius:10px;display:grid;place-items:center;font-size:28px}.vc-connected{background:#f1f3f2;color:#202a28}.vc-screen{flex:0 1 36%;min-height:95px;overflow:auto;padding:13px 16px;background:#e2ebe8;color:#1e3430;border-bottom:1px solid #c8d6d2}.vc-screen>small{font-size:10px;color:#526961}.vc-screen p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.85;margin:6px 0 0}.vc-log{flex:1;min-height:35px;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px}.vc-line{max-width:92%;align-self:flex-start;background:#fff;color:#202a28;padding:8px 11px;border-radius:6px;border:1px solid #dde3e1}.vc-line>small{font-size:10px;color:#64736e}.vc-line p{font-size:12px;line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0 0}.vc-mine{align-self:flex-end;background:#d5edce;border-color:#c0dcb8}.vc-line button{color:#a62639;margin-top:6px;font-size:11px}.vc-error{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f6e0e1;color:#9a2538;font-size:11px;flex-shrink:0;max-height:85px;overflow:auto;margin:0}.vc-error>span{flex:1;min-width:0;overflow-wrap:anywhere}.vc-raw{max-height:90px;overflow:auto;font-size:11px;padding:8px;color:#202a28;background:#fff}.vc-raw p{white-space:pre-wrap}.vc-controls{display:flex;justify-content:center;gap:30px;padding:12px 16px 18px;flex-shrink:0;background:#242b2f;color:#fff}.vc-controls button{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:10px}.vc-controls i{display:grid;place-items:center;font-size:18px;width:42px;height:42px;border-radius:50%;background:#495456}.vc-controls .vc-hang i{background:#cf3e53}.vc-ended{padding:16px;text-align:center;font-size:11px;flex-shrink:0;background:#e5e9e7;color:#52645e}.vc-loading{display:flex;gap:4px;padding:8px}.vc-loading i{height:4px;width:4px;background:#728e81;border-radius:50%;animation:vc-pulse 1s infinite}.vc-loading i:nth-child(2){animation-delay:.15s}.vc-loading i:nth-child(3){animation-delay:.3s}@keyframes vc-pulse{50%{opacity:.2}}@media(prefers-reduced-motion:reduce){.vc-loading i{animation:none}}
</style>
