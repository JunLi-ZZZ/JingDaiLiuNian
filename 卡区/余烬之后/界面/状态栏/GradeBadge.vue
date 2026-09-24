<script setup lang="ts">
import { displayGrade } from '../../src/grades';
import { computed } from 'vue';
const props=defineProps<{grade:string}>();
const resolved=computed(()=>displayGrade(props.grade));
</script>
<template><span v-if="resolved" class="grade-badge" :data-grade="resolved">{{resolved}}</span><span v-else>{{grade}}</span></template>
<style>
[data-grade="凡尘"]{--grade-a:#9ba8b4;--grade-b:#edf3f4;--grade-c:#536779;--grade-base:#202a33;--grade-ink:#435667;--grade-paper:#eaf0f2;--grade-stops:#728897,#b9c9d1,#f4faf9,#a8bbc6,#728897}
[data-grade="凝华"]{--grade-a:#57ce9b;--grade-b:#d1ffe6;--grade-c:#268d77;--grade-base:#102f2a;--grade-ink:#226b54;--grade-paper:#e7f4e9;--grade-stops:#268d77,#5bd59c,#d1ffe6,#87e5b4,#268d77}
[data-grade="罕世"]{--grade-a:#60bfff;--grade-b:#d8f7ff;--grade-c:#506ada;--grade-base:#15283f;--grade-ink:#275889;--grade-paper:#e7f1fa;--grade-stops:#5780e8,#62c9ff,#d8f7ff,#8cdeff,#5780e8}
[data-grade="史铭"]{--grade-a:#c49aff;--grade-b:#f7e4ff;--grade-c:#9b56da;--grade-base:#2b1e3e;--grade-ink:#6b378b;--grade-paper:#f1e9f8;--grade-stops:#a46ee1,#db9fff,#f7e4ff,#e0b8ff,#a46ee1}
[data-grade="传遗"]{--grade-a:#efbc59;--grade-b:#fff7d1;--grade-c:#c87833;--grade-base:#352715;--grade-ink:#805219;--grade-paper:#f8f0dc;--grade-stops:#d99838,#f9d778,#fff7d1,#f0c16a,#d99838}
[data-grade="神御"]{--grade-a:#ff939d;--grade-b:#ffe9c0;--grade-c:#d34670;--grade-base:#3c1d2d;--grade-ink:#922e51;--grade-paper:#fae9ec;--grade-stops:#d34670,#ff9595,#ffe9c0,#f5adcc,#d34670}
[data-grade="本源"]{--grade-a:#8ee8ed;--grade-b:#fff3d4;--grade-c:#b392ec;--grade-base:#20233c;--grade-ink:#56528d;--grade-paper:#eeecfa;--grade-stops:#91a4ff,#8ee8ed,#c1f2de,#fff3d4,#edb5d9,#b392ec,#91a4ff}
[data-grade="原初本源"]{--grade-a:#f2dfab;--grade-b:#fffdf0;--grade-c:#827ba9;--grade-base:#141b26;--grade-ink:#62503a;--grade-paper:#f5f0e5;--grade-stops:#bc9b55,#f2dfab,#fffdf0,#bddeea,#c6b6e2,#f2dfab,#bc9b55}
.grade-badge{display:inline-block;vertical-align:middle;padding:2px 10px;font:600 11px/1.8 'Microsoft YaHei',sans-serif;letter-spacing:1px;color:var(--grade-b)!important;border:1px solid var(--grade-a);border-radius:3px;background:linear-gradient(115deg,var(--grade-base),var(--grade-c),var(--grade-base),var(--grade-c));background-size:280% 100%;animation:grade-flow 9s ease-in-out infinite;box-shadow:inset 0 1px 0 #ffffff35,0 0 12px color-mix(in srgb,var(--grade-a) 18%,transparent)}
.grade-badge[data-grade="凡尘"]{animation:none}.grade-badge[data-grade="神御"]{animation-duration:7s}.grade-badge[data-grade="本源"]{animation-duration:6s}
@keyframes grade-flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
[data-grade].folio{border-left-color:var(--grade-ink)!important;background:linear-gradient(115deg,var(--grade-paper),#faf9f3)!important}
[data-grade].dossier{border-color:var(--grade-a)!important;--accent:var(--grade-ink)!important}
[data-grade].dossier h3{background:linear-gradient(105deg,var(--grade-stops));background-size:250% 100%;background-clip:text;-webkit-background-clip:text;color:transparent!important;animation:grade-flow 12s ease-in-out infinite}
[data-grade].dossier.inheritance{--accent:var(--grade-a)!important;background:radial-gradient(ellipse at 8% 0%,color-mix(in srgb,var(--grade-a) 16%,transparent),transparent 55%),radial-gradient(ellipse at 100% 95%,color-mix(in srgb,var(--grade-c) 25%,transparent),transparent 70%),var(--grade-base);box-shadow:inset 0 1px 0 #ffffff25,0 9px 26px color-mix(in srgb,var(--grade-base) 22%,transparent)}
[data-grade].inheritance .sigil{stroke:var(--grade-a);filter:drop-shadow(0 0 7px color-mix(in srgb,var(--grade-a) 30%,transparent))}
[data-grade].inheritance .sigil .symbol{fill:color-mix(in srgb,var(--grade-a) 10%,transparent);stroke:var(--grade-b)}
[data-grade].inheritance .hairline{background:linear-gradient(90deg,var(--grade-c),var(--grade-b),transparent)}
[data-grade].inheritance .metrics strong{color:var(--grade-b)}
[data-grade].inheritance .metrics small,[data-grade].inheritance .inheritance-top{color:color-mix(in srgb,var(--grade-b) 70%,#a5bac0)}
[data-grade].dossier.relic,[data-grade].dossier.fieldnote{background:linear-gradient(120deg,var(--grade-paper),#faf7ef);border-color:color-mix(in srgb,var(--grade-ink) 45%,#d8d5cb)!important}
[data-grade].dossier.relic h3,[data-grade].dossier.fieldnote h3,[data-grade].dossier.portrait h3{background-image:linear-gradient(105deg,var(--grade-ink),var(--grade-c),var(--grade-ink))}
[data-grade].relic .relic-mark,[data-grade].relic .inventory-no{color:var(--grade-ink)}
@media(prefers-reduced-motion:reduce){.grade-badge,[data-grade].dossier h3{animation:none}}
</style>
