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
    linear-gradient(150deg, color-mix(in srgb, var(--tier) 10%, transparent), transparent 45%),
    linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px solid color-mix(in srgb, var(--tier) 45%, var(--pline));
  border-radius: 12px 16px 12px 16px;
}
.fd-head {
  display: flex;
  align-items: center;
  gap: 7px;
}
.fd-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tier) 16%, transparent);
  color: var(--tier);
  font-size: 11px;
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
  color: #4a6b3a;
}
.fd-eff.bad {
  color: #b24a36;
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
