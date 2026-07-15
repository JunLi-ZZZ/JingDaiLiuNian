<template>
  <Teleport :to="tpTarget" :disabled="!tpTarget">
  <div class="mp-overlay" :style="overlayStyle" @click.self="$emit('close')">
    <div ref="phoneEl" class="mp-phone" :class="{ 'st-light': view === 'home' }" :style="phoneStyle">
      <button class="mp-power" @click="$emit('close')" title="关闭"></button>

      <!-- 灵动岛 -->
      <div class="mp-island"></div>

      <div class="mp-screen">
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
            <span class="mp-app-ico ico-wx"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.575 13.711a.91.91 0 0 0 .898-.898a.895.895 0 0 0-.898-.898a.894.894 0 0 0-.898.898c0 .5.4.898.898.898m-4.425 0a.91.91 0 0 0 .898-.898c0-.498-.4-.898-.898-.898a.894.894 0 0 0-.898.898c0 .5.399.898.898.898m6.567 5.04a.35.35 0 0 0-.172.37c0 .048 0 .098.025.147c.098.417.294 1.081.294 1.106c0 .073.025.122.025.172a.22.22 0 0 1-.221.22c-.05 0-.074-.024-.123-.048l-1.449-.836a.8.8 0 0 0-.344-.098c-.073 0-.147 0-.196.024c-.688.197-1.4.295-2.161.295c-3.66 0-6.607-2.457-6.607-5.505s2.947-5.505 6.607-5.505c3.659 0 6.606 2.458 6.606 5.505c0 1.647-.884 3.146-2.284 4.154M16.674 8.099a9 9 0 0 0-.28-.005c-4.174 0-7.606 2.86-7.606 6.505c0 .554.08 1.09.228 1.6h-.089a10 10 0 0 1-2.584-.368c-.074-.025-.148-.025-.222-.025a.83.83 0 0 0-.419.123l-1.747 1.005a.35.35 0 0 1-.148.05a.273.273 0 0 1-.27-.27c0-.074.024-.123.049-.197c.024-.024.246-.834.369-1.324c0-.05.024-.123.024-.172a.56.56 0 0 0-.221-.441C2.059 13.376 1 11.586 1 9.599C1.001 5.944 4.571 3 8.951 3c3.765 0 6.93 2.169 7.723 5.098m-5.154.418c.573 0 1.026-.477 1.026-1.026c0-.573-.453-1.026-1.026-1.026s-1.026.453-1.026 1.026s.453 1.026 1.026 1.026m-5.26 0c.573 0 1.027-.477 1.027-1.026c0-.573-.454-1.026-1.027-1.026c-.572 0-1.026.453-1.026 1.026s.454 1.026 1.026 1.026"/></svg></span>
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
            <button class="mp-nav-back" @click="closeContact"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg><span v-if="totalUnread" class="mp-nav-back-n">{{ totalUnread > 99 ? '99+' : totalUnread }}</span></button>
            <span class="mp-nav-title">{{ displayName(activeContact) }}</span>
            <span class="mp-nav-more" @click="openProfile(activeContact)">···</span>
          </div>
          <div ref="scrollEl" class="mp-chat" @click="showEmoji = false">
            <div v-if="!messages.length" class="mp-chat-empty"></div>
            <template v-for="(m, i) in messages" :key="i">
              <div v-if="showSep(i)" class="mp-timesep"><span>{{ fmtTime(m.time) }}</span></div>
              <div :class="['mp-row', m.dir === '发出' ? 'out' : 'in']">
                <div class="mp-ava">{{ initial(m.dir === '发出' ? curOwner : activeContact) }}</div>
                <div :class="['mp-bub', 'mt-' + (m.type || '文字')]">
                  <template v-if="m.type === '语音'"><span class="mp-voice" :style="{ width: voiceWidth(m.text) }"><span class="mp-voice-ico"><i></i><i></i><i></i></span><span class="mp-voice-len">{{ voiceLen(m.text) }}″</span></span><span class="mp-vtext">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '图片'"><span class="mp-media"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M128 128c-35 0-64 29-64 64v256c0 35 29 64 64 64h384c35 0 64-29 64-64V192c0-35-29-64-64-64zm80 80a48 48 0 110 96 48 48 0 010-96m304 240H128l96-128 64 80 80-112z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '视频'"><span class="mp-media mp-video"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128a192 192 0 100 384 192 192 0 000-384m-40 120l112 72-112 72z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '红包'"><span class="mp-rp-top"><span class="mp-rp-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 2v5h12V4zm6 9a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2"/></svg></span><span class="mp-rp-txt">{{ m.text || '恭喜发财，大吉大利' }}</span></span><span class="mp-rp-tag">微信红包</span></template>
                  <template v-else-if="m.type === '表情'"><img v-if="stickerUrl(m.text)" class="mp-sticker-img" :src="stickerUrl(m.text)" :alt="m.text" /><span v-else class="mp-sticker">{{ stickerFallback(m.text) }}</span></template>
                  <template v-else><span v-html="renderText(m.text)"></span></template>
                </div>
              </div>
            </template>
            <div v-if="sendingContact === activeContact" class="mp-row in"><div class="mp-ava">{{ initial(activeContact) }}</div><div class="mp-bub mp-typing"><span></span><span></span><span></span></div></div>
          </div>
          <div v-if="sendError" class="mp-toast">{{ sendError }}</div>
          <div class="mp-inbar">
            <button class="mp-in-ico" @click="voiceMode = !voiceMode" title="语音">
              <svg v-if="!voiceMode" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a3 3 0 0 0-3 3v4a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3m0-2a5 5 0 0 1 5 5v4a5 5 0 0 1-10 0V6a5 5 0 0 1 5-5M3.055 11H5.07a7.002 7.002 0 0 0 13.858 0h2.016A9.004 9.004 0 0 1 13 18.945V23h-2v-4.055A9.004 9.004 0 0 1 3.055 11"/></svg>
              <svg v-else viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" d="M160 224h320v192H160zM224 160h192"/></svg>
            </button>
            <button v-if="voiceMode" class="mp-in-voicebtn">按住 说话</button>
            <textarea v-else v-model="draft" class="mp-ta" rows="1" @focus="showEmoji = false" @keydown.enter.exact.prevent="send"></textarea>
            <button class="mp-in-ico" @click="toggleEmoji" title="表情">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m-4-7h8a4 4 0 0 1-8 0m0-2a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m8 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3"/></svg>
            </button>
            <button v-if="!draft.trim()" class="mp-in-ico" title="更多">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 11V7h2v4h4v2h-4v4h-2v-4H7v-2zm1 11C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16"/></svg>
            </button>
            <button v-else class="mp-send" :disabled="!!sendingContact" @click="send">发送</button>
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
            <span class="mp-wx-acts"><span v-if="wxTab==='chats'||wxTab==='contacts'" :class="['mp-wx-act',{on:showSearch&&wxTab==='chats'}]" @click="toggleSearch"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/></svg></span><span v-if="wxTab==='chats'" :class="['mp-wx-act',{on:showPlus}]" @click="togglePlus"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg></span></span>
            <div v-if="showPlus" class="mp-plus-menu">
              <button class="mp-plus-item" @click="startAddFriend"><span class="mp-plus-ico" v-html="ic.newfriend"></span>添加朋友</button>
              <button class="mp-plus-item dim" @click="showToast('群聊功能即将上线')"><span class="mp-plus-ico" v-html="ic.group"></span>发起群聊</button>
            </div>
          </div>
          <div v-if="viewingOther" class="mp-owner-banner">正在查看 {{ curOwner }} 的手机 · <button @click="switchOwner(meName)">返回我的</button></div>
          <div class="mp-wx-body">
            <!-- 聊天 -->
            <template v-if="wxTab === 'chats'">
              <div v-if="showSearch" class="mp-search"><span class="mp-search-box"><svg viewBox="0 0 24 24" class="mp-search-ico"><path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/></svg><input v-model="searchQuery" class="mp-search-inp" placeholder="搜索" /></span></div>
              <div v-if="showNew" class="mp-newchat">
                <input v-model="newContact" class="mp-nc-in" placeholder="输入联系人名开始对话" @keydown.enter="startChat" />
                <button class="mp-nc-btn" @click="startChat">发起</button>
              </div>
              <div v-if="!contacts.length" class="mp-hint">还没有对话，点右上角 + 发起</div>
              <div v-else-if="!shownContacts.length" class="mp-hint">无匹配联系人</div>
              <div v-for="c in shownContacts" :key="c" class="mp-cell" @click="openContact(c)">
                <div class="mp-ava lg">{{ initial(displayName(c)) }}<span v-if="unreadOf(c)" class="mp-badge sm">{{ unreadOf(c) > 99 ? '99+' : unreadOf(c) }}</span></div>
                <div class="mp-cell-mid"><div class="mp-cell-nm">{{ displayName(c) }}</div><div class="mp-cell-sub">{{ lastPreview(c) }}</div></div>
                <div class="mp-cell-rt"><div class="mp-cell-tm">{{ lastTime(c) }}</div></div>
              </div>
            </template>
            <!-- 通讯录 -->
            <template v-else-if="wxTab === 'contacts'">
              <div class="mp-search"><span class="mp-search-box"><svg viewBox="0 0 24 24" class="mp-search-ico"><path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/></svg><input v-model="searchQuery" class="mp-search-inp" placeholder="搜索" /></span></div>
              <div v-if="!searchQuery" class="mp-cx-special">
                <div v-for="r in cxSpecial" :key="r.k" class="mp-cx-row"><span class="mp-cx-ico" :style="{ background: r.bg }" v-html="ic[r.k]"></span><span class="mp-cx-lbl">{{ r.l }}</span></div>
              </div>
              <div v-if="contacts.length" class="mp-cx-idx">联系人</div>
              <div v-for="c in shownContacts" :key="c" class="mp-cx-item" @click="openProfile(c)">
                <div class="mp-ava sm2">{{ initial(displayName(c)) }}</div><div class="mp-cx-name">{{ displayName(c) }}</div>
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
                <div v-for="(g, gi) in discGroups" :key="gi" class="mp-disc-group">
                  <div v-for="r in g" :key="r.k" class="mp-disc-row" :class="{ dim: !r.go }" @click="r.go && (discoverView = r.go)"><span class="mp-disc-ico" :style="{ background: r.bg }" v-html="ic[r.k]"></span><span class="mp-disc-lbl">{{ r.l }}</span><span class="mp-disc-arrow">›</span></div>
                </div>
              </template>
            </template>
            <!-- 我 -->
            <template v-else>
              <div class="mp-me-card">
                <div class="mp-ava xl">{{ initial(curOwner) }}</div>
                <div class="mp-me-info"><div class="mp-me-nm">{{ curOwner }}</div><div class="mp-me-id">微信号：{{ ownerId(curOwner) }}</div></div>
                <span class="mp-me-qr">▤ ›</span>
              </div>
              <div v-if="owners.length > 1" class="mp-disc-group">
                <div class="mp-owner-hd">切换手机（谁的微信）</div>
                <div v-for="o in owners" :key="o" class="mp-disc-row" @click="switchOwner(o)">
                  <div class="mp-ava sm2" style="width:29px;height:29px;font-size:14px;border-radius:7px">{{ initial(o) }}</div>
                  <span class="mp-disc-lbl">{{ o }}{{ o === meName ? '（我）' : '' }}</span>
                  <span class="mp-disc-arrow">{{ o === curOwner ? '✓' : '›' }}</span>
                </div>
              </div>
              <div v-for="(g, gi) in meGroups" :key="gi" class="mp-disc-group">
                <div v-for="r in g" :key="r.k" class="mp-disc-row" :class="{ dim: r.k !== 'settings' }" @click="r.k === 'settings' && (showSettings = true)"><span class="mp-disc-ico" :style="{ background: r.bg }" v-html="ic[r.k]"></span><span class="mp-disc-lbl">{{ r.l }}</span><span class="mp-disc-arrow">›</span></div>
              </div>
            </template>
          </div>
          <!-- 底部 tab 栏 -->
          <div class="mp-tabbar">
            <button v-for="t in tabs" :key="t.k" :class="['mp-tab', { on: wxTab === t.k }]" @click="wxTab = t.k; discoverView = 'list'; showSearch = false; showNew = false; searchQuery = ''">
              <span class="mp-tab-ico" v-html="wxTab === t.k ? t.icoOn : t.ico"></span><span class="mp-tab-lbl">{{ t.l }}</span>
              <span v-if="t.k === 'chats' && totalUnread" class="mp-badge tb">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
            </button>
          </div>
        </template>

        <!-- 好友资料页（拟真微信）：通讯录点联系人 / 单聊右上 ··· 打开 -->
        <div v-if="profileContact" class="mp-profile">
          <div class="mp-prof-nav">
            <button class="mp-nav-back" @click="closeProfile"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <span class="mp-prof-more">···</span>
          </div>
          <div class="mp-prof-body">
            <div class="mp-prof-card">
              <div class="mp-ava xl">{{ initial(displayName(profileContact)) }}</div>
              <div class="mp-prof-info">
                <div class="mp-prof-nm">{{ displayName(profileContact) }}<span v-if="remarkDraft" class="mp-prof-alias">昵称：{{ profileContact }}</span></div>
                <div class="mp-prof-id">微信号：{{ ownerId(profileContact) }}</div>
                <div v-if="roleInfo(profileContact)" class="mp-prof-region">{{ roleInfo(profileContact) }}</div>
              </div>
            </div>
            <div class="mp-prof-sec">
              <label class="mp-prof-row">
                <span class="mp-prof-lbl">备注名</span>
                <input class="mp-prof-rmk" v-model="remarkDraft" @blur="saveRemarkDraft" @keydown.enter="e => e.target.blur()" placeholder="未设置" />
                <span class="mp-prof-arrow">›</span>
              </label>
              <div class="mp-prof-row"><span class="mp-prof-lbl">标签</span><span class="mp-prof-val ph">未设置</span><span class="mp-prof-arrow">›</span></div>
            </div>
            <div class="mp-prof-sec">
              <div class="mp-prof-row"><span class="mp-prof-lbl">朋友圈</span><span class="mp-prof-val ph"></span><span class="mp-prof-arrow">›</span></div>
              <div class="mp-prof-row"><span class="mp-prof-lbl">朋友权限</span><span class="mp-prof-val ph">全部</span><span class="mp-prof-arrow">›</span></div>
            </div>
            <div class="mp-prof-btns">
              <button class="mp-prof-msg" @click="openContact(profileContact)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c5.5 0 10 3.6 10 8s-4.5 8-10 8a11 11 0 0 1-3-.4L4 20l1.3-3.3A7.4 7.4 0 0 1 2 11c0-4.4 4.5-8 10-8"/></svg>发消息</button>
              <button class="mp-prof-call"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 15.5l-2.3-.5a1 1 0 0 0-1 .3l-1 1a12 12 0 0 1-5.3-5.3l1-1a1 1 0 0 0 .3-1L7.7 6.5a1 1 0 0 0-1-.8H5a1 1 0 0 0-1 1.1A15 15 0 0 0 17.2 20a1 1 0 0 0 1.1-1v-1.7a1 1 0 0 0-.8-1z"/></svg>音视频通话</button>
            </div>
            <div class="mp-prof-sec">
              <button v-if="!confirmDel" class="mp-prof-del" @click="confirmDel = true">删除联系人</button>
              <template v-else>
                <div class="mp-prof-confirm">删除后将同时清空与「{{ displayName(profileContact) }}」的聊天记录</div>
                <button class="mp-prof-del" @click="deleteContact(profileContact)">确定删除</button>
                <button class="mp-prof-cancel" @click="confirmDel = false">取消</button>
              </template>
            </div>
          </div>
        </div>

        <!-- 设置页：我tab点设置打开 -->
        <div v-if="showSettings" class="mp-profile">
          <div class="mp-prof-nav">
            <button class="mp-nav-back" @click="showSettings = false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <span class="mp-set-title">设置</span>
          </div>
          <div class="mp-prof-body">
            <div class="mp-prof-sec">
              <div class="mp-set-row">
                <div class="mp-set-txt"><div class="mp-set-lbl">纯手机模式</div><div class="mp-set-sub">开启后在手机里发消息只留痕、不发往正文，也不触发回复</div></div>
                <button class="mp-switch" :class="{ on: silent }" @click="toggleSilent"><span class="mp-switch-dot"></span></button>
              </div>
            </div>
            <div class="mp-set-note">纯手机模式适合单纯把玩手机、补写历史消息；关闭后恢复正常（发消息会推进剧情）。</div>
          </div>
        </div>
      </div>
      </div>

      <!-- home 指示条 -->
      <div class="mp-homebar" @click="goHome"></div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

