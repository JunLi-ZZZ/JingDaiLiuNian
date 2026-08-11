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
  padding: 7px 14px;
  background: #f3ecd9;
  border: 1px solid var(--pline);
  border-radius: 999px;
  color: var(--ptxt-dim);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.pool-chip i {
  font-size: 11px;
}
.pool-chip.active {
  color: #f7f1e0;
  border-color: #4a6b3a;
  background: linear-gradient(160deg, #5c7f45, #4a6b3a);
  box-shadow: 0 2px 8px rgba(20, 26, 12, 0.35);
}
.pool-chip.add {
  border-style: dashed;
  color: #b57a1f;
  border-color: rgba(217, 164, 65, 0.6);
  background: rgba(243, 236, 217, 0.5);
}
.custom-mark {
  font-style: normal;
  font-size: 9px;
  color: #b57a1f;
  border: 1px solid rgba(181, 122, 31, 0.5);
  border-radius: 4px;
  padding: 0 4px;
  line-height: 14px;
}
.pool-editor {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 11px 12px;
  background: linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px dashed rgba(181, 122, 31, 0.55);
  border-radius: 12px 16px 12px 16px;
  color: var(--ptxt);
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
  padding: 5px 8px;
  background: #fbf7ea;
  border: 1px solid var(--pline);
  border-radius: 6px;
  color: var(--ptxt);
  font-size: 12px;
  font-family: inherit;
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
  accent-color: #4a6b3a;
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
  padding: 6px 20px;
  background: linear-gradient(160deg, #d9a441, #b57a1f);
  border: none;
  border-radius: 7px;
  color: #3d2f14;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}
.pe-create:hover {
  box-shadow: 0 0 12px rgba(217, 164, 65, 0.45);
}
.pool-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(175deg, #f7f1e0, #ede2c8);
  border: 1px solid var(--pline);
  border-radius: 14px 18px 14px 18px;
  color: var(--ptxt);
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
  padding: 3px 10px;
  background: none;
  border: 1px solid rgba(178, 74, 54, 0.5);
  border-radius: 6px;
  color: #b24a36;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
}
.pool-del i {
  margin-right: 4px;
}
.pool-theme {
  font-size: 11px;
  color: #b57a1f;
}
.pool-theme i {
  margin-right: 5px;
  font-size: 10px;
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
  color: #b57a1f;
}
.pity-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--pinset);
  overflow: hidden;
}
.pity-fill {
  height: 100%;
  background: linear-gradient(90deg, #b57a1f, #d9a441);
}
.pity-num {
  font-family: var(--font-num);
  font-size: 11px;
  color: #b57a1f;
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
  gap: 3px;
  padding: 12px;
  background: linear-gradient(160deg, #5c7f45, #4a6b3a);
  border: 1px solid #40582f;
  border-radius: 12px 16px 12px 16px;
  color: #f7f1e0;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.draw-btn:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(74, 107, 58, 0.5);
  transform: translateY(-1px);
}
.draw-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.draw-btn.ten {
  background: linear-gradient(160deg, #d9a441, #b57a1f);
  border-color: #9c6a1a;
  color: #3d2f14;
}
.draw-btn.ten:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(217, 164, 65, 0.45);
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
