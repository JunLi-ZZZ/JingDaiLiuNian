import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './global.css';
import './v4.css';

const app = createApp(App).use(createPinia());
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.mount('#app'));
} else {
  app.mount('#app');
}