defineEmits(['close'])
const props = defineProps({ owner: { type: String, default: '' } })   // 指定机主（状态栏点某角色手机时传入），空=看<user>自己

const VAR_KEY = 'phone_logs'
const REMARK_KEY = 'phone_remarks'
const DELETED_KEY = 'phone_deleted'    // 墓碑：{ 机主: { 联系人: true } }，删除后不被 DOM 卡片扒回
const SILENT_KEY = 'phone_silent'      // 纯手机模式：发消息不发往正文
const logs = ref({})
const unread = ref({})
const deleted = ref({})
const silent = ref(false)
const showSettings = ref(false)
const view = ref('home')
const wxTab = ref('chats')
const discoverView = ref('list')
const activeContact = ref('')
const draft = ref('')
const newContact = ref('')
const showSearch = ref(false)
const showNew = ref(false)
const searchQuery = ref('')
const clock = ref('')
const dateLabel = ref('')
const scrollEl = ref(null)
const showEmoji = ref(false)
const emojiTab = ref('emoji')
const voiceMode = ref(false)
const sendingContact = ref('')
const sendError = ref('')
const overlayStyle = ref(null)
const phoneStyle = ref(null)
const phoneEl = ref(null)
const storyNow = ref(null)
const activeOwner = ref('')            // 当前查看的手机机主，空=<user>自己
const profileContact = ref('')         // 打开的好友资料页对象
const showPlus = ref(false)            // 右上角 + 菜单
const remarks = ref({})                // { 机主: { 联系人: 备注 } }
const confirmDel = ref(false)          // 删除好友二次确认
const remarkDraft = ref('')            // 资料页备注本地草稿(避免轮询覆盖输入)

