<template>
  <div class="incubate">
    <div class="egg-grid">
      <div v-for="(蛋, i) in store.data.蛋" :key="i" class="egg-cell" :style="tierVars(蛋.品阶)">
        <div class="egg-visual" :class="{ ready: 蛋.进度 >= 100 }">
          <i class="fa-solid fa-egg"></i>
        </div>
        <span class="egg-name">{{ 蛋.名称 }}</span>
        <div class="egg-tags">
          <TierTag :品阶="蛋.品阶" />
          <span class="egg-cat">{{ 蛋.类别 }}</span>
        </div>
        <div class="egg-progress">
          <div class="ep-track">
            <div class="ep-fill" :style="{ width: 蛋.进度 + '%' }"></div>
          </div>
          <span class="ep-num">{{ 蛋.进度 }}%</span>
        </div>
        <button v-if="蛋.进度 < 100" class="egg-btn" :disabled="store.data.愿力 < 100" @click="store.灌注(i)">
          <i class="fa-solid fa-sparkles"></i>灌注愿力 <em>-100</em>
        </button>
        <button v-else class="egg-btn hatch" @click="store.孵化(i)">
          <i class="fa-solid fa-burst"></i>孵化！
        </button>
      </div>
      <div v-for="n in 空位数" :key="'空' + n" class="egg-cell empty">
        <i class="fa-solid fa-plus"></i>
        <span>空孵化位</span>
        <span class="empty-hint">兽蛋池召唤或商店购买</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierVars } from '../../shared/tier';
import TierTag from '../../shared/TierTag.vue';

const store = useZooStore();
const 空位数 = computed(() => Math.max(0, 4 - store.data.蛋.length));
</script>

<style scoped>
.egg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.egg-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 10px 12px;
  color: var(--ptxt);
  background:
    radial-gradient(ellipse 70% 60% at 50% 22%, rgba(255, 250, 240, 0.4), transparent 50%),
    radial-gradient(ellipse at 50% 90%, color-mix(in srgb, var(--tier) 6%, transparent), transparent 45%),
    radial-gradient(ellipse at 82% 80%, rgba(90, 60, 30, 0.05), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px solid color-mix(in srgb, var(--tier) 50%, rgba(139, 111, 71, 0.4));
  border-radius: 10px;
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.18),
    inset 2px 2px 5px rgba(90, 60, 30, 0.1),
    inset -6px -6px 12px rgba(90, 60, 30, 0.06),
    0 2px 8px rgba(26, 15, 30, 0.35);
}
.egg-visual i {
  font-size: 38px;
  color: var(--tier);
  text-shadow: 0 0 16px color-mix(in srgb, var(--tier) 70%, transparent), 0 2px 4px rgba(0, 0, 0, 0.25);
}
.egg-visual.ready i {
  animation: shake 0.8s ease-in-out infinite;
}
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg); }
  75% { transform: rotate(6deg); }
}
.egg-name {
  font-size: 13px;
  font-weight: 700;
}
.egg-tags {
  display: flex;
  align-items: center;
  gap: 7px;
}
.egg-cat {
  font-size: 10px;
  color: var(--ptxt-faint);
}
.egg-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
}
.ep-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--pinset);
  overflow: hidden;
}
.ep-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--tier-deep), var(--tier));
  transition: width 0.3s;
}
.ep-num {
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--ptxt-dim);
}
.egg-btn {
  width: 100%;
  padding: 7px;
  font-size: 11px;
  font-family: inherit;
  color: var(--ptxt);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.3);
}
.egg-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.25);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.4),
    0 2px 6px rgba(212, 175, 55, 0.25);
}
.egg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.egg-btn em {
  font-style: normal;
  font-family: var(--font-num);
  color: var(--ptxt-dim);
}
.egg-btn.hatch {
  color: #f3ecd9;
  background: linear-gradient(135deg, var(--tier-deep), var(--tier));
  border: 1px solid color-mix(in srgb, var(--tier) 80%, rgba(0, 0, 0, 0.3));
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  animation: glow 1.2s ease-in-out infinite;
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 8px var(--tier), 0 2px 8px rgba(26, 15, 30, 0.4); }
  50% { box-shadow: 0 0 20px var(--tier), 0 4px 12px rgba(26, 15, 30, 0.5); }
}
.egg-cell.empty {
  border: 2px dashed rgba(139, 111, 71, 0.3);
  background: rgba(235, 224, 197, 0.25);
  color: var(--ptxt-faint);
  justify-content: center;
  gap: 4px;
  font-size: 11px;
}
.egg-cell.empty i {
  font-size: 18px;
}
.empty-hint {
  font-size: 9px;
  opacity: 0.7;
}
</style>
