<script setup lang="ts">
import {computed,ref} from 'vue';
import {archiveEntries} from '../../src/archive-tools';
import type {Schema} from '../../src/schema';
import type {ArchiveEdit} from '../../src/settlement';
import ArchiveRemove from './ArchiveRemove.vue';
const props=defineProps<{state:Schema;latest?:boolean}>();
const emit=defineEmits<{edit:[edit:ArchiveEdit]}>();
const search=ref(''),mode=ref('当前');
const entries=computed(()=>archiveEntries(props.state).filter(e=>(mode.value==='已移除'?e.explicit:!e.removed) && (e.name+e.id+e.label).includes(search.value)));
</script>
<template><section class="archive-manager"><h3>档案整理</h3><p>整理本局收录的资料。移除后保留历史与数值账本，可随时恢复。</p><select v-model="mode" aria-label="档案范围"><option>当前</option><option>已移除</option></select><input v-model="search" placeholder="搜索名称、ID或类别" aria-label="搜索整理档案" />
<details v-for="entry in entries.slice(-80)" :key="entry.category+entry.id"><summary>{{entry.label}} · {{entry.name}}<small>{{entry.id}}</small></summary><ArchiveRemove :id="entry.id" :state="state" :latest="latest" :category="entry.category" :restore="entry.explicit" @edit="emit('edit',$event)" /></details><p v-if="!entries.length">暂无符合条件的档案。</p><small v-if="entries.length>80">显示最近80项，可输入名称检索更早资料。</small></section></template>
<style scoped>.archive-manager{font:13px/1.8 sans-serif}h3{font:22px serif}input,select{box-sizing:border-box;padding:10px;margin:0 8px 10px 0;max-width:100%;border:1px solid #bfccb8;background:#f8faf4;color:#324735}details{padding:12px;border-bottom:1px solid #c0ccb9}summary{cursor:pointer;overflow-wrap:anywhere}small{display:block;color:#718366}</style>
