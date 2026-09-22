<script setup lang="ts">
import { computed } from 'vue';
import type { Session } from '../../src/engine';
import { applyCommand } from '../../src/engine';
import { storyRandom } from '../../src/progression';
import { proposalCommand } from '../../src/settlement';
import type { Proposal } from '../../src/settlement';
import { battleToken, resolveBattleCard } from '../../src/output-cards';
import BattleCard from './BattleCard.vue';
const props = defineProps<{ session: Session; messageId: number; latest: boolean; busy: boolean; error: string }>();
defineEmits<{ confirm: [id: string, proposal: Proposal]; compose: [text: string] }>();
const proposals = computed(() =>
  Object.entries(props.session.stat_data.待审提案).map(([id, proposal]) => {
    let problem = '';
    try {
      const cmd = proposalCommand(props.session, 'preview-' + id, proposal);
      applyCommand(props.session, cmd, storyRandom(props.session.stat_data._结算.状态版本, 0, props.session.stat_data._结算.分支ID));
    } catch (error) {
      problem = error instanceof Error ? error.message : String(error);
    }
    const detail = proposal.操作 ? JSON.stringify(proposal.操作) : '';
    return { id, proposal, problem, detail };
  }),
);
const records = computed(() =>
  Object.entries(props.session.death_adaptation_runtime.events)
    .filter(([id]) => id.startsWith(`m${props.messageId}-`) || id.startsWith("story-"))
    .slice(-6)
    .map(([id, event]) => ({
      id,
      event,
      card: event.battle ? resolveBattleCard(props.session, battleToken(props.session, id)) : null,
    })),
);
</script>
<template>
  <section class="settlement" aria-label="本轮结算">
    <h2>行动与结果</h2>
    <p v-if="!latest" class="hint">这是历史快照，当前楼层仅供查看。</p>
    <p v-if="!records.length && !proposals.length" class="hint">
      在酒馆输入框中继续行动或对白。需要判定时，本轮提案会出现在这里。
    </p>
    <article v-for="entry in proposals" :key="entry.id" class="proposal">
      <h3>待确认 · {{ entry.proposal.类型 }}</h3>
      <p>{{ entry.proposal.内容 }}</p>
      <blockquote v-if="entry.proposal.原文引用">{{ entry.proposal.原文引用 }}</blockquote>
      <details v-if="entry.detail"><summary>查看操作参数</summary><p>{{ entry.detail }}</p></details>
      <p v-if="entry.problem" class="hint">{{ entry.problem }}</p>
      <button v-if="entry.proposal.操作 && !entry.problem" :disabled="busy || !latest" @click="$emit('confirm', entry.id, entry.proposal)">
        {{ busy ? '正在记录…' : '按当前状态确认执行' }}
      </button>
      <button v-else :disabled="!latest || busy" @click="$emit('compose', entry.proposal.内容)">填入行动，继续商议</button>
    </article>
    <p v-if="error" role="alert">{{ error }}</p>
    <article v-for="record in records" :key="record.id" class="record">
      <BattleCard v-if="record.card" :card="record.card" />
      <p v-else>{{ record.event.result }}</p>
    </article>
  </section>
</template>
<style scoped>
.settlement {
  max-width: 880px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: #fafcfb;
  color: #24332f;
  border: 0;
  border-radius: 6px;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow-wrap: anywhere;
}
h2 {
  font-size: 18px;
}
h3 {
  font-size: 14px;
}
p,
blockquote {
  font-size: 13px;
  line-height: 1.8;
}
.hint {
  color: #63726a;
}
.proposal,
.record {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #d5ded8;
  border-radius: 4px;
}
blockquote {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 2px solid #a58a61;
}
button {
  padding: 10px 16px;
  border: 0;
  border-radius: 4px;
  background: #304841;
  color: white;
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
[role='alert'] {
  color: #9e3540;
}
</style>
