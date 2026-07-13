<template>
  <div class="mp-overlay" @click.self="$emit('close')">
    <div class="mp-phone">
      <button class="mp-power" @click="$emit('close')" title="关闭"></button>
      <div class="mp-notch"></div>

      <div class="mp-statusbar">
        <span class="mp-sb-time">{{ clock }}</span>
        <span class="mp-sb-icons">
          <svg viewBox="0 0 640 640"><path fill="currentColor" d="M112 400h64v112h-64zm128-80h64v192h-64zm128-96h64v288h-64zm128-96h64v384h-64z"/></svg>
          <svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128c106 0 202 41 274 108c11 10 11 27 1 38l-19 20c-10 10-26 11-37 1c-58-52-137-83-219-83s-161 31-219 83c-11 10-27 9-37-1l-19-20c-10-11-10-28 1-38C118 169 214 128 320 128m0 224c40 0 76 15 104 40c11 10 11 28 0 39l-85 85c-10 11-28 11-38 0l-85-85c-11-11-11-29 0-39c28-25 64-40 104-40"/></svg>
          <svg viewBox="0 0 640 640"><path fill="currentColor" d="M96 224c0-35 29-64 64-64h288c35 0 64 29 64 64v16h16c26 0 48 21 48 48v64c0 27-22 48-48 48h-16v16c0 35-29 64-64 64H160c-35 0-64-29-64-64zm64 0v192h288V224z"/></svg>
        </span>
      </div>

      <!-- 主屏 -->
      <div v-if="view === 'home'" class="mp-home">
        <div class="mp-home-clock">{{ clock }}</div>
        <div class="mp-home-hint">镜通</div>
        <div class="mp-apps">
          <button class="mp-app" @click="view = 'messages'; activeContact = ''">
            <span class="mp-app-ico ico-msg">
              <svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128c123.7 0 224 89.2 224 199.2S443.7 526.4 320 526.4c-24 0-47.1-3.4-68.7-9.6c-5.6-1.6-11.6-1.1-16.9 1.4L154 555.2c-13.9 6.5-29-5.6-25.9-20.6l14.5-70.1c1.3-6.3-.7-12.8-5.2-17.4C102.1 411.9 96 370.7 96 327.2C96 217.2 196.3 128 320 128"/></svg>
            </span>
            <span class="mp-app-lbl">信息</span>
            <span v-if="totalUnread" class="mp-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
          </button>
          <button class="mp-app mp-app-dim" disabled>
            <span class="mp-app-ico ico-moments"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128c-14 0-27 7-35 18l-40 55l-66-9c-14-2-28 3-37 14s-12 26-8 39l20 64l-53 41c-11 9-17 22-15 36s11 26 24 31l62 24l3 67c1 14 9 26 22 32s28 4 39-4l55-40l55 40c11 8 26 10 39 4s21-18 22-32l3-67l62-24c13-5 22-17 24-31s-4-27-15-36l-53-41l20-64c4-13 1-28-8-39s-23-16-37-14l-66 9l-40-55c-8-11-21-18-35-18"/></svg></span>
            <span class="mp-app-lbl">朋友圈</span>
          </button>
          <button class="mp-app mp-app-dim" disabled>
            <span class="mp-app-ico ico-video"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M128 160c-35 0-64 29-64 64v192c0 35 29 64 64 64h384c35 0 64-29 64-64V224c0-35-29-64-64-64zm140 92l128 68c11 6 11 22 0 28l-128 68c-11 6-24-2-24-14V266c0-12 13-20 24-14"/></svg></span>
            <span class="mp-app-lbl">视频</span>
          </button>
          <button class="mp-app mp-app-dim" disabled>
            <span class="mp-app-ico ico-set"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 208a112 112 0 100 224a112 112 0 000-224m0 64a48 48 0 110 96a48 48 0 010-96"/></svg></span>
            <span class="mp-app-lbl">设置</span>
          </button>
        </div>
      </div>

      <!-- 信息 App -->
      <div v-else class="mp-app-screen">
        <!-- 会话列表 -->
        <template v-if="!activeContact">
          <div class="mp-app-bar">
            <button class="mp-back" @click="view = 'home'">
              <svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" d="M400 128L208 320l192 192"/></svg>
            </button>
            <span class="mp-app-name">信息</span>
          </div>
          <div class="mp-newchat">
            <input v-model="newContact" class="mp-newchat-in" placeholder="输入联系人名，开始对话…" @keydown.enter="startChat" />
            <button class="mp-newchat-btn" @click="startChat">发起</button>
          </div>
          <div class="mp-convo-list">
            <div v-if="!contacts.length" class="mp-empty">还没有任何对话</div>
            <div v-for="c in contacts" :key="c" class="mp-convo" @click="openContact(c)">
              <div class="mp-avatar">{{ initial(c) }}</div>
              <div class="mp-convo-mid">
                <div class="mp-convo-name">{{ c }}</div>
                <div class="mp-convo-last">{{ lastText(c) }}</div>
              </div>
              <div class="mp-convo-right">
                <div class="mp-convo-time">{{ lastTime(c) }}</div>
                <div v-if="unread[c]" class="mp-badge sm">{{ unread[c] > 99 ? '99+' : unread[c] }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 单聊 -->
        <template v-else>
          <div class="mp-app-bar">
            <button class="mp-back" @click="closeContact">
              <svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" d="M400 128L208 320l192 192"/></svg>
            </button>
            <span class="mp-app-name">{{ activeContact }}</span>
          </div>
          <div ref="scrollEl" class="mp-chat">
            <div v-if="!messages.length" class="mp-empty">发条消息，打个招呼吧</div>
            <div v-for="(m, i) in messages" :key="i" :class="['mp-row', m.dir === '发出' ? 'out' : 'in']">
              <div class="mp-bubble">{{ m.text }}<span v-if="m.time" class="mp-btime">{{ m.time }}</span></div>
            </div>
            <div v-if="sending" class="mp-row in"><div class="mp-bubble mp-typing"><span></span><span></span><span></span></div></div>
          </div>
          <div class="mp-input">
            <textarea v-model="draft" class="mp-ta" rows="1" placeholder="发消息…" @keydown.enter.exact.prevent="send"></textarea>
            <button class="mp-send" :disabled="!draft.trim() || sending" @click="send">发送</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

defineEmits(['close'])

const VAR_KEY = 'phone_logs'

const logs = ref({})           // { 联系人: [{dir,text,time}] }
const unread = ref({})         // { 联系人: n }
const view = ref('home')
const activeContact = ref('')
const draft = ref('')
const newContact = ref('')
const sending = ref(false)
const clock = ref('')
const scrollEl = ref(null)

const doc = window.parent ? window.parent.document : document
function TH() { return window.parent && window.parent.TavernHelper }

const contacts = computed(() => Object.keys(logs.value))
const messages = computed(() => logs.value[activeContact.value] || [])
const totalUnread = computed(() => Object.values(unread.value).reduce((a, b) => a + (b || 0), 0))

function initial(name) { return (name || '?').trim().slice(0, 1) }
function lastText(c) { const l = logs.value[c]; return l && l.length ? l[l.length - 1].text : '' }
function lastTime(c) { const l = logs.value[c]; return l && l.length ? l[l.length - 1].time : '' }

function storyTime() {
  try {
    const p = window.parent
    if (p && typeof p.getvar === 'function') {
      const t = p.getvar('世界.当前时间') || p.getvar('当前时间')
      if (t) return String(t)
    }
  } catch (e) {}
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function loadLogs() {
  const th = TH()
  if (!th || !th.getVariables) return
  try {
    const v = th.getVariables({ type: 'chat' }) || {}
    if (v[VAR_KEY] && typeof v[VAR_KEY] === 'object') logs.value = v[VAR_KEY]
  } catch (e) {}
}

function saveLogs() {
  const th = TH()
  if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [VAR_KEY]: logs.value }, { type: 'chat' }) } catch (e) {}
}

