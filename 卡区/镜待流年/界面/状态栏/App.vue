<template>
  <div class="status-bar" :class="`theme-${theme}`">
    <div class="master-bar" @click="showAll = !showAll">
      <span class="brand">◈ 镜待流年</span>
      <span class="master-info">{{ timeText }}</span>
      <span class="master-arrow">{{ showAll ? '▾' : '▸' }}</span>
    </div>

    <div v-if="showAll" class="main-body">
      <div class="settings-bar"><button class="gear-btn" @click="showThemes = !showThemes">⚙ 主题</button></div>
      <div v-if="showThemes" class="theme-picker">
        <button v-for="t in themes" :key="t.id" class="theme-dot" :class="{ active: theme === t.id }"
          :style="{ background: t.color }" :title="t.name" @click="theme = t.id"></button>
      </div>
      <div class="time-bar"><i class="fa-solid fa-clock"></i> {{ timeText }}</div>
      <div class="world-loc">🌍 {{ locationFull }}</div>

      <!-- 主角 -->
      <div class="block" :class="{ open: showProtagonist }">
        <div class="block-head" @click="showProtagonist = !showProtagonist">
          <span class="block-title">{{ userName }}</span>
          <span class="block-arrow">{{ showProtagonist ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showProtagonist" class="block-body">
          <div class="stat-row-inline">
            <span class="stat-item">💰 财富 <b>{{ data.主角.财富 }}</b></span>
            <span class="stat-item">⭐ 境界 <b>{{ data.主角.境界 || '凡人' }}</b></span>
          </div>

          <div class="sub-block" :class="{ open: showProtagBasic }">
            <div class="sub-head" @click="showProtagBasic = !showProtagBasic"><span>📋 基本信息</span><span class="block-arrow small">{{ showProtagBasic ? '▾' : '▸' }}</span></div>
            <div v-if="showProtagBasic" class="sub-body">
              <div class="info-card">
              <div class="info-grid">
                <span class="info-cell">性别 <b>{{ data.主角.性别 || '待设定' }}</b></span>
                <span class="info-cell">年龄 <b>{{ data.主角.年龄 || '待设定' }}</b></span>
                <span class="info-cell">种族 <b>{{ data.主角.种族 || '待设定' }}</b></span>
              </div>
              <div class="info-line"><span class="info-label">喜好</span>：<span class="info-value">{{ data.主角.喜好 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">厌恶</span>：<span class="info-value">{{ data.主角.厌恶 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">外貌</span>：<span class="info-value">{{ data.主角.外貌特征 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">体型</span>：<span class="info-value">{{ data.主角.基础体型 || '待设定' }}</span></div>
              <div class="info-line"><span class="info-label">天赋</span>：<span class="info-value">{{ data.主角.天赋能力 || '待设定' }}</span></div>
              </div>
            </div>
          </div>

          <div class="sub-block" :class="{ open: showClothing }">
            <div class="sub-head" @click="showClothing = !showClothing"><span>👕 服装</span><span class="block-arrow small">{{ showClothing ? '▾' : '▸' }}</span></div>
            <div v-if="showClothing" class="sub-body">
              <div class="cloth-list">
                <div v-for="item in protagClothing" :key="item.key">
                  <div class="cloth-row" @click="toggleClothDetail(item.key)">
                    <span class="cloth-key">{{ item.key }}</span>
                    <span class="cloth-val" :class="{ dim: !isSet(item.名称) }">{{ isSet(item.名称) ? item.名称 : '—' }}</span>
                    <span v-if="isSet(item.状态)" class="cloth-status">{{ item.状态 }}</span>
                  </div>
                  <div v-if="clothDetail.has(item.key) && isSet(item.描述)" class="cloth-detail">{{ item.描述 }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="sub-block" :class="{ open: showItems }">
            <div class="sub-head" @click="showItems = !showItems"><span>📦 随身物品</span><span class="block-arrow small">{{ showItems ? '▾' : '▸' }}</span></div>
            <div v-if="showItems" class="sub-body">
              <div v-if="itemEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, item] in itemEntries" :key="name">
                <div class="item-card" :class="{ 'mirror-item': name === '母镜', 'mirror-open': name === '母镜' && mirrorOpen }" @click="name === '母镜' ? mirrorOpen = !mirrorOpen : null">
                  <span class="item-name">{{ name }}</span>
                  <span class="item-desc">{{ item.描述 }}</span>
                  <span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span>
                  <span v-if="name === '母镜'" class="mirror-toggle">{{ mirrorOpen ? '▾' : '▸' }}</span>
                </div>
                <div v-if="name === '母镜' && mirrorOpen" class="mirror-panel" :class="mirrorDir === 'toMe' ? 'theme-red' : 'theme-teal'">
                  <div class="mirror-frame">
                    <div class="frame-ring"></div><div class="frame-inset"></div>
                    <div class="mirror-surface">
                      <div class="mirror-mist mist-1"></div><div class="mirror-mist mist-2"></div>
                      <div class="panel-title">镜 渡</div>
                      <div class="panel-sub">{{ mirrorDir === 'toMe' ? '红颜来此' : '前往彼方' }}</div>
                      <div class="direction-toggle">
                        <button class="toggle-btn" :class="{ active: mirrorDir === 'toMe' }" @click="mirrorDir = 'toMe'">召唤来此</button>
                        <div class="toggle-track" @click="mirrorDir = mirrorDir === 'toMe' ? 'toWorld' : 'toMe'"><div class="toggle-thumb" :class="mirrorDir"></div></div>
                        <button class="toggle-btn" :class="{ active: mirrorDir === 'toWorld' }" @click="mirrorDir = 'toWorld'">前往彼方</button>
                      </div>
                      <button class="btn-random" @click="mxRandom()"><span class="btn-icon">✦</span>随机镜渡</button>
                      <div class="custom-section">
                        <button class="btn-custom-toggle" @click="mxCustom = !mxCustom"><span class="btn-icon">{{ mxCustom ? '▾' : '▸' }}</span>自定义镜渡</button>
                        <div v-if="mxCustom" class="custom-form">
                          <div class="form-row"><label>外貌风格</label><select v-model="mxForm.style"><option value="">随机</option><option>古风</option><option>现代</option><option>异域</option><option>科幻</option><option>哥特</option><option>奇幻</option><option>战损</option></select></div>
                          <div class="form-row"><label>性格特质</label><div class="tag-pool"><span v-for="t in mxTraits" :key="t" class="tag" :class="{ picked: mxForm.traits.includes(t) }" @click="mxToggleTrait(t)">{{ t }}</span></div></div>
                          <div class="form-row"><label>体态身材</label><select v-model="mxForm.bodyType"><option value="">随机</option><option>纤细</option><option>匀称</option><option>丰满</option><option>娇小</option><option>高挑</option><option>健美</option><option>丰腴</option></select></div>
                          <div class="form-row"><label>种族</label><input v-model="mxForm.race" placeholder="随机留空" /></div>
                          <div class="form-row"><label>年龄感</label><select v-model="mxForm.age"><option value="">随机</option><option>少女</option><option>御姐</option><option>成熟</option><option>不老</option><option>幼态</option></select></div>
                          <div class="form-row"><label>来源世界</label><select v-model="mxForm.origin"><option value="">随机/与目的地一致</option><option>主世界</option><option>妖灵位面</option><option>仙道位面</option><option>古代位面</option><option>异世界</option><option>深渊</option><option>同人位面</option><option>幽冥位面</option><option>虚数位面</option></select></div>
                          <div class="form-row"><label>身份地位</label><input v-model="mxForm.role" placeholder="如：剑之圣女、魔界公主…" /></div>
                          <div class="form-row"><label>同人作品</label><input v-model="mxForm.fandom" placeholder="如：哥布林杀手、原神…空则AI原创" /></div>
                          <button class="btn-send" @click="mxCustomSummon()">开启镜渡</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="sub-block" :class="{ open: showRelations }">
            <div class="sub-head" @click="showRelations = !showRelations"><span>👥 人际关系</span><span class="block-arrow small">{{ showRelations ? '▾' : '▸' }}</span></div>
            <div v-if="showRelations" class="sub-body">
              <div v-if="relationEntries.length === 0" class="empty-hint">暂无</div>
              <div v-for="[name, desc] in relationEntries" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ desc }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色名录 -->
      <div class="block" :class="{ open: showChars }">
        <div class="block-head" @click="showChars = !showChars">
          <span class="block-title">角色名录</span>
          <span class="block-sub">{{ allChars.length }}人</span>
          <span class="block-arrow">{{ showChars ? '▾' : '▸' }}</span>
        </div>
        <div v-if="showChars" class="block-body">
          <div v-if="allChars.length === 0" class="empty-hint">暂无角色</div>
          <div v-for="char in allChars" :key="char._key" class="char-entry">
            <div class="char-row" @click="toggleChar(char._key)">
              <span class="char-name">{{ char.name }}</span>
              <span class="char-hearts">{{ loveIcon(char.好感度) }}</span>
              <span class="char-presence" :class="presence(char)">{{ presenceText(char) }}</span>
              <span class="block-arrow small">{{ expandedChars.has(char._key) ? '▾' : '▸' }}</span>
            </div>
            <div v-if="expandedChars.has(char._key)" class="char-detail">
              <div class="stat-row-inline">
                <span class="stat-item">❤️ 好感 <b>{{ char.好感度 }}</b></span>
                <span class="stat-item">💰 财富 <b>{{ char.财富 }}</b></span>
                <span class="stat-item">⭐ 境界 <b>{{ char.境界 || '凡人' }}</b></span>
              </div>

              <div class="sub-block" :class="{ open: sub(char._key+'-basic') }">
                <div class="sub-head" @click="toggleSub(char._key+'-basic')"><span>📋 基本信息</span><span class="block-arrow small">{{ sub(char._key+'-basic') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-basic')" class="sub-body">
                  <div class="info-card">
                  <div class="info-grid">
                    <span class="info-cell">性别 <b>{{ char.性别 || '待设定' }}</b></span>
                    <span class="info-cell">年龄 <b>{{ char.年龄 || '待设定' }}</b></span>
                    <span class="info-cell">种族 <b>{{ char.种族 || '待设定' }}</b></span>
                    <span class="info-cell">来源 <b>{{ char.来源世界 || '待设定' }}</b></span>
                  </div>
                  <div class="info-line"><span class="info-label">喜好</span>：<span class="info-value">{{ char.喜好 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">厌恶</span>：<span class="info-value">{{ char.厌恶 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">外貌</span>：<span class="info-value">{{ char.外貌特征 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">体型</span>：<span class="info-value">{{ char.基础体型 || '待设定' }}</span></div>
                  <div class="info-line"><span class="info-label">天赋</span>：<span class="info-value">{{ char.天赋能力 || '待设定' }}</span></div>
                  </div>
                </div>
              </div>

              <div class="sub-block" :class="{ open: sub(char._key+'-cloth') }">
                <div class="sub-head" @click="toggleSub(char._key+'-cloth')"><span>👕 服装</span><span class="block-arrow small">{{ sub(char._key+'-cloth') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-cloth')" class="sub-body">
                  <div class="cloth-list">
                    <div v-for="ci in getCharClothing(char)" :key="ci.key">
                      <div class="cloth-row" @click="toggleClothDetail(char._key+'-'+ci.key)">
                        <span class="cloth-key">{{ ci.key }}</span>
                        <span class="cloth-val" :class="{ dim: !isSet(ci.名称) }">{{ isSet(ci.名称) ? ci.名称 : '—' }}</span>
                        <span v-if="isSet(ci.状态)" class="cloth-status">{{ ci.状态 }}</span>
                      </div>
                      <div v-if="clothDetail.has(char._key+'-'+ci.key) && isSet(ci.描述)" class="cloth-detail">{{ ci.描述 }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key+'-items') }">
                <div class="sub-head" @click="toggleSub(char._key+'-items')"><span>📦 随身物品</span><span class="block-arrow small">{{ sub(char._key+'-items') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-items')" class="sub-body">
                  <div v-if="getCharItems(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, item] in getCharItems(char)" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ item.描述 }}</span><span v-if="item.数量" class="item-qty">×{{ item.数量 }}</span></div>
                </div>
              </div>
              <div class="sub-block" :class="{ open: sub(char._key+'-rel') }">
                <div class="sub-head" @click="toggleSub(char._key+'-rel')"><span>👥 人际关系</span><span class="block-arrow small">{{ sub(char._key+'-rel') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-rel')" class="sub-body">
                  <div v-if="getCharRelations(char).length === 0" class="empty-hint">暂无</div>
                  <div v-for="[name, desc] in getCharRelations(char)" :key="name" class="item-card"><span class="item-name">{{ name }}</span><span class="item-desc">{{ desc }}</span></div>
                </div>
              </div>
              <div v-if="char.nsfw档案" class="sub-block" :class="{ open: sub(char._key+'-nsfw') }">
                <div class="sub-head" @click="toggleSub(char._key+'-nsfw')"><span>🔞 NSFW 档案</span><span class="block-arrow small">{{ sub(char._key+'-nsfw') ? '▾' : '▸' }}</span></div>
                <div v-if="sub(char._key+'-nsfw')" class="sub-body">
                  <div class="nsfw-grid">
                    <span class="nsfw-cell">初次 <b>{{ char.nsfw档案.初次存在与否 ? '存在' : '不存在' }}</b></span>
                    <span class="nsfw-cell">性对象 <b>{{ char.nsfw档案.性对象 || '无' }}</b></span>
                    <span class="nsfw-cell">怀孕 <b>{{ char.nsfw档案.是否怀孕 ? '是' : '否' }}</b></span>
                    <span class="nsfw-cell">子嗣 <b>{{ char.nsfw档案.子嗣列表 || '无' }}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useDataStore } from './store';

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
const theme = ref('cream');
const mirrorOpen = ref(false);
const mirrorDir = ref<'toMe' | 'toWorld'>('toMe');
const mxCustom = ref(false);
const mxTraits = ['傲娇','温柔','冷淡','活泼','腹黑','天然','病娇','慵懒','忠犬','高冷','毒舌','元气','邪魅','偏执','纯真'];
const mxForm = reactive({ style: '', traits: [] as string[], bodyType: '', race: '', age: '', origin: '', role: '', fandom: '' });
function mxToggleTrait(t: string) { const i = mxForm.traits.indexOf(t); if (i >= 0) mxForm.traits.splice(i, 1); else mxForm.traits.push(t); }
function mxSend(msg: string) { const $p = (window as any).parent?.$; if (!$p) return; $p('#send_textarea').val(msg).trigger('input'); setTimeout(() => $p('#send_but').trigger('click'), 50); mirrorOpen.value = false; mxCustom.value = false; }
function mxRandom() { mxSend(mirrorDir.value === 'toMe' ? '使用母镜随机召唤一位红颜来到身边' : '使用母镜前往一位随机红颜所在的世界'); }
function mxCustomSummon() {
  const parts: string[] = []; const s: string[] = []; const d = mxForm;
  if (mirrorDir.value === 'toMe') parts.push('使用母镜召唤一位红颜来到身边'); else parts.push('使用母镜前往一位红颜所在的世界');
  if (d.style) s.push(d.style + '风'); if (d.traits.length) s.push('性格' + d.traits.join('、')); if (d.bodyType) s.push('体态' + d.bodyType); if (d.race) s.push('种族：' + d.race); if (d.age) s.push(d.age); if (d.origin) s.push('来自' + d.origin); if (d.role) s.push('身份：' + d.role); if (d.fandom) s.push('出自《' + d.fandom + '》');
  if (s.length) parts.push(s.join('；'));
  mxSend(parts.filter(Boolean).join('，'));
}
const expandedChars = ref(new Set<string>());
const expandedSubs = ref(new Set<string>());
const clothDetail = ref(new Set<string>());
function toggleClothDetail(k: string) { const s = new Set(clothDetail.value); s.has(k) ? s.delete(k) : s.add(k); clothDetail.value = s; }

const themes = [
  { id: 'cream', name: '米白', color: '#d4c8b6' },
  { id: 'purple', name: '墨紫', color: '#7b5ea7' },
  { id: 'gold', name: '暖金', color: '#c9a96e' },
  { id: 'teal', name: '青黛', color: '#5ea0a7' },
  { id: 'rose', name: '绯红', color: '#c47b8b' },
] as const;

const userName = computed(() => {
  try { return (window as any).parent?.SillyTavern?.getContext?.()?.name1 || '{{user}}'; }
  catch { return '{{user}}'; }
});
const timeText = computed(() => isSet(data.value.世界.当前时间) ? data.value.世界.当前时间 : '序章');
const locationFull = computed(() => {
  const loc = data.value.世界.当前地点;
  const parts = [loc.位面, loc.大陆, loc.城市, loc.区域, loc.具体位置].filter(v => v && v !== '待设定');
  return parts.length > 0 ? parts.join(' · ') : '';
});

function isSet(v: unknown): boolean { return !!v && v !== '待设定' && v !== '待設定'; }
function loveIcon(val: number): string {
  if (val >= 100) return '💖';
  if (val >= 80) return '❤️❤️❤️❤️❤️';
  if (val >= 60) return '❤️❤️❤️❤️';
  if (val >= 40) return '❤️❤️❤️';
  if (val >= 20) return '❤️❤️';
  if (val >= 1) return '❤️';
  return '🤍';
}
function toggleChar(k: string) { const s = new Set(expandedChars.value); s.has(k) ? s.delete(k) : s.add(k); expandedChars.value = s; }
function sub(k: string) { return expandedSubs.value.has(k); }
function toggleSub(k: string) { const s = new Set(expandedSubs.value); s.has(k) ? s.delete(k) : s.add(k); expandedSubs.value = s; }

const protagClothing = computed(() => {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = data.value.主角.服装 || {};
  return ['上衣','内衣','下装','内裤','袜子','鞋子'].filter(k => c[k] !== undefined).map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
});
const itemEntries = computed(() => Object.entries(data.value.主角.随身物品 || {}) as [string, { 描述?: string; 数量?: number }][]);
const relationEntries = computed(() => Object.entries(data.value.主角.人际关系 || {}) as [string, string][]);

type CharInfo = {
  性别?: string; 年龄?: number; 种族?: string; 来源世界?: string;
  喜好?: string; 厌恶?: string; 外貌特征?: string; 基础体型?: string; 天赋能力?: string;
  好感度?: number; 财富?: number; 境界?: string; 所在位置?: string;
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>; 随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: { 初次存在与否?: boolean; 性对象?: string; 是否怀孕?: boolean; 子嗣列表?: string };
};
interface NearbyChar {
  _key: string; name: string;
  性别?: string; 年龄?: number; 种族?: string; 来源世界?: string;
  喜好?: string; 厌恶?: string; 外貌特征?: string; 基础体型?: string; 天赋能力?: string;
  好感度: number; 财富?: number; 境界?: string; 所在位置?: string;
  服装?: Record<string, { 名称?: string; 描述?: string; 状态?: string }>; 随身物品?: Record<string, { 描述?: string; 数量?: number }>;
  人际关系?: Record<string, string>;
  nsfw档案?: { 初次存在与否?: boolean; 性对象?: string; 是否怀孕?: boolean; 子嗣列表?: string };
}

function presOrder(p: string): number { return p === 'present' ? 0 : p === 'nearby' ? 1 : 2; }

const allChars = computed<NearbyChar[]>(() => {
  const chars: NearbyChar[] = [];
  const rec = (data.value as any).角色名录 || {};
  for (const [name, info] of Object.entries(rec as Record<string, CharInfo | undefined>)) {
    if (info) chars.push({ _key: name, name, 好感度: info.好感度 ?? 0, ...info });
  }
  chars.sort((a, b) => {
    const pa = presOrder(presence(a));
    const pb = presOrder(presence(b));
    if (pa !== pb) return pa - pb;
    return b.好感度 - a.好感度;
  });
  return chars;
});

function presence(char: NearbyChar): string {
  const here = data.value.世界.当前地点.具体位置;
  const charLoc: string = char.所在位置 || '';
  if (!isSet(here) || !isSet(charLoc)) return 'absent';
  if (charLoc === here || charLoc.includes(here) || here.includes(charLoc)) return 'present';
  if (isSet(data.value.世界.当前地点.城市) && charLoc.includes(data.value.世界.当前地点.城市)) return 'nearby';
  return 'absent';
}
function presenceText(char: NearbyChar): string {
  const c = presence(char); return c === 'present' ? '在场' : c === 'nearby' ? '附近' : '不在';
}
function getCharClothing(char: NearbyChar): { key: string; 名称: string; 描述: string; 状态: string }[] {
  const c: Record<string, { 名称?: string; 描述?: string; 状态?: string }> = char.服装 || {};
  return ['上衣','内衣','下装','内裤','袜子','鞋子'].filter(k => c[k] !== undefined).map(k => ({ key: k, 名称: c[k]?.名称 || '', 描述: c[k]?.描述 || '', 状态: c[k]?.状态 || '' }));
}
function getCharItems(char: NearbyChar): [string, { 描述?: string; 数量?: number }][] { return Object.entries(char.随身物品 || {}); }
function getCharRelations(char: NearbyChar): [string, string][] { return Object.entries(char.人际关系 || {}); }
</script>

<style lang="scss" scoped>
@import url("https://fontsapi.zeoseven.com/3/main/result.css");
@import url("https://fontsapi.zeoseven.com/84/main/result.css");
.status-bar {
  --t-bg: #faf7f0; --t-surface: #f5f0e8; --t-surface-open: #ede6d8; --t-surface-deep: #e8e0d0;
  --t-border: rgba(0,0,0,0.08); --t-accent: #8b7355; --t-accent-dim: rgba(139,115,85,0.15);
  --t-gold: #a08060; --t-text: #4a4035; --t-muted: #8a7e6e; --t-dim: #b8a898;
  --t-stripe: rgba(139,115,85,0.25); --t-mist: rgba(139,115,85,0.03);
  --t-radius: 10px; --t-radius-sm: 6px;
  --g-nav: linear-gradient(135deg, #d4d4dc, #b0b4bc, #8a8e98, #686c78);
  --g-loc: linear-gradient(135deg, #a0cce8, #78b0d4, #5a90b8, #3a6e98, #285880);
  --g-label: linear-gradient(135deg, #e8d8b0, #d4c490, #b8a470, #a08858, #8a7048);
  --g-sec: linear-gradient(135deg, #e8d0a8, #d4ba90, #b89868, #a07850, #886838);
  --g-sub: linear-gradient(135deg, #98d8d8, #6ebebe, #4a9e9e, #307878, #206060);
  --g-desc: linear-gradient(135deg, #e0e0e6, #c0c4cc, #989ca8, #707480, #585c68);
  --g-val: linear-gradient(135deg, #b8d8f0, #88bce0, #5a90c0, #3a68a0, #285080);
  --g-keep: inherit;
  width: 100%; max-width: 420px; margin: 0 auto;
  background: var(--t-bg); color: var(--t-text);
  font-family: var(--font-main); font-size: 12px; line-height: 1.6;
  user-select: none; border-radius: var(--t-radius); overflow: hidden;

  &.theme-purple {
    --t-bg:#1e1a24; --t-surface:#252131; --t-surface-open:#2d2838; --t-surface-deep:#1f1c26;
    --t-border:rgba(255,255,255,0.06); --t-accent:#9b7ec4; --t-accent-dim:rgba(155,126,196,0.25);
    --t-gold:#b8a0d4; --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(155,126,196,0.3); --t-mist:rgba(155,126,196,0.02);
  }
  &.theme-gold {
    --t-accent:#c9a96e; --t-accent-dim:rgba(201,169,110,0.25); --t-gold:#d4b878;
    --t-surface:#25221c; --t-surface-open:#2d2922; --t-bg:#1e1c17; --t-surface-deep:#1d1b16;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(201,169,110,0.3); --t-mist:rgba(201,169,110,0.02);
  }
  &.theme-teal {
    --t-accent:#5ea0a7; --t-accent-dim:rgba(94,160,167,0.25); --t-gold:#6eb8bf;
    --t-surface:#1c2325; --t-surface-open:#222b2d; --t-bg:#171e20; --t-surface-deep:#161d1e;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(94,160,167,0.3); --t-mist:rgba(94,160,167,0.02);
  }
  &.theme-rose {
    --t-accent:#c47b8b; --t-accent-dim:rgba(196,123,139,0.25); --t-gold:#d08b99;
    --t-surface:#251c1f; --t-surface-open:#2d2225; --t-bg:#1e181a; --t-surface-deep:#1c1719;
    --t-border:rgba(255,255,255,0.06); --t-text:#d4cee0; --t-muted:#867e95; --t-dim:#5c5668;
    --t-stripe:rgba(196,123,139,0.3); --t-mist:rgba(196,123,139,0.02);
  }
}
.master-bar { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; background:var(--t-surface); position:relative; overflow:hidden;
  &::after { content:''; position:absolute; top:-50%; right:-20%; width:160px; height:120px; border-radius:50%; background:var(--t-accent); opacity:0.03; filter:blur(30px); pointer-events:none; }
  &:hover { background:var(--t-surface-open); } }
.master-info { font-family: '寒蝉全圆体', var(--font-main); flex:1; font-size:10px; color:var(--t-gold); letter-spacing:0.5px; position:relative; z-index:1; }
.master-arrow { font-size:10px; color:var(--t-dim); position:relative; z-index:1; }
.brand { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; letter-spacing:2px; color:var(--t-accent); font-weight:600; position:relative; z-index:1; }
.main-body { border-top:1px solid var(--t-border); position:relative; }
.main-body::before { content:''; position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(ellipse at 50% 0%, var(--t-mist) 0%, transparent 70%),
             radial-gradient(ellipse at 85% 100%, var(--t-mist) 0%, transparent 50%);
  z-index:0; }
.settings-bar { display:flex; justify-content:flex-end; padding:4px 12px; background:var(--t-surface); border-bottom:1px solid var(--t-border); }
.gear-btn { background:none; border:none; color:var(--t-muted); cursor:pointer; font-size:10px; padding:2px 6px; border-radius:var(--t-radius-sm); letter-spacing:0.5px;
  &:hover { color:var(--t-accent); background:var(--t-accent-dim); } }
.theme-picker { display:flex; gap:8px; padding:5px 12px; background:var(--t-surface); border-bottom:1px solid var(--t-border); }
.theme-dot { width:18px; height:18px; border-radius:50%; border:2px solid transparent; cursor:pointer; transition:all 0.2s;
  &.active { border-color:var(--t-text); transform:scale(1.2); } &:hover { transform:scale(1.15); } }
.time-bar { font-family: '寒蝉全圆体', var(--font-main); padding:10px 14px 2px; font-size:14px; font-weight:700; color:var(--t-gold); letter-spacing:1px; background:var(--t-bg); }
.world-loc { font-family: 'DouyinSans', var(--font-main); padding:2px 14px 6px; font-size:10px; color:var(--t-muted); background:var(--t-bg); }

.stat-row-inline { display:flex; flex-wrap:wrap; gap:10px; padding:4px 0 6px; }
.stat-item { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:1px; b { font-family: 'DouyinSans', var(--font-main); font-size:12px; color:var(--t-text); } }

.block { margin:0 8px 6px; border-radius:var(--t-radius); background:var(--t-surface); box-shadow:0 0 0 1px var(--t-border); overflow:hidden; position:relative; z-index:1;
  &.open { background:var(--t-surface-open); } }
.block-head { display:flex; align-items:center; gap:6px; padding:8px 12px; cursor:pointer; border-left:2px solid var(--t-stripe); transition:all 0.15s;
  &:hover { background:rgba(0,0,0,0.04); border-left-color:var(--t-accent); } }
.block-title { font-family: '寒蝉全圆体', var(--font-main); font-weight:600; font-size:12px; color:var(--t-accent); letter-spacing:0.5px; }
.block-sub { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-muted); flex:1; text-align:right; margin-right:4px; }
.block-arrow { font-size:9px; color:var(--t-dim); margin-left:auto; &.small { font-size:8px; } }
.block-body { padding:0 12px 10px; position:relative; z-index:1; }

.sub-block { margin-top:5px; border-radius:var(--t-radius-sm); background:var(--t-surface-deep); box-shadow:0 0 0 1px var(--t-border); overflow:hidden; position:relative; z-index:1;
  &.open { background:var(--t-surface); } }
.sub-head { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; cursor:pointer; font-size:11px; color:var(--t-muted); border-left:2px solid var(--t-stripe); transition:all 0.15s; font-family: '寒蝉全圆体', var(--font-main); letter-spacing:1px;
  &:hover { background:rgba(0,0,0,0.05); color:var(--t-text); border-left-color:var(--t-accent); } }
.sub-body { padding:6px 10px 8px; }

.cloth-list { display:flex; flex-direction:column; gap:3px; }
.cloth-row { display:flex; align-items:center; gap:8px; padding:4px 8px; background:var(--t-bg); box-shadow:0 0 0 1px var(--t-border); border-radius:var(--t-radius-sm); cursor:pointer; transition:background 0.15s;
  &:hover { background:var(--t-surface-deep); } }
.cloth-key { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; color:var(--t-dim); letter-spacing:1px; min-width:28px; text-transform:uppercase; font-weight:500; }
.cloth-val { font-family: 'DouyinSans', var(--font-main); font-size:11px; color:var(--t-text); flex:1; &.dim { color:var(--t-dim); } }
.cloth-status { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; color:var(--t-accent); background:var(--t-accent-dim); padding:1px 8px; border-radius:9999px; font-weight:500; letter-spacing:0.5px; }
.cloth-detail { font-family: 'DouyinSans', var(--font-main); font-size:10px; color:var(--t-muted); padding:2px 8px 4px 36px; line-height:1.5; }

.info-grid { display:flex; flex-wrap:wrap; column-gap:10px; row-gap:2px; padding:2px 0; }
.info-cell { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:0.5px; b { font-family: 'DouyinSans', var(--font-main); color:var(--t-text); font-weight:600; font-size:12px; } }

.item-card { display:flex; align-items:center; gap:6px; padding:4px 6px; border-radius:var(--t-radius-sm); background:var(--t-bg); border:1px solid var(--t-border); margin-bottom:3px; }
.item-name { font-family: 'DouyinSans', var(--font-main); font-size:11px; font-weight:600; color:var(--t-accent); white-space:nowrap; }
.item-desc { font-family: 'DouyinSans', var(--font-main); font-size:10px; color:var(--t-muted); flex:1; }
.item-qty { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-gold); font-weight:600; }

.char-entry { margin-top:4px; }
.char-row { display:flex; align-items:center; gap:6px; padding:6px 8px; cursor:pointer; border-radius:var(--t-radius-sm); background:var(--t-surface); border:1px solid var(--t-border);
  &:hover { background:var(--t-surface-open); } }
.char-name { font-family: 'DouyinSans', var(--font-main); font-weight:600; font-size:12px; color:var(--t-accent); }
.char-hearts { color:#e07080; font-size:12px; min-width:36px; }
.char-presence { font-family: '寒蝉全圆体', var(--font-main); font-size:8px; margin-left:auto; padding:1px 8px; border-radius:9999px; font-weight:500; letter-spacing:0.5px;
  &.present { color:#4a7a4a; background:rgba(100,160,100,0.12); }
  &.nearby { color:#8a6a20; background:rgba(200,160,60,0.12); }
  &.absent { color:var(--t-dim); background:rgba(128,128,128,0.08); } }
.char-row .block-arrow { margin-left:4px; }
.char-detail { padding:8px 4px 4px; }

.info-line { font-size:11px; color:var(--t-muted); padding:2px 0; line-height:1.5; }
.info-label { font-family: '寒蝉全圆体', var(--font-main); color:var(--t-dim); font-size:10px; letter-spacing:0.5px; }
.info-value { font-family: 'DouyinSans', var(--font-main); font-size:11px; color:var(--t-text); }
.empty-hint { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:10px; color:var(--t-dim); padding:6px 0; letter-spacing:1px; }
.info-card { background:var(--t-bg); border:1px solid var(--t-border); border-radius:var(--t-radius-sm); padding:6px 8px; }
.nsfw-grid { display:flex; flex-wrap:wrap; column-gap:10px; row-gap:2px; background:var(--t-bg); border:1px solid var(--t-border); border-radius:var(--t-radius-sm); padding:6px 8px; }
.nsfw-cell { font-family: '寒蝉全圆体', var(--font-main); font-size:10px; color:var(--t-dim); letter-spacing:0.5px; b { font-family: 'DouyinSans', var(--font-main); color:var(--t-text); font-weight:600; font-size:12px; } }

/* 镜渡面板 */
.mirror-item { cursor:pointer; &:hover { border-color: var(--t-accent); } }
.mirror-item.mirror-open { background: var(--t-accent-dim); border-color: var(--t-accent); }
.mirror-toggle { font-size:8px; color:var(--t-accent); margin-left:4px; }
.mirror-panel {
  --m-accent: #c9a96e; --m-accent-dim: rgba(201,169,110,0.2); --m-glow: rgba(201,169,110,0.1);
  --m-surface: linear-gradient(165deg, #f5ede0 0%, #ede4d4 40%, #f0e8d8 100%);
  --m-text: #4a4035; --m-muted: #8a7e6e; --m-dim: #b8a898;
  --m-rose: #c47b8b; --m-rose-dim: rgba(196,123,139,0.2);
  --m-teal: #5ea0a7; --m-teal-dim: rgba(94,160,167,0.18);
  padding:4px 0 6px;
  &.theme-red { --m-accent: var(--m-rose); --m-accent-dim: var(--m-rose-dim); }
  &.theme-teal { --m-accent: var(--m-teal); --m-accent-dim: var(--m-teal-dim); }
}
.mirror-frame {
  position:relative; border-radius:12px; padding:4px;
  background:linear-gradient(145deg,#8b7355,#6b5a48 25%,#c9a96e 50%,#6b5a48 75%,#8b7355);
  box-shadow:0 0 24px rgba(201,169,110,0.15);
}
.frame-ring,.frame-inset { position:absolute; border-radius:10px; border:1px solid rgba(201,169,110,0.25); pointer-events:none; }
.frame-ring { inset:4px; }
.frame-inset { inset:8px; border-color:rgba(201,169,110,0.1); }
.mirror-surface {
  position:relative; z-index:1; border-radius:9px; padding:14px 12px 10px;
  background:var(--m-surface); overflow:hidden;
  &::before {
    content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; z-index:0; pointer-events:none;
    background:radial-gradient(circle at center, rgba(201,169,110,0.08) 0%, transparent 40%);
    animation: mirrorGlow 3s ease-in-out infinite;
  }
}
@keyframes mirrorGlow {
  0%,100% { transform:scale(1); opacity:0.6; }
  50% { transform:scale(1.15); opacity:1; }
}
.mirror-mist { position:absolute; border-radius:50%; filter:blur(35px); pointer-events:none; }
.mist-1 { width:120px; height:70px; background:#c9a96e; opacity:0.08; top:-20px; right:-25px; }
.mist-2 { width:90px; height:60px; background:#8b7355; opacity:0.06; bottom:5px; left:-15px; }
.panel-title { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:18px; font-weight:700; letter-spacing:6px; position:relative; z-index:1;
  background:linear-gradient(135deg, #8b7355 0%, #c9a96e 40%, #e0c888 60%, #c9a96e 80%, #8b7355 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.panel-sub { font-family: '寒蝉全圆体', var(--font-main); text-align:center; font-size:9px; color:var(--m-accent); letter-spacing:2px; margin-bottom:8px; position:relative; z-index:1; }
.direction-toggle { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:8px; position:relative; z-index:1; }
.toggle-btn { background:none; border:none; font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-muted); cursor:pointer; letter-spacing:1px; padding:2px 4px; transition:color 0.2s;
  &.active { color:var(--m-accent); font-weight:600; } }
.toggle-track { width:30px; height:16px; background:rgba(139,115,85,0.12); border-radius:8px; cursor:pointer; position:relative; }
.toggle-thumb { width:12px; height:12px; border-radius:50%; background:var(--m-accent); position:absolute; top:2px; left:2px; transition:left 0.25s;
  &.toWorld { left:16px; } }
.btn-random { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:10px 0; margin-bottom:6px; background:var(--m-accent-dim); border:1px solid var(--m-accent); border-radius:8px; cursor:pointer; position:relative; z-index:1; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:12px; font-weight:600; letter-spacing:3px; transition:all 0.2s;
  &:hover { background:var(--m-accent); color:#fff; } }
.btn-icon { font-size:10px; }
.btn-custom-toggle { display:flex; align-items:center; gap:6px; width:100%; padding:7px 0; background:none; border:1px dashed var(--m-accent-dim); border-radius:8px; cursor:pointer; color:var(--m-accent); font-family: '寒蝉全圆体', var(--font-main); font-size:10px; letter-spacing:2px; transition:all 0.2s; position:relative; z-index:1;
  &:hover { border-color:var(--m-accent); border-style:solid; } }
.custom-form { display:flex; flex-direction:column; gap:5px; margin-top:6px; padding:10px; background:rgba(139,115,85,0.04); border:1px solid rgba(139,115,85,0.1); border-radius:8px; }
.form-row { display:flex; flex-direction:column; gap:3px;
  label { font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-muted); letter-spacing:1px; }
  select,input { padding:5px 8px; border-radius:6px; border:1px solid rgba(139,115,85,0.15); background:rgba(255,255,255,0.6); color:var(--m-text); font-family: 'DouyinSans', var(--font-main); font-size:10px; outline:none;
    &:focus { border-color:var(--m-accent); } } }
.tag-pool { display:flex; flex-wrap:wrap; gap:4px; }
.tag { padding:2px 8px; border-radius:10px; border:1px solid rgba(139,115,85,0.15); font-family: '寒蝉全圆体', var(--font-main); font-size:9px; color:var(--m-muted); cursor:pointer; transition:all 0.12s;
  &:hover { border-color:var(--m-accent); color:var(--m-accent); }
  &.picked { background:var(--m-accent-dim); border-color:var(--m-accent); color:var(--m-accent); font-weight:600; } }
.btn-send { width:100%; padding:8px 0; margin-top:4px; background:var(--m-accent); border:none; border-radius:8px; cursor:pointer; color:#fff; font-family: '寒蝉全圆体', var(--font-main); font-size:12px; font-weight:700; letter-spacing:4px; transition:opacity 0.2s;
  &:hover { opacity:0.85; } }
</style>
