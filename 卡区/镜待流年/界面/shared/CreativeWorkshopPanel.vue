<template>
  <section class="creative-workshop" aria-label="创意工坊">
    <header class="workshop-heading"><h3>创意工坊</h3><button type="button" aria-label="关闭创意工坊" @click="$emit('close')">×</button></header>
    <nav class="workshop-tabs" aria-label="工坊分类">
      <button type="button" :aria-pressed="tab === 'portraits'" @click="tab = 'portraits'">立绘图库</button>
      <button type="button" :aria-pressed="tab === 'lore'" @click="tab = 'lore'">角色 / 世界书</button>
      <a :href="WORKSHOP_URL + '/submit'" target="_blank" rel="noopener noreferrer">上传立绘</a>
      <a :href="WORKSHOP_URL + '/characters-submit'" target="_blank" rel="noopener noreferrer">上传设定 / 我的投稿</a>
    </nav>
    <KeepAlive><PortraitPanel v-if="tab === 'portraits'" /><CharacterWorkshopPanel v-else embedded @close="$emit('close')" /></KeepAlive>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import PortraitPanel from './PortraitPanel.vue';
import CharacterWorkshopPanel from './CharacterWorkshopPanel.vue';
import { WORKSHOP_URL } from './portrait-workshop';
defineEmits<{ close: [] }>();
const tab = ref<'portraits' | 'lore'>('portraits');
</script>
<style scoped>
.creative-workshop{margin:10px 0;padding:12px;border:1px solid var(--t-border,#c3b39488);border-radius:var(--t-radius,10px);color:var(--t-text,inherit);box-sizing:border-box;min-width:0}
.workshop-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.workshop-heading h3{margin:0;font-size:16px}
.workshop-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0}.workshop-tabs button,.workshop-heading button,.workshop-tabs a{font:inherit;padding:6px 10px;border:1px solid var(--t-border,#c3b39488);border-radius:6px;background:transparent;color:inherit;cursor:pointer;text-decoration:none}
.workshop-tabs [aria-pressed=true]{background:var(--t-accent-dim,#c6ad7f22);border-color:var(--t-accent,#8a6a39)}
</style>
