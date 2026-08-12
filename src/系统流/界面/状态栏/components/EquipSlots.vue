<template>
  <div class="equips">
    <div v-for="slot in 槽位" :key="slot.label" class="eq-cell" :class="{ empty: !slot.物品名 }" :style="slot.vars">
      <i :class="slot.icon" class="eq-icon"></i>
      <span class="eq-label">{{ slot.label }}</span>
      <span class="eq-name">{{ slot.物品名 || '未装备' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { tierVars } from '../tier';

const store = useDataStore();

const SLOT_DEFS = [
  { key: '武器', label: '武器', icon: 'fa-solid fa-khanda' },
  { key: '头部', label: '头部', icon: 'fa-solid fa-helmet-safety' },
  { key: '衣服', label: '衣服', icon: 'fa-solid fa-shirt' },
  { key: '鞋子', label: '鞋子', icon: 'fa-solid fa-shoe-prints' },
  { key: '饰品', label: '饰品', icon: 'fa-solid fa-gem' },
] as const;

// 装备栏只存物品名；品阶从背包里反查，让装备槽也能用品阶色
const 槽位 = computed(() => {
  const 装备 = store.data.装备 as Record<string, string>;
  const 背包 = store.data.背包;
  return SLOT_DEFS.map(d => {
    const 物品名 = 装备[d.key] || '';
    const 品阶 = 物品名 ? (背包[物品名]?.品阶 ?? '普通') : '';
    return { ...d, 物品名, vars: 物品名 ? tierVars(品阶) : {} };
  });
});
</script>

<style scoped>
.equips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.eq-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 6px 8px;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--tier, #38bdf8) 9%, transparent), transparent 55%),
    var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--tier, #38bdf8) 38%, transparent);
  border-radius: 9px;
}
.eq-cell.empty {
  opacity: 0.45;
}
.eq-icon {
  font-size: 15px;
  color: var(--tier, var(--cyan));
}
.eq-label {
  font-size: 10px;
  color: var(--txt-faint);
  letter-spacing: 2px;
}
.eq-name {
  font-size: 12px;
  font-weight: 700;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.eq-cell.empty .eq-name {
  font-weight: 400;
  color: var(--txt-faint);
}
</style>
