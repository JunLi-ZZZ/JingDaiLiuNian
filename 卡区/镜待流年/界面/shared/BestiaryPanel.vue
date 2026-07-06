<template>
  <div class="bestiary-panel" @click.self="$emit('close')">
    <div class="bestiary-frame">
      <button class="bs-close" @click="$emit('close')">
        <svg viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M140.5 140.5c12.5-12.5 32.8-12.5 45.3 0L320 274.7l134.2-134.2c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L365.3 320l134.2 134.2c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L320 365.3 185.8 499.5c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L274.7 320 140.5 185.8c-12.5-12.5-12.5-32.8 0-45.3z"/></svg>
      </button>
      <div class="bs-panel-title">万象图鉴</div>

      <div class="bs-tabs" v-if="tiers.length">
        <button v-for="t in tiers" :key="t.key" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">
          {{ t.label }}
        </button>
      </div>
      <div class="bs-empty" v-else>暂无图鉴记录</div>

      <div class="bs-list" v-if="activeTab && grouped[activeTab]">
        <div v-for="(c, i) in grouped[activeTab]" :key="i" class="bs-entry c-{{c.t}}">
          <div class="bs-ehd">
            <span class="bs-enm">{{ c.r }}{{ c.b && c.b !== c.r ? '·' + c.b : '' }}</span>
            <span class="bs-etier tier-{{c.t}}">{{ c.t }}</span>
          </div>
          <div class="bs-ebd">
            <div class="bs-erow"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M320 312c66.3 0 120-53.7 120-120S386.3 72 320 72s-120 53.7-120 120s53.7 120 120 120m-29.7 56C191.8 368 112 447.8 112 546.3c0 16.4 13.3 29.7 29.7 29.7h356.6c16.4 0 29.7-13.3 29.7-29.7c0-98.5-79.8-178.3-178.3-178.3z"/></svg><span class="bs-elbl">代表</span>{{ c.n }}</div>
            <div class="bs-erow" v-if="c.b && c.b !== c.r"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M112 320c0-114.9 93.1-208 208-208c63.1 0 119.6 28.1 157.8 72.5c8.6 10.1 23.8 11.2 33.8 2.6s11.2-23.8 2.6-33.8C467.3 98.6 397.7 64 320 64C178.6 64 64 178.6 64 320v40c0 13.3 10.7 24 24 24s24-10.7 24-24z"/></svg><span class="bs-elbl">血脉</span>{{ c.b }}</div>
            <div class="bs-erow" v-if="c.ra && c.ra !== '无'"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M184 120c0-30.9 25.1-56 56-56h24c17.7 0 32 14.3 32 32v448c0 17.7-14.3 32-32 32h-32c-29.8 0-54.9-20.4-62-48h-2c-44.2 0-80-35.8-80-80c0-18 6-34.6 16-48c-19.4-14.6-32-37.8-32-64c0-30.9 17.6-57.8 43.2-71.1c-7.1-12-11.2-26-11.2-40.9c0-44.2 35.8-80 80-80z"/></svg><span class="bs-elbl">种族能力</span>{{ c.ra }}</div>
            <div class="bs-erow" v-if="c.ba && c.ba !== '无'"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M434.8 54.1c11.9 8.6 16.3 24.2 10.9 37.8L367.3 288H512c13.5 0 25.5 8.4 30.1 21.1s.7 26.9-9.6 35.5l-288 240c-11.3 9.4-27.4 9.9-39.3 1.3s-16.3-24.2-10.9-37.8L272.7 352H128c-13.5 0-25.5-8.4-30.1-21.1s-.7-26.9 9.6-35.5l288-240c11.3-9.4 27.4-9.9 39.3-1.3"/></svg><span class="bs-elbl">血脉能力</span>{{ c.ba }}</div>
            <div class="bs-erow"><svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M472 216c57.4 0 104 46.6 104 104c0 141.4-114.6 256-256 256c-54.3 0-104.8-17-146.3-45.9c-14.5-10.1-18-30.1-7.9-44.6s30.1-18 44.6-7.9c31.1 21.7 68.9 34.4 109.7 34.4c67.9 0 127.5-35.3 161.7-88.5c-3.2.3-6.4.5-9.7.5c-57.4 0-104-46.6-104-104s46.6-104 104-104zM320 64c54.3 0 104.8 17 146.3 45.9c14.5 10.1 18 30.1 7.9 44.6s-30.1 18-44.6 7.9c-31.1-21.7-68.9-34.4-109.7-34.4c-67.9 0-127.5 35.2-161.7 88.4c3.2-.3 6.4-.4 9.7-.4c57.4 0 104 46.6 104 104S225.4 424 168 424S64 377.4 64 320c0-1.9 0-3.8.1-5.6C67.1 175.6 180.5 64 320 64M168 280c-22.1 0-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40s-17.9-40-40-40m304 0c-22.1 0-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40s-17.9-40-40-40"/></svg><span class="bs-elbl">描述</span>{{ c.d }}</div>
          </div>
          <div class="bs-eft" v-if="c.l && c.l !== '无'">
            <svg class="bs-eico" viewBox="0 0 640 640"><path d="M0 0h640v640H0z" fill="none"/><path fill="currentColor" d="M192 160v-16c0-44.2 86-80 192-80s192 35.8 192 80v16c0 30.6-41.3 57.2-102 70.7c-2.4-2.8-4.9-5.5-7.4-8c-15.5-15.3-35.5-26.9-56.4-35.5c-41.9-17.5-96.5-27.1-154.2-27.1c-21.9 0-43.3 1.4-63.8 4.1c-.2-1.3-.2-2.7-.2-4.1zm304 257v-46.2c15.1-3.9 29.3-8.5 42.2-13.9c13.2-5.5 26.1-12.2 37.8-20.3V352c0 26.8-31.5 50.5-80 65m0-96v-33c0-4.5-.4-8.8-1-13c15.5-3.9 30-8.6 43.2-14.2s26.1-12.2 37.8-20.3v15.4c0 26.8-31.5 50.5-80 65zM64 304v-16c0-44.2 86-80 192-80s192 35.8 192 80v16c0 44.2-86 80-192 80S64 348.2 64 304m384 96c0 44.2-86 80-192 80S64 444.2 64 400v-15.4c11.6 8.1 24.5 14.7 37.8 20.3C143.7 422.4 198.3 432 256 432s112.3-9.7 154.2-27.1c13.2-5.5 26.1-12.2 37.8-20.3zm0 80.6V496c0 44.2-86 80-192 80S64 540.2 64 496v-15.4c11.6 8.1 24.5 14.7 37.8 20.3C143.7 518.4 198.3 528 256 528s112.3-9.7 154.2-27.1c13.2-5.5 26.1-12.2 37.8-20.3"/></svg>{{ c.l }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

defineEmits(['close'])

const STORAGE_KEY = 'jdnl_bestiary'

const ALL_TIERS = [
  { key: '废种', label: '废种' },
  { key: '凡种', label: '凡种' },
  { key: '良种', label: '良种' },
  { key: '精种', label: '精种' },
  { key: '珍种', label: '珍种' },
  { key: '异种', label: '异种' },
  { key: '仙种', label: '仙种' },
  { key: '圣种', label: '圣种' },
  { key: '神种', label: '神种' },
  { key: '特殊', label: '特殊' },
]

const grouped = ref({})
const activeTab = ref('')

const tiers = computed(() => {
  return ALL_TIERS.filter(t => grouped.value[t.key] && grouped.value[t.key].length)
})

const doc = window.parent ? window.parent.document : document

function syncDOM() {
  const spans = doc.querySelectorAll('[class*="bs-data"]')
  if (!spans.length) return
  let changed = false
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    spans.forEach(span => {
      const raw = (span.textContent || '').trim()
      if (!raw) return
      const parts = raw.split('|||')
      if (parts.length < 8) return
      const d = { n: parts[0], r: parts[1], b: parts[2], t: parts[3], ra: parts[4], ba: parts[5], d: parts[6], l: parts[7] }
      const dup = list.some(e => e.r === d.r && e.b === d.b)
      if (!dup) { list.push(d); changed = true }
    })
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch(e) {}
}

function load() {
  syncDOM()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = JSON.parse(raw || '[]')
    const g = {}
    for (const c of list) {
      const key = c.t || '特殊'
      if (!g[key]) g[key] = []
      g[key].push(c)
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

let timer = null
onMounted(() => {
  load()
  timer = setInterval(() => { syncDOM(); load() }, 2000)
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
.tier-废种{background:linear-gradient(90deg,#444,#666,#555,#777,#666,#555,#444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-凡种{background:linear-gradient(90deg,#b0b0b0,#d0d0d0,#c8c8c8,#e0e0e0,#d0d0d0,#c8c8c8,#b0b0b0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-良种{background:linear-gradient(90deg,#2e7d32,#4caf50,#43a047,#66bb6a,#4caf50,#43a047,#2e7d32);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-精种{background:linear-gradient(90deg,#0d47a1,#1976d2,#1565c0,#42a5f5,#1e88e5,#1565c0,#0d47a1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-珍种{background:linear-gradient(90deg,#4a148c,#7b1fa2,#6a1b9a,#ab47bc,#8e24aa,#6a1b9a,#4a148c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-异种{background:linear-gradient(90deg,#f06292,#f48fb1,#fce4ec,#f8bbd0,#f48fb1,#ec407a,#f06292);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-仙种{background:linear-gradient(90deg,#fbc02d,#ffee58,#fff9c4,#fff176,#ffee58,#fdd835,#fbc02d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-圣种{background:linear-gradient(90deg,#e65100,#ff9800,#ffe0b2,#ffcc80,#ff9800,#f57c00,#e65100);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-神种{background:linear-gradient(90deg,#7f0000,#c62828,#b71c1c,#f44336,#e53935,#b71c1c,#7f0000);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tier-特殊{background:linear-gradient(90deg,#7c4dff,#448aff,#00b0ff,#00e5ff,#76ff03,#ffea00,#ff6d00,#f06292,#ff6d00,#ffea00,#76ff03,#00e5ff,#00b0ff,#448aff,#7c4dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

.bestiary-panel{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);animation:bs-fade .25s ease-out;pointer-events:all}
@keyframes bs-fade{0%{opacity:0}100%{opacity:1}}

.bestiary-frame{position:relative;width:90vw;max-width:520px;max-height:85vh;background:linear-gradient(175deg,#141210 0%,#1a1714 30%,#1d1915 70%,#151310 100%);border:1px solid rgba(180,150,110,.18);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.bestiary-frame::before{content:'';position:absolute;inset:0;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzIiB3aWR0aD0iMjUiIGhlaWdodD0iMTMiIHBhdHRlcm5UcmFuc2Zvcm09InNjYWxlKDEuNSkiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9Im5vbmUiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIuMyIgb3BhY2l0eT0iLjEyIiBkPSJNMTUgMjIuM2EyLjUgMi41IDAgMCAxLTIuNSAyLjUgMi41IDIuNSAwIDAgMS0yLjUtMi41IDIuNSAyLjUgMCAwIDEgMi41LTIuNSAyLjUgMi41IDAgMCAxIDIuNSAyLjVtMi41IDBhNSA1IDAgMCAxLTUgNSA1IDUgMCAwIDEtNS01IDUgNSAwIDAgMSA1LTUgNSA1IDAgMCAxIDUgNW0yLjUgMGE3LjUgNy41IDAgMCAxLTcuNSA3LjUgNy41IDcuNSAwIDAgMS03LjUtNy41IDcuNSA3LjUgMCAwIDEgNy41LTcuNSA3LjUgNy41IDAgMCAxIDcuNSA3LjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcykiLz48L3N2Zz4=);opacity:.5;pointer-events:none;z-index:0}

.bs-close{position:absolute;top:10px;right:10px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);border:1px solid rgba(180,150,110,.12);border-radius:6px;color:rgba(200,180,150,.5);cursor:pointer;z-index:2;font-size:12px}.bs-close:hover{color:rgba(200,180,150,.85);background:rgba(255,255,255,.08)}

.bs-panel-title{text-align:center;padding:18px 16px 4px;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:1.4em;letter-spacing:.15em;color:#c4a87a;position:relative;z-index:1}

.bs-tabs{display:flex;gap:3px;padding:12px 12px 4px;overflow-x:auto;flex-shrink:0;scrollbar-width:none;border-bottom:1px solid rgba(180,150,110,.06)}.bs-tabs::-webkit-scrollbar{display:none}
.bs-tabs button{flex-shrink:0;padding:7px 14px;font-family:'寒蝉全圆体','DouyinSans',serif;font-size:.7em;letter-spacing:.08em;color:rgba(180,160,130,.4);background:rgba(255,255,255,.01);border:1px solid transparent;border-bottom:2px solid transparent;border-radius:6px 6px 0 0;cursor:pointer;transition:all .25s;white-space:nowrap;position:relative;margin-bottom:-1px}
.bs-tabs button:hover{color:rgba(200,180,150,.7);background:rgba(180,150,110,.04)}
.bs-tabs button.active{color:#c4a87a;background:rgba(180,150,110,.06);border-color:rgba(180,150,110,.15);border-bottom-color:var(--tc,#c4a87a)}

.bs-empty{text-align:center;padding:40px 16px;color:rgba(180,160,130,.3);font-size:.85em}

.bs-list{flex:1;overflow-y:auto;padding:4px 12px 16px;scrollbar-width:thin;scrollbar-color:rgba(180,150,110,.1) transparent}
.bs-list::-webkit-scrollbar{width:4px}.bs-list::-webkit-scrollbar-track{background:transparent}.bs-list::-webkit-scrollbar-thumb{background:rgba(180,150,110,.15);border-radius:2px}

.bs-entry{margin:8px 0;border-radius:8px;padding:1px;background:var(--ti,linear-gradient(90deg,#444,#666));background-size:200% auto;animation:bs-shimmer 4s linear infinite;position:relative}
.bs-entry::after{content:'';position:absolute;inset:0;border-radius:8px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJlIiB3aWR0aD0iMjUiIGhlaWdodD0iMTMiIHBhdHRlcm5UcmFuc2Zvcm09InNjYWxlKDEpIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIi8+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iLjMiIG9wYWNpdHk9Ii4xNSIgZD0iTTE1IDIyLjNhMi41IDIuNSAwIDAgMS0yLjUgMi41IDIuNSAyLjUgMCAwIDEtMi41LTIuNSAyLjUgMi41IDAgMCAxIDIuNS0yLjUgMi41IDIuNSAwIDAgMSAyLjUgMi41bTIuNSAwYTUgNSAwIDAgMS01IDUgNSA1IDAgMCAxLTUtNSA1IDUgMCAwIDEgNS01IDUgNSAwIDAgMSA1IDVtMi41IDBhNy41IDcuNSAwIDAgMS03LjUgNy41IDcuNSA3LjUgMCAwIDEtNy41LTcuNSA3LjUgNy41IDAgMCAxIDcuNS03LjUgNy41IDcuNSAwIDAgMSA3LjUgNy41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2UpIi8+PC9zdmc+);opacity:.15;pointer-events:none}
.bs-entry .bs-ehd{display:flex;align-items:center;gap:8px;padding:9px 14px;background:rgba(255,255,255,.04);border-radius:7px 7px 0 0;position:relative;z-index:1}
.bs-entry .bs-enm{font-family:'寒蝉全圆体','DouyinSans',serif;font-weight:700;font-size:1.05em;letter-spacing:.03em;background:var(--ti);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bs-entry .bs-etier{font-size:.65em;padding:3px 7px;border:1px solid var(--tc);border-radius:4px;color:var(--tc);margin-left:auto;letter-spacing:.06em;position:relative;z-index:1}
.bs-entry .bs-ebd{padding:8px 14px 10px;font-size:.8em;line-height:1.7;background:rgba(0,0,0,.2);color:#c0b090;position:relative;z-index:1}
.bs-entry .bs-erow{display:flex;gap:6px;margin-bottom:3px}
.bs-entry .bs-erow:last-child{margin-bottom:0}
.bs-entry .bs-elbl{color:var(--tc);font-size:.78em;white-space:nowrap;min-width:3.5em;opacity:.6;letter-spacing:.04em}
.bs-entry .bs-eft{display:flex;align-items:center;gap:4px;padding:6px 14px;font-size:.7em;color:#a09080;background:rgba(0,0,0,.15);border-radius:0 0 7px 7px;border-top:1px solid rgba(255,255,255,.04);position:relative;z-index:1}
.bs-entry .bs-eico{display:inline-block;width:1em;height:1em;vertical-align:-.15em;color:var(--tc);margin-right:2px;opacity:.6}
@keyframes bs-shimmer{0%{background-position:0% center}100%{background-position:200% center}}

.c-废种{--tc:#888;--ti:linear-gradient(90deg,#444,#666,#555,#777,#666,#555,#444)}
.c-凡种{--tc:#c0c0c0;--ti:linear-gradient(90deg,#b0b0b0,#d0d0d0,#c8c8c8,#e0e0e0,#d0d0d0,#c8c8c8,#b0b0b0)}
.c-良种{--tc:#4caf50;--ti:linear-gradient(90deg,#2e7d32,#4caf50,#43a047,#66bb6a,#4caf50,#43a047,#2e7d32)}
.c-精种{--tc:#2196f3;--ti:linear-gradient(90deg,#0d47a1,#1976d2,#1565c0,#42a5f5,#1e88e5,#1565c0,#0d47a1)}
.c-珍种{--tc:#9c27b0;--ti:linear-gradient(90deg,#4a148c,#7b1fa2,#6a1b9a,#ab47bc,#8e24aa,#6a1b9a,#4a148c)}
.c-异种{--tc:#f06292;--ti:linear-gradient(90deg,#f06292,#f48fb1,#fce4ec,#f8bbd0,#f48fb1,#ec407a,#f06292)}
.c-仙种{--tc:#fbc02d;--ti:linear-gradient(90deg,#fbc02d,#ffee58,#fff9c4,#fff176,#ffee58,#fdd835,#fbc02d)}
.c-圣种{--tc:#ff6d00;--ti:linear-gradient(90deg,#e65100,#ff9800,#ffe0b2,#ffcc80,#ff9800,#f57c00,#e65100)}
.c-神种{--tc:#e53935;--ti:linear-gradient(90deg,#7f0000,#c62828,#b71c1c,#f44336,#e53935,#b71c1c,#7f0000)}
.c-特殊{--tc:#81d8d0;--ti:linear-gradient(90deg,#00695c,#26a69a,#80cbc4,#b2dfdb,#80cbc4,#26a69a,#00695c)}
</style>