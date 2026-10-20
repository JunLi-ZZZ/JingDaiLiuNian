<template>
  <section class="jdnl-lenticular" :aria-label="`${entry.name}光栅卡`">
    <div class="lf-stage">
      <div
        ref="card"
        class="lf-card-shell"
        :class="{ 'is-back': back, 'is-active': active, 'is-reduced': reducedMotion, 'is-dragging': dragging }"
        :style="cardStyle"
        tabindex="0"
        :aria-label="`${entry.name}，${grade}，${back ? '卡背' : visibleState}`"
        @pointerdown="beginPointer"
        @pointermove="followPointer"
        @pointerup="endPointer"
        @pointercancel="endPointer"
        @lostpointercapture="endPointer"
        @pointerleave="leavePointer"
        @keydown.left.prevent="turn(-6)"
        @keydown.right.prevent="turn(6)"
        @keydown.home.prevent="showState('a')"
        @keydown.f.prevent="toggleBack"
      >
        <div
          v-for="layer in edgeLayers"
          :key="layer"
          class="lf-edge-layer"
          :style="{ transform: `translateZ(${layer * thickness / 2}px)` }"
          aria-hidden="true"
        ></div>
        <div v-for="side in ['top', 'bottom', 'left', 'right']" :key="side" class="lf-edge-side" :class="`lf-edge-${side}`" aria-hidden="true"></div>
        <article
          class="lf-card lf-face lf-face-front"
          :aria-hidden="back"
        >
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
        </article>
        <article class="lf-card lf-face lf-face-back" :aria-hidden="!back">
          <div class="lf-back-ornament lf-back-ornament-top">◇</div>
          <svg class="lf-back-engraving" viewBox="0 0 400 600" aria-hidden="true">
            <defs>
              <radialGradient :id="engravingId"><stop stop-color="#a28a5540" /><stop offset="1" stop-color="#a28a5500" /></radialGradient>
            </defs>
            <circle cx="200" cy="259" r="158" :fill="`url(#${engravingId})`" stroke="none" />
            <g class="lf-back-fine-lines" transform="translate(200 259)">
              <ellipse v-for="n in 7" :key="n" :rx="67 + n * 7" :ry="112 - n * 5" :transform="`rotate(${n * 180 / 7})`" />
              <circle r="129" /><circle r="136" />
              <path v-for="n in 48" :key="`tick-${n}`" :d="`M 0 ${n % 4 === 0 ? -140 : -143} L 0 -147`" :transform="`rotate(${n * 7.5})`" />
            </g>
            <g class="lf-back-mirror">
              <circle cx="200" cy="248" r="43" /><circle cx="200" cy="248" r="37" />
              <path d="M 193 291 L 191 350 Q 200 365 209 350 L 207 291 M 200 224 L 200 272 M 176 248 L 224 248 M 186 234 L 214 262 M 186 262 L 214 234" />
              <path d="M 200 146 L 205 157 L 200 168 L 195 157 Z M 200 401 L 205 412 L 200 423 L 195 412 Z" />
            </g>
            <path class="lf-back-fine-lines" d="M 61 92 H 151 M 249 92 H 339 M 61 507 H 151 M 249 507 H 339" />
          </svg>
          <div class="lf-back-center">
            <strong>镜待流年</strong>
            <span>{{ entry.name }} · {{ grade }}</span>
            <small>{{ entry.edition }}</small>
          </div>
          <div class="lf-back-ornament lf-back-ornament-bottom">◇</div>
        </article>
      </div>
    </div>
    <div class="lf-controls" role="group" :aria-label="`${entry.name}卡面控制`">
      <button type="button" :aria-pressed="!back && mode === 'a'" @click="showState('a')">{{ entry.states[0] }}</button>
      <button type="button" :aria-pressed="!back && mode === 'b'" @click="showState('b')">{{ entry.states[1] }}</button>
      <button type="button" :aria-pressed="mode === 'auto'" :disabled="reducedMotion" @click="toggleAuto">
        {{ mode === 'auto' ? '暂停转动' : '自动赏卡' }}
      </button>
      <button type="button" :aria-pressed="back" @click="toggleBack">{{ back ? '正面' : '背面' }}</button>
    </div>
    <p v-if="failedA || failedB" class="lf-status" role="status">
      {{ failedA && failedB ? '插画暂未载入，原资料仍可查看。' : '一幅插画暂未载入，已载入的卡面仍可查看。'
      }}<button type="button" @click="retryImages">重试插画</button>
    </p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue';
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
  rotation = ref(0),
  verticalTilt = ref(0),
  thickness = ref(2.3),
  dragging = ref(false);
