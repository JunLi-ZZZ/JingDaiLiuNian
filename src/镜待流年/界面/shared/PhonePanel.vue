<template>
  <div class="mp-overlay" @click.self="$emit('close')">
    <div class="mp-phone">
      <button class="mp-power" @click="$emit('close')" title="关闭"></button>

      <!-- 状态栏 -->
      <div class="mp-status">
        <span class="mp-st-time">{{ clock }}</span>
        <span class="mp-st-notch"></span>
        <span class="mp-st-ico">
          <svg viewBox="0 0 640 640"><path fill="currentColor" d="M112 400h56v96h-56zm120-64h56v160h-56zm120-80h56v240h-56zm120-96h56v336h-56z"/></svg>
          <svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 160c116 0 221 45 298 118l-52 54c-64-60-151-96-246-96S138 272 74 332l-52-54C99 205 204 160 320 160m0 152c58 0 111 22 150 59l-53 55c-26-24-60-38-97-38s-71 14-97 38l-53-55c39-37 92-59 150-59m0 152c20 0 38 8 51 22l-51 53l-51-53c13-14 31-22 51-22"/></svg>
          <span class="mp-st-bat"></span>
        </span>
      </div>

      <!-- 主屏 -->
      <div v-if="view === 'home'" class="mp-home">
        <div class="mp-home-clock">{{ clock }}</div>
        <div class="mp-home-date">{{ dateLabel }}</div>
        <div class="mp-apps">
          <button class="mp-app" @click="openWeChat">
            <span class="mp-app-ico ico-wx"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M256 128C150 128 64 200 64 288c0 48 26 91 67 120l-14 52 61-33c22 6 45 9 69 9h6c-3-12-5-25-5-38 0-83 82-149 183-149h6c-16-75-96-133-186-133m-64 96a24 24 0 110 48 24 24 0 010-48m128 0a24 24 0 110 48 24 24 0 010-48"/><path fill="currentColor" d="M448 288c-88 0-160 59-160 132s72 132 160 132c19 0 38-3 55-8l50 27-12-44c34-24 55-59 55-99 0-73-72-132-148-140m-52 88a20 20 0 110 40 20 20 0 010-40m104 0a20 20 0 110 40 20 20 0 010-40"/></svg></span>
            <span class="mp-app-lbl">微信</span>
            <span v-if="totalUnread" class="mp-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
          </button>
          <button class="mp-app mp-app-dim" disabled><span class="mp-app-ico ico-cam"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M256 128l-32 48h-96c-35 0-64 29-64 64v224c0 35 29 64 64 64h384c35 0 64-29 64-64V240c0-35-29-64-64-64h-96l-32-48zm64 128a112 112 0 110 224 112 112 0 010-224"/></svg></span><span class="mp-app-lbl">相机</span></button>
          <button class="mp-app mp-app-dim" disabled><span class="mp-app-ico ico-note"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M160 64c-35 0-64 29-64 64v384c0 35 29 64 64 64h320c35 0 64-29 64-64V128c0-35-29-64-64-64zm64 128h192v48H224zm0 112h192v48H224zm0 112h128v48H224z"/></svg></span><span class="mp-app-lbl">备忘</span></button>
          <button class="mp-app mp-app-dim" disabled><span class="mp-app-ico ico-set"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 208a112 112 0 100 224 112 112 0 000-224m0 64a48 48 0 110 96 48 48 0 010-96"/></svg></span><span class="mp-app-lbl">设置</span></button>
        </div>
      </div>

      <!-- 微信 -->
      <div v-else class="mp-wx">
        <!-- 单聊视图 -->
        <template v-if="activeContact">
          <div class="mp-wx-nav">
            <button class="mp-nav-back" @click="activeContact = ''"><svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" d="M400 128L208 320l192 192"/></svg></button>
            <span class="mp-nav-title">{{ activeContact }}</span>
            <span class="mp-nav-more">···</span>
          </div>
          <div ref="scrollEl" class="mp-chat">
            <div v-if="!messages.length" class="mp-hint">发条消息，打个招呼吧</div>
            <div v-for="(m, i) in messages" :key="i" :class="['mp-row', m.dir === '发出' ? 'out' : 'in']">
              <div class="mp-ava">{{ initial(m.dir === '发出' ? meName : activeContact) }}</div>
              <div :class="['mp-bub', 'mt-' + (m.type || '文字')]">
                <template v-if="m.type === '语音'"><span class="mp-voice"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 96c-53 0-96 43-96 96v128c0 53 43 96 96 96s96-43 96-96V192c0-53-43-96-96-96"/><path fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" d="M160 288c0 88 72 160 160 160s160-72 160-160M320 448v96"/></svg>{{ voiceLen(m.text) }}''</span><span class="mp-vtext">{{ m.text }}</span></template>
                <template v-else-if="m.type === '图片'"><span class="mp-media"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M128 128c-35 0-64 29-64 64v256c0 35 29 64 64 64h384c35 0 64-29 64-64V192c0-35-29-64-64-64zm80 80a48 48 0 110 96 48 48 0 010-96m304 240H128l96-128 64 80 80-112z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                <template v-else-if="m.type === '视频'"><span class="mp-media mp-video"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128a192 192 0 100 384 192 192 0 000-384m-40 120l112 72-112 72z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                <template v-else-if="m.type === '表情'"><span class="mp-sticker">{{ m.text }}</span></template>
                <template v-else>{{ m.text }}</template>
              </div>
            </div>
            <div v-if="sending" class="mp-row in"><div class="mp-ava">{{ initial(activeContact) }}</div><div class="mp-bub mp-typing"><span></span><span></span><span></span></div></div>
          </div>
          <div class="mp-inbar">
            <textarea v-model="draft" class="mp-ta" rows="1" placeholder="" @keydown.enter.exact.prevent="send"></textarea>
            <button class="mp-send" :disabled="!draft.trim() || sending" @click="send">发送</button>
          </div>
        </template>

        <!-- tab 内容 -->
        <template v-else>
          <div class="mp-wx-head"><span class="mp-wx-title">{{ tabTitle }}</span><span v-if="wxTab==='chats'" class="mp-wx-add">+</span></div>
          <div class="mp-wx-body">
            <!-- 聊天 -->
            <template v-if="wxTab === 'chats'">
              <div class="mp-newchat">
                <input v-model="newContact" class="mp-nc-in" placeholder="输入联系人名开始对话" @keydown.enter="startChat" />
                <button class="mp-nc-btn" @click="startChat">发起</button>
              </div>
              <div v-if="!contacts.length" class="mp-hint">还没有对话</div>
              <div v-for="c in contacts" :key="c" class="mp-cell" @click="openContact(c)">
                <div class="mp-ava lg">{{ initial(c) }}</div>
                <div class="mp-cell-mid"><div class="mp-cell-nm">{{ c }}</div><div class="mp-cell-sub">{{ lastPreview(c) }}</div></div>
                <div class="mp-cell-rt"><div class="mp-cell-tm">{{ lastTime(c) }}</div><div v-if="unread[c]" class="mp-badge sm">{{ unread[c] }}</div></div>
              </div>
            </template>
            <!-- 通讯录 -->
            <template v-else-if="wxTab === 'contacts'">
              <div v-if="!contacts.length" class="mp-hint">通讯录为空</div>
              <div v-for="c in contacts" :key="c" class="mp-cell" @click="openContact(c)">
                <div class="mp-ava lg">{{ initial(c) }}</div><div class="mp-cell-mid"><div class="mp-cell-nm">{{ c }}</div></div>
              </div>
            </template>
            <!-- 发现 -->
            <template v-else-if="wxTab === 'discover'">
              <div class="mp-disc" @click="wxTab = 'discover'"><span class="mp-disc-ico ico-moments"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 96c-14 0-27 8-34 20l-38 66-74-10c-30-4-53 26-40 53l32 68-49 56c-20 23-6 59 24 63l73 10 8 74c3 30 37 46 63 30l64-38 64 38c26 16 60 0 63-30l8-74 73-10c30-4 44-40 24-63l-49-56 32-68c13-27-10-57-40-53l-74 10-38-66c-7-12-20-20-34-20"/></svg></span><span class="mp-disc-lbl">朋友圈</span><span class="mp-disc-arrow">›</span></div>
              <div class="mp-hint" style="margin-top:24px">朋友圈内容即将上线</div>
            </template>
            <!-- 我 -->
            <template v-else>
              <div class="mp-me"><div class="mp-ava xl">{{ initial(meName) }}</div><div class="mp-me-nm">{{ meName }}</div></div>
            </template>
          </div>
          <!-- 底部 tab 栏 -->
          <div class="mp-tabbar">
            <button v-for="t in tabs" :key="t.k" :class="['mp-tab', { on: wxTab === t.k }]" @click="wxTab = t.k">
              <span class="mp-tab-ico" v-html="t.ico"></span><span class="mp-tab-lbl">{{ t.l }}</span>
              <span v-if="t.k === 'chats' && totalUnread" class="mp-badge tb">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- home 指示条 -->
      <div class="mp-homebar" @click="goHome"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

