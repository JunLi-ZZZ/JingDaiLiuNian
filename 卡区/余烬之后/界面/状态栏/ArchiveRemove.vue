<script setup lang="ts">
import {ref} from 'vue';
import type {Schema} from '../../src/schema';
import type {ArchiveCategory} from '../../src/archive-tools';
import type {ArchiveEdit} from '../../src/settlement';
const props=defineProps<{state:Schema;category:ArchiveCategory;id:string;latest?:boolean;restore?:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const base=ref<Schema>();
function begin(){base.value=_.cloneDeep(props.state);}
function confirm(){if(base.value){emit('edit',{kind:props.restore?'restore':'remove',category:props.category,id:props.id,base:base.value});base.value=undefined;}}
</script>
<template><div class="archive-remove"><button v-if="!base" :disabled="latest===false" @click="begin">{{restore?'恢复档案':'移除档案'}}</button>
<div v-else class="confirm"><p>{{restore?'恢复到状态栏与后续资料查询。':'从状态栏与后续提示词移除；关联人物或实体及其见闻一并停止收录。历史与数值结算保留，可在「整理」页恢复。'}}</p><button :disabled="latest===false" @click="confirm">{{restore?'确认恢复':'确认移除'}}</button><button @click="base=undefined">取消</button></div></div></template>
<style scoped>.archive-remove{margin-top:10px;font:12px/1.8 sans-serif}.confirm{padding:10px;border:1px solid #c9b8a5;background:#fbf5ec;border-radius:4px}button{padding:8px 12px;border:1px solid #bbcab6;background:#edf1e7;color:#3d503b;cursor:pointer;border-radius:4px;margin-right:8px}button:disabled{opacity:.5}</style>
