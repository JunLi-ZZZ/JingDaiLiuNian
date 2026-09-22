<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Schema, OpeningScenarioSchema } from '../../src/schema';
import CharacterEditor from './CharacterEditor.vue';
import type { OpeningChoice } from '../../src/opening';
import { createOpening } from '../../src/opening';
import { openingRequest, validateOpeningRequest } from '../../src/opening-request';
import type { CoverEnvironment } from '../封面/environment';
import type { OpeningDraft, OpeningTask } from '../../src/opening-story';
import OpeningScenarioEditor from './OpeningScenarioEditor.vue';
import Cover from './Cover.vue';
import Workshop from './Workshop.vue';
const workshopOpen=ref(false);
const workshopState=Schema.parse({});
const props = defineProps<{
  busy?: boolean;
  error?: string;
  preview?: boolean;
  completed?: boolean;
  environment?: CoverEnvironment;
  ready?: boolean;
  readPersonaName?: () => string;
  requestDraft?: (task: OpeningTask, choice: OpeningChoice) => Promise<string | OpeningDraft>;
  cancelGeneration?: () => void;
}>();
const emit = defineEmits<{ start: [choice: OpeningChoice, request: string]; retry: []; generate: [] }>();
const mode = ref<'默认' | '自定义'>('默认');
const choosing = ref(false);
const profile = ref(Schema.shape._开局.unwrap().shape.档案.parse({}));
const scenario = ref(OpeningScenarioSchema.parse({}));
const draft = ref<string | null>(null);
const draftKey = ref('');
const generating = ref(false);
const localError = ref('');
const resolvedPersonaName = () => {
  const name = props.readPersonaName?.().trim() || '';
  return name && !/\{\{|\}\}|<\/?user>/i.test(name) ? name : '归来者';
};
const defaultName = ref(resolvedPersonaName());
let requestVersion = 0;
const choice = computed<OpeningChoice>(() => ({
  mode: mode.value,
  profile: mode.value === '自定义' ? { ...profile.value } : { 姓名: defaultName.value },
  scenario: { ...scenario.value },
}));
const fingerprint = computed(() => JSON.stringify(choice.value));
const stale = computed(() => !!draft.value && draftKey.value !== fingerprint.value);
watch(fingerprint, () => {
  localError.value = '';
});
function previewDefault() {
  try {
    createOpening(choice.value, 'preview-check');
    draft.value = openingRequest(choice.value);
    draftKey.value = fingerprint.value;
    localError.value = '';
  } catch (error) {
    localError.value = error instanceof Error ? error.message : String(error);
  }
}
async function generateDraft(task: OpeningTask) {
  localError.value = '';
  const token = ++requestVersion;
  try {
    createOpening(choice.value, 'preview-check');
    if (!props.requestDraft) throw Error('当前环境无法生成，请在酒馆中使用此功能');
    generating.value = true;
    const requestedKey = fingerprint.value;
    const result = await props.requestDraft(task, JSON.parse(requestedKey));
    if (token !== requestVersion) return;
    if (fingerprint.value !== requestedKey) throw Error('设定已变更，请按当前内容重新生成');
    if (task === '大纲') {
      if (typeof result !== 'string' || !result.trim()) throw Error('未收到开局大纲，请重试');
      scenario.value.大纲 = result;
    }
    draft.value = openingRequest(choice.value);
    draftKey.value = fingerprint.value;
  } catch (error) {
    if (token === requestVersion) localError.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (token === requestVersion) generating.value = false;
  }
}
function cancel() {
  ++requestVersion;
  try {
    props.cancelGeneration?.();
    localError.value = '已取消本次生成，已有设定和草稿保留。';
  } catch {
    localError.value = '已停止接收本次结果，但未能中断远端请求。已有设定和草稿保留。';
  } finally {
    generating.value = false;
  }
}
function submit() {
  try {
    if (!draft.value || stale.value) throw Error('请先按当前设定预览开局要求');
    createOpening(choice.value, 'preview-check');
    emit('start', choice.value, validateOpeningRequest(draft.value));
  } catch (error) {
    localError.value = error instanceof Error ? error.message : String(error);
  }
}
function beginSelection() {
  defaultName.value = resolvedPersonaName();
  choosing.value = true;
}
</script>
<template>
  <section v-if="workshopOpen" class="opening"><button class="back" @click="workshopOpen=false">← 返回封面</button><Workshop :state="workshopState" :preview="preview" standalone /></section>
  <section v-else-if="completed" class="opening completion" role="status">
    <span>THE FIRST PAGE</span>
    <h2>开局要求已发送</h2>
    <p>AI 将根据下方的开局要求写出第一幕。读完回复后，在酒馆输入框继续行动或对白。</p>
    <p>生成中断时，可以重新请求开场。</p>
    <button type="button" :disabled="busy || (!preview && !ready)" @click="$emit('generate')">
      {{ busy ? '正在请求 AI…' : '请求 AI 开场' }}
    </button>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
  <Cover
    v-else-if="!choosing"
    :environment="environment"
    :preview="preview"
    @retry="$emit('retry')"
    @start="beginSelection"
    @workshop="workshopOpen=true"
  />
  <main v-else class="opening">
    <header>
      <button type="button" class="back" :disabled="busy || generating" @click="choosing = false">← 返回封面</button>
      <span>THE RETURNING</span>
      <h1>余烬之后</h1>
      <p>世界仍在前行，而你的故事尚未终结。</p>
    </header>
    <section class="intro">
      <h2>先写下故事的第一页</h2>
      <p>选择你是谁，再决定故事从何处开始。预览并编辑要发给 AI 的开局要求，确认后由 AI 正式写出第一幕。</p>
    </section>
    <form @submit.prevent="submit">
      <fieldset :disabled="busy || generating">
        <legend>选择旅人的身份</legend>
        <div class="choices">
          <label><input v-model="mode" type="radio" value="默认" /> 默认角色</label
          ><label><input v-model="mode" type="radio" value="自定义" /> 自定义角色</label>
        </div>
        <div v-if="mode === '默认'" class="profile">
          <h3>{{ defaultName }}</h3>
          <p>成年 · 人类 · 星见市普通居民</p>
          <p>性别未指定，穿着日常便装。性格、关系与接下来的决定留待旅途中展开。</p>
        </div>
        <CharacterEditor v-else v-model="profile" :read-persona-name="readPersonaName" />
        <OpeningScenarioEditor v-model="scenario" />
        <div class="draft-actions">
          <button type="button" @click="previewDefault">预览开局要求</button>
          <template v-if="scenario.模式 === '自定义'">
            <button type="button" :disabled="!preview && !ready" @click="generateDraft('大纲')">
              {{ preview ? '演示整理开局大纲' : 'AI 整理开局大纲' }}
            </button>
          </template>
        </div>
        <section v-if="draft" class="draft-review">
          <h2>发送给 AI 的开局要求</h2>
          <p>确认后发送这段开局要求，AI 将据此写出第一幕。</p>
          <label>开局要求<textarea v-model="draft" rows="15" maxlength="24000" /></label>
          <p v-if="stale" role="alert">角色或开局设定已变更，请重新预览开局要求。现有文字暂时保留。</p>
        </section>
        <details>
          <summary>初始状态与玩法</summary>
          <p>起源涅槃刚刚苏醒，旅途从首次获得传承开始。</p>
          <p>开发版基础数值：生命 100，能量 50，攻击 30，防御 20。自定义档案保留角色背景，战斗属性采用上述起始数值。</p>
        </details>
        <p v-if="preview" class="hint">本地演示使用示例文本，不调用 AI、不写入酒馆，刷新即可重新选择。</p>
        <p v-if="!preview && !ready" class="hint">启程组件仍在准备，可返回封面查看进度。</p>
        <button type="submit" :disabled="!draft || stale || (!preview && !ready)">
          {{ busy ? '正在发送…' : '发送开局并生成' }}
        </button>
      </fieldset>
      <p v-if="generating" role="status">正在准备草稿，现有内容会保留…</p>
      <button v-if="generating" type="button" @click="cancel">取消生成</button>
      <p v-if="error || localError" role="alert">{{ error || localError }}</p>
    </form>
  </main>
