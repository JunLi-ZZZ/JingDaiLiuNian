<template>
  <div class="theme-mirror portrait-panel">
    <div class="mirror-frame">
      <div class="frame-ring"></div><div class="frame-inset"></div>
      <div class="mirror-surface">
        <div class="panel-title">立绘图库</div>
        <div class="portrait-switch-row">
          <button class="switch-btn" :class="{ active: enabled }" @click="enabled = !enabled">{{ enabled ? '◉ 立绘呈现已开启' : '○ 立绘呈现已关闭' }}</button>
          <span>关闭时不注入目录，也不处理正文标记</span>
        </div>
        <div class="library-tabs" role="tablist" aria-label="图库来源">
          <button role="tab" :aria-selected="view === 'local'" :class="{ active: view === 'local' }" @click="view = 'local'"><i class="fa-solid fa-images" aria-hidden="true"></i> 本地图库</button>
          <button role="tab" :aria-selected="view === 'cloud'" :class="{ active: view === 'cloud' }" :disabled="!ready" @click="openWorkshop"><i class="fa-solid fa-cloud" aria-hidden="true"></i> 云端工坊</button>
        </div>
        <div v-if="!ready" class="empty-hint" role="status">{{ message || '正在读取本地图库…' }}</div>
        <template v-else-if="view === 'local'">
        <div class="group-row">
          <label>当前组</label>
          <select v-model="activeGroupId">
            <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}{{ group.id === DEFAULT_GROUP ? '（默认）' : '' }}</option>
          </select>
          <button class="small-btn" @click="createGroup">新建组</button>
          <button class="small-btn" :disabled="activeGroupId === DEFAULT_GROUP" @click="renameGroup">改名</button>
          <button class="small-btn danger" :disabled="activeGroupId === DEFAULT_GROUP" @click="deleteGroup">删除组</button>
        </div>
        <div class="portrait-form">
          <input v-model="form.name" placeholder="角色名" />
          <input v-model="form.tag" placeholder="动作 / 部位标签" />
          <input v-model="form.url" placeholder="图片直链，或选择本地图片" />
          <input v-model="form.caption" placeholder="可选说明" />
          <label class="file-btn">选择本地图片<input type="file" accept="image/*" @change="readFile" /></label>
          <button class="btn-gen" :disabled="!canAdd" @click="add">加入图库</button>
        </div>
        <div class="portrait-toolbar">
          <span>{{ activeItems.length }} 项 · 使用整组替换</span>
          <button class="small-btn" @click="exportLibrary">导出组包</button>
          <label class="small-btn">导入组包<input type="file" accept="application/json" @change="importLibrary" /></label>
          <button class="small-btn danger" @click="clearLibrary">清空本组</button>
        </div>
        <div v-if="!activeItems.length" class="empty-hint">当前组暂无立绘。导入组包会整体替换当前组。</div>
        <div v-for="item in activeItems" :key="item.id" class="portrait-item">
          <button class="portrait-toggle" @click="item.open = !item.open">
            <span class="portrait-thumb" :style="{ backgroundImage: `url(${item.url})` }"></span>
            <span class="portrait-meta"><b>{{ item.name }}</b><small>{{ item.tag }}</small></span>
            <span class="portrait-chevron">{{ item.open ? '▾' : '▸' }}</span>
          </button>
          <div v-if="item.open" class="portrait-detail">
            <img :src="item.url" :alt="item.caption || item.name" loading="lazy" title="点击放大" @click="enlarged = item.url" />
            <div class="portrait-copy"><code>&lt;portrait id="{{ item.id }}"&gt;</code><span v-if="item.caption">{{ item.caption }}</span></div>
            <button class="small-btn danger" @click="remove(item.id)">删除</button>
          </div>
        </div>
        </template>
        <section v-else class="workshop-list" aria-label="云端立绘组">
          <div class="workshop-bar workshop-account">
            <button class="small-btn" :disabled="!activeItems.length" @click="exportSubmission"><i class="fa-solid fa-file-export" aria-hidden="true"></i> 导出投稿组包</button>
            <a class="small-btn" :href="WORKSHOP_URL + '/submit'" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Discord 登录 / 我的投稿</a>
          </div>
          <div class="workshop-bar"><span>已发布立绘组</span><button class="small-btn" :disabled="cloudBusy" @click="loadWorkshop(false)"><i class="fa-solid fa-rotate" aria-hidden="true"></i> 刷新</button></div>
          <div v-if="cloudBusy" class="empty-hint" role="status">正在载入…</div>
          <div v-else-if="!cloudGroups.length && !cloudError" class="empty-hint">暂无已发布立绘组</div>
          <div v-if="cloudError" class="panel-error" role="alert">{{ cloudError }}</div>
          <article v-for="group in cloudGroups" :key="group.id" class="cloud-group">
            <div class="cloud-heading">
              <img v-if="group.cover_url" class="cloud-cover" :src="WORKSHOP_URL + group.cover_url" :alt="group.name" loading="lazy" referrerpolicy="no-referrer" />
              <div class="cloud-meta"><b>{{ group.name }}</b><small>{{ group.author_name || '未署名' }} · {{ group.asset_count }} 张</small><p v-if="group.description">{{ group.description }}</p></div>
              <button class="small-btn" :disabled="!!cloudOperation" @click="previewCloud(group)"><i class="fa-solid fa-eye" aria-hidden="true"></i> 预览</button>
            </div>
            <div v-if="cloudPreview?.id === group.id" class="cloud-detail">
              <div class="cloud-pictures"><figure v-for="item in cloudPreview.items" :key="item.id"><img :src="item.url" :alt="item.caption || item.name" loading="lazy" referrerpolicy="no-referrer" @click="enlarged = item.url" /><figcaption>{{ item.name }} · {{ item.tag }}</figcaption></figure></div>
              <div class="cloud-actions">
                <button class="btn-gen" :disabled="!!cloudOperation" @click="useCloud(group)"><i class="fa-solid fa-check" aria-hidden="true"></i> 替换当前组</button>
                <button class="small-btn" :disabled="!!cloudOperation" @click="downloadCloud(group)"><i class="fa-solid fa-download" aria-hidden="true"></i> 下载组包</button>
              </div>
            </div>
          </article>
          <button v-if="cloudCursor" class="small-btn cloud-more" :disabled="cloudBusy" @click="loadWorkshop(true)">加载更多</button>
          <div v-if="cloudOperation" class="empty-hint" role="status">{{ cloudOperation }}</div>
        </section>
        <div v-if="message" class="panel-status" role="status">{{ message }}</div>
      </div>
    </div>
    <div v-if="enlarged" class="portrait-lightbox" role="dialog" aria-label="立绘大图" @click="enlarged = null">
      <img :src="enlarged" alt="立绘大图" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { parsePortraitGroup, portablePortraitGroup, portraitUrl, WORKSHOP_URL, workshopRequest } from './portrait-workshop';
