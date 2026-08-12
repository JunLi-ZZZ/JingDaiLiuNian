<template>
  <section class="lv-card">
    <div class="lv-badge">
      <span class="lv-num">{{ 系统.等级 }}</span>
      <span class="lv-label">LEVEL</span>
    </div>
    <div class="lv-main">
      <div class="lv-row">
        <span class="host-name">{{ 宿主.姓名 || '未命名宿主' }}</span>
        <span v-if="系统.称号" class="title-chip">「{{ 系统.称号 }}」</span>
      </div>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: 经验百分比 + '%' }"></div>
        <span class="exp-text">EXP {{ 系统.经验 }} / {{ 系统.升级所需经验 }}</span>
      </div>
    </div>
    <div class="lv-side">
      <span class="pill"><i class="fa-solid fa-coins"></i>{{ 积分文本 }}</span>
      <span class="pill"><i class="fa-solid fa-ticket"></i>抽奖 ×{{ 系统.抽奖次数 }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 系统 = computed(() => store.data.系统);
const 宿主 = computed(() => store.data.宿主);

const 经验百分比 = computed(() => {
  const need = 系统.value.升级所需经验 || 1;
  return Math.min(100, Math.round((系统.value.经验 / need) * 100));
});
const 积分文本 = computed(() => 系统.value.积分.toLocaleString());
</script>

<style scoped>
.lv-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.lv-badge {
  flex-shrink: 0;
  width: 58px;
  height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, rgba(56, 189, 248, 0.16), rgba(167, 139, 250, 0.12));
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.18) inset;
}
.lv-num {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 12px var(--cyan);
}
.lv-label {
  margin-top: 3px;
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--txt-faint);
}
.lv-main {
  flex: 1;
  min-width: 0;
}
.lv-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 7px;
}
.host-name {
  font-size: 16px;
  font-weight: 700;
}
.title-chip {
  font-size: 11px;
  color: var(--violet);
  text-shadow: 0 0 8px rgba(167, 139, 250, 0.6);
}
.exp-bar {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: var(--bg-inset);
  border: 1px solid var(--line);
  overflow: hidden;
}
.exp-fill {
  height: 100%;
  border-radius: 7px;
  background: linear-gradient(90deg, #1d6fb8, var(--cyan), var(--violet));
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.55);
  transition: width 0.4s ease;
}
.exp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-num);
  font-size: 9px;
  letter-spacing: 1px;
  color: #eaf6ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.lv-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.pill {
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-inset);
  font-size: 11px;
  font-family: var(--font-num);
  color: var(--txt-dim);
  white-space: nowrap;
}
.pill i {
  margin-right: 5px;
  color: var(--cyan);
}

@media (max-width: 460px) {
  .lv-side {
    flex-direction: row;
    width: 100%;
    justify-content: flex-end;
  }
  .lv-card {
    flex-wrap: wrap;
  }
}
</style>