</template>
<style scoped>
.completion {
  padding: 28px;
  box-sizing: border-box;
}
.draft-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.draft-actions button {
  flex: 1 1 180px;
}
.draft-review {
  padding-top: 20px;
}
.draft-review label {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  font-size: 13px;
}
.draft-review textarea {
  line-height: 1.9;
}
.opening {
  max-width: 820px;
  margin: 22px auto;
  background: #fafcfb;
  color: #24322f;
  border: 1px solid #cbd5cf;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow-wrap: anywhere;
}
header {
  padding: 45px 36px;
  background: linear-gradient(125deg, #243534, #425652);
  color: #f5eee3;
}
header span {
  font-size: 11px;
  color: #cbb48f;
}
.back {
  display: block;
  width: auto;
  margin: 0 0 24px;
  padding: 0;
  border: 0;
  background: none;
  color: #e4d2b6;
  font-size: 12px;
}
h1 {
  font-family: 'SimSun', serif;
  font-size: 42px;
  font-weight: 500;
  margin: 18px 0;
}
h2 {
  font-size: 18px;
  font-weight: 500;
}
p {
  font-size: 13px;
  line-height: 1.9;
}
.intro,
form {
  padding: 24px 36px;
}
form {
  border-top: 1px solid #cbd5cf;
}
fieldset {
  padding: 0;
  border: 0;
  min-width: 0;
}
legend {
  font-size: 16px;
  margin-bottom: 18px;
}
.choices {
  display: flex;
  gap: 24px;
  font-size: 13px;
  flex-wrap: wrap;
}
.choices label {
  cursor: pointer;
}
.profile {
  padding: 18px;
  margin: 20px 0;
  background: #edf2ef;
}
.profile h3 {
  margin: 0;
  font-size: 20px;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  margin: 24px 0;
}
.fields label {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
.fields .wide {
  grid-column: span 2;
}
input:not([type='radio']),
textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5cf;
  background: white;
  color: #24322f;
  font: inherit;
  resize: vertical;
}
button {
  width: 100%;
  margin-top: 24px;
  background: #2e4547;
  border: 0;
  padding: 14px;
  color: white;
  font: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
}
summary {
  cursor: pointer;
  font-size: 12px;
}
details {
  margin-top: 20px;
}
.hint {
  color: #66786d;
  font-size: 11px;
}
[role='alert'] {
  color: #a43939;
}
input:focus-visible,
textarea:focus-visible,
button:focus-visible {
  outline: 2px solid #a67744;
  outline-offset: 3px;
}
@media (max-width: 480px) {
  header {
    padding: 30px 22px;
  }
  .intro,
  form {
    padding: 22px;
  }
  h1 {
    font-size: 36px;
  }
}
</style>