import type { PortraitGroup, WorkshopGroup } from './portrait-workshop';
import { loadPortraitGroups, portraitSettings, savePortraitGroups, PORTRAIT_ACTIVE_GROUP, PORTRAIT_ENABLED, PORTRAIT_REVISION } from './portrait-storage';

const DEFAULT_GROUP = 'default';
const groups = ref<PortraitGroup[]>([{ id: DEFAULT_GROUP, name: '默认组', items: [] }]);
const activeGroupId = ref(portraitSettings().getItem(PORTRAIT_ACTIVE_GROUP) || DEFAULT_GROUP);
const activeGroup = computed(() => groups.value.find(group => group.id === activeGroupId.value) || groups.value[0]);
const activeItems = computed(() => activeGroup.value?.items || []);
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
const ready = ref(false);
let busySave = false;
async function reload() {
  if (busySave) return;
  try { groups.value = await loadPortraitGroups(); ready.value = true; }
  catch (error) { ready.value = false; message.value = `读取图库失败：${failure(error)}`; }
}
const changed = (event: StorageEvent) => { if (event.key === PORTRAIT_REVISION) void reload(); };
onMounted(() => { void reload(); window.addEventListener('storage', changed); window.addEventListener('focus', reload); });
onUnmounted(() => { window.removeEventListener('storage', changed); window.removeEventListener('focus', reload); });
async function commit(next: PortraitGroup[]) {
  if (busySave) throw new Error('图库正在保存，请稍后重试');
  busySave = true;
  try { await savePortraitGroups(next); groups.value = next; }
  finally { busySave = false; }
}
function failure(error: unknown) { return error instanceof Error ? error.message : '操作失败'; }
async function openWorkshop() {
  view.value = 'cloud'; message.value = '';
  if (!cloudLoaded.value && !cloudBusy.value) await loadWorkshop(false);
}
async function loadWorkshop(more: boolean) {
  if (cloudBusy.value) return;
  cloudBusy.value = true; cloudError.value = '';
  try {
    const data = await workshopRequest(`/groups?limit=20${more && cloudCursor.value ? `&cursor=${encodeURIComponent(cloudCursor.value)}` : ''}`) as { groups: WorkshopGroup[]; next_cursor: string | null };
    if (!Array.isArray(data.groups)) throw new Error('工坊返回的目录无效');
    const valid = data.groups.every(group => group && /^[a-zA-Z0-9_-]{1,80}$/.test(group.id) && typeof group.name === 'string' && (!group.cover_url || /^\/assets\/[a-zA-Z0-9_-]{1,80}$/.test(group.cover_url)));
    if (!valid || (data.next_cursor !== null && !/^[a-zA-Z0-9_-]{1,80}$/.test(data.next_cursor))) throw new Error('工坊返回的目录无效');
    const incoming = more ? [...cloudGroups.value, ...data.groups] : data.groups;
    cloudGroups.value = [...new Map(incoming.map(group => [group.id, group])).values()];
    cloudCursor.value = data.next_cursor; cloudLoaded.value = true;
    if (!more) cloudPreview.value = null;
  } catch (error) { cloudError.value = `${failure(error)}。请检查网络或代理后重试`; }
  finally { cloudBusy.value = false; }
}
async function getCloud(group: WorkshopGroup) {
  const parsed = parsePortraitGroup(await workshopRequest(`/groups/${encodeURIComponent(group.id)}/export`));
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
async function useCloud(group: WorkshopGroup) {
  const target = activeGroup.value;
  if (!target || cloudOperation.value || !confirm(`用“${group.name}”整体替换本地“${target.name}”？原组内立绘将被替换。`)) return;
  cloudOperation.value = '正在替换图库…'; cloudError.value = '';
  try { await replaceGroup(target.id, await portablePortraitGroup(await getCloud(group))); view.value = 'local'; }
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
async function downloadCloud(group: WorkshopGroup) {
  if (cloudOperation.value) return;
  cloudOperation.value = '正在下载组包…'; cloudError.value = '';
  try { downloadGroup(await portablePortraitGroup(await getCloud(group))); message.value = `已下载组包：${group.name}`; }
  catch (error) { cloudError.value = failure(error); }
  finally { cloudOperation.value = ''; }
}
watch(activeGroupId, v => portraitSettings().setItem(PORTRAIT_ACTIVE_GROUP, v));
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
    form.value = { name: '', tag: '', url: '', caption: '' }; message.value = '已加入图库';
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
  const name = prompt('新组名称'); if (!name?.trim()) return;
  const id = `group-${Date.now()}`;
  try { await commit([...groups.value, { id, name: name.trim(), items: [] }]); activeGroupId.value = id; }
  catch (error) { message.value = `新建失败：${failure(error)}`; }
}
async function renameGroup() {
  if (!activeGroup.value || activeGroupId.value === DEFAULT_GROUP) return;
  const name = prompt('组名称', activeGroup.value.name); if (!name?.trim()) return;
  try { await commit(groups.value.map(group => group.id === activeGroupId.value ? { ...group, name: name.trim() } : group)); }
  catch (error) { message.value = `改名失败：${failure(error)}`; }
}
async function deleteGroup() {
  if (activeGroupId.value === DEFAULT_GROUP || !confirm(`删除组“${activeGroup.value?.name}”？`)) return;
  try { await commit(groups.value.filter(group => group.id !== activeGroupId.value)); activeGroupId.value = DEFAULT_GROUP; }
  catch (error) { message.value = `删除失败：${failure(error)}`; }
}
async function exportLibrary() {
  const group = activeGroup.value; if (!group) return;
  try { downloadGroup(await portablePortraitGroup(group)); message.value = `已导出组包：${group.name}`; }
  catch (error) { message.value = `导出失败：${failure(error)}`; }
}
async function exportSubmission() {
  const group = activeGroup.value;
  if (!group?.items.length) return;
  if (group.items.length > 24) { message.value = '投稿组包每组最多 24 张'; return; }
  try {
    const portable = await portablePortraitGroup(group);
    const sizes = portable.items.map(item => Math.floor((item.url.split(',')[1]?.length || 0) * 3 / 4));
    if (sizes.some(size => size > 2 * 1024 * 1024) || sizes.reduce((sum, size) => sum + size, 0) > 12 * 1024 * 1024) {
      throw new Error('投稿限制：单张不超过 2 MB，整组图片不超过 12 MB');
    }
    downloadGroup(portable); message.value = `已导出投稿组包：${group.name}`;
  }
  catch (error) { message.value = `投稿组包导出失败：${failure(error)}`; }
}
async function importLibrary(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const target = activeGroup.value;
  try {
    if (!target || file.size > 18 * 1024 * 1024) throw new Error('组包过大或当前组不存在');
    const incoming = parsePortraitGroup(JSON.parse(await file.text()));
    if (confirm(`用“${incoming.name}”整体替换“${target.name}”？`)) await replaceGroup(target.id, await portablePortraitGroup(incoming));
  } catch (error) { message.value = `导入失败：${failure(error)}`; }
  finally { (e.target as HTMLInputElement).value = ''; }
}
</script>

<style scoped>
.portrait-panel { --m-accent: var(--c-accent, #c9a96e); --m-text: #4a4035; --m-muted: #72695f; margin-bottom: 10px; color: var(--m-text); }
.mirror-frame { border: 1px solid rgba(139,115,85,.3); border-radius: 8px; background: #f4ede1; box-shadow: 0 4px 18px rgba(70,49,27,.12); }
.frame-ring, .frame-inset { display: none; }
.mirror-surface { position: relative; padding: 14px 12px; max-height: none; overflow: visible; background: #f4ede1; border-radius: 8px; }
.panel-title { background: linear-gradient(135deg, #6b4a28, #8b5a30 40%, #6b4a28 60%, #8b5a30); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.panel-note { margin: 0 0 10px; color: var(--m-muted); font-size: 12px; line-height: 1.5; }
.portrait-switch-row { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; color: var(--m-muted); font-size: 11px; }
.switch-btn { padding: 6px 9px; border: 1px solid rgba(120,90,50,.25); border-radius: 4px; background: rgba(255,255,255,.45); color: var(--m-muted); cursor: pointer; white-space: nowrap; }
.switch-btn.active { border-color: rgba(111,128,93,.55); color: #60754d; background: rgba(227,236,215,.72); }
.portrait-form { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.portrait-form input { min-width: 0; padding: 8px 9px; border: 1px solid rgba(120,90,50,.22); border-radius: 4px; background: rgba(255,255,255,.54); color: var(--m-text); }
.portrait-form input:nth-child(3), .portrait-form input:nth-child(4) { grid-column: 1 / -1; }
.file-btn, .small-btn { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 6px 9px; border: 1px solid rgba(120,90,50,.25); border-radius: 4px; background: rgba(255,255,255,.45); color: var(--m-text); font-size: 12px; }
.file-btn input, .small-btn input { display: none; }
.btn-gen { padding: 7px 10px; border: 0; border-radius: 4px; background: #765531; color: #fff; cursor: pointer; }
.btn-gen:disabled { opacity: .45; cursor: default; }
.portrait-toolbar { display: flex; gap: 6px; align-items: center; margin: 12px 0 7px; color: var(--m-muted); font-size: 12px; }
.portrait-toolbar > span { margin-right: auto; }
.group-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 12px 0; font-size: 12px; }
.group-row select { flex: 1; min-width: 120px; max-width: 100%; padding: 7px; border: 1px solid rgba(120,90,50,.25); border-radius: 4px; color: var(--m-text); background: rgba(255,255,255,.54); }
.portrait-toolbar, .portrait-switch-row { flex-wrap: wrap; }
.library-tabs { display: flex; border-bottom: 1px solid rgba(120,90,50,.2); margin: 10px 0; }
.library-tabs button { flex: 1; padding: 9px 5px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--m-muted); cursor: pointer; }
.library-tabs button.active { color: #765531; border-bottom-color: #765531; }
.workshop-bar, .cloud-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.workshop-bar > span { margin-right: auto; font-size: 12px; }
.workshop-account { margin-bottom: 12px; }
.workshop-account a { text-decoration: none; color: inherit; }
.cloud-group { padding: 14px 0; border-bottom: 1px solid rgba(120,90,50,.16); }
.cloud-heading { display: flex; gap: 10px; align-items: center; }
.cloud-cover { flex: 0 0 48px; width: 48px; height: 64px; object-fit: cover; border-radius: 4px; }
.cloud-meta { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.cloud-meta b { font-size: 14px; display: block; }
.cloud-meta small, .cloud-meta p { color: var(--m-muted); font-size: 12px; }
.cloud-meta p { margin: 5px 0 0; }
.cloud-detail { margin-top: 12px; }
.cloud-pictures { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; margin-bottom: 12px; }
.cloud-pictures figure { margin: 0; min-width: 0; }
.cloud-pictures img { width: 100%; aspect-ratio: 3 / 4; object-fit: contain; background: rgba(120,90,50,.06); cursor: zoom-in; border-radius: 4px; }
.cloud-pictures figcaption { font-size: 12px; overflow-wrap: anywhere; padding-top: 4px; }
.cloud-more { display: flex; margin: 14px auto 0; }
.panel-error { color: #a15d63; font-size: 12px; overflow-wrap: anywhere; padding: 8px 0; }
.small-btn { gap: 5px; }
.small-btn:disabled { opacity: .45; cursor: default; }
.portrait-form input { width: 100%; box-sizing: border-box; }
.small-btn { color: var(--m-text); background: transparent; }
.small-btn.danger { color: #a15d63; }
.empty-hint, .panel-status { padding: 12px 2px; color: var(--m-muted); font-size: 12px; }
.panel-status { color: #6f805d; }
.portrait-item { border-top: 1px solid rgba(120,90,50,.16); }
.portrait-toggle { width: 100%; display: flex; align-items: center; gap: 9px; padding: 8px 2px; border: 0; background: transparent; color: var(--m-text); text-align: left; cursor: pointer; }
.portrait-thumb { flex: 0 0 42px; width: 42px; height: 42px; border-radius: 4px; background-position: center; background-size: cover; background-color: rgba(120,90,50,.08); }
.portrait-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.portrait-meta b { font-size: 13px; font-weight: 600; }
.portrait-meta small { color: var(--m-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.portrait-chevron { margin-left: auto; color: var(--m-muted); }
.portrait-detail { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 0 2px 10px 51px; }
.portrait-detail img { max-width: 100%; max-height: 360px; border-radius: 5px; object-fit: contain; box-shadow: 0 4px 16px rgba(80,55,30,.18); cursor: zoom-in; }
.portrait-copy { display: flex; flex-direction: column; gap: 4px; width: 100%; color: var(--m-muted); font-size: 11px; }
.portrait-copy code { color: #795d3b; }
.portrait-lightbox { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 20px; box-sizing: border-box; background: rgba(20,18,16,.88); cursor: zoom-out; }
.portrait-lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 5px; box-shadow: 0 8px 40px rgba(0,0,0,.45); }
</style>
