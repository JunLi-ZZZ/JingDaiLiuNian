<template>
  <div class="skill-list">
    <div v-if="条目.length === 0" class="empty">暂无技能</div>
    <article v-for="s in 条目" :key="s.名称" class="skill-card" :style="tierVars(s.品阶)">
      <div class="sk-head">
        <span class="sk-name">{{ s.名称 }}</span>
        <span class="sk-lv">Lv.{{ s.等级 }}</span>
        <TierTag :品阶="s.品阶" />
        <span v-if="s.类型" class="sk-type">{{ s.类型 }}</span>
      </div>
      <p v-if="s.描述" class="sk-desc">{{ s.描述 }}</p>
      <div class="sk-meta">
        <span><i class="fa-solid fa-bolt"></i>{{ s.消耗 || '无消耗' }}</span>
        <span><i class="fa-regular fa-clock"></i>{{ s.冷却 || '无冷却' }}</span>
        <span class="sk-mastery">
          熟练度
          <span class="m-bar"><span class="m-fill" :style="{ width: 熟练度百分比(s.熟练度) + '%' }"></span></span>
          <b>{{ s.熟练度 }}</b>
        </span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { tierVars } from '../tier';
import TierTag from './TierTag.vue';

const store = useDataStore();
const 条目 = computed(() => Object.entries(store.data.技能).map(([名称, v]) => ({ 名称, ...v })));

const 熟练度百分比 = (v: number) => Math.max(0, Math.min(100, v));
</script>

<style scoped>
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.skill-card {
  position: relative;
  padding: 10px 12px 10px 14px;
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--tier) 38%, transparent);
  border-radius: 9px;
  overflow: hidden;
}
.skill-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--tier), var(--tier-deep));
  box-shadow: 0 0 8px var(--tier);
}
.sk-head {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
}
.sk-name {
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.sk-lv {
  font-family: var(--font-num);
  font-size: 11px;
  color: var(--cyan);
}
.sk-type {
  margin-left: auto;
  font-size: 10px;
  color: var(--txt-faint);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0 6px;
  line-height: 16px;
}
.sk-desc {
  margin-top: 5px;
  font-size: 12px;
  color: var(--txt-dim);
}
.sk-meta {
  margin-top: 7px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 11px;
  color: var(--txt-faint);
}
.sk-meta i {
  margin-right: 4px;
  opacity: 0.8;
}
.sk-mastery {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sk-mastery b {
  font-family: var(--font-num);
  font-weight: 600;
  color: var(--txt-dim);
}
.m-bar {
  width: 52px;
  height: 5px;
  border-radius: 3px;
  background: var(--bg-inset);
  overflow: hidden;
}
.m-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--tier-deep), var(--tier));
}
</style>
