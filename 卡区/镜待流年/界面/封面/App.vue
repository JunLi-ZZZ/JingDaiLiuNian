<template>
  <!-- 前置页：环境检测 + 简介 -->
  <div v-if="page === 'intro'" class="cover" :class="`theme-${theme}`">
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
        <p>一面古镜，万千位面。镜渡随心，皆为归处</p>
        <p>未知世界，同人绮梦，未结因果。尽收镜中</p>
        <p>娇俏佳人，卸下光环。现世日常，隐于烟火</p>
        <p>悬书为引，循迹落网。因果交织，如约降临</p>
        <p>你的钟爱，何必限于卡中。吾心安处即吾乡</p>
        <p class="intro-ending">镜待流年，故事无限</p>
      </div>

      <div class="section-divider"><span></span><i>◇</i><span></span></div>

      <div class="env-checks">
        <div class="env-title">环境检测</div>
        <div class="env-items">
          <div v-for="ext in extensions" :key="ext.name" class="env-row">
            <span class="env-icon" :class="ext.ok ? 'ok' : 'fail'">{{ ext.ok ? '✓' : '✗' }}</span>
            <div class="env-info">
              <span class="env-name">{{ ext.name }}</span>
              <span class="env-hint">{{ ext.hint }}</span>
            </div>
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
    <button class="enter-btn" @click="page = 'tools'">
      进入
      <span class="enter-arrow">→</span>
    </button>
  </div>

  <!-- 工具页：自定义主角 + 镜渡 -->
  <div v-if="page === 'tools'" class="cover" :class="`theme-${theme}`">
    <button class="back-btn" @click="page = 'intro'">←</button>
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
      <p class="tagline">塑造你的故事</p>
    </div>
    <div class="tools-tabs">
      <button :class="{ active: toolsTab === 'protag' }" @click="toolsTab = toolsTab === 'protag' ? '' : 'protag'">
        自定义主角
      </button>
      <button :class="{ active: toolsTab === 'mirror' }" @click="toolsTab = toolsTab === 'mirror' ? '' : 'mirror'">
        镜 渡
      </button>
      <button :class="{ active: toolsTab === 'story' }" @click="toolsTab = toolsTab === 'story' ? '' : 'story'">
        自定义剧情
      </button>
    </div>
    <div class="tools-section">
      <ProtagonistPanel v-show="toolsTab === 'protag'" />
      <MirrorPanel v-show="toolsTab === 'mirror'" @close="toolsTab = 'protag'" />
      <StoryPanel v-show="toolsTab === 'story'" />
    </div>
    <button class="enter-btn" @click="page = 'dlc'">
      继续
      <span class="enter-arrow">→</span>
    </button>
  </div>

  <!-- DLC 选择页 -->
  <div v-if="page === 'dlc'" class="cover" :class="`theme-${theme}`">
    <button class="back-btn" @click="page = 'tools'">←</button>
    <div class="title-section">
      <div class="sub-mark">✦ 浮世千面 ✦</div>
      <h1 class="title">镜 待 流 年</h1>
      <div class="divider">
        <span class="divider-dot"></span><span class="divider-line"></span>
        <span class="divider-diamond">◇</span>
        <span class="divider-line"></span><span class="divider-dot"></span>
      </div>
      <p class="tagline">选择你想要的旅途</p>
    </div>
    <div class="dlc-list">
      <button class="dlc-card" @click="selectDlc('main')">
        <span class="dlc-index">✦</span>
        <div class="dlc-body">
          <span class="dlc-name">原版故事</span>
          <span class="dlc-desc">主世界 · 星见市。来自不同位面的红颜融入现代都市，在日常烟火里与你相遇</span>
        </div>
        <span class="scene-arrow"></span>
      </button>
      <button class="dlc-card" @click="selectDlc('xianDao')">
        <span class="dlc-index">☯</span>
        <div class="dlc-body">
          <span class="dlc-name">苍溟界<span class="dlc-type">[仙道]</span></span>
          <span class="dlc-desc">宗门林立，灵气充沛。画道峰上墨香未散，云烟阁里诗韵正浓</span>
        </div>
        <span class="scene-arrow"></span>
      </button>
      <button class="dlc-card" @click="selectDlc('hongHuang')">
        <span class="dlc-index">≋</span>
        <div class="dlc-body">
          <span class="dlc-name">莽苍太古界<span class="dlc-type">[洪荒]</span></span>
          <span class="dlc-desc">万妖祖地，异兽横行。莽苍太古界与主世界意外接壤，奇珍异兽涌入现代都市</span>
        </div>
        <span class="scene-arrow"></span>
      </button>
      <button class="dlc-card" @click="selectDlc('yanYun')">
        <span class="dlc-index">✿</span>
        <div class="dlc-body">
          <span class="dlc-name">晏云界<span class="dlc-type">[古风唯美]</span></span>
          <span class="dlc-desc">东方古风画卷，皇权与龙脉交织。宫阙九重深几许，红袖簪花待君来</span>
        </div>
        <span class="scene-arrow"></span>
      </button>
    </div>
    <div class="scene-card custom-card" :class="{ active: showCustom }" @click="toggleCustom">
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
    <p class="footer-note">更多故事，敬请期待</p>
  </div>

  <!-- 开局选择页 -->
  <div v-if="page === 'scenes'" class="cover" :class="`theme-${theme}`">
    <button class="back-btn" @click="page = 'dlc'">←</button>
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
      <button
        v-for="(scene, i) in activeScenes"
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
    </div>

    <p class="footer-note">选择一幕，开启你的镜中之旅</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import MirrorPanel from '../shared/MirrorPanel.vue';
