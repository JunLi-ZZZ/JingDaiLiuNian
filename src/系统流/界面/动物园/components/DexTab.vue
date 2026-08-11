<template>
  <div class="dex">
    <div class="dex-progress">
      <span class="dp-text"><i class="fa-solid fa-book-open"></i>收集进度 {{ 已收集 }}/{{ 总数 }}</span>
      <div class="dp-track">
        <div class="dp-fill" :style="{ width: (已收集 / 总数) * 100 + '%' }"></div>
      </div>
      <span class="dp-pct">{{ Math.round((已收集 / 总数) * 100) }}%</span>
    </div>

    <section v-for="g in 分组" :key="g.类别" class="dex-group">
      <h4 class="dg-title" :style="{ color: catMeta(g.类别).color }">
        <i :class="catMeta(g.类别).icon"></i>{{ g.类别 }}
        <span class="dg-count">{{ g.已获得 }}/{{ g.列表.length }}</span>
        <span v-if="g.锁定" class="dg-lock"><i class="fa-solid fa-lock"></i>建造「异种展馆」后解锁</span>
      </h4>
      <div class="dg-grid">
        <div
          v-for="b in g.列表"
          :key="b.名称"
          class="dex-cell"
          :class="{ locked: !b.已拥有 }"
          :style="b.已拥有 ? tierVars(b.品阶) : {}"
          :title="b.已拥有 ? b.兽形 : '尚未收集'"
        >
          <i :class="catMeta(b.类别).icon"></i>
          <span class="dc-name">{{ b.已拥有 ? b.名称 : '？？？' }}</span>
          <span v-if="b.已拥有" class="dc-owned">×{{ b.持有数 }}</span>
          <TierTag v-if="b.已拥有" :品阶="b.品阶" />
          <span v-else class="dc-lock">未收集</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { BEAST_POOL } from '../mock';
import { tierVars } from '../../shared/tier';
import { catMeta } from '../category';
import TierTag from '../../shared/TierTag.vue';

const store = useZooStore();

const 持有统计 = computed(() => {
  const map: Record<string, number> = {};
  for (const 兽 of Object.values(store.data.兽员)) {
    const 条目 = BEAST_POOL.find(b => b.种族 === 兽.种族 || b.名称 === 兽.种族);
    const key = 条目?.名称 ?? 兽.种族;
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
});

const 分组 = computed(() => {
  return store.所有类别
    .map(类别 => {
      const 锁定 = 类别 === '异种' && !store.data.解锁异种;
      const 列表 = BEAST_POOL.filter(b => b.类别 === 类别).map(b => ({
        ...b,
        已拥有: !锁定 && (持有统计.value[b.名称] ?? 0) > 0,
        持有数: 持有统计.value[b.名称] ?? 0,
      }));
      return { 类别, 列表, 已获得: 列表.filter(b => b.已拥有).length, 锁定 };
    })
    .filter(g => g.列表.length > 0);
});

const 总数 = BEAST_POOL.length;
const 已收集 = computed(() => 分组.value.reduce((s, g) => s + g.已获得, 0));
</script>

<style scoped>
.dex {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dex-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px solid var(--pline);
  border-radius: 12px 16px 12px 16px;
}
.dp-text {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--ptxt-dim);
}
.dp-text i {
  margin-right: 6px;
  color: #4a6b3a;
}
.dp-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--pinset);
  overflow: hidden;
}
.dp-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4a6b3a, #9dc88d);
  transition: width 0.4s;
}
.dp-pct {
  font-family: var(--font-num);
  font-size: 12px;
  color: #4a6b3a;
}
.dg-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 2px;
  margin-bottom: 7px;
}
.dg-count {
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--txt-faint);
}
.dg-lock {
  margin-left: auto;
  font-size: 10px;
  font-weight: 400;
  color: var(--txt-faint);
  letter-spacing: 0;
}
.dg-lock i {
  margin-right: 4px;
}
.dg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.dex-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 9px;
  color: var(--ptxt);
  background:
    radial-gradient(80% 50% at 50% 0%, color-mix(in srgb, var(--tier) 14%, transparent), transparent),
    linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px solid color-mix(in srgb, var(--tier) 45%, var(--pline));
  border-radius: 12px 16px 12px 16px;
}
.dex-cell > i {
  font-size: 22px;
  color: var(--tier);
  text-shadow: 0 0 10px color-mix(in srgb, var(--tier) 60%, transparent);
}
.dc-name {
  font-size: 12px;
  font-weight: 700;
}
.dc-owned {
  position: absolute;
  top: 5px;
  right: 7px;
  font-family: var(--font-num);
  font-size: 9px;
  color: var(--ptxt-dim);
}
.dex-cell.locked {
  border: 1px dashed var(--pline);
  background: transparent;
  color: var(--ptxt);
  opacity: 0.6;
}
.dex-cell.locked > i {
  color: var(--ptxt-faint);
  text-shadow: none;
  filter: brightness(0.55);
}
.dex-cell.locked .dc-name {
  color: var(--ptxt-faint);
  font-weight: 400;
}
.dc-lock {
  font-size: 9px;
  color: var(--ptxt-faint);
}
</style>
