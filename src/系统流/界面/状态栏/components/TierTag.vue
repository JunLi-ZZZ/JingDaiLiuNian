<template>
  <span class="tier-tag" :style="style">{{ 品阶 }}</span>
</template>

<script setup lang="ts">
import { tierMeta } from '../tier';

const props = defineProps<{ 品阶: string }>();

const style = computed(() => {
  const m = tierMeta(props.品阶);
  return {
    color: m.color,
    borderColor: `${m.color}55`,
    background: `linear-gradient(135deg, ${m.deep}40, transparent 70%)`,
    textShadow: `0 0 6px ${m.color}88`,
  };
});
</script>

<style scoped>
.tier-tag {
  flex-shrink: 0;
  padding: 0 6px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  letter-spacing: 1px;
}
</style>
