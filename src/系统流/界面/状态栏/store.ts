import { defineMvuDataStore } from '@util/mvu';
import { defineStore } from 'pinia';
import { Schema } from '../../schema';
import { mockData } from './mock';

// 酒馆环境提供 getCurrentMessageId / getVariables 等全局函数；
// 纯浏览器打开（前端预览）时没有这些函数，走 mock 数据以便直接查看界面效果
const 在酒馆中 = typeof getCurrentMessageId === 'function' && typeof getVariables === 'function';

const usePreviewStore = defineStore('mvu_data.浏览器预览', () => {
  const data = ref(Schema.parse(mockData));
  return { data };
});

export const useDataStore = (
  在酒馆中 ? defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() }) : usePreviewStore
) as typeof usePreviewStore;
