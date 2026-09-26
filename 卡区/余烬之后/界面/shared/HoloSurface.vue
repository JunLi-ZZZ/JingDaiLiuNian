<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { displayGrade } from '../../src/grades';
import { resolveTheme } from './grade-materials';
import { ornament } from './grade-ornament';
const props=defineProps<{grade:string;compact?:boolean}>();
const root=ref<HTMLElement>(),visible=ref(false),foreground=ref(true),reduced=ref(false),paused=ref(false);
const angle=ref(0),x=ref(0),y=ref(0),hover=ref(false);
const resolved=computed(()=>displayGrade(props.grade));
const theme=computed(()=>resolveTheme(resolved.value||props.grade));
const active=computed(()=>visible.value&&foreground.value&&!reduced.value&&!paused.value);
const style=computed(()=>({
 '--holo-a':theme.value.a,'--holo-b':theme.value.b,'--holo-c':theme.value.c,
 '--holo-foil':theme.value.foil,'--holo-x':(50+x.value*38)+'%','--holo-y':(40+y.value*30)+'%',
 '--holo-angle':(118+x.value*26)+'deg','--holo-shift':(x.value*5)+'px',
 '--holo-rx':(active.value?-y.value*1.2:0)+'deg','--holo-ry':(active.value?x.value*1.8:0)+'deg',
 '--holo-play':active.value&&(!props.compact||hover.value)?'running':'paused',
}));
function move(e:PointerEvent){if(e.pointerType==='touch'||!active.value||!root.value)return;const b=root.value.getBoundingClientRect();x.value=(e.clientX-b.left)/b.width*2-1;y.value=(e.clientY-b.top)/b.height*2-1;}
function reset(){hover.value=false;x.value=0;y.value=0;}
function turn(){angle.value=(angle.value+1)%3;x.value=[0,-.75,.75][angle.value];y.value=0;}
let observer:IntersectionObserver|undefined,media:MediaQueryList|undefined;
function visibility(){foreground.value=document.visibilityState==='visible';}
function preference(){reduced.value=!!media?.matches;}
onMounted(()=>{
 observer=new IntersectionObserver(entries=>{visible.value=entries[0]?.isIntersecting??false;},{rootMargin:'80px'});
 if(root.value)observer.observe(root.value);
 media=window.matchMedia('(prefers-reduced-motion: reduce)');preference();visibility();
 media.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);
});
onBeforeUnmount(()=>{observer?.disconnect();media?.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);});
</script>
<template>
 <div ref="root" class="holo-surface" :class="{material:!!resolved,moving:active&&hover,compact}" :data-theme="theme.id" :data-grade="resolved" :style="style" @pointermove="move" @pointerenter="hover=true" @pointerleave="reset">
  <template v-if="resolved">
   <div class="holo-ground" aria-hidden="true"></div>
   <!-- 纹样仅由内置SVG函数生成，不接收档案正文。 -->
   <!-- eslint-disable-next-line vue/no-v-html -->
   <div class="holo-engraving" aria-hidden="true" v-html="ornament(theme.motif)"></div>
   <div class="holo-foil" aria-hidden="true"></div><div class="holo-glint" aria-hidden="true"></div><div class="holo-frame" aria-hidden="true"></div>
  </template>
  <div class="holo-content"><slot /></div>
  <div v-if="resolved" class="holo-controls">
   <span>{{theme.material}}</span>
   <button :disabled="reduced" @click="turn">转动卡面</button>
   <button :aria-pressed="paused" @click="paused=!paused">{{paused?'开启光效':'暂停光效'}}</button>
  </div>
 </div>
