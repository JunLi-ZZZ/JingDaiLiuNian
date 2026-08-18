import { defineMvuDataStore } from '@util/mvu';
import { defineStore } from 'pinia';
import { Schema } from '../../schema';

const 在酒馆中 = typeof getCurrentMessageId === 'function' && typeof getVariables === 'function';

const usePreviewStore = defineStore('mvu_data.镜待流年.浏览器预览', () => {
  const data = ref(Schema.parse({}));
  return { data };
});

export const useDataStore = (
  在酒馆中 ? defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() }) : usePreviewStore
) as typeof usePreviewStore;
