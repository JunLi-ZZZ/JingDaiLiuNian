import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './global.css';

type PreviewGlobals = typeof globalThis & { z?: typeof import('zod'); _?: Record<string, any> };
const globals = globalThis as PreviewGlobals;

async function ensurePreviewGlobals() {
  if (!globals.z) globals.z = await import('https://testingcf.jsdelivr.net/npm/zod@4.4.3/+esm');
  if (!globals._) {
    const lodash = await import('https://testingcf.jsdelivr.net/npm/lodash@4.17.21/+esm');
    globals._ = (lodash as any).default ?? lodash;
  }
}

async function mount() {
  await ensurePreviewGlobals();
  const { default: App } = await import('./App.vue');
  const app = createApp(App).use(createPinia());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.mount('#app'), { once: true });
  } else {
    app.mount('#app');
  }
}

void mount().catch(error => console.error('[镜待流年状态栏] 预览依赖加载失败', error));
