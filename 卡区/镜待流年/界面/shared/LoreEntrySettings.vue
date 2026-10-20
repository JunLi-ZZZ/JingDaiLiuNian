<template>
  <div class="lore-settings">
    <label>条目分类<select aria-label="条目分类" :value="modelValue.category" @change="set('category', value($event))"><option value="auto">跟随资料分类 · {{ LORE_CATEGORIES[packageCategory] }}</option><option v-for="(label, key) in LORE_CATEGORIES" :key="key" :value="key">{{ label }}</option></select></label>
    <details class="lore-advanced"><summary>世界书配置 · {{ modelValue.order === 'auto' ? '自动顺序' : `顺序 ${modelValue.order}` }} · {{ modelValue.activation === 'constant' ? '常驻' : '关键词触发' }}</summary>
      <div class="lore-grid">
        <label>激活方式<select aria-label="激活方式" :value="modelValue.activation" @change="set('activation', value($event))"><option value="selective">关键词触发（绿灯）</option><option value="constant">常驻（蓝灯）</option></select></label>
        <label>插入顺序（留空自动）<input type="number" min="0" max="999999" :value="modelValue.order === 'auto' ? '' : modelValue.order" placeholder="按分类自动分配" @input="number('order', $event, 'auto')" /></label>
        <label>插入位置<select aria-label="插入位置" :value="modelValue.position" @change="set('position', value($event))"><option value="before_character_definition">角色定义之前</option><option value="after_character_definition">角色定义之后</option><option value="before_example_messages">示例消息之前</option><option value="after_example_messages">示例消息之后</option><option value="before_author_note">作者注释之前</option><option value="after_author_note">作者注释之后</option><option value="at_depth">指定聊天深度</option></select></label>
        <label>扫描深度（留空跟随全局）<input type="number" min="0" max="1000" :value="modelValue.scan_depth === 'same_as_global' ? '' : modelValue.scan_depth" placeholder="跟随全局" @input="number('scan_depth', $event, 'same_as_global')" /></label>
        <label v-if="modelValue.position === 'at_depth'">消息身份<select aria-label="消息身份" :value="modelValue.role" @change="set('role', value($event))"><option value="system">系统</option><option value="user">用户</option><option value="assistant">助手</option></select></label>
        <label v-if="modelValue.position === 'at_depth'">插入深度<input type="number" min="0" max="1000" :value="modelValue.depth" @input="number('depth', $event, 0)" /></label>
        <label>激活概率（%）<input type="number" min="0" max="100" :value="modelValue.probability" @input="number('probability', $event, 100)" /></label>
        <label>次要关键词逻辑<select aria-label="次要关键词逻辑" :value="modelValue.secondary_logic" @change="set('secondary_logic', value($event))"><option value="and_any">任意一个存在</option><option value="and_all">全部存在</option><option value="not_any">全部不存在</option><option value="not_all">并非全部存在</option></select></label>
      </div>
      <label>次要关键词（逗号分隔，可留空）<input :value="modelValue.secondary_keys.join('，')" @input="secondary($event)" /></label>
      <label class="lore-check"><input type="checkbox" :checked="modelValue.prevent_incoming" @change="set('prevent_incoming', checked($event))" />禁止被其他世界书条目递归激活</label>
      <label class="lore-check"><input type="checkbox" :checked="modelValue.prevent_outgoing" @change="set('prevent_outgoing', checked($event))" />禁止本条目继续递归激活其他条目</label>
      <div class="lore-grid">
        <label>延迟递归层数（留空关闭）<input type="number" min="1" max="1000" :value="modelValue.delay_until" @input="number('delay_until', $event, null)" /></label>
        <label>黏性楼层数（留空关闭）<input type="number" min="1" max="1000" :value="modelValue.sticky" @input="number('sticky', $event, null)" /></label>
        <label>冷却楼层数（留空关闭）<input type="number" min="1" max="1000" :value="modelValue.cooldown" @input="number('cooldown', $event, null)" /></label>
        <label>延迟激活楼层数（留空关闭）<input type="number" min="1" max="1000" :value="modelValue.delay" @input="number('delay', $event, null)" /></label>
      </div>
      <button type="button" @click="$emit('update:modelValue', defaultLoreSettings())">恢复自动配置</button>
    </details>
  </div>
</template>
<script setup lang="ts">
import { defaultLoreSettings, LORE_CATEGORIES, type LoreCategory, type LoreSettings } from './lore-settings';
const props = defineProps<{ modelValue: LoreSettings; packageCategory: LoreCategory }>();
const emit = defineEmits<{ 'update:modelValue': [value: LoreSettings] }>();
const value = (event: Event) => (event.target as HTMLInputElement).value;
const checked = (event: Event) => (event.target as HTMLInputElement).checked;
function set(key: keyof LoreSettings, input: unknown) { emit('update:modelValue', { ...props.modelValue, [key]: input }); }
function number(key: keyof LoreSettings, event: Event, fallback: number | string | null) { const input = value(event); set(key, input === '' ? fallback : Number(input)); }
function secondary(event: Event) { set('secondary_keys', value(event).split(/[,，、\n]/).map(key => key.trim()).filter(Boolean)); }
</script>
<style scoped>
.lore-settings { margin: 8px 0; }.lore-settings label { display: block; margin: 7px 0; font-size: 11px; }.lore-settings input,.lore-settings select { width: 100%; max-width: 100%; box-sizing: border-box; padding: 7px; border: 1px solid var(--t-border, #b59c7255); border-radius: 4px; background: var(--t-bg, #f4efe5); color: inherit; font: inherit; }
.lore-advanced { padding: 8px; border: 1px dashed var(--t-border, #b59c7255); border-radius: 4px; }.lore-advanced summary { cursor: pointer; font-size: 11px; color: var(--t-accent, #8a6a39); }.lore-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 9px; }.lore-check { display: flex !important; gap: 7px; align-items: start; }.lore-check input { flex: 0 0 14px; width: 14px; margin-top: 3px; }.lore-settings button { font: inherit; padding: 5px 8px; border: 1px solid var(--t-border, #b59c7255); border-radius: 4px; background: var(--t-accent-dim, #c6ad7f22); color: var(--t-accent, #8a6a39); cursor: pointer; }@media(max-width:420px){.lore-grid{grid-template-columns:1fr}}
</style>