import ProtagonistPanel from '../shared/ProtagonistPanel.vue';
import StoryPanel from '../shared/StoryPanel.vue';

const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
const toolsTab = ref('');
function onStorage(e: StorageEvent) {
  if (e.key === 'jdnl_theme' && e.newValue) theme.value = e.newValue;
}
onMounted(() => {
  addEventListener('storage', onStorage);
});
onUnmounted(() => {
  removeEventListener('storage', onStorage);
});

const page = ref('intro');
const showCustom = ref(false);
const customMsg = ref('');

async function toggleCustom() {
  showCustom.value = !showCustom.value;
  if (showCustom.value) {
    const TH = (window as any).parent?.TavernHelper;
    if (TH) {
      const wbName = TH.getCharLorebooks()?.primary;
      if (wbName) {
        const entries = await TH.getLorebookEntries(wbName);
        const ops: { uid: number; enabled: boolean }[] = [];
        const map = dlcEntryMap[currentDlc.value];
        if (map) {
          for (const name of map.disable) {
            const e = entries.find((x: any) => x.comment === name || x.display_name === name);
            if (e && e.enabled) ops.push({ uid: e.uid, enabled: false });
          }
        }
        if (ops.length) await TH.setLorebookEntries(wbName, ops);
      }
    }
  }
}

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

