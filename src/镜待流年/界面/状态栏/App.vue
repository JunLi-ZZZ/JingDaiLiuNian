<template>
  <div class="status-bar" :class="`theme-${theme}`">
    <div class="master-bar" @click="showAll = !showAll">
      <span class="brand">◈ 镜待流年</span>
      <span class="master-info">{{ timeText }}</span>
      <span class="master-arrow">{{ showAll ? '▾' : '▸' }}</span>
    </div>

    <div v-if="showAll" class="main-body">
      <div class="settings-bar">
        <button class="gear-btn" @click="showThemes = !showThemes">⚙ 主题</button
        ><button class="gear-btn r18-btn" :class="{ active: r18Mode }" @click="toggleR18()">
          {{ r18Mode ? '🔞' : '🔒' }} R18
        </button>
      </div>
      <div v-if="showThemes" class="theme-picker">
        <button
          v-for="t in themes"
          :key="t.id"
          class="theme-dot"
          :class="{ active: theme === t.id }"
          :style="{ background: t.color }"
          :title="t.name"
          @click="theme = t.id"
        ></button>
      </div>
      <div class="time-bar">
        <i class="fa-solid fa-clock"></i> {{ timeText }}<span v-if="weekText"> · {{ weekText }}</span>
      </div>
      <div class="weather-bar">
        <span v-if="weatherText">{{ weatherEmoji }} {{ weatherText }}</span>
      </div>
      <div class="world-loc">🌍 {{ locationFull }}</div>

      <!-- 主角 -->
      <div class="block" :class="{ open: showProtagonist }">
        <div class="block-head" @click="showProtagonist = !showProtagonist">
          <span class="block-title">{{ userName }}</span>
          <span class="block-arrow">{{ showProtagonist ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showProtagonist" class="block-body">
          <div class="stat-row-inline">
            <span class="stat-item"
              >💰 财富 <b>{{ data.主角.财富 }}</b></span
            >
            <span class="stat-item"
              >⭐ 境界 <b>{{ data.主角.境界 || '凡人' }}</b></span
            >
            <span class="stat-item"
              >⚔️ 战力 <b>{{ data.主角.战力 || 0 }}</b></span
            >
          </div>

          <div class="sub-block" :class="{ open: showProtagBasic }">
            <div class="sub-head" @click="showProtagBasic = !showProtagBasic">
              <span>📋 基本信息</span><span class="block-arrow small">{{ showProtagBasic ? '▾' : '▸' }}</span>
            </div>
            <div v-if="showProtagBasic" class="sub-body">
              <div class="info-card">
                <div class="info-grid">
                  <span class="info-cell"
                    >性别 <b>{{ data.主角.性别 || '待设定' }}</b></span
                  >
                  <span class="info-cell"
                    >年龄 <b>{{ data.主角.年龄 || '待设定' }}</b></span
                  >
                  <span class="info-cell"
                    >种族 <b>{{ data.主角.种族 || '待设定' }}</b></span
                  >
                </div>
                <div class="info-line">
                  <span class="info-label">喜好</span>：<span class="info-value">{{ data.主角.喜好 || '待设定' }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">厌恶</span>：<span class="info-value">{{ data.主角.厌恶 || '待设定' }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">外貌</span>：<span class="info-value">{{
                    data.主角.外貌特征 || '待设定'
                  }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">体型</span>：<span class="info-value">{{
                    data.主角.基础体型 || '待设定'
                  }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">神态</span>：<span class="info-value">{{ data.主角.神态 || '待设定' }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">特征</span>：<span class="info-value">{{ data.主角.特征 || '无' }}</span>
                </div>
                <div class="info-line">
                  <span class="info-label">天赋</span>：<span class="info-value">{{
                    data.主角.天赋能力 || '待设定'
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sub-block" :class="{ open: showClothing }">
            <div class="sub-head" @click="showClothing = !showClothing">
              <span>👕 服装</span><span class="block-arrow small">{{ showClothing ? '▾' : '▸' }}</span>
            </div>
            <div v-if="showClothing" class="sub-body">
              <div class="cloth-list">
                <div v-for="item in protagClothing" :key="item.key">
                  <div class="cloth-row" @click="toggleClothDetail(item.key)">
                    <span class="cloth-key">{{ item.key }}</span>
                    <span class="cloth-val" :class="{ dim: !isSet(item.名称) }">{{
                      isSet(item.名称) ? item.名称 : '—'
                    }}</span>
                    <span v-if="isSet(item.状态)" class="cloth-status">{{ item.状态 }}</span>
                  </div>
                  <div v-if="clothDetail.has(item.key) && isSet(item.描述)" class="cloth-detail">{{ item.描述 }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="sub-block" :class="{ open: showItems }">
            <div class="sub-head" @click="showItems = !showItems">
              <span>📦 随身物品</span><span class="block-arrow small">{{ showItems ? '▾' : '▸' }}</span>
            </div>
            <div v-if="showItems" class="sub-body">
              <div v-if="itemEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, item] in itemEntries" :key="name">
                <div
                  class="item-card"
                  :class="{ 'mirror-item': name.includes('母镜'), 'mirror-open': name.includes('母镜') && mirrorOpen }"
                  @click="name.includes('母镜') ? (mirrorOpen = !mirrorOpen) : null"
                >
                  <span class="item-name">{{ name }}</span>
                  <span class="item-desc">{{ item.描述 }}</span>
                  <span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                  <span v-if="name.includes('母镜')" class="mirror-toggle">{{ mirrorOpen ? '▾' : '▸' }}</span>
                </div>
              </div>
              <MirrorPanel v-if="mirrorOpen" @close="mirrorOpen = false" />
                </div>
              </div>
          <div class="sub-block" :class="{ open: showRelations }">
            <div class="sub-head" @click="showRelations = !showRelations">
              <span>👥 人际关系</span><span class="block-arrow small">{{ showRelations ? '▾' : '▸' }}</span>
            </div>
            <div v-if="showRelations" class="sub-body">
              <div v-if="relationEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, desc] in relationEntries" :key="name" class="item-card">
                <span class="item-name">{{ name }}</span
                ><span class="item-desc">{{ desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色名录 -->
      <div class="block" :class="{ open: showChars }">
        <div class="block-head" @click="showChars = !showChars">
          <span class="block-title">角色名录</span>
          <span class="block-sub">{{ allChars.length }}人</span>
          <button
            v-if="showChars && allChars.length > 0"
            class="del-btn"
            :class="{ active: deleteMode }"
            title="删除角色"
            @click.stop="
              deleteMode = !deleteMode;
              deleteSelection.clear();
            "
          >
            🗑
          </button>
          <span class="block-arrow">{{ showChars ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showChars" class="block-body">
          <div v-if="allChars.length === 0" class="empty-hint">暂无角色</div>
          <div v-for="char in allChars" :key="char._key" class="char-entry">
            <div
              class="char-row"
              :class="{ 'del-selected': deleteMode && deleteSelection.has(char._key) }"
              @click="deleteMode ? toggleCharDelete(char._key) : toggleChar(char._key)"
            >
              <span v-if="deleteMode" class="del-check">{{ deleteSelection.has(char._key) ? '☑' : '☐' }}</span>
              <span class="char-name">{{ char.name }}</span>
              <span v-if="char.身份" class="char-identity">{{ char.身份 }}</span>
              <span class="char-hearts">{{ loveIcon(char.好感度) }}</span>
              <span class="char-presence" :class="presence(char)">{{ presenceText(char) }}</span>
              <span class="block-arrow small">{{ expandedChars.has(char._key) ? '▾' : '▸' }}</span>
            </div>
            <div v-if="expandedChars.has(char._key)" class="char-detail">
              <div class="stat-row-inline">
                <span class="stat-item"
                  >❤️ 好感 <b>{{ char.好感度 }}</b></span
                >
                <span class="stat-item"
                  >💰 财富 <b>{{ char.财富 }}</b></span
                >
                <span class="stat-item"
                  >⭐ 境界 <b>{{ char.境界 || '凡人' }}</b></span
                >
                <span class="stat-item"
                  >⚔️ 战力 <b>{{ char.战力 || 0 }}</b></span
                >
              </div>

              <div class="sub-block" :class="{ open: sub(char._key + '-basic') }">
                <div class="sub-head" @click="toggleSub(char._key + '-basic')">
                  <span>📋 基本信息</span
                  ><span class="block-arrow small">{{ sub(char._key + '-basic') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-basic')" class="sub-body">
                  <div class="info-card">
                    <div class="info-grid">
                      <span class="info-cell"
                        >性别 <b>{{ char.性别 || '待设定' }}</b></span
                      >
                      <span class="info-cell"
                        >年龄 <b>{{ char.年龄 || '待设定' }}</b></span
                      >
                      <span class="info-cell"
                        >种族 <b>{{ char.种族 || '待设定' }}</b></span
                      >
                      <span class="info-cell"
                        >来源 <b>{{ char.来源世界 || '待设定' }}</b></span
                      >
                    </div>
                    <div class="info-line">
                      <span class="info-label">喜好</span>：<span class="info-value">{{ char.喜好 || '待设定' }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">厌恶</span>：<span class="info-value">{{ char.厌恶 || '待设定' }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">外貌</span>：<span class="info-value">{{
                        char.外貌特征 || '待设定'
                      }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">体型</span>：<span class="info-value">{{
                        char.基础体型 || '待设定'
                      }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">神态</span>：<span class="info-value">{{ char.神态 || '待设定' }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">特征</span>：<span class="info-value">{{ char.特征 || '无' }}</span>
                    </div>
                    <div class="info-line">
                      <span class="info-label">天赋</span>：<span class="info-value">{{
                        char.天赋能力 || '待设定'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sub-block" :class="{ open: sub(char._key + '-cloth') }">
                <div class="sub-head" @click="toggleSub(char._key + '-cloth')">
                  <span>👕 服装</span><span class="block-arrow small">{{ sub(char._key + '-cloth') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-cloth')" class="sub-body">
                  <div class="cloth-list">
                    <div v-for="ci in getCharClothing(char)" :key="ci.key">
                      <div class="cloth-row" @click="toggleClothDetail(char._key + '-' + ci.key)">
                        <span class="cloth-key">{{ ci.key }}</span>
                        <span class="cloth-val" :class="{ dim: !isSet(ci.名称) }">{{
                          isSet(ci.名称) ? ci.名称 : '—'
                        }}</span>
                        <span v-if="isSet(ci.状态)" class="cloth-status">{{ ci.状态 }}</span>
                      </div>
                      <div v-if="clothDetail.has(char._key + '-' + ci.key) && isSet(ci.描述)" class="cloth-detail">
                        {{ ci.描述 }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key + '-items') }">
                <div class="sub-head" @click="toggleSub(char._key + '-items')">
                  <span>📦 随身物品</span
                  ><span class="block-arrow small">{{ sub(char._key + '-items') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-items')" class="sub-body">
                  <div v-if="getCharItems(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, item] in getCharItems(char)" :key="name" class="item-card">
                    <span class="item-name">{{ name }}</span
                    ><span class="item-desc">{{ item.描述 }}</span
                    ><span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                  </div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key + '-rel') }">
                <div class="sub-head" @click="toggleSub(char._key + '-rel')">
                  <span>👥 人际关系</span
                  ><span class="block-arrow small">{{ sub(char._key + '-rel') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-rel')" class="sub-body">
                  <div v-if="getCharRelations(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, desc] in getCharRelations(char)" :key="name" class="item-card">
                    <span class="item-name">{{ name }}</span
                    ><span class="item-desc">{{ desc }}</span>
                  </div>
                </div>
              </div>
              <div v-if="char.nsfw档案" class="sub-block" :class="{ open: sub(char._key + '-nsfw') }">
                <div class="sub-head" @click="toggleSub(char._key + '-nsfw')">
                  <span>🔞 NSFW 档案</span
                  ><span class="block-arrow small">{{ sub(char._key + '-nsfw') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-nsfw')" class="sub-body">
                  <div class="nsfw-grid">
                    <span class="nsfw-cell"
                      >初次 <b>{{ char.nsfw档案.初次存在与否 ? '存在' : '不存在' }}</b></span
                    >
                    <span class="nsfw-cell"
                      >性对象 <b>{{ char.nsfw档案.性对象 || '无' }}</b></span
                    >
                    <span class="nsfw-cell"
                      >怀孕 <b>{{ char.nsfw档案.是否怀孕 ? '是' : '否' }}</b></span
                    >
                    <span class="nsfw-cell"
                      >子嗣 <b>{{ char.nsfw档案.子嗣列表 || '无' }}</b></span
                    >
                    <span class="nsfw-cell"
                      >三围
                      <b
                        >{{ char.nsfw档案.三围?.胸围 || 0 }}/{{ char.nsfw档案.三围?.腰围 || 0 }}/{{
                          char.nsfw档案.三围?.臀围 || 0
                        }}</b
                      ></span
                    >
                    <span class="nsfw-cell"
                      >罩杯 <b>{{ char.nsfw档案.罩杯 || '—' }}</b></span
                    >
                  </div>
                </div>
              </div>
              <div v-if="char.nsfw档案" class="sub-block" :class="{ open: sub(char._key + '-body') }">
                <div class="sub-head" @click="toggleSub(char._key + '-body')">
                  <span>📐 私密身体档案</span
                  ><span class="block-arrow small">{{ sub(char._key + '-body') ? '▾' : '▸' }}</span>
                </div>
                <div v-if="sub(char._key + '-body')" class="sub-body">
                  <div class="cloth-list">
                    <div class="cloth-row" @click="toggleClothDetail(char._key + '-bx')">
                      <span class="cloth-key">胸型</span>
                      <span class="cloth-val" :class="{ dim: !isSet(char.nsfw档案.胸型?.名称) }">{{
                        isSet(char.nsfw档案.胸型?.名称) ? char.nsfw档案.胸型.名称 : '—'
                      }}</span>
                      <span v-if="isSet(char.nsfw档案.胸型?.状态)" class="cloth-status">{{
                        char.nsfw档案.胸型.状态
                      }}</span>
                    </div>
                    <div
                      v-if="clothDetail.has(char._key + '-bx') && isSet(char.nsfw档案.胸型?.描述)"
                      class="cloth-detail"
                    >
                      {{ char.nsfw档案.胸型.描述 }}
                    </div>
                    <div class="cloth-row" @click="toggleClothDetail(char._key + '-hx')">
                      <span class="cloth-key">户型</span>
                      <span class="cloth-val" :class="{ dim: !isSet(char.nsfw档案.户型?.名称) }">{{
                        isSet(char.nsfw档案.户型?.名称) ? char.nsfw档案.户型.名称 : '—'
                      }}</span>
                      <span v-if="isSet(char.nsfw档案.户型?.状态)" class="cloth-status">{{
                        char.nsfw档案.户型.状态
                      }}</span>
                    </div>
                    <div
                      v-if="clothDetail.has(char._key + '-hx') && isSet(char.nsfw档案.户型?.描述)"
                      class="cloth-detail"
                    >
                      {{ char.nsfw档案.户型.描述 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="deleteMode && deleteSelection.size > 0" class="del-actions">
            <span class="del-count">已选 {{ deleteSelection.size }} 人</span>
            <button class="del-confirm" @click="confirmDelete">确认删除</button>
            <button
              class="del-cancel"
              @click="
                deleteMode = false;
                deleteSelection.clear();
              "
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDataStore } from './store';
import MirrorPanel from '../shared/MirrorPanel.vue';

const store = useDataStore();
const data = computed(() => store.data);

const showAll = ref(false);
const showProtagonist = ref(false);
const showProtagBasic = ref(false);
const showClothing = ref(false);
const showItems = ref(false);
const showRelations = ref(false);
const showChars = ref(false);
const showThemes = ref(false);
const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
watch(
  theme,
  v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('jdnl_theme', v);
    syncVarTheme();
  },
  { immediate: true },
);
function syncVarTheme() {
  const doc = (window as any).parent?.document?.body;
  if (!doc) return;
  const t = theme.value;
  const colors: Record<string, { bg: string; border: string; text: string; muted: string; accent: string }> = {
    cream: {
      bg: 'rgba(139,115,85,0.02)',
      border: 'rgba(139,115,85,0.08)',
      text: '#4a4035',
      muted: '#8a7e6e',
      accent: '#8b7355',
    },
    purple: {
      bg: 'rgba(155,126,196,0.02)',
      border: 'rgba(155,126,196,0.08)',
      text: '#d4cee0',
      muted: '#867e95',
      accent: '#9b7ec4',
    },
    gold: {
      bg: 'rgba(201,169,110,0.02)',
      border: 'rgba(201,169,110,0.08)',
      text: '#d4cee0',
      muted: '#867e95',
      accent: '#c9a96e',
    },
    teal: {
      bg: 'rgba(94,160,167,0.02)',
      border: 'rgba(94,160,167,0.08)',
      text: '#d4cee0',
      muted: '#867e95',
      accent: '#5ea0a7',
    },
    rose: {
      bg: 'rgba(196,123,139,0.02)',
      border: 'rgba(196,123,139,0.08)',
      text: '#d4cee0',
      muted: '#867e95',
      accent: '#c47b8b',
    },
  };
  const c = colors[t] || colors.cream;
  doc.style.setProperty('--jdnl-var-bg', c.bg);
  doc.style.setProperty('--jdnl-var-border', c.border);
  doc.style.setProperty('--jdnl-var-text', c.text);
  doc.style.setProperty('--jdnl-var-muted', c.muted);
  doc.style.setProperty('--jdnl-var-accent', c.accent);
}
const r18Mode = ref(false);
watch(
  () => data.value.R18模式,
  v => {
    if (typeof v === 'boolean') r18Mode.value = v;
  },
  { immediate: true },
);
function toggleR18() {
  r18Mode.value = !r18Mode.value;
  try {
    const Mvu = (window as any).Mvu;
    if (Mvu) {
      const _ = (window as any)._ || (window as any).parent?._;
      const mid = (window as any).getCurrentMessageId?.() ?? -1;
      const variables = Mvu.getMvuData({ type: 'message', message_id: mid });
      _?.set(variables, 'stat_data.R18模式', r18Mode.value);
      Mvu.replaceMvuData(variables, { type: 'message', message_id: mid });
    }
  } catch (e) {
    /* ignore */
  }
}
const mirrorOpen = ref(false);
const mirrorDir = ref<'toMe' | 'toWorld'>('toMe');
const mxCustom = ref(false);
const activeTab = ref<'lady' | 'plane' | 'npc'>('lady');
const tabLabel = computed(() => {
  if (activeTab.value === 'plane') return '构筑一方世界';
  if (activeTab.value === 'npc') return '众生皆在镜中';
  return mirrorDir.value === 'toMe' ? '唤至此岸' : '渡往彼岸';
});
function switchTab(tab: 'lady' | 'plane' | 'npc') { activeTab.value = tab; mxGenError.value = ''; plGenError.value = ''; }
const mxTraits = [
  '傲娇',
  '温柔',
  '冷淡',
  '活泼',
  '腹黑',
  '天然',
  '病娇',
  '慵懒',
  '忠犬',
  '高冷',
  '毒舌',
  '元气',
  '邪魅',
  '偏执',
  '纯真',
  '三无',
  '冒失',
  '小恶魔',
  '无口',
  '大和抚子',
  '女王',
  '电波',
  '残念',
  '痴女',
];
const mxAbilities = [
  '剑术',
  '魔法',
  '神术',
  '体术',
  '幻术',
  '锻造',
  '医术',
  '毒术',
  '暗杀',
  '读心',
  '预知',
  '不死',
  '火焰',
  '水流',
  '时空',
  '魅惑',
  '兽化',
  '机关术',
  '言灵',
  '死灵术',
  '炼金术',
  '结界术',
  '召唤术',
  '傀儡术',
  '狂化',
  '引力',
  '冰雪',
  '雷电',
  '植物操控',
];
const mxRoles = [
  '剑圣',
  '魔女',
  '公主',
  '圣女',
  '骑士',
  '精灵王',
  '龙神',
  '堕天使',
  '死神',
  '妖王',
  '贤者',
  '佣兵王',
  '刺客',
  '流浪武士',
  '星界旅者',
  '女王',
  '修女',
  '舞姬',
  '女仆',
  '猎魔人',
  '吸血鬼领主',
  '占星师',
  '退魔师',
  '巫女',
  '机关师',
  '武神',
  '酒馆老板',
];
const mxCoreTraits = [
  '嗜睡体质',
  '凤凰血脉',
  '禁欲',
  '病弱',
  '天生剑骨',
  '龙族血统',
  '月圆变身',
  '灵力暴走',
  '预知梦',
  '不老体质',
  '通灵体质',
  '魅魔血脉',
  '天使血脉',
  '元素亲和',
  '泌乳体质',
  '易感体质',
];
const mxAttitudes = [
  '冷漠',
  '好奇',
  '敌意',
  '友善',
  '崇拜',
  '试探',
  '困惑',
  '漠然',
  '警惕',
  '亲近',
  '敬畏',
  '怜悯',
  '戏谑',
  '羞怯',
];
const mxFandoms = [
  '哥布林杀手',
  '原神',
  'Fate',
  '东方Project',
  '明日方舟',
  '崩坏星穹铁道',
  '蔚蓝档案',
  '葬送的芙莉莲',
  '鬼灭之刃',
  '咒术回战',
  '艾尔登法环',
  '赛马娘',
  '碧蓝航线',
  '崩坏3',
  '少女前线',
  '公主连结',
  '无职转生',
  'Re:从零开始的异世界生活',
];
const mxMarks = [
  '左眼封印',
  '说话带古语腔',
  '异色瞳',
  '身上有纹身',
  '戴着面纱',
  '半透明身体',
  '嘴角泪痣',
  '唇边美人痣',
  '虎牙',
  '腰窝',
  '蝴蝶骨',
  '背部天生羽翼',
  '发尾异色',
  '掌心旧疤',
  '脐钉',
  '舌钉',
];
const mxAcquaintances = [
  '未相识',
  '已相识（主世界）',
  '已相识（其他位面）',
  '前世相识',
  '梦中相识',
  '宿命相连',
  '笔友/网友',
  '旧日同窗',
  '救命恩人',
  '宿敌',
];
const mxFandomMode = ref(false);
const mxIncludeChat = ref(false);
const mxGenerating = ref(false);
const mxGenResult = ref('');
const mxGenArchive = ref('');
const mxGenError = ref('');
const mxSaved = ref(false);
const mxOpen = reactive({ basic: false, world: false, deep: false });
const mxForm = reactive({
  style: '',
  styleCustom: '',
  traits: [] as string[],
  traitInput: '',
  bodyType: '',
  bodyTypeCustom: '',
  race: '',
  raceCustom: '',
  age: '',
  ageCustom: '',
  gender: '',
  origin: '',
  originCustom: '',
  role: '',
  roleCustom: '',
  fandom: '',
  abilities: [] as string[],
  abilityInput: '',
  coreTrait: '',
  coreTraitCustom: '',
  attitude: '',
  attitudeCustom: '',
  specialMark: '',
  specialMarkCustom: '',
  fandomCustom: '',
  fandomType: '',
  fandomTypeCustom: '',
  fandomDesc: '',
  acquaintance: '',
  acquaintanceCustom: '',
  other: '',
});
const pickedTraits = computed(() => mxForm.traits);
const pickedAbilities = computed(() => mxForm.abilities);
function mxToggleTag(arr: string[], t: string) {
  const i = arr.indexOf(t);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(t);
}
function mxAddCustom(arr: string[], v: string): string {
  const s = v.trim();
  if (s && !arr.includes(s)) arr.push(s);
  return '';
}
function mxSend(msg: string) {
  const $p = (window as any).parent?.$;
  if (!$p) return;
  const current = String($p('#send_textarea').val() || '');
  $p('#send_textarea').val(current ? current + '\n\n' + msg : msg).trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
  mirrorOpen.value = false;
  mxCustom.value = false;
}
function mxRandom() {
  if (activeTab.value === 'npc') {
    mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一人来到身边' : '使用母镜前往一位随机人物所在的世界');
  } else {
    mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一位红颜来到身边' : '使用母镜前往一位随机红颜所在的世界');
  }
}
function mxCustomSummon() {
  const d = mxForm;
  const isNPC = activeTab.value === 'npc';
  const summon = mirrorDir.value === 'toMe'
    ? (isNPC ? '使用母镜召唤一人来到身边' : '使用母镜召唤一位红颜来到身边')
    : (isNPC ? '使用母镜前往一人所在的世界' : '使用母镜前往一位红颜所在的世界');
  const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
  const obj: Record<string, any> = {
    外貌风格: v(d.style, d.styleCustom),
    性格特质: d.traits.length ? d.traits : ['随机'],
    体态身材: v(d.bodyType, d.bodyTypeCustom),
    种族: v(d.race, d.raceCustom),
    年龄感: v(d.age, d.ageCustom) || '随机',
    来源世界: v(d.origin, d.originCustom),
    天赋能力: d.abilities.length ? d.abilities : ['随机'],
    身份地位: v(d.role, d.roleCustom),
    同人: mxFandomMode.value
      ? {
          类型: (d.fandomType === '自定义' ? d.fandomTypeCustom : d.fandomType) || '魔改向',
          作品: v(d.fandom, d.fandomCustom) || '随机',
          描述: d.fandomDesc || '无',
        }
      : v(d.fandom, d.fandomCustom) || '原创',
    核心特质: v(d.coreTrait, d.coreTraitCustom),
    初见态度: v(d.attitude, d.attitudeCustom),
    相识状态: v(d.acquaintance, d.acquaintanceCustom),
    特殊标记: d.specialMark === '自定义' ? d.specialMarkCustom || '无' : d.specialMark || '无',
    其他补充: d.other || '无',
  };
  mxSend(summon + '\n' + JSON.stringify(obj, null, '  '));
}
const mxGenTemplate = `你正在通过母镜感知一位红颜的存在。镜中波纹荡漾，一道身影的因果线逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的信息。

请将镜中身影的信息整理为以下档案，标记为 [世界书档案]。参照镜待流年现有角色档案风格——灵活描述，不固化可变细节。

---

[世界书档案]

此份档案存入世界书，供日后长期参考。须参照镜待流年现有角色档案风格——灵活的描述，不固化任何可变的细节。
具体格式如下：

<basic_info>
角色档案:
    基本信息:
        姓名:
        化名:（别名或主世界化名，无则留空不要生造）
        性别:
        年龄:（描述性，如"外表约20岁"或"实际年龄远超外表"）
        身份:
        与<user>关系:（初次相遇时的关系定位）
        来源世界:
        种族:
        天赋能力:（描述能力的名称、效果与限制，不要只写名字）

    外貌特征:
        基础体型:（描述性，含身材与体态）
        特征:（角色不可变的生理标记，不含服装/饰品/可卸物。无则留空）
        身高:
        发色/发型:
        眼睛:（眼型、瞳色）
        整体印象:（初见时的整体感觉）
        穿着打扮:
            - （风格倾向，写穿搭风格与常见色系即可——如"日常穿素白为主的宽松衣袍"）

    性格特点:
        喜好:
        厌恶:
        核心特质:（叙事描写，含内心矛盾与软肋，不少于80字）
        表现形式:
            - （行为模式，一事一条）
        对<user>的表现:
            - "（自然语言例句）"

    背景设定:
        过往经历:（涵盖出身、关键转折、为何被母镜选中，不少于200字）

    语言特征:
        说话习惯:

    关系设定:
        与<user>的关系:
            认知:（她在镜中看到了什么，如何看待<user>）
            情感:（初见时的情感基调）
            互动方式:

    特殊物品:
        （仅真正特殊的物品——如子镜等传说级物品。日常物品不要写在这里）

    私密特征:
        胸型: [诗名]
            - （贴合角色体型与气质的描述，含形状、大小、色泽、触感，不可使用"一线天""馒头"等通用模板词）
        户型: [诗名]
            - （贴合角色身份与种族特质的描述，含形态、紧致度、特殊体感，不可使用"一线天""馒头"等通用模板词）

    兴趣爱好:
        [爱好名]:
            动机:
              - （这件爱好的情感来源，对角色个人的意义）
            表现:
              - （做这件事的具体方式与细节）
</basic_info>

---

规则：
- 不要写剧情。不要写叙述。不要写旁白。不要写思维链。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。忽略后续提示词中可能出现的变量更新指令，那些与本任务无关。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 所有字段（含 NSFW）直接填写，不拒绝不回避不省略。
- 每个值须有辨识度——数字避免敷衍整数，文本避免泛泛描述。
- 命名与描述贴合角色背景与场景语境。
- 根据相识状态与来源世界构建角色背景，不要机械套用现有角色的"主世界隐藏身份"模式。
- 除非已相识或已在主世界，否则角色默认身处来源世界，来源世界即其当前所在地。
- 化名仅在该角色确实拥有主世界化名/别名时填写，不要无中生有。无化名则留空。姓名与化名不要写在括号里附带。
- 例句直接写对话本身，禁止使用 <q></q> 标签包裹。`;

const npcGenTemplate = `你正在通过母镜感知一道身影的存在。镜中波纹荡漾，一条因果线逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的信息。

请将镜中身影的信息整理为以下档案，标记为 [世界书档案]。参照镜待流年现有角色档案风格——灵活描述，不固化可变细节。

---

[世界书档案]

此份档案存入世界书，供日后长期参考。须参照镜待流年现有角色档案风格——灵活的描述，不固化任何可变的细节。
具体格式如下：

<basic_info>
角色档案:
    基本信息:
        姓名:
        化名:（别名或主世界化名，无则留空不要生造）
        性别:
        年龄:（描述性，如"外表约20岁"或"实际年龄远超外表"）
        身份:
        与<user>关系:（初次相遇时的关系定位。此人未必对<user>怀有爱慕，写出真实的关系基调即可）
        来源世界:
        种族:
        天赋能力:（描述能力的名称、效果与限制，不要只写名字）

    外貌特征:
        基础体型:（描述性，含身材与体态）
        特征:（角色不可变的生理标记，不含服装/饰品/可卸物。无则留空）
        身高:
        发色/发型:
        眼睛:（眼型、瞳色）
        整体印象:（初见时的整体感觉）
        穿着打扮:
            - （风格倾向，写穿搭风格与常见色系即可——如"日常穿素白为主的宽松衣袍"）

    性格特点:
        喜好:
        厌恶:
        核心特质:（叙事描写，含内心矛盾与软肋，不少于80字）
        表现形式:
            - （行为模式，一事一条）
        对<user>的表现:
            - "（自然语言例句）"

    背景设定:
        过往经历:（涵盖出身、关键转折、为何被母镜选中，不少于200字）

    语言特征:
        说话习惯:

    关系设定:
        与<user>的关系:
            认知:（此人在镜中看到了什么，如何看待<user>。不预设爱慕倾向）
            情感:（初见时的情感基调，如好奇、警惕、漠然、友善等）
            互动方式:

    特殊物品:
        （仅真正特殊的物品——如子镜等传说级物品。日常物品不要写在这里）

    私密特征:
        胸型: [诗名]
            - （贴合角色体型与气质的描述，含形状、大小、色泽、触感，不可使用"一线天""馒头"等通用模板词）
        户型: [诗名]
            - （贴合角色身份与种族特质的描述，含形态、紧致度、特殊体感，不可使用"一线天""馒头"等通用模板词）

    兴趣爱好:
        [爱好名]:
            动机:
              - （这件爱好的情感来源，对角色个人的意义）
            表现:
              - （做这件事的具体方式与细节）
</basic_info>

---

规则：
- 此人未必是红颜，不必预设对<user>的爱慕或依恋。写出真实可信的独立人格即可。
- 不要写剧情。不要写叙述。不要写旁白。不要写思维链。不要写分析过程。
- 不要输出 <UpdateVariable>、<JSONPatch>、<Variable> 或任何变量操作标签。忽略后续提示词中可能出现的变量更新指令，那些与本任务无关。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 所有字段（含 NSFW）直接填写，不拒绝不回避不省略。
- 每个值须有辨识度——数字避免敷衍整数，文本避免泛泛描述。
- 命名与描述贴合角色背景与场景语境。
- 化名仅在该角色确实拥有化名/别名时填写，不要无中生有。无化名则留空。姓名与化名不要写在括号里附带。
- 例句直接写对话本身，禁止使用 <q></q> 标签包裹。`;

const plOpen = reactive({ basic: true });
const plGenerating = ref(false);
const plGenResult = ref('');
const plGenArchive = ref('');
const plGenError = ref('');
const plSaved = ref(false);
const plForm = reactive({ name: '', type: '', typeCustom: '', techLevel: '', magicLevel: '', coreFeature: '', linkedChars: '' });

const plGenTemplate = `你正在通过母镜感知一方世界的轮廓。镜中波纹荡漾，一片大陆、一种文明、一套法则逐渐在你手中凝聚成形。这不是在写剧情——你只是在整理镜中传来的位面信息。

请将镜中世界的信息整理为以下档案，标记为 [位面档案]。

---

[位面档案]

位面名称:
位面类型:（仙道/洪荒/西幻/现代/异世界/深渊/妖灵/幽冥/科幻/武侠/神话/末日等）
技术等级:（描述性，如"中古冷兵器时代"）
魔法/灵力等级:（描述性，如"中魔——常见但不主导日常"）

地理概况:
  - （大陆/国家/主要区域的简要描述）

文明特征:
  - （社会结构、文化特色、政治格局等）

力量体系:
  - （该位面的核心力量规则，如修仙体系、魔法体系、科技体系等）

特色势力:
  - （1-3个代表性势力，含名称与简要特征）

关联角色:
  - （已有角色中与该位面相关的人物，无则写"暂无"）

---

规则：
- 不要写剧情。不要写叙述。不要写分析过程。
- 严格按以上格式输出。除此之外不要附带任何其他内容。
- 位面不需要NSFW内容。
- 描述贴合所选的类型与技术/魔法等级。`;

function mxBuildGenPrompt(): { prompt: string; tagBlock: string } {
  const d = mxForm;
  const v = (s: string, c: string) => (s === '自定义' || !s ? c || '随机' : s);
  const tags: string[] = [];
  if (v(d.style, d.styleCustom)) tags.push('外貌风格：' + v(d.style, d.styleCustom));
  if (d.traits.length) tags.push('性格特质：' + d.traits.join('、'));
  else tags.push('性格特质：随机');
  if (v(d.bodyType, d.bodyTypeCustom)) tags.push('体态身材：' + v(d.bodyType, d.bodyTypeCustom));
  if (v(d.race, d.raceCustom)) tags.push('种族：' + v(d.race, d.raceCustom));
  if (v(d.age, d.ageCustom)) tags.push('年龄感：' + v(d.age, d.ageCustom));
  if (v(d.origin, d.originCustom)) tags.push('来源世界：' + v(d.origin, d.originCustom));
  if (d.abilities.length) tags.push('天赋能力：' + d.abilities.join('、'));
  else tags.push('天赋能力：随机');
  if (v(d.role, d.roleCustom)) tags.push('身份地位：' + v(d.role, d.roleCustom));
  if (v(d.coreTrait, d.coreTraitCustom)) tags.push('核心特质：' + v(d.coreTrait, d.coreTraitCustom));
  if (v(d.attitude, d.attitudeCustom)) tags.push('初见态度：' + v(d.attitude, d.attitudeCustom));
  if (v(d.acquaintance, d.acquaintanceCustom)) tags.push('相识状态：' + v(d.acquaintance, d.acquaintanceCustom));
  const mark = d.specialMark === '自定义' ? d.specialMarkCustom || '无' : d.specialMark || '无';
  if (mark !== '无') tags.push('特殊标记：' + mark);
  if (d.other.trim()) tags.push('其他补充：' + d.other.trim());
  if (mxFandomMode.value) {
    const ftype = d.fandomType === '自定义' ? d.fandomTypeCustom || '魔改向' : d.fandomType || '魔改向';
    tags.push('同人类型：' + ftype);
    if (v(d.fandom, d.fandomCustom)) tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
    if (d.fandomDesc) tags.push('魔改描述：' + d.fandomDesc);
  } else if (v(d.fandom, d.fandomCustom) && v(d.fandom, d.fandomCustom) !== '原创') {
    tags.push('同人作品：' + v(d.fandom, d.fandomCustom));
  }
  const tagBlock = tags.map(t => '- ' + t).join('\n');
  const isNPC = activeTab.value === 'npc';
  const tmpl = isNPC ? npcGenTemplate : mxGenTemplate;
  const roleHint = isNPC ? '一位详细角色人设（非红颜，普通人物）。' : '一位详细红颜人设。';
  const fullPrompt = `使用母镜生成${roleHint}\n\n=== 已选标签 ===\n${tagBlock}\n\n${tmpl}\n\n（请按上述模板输出 [世界书档案] 。）`;
  return { prompt: fullPrompt, tagBlock };
}

async function mxGenerateDetail() {
  mxGenError.value = '';
  mxGenResult.value = '';
  mxGenArchive.value = '';
  mxSaved.value = false;
  mxGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      mxGenError.value = '未检测到酒馆助手，请确认已安装 Tavern Helper 扩展。';
      return;
    }
    const { prompt } = mxBuildGenPrompt();
    const kw: string[] = [];
    [mxForm.race, mxForm.origin, mxForm.role, mxForm.coreTrait, mxForm.other].forEach(f => {
      const val = typeof f === 'string' ? f : '';
      if (val && val !== '自定义') kw.push(val);
    });
    if (mxForm.raceCustom && mxForm.race === '自定义') kw.push(mxForm.raceCustom);
    if (mxForm.originCustom && mxForm.origin === '自定义') kw.push(mxForm.originCustom);
    if (mxForm.roleCustom && mxForm.role === '自定义') kw.push(mxForm.roleCustom);
    if (mxForm.coreTraitCustom && mxForm.coreTrait === '自定义') kw.push(mxForm.coreTraitCustom);
    const ordered: any[] = [
      { role: 'system', content: prompt },
      'persona_description',
      'char_description',
      'world_info_before',
      'world_info_after',
    ];
    if (mxIncludeChat.value) ordered.push('chat_history');
    ordered.push('user_input');
    const result = await TH.generateRaw({
      user_input: `本次为镜渡生成角色档案，勿编剧情。以下为部分已选标签，供扫描关键词激活世界书用：${kw.join('，')}`,
      should_silence: true,
      max_chat_history: mxIncludeChat.value ? 6 : undefined,
      ordered_prompts: ordered,
    });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    mxGenResult.value = text;
    const archMatch = text.match(/\[世界书档案\]\s*([\s\S]*)/);
    if (archMatch) mxGenArchive.value = archMatch[1].trim();
    else mxGenArchive.value = text;
  } catch (e: any) {
    mxGenError.value = e?.message || String(e);
  } finally {
    mxGenerating.value = false;
  }
}

async function mxSaveGenResult() {
  if (!mxGenArchive.value) return;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) {
      mxGenError.value = '未检测到酒馆助手。';
      return;
    }
    const nameMatch = mxGenArchive.value.match(/姓名[：:][^\S\n]*(\S+)/);
    const charName = nameMatch ? nameMatch[1].replace(/[（(].*$/, '') : '新红颜';
    const aliasMatch = mxGenArchive.value.match(/化名[：:][^\S\n]*(\S[^\n]*\S|\S)/);
    const alias = aliasMatch ? aliasMatch[1].replace(/[（(].*$/, '').trim() : '';
    const keys = [charName];
    if (alias) keys.push(alias);
    let wbName: string = TH.getCharLorebooks()?.primary;
    if (!wbName) {
      wbName = '镜待流年v58';
      await TH.createLorebook(wbName);
      await TH.setCurrentCharLorebooks({ primary: wbName });
    }
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 1000 && o < 10000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 1000;
    await TH.createLorebookEntries(wbName, [
      {
        comment: `镜渡生成 - ${charName}`,
        enabled: true,
        type: 'selective',
        keys,
        position: 'before_character_definition',
        order: nextOrder,
        probability: 100,
        exclude_recursion: true,
        prevent_recursion: true,
        content: mxGenArchive.value,
      },
    ]);
    const idMatch = mxGenArchive.value.match(/身份[：:][^\S\n]*(\S[^\n]*)/);
    const charId = idMatch ? idMatch[1].trim() : '未知';
    const target = existing.find((e: any) => e.comment === '生成角色列表');
    if (target) {
      const newEntry = '\n  - ' + charName + ':\n      身份: ' + charId;
      const newContent = (target.content || '') + newEntry;
      await TH.setLorebookEntries(wbName, [{ uid: target.uid, content: newContent }]);
    }
    mxSaved.value = true;
  } catch (e: any) {
    mxGenError.value = '保存失败：' + (e?.message || String(e));
  }
}
function mxInjectArchive() {
  if (!mxGenArchive.value) return;
  const isNPC = activeTab.value === 'npc';
  const subject = isNPC ? '一人' : '一位红颜';
  const dir =
    mirrorDir.value === 'toMe'
      ? `使用母镜召唤${subject}来到身边。以下是镜中传来的信息：\n\n`
      : `使用母镜前往${subject}所在的世界。以下是镜中传来的信息：\n\n`;
  mxSend(dir + mxGenArchive.value);
}

async function plGenerate() {
  plGenError.value = ''; plGenResult.value = ''; plGenArchive.value = ''; plSaved.value = false; plGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { plGenError.value = '未检测到酒馆助手'; return; }
    const d = plForm;
    const tags: string[] = [];
    if (d.name) tags.push('位面名称：' + d.name);
    if (d.type === '自定义' && d.typeCustom) tags.push('位面类型：' + d.typeCustom);
    else if (d.type) tags.push('位面类型：' + d.type);
    if (d.techLevel) tags.push('技术等级：' + d.techLevel);
    if (d.magicLevel) tags.push('魔法/灵力等级：' + d.magicLevel);
    if (d.coreFeature.trim()) tags.push('核心特征：' + d.coreFeature.trim());
    if (d.linkedChars.trim()) tags.push('关联角色：' + d.linkedChars.trim());
    const prompt = `使用母镜生成一个位面设定。\n\n=== 已选标签 ===\n${tags.map(t => '- ' + t).join('\n')}\n\n${plGenTemplate}\n\n（请按上述模板输出 [位面档案] 。）`;
    const ordered: any[] = ['system', 'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'user_input'];
    const result = await TH.generateRaw({ user_input: '本次为镜渡生成位面档案，勿编剧情。', should_silence: true, ordered_prompts: ordered });
    const text = typeof result === 'string' ? result : result.content || JSON.stringify(result);
    plGenResult.value = text;
    const archMatch = text.match(/\[位面档案\]\s*([\s\S]*)/);
    if (archMatch) plGenArchive.value = archMatch[1].trim(); else plGenArchive.value = text;
  } catch (e: any) { plGenError.value = e?.message || String(e); }
  finally { plGenerating.value = false; }
}

async function plSaveGenResult() {
  if (!plGenArchive.value) return;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { plGenError.value = '未检测到酒馆助手'; return; }
    const nameMatch = plGenArchive.value.match(/位面名称[：:][^\S\n]*(\S[^\n]*)/);
    const planeName = nameMatch ? nameMatch[1].trim() : '新位面';
    let wbName: string = TH.getCharLorebooks()?.primary;
    if (!wbName) { wbName = '镜待流年v56'; await TH.createLorebook(wbName); await TH.setCurrentCharLorebooks({ primary: wbName }); }
    const existing = await TH.getLorebookEntries(wbName);
    const genOrders = existing.map((e: any) => e.order ?? 0).filter((o: number) => o >= 9000 && o < 10000);
    const nextOrder = genOrders.length ? Math.max(...genOrders) + 5 : 9000;
    await TH.createLorebookEntries(wbName, [{
      comment: `镜渡生成 - 位面:${planeName}`, enabled: true, type: 'selective', keys: [planeName],
      position: 'before_character_definition', order: nextOrder, probability: 100,
      exclude_recursion: true, prevent_recursion: true, content: plGenArchive.value,
    }]);
    const listTarget = existing.find((e: any) => e.comment === '生成位面列表');
    if (listTarget) {
      await TH.setLorebookEntries(wbName, [{ uid: listTarget.uid, content: (listTarget.content || '') + '\n- ' + planeName }]);
    } else {
      await TH.createLorebookEntries(wbName, [{
        comment: '生成位面列表', enabled: true, type: 'selective', keys: ['生成位面列表'],
        position: 'before_character_definition', order: 8995, probability: 100,
        exclude_recursion: true, prevent_recursion: true,
        content: '生成位面列表:\n- ' + planeName,
      }]);
    }
    plSaved.value = true;
  } catch (e: any) { plGenError.value = '保存失败：' + (e?.message || String(e)); }
}

function plInjectArchive() {
  if (!plGenArchive.value) return;
  mxSend('使用母镜前往一个位面。以下是镜中传来的位面信息：\n\n' + plGenArchive.value);
}

const expandedChars = ref(new Set<string>());
const expandedSubs = ref(new Set<string>());
const clothDetail = ref(new Set<string>());
function toggleClothDetail(k: string) {
  const s = new Set(clothDetail.value);
  s.has(k) ? s.delete(k) : s.add(k);
  clothDetail.value = s;
}

const deleteMode = ref(false);
const deleteSelection = ref(new Set<string>());
function toggleCharDelete(k: string) {
  const s = new Set(deleteSelection.value);
  s.has(k) ? s.delete(k) : s.add(k);
  deleteSelection.value = s;
}
async function confirmDelete() {
  try {
    const w = window as any;
    if (!w.Mvu || !w._) return;
    const mid = w.getCurrentMessageId?.() ?? -1;
    const variables = w.Mvu.getMvuData({ type: 'message', message_id: mid });
    for (const n of [...deleteSelection.value]) {
      w._.unset(variables, `stat_data.角色名录.${n}`);
    }
    await w.Mvu.replaceMvuData(variables, { type: 'message', message_id: mid });
  } catch (e) {
    console.error('删除角色失败', e);
  }
  deleteMode.value = false;
  deleteSelection.value = new Set();
}

const themes = [
  { id: 'cream', name: '米白', color: '#d4c8b6' },
  { id: 'purple', name: '墨紫', color: '#7b5ea7' },
  { id: 'gold', name: '暖金', color: '#c9a96e' },
  { id: 'teal', name: '青黛', color: '#5ea0a7' },
  { id: 'rose', name: '绯红', color: '#c47b8b' },
] as const;

const userName = computed(() => {
  try {
    return (window as any).parent?.SillyTavern?.getContext?.()?.name1 || '{{user}}';
  } catch {
    return '{{user}}';
  }
});
const timeText = computed(() => (isSet(data.value.世界.当前时间) ? data.value.世界.当前时间 : '序章'));
const weekText = computed(() => (isSet(data.value.世界.周几) ? data.value.世界.周几 : ''));
const weatherText = computed(() => (isSet(data.value.世界.天气) ? data.value.世界.天气 : ''));
const weatherEmoji = computed(() => {
  const w = weatherText.value;
  if (!w) return '';
  if (w.includes('雪')) return '❄️';
  if (w.includes('雨')) return '🌧️';
  if (w.includes('雷')) return '⛈️';
  if (w.includes('阴')) return '☁️';
  if (w.includes('风')) return '💨';
  if (w.includes('雾')) return '🌫️';
  if (w.includes('晴')) return '☀️';
  if (w.includes('云')) return '⛅';
  return '🌤️';
});
const locationFull = computed(() => {
  const loc = data.value.主角.当前地点;
  const parts = [loc.位面, loc.大陆, loc.城市, loc.区域, loc.场景, loc.具体位置].filter(v => v && v !== '待设定');
  return parts.length > 0 ? parts.join(' · ') : '';
});

function isSet(v: unknown): boolean {
  return !!v && v !== '待设定' && v !== '待設定';
}
function loveIcon(val: number): string {
  if (val >= 100) return '💗';
  if (val >= 80) return '💝';
  if (val >= 60) return '💖';
  if (val >= 40) return '❤️‍🔥';
  if (val >= 20) return '💓';
  if (val >= 1) return '❤️';
  return '🤍';
}
function toggleChar(k: string) {
  const s = new Set(expandedChars.value);
  s.has(k) ? s.delete(k) : s.add(k);
  expandedChars.value = s;
}
function sub(k: string) {
  return expandedSubs.value.has(k);
}
function toggleSub(k: string) {
  const s = new Set(expandedSubs.value);
  s.has(k) ? s.delete(k) : s.add(k);
  expandedSubs.value = s;
}

const protagClothing = computed(() => {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = data.value.主角.服装 || {};
  return ['上衣', '内衣', '下装', '内裤', '袜子', '鞋子']
    .filter(k => c[k] !== undefined)
    .map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
});
const itemEntries = computed(
  () => Object.entries(data.value.主角.随身物品 || {}) as [string, { 描述?: string; 数量?: number }][],
);
const relationEntries = computed(() => Object.entries(data.value.主角.人际关系 || {}) as [string, string][]);

type CharInfo = {
  身份?: string;
  性别?: string;
  年龄?: number;
  种族?: string;
  来源世界?: string;
  喜好?: string;
  厌恶?: string;
  外貌特征?: string;
  基础体型?: string;
  神态?: string;
  特征?: string;
  天赋能力?: string;
  好感度?: number;
  财富?: number;
  境界?: string;
  战力?: number;
  当前地点?: { 位面?: string; 大陆?: string; 城市?: string; 区域?: string; 场景?: string; 具体位置?: string };
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>;
  随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: {
    初次存在与否?: boolean;
    性对象?: string;
    是否怀孕?: boolean;
    子嗣列表?: string;
    三围?: { 胸围?: number; 腰围?: number; 臀围?: number };
    罩杯?: string;
    胸型?: { 名称?: string; 描述?: string; 状态?: string };
    户型?: { 名称?: string; 描述?: string; 状态?: string };
  };
};
interface NearbyChar {
  _key: string;
  name: string;
  身份?: string;
  性别?: string;
  年龄?: number;
  种族?: string;
  来源世界?: string;
  喜好?: string;
  厌恶?: string;
  外貌特征?: string;
  基础体型?: string;
  神态?: string;
  特征?: string;
  天赋能力?: string;
  好感度: number;
  财富?: number;
  境界?: string;
  战力?: number;
  当前地点?: { 位面?: string; 大陆?: string; 城市?: string; 区域?: string; 场景?: string; 具体位置?: string };
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>;
  随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: {
    初次存在与否?: boolean;
    性对象?: string;
    是否怀孕?: boolean;
    子嗣列表?: string;
    三围?: { 胸围?: number; 腰围?: number; 臀围?: number };
    罩杯?: string;
    胸型?: { 名称?: string; 描述?: string; 状态?: string };
    户型?: { 名称?: string; 描述?: string; 状态?: string };
  };
}

function presOrder(p: string): number {
  return p === 'present' ? 0 : p === 'nearby' ? 1 : 2;
}

const allChars = computed<NearbyChar[]>(() => {
  const chars: NearbyChar[] = [];
  const rec = (data.value as any).角色名录 || {};
  for (const [name, info] of Object.entries(rec as Record<string, CharInfo | undefined>)) {
    if (info) chars.push({ _key: name, name, 好感度: info.好感度 ?? 0, 当前地点: info.当前地点, ...info });
  }
  chars.sort((a, b) => {
    const pa = presOrder(presence(a));
    const pb = presOrder(presence(b));
    if (pa !== pb) return pa - pb;
    return b.好感度 - a.好感度;
  });
  return chars;
});

function normalizeLoc(s: string): string {
  const suffixes = /[上下里内外旁辺中前后处间角面边侧]$/;
  let r = s;
  while (suffixes.test(r)) r = r.replace(suffixes, '').trim();
  return r;
}

function presence(char: NearbyChar): string {
  const pLoc = data.value.主角.当前地点;
  const cLoc = char.当前地点;
  if (!cLoc) return 'absent';

  const cScene = (cLoc.场景 || '').trim();
  const pScene = (pLoc.场景 || '').trim();
  const cRegion = (cLoc.区域 || '').trim();
  const pRegion = (pLoc.区域 || '').trim();
  if (cScene && pScene && cScene === pScene && cRegion === pRegion) return 'present';

  if (isSet(pLoc.具体位置) && isSet(cLoc.具体位置)) {
    if (cLoc.具体位置.trim() === pLoc.具体位置.trim()) return 'present';
    const nHere = normalizeLoc(pLoc.具体位置);
    const nChar = normalizeLoc(cLoc.具体位置);
    if (nChar && nHere && (nChar === nHere || nChar.includes(nHere) || nHere.includes(nChar))) return 'present';
  }

  if (cRegion && pRegion && cRegion === pRegion) return 'nearby';

  const cCity = (cLoc.城市 || '').trim();
  const pCity = (pLoc.城市 || '').trim();
  if (cCity && pCity && cCity === pCity) return 'nearby';

  return 'absent';
}
function presenceText(char: NearbyChar): string {
  const c = presence(char);
  return c === 'present' ? '在场' : c === 'nearby' ? '附近' : '不在';
}
function getCharClothing(char: NearbyChar): { key: string; 名称: string; 描述: string; 状态: string }[] {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = char.服装 || {};
  return ['上衣', '内衣', '下装', '内裤', '袜子', '鞋子']
    .filter(k => c[k] !== undefined)
    .map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
}
function getCharItems(char: NearbyChar): [string, { 描述?: string; 数量?: number }][] {
  return Object.entries(char.随身物品 || {});
}
function getCharRelations(char: NearbyChar): [string, string][] {
  return Object.entries(char.人际关系 || {});
}
</script>

<style lang="scss" scoped>
@import url('https://fontsapi.zeoseven.com/3/main/result.css');
@import url('https://fontsapi.zeoseven.com/84/main/result.css');
.status-bar {
  --t-bg: #faf7f0;
  --t-surface: #f5f0e8;
  --t-surface-open: #ede6d8;
  --t-surface-deep: #e8e0d0;
  --t-border: rgba(0, 0, 0, 0.08);
  --t-accent: #8b7355;
  --t-accent-dim: rgba(139, 115, 85, 0.15);
  --t-gold: #a08060;
  --t-text: #4a4035;
  --t-muted: #8a7e6e;
  --t-dim: #b8a898;
  --t-stripe: rgba(139, 115, 85, 0.25);
  --t-mist: rgba(139, 115, 85, 0.03);
  --t-radius: 10px;
  --t-radius-sm: 6px;
  --g-nav: linear-gradient(135deg, #d4d4dc, #b0b4bc, #8a8e98, #686c78);
  --g-loc: linear-gradient(135deg, #a0cce8, #78b0d4, #5a90b8, #3a6e98, #285880);
  --g-label: linear-gradient(135deg, #e8d8b0, #d4c490, #b8a470, #a08858, #8a7048);
  --g-sec: linear-gradient(135deg, #e8d0a8, #d4ba90, #b89868, #a07850, #886838);
  --g-sub: linear-gradient(135deg, #98d8d8, #6ebebe, #4a9e9e, #307878, #206060);
  --g-desc: linear-gradient(135deg, #e0e0e6, #c0c4cc, #989ca8, #707480, #585c68);
  --g-val: linear-gradient(135deg, #b8d8f0, #88bce0, #5a90c0, #3a68a0, #285080);
  --g-keep: inherit;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--t-bg);
  color: var(--t-text);
  font-family: var(--font-main);
  font-size: 12px;
  line-height: 1.6;
  user-select: none;
  border-radius: var(--t-radius);
  overflow: hidden;

  &.theme-purple {
    --t-bg: #1e1a24;
    --t-surface: #252131;
    --t-surface-open: #2d2838;
    --t-surface-deep: #1f1c26;
    --t-border: rgba(255, 255, 255, 0.06);
    --t-accent: #9b7ec4;
    --t-accent-dim: rgba(155, 126, 196, 0.25);
    --t-gold: #b8a0d4;
    --t-text: #d4cee0;
    --t-muted: #867e95;
    --t-dim: #5c5668;
    --t-stripe: rgba(155, 126, 196, 0.3);
    --t-mist: rgba(155, 126, 196, 0.02);
  }
  &.theme-gold {
    --t-accent: #c9a96e;
    --t-accent-dim: rgba(201, 169, 110, 0.25);
    --t-gold: #d4b878;
    --t-surface: #25221c;
    --t-surface-open: #2d2922;
    --t-bg: #1e1c17;
    --t-surface-deep: #1d1b16;
    --t-border: rgba(255, 255, 255, 0.06);
    --t-text: #d4cee0;
    --t-muted: #867e95;
    --t-dim: #5c5668;
    --t-stripe: rgba(201, 169, 110, 0.3);
    --t-mist: rgba(201, 169, 110, 0.02);
  }
  &.theme-teal {
    --t-accent: #5ea0a7;
    --t-accent-dim: rgba(94, 160, 167, 0.25);
    --t-gold: #6eb8bf;
    --t-surface: #1c2325;
    --t-surface-open: #222b2d;
    --t-bg: #171e20;
    --t-surface-deep: #161d1e;
    --t-border: rgba(255, 255, 255, 0.06);
    --t-text: #d4cee0;
    --t-muted: #867e95;
    --t-dim: #5c5668;
    --t-stripe: rgba(94, 160, 167, 0.3);
    --t-mist: rgba(94, 160, 167, 0.02);
  }
  &.theme-rose {
    --t-accent: #c47b8b;
    --t-accent-dim: rgba(196, 123, 139, 0.25);
    --t-gold: #d08b99;
    --t-surface: #251c1f;
    --t-surface-open: #2d2225;
    --t-bg: #1e181a;
    --t-surface-deep: #1c1719;
    --t-border: rgba(255, 255, 255, 0.06);
    --t-text: #d4cee0;
    --t-muted: #867e95;
    --t-dim: #5c5668;
    --t-stripe: rgba(196, 123, 139, 0.3);
    --t-mist: rgba(196, 123, 139, 0.02);
  }
}
.master-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  background: var(--t-surface);
  position: relative;
  &:hover {
    background: var(--t-surface-open);
  }
}
.master-info {
  font-family: '寒蝉全圆体', var(--font-main);
  flex: 1;
  font-size: 10px;
  color: var(--t-gold);
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}
.master-arrow {
  font-size: 10px;
  color: var(--t-dim);
  position: relative;
  z-index: 1;
}
.brand {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--t-accent);
  font-weight: 600;
  position: relative;
  z-index: 1;
}
.main-body {
  border-top: 1px solid var(--t-border);
  position: relative;
}
.main-body::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 1px, var(--t-accent) 1px, var(--t-accent) 2px),
    repeating-linear-gradient(-45deg, transparent, transparent 1px, var(--t-accent) 1px, var(--t-accent) 2px);
  opacity: 0.03;
}
.settings-bar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 12px;
  background: var(--t-surface);
  border-bottom: 1px solid var(--t-border);
}
.gear-btn {
  background: none;
  border: none;
  color: var(--t-muted);
  cursor: pointer;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--t-radius-sm);
  letter-spacing: 0.5px;
  &:hover {
    color: var(--t-accent);
    background: var(--t-accent-dim);
  }
}
.theme-picker {
  display: flex;
  gap: 8px;
  padding: 5px 12px;
  background: var(--t-surface);
  border-bottom: 1px solid var(--t-border);
}
.theme-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  &.active {
    border-color: var(--t-text);
    transform: scale(1.2);
  }
  &:hover {
    transform: scale(1.15);
  }
}
.time-bar {
  font-family: '寒蝉全圆体', var(--font-main);
  padding: 10px 14px 2px;
  font-size: 14px;
  font-weight: 700;
  color: var(--t-gold);
  letter-spacing: 1px;
  background: var(--t-bg);
}
.weather-bar {
  font-family: 'DouyinSans', var(--font-main);
  padding: 2px 14px 0;
  font-size: 10px;
  color: var(--t-muted);
  background: var(--t-bg);
  letter-spacing: 0.5px;
}
.world-loc {
  font-family: 'DouyinSans', var(--font-main);
  padding: 2px 14px 6px;
  font-size: 10px;
  color: var(--t-muted);
  background: var(--t-bg);
}

.stat-row-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 4px 0 6px;
}
.stat-item {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-dim);
  letter-spacing: 1px;
  b {
    font-family: 'DouyinSans', var(--font-main);
    font-size: 12px;
    color: var(--t-text);
  }
}

.block {
  margin: 0 8px 6px;
  border-radius: var(--t-radius);
  background: var(--t-surface);
  box-shadow: 0 0 0 1px var(--t-border);
  overflow: hidden;
  position: relative;
  z-index: 1;
  &.open {
    background: var(--t-surface-open);
  }
}
.block-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  border-left: 2px solid var(--t-stripe);
  transition: all 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-left-color: var(--t-accent);
  }
}
.block-title {
  font-family: '寒蝉全圆体', var(--font-main);
  font-weight: 600;
  font-size: 12px;
  color: var(--t-accent);
  letter-spacing: 0.5px;
}
.block-sub {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-muted);
  flex: 1;
  text-align: right;
  margin-right: 4px;
}
.block-arrow {
  font-size: 9px;
  color: var(--t-dim);
  margin-left: auto;
  &.small {
    font-size: 8px;
  }
}
.block-body {
  padding: 0 12px 10px;
  position: relative;
  z-index: 1;
}

.sub-block {
  margin-top: 5px;
  border-radius: var(--t-radius-sm);
  background: var(--t-surface-deep);
  box-shadow: 0 0 0 1px var(--t-border);
  overflow: hidden;
  position: relative;
  z-index: 1;
  &.open {
    background: var(--t-surface);
  }
}
.sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 11px;
  color: var(--t-muted);
  border-left: 2px solid var(--t-stripe);
  transition: all 0.15s;
  font-family: '寒蝉全圆体', var(--font-main);
  letter-spacing: 1px;
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--t-text);
    border-left-color: var(--t-accent);
  }
}
.sub-body {
  padding: 6px 10px 8px;
}

.cloth-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cloth-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--t-bg);
  box-shadow: 0 0 0 1px var(--t-border);
  border-radius: var(--t-radius-sm);
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: var(--t-surface-deep);
  }
}
.cloth-key {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-dim);
  letter-spacing: 0.5px;
  min-width: 28px;
}
.cloth-val {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px;
  color: var(--t-text);
  flex: 1;
  &.dim {
    color: var(--t-dim);
  }
}
.cloth-status {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 8px;
  color: var(--t-accent);
  background: var(--t-accent-dim);
  padding: 1px 8px;
  border-radius: 9999px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.cloth-detail {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: var(--t-muted);
  padding: 2px 8px 4px 36px;
  line-height: 1.5;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 2px;
  padding: 2px 0;
}
.info-cell {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-dim);
  letter-spacing: 0.5px;
  b {
    font-family: 'DouyinSans', var(--font-main);
    color: var(--t-text);
    font-weight: 600;
    font-size: 12px;
  }
}

.item-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: var(--t-radius-sm);
  background: var(--t-bg);
  border: 1px solid var(--t-border);
  margin-bottom: 3px;
}
.item-name {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px;
  font-weight: 600;
  color: var(--t-accent);
  white-space: nowrap;
}
.item-desc {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: var(--t-muted);
  flex: 1;
}
.item-qty {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-gold);
  font-weight: 600;
}

.char-entry {
  margin-top: 4px;
}
.char-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--t-radius-sm);
  background: var(--t-surface);
  border: 1px solid var(--t-border);
  &:hover {
    background: var(--t-surface-open);
  }
}
.char-name {
  font-family: 'DouyinSans', var(--font-main);
  font-weight: 600;
  font-size: 12px;
  color: var(--t-accent);
}
.char-identity {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  color: var(--t-muted);
  background: var(--t-accent-dim);
  padding: 1px 6px;
  border-radius: 9999px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.char-hearts {
  font-size: 12px;
}
.char-presence {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 8px;
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 9999px;
  font-weight: 500;
  letter-spacing: 0.5px;
  &.present {
    color: #4a7a4a;
    background: rgba(100, 160, 100, 0.12);
  }
  &.nearby {
    color: #8a6a20;
    background: rgba(200, 160, 60, 0.12);
  }
  &.absent {
    color: var(--t-dim);
    background: rgba(128, 128, 128, 0.08);
  }
}
.char-row .block-arrow {
  margin-left: 4px;
}
.char-detail {
  padding: 8px 4px 4px;
}
.char-row.del-selected {
  background: rgba(200, 80, 80, 0.1);
  border-color: rgba(200, 80, 80, 0.3);
}
.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0.6;
}
.del-btn.active {
  opacity: 1;
  background: rgba(200, 80, 80, 0.1);
}
.del-check {
  font-size: 11px;
  margin-right: 4px;
  color: var(--t-accent);
}
.del-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--t-border);
}
.del-count {
  flex: 1;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-muted);
}
.del-confirm {
  padding: 3px 10px;
  background: #c85050;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  font-family: '寒蝉全圆体', var(--font-main);
}
.del-confirm:hover {
  background: #a04040;
}
.del-cancel {
  padding: 3px 10px;
  background: var(--t-surface);
  border: 1px solid var(--t-border);
  border-radius: 4px;
  color: var(--t-muted);
  font-size: 10px;
  cursor: pointer;
  font-family: '寒蝉全圆体', var(--font-main);
}

