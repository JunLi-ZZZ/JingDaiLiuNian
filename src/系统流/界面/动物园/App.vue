<template>
  <div class="zoo-panel">
    <div class="top-glow"></div>
    <ZooHeader />

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

    <SummonResult />
    <Transition name="toast">
      <div v-if="store.提示" class="toast">{{ store.提示 }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from './store';
import ZooHeader from './components/ZooHeader.vue';
import BeastTab from './components/BeastTab.vue';
import DexTab from './components/DexTab.vue';
import SummonTab from './components/SummonTab.vue';
import IncubateTab from './components/IncubateTab.vue';
import FoodTab from './components/FoodTab.vue';
import ShopTab from './components/ShopTab.vue';
import SettingsTab from './components/SettingsTab.vue';
import SummonResult from './components/SummonResult.vue';

const store = useZooStore();
const 当前页 = ref('兽员');

const tabs = computed(() => [
  { key: '兽员', label: '兽员', icon: 'fa-solid fa-paw', count: Object.keys(store.data.兽员).length },
  { key: '图鉴', label: '图鉴', icon: 'fa-solid fa-book-open', count: 0 },
  { key: '召唤', label: '召唤', icon: 'fa-solid fa-wand-magic-sparkles', count: 0 },
  { key: '孵化', label: '孵化', icon: 'fa-solid fa-egg', count: store.data.蛋.length },
  { key: '食物', label: '食物', icon: 'fa-solid fa-bowl-food', count: Object.keys(store.data.食物).length },
  { key: '商店', label: '商店', icon: 'fa-solid fa-store', count: 0 },
  { key: '设置', label: '设置', icon: 'fa-solid fa-gear', count: 0 },
]);

const TAB_COMPONENTS: Record<string, any> = {
  兽员: BeastTab,
  图鉴: DexTab,
  召唤: SummonTab,
  孵化: IncubateTab,
  食物: FoodTab,
  商店: ShopTab,
  设置: SettingsTab,
};
const 当前组件 = computed(() => TAB_COMPONENTS[当前页.value] ?? BeastTab);
</script>

<style scoped>
.zoo-panel {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background:
    radial-gradient(100% 50% at 50% 0%, rgba(212, 175, 55, 0.08), transparent 55%),
    radial-gradient(80px 80px at 90% 12%, rgba(155, 123, 167, 0.06), transparent 65%),
    radial-gradient(60px 60px at 8% 85%, rgba(139, 111, 71, 0.08), transparent 70%),
    linear-gradient(135deg, #2a1b2e, #1a0f1e 75%);
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  min-height: 480px;
}
.top-glow {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
  opacity: 0.8;
  pointer-events: none;
}
/* 书脊式 Tab */
.tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(139, 111, 71, 0.3);
}
.tab-btn {
  flex-shrink: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.08), transparent);
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--txt-dim);
  font-size: 12px;
  font-family: var(--font-title);
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.25s;
  clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%);
}
.tab-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(212, 175, 55, 0.12));
  opacity: 0;
  transition: opacity 0.25s;
}
.tab-btn i {
  font-size: 11px;
  filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.3));
}
.tab-btn:hover {
  color: var(--txt);
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.15), rgba(139, 111, 71, 0.08));
}
.tab-btn:hover::before {
  opacity: 1;
}
.tab-btn.active {
  color: var(--gold);
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.22), rgba(139, 111, 71, 0.12));
  border-bottom-color: var(--gold);
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.25),
    0 2px 8px rgba(212, 175, 55, 0.2);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
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
  background: rgba(212, 175, 55, 0.15);
}
.tab-body {
  min-height: 200px;
}
.toast {
  position: fixed;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
  padding: 8px 18px;
  background: #f3ecd9;
  border: 1px solid var(--pline-strong);
  border-radius: 999px 999px 999px 12px;
  font-size: 12px;
  color: var(--ptxt);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 300;
  white-space: nowrap;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
