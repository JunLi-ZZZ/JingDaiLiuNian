<template>
  <section class="character-workshop" aria-label="角色工坊">
    <header class="cw-heading"><h3>世界书工坊</h3><button type="button" aria-label="关闭角色工坊" @click="$emit('close')">×</button></header>
    <nav class="cw-actions" aria-label="角色工坊功能">
      <button type="button" :aria-pressed="view === 'cloud'" :disabled="!!busy" @click="view = 'cloud'; loadList()">云端资料</button>
      <button type="button" :aria-pressed="view === 'local'" :disabled="!!busy" @click="view = 'local'">制作 / 导入设定包</button>
      <a :href="WORKSHOP_URL + '/characters-submit'" target="_blank" rel="noopener noreferrer">Discord 投稿 / 我的角色</a>
    </nav>
    <p class="cw-muted">按角色、位面、其他自动归档并分配顺序；关键词留空时使用资料名称。每条配置可单独调整。</p>
    <template v-if="view === 'cloud'">
      <form class="cw-actions" @submit.prevent="loadList(true)">
        <input v-model="query" maxlength="100" aria-label="搜索云端角色" placeholder="搜索角色、作者或简介" />
        <button :disabled="!!busy">搜索</button>
        <select v-model="sort" aria-label="角色排序" :disabled="!!busy" @change="loadList(true)"><option value="latest">最新</option><option value="hot">最热</option></select>
        <select v-model="categoryFilter" aria-label="资料分类筛选" :disabled="!!busy" @change="loadList(true)"><option value="all">全部分类</option><option v-for="(label, key) in LORE_CATEGORIES" :key="key" :value="key">{{ label }}</option></select>
        <button type="button" :disabled="!!busy" @click="loadList(true, false, true)">刷新</button>
      </form>
      <p v-if="!busy && !packages.length && !message" class="cw-muted">暂无已发布角色。</p>
      <article v-for="item in packages" :key="item.id" class="cw-package">
        <button type="button" class="cw-toggle" :aria-expanded="detail?.package.id === item.id" :disabled="!!busy" @click="preview(item)">
          <span><strong>{{ item.name }}</strong><small>{{ LORE_CATEGORIES[item.category || 'character'] }} · {{ item.author_name }} · {{ item.entry_count }} 条设定 · 下载 {{ item.download_count }}{{ item.portrait_group_id ? ' · 附立绘' : '' }}</small></span><span>{{ detail?.package.id === item.id ? '▾' : '▸' }}</span>
        </button>
        <p v-if="item.description" class="cw-muted">{{ item.description }}</p>
        <div v-if="detail?.package.id === item.id" class="cw-detail">
          <label>导入资料分类<select v-model="detail.content.character.category"><option v-for="(label, key) in LORE_CATEGORIES" :key="key" :value="key">{{ label }}</option></select></label>
          <div v-for="entry in detail.content.character.entries" :key="entry.id" class="cw-entry"><h4>{{ entry.name }}</h4><small>关键词：{{ entry.keywords.join('、') }}</small><pre>{{ entry.content }}</pre><LoreEntrySettings v-model="entry.settings" :package-category="detail.content.character.category" /></div>
          <p v-if="item.portrait_group_id" class="cw-muted">{{ detail.portrait ? `配套立绘：${detail.portrait.name}` : '配套立绘暂不可用，角色设定仍可单独使用。' }}</p>
          <label v-if="detail.portrait" class="cw-check"><input v-model="withPortraits" type="checkbox" />同时导入配套立绘并设为当前组</label>
          <div class="cw-actions"><button type="button" :disabled="!!busy" @click="installCloud">加入世界书</button><button type="button" :disabled="!!busy" @click="downloadCloud(item)">下载角色包</button></div>
        </div>
      </article>
      <button v-if="cursor" type="button" :disabled="!!busy" @click="loadList(false, true)">加载更多</button>
    </template>
    <form v-else @submit.prevent="installLocal">
      <div class="cw-actions"><label class="cw-file">导入角色包<input type="file" accept="application/json,.json" @change="readPackage" /></label><button type="button" @click="loadDraft">读取本地草稿</button><button type="button" @click="saveDraft">保存本地草稿</button></div>
      <label>资料名称<input v-model="draft.name" maxlength="80" required /></label>
      <label>资料分类<select v-model="draft.category" aria-label="资料分类"><option v-for="(label, key) in LORE_CATEGORIES" :key="key" :value="key">{{ label }}</option></select></label>
      <label>简介<textarea v-model="draft.description" maxlength="1000" rows="2"></textarea></label>
      <label>配套已发布立绘组 ID（可选）<input v-model="draft.portrait_group_id" maxlength="80" placeholder="在立绘工坊中复制组 ID" /></label>
      <fieldset v-for="(entry, index) in draft.entries" :key="entry.id"><legend>条目 {{ index + 1 }}</legend>
        <label>条目名<input v-model="entry.name" maxlength="100" required /></label>
        <label>关键词（逗号分隔）<input v-model="entry.keys" placeholder="留空自动使用资料名称" /></label>
        <label>设定正文<textarea v-model="entry.content" maxlength="30000" rows="8" required placeholder="角色、位面或其他设定文本"></textarea></label>
        <LoreEntrySettings v-model="entry.settings" :package-category="draft.category" />
        <button v-if="draft.entries.length > 1" type="button" @click="draft.entries.splice(index, 1)">移除此条目</button>
      </fieldset>
      <div class="cw-actions"><button type="button" :disabled="draft.entries.length >= 32" @click="draft.entries.push(newEntry())">添加条目</button><button type="button" @click="downloadDraft">导出投稿角色包</button><button :disabled="!!busy">加入世界书</button></div>
    </form>
    <div class="cw-target"><label>加入到<select v-model="target" :disabled="!!busy"><option value="">当前聊天世界书（没有则新建）</option><option v-for="name in worldbooks" :key="name" :value="name">{{ name }}</option></select></label>
      <label class="cw-check"><input v-model="overwrite" type="checkbox" :disabled="!!busy" />更新同一角色时，允许覆盖我在世界书中的本地改动</label>
      <button type="button" :disabled="!!busy" @click="previewImport">预览加入结果</button>
      <div v-if="importPreview.length" class="cw-import-preview"><p>实际归档与顺序（现有其他条目保持原样）：</p><p v-for="row in importPreview" :key="row.name">{{ LORE_CATEGORIES[row.category] }} · {{ row.order }} · {{ row.name }} · {{ row.activation === 'constant' ? '常驻' : '关键词触发' }}</p></div>
    </div>
    <p v-if="busy || message" role="status" class="cw-message">{{ busy || message }}</p>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import LoreEntrySettings from './LoreEntrySettings.vue';
