<script setup lang="ts">
import { OpeningScenarioSchema } from '../../src/schema';
import type { OpeningScenario } from '../../src/schema';
import { presetPlanes } from '../../src/presets';
const scenario = defineModel<OpeningScenario>({ required: true });
function selectWorld(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  scenario.value = { ...scenario.value, 位面ID: id, 城市: id === 'main' ? '星见市' : '', 场景: '', 大纲: '', 构想: '', 出场人物: '伴生之灵艾斯特瑞亚', 机缘: '偶然接触漂来的起源种核，起源涅槃由此苏醒。' };
}
function selectMode(event: Event) {
  const mode = (event.target as HTMLInputElement).value as OpeningScenario['模式'];
  scenario.value = mode === '默认' ? OpeningScenarioSchema.parse({}) : { ...scenario.value, 模式: mode,
    场景: '', 机缘: '偶然接触漂来的起源种核，起源涅槃与终焉眷引由此苏醒。',
    出场人物: '伴生之灵艾斯特瑞亚', 构想: '', 大纲: '' };
}
</script>
<template>
  <section class="scenario-editor">
    <h2>故事从哪里开始</h2>
    <div class="mode-row">
      <label
        ><input
          type="radio"
          name="scenario-mode"
          value="默认"
          :checked="scenario.模式 === '默认'"
          @change="selectMode"
        />
        默认开局</label
      >
      <label
        ><input
          type="radio"
          name="scenario-mode"
          value="自定义"
          :checked="scenario.模式 === '自定义'"
          @change="selectMode"
        />
        自定义开局</label
      >
    </div>
    <p v-if="scenario.模式 === '默认'">
      主世界的卡车事故结束了第一段生命。归泊庭的潮声中，末墟与艾斯特瑞亚等着你；起源涅槃正在重构身体，新能力「越界」将带你前往自行选择的世界。
    </p>
    <div v-else class="scenario-fields">
      <p class="wide">写下一点构想就能开始。可直接填写自己的大纲，也可让 AI 整理，再预览要发送的开局要求。</p>
      <label
        >开局位面<select :value="scenario.位面ID" aria-label="开局位面" @change="selectWorld">
          <option v-for="(name, id) in presetPlanes" :key="id" :value="id">{{ name }}</option>
          <option value="opening-world">自定义世界 / 同人世界</option>
        </select></label
      >
      <label>起始时间<input v-model="scenario.起始时间" type="time" required /></label>
      <template v-if="scenario.位面ID === 'opening-world'">
        <label class="wide"
          >世界名称<input v-model="scenario.世界名称" maxlength="200" required placeholder="原创世界，或作品与世界名称"
        /></label>
        <label class="wide"
          >世界设定<textarea
            v-model="scenario.世界设定"
            rows="4"
            maxlength="12000"
            required
            placeholder="时代、社会、力量体系；同人可注明原作时间点、版本与改动。"
          />
        </label>
      </template>
      <label
        >城市或地区<input v-model="scenario.城市" maxlength="200" placeholder="可留白，例如北境、港城、山门外"
      /></label>
      <label
        >开局地点<input v-model="scenario.场景" maxlength="300" required placeholder="例如雨夜驿站、古代遗迹入口"
      /></label>
      <label class="wide"
        >获得能力的机缘<textarea
          v-model="scenario.机缘"
          rows="3"
          maxlength="4000"
          required
          placeholder="如何偶然接触起源种核。开场时刚获得起源涅槃，尚未死亡。"
        />
      </label>
      <label
        >故事基调<input
          v-model="scenario.基调"
          list="opening-tones"
          maxlength="300"
          placeholder="可以自由填写"
        /><datalist id="opening-tones">
          <option>探索与日常</option>
          <option>悬疑与调查</option>
          <option>漂泊与冒险</option>
          <option>轻松与奇遇</option>
          <option>危机前夕</option>
        </datalist></label
      >
      <label
        >出场人物<input
          v-model="scenario.出场人物"
          maxlength="4000"
          placeholder="身份、目的、已认识的人；留白交给 AI 构思"
      /></label>
      <label class="wide"
        >开局构想<textarea
          v-model="scenario.构想"
          rows="4"
          maxlength="12000"
          placeholder="一句灵感、完整想法，或粘贴已有设定。例如：一个陌生旅人把错寄的信交到面前。"
        />
      </label>
      <label class="wide"
        >开局大纲<textarea
          v-model="scenario.大纲"
          rows="5"
          maxlength="12000"
          placeholder="可手写，也可使用下方“AI 整理开局大纲”。填写故事起点、人物目的与可能遇到的线索。"
        />
      </label>
      <label class="wide"
        >希望保留或避开的内容<textarea
          v-model="scenario.边界"
          rows="2"
          maxlength="4000"
          placeholder="例如保留身世悬念、侧重日常探索、关系从初识发展"
        />
      </label>
    </div>
  </section>
</template>
<style scoped>
.scenario-editor {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #cbd5cf;
}
h2 {
  font:
    500 22px 'SimSun',
    serif;
}
p {
  font-size: 13px;
  line-height: 1.9;
  color: #60716a;
}
.mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
}
.scenario-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 16px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
.mode-row label {
  display: flex;
  align-items: center;
}
.wide {
  grid-column: 1 / -1;
}
input:not([type='radio']),
textarea,
select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 11px;
  border: 1px solid #cbd5cf;
  background: #fff;
  color: #24322f;
  font: inherit;
  resize: vertical;
  border-radius: 3px;
}
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid #a67744;
  outline-offset: 2px;
}
@media (max-width: 480px) {
  .scenario-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
