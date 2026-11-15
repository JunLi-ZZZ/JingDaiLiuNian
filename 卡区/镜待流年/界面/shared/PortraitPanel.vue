<template>
<div class="portrait-panel">
  <div class="library-topline">
    <div class="library-tabs" role="tablist" aria-label="图库来源">
      <button role="tab" :aria-selected="view === 'local'" @click="view = 'local'">本地图库</button>
      <button role="tab" :aria-selected="view === 'cloud'" :disabled="!ready" @click="openWorkshop">云端工坊</button>
    </div>
    <button class="library-switch" role="switch" :aria-checked="enabled" @click="enabled = !enabled"><span class="switch-track"><span></span></span>{{ enabled ? '立绘已开启' : '立绘已关闭' }}</button>
  </div>
  <p v-if="!ready" class="empty-hint" role="status">{{ message || '正在读取本地图库…' }}</p>
  <template v-else-if="view === 'local'">
    <div class="group-section">
      <label class="group-picker"><span>当前分组</span><select v-model="activeGroupId" aria-label="当前立绘分组"><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}{{ group.id === DEFAULT_GROUP ? '（默认）' : '' }}</option></select></label>
      <details class="group-manager"><summary>管理分组</summary><div class="group-manager-body">
        <label>分组名称<input v-model="groupNameDraft" maxlength="100" placeholder="输入新建或重命名的名称" aria-label="分组名称" /></label>
        <div class="action-row"><button :disabled="busySave || !groupNameDraft.trim()" @click="createGroup">新建组</button><button :disabled="busySave || !groupNameDraft.trim()" @click="renameGroup">重命名当前组</button></div>
        <div class="group-order"><span>分组顺序</span><button aria-label="上移当前分组" :disabled="busySave || activeGroupIndex === 0" @click="moveGroup(-1)">↑ 上移</button><button aria-label="下移当前分组" :disabled="busySave || activeGroupIndex === groups.length - 1" @click="moveGroup(1)">↓ 下移</button><button class="danger-text" :disabled="busySave || activeGroupId === DEFAULT_GROUP" @click="deleteGroup">删除分组</button></div>
      </div></details>
    </div>
    <div class="library-toolbar"><p class="library-count"><strong>{{ activeItems.length }}</strong> 张立绘 <span>{{ categoryCount }} 个分类</span></p><div class="toolbar-actions"><button class="primary-button" :aria-expanded="showAdd" @click="showAdd = !showAdd">＋ 添加立绘</button><button :aria-pressed="organizing" @click="organizing = !organizing">{{ organizing ? '完成排序' : '调整顺序' }}</button><details class="library-tools"><summary>导入 / 导出</summary><div class="library-tools-body"><button @click="exportLibrary">导出组包</button><button :disabled="!!cloudOperation" @click="exportOffline">离线备份</button><button :disabled="!!cloudOperation || !activeItems.length" @click="exportSubmission">导出投稿组包</button><label>合并组包<input type="file" accept="application/json,.json" @change="importLibrary($event, 'merge')" /></label><label>替换本组<input type="file" accept="application/json,.json" @change="importLibrary($event, 'replace')" /></label><button class="danger-text" @click="clearLibrary">清空本组</button></div></details></div></div>
    <form v-if="showAdd" class="portrait-form" @submit.prevent="add">
      <label>角色名<input v-model="form.name" maxlength="80" placeholder="立绘对应的角色" aria-label="新增立绘角色名" /></label><label>分类标签<input v-model="form.tag" maxlength="120" placeholder="如：常服、出场、战斗" aria-label="新增立绘标签" /></label>
      <label class="wide-field">图片地址<input v-model="form.url" placeholder="粘贴图片直链，或选择本地图片" aria-label="新增立绘图片地址" /></label><label class="wide-field">说明<input v-model="form.caption" maxlength="1000" placeholder="可选" aria-label="新增立绘说明" /></label>
      <div class="wide-field action-row"><label class="file-button">选择本地图片<input type="file" accept="image/*" @change="readFile" /></label><button class="primary-button" :disabled="!canAdd || busySave">保存到图库</button><button type="button" @click="showAdd = false">取消</button></div>
    </form>
    <div class="local-filter"><input v-model="libraryQuery" aria-label="搜索本地立绘" placeholder="搜索角色、标签或说明" /><select v-model="sortMode" aria-label="按分类整理立绘" :disabled="busySave || activeItems.length < 2" @change="sortLocal"><option value="">按分类整理</option><option value="character">按角色、标签排序</option><option value="tag">按标签、角色排序</option></select></div>
    <p v-if="organizing" class="organize-tip">拖动卡片调整顺序，手机可用上下按钮。顺序会自动保存，导出组包也采用此顺序。</p>
    <p v-if="!visibleItems.length" class="empty-hint">{{ libraryQuery ? '没有匹配的立绘，试试其他关键词。' : '还没有立绘，添加图片或导入组包即可开始。' }}</p>
    <div class="portrait-items">
      <article v-for="(item, visibleIndex) in visibleItems" :key="item.id" class="portrait-item" :class="{ 'is-drag-target': dropTargetId === item.id, 'is-organizing': organizing }" :data-portrait-id="item.id" :draggable="organizing && !busySave" @dragstart="beginDrag($event, item.id)" @dragover.prevent="dropTargetId = organizing ? item.id : null" @dragleave="dropTargetId = null" @drop.prevent="dropItem(item.id)" @dragend="draggingId = null; dropTargetId = null">
        <div class="portrait-row"><span v-if="organizing" class="order-index" aria-hidden="true">⠿</span><button class="portrait-toggle" :aria-expanded="!!item.open" @click="item.open = !item.open"><span class="portrait-thumb"><img :src="item.url" alt="" loading="lazy" :draggable="false" /></span><span class="portrait-meta"><b>{{ item.name }}</b><small>{{ item.tag }}</small><span v-if="item.caption">{{ item.caption }}</span></span><span class="portrait-chevron" aria-hidden="true">{{ item.open ? '−' : '+' }}</span></button><div v-if="organizing" class="portrait-order-buttons"><button :aria-label="'上移立绘 ' + item.id" :disabled="busySave || visibleIndex === 0" @click="moveItem(item.id, -1)">↑</button><button :aria-label="'下移立绘 ' + item.id" :disabled="busySave || visibleIndex === visibleItems.length - 1" @click="moveItem(item.id, 1)">↓</button></div></div>
        <div v-if="item.open" class="portrait-detail"><img :src="item.url" :alt="item.caption || item.name" loading="lazy" title="点击放大" @click="enlarged = item.url" /><div class="detail-actions"><button @click="startItemEdit(item)">编辑分类 / 移动分组</button><details class="portrait-reference"><summary>精确引用</summary><code>[[portrait:{{ item.id }}]]</code></details><button class="danger-text" :disabled="busySave" @click="remove(item.id)">删除立绘</button></div>
          <form v-if="itemEditor?.id === item.id" class="item-editor" @submit.prevent="saveItemEdit"><label>角色名<input v-model="itemEditor.name" maxlength="80" aria-label="编辑立绘角色名" /></label><label>分类标签<input v-model="itemEditor.tag" maxlength="120" aria-label="编辑立绘标签" /></label><label class="wide-field">说明<input v-model="itemEditor.caption" maxlength="1000" aria-label="编辑立绘说明" /></label><label class="wide-field">所在分组<select v-model="itemEditor.targetGroupId" aria-label="移动立绘到分组"><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option></select></label><p class="wide-field editor-note">修改角色或标签会改变所属分类；登记 ID 与图片保持不变。</p><div class="wide-field action-row"><button class="primary-button" :disabled="busySave">保存修改</button><button type="button" @click="itemEditor = null">取消编辑</button></div></form>
        </div>
      </article>
    </div>
    <p class="library-note">同角色、同标签的图片归为一类，正文引用时从该类随机选择并保存。</p>
  </template>
  <section v-else class="workshop-list" aria-label="云端立绘组">
    <div class="workshop-bar"><div><strong>发现立绘</strong><p>下载组包可以直接进行，无需先打开预览。</p></div><button :disabled="cloudBusy" @click="loadWorkshop(false)">刷新</button></div>
    <form class="cloud-filter" @submit.prevent="applyWorkshopFilters"><input v-model="cloudQueryInput" maxlength="100" placeholder="搜索组名、角色或作者" aria-label="搜索云端立绘组" /><button type="submit" :disabled="cloudBusy">搜索</button><div class="cloud-sort" role="tablist" aria-label="云端立绘组排序"><button type="button" role="tab" :aria-selected="cloudSort === 'latest'" :disabled="cloudBusy" @click="changeWorkshopSort('latest')">最新</button><button type="button" role="tab" :aria-selected="cloudSort === 'hot'" :disabled="cloudBusy" @click="changeWorkshopSort('hot')">最热</button></div></form>
    <p v-if="cloudBusy" class="empty-hint" role="status">正在载入云端目录…</p><p v-else-if="!cloudGroups.length && !cloudError" class="empty-hint">暂无已发布立绘组。</p><p v-if="cloudError" class="panel-error" role="alert">{{ cloudError }}</p>
    <div class="cloud-results"><article v-for="group in cloudGroups" :key="group.id" class="cloud-group" :data-cloud-id="group.id"><div class="cloud-heading"><img v-if="group.cover_url" class="cloud-cover" :src="WORKSHOP_URL + group.cover_url" :alt="group.name" loading="lazy" referrerpolicy="no-referrer" /><span v-else class="cloud-placeholder" aria-hidden="true">{{ group.name.slice(0, 1) }}</span><div class="cloud-meta"><b>{{ group.name }}</b><small>{{ group.author_name || '未署名' }} · {{ group.asset_count }} 张 · 热度 {{ group.hot_score }}</small><p v-if="group.description">{{ group.description }}</p></div></div><div class="cloud-card-actions"><button :disabled="!!cloudOperation" :aria-expanded="cloudPreview?.id === group.id" @click="previewCloud(group)">{{ cloudPreview?.id === group.id ? '收起预览' : '预览' }}</button><div class="cloud-download-actions"><button class="primary-button cloud-download" :disabled="!!cloudOperation" @click="downloadCloud(group)">下载组包</button><details class="cloud-download-options"><summary aria-label="更多下载方式" title="更多下载方式">⌄</summary><div><button :disabled="!!cloudOperation" @click="downloadCloud(group, true)">离线备份（含图片）</button></div></details></div></div><details class="group-reference"><summary>配套立绘组 ID</summary><code>{{ group.id }}</code></details>
      <div v-if="cloudPreview?.id === group.id" class="cloud-detail"><div class="cloud-pictures"><figure v-for="item in cloudPreview.items" :key="item.id"><img :src="item.url" :alt="item.caption || item.name" loading="lazy" referrerpolicy="no-referrer" @click="enlarged = item.url" /><figcaption>{{ item.name }} · {{ item.tag }}</figcaption></figure></div><div class="cloud-actions"><button :disabled="!!cloudOperation" @click="mergeCloud(group)">合并到当前组</button><button :disabled="!!cloudOperation" @click="useCloud(group)">替换当前组</button></div></div>
    </article></div><button v-if="cloudCursor" class="cloud-more" :disabled="cloudBusy" @click="loadWorkshop(true)">加载更多</button><p v-if="cloudOperation" class="panel-status" role="status">{{ cloudOperation }}</p>
  </section>
  <p v-if="message" class="panel-status" role="status">{{ message }}</p>
  <Teleport to="body"><div v-if="enlarged" class="portrait-lightbox" role="dialog" aria-modal="true" aria-label="立绘大图" @click="enlarged = null"><img :src="enlarged" alt="立绘大图" /></div></Teleport>
