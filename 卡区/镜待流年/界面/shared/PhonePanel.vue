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
              <div class="mp-msrow-wrap" :class="{ ms: wxMultiSelect }">
                <div v-if="wxMultiSelect && m.dir !== '系统'" class="mp-ms-chk" :class="{on: wxSelectedMsgs.has(i)}" @click.stop="toggleWxMsgSelect(i)"></div>
              <div :class="['mp-row', m.dir === '发出' ? 'out' : m.dir === '系统' ? 'sys' : 'in']" @click="wxMultiSelect && m.dir !== '系统' ? toggleWxMsgSelect(i) : null">
                <div v-if="m.dir !== '系统'" class="mp-ava">{{ initial(m.dir === '发出' ? curOwner : activeContact) }}</div>
                <div :class="['mp-bub', 'mt-' + (m.type || '文字'), {selected: wxMultiSelect && wxSelectedMsgs.has(i)}]" @click.stop="wxMultiSelect ? toggleWxMsgSelect(i) : openCtxMenu(i, m.dir)">
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
              </div>
            </template>
            <div v-if="sendingContact === activeContact" class="mp-row in"><div class="mp-ava">{{ initial(activeContact) }}</div><div class="mp-bub mp-typing"><span></span><span></span><span></span></div></div>
          </div>
          <div v-if="sendError" class="mp-toast">{{ sendError }}</div>
          <div v-show="!wxMultiSelect" class="mp-inbar">
            <button class="mp-in-ico" @click="voiceMode = !voiceMode" title="语音">
              <svg v-if="!voiceMode" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a3 3 0 0 0-3 3v4a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3m0-2a5 5 0 0 1 5 5v4a5 5 0 0 1-10 0V6a5 5 0 0 1 5-5M3.055 11H5.07a7.002 7.002 0 0 0 13.858 0h2.016A9.004 9.004 0 0 1 13 18.945V23h-2v-4.055A9.004 9.004 0 0 1 3.055 11"/></svg>
              <svg v-else viewBox="0 0 640 640"><path fill="none" stroke="currentColor" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" d="M160 224h320v192H160zM224 160h192"/></svg>
            </button>
            <button v-if="voiceMode" class="mp-in-voicebtn">按住 说话</button>
            <textarea v-else :value="draft" class="mp-ta" rows="1" readonly @click.stop.prevent="openIMEWechat" @focus="showEmoji = false" @keydown.enter.exact.prevent="send"></textarea>
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
              <div v-if="showSearch" class="mp-search"><span class="mp-search-box"><svg viewBox="0 0 24 24" class="mp-search-ico"><path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/></svg><input :value="searchQuery" class="mp-search-inp" placeholder="搜索" readonly @click.stop.prevent="openIMESearch" /></span></div>
              <div v-if="showNew" class="mp-newchat">
                <input :value="newContact" class="mp-nc-in" placeholder="输入联系人名开始对话" readonly @click.stop.prevent="openIMENewContact" @keydown.enter="startChat" />
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
              <div class="mp-search"><span class="mp-search-box"><svg viewBox="0 0 24 24" class="mp-search-ico"><path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617m-2.006-.742A6.98 6.98 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.98 6.98 0 0 0 4.875-1.975z"/></svg><input :value="searchQuery" class="mp-search-inp" placeholder="搜索" readonly @click.stop.prevent="openIMESearch" /></span></div>
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
                <input class="mp-prof-rmk" :value="remarkDraft" readonly @click.stop.prevent="openIMERemark" @keydown.enter="e => e.target.blur()" placeholder="未设置" />
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

        <!-- 微信多选底部确认栏（在微信场景内，不上移整机） -->
        <div v-if="wxMultiSelect && activeContact" class="mp-ms-bar">
          <button class="mp-ms-cancel" @click="cancelWxMultiSelect">取消</button>
          <span class="mp-ms-count">{{ wxSelectedMsgs.size > 0 ? `已选 ${wxSelectedMsgs.size} 条` : '点消息选择' }}</span>
          <button class="mp-ms-send" :disabled="!wxSelectedMsgs.size" @click="shareWxMultiToStory">分享到故事</button>
        </div>

        <!-- 消息菜单 -->
        <div v-if="ctxMenu" class="mp-ctx-overlay" @click.self="closeCtxMenu">
          <div class="mp-ctx-sheet">
            <button v-if="ctxMenu.dir === '发出'" class="mp-ctx-item" @click="recallMsg">撤回</button>
            <button v-if="ctxMenu.dir === '发出'" class="mp-ctx-item" @click="resendCtx">重发</button>
            <button class="mp-ctx-item" @click="shareWxMsgToStory">分享到故事</button>
            <button class="mp-ctx-item" @click="startWxMultiSelect">多选</button>
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
                  <input class="mp-dy-set-input" :class="{on: !HIST_OPTIONS.includes(histLimit)}" type="number" min="1" max="500" :value="histDraft" readonly :placeholder="HIST_OPTIONS.includes(histLimit) ? '自定义' : String(histLimit)" @click.stop.prevent="openIMEHistDraft" />
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
                <div class="mp-dy-set-subhd">抖阴风格（可选）</div>
                <textarea class="mp-dy-style-input" :value="douyinSettings.style || ''" rows="2" readonly @click.stop.prevent="openIMEDyStyle" placeholder="未设置，使用默认风格"></textarea>
                <div class="mp-dy-set-note">只在抖阴模式生效，会放在视频与直播生成提示词前部；留空使用有韵味、情境化的默认风格。</div>
                <!-- 直播出现概率 -->
                <div class="mp-dy-set-subhd">直播出现概率（当前 {{ dyLivePct }}%）</div>
                <div class="mp-dy-set-btns">
                  <button v-for="p in DY_LIVE_PCT_OPTIONS" :key="p" :class="['mp-dy-set-btn', {on: dyLivePct===p}]" @click="setDyLivePct(p)">{{ p }}%</button>
                  <input class="mp-dy-set-input" :class="{on: !DY_LIVE_PCT_OPTIONS.includes(dyLivePct)}" type="number" min="0" max="100" :value="livePctDraft" readonly :placeholder="DY_LIVE_PCT_OPTIONS.includes(dyLivePct) ? '自定义' : String(dyLivePct)" @click.stop.prevent="openIMELivePct" />
                </div>
                <div class="mp-dy-set-note">推荐/关注流里直播卡占的比例。0=全是视频，15=约每7条有1条直播。</div>
                <!-- 直播每批聊天条数 -->
                <div class="mp-dy-set-subhd">直播上下文记忆（当前 {{ dyChatBatch }} 条）</div>
                <div class="mp-dy-set-btns">
                  <button v-for="n in DY_CHAT_BATCH_OPTIONS" :key="n" :class="['mp-dy-set-btn', {on: dyChatBatch===n}]" @click="setDyChatBatch(n)">{{ n }}</button>
                  <input class="mp-dy-set-input" :class="{on: !DY_CHAT_BATCH_OPTIONS.includes(dyChatBatch)}" type="number" min="10" max="200" :value="chatBatchDraft" readonly :placeholder="DY_CHAT_BATCH_OPTIONS.includes(dyChatBatch) ? '自定义' : String(dyChatBatch)" @click.stop.prevent="openIMEChatBatch" />
                </div>
                <div class="mp-dy-set-note">喂给 AI 的历史消息条数（不是输出条数）。数越多主播越不失忆，推荐50条以上。</div>
                <template v-if="douyinSettings.mode==='r18'">
                  <div class="mp-dy-set-subhd">私密页·陌生人占比（当前 {{ dyStrangerPct }}%）</div>
                  <div class="mp-dy-set-btns">
                    <button v-for="p in DY_STRANGER_OPTIONS" :key="p" :class="['mp-dy-set-btn', {on: dyStrangerPct===p}]" @click="setDyStrangerPct(p)">{{ p }}%</button>
                    <input class="mp-dy-set-input" :class="{on: !DY_STRANGER_OPTIONS.includes(dyStrangerPct)}" type="number" min="0" max="100" :value="strangerDraft" readonly :placeholder="DY_STRANGER_OPTIONS.includes(dyStrangerPct) ? '自定义' : String(dyStrangerPct)" @click.stop.prevent="openIMEStrangerPct" />
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
          <textarea :value="cameraDraft" class="mp-cam-ta" rows="1" placeholder="描述拍摄对象…" readonly @click.stop.prevent="openIMECamera" @focus="showCameraSettings = false"></textarea>
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
          <button class="mp-nav-back" style="position:absolute;top:14px;right:12px;color:#fff;z-index:2;font-size:18px" @click="openDyShareMenu('photo', selectedPhoto)">↗️</button>
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
                  <span class="mp-dy-creator-name mp-dy-clickable" @click.stop="openDyCreatorProfile(v)">@{{ v.creator }}</span>
                  <span v-if="v.verified" class="mp-dy-verified">✓</span>
                  <span v-if="v.realName" class="mp-dy-realname" @click.stop="openDyCreatorProfile(v)">已实名</span>
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
                <span class="mp-dy-creator-name mp-dy-clickable" @click.stop="openDyCreatorProfile(v)">@{{ v.creator }}</span>
                <span v-if="v.verified" class="mp-dy-verified">✓</span>
                <span v-if="v.realName" class="mp-dy-realname" @click.stop="openDyCreatorProfile(v)">已实名</span>
                <button v-if="!v.isFollowing" class="mp-dy-follow-btn" @click.stop="toggleDyFollow(v._i)">关注</button>
                <span v-else class="mp-dy-followed" @click.stop="toggleDyFollow(v._i)">已关注</span>
              </div>
              <div class="mp-dy-caption">{{ v.caption }}</div>
              <div class="mp-dy-sound-row"><span class="mp-dy-note-ico">♪</span><span class="mp-dy-sound-name">{{ v.sound }}</span></div>
            </div>
            <div class="mp-dy-actions">
              <div class="mp-dy-ava-wrap">
                <div class="mp-dy-ava mp-dy-clickable" @click.stop="openDyCreatorProfile(v)">{{ (v.creator||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
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
              <button class="mp-dy-act-btn" @click.stop="openDyShareMenu('video', v)">
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
          <button class="mp-dy-tb" style="position:relative" @click="showDyMsgCenter=true">消息<span v-if="dyUnreadCount" class="mp-badge tb">{{ dyUnreadCount > 99 ? '99+' : dyUnreadCount }}</span></button>
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
                  <div class="mp-dy-cmt-meta"><span>{{ c.region || '刚刚' }}</span><span class="mp-dy-cmt-reply" @click.stop="setDyReplyTo(c)">回复</span><span class="mp-dy-cmt-reply mp-dy-cmt-share-btn" @click.stop="openDyShareMenu('comment',{video:douyinFeed[dyCommentIdx],comment:c})">↗️</span></div>
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
                        <span class="mp-dy-cmt-reply-btn mp-dy-cmt-share-btn" @click.stop="openDyShareMenu('reply',{video:douyinFeed[dyCommentIdx],comment:c,reply:r})">↗️</span>
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
              <input class="mp-dy-cm-in" :value="dyCommentDraft" :placeholder="dyReplyTo ? '回复 @'+dyReplyTo : '善语结善缘，恶言伤人心'" readonly @click.stop.prevent="openIMEDyComment" @keydown.enter.prevent="submitDyComment" />
              <span v-if="dyReplyTo" class="mp-dy-cm-ic mp-dy-cm-reply-x" @click.stop="dyReplyTo='';dyReplyParent=null" title="取消回复">✕</span>
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
              <div class="mp-dyh-thumb" :class="{ pv: h.vis==='private', live: h.type==='live' }">{{ (h.creator||'?').slice(0,1).toUpperCase() }}</div>
              <div class="mp-dyh-info">
                <div class="mp-dyh-author">@{{ h.creator }}<span v-if="h.vis==='private'" class="mp-dyh-pvtag">私密</span><span v-if="h.type==='live'" class="mp-dyh-livetag">直播</span></div>
                <div class="mp-dyh-txt">{{ h.content }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 消息中心 -->
        <div v-if="showDyMsgCenter" class="mp-dym">
          <div class="mp-dym-hd">
            <button class="mp-nav-back" @click="showDyMsgCenter=false"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
            <span class="mp-dym-title">消息</span>
            <button v-if="dyNotifs.length" class="mp-dym-readall" @click="markAllDyNotifsRead">全部已读</button>
            <span v-else></span>
          </div>
          <div class="mp-dym-body">
            <div v-if="!dyNotifs.length" class="mp-dyh-none">还没有互动消息</div>
            <div v-for="(n, ni) in dyNotifs" :key="n.id" class="mp-dym-item" :class="{unread:!n.read}" @click="openDyFromNotif(n)">
              <div class="mp-dym-dot" v-if="!n.read"></div>
              <div class="mp-dym-ava">{{ (n.replierUser||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
              <div class="mp-dym-info">
                <div class="mp-dym-user">@{{ n.replierUser }} <span class="mp-dym-verb">回复了你</span><span class="mp-dym-time">{{ formatDyNotifTime(n.ts) }}</span></div>
                <div class="mp-dym-reply">{{ n.replyText }}</div>
                <div class="mp-dym-ctx">在「{{ n.videoContent }}」</div>
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
              <input class="mp-dys-in" :value="dySearchDraft" placeholder="搜索你感兴趣的内容" readonly @click.stop.prevent="openIMEDySearch" @keydown.enter.prevent="submitDySearch" />
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
            <div class="mp-dylv-top-row">
              <div class="mp-dylv-who">
                <div class="mp-dylv-ava mp-dy-clickable" @click.stop="openDyCreatorProfile(dyLiveRoom)">{{ (dyLiveRoom.creator||'?').slice(0,1).toUpperCase() }}</div>
                <div class="mp-dylv-info">
                  <div class="mp-dylv-name-row">
                      <span class="mp-dylv-name mp-dy-clickable" @click.stop="openDyCreatorProfile(dyLiveRoom)">{{ dyLiveRoom.creator }}<span v-if="dyLiveRoom.verified" class="mp-dy-verified">✓</span><span v-if="dyLiveRoom.realName" class="mp-dy-realname">已实名</span></span>
                  </div>
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
            <!-- 点赞数独占一行，不与名字/关注挤在一起 -->
            <span class="mp-dylv-likes">直播中 · {{ dyLiveRoom.liveLikes }} 点赞</span>
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
              <input class="mp-dylv-in" :value="dyLiveChatDraft" :placeholder="dyLiveReplyTo ? '回复 @'+dyLiveReplyTo : '说点什么...'" readonly @click.stop.prevent="openIMELiveChat" @keydown.enter.prevent="submitLiveChat" />
              <button class="mp-dylv-heart" @click.stop="sendLiveHeart" :title="curFan ? '粉丝团 '+curFan.level+' 级' : '加入粉丝团'">{{ curFan ? '💖' : '🤍' }}</button>
              <button class="mp-dylv-gift" @click.stop="openGiftPanel">🎁</button>
              <button class="mp-dylv-more" @click.stop="generateLiveChat(false)" :disabled="generatingLiveChat" title="主播继续推进直播">{{ generatingLiveChat ? '⏳' : '▶' }}</button>
              <button class="mp-dylv-share" @click.stop="openDyShareMenu('live', dyLiveRoom)">↗️</button>
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
                  <input class="mp-dylv-rc-in" type="number" min="1" :value="rechargeDraft" readonly placeholder="自定义金额（元）" @click.stop.prevent="openIMERechargeAmt" />
                  <button class="mp-dylv-rc-ok" @click="applyRechargeDraft">确认</button>
                </div>
              </div>
              <div class="mp-dylv-gp-grid">
                <button v-for="g in DY_GIFTS" :key="g.k" class="mp-dylv-gp-item" :class="{dis: dyDiamond < g.price * giftQty}" @click="sendGift(g)">
                  <span class="mp-dylv-gp-ico">{{ g.icon }}</span>
                  <span class="mp-dylv-gp-name">{{ g.name }}</span>
                  <span class="mp-dylv-gp-price">💎{{ g.price * giftQty }}</span>
                </button>
              </div>
              <!-- 数量选择 -->
              <div class="mp-dylv-gp-qty">
                <span class="mp-dylv-gp-qty-lbl">数量</span>
                <button v-for="n in [1,5,10,50,99]" :key="n" :class="['mp-dylv-gp-qty-btn', {on: giftQty===n}]" @click="giftQty=n">×{{ n }}</button>
              </div>
            </div>
          </div>
        </div>
        <!-- 抖音个人资料页：先点头像进入，再点“已实名”查看实名 -->
        <div v-if="dyCreatorProfile" class="mp-dy-profile" @click.self="closeDyCreatorProfile">
          <div class="mp-dy-profile-page">
            <div class="mp-dy-profile-nav">
              <button class="mp-nav-back" @click="closeDyCreatorProfile"><svg viewBox="0 0 24 24"><path fill="currentColor" d="m10.828 12l4.95 4.95l-1.414 1.415L8 12l6.364-6.364l1.414 1.414z"/></svg></button>
              <span>个人资料</span><span></span>
            </div>
            <div class="mp-dy-profile-hero">
              <div class="mp-dy-profile-ava">{{ (dyCreatorProfile.creator||'?').replace('@','').slice(0,1).toUpperCase() }}</div>
              <div class="mp-dy-profile-name">{{ dyCreatorProfile.creator }}</div>
              <div class="mp-dy-profile-id">抖音号：{{ dyCreatorProfile.creator }}</div>
              <div class="mp-dy-profile-tags"><span v-if="dyCreatorProfile.verified" class="mp-dy-profile-tag verified">认证账号</span><button v-if="dyCreatorProfile.realName" class="mp-dy-profile-tag real" @click.stop="revealDyRealName(dyCreatorProfile)">已实名</button></div>
              <div v-if="dyRealNameRevealed && dyCreatorProfile.realName" class="mp-dy-profile-real">实名：{{ dyCreatorProfile.realName }}</div>
            </div>
            <div class="mp-dy-profile-sec"><span>简介</span><p>{{ dyCreatorProfile.caption || dyCreatorProfile.title || '暂无简介' }}</p></div>
            <div class="mp-dy-profile-sec"><span>账号说明</span><p>同一真实人物在平台内沿用同一个账号和实名，不因昵称、花名或内容变化而更换身份。</p></div>
          </div>
        </div>
      </div>

      <!-- 通用分享菜单（视频/直播/评论/照片通用）——放在所有 view 之上（z-60），避免被抖音/相册层覆盖 -->
      <div v-if="dyShareMenu" class="mp-ctx-overlay mp-share-overlay" @click.self="dyShareMenu=null">
        <div class="mp-ctx-sheet">
          <div class="mp-ctx-title">{{ dyShareMenu.type==='photo' ? '相册照片' : dyShareMenu.type==='live' ? '直播' : dyShareMenu.type==='comment'||dyShareMenu.type==='reply' ? '评论' : '视频' }}</div>
          <button class="mp-ctx-item" @click="shareToStory(dyShareMenu.type, dyShareMenu.data)">📤 分享到故事</button>
          <button class="mp-ctx-item" @click="showToast('转发到微信（即将上线）')">💬 发给…</button>
          <button class="mp-ctx-cancel" @click="dyShareMenu=null">取消</button>
        </div>
      </div>

    </div>
    <!-- ===手机输入法浮层=== 必须是 mp-phone 的 sibling，不在 transform 缩放节点内 -->
    <div v-if="imeActive" class="mp-ime" @click.self="closeIME">
      <div class="mp-ime-panel">
        <div class="mp-ime-hint-row">
          <span class="mp-ime-ph">{{ imePlaceholder }}</span>
          <button class="mp-ime-cancel" @click="closeIME">取消</button>
        </div>
        <textarea v-if="imeMultiline" class="mp-ime-ta" v-model="imeDraft" :placeholder="imePlaceholder" @input="imeSync" rows="3" autofocus></textarea>
        <input v-else class="mp-ime-in" v-model="imeDraft" :placeholder="imePlaceholder" @input="imeSync" @keydown.enter.prevent="submitIME" autofocus />
        <div class="mp-ime-emojis">
          <span v-for="e in IME_EMOJIS" :key="e" class="mp-ime-ej" @click.stop="imeAppendEmoji(e)">{{ e }}</span>
        </div>
        <div class="mp-ime-foot">
          <button class="mp-ime-send" :disabled="imeHasSubmit && !imeDraft.trim()" @click="submitIME">{{ imeHasSubmit ? '发送' : '确定' }}</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

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
realName:该博主的真实姓名。若发布者是本故事世界里已存在的角色，必须用ta的正式全名；同一个人无论用什么抖音号/花名，realName 永远一致。若是与故事无关的陌生博主，就新创一个符合本世界观的真实姓名。
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
（评论按内容热度自然给：热门视频可给到 c6，冷门给 1~2 条。别机械凑满，条数要像真实评论区。最多支持到 c6。除非上面的私密铁则明确要求留空，否则至少必须给 1 条评论，不允许0条。）
c3:评论者号|||评论内容|||赞数|||地区
c4:评论者号|||评论内容|||赞数|||地区
c5:评论者号|||评论内容|||赞数|||地区
c6:评论者号|||评论内容|||赞数|||地区`
// 直播卡生成格式（type:'live'）
const DY_LIVE_FORMAT = `creator:主播抖音号（不带@，6字内）
realName:该主播的真实姓名。若是本故事世界里已存在的角色，必须用ta的正式全名；同一个人无论用什么抖音号/花名，realName 永远一致。若是与故事无关的陌生主播，就新创一个符合本世界观的真实姓名。
verified:true或false
title:直播标题（15字内，有吸引力）
viewers:当前在线人数（如 1929 / 2.3万）
content:当前直播画面描述（2-3句，主播在做什么，有临场感）
memory:本场直播连续性记忆（单行，最多300字：主播身份、当前场景、正在进行的事、已发生的关键互动、user最新发言及未回应事项；只写客观事实，不写user内心）
chat1:等级数字|||昵称|||聊天内容（每条5~20字，简短口语，禁止长篇大论）
chat2:等级数字|||昵称|||聊天内容
chat3:等级数字|||昵称|||来了|||join（进场消息固定格式：文本写"来了"，末尾加|||join）
chat4:等级数字|||昵称|||聊天内容
chat5:等级数字|||昵称|||聊天内容
chat6:等级数字|||昵称|||聊天内容
chat7:等级数字|||昵称|||聊天内容
chat8:等级数字|||昵称|||聊天内容
（进场消息统一格式：文本写"来了"并在末尾加|||join；普通聊天不加|||join）`
const douyinFeed = ref([])
const douyinIdx = ref(0)
const douyinSettings = ref({ mode: 'normal', style: '' })
const DY_DEFAULT_STYLE = '整体保持有韵味、暧昧、情境化和人物关系感；用镜头、衣物、体态、声音、停顿与情绪制造张力，内容每次换一种场景和节奏，避免机械重复的器官或动作清单。私密成人内容可以直白，但必须服务于人物、关系和当下情境。'
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
const showDyMsgCenter = ref(false)        // 消息中心弹层
const DY_NOTIF_KEY = 'jdnl_dy_notif'
const dyNotifs = ref([])                  // 消息通知列表 [{id,videoCreator,videoContent,commentText,replierUser,replyText,ts,read}]
const dyUnreadCount = computed(() => dyNotifs.value.filter(n => !n.read).length)
// ---- 分享菜单（视频/直播/评论/照片） ----
const dyShareMenu = ref(null)             // { type:'video'|'live'|'comment'|'reply'|'photo', data }
// ---- 微信多选模式 ----
const wxMultiSelect = ref(false)
const wxSelectedMsgs = ref(new Set())
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
const dyCreatorProfile = ref(null)        // 抖音资料页当前主播
const dyRealNameRevealed = ref(false)
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
const giftQty = ref(1)          // 礼物一次送多少个
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
// generateRaw 的 user_input 在 0 层、权重高。这里塞入博主真实姓名+话题当"检索关键词"以激活相关人设世界书，
// 同时明确标注这是检索意图、非用户发言，避免 AI 当成 user 的话去回应或被带偏。
function dyRetrievalHint(video, extra, userText) {
  const bits = [dyR18.value ? '抖阴 成人向短视频平台' : '抖音 短视频平台']
  if (video) {
    if (video.realName) bits.push(video.realName)
    if (video.creator) bits.push('@' + video.creator)
    if (video.caption) bits.push(`标题文案：${video.caption}`)
    if (video.title) bits.push(`直播标题：${video.title}`)
    if (video.content) bits.push(`当前内容：${String(video.content).slice(0, 280)}`)
    if (video.pcontent) bits.push(`私密内容：${String(video.pcontent).slice(0, 280)}`)
    if (video.memory) bits.push(`连续性记忆：${String(video.memory).slice(0, 600)}`)
  }
  if (extra) bits.push(extra)
  // user 自己写的评论/发言也是重要关键词来源（可能点名了角色、提到了地点事物）
  if (userText) bits.push(`用户消息：${String(userText).slice(0, 500)}`)
  const kw = [...new Set(bits.filter(Boolean))].join(' ')
  return `（系统检索：为手机短视频功能生成内容，检索相关资料 ${kw}。这是检索关键词，不是用户发言，无需回应，直接按系统指令产出数据块。）`
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
    if (v[VAR_KEY] && typeof v[VAR_KEY] === 'object') logs.value = normalizeLogOrder(migrate(v[VAR_KEY]))
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
function compareMessageTime(a, b) {
  const ta = absMin(parseTime(a && a.time)), tb = absMin(parseTime(b && b.time))
  if (ta == null && tb == null) return 0
  if (ta == null) return 1
  if (tb == null) return -1
  return ta - tb
}
function sortLogArray(arr) {
  const sorted = arr.map((msg, index) => ({ msg, index })).sort((a, b) => compareMessageTime(a.msg, b.msg) || a.index - b.index)
  arr.splice(0, arr.length, ...sorted.map(item => item.msg))
}
function normalizeLogOrder(data) {
  Object.values(data).forEach(ownerLogs => {
    if (!ownerLogs || typeof ownerLogs !== 'object' || Array.isArray(ownerLogs)) return
    Object.values(ownerLogs).forEach(arr => { if (Array.isArray(arr)) sortLogArray(arr) })
  })
  return data
}
function insertLogMessage(arr, msg) {
  const at = absMin(parseTime(msg && msg.time))
  if (at == null) { arr.push(msg); return }
  let i = arr.length
  while (i > 0) {
    const pt = absMin(parseTime(arr[i - 1] && arr[i - 1].time))
    if (pt == null) { i--; continue }
    if (pt <= at) break
    i--
  }
  arr.splice(i, 0, msg)
}
function sameMessage(a, b) {
  const baseA = a.dir + '|' + (a.type || '文字') + '|' + a.text
  const baseB = b.dir + '|' + (b.type || '文字') + '|' + b.text
  if (baseA !== baseB) return false
  const ta = String(a.time || '').trim(), tb = String(b.time || '').trim()
  if (!ta || !tb) return true
  const ma = absMin(parseTime(ta)), mb = absMin(parseTime(tb))
  return ma != null && mb != null ? ma === mb : ta === tb
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

// 往 logs[owner][contact] 写一条（墓碑跳过、保守去重、按时间插入、仅自己手机计未读）。返回是否有变化。
function putMsg(owner, contact, msg, countUnread) {
  if (!owner || !contact || isDeleted(owner, contact)) return false
  if (!logs.value[owner]) logs.value[owner] = {}
  if (!logs.value[owner][contact]) logs.value[owner][contact] = []
  const arr = logs.value[owner][contact]
  if (arr.some(m => sameMessage(m, msg))) return false
  insertLogMessage(arr, msg)
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
  if (dyCreatorProfile.value) { closeDyCreatorProfile(); return }
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
  insertLogMessage(logs.value[owner][contact], msg)
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
// 数据分离：抖音(_n)和抖阴(_r)各自独立存储，切换模式不互相污染
function dyModeKey(base) { return base + (dyR18.value ? '_r' : '_n') }
function loadDyData(modeChanged = false) {
  try {
    if (modeChanged) {
      // 模式切换：先清空内存中的内容，再加载新模式的数据
      douyinFeed.value = []; douyinIdx.value = 0
      dyIdxMap.value = { 推荐: 0, 关注: 0, 私密: 0 }
      dyHistory.value = []; dyFlipped.value = {}
      dyFollows.value = new Set(); dyFanClub.value = {}; dyDiamond.value = 1000
      dyHotList.value = []; dyHotMode.value = ''; dyRecentSearches.value = []
      dyNotifs.value = []
    }
    const raw = localStorage.getItem(dyModeKey(DY_FEED_KEY)); if (raw) douyinFeed.value = JSON.parse(raw).slice(-50)
    const idx = localStorage.getItem(dyModeKey(DY_IDX_KEY)); if (idx !== null) douyinIdx.value = Math.min(+idx, douyinFeed.value.length - 1)
    const s = localStorage.getItem(DY_SETTINGS_KEY); if (s) douyinSettings.value = { ...douyinSettings.value, ...JSON.parse(s) }
    if (typeof douyinSettings.value.strangerPct === 'number') dyStrangerPct.value = douyinSettings.value.strangerPct
    if (typeof douyinSettings.value.livePct === 'number') dyLivePct.value = douyinSettings.value.livePct
    if (typeof douyinSettings.value.chatBatch === 'number') dyChatBatch.value = douyinSettings.value.chatBatch
    const fc = localStorage.getItem(dyModeKey(DY_FAN_KEY)); if (fc) dyFanClub.value = JSON.parse(fc)
    const dm = localStorage.getItem(dyModeKey(DY_DIAMOND_KEY)); if (dm !== null) dyDiamond.value = +dm
    const f = localStorage.getItem(dyModeKey(DY_FOLLOWS_KEY)); if (f) dyFollows.value = new Set(JSON.parse(f))
    const im = localStorage.getItem(dyModeKey(DY_IDXMAP_KEY)); if (im) dyIdxMap.value = { ...dyIdxMap.value, ...JSON.parse(im) }
    const h = localStorage.getItem(dyModeKey(DY_HISTORY_KEY)); if (h) dyHistory.value = JSON.parse(h)
    const nt = localStorage.getItem(dyModeKey(DY_NOTIF_KEY)); if (nt) dyNotifs.value = JSON.parse(nt)
    const sq = localStorage.getItem(dyModeKey(DY_SEARCHES_KEY)); if (sq) dyRecentSearches.value = JSON.parse(sq)
    const hot = localStorage.getItem(dyModeKey(DY_HOT_KEY)); if (hot) { const h = JSON.parse(hot); dyHotList.value = h.list || []; dyHotMode.value = h.mode || '' }
  } catch (e) {}
}
// 存feed时剔除未完成的占位卡，避免刷新后残留空卡
// 持久化feed：只剔除未完成的占位卡。搜索结果照常存(靠dyVisibleFeed的!v.searchQ隐藏，不靠丢弃)，否则重开手机就没了、历史也点不开
function saveDyFeed() { try { const clean = douyinFeed.value.filter(v => !v.pending).slice(-50); localStorage.setItem(dyModeKey(DY_FEED_KEY), JSON.stringify(clean)); localStorage.setItem(dyModeKey(DY_IDX_KEY), String(douyinIdx.value)) } catch (e) {} }
function saveDyFollows() { try { localStorage.setItem(dyModeKey(DY_FOLLOWS_KEY), JSON.stringify([...dyFollows.value])) } catch (e) {} }
function saveDyIdxMap() { try { localStorage.setItem(dyModeKey(DY_IDXMAP_KEY), JSON.stringify(dyIdxMap.value)) } catch (e) {} }
function saveDySettings() { try { localStorage.setItem(DY_SETTINGS_KEY, JSON.stringify(douyinSettings.value)) } catch (e) {} }
function dyStylePrompt() { return (douyinSettings.value.style || '').trim() || DY_DEFAULT_STYLE }
function clearDyCache() {
  douyinFeed.value = []; douyinIdx.value = 0
  dyIdxMap.value = { 推荐: 0, 关注: 0, 私密: 0 }
  dyHistory.value = []; dyFlipped.value = {}
  dySearchMode.value = false; dySearchQuery.value = ''; showDySearchInput.value = false; dySearchDraft.value = ''
  dyRecentSearches.value = []; localStorage.removeItem(dyModeKey(DY_SEARCHES_KEY))
  dyHotList.value = []; dyHotMode.value = ''; localStorage.removeItem(dyModeKey(DY_HOT_KEY))
  dyLiveRoom.value = null; dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''; showGiftPanel.value = false
  closeDyCreatorProfile()
  dyFanClub.value = {}; localStorage.removeItem(dyModeKey(DY_FAN_KEY))
  localStorage.removeItem(dyModeKey(DY_FEED_KEY)); localStorage.removeItem(dyModeKey(DY_IDX_KEY))
  localStorage.removeItem(dyModeKey(DY_IDXMAP_KEY)); localStorage.removeItem(dyModeKey(DY_HISTORY_KEY))
  dyNotifs.value = []; localStorage.removeItem(dyModeKey(DY_NOTIF_KEY))
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
  const newComment = { user: me, text: txt, likes: '0', replies: [] }
  v.myComments.push(newComment)
  dyCommentDraft.value = ''; saveDyFeed()
  // 普通评论也触发异步生成：博主/路人的回应挂成该评论的子回复
  generateDyTopCommentResponse(v, newComment)
}
// 用户发顶层评论后，生成博主/路人的简短回应（作为子回复挂在该评论下，而非新主评论）
async function generateDyTopCommentResponse(video, myComment) {
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) return
  const me = meName.value || '我'
  const isR18 = dyR18.value
  const isPrivate = video.vis === 'private'
  // 红颜私发才限制评论者；陌生博主私密内容是平台公开内容，评论可有陌生人
  const isRedYanPrivate = isPrivate && !video.stranger
  const hasPcontent = !!(video.pcontent && isR18)
  const pcontentLine = hasPcontent
    ? `\n【翻转内容规则】这条视频还有博主@${video.creator}单独发给${me}的私密版内容：「${video.pcontent.slice(0,80)}」。博主本人可以在回复里自然回应这个私密内容；其他路人绝不能表现出任何知晓私密内容的信息，只能基于公开画面「${(video.content||'').slice(0,80)}」来回应。`
    : ''
  const audience = isRedYanPrivate
    ? `这是${me}才能看到的私密内容，回应只能来自发布者@${video.creator}，绝不能出现陌生人。`
    : `回应可来自发布者@${video.creator}或路过的真实观众，口吻简短真实，5~20字以内。`
  const instruction =
    `【${isR18 ? '抖阴（成人向短视频平台）' : '抖音'}·评论子回复·静默生成】在视频「${(video.content||'').slice(0,80)}」的评论区，${me}(@${me.replace(/^@/,'')})刚发表了评论：「${myComment.text}」。${audience}${pcontentLine}` +
    `\n生成 1~2 条自然的子回复（直接回复${me}的这条评论）。【至少必须给出 1 条】绝不允许输出空块或0条——用户会误以为接口出错了。即使判断冷门，也要给一条最合理的回应。` +
    `\n【禁止扮演${me}】${me}是真实用户，不是AI生成的角色；回复里绝不能出现昵称为"${me}"的发言，也不得替${me}生成任何想法、心理或反应。` +
    `\n只输出一个 ===DYREPLY=== 数据块，块外不写字：\n===DYREPLY===\nr1:回复者号|||被回复者号(可空)|||回复内容\nr2:...\n===REPLYEND===`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: dyRetrievalHint(video, '', myComment.text), should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: '生成评论子回复，只输出 ===DYREPLY=== 数据块，块外不写字。' },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const replies = parseDyReplies(result)
    if (replies.length) {
      if (!myComment.replies) myComment.replies = []
      for (const r of replies) {
        myComment.replies.push({ user: r.user, text: r.text, replyTo: myComment.user, isMe: false })
        pushDyNotif(video, myComment.text, r.user, r.text)
      }
      saveDyFeed()
    }
  } catch (e) {}
}
// 用户回复某条评论后，异步生成被回复者/博主/路人的回复，追加进该评论的 replies
async function generateDyCommentReply(video, comment, myText, toUser) {
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) return
  const me = meName.value || '我'
  const isR18 = dyR18.value
  const isPrivate = video.vis === 'private'
  const isRedYanPrivate = isPrivate && !video.stranger   // 红颜私发才限制评论者
  const audience = isRedYanPrivate
    ? `这是${me}只有自己能看到的私密内容，回复里绝不能出现陌生人；只可能是被回复者本人、发布者@${video.creator}、或与${me}同属亲密圈子且知情的人。若没有合适的人回，就别生成任何回复。`
    : `回复可以来自被回复者@${toUser}本人、视频发布者@${video.creator}、或路过的其他观众，口吻真实。`
  const existing = (comment.replies || []).map(r => `${r.user}${r.replyTo ? '回复'+r.replyTo : ''}：${r.text}`).join('\n')
  // pcontent只要存在就带进规则（不依赖用户是否翻转），博主可回应，他人不得透露
  const hasPcontent = !!(video.pcontent && isR18)
  const pcontentLine = hasPcontent
    ? `\n【翻转内容规则】这条视频还有博主@${video.creator}单独发给${me}的私密版内容：「${video.pcontent.slice(0,80)}」。博主本人可以在回复里自然地回应这个私密内容，但其他评论者/路人绝不能表现出任何知晓私密内容的信息，只能基于公开画面「${(video.content||'').slice(0,80)}」来回应。`
    : ''
  const instruction =
    `【${isR18 ? '抖阴（成人向短视频平台）' : '抖音'}·评论回复·静默生成】在一条视频的评论区里，${me}(@${me.replace(/^@/,'')})刚回复了 @${toUser} 的评论。` +
    `\n视频公开画面：${(video.content||'').slice(0,80)}` +
    pcontentLine +
    `\n@${toUser} 的原评论：「${comment.text}」` +
    `\n${me}的回复：「${myText}」` +
    `\n${audience}` +
    (existing ? `\n这条评论下已有的回复：\n${existing}` : '') +
    `\n生成 1~3 条自然的后续回复（每条5~20字简短口语）。【至少必须给出 1 条】绝不允许输出空块或0条——用户会误以为接口出错了。即使判断冷门，也要给一条最合理的回应。` +
    `\n【禁止扮演${me}】${me}是真实用户，不是AI生成的角色；回复里绝不能出现昵称为"${me}"的发言，也不得替${me}生成任何想法、心理或反应。` +
    `\n只输出一个 ===DYREPLY=== 数据块，块外不写字：\n===DYREPLY===\nr1:回复者号|||被回复者号(可空)|||回复内容\nr2:回复者号|||被回复者号(可空)|||回复内容\nr3:...\n===REPLYEND===`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: dyRetrievalHint(video, toUser, myText), should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: '生成评论回复，只输出 ===DYREPLY=== 数据块，块外不写字。' },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const replies = parseDyReplies(result)
    if (replies.length && comment.replies) {
      comment.replies.push(...replies)
      for (const r of replies) pushDyNotif(video, comment.text, r.user, r.text)
      saveDyFeed()
    }
  } catch (e) {}
}
function parseDyReplies(raw) {
  if (!raw) return []
  const m = raw.match(/===DYREPLY===([\s\S]*?)===REPLYEND===/); if (!m) return []
  const block = m[1]
  const out = []
  // 按行扫描：同时支持 r1:user|||to|||text 和裸行 user|||to|||text（AI有时省略编号前缀）
  for (const ln of block.split('\n')) {
    if (out.length >= 5) break
    let t = ln.trim(); if (!t || t.startsWith('===')) continue
    t = t.replace(/^r\d+\s*:\s*/, '')           // 去掉 rN: 前缀（如有）
    if (!t.includes('|||')) continue
    const p = t.split('|||'); const user = p[0]?.trim(); const to = (p[1]||'').trim(); const text = p[2]?.trim()
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
  // 已刷过的博主：带上真实姓名对照，供 AI 判断"同一个人"避免换号重复
  const seenPairs = new Map()
  if (!isSearch) douyinFeed.value.slice(-12).forEach(v => { if (v.creator) seenPairs.set(v.creator, v.realName || '') })
  const seen = [...seenPairs.entries()].map(([id, rn]) => rn ? `${id}（${rn}）` : id).join('、')

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
        ? `这是陌生成人主播的公开直播。${dyStylePrompt()} 直播尺度按成人平台设定执行，可直接写出与表演相符的裸露、动作、声音和情态。`
        : `这是与${me}亲密的红颜在直播，只对${me}和极少数知情者开放。${dyStylePrompt()} 她知道${me}在看，会对镜头特别示意，是这个人只对${me}才会这样。`)
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
      (isR18 ? `\n【抖阴风格设定·置于前部】${dyStylePrompt()}` : '') +
      `\n主播来源：${liveSourceLine}` +
      `\n直播风格：${liveStyleLine}` +
      `\n【贴合优先】主播与直播主题应贴合。当已有角色都不契合这个主题时，可以合理创建一个符合本世界观的新角色来直播，而不是让现有角色勉强扮演不属于ta设定的形象。` +
      `\n${liveChatRule}` + liveSearchLine +
      (seen ? `\n最近已出现过这些博主（括号内是其真实姓名）：${seen}。真实姓名相同=同一个人，主播别用新号重复同一个人。` : '') +
      `\n【账号唯一】同一角色全平台只有一个固定账号名，禁用别名/小名/拼音/缩写重复出现。` +
      `\n【禁止扮演${me}】chat 字段里绝不能出现昵称为"${me}"的发言，${me}是真实用户，不是AI生成的角色。` +
      `\n只输出一个 ===LIVECARD=== 数据块，块外不写字：\n===LIVECARD===\n` + DY_LIVE_FORMAT + `\n===LCEND===`
    const liveUserInput = dyRetrievalHint(
      null,
      `${livePlatform} 直播卡 ${isSearch ? `搜索词：${query}` : isFollowTab ? `已关注主播：${[...dyFollows.value].join('、')}` : '推荐直播'}`,
    )
    try {
      let result
      if (th.generateRaw) {
        result = await th.generateRaw({ user_input: liveUserInput, should_silence: true, ordered_prompts: [
          { role: 'system', content: liveInstruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
          { role: 'user', content: `生成${isSearch ? `与「${query}」直接相关的` : ''}直播卡。严格沿用上面的身份、受众与私密范围，只输出 ===LIVECARD=== 数据块，块外不写字。` },
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
    styleLine = `${dyStylePrompt()} 这是只给${me}看的私密内容，按情境需要可以直白呈现成人性事，但不要堆砌无意义的动作。`
    sourceLine = `发布者必须是当前故事世界中与${me}关系亲密的女性角色（从下方角色信息中自行判断谁符合，别凭空造陌生人）。这条私密内容只有${me}能看到，但内容不必都围绕${me}——可以是ta单独拍给${me}的，也可以是ta自娱自乐、独处时的私密记录、或与另一位亲密女性角色之间的百合互动，题材自然多样，别每条都写成对着${me}。`
    audienceLine = `\n【评论区铁则】这条内容只有${me}一个人能看到，因此绝对禁止出现任何陌生人、路人、男性观众的评论——出现即为错误。评论只能来自：${me}本人，或与发布者同属${me}亲密圈子且知情的其他女性角色。若判断没有合适的人会看到，就把评论全部留空，评论数写0，宁可没有评论也不许放陌生人进来。弹幕同理，私密内容没有公开观众，弹幕留空。`
  } else if (isPrivate && isPrivateStranger) {
    platform = '抖阴·私密（成人内容平台）'
    styleLine = `${dyStylePrompt()} 这是平台上的陌生成人内容，可按成人平台尺度直接呈现裸露与性事，保持真实情境和内容变化。`
    sourceLine = `发布者是平台上的陌生女性成人内容创作者，与当前故事人物无关，是真实存在感强的素人博主或成人up主。`
    audienceLine = `\n评论区可以有陌生的成人观众评论，口吻符合成人平台真实氛围。`
  } else if (isFollowTab) {
    platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
    styleLine = isR18
      ? `${dyStylePrompt()} 公开画面仍保持性感、撩人、若隐若现，靠体态、衣物、角度和氛围撩拨，不真正露出、不直接描写性行为。`
      : `内容生活化、有真情实感或趣味，题材自由（日常/情感/才艺/风景/美食/知识/搞笑/宠物/穿搭等皆可）。`
    sourceLine = `发布者必须是以下已关注的创作者之一，从中选一个来发新视频：${[...dyFollows.value].join('、')}。`
    audienceLine = `\n评论区可以有各种陌生观众，立场性格各异；若发布者是故事中的角色，其他角色也可能出现在评论里。`
  } else {
    platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音（短视频平台）'
    styleLine = isR18
      ? `${dyStylePrompt()} 公开画面仍保持性感、撩人、若隐若现，靠体态、衣物、角度和氛围撩拨，不真正露出、不直接描写性行为。`
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
    (isR18 ? `\n【抖阴风格设定·置于前部】${dyStylePrompt()}` : '') +
    `\n发布来源：${sourceLine}` +
    `\n内容风格：${styleLine}` +
    `\n【贴合优先】发布者与内容应贴合视频主题。当已有角色都不契合这个主题时，可以合理创建一个符合本世界观的新角色来发布，而不是让现有角色勉强扮演不属于ta设定的形象。` +
    audienceLine + flipLine + searchLine +
    // 关注tab要求"从已关注里选"，与"换新人别重复"冲突，故关注tab不加seen；只提示换新题材
    (isFollowTab
      ? `\n可以从已关注的这几个人里任选，题材尽量换新、别和最近重复。`
      : (seen ? `\n最近已刷到过这些博主（括号内是其真实姓名）：${seen}。\n【实名去重铁则】括号里真实姓名相同 = 同一个人。这些人已经出现过，请优先换全新的人和新题材；若确实要让某个已出现的人再出镜，必须沿用ta原来的抖音号，绝不能换一个新号把同一个真实姓名的人重复刷出来。` : '')) +
    `\n真实感要求：创作者名像真人抖音号（可含字母数字emoji）；【账号唯一】同一个角色在整个平台只有一个固定账号，出现时始终用同一个名字，绝不能用别名、小名、拼音、缩写、外号或换个称呼把同一个人包装成不同的新博主重复刷出；文案口语化、可带#话题；弹幕是观众即时反应、短促随意有梗；评论有不同性格与立场，别千篇一律；点赞/评论/分享数符合内容热度` +
    (isPrivate ? `（私密视频数据极低或为0，因为只有一个人看）` : '') + `。` +
    `\n只输出一个 ===DYSTART=== 数据块，块外不写任何字：\n===DYSTART===\n` + fmt + `\n===DYEND===`
  const videoUserInput = dyRetrievalHint(
    null,
    `${platform} ${isSearch ? `搜索词：${query}` : isPrivate ? '私密流' : isFollowTab ? `关注流账号：${[...dyFollows.value].join('、')}` : '推荐流'}`,
  )
  try {
    let result
    if (th.generateRaw) {
      const ordered = [
        { role: 'system', content: instruction },
        'persona_description',
        'char_description',
        'world_info_before',
        'world_info_after',
        { role: 'user', content: `生成${isSearch ? `与「${query}」直接相关的搜索结果` : isPrivate ? '严格遵守私密可见范围的视频' : isFollowTab ? '由已关注账号发布的新视频' : '下一条推荐视频'}。沿用上面的身份、受众和内容边界，只输出一个 ===DYSTART=== 数据块，块外不写任何字。` },
      ]
      result = await th.generateRaw({ user_input: videoUserInput, should_silence: true, ordered_prompts: ordered })
    } else {
      result = await th.generate({ user_input: instruction, should_silence: true })
    }
    const video = parseDyVideo(result)
    const idx = douyinFeed.value.indexOf(placeholder)
    if (video && idx >= 0) {
      video.vis = isPrivate ? 'private' : 'public'
      if (isPrivate && isPrivateStranger) video.stranger = true   // 陌生成人博主私密内容，评论可公开
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
  // 按行扫描：同时支持 c1:user|||text|||likes 和裸行 user|||text（AI有时省略编号前缀）
  block.split('\n').forEach(ln => {
    if (commentList.length >= 6) return
    let t = ln.trim(); if (!t || t.startsWith('===') || !t.includes('|||')) return
    t = t.replace(/^c\d+\s*:\s*/, '')           // 去掉 cN: 前缀（如有）
    const p = t.split('|||')
    if (p.length >= 2 && p[0].trim() && p[1].trim()) {
      commentList.push({ user: p[0].trim().replace(/^@/,'').replace(/^/,'@'), text: p[1].trim(), likes: (p[2]||'0').trim(), region: (p[3]||'').trim() })
    }
  })
  const content = f('content')
  if (!content && !f('caption')) return null
  return {
    creator: f('creator').replace('@',''),
    realName: f('realName').replace('@',''),
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
  // 按行扫描：同时支持 chat1:level|||user|||text 和裸行 level|||user|||text（AI有时省略前缀）
  block.split('\n').forEach(ln => {
    if (chatLog.length >= 10) return
    let t = ln.trim(); if (!t || t.startsWith('===') || !t.includes('|||')) return
    t = t.replace(/^chat\d+\s*:\s*/, '')        // 去掉 chatN: 前缀（如有）
    const p = t.split('|||'); const level = p[0]?.trim(); const user = p[1]?.trim(); const text = p[2]?.trim(); const tag = (p[3]||'').trim()
    if (user) chatLog.push({ level: /^\d+$/.test(level) ? +level : null, user, text: text||'', isJoin: tag==='join', isMe: false })
  })
  return {
    creator: f('creator').replace('@',''), realName: f('realName').replace('@',''), verified: /true|是|认证/.test(f('verified')),
    title: f('title'), viewers: f('viewers') || '0',
    liveLikes: Math.floor(Math.random()*5000+200) + '',
    content, memory: f('memory') || '', chatLog, myComments: [], isLiked: false, isSaved: false, isFollowing: false, type: 'live',
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
  // 直播条目必须保留 type 与 _i，否则历史页点直播无法跳回直播间
  const entry = { creator: v.creator, caption: v.caption, content: (v.content || '').slice(0, 40), vis: v.vis, ts: Date.now() }
  if (v.type === 'live') { entry.type = 'live'; if (typeof v._i === 'number') entry._i = v._i }
  dyHistory.value = dyHistory.value.filter(h => !(h.creator === entry.creator && h.content === entry.content))
  dyHistory.value.unshift(entry)
  if (dyHistory.value.length > 80) dyHistory.value = dyHistory.value.slice(0, 80)
  try { localStorage.setItem(dyModeKey(DY_HISTORY_KEY), JSON.stringify(dyHistory.value)) } catch (e) {}
}
// ---- 消息通知 ----
function saveDyNotifs() { try { localStorage.setItem(dyModeKey(DY_NOTIF_KEY), JSON.stringify(dyNotifs.value)) } catch (e) {} }
function pushDyNotif(video, commentText, replierUser, replyText) {
  if (!replierUser || !replyText) return
  dyNotifs.value.unshift({ id: Date.now() + Math.random(), videoCreator: video.creator, videoContent: (video.content || '').slice(0, 20), commentText, replierUser, replyText, ts: Date.now(), read: false })
  if (dyNotifs.value.length > 100) dyNotifs.value = dyNotifs.value.slice(0, 100)
  saveDyNotifs()
}
function markAllDyNotifsRead() { dyNotifs.value.forEach(n => { n.read = true }); saveDyNotifs() }
// 从消息通知跳回对应视频并打开评论
function openDyFromNotif(n) {
  n.read = true; saveDyNotifs()
  const idx = douyinFeed.value.findIndex(v => !v.pending && v.creator === n.videoCreator && (v.content || '').slice(0, 20) === n.videoContent)
  if (idx < 0) { showToast('这条视频已不在缓存里了'); return }
  showDyMsgCenter.value = false
  const v = douyinFeed.value[idx]
  dySearchMode.value = false
  dyTab.value = v.vis === 'private' ? (dyR18.value ? '私密' : '推荐') : (v.isFollowing ? dyTab.value : (dyTab.value === '关注' ? '推荐' : dyTab.value))
  if (dyTab.value === '私密' && !dyR18.value) dyTab.value = '推荐'
  dyIdxMap.value[dyTab.value] = idx; saveDyIdxMap()
  douyinIdx.value = idx
  // 先把视口滚到该视频，滚定了再开评论区，否则评论区是这条、背后视频还停在原处（割裂）
  dyRestorePos()
  dyScrollToIdx(idx, () => { dyCommentIdx.value = idx; showDyComments.value = true })
}
// 把 feed 视口精确滚到指定真实下标（带重试，等 clientHeight 就绪），滚定后回调
function dyScrollToIdx(idx, done, tries = 0) {
  suppressDyScroll(900)
  nextTick(() => {
    const el = dyFeedEl.value
    if (!el || !el.clientHeight) {
      if (tries < 12) return setTimeout(() => dyScrollToIdx(idx, done, tries + 1), 50)
      if (done) done(); return
    }
    const pos = dyVisibleFeed.value.findIndex(v => v._i === idx)
    if (pos < 0) {
      if (tries < 12) return setTimeout(() => dyScrollToIdx(idx, done, tries + 1), 50)
      if (done) done(); return
    }
    el.scrollTop = pos * el.clientHeight
    douyinIdx.value = idx
    stopDanmaku(); startDanmaku(douyinFeed.value[idx])
    if (done) done()
  })
}
function formatDyNotifTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}
// ---- 分享功能 ----
function openDyShareMenu(type, data) { dyShareMenu.value = { type, data } }
function openDyCreatorProfile(data) {
  if (!data || !data.creator) return
  dyCreatorProfile.value = data
  dyRealNameRevealed.value = false
}
function closeDyCreatorProfile() { dyCreatorProfile.value = null; dyRealNameRevealed.value = false }
function revealDyRealName(data) {
  if (!data || !data.realName) return
  dyRealNameRevealed.value = true
  showToast('已实名认证：' + data.realName)
}
// 转发注入用特殊格式块包裹并写清性质，否则角色不认（会说"是别的同人位面"或"user在骗人"）。
// 两类语义：
//  · 场景切换（视频/直播）：把镜头切到该内容展示的现场，AI 直接把它当成正在发生的剧情来演
//  · 出示展示（评论/照片/微信）：在当前场景里把手机内容拿给人看，是真实存在的记录
function dyShareBlock(kind, body, context = '') {
  const head = kind === 'scene'
    ? '【手机·画面转场】以下内容来自小手机里真实存在的抖音/抖阴记录，不是虚构、不是同人、不是他人捏造。本次分享就是明确的镜头切换指令：把正文当前场景转入这个视频或直播所展示的现场，以画面中的地点、人物与关系状态作为新的剧情起点，从此刻往后创造新剧情。不要停留在原场景讨论手机内容，也不要把它当成用户的一句概括来敷衍。{{user}}是否在新现场、以何种方式出现，只能依据画面和已有剧情，不得擅自补写{{user}}的动作、对白、反应或决定。'
    : '【手机·出示内容】以下是手机里真实存在的记录，内容属实、可被信任，不是伪造也不是玩笑。请让在场角色看到它并自然做出反应。'
  return `<手机展示>\n${head}\n${context ? `【可见性与身份定义】${context}\n` : ''}${body}\n</手机展示>`
}
function buildShareToStoryText(type, data) {
  const me = meName.value || '我'
  if (type === 'video') {
    const v = data
    const isR18 = dyR18.value
    const isPrivate = v.vis === 'private'
    const isStranger = !!v.stranger
    const isRedYan = isPrivate && !isStranger
    const hasPcontent = !!(v.pcontent && isR18)
    const publisher = v.realName ? `${v.realName}（抖音号 @${v.creator}）` : `抖音号 @${v.creator}`
    if (isRedYan) {
      return dyShareBlock('scene', `转场来源：一条只发给${me}的抖阴（成人向短视频平台）私密视频，发布者${publisher}，文案「${v.caption || ''}」。\n新剧情现场：${v.content}`, `${publisher}是当前故事世界中与${me}关系亲密的红颜。此内容由她只发给${me}，默认只有${me}与她本人知道并能确认其真实性；画面中若明确有其他参与者，该参与者只知道自己亲历的部分。陌生人、路人和未被告知的角色都不应知道这条私密视频，更不能凭空评论或质疑来源。正文继续时请保留这层可见范围；发布者知道这是自己的私密内容。`)
    } else if (isPrivate && isStranger) {
      return dyShareBlock('scene', `转场来源：抖阴（成人向短视频平台）博主${publisher}发布的成人内容，文案「${v.caption || ''}」。\n新剧情现场：${v.content}`, `这是平台上陌生成人创作者的公开内容，与当前故事角色没有既定关系；不要把陌生博主误认成故事人物，也不要替${me}或任何角色补写未表达的想法。`)
    } else if (hasPcontent) {
      return dyShareBlock('scene', `转场来源：抖阴（成人向短视频平台）博主${publisher}发布的视频，文案「${v.caption || ''}」。\n公开现场画面：${v.content}\n只对${me}可见的私密版现场：${v.pcontent}`, `公开画面可被正常看到；私密版只由${publisher}单独发给${me}，只有${me}和${publisher}知道其内容。其他角色只能依据公开画面反应，不能提及、暗示或质疑私密版，也不能因为私密版内容而突然认识${publisher}。`)
    } else {
      const platform = isR18 ? '抖阴（成人向短视频平台）' : '抖音'
      return dyShareBlock('scene', `转场来源：${platform}博主${publisher}发布的视频，文案「${v.caption || ''}」。\n新剧情现场：${v.content}`, `这是平台公开内容；若实名对应故事中的已有角色，沿用其既有身份与关系；若是陌生博主，不要强行与当前角色建立关系，也不要让其知道${me}的未公开信息。`)
    }
  } else if (type === 'live') {
    const room = data
    const platform = dyR18.value ? '抖阴（成人向短视频平台）' : '抖音'
    const publisher = room.realName ? `${room.realName}（抖音号 @${room.creator}）` : `抖音号 @${room.creator}`
    const context = room.redYan
      ? `${publisher}是与${me}关系亲密的红颜；这是只让${me}和她及极少数知情亲密圈子看到的私密直播，陌生人、路人和男性观众都不知道直播内容，也不能凭空进入聊天或质疑真实性。`
      : room.realName
        ? `这是平台公开直播；主播实名为${room.realName}。若该实名对应故事中的已有角色，必须沿用她既有的身份与关系；若她是陌生主播，则不要强行建立与当前角色的关系。`
        : `这是平台公开直播；除非正文已有依据，不要强行把陌生主播认成已有角色，也不要替任何角色补写与主播的关系。`
    const recentLiveChat = (room.chatLog || []).slice(-8).map((msg, index) => {
      if (msg.isJoin) return `${index + 1}. ${msg.user}进入直播间`
      return `${index + 1}. ${msg.user}：${msg.text}`
    }).join('\n')
    return dyShareBlock('scene', `转场来源：${publisher}正在${platform}直播「${room.title || ''}」。\n新剧情现场：${room.content || ''}${room.memory ? `\n本场直播连续性记忆：${room.memory}` : ''}${recentLiveChat ? `\n最近直播消息（从较早到较新）：\n${recentLiveChat}` : ''}`, context)
  } else if (type === 'comment') {
    const { video, comment } = data
    const platform = dyR18.value ? '抖阴（成人向短视频平台）' : '抖音'
    return dyShareBlock('show', `${me}把手机上的评论展示出来：${platform}博主@${video.creator}「${video.caption || ''}」视频下，${comment.user}评论道「${comment.text}」`, `这是该视频评论区的公开文字记录，不等于评论者出现在当前现场；角色只知道这段记录中明确写出的内容。`)
  } else if (type === 'reply') {
    const { video, comment, reply } = data
    const platform = dyR18.value ? '抖阴（成人向短视频平台）' : '抖音'
    return dyShareBlock('show', `${me}把手机上的评论展示出来：${platform}博主@${video.creator}「${video.caption || ''}」视频下，${reply.user}回复${reply.replyTo || comment.user}「${reply.text}」`, `这是评论区已有的公开回复记录，不等于回复者就在当前现场。`)
  } else if (type === 'photo') {
    const p = data
    return dyShareBlock('show', `${me}把手机相册里的一张照片展示出来：${p.时间}拍下的，画面是${p.画面}`, `这是相册中真实存在的照片记录；时间和画面指向照片拍摄时刻，不要把查看照片的现在误写成拍摄时刻。`)
  } else if (type === 'wxmsg') {
    const { msg, contact } = data
    const name = msg.dir === '发出' ? me : contact
    return dyShareBlock('show', `${me}把手机上与${contact}的微信对话展示出来，其中一条：${name}说「${msg.text}」`, `这是手机里真实保存的聊天记录；只有这条记录明确出现的发送者、接收者和内容可被当作事实，不替${me}补写未表达的反应。`)
  } else if (type === 'wxmsgs') {
    const { msgs, contact } = data
    const lines = msgs.map(m => `${m.dir === '发出' ? me : contact}：「${m.text}」`).join('\n')
    return dyShareBlock('show', `${me}把手机上与${contact}的一段微信对话展示出来：\n${lines}`, `这是按发送先后排列的真实聊天记录；不要把记录中的旧时间、旧地点或旧情绪强行改成当前场景。`)
  }
  return ''
}
// 分享到故事：塞进酒馆主输入框并自动发送（与开场白/微信常规发送同一通道，可与记忆插件等联动），
// 而不是后台静默 generate。
function shareToStory(type, data) {
  const text = buildShareToStoryText(type, data)
  if (!text) { showToast('无内容可分享'); return }
  dyShareMenu.value = null
  try {
    const ta = doc.querySelector('#send_textarea')
    if (!ta) { showToast('未找到输入框，无法分享'); return }
    const cur = (ta.value || '').replace(/\s+$/, '')
    ta.value = cur ? cur + '\n\n' + text : text
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    const btn = doc.querySelector('#send_but')
    if (btn) { btn.click(); showToast('已分享到故事') }
    else showToast('已填入输入框，请手动发送')
  } catch (e) { showToast('分享失败：' + ((e && e.message) || e)) }
}
// 微信：从点击菜单分享单条消息到故事
function shareWxMsgToStory() {
  if (!ctxMenu.value) return
  const arr = ownerLogs.value[activeContact.value]; if (!arr) return
  const msg = arr[ctxMenu.value.idx]; if (!msg) return
  closeCtxMenu()
  shareToStory('wxmsg', { msg, contact: activeContact.value })
}
// 微信：多选模式
function startWxMultiSelect() { closeCtxMenu(); wxMultiSelect.value = true; wxSelectedMsgs.value = new Set() }
function cancelWxMultiSelect() { wxMultiSelect.value = false; wxSelectedMsgs.value = new Set() }
function toggleWxMsgSelect(i) { const s = new Set(wxSelectedMsgs.value); if (s.has(i)) s.delete(i); else s.add(i); wxSelectedMsgs.value = s }
function shareWxMultiToStory() {
  const arr = ownerLogs.value[activeContact.value]; if (!arr) return
  const idxs = [...wxSelectedMsgs.value].sort((a, b) => a - b)
  const msgs = idxs.map(i => arr[i]).filter(Boolean)
  if (!msgs.length) return
  cancelWxMultiSelect()
  shareToStory('wxmsgs', { msgs, contact: activeContact.value })
}
function toggleDyFlip(vi) {
  const v = douyinFeed.value[vi]
  if (!v || !v.pcontent) return
  dyFlipped.value = { ...dyFlipped.value, [vi]: !dyFlipped.value[vi] }
}
function setDyStrangerPct(p) { p = Math.round(+p); if (isNaN(p)) return; p = Math.max(0, Math.min(100, p)); dyStrangerPct.value = p; douyinSettings.value.strangerPct = p; saveDySettings() }
// 从历史点回看：在feed里找到那条并定位到对应tab；直播类型直接打开直播间
function openDyFromHistory(h) {
  // 直播：直接用 _i 打开直播间（如果还在feed里）
  if (h.type === 'live') {
    const fi = typeof h._i === 'number' ? h._i : douyinFeed.value.findIndex(v => v.type === 'live' && v.creator === h.creator)
    if (fi >= 0 && douyinFeed.value[fi]?.type === 'live') {
      showDyHistory.value = false
      enterDyLiveRoom(fi); return
    }
    showToast('这场直播已不在缓存里了'); return
  }
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
  try { localStorage.setItem(dyModeKey(DY_SEARCHES_KEY), JSON.stringify(dyRecentSearches.value)) } catch (e) {}
}
function removeRecentSearch(q) {
  dyRecentSearches.value = dyRecentSearches.value.filter(x => x !== q)
  try { localStorage.setItem(dyModeKey(DY_SEARCHES_KEY), JSON.stringify(dyRecentSearches.value)) } catch (e) {}
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
function saveDyHot() { try { localStorage.setItem(dyModeKey(DY_HOT_KEY), JSON.stringify({ mode: dyHotMode.value, list: dyHotList.value })) } catch (e) {} }
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
      result = await th.generateRaw({ user_input: dyRetrievalHint(null, `${platform} 热榜`), should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: `给出符合${platform}和当前世界背景的热搜榜，只输出一个 ===HOTSTART=== 数据块，块外不写字。` },
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
  dyLiveRoom.value = { ...v, feedIdx, memory: v.memory || `主播${v.realName || v.creator}正在直播「${v.title || ''}」，上一版画面：${v.content || ''}`, chatLog: [...(v.chatLog || [])] }
  dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''
  stopDanmaku()
  nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
  // 记录历史：直播间也加入历史记录，type:'live' 标记
  pushDyHistory({ creator: v.creator, caption: v.title || '', content: v.content || '', vis: 'public', type: 'live', _i: feedIdx })
  // 不自动生成——用户手动发言或点「主播继续」才触发
}
function closeDyLiveRoom() {
  // 退出时把当前全量弹幕保存回feed，用户可事后回顾
  if (dyLiveRoom.value) {
    const fi = dyLiveRoom.value.feedIdx
    if (fi != null && douyinFeed.value[fi] && douyinFeed.value[fi].type === 'live') {
      douyinFeed.value[fi].chatLog = [...(dyLiveRoom.value.chatLog || [])]
      douyinFeed.value[fi].memory = dyLiveRoom.value.memory || ''
      douyinFeed.value[fi].liveLikes = dyLiveRoom.value.liveLikes
      douyinFeed.value[fi].viewers = dyLiveRoom.value.viewers
      saveDyFeed()
    }
  }
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
// 解析直播聊天批次（===LIVECHAT=== ... ===CHATEND===）：返回 {msgs, screen, memory}
// 兼容两种：cN:等级|||昵称|||内容 带编号，或裸行 等级|||昵称|||内容
function parseLiveChat(raw, batch = 50) {
  if (!raw) return { msgs: [], screen: '', memory: '' }
  const m = raw.match(/===LIVECHAT===([\s\S]*?)===CHATEND===/)
  if (!m) return { msgs: [], screen: '', memory: '' }
  const block = m[1]
  const out = []
  const sm = block.match(/^\s*screen\s*:(.+)$/m)
  const screen = sm ? sm[1].trim() : ''
  const mm = block.match(/^\s*memory\s*:(.+)$/m)
  const memory = mm ? mm[1].trim().slice(0, 300) : ''
  const pushLine = (line) => {
    const t = line.trim(); if (!t || !t.includes('|||')) return
    const p = t.split('|||'); const level = p[0]?.trim(); const user = p[1]?.trim(); const text = p[2]?.trim(); const tag = (p[3]||'').trim()
    // join 识别容错：tag==='join' OR text本身就是"join"（AI少写了第4字段）
    const isJoin = tag === 'join' || (text || '').toLowerCase() === 'join'
    const msgText = isJoin ? '' : (text || '')
    // 等级字段容错：纯数字(85)或带前缀(Lv.85/lv85)均支持，提取首段数字
    const lvNum = (level || '').match(/\d+/)
    if (user) out.push({ level: lvNum ? +lvNum[0] : null, user, text: msgText, isJoin, isMe: false })
  }
  block.split('\n').forEach(ln => {
    let t = ln.trim(); if (!t) return
    if (/^(screen|memory)\s*:/.test(t)) return
    // 去掉行首 cN: 编号
    t = t.replace(/^c\d+\s*:/, '')
    if (t.includes('|||')) pushLine(t)
  })
  return { msgs: out, screen, memory }
}
// 生成新一批聊天消息（进房间时 / 用户发言后 / 手动「主播继续」）
async function generateLiveChat(includeUserMsg = false) {
  if (generatingLiveChat.value || !dyLiveRoom.value) return
  const th = TH(); if (!th || (!th.generateRaw && !th.generate)) { showToast('当前环境不支持生成'); return }
  generatingLiveChat.value = true
  const room = dyLiveRoom.value
  const me = meName.value || '我'
  const isR18 = dyR18.value
  // dyChatBatch = 喂给AI的历史记忆条数（含user发言，noImpersonateLine防AI扮演）
  const contextBatch = dyChatBatch.value || 50
  const allChat = room.chatLog || []
  const recentSlice = allChat.slice(-contextBatch)
  const recentStart = allChat.length - recentSlice.length
  const recentChat = recentSlice.map((c, i) => {
    const seq = recentStart + i + 1
    if (c.isJoin) return `第${seq}条｜${c.user}进入直播间`
    const kind = c.isMe ? '用户消息' : c.isGift ? '用户送礼' : c.isLevelUp ? '粉丝团升级' : '观众弹幕'
    return `第${seq}条｜${kind}｜[等级${c.level ?? '?'}] ${c.user}：${c.text}`
  }).join('\n')
  // 最近三条用户操作必须保留原始先后顺序，并单独点明最新一条，避免模型把三句当成并列指令。
  const lastMeMsgs = allChat.map((msg, index) => ({ msg, seq: index + 1 })).filter(item => item.msg.isMe).slice(-3)
  const lastMeMsg = lastMeMsgs.length ? lastMeMsgs[lastMeMsgs.length - 1] : null
  const orderedMeMsgs = lastMeMsgs.map((item, index) => {
    const pos = index === lastMeMsgs.length - 1 ? '最近一条' : index === 0 ? '较早' : '随后'
    return `${index + 1}. ${pos}（全场第${item.seq}条）：${item.msg.text}`
  }).join('\n')
  const replyNote = includeUserMsg && lastMeMsg
    ? `\n【本次操作】${me}刚刚发送了一条新的直播消息。` +
      `\n【${me}最近三条操作·按较早到较新排列】\n${orderedMeMsgs}` +
      `\n【本轮新消息】全场第${lastMeMsg.seq}条：「${lastMeMsg.msg.text}」。主播或被点名的观众先回应这一条，再自然承接更早但尚未解决的事项。` +
      `\n【点名必应】若本轮新消息里点名、@ 或直接称呼了某个人，被点到的人必须在这批内容里优先、明确回应。`
    : `\n【本次操作·主播继续】本轮用户没有发送任何新消息。` +
      (lastMeMsg
        ? `最近一条用户消息「${lastMeMsg.msg.text}」只是已经发生过的历史记录，不得复制、重发或当作本轮新输入；只在连续性记忆标明它仍未回应时，才自然补完回应。`
        : `当前也没有历史用户消息需要回应。`) +
      `请依据上一版直播画面、连续性记忆和后续观众弹幕继续推动直播，绝不虚构${me}的新发言、动作或决定。`
  const fan = dyFanClub.value[room.creator]
  const levelNote = fan && fan.level > 0
    ? `\n${me}是这个直播间 ${fan.level} 级粉丝团成员${fan.level >= 10 ? '（高等级铁粉）' : ''}，主播对${me}${fan.level >= 20 ? `非常熟悉亲近，会主动点名、记得${me}` : fan.level >= 10 ? '比较熟络，愿意多回应' : '有印象'}。`
    : ''
  // ③ 用 redYan 而非 isFollowing 判断私密铁则（isFollowing=false也可能是红颜直播）
  const isRedYan = !!room.redYan
  const styleNote = isR18
    ? (isRedYan
      ? `【抖阴风格】${dyStylePrompt()}【私密直播铁则·不可破】这是只对${me}和极少数知情亲密圈子开放的私密直播。聊天里绝对禁止任何陌生人、路人、男性观众；只允许与主播真正亲密且知情的极少数女性角色（若没有，chat留空）。违反即错误。`
      : `【抖阴风格】${dyStylePrompt()}这是成人平台公开直播，观众可以有各种人，口吻成人化真实。`)
    : `这是普通抖音直播间，观众口吻真实日常。等级高的粉丝主播会更热络。`
  // ③ 主播口播 与 观众弹幕 是两种不同的东西，必须都有，别混成一锅
  const roleSplitLine =
    `\n【口播与弹幕的区别】直播间存在两种内容，各写各的，不能混淆：` +
    `\n· 画面描述(screen)：主播在做什么、说什么——主播是对着镜头开口讲话/表演，这属于画面，写进 screen，不要把主播的话写成一条弹幕。` +
    `\n· 聊天弹幕(c1..)：观众打字发上屏的短消息——是观众在敲键盘，不是在说话。主播不发弹幕（除非极特殊情况），观众也不会"口播"。` +
    (isRedYan
      ? `\n每次必须推进 screen；只有存在符合私密范围的真实观众时才输出 c 行，没有就只更新 screen 与 memory。`
      : `\n每次都要既推进 screen（主播的动作与口播内容），又给出若干条观众弹幕。`)
  // ① 明确禁止 AI 扮演 me（replyNote 已在上方构建）
  const noImpersonateLine = `\n【禁止扮演${me}】聊天输出里绝对不能出现昵称为"${me}"的发言，因为${me}是真实用户，不是AI生成的角色。`
  const contMustLine = `\n【连续性铁则】这是同一场直播的延续，主播始终是同一个人 @${room.creator}，正在直播「${room.title}」。在前面聊天的基础上自然往下推进，主播的状态、话题连贯，绝不能像换了个人或重开一场。`
  const priorMemory = room.memory || `主播${room.realName || room.creator}正在直播「${room.title || ''}」。`
  const previousScreen = room.content || '暂无上一版画面'
  const chatAmountLine = isRedYan
    ? `\n生成 0~6 条聊天消息。只允许已知且知情的亲密女性角色发出新消息；${me}的既有消息只作为上下文，绝不能由AI复刻或代发。如果没有合适的新观众发言，可以不输出 c 行，绝不能为了凑数创造陌生人或进场消息。`
    : `\n生成接下来 6~12 条聊天消息（每条5~20字，简短口语；包含1~2条进场消息和其余普通聊天；等级有高有低，内容连贯不重复）。`
  const instruction =
    `【${isR18 ? '抖阴（成人向短视频平台）' : '抖音'}·直播聊天·静默生成】继续同一场直播，只推进主播画面与观众聊天，不写故事正文。主播 @${room.creator}${room.realName ? `（实名：${room.realName}）` : ''} 正在直播「${room.title}」。` +
    contMustLine +
    `\n【上一版直播画面】${previousScreen}` +
    `\n【本场连续性记忆】${priorMemory}` +
    `\n记忆是此前各轮压缩后的事实依据；与最近聊天合并理解，不能丢失其中尚未回应的人、话题、动作和约定。` +
    `\n${styleNote}${levelNote}${replyNote}${noImpersonateLine}${roleSplitLine}` +
    chatAmountLine +
    `\n进场消息固定格式：文本写"来了"并在末尾加|||join；普通聊天不加|||join。` +
    (recentChat ? `\n【近期聊天记录·严格按编号从小到大发生】\n${recentChat}` : '\n【近期聊天记录】暂无。') +
    `\n输出 screen：承接“上一版直播画面”，写主播接下来具体做什么、说什么，2-3句。` +
    `\n输出 memory：在旧记忆基础上写一份更新后的、自包含的本场连续性摘要，最多300字。保留主播身份、场景、正在做的事、已发生的关键互动、${me}最近一条消息和未回应事项；已解决事项可压缩。只写客观事实，不写${me}的内心、反应、对白或决定。` +
    `\n只输出一个 ===LIVECHAT=== 数据块，块外不写字：\n===LIVECHAT===\nscreen:承接上一版后的直播画面描述\nmemory:更新后的本场连续性记忆\nc1:等级|||昵称|||来了|||join（进场消息）\nc2:等级|||昵称|||聊天内容（普通消息，不加|||join）\n...\n===CHATEND===`
  const liveUserInput = dyRetrievalHint(
    room,
    recentChat ? `最近直播消息（按发生顺序）：${recentChat.slice(-1200)}` : '最近直播消息：暂无',
    includeUserMsg && lastMeMsg ? lastMeMsg.msg.text : '',
  )
  const finalLivePrompt =
    `承接上一版直播画面：「${previousScreen}」。` +
    (includeUserMsg && lastMeMsg
      ? `本轮新用户消息是：「${lastMeMsg.msg.text}」，先处理它和记忆中的未回应事项。`
      : `本轮没有新的用户消息；历史用户消息不得复刻为本轮输入，直接继续推进主播画面与直播发展。`) +
    `更新 screen 与 memory，并严格只输出 ===LIVECHAT=== 数据块；不得输出故事正文、解释或块外文字。`
  try {
    let result
    if (th.generateRaw) {
      result = await th.generateRaw({ user_input: liveUserInput, should_silence: true, ordered_prompts: [
        { role: 'system', content: instruction }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
        { role: 'user', content: finalLivePrompt },
      ] })
    } else { result = await th.generate({ user_input: instruction, should_silence: true }) }
    const parsed = parseLiveChat(result, 12)
    // ① 过滤掉 AI 伪造的 me 发言（昵称完全匹配），防止冒名
    const safeMe = me.replace(/^@/, '')
    const newMsgs = parsed.msgs.filter(m => (m.user || '').replace(/^@/, '') !== safeMe)
    if (dyLiveRoom.value && (newMsgs.length || parsed.screen || parsed.memory)) {
      if (newMsgs.length) dyLiveRoom.value.chatLog = [...(dyLiveRoom.value.chatLog || []), ...newMsgs]
      if (parsed.screen) dyLiveRoom.value.content = parsed.screen
      if (parsed.memory) dyLiveRoom.value.memory = parsed.memory
      // 观众数递增：修复万/K格式解析 + 每条进场消息+1
      const joinCount = newMsgs.filter(m => m.isJoin).length
      if (joinCount > 0 && dyLiveRoom.value.viewers) {
        const vStr = String(dyLiveRoom.value.viewers)
        let prev = 0
        if (vStr.includes('万')) prev = Math.round(parseFloat(vStr) * 10000)
        else if (vStr.includes('K') || vStr.includes('k')) prev = Math.round(parseFloat(vStr) * 1000)
        else prev = parseInt(vStr.replace(/[^\d]/g, '') || '0', 10)
        if (prev > 0 && prev < 1000000) {
          // 红颜直播圈子封闭，不加随机路人；普通直播随机补几个隐藏观众
          const bonus = isRedYan ? 0 : Math.floor(Math.random() * 8 + 2)
          dyLiveRoom.value.viewers = String(prev + joinCount + bonus)
        }
      }
      // ⑦ 点赞随每批聊天自然递增（基于观众数）
      if (newMsgs.length) {
        const vNum = (() => { const s = String(dyLiveRoom.value.viewers || '0'); return s.includes('万') ? Math.round(parseFloat(s)*10000) : parseInt(s.replace(/[^\d]/g,''),10)||10 })()
        const increment = Math.floor(vNum * (0.03 + Math.random() * 0.05))
        const oldLikes = parseInt((dyLiveRoom.value.liveLikes || '0').replace(/[,万]/g, '') || '0', 10)
        dyLiveRoom.value.liveLikes = String(oldLikes + increment)
      }
      // 每批都同步回 feed（保存全量chatLog，不限8条）
      const fi = dyLiveRoom.value.feedIdx
      if (fi != null && douyinFeed.value[fi] && douyinFeed.value[fi].type === 'live') {
        douyinFeed.value[fi].content = dyLiveRoom.value.content
        douyinFeed.value[fi].memory = dyLiveRoom.value.memory || ''
        douyinFeed.value[fi].liveLikes = dyLiveRoom.value.liveLikes
        douyinFeed.value[fi].chatLog = [...(dyLiveRoom.value.chatLog || [])]
        saveDyFeed()
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
  dyLiveRoom.value.chatLog.push({ level: curFan.value ? curFan.value.level : 0, user: me, text: (replyTo ? `回复@${replyTo} ` : '') + txt, isJoin: false, isMe: true })
  dyLiveChatDraft.value = ''; dyLiveReplyTo.value = ''
  nextTick(() => { const el = dyLiveChatEl.value; if (el) el.scrollTop = el.scrollHeight })
  generateLiveChat(true)   // 发言即推进：AI生成回应
}
// ---- 粉丝团 & 等级 ----
function saveDyFanClub() { try { localStorage.setItem(dyModeKey(DY_FAN_KEY), JSON.stringify(dyFanClub.value)) } catch (e) {} }
function saveDyDiamond() { try { localStorage.setItem(dyModeKey(DY_DIAMOND_KEY), String(dyDiamond.value)) } catch (e) {} }
// 当前直播间的粉丝团信息
const curFan = computed(() => {
  const c = dyLiveRoom.value && dyLiveRoom.value.creator
  return c ? (dyFanClub.value[c] || null) : null
})
// 观众头像：含user（使用粉丝团真实等级），每个用户取最高等级，按等级降序，取前4个
const dyLiveViewers = computed(() => {
  if (!dyLiveRoom.value) return []
  const me = (meName.value || '').replace(/^@/, '')
  const levelMap = new Map()   // name → 最高等级
  // 先把user自己放进去，用粉丝团等级
  if (me) levelMap.set(me, curFan.value ? curFan.value.level : 0)
  for (const msg of (dyLiveRoom.value.chatLog || [])) {
    const u = (msg.user || '').replace(/^@/, '')
    if (!u) continue
    const lv = msg.level ?? 0
    if (!levelMap.has(u) || (levelMap.get(u) ?? 0) < lv) levelMap.set(u, lv)
  }
  const out = [...levelMap.entries()].map(([name, level]) => ({ name, level }))
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
  const qty = Math.max(1, giftQty.value || 1)
  const total = g.price * qty
  if (dyDiamond.value < total) { showToast('钻石不足，先充值吧'); return }
  const c = dyLiveRoom.value.creator
  const me = meName.value || '我'
  dyDiamond.value -= total; saveDyDiamond()
  const cur = dyFanClub.value[c] || { level: 0, exp: 0 }
  const newExp = cur.exp + g.exp * qty
  const oldLevel = cur.level
  const newLevel = expToLevel(newExp)
  dyFanClub.value = { ...dyFanClub.value, [c]: { level: newLevel, exp: newExp } }
  saveDyFanClub()
  const qtyLabel = qty > 1 ? `×${qty}` : ''
  dyLiveRoom.value.chatLog.push({ level: newLevel, user: me, text: `送出了 ${g.icon}${g.name}${qtyLabel}`, isJoin: false, isMe: true, isGift: true })
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

// ---- 手机输入法浮层（移动端键盘适配） ----
// 原理：手机端点输入框→不触发系统键盘→弹自绘 IME 面板（位于 mp-phone 缩放节点之外，不受transform影响）
const imeActive = ref(false)
const imeDraft = ref('')
const imePlaceholder = ref('')
const imeMultiline = ref(false)
const imeHasSubmit = ref(false)     // 控制"发送"/"确定"按钮文字和禁用态（let变量非响应式，用ref代理）
let _imeSetValue = null
let _imeOnSubmit = null

const IME_EMOJIS = ['😊','😂','🥰','😍','🤔','👍','🙏','💕','❤️','😭','😅','🎉','🔥','✨','💪','😏','😈','👀','💋','🫶','🥹','😘','🤗','🤩','🥳','😌','😴','🤭','💔','🫰']

function openIME({ placeholder = '', getValue, setValue, onSubmit, multiline = false } = {}) {
  imeDraft.value = getValue ? getValue() : ''
  imePlaceholder.value = placeholder
  imeMultiline.value = !!multiline
  _imeSetValue = setValue || null
  _imeOnSubmit = onSubmit || null
  imeHasSubmit.value = !!onSubmit
  imeActive.value = true
  nextTick(() => {
    // 浮层teleport到父document，必须用doc（window.parent.document）才能找到元素
    const el = doc.querySelector('.mp-ime-in, .mp-ime-ta')
    if (el) { el.focus(); el.setSelectionRange && el.setSelectionRange(el.value.length, el.value.length) }
  })
}
function imeSync() { if (_imeSetValue) _imeSetValue(imeDraft.value) }
function submitIME() {
  if (_imeSetValue) _imeSetValue(imeDraft.value)
  if (_imeOnSubmit) _imeOnSubmit()
  closeIME()
}
function closeIME() { imeActive.value = false; imeDraft.value = ''; imeHasSubmit.value = false; _imeSetValue = null; _imeOnSubmit = null }
function imeAppendEmoji(e) { imeDraft.value += e; imeSync() }

// 各输入框对应的 openIME 入口（自带上下文）
function openIMEWechat() {
  openIME({ placeholder: '发送消息', getValue: () => draft.value, setValue: v => { draft.value = v }, onSubmit: send, multiline: true })
}
function openIMENewContact() {
  openIME({ placeholder: '输入联系人名开始对话', getValue: () => newContact.value, setValue: v => { newContact.value = v }, onSubmit: startChat })
}
function openIMESearch() {
  openIME({ placeholder: '搜索', getValue: () => searchQuery.value, setValue: v => { searchQuery.value = v } })
}
function openIMERemark() {
  openIME({ placeholder: '未设置', getValue: () => remarkDraft.value, setValue: v => { remarkDraft.value = v }, onSubmit: saveRemarkDraft })
}
function openIMECamera() {
  openIME({ placeholder: '描述拍摄对象…', getValue: () => cameraDraft.value, setValue: v => { cameraDraft.value = v }, multiline: true })
}
function openIMEDyComment() {
  openIME({
    placeholder: dyReplyTo.value ? '回复 @' + dyReplyTo.value : '善语结善缘，恶言伤人心',
    getValue: () => dyCommentDraft.value,
    setValue: v => { dyCommentDraft.value = v },
    onSubmit: submitDyComment,
  })
}
function openIMEDySearch() {
  openIME({ placeholder: '搜索你感兴趣的内容', getValue: () => dySearchDraft.value, setValue: v => { dySearchDraft.value = v }, onSubmit: submitDySearch })
}
function openIMELiveChat() {
  openIME({
    placeholder: dyLiveReplyTo.value ? '回复 @' + dyLiveReplyTo.value : '说点什么...',
    getValue: () => dyLiveChatDraft.value,
    setValue: v => { dyLiveChatDraft.value = v },
    onSubmit: submitLiveChat,
  })
}
function openIMEDyStyle() {
  openIME({ placeholder: '输入抖阴风格', getValue: () => douyinSettings.value.style || '', setValue: v => { douyinSettings.value.style = v }, onSubmit: saveDySettings, multiline: true })
}
// 数字输入框也走IME浮层（数字键盘也会顶缩手机）
function openIMEHistDraft() { openIME({ placeholder: '输入历史条数', getValue: () => histDraft.value, setValue: v => { histDraft.value = v }, onSubmit: applyHistDraft }) }
function openIMELivePct() { openIME({ placeholder: '输入直播概率(0~100)', getValue: () => livePctDraft.value, setValue: v => { livePctDraft.value = v }, onSubmit: applyLivePctDraft }) }
function openIMEChatBatch() { openIME({ placeholder: '输入上下文条数(10~200)', getValue: () => chatBatchDraft.value, setValue: v => { chatBatchDraft.value = v }, onSubmit: applyChatBatchDraft }) }
function openIMEStrangerPct() { openIME({ placeholder: '输入陌生人占比(0~100)', getValue: () => strangerDraft.value, setValue: v => { strangerDraft.value = v }, onSubmit: applyStrangerDraft }) }
function openIMERechargeAmt() { openIME({ placeholder: '输入充值金额（元）', getValue: () => rechargeDraft.value, setValue: v => { rechargeDraft.value = v }, onSubmit: applyRechargeDraft }) }

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
  if (props.owner) activeOwner.value = props.owner
  copyStyles()
  tick(); loadLogs(); loadRemarks(); loadPhotos(); loadDyData(); syncScrape(); syncScrapePhotos()
  timer = setInterval(() => { tick(); loadLogs(); loadRemarks(); loadPhotos(); syncScrape(); syncScrapePhotos(); healPending() }, 2000)
  doc.documentElement.style.overflow = 'hidden'; doc.body.style.overflow = 'hidden'
  hookGen()
  try {
    vvRef = window.parent && window.parent.visualViewport
    if (vvRef) { vvHandler = () => applyVV(); vvRef.addEventListener('resize', vvHandler); vvRef.addEventListener('scroll', vvHandler); applyVV() }
  } catch (e) {}
  // 监听模式切换（抖音 ↔ 抖阴），自动存旧模式、加载新模式独立数据
  watch(dyR18, (newVal, oldVal) => {
    if (newVal === oldVal) return
    // 切模式前先存一下当前模式的数据（用 oldVal 对应的 key）
    const oldKey = (base) => base + (oldVal ? '_r' : '_n')
    try {
      const clean = douyinFeed.value.filter(v => !v.pending).slice(-50)
      localStorage.setItem(oldKey(DY_FEED_KEY), JSON.stringify(clean))
      localStorage.setItem(oldKey(DY_IDX_KEY), String(douyinIdx.value))
      localStorage.setItem(oldKey(DY_FOLLOWS_KEY), JSON.stringify([...dyFollows.value]))
      localStorage.setItem(oldKey(DY_IDXMAP_KEY), JSON.stringify(dyIdxMap.value))
      localStorage.setItem(oldKey(DY_FAN_KEY), JSON.stringify(dyFanClub.value))
      localStorage.setItem(oldKey(DY_DIAMOND_KEY), String(dyDiamond.value))
    } catch (e) {}
    // 关闭直播间，重置 tab
    dyLiveRoom.value = null; showGiftPanel.value = false
    if (dyTab.value === '私密' && !newVal) dyTab.value = '推荐'
    // 加载新模式数据（modeChanged=true → 先清内存再读）
    loadDyData(true)
    showToast(newVal ? '已切换到抖阴模式' : '已切换到抖音模式')
  })
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
.mp-phone > *:not(.mp-power):not(.mp-island):not(.mp-cam):not(.mp-album):not(.mp-wp-panel):not(.mp-dy):not(.mp-share-overlay){position:relative;z-index:2}
.mp-phone > .mp-share-overlay{position:absolute;z-index:59}
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
/* 分享菜单：盖在抖音/相册之上，半透明浅灰底可透出后面的界面 */
.mp-share-overlay{z-index:59;background:rgba(210,210,214,.42);backdrop-filter:blur(2px)}
.mp-ctx-sheet{width:100%;background:#f7f7f7;border-radius:12px 12px 0 0;overflow:hidden;padding-bottom:env(safe-area-inset-bottom,8px)}
.mp-ctx-item{display:block;width:100%;padding:13px 18px;border:none;border-bottom:1px solid rgba(0,0,0,.06);background:#fff;text-align:left;font-size:15px;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-ctx-item:active{background:#e8e8e8}
.mp-ctx-item.danger{color:#fa5151}
.mp-ctx-cancel{display:block;width:100%;margin-top:8px;padding:13px 18px;border:none;background:#fff;text-align:center;font-size:15px;font-weight:600;color:#0d0d0d;cursor:pointer;font-family:inherit}
.mp-ctx-cancel:active{background:#e8e8e8}
.mp-ctx-title{padding:10px 18px 6px;font-size:12px;color:#999;border-bottom:1px solid rgba(0,0,0,.06);background:#f7f7f7}
/* 多选模式 */
.mp-ms-bar{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:10px 14px 16px;background:#f7f7f7;border-top:1px solid rgba(0,0,0,.06);gap:8px}
.mp-ms-cancel{flex-shrink:0;background:none;border:none;font-size:14px;color:#888;cursor:pointer;padding:4px 0;font-family:inherit}
.mp-ms-count{flex:1;text-align:center;font-size:13px;color:#555}
.mp-ms-send{flex-shrink:0;background:#07c160;border:none;border-radius:6px;color:#fff;font-size:14px;font-weight:600;padding:6px 14px;cursor:pointer;font-family:inherit;opacity:1}
.mp-ms-send:disabled{opacity:.4;cursor:default}
.mp-msrow-wrap{display:flex;align-items:center;gap:0}
.mp-msrow-wrap.ms{gap:8px}
.mp-msrow-wrap .mp-row{flex:1;min-width:0;margin-bottom:0}
.mp-msrow-wrap{margin-bottom:14px}
.mp-msrow-wrap.ms{cursor:pointer}
.mp-ms-chk{width:20px;height:20px;border-radius:50%;border:1.5px solid #c6c6c6;background:#fff;flex-shrink:0;cursor:pointer;position:relative;align-self:center}
.mp-ms-chk.on{background:#07c160;border-color:#07c160}
.mp-ms-chk.on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700}
.mp-bub.selected{outline:2px solid #07c160;outline-offset:2px}
/* 评论分享按钮 */
.mp-dy-cmt-share-btn{opacity:.5;font-size:11px}

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
.mp-dy-realname{margin-left:5px;font-size:10px;color:#20d5ec;border:1px solid rgba(32,213,236,.5);border-radius:4px;padding:0 4px;line-height:15px;cursor:pointer;opacity:.9}
.mp-dy-clickable{cursor:pointer}
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
.mp-dy-profile{position:absolute;inset:0;z-index:45;background:#f5f5f7;color:#111;overflow-y:auto;-webkit-overflow-scrolling:touch;animation:mp-fade .18s ease-out}
.mp-dy-profile-page{min-height:100%;background:#f5f5f7}
.mp-dy-profile-nav{position:sticky;top:0;z-index:2;height:48px;display:grid;grid-template-columns:40px 1fr 40px;align-items:center;padding:24px 10px 0;background:rgba(245,245,247,.96);border-bottom:1px solid rgba(0,0,0,.08);font-size:16px;font-weight:650;text-align:center}
.mp-dy-profile-nav .mp-nav-back{color:#111}
.mp-dy-profile-hero{display:flex;flex-direction:column;align-items:center;padding:28px 20px 22px;background:#fff;border-bottom:1px solid rgba(0,0,0,.07)}
.mp-dy-profile-ava{width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#fe2c55,#ff7798);color:#fff;font-size:30px;font-weight:750;box-shadow:0 4px 14px rgba(254,44,85,.22)}
.mp-dy-profile-name{margin-top:12px;font-size:21px;font-weight:750;word-break:break-word;text-align:center}
.mp-dy-profile-id{margin-top:4px;font-size:12px;color:#777}
.mp-dy-profile-tags{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:12px;flex-wrap:wrap}
.mp-dy-profile-tag{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border:1px solid #d6d6dc;border-radius:4px;background:#fff;color:#555;font:inherit;font-size:11px;line-height:1;letter-spacing:0}
.mp-dy-profile-tag.verified{color:#168fa0;border-color:rgba(32,213,236,.45);background:#effcfd}
button.mp-dy-profile-tag.real{color:#fe2c55;border-color:rgba(254,44,85,.4);background:#fff5f7;cursor:pointer}
.mp-dy-profile-real{margin-top:12px;padding:8px 14px;border-left:3px solid #fe2c55;background:#fff5f7;color:#333;font-size:14px;font-weight:650}
.mp-dy-profile-sec{margin-top:10px;padding:14px 18px;background:#fff;border-top:1px solid rgba(0,0,0,.05);border-bottom:1px solid rgba(0,0,0,.05)}
.mp-dy-profile-sec>span{display:block;margin-bottom:6px;color:#999;font-size:11px}
.mp-dy-profile-sec p{margin:0;color:#333;font-size:13px;line-height:1.65;white-space:pre-wrap;word-break:break-word}
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
.mp-dy-style-input{display:block;width:100%;min-height:48px;box-sizing:border-box;padding:6px 8px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#333;font-size:12px;line-height:1.5;resize:none;font-family:inherit;outline:none}
.mp-dy-style-input:focus{border-color:#fe2c55}
.mp-dy-style-input::placeholder{color:#b0b0b0}
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
.mp-dyh-livetag{font-size:10px;padding:1px 6px;border-radius:8px;background:rgba(254,44,85,.15);color:#fe2c55;margin-left:4px}
.mp-dyh-thumb.live{background:linear-gradient(135deg,#fe2c55,#ff6b3b)}
.mp-dyh-txt{font-size:13px;color:#888;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 消息中心 */
.mp-dym{position:absolute;inset:0;z-index:30;background:#fff;display:flex;flex-direction:column}
.mp-dym-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #eee;flex-shrink:0}
.mp-dym-hd .mp-nav-back{background:none;border:none;cursor:pointer;padding:0;width:24px;height:24px}
.mp-dym-hd .mp-nav-back svg{width:22px;height:22px;fill:#161823}
.mp-dym-title{font-size:16px;font-weight:600;color:#161823}
.mp-dym-readall{background:none;border:none;cursor:pointer;color:#fe2c55;font-size:13px;font-weight:500;padding:0;font-family:inherit}
.mp-dym-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mp-dym-body::-webkit-scrollbar{width:0}
.mp-dym-item{display:flex;gap:10px;padding:12px 14px;cursor:pointer;align-items:flex-start;position:relative;border-bottom:1px solid #f5f5f7}
.mp-dym-item:active{background:#f5f5f7}
.mp-dym-item.unread{background:#fffaf8}
.mp-dym-dot{position:absolute;left:6px;top:18px;width:6px;height:6px;border-radius:50%;background:#fe2c55;flex-shrink:0}
.mp-dym-ava{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#fe2c55,#ff6b3b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0}
.mp-dym-info{flex:1;min-width:0}
.mp-dym-user{font-size:13px;font-weight:600;color:#161823;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.mp-dym-verb{font-weight:400;color:#888}
.mp-dym-time{margin-left:auto;font-size:11px;color:#bbb;font-weight:400}
.mp-dym-reply{font-size:13px;color:#333;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-dym-ctx{font-size:11px;color:#bbb;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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
/* 直播间顶栏：两行布局（第一行主播名/关注/人数/关闭，第二行点赞） */
.mp-dylv-top{display:flex;flex-direction:column;gap:4px;padding:8px 12px 6px;flex-shrink:0;z-index:2}
.mp-dylv-top-row{display:flex;align-items:center;gap:8px}
.mp-dylv-likes{font-size:11px;color:rgba(255,255,255,.55);padding-left:2px}
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
/* 直播内容区：固定高度+可滚动，长文不遮聊天 */
.mp-dylv-screen{flex-shrink:0;height:42%;overflow-y:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(160deg,#1a1320,#0e0b14)}
.mp-dylv-screen-txt{min-height:100%;display:flex;align-items:center;justify-content:center;padding:18px;font-size:15px;line-height:1.7;color:rgba(255,255,255,.9);text-align:center;text-shadow:0 2px 6px rgba(0,0,0,.6)}
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
.mp-dylv-emoji,.mp-dylv-heart,.mp-dylv-gift,.mp-dylv-share{background:none;border:none;cursor:pointer;font-size:20px;padding:2px;flex-shrink:0;opacity:.9;color:#fff}
.mp-dylv-emoji:active,.mp-dylv-heart:active,.mp-dylv-gift:active,.mp-dylv-share:active{opacity:1}
/* 名字行 + 粉丝团等级标志 */
.mp-dylv-name-row{display:flex;align-items:center;gap:4px;min-width:0}
.mp-dylv-fan{font-size:10px;font-weight:800;color:#fff;min-width:18px;height:16px;padding:0 4px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-shadow:0 1px 1px rgba(0,0,0,.3)}
.mp-dylv-msg-gift .mp-dylv-txt{color:#ffd24d;font-weight:600}
/* 礼物面板 */
.mp-dylv-gp-mask{position:absolute;inset:0;z-index:6;background:rgba(0,0,0,.4);display:flex;align-items:flex-end}
.mp-dylv-gp{width:100%;background:#1c1c22;border-radius:16px 16px 0 0;padding:14px 14px 30px;max-height:65%;overflow-y:auto}
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
/* 评论回复楼中楼：竖线对齐评论首字（margin-left:0 = mp-dy-cmt-main 左边缘即评论文字起始处） */
.mp-dy-cmt-reply-item{margin-left:0;padding:4px 0 4px 8px;border-left:2px solid #e8e8ec;display:block;font-size:12px;line-height:1.5}
.mp-dy-cmt-reply-item+.mp-dy-cmt-reply-item{margin-top:2px}
.mp-dy-cmt-reply-ava{display:none}
.mp-dy-cmt-reply-body{display:inline}
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
/* ST环境强制IME输入框白底黑字（ST会全局染黑.mp-overlay里的input） */
.mp-overlay .mp-ime-in{background:#fff!important;color:#111!important;border:1.5px solid #e0e0e7!important;-webkit-text-fill-color:#111!important}
.mp-overlay .mp-ime-ta{background:#fff!important;color:#111!important;border:1.5px solid #e0e0e7!important;-webkit-text-fill-color:#111!important}
/* 礼物数量选择 */
.mp-dylv-gp-qty{display:flex;align-items:center;gap:6px;padding:10px 0 4px;flex-wrap:wrap}
.mp-dylv-gp-qty-lbl{font-size:11px;color:rgba(255,255,255,.5);flex-shrink:0}
.mp-dylv-gp-qty-btn{padding:4px 10px;border:1.5px solid rgba(255,255,255,.2);border-radius:14px;background:transparent;color:rgba(255,255,255,.7);font-size:12px;cursor:pointer;font-family:inherit}
.mp-dylv-gp-qty-btn.on{border-color:#fe2c55;color:#fe2c55;background:rgba(254,44,85,.12)}
/* 主播继续 ▶ 按钮 */
.mp-dylv-more{background:none;border:none;cursor:pointer;font-size:18px;padding:2px;flex-shrink:0;opacity:.75}
.mp-dylv-more:active{opacity:1}
.mp-dylv-more:disabled{opacity:.35;cursor:default}
/* 手机IME浮层：插在 mp-phone 外（不受缩放影响），全屏蒙层+底部面板 */
.mp-ime{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent}
.mp-ime-panel{background:#f2f2f7;border-radius:18px 18px 0 0;padding:12px 14px 24px;display:flex;flex-direction:column;gap:8px;max-height:65vh;overflow-y:auto}
.mp-ime-hint-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.mp-ime-ph{font-size:12px;color:#8e8e93;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-ime-cancel{background:none;border:none;color:#007aff;font-size:15px;cursor:pointer;padding:0 0 0 12px;flex-shrink:0;font-family:inherit}
/* 输入框：font-size≥16px防iOS自动缩放 */
.mp-ime-in{width:100%;border:1.5px solid #e0e0e7;border-radius:12px;padding:10px 14px;font-size:16px;line-height:1.5;background:#fff;outline:none;color:#111;font-family:inherit;box-sizing:border-box;caret-color:#007aff}
.mp-ime-in:focus{border-color:#007aff}
.mp-ime-ta{width:100%;border:1.5px solid #e0e0e7;border-radius:12px;padding:10px 14px;font-size:16px;line-height:1.6;min-height:80px;background:#fff;outline:none;resize:none;color:#111;font-family:inherit;box-sizing:border-box;caret-color:#007aff}
.mp-ime-ta:focus{border-color:#007aff}
/* 表情栏：横向滚动 */
.mp-ime-emojis{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:2px 0}
.mp-ime-emojis::-webkit-scrollbar{display:none}
.mp-ime-ej{font-size:24px;padding:4px;cursor:pointer;flex-shrink:0;user-select:none;-webkit-user-select:none;border-radius:8px;transition:background .1s}
.mp-ime-ej:active{background:rgba(0,0,0,.1)}
/* 底部发送按钮 */
.mp-ime-foot{display:flex;justify-content:flex-end}
.mp-ime-send{padding:10px 28px;border:none;border-radius:22px;background:#007aff;color:#fff;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;min-width:80px}
.mp-ime-send:disabled{background:#b0c8f0;cursor:default}
.mp-ime-send:active:not(:disabled){background:#0066d6}
</style>
