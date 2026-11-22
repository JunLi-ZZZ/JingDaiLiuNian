<template>
  <button
    type="button"
    class="field-row"
    :class="{ expanded }"
    :aria-expanded="expandable ? expanded : undefined"
    :disabled="!expandable"
    @click="$emit('toggle')"
  >
    <span class="field-label">{{ label }}</span>
    <span class="field-content">
      <span class="field-value" :class="{ dim: !value }">{{ value || '—' }}</span>
      <span v-if="expanded && description" class="field-description">{{ description }}</span>
    </span>
    <span v-if="status" class="field-status">{{ status }}</span>
    <span v-if="expandable" class="field-arrow" aria-hidden="true">{{ expanded ? '▾' : '▸' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  field?: { 名称?: string; 状态?: string; 描述?: string };
  expanded: boolean;
}>();
defineEmits<{ toggle: [] }>();

function fieldText(text?: string) {
  return text === '待设定' || text === '待設定' ? '' : text || '';
}

const value = computed(() => fieldText(props.field?.名称));
const status = computed(() => fieldText(props.field?.状态));
const description = computed(() => fieldText(props.field?.描述));
const expandable = computed(() => Boolean(value.value || status.value || description.value));
</script>

<style scoped lang="scss">
.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius-sm);
  background: var(--t-bg);
  color: var(--t-text);
  text-align: left;
  font: inherit;
  cursor: pointer;

  &:hover:not(:disabled),
  &.expanded {
    background: var(--t-surface-deep);
  }
  &:focus-visible {
    outline: 2px solid var(--t-accent);
    outline-offset: 1px;
  }
  &:disabled {
    cursor: default;
  }
  &.expanded {
    align-items: flex-start;
  }
}
.field-label,
.field-arrow {
  flex: 0 0 auto;
  white-space: nowrap;
  color: var(--t-dim);
}
.field-label {
  min-width: 28px;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  letter-spacing: 0.5px;
}
.field-content {
  flex: 1;
  min-width: 0;
}
.field-value,
.field-status {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-value {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px;

  &.dim {
    color: var(--t-dim);
  }
}
.field-status {
  min-width: 0;
  max-width: 32%;
  padding: 1px 8px;
  border-radius: 9999px;
  color: var(--t-accent);
  background: var(--t-accent-dim);
  font-size: 9px;
}
.field-arrow {
  font-size: 9px;
}
.field-description {
  display: block;
  margin-top: 3px;
  color: var(--t-muted);
  font-size: 10px;
  line-height: 1.5;
}
.expanded .field-value,
.expanded .field-status,
.field-description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
