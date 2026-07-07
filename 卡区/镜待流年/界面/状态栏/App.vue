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
                  :class="{ 'mirror-item': name.includes('母镜'), 'mirror-open': name.includes('母镜') && mirrorOpen, 'bestiary-item': name.includes('万象图鉴') }"
                  @click="name.includes('母镜') ? (mirrorOpen = !mirrorOpen) : name.includes('万象图鉴') ? (bestiaryOpen = !bestiaryOpen) : (expandedItems[name] = !expandedItems[name])"
                >
                  <span class="item-name item-shimmer" :style="{ background: `linear-gradient(135deg, ${tierGradient(item.等级 || '')})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }">{{ name }}</span>
                  <span class="item-tier">[{{ item.等级 || '未评级' }}]</span>
                  <span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                  <span v-if="name.includes('母镜')" class="mirror-toggle">{{ mirrorOpen ? '▾' : '▸' }}</span>
                  <span v-else-if="name.includes('万象图鉴')" class="mirror-toggle">{{ bestiaryOpen ? '▾' : '▸' }}</span>
                  <span v-else class="item-expand">{{ expandedItems[name] ? '▾' : '▸' }}</span>
                </div>
                <div v-if="expandedItems[name] && (item.描述 || (item.能力 && item.能力 !== '无'))" class="item-detail"><div v-if="item.描述"><span class="item-detail-label">描述</span>{{ item.描述 }}</div><div v-if="item.能力 && item.能力 !== '无'" style="padding-top:3px;margin-top:3px;border-top:1px solid var(--t-border)"><span class="item-detail-label">能力</span>{{ item.能力 }}</div></div>
                <MirrorPanel v-if="name.includes('母镜')" v-show="mirrorOpen" @close="mirrorOpen = false" />
              </div>
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
                  <div v-for="[name, item] in getCharItems(char)" :key="name">
                    <div class="item-card" @click="expandedItems[char._key + '-' + name] = !expandedItems[char._key + '-' + name]">
                      <span class="item-name item-shimmer" :style="{ background: `linear-gradient(135deg, ${tierGradient(item.等级 || '')})`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }">{{ name }}</span>
                      <span class="item-tier">[{{ item.等级 || '未评级' }}]</span>
                      <span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                      <span class="item-expand">{{ expandedItems[char._key + '-' + name] ? '▾' : '▸' }}</span>
                    </div>
                    <div v-if="expandedItems[char._key + '-' + name] && (item.描述 || (item.能力 && item.能力 !== '无'))" class="item-detail"><div v-if="item.描述"><span class="item-detail-label">描述</span>{{ item.描述 }}</div><div v-if="item.能力 && item.能力 !== '无'" style="padding-top:3px;margin-top:3px;border-top:1px solid var(--t-border)"><span class="item-detail-label">能力</span>{{ item.能力 }}</div></div>
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
    <BestiaryPanel v-if="bestiaryOpen" @close="bestiaryOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDataStore } from './store';
import MirrorPanel from '../shared/MirrorPanel.vue';
import BestiaryPanel from '../shared/BestiaryPanel.vue';

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
const bestiaryOpen = ref(false);

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
function tierGradient(tier: string): string {
  const map: Record<string, string> = {
    残破: '#444,#666,#555,#777,#666,#555,#444',
    普通: '#b0b0b0,#d0d0d0,#c8c8c8,#e0e0e0,#d0d0d0,#c8c8c8,#b0b0b0',
    精良: '#2e7d32,#4caf50,#43a047,#66bb6a,#4caf50,#43a047,#2e7d32',
    优秀: '#0d47a1,#1976d2,#1565c0,#42a5f5,#1e88e5,#1565c0,#0d47a1',
    稀有: '#4a148c,#7b1fa2,#6a1b9a,#ab47bc,#8e24aa,#6a1b9a,#4a148c',
    史诗: '#f06292,#f48fb1,#fce4ec,#f8bbd0,#f48fb1,#ec407a,#f06292',
    传说: '#fbc02d,#ffee58,#fff9c4,#fff176,#ffee58,#fdd835,#fbc02d',
    神话: '#e65100,#ff9800,#ffe0b2,#ffcc80,#ff9800,#f57c00,#e65100',
    不朽: '#7f0000,#c62828,#b71c1c,#f44336,#e53935,#b71c1c,#7f0000',
    唯一: '#7c4dff,#448aff,#00b0ff,#00e5ff,#76ff03,#ffea00,#ff6d00,#f06292,#ff6d00,#ffea00,#76ff03,#00e5ff,#00b0ff,#448aff,#7c4dff',
  };
  return map[tier] || '#888,#777,#666,#555,#444';
}
const expandedItems = ref<Record<string, boolean>>({});

