import { createApp } from 'vue';
import App from './App.vue';
import './global.css';

const mount = () => createApp(App).mount('#app');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
