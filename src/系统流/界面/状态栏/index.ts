import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './global.css';

type PreviewGlobals = typeof globalThis & {
  z?: typeof import('zod');
  _?: Record<string, any>;
};

const globals = globalThis as PreviewGlobals;

// schema.ts 依赖酒馆提供的 z / _ 全局变量。浏览器预览没有这些全局变量，
// 先补齐依赖，再动态加载 App，避免 webpack 模块在依赖完成前就执行 schema。
async function ensurePreviewGlobals() {
  if (!globals.z) {
    globals.z = await import('https://testingcf.jsdelivr.net/npm/zod@4.4.3/+esm');
  }
  if (!globals._) {
    const lodash = await import('https://testingcf.jsdelivr.net/npm/lodash@4.17.21/+esm');
    globals._ = (lodash as any).default ?? lodash;
  }
}

async function mount() {
  try {
    await ensurePreviewGlobals();
    const { default: App } = await import('./App.vue');
    const app = createApp(App).use(createPinia());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => app.mount('#app'), { once: true });
    } else {
      app.mount('#app');
    }
  } catch (error) {
    console.error('[系统流状态栏] 预览依赖加载失败', error);
  }
}

void mount();
