<template>
  <div class="bestiary-panel" @click.self="$emit('close')">
    <div :class="['bestiary-frame', { 'item-mode': mode === 'item' }]">
      <span class="bs-corner tl"></span><span class="bs-corner br"></span>
      <button class="bs-close" @click="$emit('close')">
        <svg viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M140.5 140.5c12.5-12.5 32.8-12.5 45.3 0L320 274.7l134.2-134.2c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L365.3 320l134.2 134.2c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L320 365.3 185.8 499.5c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L274.7 320 140.5 185.8c-12.5-12.5-12.5-32.8 0-45.3z"/></svg>
      </button>
      <div class="bs-panel-title">万象图鉴</div>

      <div class="bs-mode-tabs">
        <button :class="['bs-mode', { active: mode === 'bio' }]" @click="switchMode('bio')">生物</button>
        <button :class="['bs-mode', { active: mode === 'item' }]" @click="switchMode('item')">物品</button>
      </div>

      <div class="bs-tabs" v-if="tiers.length">
        <button v-for="t in tiers" :key="t.key"
                :class="['bs-tab', 'c-' + t.key, { active: activeTab === t.key }]"
                @click="activeTab = t.key; expandedName = ''">
          {{ t.label }}
        </button>
      </div>
      <div class="bs-empty" v-else>暂无图鉴记录</div>

      <div class="bs-list" v-if="activeTab && grouped[activeTab]">
        <div v-for="c in grouped[activeTab]" :key="c.n"
             :class="['bs-entry', 'c-' + c.t, { expanded: expandedName === c.n }]"
             @click="toggleExpand(c.n)">
          <div class="bs-ehd">
            <span :class="['bs-enm', 'tier-' + c.t]">{{ c.dispName }}</span>
            <span :class="['bs-etier', 'tier-' + c.t]">{{ c.t }}</span>
          </div>
          <div class="bs-ebd" v-show="expandedName === c.n">
            <template v-if="mode === 'bio'">
              <div class="bs-erow"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M320 312c66.3 0 120-53.7 120-120S386.3 72 320 72s-120 53.7-120 120s53.7 120 120 120m-29.7 56C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3z"/></svg><span class="bs-elbl">代表</span>{{ c.n }}</div>
              <div class="bs-erow" v-if="c.b && c.b !== c.r"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M112 320c0-114.9 93.1-208 208-208c63.1 0 119.6 28.1 157.8 72.5c8.6 10.1 23.8 11.2 33.8 2.6s11.2-23.8 2.6-33.8C467.3 98.6 397.7 64 320 64C178.6 64 64 178.6 64 320v40c0 13.3 10.7 24 24 24s24-10.7 24-24z"/></svg><span class="bs-elbl">血脉</span>{{ c.b }}</div>
              <div class="bs-erow" v-if="c.ra && c.ra !== '无'"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M184 120c0-30.9 25.1-56 56-56h24c17.7 0 32 14.3 32 32v448c0 17.7-14.3 32-32 32h-32c-29.8 0-54.9-20.4-62-48h-2c-44.2 0-80-35.8-80-80c0-18 6-34.6 16-48c-19.4-14.6-32-37.8-32-64c0-30.9 17.6-57.8 43.2-71.1c-7.1-12-11.2-26-11.2-40.9c0-44.2 35.8-80 80-80z"/></svg><span class="bs-elbl">种族能力</span>{{ c.ra }}</div>
              <div class="bs-erow" v-if="c.ba && c.ba !== '无'"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M434.8 54.1c11.9 8.6 16.3 24.2 10.9 37.8L367.3 288H512c13.5 0 25.5 8.4 30.1 21.1s.7 26.9-9.6 35.5l-288 240c-11.3 9.4-27.4 9.9-39.3 1.3s-16.3-24.2-10.9-37.8L272.7 352H128c-13.5 0-25.5-8.4-30.1-21.1s-.7-26.9 9.6-35.5l288-240c11.3-9.4 27.4-9.9 39.3-1.3"/></svg><span class="bs-elbl">血脉能力</span>{{ c.ba }}</div>
              <div class="bs-erow"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M472 216c57.4 0 104 46.6 104 104c0 141.4-114.6 256-256 256c-54.3 0-104.8-17-146.3-45.9c-14.5-10.1-18-30.1-7.9-44.6s30.1-18 44.6-7.9c31.1 21.7 68.9 34.4 109.7 34.4c67.9 0 127.5-35.3 161.7-88.5c-3.2.3-6.4.5-9.7.5c-57.4 0-104-46.6-104-104s46.6-104 104-104zM320 64c54.3 0 104.8 17 146.3 45.9c14.5 10.1 18 30.1 7.9 44.6s-30.1 18-44.6 7.9c-31.1-21.7-68.9-34.4-109.7-34.4c-67.9 0-127.5 35.2-161.7 88.4c3.2-.3 6.4-.4 9.7-.4c57.4 0 104 46.6 104 104S225.4 424 168 424S64 377.4 64 320c0-1.9 0-3.8.1-5.6C67.1 175.6 180.5 64 320 64M168 280c-22.1 0-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40s-17.9-40-40-40m304 0c-22.1 0-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40s-17.9-40-40-40"/></svg><span class="bs-elbl">描述</span>{{ c.d }}</div>
            </template>
            <template v-else>
              <div class="bs-erow"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M479.9 375.9L452.1 424h55.7L480 375.9zM447.6 320l-60.2-104H252.6l-60.2 104l60.2 104h134.8zm64.7 0l58.4 100.9c3.5 6 5.3 12.8 5.3 19.7c0 21.7-17.6 39.4-39.4 39.4h-117l-61.3 105.8c-7.8 13.8-22.5 22.2-38.3 22.2s-30.5-8.4-38.4-22.2L220.3 480h-117c-21.7 0-39.4-17.6-39.4-39.4c0-6.9 1.8-13.7 5.3-19.7L127.7 320L69.3 219.1c-3.5-6-5.3-12.8-5.3-19.7c0-21.8 17.6-39.4 39.4-39.4h117l61.3-105.8C289.5 40.4 304.2 32 320 32s30.5 8.4 38.4 22.2L419.7 160h117c21.7 0 39.4 17.6 39.4 39.4c0 6.9-1.8 13.7-5.3 19.7z"/></svg><span class="bs-elbl">描述</span>{{ c.d }}</div>
              <div class="bs-erow" v-if="c.ba && c.ba !== '无'"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M288 224c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32m32 352c141.4 0 256-114.6 256-256S461.4 64 320 64S64 178.6 64 320s114.6 256 256 256m0-448c53 0 96 43 96 96s-43 96-96 96s-96 43-96 96s43 96 96 96c-106 0-192-86-192-192s86-192 192-192m-32 288c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32"/></svg><span class="bs-elbl">能力</span>{{ c.ba }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

