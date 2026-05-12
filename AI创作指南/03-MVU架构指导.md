# MVU 架构指导

本指南用于 AI 在新建酒馆角色卡项目时，指导如何设计和实现 MVU（消息楼层变量更新）架构。主要参考 **斗罗大陆3.0** 和 **创世回廊3.0** 的 MVU 实现。

---

## 1. 什么是 MVU

MVU（Message Variable Update）是一个酒馆助手脚本框架，它允许角色卡通过 AI 输出来 **结构化地更新游戏状态变量**。

核心流程：
```
AI 输出 → 包含 <UpdateVariable> 命令
         → MVU 框架解析命令
         → 根据变量更新规则校验
         → 根据 Zod Schema 处理（transform/coerce/clamp）
         → 写入消息楼层变量 stat_data
         → 前端界面实时读取显示
```

---

## 2. 什么时候需要 MVU

```yaml
需要 MVU 的情况:
  - 角色卡有需要追踪的数值状态（HP/MP/好感度/等级/金钱等）
  - 玩家有物品栏、装备、技能等需要管理的数据
  - 世界状态需要随剧情推进而变化（时代/章节/天气/时间）
  - 需要前端界面实时显示这些数据
  - 复杂 NPC 关系/状态需要追踪

不需要 MVU 的情况:
  - 纯叙事卡，没有数值系统
  - 类似电车JC后传这样的日常剧情卡
  - 角色数量少且关系简单
```

---

## 3. MVU 的文件结构

一个完整的 MVU 角色卡需要以下文件：

```yaml
角色卡/
├── schema.ts                          ← 核心：Zod 4 变量结构定义
├── schema.json                        ← 自动生成：JSON Schema
├── 脚本/
│   ├── 变量结构/
│   │   └── index.ts                   ← 注册 Schema 到 MVU
│   ├── MVU/
│   │   └── index.ts                   ← 导入 MVU 框架 CDN
│   └── [其他功能脚本]/
│       └── index.ts
├── 界面/
│   ├── 状态栏/
│   │   ├── index.html                 ← 前端界面入口
│   │   ├── index.ts                   ← Vue 挂载
│   │   ├── store.ts                   ← Pinia Store（defineMvuDataStore）
│   │   ├── global.css                 ← 全局样式
│   │   └── components/                ← Vue 组件
│   └── [其他界面]/
└── 世界书/
    └── 变量/
        ├── [initvar]变量初始化勿开.yaml   ← 初始值
        ├── 变量列表.txt                  ← 当前变量展示模板
        ├── [mvu_update]变量更新规则.yaml  ← AI更新规则
        └── [mvu_update]变量输出格式.yaml  ← 输出格式说明
```

---

## 4. Schema 设计（schema.ts）

### 4.1 基本规则

```typescript
// ✅ 正确的 Schema 结构
export const Schema = z.object({
  世界状态: z.object({
    当前时间: z.string(),
    当前区域: z.string(),
    当前场景: z.string().prefault('待初始化'),
    当前场景类型: z.enum(['日常', '战斗', '猎魂', '购物', '亲密']).prefault('日常'),
  }),
  
  玩家: z.object({
    基础信息: z.object({
      姓名: z.string().prefault('待初始化'),
      种族: z.string().prefault('人类'),
    }),
    修炼状态: z.object({
      魂力等级: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
    }),
    物品栏: z.record(
      z.string().describe('物品名'),
      z.object({
        描述: z.string(),
        数量: z.coerce.number(),
      }),
    ).transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)),  // 自动清理数量为0的物品
  }),
});

export type Schema = z.output<typeof Schema>;
```

### 4.2 关键设计原则

```yaml
幂等性（最重要）:
  规则: Schema.parse(Schema.parse(input)) === Schema.parse(input)
  含义: 变量被多次解析后结果不变
  实现: 使用 z.transform 而不是 z.min/z.max 等校验

数值处理:
  优先使用: z.coerce.number() 而非 z.number()
  原因: AI 可能输出字符串形式的数字，coerce 自动转换
  限制范围: 使用 .transform(v => _.clamp(v, min, max)) 而非 .min().max()
  原因: .min().max() 会拒绝无效值导致整个更新失败；clamp 会接受并修正

对象优于数组:
  物品栏用: z.record(z.string().describe('物品名'), ...)
  而非: z.array(z.object({ 名称: z.string(), ... }))
  原因: 通过物品名直接索引比遍历数组查找更高效，JSON Patch 也更精确

对象类型的默认值:
  使用 .prefault() 而非 .default()
  z.prefault 和 z.default 的区别: prefault 在解析输入时补全缺失字段
  复合类型的所有字段都要设置 prefault

prefault 于 clearable 对象:
  如果对象可能被 JSON Patch remove 清空:
  z.object({...}).prefault({}) 而非 z.object({...}).optional()
  
动态键 vs 固定键:
  固定必选键 + 同类型: z.record(z.enum(['key1', 'key2']), type)
  固定可选键 + 同类型: z.partialRecord(z.enum(['key1', 'key2']), type)
  动态可选键 + 同类型: z.record(z.string(), type)
  固定必选键 + 不同类型: z.object({ key1: type1, key2: type2 })

z.describe 的使用:
  只在没有字段名来解释用途时使用, 如 z.record(z.string().describe('物品名'), ...)
  有字段名时不要用 z.describe, 字段名本身已经说明了用途

transform 中的计算字段:
  用 $ 前缀命名计算字段（只读，不给AI更新规则）
  示例: .transform(data => ({ ...data, $依存度阶段: compute(data.依存度) }))
```

