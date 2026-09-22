<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Schema, LibraryEntry } from '../../src/schema';
import type { StateChange } from '../../src/state-changes';
import { formatGameTime, revivalRemaining } from '../../src/game-time';
import Characters from './Characters.vue';
import BattleCard from './BattleCard.vue';
import type { PublicBattleCard } from '../../src/output-cards';
import GradeBadge from './GradeBadge.vue';
import { proficiencyNeeded } from '../../src/progression';
import Evolution from './Evolution.vue';
import type { ArchiveEdit } from '../../src/settlement';
import { profileSummary } from '../../src/character-profile';

const props = defineProps<{
  state: Schema;
  latest?: boolean;
  preview?: boolean;
  notice?: string;
  battleCard?: PublicBattleCard | null;
  changes?: StateChange[];
  updateBlock?: boolean;
  updateStatus?: string;
  updateError?: string;
}>();
const emit = defineEmits<{ action: [name: string]; compose: [text: string]; edit: [edit: ArchiveEdit]; customize: [profile: Partial<Schema['_开局']['档案']>] }>();
const showArchive = ref(false);
const libraryDraft = ref<LibraryEntry>();
const search = ref('');
const destination = ref('');
const archivedKnowledge = computed(() => Object.entries(props.state._见闻档案) as [string, Schema['叙事']['见闻'][string]][]);
const tab = ref('概览');
const editing = ref(false);
const customName = ref('');
const customSpecies = ref('');
const player = computed(() => props.state._实体[props.state._开局.主角ID]);
const location = computed(() => props.state._时空.当前地点);
const clock = computed(() => {
  try {
    return formatGameTime(props.state, location.value.位面ID);
  } catch {
    return { date: '游戏历法未设置', time: '—', label: '游戏世界时间' };
  }
});
const life = computed(() => player.value?.生命);
const percent = computed(() =>
  life.value ? Math.max(0, Math.min(100, (life.value.当前 / life.value.上限) * 100)) : 0,
);
const abilities = computed(() => Object.entries(props.state._能力).filter(([id]) => player.value?.能力ID[id]));
const items = computed(() =>
  Object.entries(props.state._物品).filter(
    ([id, item]) =>
      (item.所在.类型 === '实体' && item.所在.ID === props.state._开局.主角ID) ||
      Object.values(props.state.叙事.见闻).some(
        info => info.类别 === '物品' && info.对象ID === id && info.知情者ID[props.state._开局.主角ID],
      ) ||
      (props.preview && item.所在.类型 === '地点'),
  ),
);
const knowledge = computed(() => Object.entries(props.state.叙事.见闻).filter(([, info]) => info.知情者ID[props.state._开局.主角ID]));
const visibleKnowledge = computed(() => (showArchive.value ? archivedKnowledge.value : knowledge.value).filter(([, info]) => info.知情者ID[props.state._开局.主角ID] && (!search.value || (info.标题 + info.内容).includes(search.value))).slice(-60));
const deaths = computed(() => Object.values(props.state._死亡记录).filter(d => d.实体ID === props.state._开局.主角ID));
const ready = computed(() => props.state._复苏?.阶段 === '可复苏');
const charge = computed(() => player.value?.资源['adapt-player-electric']?.当前 ?? 0);
const attributes = computed(() => {
  const stats = player.value?.战斗;
  if (!stats) return [];
  return [
    ['攻击', stats.攻击],
    ['防御', stats.防御],
    ['命中', `${stats.命中率 * 100}%`],
    ['闪避', `${stats.闪避率 * 100}%`],
    ['暴击', `${stats.暴击率 * 100}%`],
    ['暴伤', `${stats.暴击倍率}倍`],
  ];
});
function customize() {
  if (!customName.value.trim() || !customSpecies.value.trim()) return;
  emit('customize', { 姓名: customName.value.trim(), 种族: customSpecies.value.trim() });
  editing.value = false;
}
</script>

