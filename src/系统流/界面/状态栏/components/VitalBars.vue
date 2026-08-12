<template>
  <section class="vitals">
    <div v-for="v in vitals" :key="v.label" class="vital">
      <i :class="v.icon" class="v-icon" :style="{ color: v.color }"></i>
      <span class="v-label">{{ v.label }}</span>
      <div class="v-bar">
        <div
          class="v-fill"
          :style="{
            width: v.pct + '%',
            background: `linear-gradient(90deg, ${v.color}88, ${v.color})`,
            boxShadow: `0 0 8px ${v.color}66`,
          }"
        ></div>
      </div>
      <span class="v-num">{{ v.cur }}/{{ v.max }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 状态 = computed(() => store.data.状态);

function pct(cur: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((cur / (max || 1)) * 100)));
}

const vitals = computed(() => {
  const s = 状态.value;
  return [
    { label: '生命', icon: 'fa-solid fa-heart', color: '#f87171', cur: s.生命, max: s.生命上限, pct: pct(s.生命, s.生命上限) },
    { label: '能量', icon: 'fa-solid fa-bolt', color: '#38bdf8', cur: s.能量, max: s.能量上限, pct: pct(s.能量, s.能量上限) },
    { label: '饱食', icon: 'fa-solid fa-utensils', color: '#fb923c', cur: s.饱食度, max: 100, pct: pct(s.饱食度, 100) },
    { label: '精力', icon: 'fa-solid fa-battery-three-quarters', color: '#34d399', cur: s.精力, max: 100, pct: pct(s.精力, 100) },
  ];
});
</script>

<style scoped>
.vitals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 14px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.vital {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.v-icon {
  width: 13px;
  text-align: center;
  font-size: 11px;
}
.v-label {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--txt-dim);
}
.v-bar {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: var(--bg-inset);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}
.v-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.v-num {
  flex-shrink: 0;
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--txt-dim);
}

@media (max-width: 460px) {
  .vitals {
    grid-template-columns: 1fr;
  }
}
</style>