const doc = window.parent ? window.parent.document : document
function TH() { return window.parent && window.parent.TavernHelper }
const tpTarget = (() => { try { return (window.parent && window.parent.document && window.parent.document.body) || null } catch (e) { return null } })()

const meName = computed(() => {
  try {
    const ctx = window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext()
    return (ctx && ctx.name1) || '我'
  } catch (e) { return '我' }
})
function ownerId(name) {
  const n = name || '?'
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return 'wxid_' + h.toString(36).slice(0, 8)
}
const meId = computed(() => ownerId(meName.value))

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
    ico: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.667 11.511a1.276 1.276 0 0 1-1.285-1.285c0-.718.568-1.286 1.285-1.286c.718 0 1.285.568 1.285 1.286c0 .717-.567 1.285-1.285 1.285m6.667 0a1.276 1.276 0 0 1-1.285-1.285c0-.718.568-1.286 1.285-1.286s1.285.568 1.285 1.286c0 .717-.568 1.285-1.285 1.285m-8.511 7.704l.715-.436a4 4 0 0 1 2.706-.536q.317.05.52.076q.61.081 1.237.081c4.42 0 7.9-3.022 7.9-6.6S16.42 5.2 12 5.2c-4.421 0-7.9 3.022-7.9 6.6c0 1.365.5 2.673 1.431 3.78q.073.088.215.236a4 4 0 0 1 1.1 3.102zm-.63 2.727a1 1 0 0 1-1.527-.93l.189-2.26a2 2 0 0 0-.55-1.551a7 7 0 0 1-.303-.333C2.806 15.447 2.1 13.695 2.1 11.8c0-4.75 4.432-8.6 9.9-8.6c5.467 0 9.9 3.85 9.9 8.6s-4.433 8.6-9.9 8.6q-.765-.001-1.5-.098q-.229-.03-.568-.084a2 2 0 0 0-1.353.268z"/></svg>',
    icoOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5.458 18.185C3.359 16.677 2 14.4 2 11.908C2 7.323 6.475 3.6 12 3.6s10 3.723 10 8.308c0 4.584-4.475 8.308-10 8.308a11.4 11.4 0 0 1-3.272-.462c-.092-.03-.216-.03-.308-.03c-.185 0-.37.06-.525.153l-2.191 1.262c-.062.03-.124.061-.186.061a.34.34 0 0 1-.339-.338c0-.093.03-.154.062-.246c.03-.031.308-1.047.463-1.662c0-.062.03-.154.03-.215q0-.37-.277-.554m3.21-7.673c.717 0 1.285-.569 1.285-1.286S9.385 7.94 8.668 7.94s-1.285.568-1.285 1.286c0 .717.567 1.285 1.285 1.285m6.666 0c.718 0 1.285-.569 1.285-1.286s-.567-1.286-1.285-1.286c-.717 0-1.285.568-1.285 1.286c0 .717.568 1.285 1.285 1.285"/></svg>' },
  { k: 'contacts', l: '通讯录',
    ico: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 22H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1m-1-2v-2H6a1 1 0 1 0 0 2zM5 16.17c.313-.11.65-.17 1-.17h13V4H6a1 1 0 0 0-1 1zM12 10a2 2 0 1 1 0-4a2 2 0 0 1 0 4m-3 4a3 3 0 1 1 6 0z"/></svg>',
    icoOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 22H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1m-1-2v-2H6a1 1 0 1 0 0 2zm-7-10a2 2 0 1 0 0-4a2 2 0 0 0 0 4m-3 4h6a3 3 0 1 0-6 0"/></svg>' },
  { k: 'discover', l: '发现',
    ico: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m4.5-12.5L14 14l-6.5 2.5L10 10zM12 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/></svg>',
    icoOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m4.5-14.5L10 10l-2.5 6.5L14 14zM12 13a1 1 0 1 1 0-2a1 1 0 0 1 0 2"/></svg>' },
  { k: 'me', l: '我',
    ico: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 22h-2v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2H4v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5zm-8-9a6 6 0 1 1 0-12a6 6 0 0 1 0 12m0-2a4 4 0 1 0 0-8a4 4 0 0 0 0 8"/></svg>',
    icoOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 22H4v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5zm-8-9a6 6 0 1 1 0-12a6 6 0 0 1 0 12"/></svg>' },
]
const tabTitle = computed(() => ({ chats: '微信', contacts: '通讯录', discover: '发现', me: '我' }[wxTab.value]))

const ic = {
  moments: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3h6l2 2h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4zm3 16a6 6 0 1 0 0-12a6 6 0 0 0 0 12m0-2a4 4 0 1 1 0-8a4 4 0 0 1 0 8"/></svg>',
  video: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10M10.622 8.415a.4.4 0 0 0-.622.332v6.506a.4.4 0 0 0 .622.332l4.879-3.252a.4.4 0 0 0 0-.666z"/></svg>',
  live: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 4a1 1 0 0 1 1 1v4.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7.4 8.829a.4.4 0 0 0-.392.32L7 9.228v5.542a.4.4 0 0 0 .542.374l.073-.036l4.355-2.771a.4.4 0 0 0 .063-.625l-.063-.05L7.615 8.89a.4.4 0 0 0-.215-.06"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 3h6v5h-2V5h-4zM9 3v2H5v3H3V3zm6 18v-2h4v-3h2v5zm-6 0H3v-5h2v3h4zM3 11h18v2H3z"/></svg>',
  shake: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m6 15a1 1 0 1 0 0 2a1 1 0 0 0 0-2"/></svg>',
  look: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1.182 12C2.122 6.88 6.608 3 12 3s9.878 3.88 10.819 9c-.94 5.12-5.427 9-10.819 9s-9.878-3.88-10.818-9M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10m0-2a3 3 0 1 1 0-6a3 3 0 0 1 0 6"/></svg>',
  searchapp: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 2c4.968 0 9 4.032 9 9s-4.032 9-9 9s-9-4.032-9-9s4.032-9 9-9m0 16c3.867 0 7-3.133 7-7s-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7m8.485.071l2.829 2.828l-1.415 1.415l-2.828-2.829z"/></svg>',
  newfriend: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 14.252V22H4a8 8 0 0 1 10-7.748M12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6m6 4v-3h2v3h3v2h-3v3h-2v-3h-3v-2z"/></svg>',
  group: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 22a8 8 0 1 1 16 0zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6m7.363 2.233A7.505 7.505 0 0 1 22.983 22H20c0-2.61-1-4.986-2.637-6.767m-2.023-2.276A7.98 7.98 0 0 0 18 7a7.96 7.96 0 0 0-1.015-3.903A5 5 0 0 1 21 8a5 5 0 0 1-5.66 4.957"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.904 2.1l9.9 1.414l1.414 9.9l-9.192 9.192a1 1 0 0 1-1.415 0l-9.9-9.9a1 1 0 0 1 0-1.413zm2.829 8.486a2 2 0 1 0 2.828-2.829a2 2 0 0 0-2.828 2.829"/></svg>',
  official: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m4.929 2.929l1.414 1.414A7.98 7.98 0 0 0 4 10c0 2.21.895 4.21 2.343 5.657L4.93 17.07A9.97 9.97 0 0 1 2 10a9.97 9.97 0 0 1 2.929-7.071m14.142 0A9.97 9.97 0 0 1 22 10a9.97 9.97 0 0 1-2.929 7.071l-1.414-1.414A7.98 7.98 0 0 0 20 10c0-2.21-.895-4.21-2.343-5.657zM7.757 5.757l1.415 1.415A4 4 0 0 0 8 10c0 1.105.448 2.105 1.172 2.829l-1.415 1.414A5.98 5.98 0 0 1 6 10c0-1.657.672-3.157 1.757-4.243m8.486 0A5.98 5.98 0 0 1 18 10a5.98 5.98 0 0 1-1.757 4.243l-1.415-1.415A4 4 0 0 0 16 10a4 4 0 0 0-1.172-2.828zM12 12a2 2 0 1 1 0-4a2 2 0 0 1 0 4m0 2c.58 0 1.077.413 1.184.983L14.5 22h-5l1.316-7.017c.107-.57.604-.983 1.184-.983"/></svg>',
  service: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22.005 6h-7a6 6 0 0 0 0 12h7v2a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1zm-7 2h8v8h-8a4 4 0 1 1 0-8m0 3v2h3v-2z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 18.26l-7.053 3.948l1.575-7.928L.588 8.792l8.027-.952L12 .5l3.385 7.34l8.027.952l-5.934 5.488l1.575 7.928z"/></svg>',
  card: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22.005 10v10a1 1 0 0 1-1 1h-18a1 1 0 0 1-1-1V10zm0-2h-20V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1zm-7 8v2h4v-2z"/></svg>',
  emoji: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-4-9a4 4 0 0 0 8 0zm0-2a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m8 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.954 2.21a10 10 0 0 1 4.09-.002A4 4 0 0 0 16 5.07a4 4 0 0 0 3.457.261A10 10 0 0 1 21.5 8.877a4 4 0 0 0-1.5 3.122c0 1.264.586 2.391 1.501 3.124a10 10 0 0 1-2.045 3.543a4 4 0 0 0-3.456.261a4 4 0 0 0-1.955 2.86a10 10 0 0 1-4.09.004A4 4 0 0 0 8 18.927a4 4 0 0 0-3.457-.26A10 10 0 0 1 2.5 15.121A4 4 0 0 0 4 11.999c0-1.264-.587-2.39-1.502-3.124a10 10 0 0 1 2.045-3.542A4 4 0 0 0 8 5.07a4 4 0 0 0 1.954-2.86M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/></svg>',
}
const cxSpecial = [
  { k: 'newfriend', l: '新的朋友', bg: '#fa9d3b' },
  { k: 'group', l: '群聊', bg: '#07c160' },
  { k: 'tag', l: '标签', bg: '#3b7cff' },
  { k: 'official', l: '公众号', bg: '#3b7cff' },
]
const discGroups = [
  [{ k: 'moments', l: '朋友圈', bg: 'linear-gradient(135deg,#4a94ff,#2b6fe0)', go: 'moments' }],
  [{ k: 'video', l: '视频号', bg: '#f5813a' }, { k: 'live', l: '直播', bg: '#f0483e' }],
  [{ k: 'scan', l: '扫一扫', bg: '#2f9cf4' }, { k: 'shake', l: '摇一摇', bg: '#2f9cf4' }],
  [{ k: 'look', l: '看一看', bg: '#f5813a' }, { k: 'searchapp', l: '搜一搜', bg: '#f0483e' }],
]
const meGroups = [
  [{ k: 'service', l: '服务', bg: '#07c160' }],
  [{ k: 'star', l: '收藏', bg: '#3b7cff' }, { k: 'moments', l: '朋友圈', bg: '#07c160' }, { k: 'card', l: '卡包', bg: '#f5813a' }, { k: 'emoji', l: '表情', bg: '#f5b53a' }],
  [{ k: 'settings', l: '设置', bg: '#7a8b9a' }],
]

const curOwner = computed(() => activeOwner.value || meName.value)      // 当前机主
const owners = computed(() => Object.keys(logs.value))                  // 存在的机主列表
const ownerLogs = computed(() => logs.value[curOwner.value] || {})      // 当前机主的会话表
const viewingOther = computed(() => curOwner.value !== meName.value)    // 是否在看别人的手机
const contacts = computed(() => Object.keys(ownerLogs.value))
const shownContacts = computed(() => { const q = searchQuery.value.trim(); const all = Object.keys(ownerLogs.value); return q ? all.filter(c => displayName(c).includes(q) || c.includes(q)) : all })
const messages = computed(() => ownerLogs.value[activeContact.value] || [])
const ownerUnread = computed(() => unread.value[curOwner.value] || {})
const totalUnread = computed(() => Object.values(ownerUnread.value).reduce((a, b) => a + (b || 0), 0))
function unreadOf(c) { return ownerUnread.value[c] || 0 }

function initial(n) { return (n || '?').trim().slice(0, 1) }
function lastMsg(c) { const l = ownerLogs.value[c]; return l && l.length ? l[l.length - 1] : null }
function lastTime(c) { const m = lastMsg(c); return m ? fmtWeChat(parseTime(m.time), storyNow.value) : '' }
function lastPreview(c) {
  const m = lastMsg(c); if (!m) return ''
  const pfx = m.type && m.type !== '文字' ? '[' + m.type + '] ' : ''
  return pfx + (m.type === '表情' ? stickerFallback(m.text) : m.text)
}
function voiceLen(t) { return Math.min(60, Math.max(1, Math.round((t || '').length / 3))) }
function voiceWidth(t) { return Math.min(160, 56 + voiceLen(t) * 3) + 'px' }
function showSep(i) {                          // 首条、跨天、或距上条超5分钟才显示时间条
  const arr = messages.value
  const cur = parseTime(arr[i] && arr[i].time)
  if (!cur) return false
  if (!i) return true
  const prev = parseTime(arr[i - 1].time)
  if (!prev) return true
  const dc = dayNum(cur), dp = dayNum(prev)
  if (dc != null && dp != null && dc !== dp) return true
  const a = absMin(cur), b = absMin(prev)
  if (a != null && b != null) return Math.abs(a - b) > 5
  return (arr[i].time || '') !== (arr[i - 1].time || '')
}

function pad2(n) { return (n < 10 ? '0' : '') + n }
function parseTime(s) {                       // 兼容「2024年03月05日 20:15」「2024-3-5 20:15」「20:15」等
  if (!s) return null
  s = String(s).trim()
  let y = null, mo = null, d = null, h = null, mi = null
  const dm = s.match(/(\d{2,4})\s*[年\/\-]\s*(\d{1,2})\s*[月\/\-]\s*(\d{1,2})/)
  if (dm) { y = +dm[1]; mo = +dm[2]; d = +dm[3] }
  const tm = s.match(/(\d{1,2})\s*[:：]\s*(\d{2})/)
  if (tm) { h = +tm[1]; mi = +tm[2] }
  if (y === null && h === null) return null
  return { y, mo, d, h, mi, raw: s }
}
function hm(t) { return (t && t.h != null) ? pad2(t.h) + ':' + pad2(t.mi) : '' }
function dayNum(t) { return (t && t.y != null) ? Date.UTC(t.y, (t.mo || 1) - 1, t.d || 1) : null }
function absMin(t) { if (!t) return null; const dn = dayNum(t); if (dn != null) return dn / 60000 + (t.h || 0) * 60 + (t.mi || 0); return t.h != null ? t.h * 60 + t.mi : null }
function fmtWeChat(t, now) {                   // 微信式相对时间
  if (!t) return ''
  if (t.y == null) return hm(t) || t.raw
  const md = dayNum(t), h = hm(t)
  if (now && now.y != null) {
    const days = Math.round((dayNum(now) - md) / 86400000)
    if (days <= 0) return h || (t.mo + '月' + t.d + '日')
    if (days === 1) return '昨天' + (h ? ' ' + h : '')
    if (days < 7) return '周' + '日一二三四五六'[new Date(md).getUTCDay()] + (h ? ' ' + h : '')
    if (t.y === now.y) return t.mo + '月' + t.d + '日'
    return t.y + '年' + t.mo + '月' + t.d + '日'
  }
  return t.mo + '月' + t.d + '日' + (h ? ' ' + h : '')
}
function fmtTime(s) { return fmtWeChat(parseTime(s), storyNow.value) }
function storyTime() {                         // 剧情当前时间原始串（无真实时间回退，取不到返回空）
  try {
    const w = window.parent
    if (w && w.Mvu && w.Mvu.getMvuData) {
      let v = null
      try { v = w.Mvu.getMvuData({ type: 'chat' }) } catch (e) {}
      const t = v && v.stat_data && v.stat_data.世界 && v.stat_data.世界.当前时间
      if (t) return String(t)
    }
    const th = TH()
    if (th && th.getVariables) {
      const gv = th.getVariables({ type: 'chat' }) || {}
      const t2 = gv.stat_data && gv.stat_data.世界 && gv.stat_data.世界.当前时间
      if (t2) return String(t2)
    }
  } catch (e) {}
  return ''
}
function displayName(c) {                       // 备注优先，无则本名
  const r = remarks.value[curOwner.value]
  return (r && r[c]) || c
}
function setRemark(c, name) {
  const o = curOwner.value
  if (!remarks.value[o]) remarks.value[o] = {}
  const v = (name || '').trim()
  if (v) remarks.value[o][c] = v; else delete remarks.value[o][c]
  saveRemarks()
}
function loadRemarks() {
  const th = TH(); if (!th || !th.getVariables) return
  try { const v = th.getVariables({ type: 'chat' }) || {}; if (v[REMARK_KEY] && typeof v[REMARK_KEY] === 'object') remarks.value = v[REMARK_KEY] } catch (e) {}
}
function saveRemarks() {
  const th = TH(); if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [REMARK_KEY]: remarks.value }, { type: 'chat' }) } catch (e) {}
}

