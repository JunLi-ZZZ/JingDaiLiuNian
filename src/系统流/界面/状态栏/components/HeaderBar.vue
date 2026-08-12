<template>
  <header class="hdr">
    <div class="brand">
      <span class="brand-mark">◈</span>
      <span class="brand-text">系统面板</span>
      <span class="brand-sub">SYSTEM&nbsp;PANEL</span>
    </div>
    <div class="world">
      <span v-if="世界.当前时间" class="w-item">
        <i class="fa-regular fa-clock"></i>{{ 世界.当前时间
        }}<template v-if="世界.周几"> · {{ 世界.周几 }}</template>
      </span>
      <span v-if="世界.天气" class="w-item"><i :class="weatherIcon"></i>{{ 世界.天气 }}</span>
      <span v-if="世界.地点" class="w-item"><i class="fa-solid fa-location-dot"></i>{{ 世界.地点 }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 世界 = computed(() => store.data.世界);

const WEATHER_ICONS: Record<string, string> = {
  晴: 'fa-solid fa-sun',
  多云: 'fa-solid fa-cloud-sun',
  阴: 'fa-solid fa-cloud',
  雨: 'fa-solid fa-cloud-rain',
  雷阵雨: 'fa-solid fa-cloud-bolt',
  雪: 'fa-solid fa-snowflake',
  雾: 'fa-solid fa-smog',
};
const weatherIcon = computed(() => {
  const w = 世界.value.天气 || '';
  return WEATHER_ICONS[w] ?? (w.includes('雷') ? 'fa-solid fa-cloud-bolt' : 'fa-solid fa-cloud');
});
</script>

<style scoped>
.hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 10px;
  padding: 2px 2px 10px;
  border-bottom: 1px solid var(--line);
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.brand-mark {
  color: var(--cyan);
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
  font-size: 14px;
}
.brand-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 3px;
}
.brand-sub {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--txt-faint);
}
.world {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: var(--txt-dim);
}
.w-item i {
  margin-right: 4px;
  color: var(--cyan);
  opacity: 0.8;
}
</style>