function appendMsg(contact, msg) {
  if (!logs.value[contact]) logs.value[contact] = []
  logs.value[contact].push(msg)
  saveLogs()
  scrollDown()
}

// 从正文里已渲染的 <手机> 卡片抓取消息，合并进 logs（主 AI 自发的手机消息也能进面板）
function syncScrape() {
  const spans = doc.querySelectorAll('[class*="phone-data"]')
  if (!spans.length) return
  let changed = false
  spans.forEach(span => {
    const raw = (span.textContent || '').trim()
    if (!raw) return
    const p = raw.split('|||')
    if (p.length < 4) return
    const contact = p[0].trim(), dir = p[1].trim(), text = p[2].trim(), time = p[3].trim()
    if (!contact || !text) return
    if (!logs.value[contact]) logs.value[contact] = []
    const sig = dir + '|' + text + '|' + time
    const exists = logs.value[contact].some(m => (m.dir + '|' + m.text + '|' + m.time) === sig)
    if (!exists) {
      logs.value[contact].push({ dir, text, time })
      if (dir === '收到' && activeContact.value !== contact) unread.value[contact] = (unread.value[contact] || 0) + 1
      changed = true
    }
  })
  if (changed) saveLogs()
}

function parseReply(raw, contact, fallbackTime) {
  let text = '', time = fallbackTime
  const m = raw.match(/内容:\s*([\s\S]*?)\s*时间:\s*([\s\S]*?)\s*<\/\s*手机\s*>/i)
  if (m) { text = m[1].trim(); time = (m[2] || '').trim() || fallbackTime }
  else {
    const c = raw.match(/内容:\s*([\s\S]*?)(?:\n|$)/i)
    text = c ? c[1].trim() : raw.replace(/<\/?手机>/g, '').trim()
  }
  return { text: text || '……', time }
}

