<script setup lang="ts">
import type { PublicBattleCard } from '../../src/output-cards';
defineProps<{card:PublicBattleCard}>();
</script>
<template>
 <article class="battle-card" :class="{critical:card.outcome==='暴击',miss:card.outcome==='未命中'}" aria-label="战斗结算卡片">
  <header><span>交 锋 / IMPACT</span><strong>{{card.outcome}}</strong></header>
  <section class="clash"><div class="attacker"><small>出手</small><h3>{{card.actor}}</h3><p>{{card.skill}}</p></div><div class="slash" aria-hidden="true">╱</div><div class="target"><small>承受</small><h3>{{card.target}}</h3></div></section>
  <div class="impact"><div><strong>{{card.damage}}</strong><span>实际损伤</span></div><p v-if="card.absorbed"><b>{{card.absorbed}}</b> 转为储能<br /><small>伤害被适应截留</small></p><p v-else>{{card.outcome==='未命中'?'攻击落空':'冲击已结算'}}<br /><small>{{card.elapsed}} 当地秒</small></p></div>
  <div v-if="card.hp" class="life"><span>生命变化</span><strong>{{card.hp}}</strong></div>
  <footer><span v-if="card.cost">消耗 · {{card.cost}}</span><span v-else>行动耗时 · {{card.elapsed}} 秒</span><details v-if="card.roll"><summary>命中判定 ⌄</summary><p>{{card.roll}}</p></details></footer>
 </article>
</template>
<style scoped>
.battle-card{box-sizing:border-box;max-width:720px;margin:20px auto;background:#241f21;color:#e9dfd6;border:1px solid #715251;border-top:3px solid #b06952;font:12px/1.8 'Microsoft YaHei',sans-serif;overflow-wrap:anywhere;box-shadow:0 6px 20px #291e2115}
header{padding:12px 23px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #65474477;background:linear-gradient(100deg,#55372e55,transparent)}header span{font-size:9px;letter-spacing:3px;color:#b79b83}header strong{border:1px solid #9e614f;color:#ebac88;padding:1px 12px;font-size:11px;letter-spacing:3px}.clash{display:grid;grid-template-columns:1fr 42px 1fr;align-items:center;padding:22px 24px 10px;gap:12px}.clash small{font-size:9px;color:#aa8979;letter-spacing:3px}h3{font:500 23px/1.6 serif;margin:3px 0}.clash p{margin:0;font-size:11px;color:#c4b08c}.slash{font:60px/1 serif;color:#a25d43}.target{text-align:right}.impact{display:flex;justify-content:space-between;align-items:center;background:repeating-linear-gradient(-55deg,transparent,transparent 16px,#9c6c4910 16px,#9c6c4910 17px);border-block:1px solid #6b4e4150;margin:12px 24px;padding:8px 0}.impact>div{display:flex;align-items:baseline;gap:14px}.impact strong{font:italic 58px/1.3 Georgia,serif;color:#e0b181}.impact span{font-size:10px;color:#c9ac8b}.impact p{text-align:right;color:#bacbb8;font-size:11px}.impact b{font:22px serif}.impact small{font-size:9px;color:#909e8c}.life{display:flex;justify-content:space-between;gap:12px;margin:15px 24px;color:#d9c6a7}.life span{color:#a69682}footer{padding:14px 24px;border-top:1px solid #674c4150;display:flex;justify-content:space-between;gap:12px;color:#ad9e8e;font-size:10px}details{text-align:right}summary{cursor:pointer;list-style:none}.critical{border-color:#ac7a4a;box-shadow:inset 0 0 36px #b6711814}.critical header strong{background:#bc805e;color:#201d1b}.miss{filter:saturate(.35)}@media(max-width:400px){.clash{padding:18px 17px 8px;grid-template-columns:1fr 25px 1fr;gap:8px}h3{font-size:19px}.slash{font-size:44px}.impact{margin:10px 17px}.impact strong{font-size:46px}.impact>div{gap:8px}.life{margin:14px 17px}footer{padding:12px 17px}}
</style>
