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
      <div v-if="view === 'home'" class="mp-home" :style="homeStyle">
        <div class="mp-home-clock">{{ clock }}</div>
        <div class="mp-home-date">{{ dateLabel }}</div>
        <div class="mp-apps">
          <button class="mp-app" @click="openWeChat">
            <span class="mp-app-ico ico-wx"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.575 13.711a.91.91 0 0 0 .898-.898a.895.895 0 0 0-.898-.898a.894.894 0 0 0-.898.898c0 .5.4.898.898.898m-4.425 0a.91.91 0 0 0 .898-.898c0-.498-.4-.898-.898-.898a.894.894 0 0 0-.898.898c0 .5.399.898.898.898m6.567 5.04a.35.35 0 0 0-.172.37c0 .048 0 .098.025.147c.098.417.294 1.081.294 1.106c0 .073.025.122.025.172a.22.22 0 0 1-.221.22c-.05 0-.074-.024-.123-.048l-1.449-.836a.8.8 0 0 0-.344-.098c-.073 0-.147 0-.196.024c-.688.197-1.4.295-2.161.295c-3.66 0-6.607-2.457-6.607-5.505s2.947-5.505 6.607-5.505c3.659 0 6.606 2.458 6.606 5.505c0 1.647-.884 3.146-2.284 4.154M16.674 8.099a9 9 0 0 0-.28-.005c-4.174 0-7.606 2.86-7.606 6.505c0 .554.08 1.09.228 1.6h-.089a10 10 0 0 1-2.584-.368c-.074-.025-.148-.025-.222-.025a.83.83 0 0 0-.419.123l-1.747 1.005a.35.35 0 0 1-.148.05a.273.273 0 0 1-.27-.27c0-.074.024-.123.049-.197c.024-.024.246-.834.369-1.324c0-.05.024-.123.024-.172a.56.56 0 0 0-.221-.441C2.059 13.376 1 11.586 1 9.599C1.001 5.944 4.571 3 8.951 3c3.765 0 6.93 2.169 7.723 5.098m-5.154.418c.573 0 1.026-.477 1.026-1.026c0-.573-.453-1.026-1.026-1.026s-1.026.453-1.026 1.026s.453 1.026 1.026 1.026m-5.26 0c.573 0 1.027-.477 1.027-1.026c0-.573-.454-1.026-1.027-1.026c-.572 0-1.026.453-1.026 1.026s.454 1.026 1.026 1.026"/></svg></span>
            <span class="mp-app-lbl">微信</span>
            <span v-if="totalUnread" class="mp-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
          </button>
          <button class="mp-app" @click="view = 'camera'"><span class="mp-app-ico ico-cam"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M256 128l-32 48h-96c-35 0-64 29-64 64v224c0 35 29 64 64 64h384c35 0 64-29 64-64V240c0-35-29-64-64-64h-96l-32-48zm64 128a112 112 0 110 224 112 112 0 010-224"/></svg></span><span class="mp-app-lbl">相机</span></button>
          <button class="mp-app" @click="view = 'album'"><span class="mp-app-ico ico-album"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M96 96h448c35 0 64 29 64 64v320c0 35-29 64-64 64H96c-35 0-64-29-64-64V160c0-35 29-64 64-64zm80 80a80 80 0 100 160 80 80 0 000-160zm336 304L384 320l-96 128-64-80-112 112z"/></svg></span><span class="mp-app-lbl">相册</span></button>
          <button class="mp-app" @click="view = 'wallpaper'"><span class="mp-app-ico ico-wp"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 64a256 256 0 100 512A256 256 0 00320 64m0 64a192 192 0 110 384A192 192 0 01320 128m0 64a128 128 0 100 256 128 128 0 000-256"/></svg></span><span class="mp-app-lbl">壁纸</span></button>
          <button class="mp-app" @click="openDouyin"><span class="mp-app-ico ico-dy"><svg class="ico-dy-b" viewBox="0 0 24 24"><path fill="#25f4ee" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg><svg class="ico-dy-r" viewBox="0 0 24 24"><path fill="#fe2c55" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg><svg class="ico-dy-w" viewBox="0 0 24 24"><path fill="#fff" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg></span><span class="mp-app-lbl">抖音</span></button>
          <button class="mp-app" @click="showPhoneSettings = true"><span class="mp-app-ico ico-set"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 208a112 112 0 100 224 112 112 0 000-224m0 64a48 48 0 110 96 48 48 0 010-96"/></svg><svg class="ico-set-gear" viewBox="0 0 640 640"><path fill="currentColor" d="M320 128l24 56 60-16 4 62 58 22-36 50 36 50-58 22-4 62-60-16-24 56-24-56-60 16-4-62-58-22 36-50-36-50 58-22 4-62 60 16z"/></svg></span><span class="mp-app-lbl">设置</span></button>
        </div>
      </div>

      <!-- 微信 -->
      <div v-else-if="view === 'wechat'" class="mp-wx">
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
              <div :class="['mp-row', m.dir === '发出' ? 'out' : m.dir === '系统' ? 'sys' : 'in']">
                <div v-if="m.dir !== '系统'" class="mp-ava">{{ initial(m.dir === '发出' ? curOwner : activeContact) }}</div>
                <div :class="['mp-bub', 'mt-' + (m.type || '文字')]" @click.stop="openCtxMenu(i, m.dir)">
                  <template v-if="m.type === '语音'"><span class="mp-voice" :style="{ width: voiceWidth(m.text) }"><span class="mp-voice-ico"><i></i><i></i><i></i></span><span class="mp-voice-len">{{ voiceLen(m.text) }}″</span></span><span class="mp-vtext">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '图片'"><span class="mp-media"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M128 128c-35 0-64 29-64 64v256c0 35 29 64 64 64h384c35 0 64-29 64-64V192c0-35-29-64-64-64zm80 80a48 48 0 110 96 48 48 0 010-96m304 240H128l96-128 64 80 80-112z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '视频'"><span class="mp-media mp-video"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 128a192 192 0 100 384 192 192 0 000-384m-40 120l112 72-112 72z"/></svg></span><span class="mp-cap">{{ m.text }}</span></template>
                  <template v-else-if="m.type === '红包'"><span class="mp-rp-top"><span class="mp-rp-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 2v5h12V4zm6 9a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2"/></svg></span><span class="mp-rp-txt">{{ m.text || '恭喜发财，大吉大利' }}</span></span><span class="mp-rp-tag">微信红包</span></template>
                  <template v-else-if="m.type === '表情'"><img v-if="stickerUrl(m.text)" class="mp-sticker-img" :src="stickerUrl(m.text)" :alt="m.text" /><span v-else class="mp-sticker">{{ stickerFallback(m.text) }}</span></template>
                  <template v-else-if="m.type === '系统'"><span class="mp-sys-text">{{ m.text }}</span></template>
                  <template v-else><span v-html="renderText(m.text)"></span></template>
                </div>
                <button v-if="m.status === 'failed'" class="mp-fail" title="发送失败，点击重发" @click="resend(m)">!</button>
                <span v-else-if="m.status === 'pending'" class="mp-pending"></span>
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
              <div v-else class="mp-emoji-sticker">
                <button v-for="(url, name) in STICKERS" :key="name" class="mp-sticker-btn" @click="insertEmoji('[表情:' + name + ']')" :title="name">
                  <img :src="url" :alt="name" class="mp-sticker-sel" />
                </button>
              </div>
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

        <!-- 长按消息菜单 -->
        <div v-if="ctxMenu" class="mp-ctx-overlay" @click.self="closeCtxMenu">
          <div class="mp-ctx-sheet">
            <button v-if="ctxMenu.dir === '发出'" class="mp-ctx-item" @click="recallMsg">撤回</button>
            <button v-if="ctxMenu.dir === '发出'" class="mp-ctx-item" @click="resendCtx">重发</button>
            <button class="mp-ctx-item danger" @click="deleteMsg">删除</button>
            <button class="mp-ctx-cancel" @click="closeCtxMenu">取消</button>
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

      <!-- 设置总控（主屏设置 app）：各 app 纯手机模式开关集合，覆盖全屏 -->
      <div v-if="showPhoneSettings" class="mp-setapp">
        <div class="mp-status mp-setapp-status">
          <span class="mp-st-time">{{ clock }}</span>
          <span class="mp-st-ico">
            <svg class="mp-st-sig" viewBox="0 0 640 640"><path fill="currentColor" d="M112 400h56v96h-56zm120-64h56v160h-56zm120-80h56v240h-56zm120-96h56v336h-56z"/></svg>
            <svg class="mp-st-wifi" viewBox="0 0 640 640"><path fill="currentColor" d="M320 160c116 0 221 45 298 118l-52 54c-64-60-151-96-246-96S138 272 74 332l-52-54C99 205 204 160 320 160m0 152c58 0 111 22 150 59l-53 55c-26-24-60-38-97-38s-71 14-97 38l-53-55c39-37 92-59 150-59m0 152c20 0 38 8 51 22l-51 53l-51-53c13-14 31-22 51-22"/></svg>
            <span class="mp-st-bat"></span>
          </span>
        </div>
        <div class="mp-setapp-nav">
          <button class="mp-nav-back" @click="showPhoneSettings = false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <span class="mp-setapp-title">设置</span>
        </div>
        <div class="mp-setapp-body">
          <div class="mp-setapp-hd">纯手机模式</div>
          <div class="mp-setapp-desc">开启后，在该应用里发消息只在手机内往来、不写进正文，AI 只以聊天对象的身份在手机里回你。适合单独把玩手机、补写消息。</div>
          <div class="mp-setapp-sec">
            <div v-for="a in silentApps" :key="a.k">
              <div class="mp-setapp-row" :class="{ dim: !a.ready }">
                <span class="mp-setapp-ico" :style="{ background: a.bg }">{{ a.l.slice(0, 1) }}</span>
                <span class="mp-setapp-lbl">{{ a.l }}<span v-if="!a.ready" class="mp-setapp-soon">未上线</span></span>
                <template v-if="a.k === '抖音' && a.ready">
                  <span class="mp-dy-mode-tag" :class="{r18: douyinSettings.mode==='r18'}">{{ douyinSettings.mode==='r18' ? '抖阴模式' : '抖音模式' }}</span>
                </template>
                <button v-else-if="a.ready" class="mp-switch" :class="{ on: silentMap[a.k] }" @click="toggleSilentApp(a.k)"><span class="mp-switch-dot"></span></button>
                <span v-else class="mp-setapp-arrow">›</span>
              </div>
              <!-- 微信：纯手机模式下的历史条数设置 -->
              <div v-if="a.k === '微信' && a.ready && silentMap['微信']" class="mp-dy-settings-panel">
                <div class="mp-dy-set-subhd">带入历史条数（当前 {{ histLimit }} 条）</div>
                <div class="mp-dy-set-btns">
                  <button v-for="n in HIST_OPTIONS" :key="n" :class="['mp-dy-set-btn', {on: histLimit===n}]" @click="setHistLimit(n)">{{ n }}</button>
                  <input class="mp-dy-set-input" :class="{on: !HIST_OPTIONS.includes(histLimit)}" type="number" min="1" max="500" v-model="histDraft" :placeholder="HIST_OPTIONS.includes(histLimit) ? '自定义' : String(histLimit)" @keydown.enter.prevent="applyHistDraft" @blur="applyHistDraft" />
                </div>
                <div class="mp-dy-set-note">纯手机模式下每次让 AI 回消息时带上多少条历史。越多越记得住前情，代价是 token 略增。自定义后回车或点开即生效。</div>
              </div>
              <div v-if="a.k === '抖音' && a.ready" class="mp-dy-settings-panel">
                <div class="mp-dy-set-row">
                  <span class="mp-dy-set-lbl">模式</span>
                  <div class="mp-dy-set-btns">
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.mode==='normal'}]" @click="douyinSettings.mode='normal';saveDySettings()">抖音</button>
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.mode==='r18'}]" @click="douyinSettings.mode='r18';saveDySettings()">抖阴</button>
                  </div>
                </div>
                <div class="mp-dy-set-note">抖阴模式下顶栏会多出「私密」页。公开流（推荐/关注）里点视频文字可翻转看只给你的私密版。直播卡也会混入推荐/关注流。</div>
                <!-- 直播出现概率 -->
                <div class="mp-dy-set-subhd">直播出现概率（当前 {{ dyLivePct }}%）</div>
                <div class="mp-dy-set-btns">
                  <button v-for="p in DY_LIVE_PCT_OPTIONS" :key="p" :class="['mp-dy-set-btn', {on: dyLivePct===p}]" @click="setDyLivePct(p)">{{ p }}%</button>
                  <input class="mp-dy-set-input" :class="{on: !DY_LIVE_PCT_OPTIONS.includes(dyLivePct)}" type="number" min="0" max="100" v-model="livePctDraft" :placeholder="DY_LIVE_PCT_OPTIONS.includes(dyLivePct) ? '自定义' : String(dyLivePct)" @keydown.enter.prevent="applyLivePctDraft" @blur="applyLivePctDraft" />
                </div>
                <div class="mp-dy-set-note">推荐/关注流里直播卡占的比例。0=全是视频，15=约每7条有1条直播。</div>
                <!-- 直播每批聊天条数 -->
                <div class="mp-dy-set-subhd">直播上下文记忆（当前 {{ dyChatBatch }} 条）</div>
                <div class="mp-dy-set-btns">
                  <button v-for="n in DY_CHAT_BATCH_OPTIONS" :key="n" :class="['mp-dy-set-btn', {on: dyChatBatch===n}]" @click="setDyChatBatch(n)">{{ n }}</button>
                  <input class="mp-dy-set-input" :class="{on: !DY_CHAT_BATCH_OPTIONS.includes(dyChatBatch)}" type="number" min="10" max="200" v-model="chatBatchDraft" :placeholder="DY_CHAT_BATCH_OPTIONS.includes(dyChatBatch) ? '自定义' : String(dyChatBatch)" @keydown.enter.prevent="applyChatBatchDraft" @blur="applyChatBatchDraft" />
                </div>
                <div class="mp-dy-set-note">喂给 AI 的历史消息条数（不是输出条数）。数越多主播越不失忆，推荐50条以上。</div>
                <template v-if="douyinSettings.mode==='r18'">
                  <div class="mp-dy-set-subhd">私密页·陌生人占比（当前 {{ dyStrangerPct }}%）</div>
                  <div class="mp-dy-set-btns">
                    <button v-for="p in DY_STRANGER_OPTIONS" :key="p" :class="['mp-dy-set-btn', {on: dyStrangerPct===p}]" @click="setDyStrangerPct(p)">{{ p }}%</button>
                    <input class="mp-dy-set-input" :class="{on: !DY_STRANGER_OPTIONS.includes(dyStrangerPct)}" type="number" min="0" max="100" v-model="strangerDraft" :placeholder="DY_STRANGER_OPTIONS.includes(dyStrangerPct) ? '自定义' : String(dyStrangerPct)" @keydown.enter.prevent="applyStrangerDraft" @blur="applyStrangerDraft" />
                  </div>
                  <div class="mp-dy-set-note">私密页里，这个比例是<b>陌生成人博主</b>的内容，其余是<b>红颜私发</b>。默认 0，全为红颜私发。自定义后回车或点开即生效。</div>
                  <div class="mp-dy-set-warn">⚠️ 两者性质完全不同：<b>红颜私发</b>只有你和红颜看得到、评论只会是你俩；<b>陌生博主的私密内容是公开发布的成人内容</b>，会被其他陌生人看到、也会有陌生人评论。调高此项＝私密页混入公开的陌生成人视频。</div>
                </template>
                <button class="mp-dy-set-clear" @click="clearDyCache">清理视频缓存（共 {{ douyinFeed.length }} 条）</button>
              </div>
            </div>
          </div>
          <div class="mp-setapp-note">后续会往手机里加入更多应用（QQ、微博等），届时都能在这里各自开关。</div>
        </div>
      </div>

      <!-- home 指示条 -->
      <div class="mp-homebar" @click="goHome"></div>

      <!-- 相机 -->
      <div v-if="view === 'camera'" class="mp-cam">
        <div class="mp-cam-nav">
          <button class="mp-nav-back" @click="goHome"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <span class="mp-cam-title">相机</span>
          <button class="mp-cam-gear" @click="showCameraSettings = !showCameraSettings"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M320 208a112 112 0 100 224 112 112 0 000-224m0 64a48 48 0 110 96 48 48 0 010-96"/></svg><svg class="ico-set-gear" viewBox="0 0 640 640"><path fill="currentColor" d="M320 128l24 56 60-16 4 62 58 22-36 50 36 50-58 22-4 62-60-16-24 56-24-56-60 16-4-62-58-22 36-50-36-50 58-22 4-62 60 16z"/></svg></button>
        </div>
        <!-- 相机设置面板 -->
        <div v-if="showCameraSettings" class="mp-cam-settings">
          <div class="mp-cs-title">设置</div>
          <div class="mp-cs-row">
            <span class="mp-cs-lbl">纯手机模式</span>
            <button class="mp-switch" :class="{ on: silentMap['相机'] }" @click="toggleSilentApp('相机')"><span class="mp-switch-dot"></span></button>
          </div>
          <div v-if="silentMap['相机']" class="mp-cs-row">
            <span class="mp-cs-lbl">拍摄模式</span>
            <div class="mp-cs-modes">
              <button :class="['mp-cs-mode', { on: cameraMode === '普通' }]" @click="cameraMode = '普通'">普通</button>
              <button :class="['mp-cs-mode', { on: cameraMode === '透视' }]" @click="cameraMode = '透视'">透视</button>
            </div>
          </div>
        </div>
        <!-- 取景器 -->
        <div class="mp-cam-view" @click.self="showCameraSettings = false">
          <svg viewBox="0 0 64 64" class="mp-cam-icon"><path fill="currentColor" d="M24 8l-4 6H8a4 4 0 0 0-4 4v30a4 4 0 0 0 4 4h48a4 4 0 0 0 4-4V18a4 4 0 0 0-4-4H44l-4-6zm8 10a14 14 0 1 1 0 28 14 14 0 0 1 0-28zm0 4a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>
          <div v-if="sendingCamera" class="mp-cam-busy"><span></span><span></span><span></span></div>
        </div>
        <!-- 纯手机模式输入区 -->
        <div v-if="silentMap['相机']" class="mp-cam-input">
          <span v-if="cameraMode === '透视'" class="mp-cam-tag">透视</span>
          <textarea v-model="cameraDraft" class="mp-cam-ta" rows="1" placeholder="描述拍摄对象…" @focus="showCameraSettings = false"></textarea>
        </div>
        <!-- 底部操作栏 -->
        <div class="mp-cam-bar">
          <button class="mp-cam-album-btn" @click="view = 'album'"><svg viewBox="0 0 640 640"><path fill="currentColor" d="M96 96h448c35 0 64 29 64 64v320c0 35-29 64-64 64H96c-35 0-64-29-64-64V160c0-35 29-64 64-64zm80 80a80 80 0 100 160 80 80 0 000-160zm336 304L384 320l-96 128-64-80-112 112z"/></svg></button>
          <button class="mp-shutter" :disabled="sendingCamera" @click="doShutter">
            <span class="mp-shutter-inner"></span>
          </button>
          <div class="mp-cam-bar-r"></div>
        </div>
      </div>

      <!-- 相册 -->
      <div v-if="view === 'album'" class="mp-album">
        <div class="mp-wx-nav" style="background:#000">
          <button class="mp-nav-back" style="color:#fff" @click="goHome"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <span class="mp-nav-title" style="color:#fff">相册</span>
          <span></span>
        </div>
        <div class="mp-album-body">
          <div v-if="!photos.length" class="mp-hint" style="color:#888;margin-top:60px">还没有照片，去拍一张吧</div>
          <div v-else class="mp-album-grid">
            <div v-for="(p, i) in photos" :key="i" class="mp-photo-cell" @click="selectedPhoto = p">
              <div class="mp-photo-thumb"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3h6l2 2h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4zm3 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8"/></svg></div>
              <div class="mp-photo-meta"><div class="mp-photo-subj">{{ p.对象 || '照片' }}</div><div class="mp-photo-time">{{ p.时间 || '' }}</div></div>
            </div>
          </div>
        </div>
        <!-- 照片详情 -->
        <div v-if="selectedPhoto" class="mp-photo-detail">
          <button class="mp-nav-back" style="position:absolute;top:14px;left:12px;color:#fff;z-index:2" @click="selectedPhoto = null"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <div class="mp-detail-bg"></div>
          <div class="mp-detail-meta"><span class="mp-detail-subj">{{ selectedPhoto.对象 }}</span><span v-if="selectedPhoto.模式 === '透视'" class="mp-detail-mode">透视</span><span class="mp-detail-time">{{ selectedPhoto.时间 }}</span></div>
          <div class="mp-detail-cap">{{ selectedPhoto.画面 }}</div>
        </div>
      </div>

      <!-- 壁纸 -->
      <div v-if="view === 'wallpaper'" class="mp-wp-panel">
        <div class="mp-wx-nav">
          <button class="mp-nav-back" @click="goHome"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <span class="mp-nav-title">壁纸</span>
          <span></span>
        </div>
        <div class="mp-wp-body">
          <div class="mp-wp-grid">
            <button class="mp-wp-item" :class="{ on: !curWallpaper }" @click="selectWallpaper('')">
              <div class="mp-wp-thumb mp-wp-default"><span>默认</span></div>
              <span class="mp-wp-name">默认</span>
            </button>
            <button v-for="wp in WALLPAPERS" :key="wp.url" class="mp-wp-item" :class="{ on: curWallpaper === wp.url }" @click="selectWallpaper(wp.url)">
              <div class="mp-wp-thumb" :style="{ backgroundImage: `url(${wp.url})` }"></div>
              <span class="mp-wp-name">{{ wp.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 抖音 -->
      <div v-if="view === 'douyin'" class="mp-dy">
        <!-- 状态栏（时间/信号/电量） -->
        <div class="mp-dy-status">
          <span class="mp-dy-st-time">{{ clock }}</span>
          <span class="mp-dy-st-ico">
            <svg class="mp-st-sig" viewBox="0 0 640 640"><path fill="currentColor" d="M112 400h56v96h-56zm120-64h56v160h-56zm120-80h56v240h-56zm120-96h56v336h-56z"/></svg>
            <svg class="mp-st-wifi" viewBox="0 0 640 640"><path fill="currentColor" d="M320 160c116 0 221 45 298 118l-52 54c-64-60-151-96-246-96S138 272 74 332l-52-54C99 205 204 160 320 160m0 152c58 0 111 22 150 59l-53 55c-26-24-60-38-97-38s-71 14-97 38l-53-55c39-37 92-59 150-59m0 152c20 0 38 8 51 22l-51 53l-51-53c13-14 31-22 51-22"/></svg>
            <span class="mp-dy-st-bat"></span>
          </span>
        </div>
        <!-- 顶栏 -->
        <div class="mp-dy-nav">
          <!-- 搜索模式：返回箭头 + 搜索词条，点词条可改词重搜 -->
          <template v-if="dySearchMode">
            <button class="mp-nav-back mp-dy-back" @click="exitDySearch"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <div class="mp-dy-search-pill" @click="openDySearchInput">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
              <span class="mp-dy-search-pill-txt">{{ dySearchQuery }}</span>
            </div>
            <span v-if="dyVisibleFeed.length" class="mp-dy-progress">{{ dyCurrentPos }}/{{ dyVisibleFeed.length }}</span>
          </template>
          <template v-else>
            <button class="mp-nav-back mp-dy-back" @click="goHome"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <div class="mp-dy-tabs">
              <span v-if="!dyR18" class="mp-dy-tab-dim">直播</span>
              <span v-if="!dyR18" class="mp-dy-tab-dim">商城</span>
              <button :class="['mp-dy-tab', {on: dyTab==='关注'}]" @click="switchDyTab('关注')">关注</button>
              <button :class="['mp-dy-tab', {on: dyTab==='推荐'}]" @click="switchDyTab('推荐')">推荐</button>
              <button v-if="dyR18" :class="['mp-dy-tab','mp-dy-tab-pv', {on: dyTab==='私密'}]" @click="switchDyTab('私密')">私密</button>
            </div>
            <svg class="mp-dy-search-ico" viewBox="0 0 24 24" @click="openDySearchInput"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
            <span v-if="dyVisibleFeed.length" class="mp-dy-progress">{{ dyCurrentPos }}/{{ dyVisibleFeed.length }}</span>
          </template>
        </div>
        <!-- 视频流 -->
        <div class="mp-dy-feed" ref="dyFeedEl" @scroll.passive="onDyScroll">
          <!-- 关注tab正在直播的人头像条 -->
          <div v-if="dyTab==='关注' && !dySearchMode && dyLiveInFollowed.length" class="mp-dy-live-strip">
            <div v-for="lv in dyLiveInFollowed" :key="lv._i" class="mp-dy-ls-item" @click="enterDyLiveRoom(lv._i)">
              <div class="mp-dy-ls-ava">{{ (lv.creator||'?').slice(0,1).toUpperCase() }}<span class="mp-dy-ls-dot">●</span></div>
              <span class="mp-dy-ls-name">{{ lv.creator }}</span>
            </div>
          </div>
          <!-- 空状态：关注tab无关注对象时只引导、不生成 -->
          <div v-if="!dyVisibleFeed.length && !generatingDy" class="mp-dy-slide mp-dy-empty" @click="(!dySearchMode && dyTab==='关注' && !dyFollows.size) ? null : generateDyVideo()">
            <div class="mp-dy-empty-ico"><svg viewBox="0 0 24 24" style="width:48px;height:48px"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></div>
            <div class="mp-dy-empty-txt">{{ dySearchMode ? ('没找到「'+dySearchQuery+'」相关内容，点击重试') : (dyTab==='关注' && !dyFollows.size) ? '还没关注任何人，去推荐里关注几个吧' : dyTab==='关注' ? '点击刷新关注的作者' : dyTab==='私密' ? '点击看看谁私发了东西给你' : '点击开始刷视频' }}</div>
          </div>
          <div v-if="!dyVisibleFeed.length && generatingDy" class="mp-dy-slide mp-dy-loading">
            <div class="mp-dy-spinner"><span></span><span></span><span></span></div>
            <div class="mp-dy-load-txt">正在为你推荐…</div>
          </div>
          <!-- 视频卡片列表 -->
          <div v-for="(v, vi) in dyVisibleFeed" :key="v._i" class="mp-dy-slide">
            <div class="mp-dy-grad-top"></div>
            <div class="mp-dy-grad-bot"></div>
            <!-- 占位卡：正在生成 -->
            <template v-if="v.pending">
              <div class="mp-dy-ph">
                <div class="mp-dy-spinner"><span></span><span></span><span></span></div>
                <div class="mp-dy-load-txt">正在为你推荐…</div>
              </div>
            </template>
            <template v-else>
            <!-- 直播卡：点击进入直播间 -->
            <template v-if="v.type==='live'">
              <div class="mp-dy-live-content">{{ v.content }}</div>
              <button class="mp-dy-live-enter" @click.stop="enterDyLiveRoom(v._i)">
                <svg viewBox="0 0 24 24" class="mp-dy-live-enter-ico"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                点击进入直播间
              </button>
              <div class="mp-dy-info">
                <div class="mp-dy-live-badge">● 直播中</div>
                <div class="mp-dy-creator-row">
                  <span class="mp-dy-creator-name">@{{ v.creator }}</span>
                  <span v-if="v.verified" class="mp-dy-verified">✓</span>
                  <button v-if="!v.isFollowing" class="mp-dy-follow-btn" @click.stop="toggleDyFollow(v._i)">关注</button>
                  <span v-else class="mp-dy-followed" @click.stop="toggleDyFollow(v._i)">已关注</span>
                </div>
                <div class="mp-dy-caption">{{ v.title }}</div>
                <div class="mp-dy-sound-row"><span class="mp-dy-note-ico">👁</span><span class="mp-dy-sound-name">{{ v.viewers }} 在线</span></div>
              </div>
              <div class="mp-dy-mute" @click.stop="dyMuted=!dyMuted">
                <svg v-if="dyMuted" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63m2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21L21 19.73l-9-9zM12 4L9.91 6.09L12 8.18z"/></svg>
                <svg v-else viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77"/></svg>
                <span>{{ dyMuted ? '取消静音' : '静音中' }}</span>
              </div>
            </template>
            <!-- 普通视频卡 -->
            <template v-else>
            <!-- 画面文字：左右对称，超出可滚动；抖阴公开流可点击翻转看私密版 -->
            <div class="mp-dy-content" :class="{ flip: dyFlipped[v._i] }" @click="v.pcontent && toggleDyFlip(v._i)">
              <div class="mp-dy-content-in">{{ dyFlipped[v._i] && v.pcontent ? v.pcontent : v.content }}</div>
              <div v-if="v.pcontent" class="mp-dy-flip-hint">{{ dyFlipped[v._i] ? '· 私密版 · 点击收起' : '· 点击查看只给你的私密版 ·' }}</div>
            </div>
            <!-- 弹幕带：独立区域，不压文字 -->
            <div class="mp-dy-dm-band">
              <span v-for="dm in (douyinIdx===v._i ? activeDanmaku : [])" :key="dm.k" class="mp-dy-dm" :style="{ top: dm.top+'px', animationDuration: dm.dur+'s' }">{{ dm.text }}</span>
            </div>
            <div class="mp-dy-info">
              <div class="mp-dy-creator-row">
                <span class="mp-dy-creator-name">@{{ v.creator }}</span>
                <span v-if="v.verified" class="mp-dy-verified">✓</span>
                <button v-if="!v.isFollowing" class="mp-dy-follow-btn" @click.stop="toggleDyFollow(v._i)">关注</button>
                <span v-else class="mp-dy-followed" @click.stop="toggleDyFollow(v._i)">已关注</span>
              </div>
              <div class="mp-dy-caption">{{ v.caption }}</div>
              <div class="mp-dy-sound-row"><span class="mp-dy-note-ico">♪</span><span class="mp-dy-sound-name">{{ v.sound }}</span></div>
            </div>
            <div class="mp-dy-actions">
              <div class="mp-dy-ava-wrap">
                <div class="mp-dy-ava">{{ (v.creator||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
                <div v-if="!v.isFollowing" class="mp-dy-ava-plus" @click.stop="toggleDyFollow(v._i)">+</div>
              </div>
              <button class="mp-dy-act-btn" :class="{on:v.isLiked}" @click.stop="toggleDyLike(v._i)">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
                <span>{{ v.likes }}</span>
              </button>
              <button class="mp-dy-act-btn" @click.stop="openDyComments(v._i)">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                <span>{{ v.commentCount }}</span>
              </button>
              <button class="mp-dy-act-btn" :class="{star:v.isSaved}" @click.stop="toggleDySave(v._i)">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41l-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"/></svg>
                <span>{{ v.saves || '收藏' }}</span>
              </button>
              <button class="mp-dy-act-btn" @click.stop>
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.51 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.3 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                <span>{{ v.shares }}</span>
              </button>
            </div>
            <div class="mp-dy-mute" @click.stop="dyMuted=!dyMuted">
              <svg v-if="dyMuted" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63m2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21L21 19.73l-9-9zM12 4L9.91 6.09L12 8.18z"/></svg>
              <svg v-else viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77"/></svg>
              <span>{{ dyMuted ? '取消静音' : '静音中' }}</span>
            </div>
            </template>
            </template>
          </div>
          <!-- 尾部常驻滑块：只在没有pending占位卡、没在生成时作为「下一个」落点 -->
          <div v-if="dyVisibleFeed.length && !generatingDy" class="mp-dy-slide mp-dy-next" @click="generateDyVideo">
            <div class="mp-dy-next-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)"/></svg></div>
            <div class="mp-dy-load-txt">上划或点击，看下一个</div>
          </div>
        </div>
        <!-- 上划提示：只在当前是最后一条真实视频、且没在生成时出现 -->
        <div v-if="dyVisibleFeed.length && !showDyComments && !generatingDy && douyinIdx === dyVisibleFeed[dyVisibleFeed.length-1]?._i" class="mp-dy-swipe-hint">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)"/></svg>
        </div>
        <!-- 底部导航 -->
        <div class="mp-dy-tabbar">
          <button class="mp-dy-tb on">首页</button>
          <button class="mp-dy-tb" @click="showToast('该功能暂未开放')">朋友</button>
          <button class="mp-dy-tb mp-dy-tb-add" @click="showToast('该功能暂未开放')"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg></button>
          <button class="mp-dy-tb" @click="showToast('该功能暂未开放')">消息</button>
          <button class="mp-dy-tb" @click="showDyHistory=true">我</button>
        </div>
        <!-- 评论弹层 -->
        <div v-if="showDyComments" class="mp-dy-cm-overlay" @click.self="showDyComments=false">
          <div class="mp-dy-cm-sheet">
            <div class="mp-dy-cm-handle"></div>
            <div class="mp-dy-cm-hd">
              <span class="mp-dy-cm-count">{{ dyCurrentCommentClaimed }}条评论</span>
              <button class="mp-dy-cm-x" @click="showDyComments=false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12.01l-6.3-6.3l-1.42 1.42l6.3 6.29l-6.3 6.3l1.42 1.41L12 14.84l6.3 6.29l1.41-1.41l-6.29-6.3l6.29-6.29z"/></svg></button>
            </div>
            <div class="mp-dy-cm-body">
              <div v-for="(c, ci) in dyAllComments" :key="ci" class="mp-dy-cmt">
                <div class="mp-dy-cmt-ava">{{ (c.user||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
                <div class="mp-dy-cmt-main">
                  <div class="mp-dy-cmt-user">{{ c.user }}</div>
                  <div class="mp-dy-cmt-text">{{ c.text }}</div>
                  <div class="mp-dy-cmt-meta"><span>{{ c.region || '刚刚' }}</span><span class="mp-dy-cmt-reply" @click.stop="setDyReplyTo(c)">回复</span></div>
                  <!-- 楼中楼回复列表：每条回复也可以继续回复 -->
                  <div v-for="(r, ri) in (c.replies||[])" :key="'r'+ri" class="mp-dy-cmt-reply-item">
                    <div class="mp-dy-cmt-reply-ava">{{ (r.user||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
                    <div class="mp-dy-cmt-reply-body">
                      <span class="mp-dy-cmt-reply-user">{{ r.user }}</span>
                      <span v-if="r.replyTo" class="mp-dy-cmt-reply-to"> 回复 {{ r.replyTo }}</span>
                      <span class="mp-dy-cmt-reply-txt"> {{ r.text }}</span>
                      <div class="mp-dy-cmt-reply-meta">
                        <span>刚刚</span>
                        <!-- 对回复本身继续回复，接在同一 replies 里 -->
                        <span class="mp-dy-cmt-reply-btn" @click.stop="setDyReplyToFromReply(c, r)">回复</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mp-dy-cmt-lk">
                  <span class="mp-dy-cmt-lk-one" :class="{on:c.myLike}" @click.stop="toggleDyCmtLike(c)">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
                    <span>{{ c.likes }}</span>
                  </span>
                  <span class="mp-dy-cmt-lk-one" :class="{dis:c.myDis}" @click.stop="c.myDis=!c.myDis">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c.67 0 1.32.12 1.94.33L13 9.35l-4 5zM16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35l-1-7l4.5-5l-2.65-5.08C13.87 3.47 15.17 3 16.5 3"/></svg>
                  </span>
                </div>
              </div>
              <div v-if="!dyAllComments.length" class="mp-dy-cm-none">暂无评论，快来抢沙发~</div>
              <div v-else-if="dyCommentGap > 0" class="mp-dy-cm-more">共 {{ dyCurrentCommentClaimed }} 条评论，仅显示 {{ dyAllComments.length }} 条</div>
            </div>
            <div class="mp-dy-cm-input">
              <div v-if="dyReplyTo" class="mp-dy-cm-reply-bar">回复 @{{ dyReplyTo }}<span @click="dyReplyTo='';dyReplyParent=null" class="mp-dy-cm-reply-x">✕</span></div>
              <input class="mp-dy-cm-in" v-model="dyCommentDraft" :placeholder="dyReplyTo ? '回复 @'+dyReplyTo : '善语结善缘，恶言伤人心'" @keydown.enter.prevent="submitDyComment" />
              <span class="mp-dy-cm-ic">@</span>
              <span class="mp-dy-cm-ic">☺</span>
              <button v-if="dyCommentDraft.trim()" class="mp-dy-cm-send" @click="submitDyComment">发送</button>
            </div>
          </div>
        </div>
        <!-- 「我」·观看历史 -->
        <div v-if="showDyHistory" class="mp-dyh">
          <div class="mp-dyh-hd">
            <button class="mp-nav-back" @click="showDyHistory=false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <span class="mp-dyh-title">观看历史</span>
            <span></span>
          </div>
          <div class="mp-dyh-body">
            <div v-if="!dyHistory.length" class="mp-dyh-none">还没有观看记录</div>
            <div v-for="(h, hi) in dyHistory" :key="hi" class="mp-dyh-item" @click="openDyFromHistory(h)">
              <div class="mp-dyh-thumb" :class="{ pv: h.vis==='private' }">{{ (h.creator||'?').slice(0,1).toUpperCase() }}</div>
              <div class="mp-dyh-info">
                <div class="mp-dyh-author">@{{ h.creator }}<span v-if="h.vis==='private'" class="mp-dyh-pvtag">私密</span></div>
                <div class="mp-dyh-txt">{{ h.content }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 搜索输入层 -->
        <div v-if="showDySearchInput" class="mp-dys">
          <div class="mp-dys-top">
            <button class="mp-nav-back" @click="closeDySearchInput"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <div class="mp-dys-box">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
              <input class="mp-dys-in" v-model="dySearchDraft" placeholder="搜索你感兴趣的内容" @keydown.enter.prevent="submitDySearch" />
              <button v-if="dySearchDraft.trim()" class="mp-dys-clr" @click="dySearchDraft=''">✕</button>
            </div>
            <button class="mp-dys-btn" @click="submitDySearch">搜索</button>
          </div>
          <div class="mp-dys-scroll">
            <div v-if="dyRecentSearches.length" class="mp-dys-recent">
              <div class="mp-dys-recent-hd">最近搜索</div>
              <div class="mp-dys-chips">
                <span v-for="q in dyRecentSearches" :key="q" class="mp-dys-chip" @click="runDySearch(q)">
                  {{ q }}<i class="mp-dys-chip-x" @click.stop="removeRecentSearch(q)">✕</i>
                </span>
              </div>
            </div>
            <!-- 热榜 -->
            <div class="mp-dys-hot">
              <div class="mp-dys-hot-hd">
                <span class="mp-dys-hot-title">{{ dyR18 ? '抖阴热榜' : '抖音热榜' }}</span>
                <button class="mp-dys-hot-refresh" :class="{spin:generatingHot}" @click="generateDyHotList" :disabled="generatingHot">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"/></svg>
                </button>
              </div>
              <div v-if="generatingHot && !dyHotShown.length" class="mp-dys-hot-loading">正在加载热榜…</div>
              <div v-else-if="!dyHotShown.length" class="mp-dys-hot-empty">点击右上角 ↻ 刷新，加载{{ dyR18 ? '抖阴' : '抖音' }}热榜</div>
              <div v-else class="mp-dys-hot-list">
                <div v-for="(h, hi) in dyHotShown" :key="hi" class="mp-dys-hot-row" @click="runDySearch(h.topic)">
                  <span class="mp-dys-hot-rank" :class="{top:hi<3}">{{ hi+1 }}</span>
                  <span class="mp-dys-hot-topic">{{ h.topic }}</span>
                  <span v-if="h.heat" class="mp-dys-hot-heat">{{ h.heat }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 直播间全屏 overlay（对照截图真实结构） -->
        <div v-if="dyLiveRoom" class="mp-dylv">
          <!-- 顶部：主播信息 + 关注 + 在线人数 + 关闭 -->
          <div class="mp-dylv-top">
            <div class="mp-dylv-who">
              <div class="mp-dylv-ava">{{ (dyLiveRoom.creator||'?').slice(0,1).toUpperCase() }}</div>
              <div class="mp-dylv-info">
                <div class="mp-dylv-name-row">
                  <span v-if="curFan" class="mp-dylv-fan" :style="{background: levelColor(curFan.level)}">{{ curFan.level }}</span>
                  <span class="mp-dylv-name">{{ dyLiveRoom.creator }}<span v-if="dyLiveRoom.verified" class="mp-dy-verified">✓</span></span>
                </div>
                <span class="mp-dylv-likes">直播中 · {{ dyLiveRoom.liveLikes }} 点赞</span>
              </div>
              <button v-if="!dyLiveRoom.isFollowing" class="mp-dylv-follow" @click="toggleDyFollowFromLive">关注</button>
              <span v-else class="mp-dylv-following">已关注</span>
            </div>
            <div class="mp-dylv-viewers">
              <div class="mp-dylv-vw-avas">
                <span v-for="v in dyLiveViewers" :key="v.name" class="mp-dylv-vw-ava" :style="{background: v.level > 0 ? levelColor(v.level) : ''}">{{ v.name.slice(0,1).toUpperCase() }}</span>
              </div>
              <span class="mp-dylv-vw-cnt">{{ dyLiveRoom.viewers }}</span>
            </div>
            <button class="mp-dylv-x" @click="closeDyLiveRoom"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12.01l-6.3-6.3l-1.42 1.42l6.3 6.29l-6.3 6.3l1.42 1.41L12 14.84l6.3 6.29l1.41-1.41l-6.29-6.3l6.29-6.29z"/></svg></button>
          </div>
          <!-- 直播内容区 -->
          <div class="mp-dylv-screen">
            <div class="mp-dylv-screen-txt">{{ dyLiveRoom.content }}</div>
          </div>
          <!-- 聊天流区域 -->
          <div class="mp-dylv-chat" ref="dyLiveChatEl">
            <div v-for="(msg, mi) in dyLiveRoom.chatLog" :key="mi" class="mp-dylv-msg" :class="{'mp-dylv-msg-join': msg.isJoin, 'mp-dylv-msg-me': msg.isMe, 'mp-dylv-msg-gift': msg.isGift || msg.isLevelUp}">
              <template v-if="msg.isJoin"><span class="mp-dylv-join-txt">{{ msg.user }} 来了</span></template>
              <template v-else>
                <!-- user自己的消息恒用真实粉丝团等级（避免AI伪造等级污染显示） -->
                <span v-if="msg.isMe && curFan" class="mp-dylv-lv" :style="{background: levelColor(curFan.level)}">{{ curFan.level }}</span>
                <span v-else-if="!msg.isMe && msg.level != null" class="mp-dylv-lv" :style="{background: levelColor(msg.level)}">{{ msg.level }}</span>
                <span class="mp-dylv-user">{{ msg.user }}：</span>
                <span class="mp-dylv-txt">{{ msg.text }}</span>
              </template>
            </div>
            <div v-if="generatingLiveChat" class="mp-dylv-loading">
              <span></span><span></span><span></span>
            </div>
          </div>
          <!-- 底部输入栏 -->
          <div class="mp-dylv-bar">
            <div class="mp-dylv-input-row">
              <input class="mp-dylv-in" v-model="dyLiveChatDraft" :placeholder="dyLiveReplyTo ? '回复 @'+dyLiveReplyTo : '说点什么...'" @keydown.enter.prevent="submitLiveChat" />
              <button class="mp-dylv-heart" @click.stop="sendLiveHeart" :title="curFan ? '粉丝团 '+curFan.level+' 级' : '加入粉丝团'">{{ curFan ? '💖' : '🤍' }}</button>
              <button class="mp-dylv-gift" @click.stop="openGiftPanel">🎁</button>
              <button class="mp-dylv-share" @click.stop="showToast('转发功能即将上线')">↗️</button>
            </div>
          </div>
          <!-- 礼物面板 -->
          <div v-if="showGiftPanel" class="mp-dylv-gp-mask" @click.self="showGiftPanel=false">
            <div class="mp-dylv-gp">
              <div class="mp-dylv-gp-hd">
                <span class="mp-dylv-gp-title">送礼物</span>
                <span class="mp-dylv-gp-bal">💎 {{ dyDiamond }} <button class="mp-dylv-gp-recharge" @click.stop="showRecharge=!showRecharge">{{ showRecharge ? '▾ 充值' : '充值' }}</button></span>
              </div>
              <!-- 充值面板（多档 + 自定义） -->
              <div v-if="showRecharge" class="mp-dylv-rc">
                <div class="mp-dylv-rc-hint">1 元 = 10 钻（演示）</div>
                <div class="mp-dylv-rc-btns">
                  <button v-for="n in DY_RECHARGE" :key="n" class="mp-dylv-rc-btn" @click="rechargeDiamond(n)">¥{{ n }}<br><span>+{{ n*10 }}钻</span></button>
                </div>
                <div class="mp-dylv-rc-custom">
                  <input class="mp-dylv-rc-in" type="number" min="1" v-model="rechargeDraft" placeholder="自定义金额（元）" @keydown.enter.prevent="applyRechargeDraft" />
                  <button class="mp-dylv-rc-ok" @click="applyRechargeDraft">确认</button>
                </div>
              </div>
              <div class="mp-dylv-gp-grid">
                <button v-for="g in DY_GIFTS" :key="g.k" class="mp-dylv-gp-item" :class="{dis: dyDiamond < g.price}" @click="sendGift(g)">
                  <span class="mp-dylv-gp-ico">{{ g.icon }}</span>
                  <span class="mp-dylv-gp-name">{{ g.name }}</span>
                  <span class="mp-dylv-gp-price">💎{{ g.price }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
const SILENT_KEY = 'phone_silent'      // 纯手机模式开关，按 app 存：{ 微信: true, 相机: true, ... }
const PHOTO_KEY = 'photo_album'        // 相册存储 key
const HIST_KEY = 'phone_hist_limit'    // 纯手机模式带入的历史消息条数
const HIST_OPTIONS = [24, 48, 100, 200]
const histLimit = ref(48)
const CUR_APP = '微信'                  // 目前只有微信 app，将来加 QQ/B站等在此扩展
const logs = ref({})
const unread = ref({})
const deleted = ref({})
const silentMap = ref({})              // { app名: bool }
const silent = computed(() => !!silentMap.value[CUR_APP])   // 当前微信 app 的纯手机模式
const showSettings = ref(false)        // 微信内设置页
const showPhoneSettings = ref(false)   // 主屏设置 app（各 app 总控）
const view = ref('home')
const wxTab = ref('chats')
const discoverView = ref('list')
const activeContact = ref('')
const draft = ref('')
const ctxMenu = ref(null)
// 抖音
const DY_FEED_KEY = 'jdnl_dy_feed'
const DY_IDX_KEY = 'jdnl_dy_idx'
const DY_SETTINGS_KEY = 'jdnl_dy_settings'
const DY_IDXMAP_KEY = 'jdnl_dy_idxmap'   // 各tab独立记忆的当前下标
const DY_HOT_KEY = 'jdnl_dy_hot'         // 热榜缓存 { mode, list:[{topic,heat}] }
// content 是公开画面；pcontent 只在抖阴公开流要求，是点文字翻转后只给user看的私密版
const DY_FORMAT_BASE = `creator:创作者抖音号（不带@，6字内）
verified:true或false（是否蓝V认证）
caption:视频文案（20字内，可带#话题）
sound:配乐（歌名-歌手，或"原声-创作者号"）
likes:点赞数（如 1.2万 / 888）
comments:评论数
shares:分享数
saves:收藏数
content:视频画面内容，2-3句，第三人称客观描述镜头里发生了什么，有画面感与临场感
danmaku:弹幕1|弹幕2|弹幕3|弹幕4（观众即时反应，短促口语，4-6条）
c1:评论者号|||评论内容|||赞数|||地区（如 浙江/广东/未知）
c2:评论者号|||评论内容|||赞数|||地区
（评论按内容热度自然给：热门视频可给到 c6，冷门或私密内容给 1~2 条甚至留空。别机械凑满，条数要像真实评论区。最多支持到 c6。）
c3:评论者号|||评论内容|||赞数|||地区
c4:评论者号|||评论内容|||赞数|||地区
c5:评论者号|||评论内容|||赞数|||地区
c6:评论者号|||评论内容|||赞数|||地区`
// 直播卡生成格式（type:'live'）
const DY_LIVE_FORMAT = `creator:主播抖音号（不带@，6字内）
verified:true或false
title:直播标题（15字内，有吸引力）
viewers:当前在线人数（如 1929 / 2.3万）
content:当前直播画面描述（2-3句，主播在做什么，有临场感）
chat1:等级数字|||昵称|||内容（或者末尾加|||join表示进场消息如"来了"）
chat2:等级数字|||昵称|||内容
chat3:等级数字|||昵称|||内容
chat4:等级数字|||昵称|||内容
chat5:等级数字|||昵称|||内容
chat6:等级数字|||昵称|||内容
chat7:等级数字|||昵称|||内容
chat8:等级数字|||昵称|||内容`
const douyinFeed = ref([])
const douyinIdx = ref(0)
const douyinSettings = ref({ mode: 'normal' })
const dyStrangerPct = ref(0)             // 私密页陌生美女占比，默认0（全红颜私发）
const DY_STRANGER_OPTIONS = [0, 25, 50, 75, 100]
const dyIdxMap = ref({ 推荐: 0, 关注: 0, 私密: 0 })   // 各tab记住看到哪条(_i)
const dyTab = ref('推荐')
const showDyComments = ref(false)
const dyCommentIdx = ref(0)
const dyCommentDraft = ref('')
const generatingDy = ref(false)
const activeDanmaku = ref([])
const dyFeedEl = ref(null)
const dyMuted = ref(true)
let dmTimer = null
const dyFollows = ref(new Set())          // 已关注作者名单，独立于feed，不随50条上限淘汰
let dyLastGenMs = 0                       // 防止scroll连续触发生成的冷却时间戳
let dyScrollTimer = null                  // scroll防抖定时器
let dySuppressScroll = false              // 程序性改动列表/滚动时，抑制onDyScroll触发生成
let dySuppressTimer = null
function suppressDyScroll(ms = 500) { dySuppressScroll = true; clearTimeout(dySuppressTimer); dySuppressTimer = setTimeout(() => { dySuppressScroll = false }, ms) }
const dyFlipped = ref({})                 // { _i: true } 该视频文字已翻转到私密版
const showDyHistory = ref(false)          // 「我」页观看历史弹层
const dySearchMode = ref(false)           // 搜索结果流是否激活（独立于推荐/关注/私密三tab）
const dySearchQuery = ref('')             // 当前搜索关键词
const dySearchDraft = ref('')             // 搜索输入框草稿
const showDySearchInput = ref(false)      // 搜索输入层是否展开
const dyRecentSearches = ref([])          // 最近搜索关键词，供点击重搜
const DY_SEARCHES_KEY = 'jdnl_dy_searches'
const dyHotList = ref([])                 // 热榜条目 [{topic,heat}]
const dyHotMode = ref('')                 // 当前热榜是哪个模式生成的(normal/r18)，切模式要重出
const generatingHot = ref(false)
// 直播（阶段C重构：直播融入视频流，不再独立广场页）
const dyLivePct = ref(15)                // 推荐/关注流里直播卡出现的概率(%)，默认15
const DY_LIVE_PCT_OPTIONS = [0, 10, 15, 30]
const livePctDraft = ref('')
const dyLiveRoom = ref(null)             // 当前打开的直播间 {creator,verified,title,viewers,liveLikes,content,chatLog,isFollowing,feedIdx}
const dyLiveChatEl = ref(null)           // 聊天滚动容器
const dyLiveChatDraft = ref('')          // 聊天输入草稿
const dyLiveReplyTo = ref('')            // 正在回复的用户名
const generatingLiveChat = ref(false)
const dyChatBatch = ref(50)              // 每批生成的直播聊天条数（默认50，token宽松）
const DY_CHAT_BATCH_OPTIONS = [30, 50, 80]
const chatBatchDraft = ref('')
// 粉丝团：{ 主播号: { level, exp } }，送礼加exp升级；等级标志每10级换渐变
const DY_FAN_KEY = 'jdnl_dy_fanclub'
const dyFanClub = ref({})
// 钻石余额（假充值）
const DY_DIAMOND_KEY = 'jdnl_dy_diamond'
const dyDiamond = ref(1000)
// 礼物面板 / 充值面板
const showGiftPanel = ref(false)
const showRecharge = ref(false)
const rechargeDraft = ref('')
const DY_GIFTS = [
  { k: 'rose', icon: '🌹', name: '玫瑰', price: 10, exp: 10 },
  { k: 'heart', icon: '💗', name: '小心心', price: 30, exp: 30 },
  { k: 'star', icon: '⭐', name: '星星', price: 66, exp: 66 },
  { k: 'ice', icon: '🍦', name: '甜筒', price: 99, exp: 99 },
  { k: 'cake', icon: '🎂', name: '生日蛋糕', price: 188, exp: 188 },
  { k: 'perfume', icon: '💐', name: '花束', price: 366, exp: 366 },
  { k: 'ring', icon: '💍', name: '钻戒', price: 520, exp: 520 },
  { k: 'crown', icon: '👑', name: '皇冠', price: 999, exp: 999 },
  { k: 'car', icon: '🏎️', name: '跑车', price: 1314, exp: 1314 },
  { k: 'yacht', icon: '🛥️', name: '游艇', price: 3344, exp: 3344 },
  { k: 'castle', icon: '🏰', name: '梦幻城堡', price: 8888, exp: 8888 },
  { k: 'carnival', icon: '🎡', name: '嘉年华', price: 19999, exp: 19999 },
  { k: 'rocket', icon: '🚀', name: '火箭', price: 28888, exp: 28888 },
  { k: 'planet', icon: '🪐', name: '星球', price: 52000, exp: 52000 },
]
const DY_RECHARGE = [6, 30, 98, 198, 328, 648]   // 充值档位（钻石=元数×10 演示）
// 视频评论回复
const dyReplyTo = ref('')                // 正在回复的评论用户名（可以是评论者或回复者）
const dyReplyParent = ref(null)          // 对回复再回复时的父评论对象（null=直接对一级评论回复）
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
const silentBusy = ref(false)          // 纯手机模式生成中，抑制 onGenEnded 通用回收
// 相机 / 相册 / 壁纸状态
const photos = ref([])                 // 相册：{ 拍摄者, 对象, 时间, 画面, 模式 }[]
const selectedPhoto = ref(null)        // 相册详情弹层
const cameraMode = ref('普通')          // 相机拍摄模式：普通 / 透视
const cameraDraft = ref('')            // 相机输入框草稿
const showCameraSettings = ref(false)  // 相机设置面板
const sendingCamera = ref(false)       // 相机生成中
const curWallpaper = ref(localStorage.getItem('jdnl_wallpaper') || '')  // 当前壁纸URL

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

// 贴纸 & 壁纸
const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/JunLi-ZZZ/JingDaiLiuNian'
const STICKERS = {
  '你好呀': `${CDN_BASE}/assets/stickers/final/01_你好呀.png`,
  '嘿嘿':   `${CDN_BASE}/assets/stickers/final/02_嘿嘿.png`,
  '摸摸头': `${CDN_BASE}/assets/stickers/final/03_摸摸头.png`,
  '好害羞': `${CDN_BASE}/assets/stickers/final/04_好害羞.png`,
  '呜呜':   `${CDN_BASE}/assets/stickers/final/05_呜呜.png`,
  '晚安':   `${CDN_BASE}/assets/stickers/final/06_晚安.png`,
  '略略':   `${CDN_BASE}/assets/stickers/final/07_略略.png`,
  '诶':     `${CDN_BASE}/assets/stickers/final/08_诶.png`,
  '哼':     `${CDN_BASE}/assets/stickers/final/09_哼.png`,
}
const WALLPAPERS = [
  { name: '月夜', url: `${CDN_BASE}/assets/wallpapers/final/月夜_展示.png` },
]
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
// 主屏「设置」总控里可切纯手机模式的 app（将来加 QQ/B站/微博等在此登记；ready:false 为占位未上线）
const silentApps = [
  { k: '微信', l: '微信', bg: 'linear-gradient(160deg,#4ade80,#07c160)', ready: true },
  { k: '相机', l: '相机', bg: 'linear-gradient(160deg,#8b9dbb,#4a5568)', ready: true },
  { k: 'QQ', l: 'QQ', bg: 'linear-gradient(160deg,#4aa3ff,#0a72e6)', ready: false },
  { k: '微博', l: '微博', bg: 'linear-gradient(160deg,#ff9a3d,#e6482e)', ready: false },
  { k: '抖音', l: '抖音', bg: 'linear-gradient(160deg,#fe2c55,#010101)', ready: true },
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
function saveRemarks() { putVar(REMARK_KEY, remarks.value) }

function loadLogs() {
  const th = TH(); if (!th || !th.getVariables) return
  try {
    const v = th.getVariables({ type: 'chat' }) || {}
    if (v[VAR_KEY] && typeof v[VAR_KEY] === 'object') logs.value = migrate(v[VAR_KEY])
    if (v[DELETED_KEY] && typeof v[DELETED_KEY] === 'object') deleted.value = v[DELETED_KEY]
    const sv = v[SILENT_KEY]
    if (typeof sv === 'boolean') silentMap.value = { [CUR_APP]: sv }        // 旧布尔 → 迁移成按 app
    else if (sv && typeof sv === 'object') silentMap.value = sv
    const hl = +v[HIST_KEY]; if (hl > 0) histLimit.value = hl
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
// 用 replaceVariables 整体覆盖该 key，避免 insertOrAssign 深合并导致删除的联系人被旧值复活
function putVar(key, val) {
  const th = TH(); if (!th) return
  try {
    if (th.replaceVariables && th.getVariables) {
      const all = th.getVariables({ type: 'chat' }) || {}
      all[key] = val
      th.replaceVariables(all, { type: 'chat' })
    } else if (th.insertOrAssignVariables) {
      th.insertOrAssignVariables({ [key]: val }, { type: 'chat' })
    }
  } catch (e) {}
}
function saveLogs() { putVar(VAR_KEY, logs.value) }
function saveDeleted() { putVar(DELETED_KEY, deleted.value) }
function saveSilent() { putVar(SILENT_KEY, silentMap.value) }
function setHistLimit(n) { n = Math.round(+n); if (!n || n < 1) return; n = Math.min(n, 500); histLimit.value = n; putVar(HIST_KEY, n) }
function delKey(o, c) { return o + '→' + c } //+ '' + c }
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

function openWeChat() { view.value = 'wechat'; wxTab.value = 'chats'; activeContact.value = ''; discoverView.value = 'list' }function toggleSearch() { showSearch.value = !showSearch.value; showNew.value = false; if (!showSearch.value) searchQuery.value = '' }
function togglePlus() { showPlus.value = !showPlus.value; showSearch.value = false }
function startAddFriend() { showPlus.value = false; showNew.value = true; showSearch.value = false }
function goHome() {
  if (showPhoneSettings.value) { showPhoneSettings.value = false; return }
  if (showCameraSettings.value) { showCameraSettings.value = false; return }
  if (selectedPhoto.value) { selectedPhoto.value = null; return }
  if (activeContact.value) { closeContact(); return }
  if (view.value === 'douyin') { dyLiveRoom.value = null; stopDanmaku() }
  view.value = 'home'
}
const homeStyle = computed(() => curWallpaper.value ? { backgroundImage: `url(${curWallpaper.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : null)
function selectWallpaper(url) { curWallpaper.value = url; localStorage.setItem('jdnl_wallpaper', url) }
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

// 乐观写一条"发出"到自己手机并标 pending。用 sid 定位（轮询 loadLogs 会整体替换 logs.value，不能持对象引用）。失败的消息不镜像给对方。
function putPending(owner, contact, text, type, time) {
  if (!logs.value[owner]) logs.value[owner] = {}
  if (!logs.value[owner][contact]) logs.value[owner][contact] = []
  const sid = 's' + Date.now() + Math.random().toString(36).slice(2, 6)
  const msg = { dir: '发出', type: type || '文字', text, time, status: 'pending', sid }
  logs.value[owner][contact].push(msg)
  pendingRef = { owner, contact, sid }
  return sid
}
function findBySid(ref) {                       // 在当前 logs.value 里按 sid 找回那条（跨轮询替换后仍有效）
  if (!ref) return null
  const arr = logs.value[ref.owner] && logs.value[ref.owner][ref.contact]
  return arr ? arr.find(m => m.sid === ref.sid) : null
}
function markSent(ref) { const m = findBySid(ref); if (m && m.status === 'pending') { delete m.status; delete m.sid; saveLogs() } }
function markFailed(ref) { const m = findBySid(ref); if (m && m.status === 'pending') { m.status = 'failed'; saveLogs() } }
function clearPending() { markSent(pendingRef); pendingRef = null }
// 自愈：AI 没回显发出行时 pending 会一直转圈。若该会话在 pending 之后已有"收到"，说明回复到了，直接转正
function healPending() {
  if (!pendingRef || silentBusy.value) return
  const arr = logs.value[pendingRef.owner] && logs.value[pendingRef.owner][pendingRef.contact]
  if (!arr) return
  const i = arr.findIndex(m => m.sid === pendingRef.sid)
  if (i < 0) { pendingRef = null; return }              // 那条已不在（被删/被去重合并）→ 松开引用
  if (arr.slice(i + 1).some(m => m.dir === '收到')) { markSent(pendingRef); pendingRef = null }
}

function send(retryText) {
  const text = (typeof retryText === 'string' ? retryText : draft.value).trim()
  const contact = activeContact.value; const owner = curOwner.value
  if (!text || !contact || sendingContact.value) return
  const time = storyTime()
  const sid = putPending(owner, contact, text, '文字', time); saveLogs()
  const pref = { owner, contact, sid }
  if (typeof retryText !== 'string') draft.value = ''   // 重发传字符串保留草稿；正常发送(事件对象/无参)清空
  scrollDown()
  // 纯手机模式：不进正文楼层，静默让 AI 只在手机里回一段 <手机> 块（类似镜渡生成）
  if (silent.value) { silentReply(owner, contact, text, pref); return }
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
    sendTimer = setTimeout(() => { if (sendingContact.value === contact) { sendingContact.value = ''; markFailed(pref); showToast('发送超时，点消息旁的感叹号可重发') } }, 90000)
  } else {
    markFailed(pref)
    showToast('未能自动发送，点消息旁的感叹号可重发')
  }
}
function resend(msg) {
  if (!msg || sendingContact.value) return
  const arr = ownerLogs.value[activeContact.value]
  if (arr) { const i = arr.indexOf(msg); if (i >= 0) arr.splice(i, 1) }   // 删掉失败条，重走发送
  saveLogs()
  send(msg.text)
}
function openCtxMenu(i, dir) { ctxMenu.value = { idx: i, dir } }
function closeCtxMenu() { ctxMenu.value = null }
function deleteMsg() {
  const arr = ownerLogs.value[activeContact.value]
  if (arr && ctxMenu.value !== null) { arr.splice(ctxMenu.value.idx, 1); saveLogs() }
  closeCtxMenu()
}
function recallMsg() {
  const arr = ownerLogs.value[activeContact.value]
  if (arr && ctxMenu.value !== null) {
    const orig = arr[ctxMenu.value.idx]
    arr.splice(ctxMenu.value.idx, 1, { dir: '系统', type: '系统', text: '你撤回了一条消息', time: orig.time })
    saveLogs()
  }
  closeCtxMenu()
}
function resendCtx() {
  const arr = ownerLogs.value[activeContact.value]
  if (arr && ctxMenu.value !== null) {
    const msg = { ...arr[ctxMenu.value.idx] }
    arr.splice(ctxMenu.value.idx, 1)
    resend(msg)
  }
  closeCtxMenu()
}

// 剥掉推理模型的思维链，避免思维链里出现的 <手机> 或文字被当成消息
function stripReasoning(s) {
  return String(s)
    .replace(/<(think|thinking|reasoning|thought|thoughts|antml:thinking)[\s\S]*?<\/\1>/gi, '')  // 成对思维链标签
    .replace(/^[\s\S]*?<\/(?:think|thinking|reasoning|thought|thoughts)>/i, '')                   // 只有闭合标签（开头思维链）
    .trim()
}
// 从 AI 回复文本里抽取 <手机> 块的体行，写进双方手机；返回落库消息数
function ingestPhoneReply(replyText, owner, contact, time) {
  const clean = stripReasoning(replyText)
  const blocks = clean.match(/<手机[^>]*>([\s\S]*?)<\/手机>/gi) || []
  let n = 0
  const handle = blob => {
    blob.split(/(?=(?:发出|收到)\|)/).forEach(line => {
      const ln = line.trim(); if (!ln) return
      const f = ln.split('|'); if (f.length < 3) return
      const dir = f[0].trim(), type = (f[1] || '文字').trim() || '文字', tx = f.slice(2).join('|').trim()
      if (!dir || !tx || (dir !== '发出' && dir !== '收到')) return
      if (putBoth(owner, contact, { dir, type, text: tx, time })) n++
    })
  }
  if (blocks.length) {
    blocks.forEach(b => {
      const inner = b.replace(/<手机[^>]*>|<\/手机>/gi, '')
      const bodyStart = inner.search(/(?:发出|收到)\|/)
      handle(bodyStart >= 0 ? inner.slice(bodyStart) : inner)   // 跳过块内的 机主:/联系人:/时间: 头
    })
  } else {
    // 没抓到规范块：仅当剩余是一小段干净短文本时才当一条回复，避免把思维链/长旁白整段塞进来
    const txt = clean.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (txt && txt.length <= 200 && !/[\r\n]/.test(clean.trim())) {
      if (putBoth(owner, contact, { dir: '收到', type: '文字', text: txt, time })) n++
    }
  }
  return n
}

// 手机一条消息转成给 AI 看的文字：非文字类型标注出来
function msgToLine(m) {
  const t = m.type && m.type !== '文字' ? `[${m.type}]` : ''
  return t + (m.type === '表情' ? stickerFallback(m.text) : (m.text || ''))
}
// 纯手机模式上下文：合并为单条 system 字符串，避免 ordered_prompts 处理多对象时兼容问题
function buildSilentHistory(owner, contact) {
  // 手机对话历史条数可在设置里调（默认 48）
  const arr = ((logs.value[owner] && logs.value[owner][contact]) || []).filter(m => m.status !== 'failed')
  const recent = arr.slice(-histLimit.value)
  if (!recent.length) return []
  const ownerLabel = owner === meName.value ? meName.value : owner
  let ctx = `【${ownerLabel}与${contact}的手机聊天记录】\n`
  ctx += recent.map(m => m.dir === '系统' ? `（${m.text}）` : (m.dir === '发出' ? ownerLabel : contact) + '：' + msgToLine(m)).join('\n')
  return [{ role: 'system', content: ctx.trim() }]
}

async function silentReply(owner, contact, myText, pref) {
  const th = TH()
  if (!th || (!th.generateRaw && !th.generate)) { markFailed(pref); showToast('当前环境不支持纯手机模式生成'); return }
  silentBusy.value = true
  sendingContact.value = contact
  clearTimeout(sendTimer)
  sendTimer = setTimeout(() => { if (sendingContact.value === contact) { sendingContact.value = ''; markFailed(pref); showToast('等待回复超时，点消息旁的感叹号可重发') } }, 90000)
  const ownerLabel = owner === meName.value ? `${meName.value}（我）` : owner
  const instruction =
    `【纯手机模式·仅手机回复】现在只模拟一次手机聊天，不要输出任何正文、旁白、场景或动作描写。` +
    `这是机主「${ownerLabel}」的手机，${ownerLabel}刚给「${contact}」发送了：「${myText}」。` +
    `请以「${contact}」的身份、结合下方手机聊天记录与其性格、当前处境，回复这条消息。` +
    `按以下格式输出一个 <手机> 块，块外不写任何其它文字：\n` +
    `<手机>\n机主: ${owner}\n联系人: ${contact}\n时间: YYYY年MM月DD日 HH:MM\n发出|文字|${myText}\n收到|文字|${contact}回复的内容\n</手机>\n` +
    `第一行固定是「发出|文字|${myText}」（原样复制，这是机主刚发出的那条消息）；之后是「${contact}」的一条或多条回复，方向一律写「收到」。` +
    `联系人填名录全名、与角色名录一致，不用昵称/简称/代称；时间用绝对格式、与世界当前时间一致；每条消息占一行写作「方向|类型|内容」，类型据实取 文字/语音/图片/表情/红包 之一，非文字类型时内容处写这条消息承载的信息（图片写画面，语音写说出的话，表情写[表情:名称]，红包写祝福语）；可回复多条，按先后顺序排列。模仿真实微信的随意性：消息条数、长度、类型自然多样，避免每次都是固定的句式或格式。`
  try {
    const history = buildSilentHistory(owner, contact)
    let result
    if (th.generateRaw) {
      const ordered = [
        { role: 'system', content: instruction },
        'persona_description',
        'char_description',
        'world_info_before',
        'world_info_after',
        ...history,
        { role: 'user', content: `以「${contact}」身份回消息，只输出一个 <手机> 块，块外不写任何其它文字：\n<手机>\n机主: ${owner}\n联系人: ${contact}\n时间: YYYY年MM月DD日 HH:MM\n发出|文字|${myText}\n收到|文字|${contact}回复的内容\n</手机>` },
      ]
      result = await th.generateRaw({
        user_input: `以「${contact}」身份回消息，只输出一个 <手机> 块。`,
        should_silence: true,
        ordered_prompts: ordered,
      })
    } else {
      result = await th.generate({
        user_input: instruction,
        should_silence: true,
        overrides: { chat_history: { with_depth_entries: false, prompts: history } },
      })
    }
    const replyText = typeof result === 'string' ? result : (result && result.content) || ''
    markSent(pref)   // 生成成功返回：把乐观写的发出条转正
    const got = ingestPhoneReply(replyText, owner, contact, storyTime())
    saveLogs(); scrollDown()
    if (!got) showToast('未能解析到手机回复')
  } catch (e) {
    markFailed(pref)
    showToast('生成失败：' + ((e && e.message) || e))
  } finally {
    if (sendingContact.value === contact) { sendingContact.value = ''; clearTimeout(sendTimer) }
    silentBusy.value = false
  }
}
function toggleSilentApp(app) { silentMap.value = { ...silentMap.value, [app]: !silentMap.value[app] }; saveSilent() }
function toggleSilent() { toggleSilentApp(CUR_APP) }

// ---- 相册 ----
function loadPhotos() {
  const th = TH(); if (!th || !th.getVariables) return
  try { const v = th.getVariables({ type: 'chat' }) || {}; if (Array.isArray(v[PHOTO_KEY])) photos.value = v[PHOTO_KEY] } catch (e) {}
}
function savePhotos() { putVar(PHOTO_KEY, photos.value) }
function syncScrapePhotos() {
  const spans = doc.querySelectorAll('[class*="photo-data"]')
  if (!spans.length) return
  let changed = false
  spans.forEach(span => {
    const raw = (span.textContent || '').trim(); if (!raw) return
    const parts = raw.split('|||')
    if (parts.length < 4) return
    const shooter = parts[0].trim(), target = parts[1].trim(), time = parts[2].trim(), caption = parts[3].trim()
    if (!caption) return
    const sig = shooter + '|' + target + '|' + time + '|' + caption
    if (!photos.value.some(p => p.拍摄者 + '|' + p.对象 + '|' + p.时间 + '|' + p.画面 === sig)) {
      photos.value.push({ 拍摄者: shooter, 对象: target, 时间: time, 画面: caption, 模式: '普通' })
      changed = true
    }
  })
  if (changed) savePhotos()
}
function ingestPhotoBlock(text, mode) {
  const blocks = text.match(/<照片[^>]*>([\s\S]*?)<\/照片>/gi) || []
  let n = 0
  blocks.forEach(b => {
    const inner = b.replace(/<照片[^>]*>|<\/照片>/gi, '')
    const get = key => { const m = inner.match(new RegExp(key + '[：:]\\s*([^\\n]*)')) ; return m ? m[1].trim() : '' }
    const caption = get('画面'); if (!caption) return
    const sig = get('拍摄者') + '|' + get('对象') + '|' + get('时间') + '|' + caption
    if (!photos.value.some(p => p.拍摄者 + '|' + p.对象 + '|' + p.时间 + '|' + p.画面 === sig)) {
      photos.value.push({ 拍摄者: get('拍摄者'), 对象: get('对象'), 时间: get('时间') || storyTime(), 画面: caption, 模式: mode || '普通' })
      n++
    }
  })
  if (n) savePhotos()
  return n
}

// ---- 抖音 ----
const currentDyVideo = computed(() => douyinFeed.value[douyinIdx.value] || null)
const dyR18 = computed(() => douyinSettings.value.mode === 'r18')
// 带原始下标的可见列表
// 推荐=公开流；私密=私密流；关注=所有已关注作者(含红颜私密视频，这样关注里也能看到红颜)
const dyVisibleFeed = computed(() => {
  const all = douyinFeed.value.map((v, i) => ({ ...v, _i: i }))
  // 搜索模式：只显示当前关键词的搜索结果，与三tab完全隔离
  if (dySearchMode.value) return all.filter(v => v.searchQ === dySearchQuery.value)
  // 关注tab：只要已关注就显示，含在搜索里关注到的作者（真抖音在哪关注的都进关注流）
  if (dyTab.value === '关注') return all.filter(v => v.isFollowing)
  // 推荐/私密：搜索结果不混入
  const base = all.filter(v => !v.searchQ)
  if (dyTab.value === '私密') return base.filter(v => v.vis === 'private')
  return base.filter(v => v.vis !== 'private')
})
const dyAllComments = computed(() => {
  const v = douyinFeed.value[dyCommentIdx.value]
  if (!v) return []
  return [...(v.commentList || []), ...(v.myComments || [])]
})
const dyCurrentCommentTotal = computed(() => {
  const v = douyinFeed.value[dyCommentIdx.value]
  return v ? (v.commentList || []).length + (v.myComments || []).length : 0
})
// AI 声称的评论总数（视频卡上显示的数字），可能远大于实际加载的几条
const dyCurrentCommentClaimed = computed(() => {
  const v = douyinFeed.value[dyCommentIdx.value]
  if (!v) return 0
  const claimed = parseDyNum(v.commentCount)
  const real = dyCurrentCommentTotal.value
  return (claimed && claimed > real) ? claimed : real
})
const dyCommentGap = computed(() => dyCurrentCommentClaimed.value - dyAllComments.value.length)
// 关注tab顶部直播头像条：feed里type=live且isFollowing的条目
const dyLiveInFollowed = computed(() => douyinFeed.value.map((v,i)=>({...v,_i:i})).filter(v=>v.type==='live'&&v.isFollowing))
// 顶栏进度胶囊："当前条/总数"
const dyCurrentPos = computed(() => {
  const vis = dyVisibleFeed.value
  if (!vis.length) return 0
  const pos = vis.findIndex(v => v._i === douyinIdx.value)
  return pos >= 0 ? pos + 1 : 1
})
const DY_FOLLOWS_KEY = 'jdnl_dy_follows'
function loadDyData() {
  try {
    const raw = localStorage.getItem(DY_FEED_KEY); if (raw) douyinFeed.value = JSON.parse(raw).slice(-50)
    const idx = localStorage.getItem(DY_IDX_KEY); if (idx !== null) douyinIdx.value = Math.min(+idx, douyinFeed.value.length - 1)
    const s = localStorage.getItem(DY_SETTINGS_KEY); if (s) douyinSettings.value = { ...douyinSettings.value, ...JSON.parse(s) }
    if (typeof douyinSettings.value.strangerPct === 'number') dyStrangerPct.value = douyinSettings.value.strangerPct
    if (typeof douyinSettings.value.livePct === 'number') dyLivePct.value = douyinSettings.value.livePct
    if (typeof douyinSettings.value.chatBatch === 'number') dyChatBatch.value = douyinSettings.value.chatBatch
    const fc = localStorage.getItem(DY_FAN_KEY); if (fc) dyFanClub.value = JSON.parse(fc)
    const dm = localStorage.getItem(DY_DIAMOND_KEY); if (dm !== null) dyDiamond.value = +dm
    const f = localStorage.getItem(DY_FOLLOWS_KEY); if (f) dyFollows.value = new Set(JSON.parse(f))
    const im = localStorage.getItem(DY_IDXMAP_KEY); if (im) dyIdxMap.value = { ...dyIdxMap.value, ...JSON.parse(im) }
    const h = localStorage.getItem(DY_HISTORY_KEY); if (h) dyHistory.value = JSON.parse(h)
    const sq = localStorage.getItem(DY_SEARCHES_KEY); if (sq) dyRecentSearches.value = JSON.parse(sq)
    const hot = localStorage.getItem(DY_HOT_KEY); if (hot) { const h = JSON.parse(hot); dyHotList.value = h.list || []; dyHotMode.value = h.mode || '' }
  } catch (e) {}
}
// 存feed时剔除未完成的占位卡，避免刷新后残留空卡
// 持久化feed：只剔除未完成的占位卡。搜索结果照常存(靠dyVisibleFeed的!v.searchQ隐藏，不靠丢弃)，否则重开手机就没了、历史也点不开
function saveDyFeed() { try { const clean = douyinFeed.value.filter(v => !v.pending).slice(-50); localStorage.setItem(DY_FEED_KEY, JSON.stringify(clean)); localStorage.setItem(DY_IDX_KEY, String(douyinIdx.value)) } catch (e) {} }
function saveDyFollows() { try { localStorage.setItem(DY_FOLLOWS_KEY, JSON.stringify([...dyFollows.value])) } catch (e) {} }
function saveDyIdxMap() { try { localStorage.setItem(DY_IDXMAP_KEY, JSON.stringify(dyIdxMap.value)) } catch (e) {} }
function saveDySettings() { try { localStorage.setItem(DY_SETTINGS_KEY, JSON.stringify(douyinSettings.value)) } catch (e) {} }
function clearDyCache() {
  douyinFeed.value = []; douyinIdx.value = 0
  dyIdxMap.value = { 推荐: 0, 关注: 0, 私密: 0 }
  dyHistory.value = []; dyFlipped.value = {}
  dySearchMode.value = false; dySearchQuery.value = ''; showDySearchInput.value = false; dySearchDraft.value = ''
  dyRecentSearches.value = []; localStorage.removeItem(DY_SEARCHES_KEY)
  dyHotList.value = []; dyHotMode.value = ''; localStorage.removeItem(DY_HOT_KEY)
  dyLiveRoom.value = null; dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''; showGiftPanel.value = false
  dyFanClub.value = {}; localStorage.removeItem(DY_FAN_KEY)
  localStorage.removeItem(DY_FEED_KEY); localStorage.removeItem(DY_IDX_KEY)
  localStorage.removeItem(DY_IDXMAP_KEY); localStorage.removeItem(DY_HISTORY_KEY)
  showToast('缓存已清理')
}
function onDyScroll() {
  const el = dyFeedEl.value; if (!el || !el.clientHeight) return
  const vis = dyVisibleFeed.value
  if (!vis.length) return                                 // 空列表不触发生成，避免进tab就打API
  // 程序性改动列表/滚动（取关、切tab、插占位卡、恢复位置）时抑制生成触发，只认真人手滑到底
  if (dySuppressScroll) return
  const pos = Math.round(el.scrollTop / el.clientHeight)
  // 更新当前视频索引
  if (pos < vis.length) {
    const real = vis[pos] && vis[pos]._i
    if (real !== undefined && real !== douyinIdx.value) {
      douyinIdx.value = real
      // 搜索模式的下标不写进三tab的记忆，避免污染推荐/关注/私密位置
      if (!dySearchMode.value) { dyIdxMap.value[dyTab.value] = real; saveDyIdxMap() }
      saveDyFeed()
      stopDanmaku(); startDanmaku(douyinFeed.value[real])
    }
    return
  }
  // 到了尾部：若当前已有pending占位卡在生成，不再触发
  if (generatingDy.value) return
  const now = Date.now()
  if (now - dyLastGenMs < 1500) return
  clearTimeout(dyScrollTimer)
  dyScrollTimer = setTimeout(() => {
    if (!generatingDy.value && Date.now() - dyLastGenMs >= 1500) generateDyVideo()
  }, 150)
}
// 定位到某tab记住的那条（无则第一条），并重挂弹幕
// clientHeight为0说明DOM还没布局好（刚打开手机时常见），重试几次
function dyRestorePos(tries = 0) {
  suppressDyScroll(800)
  nextTick(() => {
    const el = dyFeedEl.value
    if (!el) { if (tries < 10) setTimeout(() => dyRestorePos(tries + 1), 50); return }
    if (!el.clientHeight) { if (tries < 10) setTimeout(() => dyRestorePos(tries + 1), 50); return }
    const vis = dyVisibleFeed.value
    if (!vis.length) { el.scrollTop = 0; stopDanmaku(); return }
    // 搜索模式定位到 douyinIdx 指定的那条；常规tab用各自记住的位置
    let want = dySearchMode.value ? douyinIdx.value : dyIdxMap.value[dyTab.value]
    let pos = vis.findIndex(v => v._i === want)
    if (pos < 0) pos = 0
    el.scrollTop = pos * el.clientHeight
    douyinIdx.value = vis[pos]._i
    stopDanmaku(); startDanmaku(douyinFeed.value[douyinIdx.value])
  })
}
// 进抖音：先从存储重新同步（拿到退出期间后台刚生成完的视频），再回到当前tab上次那条
function openDouyin() {
  view.value = 'douyin'
  if (!generatingDy.value) loadDyData()
  if (dyTab.value === '私密' && !dyR18.value) dyTab.value = '推荐'
  dyRestorePos()
}
// 切 tab：记住旧tab位置，恢复新tab位置
function switchDyTab(t) {
  if (dyTab.value === t) return
  suppressDyScroll(800)
  dyIdxMap.value[dyTab.value] = douyinIdx.value; saveDyIdxMap()
  dyTab.value = t
  stopDanmaku()
  dyRestorePos()
}
function toggleDyLike(vi) { const v = douyinFeed.value[vi]; if (!v) return; v.isLiked = !v.isLiked; saveDyFeed() }
function toggleDySave(vi) { const v = douyinFeed.value[vi]; if (!v) return; v.isSaved = !v.isSaved; saveDyFeed() }
// 关注/取关：同一作者的所有视频一起同步，并同步独立关注名单
function toggleDyFollow(vi) {
  const v = douyinFeed.value[vi]; if (!v) return
  const now = !v.isFollowing
  // 关注tab里取关会让列表变短、滚动被动触发生成，先抑制
  suppressDyScroll(800)
  douyinFeed.value.forEach(x => { if (x.creator === v.creator) x.isFollowing = now })
  if (now) dyFollows.value.add(v.creator); else dyFollows.value.delete(v.creator)
  saveDyFeed(); saveDyFollows()
  showToast(now ? `已关注 @${v.creator}` : `已取消关注 @${v.creator}`)
}
function toggleDyCmtLike(c) {
  c.myLike = !c.myLike
  const n = parseDyNum(c.likes)
  if (n !== null) c.likes = fmtDyNum(c.myLike ? n + 1 : Math.max(0, n - 1))
  saveDyFeed()
}
// "1.2万" ⇄ 数字
function parseDyNum(s) {
  if (typeof s === 'number') return s
  if (!s) return null
  const t = String(s).trim()
  const m = t.match(/^([\d.]+)\s*万$/)
  if (m) return Math.round(parseFloat(m[1]) * 10000)
  return /^\d+$/.test(t) ? +t : null
}
function fmtDyNum(n) { return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(n) }
function openDyComments(vi) { dyCommentIdx.value = vi; showDyComments.value = true }
function submitDyComment() {
  const txt = dyCommentDraft.value.trim(); if (!txt) return
  const v = douyinFeed.value[dyCommentIdx.value]; if (!v) return
  const me = '@' + (meName.value || '我')
  // 回复模式：挂到被回复评论（或父评论）的 replies，并异步生成对方回复
  if (dyReplyTo.value) {
    // dyReplyParent 非空 = 对某个回复再回复，父评论是 dyReplyParent；否则按用户名找一级评论
    const target = dyReplyParent.value || dyAllComments.value.find(c => (c.user||'').replace(/^@/,'') === dyReplyTo.value)
    if (target) {
      if (!target.replies) target.replies = []
      target.replies.push({ user: me, text: txt, replyTo: '@' + dyReplyTo.value, isMe: true })
      const to = dyReplyTo.value
      dyCommentDraft.value = ''; dyReplyTo.value = ''; dyReplyParent.value = null; saveDyFeed()
      generateDyCommentReply(v, target, txt, to)
      return
    }
  }
  if (!v.myComments) v.myComments = []
  v.myComments.push({ user: me, text: txt, likes: '0' })
  dyCommentDraft.value = ''; saveDyFeed()
}
// 用户回复某条评论后，异步生成被回复者/博主/路人的回复，追加进该评论的 replies
async function generateDyCommentReply(video, comment, myText, toUser) {
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) return
  const me = meName.value || '我'
  const isR18 = dyR18.value
  const isPrivate = video.vis === 'private'
  const audience = isPrivate
    ? `这是${me}只有自己能看到的私密内容，回复里绝不能出现陌生人；只可能是被回复者本人、发布者@${video.creator}、或与${me}同属亲密圈子且知情的人。若没有合适的人回，就别生成任何回复。`
    : `回复可以来自被回复者@${toUser}本人、视频发布者@${video.creator}、或路过的其他观众，口吻真实。`
  const existing = (comment.replies || []).map(r => `${r.user}${r.replyTo ? '回复'+r.replyTo : ''}：${r.text}`).join('\n')
  const instruction =
    `【${isR18 ? '抖阴' : '抖音'}·评论回复·静默生成】在一条视频的评论区里，${me}(@${me})刚回复了 @${toUser} 的评论。` +
    `\n视频画面：${(video.content||'').slice(0,80)}` +
    `\n@${toUser} 的原评论：「${comment.text}」` +
    `\n${me}的回复：「${myText}」` +
    `\n${audience}` +
    (existing ? `\n这条评论下已有的回复：\n${existing}` : '') +
    `\n生成 1~3 条自然的后续回复（可以是@${toUser}回应${me}、发布者插话、或其他人围观搭话），别重复已有内容。若判断无人会回则输出空块。` +
    `\n只输出一个 ===DYREPLY=== 数据块，块外不写字：\n===DYREPLY===\nr1:回复者号|||被回复者号(可空)|||回复内容\nr2:回复者号|||被回复者号(可空)|||回复内容\nr3:...\n===REPLYEND===`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: '看评论回复', should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: '生成评论回复，只输出 ===DYREPLY=== 数据块，块外不写字。' },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const replies = parseDyReplies(result)
    if (replies.length && comment.replies) { comment.replies.push(...replies); saveDyFeed() }
  } catch (e) {}
}
function parseDyReplies(raw) {
  if (!raw) return []
  const m = raw.match(/===DYREPLY===([\s\S]*?)===REPLYEND===/); if (!m) return []
  const block = m[1]
  const out = []
  for (let i = 1; i <= 5; i++) {
    const r = block.match(new RegExp('^\\s*r' + i + '\\s*:(.+)$', 'm')); if (!r) continue
    const p = r[1].split('|||'); const user = p[0]?.trim(); const to = (p[1]||'').trim(); const text = p[2]?.trim()
    if (user && text) out.push({ user: '@' + user.replace(/^@/,''), replyTo: to ? '@' + to.replace(/^@/,'') : '', text, isMe: false })
  }
  return out
}
const DM_LANES = [4, 26, 48, 70]     // 弹幕带内的轨道（px），避免互相重叠
function startDanmaku(video) {
  stopDanmaku()
  if (!video || !video.danmaku || !video.danmaku.length) return
  let di = 0, lane = 0
  function spawnNext() {
    const list = video.danmaku
    if (!list || !list.length) return
    const text = list[di % list.length]; di++
    const dur = 6 + Math.random() * 5           // 速度不一：6~11 秒飘完
    const key = Date.now() + Math.random()
    activeDanmaku.value.push({ k: key, text, top: DM_LANES[lane % DM_LANES.length], dur })
    lane++
    // 飘完即移除，不堆积、不停在半路
    setTimeout(() => { activeDanmaku.value = activeDanmaku.value.filter(d => d.k !== key) }, dur * 1000 + 200)
    dmTimer = setTimeout(spawnNext, 1400 + Math.random() * 1600)
  }
  dmTimer = setTimeout(spawnNext, 600)
}
function stopDanmaku() { clearTimeout(dmTimer); dmTimer = null; activeDanmaku.value = [] }

async function generateDyVideo() {
  if (generatingDy.value) return
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) { showToast('当前环境不支持生成'); return }
  const isR18 = dyR18.value
  const isSearch = dySearchMode.value
  const query = dySearchQuery.value
  // 搜索是独立的公开结果流：不当作私密/关注生成
  const isPrivate = !isSearch && dyTab.value === '私密'
  const isFollowTab = !isSearch && dyTab.value === '关注'
  // 关注tab没有已关注对象时不生成，避免凭空造关注对象
  if (isFollowTab && !dyFollows.value.size) { showToast('还没有关注任何人，去推荐看看吧'); return }
  generatingDy.value = true
  dyLastGenMs = Date.now()
  const me = meName.value || '我'
  // 已刷过的创作者，供 AI 参考避免重复。搜索是主动找特定内容，不去重（同一博主的相关内容本就该都搜出来）
  const seen = isSearch ? '' : [...new Set(douyinFeed.value.slice(-8).map(v => v.creator).filter(Boolean))].join('、')

  // 私密流：按设置的陌生人占比掷骰，默认0（全红颜私发）
  const isPrivateStranger = isPrivate && Math.random() * 100 < dyStrangerPct.value
  // 抖阴公开流（推荐/关注）要一份翻转私密版；抖音全年龄模式不要
  const wantFlip = isR18 && !isPrivate
  // 直播卡：推荐/关注/搜索流里按概率掷骰（私密流不出直播）
  const isLive = !isPrivate && Math.random() * 100 < dyLivePct.value

  // 先插占位卡并滚过去
  const placeholder = {
    pending: true, creator: '', verified: false, caption: '', sound: '',
    likes: '0', commentCount: '0', shares: '0', saves: '0', content: '',
    danmaku: [], commentList: [], myComments: [],
    vis: isPrivate ? 'private' : 'public',
    isFollowing: isPrivate || isFollowTab, isLiked: false, isSaved: false,
    searchQ: isSearch ? query : undefined,
    type: isLive ? 'live' : 'video',
  }
  const wasEmpty = !dyVisibleFeed.value.length
  suppressDyScroll(800)
  douyinFeed.value.push(placeholder)
  const placeholderRealIdx = douyinFeed.value.length - 1
  douyinIdx.value = placeholderRealIdx
  stopDanmaku()
  nextTick(() => {
    const el = dyFeedEl.value; if (!el) return
    const pos = dyVisibleFeed.value.findIndex(v => v._i === placeholderRealIdx)
    if (pos >= 0) el.scrollTop = pos * el.clientHeight
  })

  // ---- 直播卡分支 ----
  if (isLive) {
    const isLiveStranger = isR18 && Math.random() * 100 < dyStrangerPct.value
    const livePlatform = isR18 ? '抖阴（成人向直播平台）' : '抖音（直播）'
    const liveStyleLine = isR18
      ? (isLiveStranger
        ? `这是陌生成人主播的公开直播，尺度放开，可描写明显性感或裸露的直播画面，真实素人风格。`
        : `这是与${me}亲密的红颜在直播，可撩人、可擦边；她知道${me}在看，有时会对镜头特别示意。`)
      : `直播内容生活化、有真情实感，题材自由（聊天/才艺/游戏/美食/户外/穿搭等）。`
    const liveSourceLine = isR18
      ? (isLiveStranger
        ? `主播是平台上与故事世界无关的陌生成人女性内容创作者，素人博主风格。`
        : `主播必须是当前故事世界里与${me}关系亲密的女性角色，她以自己的账号在直播。`)
      : (isFollowTab
        ? `主播必须是以下已关注的创作者之一：${[...dyFollows.value].join('、')}。`
        : `主播既可能是故事世界里的角色，也可能是陌生素人主播。`)
    const liveChatRule = (isR18 && !isLiveStranger)
      ? `【私密直播铁则】这是只对${me}和知情亲密圈子开放的私密直播，绝对禁止陌生人、路人、男性观众进入。聊天里只允许${me}本人，或与主播同属亲密圈子且知情的其他女性角色；若没有合适的人，chat全留空。观众是极小的私密圈子，viewers 只能是个位数到几十（如 3 / 12 / 27），绝不能是几百几千几万。`
      : `聊天要有各种真实观众口吻，包含"来了"进场消息和普通评论。viewers 是公开直播的真实在线人数（几百到几万都合理）。`
    const liveSearchLine = isSearch
      ? `\n【搜索结果】${me}在搜索框输入了「${query}」，这个直播必须与该关键词高度相关（主播领域、直播主题都要贴合）。`
      : ''
    const liveInstruction =
      `【${livePlatform}·直播卡·静默生成】现在模拟刷到的一个直播卡，绝不输出任何正文。` +
      `\n主播来源：${liveSourceLine}` +
      `\n直播风格：${liveStyleLine}` +
      `\n${liveChatRule}` + liveSearchLine +
      (seen ? `\n已出现过这些账号，主播别重复：${seen}。` : '') +
      `\n【账号唯一】同一角色全平台只有一个固定账号名，禁用别名/小名/拼音/缩写重复出现。` +
      `\n只输出一个 ===LIVECARD=== 数据块，块外不写字：\n===LIVECARD===\n` + DY_LIVE_FORMAT + `\n===LCEND===`
    try {
      let result
      if (th.generateRaw) {
        result = await th.generateRaw({ user_input: '刷到直播', should_silence: true, ordered_prompts: [
          { role: 'system', content: liveInstruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
          { role: 'user', content: '刷到一个直播卡，只输出 ===LIVECARD=== 数据块，块外不写字。' },
        ] })
      } else { result = await th.generate({ user_input: liveInstruction, should_silence: true }) }
      const liveCard = parseDyLiveCard(result)
      const idx = douyinFeed.value.indexOf(placeholder)
      if (liveCard && idx >= 0) {
        liveCard.vis = 'public'; liveCard.type = 'live'
        if (isR18 && !isLiveStranger) liveCard.redYan = true   // 标记为红颜私密直播，用于聊天生成铁则
        if (isFollowTab) { liveCard.isFollowing = true; dyFollows.value.add(liveCard.creator); saveDyFollows() }
        if (!liveCard.isFollowing && (douyinFeed.value.some(x => x.creator === liveCard.creator && x.isFollowing) || dyFollows.value.has(liveCard.creator))) liveCard.isFollowing = true
        if (isSearch) liveCard.searchQ = query
        douyinFeed.value.splice(idx, 1, liveCard)
        douyinIdx.value = idx
        if (!isSearch) { dyIdxMap.value[dyTab.value] = idx; saveDyIdxMap() }
        saveDyFeed()
        nextTick(() => {
          const el = dyFeedEl.value; if (!el) return
          const pos = dyVisibleFeed.value.findIndex(v => v._i === idx)
          if (pos >= 0) el.scrollTop = pos * el.clientHeight
        })
      } else {
        const rm = douyinFeed.value.indexOf(placeholder); if (rm >= 0) douyinFeed.value.splice(rm, 1)
        douyinIdx.value = Math.max(0, douyinFeed.value.length - 1)
        showToast('直播卡没生成出来，再试一次')
      }
    } catch (e) {
      const rm = douyinFeed.value.indexOf(placeholder); if (rm >= 0) douyinFeed.value.splice(rm, 1)
      douyinIdx.value = Math.max(0, douyinFeed.value.length - 1)
      showToast('生成失败：' + ((e && e.message) || e))
    } finally { generatingDy.value = false }
    return
  }
  // ---- 普通视频分支（原有逻辑） ----
  let platform, styleLine, sourceLine, audienceLine
  if (isPrivate && !isPrivateStranger) {
    platform = '抖阴·私密（只有本人能看到的私发内容）'
    styleLine = `尺度完全放开：直接写出裸露与性事本身，具体到身体、动作、声音、气息与情态，不用暗示、不用留白、不擦边。同时保有情绪与关系的温度，是这个人对${me}才会这样，不是无名的色情素材。`
    sourceLine = `发布者必须是当前故事世界中与${me}关系亲密的女性角色（从下方角色信息中自行判断谁符合，别凭空造陌生人）。这条私密内容只有${me}能看到，但内容不必都围绕${me}——可以是ta单独拍给${me}的，也可以是ta自娱自乐、独处时的私密记录、或与另一位亲密女性角色之间的百合互动，题材自然多样，别每条都写成对着${me}。`
    audienceLine = `\n【评论区铁则】这条内容只有${me}一个人能看到，因此绝对禁止出现任何陌生人、路人、男性观众的评论——出现即为错误。评论只能来自：${me}本人，或与发布者同属${me}亲密圈子且知情的其他女性角色。若判断没有合适的人会看到，就把评论全部留空，评论数写0，宁可没有评论也不许放陌生人进来。弹幕同理，私密内容没有公开观众，弹幕留空。`
  } else if (isPrivate && isPrivateStranger) {
    platform = '抖阴·私密（成人内容平台）'
    styleLine = `尺度完全放开：直接写出裸露与性事，具体到身体、动作、声音、气息与情态，不用暗示、不用留白。这是平台上的陌生成人内容创作者，与故事世界无关，可以有陌生观众评论和弹幕。`
    sourceLine = `发布者是平台上的陌生女性成人内容创作者，与当前故事人物无关，是真实存在感强的素人博主或成人up主。`
    audienceLine = `\n评论区可以有陌生的成人观众评论，口吻符合成人平台真实氛围。`
  } else if (isFollowTab) {
    platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
    styleLine = isR18
      ? `公开画面擦边风格：性感、撩人、若隐若现，靠体态、衣物、角度、氛围撩拨，呼之欲出但不真正露出、不直接描写性行为。`
      : `内容生活化、有真情实感或趣味，题材自由（日常/情感/才艺/风景/美食/知识/搞笑/宠物/穿搭等皆可）。`
    sourceLine = `发布者必须是以下已关注的创作者之一，从中选一个来发新视频：${[...dyFollows.value].join('、')}。`
    audienceLine = `\n评论区可以有各种陌生观众，立场性格各异；若发布者是故事中的角色，其他角色也可能出现在评论里。`
  } else {
    platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
    styleLine = isR18
      ? `公开画面擦边风格：性感、撩人、若隐若现，靠体态、衣物、角度、氛围撩拨，呼之欲出但不真正露出、不直接描写性行为。`
      : `内容生活化、有真情实感或趣味，题材自由（日常/情感/才艺/风景/美食/知识/搞笑/宠物/穿搭等皆可）。`
    sourceLine = `发布者既可能是当前故事世界里的角色，也可能是与故事无关的陌生博主、路人、素人——由内容自然决定，不必偏向任何人。`
    audienceLine = `\n评论区可以有各种陌生观众，立场性格各异；若发布者是故事中的角色，其他角色也可能出现在评论里。`
  }
  // 翻转私密版：user 独享特权。评论只能围绕公开画面，绝不能提及私密版内容
  const flipLine = wantFlip
    ? `\n另外，${me}对这条视频有独享特权，可以翻转看到只给${me}的私密版：请额外输出一行 pcontent，写这条视频真正大尺度的版本（直接写裸露与性事本身，具体到身体、动作、声音、气息），是发布者只愿意让${me}看到的样子。内容不必都是对着${me}做的——也可以是ta自己的私密画面、独处情态或与另一位亲密女性的百合场景，自然即可。【极重要】评论区和弹幕只能围绕上面那条公开的擦边画面(content)，绝对不能提及、暗示或反应 pcontent 里的私密内容——因为除了${me}没人看得到私密版，谁提了就是穿帮。`
    : ''
  // 搜索：这条必须紧扣关键词
  const searchLine = isSearch
    ? `\n【搜索结果】${me}在搜索框输入了「${query}」，这条视频必须与该关键词高度相关——题材、话题标签(#)、创作者领域都要贴合搜索意图，就像真实抖音搜出来的结果。不要生成与「${query}」无关的内容。`
    : ''
  const fmt = wantFlip
    ? DY_FORMAT_BASE + `\npcontent:只给${me}看的私密版画面，2-3句，直接写实、大尺度`
    : DY_FORMAT_BASE

  const instruction =
    `【${platform}·刷视频·静默生成】现在只模拟刷到的一条短视频，绝不输出任何正文、旁白、场景或动作描写，只产出下面规定的数据块。` +
    `请结合下方提供的世界观设定、角色信息与当前剧情，生成一条真实可信、符合该世界背景的短视频。` +
    `\n发布来源：${sourceLine}` +
    `\n内容风格：${styleLine}` +
    audienceLine + flipLine + searchLine +
    // 关注tab要求"从已关注里选"，与"换新人别重复"冲突，故关注tab不加seen；只提示换新题材
    (isFollowTab
      ? `\n可以从已关注的这几个人里任选，题材尽量换新、别和最近重复。`
      : (seen ? `\n最近已刷到过这些创作者，请换新的人和新的题材，别重复：${seen}。` : '')) +
    `\n真实感要求：创作者名像真人抖音号（可含字母数字emoji）；【账号唯一】同一个角色在整个平台只有一个固定账号，出现时始终用同一个名字，绝不能用别名、小名、拼音、缩写、外号或换个称呼把同一个人包装成不同的新博主重复刷出；文案口语化、可带#话题；弹幕是观众即时反应、短促随意有梗；评论有不同性格与立场，别千篇一律；点赞/评论/分享数符合内容热度` +
    (isPrivate ? `（私密视频数据极低或为0，因为只有一个人看）` : '') + `。` +
    `\n只输出一个 ===DYSTART=== 数据块，块外不写任何字：\n===DYSTART===\n` + fmt + `\n===DYEND===`
  try {
    let result
    if (th.generateRaw) {
      const ordered = [
        { role: 'system', content: instruction },
        'persona_description',
        'char_description',
        'world_info_before',
        'world_info_after',
        { role: 'user', content: `刷到下一条视频，只输出一个 ===DYSTART=== 数据块，块外不写任何字。` },
      ]
      result = await th.generateRaw({ user_input: '刷抖音', should_silence: true, ordered_prompts: ordered })
    } else {
      result = await th.generate({ user_input: instruction, should_silence: true })
    }
    const video = parseDyVideo(result)
    const idx = douyinFeed.value.indexOf(placeholder)
    if (video && idx >= 0) {
      video.vis = isPrivate ? 'private' : 'public'
      if (isPrivate && !isPrivateStranger) { video.danmaku = []; video.isFollowing = true }
      else if (isPrivate) video.isFollowing = true
      if (isFollowTab) { video.isFollowing = true; dyFollows.value.add(video.creator); saveDyFollows() }
      if (!video.isFollowing && (douyinFeed.value.some(x => x.creator === video.creator && x.isFollowing) || dyFollows.value.has(video.creator))) {
        video.isFollowing = true
      }
      if (isSearch) { video.searchQ = query; video.vis = 'public' }
      douyinFeed.value.splice(idx, 1, video)   // 原地替换占位卡
      douyinIdx.value = idx
      // 搜索结果的下标不写进三tab记忆，避免污染
      if (!isSearch) { dyIdxMap.value[dyTab.value] = idx; saveDyIdxMap() }   // 记住位置，退出再进/重挂能定位到新视频
      pushDyHistory(video)
      saveDyFeed()
      nextTick(() => {
        // 若此时仍在抖音视图，把视口对准这条新视频（后台生成完退回来也能显示）
        const el = dyFeedEl.value
        if (el) {
          if (wasEmpty) el.scrollTop = 0
          else {
            const pos = dyVisibleFeed.value.findIndex(v => v._i === idx)
            if (pos >= 0) el.scrollTop = pos * el.clientHeight
          }
        }
        stopDanmaku(); startDanmaku(video)
      })
    } else {
      // 生成失败：移除占位卡，回到上一条
      const rm = douyinFeed.value.indexOf(placeholder)
      if (rm >= 0) douyinFeed.value.splice(rm, 1)
      douyinIdx.value = Math.max(0, douyinFeed.value.length - 1)
      if (!isSearch) { dyIdxMap.value[dyTab.value] = douyinIdx.value; saveDyIdxMap() }
      showToast('没刷出内容，再试一次')
    }
  } catch (e) {
    const rm = douyinFeed.value.indexOf(placeholder)
    if (rm >= 0) douyinFeed.value.splice(rm, 1)
    douyinIdx.value = Math.max(0, douyinFeed.value.length - 1)
    if (!isSearch) { dyIdxMap.value[dyTab.value] = douyinIdx.value; saveDyIdxMap() }
    showToast('生成失败：' + ((e && e.message) || e))
  } finally { generatingDy.value = false }
}
function parseDyVideo(raw) {
  if (!raw) return null
  const m = raw.match(/===DYSTART===([\s\S]*?)===DYEND===/)
  if (!m) return null
  const block = m[1]
  const f = (k) => { const r = block.match(new RegExp('^\\s*' + k + '\\s*:(.+)$', 'm')); return r ? r[1].trim() : '' }
  const danmakuRaw = f('danmaku')
  const commentList = []
  for (let i = 1; i <= 6; i++) {
    const c = f('c'+i); if (!c) continue
    const p = c.split('|||')
    if (p.length >= 2 && p[0].trim() && p[1].trim()) {
      commentList.push({ user: p[0].trim().replace(/^@/,'').replace(/^/,'@'), text: p[1].trim(), likes: (p[2]||'0').trim(), region: (p[3]||'').trim() })
    }
  }
  const content = f('content')
  if (!content && !f('caption')) return null
  return {
    creator: f('creator').replace('@',''),
    verified: /true|是|认证/.test(f('verified')),
    caption: f('caption'),
    sound: f('sound') || '原声',
    likes: f('likes') || '0',
    commentCount: f('comments') || String(commentList.length || 0),
    shares: f('shares') || '0',
    saves: f('saves') || '0',
    content,
    pcontent: f('pcontent') || '',
    danmaku: danmakuRaw ? danmakuRaw.split('|').map(s=>s.trim()).filter(Boolean) : [],
    commentList, myComments: [], isLiked: false, isSaved: false, isFollowing: false,
    type: 'video',
  }
}
function parseDyLiveCard(raw) {
  if (!raw) return null
  const m = raw.match(/===LIVECARD===([\s\S]*?)===LCEND===/)
  if (!m) return null
  const block = m[1]
  const f = (k) => { const r = block.match(new RegExp('^\\s*' + k + '\\s*:(.+)$', 'm')); return r ? r[1].trim() : '' }
  const content = f('content'); if (!content) return null
  const chatLog = []
  for (let i = 1; i <= 10; i++) {
    const c = f('chat'+i); if (!c) continue
    const p = c.split('|||')
    const level = p[0]?.trim(); const user = p[1]?.trim(); const text = p[2]?.trim(); const tag = (p[3]||'').trim()
    if (user) chatLog.push({ level: /^\d+$/.test(level) ? +level : null, user, text: text||'', isJoin: tag==='join', isMe: false })
  }
  return {
    creator: f('creator').replace('@',''), verified: /true|是|认证/.test(f('verified')),
    title: f('title'), viewers: f('viewers') || '0',
    liveLikes: Math.floor(Math.random()*5000+200) + '',
    content, chatLog, myComments: [], isLiked: false, isSaved: false, isFollowing: false, type: 'live',
  }
}
// 设置里自定义数字输入的本地草稿，避免2秒轮询重渲染把没输完的值清掉
const histDraft = ref('')
const strangerDraft = ref('')
function applyHistDraft() { const n = parseInt(histDraft.value, 10); if (n >= 1) { setHistLimit(n); showToast('已设为 ' + histLimit.value + ' 条') } histDraft.value = '' }
function applyStrangerDraft() { const n = parseInt(strangerDraft.value, 10); if (!isNaN(n)) { setDyStrangerPct(n); showToast('陌生人占比已设为 ' + dyStrangerPct.value + '%') } strangerDraft.value = '' }
// 观看历史：只存已成功填充的视频，去重，最多80条
const DY_HISTORY_KEY = 'jdnl_dy_history'
const dyHistory = ref([])
function pushDyHistory(v) {
  if (!v || v.pending) return
  const entry = { creator: v.creator, caption: v.caption, content: (v.content || '').slice(0, 40), vis: v.vis, ts: Date.now() }
  dyHistory.value = dyHistory.value.filter(h => !(h.creator === entry.creator && h.content === entry.content))
  dyHistory.value.unshift(entry)
  if (dyHistory.value.length > 80) dyHistory.value = dyHistory.value.slice(0, 80)
  try { localStorage.setItem(DY_HISTORY_KEY, JSON.stringify(dyHistory.value)) } catch (e) {}
}
function toggleDyFlip(vi) {
  const v = douyinFeed.value[vi]
  if (!v || !v.pcontent) return
  dyFlipped.value = { ...dyFlipped.value, [vi]: !dyFlipped.value[vi] }
}
function setDyStrangerPct(p) { p = Math.round(+p); if (isNaN(p)) return; p = Math.max(0, Math.min(100, p)); dyStrangerPct.value = p; douyinSettings.value.strangerPct = p; saveDySettings() }
// 从历史点回看：在feed里找到那条并定位到对应tab
function openDyFromHistory(h) {
  const idx = douyinFeed.value.findIndex(v => !v.pending && v.creator === h.creator && (v.content || '').slice(0, 40) === h.content)
  if (idx < 0) { showToast('这条已不在缓存里了'); return }
  const v = douyinFeed.value[idx]
  showDyHistory.value = false
  showDySearchInput.value = false
  // 搜索结果：回到对应关键词的搜索流
  if (v.searchQ) {
    dySearchMode.value = true
    dySearchQuery.value = v.searchQ
    douyinIdx.value = idx
    dyRestorePos()
    return
  }
  dySearchMode.value = false
  dyTab.value = v.vis === 'private' ? (dyR18.value ? '私密' : '推荐') : (v.isFollowing ? dyTab.value : (dyTab.value === '关注' ? '推荐' : dyTab.value))
  if (dyTab.value === '私密' && !dyR18.value) dyTab.value = '推荐'
  dyIdxMap.value[dyTab.value] = idx; saveDyIdxMap()
  douyinIdx.value = idx
  dyRestorePos()
}
// 搜索：打开输入层（带上当前关键词便于改词）
function openDySearchInput() {
  dySearchDraft.value = dySearchMode.value ? dySearchQuery.value : ''
  showDySearchInput.value = true
  // 不自动打API刷新热榜，交给用户点刷新按钮，避免一进搜索页就霸道地消耗生成
}
// 只显示与当前模式匹配的热榜；切了抖音/抖阴或从没刷过，就当空、提示用户手动刷新
const dyHotShown = computed(() => (dyHotMode.value === (dyR18.value ? 'r18' : 'normal')) ? dyHotList.value : [])
function closeDySearchInput() { showDySearchInput.value = false }
// 记一条最近搜索（去重置顶，最多12条）
function pushRecentSearch(q) {
  dyRecentSearches.value = [q, ...dyRecentSearches.value.filter(x => x !== q)].slice(0, 12)
  try { localStorage.setItem(DY_SEARCHES_KEY, JSON.stringify(dyRecentSearches.value)) } catch (e) {}
}
function removeRecentSearch(q) {
  dyRecentSearches.value = dyRecentSearches.value.filter(x => x !== q)
  try { localStorage.setItem(DY_SEARCHES_KEY, JSON.stringify(dyRecentSearches.value)) } catch (e) {}
}
function submitDySearch() { runDySearch(dySearchDraft.value) }
// 提交搜索：进独立搜索流，已有该词结果则直接展示，否则生成
function runDySearch(raw) {
  const q = (raw || '').trim(); if (!q) return
  showDySearchInput.value = false
  suppressDyScroll(800)
  pushRecentSearch(q)
  dySearchQuery.value = q
  dySearchMode.value = true
  stopDanmaku()
  const existing = douyinFeed.value.find(v => !v.pending && v.searchQ === q)
  if (existing) {
    douyinIdx.value = douyinFeed.value.indexOf(existing)
    dyRestorePos()
  } else {
    nextTick(() => { const el = dyFeedEl.value; if (el) el.scrollTop = 0 })
    generateDyVideo()
  }
}
// 退出搜索：回到进搜索前的tab与位置（搜索结果保留在内存，可从历史再进）
function exitDySearch() {
  suppressDyScroll(800)
  dySearchMode.value = false
  dySearchQuery.value = ''
  showDySearchInput.value = false
  stopDanmaku()
  dyRestorePos()
}
// ---- 热榜（阶段B）：抖音/抖阴两套，AI生成话题+热度，点条目=带该话题搜索 ----
function saveDyHot() { try { localStorage.setItem(DY_HOT_KEY, JSON.stringify({ mode: dyHotMode.value, list: dyHotList.value })) } catch (e) {} }
function parseDyHot(raw) {
  if (!raw) return []
  const m = raw.match(/===HOTSTART===([\s\S]*?)===HOTEND===/); if (!m) return []
  const out = []
  m[1].split('\n').forEach(ln => {
    const t = ln.trim(); if (!t || !t.includes('|||')) return
    const p = t.split('|||'); const topic = (p[0] || '').replace(/^#/, '').replace(/^\d+[.、\s]*/, '').trim(); const heat = (p[1] || '').trim()
    if (topic) out.push({ topic, heat })
  })
  return out.slice(0, 12)
}
async function generateDyHotList() {
  if (generatingHot.value) return
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) { showToast('当前环境不支持生成'); return }
  generatingHot.value = true
  const isR18 = dyR18.value
  const platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
  const styleLine = isR18
    ? '这是成人向平台的热搜榜，话题可以露骨、擦边、情色、猎奇向，但仍要像真实能搜的热搜词条。'
    : '这是全年龄短视频平台的热搜榜，题材广泛：社会热点/娱乐/影视/情感/生活/搞笑/知识/地域等，像真实抖音热榜。'
  const instruction =
    `【${platform}·热榜·静默生成】结合下方世界观设定与当前剧情，生成一份当前的热搜榜，共10条，绝不输出任何正文、旁白或解释。` +
    `\n${styleLine}` +
    `\n每条是一个热搜话题词（简洁、有话题感、像真的能搜到的词，不用带#），配一个热度数字（如 328.5万 / 1024.8万，排名越靠前热度越高）。` +
    `\n话题要贴合这个故事世界的背景（可含本世界的地名/事件/人物/风俗相关话题），别都套现实世界的东西。` +
    `\n只输出一个 ===HOTSTART=== 数据块，块外不写任何字。每行格式：话题|||热度\n===HOTSTART===\n话题1|||热度\n话题2|||热度\n…(共10行)\n===HOTEND===`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: '看抖音热榜', should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: '给我当前的热搜榜，只输出一个 ===HOTSTART=== 数据块，块外不写字。' },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const list = parseDyHot(result)
    if (list.length) { dyHotList.value = list; dyHotMode.value = isR18 ? 'r18' : 'normal'; saveDyHot() }
    else showToast('热榜没刷出来，再试一次')
  } catch (e) { showToast('热榜生成失败：' + ((e && e.message) || e)) }
  finally { generatingHot.value = false }
}
// ---- 直播（阶段C重构：直播融入视频流）----
// 进入直播间（从feed里的直播卡或关注tab头像条）
function enterDyLiveRoom(feedIdx) {
  const v = douyinFeed.value[feedIdx]; if (!v || v.type !== 'live') return
  dyLiveRoom.value = { ...v, feedIdx, chatLog: [...(v.chatLog || [])] }
  dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''
  stopDanmaku()
  nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
  // 如果聊天列表不足10条，自动补一批
  if ((dyLiveRoom.value.chatLog || []).length < 10) generateLiveChat(false)
}
function closeDyLiveRoom() {
  dyLiveRoom.value = null; dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''; showGiftPanel.value = false; stopDanmaku()
  const v = douyinFeed.value[douyinIdx.value]; if (v && !v.pending && v.type !== 'live') startDanmaku(v)
}
function toggleDyFollowFromLive() {
  if (!dyLiveRoom.value) return
  const r = dyLiveRoom.value; r.isFollowing = !r.isFollowing
  douyinFeed.value.forEach(x => { if (x.creator === r.creator) x.isFollowing = r.isFollowing })
  if (r.isFollowing) dyFollows.value.add(r.creator); else dyFollows.value.delete(r.creator)
  saveDyFeed(); saveDyFollows()
}
// 解析直播聊天批次（===LIVECHAT=== ... ===CHATEND===）：返回 {msgs, screen}
// 兼容两种：cN:等级|||昵称|||内容 带编号，或裸行 等级|||昵称|||内容
function parseLiveChat(raw, batch = 50) {
  if (!raw) return { msgs: [], screen: '' }
  const m = raw.match(/===LIVECHAT===([\s\S]*?)===CHATEND===/)
  if (!m) return { msgs: [], screen: '' }
  const block = m[1]
  const out = []
  const sm = block.match(/^\s*screen\s*:(.+)$/m)
  const screen = sm ? sm[1].trim() : ''
  const pushLine = (line) => {
    const t = line.trim(); if (!t || !t.includes('|||')) return
    const p = t.split('|||'); const level = p[0]?.trim(); const user = p[1]?.trim(); const text = p[2]?.trim(); const tag = (p[3]||'').trim()
    if (user) out.push({ level: /^\d+$/.test(level) ? +level : null, user, text: text||'', isJoin: tag==='join', isMe: false })
  }
  block.split('\n').forEach(ln => {
    let t = ln.trim(); if (!t) return
    if (/^screen\s*:/.test(t)) return
    // 去掉行首 cN: 编号
    t = t.replace(/^c\d+\s*:/, '')
    if (t.includes('|||')) pushLine(t)
  })
  return { msgs: out, screen }
}
// 生成新一批聊天消息（进房间时 / 用户发言后 / 手动「主播继续」）
async function generateLiveChat(includeUserMsg = false) {
  if (generatingLiveChat.value || !dyLiveRoom.value) return
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) { showToast('当前环境不支持生成'); return }
  generatingLiveChat.value = true
  const room = dyLiveRoom.value
  const me = meName.value || '我'
  const isR18 = dyR18.value
  // dyChatBatch = 喂给AI的历史记忆条数；输出固定少量（6~12条）避免刷屏
  const contextBatch = dyChatBatch.value || 50
  const recentChat = (room.chatLog || []).filter(c => !c.isMe).slice(-contextBatch)
    .map(c => c.isJoin ? `${c.user}来了` : `[${c.level ?? '?'}]${c.user}:${c.text}`).join('\n')
  const lastMe = includeUserMsg ? (room.chatLog || []).filter(c => c.isMe).slice(-1)[0] : null
  const fan = dyFanClub.value[room.creator]
  const levelNote = fan && fan.level > 0
    ? `\n${me}是这个直播间 ${fan.level} 级粉丝团成员${fan.level >= 10 ? '（高等级铁粉）' : ''}，主播对${me}${fan.level >= 20 ? `非常熟悉亲近，会主动点名、记得${me}` : fan.level >= 10 ? '比较熟络，愿意多回应' : '有印象'}。`
    : ''
  // ③ 用 redYan 而非 isFollowing 判断私密铁则（isFollowing=false也可能是红颜直播）
  const isRedYan = !!room.redYan
  const styleNote = isR18
    ? (isRedYan
      ? `【私密直播铁则·不可破】这是只对${me}和极少数知情亲密圈子开放的私密直播。聊天里绝对禁止任何陌生人、路人、男性观众；只允许与主播真正亲密且知情的极少数女性角色（若没有，chat留空）。口吻亲密撩人。违反即错误。`
      : `这是成人平台公开直播，观众可以有各种人，口吻成人化真实。`)
    : `这是普通抖音直播间，观众口吻真实日常。等级高的粉丝主播会更热络。`
  // ① 明确禁止 AI 扮演 me；replyNote 单独告知 me 刚说了什么
  const noImpersonateLine = `\n【禁止扮演${me}】聊天输出里绝对不能出现昵称为"${me}"的发言，因为${me}是真实用户，不是AI生成的角色。`
  const replyNote = lastMe ? `\n${me}刚发言：「${lastMe.text}」——主播${room.creator}或其他观众要自然回应这句话（可@${me}或顺口接），别无视。` : ''
  const contMustLine = `\n【连续性铁则】这是同一场直播的延续，主播始终是同一个人 @${room.creator}，正在直播「${room.title}」。在前面聊天的基础上自然往下推进，主播的状态、话题连贯，绝不能像换了个人或重开一场。`
  const instruction =
    `【${isR18 ? '抖阴' : '抖音'}·直播聊天·静默生成】主播 @${room.creator} 正在直播「${room.title}」。当前直播画面：${room.content}` +
    contMustLine +
    `\n${styleNote}${levelNote}${replyNote}${noImpersonateLine}` +
    `\n生成接下来 6~12 条聊天消息（少量精炼，包含1~2条进场"来了"和其余普通评论，真实口吻，等级有高有低，内容连贯不重复）。` +
    (recentChat ? `\n近期聊天记录（${contextBatch}条历史上下文，供连贯参考）：\n${recentChat}` : '') +
    `\n同时写一句直播画面推进（主播接下来在做什么，承接上文，2-3句）。` +
    `\n只输出一个 ===LIVECHAT=== 数据块，块外不写字：\n===LIVECHAT===\nscreen:推进后的直播画面描述\nc1:等级|||昵称|||内容（末尾加|||join表示进场消息）\nc2:...\n（共6~12条聊天，编号 c1..c12）\n===CHATEND===`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: '看直播聊天', should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: '生成直播间聊天消息，只输出 ===LIVECHAT=== 数据块，块外不写字。' },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const parsed = parseLiveChat(result, 12)
    // ① 过滤掉 AI 伪造的 me 发言（昵称完全匹配），防止冒名导致粉丝团等级混乱
    const safeMe = me.replace(/^@/, '')
    const newMsgs = parsed.msgs.filter(m => (m.user || '').replace(/^@/, '') !== safeMe)
    if (newMsgs.length && dyLiveRoom.value) {
      dyLiveRoom.value.chatLog = [...(dyLiveRoom.value.chatLog || []), ...newMsgs]
      // ⑦ 点赞随每批聊天自然递增（基于观众数）
      const viewers = parseInt((dyLiveRoom.value.viewers || '0').replace(/[^\d]/g, ''), 10) || 10
      const increment = Math.floor(viewers * (0.03 + Math.random() * 0.05))
      const oldLikes = parseInt((dyLiveRoom.value.liveLikes || '0').replace(/[,万]/g, '') || '0', 10)
      dyLiveRoom.value.liveLikes = String(oldLikes + increment)
      if (parsed.screen) {
        dyLiveRoom.value.content = parsed.screen
        // 回写 feed 里的直播卡，保持一致
        const fi = dyLiveRoom.value.feedIdx
        if (fi != null && douyinFeed.value[fi] && douyinFeed.value[fi].type === 'live') {
          douyinFeed.value[fi].content = parsed.screen
          douyinFeed.value[fi].liveLikes = dyLiveRoom.value.liveLikes
          douyinFeed.value[fi].chatLog = dyLiveRoom.value.chatLog.slice(-8)
          saveDyFeed()
        }
      }
      nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
    }
  } catch (e) { showToast('聊天生成失败：' + ((e && e.message) || e)) }
  finally { generatingLiveChat.value = false }
}
// 用户在直播间发言 → 追加进聊天列表 → 触发AI生成主播+其他人回应
function submitLiveChat() {
  const txt = dyLiveChatDraft.value.trim(); if (!txt || !dyLiveRoom.value) return
  const me = meName.value || '我'
  const replyTo = dyLiveReplyTo.value
  dyLiveRoom.value.chatLog.push({ level: null, user: me, text: (replyTo ? `回复@${replyTo} ` : '') + txt, isJoin: false, isMe: true })
  dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''
  nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
  generateLiveChat(true)   // 发言即推进：AI生成回应
}
// ---- 粉丝团 & 等级 ----
function saveDyFanClub() { try { localStorage.setItem(DY_FAN_KEY, JSON.stringify(dyFanClub.value)) } catch (e) {} }
function saveDyDiamond() { try { localStorage.setItem(DY_DIAMOND_KEY, String(dyDiamond.value)) } catch (e) {} }
// 当前直播间的粉丝团信息
const curFan = computed(() => {
  const c = dyLiveRoom.value && dyLiveRoom.value.creator
  return c ? (dyFanClub.value[c] || null) : null
})
// 观众头像：从聊天记录取去重真实用户，按粉丝等级降序，取前4个（④ 左压右堆叠）
const dyLiveViewers = computed(() => {
  if (!dyLiveRoom.value) return []
  const me = (meName.value || '').replace(/^@/, '')
  const seen = new Set()
  const out = []
  for (const msg of (dyLiveRoom.value.chatLog || [])) {
    const u = (msg.user || '').replace(/^@/, '')
    if (!u || u === me || seen.has(u)) continue
    seen.add(u)
    out.push({ name: u, level: msg.level ?? 0 })
  }
  out.sort((a, b) => b.level - a.level)
  return out.slice(0, 4)
})
// exp → level：每级所需经验递增（简单：level = floor(sqrt(exp/50))，够用）
function expToLevel(exp) { return Math.max(0, Math.floor(Math.sqrt((exp || 0) / 50))) }
// 等级 → 渐变色：每10级一档
function levelColor(lv) {
  const tiers = [
    ['#9aa0a6', '#c7ccd1'],   // 0-9 银灰
    ['#4a90d9', '#6fb1e8'],   // 10-19 蓝
    ['#39b57a', '#5fd39a'],   // 20-29 绿
    ['#c084e8', '#a05fd3'],   // 30-39 紫
    ['#f0a030', '#f5c060'],   // 40-49 金
    ['#fe2c55', '#ff6b8a'],   // 50-59 红
    ['#ff8c00', '#ffd700'],   // 60+ 橙金
  ]
  const t = tiers[Math.min(tiers.length - 1, Math.floor((lv || 0) / 10))]
  return `linear-gradient(135deg, ${t[0]}, ${t[1]})`
}
// 点❤️：加入/已加入粉丝团（0级起步）
function sendLiveHeart() {
  if (!dyLiveRoom.value) return
  const c = dyLiveRoom.value.creator
  if (!dyFanClub.value[c]) {
    dyFanClub.value = { ...dyFanClub.value, [c]: { level: 0, exp: 0 } }
    saveDyFanClub()
    const me = meName.value || '我'
    dyLiveRoom.value.chatLog.push({ level: 0, user: me, text: '加入了粉丝团', isJoin: false, isMe: true })
    nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
    showToast('已加入 @' + c + ' 的粉丝团')
  } else {
    showToast('送礼可以提升粉丝团等级哦')
  }
}
// 打开礼物面板
function openGiftPanel() { if (dyLiveRoom.value) showGiftPanel.value = true }
// 送出礼物：扣钻、加经验/升级、聊天飘消息、触发主播反应
function sendGift(g) {
  if (!dyLiveRoom.value) return
  if (dyDiamond.value < g.price) { showToast('钻石不足，先充值吧'); return }
  const c = dyLiveRoom.value.creator
  const me = meName.value || '我'
  dyDiamond.value -= g.price; saveDyDiamond()
  const cur = dyFanClub.value[c] || { level: 0, exp: 0 }
  const newExp = cur.exp + g.exp
  const oldLevel = cur.level
  const newLevel = expToLevel(newExp)
  dyFanClub.value = { ...dyFanClub.value, [c]: { level: newLevel, exp: newExp } }
  saveDyFanClub()
  dyLiveRoom.value.chatLog.push({ level: newLevel, user: me, text: `送出了 ${g.icon}${g.name}`, isJoin: false, isMe: true, isGift: true })
  if (newLevel > oldLevel) {
    dyLiveRoom.value.chatLog.push({ level: newLevel, user: me, text: `粉丝团升到 ${newLevel} 级！`, isJoin: false, isMe: true, isLevelUp: true })
    showToast('粉丝团升到 ' + newLevel + ' 级')
  }
  showGiftPanel.value = false
  nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
  generateLiveChat(true)   // 主播当场感谢礼物
}
// 假充值：多档位+自定义
function rechargeDiamond(amount) {
  const n = Math.round(+amount)
  if (!n || n <= 0) return
  dyDiamond.value += n * 10   // 演示：1元=10钻
  saveDyDiamond()
  showToast(`充值 ${n} 元 → +${n * 10} 钻 (当前 ${dyDiamond.value})`)
  showRecharge.value = false; rechargeDraft.value = ''
}
function applyRechargeDraft() {
  const n = parseInt(rechargeDraft.value, 10)
  if (!isNaN(n) && n > 0) rechargeDiamond(n)
  else showToast('请输入正整数金额')
}
// 直播出现概率设置
function setDyLivePct(p) { p = Math.round(+p); if (isNaN(p)) return; p = Math.max(0, Math.min(100, p)); dyLivePct.value = p; douyinSettings.value.livePct = p; saveDySettings() }
function applyLivePctDraft() { const n = parseInt(livePctDraft.value, 10); if (!isNaN(n)) { setDyLivePct(n); showToast('直播概率已设为 ' + dyLivePct.value + '%') } livePctDraft.value = '' }
// 聊天条数设置
function setDyChatBatch(n) { n = Math.round(+n); if (isNaN(n)) return; n = Math.max(10, Math.min(200, n)); dyChatBatch.value = n; douyinSettings.value.chatBatch = n; saveDySettings() }
function applyChatBatchDraft() { const n = parseInt(chatBatchDraft.value, 10); if (!isNaN(n)) { setDyChatBatch(n); showToast('每批聊天已设为 ' + dyChatBatch.value + ' 条') } chatBatchDraft.value = '' }
// 视频评论回复
function setDyReplyTo(c) { dyReplyTo.value = (c.user||'').replace(/^@/, ''); }
// 对回复项继续回复（楼中楼）：目标仍挂在同一父评论的 replies 里，但 replyTo 指向该回复的作者
function setDyReplyToFromReply(parentComment, replyItem) {
  dyReplyTo.value = (replyItem.user||'').replace(/^@/, '')
  // 存一下父评论引用，submitDyComment 回复时挂到这个父评论
  dyReplyParent.value = parentComment
}

// ---- 相机快门（常规模式：注入正文） ----
function doShutter() {
  if (sendingCamera.value) return
  if (silentMap.value['相机']) { silentCamera(); return }
  const line = cameraDraft.value.trim() ? `（我举起手机拍照：${cameraDraft.value.trim()}）` : `（我举起手机拍了张照）`
  cameraDraft.value = ''
  try {
    const ta = doc.querySelector('#send_textarea')
    if (ta) {
      const cur = (ta.value || '').replace(/\s+$/, '')
      ta.value = cur ? cur + '\n\n' + line : line
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      const btn = doc.querySelector('#send_but'); if (btn) btn.click()
    }
  } catch (e) {}
}

// ---- 相机快门（纯手机模式：静默生成照片描述） ----
async function silentCamera() {
  const th = TH()
  if (!th || (!th.generateRaw && !th.generate)) { showToast('当前环境不支持纯手机模式生成'); return }
  sendingCamera.value = true
  const subject = cameraDraft.value.trim()
  cameraDraft.value = ''
  const mode = cameraMode.value
  const timeNow = storyTime()
  const instruction =
    `【相机快门】根据当前剧情场景，为这张手机照片生成真实描述。` +
    (subject ? `拍摄对象：${subject}。` : '') +
    (mode === '透视' ? `透视模式开启，透过衣物描述被拍者。` : '') +
    `只输出一个 <照片> 块，块外不写任何其它文字。格式：\n<照片>\n拍摄者: 拍照的角色名\n对象: 被拍摄主体\n时间: ${timeNow || 'YYYY年MM月DD日 HH:MM'}\n画面: 照片内容的具体描述\n</照片>`
  try {
    const history = buildSilentHistory('', '')
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({
        user_input: subject || `（举起手机拍照）`,
        should_silence: true,
        ordered_prompts: [
          { role: 'system', content: instruction },
          'persona_description',
          'char_description',
          'world_info_before',
          'world_info_after',
          ...history,
          { role: 'user', content: subject || `（举起手机拍照）` },
        ],
      })
    } else {
      result = await th.generate({ user_input: instruction, should_silence: true, overrides: { chat_history: { with_depth_entries: false, prompts: history } } })
    }
    const text = typeof result === 'string' ? result : (result && result.content) || ''
    const got = ingestPhotoBlock(text, mode)
    if (!got) showToast('未能解析到照片')
    else { view.value = 'album'; selectedPhoto.value = photos.value[photos.value.length - 1] }
  } catch (e) { showToast('生成失败：' + ((e && e.message) || e)) }
  finally { sendingCamera.value = false }
}

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
let lockedH = 0
let vvRef = null
let vvHandler = null
let genCtx = null
let onGenEnded = null
let onGenStopped = null
let pendingRef = null                  // 当前乐观写、待确认的发出消息 { owner, contact, msg }

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
      if (silentBusy.value) return          // 纯手机模式由 silentReply 自行落库/清态
      clearPending()                        // 生成结束：乐观写的发出条转正（不再要求 sendingContact 仍在，超时清空后也要转正）
      setTimeout(() => { loadLogs(); syncScrape(); sendingContact.value = ''; clearTimeout(sendTimer) }, 250)
    }
    onGenStopped = () => {
      if (silentBusy.value) return
      sendingContact.value = ''; clearTimeout(sendTimer)
      if (pendingRef) { markFailed(pendingRef); pendingRef = null }   // API 断/被停：标红可重发（pendingRef 本身就是 {owner,contact,sid}）
      showToast('消息发送失败，点消息旁的感叹号可重发')
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
    if (layoutH - vv.height > 140) {   // 软键盘弹起：完全锁定尺寸，不缩放
      if (!lockedW && phoneEl.value) {
        lockedW = phoneEl.value.offsetWidth
        lockedH = phoneEl.value.offsetHeight
      }
      // 保持手机原始尺寸，顶部对齐，底部输入框保持可用
      phoneStyle.value = {
        height: (lockedH || 700) + 'px',
        width: (lockedW || Math.round(vv.width * 0.94)) + 'px',
        maxWidth: 'none',
        aspectRatio: 'auto',
        marginTop: '0',
        alignSelf: 'flex-start'
      }
    } else {
      lockedW = 0; lockedH = 0; phoneStyle.value = null
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
  tick(); loadLogs(); loadRemarks(); loadPhotos(); loadDyData(); syncScrape(); syncScrapePhotos()
  timer = setInterval(() => { tick(); loadLogs(); loadRemarks(); loadPhotos(); syncScrape(); syncScrapePhotos(); healPending() }, 2000)
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
.mp-phone > *:not(.mp-power):not(.mp-island):not(.mp-cam):not(.mp-album):not(.mp-wp-panel):not(.mp-dy){position:relative;z-index:2}
.mp-island{position:absolute;left:50%;top:10px;transform:translateX(-50%);width:86px;height:23px;background:#000;border-radius:12px;z-index:8}

/* 状态栏 */
.mp-status{display:flex;align-items:center;justify-content:space-between;padding:8px 34px 6px;font-size:14px;font-weight:600;color:#111;flex-shrink:0}
.st-light .mp-status{color:#fff}
.mp-st-time{letter-spacing:.02em;font-variant-numeric:tabular-nums}
.mp-st-ico{display:flex;align-items:center;gap:6px}
.mp-st-sig{width:17px;height:12px}.mp-st-wifi{width:16px;height:13px}
.mp-st-bat{width:24px;height:12px;border:1.4px solid currentColor;border-radius:3px;position:relative;opacity:.85}
.mp-st-bat::after{content:'';position:absolute;inset:1.5px;right:6px;background:currentColor;border-radius:1px}
.mp-st-bat::before{content:'';position:absolute;right:-3px;top:3.5px;width:2px;height:4px;background:currentColor;border-radius:0 1px 1px 0}

.mp-screen{flex:1;display:flex;flex-direction:column;min-height:0;border-radius:33px;overflow:hidden;background:#ededed;position:relative}
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
.ico-dy{background:#000}
.ico-dy svg{position:absolute;width:30px;height:30px}
.ico-dy .ico-dy-b{transform:translate(-2.5px,0)}
.ico-dy .ico-dy-r{transform:translate(2.5px,0)}
.ico-dy .ico-dy-w{transform:none}
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
.mp-bub{position:relative;max-width:64%;padding:9px 12px;border-radius:5px;font-size:15px;line-height:1.45;color:#0d0d0d;background:#fff;word-break:break-word;white-space:pre-wrap;cursor:pointer}
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
/* 发送失败红感叹号 / 发送中转圈，紧贴气泡（out 行为 row-reverse，故居气泡左侧） */
.mp-fail{align-self:center;flex-shrink:0;width:19px;height:19px;border:none;border-radius:50%;background:#fa5151;color:#fff;font-size:13px;font-weight:700;line-height:1;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(250,81,81,.4)}
.mp-fail:active{transform:scale(.9)}
.mp-pending{align-self:center;flex-shrink:0;width:16px;height:16px;border:2px solid #c8c8ca;border-top-color:#8a8a8e;border-radius:50%;animation:mp-spin .7s linear infinite}
@keyframes mp-spin{100%{transform:rotate(360deg)}}
.mp-toast{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);background:rgba(0,0,0,.78);color:#fff;font-size:12.5px;padding:7px 14px;border-radius:8px;z-index:10;white-space:nowrap;animation:mp-fade .2s ease-out;pointer-events:none}
.mp-row.sys{justify-content:center;margin-bottom:8px}
.mp-bub.mt-系统{background:transparent!important;padding:2px 0!important;max-width:100%;box-shadow:none}
.mp-bub.mt-系统::before{display:none}
.mp-sys-text{font-size:12px;color:#888}
.mp-ctx-overlay{position:absolute;inset:0;z-index:30;display:flex;align-items:flex-end;background:rgba(0,0,0,.38);animation:mp-fade .15s ease-out}
.mp-ctx-sheet{width:100%;background:#f7f7f7;border-radius:12px 12px 0 0;overflow:hidden;padding-bottom:env(safe-area-inset-bottom,8px)}
.mp-ctx-item{display:block;width:100%;padding:13px 18px;border:none;border-bottom:1px solid rgba(0,0,0,.06);background:#fff;text-align:left;font-size:15px;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-ctx-item:active{background:#e8e8e8}
.mp-ctx-item.danger{color:#fa5151}
.mp-ctx-cancel{display:block;width:100%;margin-top:8px;padding:13px 18px;border:none;background:#fff;text-align:center;font-size:15px;font-weight:600;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-ctx-cancel:active{background:#e8e8e8}

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

/* 设置总控（主屏设置 app），iOS 风格 */
.mp-setapp{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;background:#efeff4;border-radius:33px;overflow:hidden;animation:mp-slidein .28s ease-out}
@keyframes mp-slidein{0%{transform:translateX(24px);opacity:.4}100%{transform:translateX(0);opacity:1}}
.mp-setapp-status{color:#111}
.mp-setapp-nav{display:flex;align-items:center;position:relative;padding:4px 12px 12px;background:#efeff4}
.mp-setapp-title{flex:1;text-align:center;font-size:17px;font-weight:600;color:#0d0d0d;margin-left:-26px}
.mp-setapp-body{flex:1;overflow-y:auto;padding-bottom:20px}
.mp-setapp-body::-webkit-scrollbar{width:0}
.mp-setapp-hd{padding:16px 18px 8px;font-size:13px;color:#8a8a8e;letter-spacing:.3px}
.mp-setapp-desc{padding:0 18px 14px;font-size:12.5px;color:#8a8a8e;line-height:1.65}
.mp-setapp-sec{background:#fff;border-top:1px solid #e2e2e6;border-bottom:1px solid #e2e2e6}
.mp-setapp-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid #f0f0f2}
.mp-setapp-row:last-child{border-bottom:none}
.mp-setapp-row.dim{opacity:.6}
.mp-setapp-ico{flex-shrink:0;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.mp-setapp-lbl{flex:1;font-size:15.5px;color:#0d0d0d;display:flex;align-items:center;gap:8px}
.mp-setapp-soon{font-size:11px;color:#b0b0b4;background:#f0f0f2;border-radius:4px;padding:1px 6px}
.mp-setapp-arrow{color:#c4c4c8;font-size:19px}
.mp-setapp-note{padding:16px 18px;font-size:12px;color:#a0a0a4;line-height:1.6}

/* 主屏壁纸 */
.mp-home{transition:background .4s}

/* 新 app 图标色 */
.ico-album{background:linear-gradient(160deg,#7eb8f7,#3a7bd5)}
.ico-wp{background:linear-gradient(160deg,#f7c97e,#e0903a)}

/* 抖音 */
.mp-dy{position:absolute;inset:7px;z-index:12;display:flex;flex-direction:column;background:#000;border-radius:33px;overflow:hidden}
/* 抖音内的状态栏（时间/信号/电量） */
.mp-dy-status{position:absolute;top:0;left:0;right:0;z-index:21;height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;pointer-events:none}
.mp-dy-st-time{color:#fff;font-size:13px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.mp-dy-st-ico{display:flex;align-items:center;gap:4px}
.mp-dy-st-ico svg{width:13px;height:13px;color:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}
.mp-dy-st-bat{width:20px;height:10px;border:1.2px solid rgba(255,255,255,.85);border-radius:2.5px;position:relative}
.mp-dy-st-bat::after{content:'';position:absolute;left:1px;top:1px;bottom:1px;width:12px;background:#fff;border-radius:1px}
.mp-dy-st-bat::before{content:'';position:absolute;right:-3px;top:3px;bottom:3px;width:1.5px;background:rgba(255,255,255,.85);border-radius:0 1px 1px 0}
.mp-dy-nav{position:absolute;top:26px;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:4px 14px 6px;background:linear-gradient(to bottom,rgba(0,0,0,.45),transparent)}
.mp-dy-back{color:#fff!important}
.mp-dy-tabs{display:flex;gap:13px;align-items:center;flex:1;justify-content:center}
.mp-dy-tab-dim{color:rgba(255,255,255,.55);font-size:14px;font-weight:500;text-shadow:0 1px 3px rgba(0,0,0,.4)}
.mp-dy-tab{background:none;border:none;color:rgba(255,255,255,.7);font-size:15px;font-weight:500;cursor:pointer;padding:0 0 4px;position:relative;font-family:inherit;text-shadow:0 1px 3px rgba(0,0,0,.4)}
.mp-dy-tab.on{color:#fff;font-size:17px;font-weight:700}
.mp-dy-tab.on::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:16px;height:2.5px;border-radius:2px;background:#fff}
.mp-dy-search-ico{width:22px;height:22px;fill:#fff;opacity:.85;flex-shrink:0;cursor:pointer}
.mp-dy-progress{font-size:11px;color:rgba(255,255,255,.6);white-space:nowrap;flex-shrink:0;text-shadow:0 1px 3px rgba(0,0,0,.5)}
.mp-dy-feed{flex:1;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none;overflow-anchor:none}
.mp-dy-feed::-webkit-scrollbar{display:none}
.mp-dy-slide{position:relative;height:100%;min-height:100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;align-items:stretch;background:#111;overflow-anchor:none}
.mp-dy-grad-top{position:absolute;top:0;left:0;right:0;height:100px;background:linear-gradient(to bottom,rgba(0,0,0,.45),transparent);z-index:2;pointer-events:none}
.mp-dy-grad-bot{position:absolute;bottom:0;left:0;right:0;height:180px;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);z-index:2;pointer-events:none}
/* 画面文字：左右对称、限高、超出可滚动 */
.mp-dy-content{position:absolute;top:78px;left:16px;right:16px;max-height:44%;z-index:3;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.mp-dy-content::-webkit-scrollbar{width:2px}
.mp-dy-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.35);border-radius:2px}
.mp-dy-content-in{font-size:14.5px;line-height:1.75;color:rgba(255,255,255,.94);white-space:pre-wrap;word-break:break-word;text-shadow:0 1px 4px rgba(0,0,0,.55);text-align:left}
.mp-dy-content[class*="flip"]{cursor:pointer}
.mp-dy-content.flip .mp-dy-content-in{color:#ffd9e6}
.mp-dy-flip-hint{margin-top:8px;font-size:11px;color:rgba(255,180,210,.85);letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.mp-dy-ph{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;background:#111;z-index:4}
.mp-dy-empty,.mp-dy-loading,.mp-dy-next{justify-content:center;align-items:center;flex-direction:column;gap:12px;cursor:pointer}
.mp-dy-next-ico svg{width:34px;height:34px;fill:rgba(255,255,255,.5)}
.mp-dy-swipe-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:118px;z-index:6;pointer-events:none;animation:mp-dy-bob 1.6s ease-in-out infinite}
.mp-dy-swipe-hint svg{width:20px;height:20px;fill:rgba(255,255,255,.45)}
@keyframes mp-dy-bob{0%,100%{transform:translateX(-50%) translateY(0);opacity:.35}50%{transform:translateX(-50%) translateY(-6px);opacity:.7}}
.mp-dy-empty-ico{color:rgba(255,255,255,.6)}
.mp-dy-empty-txt,.mp-dy-load-txt{color:rgba(255,255,255,.6);font-size:14px}
.mp-dy-spinner{display:flex;gap:6px;align-items:center}
.mp-dy-spinner span{width:8px;height:8px;border-radius:50%;background:#fe2c55;animation:mp-bnc 1s infinite}
.mp-dy-spinner span:nth-child(2){animation-delay:.15s}.mp-dy-spinner span:nth-child(3){animation-delay:.3s}
/* 弹幕带：文字区下方独立区域，互不干扰 */
.mp-dy-dm-band{position:absolute;left:0;right:0;top:calc(78px + 44% + 10px);height:92px;z-index:4;pointer-events:none;overflow:hidden}
.mp-dy-dm{position:absolute;left:0;white-space:nowrap;font-size:13px;color:rgba(255,255,255,.88);text-shadow:0 1px 3px rgba(0,0,0,.7);animation-name:mp-dy-fly;animation-timing-function:linear;animation-fill-mode:forwards}
@keyframes mp-dy-fly{from{transform:translateX(340px)}to{transform:translateX(-100%)}}
.mp-dy-info{position:absolute;bottom:64px;left:14px;right:68px;z-index:5;display:flex;flex-direction:column;gap:5px}
.mp-dy-creator-row{display:flex;align-items:center;gap:6px}
.mp-dy-creator-name{color:#fff;font-size:15px;font-weight:700}
.mp-dy-verified{color:#20d5ec;font-size:12px;font-weight:700}
.mp-dy-follow-btn{padding:1px 8px;border:1px solid #fff;border-radius:3px;background:transparent;color:#fff;font-size:12px;cursor:pointer;font-family:inherit}
.mp-dy-followed{padding:1px 8px;border:1px solid rgba(255,255,255,.35);border-radius:3px;color:rgba(255,255,255,.6);font-size:12px;cursor:pointer}
.mp-dy-caption{color:rgba(255,255,255,.9);font-size:13px;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mp-dy-sound-row{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.8);font-size:12px}
.mp-dy-note-ico{font-size:13px}
.mp-dy-sound-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-dy-actions{position:absolute;right:8px;bottom:68px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:16px}
.mp-dy-ava-wrap{position:relative;width:44px;margin-bottom:4px}
.mp-dy-ava{width:44px;height:44px;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,#fe2c55,#ff6d9f);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff}
.mp-dy-ava-plus{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:18px;height:18px;border-radius:50%;background:#fe2c55;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1}
.mp-dy-act-btn{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;color:#fff;padding:0}
.mp-dy-act-btn svg{width:30px;height:30px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))}
.mp-dy-act-btn span{font-size:11.5px;font-weight:500;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.mp-dy-act-btn.on svg{fill:#fe2c55}
.mp-dy-act-btn.star svg{fill:#febe2c}
/* 取消静音胶囊 */
.mp-dy-mute{position:absolute;right:8px;bottom:58px;z-index:16;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:16px;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);cursor:pointer}
.mp-dy-mute svg{width:15px;height:15px;fill:#fff}
.mp-dy-mute span{color:#fff;font-size:11.5px;font-weight:500}
/* 底部导航栏 */
.mp-dy-tabbar{position:absolute;left:0;right:0;bottom:0;z-index:15;height:48px;display:flex;align-items:center;background:#161616;border-top:1px solid rgba(255,255,255,.08)}
.mp-dy-tb{flex:1;background:none;border:none;color:rgba(255,255,255,.55);font-size:14.5px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center}
.mp-dy-tb.on{color:#fff;font-weight:700}
.mp-dy-tb-add{flex:0 0 auto;padding:0}
.mp-dy-tb-add svg{width:42px;height:28px;fill:#fff;background:linear-gradient(90deg,#26f4ee,#fe2c55);border-radius:8px;padding:2px 6px}
.mp-dy-cm-overlay{position:absolute;inset:0;z-index:25;background:rgba(0,0,0,.4);display:flex;align-items:flex-end}
.mp-dy-cm-sheet{width:100%;height:68%;background:#fff;border-radius:14px 14px 0 0;display:flex;flex-direction:column;overflow:hidden;animation:mp-dy-cm-up .28s cubic-bezier(.2,.8,.3,1)}
@keyframes mp-dy-cm-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mp-dy-cm-handle{width:34px;height:4px;border-radius:2px;background:#e0e0e0;margin:8px auto 0}
.mp-dy-cm-hd{position:relative;display:flex;align-items:center;justify-content:center;padding:10px 16px 8px}
.mp-dy-cm-count{color:#161823;font-size:14px;font-weight:600}
.mp-dy-cm-x{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;display:flex}
.mp-dy-cm-x svg{width:20px;height:20px;fill:#161823}
.mp-dy-cm-body{flex:1;overflow-y:auto;padding:4px 16px}
.mp-dy-cm-body::-webkit-scrollbar{width:0}
.mp-dy-cmt{display:flex;gap:10px;padding:12px 0}
.mp-dy-cmt-ava{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#fe2c55,#ff8c69);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0}
.mp-dy-cmt-main{flex:1;min-width:0}
.mp-dy-cmt-user{font-size:13px;color:#8a8b91;margin-bottom:3px}
.mp-dy-cmt-text{font-size:15px;color:#161823;line-height:1.45;word-break:break-word}
.mp-dy-cmt-meta{display:flex;align-items:center;gap:14px;margin-top:5px;font-size:12px;color:#b0b1b6}
.mp-dy-cmt-reply{color:#8a8b91}
.mp-dy-cmt-expand{display:flex;align-items:center;gap:2px;margin-top:8px;font-size:13px;color:#516ba5}
.mp-dy-cmt-expand svg{width:15px;height:15px;fill:#516ba5}
/* 点赞/踩：与用户名同高起排，两枚上下对齐居中 */
.mp-dy-cmt-lk{display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;padding-top:1px;width:26px}
.mp-dy-cmt-lk-one{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;color:#8a8b91;font-size:11px;line-height:1}
.mp-dy-cmt-lk-one svg{width:17px;height:17px;fill:#c1c2c6}
.mp-dy-cmt-lk-one.on svg{fill:#fe2c55}
.mp-dy-cmt-lk-one.on{color:#fe2c55}
.mp-dy-cmt-lk-one.dis svg{fill:#4a90d9}
.mp-dy-cm-none{text-align:center;color:#b0b1b6;padding:36px 0;font-size:14px}
.mp-dy-cm-more{text-align:center;color:#b0b1b6;padding:14px 0 20px;font-size:12.5px}
.mp-dy-cm-input{display:flex;align-items:center;gap:10px;padding:8px 14px 12px;border-top:1px solid #f0f0f2}
.mp-overlay .mp-dy-cm-in{flex:1;min-width:0;background:#fff!important;border:1px solid #e8e8ea!important;border-radius:18px;padding:9px 15px;color:#161823!important;font-size:14px;font-family:inherit;outline:none;box-shadow:none!important;background-image:none!important}
.mp-overlay .mp-dy-cm-in:focus{border-color:#d0d0d4!important;background:#fff!important}
.mp-overlay .mp-dy-cm-in::placeholder{color:#b0b1b6!important}
.mp-dy-cm-ic{font-size:19px;color:#61626a;cursor:pointer;flex-shrink:0}
.mp-dy-cm-send{padding:8px 16px;border:none;border-radius:18px;background:#fe2c55;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0}
.mp-dy-mode-tag{font-size:12px;padding:2px 8px;border-radius:10px;background:rgba(254,44,85,.15);color:#fe2c55;border:1px solid rgba(254,44,85,.3)}
.mp-dy-mode-tag.r18{background:rgba(130,0,30,.3);color:#ff6b9d;border-color:rgba(255,107,157,.3)}
.mp-dy-settings-panel{background:#f7f7fa;padding:8px 16px 12px;border-bottom:1px solid #e2e2e6}
.mp-dy-set-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0}
.mp-dy-set-lbl{font-size:14px;color:#444}
.mp-dy-set-btns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.mp-dy-set-btn{padding:4px 12px;border:1px solid #ddd;border-radius:14px;background:#fff;font-size:13px;color:#666;cursor:pointer;font-family:inherit}
.mp-dy-set-btn.on{background:#fe2c55;border-color:#fe2c55;color:#fff}
.mp-dy-set-note{font-size:12px;color:#8a8a90;line-height:1.5;padding:2px 0 8px}
.mp-dy-set-note b{color:#666;font-weight:600}
.mp-dy-set-subhd{font-size:13px;font-weight:600;color:#444;padding:8px 0 4px;border-top:1px solid #ececf0;margin-top:6px}
.mp-dy-set-warn{font-size:12px;color:#c0392b;line-height:1.55;padding:4px 0 8px}
.mp-dy-set-warn b{font-weight:700}
.mp-overlay .mp-dy-set-input{width:56px;padding:4px 6px;border:1px solid #ddd!important;border-radius:14px;background:#fff!important;font-size:13px;color:#333!important;font-family:inherit;text-align:center;outline:none;box-shadow:none!important;-webkit-appearance:none;appearance:none}
.mp-overlay .mp-dy-set-input:focus{border-color:#fe2c55!important}
.mp-overlay .mp-dy-set-input::placeholder{color:#b0b0b0!important}
.mp-overlay .mp-dy-set-input.on{border-color:#fe2c55!important;color:#fe2c55!important;font-weight:600}
.mp-dy-tab-pv.on{color:#ff6b9d}
.mp-dy-tab-pv.on::after{background:#ff6b9d}
.mp-dy-set-clear{width:100%;margin-top:6px;padding:8px;border:none;border-radius:8px;background:#f0f0f2;color:#666;font-size:13px;cursor:pointer;font-family:inherit}
.mp-dy-set-clear:active{background:#e0e0e2}
/* 观看历史 */
.mp-dyh{position:absolute;inset:0;z-index:30;background:#fff;display:flex;flex-direction:column}
.mp-dyh-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #eee;flex-shrink:0}
.mp-dyh-hd .mp-nav-back{background:none;border:none;cursor:pointer;padding:0;width:24px;height:24px}
.mp-dyh-hd .mp-nav-back svg{width:22px;height:22px;fill:#161823}
.mp-dyh-title{font-size:16px;font-weight:600;color:#161823}
.mp-dyh-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mp-dyh-body::-webkit-scrollbar{width:0}
.mp-dyh-none{text-align:center;color:#999;font-size:14px;padding:40px 0}
.mp-dyh-item{display:flex;gap:12px;padding:11px 14px;cursor:pointer;align-items:center}
.mp-dyh-item:active{background:#f5f5f7}
.mp-dyh-thumb{width:48px;height:64px;border-radius:8px;background:linear-gradient(135deg,#3a3a3a,#1a1a1a);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0}
.mp-dyh-thumb.pv{background:linear-gradient(135deg,#82001e,#3a0010)}
.mp-dyh-info{flex:1;min-width:0}
.mp-dyh-author{font-size:14px;font-weight:600;color:#161823;display:flex;align-items:center;gap:6px}
.mp-dyh-pvtag{font-size:10px;padding:1px 6px;border-radius:8px;background:rgba(255,107,157,.15);color:#ff6b9d}
.mp-dyh-txt{font-size:13px;color:#888;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 抖音搜索 */
.mp-dy-search-pill{flex:1;display:flex;align-items:center;gap:6px;margin:0 8px;min-width:0;height:30px;padding:0 12px;border-radius:16px;background:rgba(255,255,255,.16);cursor:pointer}
.mp-dy-search-pill svg{width:16px;height:16px;fill:#fff;opacity:.85;flex-shrink:0}
.mp-dy-search-pill-txt{flex:1;min-width:0;font-size:13px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.4)}
.mp-dys{position:absolute;inset:0;z-index:32;background:#fff;display:flex;flex-direction:column}
.mp-dys-top{display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid #eee}
.mp-dys-top .mp-nav-back{background:none;border:none;cursor:pointer;padding:0;width:24px;height:24px;flex-shrink:0}
.mp-dys-top .mp-nav-back svg{width:22px;height:22px;fill:#161823}
.mp-dys-box{flex:1;display:flex;align-items:center;gap:6px;min-width:0;height:34px;padding:0 12px;border-radius:17px;background:#f2f2f4}
.mp-dys-box svg{width:16px;height:16px;fill:#9a9a9a;flex-shrink:0}
.mp-overlay .mp-dys-in{flex:1;min-width:0;height:100%;border:none!important;background:transparent!important;color:#161823!important;font-size:14px;outline:none;font-family:inherit;box-shadow:none!important;background-image:none!important}
.mp-overlay .mp-dys-in::placeholder{color:#b0b1b6!important}
.mp-dys-clr{background:none;border:none;cursor:pointer;color:#b0b0b4;font-size:13px;padding:0 2px;flex-shrink:0}
.mp-dys-btn{background:none;border:none;cursor:pointer;color:#fe2c55;font-size:15px;font-weight:600;flex-shrink:0;padding:0 2px;font-family:inherit}
.mp-dys-recent{padding:16px 14px 0}
.mp-dys-recent-hd{font-size:13px;color:#8a8a8e;margin-bottom:10px}
.mp-dys-chips{display:flex;flex-wrap:wrap;gap:8px}
.mp-dys-chip{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:6px 12px;border-radius:15px;background:#f2f2f4;color:#333;font-size:13px;cursor:pointer;overflow:hidden}
.mp-dys-chip:active{background:#e6e6e9}
.mp-dys-chip-x{font-style:normal;color:#b0b0b4;font-size:11px;flex-shrink:0}
.mp-dys-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mp-dys-scroll::-webkit-scrollbar{width:0}
.mp-dys-hot{padding:18px 14px 20px}
.mp-dys-hot-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.mp-dys-hot-title{font-size:15px;font-weight:700;color:#161823}
.mp-dys-hot-refresh{background:none;border:none;cursor:pointer;color:#8a8a8e;padding:2px;display:flex}
.mp-dys-hot-refresh svg{width:17px;height:17px}
.mp-dys-hot-refresh.spin svg{animation:mp-dys-spin 1s linear infinite}
@keyframes mp-dys-spin{to{transform:rotate(360deg)}}
.mp-dys-hot-loading,.mp-dys-hot-empty{color:#999;font-size:13px;padding:14px 2px}
.mp-dys-hot-row{display:flex;align-items:center;gap:10px;padding:9px 2px;cursor:pointer}
.mp-dys-hot-row:active{background:#f7f7f9}
.mp-dys-hot-rank{width:18px;text-align:center;font-size:14px;font-weight:700;color:#b0b1b6;flex-shrink:0}
.mp-dys-hot-rank.top{color:#fe2c55}
.mp-dys-hot-topic{flex:1;min-width:0;font-size:14px;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-dys-hot-heat{font-size:12px;color:#b0b1b6;flex-shrink:0}
/* 直播卡（feed里） */
.mp-dy-live-badge{display:inline-block;align-self:flex-start;background:#fe2c55;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:.5px;margin-bottom:6px}
.mp-dy-live-enter-ico{width:16px;height:16px;fill:#fff;flex-shrink:0}
.mp-dy-live-content{position:absolute;top:0;left:0;right:0;bottom:30%;display:flex;align-items:center;justify-content:center;padding:60px 24px 20px;text-align:center;font-size:17px;line-height:1.7;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7);overflow:hidden;background:linear-gradient(160deg,#1a1320,#0e0b14)}
.mp-dy-live-enter{position:absolute;top:60%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px;padding:11px 22px;border:none;border-radius:24px;background:rgba(255,255,255,.22);backdrop-filter:blur(6px);color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
.mp-dy-live-enter:active{background:rgba(255,255,255,.35)}
/* 关注tab直播头像条 */
.mp-dy-live-strip{display:flex;gap:14px;padding:14px 14px 10px;overflow-x:auto;flex-shrink:0;background:transparent;-webkit-overflow-scrolling:touch}
.mp-dy-live-strip::-webkit-scrollbar{display:none}
.mp-dy-ls-item{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0}
.mp-dy-ls-ava{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#fe2c55,#ff6b9d);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;position:relative;border:2.5px solid #fe2c55}
.mp-dy-ls-dot{position:absolute;bottom:0;right:0;font-size:9px;color:#fe2c55;background:#fff;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;line-height:1}
.mp-dy-ls-name{font-size:11px;color:rgba(255,255,255,.85);max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.5)}
/* 直播间全屏 overlay */
.mp-dylv{position:absolute;inset:0;z-index:34;display:flex;flex-direction:column;background:#0d0d10}
.mp-dylv-top{display:flex;align-items:center;gap:8px;padding:10px 12px 8px;flex-shrink:0;z-index:2}
.mp-dylv-who{display:flex;align-items:center;gap:7px;flex:1;min-width:0;background:rgba(0,0,0,.4);padding:4px 10px 4px 5px;border-radius:22px}
.mp-dylv-ava{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#fe2c55,#ff6b9d);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
.mp-dylv-info{display:flex;flex-direction:column;min-width:0;flex:1}
.mp-dylv-name{font-size:13px;font-weight:600;color:#fff;display:flex;align-items:center;gap:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-dylv-likes{font-size:10px;color:rgba(255,255,255,.6)}
.mp-dylv-follow{padding:4px 12px;border:none;border-radius:14px;background:#fe2c55;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0}
.mp-dylv-following{font-size:12px;color:rgba(255,255,255,.7);flex-shrink:0}
.mp-dylv-viewers{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,.35);padding:4px 10px;border-radius:18px;flex-shrink:0}
.mp-dylv-vw-avas{display:flex}
.mp-dylv-vw-ava{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6b6b8a,#3a3a52);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-left:-6px;border:1.5px solid #0d0d10}
.mp-dylv-vw-ava:first-child{margin-left:0}
.mp-dylv-vw-cnt{font-size:12px;color:rgba(255,255,255,.8)}
.mp-dylv-x{width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mp-dylv-x svg{width:16px;height:16px;fill:#fff}
.mp-dylv-screen{flex-shrink:0;height:42%;position:relative;overflow:hidden;background:#111}
.mp-dylv-screen-txt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.9);text-align:center;text-shadow:0 2px 6px rgba(0,0,0,.6)}
.mp-dylv-chat{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 12px 6px;background:rgba(0,0,0,.75)}
.mp-dylv-chat::-webkit-scrollbar{width:0}
/* ⑧ 消息行内联回绕：等级徽章 inline-flex + 名字+文本 inline，不作独立 flex 项换行 */
.mp-dylv-msg{display:block;padding:3px 0}
.mp-dylv-msg-join .mp-dylv-join-txt{font-size:12px;color:rgba(255,255,255,.45);font-style:italic}
.mp-dylv-msg-me .mp-dylv-user,.mp-dylv-msg-me .mp-dylv-txt{color:#ff9eb5}
.mp-dylv-lv{display:inline-flex;align-items:center;vertical-align:middle;font-size:11px;color:#fff;background:linear-gradient(90deg,#7a3fff,#fe2c55);padding:1px 5px;border-radius:7px;margin-right:3px;flex-shrink:0}
.mp-dylv-user{display:inline;font-size:13px;color:#ff9eb5;font-weight:600}
.mp-dylv-txt{display:inline;font-size:13px;color:rgba(255,255,255,.88);line-height:1.6;word-break:break-all}
.mp-dylv-loading{display:flex;gap:4px;padding:4px 0;align-items:center}
.mp-dylv-loading span{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);animation:mp-dy-spin-scale .8s ease infinite}
.mp-dylv-loading span:nth-child(2){animation-delay:.15s}
.mp-dylv-loading span:nth-child(3){animation-delay:.3s}
@keyframes mp-dy-spin-scale{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
.mp-dylv-bar{padding:8px 12px 12px;background:rgba(0,0,0,.85);flex-shrink:0}
.mp-dylv-input-row{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border-radius:22px;padding:6px 8px 6px 14px}
.mp-overlay .mp-dylv-in{flex:1;min-width:0;border:none!important;background:transparent!important;color:#fff!important;font-size:14px;outline:none;font-family:inherit;box-shadow:none!important;background-image:none!important}
.mp-overlay .mp-dylv-in::placeholder{color:rgba(255,255,255,.4)!important}
.mp-dylv-emoji,.mp-dylv-heart,.mp-dylv-gift,.mp-dylv-share{background:none;border:none;cursor:pointer;font-size:20px;padding:2px;flex-shrink:0}
/* 名字行 + 粉丝团等级标志 */
.mp-dylv-name-row{display:flex;align-items:center;gap:4px;min-width:0}
.mp-dylv-fan{font-size:10px;font-weight:800;color:#fff;min-width:18px;height:16px;padding:0 4px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-shadow:0 1px 1px rgba(0,0,0,.3)}
.mp-dylv-msg-gift .mp-dylv-txt{color:#ffd24d;font-weight:600}
/* 礼物面板 */
.mp-dylv-gp-mask{position:absolute;inset:0;z-index:6;background:rgba(0,0,0,.4);display:flex;align-items:flex-end}
.mp-dylv-gp{width:100%;background:#1c1c22;border-radius:16px 16px 0 0;padding:14px 14px 18px;max-height:60%;overflow-y:auto}
.mp-dylv-gp-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.mp-dylv-gp-title{font-size:15px;font-weight:700;color:#fff}
.mp-dylv-gp-bal{font-size:13px;color:#ffd24d;display:flex;align-items:center;gap:8px}
.mp-dylv-gp-recharge{padding:3px 10px;border:none;border-radius:12px;background:#fe2c55;color:#fff;font-size:11px;cursor:pointer;font-family:inherit}
.mp-dylv-gp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.mp-dylv-gp-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;border:none;border-radius:12px;background:rgba(255,255,255,.06);cursor:pointer;font-family:inherit}
.mp-dylv-gp-item:active{background:rgba(255,255,255,.14)}
.mp-dylv-gp-item.dis{opacity:.4}
.mp-dylv-gp-ico{font-size:26px;line-height:1}
.mp-dylv-gp-name{font-size:11px;color:rgba(255,255,255,.85)}
.mp-dylv-gp-price{font-size:10px;color:#ffd24d}
/* 充值面板 */
.mp-dylv-rc{margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,.05);border-radius:12px}
.mp-dylv-rc-hint{font-size:11px;color:#aaa;margin-bottom:8px}
.mp-dylv-rc-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.mp-dylv-rc-btn{padding:8px 4px;border:1.5px solid rgba(255,255,255,.15);border-radius:10px;background:transparent;color:#fff;font-size:12px;cursor:pointer;font-family:inherit;text-align:center;line-height:1.4}
.mp-dylv-rc-btn span{font-size:10px;color:#ffd24d}
.mp-dylv-rc-btn:active{background:rgba(255,255,255,.1)}
.mp-dylv-rc-custom{display:flex;gap:6px}
.mp-overlay .mp-dylv-rc-in{flex:1;padding:6px 10px;border:1px solid rgba(255,255,255,.2)!important;border-radius:8px;background:rgba(255,255,255,.08)!important;color:#fff!important;font-size:13px;outline:none;font-family:inherit}
.mp-dylv-rc-ok{padding:6px 12px;border:none;border-radius:8px;background:#fe2c55;color:#fff;font-size:13px;cursor:pointer;font-family:inherit}
/* 评论回复楼中楼 */
.mp-dy-cmt-reply-item{margin-left:44px;padding:5px 0 5px 10px;border-left:2px solid #f0f0f5;display:flex;align-items:flex-start;gap:0;font-size:12px}
.mp-dy-cmt-reply-item+.mp-dy-cmt-reply-item{margin-top:0}
.mp-dy-cmt-reply-ava{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#fe2c55,#ff6b9d);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:6px;margin-top:1px}
.mp-dy-cmt-reply-body{flex:1;min-width:0}
.mp-dy-cmt-reply-user{color:#fe2c55;font-weight:600}
.mp-dy-cmt-reply-to{color:#888;margin:0 2px}
.mp-dy-cmt-reply-txt{color:#444;word-break:break-word}
.mp-dy-cmt-reply-meta{display:flex;align-items:center;gap:12px;margin-top:3px;font-size:11px;color:#b0b1b6}
.mp-dy-cmt-reply-btn{color:#8a8b91;cursor:pointer}
.mp-dy-cm-reply-bar{font-size:12px;color:#888;padding:4px 14px 2px;display:flex;align-items:center;gap:6px;background:#f7f7f9}
.mp-dy-cm-reply-x{cursor:pointer;color:#bbb;font-size:11px}

/* 相机 */
.mp-cam{position:absolute;inset:7px;z-index:10;display:flex;flex-direction:column;background:#000;border-radius:33px;overflow:hidden}
.mp-cam-nav{display:flex;align-items:center;justify-content:space-between;padding:6px 14px 8px;background:rgba(0,0,0,.7);flex-shrink:0}
.mp-cam-title{font-size:16px;font-weight:600;color:#fff}
.mp-cam-gear{display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:none;border:none;cursor:pointer;position:relative;color:#fff}
.mp-cam .mp-nav-back{color:#fff}
.mp-cam-gear svg{width:18px;height:18px;color:#c8c8ca}
.mp-cam-gear .ico-set-gear{position:absolute;width:18px;height:18px;color:#c8c8ca;opacity:.9}
.mp-cam-settings{position:absolute;top:44px;right:10px;background:rgba(30,30,34,.95);border-radius:12px;padding:10px 0;z-index:20;min-width:190px;box-shadow:0 4px 16px rgba(0,0,0,.5)}
.mp-cs-title{padding:2px 14px 8px;font-size:13px;color:#8a8a8e;font-weight:500}
.mp-cs-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;position:relative}
.mp-cs-row::after{content:'';position:absolute;left:16px;right:0;bottom:0;height:1px;background:rgba(255,255,255,.07)}
.mp-cs-row:last-child::after{display:none}
.mp-cs-lbl{font-size:15px;color:#e0e0e0}
.mp-cs-modes{display:flex;gap:6px}
.mp-cs-mode{padding:5px 12px;border:1.5px solid rgba(255,255,255,.25);border-radius:20px;background:transparent;color:#c8c8c8;font-size:13px;cursor:pointer}
.mp-cs-mode.on{background:#fff;color:#000;border-color:#fff}
.mp-cam-view{flex:1;display:flex;align-items:center;justify-content:center;background:#111;position:relative;cursor:pointer}
.mp-cam-icon{width:72px;height:72px;color:rgba(255,255,255,.18)}
.mp-cam-busy{display:flex;gap:6px;align-items:center;position:absolute}
.mp-cam-busy span{width:8px;height:8px;border-radius:50%;background:#fff;animation:mp-bnc 1.2s infinite}
.mp-cam-busy span:nth-child(2){animation-delay:.2s}.mp-cam-busy span:nth-child(3){animation-delay:.4s}
.mp-cam-input{display:flex;align-items:center;gap:7px;padding:8px 12px;background:rgba(0,0,0,.8);flex-shrink:0}
.mp-cam-tag{flex-shrink:0;padding:3px 9px;background:rgba(255,255,255,.18);color:#e0e0e0;border-radius:12px;font-size:12px;border:1px solid rgba(255,255,255,.3)}
.mp-cam-ta{flex:1;min-width:0;max-height:64px;padding:6px 10px;border:none;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:14px;resize:none;outline:none;font-family:inherit;line-height:1.4}
.mp-cam-ta::placeholder{color:rgba(255,255,255,.4)}
.mp-cam-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px 20px;background:#000;flex-shrink:0}
.mp-cam-album-btn{width:46px;height:46px;border:2px solid rgba(255,255,255,.4);border-radius:10px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.mp-cam-album-btn svg{width:22px;height:22px;color:#e0e0e0}
.mp-shutter{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.9);border:3px solid rgba(255,255,255,.6);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(255,255,255,.15);flex-shrink:0;transition:transform .1s}
.mp-shutter:active{transform:scale(.92)}
.mp-shutter:disabled{opacity:.5;cursor:default}
.mp-shutter-inner{width:54px;height:54px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.mp-cam-bar-r{width:46px}

/* 相册 */
.mp-album{position:absolute;inset:7px;z-index:10;display:flex;flex-direction:column;background:#000;border-radius:33px;overflow:hidden}
.mp-album-body{flex:1;overflow-y:auto;background:#111;-webkit-overflow-scrolling:touch}
.mp-album-body::-webkit-scrollbar{width:0}
.mp-album-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:2px}
.mp-photo-cell{position:relative;cursor:pointer;aspect-ratio:1}
.mp-photo-thumb{width:100%;height:100%;background:#1e1e2a;display:flex;align-items:center;justify-content:center}
.mp-photo-thumb svg{width:28px;height:28px;color:rgba(255,255,255,.2)}
.mp-photo-meta{position:absolute;bottom:0;left:0;right:0;padding:6px 6px 4px;background:linear-gradient(0,rgba(0,0,0,.7),transparent);display:flex;flex-direction:column}
.mp-photo-subj{font-size:11px;color:#e0e0e0;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-photo-time{font-size:10px;color:rgba(255,255,255,.5)}
.mp-photo-detail{position:absolute;inset:0;background:#000;z-index:15;display:flex;flex-direction:column;animation:mp-fade .2s ease-out}
.mp-detail-bg{width:100%;aspect-ratio:4/3;background:linear-gradient(135deg,#1a1a2e,#2a2a4a);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mp-detail-meta{display:flex;align-items:center;gap:8px;padding:10px 14px 6px;flex-shrink:0}
.mp-detail-subj{font-size:14px;font-weight:600;color:#e0e0e0;flex:1}
.mp-detail-mode{font-size:11px;padding:2px 8px;background:rgba(255,255,255,.15);color:#c8c8c8;border-radius:10px;border:1px solid rgba(255,255,255,.2)}
.mp-detail-time{font-size:12px;color:#666}
.mp-detail-cap{flex:1;padding:8px 14px 16px;font-size:14px;color:#c0c0c0;line-height:1.6;overflow-y:auto;white-space:pre-wrap}
.mp-detail-cap::-webkit-scrollbar{width:0}

/* 壁纸 */
.mp-wp-panel{position:absolute;inset:7px;z-index:10;display:flex;flex-direction:column;background:#efeff4;border-radius:33px;overflow:hidden}
.mp-wp-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mp-wp-body::-webkit-scrollbar{width:0}
.mp-wp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:14px}
.mp-wp-item{border:none;background:none;cursor:pointer;border-radius:12px;overflow:hidden;position:relative;border:2.5px solid transparent;padding:0;transition:border-color .2s}
.mp-wp-item.on{border-color:#007aff}
.mp-wp-item.on::after{content:'✓';position:absolute;top:7px;right:7px;width:22px;height:22px;border-radius:50%;background:#007aff;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}
.mp-wp-thumb{width:100%;aspect-ratio:9/16;background-size:cover;background-position:center;border-radius:9px}
.mp-wp-default{background:linear-gradient(135deg,#4a5b7d,#161d2b);display:flex;align-items:center;justify-content:center}
.mp-wp-default span{color:rgba(255,255,255,.5);font-size:13px}
.mp-wp-name{display:block;text-align:center;font-size:12px;color:#555;padding:5px 0 6px}

/* 贴纸选择器 */
.mp-emoji-sticker{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px}
.mp-sticker-btn{background:none;border:none;cursor:pointer;border-radius:8px;padding:4px;display:flex;align-items:center;justify-content:center}
.mp-sticker-btn:active{background:rgba(0,0,0,.08)}
.mp-sticker-sel{width:60px;height:60px;object-fit:contain;display:block}
</style>
