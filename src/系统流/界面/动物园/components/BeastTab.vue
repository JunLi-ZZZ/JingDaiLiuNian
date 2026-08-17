<template>
  <div class="beasts">
    <div v-if="名单.length === 0" class="empty">园中暂无兽员，去「召唤」抽第一只吧</div>
    <div class="beast-grid">
      <div
        v-for="b in 名单"
        :key="b.名称"
        class="flip-card"
        :class="{ flipped: 翻开 === b.名称 }"
        :style="tierVars(b.品阶)"
        @click="翻开 = 翻开 === b.名称 ? '' : b.名称"
      >
        <div class="flip-inner">
          <!-- 正面：兽形 -->
          <div class="face front">
            <div class="portrait">
              <img v-if="b.立绘兽形" :src="b.立绘兽形" :alt="b.名称" />
              <i v-else :class="catMeta(b.类别).icon" :style="{ color: catMeta(b.类别).color }"></i>
              <span class="rate"><i class="fa-solid fa-sparkles"></i>{{ b.产率 }}/时</span>
            </div>
            <div class="f-info">
              <div class="f-name-row">
                <span class="f-name">{{ b.名称 }}</span>
                <span class="f-cat" :style="{ color: catMeta(b.类别).color }">{{ b.类别 }}</span>
              </div>
              <div class="f-tags">
                <TierTag :品阶="b.品阶" />
                <span class="f-race">{{ b.种族 }}</span>
              </div>
              <p class="f-desc">{{ b.兽形 }}</p>
              <span class="flip-hint"><i class="fa-solid fa-rotate"></i>点击翻面看兽娘形态</span>
            </div>
          </div>
          <!-- 背面：兽娘 -->
          <div class="face back">
            <div class="b-head">
              <span v-if="改名中 !== b.名称" class="f-name name-edit" title="点击改名" @click.stop="开始改名(b.名称)">
                {{ b.名称 }}<i class="fa-solid fa-pen"></i>
              </span>
              <input
                v-else
                ref="改名框"
                class="name-input"
                v-model="新名字"
                maxlength="12"
                @click.stop
                @keyup.enter="提交改名(b.名称)"
                @blur="提交改名(b.名称)"
              />
              <span class="b-mode">兽娘形态</span>
            </div>
            <p class="b-desc">{{ b.兽娘 }}</p>
            <div class="b-bars">
              <div class="mini-bar">
                <span>心情</span>
                <div class="mb-track"><div class="mb-fill mood" :style="{ width: b.心情 + '%' }"></div></div>
                <b>{{ b.心情 }}</b>
              </div>
              <div class="mini-bar">
                <span>饱食</span>
                <div class="mb-track"><div class="mb-fill food" :style="{ width: b.饱食 + '%' }"></div></div>
                <b>{{ b.饱食 }}</b>
              </div>
            </div>
            <div class="b-foot">
              <span class="b-status"><i class="fa-solid fa-circle"></i>{{ b.状态 }}</span>
              <div class="feed">
                <button class="feed-btn pet" @click.stop="store.抚摸(b.名称)">
                  <i class="fa-solid fa-hand"></i>抚摸
                </button>
                <button class="feed-btn" @click.stop="喂食展开 = 喂食展开 === b.名称 ? '' : b.名称">
                  <i class="fa-solid fa-bowl-food"></i>喂食
                </button>
                <div v-if="喂食展开 === b.名称" class="feed-menu" @click.stop>
                  <div v-if="食物列表.length === 0" class="fm-empty">库存没有食物了</div>
                  <button
                    v-for="f in 食物列表"
                    :key="f.名称"
                    class="fm-item"
                    @click="喂(b.名称, f.名称)"
                  >
                    {{ f.名称 }} <em>×{{ f.数量 }}</em>
                  </button>
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
import { useZooStore } from '../store';
import { tierVars } from '../../shared/tier';
import { catMeta } from '../category';
import TierTag from '../../shared/TierTag.vue';

const store = useZooStore();
const 翻开 = ref('');
const 喂食展开 = ref('');
const 改名中 = ref('');
const 新名字 = ref('');

function 开始改名(名: string) {
  改名中.value = 名;
  新名字.value = 名;
}
function 提交改名(旧名: string) {
  if (改名中.value !== 旧名) return;
  store.改名(旧名, 新名字.value);
  改名中.value = '';
}

const 名单 = computed(() =>
  Object.entries(store.data.兽员)
    .map(([名称, v]) => ({ 名称, ...v }))
    .sort((a, b) => b.产率 - a.产率),
);
const 食物列表 = computed(() =>
  Object.entries(store.data.食物).map(([名称, v]) => ({ 名称, ...v })),
);

function 喂(兽名: string, 食物名: string) {
  store.喂食(兽名, 食物名);
  喂食展开.value = '';
}
</script>