const currentDlc = ref('main');
const mainScenes = [
  {
    char: '虞姝昀',
    location: '新湖区 · {{user}}的公寓',
    teaser: '搬出来独居好几年了，干妈却还是老一套小把戏',
    message: `根据以下设定构建剧情开头：
时间：傍晚
地点：{{user}}的公寓（主世界·新湖区）
出场角色：虞姝昀
剧情大纲：{{user}}搬出独居好几年了，虞姝昀至今仍把这当成换个地方照顾他。这天傍晚{{user}}回家，发现虞姝昀用"家里停水"的理由进了他家，刚洗完澡裹着浴袍靠在沙发上，茶几上摆着新买的草莓。她让{{user}}帮她看看新买的浴袍合不合身，在他面前转了一圈，展示着那傲人的身段。`,
  },
  {
    char: '涂山素凝 · 涂山曦华',
    location: '学府区与新湖区交界 · 涂山姐妹的温馨小楼',
    teaser: '推开门撞见姐妹俩在沙发上闹作一团，春光乍泄的画面比想象中更香艳',
    message: `根据以下设定构建剧情开头：
时间：下午
地点：涂山素凝与涂山曦华家客厅（主世界·学府区与新湖区交界）
出场角色：涂山素凝、涂山曦华
剧情大纲：{{user}}去素凝家串门，推开门发现素凝正把曦华压在沙发上玩闹。两人衣裙凌乱，狐耳狐尾全露了出来，姿势暧昧得像是在做那些百合间不可描述的事。素凝看到{{user}}正要欣喜出声，曦华已经微红着脸坐起来整理衣襟。素凝只好眨巴眼睛解释说狐耳和狐尾是coser道具，曦华默契地帮她圆场，然后解释说刚刚是自己肩膀不舒服，素凝在帮她按摩。`,
  },
  {
    char: '慕容霁宁',
    location: '新湖区 · {{user}}的公寓',
    teaser: '暑假的雨季，小师姐撑着油纸伞款款而来，说江南有座园林在等你',
    message: `根据以下设定构建剧情开头：
时间：暑假某日下午，小雨
地点：{{user}}的公寓门口（主世界·新湖区）
出场角色：慕容霁宁
剧情大纲：暑假刚开始，星见市下着绵绵细雨。慕容霁宁撑着一柄油纸伞出现在{{user}}公寓门前，说在南方一处风景秀美的江南小镇，她刚刚买下一座精致的小园林做那避暑山庄，觉着{{user}}会喜欢便趁着暑假想邀{{user}}一起去看看。`,
  },
  {
    char: '伊莉雅丝',
    location: '学府区与新湖区交界 · 白伊心理咨询角',
    teaser: '纯洁病症发作，疲惫的纯白女王需要你的温度',
    message: `根据以下设定构建剧情开头：
时间：下午
地点：伊莉雅丝家一楼心理咨询角（主世界·学府区与新湖区交界）
出场角色：伊莉雅丝
剧情大纲：伊莉雅丝的纯洁病症犯了，连着几天对什么都提不起劲儿。这段时间借着心理咨询名义来找她打听{{user}}消息的女学生越来越多，让她身心俱疲。她撑不住了，把{{user}}叫来，微嘟着唇瓣，故作可怜地让他帮自己按按摩。`,
  },
  {
    char: '薇奥莱塔',
    location: '新湖区 · {{user}}的公寓',
    teaser: '初冬第一场小雪，纯洁版剑之圣女化身薇奥莱塔穿越而来',
    message: `根据以下设定构建剧情开头：
时间：初冬傍晚，飘着第一场小雪
地点：{{user}}的公寓客厅（主世界·新湖区）
出场角色：薇奥莱塔
剧情大纲：初冬的第一场小雪悄无声息地落下来时，{{user}}刚从外面回到家，还没来得及开灯。客厅里有一团微弱的金色光芒在闪烁——那是子镜的波纹。光芒消散后，一个金发垂落、双眼蒙着黑色布条的女子踉跄着跌坐在地板上，半透的白袍因身形而紧贴在身上，手中那柄天秤剑磕在地砖上发出清脆的声响。她抬起头，无法聚焦的眼眸朝着门口的方向望过来，用带着异域口音的轻柔嗓音试探着问这里是不是她镜中看到的那个人的住处。`,
  },
];
const xianDaoScenes = [
  {
    char: '苏墨染 · 苏幼清',
    location: '画道峰 · 云烟阁',
    teaser: '一幅缺了魂的画，一句含了情的诗，误打误撞唤来了画中人',
    message: `根据以下设定构建剧情开头：
时间：清晨
地点：画道峰云烟阁（苍溟界）
出场角色：苏墨染、苏幼清
剧情大纲：苏墨染按心中所想之人的模样作了一幅画，画完后总觉得有形无神。徒儿苏幼清凑过来看了一眼，喃喃念了一句诗——那声音轻得像梦里念叨过无数遍的句子。话音落下，画上墨迹忽然晕开，子镜与母镜同时嗡鸣，师徒二人的共鸣竟将画中人的本尊从另一个世界唤了过来。`,
  },
];
const hongHuangScenes = [
  {
    char: '白糯糯 · 陶冶月',
    location: '东海州 · 位面裂隙附近',
    teaser: '一只小兔子慌不择路穿过位面裂隙，身后追来一只贪她软毛的饕餮大妖',
    message: `根据以下设定构建剧情开头：
时间：黄昏
地点：星见市郊外（主世界·东海州，位面裂隙附近）
出场角色：白糯糯、陶冶月
剧情大纲：洪荒与主世界边界重叠，穿越两个位面的裂隙常年存在……一只垂耳玉兔穿过裂隙，慌不择路撞进了{{user}}怀里，化作一团温香软玉的人形。身后追来的饕餮大妖停在不远处，歪头看着{{user}}把那刚化形未着寸缕的娇软小美人护在身后的样子，饶有兴致地蹲了下来瞪大眼睛看着这一幕。一副跃跃欲试也想要抱抱的模样，可似乎觉得原形不方便，便学着化作人形。`,
  },
];
const yanYunScenes = [
  {
    char: '沈晚絮',
    location: '太渊城 · 沈氏商号书房',
    teaser: '秉烛夜读，一灯如豆，两人对坐。一人看诗，一人却在看另一人',
    message: `根据以下设定构建剧情开头：
时间：深夜
地点：沈氏商号书房（晏云界·太渊城）
出场角色：沈晚絮
剧情大纲：江南微凉的秋夜，书房里一灯如豆。沈晚絮在案前拨着算盘核对账目，{{user}}坐在另一侧执卷读诗。满室只有算珠轻响与翻页声。算珠声渐渐慢了，末了歇了下来。她手边的账本停在同一页许久，目光早已落在{{user}}低眉读诗的侧脸上。烛花轻轻爆了一下，她回过神，垂眸翻过一页账册。`,
  },
  {
    char: '晏云舒 · 姬望舒',
    location: '太渊城 · 静安王府',
    teaser: '天子与国师微服登门，一道不便明说的托付，将静安王请入九重宫阙',
    message: `根据以下设定构建剧情开头：
时间：午后
地点：静安王府（晏云界·太渊城）
出场角色：晏云舒、姬望舒
剧情大纲：晏云舒以"晏九渊"的身份与国师姬望舒微服到访静安王府。落座奉茶后，姬望舒将皇室困境和盘托出——天子实为女子之身，朝中催嗣日急，藩王蠢蠢欲动。她们希望{{user}}以"协理后宫事务"的名义入住宫中。至于入宫后真正需要他做什么，姬望舒没有明说，但话里话外的意思已经再清楚不过，不过是与后宫环肥燕瘦行那夫妻之实、孕以子嗣，以堵住众人之口。晏云舒坐在一旁，自始至终没有开口，只是偶尔抬眸看{{user}}一眼，又很快移开。姬望舒将话说完了，等他答复。`,
  },
  {
    char: '白芙澪',
    location: '坠月幽谷 · 听雨竹楼',
    teaser: '皇室数次求药皆被一句"无缘"挡回，静安王亲至幽谷，帘后那位冷面医仙亲自打破了规矩',
    message: `根据以下设定构建剧情开头：
时间：清晨
地点：坠月幽谷听雨竹楼（晏云界）
出场角色：白芙澪
剧情大纲：晏云舒曾数次派人入坠月幽谷向白芙澪求药，次次被一句"无缘"挡回。{{user}}听闻此事，亲自策马前往幽谷替晏云舒求药。竹楼二层，白芙澪照例悬丝垂帘，冷声让来者自报来意。在{{user}}说完来意后，楼上沉默了片刻。悬丝收了，帘子也撩开了。她从竹楼上走下来，虽仍是那副清冷的眉眼，只是眼底多了一份异彩，她径直走到药炉前，美目流转间，亲手为他烹了一壶茶。`,
  },
];
const activeScenes = computed(() =>
  currentDlc.value === 'hongHuang'
    ? hongHuangScenes
    : currentDlc.value === 'xianDao'
      ? xianDaoScenes
      : currentDlc.value === 'yanYun'
        ? yanYunScenes
        : mainScenes,
);