<template>
  <main class="return-panel">
    <section class="world-strip" aria-label="游戏世界时间">
      <div>
        <span class="label">{{ clock.label }}</span
        ><strong class="time">{{ clock.time }}</strong
        ><span>{{ clock.date }}</span>
      </div>
      <div class="place">
        <strong>{{ location.城市 || state._时空.位面目录[location.位面ID]?.名称 || '尚未启程' }}</strong
        ><span>{{ location.场景 || location.地点ID }}</span
        ><small>{{ state.叙事.天气 }}</small>
      </div>
    </section>
    <section class="identity">
      <div class="sigil" aria-hidden="true">✧</div>
      <div class="identity-text">
        <span class="label">旅人档案</span>
        <h2>{{ state._开局.档案.姓名 || '尚未选择角色' }}</h2>
        <p>
          {{ state._开局.档案.种族 }}<span v-if="state._开局.档案.身份"> · {{ state._开局.档案.身份 }}</span>
        </p>
      </div>
      <span class="state-tag" :class="{ rebuilding: !!state._复苏 }">{{ player?.生命阶段 || '待开局' }}</span>
    </section>
    <details class="profile-dossier">
      <summary>查看角色档案</summary>
      <p class="profile-text">{{ profileSummary(state._开局.档案) }}</p>
    </details>
    <section class="vitals">
      <div>
        <span>生命</span><strong>{{ life ? `${life.当前} / ${life.上限}` : '未定标' }}</strong>
      </div>
      <div class="track"><span :style="{ width: percent + '%' }"></span></div>
    </section>
    <section v-if="player" class="combat-stats" aria-label="战斗属性">
      <div v-for="[label, value] in attributes" :key="label">
        <span>{{ label }}</span
        ><strong>{{ value }}</strong>
      </div>
      <div v-for="[id, resource] in Object.entries(player.资源).filter(([id]) => id === 'energy' || state._查阅.能力.includes(id)).slice(0, 9)" :key="id" class="resource">
        <span>{{ resource.名称 }}</span
        ><strong>{{ resource.当前 }} / {{ resource.上限 ?? '不限' }}</strong>
      </div>
    </section>
    <aside v-if="state._复苏" class="revival">
      <span>◇ 起源重构</span
      ><strong>{{ ready ? '已可复苏' : `尚需 ${revivalRemaining(state)} · 当地游戏时间` }}</strong>
      <p>外界仍在前行。重构期间的经历与约定会被保留。</p>
    </aside>
    <aside v-if="updateError" class="revival" role="alert">本轮更新未保存：{{ updateError }} <button class="repair-link" @click="tab = '行动'">前往补记与校正</button></aside>
    <nav aria-label="档案分页">
      <button
        v-for="name in ['概览', '能力', '行囊', '人物', '见闻', '归来', '潮镜', '行动', '变化']"
        :key="name"
        :aria-pressed="tab === name"
        @click="tab = name"
      >
        {{ name }}
      </button>
    </nav>
    <section class="tab-content">
      <Characters v-if="tab === '人物'" :state="state" :latest="latest" @edit="emit('edit',$event)" @archive="libraryDraft=$event;tab='潮镜'" />
      <template v-if="tab === '潮镜'"><slot name="workshop" :seed="libraryDraft" /></template>
      <template v-if="tab === '概览'">
        <div class="section-heading">
          <h3>此刻所在</h3>
          <span>FIELD NOTES</span>
        </div>
        <div v-if="location.位面ID === 'harbor'" class="destination"><h4>潮镜 · 下一站</h4><p>选择已有世界，或写下想去的世界与落点。</p><div class="ability-actions"><button v-for="world in ['主世界','苍溟界','莽苍太古界','晏云界','曦光穹界','云渺万灵界']" :key="world" @click="emit('compose', '我选择前往' + world + '，在身体重构完成后启程。')">{{ world }}</button></div><form @submit.prevent="destination.trim() && emit('compose', '我希望在重构完成后前往：' + destination)"><input v-model="destination" placeholder="任意世界、作品或原创设定与落脚地点" /><button :disabled="!destination.trim()">填入目的地</button></form></div>
        <p class="scene">{{ state.叙事.场景描述 || '旅途尚未留下记录。' }}</p>
        <div class="stats">
          <div>
            <strong>{{ deaths.length.toString().padStart(2, '0') }}</strong
            ><span>死亡记录</span>
          </div>
          <div>
            <strong>{{ abilities.length.toString().padStart(2, '0') }}</strong
            ><span>已获能力</span>
          </div>
          <div>
            <strong>{{ Object.keys(state._任务).length.toString().padStart(2, '0') }}</strong
            ><span>旅途事项</span>
          </div>
        </div>
        <div class="section-heading">
          <h3>未竟之事</h3>
          <span>ONGOING</span>
        </div>
        <article v-for="(task, id) in state._任务" :key="id" class="task">
          <div>
            <strong>{{ task.名称 }}</strong
            ><span>{{ task.状态 }}</span>
          </div>
          <p>{{ task.描述 }}</p>
          <small>{{ task.后果说明 }}</small>
        </article>
        <p v-if="!Object.keys(state._任务).length" class="empty">没有等待处理的事项。</p>
      </template>
      <template v-if="tab === '能力'">
        <div class="section-heading">
          <h3>已掌握的能力</h3>
          <span>ABILITIES</span>
        </div>
        <p v-if="!abilities.length" class="empty">已掌握的技艺、天赋与超凡能力会记在这里。</p>

        <details v-for="([id, ability], i) in abilities" :key="id" class="folio" :data-grade="ability.品阶">
          <summary class="detail-card ability"><span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <div><span class="label"><GradeBadge :grade="ability.品阶" /> · {{ ability.用法 }} · Lv.{{ ability.等级 }}</span><h4>{{ ability.名称 }}</h4><small v-if="player?.资源[id]">储能 {{ player.资源[id].当前 }} / {{ player.资源[id].上限 }}</small></div><span class="chevron">⌄</span>
          </summary>
          <div class="inline-detail">
            <p>{{ ability.描述 }}</p><p>触发：{{ ability.触发条件 || '主动使用' }}</p><p>{{ ability.限制 }}</p>
            <div class="ability-numbers"><span>冷却 {{ ability.冷却本地秒 }}秒</span><span>熟练 {{ ability.熟练度 }} / {{ proficiencyNeeded(ability.等级) }}</span><span v-if="ability.效果.guard">单次转化 {{ ability.效果.guard.参数.capacity }}</span><span v-if="ability.效果.release">释放倍率 {{ ability.效果.release.参数.multiplier || 1 }}</span></div>
            <p v-if="Object.keys(ability.消耗).length">消耗：{{ Object.entries(ability.消耗).map(([key, n]) => (player?.资源[key]?.名称 || key) + ' ' + n).join('、') }}</p>
            <p v-if="ability.进化方向">进化：{{ ability.进化方向 }}</p>
            <small>来源：{{ ability.来源.类型 }} · {{ ability.来源.说明 }}</small>
            <div class="ability-actions">
              <button v-if="ability.用法 !== '被动'" @click="emit('compose', '我使用' + ability.名称 + '，')">使用 · 填入行动</button>
              <span v-else class="label">条件满足时自动生效</span>
              <button @click="emit('compose', '我想了解' + ability.名称 + '在当前环境中可以怎样运用。')">询问用法</button>
              <button :disabled="latest === false" @click="emit('edit', {kind:'focus',category:'能力',id,enabled:!state._查阅.能力.includes(id)})">{{ state._查阅.能力.includes(id) ? '取消本轮重点' : '供 AI 重点查阅' }}</button>
            </div>
            <Evolution v-if="ability.等级 >= (ability.进化次数 + 1) * 5 && ability.进化次数 < 3" :state="state" :ability-id="id" :latest="latest" :preview="preview" @edit="emit('edit',$event)" />
            <details v-if="Object.keys(ability.成长记录).length" class="growth"><summary>成长沿革</summary><p v-for="(record, eventId) in ability.成长记录" :key="eventId">{{ record }}</p></details>
          </div>
        </details>
      </template>
      <template v-if="tab === '行囊'">
        <div class="section-heading"><h3>随身与遗留</h3><span>BELONGINGS</span></div>
        <details v-for="[id, item] in items" :key="id" class="folio" :data-grade="item.品阶">
          <summary class="detail-card"><span class="item-icon">◇</span><div><span class="label"><GradeBadge :grade="item.品阶" /> · {{ item.所在.类型 === '实体' ? '随身' : '遗留在现场' }}{{ item.复苏绑定实体ID ? ' · 复苏绑定' : '' }}</span><h4>{{ item.名称 }}</h4></div><span>×{{ item.数量 }}</span></summary>
          <div class="inline-detail"><p>{{ item.描述 }}</p><p v-if="item.耐久">耐久 {{ item.耐久.当前 }} / {{ item.耐久.上限 }}</p><button @click="emit('compose', '我查看' + item.名称 + '，')">查看 · 填入行动</button></div>
        </details>
        <p v-if="!items.length" class="empty">尚未记录物品。</p>
      </template>
      <template v-if="tab === '见闻'">
        <div class="section-heading"><h3>所见与所闻</h3><span>OBSERVATIONS</span></div>
        <input v-model="search" class="archive-search" placeholder="搜索标题或内容" aria-label="搜索见闻" />
        <details v-for="[id, info] in visibleKnowledge" :key="id" class="folio">
          <summary class="detail-card"><span class="item-icon">⌁</span><div><span class="label">{{ info.类别 }} · {{ info.可信度 }}</span><h4>{{ info.标题 }}</h4></div><span class="chevron">⌄</span></summary>
          <div class="inline-detail"><p>{{ info.内容 }}</p><small>来源：{{ info.来源 }}</small><div class="ability-actions"><button :disabled="latest === false" @click="emit('edit', {kind:'focus',category:'见闻',id,enabled:!state._查阅.见闻.includes(id)})">{{ state._查阅.见闻.includes(id) ? '取消本轮查阅' : '供 AI 本轮查阅' }}</button><button @click="emit('compose', '关于' + info.标题 + '，')">就此继续</button></div></div>
        </details>
        <button v-if="archivedKnowledge.length" class="archive-toggle" @click="showArchive = !showArchive">{{ showArchive ? '返回常用见闻' : '翻阅旧页 · ' + archivedKnowledge.length + ' 项' }}</button>
        <p v-if="!visibleKnowledge.length" class="empty">没有匹配的见闻。</p><small>每页显示最近60项，可搜索旧页并选入下一轮提示词。</small>
      </template>
      <template v-if="tab === '归来'">
        <div class="section-heading">
          <h3>未曾终结的旅途</h3>
          <span>RETURNS</span>
        </div>
        <article v-for="(death, index) in deaths" :key="death.结算事件ID" class="death-entry">
          <span class="card-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h4>{{ death.复苏完成起源秒 === null ? '重构中的一页' : '已经归来' }}</h4>
            <p v-for="(cause, id) in death.因果链" :key="id">{{ cause.作用条件 }} · 实际损伤 {{ cause.实际伤害 }}</p>
            <small
              >所得：{{
                Object.keys(death.授予能力ID)
                  .map(id => state._能力[id]?.名称)
                  .join('、')
              }}</small
            >
          </div>
        </article>
        <p v-if="!deaths.length" class="empty">这份手记还没有记录过死亡。</p>
      </template>
      <template v-if="tab === '行动'">
        <slot name="correction" /><slot name="settlement"><p class="empty">在输入框表达行动，结果会随下一轮故事记入。</p></slot>
      </template>
      <template v-if="tab === '变化'">
        <div class="section-heading"><h3>本轮变化</h3><span>{{ changes?.length || 0 }} 项</span></div>
        <article v-for="row in changes" :key="row.label" class="change-row">
          <strong>{{ row.label }}</strong><small>{{ row.before }}</small><p>→ {{ row.after }}</p>
        </article>
        <p v-if="!changes?.length" class="empty">本轮没有新增状态变化。</p>
        <small>{{ updateStatus || (updateBlock ? '本楼含变量更新文本。' : '本楼未提供变量更新。') }}</small>
      </template>
    </section>
    <footer><span>每一次归来，世界都已有所不同。</span><span>✦</span></footer>
    <section v-if="preview" class="preview-controls">
      <div class="section-heading">
        <h3>交互试演</h3>
        <span>仅此页面 · 测试规则</span>
      </div>
      <div class="actions">
        <button :disabled="!!state._复苏" @click="emit('action', 'attack')">遭遇雷击</button
        ><button @click="emit('action', 'wait')">经过五分钟</button
        ><button :disabled="!ready" @click="emit('action', 'revive')">复苏</button
        ><button :disabled="!!state._复苏 || charge === 0" @click="emit('action', 'release')">释放储能</button>
        <button :disabled="!!state._复苏" @click="emit('action', 'strike')">凝力一击</button>
      </div>
      <p role="status" class="notice">{{ notice || '从一次危险开始，观察归来的变化。' }}</p>
      <BattleCard v-if="battleCard" :card="battleCard" />
      <div class="minor-actions">
        <button @click="emit('action', 'reset')">默认主角重新开始</button
        ><button @click="editing = !editing">自定义主角</button>
      </div>
      <form v-if="editing" @submit.prevent="customize">
        <label>姓名<input v-model="customName" required placeholder="角色姓名" /></label
        ><label>种族<input v-model="customSpecies" required placeholder="例如：人类、元素生命" /></label
        ><button type="submit">以此角色重新开始</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.folio{margin:10px 0;border:1px solid var(--line);border-left:3px solid #829686;border-radius:6px;overflow:hidden;background:#f4f7f2}
.repair-link{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;padding:8px;font:inherit}
.folio[data-grade="史诗"]{border-left-color:#9076a0}.folio[data-grade="稀有"]{border-left-color:#5d8c9e}.folio[data-grade="传说"],.folio[data-grade="本源"]{border-left-color:#b89556}
.folio .detail-card{margin:0;border:0;border-radius:0;background:transparent;list-style:none;cursor:pointer}.folio summary::-webkit-details-marker{display:none}.folio[open]>.detail-card{background:#e9efe7}.folio[open] .chevron{transform:rotate(180deg)}
.inline-detail{padding:14px 20px 18px;border-top:1px solid var(--line);font-size:12px;line-height:1.9}.inline-detail p{white-space:pre-wrap;margin:6px 0 12px}.inline-detail small{color:var(--muted)}
.inline-detail button,.destination button{border:1px solid #bbcbbf;padding:8px 12px;border-radius:4px;background:#eef3eb;color:#304841;cursor:pointer;font-size:12px}.inline-detail button:disabled{opacity:.5}
.ability-numbers{display:flex;flex-wrap:wrap;gap:8px 18px;color:#536c5c}.inline-detail .ability-actions{margin-top:14px}.evolution{border-top:1px solid var(--line);margin-top:12px;padding-top:8px}.evolution button{margin:4px}.growth{margin-top:14px}
.archive-search,.destination input{width:100%;padding:10px;border:1px solid var(--line);background:white;border-radius:4px;font:inherit;font-size:12px}.destination{padding:16px;background:#eef3eb;border:1px solid var(--line);border-radius:6px;margin-bottom:16px}.destination p{font-size:12px;line-height:1.8}.destination form{display:flex;gap:8px;margin-top:12px}.destination input{min-width:0}

.ability-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.expanded .use-ability { position: static; width: auto; padding: 9px 14px; background: #304841; color: #fff; border: 0; }
.expanded .secondary { background: #e3e8e0; color: #304841; }
.change-row { padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 12px; }
.change-row small { display: block; color: var(--muted); margin-top: 6px; }

.profile-dossier {
  padding: 14px 26px;
  border-top: 1px solid #d5dfd9;
  font-size: 12px;
}
.profile-dossier summary {
  cursor: pointer;
  color: #6e795e;
}
.profile-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.9;
}
.return-panel {
  --ink: #1c292c;
  --paper: #fafcfb;
  --line: #cbd5cf;
  --muted: #73786e;
  --ember: #a65736;
  max-width: 900px;
  margin: 0 auto;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line);
  font-family: 'Microsoft YaHei', sans-serif;
  box-shadow: 0 12px 40px #17242612;
  box-sizing: border-box;
}
.return-panel * {
  box-sizing: border-box;
  letter-spacing: 0 !important;
  overflow-wrap: anywhere;
}
.combat-stats {
  padding: 0 34px 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.combat-stats > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}
.combat-stats span {
  color: var(--muted);
  font-size: 10px;
}
.combat-stats .resource {
  grid-column: span 3;
  flex-direction: row;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}
button,
input {
  font: inherit;
}
button {
  cursor: pointer;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--ember);
  outline-offset: 3px;
}
button:disabled {
  opacity: 0.38;
  cursor: default;
}
.masthead {
  padding: 30px 34px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line);
}
.overline,
.label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}
h1 {
  font-family: Georgia, 'SimSun', serif;
  font-size: 32px;
  font-weight: 500;
  margin: 10px 0 0;
  letter-spacing: 4px;
}
h1 span {
  font-family: sans-serif;
  font-size: 10px;
  letter-spacing: 1px;
  display: block;
  margin-top: 9px;
  color: var(--muted);
}
.edition {
  text-align: right;
  line-height: 2;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}
.world-strip {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 34px;
  background: #e5efeb;
}
.world-strip > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
}
.time {
  font-family: Georgia, serif;
  font-size: 38px;
  font-weight: 400;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}
.place {
  text-align: right;
  justify-content: center;
}
.place strong {
  font-size: 16px;
  letter-spacing: 2px;
}
.place small {
  color: var(--muted);
}
.identity {
  padding: 28px 34px 18px;
  display: flex;
  gap: 18px;
  align-items: center;
}
.sigil {
  width: 55px;
  height: 55px;
  border: 1px solid #ac8d68;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 36px;
  color: #927343;
}
.identity-text {
  flex: 1;
  min-width: 0;
}
.identity h2 {
  margin: 6px 0;
  font-size: 22px;
  font-weight: 500;
}
.identity p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
}
.state-tag {
  font-size: 11px;
  padding: 6px 10px;
  border: 1px solid #9daba0;
  color: #52695e;
  white-space: nowrap;
}
.rebuilding {
  color: var(--ember);
  border-color: var(--ember);
}
.vitals {
  padding: 0 34px 24px;
}
.vitals > div:first-child {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 9px;
}
.track {
  height: 3px;
  background: #dad8ce;
}
.track span {
  height: 3px;
  background: #59736b;
  display: block;
  transition: width 0.25s;
}
.revival {
  margin: 0 34px 22px;
  border-left: 2px solid var(--ember);
  padding: 12px 16px;
  background: #a657360a;
  font-size: 12px;
  color: var(--ember);
}
.revival strong {
  display: block;
  margin: 8px 0;
}
.revival p {
  font-size: 11px;
  margin: 0;
  line-height: 1.8;
}
nav {
  display: flex;
  flex-wrap: wrap;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 0 22px;
}
nav button {
  flex: 1 0 40px;
  padding: 16px 4px;
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  font-size: 12px;
}
nav button[aria-pressed='true'] {
  border-color: var(--ember);
  color: var(--ink);
}
.tab-content {
  padding: 26px 34px 30px;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}
.section-heading h3 {
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  letter-spacing: 2px;
}
.section-heading > span {
  color: #929184;
  letter-spacing: 2px;
  font-size: 9px;
}
.scene {
  font-family: 'SimSun', serif;
  line-height: 2;
  font-size: 15px;
  margin: 0 0 20px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin: 22px 0 28px;
  padding: 18px 0;
}
.stats > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border-right: 1px solid var(--line);
}
.stats > div:last-child {
  border: 0;
}
.stats strong {
  font:
    28px Georgia,
    serif;
  color: #7d684b;
}
.stats span {
  font-size: 10px;
  color: var(--muted);
}
.task {
  border: 1px solid var(--line);
  padding: 16px;
}
.task > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
.task > div span {
  color: var(--ember);
  font-size: 10px;
}
.task p,
.task small {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.9;
}
.detail-card {
  width: 100%;
  display: flex;
  align-items: flex-start;
  text-align: left;
  gap: 18px;
  margin: 12px 0;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  padding: 20px;
}
.detail-card > div {
  flex: 1;
  min-width: 0;
}
.detail-card:hover {
  border-color: #a68a69;
  background: #fff5;
}
.card-index {
  font:
    27px Georgia,
    serif;
  color: #a58c66;
}
.detail-card h4,
.death-entry h4 {
  font-size: 16px;
  font-weight: 500;
  margin: 8px 0;
}
.detail-card p,
.death-entry p {
  font-size: 12px;
  line-height: 1.9;
  margin: 8px 0;
  color: var(--muted);
}
.detail-card small,
.death-entry small {
  font-size: 10px;
  color: var(--ember);
}
.item-icon {
  font-size: 29px;
  color: #8c9178;
}
.empty {
  padding: 30px 0;
  font-size: 13px;
  line-height: 2;
  color: var(--muted);
}
.death-entry {
  display: flex;
  gap: 20px;
  border-bottom: 1px solid var(--line);
  padding: 10px 0 20px;
}
.expanded {
  border-left: 2px solid #8e7d60;
  background: #edf1ef;
  padding: 18px;
  margin-top: 18px;
}
.expanded > button {
  float: right;
  border: 0;
  background: none;
  font-size: 22px;
}
.expanded h4 {
  margin: 0 0 12px;
  font-weight: 500;
}
.expanded p {
  white-space: pre-wrap;
  line-height: 1.9;
  font-size: 12px;
  overflow-wrap: anywhere;
}
footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  padding: 17px 34px;
  color: #8b897b;
  font-size: 10px;
  letter-spacing: 1px;
}
.preview-controls {
  border-top: 1px dashed #bdaf97;
  padding: 24px 34px;
  background: #edf2f4;
}
.preview-controls > p {
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.actions button,
form > button {
  background: #2e4547;
  border: 1px solid #2e4547;
  color: #f5f1e8;
  padding: 10px 14px;
  font-size: 11px;
}
.notice {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.minor-actions {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 18px;
}
.minor-actions button {
  border: 0;
  padding: 0;
  background: none;
  color: #76583a;
  font-size: 11px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
form {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}
form label {
  display: grid;
  gap: 7px;
  font-size: 11px;
}
input {
  border: 1px solid var(--line);
  background: #f5f1e8;
  padding: 10px;
  width: 100%;
  color: var(--ink);
}
@media (max-width: 480px) {
  .return-panel {
    margin: 0 auto;
  }
  .masthead,
  .world-strip {
    padding: 22px 18px;
  }
  h1 {
    font-size: 27px;
  }
  .identity {
    padding: 24px 18px 18px;
    gap: 12px;
  }
  .sigil {
    width: 42px;
    height: 42px;
    font-size: 28px;
    flex-shrink: 0;
  }
  .identity h2 {
    font-size: 19px;
  }
  .vitals {
    padding: 0 18px 22px;
  }
  .combat-stats {
    padding: 0 18px 22px;
  }
  .revival {
    margin: 0 18px 22px;
  }
  .tab-content,
  .preview-controls {
    padding: 22px 18px;
  }
  nav {
    padding: 0 10px;
  }
  .time {
    font-size: 30px;
  }
  .place strong {
    font-size: 14px;
  }
  .detail-card {
    gap: 12px;
    padding: 16px;
  }
  .section-heading > span {
    letter-spacing: 1px;
  }
  footer {
    padding: 16px 18px;
    font-size: 9px;
  }
  .edition {
    font-size: 9px;
  }
  .actions button {
    flex: 1 1 42%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .track span {
    transition: none;
  }
}
</style>
