<template>
  <div class="summon">
    <!-- 卡池选择 -->
    <div class="pool-row">
      <button
        v-for="(池, 名) in store.data.卡池"
        :key="名"
        class="pool-chip"
        :class="{ active: 选中池 === 名 }"
        @click="选中池 = String(名)"
      >
        <i :class="池图标[池.内容]"></i>{{ 名 }}
        <em v-if="池.自定义" class="custom-mark">许愿</em>
      </button>
      <button class="pool-chip add" @click="编辑器展开 = !编辑器展开">
        <i class="fa-solid fa-plus"></i>自定义许愿池
      </button>
    </div>

    <!-- 新建许愿池 -->
    <div v-if="编辑器展开" class="pool-editor">
      <div class="pe-row">
        <label>池名</label>
        <input v-model="新池.名称" maxlength="10" placeholder="如：龙娘限定" />
      </div>
      <div class="pe-row">
        <label>内容</label>
        <select v-model="新池.内容">
          <option value="beast">兽员</option>
          <option value="egg">兽蛋</option>
          <option value="food">食物</option>
        </select>
        <label>单抽</label>
        <input class="pe-price" type="number" min="1" v-model.number="新池.单抽" />
        <label>十连</label>
        <input class="pe-price" type="number" min="1" v-model.number="新池.十连" />
      </div>
      <div v-if="新池.内容 !== 'food'" class="pe-row cats">
        <label>类别</label>
        <label v-for="c in store.所有类别" :key="c" class="pe-cat" :style="{ color: catMeta(c).color }">
          <input type="checkbox" :value="c" v-model="新池.类别筛选" />{{ c }}
        </label>
        <span class="pe-hint">不勾=全类别</span>
      </div>
      <div class="pe-row">
        <label>主题</label>
        <input v-model="新池.主题" maxlength="30" placeholder="如：只要龙娘 / 修仙世界灵兽（正式版 AI 按此生成）" />
      </div>
      <div class="pe-actions">
        <span class="pe-hint">概率与保底创建后到「设置」页调整</span>
        <button class="pe-create" @click="创建卡池">创建</button>
      </div>
    </div>

    <div v-if="池" class="pool-body">
      <div class="pool-title-row">
        <p class="pool-desc">{{ 池.说明 || '自定义许愿池' }}</p>
        <button v-if="池.自定义" class="pool-del" @click="删池">
          <i class="fa-solid fa-trash"></i>删除此池
        </button>
      </div>
      <p v-if="池.主题" class="pool-theme"><i class="fa-solid fa-star"></i>主题：{{ 池.主题 }}</p>
      <p v-if="池.类别筛选.length > 0" class="pool-theme">
        <i class="fa-solid fa-filter"></i>限定：{{ 池.类别筛选.join(' / ') }}
      </p>

      <!-- 概率分布条 -->
      <div class="rate-block">
        <div class="rate-bar">
          <span
            v-for="seg in 概率段"
            :key="seg.品阶"
            class="rate-seg"
            :style="{ width: seg.占比 + '%', background: seg.color }"
            :title="`${seg.品阶} ${seg.概率}%`"
          ></span>
        </div>
        <div class="rate-legend">
          <span v-for="seg in 概率段" :key="seg.品阶" class="rl-item">
            <i :style="{ background: seg.color }"></i>{{ seg.品阶 }} <b>{{ seg.概率 }}%</b>
          </span>
        </div>
      </div>

      <!-- 保底 -->
      <div v-if="池.保底开启" class="pity">
        <i class="fa-solid fa-shield-halved"></i>
        <span>保底：{{ 池.保底抽数 }} 抽内必出「{{ 池.保底品阶 }}」</span>
        <div class="pity-track">
          <div class="pity-fill" :style="{ width: (池.距保底 / 池.保底抽数) * 100 + '%' }"></div>
        </div>
        <b class="pity-num">{{ 池.距保底 }}/{{ 池.保底抽数 }}</b>
      </div>

      <!-- 抽卡按钮 -->
      <div class="draw-row">
        <button class="draw-btn" :disabled="store.data.愿力 < 池.单抽" @click="store.抽卡(选中池, 1)">
          <span class="db-main">召唤 ×1</span>
          <span class="db-cost"><i class="fa-solid fa-sparkles"></i>{{ 池.单抽 }}</span>
        </button>
        <button class="draw-btn ten" :disabled="store.data.愿力 < 池.十连" @click="store.抽卡(选中池, 10)">
          <span class="db-main">召唤 ×10</span>
          <span class="db-cost"><i class="fa-solid fa-sparkles"></i>{{ 池.十连 }}<em>9 折</em></span>
        </button>
      </div>
      <p class="pool-note">概率由程序控制，可在「设置」页自行调整</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useZooStore } from '../store';
