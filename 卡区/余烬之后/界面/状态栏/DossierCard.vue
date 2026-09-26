<script setup lang="ts">
import GradeBadge from './GradeBadge.vue';
import {computed} from 'vue';
import type { DossierCard } from '../../src/output-cards';
import { displayGrade } from '../../src/grades';
const props=defineProps<{card:DossierCard}>();
const gain=computed(()=>props.card.type==='gain'||props.card.kind.startsWith('能力获得'));
const person=computed(()=>props.card.type==='character'||props.card.type==='entity');
const item=computed(()=>props.card.type==='item');
const grade=computed(()=>displayGrade(props.card.grade));
</script>
<template>
 <details class="dossier" :class="{inheritance:gain,portrait:person,relic:item,fieldnote:!gain&&!person&&!item}" :data-grade="grade" :open="gain">
  <summary>
   <template v-if="gain">
    <div class="inheritance-top"><span>ABILITY / 获 得</span><GradeBadge :grade="card.grade" /></div>
    <div class="awakening">
     <svg class="sigil" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="47"/><circle cx="60" cy="60" r="37" stroke-dasharray="1 8"/><path d="M60 6V20M60 100V114M6 60H20M100 60H114M26 26L34 34M86 86L94 94M94 26L86 34M34 86L26 94"/><path v-if="card.emblem==='transfer'" class="symbol" d="M68 27L40 64H57L51 94L83 51H64Z"/><path v-else-if="card.emblem==='flame'" class="symbol" d="M58 23C75 44 44 49 70 64L77 46C107 87 47 108 40 80C30 57 57 55 58 23Z"/><path v-else-if="card.emblem==='frost'" class="symbol" d="M60 26V94M30 43L90 77M30 77L90 43M50 32L60 43L70 32M50 88L60 77L70 88M30 55L45 52L42 36M78 84L75 68L90 65"/><path v-else-if="card.emblem==='shield'" class="symbol" d="M60 28L85 40V66Q83 84 60 94Q37 84 35 66V40ZM60 38V80M44 56H76"/><path v-else-if="card.emblem==='gate'" class="symbol" d="M38 89V36L64 27V84ZM68 39H82V91H64M54 58V63"/><path v-else class="symbol" d="M60 26L68 51L94 60L68 68L60 94L51 68L26 60L51 51Z"/></svg>
     <div><span class="eyebrow">{{card.kind}}</span><h3>{{card.title}}</h3><p>{{card.subtitle}}</p><div class="hairline"></div></div>
    </div>
    <span class="fold">展开记录 ⌄</span>
   </template>
   <template v-else-if="person"><div class="portrait-stamp" aria-hidden="true"><span>{{card.title.slice(0,1)}}</span><i>相逢</i></div><div class="portrait-heading"><span class="eyebrow">{{card.kind}} · {{card.grade}}</span><h3>{{card.title}}</h3><p>{{card.subtitle}}</p></div><span class="fold">⌄</span></template>
   <template v-else-if="item"><span class="inventory-no">收<br />藏</span><div><span class="eyebrow"><GradeBadge :grade="card.grade" /> / {{card.kind}}</span><h3>{{card.title}}</h3><p>{{card.subtitle}}</p></div><span class="relic-mark" aria-hidden="true">◇</span></template>
   <template v-else><span class="eyebrow">{{card.kind}} / <GradeBadge :grade="card.grade" /></span><h3>{{card.title}} <small>⌄</small></h3><p>{{card.subtitle}}</p></template>
  </summary>
  <div class="body">
   <p class="description">{{card.description}}</p>
   <div v-if="card.metrics?.length" class="metrics" :class="{'portrait-metrics':person}"><div v-for="metric in card.metrics" :key="metric.label"><small>{{metric.label}}</small><strong>{{metric.value}}</strong></div></div>
   <p v-if="card.detail" class="detail">{{card.detail}}</p>
   <div v-if="gain" class="inheritance-footer"><span>{{card.source || '旅途所得，历练成形'}}</span><span>✦</span></div>
  </div>
 </details>