async function startScene(i: number) {
  const $p = (window as any).parent?.$;
  if (!$p) return;
  const TH = (window as any).parent?.TavernHelper;
  if (TH) {
    const wbName = TH.getCharLorebooks()?.primary;
    if (wbName) {
      const key = `${currentDlc.value}_${i}`;
      const map = sceneEntryMap[key as any];
      if (map) {
        const entries = await TH.getLorebookEntries(wbName);
        const hasCustomUser = entries.some((x: any) =>
          (x.comment === 'user人设(自定义)' || x.display_name === 'user人设(自定义)' || x.name === 'user人设(自定义)') && x.enabled,
        );
        const ops: { uid: number; enabled: boolean }[] = [];
        for (const name of map.enable) {
          if (hasCustomUser && name.startsWith('user人设')) continue;
          const e = entries.find((x: any) => x.comment === name || x.display_name === name || x.name === name);
          if (e) ops.push({ uid: e.uid, enabled: true });
        }
        for (const name of map.disable) {
          if (hasCustomUser && name.startsWith('user人设')) continue;
          const e = entries.find((x: any) => x.comment === name || x.display_name === name || x.name === name);
          if (e) ops.push({ uid: e.uid, enabled: false });
        }
        if (ops.length) await TH.setLorebookEntries(wbName, ops);
      }
    }
  }
  $p('#send_textarea').val(activeScenes.value[i].message).trigger('input');
  setTimeout(() => $p('#send_but').trigger('click'), 50);
}