function openContact(c) { activeContact.value = c; unread.value[c] = 0; scrollDown() }
function closeContact() { activeContact.value = '' }
function startChat() {
  const n = newContact.value.trim()
  if (!n) return
  if (!logs.value[n]) { logs.value[n] = []; saveLogs() }
  newContact.value = ''
  openContact(n)
}

function scrollDown() {
  nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })
}

async function send() {
  const th = TH()
  const text = draft.value.trim()
  const contact = activeContact.value
  if (!text || !contact || sending.value) return
  if (!th || !th.generateRaw) { appendMsg(contact, { dir: '收到', text: '（未检测到酒馆助手，无法送达）', time: '' }); draft.value = ''; return }
  const time = storyTime()
  appendMsg(contact, { dir: '发出', text, time })
  draft.value = ''
  sending.value = true
  scrollDown()
  try {
    const outBlock = `<手机>\n联系人: ${contact}\n方向: 发出\n内容: ${text}\n时间: ${time}\n</手机>`
    const prompt =
      `<user>刚通过手机给「${contact}」发送了一条消息：「${text}」。\n` +
      `请以「${contact}」的身份，依据其人设、与<user>的关系及当前处境，回复<user>一条手机消息。\n` +
      `只输出一个 <手机> 标签，方向填"收到"，不要输出任何叙事正文。`
    const ordered = [
      { role: 'system', content: prompt },
      'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'chat_history',
      'user_input',
    ]
    const result = await th.generateRaw({
      user_input: `（生成「${contact}」的手机回复，仅输出 <手机> 标签）`,
      should_silence: true,
      max_chat_history: 6,
      ordered_prompts: ordered,
    })
    const raw = typeof result === 'string' ? result : (result && result.content) || ''
    const parsed = parseReply(raw, contact, time)
    const replyBlock = `<手机>\n联系人: ${contact}\n方向: 收到\n内容: ${parsed.text}\n时间: ${parsed.time}\n</手机>`
    // 物理注入：把这轮交流写入聊天楼层，主 AI 后续能读到（消息被接收），同时正文渲染成气泡卡片
    if (th.createChatMessages) {
      try {
        await th.createChatMessages(
          [{ role: 'assistant', message: outBlock + '\n' + replyBlock, data: { is_phone_record: true, phone_contact: contact } }],
          { insert_before: 'end' },
        )
      } catch (e) {}
    }
    appendMsg(contact, { dir: '收到', text: parsed.text, time: parsed.time })
  } catch (e) {
    appendMsg(contact, { dir: '收到', text: '（消息发送失败：' + ((e && e.message) || e) + '）', time: '' })
  } finally {
    sending.value = false
    scrollDown()
  }
}