import { tierMeta } from '../../shared/tier';
import { catMeta } from '../category';

const store = useZooStore();
const 选中池 = ref(Object.keys(store.data.卡池)[0] ?? '');
const 编辑器展开 = ref(false);

const 池图标: Record<string, string> = {
  beast: 'fa-solid fa-paw',
  egg: 'fa-solid fa-egg',
  food: 'fa-solid fa-bowl-food',
};

const 池 = computed(() => store.data.卡池[选中池.value]);

// 新建许愿池：概率/保底沿用同内容内置池的默认值，之后可在设置页调
const 新池 = ref({
  名称: '',
  内容: 'beast' as 'beast' | 'egg' | 'food',
  类别筛选: [] as string[],
  主题: '',
  单抽: 200,
  十连: 1800,
});

function 创建卡池() {
  const 模板 = Object.values(store.data.卡池).find(p => p.内容 === 新池.value.内容 && !p.自定义);
  const 错误 = store.新建卡池(新池.value.名称, {
    说明: 新池.value.主题 ? `自定义许愿池 · ${新池.value.主题}` : '自定义许愿池',
    内容: 新池.value.内容,
    单抽: Math.max(1, 新池.value.单抽 || 1),
    十连: Math.max(1, 新池.value.十连 || 1),
    概率: { ...(模板?.概率 ?? { 普通: 60, 精良: 25, 稀有: 10, 史诗: 4, 传说: 1 }) },
    保底开启: 模板?.保底开启 ?? false,
    保底抽数: 模板?.保底抽数 ?? 50,
    保底品阶: 模板?.保底品阶 ?? '传说',
    类别筛选: [...新池.value.类别筛选],
    主题: 新池.value.主题,
  });
  if (!错误) {
    选中池.value = 新池.value.名称.trim();
    编辑器展开.value = false;
    新池.value = { 名称: '', 内容: 'beast', 类别筛选: [], 主题: '', 单抽: 200, 十连: 1800 };
  }
}

function 删池() {
  store.删除卡池(选中池.value);
  选中池.value = Object.keys(store.data.卡池)[0] ?? '';
}

const 概率段 = computed(() => {
  if (!池.value) return [];
  const 总 = Object.values(池.value.概率).reduce((s, w) => s + w, 0) || 1;
  return Object.entries(池.value.概率)
    .filter(([, w]) => w > 0)
    .map(([品阶, w]) => ({ 品阶, 概率: w, 占比: (w / 总) * 100, color: tierMeta(品阶).color }));
});
</script>

