<script setup lang="ts">
import { ref } from 'vue';
import portrait from '../../assets/头像.png?url';
import Environment from '../封面/Environment.vue';
import type { CoverEnvironment } from '../封面/environment';
defineProps<{ environment?: CoverEnvironment; preview?: boolean }>();
defineEmits<{ start: []; retry: []; workshop: [] }>();
const panel = ref<'setting' | 'guide' | null>(null);
</script>

<template>
  <main class="book-cover">
    <div class="cover-scene">
      <img class="cover-art" :src="portrait" alt="银金色长发与微光交织的封面插画" />
      <div class="cover-shade"></div>
      <div class="cover-content">
        <div class="cover-top"><span>虚海 · 多元世界</span><span>卷一 / 初醒</span></div>
        <div class="title-block">
          <span class="english">AFTER THE EMBERS</span>
          <h1 aria-label="余烬之后">余烬<span>之后</span></h1>
          <div class="title-rule"></div>
          <p class="tagline">世界仍在前行。<br />而你的故事，尚未终结。</p>
        </div>
        <div class="cover-bottom">
          <p class="invitation">一次相遇，一份尚待命名的力量。<br />在无垠虚海中，写下属于你的旅途。</p>
          <button class="begin" @click="$emit('start')"><span>开始旅途</span><span aria-hidden="true">→</span></button>
          <div class="links">
            <button @click="$emit('workshop')">设定工坊</button>
            <button
              :aria-expanded="panel === 'setting'"
              aria-controls="cover-reading"
              @click="panel = panel === 'setting' ? null : 'setting'"
            >
              关于这个世界
            </button>
            <button
              :aria-expanded="panel === 'guide'"
              aria-controls="cover-reading"
              @click="panel = panel === 'guide' ? null : 'guide'"
            >
              游玩说明
            </button>
          </div>
        </div>
      </div>
    </div>
    <section v-if="panel" id="cover-reading" class="reading">
      <template v-if="panel === 'setting'">
        <span class="chapter">WORLD / 虚海与万界</span>
        <h2>万千世界，起于虚海</h2>
        <p>
          无垠虚空中，万千位面如气泡悬浮，各自孕育着不同的世界。起源之神初微与终末之神末墟从中诞生；世界的生灭、尚未偿清的约定与旅人的相遇，在万界之间继续。
        </p>
        <p>
          选择起源涅槃、吞噬或合成作为起点，也可以构思自己的力量。人物的相处、未知世界的探索与能力的成长，共同构成旅途。
        </p>
        <p>世界随故事推进。未赴的约定、旁人的记忆与远方的变化，会在重逢时留下回响。</p>
        <p>你可以是平凡的归来者，也可以带着自己的身份启程。身世与来历，由你书写。</p>
      </template>
      <template v-else>
        <span class="chapter">GUIDE / 启程之前</span>
        <h2>以你的身份，写下下一页</h2>
        <ol>
          <li>点击“开始旅途”，选择默认角色或填写自己的档案。</li>
          <li>
            选择默认或自定义开局，预览要发给 AI 的开局要求，再点击“发送开局并生成”。AI
            会正式写出第一幕，状态栏随回复显示。
          </li>
          <li>读完开场后，在酒馆输入框表达行动或对白，故事由此继续。</li>
          <li>状态栏记录游戏中的时间。现实等待、刷新和关闭页面不会让世界自动前进。</li>
        </ol>
        <p>已发生的行动与危险随回复结算；可选方案在“行动”页确认。“能力”页可查看用法并填入行动，死亡与复苏记录在“归来”页。</p>
      </template>
      <button class="close-reading" @click="panel = null">收起</button>
    </section>
    <Environment :environment="environment" :preview="preview" @retry="$emit('retry')" />
    <section class="author-note">
      <div class="author"><span>作者</span><strong>君离的喵</strong><span>永远支持纯爱</span></div>
      <p>本作品完全免费，拒绝私下售卖等商业行为。</p>
      <p>纯爱作品，可以二改，但拒绝将纯爱改绿改牛。</p>
      <p>请勿在墙内社区、QQ群传播、讨论相关内容。</p>
    </section>
    <footer><span>每一次归来，都留下新的可能。</span><span>余烬之后</span></footer>
  </main>
</template>

