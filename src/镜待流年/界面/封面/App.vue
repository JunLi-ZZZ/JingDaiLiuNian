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
        <p>亦可看她们褪去光环融入现代社会，在日常烟火里寻觅</p>
        <p>还可以选择挂上任意角色的世界书，她便循着因果网落入这个世界</p>
        <p>你喜欢的她，不需要被定义在哪张卡里</p>
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

    <div class="protagonist-area">
      <div class="protagonist-toggle" :class="{ active: showProtagonist || protagonistActive }" @click="showProtagonist = !showProtagonist">
        <span class="protagonist-icon">{{ protagonistActive ? '✦' : '▸' }}</span>
        <span class="protagonist-label">{{ protagonistActive ? '自定义主角（已启用）' : '自定义主角' }}</span>
        <span class="protagonist-arrow">{{ showProtagonist ? '▾' : '▸' }}</span>
      </div>
      <div v-if="showProtagonist" class="protagonist-form">
        <div class="form-row-dual">
          <div class="form-field">
            <label>姓名</label>
            <input v-model="pForm.姓名" placeholder="{{user}}" />
          </div>
          <div class="form-field">
            <label>性别</label>
            <input v-model="pForm.性别" placeholder="男 / 女 / 其他…" />
          </div>
        </div>
        <div class="form-row-dual">
          <div class="form-field">
            <label>年龄感</label>
            <select v-model="pForm.年龄感"><option value="">不指定</option><option>少年</option><option>青年</option><option>成年</option><option>中年</option></select>
          </div>
          <div class="form-field">
            <label>种族</label>
            <input v-model="pForm.种族" placeholder="如：人类 / 自定义…" />
          </div>
        </div>
        <div class="form-row-dual">
          <div class="form-field">
            <label>身份</label>
            <input v-model="pForm.身份" placeholder="如：星见大学研究生" />
          </div>
          <div class="form-field">
            <label>来源世界</label>
            <input v-model="pForm.来源世界" placeholder="如：主世界 / 自定义…" />
          </div>
        </div>
        <div class="form-field">
          <label>境界</label>
          <input v-model="pForm.境界" placeholder="如：凡人 / 自定义…" />
        </div>
        <div class="form-field">
          <label>风格标签</label>
          <div class="tag-pool">
            <span v-for="t in pTraits" :key="t" class="tag" :class="{ picked: pForm.traits.includes(t) }" @click="pToggleTag(t)">{{ t }}</span>
          </div>
        </div>
        <div class="form-field">
          <label>补充说明</label>
          <textarea v-model="pForm.备注" rows="2" placeholder="其他想补充的设定、背景、想法…"></textarea>
        </div>
        <div class="protagonist-actions">
          <button class="protagonist-gen" :disabled="pGenerating" @click="pGenerate()">{{ pGenerating ? '生成中…' : 'AI 生成详细人设' }}</button>
        </div>
        <div v-if="pGenResult" class="protagonist-result">
          <textarea v-model="pGenResult" class="protagonist-result-text" rows="6" placeholder="（AI 生成的人设将显示在这里，可手动修改）"></textarea>
          <div class="protagonist-actions">
            <button class="protagonist-save" :disabled="!pGenResult.trim() || protagonistSaving" @click="saveProtagonist()">{{ protagonistSaving ? '保存中…' : '确认主角' }}</button>
            <button v-if="protagonistActive" class="protagonist-reset" @click="resetProtagonist()">恢复默认</button>
          </div>
        </div>
        <div v-if="protagonistError" class="protagonist-error">{{ protagonistError }}</div>
        <div v-if="protagonistSuccess" class="protagonist-success">{{ protagonistSuccess }}</div>
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

    <p class="footer-note">选择一幕，开启你的镜中之旅</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

