<template>
  <div class="sys-panel">
    <div class="top-glow"></div>
    <HeaderBar />
    <LevelCard />
    <VitalBars />
    <AttrGrid />

    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: 当前页 === t.key }"
        @click="当前页 = t.key"
      >
        <i :class="t.icon"></i>{{ t.label }}
        <em v-if="t.count" class="tab-count">{{ t.count }}</em>
      </button>
    </nav>

    <section class="tab-body">
      <KeepAlive>
        <component :is="当前组件" />
      </KeepAlive>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from './store';
import HeaderBar from './components/HeaderBar.vue';
import LevelCard from './components/LevelCard.vue';
import VitalBars from './components/VitalBars.vue';
import AttrGrid from './components/AttrGrid.vue';
import SkillList from './components/SkillList.vue';
import BagGrid from './components/BagGrid.vue';
import TaskList from './components/TaskList.vue';
import NpcList from './components/NpcList.vue';
import EquipSlots from './components/EquipSlots.vue';
import HostInfo from './components/HostInfo.vue';

const store = useDataStore();

const 当前页 = ref('技能');

const tabs = computed(() => [
  { key: '技能', label: '技能', icon: 'fa-solid fa-burst', count: Object.keys(store.data.技能).length },
  { key: '背包', label: '背包', icon: 'fa-solid fa-briefcase', count: Object.keys(store.data.背包).length },
  { key: '任务', label: '任务', icon: 'fa-solid fa-list-check', count: Object.keys(store.data.任务).length },
  { key: '人物', label: '人物', icon: 'fa-solid fa-user-group', count: Object.keys(store.data.人物).length },
  { key: '装备', label: '装备', icon: 'fa-solid fa-shield-halved', count: 0 },
  { key: '宿主', label: '宿主', icon: 'fa-regular fa-id-card', count: 0 },
]);

const TAB_COMPONENTS: Record<string, any> = {
  技能: SkillList,
  背包: BagGrid,
  任务: TaskList,
  人物: NpcList,
  装备: EquipSlots,
  宿主: HostInfo,
};
const 当前组件 = computed(() => TAB_COMPONENTS[当前页.value] ?? SkillList);
</script>

<style scoped>
.sys-panel {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(56, 189, 248, 0.09), transparent 60%),
    linear-gradient(165deg, #0d1420, #090c13 70%);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}
.top-glow {
  position: absolute;
  top: 0;
  left: 8%;
  right: 8%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), var(--violet), transparent);
  opacity: 0.8;
  pointer-events: none;
}
.tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--line);
}
.tab-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--txt-dim);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s;
}
.tab-btn i {
  font-size: 11px;
}
.tab-btn:hover {
  color: var(--txt);
}
.tab-btn.active {
  color: var(--cyan);
  border-bottom-color: var(--cyan);
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.7);
}
.tab-count {
  font-style: normal;
  font-family: var(--font-num);
  font-size: 10px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--bg-inset);
  border: 1px solid var(--line);
}
.tab-btn.active .tab-count {
  border-color: var(--line-strong);
}
.tab-body {
  min-height: 160px;
}
</style>
