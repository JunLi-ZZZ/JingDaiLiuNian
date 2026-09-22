<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  profileSections,
  profileSeeds,
  seedEmptyProfile,
  profileSummary,
  narrativePronoun,
} from '../../src/character-profile';
import type { CharacterProfile, ProfileField } from '../../src/character-profile';
const profile = defineModel<CharacterProfile>({ required: true });
const props = defineProps<{ readPersonaName?: () => string }>();
const nameNotice = ref('');
function usePersonaName() {
  try {
    const name = props.readPersonaName?.().trim();
    if (!name || /\{\{|\}\}|<\/?user>/i.test(name)) throw Error('暂未读到酒馆名字，请直接填写。');
    update('姓名', name);
    nameNotice.value = '已填入当前酒馆名字，你仍可修改；启程后保存为本局名字。';
  } catch (error) {
    nameNotice.value = error instanceof Error ? error.message : '读取失败，请直接填写名字。';
  }
}
const seedNotice = ref('');
const summary = computed(() => profileSummary(profile.value));
function update(key: keyof CharacterProfile, value: string) {
  profile.value = { ...profile.value, [key]: value };
}
function selected(field: ProfileField, value: string) {
  return field.multiple ? profile.value[field.key].split('、').includes(value) : profile.value[field.key] === value;
}
function choose(field: ProfileField, value: string) {
  if (!field.multiple) {
    update(field.key, selected(field, value) ? '' : value);
    return;
  }
  const values = profile.value[field.key]
    .split('、')
    .map(x => x.trim())
    .filter(Boolean);
  update(
    field.key,
    values.includes(value) ? values.filter(x => x !== value).join('、') : [...values, value].join('、'),
  );
}
</script>
<template>
  <div class="character-editor">
    <section class="seeds">
      <span class="eyebrow">A STARTING POINT</span>
      <h3>从一个轮廓开始</h3>
      <p>可以先选一个灵感，也可以从空白写起。灵感只填入空白项，已有文字会保留。</p>
      <div class="chips">
        <button
          v-for="seed in profileSeeds"
          :key="seed.name"
          type="button"
          @click="
            profile = seedEmptyProfile(profile, seed.values);
            seedNotice = `已填入「${seed.name}」的空白项，可继续修改。`;
          "
        >
          {{ seed.name }}
        </button>
      </div>
      <p v-if="seedNotice" role="status">{{ seedNotice }}</p>
    </section>
    <details v-for="(section, index) in profileSections" :key="section.name" :open="index === 0" class="chapter">
      <summary>
        <span class="chapter-index">0{{ index + 1 }}</span
        ><span>{{ section.name }}</span
        ><small
          >{{ section.fields.filter(field => profile[field.key].trim()).length }} /
          {{ section.fields.length }} 项</small
        >
      </summary>
      <div class="chapter-body">
        <p class="note">{{ section.note }}</p>
        <div class="fields">
          <div
            v-for="field in section.fields"
            :key="field.key"
            class="field"
            :class="{ wide: field.multiline || !!field.choices }"
          >
            <label :for="`profile-${field.key}`"
              >{{ field.label }}<span v-if="['姓名', '种族'].includes(field.key)" aria-hidden="true"> *</span></label
            >
            <textarea
              v-if="field.multiline"
              :id="`profile-${field.key}`"
              :aria-label="field.label"
              :value="profile[field.key]"
              :placeholder="field.hint"
              rows="3"
              maxlength="4000"
              @input="update(field.key, ($event.target as HTMLTextAreaElement).value)"
            ></textarea>
            <input
              v-else
              :id="`profile-${field.key}`"
              :aria-label="field.label"
              :value="profile[field.key]"
              :placeholder="field.hint || '自由填写，或点击下方选项'"
              :required="['姓名', '种族'].includes(field.key)"
              maxlength="300"
              @input="update(field.key, ($event.target as HTMLInputElement).value)"
            />
            <template v-if="field.key === '姓名'">
              <div v-if="readPersonaName" class="chips">
                <button type="button" @click="usePersonaName">使用酒馆名字</button>
              </div>
              <small>这是本局角色名。保存后，不随酒馆用户名称变化。</small>
              <small v-if="nameNotice" role="status">{{ nameNotice }}</small>
            </template>
            <div v-if="field.choices" class="chips" :aria-label="`${field.label}建议`">
              <button
                v-for="option in field.choices"
                :key="option"
                type="button"
                :aria-pressed="selected(field, option)"
                @click="choose(field, option)"
              >
                {{ option }}
              </button>
            </div>
            <small v-if="field.multiple">可多选；在输入框中也能添加自己的描述。</small>
          </div>
        </div>
      </div>
    </details>
    <details class="review" open>
      <summary>启程前 · 档案预览</summary>
      <p>以下内容随开局保存；未填写的部分保持未指定。</p>
      <pre>{{ summary || '你的档案将显示在这里。' }}</pre>
      <p class="identity-preview">
        正文姓名：{{ profile.姓名.trim() || '尚未填写' }} · 性别：{{ profile.性别.trim() || '未指定' }}<br />
        第三人称：{{ narrativePronoun(profile) }} · 偏好称呼：{{ profile.称呼.trim() || '随场景使用姓名或中性称呼' }}
      </p>
      <p>代词只决定叙事称谓。外貌、身体特征与关系以你填写的资料和实际经历为准。</p>
    </details>
  </div>
