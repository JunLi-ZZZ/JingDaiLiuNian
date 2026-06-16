<template>
  <div class="theme-mirror">
    <div class="mirror-frame">
      <div class="frame-ring"></div>
      <div class="frame-inset"></div>
      <div class="mirror-surface">
        <div class="panel-title">自定义主角</div>
        <div class="section-body" style="padding-top: 0">
          <div class="form-row-dual">
            <div class="form-row">
              <label>年龄感</label>
              <select v-model="pForm.年龄感">
                <option value="">不指定</option>
                <option>少年</option>
                <option>青年</option>
                <option>成年</option>
                <option>中年</option>
              </select>
            </div>
            <div class="form-row">
              <label>种族</label>
              <input v-model="pForm.种族" placeholder="如：人类 / 自定义…" />
            </div>
          </div>
          <div class="form-row-dual">
            <div class="form-row">
              <label>身份</label>
              <input v-model="pForm.身份" placeholder="如：星见大学研究生" />
            </div>
            <div class="form-row">
              <label>来源世界</label>
              <input v-model="pForm.来源世界" placeholder="如：主世界 / 自定义…" />
            </div>
          </div>
          <div class="form-row">
            <label>境界</label>
            <input v-model="pForm.境界" placeholder="如：凡人 / 自定义…" />
          </div>
          <div class="form-row">
            <label>风格标签</label>
            <div class="tag-pool">
              <span
                v-for="t in pTraits"
                :key="t"
                class="tag"
                :class="{ picked: pForm.traits.includes(t) }"
                @click="pToggleTag(t)"
                >{{ t }}</span
              >
              <span class="tag tag-custom">
                <input v-model="pTagInput" placeholder="自定义+" @keyup.enter="pTagInput = pAddCustom(pTagInput)" />
                <button class="tag-custom-btn" @click="pTagInput = pAddCustom(pTagInput)">+</button>
              </span>
            </div>
          </div>
          <div class="form-row">
            <label>补充说明</label>
            <textarea v-model="pForm.备注" rows="2" placeholder="其他想补充的设定、背景、想法…"></textarea>
          </div>
          <div class="btn-row">
            <button class="btn-gen" :disabled="pGenerating" @click="pGenerate()">
              {{ pGenerating ? '生成中…' : 'AI 生成详细人设' }}
            </button>
          </div>
          <div v-if="pGenResult" class="mx-gen-result">
            <div class="gen-result-label">主角档案</div>
            <textarea
              v-model="pGenResult"
              class="gen-result-text"
              rows="6"
              placeholder="（AI 生成的人设将显示在这里，可手动修改）"
            ></textarea>
            <div class="gen-result-actions">
              <button
                class="btn-gen-save"
                :disabled="!pGenResult.trim() || protagonistSaving"
                @click="saveProtagonist()"
              >
                {{ protagonistSaving ? '保存中…' : '确认主角' }}
              </button>
              <span v-if="protagonistSuccess" class="gen-saved-hint">{{ protagonistSuccess }}</span>
              <button v-if="protagonistActive" class="btn-gen-retry" @click="resetProtagonist()">恢复默认</button>
            </div>
          </div>
          <div v-if="protagonistError" class="mx-gen-status error">{{ protagonistError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';

const showProtagonist = ref(false);
const protagonistActive = ref(false);
const protagonistSaving = ref(false);
const protagonistError = ref('');
const protagonistSuccess = ref('');
const pGenerating = ref(false);
const pGenResult = ref('');
const pTraits = ['温和', '冷峻', '活泼', '沉稳', '叛逆', '善良', '腹黑', '天然', '孤僻', '热血', '慵懒', '傲娇'];
const savedProto = (() => {
  try {
    const r = localStorage.getItem('jdnl_protagonist');
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
})();
const pForm = reactive({
  年龄感: (savedProto as any).年龄感 || '',
  种族: (savedProto as any).种族 || '',
  身份: (savedProto as any).身份 || '',
  来源世界: (savedProto as any).来源世界 || '',
  境界: (savedProto as any).境界 || '',
  traits: (savedProto as any).traits || ([] as string[]),
  备注: (savedProto as any).备注 || '',
});
watch(
  pForm,
  v => {
    localStorage.setItem('jdnl_protagonist', JSON.stringify({ ...v }));
  },
  { deep: true },
);
const pTagInput = ref('');
function pToggleTag(t: string) {
  const i = pForm.traits.indexOf(t);
  if (i >= 0) pForm.traits.splice(i, 1);
  else pForm.traits.push(t);
}
function pAddCustom(v: string): string {
  const s = v.trim();
  if (s && !pForm.traits.includes(s)) pForm.traits.push(s);
  return '';
}

const pGenPrompt = `你正在协助玩家自定义主角人设。根据以下标签生成一份详细的主角档案。

格式要求：
- 包含：基本信息（年龄/种族/身份/来源世界/境界）、外貌特征（基础体型/整体印象）、性格特点
- 如果种族、来源世界、境界未指定，根据整体设定合理推断
- 末尾必须包含 特殊物品 段，内容为母镜（一面古朴铜镜，虞姝昀赠予的护身符，偶尔能在镜中瞥见模糊的红颜特征）
- 灵活描述，不固化可变细节

输出格式：
<protagonist>
主角档案:
    基本信息:
        姓名:
        性别:
        年龄:
        种族:
        身份:
        来源世界:
        境界:

    外貌特征:
        基础体型:
        整体印象:

    性格特点:
        喜好:
        厌恶:
        核心特质:

    特殊物品:
        母镜:
            - 一面古朴铜镜，虞姝昀在<user>幼时赠予，称"护身符"
            - 偶尔能在镜中瞥见模糊的红颜特征
</protagonist>`;

async function pGenerate() {
  pGenResult.value = '';
  protagonistError.value = '';
  pGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      protagonistError.value = '未检测到酒馆助手。';
      return;
    }
    const tags: string[] = [];
    if (pForm.年龄感) tags.push('年龄感：' + pForm.年龄感);
    if (pForm.种族) tags.push('种族：' + pForm.种族);
    if (pForm.身份) tags.push('身份：' + pForm.身份);
    if (pForm.来源世界) tags.push('来源世界：' + pForm.来源世界);
    if (pForm.境界) tags.push('境界：' + pForm.境界);
    if (pForm.traits.length) tags.push('风格：' + pForm.traits.join('、'));
    if (pForm.备注) tags.push('补充：' + pForm.备注);
    const tagBlock = tags.map(t => '- ' + t).join('\n');
    const prompt = `自定义主角设定：\n${tagBlock}\n\n${pGenPrompt}`;
    const result = await TH.generateRaw({
      user_input: '根据档案模板生成主角人设。',
      should_silence: true,
      max_chat_history: 0,
      ordered_prompts: [
        { role: 'system', content: prompt },
        'persona_description',
        'char_description',
        'world_info_before',
        'world_info_after',
        'user_input',
      ],
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    const m = text.match(/<protagonist>[\s\S]*<\/protagonist>/);
    pGenResult.value = m ? m[0].trim() : text;
  } catch (e: any) {
    protagonistError.value = e?.message || String(e);
  } finally {
    pGenerating.value = false;
  }
}

async function checkProtagonistStatus() {
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) return;
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) return;
    const entries = await TH.getLorebookEntries(wbName);
    protagonistActive.value = entries.some((e: any) => e.comment === 'user人设(自定义)' && e.enabled !== false);
  } catch {
    /* silent */
  }
}