let timer = null
onMounted(() => {
  clock.value = new Date().toTimeString().slice(0, 5)
  loadLogs()
  syncScrape()
  timer = setInterval(() => {
    clock.value = new Date().toTimeString().slice(0, 5)
    loadLogs()
    syncScrape()
  }, 2000)
  doc.documentElement.style.overflow = 'hidden'
  doc.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  clearInterval(timer)
  doc.documentElement.style.overflow = ''
  doc.body.style.overflow = ''
})
</script>

<style>
@import url('https://fontsapi.zeoseven.com/3/main/result.css');
@import url('https://fontsapi.zeoseven.com/84/main/result.css');
.mp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);animation:mp-fade .25s ease-out;pointer-events:all;font-family:'DouyinSans','PingFang SC','Microsoft YaHei',sans-serif}
@keyframes mp-fade{0%{opacity:0}100%{opacity:1}}
.mp-phone{position:relative;width:88vw;max-width:384px;height:80vh;max-height:760px;background:#0d0d10;border-radius:38px;padding:12px;box-shadow:0 20px 60px rgba(0,0,0,.6),inset 0 0 0 2px rgba(196,168,122,.18),0 0 0 6px rgba(20,18,16,.9);display:flex;flex-direction:column;overflow:hidden;animation:mp-pop .3s cubic-bezier(.2,.9,.3,1.2)}
@keyframes mp-pop{0%{opacity:0;transform:scale(.92) translateY(12px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.mp-notch{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:120px;height:22px;background:#0d0d10;border-radius:0 0 16px 16px;z-index:6}
.mp-power{position:absolute;right:-6px;top:150px;width:4px;height:60px;border:none;background:linear-gradient(180deg,#2a2622,#151311);border-radius:3px;cursor:pointer;z-index:7}
.mp-screen,.mp-home,.mp-app-screen{flex:1;border-radius:28px;overflow:hidden;display:flex;flex-direction:column;position:relative}
.mp-statusbar{display:flex;align-items:center;justify-content:space-between;padding:9px 26px 5px;font-size:12.5px;font-weight:600;color:#e8e2d6;background:transparent;z-index:5}
.mp-sb-time{letter-spacing:.03em}
.mp-sb-icons{display:flex;gap:5px;align-items:center}
.mp-sb-icons svg{width:15px;height:14px;color:#e8e2d6}

/* 主屏 */
.mp-home{background:radial-gradient(120% 80% at 50% 0%,#3a3226 0%,#1a1712 55%,#0f0d0b 100%);align-items:center;padding:0 18px}
.mp-home-clock{margin-top:12vh;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:56px;font-weight:300;color:#f3ecdd;letter-spacing:.02em;text-shadow:0 2px 20px rgba(0,0,0,.4)}
.mp-home-hint{margin-top:2px;font-size:13px;color:rgba(220,205,175,.55);letter-spacing:.35em;padding-left:.35em}
.mp-apps{margin-top:auto;margin-bottom:42px;width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:16px 8px;padding:16px 8px 0}
.mp-app{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0}
.mp-app-dim{opacity:.4;cursor:not-allowed}
.mp-app-ico{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.35);transition:transform .18s}
.mp-app:not(.mp-app-dim):active .mp-app-ico{transform:scale(.9)}
.mp-app-ico svg{width:28px;height:28px;color:#fff}
.ico-msg{background:linear-gradient(160deg,#5bd07a,#07c160)}
.ico-moments{background:linear-gradient(160deg,#ffb75e,#ed8f03)}
.ico-video{background:linear-gradient(160deg,#67c8ff,#2a7fff)}
.ico-set{background:linear-gradient(160deg,#b8b2a6,#7d766a)}
.mp-app-lbl{font-size:11.5px;color:#e8e2d6;letter-spacing:.02em}
.mp-badge{position:absolute;top:-5px;right:8px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#fa5151;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.mp-badge.sm{position:static;margin-top:3px}

/* App 内 */
.mp-app-screen{background:#ededed}
.mp-app-bar{display:flex;align-items:center;gap:8px;padding:6px 14px 10px;background:linear-gradient(180deg,#f6f6f6,#ededed);border-bottom:1px solid rgba(0,0,0,.06);flex-shrink:0}
.mp-back{width:26px;height:26px;background:none;border:none;cursor:pointer;padding:0;color:#2b2b2b;display:flex;align-items:center;justify-content:center}
.mp-back svg{width:20px;height:20px}
.mp-app-name{font-family:'寒蝉全圆体','DouyinSans',serif;font-weight:700;font-size:16px;color:#1a1a1a;letter-spacing:.03em}
.mp-empty{text-align:center;color:#a8a8a8;font-size:13px;padding:40px 16px}

.mp-newchat{display:flex;gap:6px;padding:8px 12px;background:#f3f3f3;border-bottom:1px solid rgba(0,0,0,.05)}
.mp-newchat-in{flex:1;min-width:0;padding:7px 11px;border:1px solid rgba(0,0,0,.1);border-radius:7px;background:#fff;font-size:13px;color:#222;outline:none}
.mp-newchat-in:focus{border-color:#07c160}
.mp-newchat-btn{flex-shrink:0;padding:0 14px;border:none;border-radius:7px;background:#07c160;color:#fff;font-size:13px;font-weight:600;cursor:pointer}

.mp-convo-list{flex:1;overflow-y:auto;background:#fff}
.mp-convo{display:flex;align-items:center;gap:11px;padding:11px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background .15s}
.mp-convo:active{background:#e9e9e9}
.mp-avatar{width:44px;height:44px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#c8a86a,#a8895a);color:#fff;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:19px;font-weight:700}
.mp-convo-mid{flex:1;min-width:0}
.mp-convo-name{font-size:15px;color:#1a1a1a;font-weight:600;letter-spacing:.02em}
.mp-convo-last{font-size:12.5px;color:#999;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.mp-convo-right{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0}
.mp-convo-time{font-size:11px;color:#bbb}

/* 单聊 */
.mp-chat{flex:1;overflow-y:auto;padding:14px 12px;background:#ededed;display:flex;flex-direction:column;gap:12px}
.mp-row{display:flex;max-width:100%}
.mp-row.out{flex-direction:row-reverse}
.mp-bubble{position:relative;max-width:72%;padding:9px 13px;border-radius:8px;font-size:14.5px;line-height:1.5;color:#1a1a1a;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);word-break:break-word;white-space:pre-wrap}
.mp-row.out .mp-bubble{background:#95ec69}
.mp-bubble::before{content:'';position:absolute;top:12px;width:0;height:0;border:6px solid transparent}
.mp-row.in .mp-bubble::before{left:-11px;border-right-color:#fff}
.mp-row.out .mp-bubble::before{right:-11px;border-left-color:#95ec69}
.mp-btime{display:block;margin-top:4px;font-size:10px;color:rgba(0,0,0,.32);text-align:right}
.mp-typing{display:flex;gap:4px;align-items:center;padding:12px 14px}
.mp-typing span{width:6px;height:6px;border-radius:50%;background:#bbb;animation:mp-bounce 1.2s infinite}
.mp-typing span:nth-child(2){animation-delay:.2s}
.mp-typing span:nth-child(3){animation-delay:.4s}
@keyframes mp-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

.mp-input{display:flex;gap:8px;align-items:flex-end;padding:9px 12px;background:#f6f6f6;border-top:1px solid rgba(0,0,0,.07);flex-shrink:0}
.mp-ta{flex:1;min-width:0;max-height:80px;padding:8px 11px;border:1px solid rgba(0,0,0,.1);border-radius:8px;background:#fff;font-size:14px;color:#1a1a1a;resize:none;outline:none;font-family:inherit;line-height:1.4}
.mp-ta:focus{border-color:#07c160}
.mp-send{flex-shrink:0;padding:8px 16px;border:none;border-radius:8px;background:#07c160;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
.mp-send:disabled{opacity:.4;cursor:not-allowed}

.mp-convo-list::-webkit-scrollbar,.mp-chat::-webkit-scrollbar{width:4px}
.mp-convo-list::-webkit-scrollbar-thumb,.mp-chat::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:2px}
</style>
