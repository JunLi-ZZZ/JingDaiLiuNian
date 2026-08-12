<template>
  <div class="bag">
    <div v-if="条目.length === 0" class="empty">背包空空如也</div>
    <div class="bag-grid">
      <article
        v-for="it in 条目"
        :key="it.名称"
        class="bag-card"
        :class="{ unusable: !it.可否使用 }"
        :style="tierVars(it.品阶)"
      >
        <div class="bg-head">
          <span class="bg-icon"><i :class="iconOf(it.类型)"></i></span>
          <span class="bg-name">{{ it.名称 }}</span>
          <span v-if="it.数量 > 1" class="bg-count">×{{ it.数量 }}</span>
        </div>
        <div class="bg-tags">
          <TierTag :品阶="it.品阶" />
          <span v-if="it.类型" class="bg-type">{{ it.类型 }}</span>
          <span v-if="!it.可否使用" class="bg-ban">不可用</span>
        </div>
        <p v-if="it.效果" class="bg-effect"><i class="fa-solid fa-sparkles"></i>{{ it.效果 }}</p>
        <p v-if="it.描述" class="bg-desc">{{ it.描述 }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { tierVars } from '../tier';
import TierTag from './TierTag.vue';

const store = useDataStore();
const 条目 = computed(() => Object.entries(store.data.背包).map(([名称, v]) => ({ 名称, ...v })));

const TYPE_ICONS: Record<string, string> = {
  武器: 'fa-solid fa-khanda',
  防具: 'fa-solid fa-shield-halved',
  饰品: 'fa-solid fa-gem',
  消耗品: 'fa-solid fa-flask',
  材料: 'fa-solid fa-cubes',
  道具: 'fa-solid fa-scroll',
};
const iconOf = (类型: string) => TYPE_ICONS[类型] ?? 'fa-solid fa-box-open';
</script>

<style scoped>
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.bag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 8px;
}
.bag-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px 10px;
  background:
    linear-gradient(150deg, color-mix(in srgb, var(--tier) 10%, transparent), transparent 45%),
    var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--tier) 42%, transparent);
  border-radius: 9px;
}
.bag-card.unusable {
  filter: grayscale(0.9);
  opacity: 0.55;
}
.bg-head {
  display: flex;
  align-items: center;
  gap: 7px;
}
.bg-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tier) 16%, transparent);
  color: var(--tier);
  font-size: 11px;
}
.bg-name {
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bg-count {
  margin-left: auto;
  flex-shrink: 0;
  font-family: var(--font-num);
  font-size: 11px;
  color: var(--txt-dim);
}
.bg-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bg-type {
  font-size: 10px;
  color: var(--txt-faint);
}
.bg-ban {
  margin-left: auto;
  font-size: 10px;
  color: var(--hp);
}
.bg-effect {
  font-size: 11px;
  color: var(--stam);
}
.bg-effect i {
  margin-right: 4px;
  font-size: 10px;
}
.bg-desc {
  font-size: 11px;
  color: var(--txt-faint);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
