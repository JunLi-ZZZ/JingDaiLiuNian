<template>
  <section class="jdnl-lenticular" :aria-label="`${entry.name}光栅卡`">
    <div class="lf-stage">
      <article
        ref="card"
        class="lf-card"
        :class="{ 'is-active': active, 'is-reduced': reducedMotion }"
        :style="cardStyle"
        tabindex="0"
        :aria-label="`${entry.name}，${grade}，${visibleState}`"
        @pointerdown="beginPointer"
        @pointermove="followPointer"
        @pointerup="endPointer"
        @pointercancel="endPointer"
        @pointerleave="leavePointer"
        @keydown.left.prevent="showState('a')"
        @keydown.right.prevent="showState('b')"
        @keydown.home.prevent="showState('a')"
      >
        <div class="lf-face">
          <div class="lf-art" role="img" :aria-label="`${entry.name}：${visibleState}`">
            <div v-if="!loadedA && !loadedB" class="lf-placeholder">
              <span class="lf-placeholder-symbol" aria-hidden="true">◇</span><span>{{ entry.name }}</span
              ><small>{{ failedA && failedB ? '插画暂未载入' : '插画载入中' }}</small>
            </div>
            <img
              v-if="!failedA"
              :key="`a-${attempt}`"
              class="lf-image lf-image-a"
              :class="{ 'is-loaded': loadedA }"
              :src="imageA"
              alt=""
              loading="lazy"
              decoding="async"
              @load="loadedA = true"
              @error="failedA = true"
            />
            <img
              v-if="!failedB"
              :key="`b-${attempt}`"
              class="lf-image lf-image-b"
              :class="{ 'is-loaded': loadedB }"
              :src="imageB"
              alt=""
              loading="lazy"
              decoding="async"
              @load="loadedB = true"
              @error="failedB = true"
            />
          </div>
          <div class="lf-ridges" aria-hidden="true"></div>
          <div class="lf-foil" aria-hidden="true"></div>
          <div class="lf-reflection" aria-hidden="true"></div>
          <div class="lf-sparkles" aria-hidden="true">
            <i
              v-for="sparkle in sparkles"
              :key="sparkle.x"
              :style="{ left: `${sparkle.x}%`, top: `${sparkle.y}%`, '--delay': `${sparkle.delay}s` }"
              >✦</i
            >
          </div>
          <div class="lf-frame" aria-hidden="true"></div>
          <header class="lf-header">
            <span>镜待流年</span><span class="lf-grade">◇ {{ grade }}</span>
          </header>
          <div class="lf-title">
            <span class="lf-category">{{ categoryLabel }}</span>
            <h3>{{ entry.name }}</h3>
            <p>{{ entry.subtitle }}</p>
          </div>
          <footer class="lf-footer">
            <span>{{ entry.edition }}</span
            ><span>{{ grade === '唯一' ? '举世无双 · 无同类' : grade }}</span
            ><span>{{ visibleState }}</span>
          </footer>
        </div>
      </article>
    </div>
    <div class="lf-controls" role="group" :aria-label="`${entry.name}卡面控制`">
      <button type="button" :aria-pressed="mode === 'a'" @click="showState('a')">{{ entry.states[0] }}</button>
      <button type="button" :aria-pressed="mode === 'b'" @click="showState('b')">{{ entry.states[1] }}</button>
      <button type="button" :aria-pressed="mode === 'auto'" :disabled="reducedMotion" @click="toggleAuto">
        {{ mode === 'auto' ? '暂停转动' : '自动赏卡' }}
      </button>
    </div>
    <p class="lf-hint">转动卡面，细看镜光流转 <span aria-hidden="true">·</span> 左右方向键可切换</p>
    <p v-if="failedA || failedB" class="lf-status" role="status">
      {{ failedA && failedB ? '插画暂未载入，原资料仍可查看。' : '一幅插画暂未载入，已载入的卡面仍可查看。'
      }}<button type="button" @click="retryImages">重试插画</button>
    </p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { LENTICULAR_ACCENTS, LENTICULAR_CATEGORIES, lenticularGrade, type LenticularEntry } from './lenticular-catalog';
