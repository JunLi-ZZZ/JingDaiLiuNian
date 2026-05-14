<template>
  <!-- 前置页：环境检测 + 简介 -->
  <div v-if="showIntro" class="cover" :class="`theme-${theme}`">
    <div class="mist mist-1"></div>
    <div class="mist mist-2"></div>

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
      <p class="intro-text">
        多元位面交汇于星见市。来自不同世界的访客融入现代社会，<br />
        而你，手握一面流转千年的古镜，与她们命运交织。
      </p>

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

    <button class="enter-btn" @click="showIntro = false">
      进入
      <span class="enter-arrow">→</span>
    </button>
  </div>

  <!-- 开局选择页 -->
  <div v-else class="cover" :class="`theme-${theme}`">
    <div class="mist mist-1"></div>
    <div class="mist mist-2"></div>

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
      <p class="tagline">多元位面交汇于星见市<br />你的故事，从此刻开始</p>
    </div>

    <div class="scenes">
      <button
        v-for="(scene, i) in scenes"
        :key="i"
        class="scene-card"
        :class="`scene-${i}`"
        @click="startScene(i)"
      >
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
        <button class="custom-send" @click.stop="sendCustom" :disabled="!customMsg.trim()">发送</button>
      </div>
    </div>

    <p class="footer-note">选择一幕，开启你的镜中之旅</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
function onStorage(e: StorageEvent) { if (e.key === 'jdnl_theme' && e.newValue) theme.value = e.newValue; }
onMounted(() => { addEventListener('storage', onStorage); });
onUnmounted(() => { removeEventListener('storage', onStorage); });

const showIntro = ref(true);
const showCustom = ref(false);
const customMsg = ref('');

