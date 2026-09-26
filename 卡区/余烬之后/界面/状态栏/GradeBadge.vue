<script setup lang="ts">
import { displayGrade } from '../../src/grades';
import { computed } from 'vue';
const props=defineProps<{grade:string}>();
const resolved=computed(()=>displayGrade(props.grade));
</script>
<template><span v-if="resolved" class="grade-badge" :data-grade="resolved"><span class="grade-label">{{resolved}}</span></span><span v-else>{{grade}}</span></template>
<style>
/* 序列只提供视觉主题；能力、物品和人物沿用各自的卡片结构。 */
[data-grade="凡尘"] {
 --grade-a:#b7bbc2; --grade-b:#ffffff; --grade-c:#828b97;
 --grade-ink:#535d6b; --grade-paper:#f3f4f6; --grade-stroke:#687380c0;
 --grade-stops:#a3a8b1,#d7dbe0,#ffffff,#e7e9ed,#b9bfc8,#a3a8b1;
}
[data-grade="凝华"] {
 --grade-a:#4eae67; --grade-b:#c6f3c7; --grade-c:#238044;
 --grade-ink:#24643d; --grade-paper:#edf7ed; --grade-stroke:transparent;
 --grade-stops:#277d40,#49ac58,#a4df90,#63bd66,#2f9148,#277d40;
}
[data-grade="罕世"] {
 --grade-a:#4595e5; --grade-b:#c1e5ff; --grade-c:#1765b3;
 --grade-ink:#25598c; --grade-paper:#edf5fe; --grade-stroke:transparent;
 --grade-stops:#1856a3,#2684d7,#8dccfa,#499ce9,#226bbd,#1856a3;
}
[data-grade="史铭"] {
 --grade-a:#a46ad8; --grade-b:#edd4ff; --grade-c:#7734ad;
 --grade-ink:#734095; --grade-paper:#f6effb; --grade-stroke:transparent;
 --grade-stops:#6a279a,#a250ce,#d9a2f1,#b16adb,#843bb2,#6a279a;
}
[data-grade="传遗"] {
 --grade-a:#d2b02b; --grade-b:#fff5b3; --grade-c:#a88a0a;
 --grade-ink:#776018; --grade-paper:#fff9df; --grade-stroke:#92750c50;
 --grade-stops:#b19113,#e4c32e,#fff4a0,#f4d746,#c9ab20,#b19113;
}
[data-grade="神御"] {
 --grade-a:#de5260; --grade-b:#ffc1c5; --grade-c:#b52136;
 --grade-ink:#973044; --grade-paper:#fff0f0; --grade-stroke:transparent;
 --grade-stops:#a5162d,#d62d42,#ff9191,#ed5360,#c02036,#a5162d;
}
[data-grade="本源"] {
 --grade-a:#ee903d; --grade-b:#ffddb0; --grade-c:#c36116;
 --grade-ink:#955021; --grade-paper:#fff2e3; --grade-stroke:transparent;
 --grade-stops:#bf5917,#ee8c2c,#ffd494,#f7a347,#d5701d,#bf5917;
}
[data-grade="原初本源"] {
 --grade-a:#dc7ba9; --grade-b:#ffe3ef; --grade-c:#a075cb;
 --grade-ink:#985277; --grade-paper:#fcf0f7; --grade-stroke:transparent;
 --grade-stops:#c25890,#ee9bbb,#bb86db,#739fde,#63bdb3,#d2b95e,#ecaa89,#ee9bbb,#c25890;
}
.grade-badge {
 display:inline-block; vertical-align:middle; padding:2px 10px;
 font:600 11px/1.8 'Microsoft YaHei',sans-serif; letter-spacing:1px;
 color:var(--grade-ink); border:1px solid color-mix(in srgb,var(--grade-a) 48%,transparent);
 border-radius:3px; background:linear-gradient(120deg,#ffffffd9,var(--grade-paper));
 box-shadow:inset 0 1px 0 #ffffffb3;
}
.grade-label,[data-grade].dossier h3 {
 background-image:linear-gradient(90deg,var(--grade-stops));
 background-size:200% 100%; background-clip:text; -webkit-background-clip:text;
 color:transparent!important; -webkit-text-fill-color:transparent;
 -webkit-text-stroke:.3px var(--grade-stroke);
 animation:grade-flow 6s linear infinite;
}
[data-grade="原初本源"]>.grade-label,[data-grade="原初本源"].dossier h3 {animation-duration:9s}
@keyframes grade-flow {to{background-position:200% 50%}}
[data-grade].folio {
 border-left-color:var(--grade-a)!important;
 background:linear-gradient(115deg,var(--grade-paper),#fffdfa)!important;
}
[data-grade].dossier,[data-grade].dossier.relic,[data-grade].dossier.fieldnote,[data-grade].dossier.portrait {
 --accent:var(--grade-ink)!important;
 border-color:color-mix(in srgb,var(--grade-a) 58%,#dedbd4)!important;
 background:linear-gradient(120deg,var(--grade-paper),#fffdfa);
 color:#39433f;
}
[data-grade].dossier.inheritance {
 background:radial-gradient(ellipse at 3% 0%,color-mix(in srgb,var(--grade-a) 11%,transparent),transparent 54%),
  linear-gradient(120deg,var(--grade-paper),#fffdfa 72%);
 box-shadow:inset 0 1px 0 #ffffffd9,0 6px 22px color-mix(in srgb,var(--grade-ink) 8%,transparent);
}
[data-grade].inheritance .sigil {stroke:var(--grade-a)}
[data-grade].inheritance .sigil .symbol {
 fill:color-mix(in srgb,var(--grade-a) 9%,transparent); stroke:var(--grade-c);
}
[data-grade].inheritance .hairline {background:linear-gradient(90deg,var(--grade-a),var(--grade-b),transparent)}
[data-grade].dossier .metrics strong {color:var(--grade-ink)}
[data-grade].dossier .metrics {border-color:color-mix(in srgb,var(--grade-a) 26%,transparent)}
[data-grade].inheritance .inheritance-top,[data-grade].relic .relic-mark,
[data-grade].relic .inventory-no {color:var(--grade-ink)}
[data-grade].inheritance .inheritance-footer {border-color:color-mix(in srgb,var(--grade-a) 26%,transparent)}
[data-grade].dossier.portrait {box-shadow:5px 5px 0 color-mix(in srgb,var(--grade-a) 12%,#f8f7f3)}
@media(prefers-reduced-motion:reduce) {.grade-label,[data-grade].dossier h3{animation:none}}
@media(forced-colors:active) {
 .grade-label,[data-grade].dossier h3{background:none;color:CanvasText!important;-webkit-text-fill-color:CanvasText;-webkit-text-stroke:0;animation:none}
}
</style>
