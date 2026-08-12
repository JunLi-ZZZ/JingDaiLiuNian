<template>
  <div class="host">
    <dl class="h-grid">
      <div class="h-item">
        <dt>性别</dt>
        <dd>{{ 宿主.性别 || '—' }}</dd>
      </div>
      <div class="h-item">
        <dt>年龄</dt>
        <dd>{{ 宿主.年龄 || '—' }}</dd>
      </div>
      <div class="h-item">
        <dt>身份</dt>
        <dd>{{ 宿主.身份 || '—' }}</dd>
      </div>
      <div class="h-item">
        <dt>当前状态</dt>
        <dd>{{ 宿主.当前状态 || '—' }}</dd>
      </div>
    </dl>
    <div v-if="宿主.外貌" class="h-look">
      <span class="h-look-label"><i class="fa-regular fa-id-card"></i>外貌</span>
      <p>{{ 宿主.外貌 }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();
const 宿主 = computed(() => store.data.宿主);
</script>

<style scoped>
.host {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.h-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.h-item {
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.h-item dt {
  font-size: 10px;
  color: var(--txt-faint);
  letter-spacing: 2px;
}
.h-item dd {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
}
.h-look {
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12px;
  color: var(--txt-dim);
}
.h-look-label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--txt-faint);
}
.h-look-label i {
  margin-right: 5px;
}
</style>