</template>
<style scoped>
.dossier{--accent:#aa8750;box-sizing:border-box;max-width:720px;margin:20px auto;color:#293e3b;font:13px/1.9 'Microsoft YaHei',sans-serif;overflow-wrap:anywhere}
summary{cursor:pointer;list-style:none;position:relative}summary::-webkit-details-marker{display:none}h3{font:500 25px/1.5 'SimSun',serif;letter-spacing:1px;margin:5px 0}h3 small{float:right;font:13px sans-serif}.eyebrow{font-size:10px;letter-spacing:2px;color:var(--accent)}summary p{margin:5px 0 0;font-size:11px;color:#68756d}.body p{white-space:pre-wrap;margin:0 0 14px}.description{font-family:'SimSun',serif;font-size:15px;line-height:2}.detail{font-size:11px}.fold{font-size:9px;color:#68756d;letter-spacing:1px}
.inheritance{--accent:#857047;background:linear-gradient(120deg,#f6f1e5,#fffdfa);color:#39433f;border:1px solid #c5b78f;box-shadow:0 5px 25px #77623b12;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}
.inheritance summary{padding:17px 24px 8px}.inheritance-top{display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:3px;color:#716b5d}.grade{color:#dbc799;border:1px solid #ab986255;padding:2px 10px;letter-spacing:2px}.awakening{display:grid;grid-template-columns:110px 1fr;gap:25px;align-items:center;padding:20px 0 10px}.sigil{width:110px;fill:none;stroke:#cbb47b;stroke-width:.7}.sigil .symbol{fill:#cbb47b19;stroke-width:1.2}.inheritance h3{color:#857047;font-size:30px}.hairline{height:1px;background:linear-gradient(90deg,#b19b69,transparent);margin-top:16px}.inheritance .fold{display:block;text-align:right}.inheritance .body{padding:8px 26px 0}.inheritance .description{color:#39433f}.metrics{display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid #78877750;padding:14px 0;margin:18px 0;gap:10px}.metrics small{display:block;color:#68756d;font-size:9px;letter-spacing:2px}.metrics strong{color:#62543a;font:16px/2 serif}.inheritance .detail{color:#627169}.inheritance-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #6f80694d;padding:13px 0;color:#727566;font-size:9px;letter-spacing:3px}
.portrait{background:#f4f0e4;border:1px solid #c6bd9e;box-shadow:5px 5px 0 #e5e4d8}.portrait summary{display:flex;align-items:center;gap:20px;padding:18px}.portrait-stamp{width:70px;align-self:stretch;border:1px solid #b6ab8c;background:repeating-linear-gradient(135deg,transparent,transparent 7px,#a8a88813 7px,#a8a88813 8px);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}.portrait-stamp span{font:36px/1.5 serif;color:#586854}.portrait-stamp i{font:9px serif;letter-spacing:5px;color:#9b8463}.portrait-heading{flex:1}.portrait .body{border-top:1px solid #cbc3ac;padding:16px 23px 4px;margin:0 8px}.portrait h3{font-size:25px}
.portrait-metrics{border-color:#cbc3ac;margin:0 0 16px}.portrait-metrics small{color:#68756d}.portrait-metrics strong{color:#30443e}
.relic{background:#f1e9db;border-block:1px solid #baa78c;border-right:1px solid #baa78c;position:relative}.relic summary{display:flex;gap:20px;padding:16px 24px 16px 0;align-items:center}.inventory-no{align-self:stretch;padding:5px 16px;border-right:1px dashed #bda986;color:#8c6d45;font:16px/1.7 serif;display:grid;place-content:center}.relic h3{font-size:23px}.relic-mark{font:45px serif;color:#9b7a4660;margin-left:auto}.relic .body{padding:0 24px 8px 65px}.relic .detail{border-top:1px dashed #beae92;padding-top:10px}
.fieldnote{background:#f2f5ee;border:1px solid #c0ccb9;border-top:3px solid #77876c;border-radius:2px}.fieldnote summary{padding:16px 22px}.fieldnote .body{border-top:1px solid #d2d8c8;padding:16px 22px 4px}.fieldnote h3{font-size:23px}
@media(max-width:400px){.awakening{grid-template-columns:76px 1fr;gap:14px}.sigil{width:76px}.inheritance h3{font-size:25px}.inheritance summary{padding:14px 17px 6px}.inheritance .body{padding:8px 18px 0}.metrics{grid-template-columns:repeat(2,1fr)}.portrait summary{gap:12px}.portrait-stamp{width:49px}.eyebrow{letter-spacing:1px}.relic .body{padding-left:20px}}
</style>