defineEmits(['close'])

const VAR_KEY = 'phone_logs'
const logs = ref({})
const unread = ref({})
const view = ref('home')
const wxTab = ref('chats')
const activeContact = ref('')
const draft = ref('')
const newContact = ref('')
const sending = ref(false)
const clock = ref('')
const dateLabel = ref('')
const scrollEl = ref(null)

const doc = window.parent ? window.parent.document : document
function TH() { return window.parent && window.parent.TavernHelper }

const meName = computed(() => {
  try {
    const ctx = window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext()
    return (ctx && ctx.name1) || '我'
  } catch (e) { return '我' }
})

const tabs = [
  { k: 'chats', l: '微信', ico: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M256 128C150 128 64 200 64 288c0 48 26 91 67 120l-14 52 61-33c22 6 45 9 69 9 106 0 192-72 192-160S362 128 256 128"/></svg>' },
  { k: 'contacts', l: '通讯录', ico: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 320a112 112 0 100-224 112 112 0 000 224m0 48c-97 0-224 49-224 146v46h448v-46c0-97-127-146-224-146"/></svg>' },
  { k: 'discover', l: '发现', ico: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="44" d="M320 96a224 224 0 100 448 224 224 0 000-448"/><path fill="currentColor" d="M420 220l-56 144-144 56 56-144z"/></svg>' },
  { k: 'me', l: '我', ico: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 320a112 112 0 100-224 112 112 0 000 224m0 48c-97 0-224 49-224 146v46h448v-46c0-97-127-146-224-146"/></svg>' },
]
const tabTitle = computed(() => ({ chats: '微信', contacts: '通讯录', discover: '发现', me: '我' }[wxTab.value]))

const contacts = computed(() => Object.keys(logs.value))
const messages = computed(() => logs.value[activeContact.value] || [])
const totalUnread = computed(() => Object.values(unread.value).reduce((a, b) => a + (b || 0), 0))

function initial(n) { return (n || '?').trim().slice(0, 1) }
function lastMsg(c) { const l = logs.value[c]; return l && l.length ? l[l.length - 1] : null }
function lastTime(c) { const m = lastMsg(c); return m ? m.time : '' }
function lastPreview(c) {
  const m = lastMsg(c); if (!m) return ''
  const pfx = m.type && m.type !== '文字' ? '[' + m.type + '] ' : ''
  return pfx + m.text
}
function voiceLen(t) { return Math.min(60, Math.max(1, Math.round((t || '').length / 3))) }

function storyTime() {
  try {
    const p = window.parent
    if (p && typeof p.getvar === 'function') { const t = p.getvar('世界.当前时间') || p.getvar('当前时间'); if (t) return String(t) }
  } catch (e) {}
  const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function loadLogs() {
  const th = TH(); if (!th || !th.getVariables) return
  try { const v = th.getVariables({ type: 'chat' }) || {}; if (v[VAR_KEY] && typeof v[VAR_KEY] === 'object') logs.value = v[VAR_KEY] } catch (e) {}
}
function saveLogs() {
  const th = TH(); if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [VAR_KEY]: logs.value }, { type: 'chat' }) } catch (e) {}
}
function appendMsg(contact, msg) {
  if (!logs.value[contact]) logs.value[contact] = []
  logs.value[contact].push(msg); saveLogs(); scrollDown()
}

function syncScrape() {
  const spans = doc.querySelectorAll('[class*="phone-data"]')
  if (!spans.length) return
  let changed = false
  spans.forEach(span => {
    const raw = (span.textContent || '').trim(); if (!raw) return
    const p = raw.split('|||'); if (p.length < 5) return
    const contact = p[0].trim(), dir = p[1].trim(), type = (p[2] || '文字').trim() || '文字', text = p[3].trim(), time = p[4].trim()
    if (!contact || !text) return
    if (!logs.value[contact]) logs.value[contact] = []
    const sig = dir + '|' + type + '|' + text + '|' + time
    if (!logs.value[contact].some(m => (m.dir + '|' + (m.type || '文字') + '|' + m.text + '|' + m.time) === sig)) {
      logs.value[contact].push({ dir, type, text, time })
      if (dir === '收到' && activeContact.value !== contact) unread.value[contact] = (unread.value[contact] || 0) + 1
      changed = true
    }
  })
  if (changed) saveLogs()
}

function parseReplyBlocks(raw, fallbackTime) {
  const out = []; const re = /<手机>([\s\S]*?)<\/手机>/g; let m
  while ((m = re.exec(raw))) {
    const b = m[1]
    const type = ((b.match(/类型:\s*([^\n]*)/) || [])[1] || '文字').trim() || '文字'
    const text = ((b.match(/内容:\s*([\s\S]*?)\s*(?:时间:|$)/) || [])[1] || '').trim()
    const time = ((b.match(/时间:\s*([^\n]*)/) || [])[1] || '').trim() || fallbackTime
    if (text) out.push({ type, text, time })
  }
  if (!out.length) out.push({ type: '文字', text: raw.replace(/<\/?手机>/g, '').trim() || '……', time: fallbackTime })
  return out
}

function openWeChat() { view.value = 'wechat'; wxTab.value = 'chats'; activeContact.value = '' }
function goHome() { if (activeContact.value) activeContact.value = ''; else view.value = 'home' }
function openContact(c) { activeContact.value = c; unread.value[c] = 0; scrollDown() }
function startChat() { const n = newContact.value.trim(); if (!n) return; if (!logs.value[n]) { logs.value[n] = []; saveLogs() } newContact.value = ''; openContact(n) }
function scrollDown() { nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight }) }

