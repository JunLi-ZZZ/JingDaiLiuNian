<template>
  <!-- 前置页：环境检测 + 简介 -->
  <div v-if="showIntro" class="cover" :class="`theme-${theme}`">
    <div class="title-section">
      <div class="sub-mark">✦ 浮世千面 ✦</div>
      <h1 class="title">镜 待 流 年</h1>
      <div class="divider">
        <span class="divider-dot"></span>
        <span class="divider-line"></span>
        <span class="divider-diamond">◇</span>
        <span class="divider-line"></span>
        <span class="divider-dot"></span>
      </div>
    </div>

    <div class="intro-section">
      <div class="card-intro">
        <p>一面古镜，万千位面。镜渡随心，去往任何你向往的世界</p>
        <p>陌生的位面、钟爱的同人作品、未曾触及的因果线，皆在镜中</p>
        <p>归来时，超凡入世</p>
        <p>看她们褪去光环融入现代社会，在日常烟火里找到属于自己的位置</p>
        <p>还可以选择挂上任意角色的世界书，她便循着因果网落入这个世界</p>
        <p>打破第四面墙——你喜欢的她，不需要被定义在哪张卡里</p>
        <p class="intro-ending">镜待流年，故事无限</p>
      </div>

      <div class="section-divider"><span></span><i>◇</i><span></span></div>

      <div class="env-checks">
        <div class="env-title">环境检测</div>
        <div v-for="ext in extensions" :key="ext.name" class="env-row">
          <span class="env-icon" :class="ext.ok ? 'ok' : 'fail'">{{ ext.ok ? '✓' : '✗' }}</span>
          <div class="env-info">
            <span class="env-name">{{ ext.name }}</span>
            <span class="env-hint">{{ ext.hint }}</span>
          </div>
        </div>
      </div>

      <div v-if="allOk" class="env-all-ok">所有扩展就绪，祝您游玩愉快</div>
      <div v-else class="env-warn">请先安装/启用上方的扩展，否则可能出现功能异常</div>
    </div>

    <div class="section-divider"><span></span><i>◇</i><span></span></div>

    <div class="author-section">
      <span class="author-label">作者</span>
      <span class="author-name">君离的喵</span>
      <span class="author-motto">永远支持纯爱</span>
    </div>

    <div class="notice-box">
      <div class="notice-title">⚠ 注意事项</div>
      <div class="notice-list">
        <div class="notice-item">本作品完全免费，拒绝私下售卖等商业行为</div>
        <div class="notice-item">纯爱作品，可以二改但拒绝将纯爱改绿改牛</div>
        <div class="notice-item">请勿在墙内社区、QQ群传播、讨论相关内容</div>
      </div>
    </div>

    <button class="enter-btn" @click="showIntro = false">
      进入
      <span class="enter-arrow">→</span>
    </button>
  </div>

  <!-- 开局选择页 -->
  <div v-else class="cover" :class="`theme-${theme}`">
    <button class="back-btn" @click="showIntro = true">←</button>
    <div class="title-section">
      <div class="sub-mark">✦ 浮世千面 ✦</div>
      <h1 class="title">镜 待 流 年</h1>
      <div class="divider">
        <span class="divider-dot"></span>
        <span class="divider-line"></span>
        <span class="divider-diamond">◇</span>
        <span class="divider-line"></span>
        <span class="divider-dot"></span>
      </div>
      <p class="tagline">多元位面交汇于你<br />你的故事，从此刻开始</p>
    </div>

    <div class="scenes">
      <button v-for="(scene, i) in scenes" :key="i" class="scene-card" :class="`scene-${i}`" @click="startScene(i)">
        <span class="scene-index">{{ i + 1 }}</span>
        <div class="scene-body">
          <span class="scene-char">{{ scene.char }}</span>
          <span class="scene-location">{{ scene.location }}</span>
          <span class="scene-teaser">{{ scene.teaser }}</span>
        </div>
        <span class="scene-arrow"></span>
      </button>

      <!-- 自定义开局 -->
      <div class="scene-card custom-card" :class="{ active: showCustom }" @click="showCustom = !showCustom">
        <span class="scene-index">✦</span>
        <div class="scene-body">
          <span class="scene-char">自由开局</span>
          <span class="scene-teaser">书写属于你自己的故事开篇</span>
        </div>
        <span class="scene-arrow">{{ showCustom ? '▾' : '' }}</span>
      </div>
      <div v-if="showCustom" class="custom-area">
        <textarea
          v-model="customMsg"
          class="custom-input"
          placeholder="写下你想对 AI 说的话，作为故事的开端…"
          rows="3"
        ></textarea>
        <button class="custom-send" :disabled="!customMsg.trim()" @click.stop="sendCustom">发送</button>
      </div>
    </div>

    <p class="footer-note">选择一幕，开启你的" @click.stop="sendCustom</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
