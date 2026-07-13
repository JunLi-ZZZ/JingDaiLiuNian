<template>
  <div class="mp-overlay" @click.self="$emit('close')">
    <div class="mp-phone" :class="{ 'st-light': view === 'home' }">
      <button class="mp-power" @click="$emit('close')" title="关闭"></button>

      <!-- 灵动岛 -->
      <div class="mp-island"></div>

      <!-- 状态栏 -->
      <div class="mp-status">
        <span class="mp-st-time">{{ clock }}</span>
        <span class="mp-st-ico">
          <svg class="mp-st-sig" viewBox="0 0 640 640"><path fill="currentColor" d="M112 400h56v96h-56zm120-64h56v160h-56zm120-80h56v240h-56zm120-96h56v336h-56z"/></svg>
          <svg class="mp-st-wifi" viewBox="0 0 640 640"><path fill="currentColor" d="M320 160c116 0 221 45 298 118l-52 54c-64-60-151-96-246-96S138 272 74 332l-52-54C99 205 204 160 320 160m0 152c58 0 111 22 150 59l-53 55c-26-24-60-38-97-38s-71 14-97 38l-53-55c39-37 92-59 150-59m0 152c20 0 38 8 51 22l-51 53l-51-53c13-14 31-22 51-22"/></svg>
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
          <button class="mp-app mp-app-dim" disabled><span class="mp-app-ico ico-set"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 208a112 112 0 100 224 112 112 0 000-224m0 64a48 48 0 110 96 48 48 0 010-96"/></svg><svg class="ico-set-gear" viewBox="0 0 640 640"><path fill="currentColor" d="M320 128l24 56 60-16 4 62 58 22-36 50 36 50-58 22-4 62-60-16-24 56-24-56-60 16-4-62-58-22 36-50-36-50 58-22 4-62 60 16z"/></svg></span><span class="mp-app-lbl">设置</span></button>
        </div>
      </div>

      <!-- 微信 -->
      <div v-else class="mp-wx">
        <!-- 单聊视图 -->
        <template v-if="activeContact">
          <div class="mp-wx-nav">
            <button class="mp-nav-back" @click="closeContact"><svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" d="M400 128L208 320l192 192"/></svg><span v-if="totalUnread" class="mp-nav-back-n">{{ totalUnread > 99 ? '99+' : totalUnread }}</span></button>
            <span class="mp-nav-title">{{ activeContact }}</span>
            <span class="mp-nav-more">···</span>
          </div>
          <div ref="scrollEl" class="mp-chat" @click="showEmoji = false">
            <div v-if="!messages.length" class="mp-chat-empty"></div>
            <template v-for="(m, i) in messages" :key="i">
              <div v-if="showSep(i)" class="mp-timesep"><span>{{ m.time }}</span></div>
              <div :class="['mp-row', m.dir === '发出' ? 'out' : 'in']">
                <div class="mp-ava">{{ initial(m.dir === '发出' ? meName : activeContact) }}</div>
                <div :class="['mp-bub', 'mt-' + (m.type || '文字')]">
                  <template v-if="m.type === '语音'"><span class="mp-voice" :style="{ width: voiceWidth(m.text) }"><span class="mp-voice-ico"><i></i><i></i><i></i></span><span class="mp-voice-len">{{ voiceLen(m.text) }}″</span></span><span class="mp-vtext">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '图片'"><span class="mp-media"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M128 128c-35 0-64 29-64 64v256c0 35 29 64 64 64h384c35 0 64-29 64-64V192c0-35-29-64-64-64zm80 80a48 48 0 110 96 48 48 0 010-96m304 240H128l96-128 64 80 80-112z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '视频'"><span class="mp-media mp-video"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128a192 192 0 100 384 192 192 0 000-384m-40 120l112 72-112 72z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '表情'"><img v-if="stickerUrl(m.text)" class="mp-sticker-img" :src="stickerUrl(m.text)" :alt="m.text" /><span v-else class="mp-sticker">{{ stickerFallback(m.text) }}</span></template>
                  <template v-else><span v-html="renderText(m.text)"></span></template>
                </div>
              </div>
            </template>
            <div v-if="sending" class="mp-row in"><div class="mp-ava">{{ initial(activeContact) }}</div><div class="mp-bub mp-typing"><span></span><span></span><span></span></div></div>
          </div>
          <div class="mp-inbar">
            <button class="mp-in-ico" @click="voiceMode = !voiceMode" title="语音">
              <svg v-if="!voiceMode" viewBox="0 0 640 640"><path fill="currentColor" d="M320 96c-40 0-72 32-72 72v144c0 40 32 72 72 72s72-32 72-72V168c0-40-32-72-72-72"/><path fill="none" stroke="currentColor" stroke-width="36" stroke-linecap="round" d="M176 300c0 80 64 144 144 144s144-64 144-144M320 444v56"/></svg>
              <svg v-else viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" d="M160 224h320v192H160zM224 160h192"/></svg>
            </button>
            <button v-if="voiceMode" class="mp-in-voicebtn">按住 说话</button>
            <textarea v-else v-model="draft" class="mp-ta" rows="1" @focus="showEmoji = false" @keydown.enter.exact.prevent="send"></textarea>
            <button class="mp-in-ico" @click="toggleEmoji" title="表情">
              <svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="36" d="M320 96a224 224 0 100 448 224 224 0 000-448"/><circle cx="240" cy="272" r="26" fill="currentColor"/><circle cx="400" cy="272" r="26" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="34" stroke-linecap="round" d="M232 384c22 26 54 42 88 42s66-16 88-42"/></svg>
            </button>
            <button v-if="!draft.trim()" class="mp-in-ico" title="更多">
              <svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="36" stroke-linecap="round" d="M320 200v240M200 320h240"/><circle cx="320" cy="320" r="212" fill="none" stroke="currentColor" stroke-width="36"/></svg>
            </button>
            <button v-else class="mp-send" :disabled="sending" @click="send">发送</button>
          </div>
          <!-- 表情面板 -->
          <div v-if="showEmoji" class="mp-emoji">
            <div class="mp-emoji-body">
              <div v-if="emojiTab === 'emoji'" class="mp-emoji-grid">
                <button v-for="(e, i) in sysEmoji" :key="i" class="mp-emoji-cell" @click="insertEmoji(e)">{{ e }}</button>
              </div>
              <div v-else-if="emojiTab === 'kaomoji'" class="mp-emoji-kao">
                <button v-for="(k, i) in kaomoji" :key="i" class="mp-kao-cell" @click="insertEmoji(k)">{{ k }}</button>
              </div>
              <div v-else class="mp-emoji-sticker-empty">贴纸即将上线</div>
            </div>
            <div class="mp-emoji-bar">
              <div class="mp-emoji-tabs">
                <button :class="['mp-etab', { on: emojiTab === 'emoji' }]" @click="emojiTab = 'emoji'">😀</button>
                <button :class="['mp-etab', { on: emojiTab === 'kaomoji' }]" @click="emojiTab = 'kaomoji'">颜</button>
                <button :class="['mp-etab', { on: emojiTab === 'sticker' }]" @click="emojiTab = 'sticker'"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M160 96h320c35 0 64 29 64 64v320c0 35-29 64-64 64H160c-35 0-64-29-64-64V160c0-35 29-64 64-64m40 96a32 32 0 100 64 32 32 0 000-64m240 208L360 296l-64 72-40-40-72 96h288z"/></svg></button>
              </div>
              <button class="mp-ebksp" @click="backspaceEmoji"><svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="34" stroke-linejoin="round" d="M224 160h288v320H224L96 320zM296 264l112 112M408 264L296 376"/></svg></button>
            </div>
          </div>
        </template>

        <!-- tab 内容 -->
        <template v-else>
          <div class="mp-wx-head">
            <span class="mp-wx-title">{{ tabTitle }}</span>
            <span class="mp-wx-acts"><span class="mp-wx-act">⌕</span><span v-if="wxTab==='chats'||wxTab==='contacts'" class="mp-wx-act">+</span></span>
          </div>
          <div class="mp-wx-body">
            <!-- 聊天 -->
            <template v-if="wxTab === 'chats'">
              <div class="mp-search"><span class="mp-search-in"><svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="44" d="M288 128a160 160 0 100 320 160 160 0 000-320M416 416l96 96"/></svg>搜索</span></div>
              <div class="mp-newchat">
                <input v-model="newContact" class="mp-nc-in" placeholder="输入联系人名开始对话" @keydown.enter="startChat" />
                <button class="mp-nc-btn" @click="startChat">发起</button>
              </div>
              <div v-if="!contacts.length" class="mp-hint">还没有对话</div>
              <div v-for="c in contacts" :key="c" class="mp-cell" @click="openContact(c)">
                <div class="mp-ava lg">{{ initial(c) }}<span v-if="unread[c]" class="mp-badge sm">{{ unread[c] > 99 ? '99+' : unread[c] }}</span></div>
                <div class="mp-cell-mid"><div class="mp-cell-nm">{{ c }}</div><div class="mp-cell-sub">{{ lastPreview(c) }}</div></div>
                <div class="mp-cell-rt"><div class="mp-cell-tm">{{ lastTime(c) }}</div></div>
              </div>
            </template>
            <!-- 通讯录 -->
            <template v-else-if="wxTab === 'contacts'">
              <div class="mp-search"><span class="mp-search-in"><svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="44" d="M288 128a160 160 0 100 320 160 160 0 000-320M416 416l96 96"/></svg>搜索</span></div>
              <div class="mp-cx-special">
                <div class="mp-cx-row"><span class="mp-cx-ico" style="background:#fa9d3b">👥</span><span class="mp-cx-lbl">新的朋友</span></div>
                <div class="mp-cx-row"><span class="mp-cx-ico" style="background:#3ab449">💬</span><span class="mp-cx-lbl">群聊</span></div>
                <div class="mp-cx-row"><span class="mp-cx-ico" style="background:#3b7cff">🏷</span><span class="mp-cx-lbl">标签</span></div>
                <div class="mp-cx-row"><span class="mp-cx-ico" style="background:#3b7cff">📣</span><span class="mp-cx-lbl">公众号</span></div>
              </div>
              <div v-if="contacts.length" class="mp-cx-idx">联系人</div>
              <div v-for="c in contacts" :key="c" class="mp-cx-item" @click="openContact(c)">
                <div class="mp-ava sm2">{{ initial(c) }}</div><div class="mp-cx-name">{{ c }}</div>
              </div>
              <div class="mp-cx-count">{{ contacts.length }} 位联系人</div>
            </template>
            <!-- 发现 -->
            <template v-else-if="wxTab === 'discover'">
              <template v-if="discoverView === 'moments'">
                <div class="mp-mm-head"><button class="mp-mm-back" @click="discoverView = 'list'">‹ 发现</button><span>朋友圈</span></div>
                <div class="mp-hint" style="margin-top:60px">朋友圈内容即将上线</div>
              </template>
              <template v-else>
                <div class="mp-disc-group">
                  <div class="mp-disc-row" @click="discoverView = 'moments'"><span class="mp-disc-ico" style="background:linear-gradient(135deg,#3b7cff,#2b5bd0)">📷</span><span class="mp-disc-lbl">朋友圈</span><span class="mp-disc-arrow">›</span></div>
                </div>
                <div class="mp-disc-group">
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f0483e">▶</span><span class="mp-disc-lbl">视频号</span><span class="mp-disc-arrow">›</span></div>
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f5813a">🎬</span><span class="mp-disc-lbl">直播</span><span class="mp-disc-arrow">›</span></div>
                </div>
                <div class="mp-disc-group">
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#2f9cf4">⊹</span><span class="mp-disc-lbl">扫一扫</span><span class="mp-disc-arrow">›</span></div>
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#2f9cf4">♪</span><span class="mp-disc-lbl">摇一摇</span><span class="mp-disc-arrow">›</span></div>
                </div>
                <div class="mp-disc-group">
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f5813a">👀</span><span class="mp-disc-lbl">看一看</span><span class="mp-disc-arrow">›</span></div>
                  <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f0483e">🔍</span><span class="mp-disc-lbl">搜一搜</span><span class="mp-disc-arrow">›</span></div>
                </div>
              </template>
            </template>
            <!-- 我 -->
            <template v-else>
              <div class="mp-me-card">
                <div class="mp-ava xl">{{ initial(meName) }}</div>
                <div class="mp-me-info"><div class="mp-me-nm">{{ meName }}</div><div class="mp-me-id">微信号：{{ meId }}</div></div>
                <span class="mp-me-qr">▤ ›</span>
              </div>
              <div class="mp-disc-group">
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#3b7cff">＋</span><span class="mp-disc-lbl">服务</span><span class="mp-disc-arrow">›</span></div>
              </div>
              <div class="mp-disc-group">
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#3b7cff">★</span><span class="mp-disc-lbl">收藏</span><span class="mp-disc-arrow">›</span></div>
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#3ab449">🖼</span><span class="mp-disc-lbl">朋友圈</span><span class="mp-disc-arrow">›</span></div>
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f5813a">🎴</span><span class="mp-disc-lbl">卡包</span><span class="mp-disc-arrow">›</span></div>
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#f5b53a">😊</span><span class="mp-disc-lbl">表情</span><span class="mp-disc-arrow">›</span></div>
              </div>
              <div class="mp-disc-group">
                <div class="mp-disc-row dim"><span class="mp-disc-ico" style="background:#3b7cff">⚙</span><span class="mp-disc-lbl">设置</span><span class="mp-disc-arrow">›</span></div>
              </div>
            </template>
          </div>
          <!-- 底部 tab 栏 -->
          <div class="mp-tabbar">
            <button v-for="t in tabs" :key="t.k" :class="['mp-tab', { on: wxTab === t.k }]" @click="wxTab = t.k; discoverView = 'list'">
              <span class="mp-tab-ico" v-html="wxTab === t.k ? t.icoOn : t.ico"></span><span class="mp-tab-lbl">{{ t.l }}</span>
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
const discoverView = ref('list')
const activeContact = ref('')
const draft = ref('')
const newContact = ref('')
const sending = ref(false)
const clock = ref('')
const dateLabel = ref('')
const scrollEl = ref(null)
const showEmoji = ref(false)
const emojiTab = ref('emoji')
const voiceMode = ref(false)