async function send() {
  const th = TH(); const text = draft.value.trim(); const contact = activeContact.value
  if (!text || !contact || sending.value) return
  if (!th || !th.generateRaw) { appendMsg(contact, { dir: '收到', type: '文字', text: '（未检测到酒馆助手，无法送达）', time: '' }); draft.value = ''; return }
  const time = storyTime()
  appendMsg(contact, { dir: '发出', type: '文字', text, time }); draft.value = ''; sending.value = true; scrollDown()
  try {
    const outBlock = `<手机>\n联系人: ${contact}\n方向: 发出\n类型: 文字\n内容: ${text}\n时间: ${time}\n</手机>`
    const prompt =
      `<user>刚通过手机给「${contact}」发送了一条消息：「${text}」。\n` +
      `请以「${contact}」的身份，依据其人设、与<user>的关系及当前处境，回复<user>的手机消息。\n` +
      `可连发多条；每条消息输出一个 <手机> 标签，方向填"收到"，类型据实填写（文字/图片/语音/表情/视频）。不要输出任何叙事正文。`
    const ordered = [{ role: 'system', content: prompt }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'chat_history', 'user_input']
    const result = await th.generateRaw({ user_input: `（生成「${contact}」的手机回复，仅输出 <手机> 标签，可多条）`, should_silence: true, max_chat_history: 6, ordered_prompts: ordered })
    const raw = typeof result === 'string' ? result : (result && result.content) || ''
    const replies = parseReplyBlocks(raw, time)
    const replyText = replies.map(r => `<手机>\n联系人: ${contact}\n方向: 收到\n类型: ${r.type}\n内容: ${r.text}\n时间: ${r.time}\n</手机>`).join('\n')
    if (th.createChatMessages) {
      try { await th.createChatMessages([{ role: 'assistant', message: outBlock + '\n' + replyText, data: { is_phone_record: true, phone_contact: contact } }], { insert_before: 'end' }) } catch (e) {}
    }
    for (const r of replies) appendMsg(contact, { dir: '收到', type: r.type, text: r.text, time: r.time })
  } catch (e) {
    appendMsg(contact, { dir: '收到', type: '文字', text: '（发送失败：' + ((e && e.message) || e) + '）', time: '' })
  } finally { sending.value = false; scrollDown() }
}