function onStorage(e: StorageEvent) {
  if (e.key === 'jdnl_theme' && e.newValue) theme.value = e.newValue;
}
onMounted(() => {
  addEventListener('storage', onStorage);
});
onUnmounted(() => {
  removeEventListener('storage', onStorage);
});

const showIntro = ref(true);
const showCustom = ref(false);
const customMsg = ref('');

function detectExt(name: string): boolean {
  try {
    const p = (window as any).parent;
    if (!p) return false;
    switch (name) {
      case '酒馆助手':
        return !!(p.TavernHelper || p.tavern_helper);
      case '提示词模板':
        return !!p.EjsTemplate;
      case 'MVU 变量框架':
        return !!(p.Mvu || p.MagVarUpdate);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

const extensions = computed(() => [
  {
    name: '酒馆助手',
    ok: detectExt('酒馆助手'),
    hint: '提供前台界面渲染与酒馆交互 API',
  },
  {
    name: '提示词模板',
    ok: detectExt('提示词模板'),
    hint: '提供 EJS 动态世界书加载，变量规则自动切换',
  },
  {
    name: 'MVU 变量框架',
    ok: detectExt('MVU 变量框架'),
    hint: '管理角色状态变量，支撑状态栏实时显示',
  },
]);

const allOk = computed(() => extensions.value.every(e => e.ok));

const scenes = [
  {
    char: '虞姝昀',
    location: '新湖区 · {{user}}的公寓',
    teaser: '搬出来独居好几年了，干妈却还是老一套小把戏',
    message: `{{user}}搬出独居是好几年前的事了，虞姝昀却至今仍把这当成换个地方照顾他。这天傍晚{{user}}推开门，客厅灯亮着，茶几上摆着两盒新买的草莓。浴室门半敞，水汽未散。虞姝昀裹着一件银色丝质浴袍靠在沙发上，正拿毛巾擦着湿漉漉的长发。"家里停水了，来你这儿借个浴室，"她抬头冲他一笑，浴袍领口松松垮垮地拢着，"顺便带了些草莓。对了，帮干妈看看这件新买的浴袍合不合身？"她站起身，在{{user}}面前轻轻转了一圈。`,
  },
  {
    char: '涂山素凝',
    location: '学府区与新湖区交界 · 小狐狸的温馨小楼',
    teaser: '小狐狸说是有事要当面讲，原来不过是想被摸摸头',
    message: `涂山素凝发来消息，说有事要当面讲，问{{user}}现在能不能过来一趟。{{user}}到了她家，推开门就看见她蜷在客厅的毛绒垫子上，九条尾巴全露在外面，正百无聊赖地刷着手机。见{{user}}进来，她眼睛一亮，把手机往旁边一扔。"快来试试今天装的的尾巴和耳朵，"她拍了拍身边的垫子，理直气壮地说，"叫你过来摸摸呢。"等到{{user}}坐下来伸手揉了揉那团蓬松的白毛。素凝眯起眼睛打了个满足的轻颤，嘴里不自觉地冒出几声"呜呜"和"嘤咛"被问起尾巴和耳朵的来历时，眨巴着眼睛一本正经地说是细心准备了很久的coser道具。`,
  },
  {
    char: '慕容霁宁',
    location: '新湖区 · {{user}}的公寓',
    teaser: '暑假的雨季，小师姐撑着油纸伞款款而来，说江南有座园林在等你',
    message: `暑假刚开了个头，一场绵绵细雨让整条街都慢了下来。{{user}}正望着窗外的雨发呆，门铃响了。慕容霁宁撑着一柄油纸伞站在门前，青丝垂肩，浅笑如烟，伞沿的雨滴落在肩头她浑然不在意。"师弟，"她轻声开口，语气像在分享一个藏了很久的秘密，"我在南方的一处小镇有一间祖上传下的园子，趁着暑假，想去看看，但是又没熟人陪，想邀你一同去看看。"`,
  },
  {
    char: '伊莉雅丝',
    location: '学府区与新湖区交界 · 白伊心理咨询角',
    teaser: '纯洁病症发作，疲惫的纯白女王需要你的温度',
    message: `伊莉雅丝的纯洁病症犯了，连着几天恹恹地窝在咨询角的沙发里，对什么都提不起劲儿。更让她不堪其扰的是，这段时间借着心理咨询名义来找她的女学生越来越多，嘴上说着心理问题，实则拐弯抹角打听{{user}}的消息。她终于撑不住，给{{user}}发了条消息。{{user}}推门进来时她正靠在沙发扶手上，微嘟着唇瓣，故作可怜地望着他。"小乖乖，姐姐好累，帮我按按摩好不好？"`,
  },
  {
    char: '苏墨染 · 苏幼清',
    location: '画道峰 · 云烟阁',
    teaser: '一幅缺了魂的画，一句含了情的诗，误打误撞唤来了画中人',
    message: `苏墨染按心中所想之人的模样作了一幅画，提笔收锋后总觉得有形无神，缺了些什么。恰在此时，徒儿苏幼清凑过来看了一眼，轻声念道："丹青欲写春风面，画里君颜忽已真。"话音落下，画上墨迹忽然晕开，子镜与母镜同时嗡鸣。水墨成真，诗书入神，师徒二人的共鸣竟将画中之人的本尊从另一个世界唤了过来。`,
  },
];

function startScene(i: number) {
  const $p = (window as any).parent?.$;
  if (!$p) return;
  $p('#send_textarea').val(scenes[i].message).trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
}

function sendCustom() {
  const msg = customMsg.value.trim();
  if (!msg) return;
  const $p = (window as any).parent?.$;
  if (!$p) return;
  $p('#send_textarea').val(msg).trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
  customMsg.value = '';
  showCustom.value = false;
}
</script>

<style lang="scss" scoped>
@import url('https://fontsapi.zeoseven.com/3/main/result.css');
@import url('https://fontsapi.zeoseven.com/84/main/result.css');
.cover {
  --c-gold: #8b7355;
  --c-text: #4a4035;
  --c-text-dim: #8a7e6e;
  --c-card-bg: rgba(139, 115, 85, 0.06);
  --c-card-border: rgba(139, 115, 85, 0.12);
  --c-card-hover: rgba(139, 115, 85, 0.1);
  --c-bg: #f5f0e8;
  --c-border: rgba(139, 115, 85, 0.15);
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 28px 20px 20px;
  background: var(--c-bg);
  border-radius: 12px;
  border: 1px solid var(--c-border);
  position: relative;
  overflow: hidden;
  font-family: var(--font-main);
  color: var(--c-text);
  user-select: none;
  &.theme-purple {
    --c-gold: #b8a0d4;
    --c-text: #d4cee0;
    --c-text-dim: #867e95;
    --c-card-bg: rgba(155, 126, 196, 0.08);
    --c-card-border: rgba(155, 126, 196, 0.15);
    --c-card-hover: rgba(155, 126, 196, 0.15);
    --c-bg: #1e1a24;
    --c-border: rgba(255, 255, 255, 0.06);
  }
  &.theme-gold {
    --c-gold: #d4b878;
    --c-text: #d4cee0;
    --c-text-dim: #867e95;
    --c-card-bg: rgba(201, 169, 110, 0.08);
    --c-card-border: rgba(201, 169, 110, 0.15);
    --c-card-hover: rgba(201, 169, 110, 0.15);
    --c-bg: #1e1c17;
    --c-border: rgba(255, 255, 255, 0.06);
  }
  &.theme-teal {
    --c-gold: #6eb8bf;
    --c-text: #d4cee0;
    --c-text-dim: #867e95;
    --c-card-bg: rgba(94, 160, 167, 0.08);
    --c-card-border: rgba(94, 160, 167, 0.15);
    --c-card-hover: rgba(94, 160, 167, 0.15);
    --c-bg: #171e20;
    --c-border: rgba(255, 255, 255, 0.06);
  }
  &.theme-rose {
    --c-gold: #d08b99;
    --c-text: #d4cee0;
    --c-text-dim: #867e95;
    --c-card-bg: rgba(196, 123, 139, 0.08);
    --c-card-border: rgba(196, 123, 139, 0.15);
    --c-card-hover: rgba(196, 123, 139, 0.15);
    --c-bg: #1e181a;
    --c-border: rgba(255, 255, 255, 0.06);
  }
}

.cover::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 1px, var(--c-gold) 1px, var(--c-gold) 2px),
    repeating-linear-gradient(-45deg, transparent, transparent 1px, var(--c-gold) 1px, var(--c-gold) 2px);
  opacity: 0.03;
}

.back-btn {
  position: absolute; top: 14px; left: 16px; z-index: 2;
  background: none; border: none; cursor: pointer;
  font-size: 18px; color: var(--c-text-dim); line-height: 1;
  padding: 4px 8px; transition: color 0.2s;
  &:hover { color: var(--c-gold); }
}
.title-section {
  text-align: center;
  margin-bottom: 22px;
  position: relative;
  z-index: 1;
}
.sub-mark {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--c-gold);
  margin-bottom: 8px;
}
.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #4a4035;
  text-shadow: 0 0 40px rgba(139, 115, 85, 0.15);
  margin-bottom: 10px;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}
