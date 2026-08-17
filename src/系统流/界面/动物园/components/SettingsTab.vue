<template>
  <div class="settings">
    <!-- 创造模式锁：默认锁定，连续确认两次才放行（本次页面会话内有效） -->
    <div v-if="!已解锁" class="lock-screen">
      <i class="fa-solid fa-lock"></i>
      <h4>创造模式</h4>
      <p class="ls-text">
        这里是开挂区：随意改愿力、改概率、手动造兽。<br />
        不是所有人都喜欢简单模式——正常游玩请不要开启。
      </p>
      <template v-if="确认步 === 0">
        <button class="ls-btn" @click="确认步 = 1">我要开启创造模式</button>
      </template>
      <template v-else-if="确认步 === 1">
        <p class="ls-warn">确定吗？开了之后数值由你随便改，乐趣可能打折。</p>
        <div class="ls-row">
          <button class="ls-btn ghost" @click="确认步 = 0">算了</button>
          <button class="ls-btn" @click="确认步 = 2">确定开启</button>
        </div>
      </template>
      <template v-else>
        <p class="ls-warn">再确认最后一次：真的要以创造模式游玩吗？</p>
        <div class="ls-row">
          <button class="ls-btn ghost" @click="确认步 = 0">返回</button>
          <button class="ls-btn danger" @click="已解锁 = true">确认，放我进去</button>
        </div>
      </template>
    </div>

    <template v-else>
      <p class="st-note">
        <i class="fa-solid fa-unlock"></i>
        创造模式已开启（本次会话有效，刷新页面后重新上锁）：概率/保底由程序控制并保存在本地，AI 无权修改
      </p>

      <!-- 创造模式：资源修改 -->
      <section class="st-pool">
        <h4 class="st-pool-title"><i class="fa-solid fa-wand-magic-sparkles"></i>资源修改</h4>
        <div class="creative">
          <div class="cr-row">
            <label>愿力</label>
            <input class="st-num wide2" type="number" min="0" v-model.number="愿力输入" />
            <button class="cr-btn" @click="store.设愿力(愿力输入)">生效</button>
          </div>
          <div class="cr-row">
            <label>园区等级</label>
            <input class="st-num wide2" type="number" min="1" v-model.number="等级输入" />
            <button class="cr-btn" @click="store.设园区等级(等级输入)">生效</button>
          </div>
          <div class="cr-row">
            <label>游客上限</label>
            <input class="st-num wide2" type="number" min="1" v-model.number="上限输入" />
            <button class="cr-btn" @click="store.设游客上限(上限输入)">生效</button>
          </div>
          <div class="cr-row">
            <button class="cr-btn gold" @click="store.全体喂饱()"><i class="fa-solid fa-heart"></i>全体喂饱撸顺</button>
          </div>
        </div>
      </section>

      <!-- 手动造兽（预览版手填，正式版 AI 按主题/描述生成补全） -->
      <section class="st-pool">
        <h4 class="st-pool-title"><i class="fa-solid fa-plus"></i>手动造兽</h4>
        <div class="creator">
          <div class="cr-grid">
            <label>名字<input v-model="造兽.名字" maxlength="12" placeholder="个体名" /></label>
            <label>种族<input v-model="造兽.种族" maxlength="12" placeholder="如：青龙" /></label>
            <label>类别
              <select v-model="造兽.类别">
                <option v-for="c in store.所有类别" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label>品阶
              <select v-model="造兽.品阶">
                <option v-for="t in 可选品阶" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label>产率<input type="number" min="1" v-model.number="造兽.产率" /></label>
          </div>
          <textarea v-model="造兽.兽形" rows="2" maxlength="120" placeholder="兽形描述"></textarea>
          <textarea v-model="造兽.兽娘" rows="2" maxlength="120" placeholder="兽娘形态描述"></textarea>
          <div class="cr-foot">
            <span class="pe-hint">正式版：只需写个大概，AI 会按描述补全双形态文本并登记世界书防 OOC</span>
            <button class="cr-btn gold" @click="提交造兽">创造入园</button>
          </div>
        </div>
      </section>

      <section v-for="(池, 名) in store.data.卡池" :key="名" class="st-pool">
        <h4 class="st-pool-title">
          <i :class="池图标[池.内容]"></i>{{ 名 }}
          <em v-if="池.自定义" class="custom-mark">许愿池</em>
          <span v-if="池.主题" class="st-theme">· {{ 池.主题 }}</span>
        </h4>

        <div class="st-rates">
          <div v-for="(w, 品阶) in 池.概率" :key="品阶" class="st-rate-row">
            <span class="st-tier" :style="{ color: tierMeta(品阶).color }">{{ 品阶 }}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.01"
              :value="w"
              @input="改概率(池, String(品阶), $event)"
            />
            <input
              class="st-num"
              type="number"
              min="0"
              max="100"
              step="0.01"
              :value="w"
              @change="改概率(池, String(品阶), $event)"
            />
            <span class="st-pct">%</span>
          </div>
          <p class="st-sum" :class="{ warn: Math.abs(概率合计(池) - 100) > 0.01 }">
            合计 {{ 概率合计(池).toFixed(2) }}%<template v-if="Math.abs(概率合计(池) - 100) > 0.01">（≠100%，抽取时按比例归一化）</template>
          </p>
        </div>

        <div class="st-pity">
          <label class="st-switch">
            <input type="checkbox" v-model="池.保底开启" @change="store.保存设置()" />
            <span>保底</span>
          </label>
          <template v-if="池.保底开启">
            <input class="st-num wide" type="number" min="1" max="999" v-model.number="池.保底抽数" @change="store.保存设置()" />
            <span class="st-pity-text">抽内必出</span>
            <select v-model="池.保底品阶" @change="store.保存设置()">
              <option v-for="t in 可选品阶" :key="t" :value="t">{{ t }}</option>
            </select>
          </template>
        </div>
      </section>

      <button class="st-reset" @click="store.恢复默认设置()">
        <i class="fa-solid fa-rotate-left"></i>恢复默认概率（清空自建许愿池）
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierMeta, ALL_TIERS } from '../../shared/tier';
import type { 卡池 } from '../types';