const tierOrder: Record<string, number> = { 唯一: 10, 不朽: 9, 神话: 8, 传说: 7, 史诗: 6, 稀有: 5, 优秀: 4, 精良: 3, 普通: 2, 残破: 1 };
const itemEntries = computed(() => {
  const items = { ...(data.value.主角.随身物品 || {}) };
  if (!items['万象图鉴']) items['万象图鉴'] = { 等级: '特殊', 描述: '记录了旅途中所遇生灵', 数量: 1 };
  const entries = Object.entries(items) as [string, { 描述?: string; 数量?: number; 等级?: string; 能力?: string }][];
  return entries.sort((a, b) => (tierOrder[b[1].等级 || ''] || 0) - (tierOrder[a[1].等级 || ''] || 0));
});
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
  随身物品?: Record<string, { 描述?: string; 数量?: number; 等级?: string; 能力?: string }>;
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
  随身物品?: Record<string, { 描述?: string; 数量?: number; 等级?: string; 能力?: string }>;
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
function getCharItems(char: NearbyChar): [string, { 描述?: string; 数量?: number; 等级?: string; 能力?: string }][] {
  const entries = Object.entries(char.随身物品 || {});
  return entries.sort((a, b) => (tierOrder[b[1].等级 || ''] || 0) - (tierOrder[a[1].等级 || ''] || 0));
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
@keyframes item-shimmer{0%{background-position:0% center}100%{background-position:200% center}}
.item-shimmer{animation:item-shimmer 4s linear infinite}
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
.item-tier {
  font-size: 9px;
  color: var(--t-muted);
  white-space: nowrap;
}
.item-expand {
  font-size: 8px;
  color: var(--t-muted);
  cursor: pointer;
  margin-left: auto;
}
.item-detail {
  font-size: 10px;
  color: var(--t-muted);
  padding: 2px 8px 4px 8px;
  margin-bottom: 3px;
  line-height: 1.4;
}
.item-detail-label {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 9px;
  color: var(--t-dim);
  margin-right: 6px;
  letter-spacing: 0.5px;
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
  animation: mirror-glow 3s ease-in-out infinite;
  &:hover {
    border-color: var(--t-accent);
    animation: none;
    box-shadow: 0 0 6px rgba(180,140,100,0.4);
  }
}
@keyframes mirror-glow {
  0%, 100% { box-shadow: 0 0 3px rgba(180,140,100,0.3); border-color: rgba(180,140,100,0.1); }
  50% { box-shadow: 0 0 14px rgba(180,140,100,0.5), 0 0 28px rgba(180,140,100,0.15); border-color: rgba(180,140,100,0.35); }
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
  margin-left: auto;
  background: linear-gradient(135deg, #6b4a28, #8b5a30);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 4px;
}
.bestiary-item {
  cursor: pointer;
  animation: bestiary-glow 3s ease-in-out infinite;
  &:hover {
    border-color: var(--t-accent);
    animation: none;
    box-shadow: 0 0 6px rgba(100,180,160,0.4);
  }
}
@keyframes bestiary-glow {
  0%, 100% { box-shadow: 0 0 3px rgba(100,180,160,0.3); border-color: rgba(100,180,160,0.1); }
  50% { box-shadow: 0 0 14px rgba(100,180,160,0.5), 0 0 28px rgba(100,180,160,0.15); border-color: rgba(100,180,160,0.35); }
}
</style>
