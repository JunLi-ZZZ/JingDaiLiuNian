import {createApp,h} from 'vue';
import Workshop from './Workshop.vue';
import {Schema} from '../../src/schema';
import './page.css';
createApp({render:()=>h('main',{style:'max-width:880px;margin:24px auto'},[h(Workshop,{state:Schema.parse({}),standalone:true,preview:true})])}).mount('#app');
