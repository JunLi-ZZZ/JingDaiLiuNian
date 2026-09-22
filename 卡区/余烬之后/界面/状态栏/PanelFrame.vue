<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Schema } from '../../src/schema';
import type { StateChange } from '../../src/state-changes';
import { formatGameTime } from '../../src/game-time';
const props = defineProps<{ state: Schema; changes: StateChange[]; hasPrevious: boolean; updateBlock: boolean }>();
const expanded = ref(false);
const player = computed(() => props.state._实体[props.state._开局.主角ID]);
const pending = computed(() => Object.keys(props.state.待审提案).length);
const clock = computed(() => {
  try {
    return formatGameTime(props.state, props.state._时空.当前地点.位面ID).time;
  } catch {
    return '—';
  }
});
</script>
<template>
  <section class="panel-frame" aria-label="旅途状态栏">
    <button
      class="panel-toggle"
      type="button"
      :aria-expanded="expanded"
      aria-controls="embers-panel-content"
      @click="expanded = !expanded"
    >
      <span class="panel-name"
        ><strong>旅途手记</strong><span>{{ state._开局.档案.姓名 }}</span></span
      >
      <span class="brief"
        >生命 {{ player?.生命?.当前 ?? '—' }} / {{ player?.生命?.上限 ?? '—' }}<span>{{ clock }}</span></span
      >
      <span class="badges"
        ><span v-if="pending" class="pending">{{ pending }} 项待确认</span
        ><span v-if="changes.length">{{ changes.length }} 项变化</span
        ><span>{{ expanded ? '收起 ▴' : '展开 ▾' }}</span></span
      >
    </button>
    <div v-show="expanded" id="embers-panel-content">
      <slot />
    </div>
  </section>
</template>
<style scoped>
.panel-frame {
  max-width: 880px;
  margin: 12px auto;
  color: #e8e0d2;
  font:
    12px/1.7 'Microsoft YaHei',
    sans-serif;
  overflow-wrap: anywhere;
}
.panel-toggle {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  padding: 14px 18px;
  background: #253635;
  color: inherit;
  border: 1px solid #a38d695e;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.panel-name {
  display: flex;
  gap: 12px;
  align-items: baseline;
}
.panel-name strong {
  color: #dbc29c;
  font-size: 15px;
  font-weight: 500;
}
.brief,
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.brief {
  color: #c5d2c7;
}
.badges {
  margin-left: auto;
}
.pending {
  color: #f2c583;
}
.change-log {
  padding: 14px 18px;
  background: #f6f5ef;
  color: #34433c;
  border: 1px solid #ccd4ca;
}
.change-log summary {
  cursor: pointer;
}
.change-log p {
  color: #607166;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 10px 0;
  border-top: 1px solid #d8ddd5;
}
li strong,
li del,
li span {
  display: block;
}
li del {
  color: #879085;
  text-decoration: none;
}
li span {
  color: #375c47;
}
@media (max-width: 480px) {
  .panel-toggle {
    gap: 6px 15px;
    padding: 12px 14px;
  }
  .badges {
    width: 100%;
    margin-left: 0;
  }
  .badges span:last-child {
    margin-left: auto;
  }
}
</style>