import { defaultLoreSettings, LORE_CATEGORIES, type LoreCategory, type LoreSettings } from './lore-settings';
import { WORKSHOP_URL } from './portrait-workshop';
import { loadPortraitGroups, portraitSettings, savePortraitGroups, PORTRAIT_ACTIVE_GROUP, PORTRAIT_ENABLED } from './portrait-storage';
import { characterHash, characterRequest, importCharacterWorldbook, loadCharacterPortraits, parseCharacterPackage, planCharacterImport, type CharacterDetail, type CharacterListing } from './character-workshop';
defineEmits<{ close: [] }>();
const newEntry = (): { id: string; name: string; keys: string; content: string; settings: LoreSettings } => ({ id: crypto.randomUUID(), name: '角色档案', keys: '', content: '', settings: defaultLoreSettings() });
const draft = ref({ name: '', description: '', category: 'character' as LoreCategory, portrait_group_id: '', entries: [newEntry()] });
const view = ref<'cloud' | 'local'>('cloud'), query = ref(''), sort = ref('latest'), busy = ref(''), message = ref('');
const packages = ref<CharacterListing[]>([]), cursor = ref<string | null>(null), detail = ref<CharacterDetail | null>(null);
const target = ref(''), worldbooks = ref<string[]>([]), overwrite = ref(false), withPortraits = ref(false);
const categoryFilter = ref('all');
const importPreview = ref<Awaited<ReturnType<typeof planCharacterImport>>['preview']>([]);
watch(() => JSON.stringify([draft.value, detail.value, target.value, overwrite.value, view.value]), () => { importPreview.value = []; });
let loaded = false, listQuery = '', listSort = 'latest', listCategory = 'all';
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
onMounted(() => {
  try { const bound = getCharWorldbookNames('current'); worldbooks.value = [...new Set([bound.primary, ...bound.additional, getChatWorldbookName('current')].filter((name): name is string => !!name))]; }
  catch { message.value = '世界书列表暂不可用；可先制作并导出角色包。'; }
  void loadList();
});
async function loadList(reset = false, more = false, refresh = false) {
  if (busy.value || (!reset && !more && loaded)) return;
  busy.value = '正在读取角色目录…'; message.value = '';
  if (reset) { cursor.value = null; detail.value = null; listQuery = query.value.trim(); listSort = sort.value; listCategory = categoryFilter.value; }
  const params = new URLSearchParams({ sort: listSort, limit: '20', q: listQuery, category: listCategory });
  if (more && cursor.value) params.set('cursor', cursor.value);
  try {
    const result = await characterRequest(`/characters?${params}`, refresh) as { packages: CharacterListing[]; next_cursor: string | null };
    if (!Array.isArray(result.packages) || !result.packages.every(item => item && /^[A-Za-z0-9_-]{1,80}$/.test(item.id) && typeof item.name === 'string')) throw new Error('云端角色目录格式无效');
    packages.value = more ? [...packages.value, ...result.packages] : result.packages; cursor.value = result.next_cursor; loaded = true;
  } catch (error) { message.value = errorText(error); }
  finally { busy.value = ''; }
}
async function preview(item: CharacterListing) {
  if (busy.value) return;
  if (detail.value?.package.id === item.id) { detail.value = null; return; }
  busy.value = '正在读取角色设定…'; message.value = '';
  try {
    const result = await characterRequest(`/characters/${item.id}`) as CharacterDetail;
    if (result.package.id !== item.id || !/^[A-Za-z0-9_-]{1,80}$/.test(result.package.family_id)) throw new Error('角色包来源无效');
    result.content = parseCharacterPackage(result.content); detail.value = result; withPortraits.value = false;
  } catch (error) { message.value = errorText(error); }
  finally { busy.value = ''; }
}
function packageDraft() {
  return parseCharacterPackage({ format: 'jdnl-character-package', version: 1, character: {
    name: draft.value.name, description: draft.value.description, category: draft.value.category, portrait_group_id: draft.value.portrait_group_id.trim() || null,
    entries: draft.value.entries.map(({ keys, ...entry }) => ({ ...entry, keywords: keys.split(/[,，、\n]/).map(key => key.trim()).filter(Boolean) })),
  } });
}
async function previewImport() {
  if (busy.value) return;
  busy.value = '正在计算本地导入顺序…'; message.value = '';
  try {
    const payload = view.value === 'cloud' ? detail.value?.content : packageDraft();
    if (!payload) throw new Error('请先展开要加入的资料');
    const name = target.value || getChatWorldbookName('current');
    const current = name ? await getWorldbook(name) : [];
    const hash = await characterHash(payload);
    const source = view.value === 'cloud' && detail.value ? detail.value.package : { id: `local-${hash.slice(0, 24)}`, family_id: `local-${hash.slice(0, 24)}`, author_name: '本地导入' };
    importPreview.value = (await planCharacterImport(current, parseCharacterPackage(payload), source, overwrite.value)).preview;
    message.value = '已计算分类与空闲顺序；尚未写入世界书。';
  } catch (error) { importPreview.value = []; message.value = errorText(error); }
  finally { busy.value = ''; }
}
async function installCloud() {
  if (!detail.value || busy.value) return;
  const selected = detail.value, includePortraits = withPortraits.value, chosenTarget = target.value;
  busy.value = '正在加入世界书…'; message.value = '';
  try {
    const fresh = await characterRequest(`/characters/${selected.package.id}`, true) as CharacterDetail;
    const content = parseCharacterPackage({ ...fresh.content, character: { ...fresh.content.character, category: selected.content.character.category,
      entries: fresh.content.character.entries.map(entry => ({ ...entry, settings: selected.content.character.entries.find(current => current.id === entry.id)?.settings })) } });
    if (fresh.package.content_hash !== selected.package.content_hash) throw new Error('角色设定已改变，请重新预览后导入');
    const portraits = includePortraits && fresh.portrait ? await loadCharacterPortraits(fresh.portrait.id) : null;
    if (includePortraits && !portraits) throw new Error('配套立绘已撤回，请取消立绘选项后单独导入角色设定');
    const result = await importCharacterWorldbook(content, fresh.package, chosenTarget, overwrite.value);
    message.value = `已加入“${result.name}”：新增 ${result.added}、更新 ${result.replaced} 条。`;
    if (portraits) {
      try {
        const groups = await loadPortraitGroups(), groupId = `character-${fresh.package.family_id}`;
        const items = await Promise.all(portraits.items.map(async item => ({ ...item, id: `cw_${(await characterHash([fresh.package.family_id, item.id])).slice(0, 32)}` })));
        const existing = groups.find(group => group.id === groupId);
        if (existing) {
          // Keep local additions and local edits; only append previously unseen IDs.
          const known = new Set(existing.items.map(item => item.id));
          existing.items.push(...items.filter(item => !known.has(item.id)));
        } else groups.push({ id: groupId, name: `${content.character.name} · 配套立绘`, items });
        await savePortraitGroups(groups);
        portraitSettings().setItem(PORTRAIT_ACTIVE_GROUP, groupId); portraitSettings().setItem(PORTRAIT_ENABLED, '1');
        message.value += '配套立绘已保存并启用。';
      } catch (error) { message.value += `角色设定已保存，立绘导入失败，可重试：${errorText(error)}`; }
    }
  } catch (error) { message.value = errorText(error); }
  finally { busy.value = ''; }
}
async function installLocal() {
  if (busy.value) return;
  busy.value = '正在加入世界书…'; message.value = '';
  try {
    const payload = packageDraft(), hash = await characterHash(payload);
    const result = await importCharacterWorldbook(payload, { id: `local-${hash.slice(0, 24)}`, family_id: `local-${hash.slice(0, 24)}`, author_name: '本地导入' }, target.value, overwrite.value);
    message.value = `已加入“${result.name}”：新增 ${result.added}、更新 ${result.replaced} 条。`;
  } catch (error) { message.value = errorText(error); }
  finally { busy.value = ''; }
}
function download(payload: ReturnType<typeof parseCharacterPackage>) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `镜待流年-角色-${payload.character.name.replace(/[\\/:*?"<>|]/g, '-')}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadDraft() { try { download(packageDraft()); } catch (error) { message.value = errorText(error); } }
async function downloadCloud(item: CharacterListing) {
  if (busy.value) return;
  busy.value = '正在下载角色包…';
  try { download(parseCharacterPackage(await characterRequest(`/characters/${item.id}/export?intent=download`, true))); message.value = '角色包已下载。'; }
  catch (error) { message.value = errorText(error); }
  finally { busy.value = ''; }
}
async function readPackage(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  try {
    if (!file) return;
    if (file.size > 262144) throw new Error('角色包超过 256 KiB');
    const c = parseCharacterPackage(JSON.parse(await file.text())).character;
    draft.value = { ...c, portrait_group_id: c.portrait_group_id || '', entries: c.entries.map(({ keywords, ...entry }) => ({ ...entry, keys: keywords.join('，') })) }; message.value = '已导入角色包，可编辑后导出投稿。';
  } catch (error) { message.value = errorText(error); }
  finally { input.value = ''; }
}
function saveDraft() { try { portraitSettings().setItem('jdnl_character_draft_v1', JSON.stringify(packageDraft())); message.value = '草稿已保存到此浏览器。'; } catch (error) { message.value = errorText(error); } }
function loadDraft() {
  try {
    const saved = portraitSettings().getItem('jdnl_character_draft_v1'); if (!saved) throw new Error('此浏览器尚无角色草稿');
    const c = parseCharacterPackage(JSON.parse(saved)).character;
    draft.value = { ...c, portrait_group_id: c.portrait_group_id || '', entries: c.entries.map(({ keywords, ...entry }) => ({ ...entry, keys: keywords.join('，') })) }; message.value = '已读取本地草稿。';
  } catch (error) { message.value = errorText(error); }
}
</script>
<style scoped>
.character-workshop { margin: 8px 10px; padding: 13px; border: 1px solid var(--t-border, #b59c7255); border-radius: 9px; background: var(--t-bg, #f1ebdf); color: var(--t-text, #68593e); font: 12px/1.7 'Microsoft YaHei', sans-serif; box-sizing: border-box; }
.cw-heading, .cw-actions, .cw-toggle { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cw-heading { justify-content: space-between; }.cw-heading h3 { margin: 0; font-size: 14px; }.cw-actions { margin: 8px 0; }
button, a { color: var(--t-accent, #8a6a39); font: inherit; }button { border: 1px solid var(--t-border, #b59c7255); background: var(--t-accent-dim, #c6ad7f22); border-radius: 5px; padding: 5px 9px; cursor: pointer; }button:disabled { opacity: .5; cursor: default; }button[aria-pressed='true'] { border-color: var(--t-accent, #8a6a39); }
input, textarea, select { width: 100%; max-width: 100%; box-sizing: border-box; padding: 7px; border: 1px solid var(--t-border, #b59c7255); border-radius: 4px; background: var(--t-bg, #f4efe5); color: inherit; font: inherit; }textarea { resize: vertical; }label { display: block; margin: 7px 0; }.cw-actions > input { flex: 1; min-width: 100px; }.cw-actions > select { width: auto; }
.cw-muted, small { color: var(--t-muted, #827460); font-size: 10px; overflow-wrap: anywhere; }.cw-package { border-top: 1px solid var(--t-border, #b59c7255); padding: 8px 0; }.cw-toggle { flex-wrap: nowrap; justify-content: space-between; width: 100%; border: 0; background: transparent; padding: 4px 0; text-align: left; }.cw-toggle span:first-child { min-width: 0; }.cw-toggle strong, .cw-toggle small { display: block; overflow-wrap: anywhere; }
.cw-detail { padding: 0 9px 8px; border-left: 2px solid var(--t-border, #b59c7255); }.cw-entry h4 { margin: 10px 0 3px; font-size: 12px; }.cw-entry pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; margin: 7px 0; }.cw-check { display: flex; align-items: start; gap: 6px; font-size: 10px; }.cw-check input { flex: 0 0 14px; width: 14px; margin-top: 3px; }.cw-target { border-top: 1px solid var(--t-border, #b59c7255); margin-top: 12px; padding-top: 5px; }.cw-message { overflow-wrap: anywhere; border-left: 2px solid var(--t-accent, #8a6a39); padding-left: 8px; }
fieldset { border: 1px solid var(--t-border, #b59c7255); padding: 8px; margin: 10px 0; min-width: 0; }.cw-file input { display: block; font-size: 10px; }button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid var(--t-accent, #8a6a39); outline-offset: 2px; }
</style>
