import type { Schema } from './schema';
export type CharacterProfile = Schema['_开局']['档案'];
export type ProfileField = {
  key: keyof CharacterProfile;
  label: string;
  choices?: string[];
  multiple?: boolean;
  multiline?: boolean;
  hint?: string;
};
export const profileSections: { name: string; note: string; fields: ProfileField[] }[] = [
  {
    name: '身份与来处',
    note: '姓名和种族必填，其余可留白。每个选项都能改成你自己的设定。',
    fields: [
      { key: '姓名', label: '姓名', hint: '本局角色的实际名字，无需填写宏或占位符' },
      { key: '称呼', label: '称呼', hint: '别名、代号，或希望别人怎样称呼你' },
      { key: '种族', label: '种族', choices: ['人类', '精灵', '兽人', '龙族', '妖灵', '元素生命', '机械生命', '混血'] },
      { key: '性别', label: '性别', choices: ['男性', '女性', '非二元', '无性别', '流动性别', '未指定'] },
      {
        key: '叙事代词',
        label: '叙事代词',
        choices: ['按性别', '他', '她', 'TA', '只用名字'],
        hint: '可自由填写；留白时按明确的男／女性别，否则使用名字',
      },
      {
        key: '年龄描述',
        label: '年龄描述',
        choices: ['成年', '青年', '中年', '年长', '长生种成年期', '外表与实际年龄不同'],
      },
      {
        key: '原世界',
        label: '原世界',
        choices: ['主世界', '苍溟界', '莽苍太古界', '晏云界', '曦光穹界', '云渺万灵界'],
        hint: '也可填写原创世界；来历不会自动改变当前开局地点',
      },
      {
        key: '身份',
        label: '身份',
        choices: ['普通居民', '学生', '旅人', '研究者', '工匠', '医者', '佣兵', '修行者', '流亡者'],
        hint: '可以填写具体职业、组织或社会身份',
      },
    ],
  },
  {
    name: '外貌与形态',
    note: '支持人形、异形或多种形态，外观不限制数值与职业。',
    fields: [
      {
        key: '体貌',
        label: '体貌',
        choices: ['纤细', '匀称', '健壮', '高挑', '矮小', '非人形', '可变形态'],
        multiple: true,
      },
      {
        key: '发色发型',
        label: '发色与发型',
        choices: ['黑色短发', '银白长发', '棕色卷发', '无毛发'],
        hint: '颜色、长度、质地都可自由填写',
      },
      { key: '瞳色特征', label: '瞳色与特征', choices: ['黑瞳', '琥珀瞳', '蓝瞳', '异色瞳', '非视觉感官'] },
      {
        key: '衣着',
        label: '衣着',
        choices: ['日常便装', '旅行装束', '工作制服', '轻甲', '长袍', '传统服饰'],
        multiple: true,
      },
      { key: '外貌', label: '外貌', multiline: true, hint: '身高、面容、角翼尾、疤痕、身体材质、不同形态等完整描述' },
    ],
  },
  {
    name: '性格与行事',
    note: '这些是你主动选择的角色倾向。具体想法、对白与决定仍由你表达。',
    fields: [
      {
        key: '性格标签',
        label: '性格标签',
        choices: ['温和', '沉稳', '直率', '谨慎', '好奇', '寡言', '幽默', '热情', '倔强', '随性'],
        multiple: true,
      },
      { key: '行事边界', label: '行事边界', multiline: true, hint: '珍视的原则、不愿接受的事情，或留白在游玩中决定' },
      {
        key: '擅长',
        label: '擅长',
        choices: ['观察', '交涉', '野外生存', '学术研究', '手工制作', '急救', '近战', '远程武器'],
        multiple: true,
      },
      { key: '局限', label: '局限', multiline: true, hint: '经验不足、身体条件、能力代价、不了解的文化等' },
    ],
  },
  {
    name: '力量与行装',
    note: '这里记录原有设定。初始数值采用本卡基础规则；额外能力和物品须定标登记后才参与结算。',
    fields: [
      {
        key: '力量体系',
        label: '力量体系',
        choices: ['无超凡力量', '武技', '修真', '魔法', '异能', '科技改造', '种族天赋'],
        multiple: true,
      },
      {
        key: '原有能力',
        label: '原有能力',
        multiline: true,
        hint: '能力名称、效果、条件、消耗与局限；可直接粘贴已有角色设定',
      },
      {
        key: '随身物品',
        label: '随身物品',
        multiline: true,
        hint: '想携带的装备、纪念物、工具等；不会自动成为数值装备',
      },
    ],
  },
  {
    name: '经历与牵挂',
    note: '只记录你确认的过去。可以来自任意世界，不强制前世、血统或关系。',
    fields: [
      { key: '经历', label: '经历', multiline: true, hint: '过去的生活、来到星见市的原因，或一段重要经历' },
      {
        key: '关系牵挂',
        label: '关系与牵挂',
        multiline: true,
        hint: '故乡、亲友、组织、尚未完成的约定；空白表示未指定',
      },
      {
        key: '旅途意向',
        label: '旅途意向',
        choices: ['探索世界', '寻找归途', '研究起源', '日常生活', '磨炼能力', '结识同伴'],
        multiple: true,
      },
      { key: '持有者补充', label: '其他补充', multiline: true, hint: '其他设定、希望保留的悬念，或整段现有人设' },
    ],
  },
];
export const profileSeeds: { name: string; values: Partial<CharacterProfile> }[] = [
  {
    name: '都市来客',
    values: {
      种族: '人类',
      年龄描述: '成年',
      原世界: '主世界',
      身份: '普通居民',
      衣着: '日常便装',
      力量体系: '无超凡力量',
    },
  },
  {
    name: '远行修者',
    values: {
      种族: '人类',
      年龄描述: '成年',
      原世界: '苍溟界',
      身份: '游历中的修行者',
      衣着: '旅行长袍',
      力量体系: '修真',
    },
  },
  {
    name: '异乡学者',
    values: {
      种族: '精灵',
      年龄描述: '长生种成年期',
      原世界: '曦光穹界',
      身份: '研究者',
      擅长: '学术研究',
      力量体系: '魔法',
    },
  },
  {
    name: '无定形旅人',
    values: { 种族: '元素生命', 年龄描述: '成年', 身份: '旅人', 体貌: '可变形态', 力量体系: '种族天赋' },
  },
];
export function seedEmptyProfile(profile: CharacterProfile, seed: Partial<CharacterProfile>): CharacterProfile {
  const next = { ...profile };
  for (const [key, value] of Object.entries(seed))
    if (!next[key as keyof CharacterProfile].trim()) next[key as keyof CharacterProfile] = value;
  return next;
}
export function profileSummary(profile: Partial<CharacterProfile>): string {
  return profileSections
    .flatMap(section =>
      section.fields.flatMap(field =>
        profile[field.key]?.trim() ? [`${field.label}：${profile[field.key]?.trim()}`] : [],
      ),
    )
    .join('\n');
}

/** 称谓与身体设定分开；不从姓名、种族或外貌推断性别。 */
export function narrativePronoun(profile: Partial<CharacterProfile>): string {
  const choice = profile.叙事代词?.trim();
  if (choice && choice !== '按性别') return choice;
  if (['男', '男性'].includes(profile.性别?.trim() ?? '')) return '他';
  if (['女', '女性'].includes(profile.性别?.trim() ?? '')) return '她';
  return '只用名字';
}

export function normalizeIdentity(profile: CharacterProfile): CharacterProfile {
  const next = { ...profile };
  for (const key of ['姓名', '称呼', '性别', '叙事代词', '种族'] as const) {
    next[key] = next[key].trim();
    if (/\{\{|\}\}|<\/?user>/i.test(next[key]))
      throw Error('身份字段请填写实际文字；姓名可点击“使用酒馆名字”读入，不要保留宏或玩家占位符');
  }
  next.叙事代词 = narrativePronoun(next);
  return next;
}