const theme = ref((typeof localStorage !== 'undefined' && localStorage.getItem('jdnl_theme')) || 'cream');
function onStorage(e: StorageEvent) {
  if (e.key === 'jdnl_theme' && e.newValue) theme.value = e.newValue;
}
onMounted(() => {
  addEventListener('storage', onStorage);
  checkProtagonistStatus();
});
onUnmounted(() => {
  removeEventListener('storage', onStorage);
});

const showIntro = ref(true);
const showCustom = ref(false);
const customMsg = ref('');

const showProtagonist = ref(false);
const protagonistActive = ref(false);
const protagonistSaving = ref(false);
const protagonistError = ref('');
const protagonistSuccess = ref('');
const pGenerating = ref(false);
const pGenResult = ref('');
const pTraits = ['温和','冷峻','活泼','沉稳','叛逆','善良','腹黑','天然','孤僻','热血','慵懒','傲娇'];
const savedProto = (() => { try { const r = localStorage.getItem('jdnl_protagonist'); return r ? JSON.parse(r) : {}; } catch { return {}; } })();
const pForm = reactive({
  姓名: (savedProto as any).姓名 || '',
  性别: (savedProto as any).性别 || '',
  年龄感: (savedProto as any).年龄感 || '',
  种族: (savedProto as any).种族 || '',
  身份: (savedProto as any).身份 || '',
  来源世界: (savedProto as any).来源世界 || '',
  境界: (savedProto as any).境界 || '',
  traits: (savedProto as any).traits || [] as string[],
  备注: (savedProto as any).备注 || '',
});
watch(pForm, (v) => { localStorage.setItem('jdnl_protagonist', JSON.stringify({ ...v })); }, { deep: true });
function pToggleTag(t: string) { const i = pForm.traits.indexOf(t); if (i >= 0) pForm.traits.splice(i, 1); else pForm.traits.push(t); }

const pGenPrompt = `你正在协助玩家自定义主角人设。根据以下标签生成一份详细的主角档案。

格式要求：
- 严格按 <character_info> 标签包裹的格式输出
- 包含：基本信息（姓名/性别/年龄/种族/身份/来源世界/境界）、外貌特征（基础体型/整体印象）、性格特点
- 如果种族、来源世界、境界未指定，根据整体设定合理推断
- 末尾必须包含 特殊物品 段，内容为母镜（古朴铜镜，虞姝昀赠予的护身符，不知其真实功能，偶尔能瞥见红颜特征）
- 灵活描述，不固化可变细节

输出格式：
<character_info>
角色档案:
    基本信息:
        姓名: ...
        性别: ...
        年龄: ...
        种族: ...
        身份: ...
        来源世界: ...
        境界: ...

    外貌特征:
        基础体型: ...
        整体印象: ...

    性格特点:
        ...

    特殊物品:
        母镜:
            - 一面古朴铜镜，虞姝昀在<user>幼时赠予，称"护身符"
            - <user>不知其真实功能
            - 偶尔能在镜中瞥见模糊的红颜特征
</character_info>`;

async function pGenerate() {
  pGenResult.value = '';
  protagonistError.value = '';
  pGenerating.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { protagonistError.value = '未检测到酒馆助手。'; return; }
    const tags = [];
    if (pForm.年龄感) tags.push('年龄感：' + pForm.年龄感);
    if (pForm.种族) tags.push('种族：' + pForm.种族);
    if (pForm.身份) tags.push('身份：' + pForm.身份);
    if (pForm.来源世界) tags.push('来源世界：' + pForm.来源世界);
    if (pForm.境界) tags.push('境界：' + pForm.境界);
    if (pForm.traits.length) tags.push('风格：' + pForm.traits.join('、'));
    if (pForm.备注) tags.push('补充：' + pForm.备注);
    const tagBlock = tags.map(t => '- ' + t).join('\n');
    const prompt = `自定义主角设定：\n姓名：${pForm.姓名 || '{{user}}'}\n性别：${pForm.性别}\n${tagBlock}\n\n${pGenPrompt}`;
    const result = await TH.generateRaw({
      user_input: '（请按上述格式输出主角人设。）',
      should_silence: true,
      max_chat_history: 0,
      ordered_prompts: [
        { role: 'system', content: prompt },
        'persona_description',
        'char_description',
        'world_info_before',
        'world_info_after',
        'user_input',
      ],
    });
    const text = typeof result === 'string' ? result : (result.content || JSON.stringify(result));
    const m = text.match(/<character_info>[\s\S]*<\/character_info>/);
    pGenResult.value = m ? m[0].trim() : text;
  } catch (e: any) {
    protagonistError.value = e?.message || String(e);
  } finally {
    pGenerating.value = false;
  }
}