defineEmits(['close'])

const BIO_KEY = 'jdnl_bestiary'
const ITEM_KEY = 'jdnl_items'
const CHAT_ID_KEY = 'jdnl_bestiary_chat_id'

const ALL_TIERS = [
  { key: '残破', label: '残破' },
  { key: '普通', label: '普通' },
  { key: '精良', label: '精良' },
  { key: '优秀', label: '优秀' },
  { key: '稀有', label: '稀有' },
  { key: '史诗', label: '史诗' },
  { key: '传说', label: '传说' },
  { key: '神话', label: '神话' },
  { key: '不朽', label: '不朽' },
  { key: '唯一', label: '唯一' },
]

const mode = ref('bio')
const grouped = ref({})
const activeTab = ref('')
const expandedName = ref('')

const tiers = computed(() => ALL_TIERS.filter(t => grouped.value[t.key] && grouped.value[t.key].length))

const doc = window.parent ? window.parent.document : document

function getCurrentChatId() {
  try {
    const p = window.parent
    if (p && p.SillyTavern && p.SillyTavern.getContext) {
      const ctx = p.SillyTavern.getContext()
      return ctx.chatId || ctx.chatMetadata?.id || ''
    }
  } catch(e) {}
  return ''
}

function checkChatChange() {
  const cur = getCurrentChatId()
  if (!cur) return false
  const stored = localStorage.getItem(CHAT_ID_KEY)
  if (stored && stored !== cur) {
    localStorage.removeItem(BIO_KEY)
    localStorage.removeItem(ITEM_KEY)
    grouped.value = {}
    expandedName.value = ''
    activeTab.value = ''
    localStorage.setItem(CHAT_ID_KEY, cur)
    return true
  }
  if (!stored) localStorage.setItem(CHAT_ID_KEY, cur)
  return false
}

