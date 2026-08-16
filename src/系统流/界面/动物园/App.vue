<template>
  <div class="zoo-panel">
    <ZooHeader />

    <div class="zoo-workspace">
      <nav class="tabs" aria-label="动物园功能导航">
        <div class="tabs-caption">
          <span>REGISTRY</span>
          <b>馆藏索引</b>
        </div>
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: 当前页 === tab.key }"
          :aria-current="当前页 === tab.key ? 'page' : undefined"
          :title="tab.label"
          @click="当前页 = tab.key"
        >
          <span class="tab-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <i :class="tab.icon"></i>
          <span class="tab-label">{{ tab.label }}</span>
          <em v-if="tab.count" class="tab-count">{{ tab.count }}</em>
        </button>
        <div class="tabs-footer">
          <i class="fa-solid fa-shield-halved"></i>
          <span>CATALOGUE<br />ONLINE</span>
        </div>
      </nav>

      <main class="zoo-content">
        <header class="section-head">
          <div>
            <span class="section-code">{{ 当前信息.code }}</span>
            <h2>{{ 当前信息.title }}</h2>
          </div>
          <span class="section-status"> <i class="fa-solid fa-circle"></i>{{ 当前信息.status }} </span>
        </header>

        <section class="tab-body">
          <KeepAlive>
            <component :is="当前组件" />
          </KeepAlive>
        </section>
      </main>
    </div>

    <SummonResult />
    <Transition name="toast">
      <div v-if="store.提示" class="toast"><i class="fa-solid fa-check"></i>{{ store.提示 }}</div>
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
  { key: '兽员', label: '兽员', icon: 'fa-solid fa-shield-cat', count: Object.keys(store.data.兽员).length },
  { key: '图鉴', label: '图鉴', icon: 'fa-solid fa-table-cells-large', count: 0 },
  { key: '召唤', label: '召唤', icon: 'fa-solid fa-wand-sparkles', count: 0 },
  { key: '孵化', label: '孵化', icon: 'fa-solid fa-egg', count: store.data.蛋.length },
  { key: '食物', label: '补给', icon: 'fa-solid fa-flask', count: Object.keys(store.data.食物).length },
  { key: '商店', label: '采购', icon: 'fa-solid fa-box-archive', count: 0 },
  { key: '设置', label: '管制', icon: 'fa-solid fa-sliders', count: 0 },
]);

const 页面信息: Record<string, { code: string; title: string; status: string }> = {
  兽员: { code: 'COLLECTION / 01', title: '在册兽员', status: '档案同步' },
  图鉴: { code: 'COLLECTION / 02', title: '物种图鉴', status: '持续收录' },
  召唤: { code: 'OPERATIONS / 03', title: '召唤协议', status: '概率受控' },
  孵化: { code: 'OPERATIONS / 04', title: '孵化舱室', status: '环境稳定' },
  食物: { code: 'LOGISTICS / 05', title: '补给库存', status: '库存在线' },
  商店: { code: 'LOGISTICS / 06', title: '采购货架', status: '实时轮换' },
  设置: { code: 'CONTROL / 07', title: '高级管制', status: '权限锁定' },
};

const 当前信息 = computed(() => 页面信息[当前页.value] ?? 页面信息.兽员);

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