function loadLogs() {
  const th = TH(); if (!th || !th.getVariables) return
  try {
    const v = th.getVariables({ type: 'chat' }) || {}
    if (v[VAR_KEY] && typeof v[VAR_KEY] === 'object') logs.value = migrate(v[VAR_KEY])
    if (v[DELETED_KEY] && typeof v[DELETED_KEY] === 'object') deleted.value = v[DELETED_KEY]
    if (typeof v[SILENT_KEY] === 'boolean') silent.value = v[SILENT_KEY]
  } catch (e) {}
}
function migrate(data) {                         // 旧格式 {联系人:[消息]} → 新格式 {机主:{联系人:[消息]}}
  const isOld = Object.values(data).some(v => Array.isArray(v))
  if (!isOld) return data
  const me = meName.value
  const moved = {}
  Object.keys(data).forEach(k => { if (Array.isArray(data[k])) moved[k] = data[k] })
  const rest = {}
  Object.keys(data).forEach(k => { if (!Array.isArray(data[k])) rest[k] = data[k] })
  const out = { ...rest }
  out[me] = { ...(out[me] || {}), ...moved }
  return out
}
function saveLogs() {
  const th = TH(); if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [VAR_KEY]: logs.value }, { type: 'chat' }) } catch (e) {}
}
function saveDeleted() {
  const th = TH(); if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [DELETED_KEY]: deleted.value }, { type: 'chat' }) } catch (e) {}
}
function saveSilent() {
  const th = TH(); if (!th || !th.insertOrAssignVariables) return
  try { th.insertOrAssignVariables({ [SILENT_KEY]: silent.value }, { type: 'chat' }) } catch (e) {}
}
function delKey(o, c) { return [o, c].join(String.fromCharCode(1)) } //+ '' + c }
function isDeleted(o, c) { return !!deleted.value[delKey(o, c)] }
const swapDir = d => (d === '发出' ? '收到' : d === '收到' ? '发出' : d)