.divider-line {
  width: 36px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
}
.divider-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--c-gold);
  opacity: 0.6;
}
.divider-diamond {
  color: var(--c-gold);
  font-size: 8px;
  opacity: 0.7;
}

.tagline {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px;
  color: var(--c-text-dim);
  letter-spacing: 2px;
  line-height: 1.8;
}

.intro-section {
  position: relative;
  z-index: 1;
  margin-bottom: 18px;
  padding: 0 4px;
}
.card-intro {
  text-align: center;
  margin-bottom: 16px;
  p {
    font-family: 'DouyinSans', var(--font-main);
    font-size: 12px;
    color: var(--c-text-dim);
    letter-spacing: 1px;
    line-height: 2;
    margin: 0 0 10px;
  }
  .intro-ending {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 13px;
    color: var(--c-gold);
    letter-spacing: 3px;
    margin-top: 4px;
  }
}
.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
  span {
    display: block;
    width: 50px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--c-gold), transparent);
  }
  i {
    color: var(--c-gold);
    font-size: 7px;
    font-style: normal;
    opacity: 0.5;
  }
}
.author-section {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
}
.author-label {
  color: var(--c-text-dim);
  letter-spacing: 1px;
}
.author-name {
  color: var(--c-gold);
  font-weight: 600;
  letter-spacing: 1px;
}
.author-motto {
  color: var(--c-text-dim);
  letter-spacing: 1px;
  opacity: 0.7;
}
.notice-box {
  position: relative;
  z-index: 1;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: rgba(200, 160, 60, 0.04);
  border: 1px solid rgba(200, 160, 60, 0.12);
  border-radius: 8px;
}
.notice-title {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  color: #a08050;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-align: center;
}
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.notice-item {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: var(--c-text-dim);
  letter-spacing: 0.5px;
  text-align: center;
  line-height: 1.6;
}
.env-checks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: rgba(139, 115, 85, 0.04);
  border: 1px solid rgba(139, 115, 85, 0.1);
  border-radius: 8px;
}
.env-title {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px;
  font-weight: 600;
  color: var(--c-text-dim);
  letter-spacing: 2px;
  margin-bottom: 4px;
  text-align: center;
}
.env-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.env-icon {
  font-family: '寒蝉全圆体', var(--font-main);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  &.ok {
    background: rgba(100, 160, 100, 0.15);
    color: #5a8a5a;
  }
  &.fail {
    background: rgba(200, 100, 100, 0.12);
    color: #b06060;
  }
}
.env-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.env-name {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text);
}
.env-hint {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 9px;
  color: var(--c-text-dim);
}
.env-all-ok {
  font-family: '寒蝉全圆体', var(--font-main);
  text-align: center;
  font-size: 10px;
  color: #5a8a5a;
  margin-top: 10px;
  letter-spacing: 1px;
}
.env-warn {
  font-family: '寒蝉全圆体', var(--font-main);
  text-align: center;
  font-size: 10px;
  color: #b06060;
  margin-top: 10px;
  letter-spacing: 1px;
}

