<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Schema } from '../../src/schema';
import type { ArchiveEdit } from '../../src/settlement';
const props = defineProps<{ state: Schema; latest: boolean; busy: boolean }>();
const emit = defineEmits<{ edit: [edit: ArchiveEdit] }>();
const resourceId = ref('energy');
const amount = ref(0);
const evidence = ref('');
const retry = ref(true);
const player = computed(() => props.state._实体[props.state._开局.主角ID]);
const selected = computed(() => resourceId.value === 'life' ? player.value.生命 : player.value.资源[resourceId.value]);
watch(selected, value => { amount.value = value?.当前 ?? 0; }, { immediate: true });
function submit() {
  if (!selected.value) return;
  emit('edit', { kind: 'repair', retry: retry.value && !!props.state._待修复, operation: { kind: 'reconcile', actorId: props.state._开局.主角ID, resourceId: resourceId.value, before: selected.value.当前, value: Number(amount.value), evidence: evidence.value.trim() } });
}
</script>
<template>
  <details class="correction" :open="!!state._待修复">
    <summary>补记与校正 <span v-if="state._待修复">· 有待修复更新</span></summary>
    <p>正文已经发生、数值却漏记时，在这里补齐当前值。修改依据会保存在结果记录中。</p>
    <p v-if="state._待修复" role="status">待修复原因：{{ state._待修复.原因 }}。原操作仍保留，补齐后可一并重试。</p>
    <form @submit.prevent="submit">
      <label>校正项目<select v-model="resourceId" aria-label="校正项目" @change="amount = selected?.当前 || 0"><option value="life">生命</option><option v-for="(r, id) in player.资源" :key="id" :value="id">{{ r.名称 }}</option></select></label>
      <label>校正后的当前值 <small>现为 {{ selected?.当前 ?? '—' }} / {{ selected?.上限 ?? '不限' }}</small><input v-model.number="amount" type="number" min="0" :max="selected?.上限 ?? undefined" required /></label>
      <label>依据<textarea v-model="evidence" minlength="4" maxlength="500" required placeholder="例如：上一轮接触配电箱，已吸收30点电荷但漏记" /></label>
      <label v-if="state._待修复" class="check"><input v-model="retry" type="checkbox" />补记后重试原更新（时间、叙事和动作一并保存）</label>
      <button :disabled="!latest || busy || !selected">保存校正{{ retry && state._待修复 ? '并重试' : '' }}</button>
      <button v-if="state._待修复" type="button" :disabled="!latest || busy" @click="emit('edit', {kind:'retry'})">仅重试原更新</button>
    </form>
  </details>
</template>
<style scoped>
.correction{margin:16px 0;border:1px solid #c8d3cb;border-radius:6px;background:#f1f5f0;padding:14px;font-size:12px}summary{cursor:pointer;font-weight:600;color:#304841}p{line-height:1.8}form{display:grid;gap:12px}label{display:grid;gap:6px}small{color:#6f786d}input,select,textarea{min-width:0;width:100%;box-sizing:border-box;padding:9px;border:1px solid #bacbbf;background:#fff;color:#263f35;border-radius:4px;font:inherit}textarea{min-height:64px;resize:vertical}.check{display:flex;align-items:center}.check input{width:auto}button{padding:10px;border:0;background:#304841;color:white;border-radius:4px;cursor:pointer}button:disabled{opacity:.45;cursor:default}
</style>