const props = withDefaults(
  defineProps<{
    entry: LenticularEntry;
    grade?: string;
    image?: string;
    alternateImage?: string;
    autoStart?: boolean;
  }>(),
  { autoStart: false, grade: undefined, image: undefined, alternateImage: undefined },
);
const card = ref<HTMLElement>(),
  pose = ref({ x: 0, y: 0 });
const mode = ref<'a' | 'b' | 'auto' | 'pointer'>(props.autoStart ? 'auto' : 'a');
const loadedA = ref(false),
  loadedB = ref(false),
  failedA = ref(false),
  failedB = ref(false);
const attempt = ref(0),
  reducedMotion = ref(false),
  inView = ref(false),
  pageVisible = ref(true);
const imageA = computed(() => props.image ?? props.entry.imageA),
  imageB = computed(() => props.alternateImage ?? props.entry.imageB);
const grade = computed(() => lenticularGrade(props.grade, props.entry.grade));
const categoryLabel = computed(() => LENTICULAR_CATEGORIES[props.entry.category]);
const active = computed(() => inView.value && pageVisible.value && !reducedMotion.value);
const phase = computed(() => {
  if (!loadedB.value) return 0;
  if (!loadedA.value) return 1;
  if (mode.value === 'a') return 0;
  if (mode.value === 'b') return 1;
  const value = Math.min(1, Math.max(0, (Math.abs(pose.value.x) - 0.3) / 0.4));
  return value * value * (3 - 2 * value);
});
const visibleState = computed(() => props.entry.states[phase.value > 0.5 ? 1 : 0]);
const cardStyle = computed(() => ({
  '--accent': LENTICULAR_ACCENTS[grade.value],
  '--phase': phase.value,
  '--tilt-x': `${reducedMotion.value ? 0 : -pose.value.y * 9}deg`,
  '--tilt-y': `${reducedMotion.value ? 0 : pose.value.x * 24}deg`,
  '--light-x': `${50 + pose.value.x * 40}%`,
  '--light-y': `${35 + pose.value.y * 30}%`,
  '--light-angle': `${115 + pose.value.x * 32}deg`,
  '--foil-shift': `${50 + pose.value.x * 35}%`,
}));
const sparkles = [
  { x: 14, y: 24, delay: 0 },
  { x: 82, y: 18, delay: 1.2 },
  { x: 28, y: 61, delay: 2.3 },
  { x: 76, y: 54, delay: 0.7 },
  { x: 54, y: 71, delay: 1.6 },
  { x: 10, y: 80, delay: 2.8 },
];
function showState(state: 'a' | 'b') {
  mode.value = state;
  pose.value = { x: state === 'b' ? 0.82 : 0, y: 0 };
}
function toggleAuto() {
  if (mode.value === 'auto') {
    showState(phase.value > 0.5 ? 'b' : 'a');
    return;
  }
  mode.value = 'auto';
}
let pointer: { id: number; x: number; y: number; poseX: number } | undefined;
function beginPointer(event: PointerEvent) {
  if (event.pointerType === 'mouse' || reducedMotion.value) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, poseX: pose.value.x };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function followPointer(event: PointerEvent) {
  if (reducedMotion.value) return;
  const bounds = card.value?.getBoundingClientRect();
  if (!bounds?.width) return;
  if (event.pointerType !== 'mouse') {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return;
    mode.value = 'pointer';
    pose.value = { x: Math.max(-1, Math.min(1, pointer.poseX + (dx / bounds.width) * 2)), y: 0 };
  } else {
    mode.value = 'pointer';
    pose.value = {
      x: Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)),
      y: Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1)),
    };
  }
}
function endPointer() {
  pointer = undefined;
}
function leavePointer(event: PointerEvent) {
  if (event.pointerType === 'mouse' && mode.value === 'pointer') showState('a');
}
function retryImages() {
  loadedA.value = loadedB.value = failedA.value = failedB.value = false;
  attempt.value++;
}
watch(() => [imageA.value, imageB.value], retryImages);
let observer: IntersectionObserver | undefined, motionQuery: MediaQueryList | undefined;
let frame = 0,
  lastTime = 0,
  elapsed = 0;
let viewWindow: Window = window,
  viewDocument: Document = document;