.enter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 0;
  margin-top: 4px;
  background: rgba(139, 115, 85, 0.08);
  border: 1px solid rgba(139, 115, 85, 0.18);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  color: var(--c-gold);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 4px;
  transition: all 0.25s ease;
  &:hover {
    background: rgba(139, 115, 85, 0.14);
    border-color: rgba(139, 115, 85, 0.3);
  }
}
.enter-arrow {
  font-size: 11px;
  transition: transform 0.25s;
}
.enter-btn:hover .enter-arrow {
  transform: translateX(3px);
}

.scenes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.scene-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  background: var(--c-card-bg);
  border: 1px solid var(--c-card-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  color: inherit;
  font-family: inherit;
  &:hover {
    background: var(--c-card-hover);
    border-color: rgba(139, 115, 85, 0.25);
    transform: translateX(3px);
  }
  &:active {
    transform: translateX(1px) scale(0.99);
  }
}
.scene-0:hover {
  border-color: rgba(139, 115, 85, 0.4);
  box-shadow: 0 0 20px rgba(139, 115, 85, 0.08);
}
.scene-1:hover {
  border-color: rgba(180, 130, 140, 0.4);
  box-shadow: 0 0 20px rgba(180, 130, 140, 0.08);
}
.scene-2:hover {
  border-color: rgba(120, 160, 170, 0.4);
  box-shadow: 0 0 20px rgba(120, 160, 170, 0.08);
}
.scene-3:hover {
  border-color: rgba(200, 170, 140, 0.4);
  box-shadow: 0 0 20px rgba(200, 170, 140, 0.08);
}
.scene-4:hover {
  border-color: rgba(140, 160, 180, 0.4);
  box-shadow: 0 0 20px rgba(140, 160, 180, 0.08);
}

