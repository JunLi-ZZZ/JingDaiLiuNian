<template>
  <section class="attrs">
    <div v-for="a in 属性列表" :key="a.label" class="attr-cell">
      <i :class="a.icon"></i>
      <span class="attr-num">{{ a.value }}</span>
      <span class="attr-label">{{ a.label }}</span>
    </div>
    <div class="attr-cell free" :class="{ active: 属性.自由属性点 > 0 }">
      <i class="fa-solid fa-plus"></i>
      <span class="attr-num">{{ 属性.自由属性点 }}</span>
      <span class="attr-label">自由点</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 属性 = computed(() => store.data.属性);

const ATTR_DEFS = [
  { key: '力量', label: '力量', icon: 'fa-solid fa-dumbbell' },
  { key: '敏捷', label: '敏捷', icon: 'fa-solid fa-wind' },
  { key: '体质', label: '体质', icon: 'fa-solid fa-shield-halved' },
  { key: '智力', label: '智力', icon: 'fa-solid fa-brain' },
  { key: '精神', label: '精神', icon: 'fa-solid fa-eye' },
  { key: '魅力', label: '魅力', icon: 'fa-solid fa-heart' },
  { key: '幸运', label: '幸运', icon: 'fa-solid fa-clover' },
] as const;

const 属性列表 = computed(() =>
  ATTR_DEFS.map(d => ({ ...d, value: (属性.value as Record<string, number>)[d.key] ?? 0 })),
);
</script>

<style scoped>
.attrs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}
.attr-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px 6px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.attr-cell i {
  font-size: 11px;
  color: var(--cyan);
  opacity: 0.85;
}
.attr-num {
  font-family: var(--font-num);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}
.attr-label {
  font-size: 10px;
  color: var(--txt-dim);
}
.attr-cell.free {
  border-style: dashed;
  border-color: rgba(251, 191, 36, 0.35);
}
.attr-cell.free i,
.attr-cell.free .attr-num {
  color: #fbbf24;
}
.attr-cell.free.active {
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(251, 191, 36, 0);
  }
  50% {
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.35);
  }
}
</style>
