<template>
  <Teleport :to="layer.target">
    <div class="feature-overlay" :class="{ 'is-dark': dark }" :style="[palette, viewportStyle]" @click.self="emit('close')">
      <section
        ref="dialog"
        class="feature-dialog"
        :class="{ 'feature-dialog-narrow': narrow }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @keydown="onKeydown"
      >
        <header class="feature-header">
          <div class="feature-title">
            <span aria-hidden="true">{{ icon }}</span>
            <h2>{{ title }}</h2>
          </div>
          <button ref="closeButton" class="feature-close" type="button" :aria-label="'关闭' + title" @click="emit('close')">×</button>
        </header>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch, type Component, type CSSProperties } from 'vue';
import { createPortalLayer } from './portalLayer';
import { mountPortalStyles } from './portalStyles';

const props = defineProps<{
  title: string;
  icon: string;
  theme: string;
  narrow?: boolean;
  components: Component[];
}>();
const emit = defineEmits<{ close: [] }>();
const source = document;
let hostDocument = source;
try {
  hostDocument = window.parent.document;
} catch {
  // A standalone or cross-origin preview uses its own document.
}
const origin = source.activeElement as HTMLElement | null;
const layer = createPortalLayer(hostDocument);
const dialog = ref<HTMLElement>();
const closeButton = ref<HTMLButtonElement>();
const palette = ref<Record<string, string>>({});
const dark = ref(false);
const viewport = hostDocument.defaultView?.visualViewport;
const viewportStyle = ref<CSSProperties>();

function syncViewport() {
  if (!viewport) return;
  const { offsetLeft, offsetTop, width, height } = viewport;
  viewportStyle.value = {
    top: offsetTop + 'px',
    left: offsetLeft + 'px',
    width: width + 'px',
    height: height + 'px',
    right: 'auto',
    bottom: 'auto',
  };
}

function onViewportResize() {
  syncViewport();
  const focused = hostDocument.activeElement as HTMLElement | null;
  if (!focused?.matches("input, textarea, select") || !dialog.value?.contains(focused)) return;
  void nextTick(() => {
    if (hostDocument.activeElement === focused) focused.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function applyTheme() {
  const anchor = source.querySelector('.status-bar, .cover');
  const styles = anchor && getComputedStyle(anchor);
  const pairs = {
    '--t-bg': '--c-bg',
    '--t-surface': '--c-card-bg',
    '--t-surface-open': '--c-card-hover',
    '--t-text': '--c-text',
    '--t-muted': '--c-text-dim',
    '--t-accent': '--c-gold',
    '--t-accent-dim': '--c-card-hover',
    '--t-border': '--c-border',
  };
  palette.value = Object.fromEntries(Object.entries(pairs).flatMap(([key, fallback]) => {
    const value = styles?.getPropertyValue(key).trim() || styles?.getPropertyValue(fallback).trim();
    return value ? [[key, value]] : [];
  }));
  dark.value = ['purple', 'gold', 'teal', 'rose', 'dark'].includes(props.theme);
}

const selector = [getCurrentInstance()?.type, ...props.components]
  .map(component => (component as { __scopeId?: string } | undefined)?.__scopeId)
  .filter(Boolean)
  .join('|');
let releaseStyles = () => {};
onMounted(() => {
  applyTheme();
  if (selector) releaseStyles = mountPortalStyles(source, hostDocument, new RegExp(selector));
  syncViewport();
  viewport?.addEventListener("resize", onViewportResize);
  viewport?.addEventListener("scroll", syncViewport);
  layer.show();
  closeButton.value?.focus({ preventScroll: true });
});
watch(() => props.theme, () => void nextTick(applyTheme));
onUnmounted(() => {
  viewport?.removeEventListener("resize", onViewportResize);
  viewport?.removeEventListener("scroll", syncViewport);
  layer.destroy();
  releaseStyles();
  origin?.focus({ preventScroll: true });
});

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
  if (event.key !== 'Tab') return;
  const focusable = Array.from(dialog.value?.querySelectorAll<HTMLElement>(
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
  ) ?? []).filter(node => node.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && hostDocument.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && hostDocument.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
</script>

<style scoped>
.feature-overlay {
  --panel-bg: var(--t-bg, #faf7f0);
  --panel-text: var(--t-text, #4a4035);
  --panel-muted: var(--t-muted, #776957);
  --panel-accent: var(--t-accent, #8b7355);
  --panel-line: color-mix(in srgb, var(--panel-accent) 32%, var(--panel-bg));
  position: fixed;
  inset: 0;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  place-items: center;
  box-sizing: border-box;
  padding: clamp(8px, 3vw, 30px);
  pointer-events: auto;
  background: rgb(15 12 18 / 58%);
  backdrop-filter: blur(5px);
  color: var(--panel-text);
  color-scheme: light;
  font: 14px/1.55 'DM Sans', system-ui, 'Microsoft YaHei', sans-serif;
}
.feature-overlay.is-dark { color-scheme: dark; }
.feature-dialog {
  display: flex;
  flex-direction: column;
  width: min(100%, 860px);
  height: min(100%, 760px);
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--panel-line);
  border-radius: 18px;
  background: var(--panel-bg);
  box-shadow: 0 22px 85px rgb(0 0 0 / 35%);
}
.feature-dialog-narrow { width: min(100%, 580px); height: min(100%, 730px); }
.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px clamp(14px, 4vw, 24px);
  border-bottom: 1px solid var(--panel-line);
}
.feature-title { display: flex; gap: 10px; align-items: center; }
.feature-title > span { color: var(--panel-accent); font-size: 19px; }
.feature-title h2 { margin: 0; color: inherit; line-height: 1.4; font-size: 17px; font-weight: 650; }
.feature-close {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border: 1px solid var(--panel-line);
  border-radius: 9px;
  background: color-mix(in srgb, var(--panel-accent) 10%, var(--panel-bg));
  color: inherit;
  font: inherit;
  font-size: 22px;
  cursor: pointer;
}
.feature-close:hover { background: color-mix(in srgb, var(--panel-accent) 23%, var(--panel-bg)); }
.feature-close:focus-visible { outline: 2px solid var(--panel-accent); outline-offset: 2px; }
@media (pointer: coarse) {
  /* Keep Mobile Safari from zooming on focus. The dialog scrolls above the keyboard. */
  .feature-dialog :deep(:is(input, textarea, select)) {
    font-size: 16px !important;
  }
}
@media (max-width: 540px) {
  .feature-dialog { border-radius: 13px; }
  .feature-header { padding-block: 9px; }
}
</style>