const store = useZooStore();

// 创造模式锁：会话内有效
const 已解锁 = ref(false);
const 确认步 = ref(0);

// 创造模式输入框初值
const 愿力输入 = ref(store.data.愿力);
const 等级输入 = ref(store.data.园区等级);
const 上限输入 = ref(store.data.游客上限);

// 手动造兽表单
const 造兽 = ref({ 名字: '', 种族: '', 类别: '神兽', 品阶: '稀有', 产率: 50, 兽形: '', 兽娘: '' });

function 提交造兽() {
  const 错误 = store.手动造兽(造兽.value.名字, {
    种族: 造兽.value.种族 || '未知',
    类别: 造兽.value.类别,
    品阶: 造兽.value.品阶,
    兽形: 造兽.value.兽形 || '（暂无描述）',
    兽娘: 造兽.value.兽娘 || '（暂无描述）',
    心情: 80,
    饱食: 80,
    产率: Math.max(1, 造兽.value.产率 || 1),
    状态: '在园',
  });
  if (!错误) 造兽.value = { 名字: '', 种族: '', 类别: '神兽', 品阶: '稀有', 产率: 50, 兽形: '', 兽娘: '' };
}

const 池图标: Record<string, string> = {
  beast: 'fa-solid fa-paw',
  egg: 'fa-solid fa-egg',
  food: 'fa-solid fa-bowl-food',
};

const 可选品阶 = ALL_TIERS.filter(t => !['残破'].includes(t));

function 概率合计(池: 卡池): number {
  return Object.values(池.概率).reduce((s, w) => s + (Number(w) || 0), 0);
}

