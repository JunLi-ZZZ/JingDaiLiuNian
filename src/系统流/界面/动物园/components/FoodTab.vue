<template>
  <div class="foods">
    <div v-if="列表.length === 0" class="empty">库存没有食物了，去商店或「食材补给」池补给</div>
    <div class="food-grid">
      <article v-for="f in 列表" :key="f.名称" class="food-card" :style="tierVars(f.品阶)">
        <div class="fd-head">
          <span class="fd-icon"><i class="fa-solid fa-bowl-food"></i></span>
          <span class="fd-name">{{ f.名称 }}</span>
          <span class="fd-count">×{{ f.数量 }}</span>
        </div>
        <div class="fd-tags">
          <TierTag :品阶="f.品阶" />
          <span
            v-for="(v, k) in f.效果"
            :key="k"
            class="fd-eff"
            :class="{ bad: v < 0 }"
          >{{ k }}{{ v > 0 ? '+' : '' }}{{ v }}</span>
        </div>
        <p class="fd-desc">{{ f.描述 }}</p>
      </article>
    </div>
    <p class="hint">在「兽员」页翻到兽娘形态卡片，点「喂食」即可投喂</p>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierVars } from '../../shared/tier';
import TierTag from '../../shared/TierTag.vue';

const store = useZooStore();
const 列表 = computed(() => Object.entries(store.data.食物).map(([名称, v]) => ({ 名称, ...v })));
</script>

<style scoped>
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 9px;
}
.food-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 11px;
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
.fd-head {
  display: flex;
  align-items: center;
  gap: 7px;
}
.fd-icon {
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
.fd-name {
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fd-count {
  margin-left: auto;
  font-family: var(--font-num);
  font-size: 11px;
  color: var(--ptxt-dim);
}
.fd-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.fd-eff {
  font-size: 10px;
  font-family: var(--font-num);
  color: #8b6f47;
  padding: 1px 5px;
  background: rgba(212, 175, 55, 0.12);
  border-radius: 3px;
}
.fd-eff.bad {
  color: #8b3a2a;
  background: rgba(139, 58, 42, 0.12);
}
.fd-desc {
  font-size: 11px;
  color: var(--ptxt-faint);
}
.hint {
  margin-top: 10px;
  font-size: 10px;
  color: var(--txt-faint);
  text-align: center;
}
</style>