const doc = window.parent ? window.parent.document : document
function TH() { return window.parent && window.parent.TavernHelper }

const meName = computed(() => {
  try {
    const ctx = window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext()
    return (ctx && ctx.name1) || '我'
  } catch (e) { return '我' }
})
const meId = computed(() => {
  const n = meName.value
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return 'wxid_' + h.toString(36).slice(0, 8)
})

// 表情贴纸脚手架：名称→URL（暂空，等真图接入）；内联 [表情:名称] token
const STICKERS = {}
function stickerUrl(text) {
  const name = ((String(text).match(/\[表情[：:]\s*(.*?)\]/) || [])[1] || '').replace(/\s+/g, '')
  return (name && STICKERS[name]) || ''
}
function stickerFallback(text) {
  const name = (String(text).match(/\[表情[：:]\s*(.*?)\]/) || [])[1]
  return name ? '[' + name.trim() + ']' : text
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
function renderText(text) {
  return escapeHtml(text).replace(/\[表情[：:]\s*(.*?)\]/g, (m, name) => {
    const url = STICKERS[name.replace(/\s+/g, '')]
    return url ? `<img class="mp-inline-emo" src="${url}" alt="${escapeHtml(name)}">` : escapeHtml(m)
  })
}

const sysEmoji = ['😀','😁','😂','🤣','😊','😍','😘','😗','😙','😜','🤪','🤔','😐','😴','😷','🥺','😭','😅','😆','😳','😡','😱','🥰','😎','👍','👎','👌','🙏','👏','💪','🤝','🙌','👋','❤️','💔','💕','💖','🎉','🌹','🌙','⭐','🔥','☕','🍜','🍔','🎂','🥂','💰','📱','✨']
const kaomoji = ['(๑•̀ㅂ•́)و✧','(≧▽≦)','(╯°□°）╯','(´;ω;｀)','( •̀ ω •́ )✧','(๑>◡<๑)','(・∀・)','(¬‿¬)','(＾▽＾)','(T_T)','(=^･ω･^=)','ㄟ( ▔, ▔ )ㄏ','(づ｡◕‿‿◕｡)づ','( ˘ ³˘)♥','٩(๑•́₃•̀๑)۶','(⁄ ⁄•⁄ω⁄•⁄ ⁄)','(*/ω＼*)','o(*￣▽￣*)ブ']

const tabs = [
  { k: 'chats', l: '微信',
    ico: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" d="M256 136C150 136 72 204 72 288c0 46 24 87 63 115l-14 50 57-31c24 8 50 12 78 12 106 0 184-68 184-146S362 136 256 136Z"/></svg>',
    icoOn: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M256 128C150 128 64 200 64 288c0 48 26 91 67 120l-14 52 61-33c22 6 45 9 69 9 106 0 192-72 192-160S362 128 256 128"/></svg>' },
  { k: 'contacts', l: '通讯录',
    ico: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" d="M320 320a104 104 0 100-208 104 104 0 000 208m0 32c-88 0-200 44-200 132v28h400v-28c0-88-112-132-200-132"/></svg>',
    icoOn: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 320a112 112 0 100-224 112 112 0 000 224m0 48c-97 0-224 49-224 146v46h448v-46c0-97-127-146-224-146"/></svg>' },
  { k: 'discover', l: '发现',
    ico: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" d="M320 96a224 224 0 100 448 224 224 0 000-448"/><path fill="none" stroke="currentColor" stroke-width="34" stroke-linejoin="round" d="M420 220l-56 144-144 56 56-144z"/></svg>',
    icoOn: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" d="M320 96a224 224 0 100 448 224 224 0 000-448"/><path fill="currentColor" d="M420 220l-56 144-144 56 56-144z"/></svg>' },
  { k: 'me', l: '我',
    ico: '<svg viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" d="M320 320a104 104 0 100-208 104 104 0 000 208m0 32c-88 0-200 44-200 132v28h400v-28c0-88-112-132-200-132"/></svg>',
    icoOn: '<svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 320a112 112 0 100-224 112 112 0 000 224m0 48c-97 0-224 49-224 146v46h448v-46c0-97-127-146-224-146"/></svg>' },
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
  return pfx + (m.type === '表情' ? stickerFallback(m.text) : m.text)
}
function voiceLen(t) { return Math.min(60, Math.max(1, Math.round((t || '').length / 3))) }
function voiceWidth(t) { return Math.min(160, 56 + voiceLen(t) * 3) + 'px' }
function showSep(i) {
  const arr = messages.value
  if (!i) return !!(arr[0] && arr[0].time)
  return arr[i] && arr[i].time && arr[i].time !== arr[i - 1].time
}

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

function openWeChat() { view.value = 'wechat'; wxTab.value = 'chats'; activeContact.value = ''; discoverView.value = 'list' }
function goHome() { if (activeContact.value) closeContact(); else view.value = 'home' }
function openContact(c) { activeContact.value = c; unread.value[c] = 0; showEmoji.value = false; scrollDown() }
function closeContact() { activeContact.value = ''; showEmoji.value = false; voiceMode.value = false }
function startChat() { const n = newContact.value.trim(); if (!n) return; if (!logs.value[n]) { logs.value[n] = []; saveLogs() } newContact.value = ''; openContact(n) }
function scrollDown() { nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight }) }

function toggleEmoji() { showEmoji.value = !showEmoji.value; if (showEmoji.value) { voiceMode.value = false; scrollDown() } }
function insertEmoji(ch) { draft.value += ch }
function backspaceEmoji() { draft.value = Array.from(draft.value).slice(0, -1).join('') }

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
.mp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);animation:mp-fade .25s ease-out;pointer-events:all;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
@keyframes mp-fade{0%{opacity:0}100%{opacity:1}}
.mp-phone{position:relative;width:min(90vw,392px);height:min(92vh,844px);aspect-ratio:392/844;background:#000;border-radius:52px;padding:11px 10px 9px;box-shadow:0 30px 80px rgba(0,0,0,.65),0 6px 18px rgba(0,0,0,.4),inset 0 0 0 2px rgba(120,120,130,.35);display:flex;flex-direction:column;overflow:hidden;animation:mp-pop .32s cubic-bezier(.2,.9,.3,1.2)}
@keyframes mp-pop{0%{opacity:0;transform:scale(.93) translateY(14px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.mp-power{position:absolute;right:-3px;top:180px;width:3px;height:74px;border:none;background:linear-gradient(180deg,#3a3a40,#141416);border-radius:3px;cursor:pointer;z-index:9}
.mp-phone > *:not(.mp-power):not(.mp-island){position:relative;z-index:2}
.mp-island{position:absolute;left:50%;top:20px;transform:translateX(-50%);width:112px;height:30px;background:#000;border-radius:16px;z-index:8}

/* 状态栏 */
.mp-status{display:flex;align-items:center;justify-content:space-between;padding:8px 34px 6px;font-size:14px;font-weight:600;color:#111;flex-shrink:0}
.st-light .mp-status{color:#fff}
.mp-st-time{letter-spacing:.02em;font-variant-numeric:tabular-nums}
.mp-st-ico{display:flex;align-items:center;gap:6px}
.mp-st-sig{width:17px;height:12px}.mp-st-wifi{width:16px;height:13px}
.mp-st-bat{width:24px;height:12px;border:1.4px solid currentColor;border-radius:3px;position:relative;opacity:.85}
.mp-st-bat::after{content:'';position:absolute;inset:1.5px;right:6px;background:currentColor;border-radius:1px}
.mp-st-bat::before{content:'';position:absolute;right:-3px;top:3.5px;width:2px;height:4px;background:currentColor;border-radius:0 1px 1px 0}

/* 主屏 */
.mp-home{flex:1;display:flex;flex-direction:column;align-items:center;border-radius:42px;background:radial-gradient(130% 90% at 50% 0%,#4a5b7d 0%,#2c3b54 45%,#161d2b 100%)}
.mp-home-clock{margin-top:13%;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:64px;font-weight:300;color:#fff;letter-spacing:.02em;text-shadow:0 2px 24px rgba(0,0,0,.4)}
.mp-home-date{font-size:15px;color:rgba(255,255,255,.78);margin-top:-6px;text-shadow:0 1px 8px rgba(0,0,0,.3)}
.mp-apps{margin-top:auto;margin-bottom:8%;display:grid;grid-template-columns:repeat(4,1fr);gap:20px 6px;width:100%;padding:0 20px}
.mp-app{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;background:none;border:none;cursor:pointer;padding:0}
.mp-app-dim{opacity:.5;cursor:default}
.mp-app-ico{position:relative;width:56px;height:56px;border-radius:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 14px rgba(0,0,0,.35)}
.mp-app:not(.mp-app-dim):active .mp-app-ico{transform:scale(.92)}
.mp-app-ico svg{width:32px;height:32px;color:#fff}
.ico-set-gear{position:absolute;width:32px;height:32px;color:#fff;opacity:.9}
.ico-wx{background:linear-gradient(160deg,#4ade80,#07c160)}
.ico-cam{background:linear-gradient(160deg,#9ca3af,#4b5563)}
.ico-note{background:linear-gradient(160deg,#fcd34d,#f59e0b)}
.ico-set{background:linear-gradient(160deg,#a8a29e,#57534e)}
.mp-app-lbl{font-size:12px;color:#fff;text-shadow:0 0 8px rgba(255,255,255,.5),0 1px 3px rgba(0,0,0,.5)}
.mp-badge{position:absolute;top:-5px;right:4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#fa5151;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.3);border:1.5px solid #161d2b}
.mp-badge.sm{position:absolute;top:-5px;right:-5px;border-color:#fff}
.mp-badge.tb{top:1px;right:22%;border-color:#f7f7f7}

/* 微信 */
.mp-wx{flex:1;display:flex;flex-direction:column;border-radius:0 0 42px 42px;background:#ededed;overflow:hidden;min-height:0}
.mp-wx-head{display:flex;align-items:center;justify-content:center;position:relative;padding:6px 16px 12px;background:#ededed}
.mp-wx-title{font-size:17px;font-weight:600;color:#0d0d0d;letter-spacing:.3px}
.mp-wx-acts{position:absolute;right:16px;top:2px;display:flex;gap:14px}
.mp-wx-act{font-size:21px;color:#0d0d0d;font-weight:300;line-height:1}
.mp-wx-body{flex:1;overflow-y:auto;background:#ededed;-webkit-overflow-scrolling:touch}
.mp-hint{text-align:center;color:#9a9a9a;font-size:13px;padding:36px 16px}
.mp-search{padding:8px 12px;background:#ededed}
.mp-search-in{display:flex;align-items:center;justify-content:center;gap:5px;height:32px;background:#fff;border-radius:6px;color:#9a9a9a;font-size:13.5px}
.mp-search-in svg{width:15px;height:15px}
.mp-newchat{display:flex;gap:6px;padding:6px 12px 8px;background:#ededed}
.mp-nc-in{flex:1;min-width:0;padding:8px 11px;border:none;border-radius:7px;background:#fff;font-size:13px;color:#222;outline:none}
.mp-nc-btn{flex-shrink:0;padding:0 14px;border:none;border-radius:7px;background:#07c160;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.mp-cell{display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fff;cursor:pointer;position:relative}
.mp-cell::after{content:'';position:absolute;left:66px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-cell:active{background:#e6e6e6}
.mp-ava{position:relative;width:38px;height:38px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7aa7d6,#5a86b8);color:#fff;font-weight:500;font-size:17px}
.mp-ava.lg{width:46px;height:46px;font-size:21px;border-radius:6px}
.mp-ava.sm2{width:38px;height:38px;font-size:17px}
.mp-ava.xl{width:62px;height:62px;font-size:28px;border-radius:8px}
.mp-cell-mid{flex:1;min-width:0}
.mp-cell-nm{font-size:16px;color:#0d0d0d;font-weight:400}
.mp-cell-sub{font-size:13px;color:#9a9a9a;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px}
.mp-cell-rt{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;align-self:flex-start;padding-top:4px}
.mp-cell-tm{font-size:11.5px;color:#b2b2b2}

/* 通讯录 */
.mp-cx-special{background:#fff}
.mp-cx-row{display:flex;align-items:center;gap:12px;padding:9px 14px;cursor:default;position:relative}
.mp-cx-row::after{content:'';position:absolute;left:52px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-cx-ico{width:38px;height:38px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
.mp-cx-lbl{font-size:15.5px;color:#0d0d0d}
.mp-cx-idx{padding:4px 14px;font-size:12px;color:#9a9a9a;background:#ededed}
.mp-cx-item{display:flex;align-items:center;gap:12px;padding:8px 14px;background:#fff;cursor:pointer;position:relative}
.mp-cx-item::after{content:'';position:absolute;left:64px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-cx-item:active{background:#e6e6e6}
.mp-cx-name{font-size:15.5px;color:#0d0d0d}
.mp-cx-count{text-align:center;color:#9a9a9a;font-size:13px;padding:16px}

/* 发现 / 我 列表 */
.mp-disc-group{margin-top:8px;background:#fff}
.mp-disc-row{display:flex;align-items:center;gap:13px;padding:11px 14px;cursor:pointer;position:relative}
.mp-disc-row::after{content:'';position:absolute;left:53px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-disc-row:last-child::after{display:none}
.mp-disc-row:active{background:#e6e6e6}
.mp-disc-row.dim{cursor:default}
.mp-disc-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;flex-shrink:0}
.mp-disc-lbl{flex:1;font-size:15.5px;color:#0d0d0d}
.mp-disc-arrow{color:#c8c8c8;font-size:17px}
.mp-me-card{display:flex;align-items:center;gap:14px;padding:26px 16px 22px;background:#fff;margin-top:8px}
.mp-me-info{flex:1;min-width:0}
.mp-me-nm{font-size:20px;font-weight:500;color:#0d0d0d}
.mp-me-id{font-size:13px;color:#9a9a9a;margin-top:8px}
.mp-me-qr{color:#c8c8c8;font-size:13px;white-space:nowrap}
.mp-mm-head{display:flex;align-items:center;justify-content:center;position:relative;padding:8px 14px;background:#ededed;font-size:16px;font-weight:600;color:#0d0d0d}
.mp-mm-back{position:absolute;left:10px;background:none;border:none;color:#0d0d0d;font-size:14px;cursor:pointer}

/* 单聊 */
.mp-wx-nav{display:flex;align-items:center;gap:8px;padding:6px 12px 10px;background:#ededed;flex-shrink:0}
.mp-nav-back{position:relative;width:26px;height:26px;background:none;border:none;cursor:pointer;padding:0;color:#0d0d0d;flex-shrink:0}
.mp-nav-back svg{width:22px;height:22px}
.mp-nav-back-n{position:absolute;left:14px;top:-3px;min-width:15px;height:15px;padding:0 4px;border-radius:8px;background:#fa5151;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center}
.mp-nav-title{flex:1;text-align:center;font-size:16.5px;font-weight:600;color:#0d0d0d;margin-left:-26px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-nav-more{color:#0d0d0d;font-weight:700;letter-spacing:1px}
.mp-chat{flex:1;overflow-y:auto;padding:12px 12px 14px;background:#ededed;display:flex;flex-direction:column;min-height:0;-webkit-overflow-scrolling:touch}
.mp-chat-empty{flex:1}
.mp-timesep{text-align:center;margin:8px 0 10px}
.mp-timesep span{font-size:11.5px;color:#fff;background:rgba(0,0,0,.15);padding:2px 7px;border-radius:4px}
.mp-row{display:flex;gap:9px;align-items:flex-start;max-width:100%;margin-bottom:14px}
.mp-row.out{flex-direction:row-reverse}
.mp-row .mp-ava{width:38px;height:38px;font-size:17px;border-radius:5px}
.mp-row.out .mp-ava{background:linear-gradient(135deg,#5bd07a,#07c160)}
.mp-bub{position:relative;max-width:64%;padding:9px 12px;border-radius:5px;font-size:15px;line-height:1.45;color:#0d0d0d;background:#fff;word-break:break-word;white-space:pre-wrap}
.mp-row.out .mp-bub{background:#95ec69}
.mp-bub::before{content:'';position:absolute;top:12px;width:0;height:0;border:5px solid transparent}
.mp-row.in .mp-bub::before{left:-9px;border-right-color:#fff}
.mp-row.out .mp-bub::before{right:-9px;border-left-color:#95ec69}
.mp-inline-emo{width:20px;height:20px;vertical-align:-4px;margin:0 1px}
.mp-bub.mt-语音{display:flex;flex-direction:column;gap:6px}
.mp-voice{display:flex;align-items:center;gap:8px;min-width:56px}
.mp-row.out .mp-voice{flex-direction:row-reverse}
.mp-voice-ico{display:flex;align-items:flex-end;gap:2px;height:15px}
.mp-voice-ico i{width:2.5px;background:#4a4a4a;border-radius:2px}
.mp-voice-ico i:nth-child(1){height:6px}.mp-voice-ico i:nth-child(2){height:11px}.mp-voice-ico i:nth-child(3){height:15px}
.mp-voice-len{font-size:13px;color:#4a4a4a}
.mp-vtext{font-size:12.5px;color:#666;border-top:1px solid rgba(0,0,0,.06);padding-top:5px}
.mp-media{display:flex;align-items:center;justify-content:center;width:150px;height:104px;background:linear-gradient(135deg,#d8d8d8,#c4c4c4);border-radius:4px;margin-bottom:5px}
.mp-media svg{width:40px;height:40px;color:#fff}
.mp-video{background:linear-gradient(135deg,#4b5563,#1f2937)}
.mp-cap{display:block;font-size:13px;color:#555}
.mp-bub.mt-图片,.mp-bub.mt-视频{padding:6px}
.mp-sticker{font-size:15px;line-height:1.4;color:#576b95}
.mp-sticker-img{max-width:110px;max-height:110px;display:block}
.mp-bub.mt-表情{background:transparent!important;padding:2px}
.mp-bub.mt-表情::before{display:none}
.mp-typing{display:flex;gap:4px;align-items:center;padding:13px 15px;min-width:auto}
.mp-typing span{width:6px;height:6px;border-radius:50%;background:#bbb;animation:mp-bnc 1.2s infinite}
.mp-typing span:nth-child(2){animation-delay:.2s}.mp-typing span:nth-child(3){animation-delay:.4s}
@keyframes mp-bnc{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

/* 输入栏 */
.mp-inbar{display:flex;gap:8px;align-items:center;padding:7px 10px 15px;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.06);flex-shrink:0}
.mp-in-ico{flex-shrink:0;width:30px;height:30px;padding:0;background:none;border:none;cursor:pointer;color:#5a5a5a;display:flex;align-items:center;justify-content:center}
.mp-in-ico svg{width:27px;height:27px}
.mp-ta{flex:1;min-width:0;max-height:80px;padding:7px 10px;border:none;border-radius:5px;background:#fff;font-size:15px;color:#0d0d0d;resize:none;outline:none;font-family:inherit;line-height:1.4}
.mp-in-voicebtn{flex:1;min-width:0;height:34px;border:none;border-radius:5px;background:#fff;font-size:15px;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-in-voicebtn:active{background:#e0e0e0}
.mp-send{flex-shrink:0;padding:7px 15px;border:none;border-radius:5px;background:#07c160;color:#fff;font-size:14.5px;font-weight:500;cursor:pointer}
.mp-send:disabled{opacity:.4;cursor:default}

/* 表情面板 */
.mp-emoji{flex-shrink:0;height:220px;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.06);display:flex;flex-direction:column;animation:mp-slideup .22s ease-out}
@keyframes mp-slideup{0%{transform:translateY(100%)}100%{transform:translateY(0)}}
.mp-emoji-body{flex:1;overflow-y:auto;padding:10px}
.mp-emoji-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}
.mp-emoji-cell{background:none;border:none;cursor:pointer;font-size:24px;padding:5px 0;border-radius:6px}
.mp-emoji-cell:active{background:#e0e0e0}
.mp-emoji-kao{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mp-kao-cell{background:#fff;border:none;cursor:pointer;font-size:13px;padding:9px 4px;border-radius:6px;color:#333}
.mp-kao-cell:active{background:#e0e0e0}
.mp-emoji-sticker-empty{text-align:center;color:#9a9a9a;font-size:13px;padding:70px 0}
.mp-emoji-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 10px 15px;background:#ededed;border-top:1px solid rgba(0,0,0,.05)}
.mp-emoji-tabs{display:flex;gap:6px}
.mp-etab{width:36px;height:30px;border:none;background:#fff;border-radius:6px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;color:#333}
.mp-etab svg{width:19px;height:19px}
.mp-etab.on{background:#d6d6d6}
.mp-ebksp{width:44px;height:30px;border:none;background:#fff;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333}
.mp-ebksp svg{width:22px;height:22px}

/* tab 栏 */
.mp-tabbar{display:flex;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.08);flex-shrink:0;padding-bottom:12px}
.mp-tab{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0 4px;background:none;border:none;cursor:pointer;color:#7a7a7a}
.mp-tab.on{color:#07c160}
.mp-tab-ico{width:26px;height:26px}
.mp-tab-ico svg{width:26px;height:26px}
.mp-tab-lbl{font-size:10.5px}

.mp-homebar{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);height:5px;width:36%;background:rgba(0,0,0,.32);border-radius:3px;cursor:pointer;z-index:6}
.st-light .mp-homebar{background:rgba(255,255,255,.72)}
.mp-wx-body::-webkit-scrollbar,.mp-chat::-webkit-scrollbar,.mp-emoji-body::-webkit-scrollbar{width:0}
</style>