// 往 logs[owner][contact] 写一条（墓碑跳过、按内容去重、仅自己手机计未读）。返回是否有变化。
function putMsg(owner, contact, msg, countUnread) {
  if (!owner || !contact || isDeleted(owner, contact)) return false
  if (!logs.value[owner]) logs.value[owner] = {}
  if (!logs.value[owner][contact]) logs.value[owner][contact] = []
  const arr = logs.value[owner][contact]
  const sig = msg.dir + '|' + (msg.type || '文字') + '|' + msg.text   // 忽略时间去重，兼容乐观写/镜像重复
  if (arr.some(m => (m.dir + '|' + (m.type || '文字') + '|' + m.text) === sig)) return false
  arr.push(msg)
  if (countUnread && msg.dir === '收到' && owner === meName.value && activeContact.value !== contact) {
    if (!unread.value[owner]) unread.value[owner] = {}
    unread.value[owner][contact] = (unread.value[owner][contact] || 0) + 1
  }
  return true
}
// 双向写入：一次往来同时落在机主与联系人两部手机上，方向对调（点1）
function putBoth(owner, contact, msg) {
  let ch = putMsg(owner, contact, msg, true)
  ch = putMsg(contact, owner, { ...msg, dir: swapDir(msg.dir) }, true) || ch
  return ch
}

function syncScrape() {
  const spans = doc.querySelectorAll('[class*="phone-data"]')
  if (!spans.length) return
  const me = meName.value
  let changed = false
  spans.forEach(span => {
    const raw = (span.textContent || '').trim(); if (!raw) return
    const head = raw.split('|||')
    let owner, contact, time, blob
    if (head.length >= 4) {              // 新格式 机主|||联系人|||时间|||体行blob（机主为空=自己）
      owner = head[0].trim() || me; contact = head[1].trim(); time = head[2].trim(); blob = head.slice(3).join('|||')
    } else if (head.length === 3) {      // 旧格式 联系人|||时间|||blob（隐含机主=自己）
      owner = me; contact = head[0].trim(); time = head[1].trim(); blob = head[2]
    } else return
    if (!contact) return
    blob.split(/(?=(?:发出|收到)\|)/).forEach(line => {   // 在发出|/收到|前断开，兼容换行被吃成<br>的情况
      const ln = line.trim(); if (!ln) return
      const f = ln.split('|')              // 方向|类型|内容（方向相对机主）
      if (f.length < 3) return
      const dir = f[0].trim(), type = (f[1] || '文字').trim() || '文字', text = f.slice(2).join('|').trim()
      if (!dir || !text) return
      if (putBoth(owner, contact, { dir, type, text, time })) changed = true
    })
  })
  if (changed) saveLogs()
}

