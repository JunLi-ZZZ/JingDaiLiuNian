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
  padding: 5px 14px;
  background: #f3ecd9;
  border: 1px solid var(--pline-strong);
  border-radius: 999px;
  color: var(--ptxt);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}
.sh-refresh:hover:not(:disabled) {
  box-shadow: 0 2px 8px rgba(20, 26, 12, 0.35);
}
.sh-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sh-refresh i {
  margin-right: 5px;
  color: #b57a1f;
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
    linear-gradient(150deg, color-mix(in srgb, var(--tier) 10%, transparent), transparent 45%),
    linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px solid color-mix(in srgb, var(--tier) 45%, var(--pline));
  border-radius: 12px 16px 12px 16px;
}
.good-card.sold {
  filter: grayscale(0.8);
  opacity: 0.55;
}
.gd-head {
  display: flex;
  align-items: center;
  gap: 7px;
}
.gd-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tier) 18%, transparent);
  color: var(--tier);
  font-size: 11px;
}
.gd-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
}
.gd-effect {
  font-size: 11px;
  color: #4a6b3a;
  font-weight: 600;
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
  padding: 4px 14px;
  background: linear-gradient(160deg, #d9a441, #b57a1f);
  border: none;
  border-radius: 6px;
  color: #3d2f14;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-num);
  cursor: pointer;
}
.gd-buy:hover:not(:disabled) {
  box-shadow: 0 2px 10px rgba(217, 164, 65, 0.45);
}
.gd-buy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.gd-buy i {
  margin-right: 4px;
  font-size: 10px;
}
</style>
