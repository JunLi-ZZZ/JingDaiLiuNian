<template>
  <div class="tasks">
    <div v-if="分组.length === 0" class="empty">暂无任务</div>
    <section v-for="g in 分组" :key="g.状态" class="task-group">
      <h4 class="tg-title" :style="{ color: g.color }">
        <i :class="g.icon"></i>{{ g.状态 }}<span class="tg-count">{{ g.列表.length }}</span>
      </h4>
      <article v-for="t in g.列表" :key="t.名称" class="task-card" :style="{ '--st': g.color }">
        <div class="tk-head">
          <span class="tk-name">{{ t.名称 }}</span>
          <span class="tk-type">{{ t.类型 }}</span>
          <span v-if="t.限时" class="tk-limit" :class="{ overdue: t.状态 === '失败' }">
            <i class="fa-regular fa-hourglass-half"></i>{{ t.限时 }}
          </span>
        </div>
        <p v-if="t.描述" class="tk-desc">{{ t.描述 }}</p>
        <div class="tk-row">
          <span v-if="t.要求" class="tk-req"><i class="fa-solid fa-bullseye"></i>{{ t.要求 }}</span>
          <span v-if="t.进度" class="tk-progress">{{ t.进度 }}</span>
        </div>
        <div class="tk-row">
          <span v-if="t.奖励" class="tk-reward"><i class="fa-solid fa-gift"></i>{{ t.奖励 }}</span>
          <span v-if="t.惩罚" class="tk-punish"><i class="fa-solid fa-triangle-exclamation"></i>{{ t.惩罚 }}</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

const GROUP_ORDER = [
  { 状态: '进行中', color: '#fbbf24', icon: 'fa-solid fa-spinner' },
  { 状态: '已完成', color: '#34d399', icon: 'fa-solid fa-circle-check' },
  { 状态: '失败', color: '#6e7686', icon: 'fa-solid fa-circle-xmark' },
];

const 分组 = computed(() => {
  const all = Object.entries(store.data.任务).map(([名称, v]) => ({ 名称, ...v }));
  const groups: { 状态: string; color: string; icon: string; 列表: typeof all }[] = [];
  for (const def of GROUP_ORDER) {
    const 列表 = all.filter(t => t.状态 === def.状态);
    if (列表.length > 0) groups.push({ ...def, 列表 });
  }
  // 未归入标准状态的（防止后续出现新状态）排在最后
  const known = GROUP_ORDER.map(d => d.状态);
  const rest = all.filter(t => !known.includes(t.状态));
  if (rest.length > 0) {
    groups.push({ 状态: '其他', color: '#38bdf8', icon: 'fa-solid fa-list', 列表: rest });
  }
  return groups;
});
</script>

<style scoped>
.tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.tg-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
  font-size: 12px;
  letter-spacing: 2px;
}
.tg-count {
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--txt-faint);
}
.task-group {
  display: flex;
  flex-direction: column;
}
.task-card {
  position: relative;
  padding: 9px 12px 9px 14px;
  margin-bottom: 7px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 9px;
}
.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 9px 0 0 9px;
  background: var(--st);
  box-shadow: 0 0 8px color-mix(in srgb, var(--st) 70%, transparent);
}
.tk-head {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.tk-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.tk-type {
  font-size: 10px;
  color: var(--txt-dim);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0 6px;
  line-height: 16px;
}
.tk-limit {
  margin-left: auto;
  font-size: 10px;
  color: var(--food);
}
.tk-limit.overdue {
  color: var(--hp);
}
.tk-limit i {
  margin-right: 4px;
}
.tk-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--txt-dim);
}
.tk-row {
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px 14px;
  font-size: 11px;
}
.tk-row i {
  margin-right: 4px;
}
.tk-req {
  color: var(--txt-dim);
}
.tk-progress {
  font-family: var(--font-num);
  color: var(--cyan);
}
.tk-reward {
  color: var(--stam);
}
.tk-punish {
  color: var(--hp);
}
</style>
