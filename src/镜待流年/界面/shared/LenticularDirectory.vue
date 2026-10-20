<template>
  <section class="lf-directory" aria-label="光栅卡目录">
    <header class="directory-header">
      <div>
        <h3>光栅卡目录</h3>
        <p>{{ LENTICULAR_CATALOG.length }} 张卡面 · 点开条目赏卡</p>
      </div>
      <button type="button" aria-label="关闭光栅卡目录" @click="$emit('close')">×</button>
    </header>
    <div class="directory-search">
      <input v-model="search" type="search" placeholder="搜索名称、品阶或简介" aria-label="搜索光栅卡" />
    </div>
    <div class="directory-filters" role="group" aria-label="光栅卡类别">
      <button type="button" :aria-pressed="category === 'all'" @click="category = 'all'">
        全部 {{ LENTICULAR_CATALOG.length }}
      </button>
      <button
        v-for="(label, key) in LENTICULAR_CATEGORIES"
        :key="key"
        type="button"
        :aria-pressed="category === key"
        @click="category = key"
      >
        {{ label }} {{ count(key) }}
      </button>
    </div>
    <p v-if="!entries.length" class="directory-empty">
      {{ search.trim() ? '没有找到匹配的卡面。' : '此类卡面尚未收录。' }}
    </p>
    <div v-for="entry in entries" :key="entry.id" class="directory-entry">
      <button
        class="entry-toggle"
        type="button"
        :aria-expanded="open === entry.id"
        @click="open = open === entry.id ? '' : entry.id"
      >
        <span class="entry-mark" aria-hidden="true">◇</span
        ><span class="entry-title"
          ><strong>{{ entry.name }}</strong
          ><small>{{ LENTICULAR_CATEGORIES[entry.category] }} · {{ entry.subtitle }}</small></span
        ><span class="entry-grade">{{ entry.grade }}</span
        ><span aria-hidden="true">{{ open === entry.id ? '▾' : '▸' }}</span>
      </button>
      <div v-if="open === entry.id" class="entry-detail">
        <LenticularCard :entry="entry" auto-start />
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import LenticularCard from './LenticularCard.vue';
import { LENTICULAR_CATALOG, LENTICULAR_CATEGORIES, type LenticularCategory } from './lenticular-catalog';
defineEmits<{ close: [] }>();
const search = ref(''),
  open = ref('');
const category = ref<LenticularCategory | 'all'>('all');
const count = (key: LenticularCategory) => LENTICULAR_CATALOG.filter(entry => entry.category === key).length;
const entries = computed(() => {
  const query = search.value.normalize('NFKC').trim().toLocaleLowerCase();
  return LENTICULAR_CATALOG.filter(
    entry =>
      (category.value === 'all' || entry.category === category.value) &&
      (!query ||
        [entry.name, entry.grade, entry.subtitle, entry.description].join(' ').toLocaleLowerCase().includes(query)),
  );
});
</script>
<style scoped>
.lf-directory {
  margin: 8px 10px;
  padding: 13px;
  border: 1px solid var(--t-border, #b59c7255);
  border-radius: 9px;
  background: var(--t-bg, #f1ebdf);
  color: var(--t-text, #68593e);
  box-sizing: border-box;
  text-align: left;
}
.directory-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 10px;
}
.directory-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
}
.directory-header p {
  margin: 5px 0 10px;
  font-size: 10px;
  color: var(--t-muted, #9d8d77);
}
.directory-header > button {
  border: 0;
  background: transparent;
  padding: 0 6px;
  color: inherit;
  font-size: 23px;
  cursor: pointer;
}
.directory-search input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--t-border, #b59c7255);
  border-radius: 5px;
  padding: 8px 10px;
  background: var(--t-accent-dim, #b2925e11);
  font: inherit;
  font-size: 11px;
  color: inherit;
}
.directory-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px 0;
}
.directory-filters button {
  border: 1px solid var(--t-border, #b59c7255);
  padding: 5px 9px;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  font-size: 10px;
  color: var(--t-muted, #9d8d77);
  cursor: pointer;
}
.directory-filters button[aria-pressed='true'] {
  background: var(--t-accent-dim, #b2925e22);
  color: var(--t-accent, #ab8950);
  border-color: var(--t-accent, #ab8950);
}
.directory-empty {
  margin: 15px 0 8px;
  text-align: center;
  font-size: 11px;
  color: var(--t-muted, #9d8d77);
}
.directory-entry {
  border-top: 1px solid var(--t-border, #b59c7255);
}
.entry-toggle {
  display: flex;
  gap: 9px;
  align-items: center;
  width: 100%;
  border: 0;
  padding: 10px 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.entry-mark {
  color: var(--t-accent, #b2925e);
  font-size: 20px;
}
.entry-title {
  flex: 1;
  min-width: 0;
}
.entry-title strong {
  display: block;
  font-size: 12px;
  font-weight: 500;
}
.entry-title small {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  color: var(--t-muted, #9d8d77);
  overflow-wrap: anywhere;
}
.entry-grade {
  flex-shrink: 0;
  border: 1px solid #b2925e55;
  border-radius: 4px;
  padding: 3px 7px;
  color: var(--t-accent, #b2925e);
  font-size: 10px;
}
.entry-detail {
  padding-bottom: 6px;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--t-accent, #b2925e);
  outline-offset: 2px;
}
</style>