const back = computed(() => Math.cos(rotation.value * Math.PI / 180) < 0);
const engravingId = `lf-engraving-${useId()}`;
// 薄卡体比例取自溯寂：宽 6.3、厚 0.045。边缘层全部位于正背面之间。
const edgeLayers = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
const pose = computed(() => ({ x: Math.sin(rotation.value * Math.PI / 180) / Math.sin(28 * Math.PI / 180), y: verticalTilt.value / -9 }));
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
  '--tilt-x': `${verticalTilt.value}deg`,
  '--tilt-y': `${rotation.value}deg`,
  '--thickness': `${thickness.value}px`,
  '--half-depth': `${thickness.value / 2}px`,
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
  rotation.value = Math.round(rotation.value / 360) * 360 + (state === 'b' && !reducedMotion.value ? 24 : 0);
  verticalTilt.value = 0;
}

function toggleBack() {
  mode.value = 'pointer';
  rotation.value = Math.round(rotation.value / 180) * 180 + 180;
  verticalTilt.value = 0;
}
function turn(delta: number) {
  mode.value = 'pointer';
  rotation.value += delta;
}
function toggleAuto() {
  if (mode.value === 'auto') {
    showState(phase.value > 0.5 ? 'b' : 'a');
    return;
  }
  if (back.value) rotation.value = 0;
  mode.value = 'auto';
}
let pointer: { id: number; x: number; y: number; angle: number; tilt: number; width: number } | undefined;
let hovering = false;
function beginPointer(event: PointerEvent) {
  if (event.button !== 0) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: rotation.value, tilt: verticalTilt.value, width: card.value!.clientWidth };
  hovering = false;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function followPointer(event: PointerEvent) {
  const bounds = card.value?.parentElement?.getBoundingClientRect();
  if (!bounds?.width) return;
  if (pointer?.id === event.pointerId) {
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (!dragging.value && (Math.abs(dx) < 8 || (event.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)))) return;
    dragging.value = true;
    mode.value = 'pointer';
    rotation.value = pointer.angle + dx / pointer.width * 240;
    verticalTilt.value = Math.max(-12, Math.min(12, pointer.tilt - dy / pointer.width * 18));
  } else if (event.pointerType === 'mouse' && !reducedMotion.value) {
    const orientation = Math.round(rotation.value / 180) * 180;
    hovering = true;
    mode.value = 'pointer';
    rotation.value = orientation + Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)) * 28;
    verticalTilt.value = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1)) * -9;
  }
}
function endPointer() {
  pointer = undefined;
  dragging.value = false;
}
function leavePointer(event: PointerEvent) {
  if (event.pointerType === 'mouse' && hovering && !pointer) {
    rotation.value = Math.round(rotation.value / 180) * 180;
    verticalTilt.value = 0;
    hovering = false;
  }
}
function retryImages() {
  loadedA.value = loadedB.value = failedA.value = failedB.value = false;
  attempt.value++;
}
watch(() => [imageA.value, imageB.value], retryImages);
let observer: IntersectionObserver | undefined, sizeObserver: ResizeObserver | undefined, motionQuery: MediaQueryList | undefined;
let frame = 0,
  lastTime = 0,
  elapsed = 0;
let viewWindow: Window = window,
  viewDocument: Document = document;