function 改概率(池: 卡池, 品阶: string, e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  池.概率[品阶] = Math.max(0, Math.min(100, v || 0));
  store.保存设置();
}
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* ---- 锁定屏 ---- */
.lock-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 250, 240, 0.4), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px solid rgba(139, 111, 71, 0.5);
  border-radius: 10px;
  color: var(--ptxt);
  text-align: center;
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.2),
    inset 2px 2px 6px rgba(90, 60, 30, 0.12),
    0 3px 10px rgba(26, 15, 30, 0.4);
}
.lock-screen > i {
  font-size: 28px;
  color: #d4af37;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.lock-screen h4 {
  font-size: 16px;
  letter-spacing: 4px;
  color: var(--ptxt);
  font-weight: 700;
}
.ls-text {
  font-size: 11px;
  color: var(--ptxt-dim);
  line-height: 1.8;
}
.ls-warn {
  font-size: 11px;
  color: #8b3a2a;
  font-weight: 600;
}
.ls-row {
  display: flex;
  gap: 10px;
}
.ls-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #8b6f47, #6b5438);
  border: 2px solid rgba(90, 60, 30, 0.5);
  border-radius: 6px;
  color: #f5ead6;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.3),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25),
    0 2px 6px rgba(26, 15, 30, 0.3);
}
.ls-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15), transparent 60%);
  pointer-events: none;
}
.ls-btn:hover {
  background: linear-gradient(135deg, #9d7d52, #7a5f42);
  border-color: rgba(139, 111, 71, 0.6);
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.4),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3),
    0 3px 10px rgba(139, 111, 71, 0.4);
}
.ls-btn.ghost {
  background: none;
  border: 1px solid rgba(139, 111, 71, 0.5);
  color: var(--ptxt-dim);
  box-shadow: none;
}
.ls-btn.ghost:hover {
  background: rgba(139, 111, 71, 0.1);
  box-shadow: 0 2px 6px rgba(26, 15, 30, 0.2);
}
.ls-btn.danger {
  background: linear-gradient(135deg, #8b3a2a, #6d2e21);
  border-color: rgba(139, 58, 42, 0.7);
}
.ls-btn.danger:hover {
  background: linear-gradient(135deg, #9d4a38, #7f3628);
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 180, 0.2),
    0 3px 10px rgba(139, 58, 42, 0.5);
}
/* ---- 设置主体 ---- */
.st-note {
  padding: 10px 13px;
  font-size: 11px;
  color: var(--ptxt-dim);
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid rgba(139, 111, 71, 0.35);
  border-radius: 6px;
}
.st-note i {
  margin-right: 6px;
  color: #d4af37;
}
.st-pool {
  padding: 12px 13px;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 250, 240, 0.4), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px solid rgba(139, 111, 71, 0.4);
  border-radius: 10px;
  color: var(--ptxt);
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.15),
    inset 2px 2px 6px rgba(90, 60, 30, 0.1);
}
.st-pool-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--ptxt);
}
.st-pool-title i {
  color: #8b6f47;
  font-size: 12px;
}
.st-rates {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.st-rate-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.st-tier {
  width: 34px;
  flex-shrink: 0;
  font-size: 11px;
}
.st-rate-row input[type='range'] {
  flex: 1;
  height: 5px;
  accent-color: #8b6f47;
}
.st-num {
  width: 62px;
  padding: 4px 7px;
  background: #fbf7ea;
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 4px;
  color: var(--ptxt);
  font-family: var(--font-num);
  font-size: 11px;
  box-shadow: inset 0 1px 2px rgba(90, 60, 30, 0.1);
}
.st-num.wide {
  width: 56px;
}
.st-num.wide2 {
  width: 100px;
}
.st-pct {
  font-size: 10px;
  color: var(--ptxt-faint);
}
.st-sum {
  margin-top: 4px;
  font-size: 10px;
  color: var(--ptxt-faint);
}
.st-sum.warn {
  color: #d4af37;
  font-weight: 600;
}
.st-pity {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(139, 111, 71, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ptxt-dim);
}
.st-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.st-switch input {
  accent-color: #8b6f47;
}
.st-pity select {
  padding: 4px 7px;
  background: #fbf7ea;
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 4px;
  color: var(--ptxt);
  font-size: 11px;
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(90, 60, 30, 0.1);
}
.st-reset {
  align-self: center;
  padding: 8px 20px;
  background: rgba(139, 58, 42, 0.08);
  border: 1px solid rgba(139, 58, 42, 0.3);
  border-radius: 6px;
  color: var(--ptxt-dim);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.st-reset:hover {
  background: rgba(139, 58, 42, 0.15);
  border-color: rgba(139, 58, 42, 0.5);
  color: #8b3a2a;
}
.st-reset i {
  margin-right: 6px;
}
.custom-mark {
  font-style: normal;
  font-size: 9px;
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.5);
  border-radius: 3px;
  padding: 0 5px;
  line-height: 15px;
  background: rgba(212, 175, 55, 0.1);
}
.st-theme {
  font-size: 10px;
  color: var(--ptxt-faint);
  font-weight: 400;
}
.creative,
.creator {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ptxt-dim);
}
.cr-row label {
  width: 60px;
  flex-shrink: 0;
}
.cr-btn {
  padding: 5px 15px;
  background: rgba(139, 111, 71, 0.15);
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 5px;
  color: #8b6f47;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.cr-btn:hover {
  background: rgba(139, 111, 71, 0.25);
  border-color: rgba(139, 111, 71, 0.6);
}
.cr-btn.gold {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(212, 175, 55, 0.15);
  font-weight: 600;
}
.cr-btn.gold:hover {
  background: rgba(212, 175, 55, 0.25);
  border-color: rgba(212, 175, 55, 0.7);
}
.cr-btn i {
  margin-right: 4px;
}
.cr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.cr-grid label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10px;
  color: var(--ptxt-faint);
}
.cr-grid input,
.cr-grid select,
.creator textarea {
  padding: 5px 8px;
  background: #fbf7ea;
  border: 1px solid rgba(139, 111, 71, 0.35);
  border-radius: 5px;
  color: var(--ptxt);
  font-size: 12px;
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(90, 60, 30, 0.08);
}
.creator textarea {
  width: 100%;
  resize: vertical;
}
.cr-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pe-hint {
  font-size: 10px;
  color: var(--ptxt-faint);
}
</style>