function syncDOM() {
  const key = mode.value === 'bio' ? BIO_KEY : ITEM_KEY
  const dataClass = mode.value === 'bio' ? 'bio-data' : 'it-data'
  const spans = doc.querySelectorAll('[class*="' + dataClass + '"]')
  if (!spans.length) return
  let changed = false
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]')
    spans.forEach(span => {
      const raw = (span.textContent || '').trim()
      if (!raw) return
      const parts = raw.split('|||')
      let d
      if (mode.value === 'bio') {
        if (parts.length < 8) return
        d = { n: parts[0], r: parts[1], b: parts[2], t: parts[3], ra: parts[4], ba: parts[5], d: parts[6], l: parts[7], dispName: parts[1] + (parts[2] && parts[2] !== parts[1] ? '·' + parts[2] : '') }
      } else {
        if (parts.length < 4) return
        d = { n: parts[0], t: parts[1], ba: parts[2], d: parts[3], dispName: parts[0] }
      }
      const idx = list.findIndex(e => e.n === d.n)
      if (idx >= 0) {
        if (JSON.stringify(list[idx]) !== JSON.stringify(d)) {
          list[idx] = d
          changed = true
        }
      } else {
        list.push(d)
        changed = true
      }
    })
    if (changed) localStorage.setItem(key, JSON.stringify(list))
  } catch(e) {}
}

function load() {
  syncDOM()
  try {
    const key = mode.value === 'bio' ? BIO_KEY : ITEM_KEY
    const raw = localStorage.getItem(key)
    const list = JSON.parse(raw || '[]')
    const g = {}
    for (const c of list) {
      const tk = c.t || '唯一'
      if (!g[tk]) g[tk] = []
      g[tk].push(c)
    }
    grouped.value = g
    if (!activeTab.value || !g[activeTab.value]) {
      const keys = ALL_TIERS.filter(t => g[t.key])
      activeTab.value = keys.length ? keys[0].key : ''
    }
  } catch (e) {
    grouped.value = {}
  }
}

function switchMode(m) {
  mode.value = m
  expandedName.value = ''
  activeTab.value = ''
  load()
}

function toggleExpand(name) {
  expandedName.value = expandedName.value === name ? '' : name
}