function animate(time: number) {
  frame = 0;
  if (lastTime) elapsed += Math.min(40, time - lastTime);
  lastTime = time;
  pose.value = { x: Math.sin(elapsed / 1350) * 0.87, y: Math.sin(elapsed / 1800) * 0.2 };
  if (mode.value === 'auto' && active.value) frame = viewWindow.requestAnimationFrame(animate);
}
watch([mode, active], () => {
  if (mode.value === 'auto' && active.value) {
    if (!frame) {
      lastTime = 0;
      frame = viewWindow.requestAnimationFrame(animate);
    }
  } else {
    viewWindow.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
});
function syncMotion() {
  reducedMotion.value = motionQuery?.matches ?? false;
  if (reducedMotion.value && mode.value === 'auto') showState('a');
}
function syncVisibility() {
  pageVisible.value = viewDocument.visibilityState === 'visible';
}
onMounted(() => {
  viewDocument = card.value!.ownerDocument;
  viewWindow = viewDocument.defaultView ?? window;
  motionQuery = viewWindow.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  syncVisibility();
  motionQuery.addEventListener('change', syncMotion);
  viewDocument.addEventListener('visibilitychange', syncVisibility);
  const Observer = (
    viewWindow as Window & { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver;
  const nextObserver = new Observer(
    ([entry]) => {
      inView.value = entry.isIntersecting;
    },
    { threshold: 0.02 },
  );
  nextObserver.observe(card.value!);
  observer = nextObserver;
});
onUnmounted(() => {
  viewWindow.cancelAnimationFrame(frame);
  observer?.disconnect();
  motionQuery?.removeEventListener('change', syncMotion);
  viewDocument.removeEventListener('visibilitychange', syncVisibility);
});
</script>
<style scoped>
.jdnl-lenticular {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  box-sizing: border-box;
  color: #ddc59e;
  font-family: 'Microsoft YaHei', sans-serif;
  text-align: center;
}
.lf-stage {
  padding: 22px 18px 20px;
  perspective: 1100px;
}
.lf-card {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  transform-style: preserve-3d;
  transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transition: transform 160ms ease-out;
  touch-action: pan-y;
  outline-offset: 9px;
  border-radius: 14px;
  background: #9f8050;
  box-shadow: 0 16px 30px #080c1433;
}
.lf-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, #e8ce9a, #49351e 35%, #a28f60 55%, #655237);
  transform: translateZ(-6px) translateX(4px) translateY(4px);
  box-shadow:
    0 1px 0 #ddbc7e,
    1px 2px 0 #6e5330,
    2px 3px 0 #bca472,
    3px 4px 0 #59452b;
}
.lf-face {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  border-radius: inherit;
  border: 1px solid var(--accent);
  box-sizing: border-box;
  background: #10171c;
  box-shadow: inset 0 0 0 2px #b89a6044;
}
.lf-art,
.lf-image,
.lf-ridges,
.lf-foil,
.lf-reflection,
.lf-sparkles,
.lf-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.lf-image {
  display: block;
  object-fit: cover;
  opacity: 0;
  transition: opacity 120ms linear;
}
.lf-image-a.is-loaded {
  opacity: 1;
}
.lf-image-b.is-loaded {
  opacity: var(--phase);
}
.lf-placeholder {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: radial-gradient(ellipse at 50% 35%, #31484c, #10171c 70%);
}
.lf-placeholder-symbol {
  color: #bd9861;
  font-size: 52px;
  font-weight: 200;
}
.lf-placeholder small {
  font-size: 11px;
  color: #a8977b;
}
.lf-ridges {
  z-index: 2;
  opacity: 0.22;
  background: repeating-linear-gradient(90deg, #e9e7c522 0 1px, transparent 1px 3px, #080e2233 3px 4px);
  mix-blend-mode: soft-light;
}
.lf-foil {
  z-index: 3;
  opacity: 0.2;
  mix-blend-mode: color-dodge;
  background: repeating-linear-gradient(
    var(--light-angle),
    #97c9b822 0%,
    #ddd494aa 10%,
    #c393c1aa 18%,
    #78b4d3aa 27%,
    transparent 40%
  );
  background-size: 270% 270%;
  background-position: var(--foil-shift) 50%;
  mask-image: radial-gradient(ellipse at var(--light-x) var(--light-y), #000 0%, #0009 25%, transparent 68%);
}
.lf-reflection {
  z-index: 4;
  opacity: 0.65;
  mix-blend-mode: screen;
  background: linear-gradient(
    var(--light-angle),
    transparent 20%,
    #eef2d500 35%,
    #ffefc711 43%,
    #f9ffe543 47%,
    #9dcaeb11 52%,
    transparent 62%
  );
  background-size: 230% 100%;
  background-position: var(--light-x) center;
}
.lf-sparkles {
  z-index: 5;
  opacity: 0.7;
}
.lf-sparkles i {
  position: absolute;
  color: #f7ead2;
  font-size: 8px;
  font-style: normal;
  text-shadow: 0 0 6px #a6dee7;
  opacity: 0.2;
}
.is-active .lf-sparkles i {
  animation: lf-sparkle 3.6s ease-in-out infinite;
  animation-delay: var(--delay);
}
.lf-frame {
  z-index: 6;
  inset: 10px;
  width: auto;
  height: auto;
  border: 1px solid #dfbf8888;
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 3px #0c152122,
    0 0 0 3px #e9d8a311;
}
.lf-frame::before,
.lf-frame::after {
  position: absolute;
  content: '◇';
  font-size: 12px;
  color: var(--accent);
  background: #18202a;
  padding: 0 3px;
}
.lf-frame::before {
  top: -9px;
  left: calc(50% - 8px);
}
.lf-frame::after {
  bottom: -9px;
  left: calc(50% - 8px);
}
.lf-header {
  position: relative;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 36px;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #e1c795;
  background: linear-gradient(#071018b3, transparent);
  text-shadow: 0 1px 3px #080d13;
}
.lf-grade {
  color: var(--accent);
  white-space: nowrap;
  padding: 3px 7px;
  border: 1px solid #b99c6855;
  border-radius: 3px;
  background: #10182166;
  letter-spacing: 0.04em;
}
.lf-title {
  position: absolute;
  z-index: 7;
  inset: auto 0 32px;
  padding: 32px 20px 8px;
  background: linear-gradient(transparent, #080c1680 42%, #080c16c0);
  text-align: center;
  text-shadow: 0 2px 5px #0a101b;
}
.lf-category {
  font-size: 8px;
  letter-spacing: 0.4em;
  color: #dbbc80;
}
.lf-title h3 {
  padding: 0;
  margin: 8px 0 5px;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: clamp(25px, 6vw, 36px);
  font-weight: 600;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: #edd4a9;
}
.lf-title p {
  padding: 0;
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #d4c3a1;
  line-height: 1.6;
}
.lf-footer {
  position: absolute;
  z-index: 7;
  inset: auto 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 9px 20px 13px;
  font-size: 7px;
  color: #d5ba88;
  letter-spacing: 0.05em;
  background: #070d19b8;
}
.lf-controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0 5px;
}
.lf-controls button,
.lf-status button {
  min-height: 30px;
  padding: 5px 11px;
  border: 1px solid #ae8d5744;
  border-radius: 5px;
  background: var(--t-accent-dim, #b58e5220);
  color: var(--t-accent, #a78d5f);
  font: inherit;
  font-size: 11px;
  line-height: 1.5;
  cursor: pointer;
}
.lf-controls button[aria-pressed='true'] {
  background: #cda66828;
  border-color: #c39e6277;
  color: var(--t-text, #a18453);
}
.lf-controls button:disabled {
  opacity: 0.45;
  cursor: default;
}
.lf-controls button:focus-visible,
.lf-status button:focus-visible,
.lf-card:focus-visible {
  outline: 2px solid #b99b63;
}
.lf-hint,
.lf-status {
  padding: 0 8px;
  margin: 10px 0 12px;
  color: var(--t-muted, #9c8e77);
  font-size: 10px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.lf-hint span {
  padding: 0 3px;
}
.lf-status button {
  margin: 5px 4px 0;
}
@keyframes lf-sparkle {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(0.65);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.3);
  }
}
.is-reduced {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .lf-card,
  .lf-image {
    transition: none;
  }
  .lf-sparkles i {
    animation: none !important;
  }
}
@media (max-width: 360px) {
  .lf-stage {
    padding: 18px 14px;
  }
  .lf-header {
    padding: 18px 19px 30px;
    font-size: 8px;
  }
  .lf-footer {
    padding-inline: 16px;
    font-size: 6px;
  }
}
</style>
