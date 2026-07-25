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
          <button class="mp-app" @click="view = 'douyin'"><span class="mp-app-ico ico-dy"><svg class="ico-dy-b" viewBox="0 0 24 24"><path fill="#25f4ee" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg><svg class="ico-dy-r" viewBox="0 0 24 24"><path fill="#fe2c55" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg><svg class="ico-dy-w" viewBox="0 0 24 24"><path fill="#fff" d="M16 8.245V15.5a6.5 6.5 0 1 1-5-6.326v3.163a3.5 3.5 0 1 0 2 3.163V2h3a5 5 0 0 0 5 5v3a7.97 7.97 0 0 1-5-1.755"/></svg></span><span class="mp-app-lbl">抖音</span></button>
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
              <div v-if="a.k === '抖音' && a.ready" class="mp-dy-settings-panel">
                <div class="mp-dy-set-row">
                  <span class="mp-dy-set-lbl">模式</span>
                  <div class="mp-dy-set-btns">
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.mode==='normal'}]" @click="douyinSettings.mode='normal';saveDySettings()">抖音</button>
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.mode==='r18'}]" @click="douyinSettings.mode='r18';saveDySettings()">抖阴</button>
                  </div>
                </div>
                <div class="mp-dy-set-row">
                  <span class="mp-dy-set-lbl">内容</span>
                  <div class="mp-dy-set-btns">
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.visibility==='public'}]" @click="douyinSettings.visibility='public';saveDySettings()">公开</button>
                    <button :class="['mp-dy-set-btn', {on: douyinSettings.visibility==='private'}]" @click="douyinSettings.visibility='private';saveDySettings()">仅你可见</button>
                  </div>
                </div>
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
          <button class="mp-nav-back mp-dy-back" @click="goHome"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
          <div class="mp-dy-tabs">
            <span class="mp-dy-tab-dim">直播</span>
            <span class="mp-dy-tab-dim">商城</span>
            <button :class="['mp-dy-tab', {on: dyTab==='关注'}]" @click="switchDyTab('关注')">关注</button>
            <button :class="['mp-dy-tab', {on: dyTab==='推荐'}]" @click="switchDyTab('推荐')">推荐</button>
          </div>
          <svg class="mp-dy-search-ico" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>
        </div>
        <!-- 视频流 -->
        <div class="mp-dy-feed" ref="dyFeedEl" @scroll.passive="onDyScroll">
          <!-- 空状态 -->
          <div v-if="!dyVisibleFeed.length && !generatingDy" class="mp-dy-slide mp-dy-empty" @click="dyTab==='关注' ? null : generateDyVideo()">
            <div class="mp-dy-empty-ico"><svg viewBox="0 0 24 24" style="width:48px;height:48px"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></div>
            <div class="mp-dy-empty-txt">{{ dyTab==='关注' ? '还没有关注的作者' : '点击开始刷视频' }}</div>
          </div>
          <div v-if="!dyVisibleFeed.length && generatingDy" class="mp-dy-slide mp-dy-loading">
            <div class="mp-dy-spinner"><span></span><span></span><span></span></div>
            <div class="mp-dy-load-txt">正在为你推荐…</div>
          </div>
          <!-- 视频卡片列表 -->
          <div v-for="(v, vi) in dyVisibleFeed" :key="v._i" class="mp-dy-slide">
            <div class="mp-dy-grad-top"></div>
            <div class="mp-dy-grad-bot"></div>
            <!-- 画面文字：左右对称，超出可滚动 -->
            <div class="mp-dy-content"><div class="mp-dy-content-in">{{ v.content }}</div></div>
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
          </div>
          <!-- 尾部常驻滑块：既是上划落点，也是「下一个」触发点 -->
          <div v-if="dyVisibleFeed.length" class="mp-dy-slide mp-dy-next" @click="generateDyVideo">
            <template v-if="generatingDy">
              <div class="mp-dy-spinner"><span></span><span></span><span></span></div>
              <div class="mp-dy-load-txt">正在为你推荐…</div>
            </template>
            <template v-else>
              <div class="mp-dy-next-ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)"/></svg></div>
              <div class="mp-dy-load-txt">上划或点击，看下一个</div>
            </template>
          </div>
        </div>
        <!-- 上划提示 -->
        <div v-if="dyVisibleFeed.length && !showDyComments" class="mp-dy-swipe-hint">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)"/></svg>
        </div>
        <!-- 底部导航 -->
        <div class="mp-dy-tabbar">
          <button class="mp-dy-tb on">首页</button>
          <button class="mp-dy-tb" @click="showToast('该功能暂未开放')">朋友</button>
          <button class="mp-dy-tb mp-dy-tb-add" @click="showToast('该功能暂未开放')"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg></button>
          <button class="mp-dy-tb" @click="showToast('该功能暂未开放')">消息</button>
          <button class="mp-dy-tb" @click="showToast('该功能暂未开放')">我</button>
        </div>
        <!-- 评论弹层 -->
        <div v-if="showDyComments" class="mp-dy-cm-overlay" @click.self="showDyComments=false">
          <div class="mp-dy-cm-sheet">
            <div class="mp-dy-cm-handle"></div>
            <div class="mp-dy-cm-hd">
              <span class="mp-dy-cm-count">{{ dyCurrentCommentTotal }}条评论</span>
              <button class="mp-dy-cm-x" @click="showDyComments=false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12.01l-6.3-6.3l-1.42 1.42l6.3 6.29l-6.3 6.3l1.42 1.41L12 14.84l6.3 6.29l1.41-1.41l-6.29-6.3l6.29-6.29z"/></svg></button>
            </div>
            <div class="mp-dy-cm-body">
              <div v-for="(c, ci) in dyAllComments" :key="ci" class="mp-dy-cmt">
                <div class="mp-dy-cmt-ava">{{ (c.user||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
                <div class="mp-dy-cmt-main">
                  <div class="mp-dy-cmt-user">{{ c.user }}</div>
                  <div class="mp-dy-cmt-text">{{ c.text }}</div>
                  <div class="mp-dy-cmt-meta"><span>{{ c.region || '刚刚' }}</span><span class="mp-dy-cmt-reply">回复</span></div>
                  <div v-if="c.replyCount" class="mp-dy-cmt-expand">—— 展开{{ c.replyCount }}条回复 <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5l5-5z"/></svg></div>
                </div>
                <div class="mp-dy-cmt-lk">
                  <span class="mp-dy-cmt-lk-one" :class="{on:c.myLike}" @click.stop="toggleDyCmtLike(c)">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
                    <span>{{ c.likes }}</span>
                  </span>
                  <span class="mp-dy-cmt-lk-one" :class="{dis:c.myDis}" @click.stop="c.myDis=!c.myDis">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.65l1.45 1.32C18.6 8.64 22 11.72 22 15.5 22 18.58 19.58 21 16.5 21c-1.74 0-3.41-.81-4.5-2.09C10.91 20.19 9.24 21 7.5 21 4.42 21 2 18.58 2 15.5c0-3.78 3.4-6.86 8.55-11.54z"/></svg>
                  </span>
                </div>
              </div>
              <div v-if="!dyAllComments.length" class="mp-dy-cm-none">暂无评论，快来抢沙发~</div>
            </div>
            <div class="mp-dy-cm-input">
              <input class="mp-dy-cm-in" v-model="dyCommentDraft" placeholder="善语结善缘，恶言伤人心" @keydown.enter.prevent="submitDyComment" />
              <span class="mp-dy-cm-ic">@</span>
              <span class="mp-dy-cm-ic">☺</span>
              <button v-if="dyCommentDraft.trim()" class="mp-dy-cm-send" @click="submitDyComment">发送</button>
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
const DY_FORMAT = `===DYSTART===
creator:创作者抖音号（不带@，6字内）
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
c3:评论者号|||评论内容|||赞数|||地区
c4:评论者号|||评论内容|||赞数|||地区
===DYEND===`
const douyinFeed = ref([])
const douyinIdx = ref(0)
const douyinSettings = ref({ mode: 'normal', visibility: 'public' })
const dyTab = ref('推荐')
const showDyComments = ref(false)
const dyCommentIdx = ref(0)
const dyCommentDraft = ref('')
const generatingDy = ref(false)
const activeDanmaku = ref([])
const dyFeedEl = ref(null)
const dyMuted = ref(true)
let dmTimer = null
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
  // 手机对话历史：最近 24 条（跳过失败条）
  const arr = ((logs.value[owner] && logs.value[owner][contact]) || []).filter(m => m.status !== 'failed')
  const recent = arr.slice(-24)
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
// 带原始下标的可见列表：关注tab只看已关注的作者
const dyVisibleFeed = computed(() => {
  const all = douyinFeed.value.map((v, i) => ({ ...v, _i: i }))
  return dyTab.value === '关注' ? all.filter(v => v.isFollowing) : all
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
function loadDyData() {
  try {
    const raw = localStorage.getItem(DY_FEED_KEY); if (raw) douyinFeed.value = JSON.parse(raw).slice(-50)
    const idx = localStorage.getItem(DY_IDX_KEY); if (idx !== null) douyinIdx.value = Math.min(+idx, douyinFeed.value.length - 1)
    const s = localStorage.getItem(DY_SETTINGS_KEY); if (s) douyinSettings.value = { ...douyinSettings.value, ...JSON.parse(s) }
  } catch (e) {}
}
function saveDyFeed() { try { localStorage.setItem(DY_FEED_KEY, JSON.stringify(douyinFeed.value.slice(-50))); localStorage.setItem(DY_IDX_KEY, String(douyinIdx.value)) } catch (e) {} }
function saveDySettings() { try { localStorage.setItem(DY_SETTINGS_KEY, JSON.stringify(douyinSettings.value)) } catch (e) {} }
function clearDyCache() { douyinFeed.value = []; douyinIdx.value = 0; localStorage.removeItem(DY_FEED_KEY); localStorage.removeItem(DY_IDX_KEY); showToast('缓存已清理') }
function onDyScroll() {
  const el = dyFeedEl.value; if (!el || !el.clientHeight) return
  const vis = dyVisibleFeed.value
  const pos = Math.round(el.scrollTop / el.clientHeight)
  // 滑到尾部常驻滑块（下标 == 可见条数）就生成下一条
  if (pos >= vis.length) { if (!generatingDy.value) generateDyVideo(); return }
  const real = vis[pos] && vis[pos]._i
  if (real !== undefined && real !== douyinIdx.value) {
    douyinIdx.value = real; saveDyFeed()
    stopDanmaku(); startDanmaku(douyinFeed.value[real])
  }
}
// 切 tab：可见列表变了，回到顶部并重挂弹幕
function switchDyTab(t) {
  if (dyTab.value === t) return
  dyTab.value = t
  stopDanmaku()
  nextTick(() => {
    const el = dyFeedEl.value; if (el) el.scrollTop = 0
    const first = dyVisibleFeed.value[0]
    if (first) { douyinIdx.value = first._i; startDanmaku(douyinFeed.value[first._i]) }
  })
}
function toggleDyLike(vi) { const v = douyinFeed.value[vi]; if (!v) return; v.isLiked = !v.isLiked; saveDyFeed() }
function toggleDySave(vi) { const v = douyinFeed.value[vi]; if (!v) return; v.isSaved = !v.isSaved; saveDyFeed() }
// 关注/取关：同一作者的所有视频一起同步
function toggleDyFollow(vi) {
  const v = douyinFeed.value[vi]; if (!v) return
  const now = !v.isFollowing
  douyinFeed.value.forEach(x => { if (x.creator === v.creator) x.isFollowing = now })
  saveDyFeed()
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
  if (!v.myComments) v.myComments = []
  v.myComments.push({ user: '@' + (meName.value || '我'), text: txt, likes: '0' })
  dyCommentDraft.value = ''; saveDyFeed()
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
  generatingDy.value = true
  const isR18 = douyinSettings.value.mode === 'r18'
  const isPrivate = douyinSettings.value.visibility === 'private'
  // 已刷过的创作者，供 AI 参考避免重复
  const seen = [...new Set(douyinFeed.value.slice(-8).map(v => v.creator).filter(Boolean))].join('、')
  const platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
  const styleLine = isR18
    ? `内容尺度大、性感撩人、成人向，可含情欲与挑逗，但要有真实的场景感与叙事，不是干瘪的堆砌。`
    : `内容生活化、有真情实感或趣味，题材自由（日常/情感/才艺/风景/美食/知识/搞笑/宠物/穿搭等皆可）。`
  const sourceLine = isPrivate
    ? `这条视频由当前故事世界中的某个角色发布，且仅私下可见（相当于ta私发给${meName.value || '我'}看），因此更私密、更有针对性，能流露只对${meName.value || '我'}才有的心思。`
    : `发布者既可能是当前故事世界里的角色，也可能是与故事无关的陌生博主、路人、素人——由内容自然决定，不必偏向任何人。`
  const instruction =
    `【${platform}·刷视频·静默生成】现在只模拟刷到的一条短视频，绝不输出任何正文、旁白、场景或动作描写，只产出下面规定的数据块。` +
    `请结合下方提供的世界观设定、角色信息与当前剧情，生成一条真实可信、符合该世界背景的短视频。` +
    `\n发布来源：${sourceLine}` +
    `\n内容风格：${styleLine}` +
    (seen ? `\n最近已刷到过这些创作者，请换新的人和新的题材，别重复：${seen}。` : '') +
    `\n真实感要求：创作者名像真人抖音号（可含字母数字emoji）；文案口语化、可带#话题；弹幕是观众即时反应、短促随意有梗；评论有不同性格与立场，别千篇一律；点赞/评论/分享数符合内容热度。` +
    `\n只输出一个 ===DYSTART=== 数据块，块外不写任何字：\n` + DY_FORMAT
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
    if (video) {
      // 新作者延续已关注状态
      if (douyinFeed.value.some(x => x.creator === video.creator && x.isFollowing)) video.isFollowing = true
      douyinFeed.value.push(video)
      douyinIdx.value = douyinFeed.value.length - 1
      saveDyFeed()
      // 滚到这条新视频（关注tab下若作者未关注则留在原处）
      nextTick(() => {
        const el = dyFeedEl.value
        const pos = dyVisibleFeed.value.findIndex(v => v._i === douyinIdx.value)
        if (el && pos >= 0) el.scrollTo({ top: pos * el.clientHeight, behavior: 'smooth' })
        stopDanmaku(); startDanmaku(video)
      })
    } else showToast('没刷出内容，再试一次')
  } catch (e) { showToast('生成失败：' + ((e && e.message) || e)) } finally { generatingDy.value = false }
}
function parseDyVideo(raw) {
  if (!raw) return null
  const m = raw.match(/===DYSTART===([\s\S]*?)===DYEND===/)
  if (!m) return null
  const block = m[1]
  // 行首锚定，避免 comments: 被评论正文里的字样误匹配
  const f = (k) => { const r = block.match(new RegExp('^\\s*' + k + '\\s*:(.+)$', 'm')); return r ? r[1].trim() : '' }
  const danmakuRaw = f('danmaku')
  const commentList = []
  for (let i = 1; i <= 6; i++) {
    const c = f('c'+i); if (!c) continue
    const p = c.split('|||')
    if (p.length >= 2) commentList.push({ user: p[0].trim().replace(/^@/,'').replace(/^/,'@'), text: p[1].trim(), likes: (p[2]||'0').trim(), region: (p[3]||'').trim(), replyCount: 0 })
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
    danmaku: danmakuRaw ? danmakuRaw.split('|').map(s=>s.trim()).filter(Boolean) : [],
    commentList, myComments: [], isLiked: false, isSaved: false, isFollowing: false,
  }
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
      if (silentBusy.value || !sendingContact.value) return   // 纯手机模式由 silentReply 自行落库/清态
      clearPending()                                          // 生成成功：乐观写的发出条转正
      setTimeout(() => { loadLogs(); syncScrape(); sendingContact.value = ''; clearTimeout(sendTimer) }, 250)
    }
    onGenStopped = () => {
      if (silentBusy.value || !sendingContact.value) return
      sendingContact.value = ''; clearTimeout(sendTimer)
      if (pendingRef) { markFailed(pendingRef.msg); pendingRef = null }   // API 断/被停：标红可重发
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
  timer = setInterval(() => { tick(); loadLogs(); loadRemarks(); loadPhotos(); syncScrape(); syncScrapePhotos() }, 2000)
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
.mp-dy-search-ico{width:22px;height:22px;fill:#fff;opacity:.85;flex-shrink:0}
.mp-dy-feed{flex:1;overflow-y:scroll;scroll-snap-type:y mandatory;scrollbar-width:none}
.mp-dy-feed::-webkit-scrollbar{display:none}
.mp-dy-slide{position:relative;height:100%;min-height:100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;align-items:stretch;background:#111}
.mp-dy-grad-top{position:absolute;top:0;left:0;right:0;height:100px;background:linear-gradient(to bottom,rgba(0,0,0,.45),transparent);z-index:2;pointer-events:none}
.mp-dy-grad-bot{position:absolute;bottom:0;left:0;right:0;height:180px;background:linear-gradient(to top,rgba(0,0,0,.72),transparent);z-index:2;pointer-events:none}
/* 画面文字：左右对称、限高、超出可滚动 */
.mp-dy-content{position:absolute;top:78px;left:16px;right:16px;max-height:44%;z-index:3;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.mp-dy-content::-webkit-scrollbar{width:2px}
.mp-dy-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.35);border-radius:2px}
.mp-dy-content-in{font-size:14.5px;line-height:1.75;color:rgba(255,255,255,.94);white-space:pre-wrap;word-break:break-word;text-shadow:0 1px 4px rgba(0,0,0,.55);text-align:left}
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
.mp-dy-mute{position:absolute;right:8px;bottom:20px;z-index:5;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:16px;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);cursor:pointer}
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
.mp-dy-cm-input{display:flex;align-items:center;gap:10px;padding:8px 14px 12px;border-top:1px solid #f0f0f2}
.mp-dy-cm-in{flex:1;background:#fff;border:1px solid #e8e8ea;border-radius:18px;padding:9px 15px;color:#161823;font-size:14px;font-family:inherit;outline:none}
.mp-dy-cm-in:focus{border-color:#d0d0d4}
.mp-dy-cm-in::placeholder{color:#b0b1b6}
.mp-dy-cm-ic{font-size:19px;color:#61626a;cursor:pointer;flex-shrink:0}
.mp-dy-cm-send{padding:8px 16px;border:none;border-radius:18px;background:#fe2c55;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0}
.mp-dy-mode-tag{font-size:12px;padding:2px 8px;border-radius:10px;background:rgba(254,44,85,.15);color:#fe2c55;border:1px solid rgba(254,44,85,.3)}
.mp-dy-mode-tag.r18{background:rgba(130,0,30,.3);color:#ff6b9d;border-color:rgba(255,107,157,.3)}
.mp-dy-settings-panel{background:#f7f7fa;padding:8px 16px 12px;border-bottom:1px solid #e2e2e6}
.mp-dy-set-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0}
.mp-dy-set-lbl{font-size:14px;color:#444}
.mp-dy-set-btns{display:flex;gap:6px}
.mp-dy-set-btn{padding:4px 12px;border:1px solid #ddd;border-radius:14px;background:#fff;font-size:13px;color:#666;cursor:pointer;font-family:inherit}
.mp-dy-set-btn.on{background:#fe2c55;border-color:#fe2c55;color:#fff}
.mp-dy-set-clear{width:100%;margin-top:6px;padding:8px;border:none;border-radius:8px;background:#f0f0f2;color:#666;font-size:13px;cursor:pointer;font-family:inherit}
.mp-dy-set-clear:active{background:#e0e0e2}

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