<style scoped>
.summon {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pool-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pool-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08));
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 20px;
  color: var(--ptxt);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(255, 250, 240, 0.3);
}
.pool-chip i {
  font-size: 11px;
}
.pool-chip:hover:not(.active) {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.15));
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.4),
    0 2px 8px rgba(212, 175, 55, 0.2);
}
.pool-chip.active {
  color: #f5ead6;
  border-color: rgba(139, 111, 71, 0.7);
  background: linear-gradient(135deg, #8b6f47, #6b5438);
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.3),
    0 3px 10px rgba(26, 15, 30, 0.4);
}
.pool-chip.add {
  border-style: dashed;
  color: #8b6f47;
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(243, 236, 217, 0.3);
}
.custom-mark {
  font-style: normal;
  font-size: 9px;
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.5);
  border-radius: 3px;
  padding: 0 4px;
  line-height: 14px;
  background: rgba(212, 175, 55, 0.1);
}
.pool-editor {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 12px 13px;
  background:
    radial-gradient(ellipse 70% 65% at 18% 25%, rgba(255, 250, 240, 0.35), transparent 45%),
    radial-gradient(ellipse at 82% 75%, rgba(90, 60, 30, 0.05), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px dashed rgba(139, 111, 71, 0.45);
  border-radius: 10px;
  color: var(--ptxt);
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.15),
    inset 2px 2px 5px rgba(90, 60, 30, 0.08),
    inset -6px -6px 12px rgba(90, 60, 30, 0.05);
}
.pe-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--ptxt-dim);
}
.pe-row > label {
  flex-shrink: 0;
}
.pe-row input[type='text'],
.pe-row input:not([type]),
.pe-row select {
  flex: 1;
  min-width: 120px;
  padding: 5px 9px;
  background: #fbf7ea;
  border: 1px solid rgba(139, 111, 71, 0.4);
  border-radius: 5px;
  color: var(--ptxt);
  font-size: 12px;
  font-family: inherit;
  box-shadow: inset 0 1px 3px rgba(90, 60, 30, 0.15);
}
.pe-row select {
  flex: 0 1 auto;
}
.pe-price {
  width: 70px;
  flex: 0 0 auto !important;
}
.pe-row.cats {
  gap: 10px;
}
.pe-cat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.pe-cat input {
  accent-color: #8b6f47;
}
.pe-hint {
  font-size: 10px;
  color: var(--ptxt-faint);
}
.pe-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pe-create {
  padding: 7px 22px;
  background: linear-gradient(135deg, #d4af37, #b8942a);
  border: 1px solid rgba(90, 60, 30, 0.3);
  border-radius: 6px;
  color: #3d2f14;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.5),
    0 2px 6px rgba(212, 175, 55, 0.3);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}
.pe-create:hover {
  background: linear-gradient(135deg, #ddb942, #c49f2e);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.6),
    0 3px 12px rgba(212, 175, 55, 0.5);
}
.pool-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 13px 14px;
  background:
    radial-gradient(ellipse 70% 65% at 18% 25%, rgba(255, 250, 240, 0.35), transparent 45%),
    radial-gradient(ellipse at 82% 75%, rgba(90, 60, 30, 0.05), transparent 40%),
    linear-gradient(135deg, #ebe0c5, #e0d3b8);
  border: 2px solid rgba(139, 111, 71, 0.5);
  border-radius: 10px;
  color: var(--ptxt);
  box-shadow:
    inset 0 0 0 1px rgba(212, 175, 55, 0.18),
    inset 2px 2px 5px rgba(90, 60, 30, 0.1),
    inset -6px -6px 12px rgba(90, 60, 30, 0.06),
    0 2px 8px rgba(26, 15, 30, 0.35);
}
.pool-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pool-desc {
  font-size: 12px;
  color: var(--ptxt-dim);
}
.pool-del {
  flex-shrink: 0;
  padding: 4px 11px;
  background: rgba(139, 58, 42, 0.1);
  border: 1px solid rgba(139, 58, 42, 0.4);
  border-radius: 5px;
  color: #8b3a2a;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.pool-del:hover {
  background: rgba(139, 58, 42, 0.18);
  box-shadow: 0 2px 6px rgba(139, 58, 42, 0.25);
}
.pool-del i {
  margin-right: 4px;
}
.pool-theme {
  font-size: 11px;
  color: #8b6f47;
  font-weight: 600;
}
.pool-theme i {
  margin-right: 5px;
  font-size: 10px;
  color: #d4af37;
}
.rate-block {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rate-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--pinset);
}
.rate-seg {
  height: 100%;
}
.rate-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 10px;
  color: var(--ptxt-dim);
}
.rl-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rl-item i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.rl-item b {
  font-family: var(--font-num);
  font-weight: 600;
}
.pity {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ptxt-dim);
}
.pity > i {
  color: #d4af37;
}
.pity-track {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: var(--pinset);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}
.pity-fill {
  height: 100%;
  background: linear-gradient(90deg, #b8942a, #d4af37);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
}
.pity-num {
  font-family: var(--font-num);
  font-size: 11px;
  color: #d4af37;
  font-weight: 600;
}
.draw-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.draw-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 13px;
  background: linear-gradient(135deg, #8b6f47, #6b5438);
  border: 2px solid rgba(139, 111, 71, 0.6);
  border-radius: 8px;
  color: #f5ead6;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.25),
    inset 0 -1px 3px rgba(0, 0, 0, 0.3),
    0 3px 8px rgba(26, 15, 30, 0.4);
}
.draw-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15), transparent 60%);
  pointer-events: none;
}
.draw-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9d7d52, #7a5f42);
  border-color: rgba(212, 175, 55, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(212, 175, 55, 0.35),
    inset 0 -1px 3px rgba(0, 0, 0, 0.35),
    0 4px 14px rgba(139, 111, 71, 0.5);
  transform: translateY(-1px);
}
.draw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.draw-btn.ten {
  background: linear-gradient(135deg, #d4af37, #b8942a);
  border-color: rgba(90, 60, 30, 0.6);
  color: #3d2f14;
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.5),
    0 3px 10px rgba(212, 175, 55, 0.4);
}
.draw-btn.ten:hover:not(:disabled) {
  background: linear-gradient(135deg, #ddb942, #c49f2e);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 240, 0.6),
    0 4px 14px rgba(212, 175, 55, 0.6);
}
.db-main {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}
.db-cost {
  font-family: var(--font-num);
  font-size: 11px;
  opacity: 0.85;
}
.db-cost i {
  margin-right: 4px;
  font-size: 10px;
}
.db-cost em {
  font-style: normal;
  margin-left: 5px;
  font-size: 9px;
}
.pool-note {
  font-size: 10px;
  color: var(--ptxt-faint);
  text-align: center;
}
</style>
