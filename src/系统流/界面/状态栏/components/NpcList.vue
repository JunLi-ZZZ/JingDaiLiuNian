<template>
  <div class="npcs">
    <div v-if="条目.length === 0" class="empty">暂无人物</div>
    <article v-for="p in 条目" :key="p.名称" class="npc-row">
      <span class="np-avatar" :style="{ borderColor: 好感颜色(p.好感度) + '88' }">{{ p.名称.charAt(0) }}</span>
      <div class="np-main">
        <div class="np-line1">
          <span class="np-name">{{ p.名称 }}</span>
          <span v-if="p.关系" class="np-rel">{{ p.关系 }}</span>
        </div>
        <div class="np-line2">
          <span v-if="p.身份">{{ p.身份 }}</span>
          <span v-if="p.当前状态" class="np-status">· {{ p.当前状态 }}</span>
        </div>
        <p v-if="p.备注" class="np-note">{{ p.备注 }}</p>
      </div>
      <div class="np-fav">
        <span class="np-fav-num" :style="{ color: 好感颜色(p.好感度) }">{{ p.好感度 }}</span>
        <div class="np-bar">
          <div
            class="np-fill"
            :style="{
              width: 好感宽度(p.好感度) + '%',
              background: 好感颜色(p.好感度),
              boxShadow: `0 0 6px ${好感颜色(p.好感度)}88`,
            }"
          ></div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 条目 = computed(() =>
  Object.entries(store.data.人物)
    .map(([名称, v]) => ({ 名称, ...v }))
    .sort((a, b) => b.好感度 - a.好感度),
);

function 好感颜色(v: number): string {
  if (v < 0) return '#f43f5e';
  if (v < 20) return '#94a3b8';
  if (v < 40) return '#7dd3fc';
  if (v < 60) return '#38bdf8';
  if (v < 80) return '#34d399';
  return '#f0abfc';
}
const 好感宽度 = (v: number) => Math.max(0, Math.min(100, Math.abs(v)));
</script>

<style scoped>
.npcs {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.npc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 9px;
}
.np-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 50%;
  background: var(--bg-inset);
  font-size: 14px;
  font-weight: 700;
}
.np-main {
  flex: 1;
  min-width: 0;
}
.np-line1 {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.np-name {
  font-size: 13px;
  font-weight: 700;
}
.np-rel {
  font-size: 10px;
  color: var(--violet);
}
.np-line2 {
  font-size: 11px;
  color: var(--txt-faint);
}
.np-note {
  margin-top: 2px;
  font-size: 11px;
  color: var(--txt-dim);
  font-style: italic;
}
.np-fav {
  flex-shrink: 0;
  width: 74px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.np-fav-num {
  font-family: var(--font-num);
  font-size: 14px;
  font-weight: 700;
}
.np-bar {
  width: 100%;
  height: 5px;
  border-radius: 3px;
  background: var(--bg-inset);
  overflow: hidden;
}
.np-fill {
  height: 100%;
  border-radius: 3px;
}
</style>