function detectExt(name: string): boolean {
  try {
    const p = (window as any).parent;
    if (!p) return false;
    switch (name) {
      case '酒馆助手': return !!(p.TavernHelper || p.tavern_helper);
      case '提示词模板': return !!(p.EjsTemplate);
      case 'MVU 变量框架': return !!(p.Mvu || p.MagVarUpdate);
      default: return false;
    }
  } catch { return false; }
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
    location: '星见大学 · 导师办公室',
    teaser: '导师唤你前去，却不知冰冷外表下藏着别样心思',
    message: `虞姝昀将{{user}}叫到她的办公室，故意装着板着脸的样子，当{{user}}以为她生气，老老实实过去时，她喜笑颜开的捏着{{user}}脸蛋，打趣着笑道："小夫君成年后急着自己一个人住，难道是男孩子要做什么见不得人的事情吗？"`,
  },
  {
    char: '涂山素凝',
    location: '学府区 · 小狐狸的温馨小窝',
    teaser: '本是来探望干妈，却被一只撒娇的小狐狸截了胡',
    message: `{{user}}原本来看望虞姝昀的，结果被涂山素凝抢先一步拉进自己家里。小狐狸撒着娇要抱抱，抱的却有些得意忘形了，把狐狸尾巴露出来了。然后不管不顾的打着呜，眨巴着眼睛轻声说着是coser道具。`,
  },
  {
    char: '慕容霁宁',
    location: '星见大学 · 教学楼外',
    teaser: '绵绵细雨困住了你，可靠的小师姐撑着伞款款而来',
    message: `研究生又是没课清闲的一天，可是天下小雨。正当{{user}}在工位出来有些不知所措之际，那可靠的小师姐慕容霁宁出现给{{user}}送来了雨伞，带着{{user}}回到自家，然后就叫嚷着怕{{user}}着凉感冒，要亲自带他去洗澡。`,
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
@import url("https://fontsapi.zeoseven.com/3/main/result.css");
@import url("https://fontsapi.zeoseven.com/84/main/result.css");
.cover {
  --c-gold: #8b7355;
  --c-text: #4a4035;
  --c-text-dim: #8a7e6e;
  --c-card-bg: rgba(139, 115, 85, 0.06);
  --c-card-border: rgba(139, 115, 85, 0.12);
  --c-card-hover: rgba(139, 115, 85, 0.1);
  --c-bg: linear-gradient(175deg, #f5f0e8 0%, #ede6d8 40%, #faf7f0 100%);
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
  &.theme-purple { --c-gold:#b8a0d4; --c-text:#d4cee0; --c-text-dim:#867e95; --c-card-bg:rgba(155,126,196,0.08); --c-card-border:rgba(155,126,196,0.15); --c-card-hover:rgba(155,126,196,0.15); --c-bg:linear-gradient(175deg, #1e1a24 0%, #252131 40%, #1f1c26 100%); --c-border:rgba(255,255,255,0.06); }
  &.theme-gold { --c-gold:#d4b878; --c-text:#d4cee0; --c-text-dim:#867e95; --c-card-bg:rgba(201,169,110,0.08); --c-card-border:rgba(201,169,110,0.15); --c-card-hover:rgba(201,169,110,0.15); --c-bg:linear-gradient(175deg, #1e1c17 0%, #25221c 40%, #1d1b16 100%); --c-border:rgba(255,255,255,0.06); }
  &.theme-teal { --c-gold:#6eb8bf; --c-text:#d4cee0; --c-text-dim:#867e95; --c-card-bg:rgba(94,160,167,0.08); --c-card-border:rgba(94,160,167,0.15); --c-card-hover:rgba(94,160,167,0.15); --c-bg:linear-gradient(175deg, #171e20 0%, #1c2325 40%, #161d1e 100%); --c-border:rgba(255,255,255,0.06); }
  &.theme-rose { --c-gold:#d08b99; --c-text:#d4cee0; --c-text-dim:#867e95; --c-card-bg:rgba(196,123,139,0.08); --c-card-border:rgba(196,123,139,0.15); --c-card-hover:rgba(196,123,139,0.15); --c-bg:linear-gradient(175deg, #1e181a 0%, #251c1f 40%, #1c1719 100%); --c-border:rgba(255,255,255,0.06); }
}

.mist {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.1;
  pointer-events: none;
}
.mist-1 {
  width: 180px; height: 120px;
  background: #c9a96e;
  top: -30px; right: -40px;
}
.mist-2 {
  width: 200px; height: 100px;
  background: #b8a090;
  bottom: 40px; left: -60px;
}

.title-section { text-align: center; margin-bottom: 22px; position: relative; z-index: 1; }
.sub-mark { font-family: '寒蝉全圆体', var(--font-main); font-size: 11px; letter-spacing: 4px; color: var(--c-gold); margin-bottom: 8px; }
.title { font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #4a4035; text-shadow: 0 0 40px rgba(139, 115, 85, 0.15); margin-bottom: 10px; }

.divider { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 10px; }
.divider-line { width: 36px; height: 1px; background: linear-gradient(90deg, transparent, var(--c-gold), transparent); }
.divider-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--c-gold); opacity: 0.6; }
.divider-diamond { color: var(--c-gold); font-size: 8px; opacity: 0.7; }

.tagline { font-family: 'DouyinSans', var(--font-main); font-size: 11px; color: var(--c-text-dim); letter-spacing: 2px; line-height: 1.8; }

.intro-section {
  position: relative; z-index: 1;
  margin-bottom: 18px;
  padding: 0 4px;
}
.intro-text {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 11px; color: var(--c-text-dim); letter-spacing: 1px;
  line-height: 1.9; text-align: center; margin-bottom: 18px;
}
.env-checks {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 14px;
  background: rgba(139, 115, 85, 0.04);
  border: 1px solid rgba(139, 115, 85, 0.1);
  border-radius: 8px;
}
.env-title {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 10px; font-weight: 600; color: var(--c-text-dim);
  letter-spacing: 2px; margin-bottom: 4px; text-align: center;
}
.env-row { display: flex; align-items: center; gap: 10px; }
.env-icon {
  font-family: '寒蝉全圆体', var(--font-main);
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
  &.ok { background: rgba(100, 160, 100, 0.15); color: #5a8a5a; }
  &.fail { background: rgba(200, 100, 100, 0.12); color: #b06060; }
}
.env-info { display: flex; flex-direction: column; gap: 1px; }
.env-name { font-family: '寒蝉全圆体', var(--font-main); font-size: 11px; font-weight: 600; color: var(--c-text); }
.env-hint { font-family: 'DouyinSans', var(--font-main); font-size: 9px; color: var(--c-text-dim); }
.env-all-ok { font-family: '寒蝉全圆体', var(--font-main); text-align: center; font-size: 10px; color: #5a8a5a; margin-top: 10px; letter-spacing: 1px; }
.env-warn { font-family: '寒蝉全圆体', var(--font-main); text-align: center; font-size: 10px; color: #b06060; margin-top: 10px; letter-spacing: 1px; }

.enter-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 10px 0; margin-top: 4px;
  background: rgba(139, 115, 85, 0.08);
  border: 1px solid rgba(139, 115, 85, 0.18);
  border-radius: 8px; cursor: pointer; position: relative; z-index: 1;
  color: var(--c-gold); font-family: '寒蝉全圆体', var(--font-main); font-size: 13px; font-weight: 600;
  letter-spacing: 4px;
  transition: all 0.25s ease;
  &:hover { background: rgba(139, 115, 85, 0.14); border-color: rgba(139, 115, 85, 0.3); }
}
.enter-arrow { font-size: 11px; transition: transform 0.25s; }
.enter-btn:hover .enter-arrow { transform: translateX(3px); }

.scenes { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; position: relative; z-index: 1; }

.scene-card {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 12px 14px;
  background: var(--c-card-bg); border: 1px solid var(--c-card-border);
  border-radius: 8px; cursor: pointer; transition: all 0.25s ease;
  text-align: left; color: inherit; font-family: inherit;
  &:hover { background: var(--c-card-hover); border-color: rgba(139, 115, 85, 0.25); transform: translateX(3px); }
  &:active { transform: translateX(1px) scale(0.99); }
}
.scene-0:hover { border-color: rgba(139, 115, 85, 0.4); box-shadow: 0 0 20px rgba(139, 115, 85, 0.08); }
.scene-1:hover { border-color: rgba(180, 130, 140, 0.4); box-shadow: 0 0 20px rgba(180, 130, 140, 0.08); }
.scene-2:hover { border-color: rgba(120, 160, 170, 0.4); box-shadow: 0 0 20px rgba(120, 160, 170, 0.08); }

.custom-card {
  border-style: dashed;
  &.active { border-style: solid; border-color: rgba(139, 115, 85, 0.3); background: rgba(139, 115, 85, 0.08); }
}

.scene-index {
  font-family: '寒蝉全圆体', var(--font-main);
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; flex-shrink: 0;
  background: rgba(139, 115, 85, 0.1); color: var(--c-text-dim);
}

.scene-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.scene-char { font-family: '寒蝉全圆体', var(--font-main); font-size: 13px; font-weight: 600; color: var(--c-text); letter-spacing: 1px; }
.scene-location { font-family: 'DouyinSans', var(--font-main); font-size: 9px; color: var(--c-text-dim); letter-spacing: 0.5px; }
.scene-teaser { font-family: 'DouyinSans', var(--font-main); font-size: 10px; color: #8a7e6e; margin-top: 2px; line-height: 1.5; }

.scene-arrow {
  font-size: 10px; color: var(--c-text-dim); flex-shrink: 0;
  transition: transform 0.25s ease;
}
.scene-card:hover .scene-arrow { transform: translateX(3px); color: var(--c-gold); }

/* 自定义输入区 */
.custom-area {
  display: flex; flex-direction: column; gap: 6px;
  padding: 4px 0;
}
.custom-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--c-card-border);
  background: rgba(139, 115, 85, 0.04);
  color: var(--c-text);
  font-family: 'DouyinSans', var(--font-main); font-size: 12px;
  resize: vertical;
  outline: none;
  &::placeholder { color: var(--c-text-dim); }
  &:focus { border-color: rgba(139, 115, 85, 0.3); }
}
.custom-send {
  align-self: flex-end;
  padding: 5px 16px;
  border-radius: 6px;
  border: none;
  background: var(--c-gold);
  color: #fff;
  font-family: '寒蝉全圆体', var(--font-main); font-size: 11px; font-weight: 600;
  cursor: pointer; letter-spacing: 1px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: default; }
}

.footer-note {
  text-align: center; font-size: 9px;
  color: rgba(139, 115, 85, 0.3);
  letter-spacing: 2px; position: relative; z-index: 1;
}
</style>
