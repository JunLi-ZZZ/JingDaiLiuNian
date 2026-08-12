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
  border-bottom: 1px solid rgba(139, 111, 71, 0.35);
  box-shadow: 0 1px 0 rgba(212, 175, 55, 0.1);
}
.zh-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
/* 炼金术封印圆环园牌 */
.zh-sign {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding: 10px 22px 11px;
  background:
    radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08), transparent 70%),
    linear-gradient(135deg, #2a1b2e, #3d2a42);
  border: 2px solid #8b6f47;
  border-radius: 6px;
  box-shadow:
    inset 0 0 20px rgba(212, 175, 55, 0.12),
    inset 0 1px 0 rgba(212, 175, 55, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.6);
}
/* 封印圆环装饰 */
.zh-sign::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: 1.5px solid rgba(212, 175, 55, 0.5);
  border-radius: 50%;
  background:
    radial-gradient(circle at center, transparent 30%, rgba(212, 175, 55, 0.15) 30%, transparent 50%),
    conic-gradient(from 45deg, transparent 0deg, rgba(212, 175, 55, 0.2) 90deg, transparent 180deg);
}
/* 右侧符文点缀 */
.zh-sign::after {
  content: '⬢';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: rgba(212, 175, 55, 0.4);
  text-shadow: 0 0 6px rgba(212, 175, 55, 0.3);
}
.zh-sign > i {
  color: #d4af37;
  font-size: 13px;
  filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.5));
}
.zh-title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 8px;
  color: #f5ead6;
  text-transform: uppercase;
  font-variant: small-caps;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.7),
    0 0 12px rgba(212, 175, 55, 0.3);
}
.zh-lv {
  font-size: 10px;
  font-family: var(--font-num);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 3px;
  padding: 0 6px;
  line-height: 16px;
  white-space: nowrap;
  background: rgba(212, 175, 55, 0.08);
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