### 4.3 实际案例：斗罗大陆3.0 Schema 的精简版

```typescript
export const Schema = z.object({
  世界状态: z.object({
    当前时代: z.enum(['斗一', '斗二', '斗三']).prefault('斗一'),
    年表时期: z.enum(['前期', '中期', '后期']).prefault('前期'),
    剧情章节: z.string().prefault('序章'),
    当前区域: z.string().prefault('待初始化'),
    当前场景: z.string().prefault('待初始化'),
    当前场景类型: z.enum(['日常', '战斗', '猎魂', '购物', '亲密']).prefault('日常'),
  }).prefault({}),
  
  玩家: z.object({
    基础信息: z.object({
      种族: z.string().prefault('人类'),
      年龄: z.coerce.number().prefault(12),
    }).prefault({}),
    修炼状态: z.object({
      魂力等级: z.coerce.number().prefault(0).transform(v => _.clamp(v, 0, 100)),
    }).prefault({}),
    武魂信息: z.object({
      武魂名称: z.string().prefault('待初始化'),
      武魂品质: z.string().prefault('待初始化'),
      魂环: z.record(
        z.string().describe('魂环颜色+年限'),
        z.object({
          来源魂兽: z.string(),
          魂技名称: z.string(),
          魂技效果: z.string(),
        }),
      ).prefault({}),
    }).prefault({}),
    物品栏: z.record(
      z.string().describe('物品名'),
      z.object({ 描述: z.string(), 数量: z.coerce.number() }),
    ).transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)).prefault({}),
    金钱: z.object({
      金魂币: z.coerce.number().prefault(0).transform(v => Math.max(0, v)),
    }).prefault({}),
  }).prefault({}),
});
```

---

## 5. 世界书中的变量规则

### 5.1 变量更新规则 `[mvu_update]变量更新规则.yaml`

这是指导 AI 如何更新变量的提示词。根据 Schema 的结构编写：

```yaml
变量更新规则:
  世界状态:
    当前时代:
      check:
        - 只能由GM在剧情重大转折时更新
        - 斗一→斗二→斗三不可逆
    年表时期:
      check:
        - 根据剧情章节自动判断
        - 剧情推进到一定阶段后从前/中/后期选择
    当前场景类型:
      check:
        - 根据当前主要行为判定
        - 一次只能是一种场景类型
        - 场景类型决定不同的规则条目加载

  玩家:
    修炼状态:
      魂力等级:
        type: number
        check:
          - 每吸收一个魂环 +1
          - 重大战斗/修炼突破后可 +1~2
          - 一般日常不变化
    武魂信息:
      魂环:
        type: |-
          {
            [魂环颜色+年限: string]: {
              来源魂兽: string;
              魂技名称: string;
              魂技效果: string;
            }
          }
        check:
          - 猎杀魂兽吸收魂环后才添加新条目
          - 不要修改已有的魂环（除非有特殊剧情）
    物品栏:
      type: |-
        {
          [物品名: string]: {
            描述: string;
            数量: number;
          }
        }
      check:
        - 获得物品时添加或增加数量
        - 使用/丢弃物品时减少数量
        - 数量归零时自动删除（由Schema处理）

  规则合并技巧:
    同类变量合并:
      而非分开写:
        玩家.力量: ...
        玩家.敏捷: ...
      合并为:
        玩家.${六维}.数值:
          type: number
          check: ...
    
    嵌套对象嵌套展示:
      将 玩家.能力面板.xxx 和 玩家.装备栏.xxx 嵌套在"玩家"下:
        玩家:
          能力面板.${六维}:
            type: number
          装备栏.${部位}:
            type: |-
              { 装备: string; 主角评价: string }
```

### 5.2 变量输出格式 `[mvu_update]变量输出格式.yaml`

```yaml
内容示例:
  在每次回复的末尾，附加如下格式的变量更新：
  
  <UpdateVariable>
  <JSONPatch>
  [
    { "op": "replace", "path": "/世界状态/当前场景类型", "value": "战斗" },
    { "op": "replace", "path": "/玩家/修炼状态/魂力等级", "value": 42 },
    { "op": "delta", "path": "/玩家/金钱/金魂币", "value": -100 },
    { "op": "insert", "path": "/玩家/物品栏/龙纹剑", "value": { "描述": "一把...", "数量": 1 } },
    { "op": "remove", "path": "/玩家/物品栏/破损的木剑" }
  ]
  </JSONPatch>
  </UpdateVariable>
  
  JSON Patch 操作类型:
    replace: 完全替换值
    delta: 对数值进行增量
    insert: 添加新键（用于record类型）
    remove: 删除键

  重要规则:
    - 只在有变量需要更新时才附加
    - 不要更新只读字段（$开头的计算字段）
    - 只更新本楼实际发生的剧情导致的变量变化
```