</div>

</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { mergePortraitItems, parsePortraitGroup, portablePortraitGroup, portraitUrl, WORKSHOP_URL, workshopRequest } from './portrait-workshop';
import type { Portrait, PortraitGroup, WorkshopGroup, WorkshopSort } from './portrait-workshop';
import { loadPortraitGroups, portraitSettings, savePortraitGroups, PORTRAIT_ACTIVE_GROUP, PORTRAIT_ENABLED, PORTRAIT_REVISION } from './portrait-storage';

import { moveLibraryEntry, sortLibraryItems, editLibraryItem, moveLibraryItem } from './portrait-library';

const DEFAULT_GROUP = 'default';
const groups = ref<PortraitGroup[]>([{ id: DEFAULT_GROUP, name: '默认组', items: [] }]);
const activeGroupId = ref(portraitSettings().getItem(PORTRAIT_ACTIVE_GROUP) || DEFAULT_GROUP);
const activeGroup = computed(() => groups.value.find(group => group.id === activeGroupId.value) || groups.value[0]);
const activeItems = computed(() => activeGroup.value?.items || []);
const categoryCount = computed(() => new Set(activeItems.value.map(item => JSON.stringify([item.name, item.tag]))).size);
// 有登记图片时默认展示；用户可以关闭而不删除图库。
const enabled = ref(portraitSettings().getItem(PORTRAIT_ENABLED) !== '0');
const form = ref({ name: '', tag: '', url: '', caption: '' });
const message = ref('');
const enlarged = ref<string | null>(null);
const canAdd = computed(() => !!form.value.name.trim() && !!form.value.tag.trim() && !!form.value.url.trim());
const view = ref<'local' | 'cloud'>('local');
const cloudGroups = ref<WorkshopGroup[]>([]);
const cloudCursor = ref<string | null>(null);
const cloudBusy = ref(false);
const cloudLoaded = ref(false);
const cloudError = ref('');
const cloudOperation = ref('');
const cloudPreview = ref<PortraitGroup | null>(null);
const cloudSort = ref<WorkshopSort>('latest');
const cloudQuery = ref('');
const cloudQueryInput = ref('');
const ready = ref(false);
const showAdd = ref(false), organizing = ref(false), libraryQuery = ref(''), sortMode = ref('');
const groupNameDraft = ref(''), draggingId = ref<string | null>(null), dropTargetId = ref<string | null>(null);
const activeGroupIndex = computed(() => groups.value.findIndex(group => group.id === activeGroupId.value));
const visibleItems = computed(() => { const query = libraryQuery.value.trim().toLocaleLowerCase(); return query ? activeItems.value.filter(item => [item.name,item.tag,item.caption].join(' ').toLocaleLowerCase().includes(query)) : activeItems.value; });
const itemEditor = ref<{ id: string; name: string; tag: string; caption: string; targetGroupId: string } | null>(null);
const busySave = ref(false);
async function reload() {
  if (busySave.value) return;
  try { groups.value = await loadPortraitGroups(); ready.value = true; }
  catch (error) { ready.value = false; message.value = `读取图库失败：${failure(error)}`; }
}
const changed = (event: StorageEvent) => { if (event.key === PORTRAIT_REVISION) void reload(); };
onMounted(() => { void reload(); window.addEventListener('storage', changed); window.addEventListener('focus', reload); });
onUnmounted(() => { window.removeEventListener('storage', changed); window.removeEventListener('focus', reload); });
async function commit(next: PortraitGroup[]) {
  if (busySave.value) throw new Error('图库正在保存，请稍后重试');
  busySave.value = true;
  try { await savePortraitGroups(next); groups.value = next; }
  finally { busySave.value = false; }
}
function failure(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
  return typeof message === 'string' && message ? message : '操作失败';
}
async function openWorkshop() {
  view.value = 'cloud'; message.value = '';
  if (!cloudLoaded.value && !cloudBusy.value) await loadWorkshop(false);
}
function workshopPath(more: boolean) {
  const params = new URLSearchParams({ limit: '20', sort: cloudSort.value });
  if (cloudQuery.value) params.set('q', cloudQuery.value);
  if (more && cloudCursor.value) params.set('cursor', cloudCursor.value);
  return `/groups?${params.toString()}`;
}
async function loadWorkshop(more: boolean) {
  if (cloudBusy.value) return;
  cloudBusy.value = true; cloudError.value = '';
  try {
    const data = await workshopRequest(workshopPath(more)) as { groups: WorkshopGroup[]; next_cursor: string | null };
    if (!Array.isArray(data.groups)) throw new Error('工坊返回的目录无效');
    const valid = data.groups.every(group => group && /^[a-zA-Z0-9_-]{1,80}$/.test(group.id) && typeof group.name === 'string' && (!group.cover_url || /^\/assets\/[a-zA-Z0-9_-]{1,80}$/.test(group.cover_url)) && Number.isFinite(group.hot_score));
    if (!valid || (data.next_cursor !== null && !/^[A-Za-z0-9_-]{1,240}$/.test(data.next_cursor))) throw new Error('工坊返回的目录无效');
    const incoming = more ? [...cloudGroups.value, ...data.groups] : data.groups;
    cloudGroups.value = [...new Map(incoming.map(group => [group.id, group])).values()];
    cloudCursor.value = data.next_cursor; cloudLoaded.value = true;
    if (!more) cloudPreview.value = null;
  } catch (error) { cloudError.value = `${failure(error)}。请检查网络或代理后重试`; }
  finally { cloudBusy.value = false; }
}
function applyWorkshopFilters() {
  cloudQuery.value = cloudQueryInput.value.trim();
  cloudGroups.value = []; cloudCursor.value = null; cloudLoaded.value = false; cloudPreview.value = null;
  void loadWorkshop(false);
}
function changeWorkshopSort(sort: WorkshopSort) {
  if (cloudSort.value === sort) return;
  cloudSort.value = sort;
  cloudGroups.value = []; cloudCursor.value = null; cloudLoaded.value = false; cloudPreview.value = null;
  void loadWorkshop(false);
}
async function getCloud(group: WorkshopGroup, intent: 'preview' | 'download' | 'use' = 'preview') {
  const parsed = parsePortraitGroup(await workshopRequest(`/groups/${encodeURIComponent(group.id)}/export?intent=${intent}`));
  if (parsed.id !== group.id || !parsed.items.length) throw new Error('工坊组包无效');
  for (const item of parsed.items) {
    const url = new URL(item.url);
    if (url.origin !== WORKSHOP_URL || !/^\/assets\/[a-zA-Z0-9_-]{1,80}$/.test(url.pathname)) throw new Error('工坊图片地址无效');
  }
  return parsed;
}
async function previewCloud(group: WorkshopGroup) {
  if (cloudOperation.value) return;
  if (cloudPreview.value?.id === group.id) { cloudPreview.value = null; return; }
  cloudOperation.value = '正在载入立绘…'; cloudError.value = '';
  try { cloudPreview.value = await getCloud(group); }
  catch (error) { cloudError.value = failure(error); }
  finally { cloudOperation.value = ''; }
}
async function replaceGroup(targetId: string, incoming: PortraitGroup) {
  const next = groups.value.map(group => group.id === targetId ? { ...incoming, id: targetId } : group);
  if (!next.some(group => group.id === targetId)) throw new Error('待替换的本地组已不存在');
  await commit(next); message.value = `已整体替换当前组：${incoming.name}`;
}
async function mergeGroup(targetId: string, incoming: PortraitGroup) {
  const target = groups.value.find(group => group.id === targetId);
  if (!target) throw new Error('当前组已不存在');
  const conflicts = incoming.items.filter(item => target.items.some(existing => existing.id === item.id));
  if (conflicts.length && !confirm(`${conflicts.length} 项登记 ID 已存在。用导入的图片替换同 ID 项，其余图片追加到当前组？`)) return false;
  await commit(groups.value.map(group => group.id === targetId
    ? { ...group, items: mergePortraitItems(group.items, incoming.items) } : group));
  message.value = `已合并 ${incoming.items.length} 项到“${target.name}”`;
  return true;
}
async function mergeCloud(group: WorkshopGroup) {
  const target = activeGroup.value;
  if (!target || cloudOperation.value) return;
  cloudOperation.value = '正在合并图库…'; cloudError.value = '';
  try {
    const incoming = await getCloud(group, 'use');
    if (await mergeGroup(target.id, incoming)) view.value = 'local';
  } catch (error) { cloudError.value = failure(error); }
  finally { cloudOperation.value = ''; }
}
async function useCloud(group: WorkshopGroup) {
  const target = activeGroup.value;
  if (!target || cloudOperation.value || !confirm(`用“${group.name}”整体替换本地“${target.name}”？原组内立绘将被替换。`)) return;
  cloudOperation.value = '正在替换图库…'; cloudError.value = '';
  try { await replaceGroup(target.id, await getCloud(group, 'use')); view.value = 'local'; }
  catch (error) { cloudError.value = failure(error); }
  finally { cloudOperation.value = ''; }
}
function downloadGroup(group: PortraitGroup) {
  const payload = { format: 'jdnl-portrait-group', version: 1, group: { ...group, items: group.items.map(({ open, ...x }) => x) } };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = `镜待流年-${group.name.replace(/[\\/:*?"<>|]/g, '-')}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function downloadCloud(group: WorkshopGroup, offline = false) {
  if (cloudOperation.value) return;
  cloudOperation.value = offline ? '正在制作离线备份…' : '正在下载组包…'; cloudError.value = '';
  try {
    const incoming = await getCloud(group, 'download');
    downloadGroup(offline ? await portablePortraitGroup(incoming) : incoming);
    message.value = offline ? `已下载离线备份：${group.name}` : `已下载组包：${group.name}`;
  }
  catch (error) { cloudError.value = failure(error); }
  finally { cloudOperation.value = ''; }
}
watch(activeGroupId, v => { portraitSettings().setItem(PORTRAIT_ACTIVE_GROUP, v); itemEditor.value = null; libraryQuery.value = ''; });
watch(enabled, v => portraitSettings().setItem(PORTRAIT_ENABLED, v ? '1' : '0'));
function safeId(value: string) { return value.normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `portrait-${Date.now()}`; }
function slug(name: string, tag: string) { return safeId(`${name.trim()}-${tag.trim()}`); }
async function add() {
  if (!canAdd.value) return;
  try { portraitUrl(form.value.url.trim()); } catch (error) { message.value = failure(error); return; }
  const base = slug(form.value.name, form.value.tag);
  let id = base, n = 2;
  while (activeItems.value.some(x => x.id === id)) id = `${base}-${n++}`;
  const item = { id, ...form.value, name: form.value.name.trim(), tag: form.value.tag.trim(), url: form.value.url.trim(), caption: form.value.caption.trim(), open: true };
  try {
    await commit(groups.value.map(group => group.id === activeGroupId.value ? { ...group, items: [...group.items, item] } : group));
    form.value = { name: '', tag: '', url: '', caption: '' }; showAdd.value = false; libraryQuery.value = ''; message.value = '已加入图库';
  } catch (error) { message.value = `保存失败：${failure(error)}`; }
}
function readFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = () => { form.value.url = String(reader.result || ''); }; reader.readAsDataURL(file);
}
async function remove(id: string) {
  try { await commit(groups.value.map(group => group.id === activeGroupId.value ? { ...group, items: group.items.filter(x => x.id !== id) } : group)); }
  catch (error) { message.value = `删除失败：${failure(error)}`; }
}
async function clearLibrary() { if (confirm('清空当前立绘组？')) {
  try { await commit(groups.value.map(group => group.id === activeGroupId.value ? { ...group, items: [] } : group)); }
  catch (error) { message.value = `清空失败：${failure(error)}`; }
} }
async function createGroup() {
  const name = groupNameDraft.value.trim(); if (!name || name.length > 100) return;
  const id = 'group-' + crypto.randomUUID();
  try { await commit([...groups.value, { id, name, items: [] }]); activeGroupId.value = id; groupNameDraft.value = ''; message.value = '已新建分组'; }
  catch (error) { message.value = '新建失败：' + failure(error); }
}
async function renameGroup() {
  if (!activeGroup.value) return;
  const name = groupNameDraft.value.trim(); if (!name || name.length > 100) return;
  try { await commit(groups.value.map(group => group.id === activeGroupId.value ? { ...group, name } : group)); groupNameDraft.value = ''; message.value = '分组名称已保存'; }
  catch (error) { message.value = '改名失败：' + failure(error); }
}
async function deleteGroup() {
  if (activeGroupId.value === DEFAULT_GROUP || !confirm(`删除组“${activeGroup.value?.name}”？`)) return;
  try { await commit(groups.value.filter(group => group.id !== activeGroupId.value)); activeGroupId.value = DEFAULT_GROUP; }
  catch (error) { message.value = `删除失败：${failure(error)}`; }
}
async function exportLibrary() {
  const group = activeGroup.value; if (!group) return;
  try { downloadGroup(group); message.value = `已导出组包：${group.name}`; }
  catch (error) { message.value = `导出失败：${failure(error)}`; }
}
async function exportOffline() {
  const group = activeGroup.value; if (!group || cloudOperation.value) return;
  cloudOperation.value = '正在制作离线备份…';
  try { downloadGroup(await portablePortraitGroup(group)); message.value = `已导出离线备份：${group.name}`; }
  catch (error) { message.value = `离线备份失败：${failure(error)}`; }
  finally { cloudOperation.value = ''; }
}
async function exportSubmission() {
  const group = activeGroup.value;
  if (!group?.items.length) return;
  try {
    const portable = await portablePortraitGroup(group);
    downloadGroup(portable); message.value = `已导出投稿组包：${group.name}`;
  }
  catch (error) { message.value = `投稿组包导出失败：${failure(error)}`; }
}
async function importLibrary(e: Event, mode: 'merge' | 'replace') {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const target = activeGroup.value;
  try {
    if (!target) throw new Error('当前组不存在');
    const incoming = parsePortraitGroup(JSON.parse(await file.text()));
    if (mode === 'replace') {
      if (confirm(`用“${incoming.name}”整体替换“${target.name}”？`)) await replaceGroup(target.id, incoming);
    } else await mergeGroup(target.id, incoming);
  } catch (error) { message.value = `导入失败：${failure(error)}`; }
  finally { (e.target as HTMLInputElement).value = ''; }
}

async function moveGroup(direction: number) {
  const group = activeGroup.value; if (!group) return;
  try { await commit(moveLibraryEntry(groups.value, group.id, activeGroupIndex.value + direction)); message.value = '分组顺序已保存'; }
  catch (error) { message.value = failure(error); }
}
async function moveItemTo(id: string, targetId: string) {
  const group = activeGroup.value; if (!group || id === targetId) return;
  try { const position = group.items.findIndex(item => item.id === targetId); const items = moveLibraryEntry(group.items, id, position); await commit(groups.value.map(current => current.id === group.id ? { ...current, items } : current)); message.value = '立绘顺序已保存'; }
  catch (error) { message.value = failure(error); }
}
async function moveItem(id: string, direction: number) {
  const position = visibleItems.value.findIndex(item => item.id === id), target = visibleItems.value[position + direction]; if (target) await moveItemTo(id, target.id);
}
function beginDrag(event: DragEvent, id: string) {
  if (!organizing.value || busySave.value) { event.preventDefault(); return; }
  draggingId.value = id;
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); }
}
async function dropItem(target: string) {
  const source = draggingId.value; draggingId.value = null; dropTargetId.value = null;
  if (source && organizing.value && !busySave.value) await moveItemTo(source, target);
}
async function sortLocal() {
  const mode = sortMode.value, group = activeGroup.value; sortMode.value = '';
  if (!group || !['character','tag'].includes(mode)) return;
  try { const items = sortLibraryItems(group.items, mode as 'character' | 'tag'); await commit(groups.value.map(current => current.id === group.id ? { ...current, items } : current)); message.value = '已按角色和标签整理，顺序已保存'; }
  catch (error) { message.value = failure(error); }
}
function startItemEdit(item: Portrait) { itemEditor.value = { id: item.id, name: item.name, tag: item.tag, caption: item.caption || '', targetGroupId: activeGroup.value.id }; }
async function saveItemEdit() {
  const edit = itemEditor.value, group = activeGroup.value; if (!edit || !group) return;
  try { let next = editLibraryItem(groups.value, group.id, edit.id, edit); if (edit.targetGroupId !== group.id) next = moveLibraryItem(next, group.id, edit.targetGroupId, edit.id); await commit(next); itemEditor.value = null; message.value = '分类与分组已保存，原图片和登记 ID 保持不变'; }
  catch (error) { message.value = failure(error); }
}

</script>
<style scoped>
.portrait-panel{color:var(--cw-text,var(--t-text,#353c46));font:inherit;min-width:0}
button,input,select{font:inherit}button,summary,.file-button{touch-action:manipulation}button{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border:1px solid var(--cw-line,#dce1e7);border-radius:9px;background:var(--cw-surface,#fff);color:inherit;cursor:pointer;line-height:1.4;transition:background .15s,border-color .15s}button:hover:not(:disabled){border-color:var(--cw-accent,#66788f);background:var(--cw-accent-soft,#eef1f5)}button:disabled{opacity:.42;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--cw-accent,#66788f);outline-offset:3px}
input,select{min-width:0;max-width:100%;width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--cw-line,#dce1e7);border-radius:9px;background:var(--cw-bg,#f7f8fa);color:inherit;line-height:1.45}input::placeholder{color:var(--cw-muted,#7b8490)}label{min-width:0;display:grid;gap:6px;color:var(--cw-muted,#7b8490);font-size:12px}label input,label select{color:var(--cw-text,#353c46);font-size:13px}
.primary-button{background:var(--cw-accent,#66788f);border-color:var(--cw-accent,#66788f);color:var(--cw-on-accent,#fff);font-weight:600}.primary-button:hover:not(:disabled){background:var(--cw-accent,#66788f);filter:brightness(1.08)}.danger-text{color:var(--cw-danger,#b86868);background:transparent;border-color:transparent}
.library-topline{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap}.library-tabs,.cloud-sort{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--cw-line,#dce1e7);border-radius:11px;background:var(--cw-bg,#f7f8fa)}.library-tabs button,.cloud-sort button{border-color:transparent;background:transparent;color:var(--cw-muted,#7b8490);padding:7px 12px}.library-tabs [aria-selected=true],.cloud-sort [aria-selected=true]{background:var(--cw-surface,#fff);color:var(--cw-accent,#66788f);box-shadow:0 1px 4px #00000009;font-weight:600}.library-switch{border:0;background:transparent;padding:6px 0;color:var(--cw-muted,#7b8490);font-size:12px}.switch-track{display:inline-flex;width:28px;padding:3px;box-sizing:content-box;border-radius:20px;background:var(--cw-line,#dce1e7)}.switch-track span{width:12px;height:12px;border-radius:50%;background:var(--cw-surface,#fff);transition:transform .16s}.library-switch[aria-checked=true] .switch-track{background:var(--cw-accent,#66788f)}.library-switch[aria-checked=true] .switch-track span{transform:translateX(16px)}
.group-section{padding:16px;border:1px solid var(--cw-line,#dce1e7);border-radius:12px;background:var(--cw-bg,#f7f8fa)}.group-picker>span{font-size:11px;letter-spacing:.04em}.group-picker select{font-weight:600;background:var(--cw-surface,#fff)}.group-manager{margin:10px 0 0}.group-manager summary,.library-tools summary,.portrait-reference summary,.group-reference summary{cursor:pointer;color:var(--cw-muted,#7b8490);font-size:12px}.group-manager-body{display:grid;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--cw-line,#dce1e7)}.group-order{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.group-order>span{margin-right:auto;color:var(--cw-muted,#7b8490);font-size:12px}
.library-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:20px 0 12px;flex-wrap:wrap}.library-count{margin:0;font-size:12px;color:var(--cw-muted,#7b8490)}.library-count strong{font-size:23px;font-weight:600;letter-spacing:-.04em;color:var(--cw-text,#353c46);margin-right:3px}.library-count>span{display:block;margin-top:2px;font-size:11px}.toolbar-actions,.action-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.toolbar-actions>button,.library-tools>summary{font-size:12px}.library-tools{position:relative;margin:0}.library-tools>summary{list-style:none;padding:9px 3px}.library-tools-body{display:flex;flex-wrap:wrap;gap:7px;padding:12px;margin-top:6px;background:var(--cw-bg,#f7f8fa);border:1px solid var(--cw-line,#dce1e7);border-radius:10px}.library-tools[open]{flex-basis:100%}.library-tools-body>label,.file-button{display:inline-flex;align-items:center;padding:8px 11px;border:1px solid var(--cw-line,#dce1e7);border-radius:9px;cursor:pointer;font-size:12px;background:var(--cw-surface,#fff);color:var(--cw-text,#353c46)}.library-tools input[type=file],.file-button input{display:none}
.portrait-form,.item-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px;background:var(--cw-bg,#f7f8fa);border:1px solid var(--cw-line,#dce1e7);border-radius:12px;margin:12px 0}.wide-field{grid-column:1/-1}.portrait-form .action-row button{font-size:12px}.local-filter{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:12px 0}.local-filter select{width:auto;max-width:160px;font-size:12px}.local-filter input{font-size:12px}.organize-tip,.editor-note,.library-note{font-size:11px;line-height:1.75;color:var(--cw-muted,#7b8490);margin:10px 0}.organize-tip{padding:10px 12px;background:var(--cw-accent-soft,#eef1f5);border-radius:9px;color:var(--cw-accent,#66788f)}
.portrait-items{display:grid;gap:9px}.portrait-item{border:1px solid var(--cw-line,#dce1e7);border-radius:12px;background:var(--cw-surface,#fff);overflow:hidden;transition:border-color .15s,transform .15s}.portrait-item.is-drag-target{border-color:var(--cw-accent,#66788f);box-shadow:0 0 0 2px var(--cw-accent-soft,#eef1f5)}.portrait-item.is-organizing{cursor:grab}.portrait-row{display:flex;align-items:center;gap:5px;padding:6px}.portrait-toggle{width:100%;display:flex;justify-content:flex-start;min-width:0;text-align:left;gap:12px;border:0;background:transparent;padding:5px;flex:1}.portrait-toggle:hover:not(:disabled){background:var(--cw-bg,#f7f8fa)}.portrait-thumb{width:48px;height:60px;flex:0 0 48px;border-radius:8px;background-color:var(--cw-bg,#f7f8fa);background-size:cover;background-position:center}.portrait-meta{min-width:0;display:grid;gap:4px}.portrait-meta b{font-size:13px;font-weight:600}.portrait-meta small{font-size:11px;color:var(--cw-accent,#66788f)}.portrait-meta>span{font-size:11px;color:var(--cw-muted,#7b8490);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.portrait-chevron{margin-left:auto;color:var(--cw-muted,#7b8490);padding:6px}.order-index{padding:0 3px;color:var(--cw-muted,#7b8490);font-size:17px}.portrait-order-buttons{display:grid;gap:3px}.portrait-order-buttons button{padding:5px 8px;font-size:15px}.portrait-detail{padding:10px 14px 14px;border-top:1px solid var(--cw-line,#dce1e7)}.portrait-detail>img{display:block;max-width:100%;width:auto;max-height:300px;border-radius:9px;cursor:zoom-in;margin:0 auto 12px;object-fit:contain}.detail-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.detail-actions>button{font-size:11px}.portrait-reference code,.group-reference code{display:block;margin-top:6px;max-width:100%;overflow-wrap:anywhere;color:var(--cw-muted,#7b8490);font-size:10px}.portrait-reference{min-width:0}.detail-actions>.danger-text{margin-left:auto}.item-editor{margin-bottom:0}.editor-note{margin:0}.library-note{margin-top:14px}
.workshop-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:4px 0 16px}.workshop-bar strong{font-size:15px}.workshop-bar p{margin:5px 0 0;color:var(--cw-muted,#7b8490);font-size:11px}.cloud-filter{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-bottom:16px}.cloud-sort{grid-column:1/-1;justify-self:start}.cloud-filter>button{font-size:12px}.cloud-results{display:grid;gap:12px}.cloud-group{padding:16px;border:1px solid var(--cw-line,#dce1e7);border-radius:13px;background:var(--cw-bg,#f7f8fa)}.cloud-heading{display:flex;align-items:flex-start;gap:13px}.cloud-cover,.cloud-placeholder{width:58px;height:74px;flex:0 0 58px;border-radius:9px;object-fit:cover;background:var(--cw-accent-soft,#eef1f5);color:var(--cw-accent,#66788f)}.cloud-placeholder{display:grid;place-items:center;font-size:25px;font-weight:500}.cloud-meta{min-width:0;flex:1}.cloud-meta b{display:block;font-size:14px;overflow-wrap:anywhere}.cloud-meta small{display:block;font-size:11px;color:var(--cw-muted,#7b8490);margin-top:6px}.cloud-meta p{font-size:12px;color:var(--cw-muted,#7b8490);margin:8px 0 0;overflow-wrap:anywhere;line-height:1.7}.cloud-card-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.cloud-card-actions button{font-size:12px;padding:8px 16px}.group-reference{margin-top:12px}.group-reference summary{font-size:10px}.cloud-detail{margin-top:14px;padding-top:14px;border-top:1px solid var(--cw-line,#dce1e7)}.cloud-pictures{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}.cloud-pictures figure{margin:0;min-width:0}.cloud-pictures img{width:100%;height:150px;object-fit:contain;background:var(--cw-surface,#fff);border-radius:7px;cursor:zoom-in}.cloud-pictures figcaption{font-size:10px;color:var(--cw-muted,#7b8490);line-height:1.5;padding-top:5px;overflow-wrap:anywhere}.cloud-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.cloud-actions button{font-size:11px}.cloud-more{display:block;margin:14px auto 0}.empty-hint{padding:26px 16px;border:1px dashed var(--cw-line,#dce1e7);border-radius:12px;text-align:center;color:var(--cw-muted,#7b8490);font-size:12px;line-height:1.8}.panel-error,.panel-status{padding:11px 13px;border-radius:9px;font-size:12px;line-height:1.7;overflow-wrap:anywhere}.panel-error{color:var(--cw-danger,#b86868);background:var(--cw-bg,#f7f8fa)}.panel-status{background:var(--cw-accent-soft,#eef1f5);color:var(--cw-accent,#66788f);margin:12px 0 0}
:global(body>.portrait-lightbox){position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;box-sizing:border-box;background:#101218e6;cursor:zoom-out}:global(body>.portrait-lightbox img){max-width:100%;max-height:100%;object-fit:contain;border-radius:10px}
@media(max-width:460px){.library-topline{gap:8px}.library-switch{font-size:10px}.library-tabs button{padding:7px 9px;font-size:12px}.group-section{padding:12px}.library-toolbar{gap:10px}.toolbar-actions{gap:5px}.toolbar-actions>button{padding:8px 9px}.local-filter{grid-template-columns:minmax(0,1fr)}.local-filter select{width:100%;max-width:100%}.portrait-form,.item-editor{grid-template-columns:1fr;padding:12px}.cloud-group{padding:13px}.portrait-detail{padding:10px}.portrait-meta b{font-size:12px}.portrait-thumb{width:40px;height:52px;flex-basis:40px}.cloud-cover,.cloud-placeholder{width:48px;height:64px;flex-basis:48px}.portrait-toggle{gap:9px}.library-count strong{font-size:21px}}

.portrait-thumb{overflow:hidden}.portrait-thumb img{display:block;width:100%;height:100%;object-fit:cover}.library-switch:not([aria-checked=true]) .switch-track span{background:var(--cw-muted,#7b8490)}
.cloud-download-actions{display:flex;align-items:stretch;gap:0}.cloud-download-actions>.cloud-download{border-radius:9px 0 0 9px}.cloud-download-options{position:relative;margin:0}.cloud-download-options>summary{display:grid;place-items:center;list-style:none;padding:7px 10px;border:1px solid var(--cw-accent,#61728c);border-left:1px solid var(--cw-line,#dce1e7);border-radius:0 9px 9px 0;background:var(--cw-accent,#61728c);color:var(--cw-on-accent,#000);cursor:pointer;height:100%;box-sizing:border-box;font-size:13px}.cloud-download-options>summary::-webkit-details-marker{display:none}.cloud-download-options>div{position:absolute;right:0;top:calc(100% + 7px);width:180px;z-index:3;padding:6px;border:1px solid var(--cw-line,#dce1e7);border-radius:10px;background:var(--cw-bg,#f7f8fa);box-shadow:0 8px 24px #0002}.cloud-download-options>div>button{font-size:12px;width:100%;border:0;background:transparent;white-space:normal}
</style>
