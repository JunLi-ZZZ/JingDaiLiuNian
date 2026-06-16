<template>
  <div class="theme-mirror">
    <div class="mirror-frame">
      <div class="frame-ring"></div>
      <div class="frame-inset"></div>
      <div class="mirror-surface">
        <div class="panel-title">{{ storyActive ? '✦ 自定义剧情' : '自定义剧情' }}</div>
        <div class="section-body" style="padding-top:0">
      <div class="form-row">
        <label>剧情标题</label>
        <input v-model="sForm.title" placeholder="为空则随机…" />
      </div>
      <div class="form-row">
        <label>剧情类型</label>
        <select v-model="sForm.type">
          <option value="">随机</option><option value="自定义">自定义 ▼</option>
          <option>时局暗流</option><option>角色关联</option><option>历史事件</option>
          <option>冲突爆发</option><option>日常事件</option><option>位面交汇</option>
          <option>个人任务</option><option>势力博弈</option>
        </select>
      </div>
      <div v-if="sForm.type === '自定义'" class="form-row"><input v-model="sForm.typeCustom" placeholder="填写自定义类型…" /></div>
      <div class="form-row-dual">
        <div class="form-row">
          <label>关联位面</label>
          <input v-model="sForm.plane" placeholder="位面名称，留空则不限…" />
        </div>
        <div class="form-row">
          <label>关联角色</label>
          <input v-model="sForm.chars" placeholder="角色名，逗号分隔，留空则不限…" />
        </div>
      </div>
      <div class="form-row">
        <label>同人作品 <span class="mx-mode-toggle" @click="sFandomMode = !sFandomMode">{{ sFandomMode ? '⟲ 简单' : '⟳ 魔改' }}</span></label>
        <div v-if="!sFandomMode" class="mx-fandom-simple">
          <select v-model="sForm.fandom">
            <option value="">原创（不指定）</option><option value="自定义">自定义 ▼</option>
            <option v-for="t in sFandoms" :key="'sf_'+t" :value="t">{{ t }}</option>
          </select>
          <div v-if="sForm.fandom === '自定义'"><input v-model="sForm.fandomCustom" placeholder="填写作品名…" /></div>
        </div>
        <div v-if="sFandomMode" class="mx-fandom-ext">
          <select v-model="sForm.fandomType">
            <option value="">魔改向</option><option value="自定义">自定义 ▼</option>
            <option>原作向</option><option>魔改向</option><option>反转向</option><option>纯净向</option><option>融合向</option><option>片段补全</option>
          </select>
          <div v-if="sForm.fandomType === '自定义'" class="form-row"><input v-model="sForm.fandomTypeCustom" placeholder="填写类型…" /></div>
          <select v-model="sForm.fandom">
            <option value="">选择作品</option><option value="自定义">自定义 ▼</option>
            <option v-for="t in sFandoms" :key="'sfe_'+t" :value="t">{{ t }}</option>
          </select>
          <div v-if="sForm.fandom === '自定义'" class="form-row"><input v-model="sForm.fandomCustom" placeholder="填写作品名…" /></div>
          <input v-model="sForm.fandomDesc" placeholder="描述魔改细节，如：IF线/性转/角色替换…" />
        </div>
      </div>
      <div class="form-row">
        <label>补充说明</label>
        <textarea v-model="sForm.note" rows="2" placeholder="额外的设定、限制、方向…"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn-gen" :disabled="sGenerating" @click="sGenerate()">
          {{ sGenerating ? '生成中…' : 'AI 生成剧情' }}
        </button>
      </div>
      <div v-if="sGenResult" class="mx-gen-result">
        <div class="gen-result-label">剧情档案</div>
        <textarea v-model="sGenArchive" class="gen-result-text" rows="6" placeholder="（AI 生成的剧情将显示在这里，可手动修改）"></textarea>
        <div class="gen-result-actions">
          <button class="btn-gen-save" :disabled="!sGenArchive.trim() || sSaving" @click="sSave()">
            {{ sSaving ? '保存中…' : '保存到世界书' }}
          </button>
          <span v-if="sSuccess" class="gen-saved-hint">{{ sSuccess }}</span>
          <button class="btn-gen-retry" @click="sGenerate()">重新生成</button>
          <button v-if="storyActive" class="btn-gen-retry" @click="sReset()" style="border-color:rgba(196,123,139,0.2);color:#c47b8b;background:transparent">清除已保存</button>
        </div>
      </div>
      <div v-if="sError" class="mx-gen-status error">{{ sError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

const showStory = ref(false);
const storyActive = ref(false);
const sGenerating = ref(false);
const sSaving = ref(false);
const sGenResult = ref('');
const sGenArchive = ref('');
const sError = ref('');
const sSuccess = ref('');
const sFandomMode = ref(false);
const sFandoms = ['哥布林杀手','原神','Fate','东方Project','明日方舟','崩坏星穹铁道','蔚蓝档案','葬送的芙莉莲','鬼灭之刃','咒术回战','艾尔登法环','赛马娘','碧蓝航线','崩坏3','少女前线','公主连结','无职转生','Re:从零开始的异世界生活'];
const sForm = reactive({ title: '', type: '', typeCustom: '', plane: '', chars: '', fandom: '', fandomCustom: '', fandomType: '', fandomTypeCustom: '', fandomDesc: '', note: '' });

const sTemplate = `你正在协助玩家生成一段背景设定。根据以下标签，整理一份记录已发生事件与当前格局的档案。

请将信息整理为以下档案，标记为 [剧情档案]。

---

[剧情档案]

<story_info>
背景档案:
    标题:
    类型:（时局暗流/角色关联/历史事件/冲突爆发/位面交汇/势力博弈等）

    关联位面:
    关联角色:（与此背景直接相关的角色，含其立场或动机）

    背景概述:
      - （当前位面/区域的局势状态——当下的政治格局、势力分布、社会氛围）
      - （已发生的重大事件与关键转折——只写已经发生过的事，不预设未来走向）

    事件脉络:
      （按时间顺序列出已发生的核心事件，模仿以下格式）
      （事件名）:
        时期:（距今多久/发生在哪个年代）
        起因:（事件为何发生）
        过程:（关键节点与转折，不写结局未定之事）
        影响:（事件留下的后果、造成的格局变化、仍在持续的余波）

    现存格局:
      - （当前各方势力的状态——谁在崛起、谁在衰落、哪些矛盾正在酝酿）
      - （潜在的不稳定因素——已有的紧张关系、悬而未决的冲突、未完成的计划）
</story_info>

---

规则：
- 只写已发生的事和当前状态，不写未来走向、不写剧本式叙述、不写角色具体行动路线。
- 不要写叙述。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 标题简洁有辨识度。`;

async function sGenerate() {
  sError.value = '';
  sGenResult.value = '';
  sGenArchive.value = '';
  sGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { sError.value = '未检测到酒馆助手。'; return; }
    const d = sForm;
    const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
    const tags: string[] = [];
    tags.push('剧情标题：' + (d.title || '随机'));
    tags.push('剧情类型：' + v(d.type, d.typeCustom));
    if (d.plane.trim()) tags.push('关联位面：' + d.plane.trim()); else tags.push('关联位面：不限');
    if (d.chars.trim()) tags.push('关联角色：' + d.chars.trim()); else tags.push('关联角色：不限');
    if (sFandomMode.value) {
      const ftype = d.fandomType === '自定义' ? d.fandomTypeCustom || '魔改向' : d.fandomType || '魔改向';
      tags.push('同人类型：' + ftype);
      if (v(d.fandom, d.fandomCustom)) tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
      if (d.fandomDesc) tags.push('魔改描述：' + d.fandomDesc);
    } else if (v(d.fandom, d.fandomCustom) && v(d.fandom, d.fandomCustom) !== '原创') {
      tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
    }
    if (d.note.trim()) tags.push('补充说明：' + d.note.trim());
    const tagBlock = tags.map(t => '- ' + t).join('\n');
    const isFandom = sFandomMode.value || (d.fandom && d.fandom !== '原创');
    const fandomHint = isFandom ? '（含同人设定，贴合原作世界观或魔改方向）' : '';
    const prompt = `生成一段剧情设定。${fandomHint}\n\n=== 已选标签 ===\n${tagBlock}\n\n${sTemplate}\n\n（请按上述模板输出 [剧情档案] 。）`;
    const kw: string[] = [];
    if (d.type === '自定义' && d.typeCustom) kw.push(d.typeCustom);
    else if (d.type) kw.push(d.type);
    if (d.plane.trim()) kw.push(d.plane.trim());
    if (d.chars.trim()) d.chars.split(/[,，]/).forEach(c => { const n = c.trim(); if (n) kw.push(n); });
    if (d.fandom && d.fandom !== '原创' && d.fandom !== '自定义') kw.push(d.fandom);
    if (d.fandom === '自定义' && d.fandomCustom) kw.push(d.fandomCustom);
    const result = await TH.generateRaw({
      user_input: `本次为镜渡生成剧情档案，勿编剧情。以下为部分已选标签，供扫描关键词激活世界书用：${kw.join('，')}`,
      should_silence: true,
      max_chat_history: 0,
      ordered_prompts: [{ role: 'system', content: prompt }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'user_input'],
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    sGenResult.value = text;
    const archMatch = text.match(/\[剧情档案\]\s*([\s\S]*)/);
    sGenArchive.value = archMatch ? archMatch[1].trim() : text;
  } catch (e: any) { sError.value = e?.message || String(e); }
  finally { sGenerating.value = false; }
}

async function sSave() {
  if (!sGenArchive.value.trim()) return;
  sError.value = '';
  sSuccess.value = '';
  sSaving.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { sError.value = '未检测到酒馆助手。'; return; }
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) { sError.value = '未找到世界书。'; return; }
    const titleMatch = sGenArchive.value.match(/标题[：:][^\S\n]*(\S[^\n]*)/);
    const storyTitle = titleMatch ? titleMatch[1].trim() : '新剧情';
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 6000 && o < 8000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 6000;
    const keys = [storyTitle];
    await TH.createLorebookEntries(wbName, [{
      comment: `镜渡剧情 - ${storyTitle}`, enabled: true, type: 'constant',
      position: 'before_character_definition', order: nextOrder, probability: 100,
      exclude_recursion: true, prevent_recursion: true, content: sGenArchive.value,
    }]);
    storyActive.value = true;
    sSuccess.value = `已保存：${storyTitle}`;
  } catch (e: any) { sError.value = e?.message || '保存失败'; }
  finally { sSaving.value = false; }
}

function sInject() {
  if (!sGenArchive.value) return;
  const $p = (window as any).parent?.$;
  if (!$p) return;
  const current = String($p('#send_textarea').val() || '');
  $p('#send_textarea').val(current ? current + '\n\n使用母镜感知到一段剧情信息：\n' + sGenArchive.value : '使用母镜感知到一段剧情信息：\n' + sGenArchive.value).trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
}

async function sReset() {
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) return;
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) return;
    const entries = await TH.getLorebookEntries(wbName);
    const saved = entries.filter((e: any) => (e.comment || '').startsWith('镜渡剧情 - '));
    for (const e of saved) {
      await TH.setLorebookEntries(wbName, [{ uid: e.uid, enabled: false }]);
    }
    storyActive.value = false;
    sSuccess.value = '已清除';
  } catch (e: any) { sError.value = e?.message || '清除失败'; }
}
</script>
<style scoped>
.theme-mirror {
  --m-accent: var(--c-accent, #c9a96e);
  --m-accent-dim: rgba(201, 169, 110, 0.2);
  --m-surface: var(--c-bg, #f5ede0);
  --m-text: #4a4035;
  --m-muted: #8a7e6e;
  margin-bottom: 10px;
}
.form-row-dual { display: flex; gap: 8px; }
.form-row-dual > * { flex: 1; }
.mirror-surface { max-height: none; overflow: visible; }
.panel-title { background: linear-gradient(135deg, #6b4a28, #8b5a30 40%, #6b4a28 60%, #8b5a30); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
</style>