### 5.3 变量初始化 `[initvar]变量初始化勿开.yaml`

提供变量的默认初始值，仅在新开聊天时由用户手动激活：

```yaml
世界状态:
  当前时代: 斗一
  年表时期: 前期
  剧情章节: 序章
  当前区域: 诺丁城
  当前场景: 武魂殿觉醒仪式
  当前场景类型: 日常

玩家:
  基础信息:
    种族: 人类
    年龄: 6
  修炼状态:
    魂力等级: 0
  武魂信息:
    武魂名称: 待觉醒
    武魂品质: 待觉醒
    魂环: {}
  物品栏: {}
  金钱:
    金魂币: 0
```

---

## 6. 脚本文件

### 6.1 变量结构脚本

```typescript
// 脚本/变量结构/index.ts
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

$(() => {
  registerMvuSchema(Schema);
});
```

### 6.2 MVU 框架脚本

```typescript
// 脚本/MVU/index.ts
// 导入 MVU 框架（从 CDN）
import 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu.js';

$(() => {
  console.log('[MVU] 框架已加载');
});
```

---

## 7. 前端界面

### 7.1 Store

```typescript
// 界面/状态栏/store.ts
import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(
  Schema,
  { type: 'message', message_id: getCurrentMessageId() },
  // 可选的额外初始化逻辑：
  // data => {
  //   data.value.系统状态.日志 = [];
  // }
);
```

### 7.2 组件中使用

```typescript
// 界面/状态栏/App.vue
<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from './store';

const store = useDataStore();

// store.data 是响应式的 MVU 变量数据
// 可以使用 store.data.玩家.修炼状态.魂力等级 访问具体字段
</script>

<template>
  <div>
    <span>魂力等级: {{ store.data.玩家.修炼状态.魂力等级 }}</span>
  </div>
</template>
```

---

## 8. 变量列表（用于展示当前状态）

`变量列表.txt` 是插入到提示词中的当前变量快照。对于大型Schema，需要精简显示：

```ejs
<%# 只展示非空/非初始化的变量 %>
<%# 不在场的NPC隐藏私密档案 %>
<%# 非战斗场景精简武魂数据 %>

当前世界状态:
  时代: <%= data.世界状态.当前时代 %>
  时期: <%= data.世界状态.年表时期 %>
  章节: <%= data.世界状态.剧情章节 %>
  区域: <%= data.世界状态.当前区域 %>
  场景: <%= data.世界状态.当前场景 %>
  场景类型: <%= data.世界状态.当前场景类型 %>

玩家信息:
  魂力等级: <%= data.玩家.修炼状态.魂力等级 %>
  武魂: <%= data.玩家.武魂信息.武魂名称 %>
  金钱: <%= data.玩家.金钱.金魂币 %> 金魂币
  物品栏 (<%= Object.keys(data.玩家.物品栏).length %>件):
    <%_ for (const [name, item] of Object.entries(data.玩家.物品栏)) { _%>
    - <%= name %> x<%= item.数量 %>
    <%_ } _%>
```

---

## 9. MVU 事件系统

MVU 框架提供了两个关键事件，可用于编写高级功能脚本：

```typescript
// COMMAND_PARSED - 修复AI输出的变量更新命令
eventOn(Mvu.events.COMMAND_PARSED, commands => {
  commands.forEach(command => {
    // 例如：修复gemini在中文间加入的横线
    command.args[0] = command.args[0].replaceAll('-', '');
  });
});

// VARIABLE_UPDATE_ENDED - 变量更新完成后的后处理
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (new_variables, old_variables) => {
  // 例如：检测好感度突破阈值
  const oldVal = _.get(old_variables, 'stat_data.好感度');
  const newVal = _.get(new_variables, 'stat_data.好感度');
  if (oldVal < 30 && newVal >= 30) {
    toastr.success('好感度突破了30！');
  }
});
```

---

## 10. MVU 检查清单

- [ ] Schema 是否遵循幂等性原则？
- [ ] 数值字段是否使用了 `z.coerce.number()`？
- [ ] 范围限制是否使用 `.transform(v => _.clamp(v, min, max))` 而非 `.min().max()`？
- [ ] 对象字段是否使用了 `.prefault()` 设置默认值？
- [ ] 物品栏/列表是否使用 `z.record` 而非 `z.array`？
- [ ] 计算字段（$前缀）是否只读、没有为AI设置更新规则？
- [ ] 变量更新规则是否与 Schema 结构一致？
- [ ] 变量更新规则是否合并了同类变量以减少 token？
- [ ] 变量输出格式是否正确说明了 JSON Patch 操作？
- [ ] 变量初始值是否完整（每个 prefault 字段都有值）？
- [ ] 变量列表是否做了精简（不在场NPC隐藏私密信息）？
- [ ] 变量结构脚本是否正确注册了 Schema？
- [ ] 前端 store 是否正确使用了 `defineMvuDataStore`？
