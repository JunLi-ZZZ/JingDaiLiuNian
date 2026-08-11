<template>
  <header class="zoo-head">
    <div class="zh-top">
      <div class="zh-sign">
        <i class="fa-solid fa-leaf"></i>
        <span class="zh-title">{{ data.园名 }}</span>
        <span class="zh-lv">园区 Lv.{{ data.园区等级 }}</span>
      </div>
      <div class="zh-gem" title="愿力：游客目睹超凡生物时心生敬畏凝成的力量">
        <i class="fa-solid fa-sparkles"></i>
        <b>{{ data.愿力.toLocaleString() }}</b>
        <span>愿力</span>
      </div>
    </div>
    <div class="zh-stats">
      <span class="zh-item"><i class="fa-solid fa-person-walking"></i>今日游客 {{ data.今日游客 }}/{{ data.游客上限 }}</span>
      <span class="zh-item"><i class="fa-solid fa-coins"></i>今日收益 +{{ data.今日收益 }}</span>
      <span class="zh-item"><i class="fa-solid fa-gauge-high"></i>全园产率 {{ store.总产率 }}/时</span>
      <span v-if="!data.解锁异种" class="zh-item lock"><i class="fa-solid fa-lock"></i>异种未解锁</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';

const store = useZooStore();
const data = computed(() => store.data);
</script>

<style scoped>
.zoo-head {
  padding: 2px 2px 10px;
  border-bottom: 1px dashed rgba(157, 200, 141, 0.3);
}
.zh-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
/* 木质园牌 */
.zh-sign {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding: 9px 20px 10px;
  background:
    linear-gradient(160deg, rgba(255, 235, 200, 0.12), transparent 40%),
    linear-gradient(170deg, #6b4f2e, #4d3a1d 75%);
  border: 1px solid #8a6b3f;
  border-radius: 8px 14px 8px 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 235, 200, 0.22),
    0 3px 8px rgba(0, 0, 0, 0.45);
}
/* 木牌钉 */
.zh-sign::before,
.zh-sign::after {
  content: '';
  position: absolute;
  top: 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #d8c9a3, #7a6238);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}
.zh-sign::before {
  left: 7px;
}
.zh-sign::after {
  right: 7px;
}
.zh-sign > i {
  color: #b9d99a;
  font-size: 13px;
}
.zh-title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 5px;
  color: #f7efdc;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}
.zh-lv {
  font-size: 10px;
  color: #f0d9a8;
  border: 1px solid rgba(240, 217, 168, 0.5);
  border-radius: 4px;
  padding: 0 6px;
  line-height: 16px;
  white-space: nowrap;
}
.zh-gem {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 14px;
  border: 1px solid rgba(217, 164, 65, 0.5);
  border-radius: 999px;
  background: rgba(217, 164, 65, 0.1);
}
.zh-gem i {
  color: var(--gold);
  font-size: 11px;
}
.zh-gem b {
  font-family: var(--font-num);
  font-size: 15px;
  color: var(--gold);
  text-shadow: 0 0 10px rgba(217, 164, 65, 0.5);
}
.zh-gem span {
  font-size: 10px;
  color: var(--txt-dim);
}
.zh-stats {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 11px;
  color: var(--txt-dim);
}
.zh-item i {
  margin-right: 5px;
  color: var(--acc);
  opacity: 0.85;
}
.zh-item.lock {
  color: var(--txt-faint);
}
.zh-item.lock i {
  color: var(--txt-faint);
}
</style>
