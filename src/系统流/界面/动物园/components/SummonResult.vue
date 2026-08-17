<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="store.抽卡结果" class="sr-overlay" @click.self="关闭">
        <div class="sr-box">
          <h3 class="sr-title">召唤结果</h3>
          <div class="sr-grid" :class="{ many: store.抽卡结果.length > 5 }">
            <div
              v-for="(r, i) in store.抽卡结果"
              :key="i"
              class="sr-card"
              :class="{ revealed: 已翻开.has(i) }"
              :style="{ ...tierVars(r.品阶), transitionDelay: i * 70 + 'ms' }"
              @click="已翻开.add(i)"
            >
              <div class="sr-inner">
                <div class="sr-face sr-back">
                  <i class="fa-solid fa-question"></i>
                </div>
                <div class="sr-face sr-front">
                  <i class="sr-kind" :class="种类图标(r)" :style="{ color: catMeta(r.类别).color }"></i>
                  <span class="sr-name">{{ r.名称 }}</span>
                  <TierTag :品阶="r.品阶" />
                  <span class="sr-sub">{{ r.副文本 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="sr-actions">
            <button v-if="已翻开.size < store.抽卡结果.length" class="sr-btn" @click="全部翻开">全部翻开</button>
            <button class="sr-btn primary" @click="关闭">收下</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierVars } from '../../shared/tier';
import { catMeta } from '../category';
import TierTag from '../../shared/TierTag.vue';
import type { 抽卡结果 } from '../types';

const store = useZooStore();
const 已翻开 = ref(new Set<number>());

watch(
  () => store.抽卡结果,
  v => {
    if (v) 已翻开.value = new Set();
  },
);

function 种类图标(r: 抽卡结果): string {
  if (r.种类 === '兽蛋') return 'fa-solid fa-egg';
  if (r.种类 === '食物') return 'fa-solid fa-bowl-food';
  return catMeta(r.类别).icon;
}

function 全部翻开() {
  store.抽卡结果?.forEach((_, i) => 已翻开.value.add(i));
}

function 关闭() {
  store.抽卡结果 = null;
}
</script>

<style scoped>
.sr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 5, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.sr-box {
  width: 100%;
  max-width: 560px;
  max-height: 86vh;
  overflow-y: auto;
  padding: 18px;
  background: linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 2px solid #8a6b3f;
  border-radius: 16px 22px 16px 22px;
  box-shadow: 0 10px 44px rgba(0, 0, 0, 0.55);
}
.sr-title {
  text-align: center;
  font-family: var(--font-title);
  font-size: 18px;
  letter-spacing: 6px;
  margin-bottom: 14px;
  color: #b57a1f;
}
.sr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 9px;
}
.sr-card {
  height: 128px;
  perspective: 700px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(12px);
  animation: sr-in 0.35s forwards;
}
@keyframes sr-in {
  to {
    opacity: 1;
    transform: none;
  }
}
.sr-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
  transform-style: preserve-3d;
}
.sr-card.revealed .sr-inner {
  transform: rotateY(180deg);
}
.sr-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 9px;
  padding: 8px 6px;
  text-align: center;
}
.sr-back {
  background: var(--pinset);
  border: 1px dashed var(--pline-strong);
  color: var(--ptxt-faint);
  font-size: 20px;
}
.sr-front {
  transform: rotateY(180deg);
  color: var(--ptxt);
  background:
    radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--tier) 28%, transparent), transparent),
    #fbf7ea;
  border: 1px solid color-mix(in srgb, var(--tier) 55%, var(--pline));
  box-shadow: 0 0 14px color-mix(in srgb, var(--tier) 35%, transparent);
}
.sr-kind {
  font-size: 24px;
  text-shadow: 0 0 14px var(--tier);
}
.sr-name {
  font-size: 12px;
  font-weight: 700;
}
.sr-sub {
  font-size: 9px;
  color: var(--ptxt-dim);
  line-height: 1.4;
}
.sr-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.sr-btn {
  padding: 7px 20px;
  border-radius: 8px;
  border: 1px solid var(--pline-strong);
  background: #fbf7ea;
  color: var(--ptxt);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.sr-btn.primary {
  background: linear-gradient(160deg, #5c7f45, #4a6b3a);
  border-color: #40582f;
  color: #f7f1e0;
}
.sr-btn:hover {
  box-shadow: 0 2px 10px rgba(74, 107, 58, 0.4);
}
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