.info-line {
  font-size: 11px;
  color: var(--t-muted);
  padding: 2px 0;
  line-height: 1.5;
}
.info-label {
  font-family: '寒蝉全圆体', var(--font-main);
  color: var(--t-dim);
  font-size: 10px;
  letter-spacing: 0.5px;
}
.info-value {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px;
  color: var(--t-text);
}
.empty-hint {
  font-family: '寒蝉全圆体', var(--font-main);
  text-align: center;
  font-size: 10px;
  color: var(--t-dim);
  padding: 6px 0;
  letter-spacing: 1px;
}
.info-card {
  background: var(--t-bg);
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius-sm);
  padding: 6px 8px;
}
.nsfw-grid {
  display: flex;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 2px;
  background: var(--t-bg);
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius-sm);
  padding: 6px 8px;
}
.nsfw-cell {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: var(--t-dim);
  letter-spacing: 0.5px;
  b {
    font-family: 'DouyinSans', var(--font-main);
    color: var(--t-text);
    font-weight: 600;
    font-size: 12px;
  }
}

/* 镜渡面板 */
.mirror-item {
  cursor: pointer;
  &:hover {
    border-color: var(--t-accent);
  }
}
.mirror-item .item-name {
  background: linear-gradient(135deg, #6b4a28, #8b5a30, #7a5030, #6b4a28);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}
.mirror-item.mirror-open {
  background: var(--t-accent-dim);
  border-color: var(--t-accent);
}
.mirror-toggle {
  font-size: 8px;
  background: linear-gradient(135deg, #6b4a28, #8b5a30);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 4px;
}
</style>