const dlcSaving = ref(false);
const dlcResetDisable = ['洪荒入侵', '静安入宫', 'user人设_白衣卿相', 'user人设_静安王爷'];
const dlcEntryMap: Record<string, { enable: string[]; disable: string[] }> = {
  main: { enable: ['user人设'], disable: dlcResetDisable },
  xianDao: { enable: ['user人设'], disable: dlcResetDisable },
  hongHuang: { enable: ['user人设'], disable: dlcResetDisable },
  yanYun: { enable: [], disable: dlcResetDisable },
};

const sceneEntryMap: Record<string, { enable: string[]; disable: string[] }> = {
  hongHuang_0: { enable: ['洪荒入侵'], disable: [] },
  yanYun_0: { enable: ['user人设_白衣卿相'], disable: ['user人设', 'user人设_静安王爷'] },
  yanYun_1: {
    enable: ['静安入宫', 'user人设_静安王爷'],
    disable: ['user人设', 'user人设_白衣卿相'],
  },
  yanYun_2: {
    enable: ['user人设_静安王爷'],
    disable: ['user人设', 'user人设_白衣卿相'],
  },
};

async function selectDlc(dlc: string) {
  if (dlcSaving.value) return;
  dlcSaving.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (TH) {
      const wbName = TH.getCharLorebooks()?.primary;
      if (wbName) {
        const entries = await TH.getLorebookEntries(wbName);
        const hasCustomUser = entries.some((x: any) =>
          (x.comment === 'user人设(自定义)' || x.display_name === 'user人设(自定义)' || x.name === 'user人设(自定义)') && x.enabled,
        );
        const ops: { uid: number; enabled: boolean }[] = [];
        const map = dlcEntryMap[dlc];
        if (map) {
          for (const name of map.enable) {
            if (hasCustomUser && name.startsWith('user人设')) continue;
            const e = entries.find((x: any) => x.comment === name || x.display_name === name);
            if (e && !e.enabled) ops.push({ uid: e.uid, enabled: true });
          }
          for (const name of map.disable) {
            if (hasCustomUser && name.startsWith('user人设')) continue;
            const e = entries.find((x: any) => x.comment === name || x.display_name === name);
            if (e && e.enabled) ops.push({ uid: e.uid, enabled: false });
          }
        }
        if (ops.length) await TH.setLorebookEntries(wbName, ops);
      }
    }
  } catch {
    /* silent */
  }
  dlcSaving.value = false;
  currentDlc.value = dlc;
  page.value = 'scenes';
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
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 2;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--c-text-dim);
  line-height: 1;
  padding: 4px 8px;
  transition: color 0.2s;
  &:hover {
    color: var(--c-gold);
  }
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
  align-items: center;
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
.env-items {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.env-row {
  display: flex;
  align-items: center;
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

.tools-section {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}
.tools-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  margin: 0 auto 12px;
  max-width: 360px;
  button {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 11px;
    padding: 6px 18px;
    border: 1px solid rgba(var(--c-accent-rgb, 201, 169, 110), 0.2);
    background: transparent;
    color: var(--c-text-dim);
    cursor: pointer;
    letter-spacing: 2px;
    transition: all 0.2s;
    &:first-child {
      border-radius: 6px 0 0 6px;
    }
    &:last-child {
      border-radius: 0 6px 6px 0;
    }
    &.active {
      background: rgba(var(--c-accent-rgb, 201, 169, 110), 0.15);
      color: var(--c-accent);
      border-color: var(--c-accent);
    }
    &:hover:not(.active) {
      color: var(--c-text);
      background: rgba(var(--c-accent-rgb, 201, 169, 110), 0.05);
    }
  }
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

.protagonist-area {
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
}
.protagonist-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  border: 1px dashed var(--c-card-border);
  border-radius: 8px;
  transition: all 0.2s;
  &:hover {
    border-color: var(--c-gold);
    background: var(--c-card-hover);
  }
  &.active {
    border-style: solid;
    border-color: var(--c-gold);
    background: rgba(139, 115, 85, 0.06);
  }
}
.protagonist-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background: rgba(139, 115, 85, 0.1);
  color: var(--c-text-dim);
  flex-shrink: 0;
}
.protagonist-label {
  flex: 1;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  color: var(--c-text);
  letter-spacing: 1px;
}
.protagonist-arrow {
  font-size: 9px;
  color: var(--c-text-dim);
}
.protagonist-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
  padding: 12px 14px;
  background: rgba(139, 115, 85, 0.04);
  border: 1px solid rgba(139, 115, 85, 0.1);
  border-radius: 8px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  label {
    font-family: '寒蝉全圆体', var(--font-main);
    font-size: 9px;
    color: var(--c-text-dim);
    letter-spacing: 1px;
  }
  input,
  select,
  textarea {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--c-card-border);
    background: rgba(255, 255, 255, 0.6);
    color: var(--c-text);
    font-family: 'DouyinSans', var(--font-main);
    font-size: 11px;
    outline: none;
    resize: vertical;
    &::placeholder {
      color: var(--c-text-dim);
    }
    &:focus {
      border-color: var(--c-gold);
    }
  }
}
.form-row-dual {
  display: flex;
  gap: 8px;
  & > .form-field {
    flex: 1;
  }
}
.protagonist-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.tag-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-custom {
  border-style: dashed;
  display: inline-flex;
  align-items: center;
  gap: 1px;
}
.tag-custom input {
  width: 54px;
  height: 16px;
  line-height: 16px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 9px;
  color: var(--c-text-dim);
  outline: none;
  text-align: center;
  padding: 0;
  &::placeholder {
    color: var(--c-text-dim);
  }
}
.tag-custom-btn {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(139, 115, 85, 0.12);
  color: var(--c-gold);
  font-size: 10px;
  line-height: 16px;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: var(--c-gold);
    color: #fff;
  }
}
.tag {
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--c-card-border);
  font-family: 'DouyinSans', var(--font-main);
  font-size: 9px;
  color: var(--c-text-dim);
  transition: all 0.12s;
  &:hover {
    border-color: var(--c-gold);
    color: var(--c-gold);
  }
  &.picked {
    background: rgba(139, 115, 85, 0.12);
    border-color: var(--c-gold);
    color: var(--c-gold);
    font-weight: 600;
  }
}
.protagonist-gen {
  width: 100%;
  padding: 8px 0;
  border: 1px dashed var(--c-gold);
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  color: var(--c-gold);
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  letter-spacing: 1px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: rgba(139, 115, 85, 0.08);
    border-style: solid;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}
