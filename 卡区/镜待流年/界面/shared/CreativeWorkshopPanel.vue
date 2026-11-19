<template>
  <FeatureOverlay title="创意工坊" icon="◈" :theme="theme" :components="portalComponents" @close="$emit('close')">
    <section class="creative-workshop">
      <div class="workshop-navigation">
        <nav class="workshop-tabs" aria-label="工坊分类">
          <button type="button" :aria-pressed="tab === 'portraits'" @click="tab = 'portraits'">立绘图库</button>
          <button type="button" :aria-pressed="tab === 'lore'" @click="tab = 'lore'">角色与世界书</button>
        </nav>
        <a
          class="workshop-publish"
          :href="WORKSHOP_URL + (tab === 'portraits' ? '/submit' : '/characters-submit')"
          target="_blank"
          rel="noopener noreferrer"
        >{{ tab === 'portraits' ? '上传立绘' : '上传设定' }} <span aria-hidden="true">↗</span></a>
      </div>

      <nav class="workshop-sources" aria-label="资料来源">
        <button type="button" :aria-pressed="source === 'local'" @click="source = 'local'">本地</button>
        <button type="button" :aria-pressed="source === 'cloud'" @click="source = 'cloud'">云端</button>
      </nav>

      <div ref="body" class="workshop-body">
        <KeepAlive>
          <PortraitPanel v-if="tab === 'portraits'" :source="source" />
          <CharacterWorkshopPanel v-else embedded :source="source" />
        </KeepAlive>
      </div>
    </section>
  </FeatureOverlay>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref, watch } from 'vue';
import FeatureOverlay from './FeatureOverlay.vue';
import PortraitPanel from './PortraitPanel.vue';
import CharacterWorkshopPanel from './CharacterWorkshopPanel.vue';
import LoreEntrySettings from './LoreEntrySettings.vue';
import { WORKSHOP_URL } from './portrait-workshop';

withDefaults(defineProps<{ theme?: string }>(), { theme: 'cream' });
defineEmits<{ close: [] }>();
const portalComponents = [getCurrentInstance()!.type, PortraitPanel, CharacterWorkshopPanel, LoreEntrySettings];
const tab = ref<'portraits' | 'lore'>('portraits');
const source = ref<'local' | 'cloud'>('local');
const body = ref<HTMLElement>();
watch([tab, source], () => body.value?.scrollTo({ top: 0 }), { flush: 'post' });
</script>

<style scoped>
.creative-workshop {
  --cw-bg: var(--panel-bg);
  --cw-text: var(--panel-text);
  --cw-muted: var(--panel-muted);
  --cw-accent: var(--panel-accent);
  --cw-surface: color-mix(in srgb, var(--cw-accent) 5%, var(--cw-bg));
  --cw-elevated: color-mix(in srgb, var(--cw-accent) 15%, var(--cw-bg));
  --cw-accent-soft: color-mix(in srgb, var(--cw-accent) 19%, var(--cw-bg));
  --cw-line: var(--panel-line);
  --cw-on-accent: #171318;
  --cw-danger: #a23d54;
  --cw-radius: 12px;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-wrap: anywhere;
  text-align: left;
}
.is-dark .creative-workshop { --cw-danger: #ed96a4; }
.workshop-navigation,
.workshop-sources {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-inline: clamp(12px, 4vw, 24px);
}
.workshop-navigation {
  flex-wrap: wrap;
  justify-content: space-between;
  padding-block: 12px;
}
.workshop-tabs { display: flex; gap: 6px; }
.workshop-sources {
  background: var(--cw-surface);
  border-block: 1px solid var(--cw-line);
  padding-block: 7px;
}
.workshop-navigation button,
.workshop-publish,
.workshop-sources button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 5px 12px;
  border: 1px solid var(--cw-line);
  border-radius: 8px;
  background: var(--cw-surface);
  color: var(--cw-text);
  font: inherit;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}
.workshop-navigation button:hover,
.workshop-publish:hover,
.workshop-sources button:hover,
.workshop-navigation button[aria-pressed='true'],
.workshop-sources button[aria-pressed='true'] {
  border-color: var(--cw-accent);
  background: var(--cw-accent-soft);
}
.workshop-navigation button[aria-pressed='true'],
.workshop-sources button[aria-pressed='true'] {
  box-shadow: inset 0 -2px var(--cw-accent);
  font-weight: 700;
}
.workshop-publish { background: var(--cw-elevated); }
.workshop-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 16px clamp(12px, 4vw, 24px) 24px;
}
.creative-workshop :deep(:is(button, a, input, select, textarea, summary):focus-visible) {
  outline: 2px solid var(--cw-accent);
  outline-offset: 2px;
}
.creative-workshop :deep(button:disabled) { opacity: .48; cursor: not-allowed; }
@media (max-width: 450px) {
  .workshop-navigation { gap: 6px; }
  .workshop-navigation button,
  .workshop-publish,
  .workshop-sources button { padding-inline: 8px; font-size: 12px; }
}
</style>