function openWeChat() { view.value = 'wechat'; wxTab.value = 'chats'; activeContact.value = ''; discoverView.value = 'list' }
function toggleSearch() { showSearch.value = !showSearch.value; showNew.value = false; if (!showSearch.value) searchQuery.value = '' }
function togglePlus() { showPlus.value = !showPlus.value; showSearch.value = false }
function startAddFriend() { showPlus.value = false; showNew.value = true; showSearch.value = false }
function goHome() { if (activeContact.value) closeContact(); else view.value = 'home' }
function openContact(c) { activeContact.value = c; const o = curOwner.value; if (unread.value[o]) unread.value[o][c] = 0; showEmoji.value = false; profileContact.value = ''; scrollDown() }
function closeContact() { activeContact.value = ''; showEmoji.value = false; voiceMode.value = false }
function startChat() {
  const n = newContact.value.trim(); if (!n) return
  const o = curOwner.value
  delete deleted.value[delKey(o, n)]; delete deleted.value[delKey(n, o)]; saveDeleted()   // 重新发起→清墓碑
  if (!logs.value[o]) logs.value[o] = {}
  if (!logs.value[o][n]) { logs.value[o][n] = []; saveLogs() }
  newContact.value = ''; showNew.value = false; openContact(n)
}
function switchOwner(o) { activeOwner.value = o; activeContact.value = ''; wxTab.value = 'chats'; profileContact.value = '' }
function openProfile(c) {
  profileContact.value = c; confirmDel.value = false
  const r = remarks.value[curOwner.value]
  remarkDraft.value = (r && r[c]) || ''      // 打开时快照进本地 draft，轮询不再冲掉输入
}
function closeProfile() { profileContact.value = ''; confirmDel.value = false }
function saveRemarkDraft() { if (profileContact.value) setRemark(profileContact.value, remarkDraft.value) }
function roleInfo(name) {                     // 从名录读身份/来源世界丰富资料页，读不到返回空
  try {
    const w = window.parent
    let sd = null
    if (w && w.Mvu && w.Mvu.getMvuData) { const v = w.Mvu.getMvuData({ type: 'chat' }); sd = v && v.stat_data }
    if (!sd) { const th = TH(); if (th && th.getVariables) sd = (th.getVariables({ type: 'chat' }) || {}).stat_data }
    const rec = sd && sd.角色名录 && sd.角色名录[name]
    if (rec) return [rec.来源世界, rec.身份].filter(Boolean).join(' · ')   // 「来源世界 · 身份」，读不到留空
  } catch (e) {}
  return ''
}
function deleteContact(c) {
  const o = curOwner.value
  if (logs.value[o]) delete logs.value[o][c]
  if (logs.value[c]) delete logs.value[c][o]            // 连镜像一并删
  if (unread.value[o]) delete unread.value[o][c]
  if (remarks.value[o]) { delete remarks.value[o][c]; saveRemarks() }
  deleted.value[delKey(o, c)] = 1; deleted.value[delKey(c, o)] = 1   // 双向墓碑，syncScrape 不再从卡片复活
  saveDeleted(); saveLogs(); profileContact.value = ''; activeContact.value = ''; confirmDel.value = false
}
function scrollDown() { nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight }) }

function toggleEmoji() { showEmoji.value = !showEmoji.value; if (showEmoji.value) { voiceMode.value = false; scrollDown() } }
function insertEmoji(ch) { draft.value += ch }
function backspaceEmoji() { draft.value = Array.from(draft.value).slice(0, -1).join('') }

function send() {
  const text = draft.value.trim(); const contact = activeContact.value; const owner = curOwner.value
  if (!text || !contact || sendingContact.value) return
  const time = storyTime()
  putBoth(owner, contact, { dir: '发出', type: '文字', text, time }); saveLogs(); draft.value = ''; scrollDown()
  // 纯手机模式：只在手机里留痕，不追加进正文、不触发生成（相当于单纯把玩手机）
  if (silent.value) return
  // 常规：把发出内容追加进酒馆主输入框并自动发送，AI 在正文里回 <手机> 块，syncScrape 再拉回收到
  let sent = false
  try {
    const ta = doc.querySelector('#send_textarea')
    if (ta) {
      const line = owner === meName.value ? `（我通过手机给${contact}发：${text}）` : `（我用${owner}的手机给${contact}发：${text}）`
      const cur = (ta.value || '').replace(/\s+$/, '')
      ta.value = cur ? cur + '\n\n' + line : line
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      const btn = doc.querySelector('#send_but')
      if (btn) { btn.click(); sent = true }
    }
  } catch (e) {}
  if (sent) {
    sendingContact.value = contact
    clearTimeout(sendTimer)
    sendTimer = setTimeout(() => { if (sendingContact.value === contact) { sendingContact.value = ''; showToast('等待回复超时') } }, 90000)
  } else {
    showToast('未能自动发送，请在输入框手动发送')
  }
}
function toggleSilent() { silent.value = !silent.value; saveSilent() }

function tick() {                              // 时钟/日期一律取剧情时间，取不到留空（不显示真实时间）
  const now = parseTime(storyTime())
  storyNow.value = now
  clock.value = (now && now.h != null) ? hm(now) : ''
  dateLabel.value = (now && now.y != null)
    ? now.mo + '月' + now.d + '日 周' + '日一二三四五六'[new Date(dayNum(now)).getUTCDay()]
    : ''
}
let timer = null
let tpStyle = null
let sendTimer = null
let errTimer = null
let lockedW = 0
let vvRef = null
let vvHandler = null
let genCtx = null
let onGenEnded = null
let onGenStopped = null

function showToast(msg) {
  sendError.value = msg
  clearTimeout(errTimer)
  errTimer = setTimeout(() => { sendError.value = '' }, 4000)
}
function hookGen() {
  try {
    const ctx = window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext()
    if (!ctx || !ctx.eventSource || !ctx.eventTypes) return
    genCtx = ctx
    onGenEnded = () => {
      if (!sendingContact.value) return
      setTimeout(() => { loadLogs(); syncScrape(); sendingContact.value = ''; clearTimeout(sendTimer) }, 250)
    }
    onGenStopped = () => {
      if (!sendingContact.value) return
      sendingContact.value = ''; clearTimeout(sendTimer); showToast('消息发送失败，请重试')
    }
    ctx.eventSource.on(ctx.eventTypes.GENERATION_ENDED, onGenEnded)
    ctx.eventSource.on(ctx.eventTypes.GENERATION_STOPPED, onGenStopped)
  } catch (e) {}
}
function unhookGen() {
  try {
    if (genCtx && genCtx.eventSource && genCtx.eventSource.removeListener) {
      if (onGenEnded) genCtx.eventSource.removeListener(genCtx.eventTypes.GENERATION_ENDED, onGenEnded)
      if (onGenStopped) genCtx.eventSource.removeListener(genCtx.eventTypes.GENERATION_STOPPED, onGenStopped)
    }
  } catch (e) {}
}
function applyVV() {
  try {
    const vv = window.parent && window.parent.visualViewport
    if (!vv) { overlayStyle.value = null; phoneStyle.value = null; return }
    overlayStyle.value = { position: 'fixed', left: vv.offsetLeft + 'px', top: vv.offsetTop + 'px', width: vv.width + 'px', height: vv.height + 'px' }
    const layoutH = (window.parent && window.parent.innerHeight) || vv.height
    if (layoutH - vv.height > 140) {   // 软键盘顶起：只缩高度、锁住宽度，让聊天区上滑而非整机缩小
      if (!lockedW && phoneEl.value) lockedW = phoneEl.value.offsetWidth
      phoneStyle.value = { height: Math.round(vv.height * 0.98) + 'px', width: (lockedW || Math.round(vv.width * 0.94)) + 'px', maxWidth: 'none', aspectRatio: 'auto' }
    } else {
      lockedW = 0; phoneStyle.value = null
    }
  } catch (e) {}
}
function copyStyles() {
  try {
    if (!tpTarget) return
    const pdoc = window.parent.document
    if (pdoc.head.querySelector('style[data-mp-phone]')) return
    let css = ''
    document.querySelectorAll('style').forEach(s => { const t = s.textContent || ''; if (t.includes('.mp-overlay')) css += t + '\n' })
    if (!css) return
    tpStyle = pdoc.createElement('style'); tpStyle.setAttribute('data-mp-phone', ''); tpStyle.textContent = css
    pdoc.head.appendChild(tpStyle)
  } catch (e) {}
}
onMounted(() => {
  if (props.owner) activeOwner.value = props.owner   // 状态栏点某角色手机 → 直接定位到该机主
  copyStyles()
  tick(); loadLogs(); loadRemarks(); syncScrape()
  timer = setInterval(() => { tick(); loadLogs(); loadRemarks(); syncScrape() }, 2000)
  doc.documentElement.style.overflow = 'hidden'; doc.body.style.overflow = 'hidden'
  hookGen()
  try {
    vvRef = window.parent && window.parent.visualViewport
    if (vvRef) { vvHandler = () => applyVV(); vvRef.addEventListener('resize', vvHandler); vvRef.addEventListener('scroll', vvHandler); applyVV() }
  } catch (e) {}
})
onUnmounted(() => {
  try { if (tpStyle && tpStyle.parentNode) tpStyle.parentNode.removeChild(tpStyle); tpStyle = null } catch (e) {}
  clearInterval(timer); clearTimeout(sendTimer); clearTimeout(errTimer)
  doc.documentElement.style.overflow = ''; doc.body.style.overflow = ''
  unhookGen()
  try { if (vvRef && vvHandler) { vvRef.removeEventListener('resize', vvHandler); vvRef.removeEventListener('scroll', vvHandler) } } catch (e) {}
})
</script>