let timer = null
onMounted(() => {
  checkChatChange()
  load()
  timer = setInterval(() => { checkChatChange(); syncDOM(); load() }, 2000)
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
.tier-残破{background:linear-gradient(90deg,#444,#666,#555,#777,#666,#555,#444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-普通{background:linear-gradient(90deg,#b0b0b0,#d0d0d0,#c8c8c8,#e0e0e0,#d0d0d0,#c8c8c8,#b0b0b0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-精良{background:linear-gradient(90deg,#2e7d32,#4caf50,#43a047,#66bb6a,#4caf50,#43a047,#2e7d32);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-优秀{background:linear-gradient(90deg,#0d47a1,#1976d2,#1565c0,#42a5f5,#1e88e5,#1565c0,#0d47a1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-稀有{background:linear-gradient(90deg,#4a148c,#7b1fa2,#6a1b9a,#ab47bc,#8e24aa,#6a1b9a,#4a148c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-史诗{background:linear-gradient(90deg,#f06292,#f48fb1,#fce4ec,#f8bbd0,#f48fb1,#ec407a,#f06292);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-传说{background:linear-gradient(90deg,#fbc02d,#ffee58,#fff9c4,#fff176,#ffee58,#fdd835,#fbc02d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-神话{background:linear-gradient(90deg,#e65100,#ff9800,#ffe0b2,#ffcc80,#ff9800,#f57c00,#e65100);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-不朽{background:linear-gradient(90deg,#7f0000,#c62828,#b71c1c,#f44336,#e53935,#b71c1c,#7f0000);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-唯一{background:linear-gradient(90deg,#7c4dff,#448aff,#00b0ff,#00e5ff,#76ff03,#ffea00,#ff6d00,#f06292,#ff6d00,#ffea00,#76ff03,#00e5ff,#00b0ff,#448aff,#7c4dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

.c-残破{--tc:#888;--ti:linear-gradient(90deg,#444,#666,#555,#777,#666,#555,#444)}
.c-普通{--tc:#c0c0c0;--ti:linear-gradient(90deg,#b0b0b0,#d0d0d0,#c8c8c8,#e0e0e0,#d0d0d0,#c8c8c8,#b0b0b0)}
.c-精良{--tc:#4caf50;--ti:linear-gradient(90deg,#2e7d32,#4caf50,#43a047,#66bb6a,#4caf50,#43a047,#2e7d32)}
.c-优秀{--tc:#2196f3;--ti:linear-gradient(90deg,#0d47a1,#1976d2,#1565c0,#42a5f5,#1e88e5,#1565c0,#0d47a1)}
.c-稀有{--tc:#9c27b0;--ti:linear-gradient(90deg,#4a148c,#7b1fa2,#6a1b9a,#ab47bc,#8e24aa,#6a1b9a,#4a148c)}
.c-史诗{--tc:#f06292;--ti:linear-gradient(90deg,#f06292,#f48fb1,#fce4ec,#f8bbd0,#f48fb1,#ec407a,#f06292)}
.c-传说{--tc:#fbc02d;--ti:linear-gradient(90deg,#fbc02d,#ffee58,#fff9c4,#fff176,#ffee58,#fdd835,#fbc02d)}
.c-神话{--tc:#ff6d00;--ti:linear-gradient(90deg,#e65100,#ff9800,#ffe0b2,#ffcc80,#ff9800,#f57c00,#e65100)}
.c-不朽{--tc:#e53935;--ti:linear-gradient(90deg,#7f0000,#c62828,#b71c1c,#f44336,#e53935,#b71c1c,#7f0000)}
.c-唯一{--tc:#81d8d0;--ti:linear-gradient(90deg,#00695c,#26a69a,#80cbc4,#b2dfdb,#80cbc4,#26a69a,#00695c)}

@keyframes bs-shimmer{0%{background-position:0% center}100%{background-position:200% center}}

.bestiary-panel{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);animation:bs-fade .25s ease-out;pointer-events:all}
@keyframes bs-fade{0%{opacity:0}100%{opacity:1}}

.bestiary-frame{position:relative;width:90vw;max-width:540px;max-height:85vh;background:linear-gradient(175deg,#131110 0%,#191613 50%,#141110 100%);border:1px solid rgba(180,150,110,.2);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 50px rgba(0,0,0,.55),0 0 0 1px rgba(196,168,122,.05),inset 0 1px 0 rgba(255,255,255,.04)}
.bestiary-frame::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2712%27%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%274%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%278%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%2712%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3C%2Fsvg%3E");background-size:24px 12px;opacity:.6;z-index:0}
.bestiary-frame.item-mode::before{background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2712%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%3E%3Cpath%20d%3D%27M8%2012%20A%204%204%200%200%201%2016%2012%20A%202%202%200%200%201%2012%2012%20A%202%202%200%200%201%208%2012%27%2F%3E%3Cpath%20d%3D%27M4%2012%20A%208%208%200%200%201%2020%2012%20A%204%204%200%200%201%2012%2012%20A%204%204%200%200%201%204%2012%27%2F%3E%3Cpath%20d%3D%27M0%2012%20A%2012%2012%200%200%201%2024%2012%20A%206%206%200%200%201%2012%2012%20A%206%206%200%200%201%200%2012%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");background-size:24px 12px}
.bs-corner{position:absolute;width:26px;height:26px;pointer-events:none;z-index:2;opacity:.6}
.bs-corner.tl{top:10px;left:10px;border-top:1px solid #c4a87a;border-left:1px solid #c4a87a;border-radius:8px 0 0 0}
.bs-corner.br{bottom:10px;right:10px;border-bottom:1px solid #c4a87a;border-right:1px solid #c4a87a;border-radius:0 0 8px 0}

.bs-close{position:absolute;top:12px;right:12px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(180,150,110,.15);border-radius:6px;color:rgba(200,180,150,.55);cursor:pointer;z-index:3;font-size:12px;transition:all .25s}.bs-close:hover{color:rgba(200,180,150,.9);background:rgba(255,255,255,.08);border-color:rgba(180,150,110,.3)}

.bs-panel-title{text-align:center;padding:24px 16px 10px;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:1.5em;letter-spacing:.2em;color:#c4a87a;position:relative;z-index:1;text-shadow:0 0 12px rgba(196,168,122,.18)}
.bs-panel-title::before,.bs-panel-title::after{content:'◆';color:rgba(196,168,122,.5);font-size:.55em;margin:0 14px;vertical-align:.25em}
.bs-panel-title::after{content:'';display:block;position:relative;width:60%;height:1px;margin:8px auto 0;background:linear-gradient(90deg,transparent,rgba(196,168,122,.4),transparent)}

.bs-mode-tabs{display:flex;gap:8px;padding:10px 14px 0;position:relative;z-index:1}
.bs-mode{flex:1;padding:7px 12px;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:.78em;letter-spacing:.1em;color:rgba(180,160,130,.5);background:rgba(255,255,255,.02);border:1px solid rgba(180,150,110,.12);border-radius:6px;cursor:pointer;transition:all .25s}
.bs-mode:hover{color:rgba(196,168,122,.85);background:rgba(180,150,110,.06)}
.bs-mode.active{color:#c4a87a;background:linear-gradient(180deg,rgba(196,168,122,.12) 0%,rgba(196,168,122,.04) 100%);border-color:rgba(196,168,122,.3);text-shadow:0 0 8px rgba(196,168,122,.25)}

.bs-tabs{display:flex;gap:3px;padding:12px 14px 0;overflow-x:auto;flex-shrink:0;scrollbar-width:none;border-bottom:1px solid rgba(180,150,110,.1);position:relative;z-index:1}.bs-tabs::-webkit-scrollbar{display:none}
.bs-tab{flex-shrink:0;padding:6px 13px;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:.7em;letter-spacing:.08em;color:rgba(180,160,130,.45);background:rgba(255,255,255,.015);border:1px solid rgba(180,150,110,.08);border-bottom:2px solid transparent;border-radius:6px 6px 0 0;cursor:pointer;transition:all .25s;white-space:nowrap;position:relative;margin-bottom:-1px}
.bs-tab:hover{color:var(--tc);background:rgba(180,150,110,.06);border-color:rgba(180,150,110,.18)}
.bs-tab.active{color:var(--tc);background:linear-gradient(180deg,rgba(180,150,110,.1) 0%,rgba(180,150,110,.03) 100%);border-color:rgba(180,150,110,.25);border-bottom-color:var(--tc);text-shadow:0 0 8px rgba(196,168,122,.25);box-shadow:0 -2px 8px rgba(0,0,0,.15)}

.bs-empty{text-align:center;padding:50px 16px;color:rgba(180,160,130,.32);font-size:.85em;letter-spacing:.06em;position:relative;z-index:1}

.bs-list{flex:1;overflow-y:auto;padding:8px 14px 16px;scrollbar-width:thin;scrollbar-color:rgba(180,150,110,.12) transparent;position:relative;z-index:1}
.bs-list::-webkit-scrollbar{width:4px}.bs-list::-webkit-scrollbar-track{background:transparent}.bs-list::-webkit-scrollbar-thumb{background:rgba(180,150,110,.15);border-radius:2px}

.bs-entry{margin:8px 0;border-radius:0 8px 8px 0;background:linear-gradient(90deg,rgba(255,255,255,.035) 0%,rgba(255,255,255,.015) 100%);border-left:3px solid var(--tc,#c4a87a);position:relative;transition:background .3s,transform .3s,box-shadow .3s,border-left-width .3s;cursor:pointer;overflow:hidden}
.bs-entry::before{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2712%27%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%274%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%278%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3Ccircle%20cx%3D%2712%27%20cy%3D%272%27%20r%3D%2712%27%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%2F%3E%3C%2Fsvg%3E");background-size:24px 12px;opacity:.5;pointer-events:none;transition:opacity .3s}
.bestiary-frame.item-mode .bs-entry::before{background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2712%27%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27rgba(196%2C168%2C122%2C.06)%27%20stroke-width%3D%27.6%27%3E%3Cpath%20d%3D%27M8%2012%20A%204%204%200%200%201%2016%2012%20A%202%202%200%200%201%2012%2012%20A%202%202%200%200%201%208%2012%27%2F%3E%3Cpath%20d%3D%27M4%2012%20A%208%208%200%200%201%2020%2012%20A%204%204%200%200%201%2012%2012%20A%204%204%200%200%201%204%2012%27%2F%3E%3Cpath%20d%3D%27M0%2012%20A%2012%2012%200%200%201%2024%2012%20A%206%206%200%200%201%2012%2012%20A%206%206%200%200%201%200%2012%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");background-size:24px 12px}
.bs-entry:hover{background:linear-gradient(90deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 100%);transform:translateX(2px);box-shadow:0 2px 12px rgba(0,0,0,.2)}
.bs-entry:hover::before{opacity:.8}
.bs-entry.expanded{background:linear-gradient(90deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,.03) 100%);box-shadow:0 4px 18px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);border-left-width:4px}
.bs-entry.expanded::before{opacity:1}
.bs-entry .bs-ehd{display:flex;align-items:center;gap:8px;padding:11px 14px;position:relative;z-index:1}
.bs-entry .bs-enm{font-family:'寒蝉全圆体','DouyinSans',serif;font-weight:700;font-size:1.05em;letter-spacing:.03em;background-size:200% auto!important;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:bs-shimmer 4s linear infinite}
.bs-entry .bs-etier{font-size:.62em;padding:2px 8px;border:1px solid var(--tc);border-radius:4px;margin-left:auto;letter-spacing:.08em;font-weight:600;color:var(--tc);-webkit-text-fill-color:var(--tc)}
.bs-entry .bs-ebd{padding:2px 14px 12px;font-size:.8em;line-height:1.7;color:#c0b090;animation:bs-expand .3s ease-out;position:relative;z-index:1;border-top:1px solid rgba(180,150,110,.08);margin-top:2px}
@keyframes bs-expand{0%{opacity:0;transform:translateY(-6px);max-height:0}100%{opacity:1;transform:translateY(0);max-height:500px}}
.bs-entry .bs-erow{display:flex;gap:6px;margin-bottom:4px;align-items:baseline;animation:bs-row-in .35s ease-out backwards}
.bs-entry .bs-erow:nth-child(1){animation-delay:.02s}
.bs-entry .bs-erow:nth-child(2){animation-delay:.06s}
.bs-entry .bs-erow:nth-child(3){animation-delay:.1s}
.bs-entry .bs-erow:nth-child(4){animation-delay:.14s}
.bs-entry .bs-erow:nth-child(5){animation-delay:.18s}
@keyframes bs-row-in{0%{opacity:0;transform:translateX(-6px)}100%{opacity:1;transform:translateX(0)}}
.bs-entry .bs-erow:last-child{margin-bottom:0}
.bs-entry .bs-elbl{color:var(--tc);font-size:.76em;white-space:nowrap;min-width:4.5em;display:inline-block;text-align:right;opacity:.55;letter-spacing:.05em;margin-right:4px;flex-shrink:0}
.bs-entry .bs-eico{display:inline-block;width:1em;height:1em;vertical-align:middle;color:var(--tc);margin-right:3px;opacity:.65;flex-shrink:0}
</style>
