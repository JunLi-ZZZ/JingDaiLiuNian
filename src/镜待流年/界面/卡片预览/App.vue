<template>
  <main>
    <header class="preview-header">
      <div class="eyebrow">镜待流年 · 本地预览</div>
      <h1>正文结构卡片</h1>
      <p>以下内容直接使用酒馆正则模板渲染，演示数据不会写入聊天。</p>
    </header>

    <section class="preview-section">
      <h2>生物</h2>
      <div v-html="bestiaryCard"></div>
    </section>

    <section class="preview-section">
      <h2>物品</h2>
      <div v-html="itemCard"></div>
    </section>

    <section class="preview-section">
      <h2>技能</h2>
      <div v-html="skillCard"></div>
    </section>
  </main>
</template>

<script setup lang="ts">
import bestiaryTemplate from '../../../../卡区/镜待流年/正则/生物卡片.txt?raw';
import itemTemplate from '../../../../卡区/镜待流年/正则/物品获得.txt?raw';
import skillTemplate from '../../../../卡区/镜待流年/正则/技能卡片.txt?raw';

function fill(template: string, values: string[]) {
  return template.replace(/\$(\d+)/g, (_match, index: string) => values[Number(index) - 1] ?? '');
}

const bestiaryCard = fill(bestiaryTemplate, [
  '银翎灵鹿', '灵鹿', '月辉鹿裔', '精良', '夜视、轻盈步', '月光亲和',
  '栖息于林缘的灵性生物，警觉而亲人。', '蜕落的银色鹿角碎片',
]);
const itemCard = fill(itemTemplate, [
  'user', '折光怀表', '1', '稀有', '镜渡赠予', '短暂冻结表盘内的时间指针',
  '银色表壳里藏着一圈会自行转动的蓝光。',
]);
const skillCard = fill(skillTemplate, [
  'user', '火花术', '法术', '普通', '已掌握',
  '弹出一枚可控火星，能够点燃引火物或提供短暂照明。',
  '需要少量灵力；连续施放会使指尖发麻。', '入门级火系法术，适合日常使用。',
]);
</script>

<style>
.preview-header { margin-bottom: 30px; text-align: center; }
.eyebrow { color: #b79c72; font-size: 12px; letter-spacing: .16em; }
h1 { margin: 8px 0 10px; font-size: 28px; font-weight: 600; letter-spacing: .08em; }
.preview-header p { margin: 0; color: #a89b88; font-size: 13px; }
.preview-section { margin-top: 26px; }
.preview-section h2 { margin: 0 0 8px; color: #c7af87; font-size: 15px; font-weight: 500; letter-spacing: .12em; }
.preview-section > div { min-width: 0; }
</style>