function tick() {
  const d = new Date()
  clock.value = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  dateLabel.value = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + '周' + '日一二三四五六'[d.getDay()]
}
let timer = null
onMounted(() => {
  tick(); loadLogs(); syncScrape()
  timer = setInterval(() => { tick(); loadLogs(); syncScrape() }, 2000)
  doc.documentElement.style.overflow = 'hidden'; doc.body.style.overflow = 'hidden'
})
onUnmounted(() => { clearInterval(timer); doc.documentElement.style.overflow = ''; doc.body.style.overflow = '' })
</script>

<style>
@import url('https://fontsapi.zeoseven.com/3/main/result.css');
@import url('https://fontsapi.zeoseven.com/84/main/result.css');
.mp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);animation:mp-fade .25s ease-out;pointer-events:all;font-family:'DouyinSans','PingFang SC','Microsoft YaHei',sans-serif}
@keyframes mp-fade{0%{opacity:0}100%{opacity:1}}
.mp-phone{position:relative;width:min(90vw,392px);height:min(92vh,844px);aspect-ratio:392/844;background:#000;border-radius:44px;padding:12px 10px 8px;box-shadow:0 24px 70px rgba(0,0,0,.6),inset 0 0 0 2px rgba(90,80,60,.35);display:flex;flex-direction:column;overflow:hidden;animation:mp-pop .3s cubic-bezier(.2,.9,.3,1.2)}
@keyframes mp-pop{0%{opacity:0;transform:scale(.93) translateY(12px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.mp-power{position:absolute;right:-4px;top:170px;width:4px;height:64px;border:none;background:linear-gradient(180deg,#3a352c,#14120f);border-radius:3px;cursor:pointer;z-index:9}
.mp-phone > *:not(.mp-power){position:relative;z-index:2}
.mp-status,.mp-home,.mp-wx{background:transparent}
.mp-status{display:flex;align-items:center;justify-content:space-between;padding:6px 30px 4px;font-size:13px;font-weight:600;color:#fff;flex-shrink:0}
.mp-home .mp-st-time,.mp-home ~ *{}
.mp-st-notch{position:absolute;left:50%;top:8px;transform:translateX(-50%);width:96px;height:22px;background:#000;border-radius:14px}
.mp-st-ico{display:flex;align-items:center;gap:5px}
.mp-st-ico svg{width:15px;height:13px;color:#fff}
.mp-st-bat{width:22px;height:12px;border:1.5px solid rgba(255,255,255,.7);border-radius:3px;position:relative}
.mp-st-bat::after{content:'';position:absolute;inset:2px;right:6px;background:#fff;border-radius:1px}
.mp-st-bat::before{content:'';position:absolute;right:-3px;top:3px;width:2px;height:5px;background:rgba(255,255,255,.7);border-radius:0 1px 1px 0}

/* 主屏 */
.mp-home{flex:1;display:flex;flex-direction:column;align-items:center;border-radius:34px;background:radial-gradient(130% 90% at 50% 0%,#3a4a6b 0%,#243349 45%,#141b28 100%)}
.mp-home-clock{margin-top:12%;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:60px;font-weight:300;color:#fff;letter-spacing:.02em;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.mp-home-date{font-size:14px;color:rgba(255,255,255,.7);margin-top:-4px}
.mp-apps{margin-top:auto;margin-bottom:5%;display:grid;grid-template-columns:repeat(4,1fr);gap:18px 6px;width:100%;padding:0 18px}
.mp-app{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0}
.mp-app-dim{opacity:.45;cursor:default}
.mp-app-ico{width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.mp-app:not(.mp-app-dim):active .mp-app-ico{transform:scale(.92)}
.mp-app-ico svg{width:30px;height:30px;color:#fff}
.ico-wx{background:linear-gradient(160deg,#4ade80,#07c160)}
.ico-cam{background:linear-gradient(160deg,#9ca3af,#4b5563)}
.ico-note{background:linear-gradient(160deg,#fcd34d,#f59e0b)}
.ico-set{background:linear-gradient(160deg,#a8a29e,#57534e)}
.mp-app-lbl{font-size:12px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4)}
.mp-badge{position:absolute;top:-4px;right:6px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#fa5151;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.3);border:1.5px solid #141b28}
.mp-badge.sm{position:static;border-color:#fff;margin-top:2px}
.mp-badge.tb{top:2px;right:22%;border-color:#f7f7f7}

/* 微信 */
.mp-wx{flex:1;display:flex;flex-direction:column;border-radius:0 0 34px 34px;background:#ededed;overflow:hidden}
.mp-wx-head{display:flex;align-items:center;justify-content:center;position:relative;padding:8px 16px 12px;background:#ededed}
.mp-wx-title{font-family:'寒蝉全圆体','DouyinSans',serif;font-size:17px;font-weight:700;color:#1a1a1a}
.mp-wx-add{position:absolute;right:18px;top:6px;font-size:24px;color:#1a1a1a;font-weight:300}
.mp-wx-body{flex:1;overflow-y:auto;background:#ededed}
.mp-hint{text-align:center;color:#9a9a9a;font-size:13px;padding:36px 16px}
.mp-newchat{display:flex;gap:6px;padding:8px 12px;background:#f3f3f3;border-bottom:1px solid rgba(0,0,0,.05)}
.mp-nc-in{flex:1;min-width:0;padding:7px 11px;border:1px solid rgba(0,0,0,.1);border-radius:7px;background:#fff;font-size:13px;color:#222;outline:none}
.mp-nc-in:focus{border-color:#07c160}
.mp-nc-btn{flex-shrink:0;padding:0 14px;border:none;border-radius:7px;background:#07c160;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.mp-cell{display:flex;align-items:center;gap:11px;padding:11px 14px;background:#fff;border-bottom:1px solid #f0f0f0;cursor:pointer}
.mp-cell:active{background:#e9e9e9}
.mp-ava{width:36px;height:36px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#c8a86a,#a8895a);color:#fff;font-family:'寒蝉全圆体','DouyinSans',serif;font-weight:700;font-size:16px}
.mp-ava.lg{width:46px;height:46px;font-size:20px;border-radius:8px}
.mp-ava.xl{width:64px;height:64px;font-size:28px;border-radius:10px}
.mp-cell-mid{flex:1;min-width:0}
.mp-cell-nm{font-size:15px;color:#1a1a1a;font-weight:600}
.mp-cell-sub{font-size:12.5px;color:#999;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.mp-cell-rt{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0}
.mp-cell-tm{font-size:11px;color:#bbb}
.mp-disc{display:flex;align-items:center;gap:12px;padding:13px 16px;background:#fff;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;cursor:pointer;margin-top:8px}
.mp-disc-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#5b8def,#3b5bdb)}
.mp-disc-ico svg{width:20px;height:20px;color:#fff}
.mp-disc-lbl{flex:1;font-size:15px;color:#1a1a1a}
.mp-disc-arrow{color:#c8c8c8;font-size:18px}
.mp-me{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 16px;background:#fff;margin-bottom:8px}
.mp-me-nm{font-family:'寒蝉全圆体','DouyinSans',serif;font-size:18px;font-weight:700;color:#1a1a1a}

/* 单聊 */
.mp-wx-nav{display:flex;align-items:center;gap:8px;padding:6px 12px 10px;background:#ededed;border-bottom:1px solid rgba(0,0,0,.06);flex-shrink:0}
.mp-nav-back{width:24px;height:24px;background:none;border:none;cursor:pointer;padding:0;color:#1a1a1a;flex-shrink:0}
.mp-nav-back svg{width:20px;height:20px}
.mp-nav-title{flex:1;text-align:center;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:16px;font-weight:700;color:#1a1a1a;margin-left:-24px}
.mp-nav-more{color:#1a1a1a;font-weight:700;letter-spacing:1px}
.mp-chat{flex:1;overflow-y:auto;padding:14px 12px;background:#ededed;display:flex;flex-direction:column;gap:14px}
.mp-row{display:flex;gap:9px;align-items:flex-start;max-width:100%}
.mp-row.out{flex-direction:row-reverse}
.mp-row .mp-ava{width:38px;height:38px;font-size:17px}
.mp-bub{position:relative;max-width:66%;padding:9px 13px;border-radius:8px;font-size:14.5px;line-height:1.5;color:#1a1a1a;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);word-break:break-word;white-space:pre-wrap}
.mp-row.out .mp-bub{background:#95ec69}
.mp-bub::before{content:'';position:absolute;top:13px;width:0;height:0;border:6px solid transparent}
.mp-row.in .mp-bub::before{left:-11px;border-right-color:#fff}
.mp-row.out .mp-bub::before{right:-11px;border-left-color:#95ec69}
.mp-bub.mt-语音{display:flex;flex-direction:column;gap:5px;min-width:90px}
.mp-voice{display:flex;align-items:center;gap:8px;font-size:13px;color:#333}
.mp-voice svg{width:18px;height:18px;color:#333;flex-shrink:0}
.mp-vtext{font-size:12.5px;color:#666;border-top:1px solid rgba(0,0,0,.06);padding-top:5px}
.mp-media{display:flex;align-items:center;justify-content:center;width:150px;height:104px;background:linear-gradient(135deg,#d8d8d8,#c4c4c4);border-radius:5px;margin-bottom:5px}
.mp-media svg{width:40px;height:40px;color:#fff}
.mp-video{background:linear-gradient(135deg,#4b5563,#1f2937)}
.mp-cap{display:block;font-size:13px;color:#555}
.mp-bub.mt-图片,.mp-bub.mt-视频{padding:7px}
.mp-sticker{font-size:26px;line-height:1.3}
.mp-bub.mt-表情{background:transparent!important;box-shadow:none;padding:2px}
.mp-bub.mt-表情::before{display:none}
.mp-typing{display:flex;gap:4px;align-items:center;padding:13px 15px;min-width:auto}
.mp-typing span{width:6px;height:6px;border-radius:50%;background:#bbb;animation:mp-bnc 1.2s infinite}
.mp-typing span:nth-child(2){animation-delay:.2s}.mp-typing span:nth-child(3){animation-delay:.4s}
@keyframes mp-bnc{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
.mp-inbar{display:flex;gap:8px;align-items:flex-end;padding:8px 12px;background:#f6f6f6;border-top:1px solid rgba(0,0,0,.07);flex-shrink:0}
.mp-ta{flex:1;min-width:0;max-height:80px;padding:8px 11px;border:none;border-radius:6px;background:#fff;font-size:14px;color:#1a1a1a;resize:none;outline:none;font-family:inherit;line-height:1.4;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.mp-send{flex-shrink:0;padding:8px 16px;border:none;border-radius:6px;background:#07c160;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
.mp-send:disabled{opacity:.4;cursor:default}

/* tab 栏 */
.mp-tabbar{display:flex;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.07);flex-shrink:0;padding-bottom:2px}
.mp-tab{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0 5px;background:none;border:none;cursor:pointer;color:#7a7a7a}
.mp-tab.on{color:#07c160}
.mp-tab-ico{width:24px;height:24px}
.mp-tab-ico svg{width:24px;height:24px}
.mp-tab-lbl{font-size:10.5px}

.mp-homebar{height:5px;width:36%;margin:6px auto 2px;background:rgba(255,255,255,.55);border-radius:3px;cursor:pointer;flex-shrink:0}
.mp-wx-body::-webkit-scrollbar,.mp-chat::-webkit-scrollbar{width:0}
</style>