.protagonist-result {
  margin-top: 6px;
}
.protagonist-result-text {
  display: block;
  width: 100%;
  min-height: 120px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--c-card-border);
  background: rgba(255, 255, 255, 0.6);
  color: var(--c-text);
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  &:focus {
    border-color: var(--c-gold);
  }
}
.protagonist-save {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: var(--c-gold);
  color: #fff;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 12px;
  font-weight: 600;
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
.protagonist-reset {
  padding: 8px 14px;
  border: 1px solid rgba(200, 100, 100, 0.2);
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  color: #b06060;
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px;
  letter-spacing: 1px;
  transition: all 0.2s;
  &:hover {
    background: rgba(200, 100, 100, 0.06);
    border-color: rgba(200, 100, 100, 0.4);
  }
}
.protagonist-error {
  text-align: center;
  font-size: 10px;
  color: #b06060;
  margin-top: 4px;
}
.protagonist-success {
  text-align: center;
  font-size: 10px;
  color: #5a8a5a;
  margin-top: 4px;
}

.dlc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}
.dlc-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  background: var(--c-card-bg);
  border: 1px solid var(--c-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  color: inherit;
  font-family: inherit;
  &:hover {
    background: var(--c-card-hover);
    border-color: var(--c-gold);
    transform: translateX(3px);
    box-shadow: 0 0 20px rgba(139, 115, 85, 0.06);
  }
}
.dlc-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background: rgba(139, 115, 85, 0.1);
  color: var(--c-gold);
  flex-shrink: 0;
}
.dlc-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dlc-name {
  font-family: '寒蝉全圆体', var(--font-main);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  letter-spacing: 2px;
}
.dlc-desc {
  font-family: 'DouyinSans', var(--font-main);
  font-size: 10px;
  color: var(--c-text-dim);
  line-height: 1.5;
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
