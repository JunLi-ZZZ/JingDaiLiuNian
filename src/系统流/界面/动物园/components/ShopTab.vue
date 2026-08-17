<template>
  <div class="shop">
    <div class="shop-head">
      <span class="sh-note"><i class="fa-solid fa-arrows-rotate"></i>货架随机铺货，卖完/看腻了可刷新</span>
      <button class="sh-refresh" :disabled="store.data.愿力 < 30" @click="store.刷新商店()">
        <i class="fa-solid fa-rotate"></i>刷新货架 <em>30 愿力</em>
      </button>
    </div>

    <div class="shop-grid">
      <article
        v-for="(g, i) in store.data.商店"
        :key="g.名称 + i"
        class="good-card"
        :class="{ sold: g.已售 }"
        :style="tierVars(g.品阶)"
      >
        <div class="gd-head">
          <span class="gd-icon"><i :class="类型图标[g.类型]"></i></span>
          <span class="gd-name">{{ g.名称 }}</span>
          <TierTag :品阶="g.品阶" />
        </div>
        <p class="gd-effect">{{ g.效果文本 }}</p>
        <p class="gd-desc">{{ g.描述 }}</p>
        <div class="gd-foot">
          <span class="gd-type">{{ g.类型 }}<template v-if="限购余量(g) !== null"> · 剩 {{ 限购余量(g) }} 次</template></span>
          <button
            class="gd-buy"
            :disabled="g.已售 || store.data.愿力 < g.价格"
            @click="store.购买(i)"
          >
            <template v-if="g.已售">已售罄</template>
            <template v-else><i class="fa-solid fa-sparkles"></i>{{ g.价格 }}</template>
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierVars } from '../../shared/tier';
import TierTag from '../../shared/TierTag.vue';
import type { 商品 } from '../types';

const store = useZooStore();

const 类型图标: Record<string, string> = {
  食物: 'fa-solid fa-bowl-food',
  兽蛋: 'fa-solid fa-egg',
  建设: 'fa-solid fa-hammer',
};

function 限购余量(g: 商品): number | null {
  if (!g.限购) return null;
  return Math.max(0, g.限购 - (store.data.建设记录[g.名称] ?? 0));
}
</script>

<style scoped>
.shop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.shop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.sh-note {
  font-size: 11px;
  color: var(--txt-dim);
}
.sh-note i {
  margin-right: 5px;
  color: var(--acc);
}
.sh-refresh {
  flex-shrink: 0;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.12));
  border: 1px solid rgba(139, 111, 71, 0.5);
  border-radius: 6px;
  color: var(--ptxt);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.4);
}
.sh-refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(212, 175, 55, 0.18));
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.5),
    0 3px 10px rgba(212, 175, 55, 0.25);
}
.sh-refresh:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.sh-refresh i {
  margin-right: 5px;
  color: #8b6f47;
}
.sh-refresh em {
  font-style: normal;
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--ptxt-dim);
}
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 9px;
}
.good-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  color: var(--ptxt);
  background:
    radial-gradient(ellipse 70% 65% at 18% 25%, rgba(255, 250, 240, 0.35), transparent 45%),
    radial-gradient(ellipse at 82% 75%, rgba(90, 60, 30, 0.05), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px solid color-mix(in srgb, var(--tier) 50%, rgba(139, 111, 71, 0.4));
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.18),
    inset 2px 2px 5px rgba(90, 60, 30, 0.1),
    inset -6px -6px 12px rgba(90, 60, 30, 0.06),
    0 2px 8px rgba(26, 15, 30, 0.35);
}
.good-card.sold {
  filter: grayscale(0.8);
  opacity: 0.5;
}
.gd-head {
  display: flex;
  align-items: center;
  gap: 7px;
}
.gd-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--tier) 20%, transparent), color-mix(in srgb, var(--tier) 10%, transparent));
  border: 1px solid color-mix(in srgb, var(--tier) 35%, rgba(139, 111, 71, 0.4));
  color: var(--tier);
  font-size: 11px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
}
.gd-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
}
.gd-effect {
  font-size: 11px;
  color: #8b6f47;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(212, 175, 55, 0.12);
  border-radius: 4px;
  align-self: flex-start;
}
.gd-desc {
  font-size: 11px;
  color: var(--ptxt-faint);
}
.gd-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gd-type {
  font-size: 10px;
  color: var(--ptxt-faint);
}
.gd-buy {
  padding: 5px 16px;
  background: linear-gradient(135deg, #d4af37, #b8942a);
  border: 2px solid rgba(90, 60, 30, 0.4);
  border-radius: 5px;
  color: #3d2f14;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-num);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.5),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(212, 175, 55, 0.3);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}
.gd-buy::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(255, 250, 240, 0.2), transparent 60%);
  pointer-events: none;
}
.gd-buy:hover:not(:disabled) {
  background: linear-gradient(135deg, #ddb942, #c49f2e);
  border-color: rgba(139, 111, 71, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.6),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25),
    0 3px 12px rgba(212, 175, 55, 0.5);
}
.gd-buy:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.gd-buy i {
  margin-right: 4px;
  font-size: 10px;
}
</style>