async function checkProtagonistStatus() {
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) return;
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) return;
    const entries = await TH.getLorebookEntries(wbName);
    protagonistActive.value = entries.some((e: any) => e.comment === 'user人设(自定义)' && e.enabled !== false);
  } catch { /* silent */ }
}

async function saveProtagonist() {
  if (!pGenResult.value.trim()) return;
  protagonistError.value = '';
  protagonistSuccess.value = '';
  protagonistSaving.value = true;
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { protagonistError.value = '未检测到酒馆助手。'; return; }
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) { protagonistError.value = '未找到世界书。'; return; }
    const entries = await TH.getLorebookEntries(wbName);
    const defaultEntry = entries.find((e: any) => e.comment === 'user人设');
    const customEntry = entries.find((e: any) => e.comment === 'user人设(自定义)');
    if (customEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: customEntry.uid, content: pGenResult.value }]);
    } else {
      await TH.createLorebookEntries(wbName, [{
        comment: 'user人设(自定义)',
        enabled: true,
        type: 'constant',
        position: 'before_character_definition',
        order: 505,
        probability: 100,
        exclude_recursion: true,
        prevent_recursion: true,
        content: pGenResult.value,
      }]);
    }
    if (defaultEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: defaultEntry.uid, content: '（此条目已被自定义主角代替，当前未启用）' }]);
    }
    protagonistActive.value = true;
    protagonistSuccess.value = '自定义主角已保存';
  } catch (e: any) {
    protagonistError.value = e?.message || '保存失败';
  } finally {
    protagonistSaving.value = false;
  }
}