async function saveProtagonist() {
  if (!pGenResult.value.trim()) return;
  protagonistError.value = '';
  protagonistSuccess.value = '';
  protagonistSaving.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      protagonistError.value = '未检测到酒馆助手。';
      return;
    }
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      protagonistError.value = '未找到世界书。';
      return;
    }
    const entries = await TH.getLorebookEntries(wbName);
    const defaultEntry = entries.find((e: any) => e.comment === 'user人设');
    const customEntry = entries.find((e: any) => e.comment === 'user人设(自定义)');
    if (customEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: customEntry.uid, content: pGenResult.value }]);
    } else {
      await TH.createLorebookEntries(wbName, [
        {
          comment: 'user人设(自定义)',
          enabled: true,
          type: 'constant',
          position: 'before_character_definition',
          order: 2996,
          probability: 100,
          exclude_recursion: true,
          prevent_recursion: true,
          content: pGenResult.value,
        },
      ]);
    }
    if (defaultEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: defaultEntry.uid, enabled: false }]);
    }
    protagonistActive.value = true;
    protagonistSuccess.value = '自定义主角已保存';
  } catch (e: any) {
    protagonistError.value = e?.message || '保存失败';
  } finally {
    protagonistSaving.value = false;
  }
}

async function resetProtagonist() {
  protagonistError.value = '';
  protagonistSuccess.value = '';
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      protagonistError.value = '未检测到酒馆助手。';
      return;
    }
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      protagonistError.value = '未找到世界书。';
      return;
    }
    const entries = await TH.getLorebookEntries(wbName);
    const defaultEntry = entries.find((e: any) => e.comment === 'user人设');
    const customEntry = entries.find((e: any) => e.comment === 'user人设(自定义)');
    if (defaultEntry) await TH.setLorebookEntries(wbName, [{ uid: defaultEntry.uid, enabled: true }]);
    if (customEntry) await TH.setLorebookEntries(wbName, [{ uid: customEntry.uid, enabled: false }]);
    protagonistActive.value = false;
    protagonistSuccess.value = '已恢复默认主角';
  } catch (e: any) {
    protagonistError.value = e?.message || '恢复失败';
  }
}

onMounted(() => {
  checkProtagonistStatus();
});
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
.form-row select, .form-row textarea,
.form-row input:not(.tag-custom input):not(.tag-pool input) { background: rgba(255,255,255,0.4); }
.form-row select:focus, .form-row textarea:focus,
.form-row input:focus:not(.tag-custom input):not(.tag-pool input) { border-color: var(--m-accent); }
.tag { background: rgba(139,115,85,0.04) !important; }
.tag.picked { background: var(--m-accent-dim) !important; border-color: var(--m-accent); color: var(--m-accent); }
.mirror-surface { max-height: none; overflow: visible; }
.panel-title { background: linear-gradient(135deg, #6b4a28, #8b5a30 40%, #6b4a28 60%, #8b5a30); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
</style>
