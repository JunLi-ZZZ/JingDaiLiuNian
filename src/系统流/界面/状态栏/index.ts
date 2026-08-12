import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './global.css';

// 不依赖 jQuery（$ 是酒馆提供的全局变量，纯浏览器预览时不存在）
const app = createApp(App).use(createPinia());
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.mount('#app'));
} else {
  app.mount('#app');
}