</template>
<style scoped>
.holo-surface{position:relative;margin:18px auto;max-width:720px;min-width:0}
.material{isolation:isolate;border-radius:7px;overflow:hidden;transform:perspective(1400px) rotateX(var(--holo-rx)) rotateY(var(--holo-ry));transition:transform .18s;touch-action:pan-y;box-shadow:0 5px 18px #5143310c}
.holo-ground,.holo-engraving,.holo-foil,.holo-glint,.holo-frame{position:absolute;inset:0;pointer-events:none}
.holo-ground{background:radial-gradient(ellipse at var(--holo-x) var(--holo-y),color-mix(in srgb,var(--holo-a) 13%,transparent),transparent 66%),linear-gradient(115deg,var(--grade-paper),#fffdfa 75%)}
.holo-engraving{inset:3px 8px auto auto;width:210px;aspect-ratio:1;color:var(--holo-a);opacity:.2;transform:translateX(var(--holo-shift))}
.holo-engraving :deep(svg){width:100%;height:100%}
.holo-foil{opacity:calc(var(--holo-foil) * .42);background:repeating-linear-gradient(var(--holo-angle),#90cdd1,#c6a7e3 18%,#e9acc6 34%,#ead19c 50%,#a4d7bd 66%,#90cdd1);background-size:220% 220%;background-position:var(--holo-x) var(--holo-y);mask-image:linear-gradient(black,transparent 210px);mix-blend-mode:multiply}
.holo-glint{background:radial-gradient(ellipse at var(--holo-x) var(--holo-y),#ffffffb0,transparent 50%);opacity:.45;mask-image:linear-gradient(black,transparent 240px)}
.holo-frame{inset:5px;z-index:2;border:1px solid color-mix(in srgb,var(--holo-a) 40%,transparent);border-radius:4px}
.holo-frame:after{content:'';position:absolute;inset:4px;border:1px solid transparent;border-color:color-mix(in srgb,var(--holo-a) 22%,transparent) transparent}
.holo-content{position:relative;z-index:3}
.material :deep(.dossier){margin:0;max-width:none;background:transparent!important;box-shadow:none!important;clip-path:none;border-radius:7px}
.material :deep(.description),.material :deep(.detail){color:#39433f}
.material :deep(.body){background:#fffdfa80}
.material :deep(.grade-label),.material :deep(.dossier h3){animation-play-state:var(--holo-play,paused)!important}
.compact{margin:10px 0;max-width:none}.compact :deep(.folio){margin:0;background:transparent;border-color:transparent}.compact :deep(.folio[open]>.detail-card){background:#fffdfa80}.compact .holo-controls{padding:3px 14px}.compact .holo-engraving{width:130px}
.holo-controls{position:relative;z-index:4;display:flex;gap:10px;justify-content:flex-end;align-items:center;padding:9px 18px;background:#fffdfab3;color:var(--grade-ink);font:10px/1.7 sans-serif}
.holo-controls span{margin-right:auto}.holo-controls button{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:4px}.holo-controls button:focus-visible{outline:2px solid var(--grade-ink)}.holo-controls button:disabled{opacity:.5;cursor:default}
[data-theme=dust] .holo-foil{filter:grayscale(1)}[data-theme=dust] .holo-engraving{opacity:.12}
[data-theme=jade] .holo-frame{clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px)}
[data-theme=azure] .holo-frame:after{border:1px dashed color-mix(in srgb,var(--holo-a) 35%,transparent)}
[data-theme=azure] .holo-foil{background-image:repeating-radial-gradient(ellipse at var(--holo-x) var(--holo-y),#78cef5 0 2px,#a0c7e4 2px 4px,#97baf8 4px 5px)}
[data-theme=violet] .holo-frame:after{border-style:dashed}
[data-theme=violet] .holo-foil{background-image:repeating-conic-gradient(from 45deg at var(--holo-x) var(--holo-y),#bb8fc7,#dab4f2 30deg,#e8c0e6 60deg,#bb8fc7 90deg)}
[data-theme=gold] .holo-frame{border:3px double var(--holo-a)}
[data-theme=gold] .holo-foil{background-image:repeating-conic-gradient(from 0deg at var(--holo-x) var(--holo-y),#c6ac6c,#f8e8ae 15deg,#d6b96e 30deg,#c6ac6c 45deg)}
[data-theme=crimson] .holo-frame{border-block:2px solid var(--holo-a)}
[data-theme=crimson] .holo-foil{background-image:repeating-conic-gradient(from 180deg at var(--holo-x) var(--holo-y),#cf6f85,#fbc9b0 4deg,#df8195 8deg,#b25368 15deg)}
[data-theme=amber] .holo-frame{box-shadow:inset 0 0 18px #eb8f3514}
[data-theme=amber] .holo-foil{background-image:repeating-radial-gradient(ellipse at var(--holo-x) var(--holo-y),#e7a976,#fdebc3 3%,#e7c0a3 5%,#e5ad58 8%,#e7a976 11%)}
[data-theme=primal] .holo-frame{border-color:#c995b9;box-shadow:inset 0 0 8px #cba2d427}
[data-theme=primal] .holo-foil{background-image:conic-gradient(from var(--holo-angle) at var(--holo-x) var(--holo-y),#f5d8b4,#dcaedc,#aba4ef,#9bd0e9,#a4eac7,#f5d8b4)}
.moving .holo-glint{animation:holo-breathe 8s ease-in-out infinite}
@keyframes holo-breathe{50%{opacity:.12}}
@media(max-width:400px){.holo-controls{font-size:9px;padding:8px 13px;gap:4px}.holo-engraving{width:145px}}
@media(prefers-reduced-motion:reduce){.material{transform:none;transition:none}.holo-glint{animation:none!important}.holo-engraving{transform:none}}
@media(forced-colors:active){.holo-ground,.holo-foil,.holo-glint,.holo-engraving{display:none}.material{border:1px solid CanvasText}.holo-controls{background:Canvas;color:CanvasText}}
</style>