<style scoped>
.empty {
  padding: 22px;
  text-align: center;
  color: var(--txt-faint);
  font-size: 12px;
}
.beast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.flip-card {
  perspective: 900px;
  height: 240px;
  cursor: pointer;
}
.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.3, 1);
  transform-style: preserve-3d;
}
.flip-card.flipped .flip-inner {
  transform: rotateY(180deg);
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  color: var(--ptxt);
  border-radius: 10px;
  border: 2px solid color-mix(in srgb, var(--tier) 50%, rgba(139, 111, 71, 0.6));
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 250, 240, 0.4), transparent 40%),
    radial-gradient(ellipse 90% 90% at 85% 85%, color-mix(in srgb, var(--tier) 6%, transparent), transparent 50%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.2),
    inset 2px 2px 6px rgba(90, 60, 30, 0.12),
    inset -8px -8px 16px rgba(90, 60, 30, 0.08),
    0 3px 10px rgba(26, 15, 30, 0.4);
  overflow: hidden;
}
.face::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background:
    radial-gradient(ellipse at 95% 95%, rgba(90, 60, 30, 0.15), transparent 40%),
    radial-gradient(ellipse at 5% 5%, rgba(255, 250, 240, 0.2), transparent 35%);
  pointer-events: none;
}
.face::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  pointer-events: none;
}
.face.back {
  transform: rotateY(180deg);
  padding: 12px;
}
/* 椭圆画框形兽栏画像位 */
.portrait {
  position: relative;
  height: 108px;
  margin: 11px 11px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50% / 45%;
  background:
    radial-gradient(ellipse 65% 75% at 50% 55%, color-mix(in srgb, var(--tier) 12%, transparent), transparent 60%),
    radial-gradient(ellipse at center, rgba(58, 47, 30, 0.15), transparent 70%),
    var(--pinset);
  border: 2px solid color-mix(in srgb, var(--tier) 45%, rgba(139, 111, 71, 0.6));
  box-shadow:
    inset 0 3px 8px rgba(90, 60, 30, 0.3),
    inset 0 -2px 6px rgba(255, 250, 240, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.35);
}
.portrait img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.portrait > i {
  font-size: 40px;
  opacity: 0.85;
  color: var(--tier);
  text-shadow: 0 0 18px var(--tier), 0 2px 4px rgba(0, 0, 0, 0.3);
}
.rate {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-family: var(--font-num);
  font-size: 10px;
  color: #f3e6c4;
  background: rgba(68, 58, 42, 0.55);
  border-radius: 4px;
  padding: 1px 6px;
}
.rate i {
  margin-right: 3px;
  font-size: 9px;
}
.f-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 11px 9px;
  min-height: 0;
}
.f-name-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}
.f-name {
  font-size: 14px;
  font-weight: 700;
}
.f-cat {
  font-size: 10px;
  letter-spacing: 1px;
}
.f-tags {
  display: flex;
  align-items: center;
  gap: 7px;
}
.f-race {
  font-size: 10px;
  color: var(--ptxt-faint);
}
.f-desc {
  font-size: 11px;
  color: var(--ptxt-dim);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.flip-hint {
  margin-top: auto;
  font-size: 9px;
  color: var(--ptxt-faint);
}
.flip-hint i {
  margin-right: 4px;
}
/* 背面 */
.b-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.b-mode {
  font-size: 10px;
  color: #b57a1f;
  letter-spacing: 2px;
}
.b-desc {
  margin-top: 6px;
  font-size: 11px;
  color: var(--ptxt-dim);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.b-bars {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.mini-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: var(--ptxt-dim);
}
.mini-bar > span {
  flex-shrink: 0;
  width: 22px;
}
.mini-bar b {
  font-family: var(--font-num);
  font-size: 10px;
  width: 24px;
  text-align: right;
}
.mb-track {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--pinset);
  overflow: hidden;
}
.mb-fill {
  height: 100%;
  border-radius: 3px;
}
.mb-fill.mood {
  background: linear-gradient(90deg, #8b6f47, #d4af37);
  box-shadow: 0 0 6px rgba(212, 175, 55, 0.4);
}
.mb-fill.food {
  background: linear-gradient(90deg, #7d6b5e, #a89384);
}
.b-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.b-status {
  font-size: 10px;
  color: var(--ptxt-dim);
}
.b-status i {
  margin-right: 4px;
  font-size: 7px;
  color: #8b6f47;
}
.feed {
  position: relative;
  display: flex;
  gap: 6px;
}
.feed-btn {
  padding: 4px 11px;
  font-size: 11px;
  color: var(--ptxt);
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.3);
}
.feed-btn:hover {
  background: rgba(212, 175, 55, 0.22);
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.4),
    0 2px 6px rgba(212, 175, 55, 0.2);
}
.feed-btn.pet {
  color: #8b6f47;
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(212, 175, 55, 0.18);
}
.feed-btn.pet:hover {
  background: rgba(212, 175, 55, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.5),
    0 2px 8px rgba(212, 175, 55, 0.3);
}
.name-edit {
  cursor: text;
}
.name-edit i {
  margin-left: 5px;
  font-size: 9px;
  color: var(--ptxt-faint);
}
.name-input {
  width: 110px;
  padding: 1px 6px;
  background: rgba(251, 247, 234, 0.95);
  border: 1px solid var(--pline-strong);
  border-radius: 4px;
  color: var(--ptxt);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  box-shadow: inset 0 1px 3px rgba(90, 60, 30, 0.2);
}
.feed-btn {
  padding: 4px 11px;
  font-size: 11px;
  color: var(--ptxt);
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.3);
}
.feed-btn:hover {
  background: rgba(212, 175, 55, 0.22);
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.4),
    0 2px 6px rgba(212, 175, 55, 0.2);
}
.feed-btn i {
  margin-right: 4px;
}
.feed-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  min-width: 132px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #f7f1e0, #ebe0c5);
  border: 1px solid rgba(139, 111, 71, 0.5);
  border-radius: 6px;
  overflow: hidden;
  z-index: 20;
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.2),
    0 6px 20px rgba(26, 15, 30, 0.45);
}
.fm-empty {
  padding: 8px 10px;
  font-size: 11px;
  color: var(--ptxt-faint);
}
.fm-item {
  padding: 7px 10px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(150, 117, 62, 0.25);
  color: var(--ptxt);
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.fm-item:hover {
  background: rgba(212, 175, 55, 0.15);
}
.fm-item:last-child {
  border-bottom: none;
}
.fm-item em {
  float: right;
  font-family: var(--font-num);
  color: var(--ptxt-dim);
  font-style: normal;
}
</style>
