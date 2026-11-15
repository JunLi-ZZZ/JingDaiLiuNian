<template>
  <section class="creative-workshop" aria-label="创意工坊">
    <header class="workshop-heading"><div class="workshop-brand"><span class="workshop-mark" aria-hidden="true">◈</span><div><h3>创意工坊</h3><p>管理本地图库，发现云端资料</p></div></div><button class="workshop-close" type="button" aria-label="关闭创意工坊" @click="$emit('close')">×</button></header>
    <div class="workshop-navigation"><nav class="workshop-tabs" aria-label="工坊分类"><button type="button" :aria-pressed="tab === 'portraits'" @click="tab = 'portraits'">立绘图库</button><button type="button" :aria-pressed="tab === 'lore'" @click="tab = 'lore'">角色 / 世界书</button></nav><nav class="workshop-publish" aria-label="投稿入口"><span>分享作品</span><a :href="WORKSHOP_URL + '/submit'" target="_blank" rel="noopener noreferrer">上传立绘 ↗</a><a :href="WORKSHOP_URL + '/characters-submit'" aria-label="上传设定 / 我的投稿" target="_blank" rel="noopener noreferrer">上传设定 ↗</a></nav></div>
    <div class="workshop-body"><KeepAlive><PortraitPanel v-if="tab === 'portraits'" /><CharacterWorkshopPanel v-else embedded @close="$emit('close')" /></KeepAlive></div>
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
.creative-workshop{--cw-bg:var(--t-bg,var(--c-bg,#f7f8fa));--cw-surface:var(--t-surface,var(--c-card-bg,#fff));--cw-elevated:var(--t-surface-open,var(--c-card-hover,#edf0f5));--cw-text:var(--t-text,var(--c-text,#353c46));--cw-muted:var(--t-muted,var(--c-text-dim,#7b8490));--cw-accent:var(--t-accent,var(--c-gold,#61728c));--cw-accent-soft:var(--t-accent-dim,var(--c-card-hover,#e9eef5));--cw-line:var(--t-border,var(--c-border,#dce1e7));--cw-on-accent:#000;--cw-danger:#b75165;--cw-radius:var(--t-radius,15px);color-scheme:light;margin:14px 0;border:1px solid var(--cw-line);border-radius:var(--cw-radius);background:var(--cw-bg);color:var(--cw-text);font-family:inherit;font-size:13px;line-height:1.65;min-width:0;box-sizing:border-box;overflow-wrap:anywhere;box-shadow:0 6px 22px #00000005}
.workshop-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 22px 18px}.workshop-brand{display:flex;align-items:center;gap:12px;min-width:0}.workshop-mark{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--cw-line);border-radius:11px;color:var(--cw-accent);background:var(--cw-accent-soft);font-size:23px;flex-shrink:0}.workshop-heading h3{margin:0;font-size:19px;letter-spacing:.04em;line-height:1.4;font-weight:600;color:var(--cw-text)}.workshop-heading p{margin:5px 0 0;font-size:11px;color:var(--cw-muted)}.workshop-close{width:31px;height:31px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--cw-line);border-radius:50%;background:transparent;color:var(--cw-muted);font:inherit;font-size:20px;line-height:1;cursor:pointer}.workshop-close:hover{background:var(--cw-accent-soft);color:var(--cw-accent)}
.workshop-navigation{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 22px 18px;flex-wrap:wrap}.workshop-tabs{margin:0;display:flex;gap:6px}.workshop-tabs button{border:1px solid transparent;background:transparent;color:var(--cw-muted);font:inherit;padding:9px 14px;border-radius:9px;cursor:pointer;white-space:nowrap;line-height:1.4}.workshop-tabs [aria-pressed=true]{background:var(--cw-accent-soft);color:var(--cw-accent);font-weight:600}.workshop-publish{margin:0;display:flex;align-items:center;gap:12px;font-size:11px;flex-wrap:wrap}.workshop-publish>span{color:var(--cw-muted);font-size:10px}.workshop-publish a{color:var(--cw-accent);text-decoration:none;padding:5px 0;border-bottom:1px solid transparent;white-space:nowrap}.workshop-publish a:hover{border-bottom-color:var(--cw-accent)}.workshop-body{padding:20px 22px 22px;border-top:1px solid var(--cw-line);background:var(--cw-surface);border-radius:0 0 var(--cw-radius) var(--cw-radius)}button:focus-visible,a:focus-visible{outline:2px solid var(--cw-accent);outline-offset:3px}
@media(max-width:480px){.workshop-heading{padding:18px 14px 15px}.workshop-heading h3{font-size:17px}.workshop-heading p{font-size:10px}.workshop-mark{width:33px;height:33px;font-size:20px}.workshop-navigation{padding:0 14px 15px;gap:12px}.workshop-tabs{width:100%}.workshop-tabs button{flex:1;padding:9px 10px;font-size:12px}.workshop-publish{width:100%;gap:16px;padding-top:2px}.workshop-publish>span{margin-right:auto}.workshop-body{padding:16px 12px 18px}.creative-workshop{font-size:13px}}
</style>

<style>
.theme-purple .creative-workshop,.theme-gold .creative-workshop,.theme-teal .creative-workshop,.theme-rose .creative-workshop,.theme-dark .creative-workshop{--cw-danger:#ed96a4;--cw-on-accent:var(--cw-bg);color-scheme:dark}
</style>