async function resetProtagonist() {
  protagonistError.value = '';
  protagonistSuccess.value = '';
  try {
    const TH = (window as any).parent?.TavernHelper;
    if (!TH) { protagonistError.value = '未检测到酒馆助手。'; return; }
    const wbName = TH.getCharLorebooks()?.primary;
    if (!wbName) { protagonistError.value = '未找到世界书。'; return; }
    const entries = await TH.getLorebookEntries(wbName);
    const defaultEntry = entries.find((e: any) => e.comment === 'user人设');
    const customEntry = entries.find((e: any) => e.comment === 'user人设(自定义)');
    if (defaultEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: defaultEntry.uid, content: `<character_info>
角色档案:
    基本信息:
        姓名: <user>
        性别: 男
        年龄: 研究生在读（约22岁）
        身份: 星见大学研究生

    外貌特征:
        基础体型: 体态修长匀称
        整体印象: 气质出尘，长相宛若谪仙，待人温和
        补充: 暂无

    性格特点:
        待人温和有礼，不卑不亢。对自己"桃花运"的体质毫无自觉，常将红颜的主动接近理解为普通的友善。
        对自己是"普通人"的认知根深蒂固，对超凡世界的存在一无所知。

    特殊物品:
        母镜:
            - 一面古朴铜镜，虞姝昀在<user>幼时赠予，称"护身符"
            - <user>不知其真实功能
            - 偶尔能在镜中瞥见模糊的红颜特征
</character_info>` }]);
    }
    if (customEntry) {
      await TH.setLorebookEntries(wbName, [{ uid: customEntry.uid, content: '（已重置）' }]);
    }
    protagonistActive.value = false;
    protagonistSuccess.value = '已恢复默认主角';
  } catch (e: any) {
    protagonistError.value = e?.message || '恢复失败';
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

const scenes = [
  {
    char: '虞姝昀',
    location: '新湖区 · {{user}}的公寓',
    teaser: '搬出来独居好几年了，干妈却还是老一套小把戏',
    message: `根据以下设定构建剧情开头：
时间：傍晚
地点：{{user}}的公寓（新湖区）
出场角色：虞姝昀
剧情大纲：{{user}}搬出独居好几年了，虞姝昀至今仍把这当成换个地方照顾他。这天傍晚{{user}}回家，发现虞姝昀用"家里停水"的理由进了他家，刚洗完澡裹着浴袍靠在沙发上，茶几上摆着新买的草莓。她让{{user}}帮她看看新买的浴袍合不合身，在他面前转了一圈。`,
  },
  {
    char: '涂山素凝',
    location: '学府区与新湖区交界 · 小狐狸的温馨小楼',
    teaser: '小狐狸说是有事要当面讲，原来不过是想被摸摸头',
    message: `根据以下设定构建剧情开头：
时间：下午
地点：涂山素凝家客厅（学府区与新湖区交界）
出场角色：涂山素凝
剧情大纲：涂山素凝发消息说有重要的事要当面讲，让{{user}}过来一趟。{{user}}到了之后发现她蜷在客厅的毛绒垫子上刷手机，九条尾巴都露在外面。所谓"重要的事"就是今天的尾巴手感特别好，想让他摸摸。被揉舒服了之后被问起尾巴耳朵的来历，她照旧眨巴着眼睛说是coser道具。`,
  },
  {
    char: '慕容霁宁',
    location: '新湖区 · {{user}}的公寓',
    teaser: '暑假的雨季，小师姐撑着油纸伞款款而来，说江南有座园林在等你',
    message: `根据以下设定构建剧情开头：
时间：暑假某日下午，小雨
地点：{{user}}的公寓门口（新湖区）
出场角色：慕容霁宁
剧情大纲：暑假刚开始，星见市下着绵绵细雨。慕容霁宁撑着一柄油纸伞出现在{{user}}公寓门前，说在南方一处风景秀美的江南小镇，她有间祖上传下的小园林，趁着暑假想邀{{user}}一起去看看。`,
  },
  {
    char: '伊莉雅丝',
    location: '学府区与新湖区交界 · 白伊心理咨询角',
    teaser: '纯洁病症发作，疲惫的纯白女王需要你的温度',
    message: `根据以下设定构建剧情开头：
时间：下午
地点：伊莉雅丝家一楼心理咨询角（学府区与新湖区交界）
出场角色：伊莉雅丝
剧情大纲：伊莉雅丝的纯洁病症犯了，连着几天对什么都提不起劲儿。这段时间借着心理咨询名义来找她打听{{user}}消息的女学生越来越多，让她身心俱疲。她撑不住了，把{{user}}叫来，微嘟着唇瓣，故作可怜地让他帮自己按按摩。`,
  },
  {
    char: '苏墨染 · 苏幼清',
    location: '画道峰 · 云烟阁',
    teaser: '一幅缺了魂的画，一句含了情的诗，误打误撞唤来了画中人',
    message: `根据以下设定构建剧情开头：
时间：清晨
地点：画道峰云烟阁（仙道位面）
出场角色：苏墨染、苏幼清
剧情大纲：苏墨染按心中所想之人的模样作了一幅画，画完后总觉得有形无神。徒儿苏幼清凑过来看了一眼，喃喃念了一句诗——那声音轻得像梦里念叨过无数遍的句子。话音落下，画上墨迹忽然晕开，子镜与母镜同时嗡鸣，师徒二人的共鸣竟将画中人的本尊从另一个世界唤了过来。`,
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
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
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
  position: relative; z-index: 1; margin-bottom: 14px;
}
.protagonist-toggle {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; cursor: pointer;
  border: 1px dashed var(--c-card-border); border-radius: 8px;
  transition: all 0.2s;
  &:hover { border-color: var(--c-gold); background: var(--c-card-hover); }
  &.active { border-style: solid; border-color: var(--c-gold); background: rgba(139,115,85,0.06); }
}
.protagonist-icon {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; background: rgba(139,115,85,0.1); color: var(--c-text-dim);
  flex-shrink: 0;
}
.protagonist-label {
  flex: 1; font-family: '寒蝉全圆体', var(--font-main);
  font-size: 11px; color: var(--c-text); letter-spacing: 1px;
}
.protagonist-arrow { font-size: 9px; color: var(--c-text-dim); }
.protagonist-form {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 6px; padding: 12px 14px;
  background: rgba(139,115,85,0.04); border: 1px solid rgba(139,115,85,0.1);
  border-radius: 8px;
}
.form-field {
  display: flex; flex-direction: column; gap: 3px;
  label { font-family: '寒蝉全圆体', var(--font-main); font-size: 9px; color: var(--c-text-dim); letter-spacing: 1px; }
  input, select, textarea {
    padding: 6px 8px; border-radius: 6px;
    border: 1px solid var(--c-card-border); background: rgba(255,255,255,0.6);
    color: var(--c-text); font-family: 'DouyinSans', var(--font-main); font-size: 11px;
    outline: none; resize: vertical;
    &::placeholder { color: var(--c-text-dim); }
    &:focus { border-color: var(--c-gold); }
  }
}
.form-row-dual { display: flex; gap: 8px; & > .form-field { flex: 1; } }
.protagonist-actions { display: flex; gap: 8px; margin-top: 2px; }
.tag-pool { display: flex; flex-wrap: wrap; gap: 4px; }
.tag {
  padding: 2px 8px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--c-card-border); font-family: 'DouyinSans', var(--font-main);
  font-size: 9px; color: var(--c-text-dim); transition: all 0.12s;
  &:hover { border-color: var(--c-gold); color: var(--c-gold); }
  &.picked { background: rgba(139,115,85,0.12); border-color: var(--c-gold); color: var(--c-gold); font-weight: 600; }
}
.protagonist-gen {
  width: 100%; padding: 8px 0; border: 1px dashed var(--c-gold); border-radius: 8px; cursor: pointer;
  background: transparent; color: var(--c-gold);
  font-family: '寒蝉全圆体', var(--font-main); font-size: 11px; letter-spacing: 1px;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: rgba(139,115,85,0.08); border-style: solid; }
  &:disabled { opacity: 0.5; cursor: default; }
}
.protagonist-result { margin-top: 6px; }
.protagonist-result-text {
  display: block; width: 100%; min-height: 120px; padding: 8px;
  border-radius: 6px; border: 1px solid var(--c-card-border);
  background: rgba(255,255,255,0.6); color: var(--c-text);
  font-family: 'DouyinSans', var(--font-main); font-size: 10px; line-height: 1.5;
  resize: vertical; outline: none;
  &:focus { border-color: var(--c-gold); }
}
.protagonist-save {
  flex: 1; padding: 8px 0; border: none; border-radius: 8px; cursor: pointer;
  background: var(--c-gold); color: #fff;
  font-family: '寒蝉全圆体', var(--font-main); font-size: 12px; font-weight: 600;
  letter-spacing: 1px; transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: default; }
}
.protagonist-reset {
  padding: 8px 14px; border: 1px solid rgba(200,100,100,0.2); border-radius: 8px; cursor: pointer;
  background: transparent; color: #b06060;
  font-family: '寒蝉全圆体', var(--font-main); font-size: 11px;
  letter-spacing: 1px; transition: all 0.2s;
  &:hover { background: rgba(200,100,100,0.06); border-color: rgba(200,100,100,0.4); }
}
.protagonist-error { text-align: center; font-size: 10px; color: #b06060; margin-top: 4px; }
.protagonist-success { text-align: center; font-size: 10px; color: #5a8a5a; margin-top: 4px; }

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