</template>
<style scoped>
.character-editor {
  margin: 24px 0;
}
.seeds {
  background: #edf2ef;
  padding: 20px;
  border-left: 2px solid #ac8960;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #89714f;
}
h3 {
  font-family: 'SimSun', serif;
  font-size: 21px;
  font-weight: 500;
  margin: 10px 0;
}
p {
  font-size: 12px;
  line-height: 1.9;
  color: #60716a;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}
.chips button {
  background: transparent;
  color: #435b52;
  border: 1px solid #c3cfc8;
  border-radius: 20px;
  padding: 7px 12px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.chips button[aria-pressed='true'] {
  background: #334f46;
  border-color: #334f46;
  color: #fff;
}
.chapter {
  border-bottom: 1px solid #cbd5cf;
}
summary {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 20px 0;
  cursor: pointer;
  font-size: 15px;
  list-style: none;
}
summary:after {
  content: '＋';
  margin-left: auto;
  color: #8f7555;
}
details[open] > summary:after {
  content: '−';
}
.chapter-index {
  font-family: Georgia, serif;
  color: #aa8052;
  font-size: 22px;
}
summary small {
  font-size: 10px;
  color: #75867c;
  margin-left: auto;
}
.chapter-body {
  padding-bottom: 24px;
}
.note {
  margin-top: 0;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.field {
  min-width: 0;
}
.wide {
  grid-column: 1/-1;
}
label {
  display: block;
  font-size: 12px;
  margin-bottom: 8px;
}
label span {
  color: #9b754c;
}
input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #c5d0c9;
  padding: 11px;
  background: #fff;
  color: #26372e;
  font: inherit;
  font-size: 13px;
  resize: vertical;
  border-radius: 3px;
}
.field > small {
  display: block;
  color: #77877d;
  font-size: 10px;
  margin-top: 8px;
}
.review {
  margin-top: 24px;
  border: 1px solid #cbd5cf;
  padding: 0 18px;
  background: #f3f5f1;
}
.review pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
  font-size: 12px;
  line-height: 2;
  padding-bottom: 12px;
}
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 2px solid #a67744;
  outline-offset: 3px;
}
@media (max-width: 480px) {
  .fields {
    grid-template-columns: 1fr;
  }
  .chips button {
    padding: 8px 10px;
  }
  .seeds {
    padding: 15px;
  }
  summary {
    gap: 8px;
    font-size: 14px;
  }
}
</style>