<style scoped>
.book-cover {
  max-width: 880px;
  margin: 18px auto;
  color: #f5eee4;
  background: #171e20;
  font-family: 'Microsoft YaHei', sans-serif;
  border: 1px solid #a6927450;
  overflow-wrap: anywhere;
}
.book-cover * {
  box-sizing: border-box;
}
.cover-scene {
  position: relative;
  overflow: hidden;
}
.cover-art,
.cover-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.cover-art {
  object-fit: cover;
  object-position: center 34%;
}
.cover-shade {
  background:
    linear-gradient(90deg, #10191cec 0%, #142024c4 34%, #18202415 78%),
    linear-gradient(0deg, #10191cf5 0%, #141c2030 55%, #141c2060 100%);
}
.cover-content {
  position: relative;
  padding: 28px 46px 36px;
}
.cover-top {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  font-size: 10px;
  color: #e3d4be;
}
.title-block {
  padding: 72px 0 65px;
}
.english {
  font:
    11px Georgia,
    serif;
  color: #d2bb93;
}
h1 {
  margin: 22px 0 28px;
  font:
    500 76px/1.12 'SimSun',
    serif;
  text-shadow: 0 2px 28px #080c0f90;
}
h1 span {
  display: block;
  margin-left: 64px;
}
.title-rule {
  height: 1px;
  width: 58px;
  background: #c7a773;
  margin: 26px 0;
}
.tagline {
  font:
    16px/2 'SimSun',
    serif;
  color: #ece3d6;
}
.invitation {
  font-size: 11px;
  line-height: 1.9;
  color: #ccc8bd;
  margin: 0 0 23px;
}
button {
  cursor: pointer;
  font: inherit;
}
.begin {
  display: flex;
  width: 290px;
  max-width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  background: #e6d5b7;
  color: #253132;
  border: 1px solid #fff4d380;
  font-size: 15px;
  transition: background 0.2s;
}
.begin:hover {
  background: #f6e5c9;
}
.begin span:last-child {
  font-size: 23px;
  line-height: 1;
}
.links {
  display: flex;
  gap: 24px;
  margin-top: 22px;
  flex-wrap: wrap;
}
.links button {
  border: 0;
  background: none;
  color: #e2d5c1;
  padding: 5px 0;
  font-size: 11px;
  border-bottom: 1px solid #cbb68e70;
}
.links button[aria-expanded='true'] {
  color: white;
  border-color: #e3d4be;
}
.reading {
  padding: 30px 46px;
  border-top: 1px solid #af97735c;
  background: #f3f3ec;
  color: #293735;
}
.chapter {
  font-size: 10px;
  color: #86714c;
}
h2 {
  font:
    500 24px/1.5 'SimSun',
    serif;
  margin: 16px 0;
}
.reading p,
.reading li {
  font-size: 13px;
  line-height: 2;
}
ol {
  padding-left: 20px;
}
.close-reading {
  border: 0;
  border-bottom: 1px solid #907e5c;
  padding: 5px 0;
  background: none;
  color: #76613d;
  font-size: 12px;
}
.author-note {
  padding: 24px;
  border-top: 1px solid #ac957a40;
  font-size: 11px;
  line-height: 1.9;
  color: #bfc2b7;
}
.author {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-bottom: 14px;
  color: #d3bf9e;
}
.author strong {
  font-size: 18px;
  font-weight: 500;
  color: #eee0c7;
}
.author-note p {
  margin: 6px 0;
}
footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 30px;
  font-size: 10px;
  color: #baad97;
}
button:focus-visible {
  outline: 2px solid #c7a773;
  outline-offset: 5px;
}
@media (max-width: 480px) {
  .book-cover {
    margin: 10px auto;
  }
  .cover-content {
    padding: 23px 24px 30px;
  }
  .cover-top {
    font-size: 9px;
  }
  .title-block {
    padding: 61px 0 56px;
  }
  h1 {
    font-size: 62px;
  }
  h1 span {
    margin-left: 46px;
  }
  .tagline {
    font-size: 14px;
  }
  .cover-art {
    object-position: 52% center;
  }
  .cover-shade {
    background:
      linear-gradient(90deg, #10191cdc, #16202635), linear-gradient(0deg, #10191cf5 0%, #141c2010 68%, #141c2070);
  }
  .invitation {
    font-size: 10px;
  }
  .begin {
    width: 100%;
  }
  .reading {
    padding: 24px;
  }
  footer {
    padding: 15px 20px;
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .begin {
    transition: none;
  }
}
</style>