<style>
@import url('https://fontsapi.zeoseven.com/3/main/result.css');
@import url('https://fontsapi.zeoseven.com/84/main/result.css');
.mp-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);animation:mp-fade .25s ease-out;pointer-events:all;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
@keyframes mp-fade{0%{opacity:0}100%{opacity:1}}
.mp-phone{position:relative;height:min(92vh,812px);aspect-ratio:9/19;max-width:96vw;background:#050505;border-radius:40px;padding:7px;box-shadow:0 24px 70px rgba(0,0,0,.6),0 4px 14px rgba(0,0,0,.4),inset 0 0 0 2px rgba(120,120,130,.3);display:flex;flex-direction:column;overflow:hidden;animation:mp-pop .32s cubic-bezier(.2,.9,.3,1.2)}
@keyframes mp-pop{0%{opacity:0;transform:scale(.93) translateY(14px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.mp-power{position:absolute;right:-3px;top:180px;width:3px;height:74px;border:none;background:linear-gradient(180deg,#3a3a40,#141416);border-radius:3px;cursor:pointer;z-index:9}
.mp-phone > *:not(.mp-power):not(.mp-island){position:relative;z-index:2}
.mp-island{position:absolute;left:50%;top:14px;transform:translateX(-50%);width:96px;height:26px;background:#000;border-radius:13px;z-index:8}

/* 状态栏 */
.mp-status{display:flex;align-items:center;justify-content:space-between;padding:8px 34px 6px;font-size:14px;font-weight:600;color:#111;flex-shrink:0}
.st-light .mp-status{color:#fff}
.mp-st-time{letter-spacing:.02em;font-variant-numeric:tabular-nums}
.mp-st-ico{display:flex;align-items:center;gap:6px}
.mp-st-sig{width:17px;height:12px}.mp-st-wifi{width:16px;height:13px}
.mp-st-bat{width:24px;height:12px;border:1.4px solid currentColor;border-radius:3px;position:relative;opacity:.85}
.mp-st-bat::after{content:'';position:absolute;inset:1.5px;right:6px;background:currentColor;border-radius:1px}
.mp-st-bat::before{content:'';position:absolute;right:-3px;top:3.5px;width:2px;height:4px;background:currentColor;border-radius:0 1px 1px 0}

.mp-screen{flex:1;display:flex;flex-direction:column;min-height:0;border-radius:33px;overflow:hidden;background:#ededed}
.st-light .mp-screen{background:radial-gradient(130% 90% at 50% 0%,#4a5b7d 0%,#2c3b54 45%,#161d2b 100%)}

/* 主屏 */
.mp-home{flex:1;display:flex;flex-direction:column;align-items:center}
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
.mp-wx{flex:1;display:flex;flex-direction:column;background:#ededed;overflow:hidden;min-height:0}
.mp-wx-head{display:flex;align-items:center;justify-content:center;position:relative;padding:6px 16px 12px;background:#ededed}
.mp-wx-title{font-size:17px;font-weight:600;color:#0d0d0d;letter-spacing:.3px}
.mp-wx-acts{position:absolute;right:16px;top:2px;display:flex;gap:14px}
.mp-wx-act{font-size:21px;color:#0d0d0d;font-weight:300;line-height:1;display:flex;align-items:center}
.mp-wx-act svg{width:21px;height:21px}
.mp-wx-act.on{color:#07c160}
.mp-wx-body{flex:1;overflow-y:auto;background:#ededed;-webkit-overflow-scrolling:touch}
.mp-hint{text-align:center;color:#9a9a9a;font-size:13px;padding:36px 16px}
.mp-search{padding:8px 12px;background:#ededed}
.mp-search-box{display:flex;align-items:center;gap:5px;height:34px;padding:0 9px;background:#fff;border-radius:6px}
.mp-search-ico{width:15px;height:15px;color:#9a9a9a;flex-shrink:0}
.mp-overlay .mp-search-inp{flex:1;min-width:0;height:100%;border:none!important;background:transparent!important;color:#0d0d0d!important;font-size:14px;outline:none;font-family:inherit}
.mp-overlay .mp-search-inp::placeholder{color:#9a9a9a!important}
.mp-newchat{display:flex;gap:6px;padding:6px 12px 8px;background:#ededed}
.mp-overlay .mp-nc-in{flex:1;min-width:0;padding:8px 11px;border:none!important;border-radius:7px;background:#fff!important;font-size:13px;color:#222!important;outline:none;box-shadow:none!important}
.mp-overlay .mp-nc-in::placeholder{color:#b0b0b0!important}
.mp-nc-btn{flex-shrink:0;padding:0 14px;border:none;border-radius:7px;background:#07c160;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.mp-cell{display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fff;cursor:pointer;position:relative}
.mp-cell::after{content:'';position:absolute;left:66px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-cell:active{background:#e6e6e6}
.mp-ava{position:relative;width:38px;height:38px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7aa7d6,#5a86b8);color:#fff;font-weight:500;font-size:17px}
.mp-ava.lg{width:46px;height:46px;font-size:21px;border-radius:6px}
.mp-ava.sm2{width:38px;height:38px;font-size:17px}
.mp-ava.xl{width:62px;height:62px;font-size:28px;border-radius:8px}
.mp-cell-mid{flex:1;min-width:0}
.mp-cell-nm{font-size:16px;color:#0d0d0d;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mp-cell-sub{font-size:13px;color:#9a9a9a;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px}
.mp-cell-rt{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;align-self:flex-start;padding-top:4px}
.mp-cell-tm{font-size:11.5px;color:#b2b2b2}

/* 通讯录 */
.mp-cx-special{background:#fff}
.mp-cx-row{display:flex;align-items:center;gap:12px;padding:9px 14px;cursor:default;position:relative}
.mp-cx-row::after{content:'';position:absolute;left:52px;right:0;bottom:0;height:1px;background:#f0f0f0}
.mp-cx-ico{width:38px;height:38px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mp-cx-ico svg{width:20px;height:20px;color:#fff}
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
.mp-disc-ico{width:29px;height:29px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.mp-disc-ico svg{width:18px;height:18px;color:#fff}
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
.mp-bub.mt-红包{background:linear-gradient(160deg,#f7a34e,#f2653a)!important;padding:0!important;min-width:180px;overflow:hidden}
.mp-bub.mt-红包::before{border-right-color:#f7a34e!important;border-left-color:#f2653a!important}
.mp-rp-top{display:flex;align-items:center;gap:9px;padding:12px 14px}
.mp-rp-ico{width:30px;height:30px;border-radius:50%;background:#ffdca8;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mp-rp-ico svg{width:18px;height:18px;color:#e8542f}
.mp-rp-txt{color:#fff;font-size:14.5px;line-height:1.35}
.mp-rp-tag{display:block;padding:5px 14px;background:rgba(0,0,0,.06);color:#ffe6c8;font-size:11px}
.mp-typing{display:flex;gap:4px;align-items:center;padding:13px 15px;min-width:auto}
.mp-typing span{width:6px;height:6px;border-radius:50%;background:#bbb;animation:mp-bnc 1.2s infinite}
.mp-typing span:nth-child(2){animation-delay:.2s}.mp-typing span:nth-child(3){animation-delay:.4s}
@keyframes mp-bnc{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
.mp-toast{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);background:rgba(0,0,0,.78);color:#fff;font-size:12.5px;padding:7px 14px;border-radius:8px;z-index:10;white-space:nowrap;animation:mp-fade .2s ease-out;pointer-events:none}

/* 输入栏 */
.mp-inbar{display:flex;gap:8px;align-items:center;padding:7px 10px 15px;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.06);flex-shrink:0}
.mp-in-ico{flex-shrink:0;width:30px;height:30px;padding:0;background:none;border:none;cursor:pointer;color:#5a5a5a;display:flex;align-items:center;justify-content:center}
.mp-in-ico svg{width:27px;height:27px}
.mp-overlay .mp-ta{flex:1;min-width:0;max-height:80px;padding:7px 10px;border:none!important;border-radius:5px;background:#fff!important;font-size:15px;color:#0d0d0d!important;resize:none;outline:none;font-family:inherit;line-height:1.4;box-shadow:none!important}
.mp-overlay .mp-ta::placeholder{color:#b0b0b0!important}
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

/* +菜单 */
.mp-plus-menu{position:absolute;right:12px;top:40px;background:#4c4c4c;border-radius:8px;padding:4px 0;z-index:20;box-shadow:0 4px 16px rgba(0,0,0,.3);min-width:130px}
.mp-plus-menu::before{content:'';position:absolute;right:14px;top:-5px;width:10px;height:10px;background:#4c4c4c;transform:rotate(45deg)}
.mp-plus-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 15px;background:none;border:none;color:#f0f0f0;font-size:14px;cursor:pointer;font-family:inherit}
.mp-plus-item:active{background:rgba(255,255,255,.08)}
.mp-plus-item.dim{opacity:.5}
.mp-plus-ico{width:19px;height:19px;display:flex;align-items:center;justify-content:center}
.mp-plus-ico svg{width:19px;height:19px;color:#f0f0f0}

/* 看别人手机横幅 */
.mp-owner-banner{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;background:#faf0d7;color:#8a6d1f;font-size:12.5px;flex-shrink:0}
.mp-owner-banner button{background:none;border:none;color:#576b95;font-size:12.5px;cursor:pointer;padding:0;font-family:inherit}
.mp-owner-hd{padding:8px 14px 4px;font-size:12px;color:#9a9a9a;background:#ededed}

/* 好友资料页（拟真微信） */
.mp-profile{position:absolute;inset:0;background:#ededed;z-index:15;display:flex;flex-direction:column;animation:mp-slideL .25s ease-out}
@keyframes mp-slideL{0%{transform:translateX(100%)}100%{transform:translateX(0)}}
.mp-prof-nav{display:flex;align-items:center;justify-content:space-between;padding:8px 14px 6px;background:#ededed;flex-shrink:0}
.mp-prof-nav .mp-nav-back{width:26px;height:26px;background:none;border:none;cursor:pointer;color:#0d0d0d;padding:0}
.mp-prof-nav .mp-nav-back svg{width:22px;height:22px}
.mp-prof-more{color:#0d0d0d;font-weight:700;letter-spacing:1px;font-size:17px}
.mp-prof-body{flex:1;overflow-y:auto;background:#ededed}
.mp-prof-body::-webkit-scrollbar{width:0}
.mp-prof-card{display:flex;align-items:flex-start;gap:15px;padding:22px 18px 26px;background:#fff}
.mp-prof-card .mp-ava.xl{border-radius:8px}
.mp-prof-info{flex:1;min-width:0;padding-top:2px}
.mp-prof-nm{font-size:21px;font-weight:600;color:#0d0d0d;display:flex;flex-direction:column;gap:3px}
.mp-prof-alias{font-size:12.5px;color:#9a9a9a;font-weight:400}
.mp-prof-id{font-size:13px;color:#9a9a9a;margin-top:8px}
.mp-prof-region{font-size:13px;color:#9a9a9a;margin-top:4px}
.mp-prof-sec{margin-top:9px;background:#fff}
.mp-prof-row{display:flex;align-items:center;padding:13px 15px;position:relative;font-size:15.5px;color:#0d0d0d}
.mp-prof-row::after{content:'';position:absolute;left:15px;right:0;bottom:0;height:1px;background:#f2f2f2}
.mp-prof-row:last-child::after{display:none}
.mp-prof-lbl{color:#0d0d0d;flex-shrink:0}
.mp-overlay .mp-prof-rmk{flex:1;margin:0 8px;border:none!important;background:transparent!important;color:#0d0d0d!important;font-size:15.5px;text-align:right;outline:none;font-family:inherit;box-shadow:none!important}
.mp-overlay .mp-prof-rmk::placeholder{color:#c4c4c4!important}
.mp-prof-val{flex:1;text-align:right;color:#0d0d0d;margin:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-prof-val.ph{color:#c4c4c4}
.mp-prof-arrow{color:#c8c8c8;font-size:16px;flex-shrink:0}
.mp-prof-btns{margin-top:9px;background:#fff}
.mp-prof-msg,.mp-prof-call{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:#fff;border:none;font-size:16px;color:#07c160;cursor:pointer;font-family:inherit;position:relative}
.mp-prof-msg::after{content:'';position:absolute;left:15px;right:0;bottom:0;height:1px;background:#f2f2f2}
.mp-prof-msg svg,.mp-prof-call svg{width:21px;height:21px}
.mp-prof-call{color:#07c160}
.mp-prof-msg:active,.mp-prof-call:active{background:#e9e9e9}
.mp-prof-del{width:100%;padding:14px;background:#fff;border:none;font-size:16px;color:#fa5151;cursor:pointer;font-family:inherit}
.mp-prof-del:active{background:#e9e9e9}
.mp-prof-confirm{padding:14px 16px 10px;background:#fff;text-align:center;font-size:13.5px;color:#9a9a9a}
.mp-prof-cancel{width:100%;padding:14px;background:#fff;border:none;border-top:1px solid #f2f2f2;font-size:16px;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-prof-cancel:active{background:#e9e9e9}

/* 设置页 */
.mp-set-title{flex:1;text-align:center;font-size:16.5px;font-weight:600;color:#0d0d0d;margin-left:-26px}
.mp-set-row{display:flex;align-items:center;gap:12px;padding:13px 16px}
.mp-set-txt{flex:1;min-width:0}
.mp-set-lbl{font-size:15.5px;color:#0d0d0d}
.mp-set-sub{font-size:12px;color:#9a9a9a;margin-top:4px;line-height:1.4}
.mp-switch{flex-shrink:0;width:46px;height:27px;border:none;border-radius:14px;background:#c8c8ca;cursor:pointer;padding:0;position:relative;transition:background .2s}
.mp-switch.on{background:#07c160}
.mp-switch-dot{position:absolute;top:2px;left:2px;width:23px;height:23px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .2s}
.mp-switch.on .mp-switch-dot{left:21px}
.mp-set-note{padding:14px 18px;font-size:12px;color:#9a9a9a;line-height:1.6}
</style>
