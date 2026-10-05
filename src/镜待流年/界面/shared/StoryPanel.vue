<template>
  <div class="theme-mirror">
    <div class="mirror-frame">
      <div class="frame-ring"></div>
      <div class="frame-inset"></div>
      <div class="mirror-surface">
        <div class="panel-title">自定义开场白</div>
        <div class="section-body" style="padding-top:0">
      <div class="form-row">
        <label>开场标题</label>
        <input v-model="sForm.title" placeholder="为空则随机…" />
      </div>
      <div class="form-row">
          <label>场景方向</label>
        <select v-model="sForm.type">
          <option value="">随机</option><option value="自定义">自定义 ▼</option>
          <option>世界机制</option><option>位面规则</option><option>特殊现象</option>
          <option>势力格局</option><option>传说秘闻</option><option>组织/榜单</option>
          <option>赛事/仪式</option>
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
        <textarea v-model="sForm.note" rows="2" placeholder="角色状态、地点、冲突或希望保留的开场条件…"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn-gen" :disabled="sGenerating" @click="sGenerate()">
          {{ sGenerating ? '生成中…' : 'AI 生成开场白大纲' }}
        </button>
      </div>
      <div v-if="sGenResult" class="mx-gen-result">
        <div class="gen-result-label">开场白大纲</div>
        <textarea v-model="sGenArchive" class="gen-result-text" rows="6" placeholder="（AI 生成的剧情将显示在这里，可手动修改）"></textarea>
        <div class="gen-result-actions">
          <button class="btn-gen-save" :disabled="!sGenArchive.trim()" @click="sInject()">
            填入用户输入框
          </button>
          <span v-if="sSuccess" class="gen-saved-hint">{{ sSuccess }}</span>
          <button class="btn-gen-retry" @click="sGenerate()">重新生成</button>
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

const sGenerating = ref(false);
const sGenResult = ref('');
const sGenArchive = ref('');
const sError = ref('');
const sSuccess = ref('');
const sFandomMode = ref(false);
const sFandoms = ['哥布林杀手','原神','Fate','东方Project','明日方舟','崩坏星穹铁道','蔚蓝档案','葬送的芙莉莲','鬼灭之刃','咒术回战','艾尔登法环','赛马娘','碧蓝航线','崩坏3','少女前线','公主连结','无职转生','Re:从零开始的异世界生活'];
const sForm = reactive({ title: '', type: '', typeCustom: '', plane: '', chars: '', fandom: '', fandomCustom: '', fandomType: '', fandomTypeCustom: '', fandomDesc: '', note: '' });

const sTemplate = `你正在协助玩家准备一段新的开场白。根据以下标签，生成一份可直接交给玩家继续游玩的开场大纲。

请将信息整理为以下大纲，标记为 [开场白大纲]。

---

[开场白大纲]

<story_info>
开场信息:
    名称:
    场景方向:
    地点与时间:

    开场状态:
      - （故事开始时各方已知的处境、关系和正在发生的事情）

    可接续的现场:
      - （眼前可观察到的细节、未解决的张力和自然的回应空间）

    开场写作提示:
      - （给后续正文的方向提示，不替玩家决定行动、台词或内心）
</story_info>

---

规则：
- 写的是开场大纲，不是完整正文。不要替玩家写行动、台词、内心或选择。
- 保留开放的回应空间，让玩家可以从这段现场自然接续。
- 角色只使用其已知信息；不凭空揭示玩家尚未接触的真相。
- 不要写叙述、分析过程、创作建议。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。
- 严格按以上格式输出。除此之外不要附带任何其他内容。`;

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
    const prompt = `生成一段可供玩家继续的开场白大纲。${fandomHint}\n\n=== 已选标签 ===\n${tagBlock}\n\n${sTemplate}\n\n（请按上述模板输出 [开场白大纲] 。）`;
    const kw: string[] = [];
    if (d.type === '自定义' && d.typeCustom) kw.push(d.typeCustom);
    else if (d.type) kw.push(d.type);
    if (d.plane.trim()) kw.push(d.plane.trim());
    if (d.chars.trim()) d.chars.split(/[,，]/).forEach(c => { const n = c.trim(); if (n) kw.push(n); });
    if (d.fandom && d.fandom !== '原创' && d.fandom !== '自定义') kw.push(d.fandom);
    if (d.fandom === '自定义' && d.fandomCustom) kw.push(d.fandomCustom);
    if (d.note.trim()) d.note.trim().split(/[,，、\s]+/).filter((w: string) => w.length >= 2).forEach((w: string) => kw.push(w));
    const result = await TH.generateRaw({
      user_input: `本次为镜渡准备自定义开场白大纲，不修改世界书，不自动发送。以下为已选标签：${kw.join('，')}`,
      should_silence: true,
      max_chat_history: 0,
      ordered_prompts: [{ role: 'system', content: prompt }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'user_input'],
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    sGenResult.value = text;
    const archMatch = text.match(/\[开场白大纲\]\s*([\s\S]*)/);
    sGenArchive.value = archMatch ? archMatch[1].trim() : text;
  } catch (e: any) { sError.value = e?.message || String(e); }
  finally { sGenerating.value = false; }
}

function sInject() {
  if (!sGenArchive.value) return;
  const $p = (window as any).parent?.$;
  if (!$p) return;
  const current = String($p('#send_textarea').val() || '');
  $p('#send_textarea').val(current ? current + '\n\n' + sGenArchive.value : sGenArchive.value).trigger('input');
  sSuccess.value = '已填入输入框，请确认后手动发送';
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
