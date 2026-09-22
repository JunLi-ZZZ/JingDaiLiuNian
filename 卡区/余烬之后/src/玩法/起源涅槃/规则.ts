import type { Rules } from '../../engine';
export const trialRules: Rules = {
  id: 'trial-1',
  revivalSeconds: 600,
  mechanisms: {
    electric: { name: '电击', ability: '电荷转移' },
    heat: { name: '热损伤', ability: '热量收纳' },
    impact: { name: '冲撞', ability: '冲量偏折' },
    cold: { name: '低温冻结', ability: '寒息回流' },
    toxin: { name: '毒素侵蚀', ability: '毒质分离' },
    hypoxia: { name: '缺氧', ability: '闭息循环' },
    soul: { name: '灵魂侵蚀', ability: '灵魄回响' },
  },
};
