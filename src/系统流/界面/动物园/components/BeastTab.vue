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
  border-radius: 16px 22px 16px 22px;
  border: 1px solid color-mix(in srgb, var(--tier) 45%, var(--pline));
  background:
    linear-gradient(165deg, color-mix(in srgb, var(--tier) 10%, transparent), transparent 45%),
    linear-gradient(175deg, #f7f1e0, #ede2c8);
  box-shadow: 0 2px 8px rgba(20, 26, 12, 0.35);
  overflow: hidden;
}
.face.back {
  transform: rotateY(180deg);
  padding: 12px;
}
/* 拱门形兽栏画像位 */
.portrait {
  position: relative;
  height: 108px;
  margin: 9px 9px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 60px 60px 10px 10px;
  background:
    radial-gradient(80% 90% at 50% 100%, color-mix(in srgb, var(--tier) 24%, transparent), transparent),
    var(--pinset);
  border: 1px solid color-mix(in srgb, var(--tier) 30%, var(--pline));
  border-bottom: none;
}
.portrait img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.portrait > i {
  font-size: 40px;
  opacity: 0.9;
  text-shadow: 0 0 18px var(--tier);
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
  background: linear-gradient(90deg, #b57a1f, #d9a441);
}
.mb-fill.food {
  background: linear-gradient(90deg, #4a6b3a, #9dc88d);
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
  color: #4a6b3a;
}
.feed {
  position: relative;
  display: flex;
  gap: 6px;
}
.feed-btn.pet {
  color: #b57a1f;
  border-color: rgba(181, 122, 31, 0.5);
  background: rgba(217, 164, 65, 0.15);
}
.feed-btn.pet:hover {
  background: rgba(217, 164, 65, 0.28);
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
  background: #fbf7ea;
  border: 1px solid var(--pline-strong);
  border-radius: 5px;
  color: var(--ptxt);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
}
.feed-btn {
  padding: 3px 10px;
  font-size: 11px;
  color: #4a6b3a;
  background: rgba(157, 200, 141, 0.2);
  border: 1px solid rgba(74, 107, 58, 0.5);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
.feed-btn:hover {
  background: rgba(157, 200, 141, 0.35);
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
  background: #f7f1e0;
  border: 1px solid var(--pline-strong);
  border-radius: 8px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
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
  border-bottom: 1px solid var(--pline);
  color: var(--ptxt);
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}
.fm-item:last-child {
  border-bottom: none;
}
.fm-item:hover {
  background: rgba(157, 200, 141, 0.25);
}
.fm-item em {
  font-style: normal;
  color: var(--ptxt-faint);
  font-family: var(--font-num);
}
</style>