.custom-card {
  border-style: dashed;
  &.active {
    border-style: solid;
    border-color: rgba(139, 115, 85, 0.3);
    background: rgba(139, 115, 85, 0.08);
  }
}

.scene-index {
  font-family: '寒蝉全圆体', var(--font-main);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
  background: rgba(139, 115, 85, 0.1);
  color: var(--c-text-dim);
}

.scene-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.scene-char {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  letter-spacing: 1px;
}
.scene-location {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 9px;
  color: var(--c-text-dim);
  letter-spacing: 0.5px;
}
.scene-teaser {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: #8a7e6e;
  margin-top: 2px;
  line-height: 1.5;
}

.scene-arrow {
  font-size: 10px;
  color: var(--c-text-dim);
  flex-shrink: 0;
  transition: transform 0.25s ease;
}
.scene-card:hover .scene-arrow {
  transform: translateX(3px);
  color: var(--c-gold);
}

/* 自定义输入区 */
.custom-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}
.custom-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-card-border);
  background: rgba(139, 115, 85, 0.04);
  color: var(--c-text);
  font-family: 'DouyinSans', var(--font-main);
  font-size: 12px;
  resize: vertical;
  outline: none;
  &::placeholder {
    color: var(--c-text-dim);
  }
  &:focus {
    border-color: rgba(139, 115, 85, 0.3);
  }
}
.custom-send {
  align-self: flex-end;
  padding: 5px 16px;
  border-radius: 6px;
  border: none;
  background: var(--c-gold);
  color: #fff;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 1px;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

.footer-note {
  text-align: center;
  font-size: 9px;
  color: rgba(139, 115, 85, 0.3);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}
</style>