function animate(time: number) {
  frame = 0;
  if (lastTime) elapsed += Math.min(40, time - lastTime);
  lastTime = time;
  rotation.value = Math.sin(elapsed / 1350) * 28;
  verticalTilt.value = Math.sin(elapsed / 1800) * 1.8;
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
  const Resize = (viewWindow as Window & { ResizeObserver: typeof ResizeObserver }).ResizeObserver;
  sizeObserver = new Resize(([entry]) => { thickness.value = entry.contentRect.width * 0.045 / 6.3; });
  sizeObserver.observe(card.value!);
});
onUnmounted(() => {
  viewWindow.cancelAnimationFrame(frame);
  observer?.disconnect();
  sizeObserver?.disconnect();
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
.lf-card-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  touch-action: pan-y;
  cursor: grab;
  transform-style: preserve-3d;
  transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transition: transform 220ms ease-out;
}
.lf-card-shell.is-dragging {
  cursor: grabbing;
  transition: none;
}
.lf-edge-layer {
  position: absolute;
  z-index: 0;
  inset: 0;
  border: 1px solid #9a7a45;
  border-radius: 14px;
  box-sizing: border-box;
  background: #927545;
  box-shadow: inset 0 0 0 1px #e3c78455;
  backface-visibility: visible;
  pointer-events: none;
}
.lf-edge-layer:nth-of-type(2n) {
  background: #6f522f;
}
.lf-edge-side {
  position: absolute;
  z-index: 1;
  display: block;
  box-sizing: border-box;
  border: 1px solid #b9965b;
  background: repeating-linear-gradient(90deg, #c1a66f 0 1px, #6a5231 1px 3px);
  pointer-events: none;
}
.lf-edge-top,
.lf-edge-bottom {
  left: 14px;
  width: calc(100% - 28px);
  height: var(--thickness);
  transform-origin: center;
}
.lf-edge-top {
  top: calc(-1 * var(--half-depth));
  transform: rotateX(90deg);
}
.lf-edge-bottom {
  bottom: calc(-1 * var(--half-depth));
  transform: rotateX(-90deg);
}
.lf-edge-left,
.lf-edge-right {
  top: 14px;
  width: var(--thickness);
  height: calc(100% - 28px);
  transform-origin: center;
}
.lf-edge-left {
  left: calc(-1 * var(--half-depth));
  transform: rotateY(-90deg);
}
.lf-edge-right {
  right: calc(-1 * var(--half-depth));
  transform: rotateY(90deg);
}
.lf-card {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  aspect-ratio: 2 / 3;
  outline-offset: 9px;
  border-radius: 14px;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
.lf-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  border-radius: 14px;
  border: 1px solid var(--accent);
  box-sizing: border-box;
  background: #10171c;
  box-shadow: inset 0 0 0 2px #b89a6044, 0 12px 24px #080c1424;
}
.lf-face-front {
  transform: translateZ(var(--half-depth));
}
.lf-face-back {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transform: rotateY(180deg) translateZ(var(--half-depth));
  background:
    radial-gradient(circle at 50% 42%, #52636a 0 1px, transparent 2px),
    radial-gradient(circle at 50% 42%, transparent 0 30%, #bd9b5b33 30.2% 30.6%, transparent 31%),
    linear-gradient(135deg, #0c1a20, #17282c 48%, #091318);
  border-color: #b9985a;
  color: #d9bd83;
}
.lf-face-back::before,
.lf-face-back::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid #bd9b5b77;
  border-radius: 8px;
  pointer-events: none;
}
.lf-face-back::after {
  inset: 22px;
  border-color: #bd9b5b33;
}
.lf-back-engraving {
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.85;
}
.lf-back-fine-lines,
.lf-back-mirror {
  fill: none;
  stroke: #bd9b5b99;
  stroke-width: 1;
}
.lf-back-mirror {
  stroke: #d4b875cc;
  stroke-width: 1.4;
}
.lf-back-center {
  display: flex;
  position: relative;
  z-index: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 86%;
  letter-spacing: 0.16em;
  text-align: center;
  text-shadow: 0 1px 4px #000;
}
.lf-back-center strong {
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: clamp(22px, 5vw, 32px);
  font-weight: 500;
}
.lf-back-center span,
.lf-back-center small {
  color: #bca477;
  font-size: 9px;
}
.lf-back-center small {
  letter-spacing: 0.08em;
}
.lf-back-ornament {
  position: absolute;
  left: 50%;
  color: #bd9b5b;
  font-size: 13px;
  transform: translateX(-50%);
}
.lf-back-ornament-top { top: 15px; }
.lf-back-ornament-bottom { bottom: 15px; }
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
.lf-card-shell:focus-visible {
  outline: 2px solid #b99b63;
}
.lf-status {
  padding: 0 8px;
  margin: 10px 0 12px;
  color: var(--t-muted, #9c8e77);
  font-size: 10px;
  line-height: 1.7;
  overflow-wrap: anywhere;
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
  .lf-card-shell,
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
