# EJS 架构指导

本指南用于 AI 在新建酒馆角色卡项目时，指导如何使用 EJS（Embedded JavaScript）模板实现动态世界书加载。主要参考 **斗罗大陆3.0** 的 EJS控制器（801行）和 **创世回廊3.0** 的多世界管理实践。

---

## 1. 什么是 EJS 架构

EJS 架构是酒馆世界书系统的高级用法：通过在世界书条目中嵌入 JavaScript 代码，**在每次 AI 请求前动态决定哪些世界书条目被激活**。

```yaml
传统世界书:
  每个条目独立设置激活条件（关键词/蓝灯）
  → 条目之间无法互相感知
  → 无法根据变量状态动态选择条目

EJS 架构:
  一个 EJS 控制器条目作为"大脑"
  → 读取当前变量状态
  → 扫描最近聊天内容
  → 根据条件动态调用 getwi() 加载对应条目
  → 实现精确的条件式提示词注入
```

---

## 2. EJS 控制器的工作原理

### 2.1 基本语法

EJS 控制器使用两种标签：

```ejs
<%_ ... _%>    ← 执行 JavaScript 代码，不输出内容
<%= ... %>     ← 输出表达式的值
<%- ... %>     ← 输出非转义的值（用于 getwi() 返回的条目内容）
<%# ... %>     ← 注释
```

### 2.2 核心 API

```javascript
// 读取 MVU 变量
getvar('stat_data.世界状态.当前时代', { defaults: '斗一' })

// 获取最近聊天消息
getChatMessages(-1, 'user')        // 最近用户消息
getChatMessages(-1, 'assistant')   // 最近AI消息

// 动态加载世界书条目
await getwi(null, '条目名称')      // null = 使用默认 UID

// 检查变量是否已定义
if (typeof _era === 'undefined') var _era = ...;
```

### 2.3 执行时机

```
每次 AI 生成回复前:
  ↓
1. EJS 控制器执行（@@preprocessing 标记）
  ↓
2. 扫描变量状态 + 聊天内容
  ↓
3. 根据条件调用 getwi() 加载对应条目
  ↓
4. 加载的条目被插入到提示词中
  ↓
5. AI 基于完整的上下文生成回复
```

---

## 3. EJS 控制器的区块结构

参考斗罗大陆3.0的801行EJS控制器，分为以下区块：

### 区块1：基础变量读取

```ejs
@@preprocessing
<%_
// 从 MVU 变量中读取当前状态
if (typeof _isF0 === 'undefined') var _isF0 = (typeof lastUserMessageId === 'undefined' || lastUserMessageId === null);
if (typeof _era === 'undefined') var _era = getvar('stat_data.世界状态.当前时代', { defaults: '斗一' });
if (typeof _period === 'undefined') var _period = getvar('stat_data.世界状态.年表时期', { defaults: '前期' });
if (typeof _chapter === 'undefined') var _chapter = getvar('stat_data.世界状态.剧情章节', { defaults: '序章' });
if (typeof _area === 'undefined') var _area = getvar('stat_data.世界状态.当前区域', { defaults: '' });
if (typeof _scene === 'undefined') var _scene = getvar('stat_data.世界状态.当前场景', { defaults: '' });
if (typeof _sType === 'undefined') var _sType = getvar('stat_data.世界状态.当前场景类型', { defaults: '日常' });
// ... 更多变量
_%>
```

**要点**：
- 使用 `typeof ... === 'undefined'` 检查避免重复初始化
- 使用 `getvar()` 默认值处理未初始化的变量
- 变量名使用下划线前缀 `_xxx` 避免与条目内容冲突

### 区块2：聊天文本扫描

```ejs
<%_
if (typeof _txt === 'undefined') {
  var _txt = '';
  if (typeof getChatMessages === 'function') {
    var _um = getChatMessages(-1, 'user');        // 用户消息
    var _am = getChatMessages(-1, 'assistant');   // AI消息
    var _un = Math.min(3, _um.length);            // 最多取最近3条
    var _an = Math.min(3, _am.length);
    for (var _i = _um.length - _un; _i < _um.length; _i++) { _txt += _um[_i] + ' '; }
    for (var _j = _am.length - _an; _j < _am.length; _j++) { _txt += _am[_j] + ' '; }
  }
}
// 合并所有搜索字段
if (typeof _f === 'undefined') var _f = (_area || '') + ' ' + (_scene || '') + ' ' + _txt;
_%>
```

**关键设计**：`_f` 是统一的搜索字段，后续所有关键词匹配都基于它。它包含当前区域+场景+最近聊天内容。

### 区块3：NPC别名映射表

```ejs
<%_
if (typeof _npcs === 'undefined') {
  var _nm = {};  // 别名 → 正式名 映射
  
  if (_era === '斗一') {
    _nm = {
      '唐三': '唐三', '小三': '唐三', '三哥': '唐三',
      '小舞': '小舞',
      '比比东': '比比东', '教皇': '比比东', '东儿': '比比东',
      // ... 50+ NPC 映射
    };
  } else if (_era === '斗二') {
    _nm = {
      '霍雨浩': '霍雨浩', '雨浩': '霍雨浩',
      // ... 100+ NPC 映射
    };
  } else if (_era === '斗三') {
    _nm = { /* ... 100+ NPC 映射 */ };
  }
  
  // 检测哪些NPC在最近聊天中被提及
  var _npcs = [];
  var _ns = {};
  for (var _k in _nm) {
    if (_f.includes(_k)) {
      var _v = _nm[_k];
      if (!_ns[_v]) { _ns[_v] = true; _npcs.push(_v); }
    }
  }
}
_%>
```

**设计要点**：
- 别名映射表按时代分段（不同时代NPC不同）
- 同义词全部映射到同一个正式名（避免重复加载）
- 只加载被提及的NPC条目，节省 token

### 区块4：势力/地点映射表

```ejs
<%_
if (typeof _places === 'undefined') {
  var _pm = {};  // 别名 → 正式名 映射
  
  if (_era === '斗一') {
    _pm = {
      '武魂殿': '武魂殿', '供奉殿': '武魂殿',
      '史莱克学院': '史莱克学院',
      '星斗大森林': '星斗大森林', '星斗': '星斗大森林',
      // ... 40+ 地点映射
    };
  }
  // ... 其他时代
  
  var _places = [];
  var _ps = {};
  for (var _pk in _pm) {
    if (_f.includes(_pk)) {
      var _pv = _pm[_pk];
      if (!_ps[_pv]) { _ps[_pv] = true; _places.push(_pv); }
    }
  }
}
_%>
```

### 区块5：常驻加载

```ejs
<%# 核心规则，不管什么情况都加载 %>
<%- await getwi(null, '斗罗大陆核心规则') %>
```

### 区块6-7：按时代/时期加载

```ejs
<%_ if (!_isF0) { _%>  <%# 第0楼（开场）不加载这些 %>

<%# 按时代加载世界格局 %>
<%_ if (_era === '斗一') { _%>
<%- await getwi(null, '斗一：世界格局') %>
<%_ } else if (_era === '斗二') { _%>
<%- await getwi(null, '斗二：世界格局') %>
<%_ } else if (_era === '斗三') { _%>
<%- await getwi(null, '斗三：世界格局') %>
<%_ } _%>

<%# 按时期加载年表 %>
<%- await getwi(null, _era + '：剧情年表总纲（' + _period + '）') %>

<%# 按章节加载 %>
<%_ if (_chapter && _chapter !== '待初始化') { _%>
<%- await getwi(null, _era + '：' + _chapter) %>
<%_ } _%>
```

### 区块8：常驻规则（第0楼之后每次都加载）

```ejs
<%- await getwi(null, 'NPC互动规则') %>
<%- await getwi(null, '剧情演化规则') %>
<%- await getwi(null, '时间流逝机制') %>
```

### 区块9：条件触发规则（关键词匹配，非互斥，可叠加）

```ejs
<%_ if (_f.includes('武魂觉醒') || _f.includes('觉醒仪式') || ...) { _%>
<%- await getwi(null, '武魂评估规则') %>
<%_ } _%>

<%_ if (_f.includes('融合技') || _f.includes('武魂融合')) { _%>
<%- await getwi(null, '武魂融合技规则') %>
<%_ } _%>

<%_ if (_era === '斗二') { _%>
  <%- await getwi(null, '斗二：魂导师设定') %>
  
  <%_ if (_f.includes('魂导器') || _f.includes('魂导炮') || ...) { _%>
  <%- await getwi(null, '斗二：魂导器设定') %>
  <%_ } _%>
  
  <%_ if (_f.includes('魂灵') || ...) { _%>
  <%- await getwi(null, '斗二：魂灵基础设定') %>
  <%_ } _%>
<%_ } _%>
```

### 区块10：互斥场景规则（只加载一种）

```ejs
<%_ var _sr = false; _%>

<%_ if (!_sr && (_sType === '战斗' || _sType === '比赛' || ...)) { _%>
<%- await getwi(null, '战斗描写指南') %>
<%_ _sr = true; } _%>

<%_ if (!_sr && (_sType === '猎魂' || ...)) { _%>
<%- await getwi(null, '魂兽生成规则') %>
<%- await getwi(null, '魂技生成规则') %>
<%_ _sr = true; } _%>

<%_ if (!_sr && (_sType === '购物' || _sType === '拍卖' || ...)) { _%>
<%- await getwi(null, '经济系统') %>
<%_ _sr = true; } _%>

<%_ if (!_sr && _sType === '亲密') { _%>
<%- await getwi(null, 'NSFW规则') %>
<%_ _sr = true; } _%>
```

使用 `_sr`（scene rule loaded）标志确保只加载第一个匹配的规则组。

### 区块11-12：NPC和地点加载

```ejs
<%# 加载匹配的地点条目 %>
<%_ if (_places && _places.length > 0) { _%>
<%_ for (var _p = 0; _p < _places.length; _p++) { _%>
<%- await getwi(null, _era + '：' + _places[_p]) %>
<%_ } _%>
<%_ } _%>

<%# 加载匹配的NPC条目 %>
<%_ if (_npcs && _npcs.length > 0) { _%>
<%_ for (var _n = 0; _n < _npcs.length; _n++) { _%>
<%- await getwi(null, _era + '：' + _npcs[_n]) %>
<%_ } _%>
<%_ } _%>

<%_ } _%>  <%# 结束 !_isF0 条件 %>
```

---

## 4. 世界书条目的命名规范（配合EJS控制器）

EJS 控制器通过字符串拼接动态生成条目名称，因此条目命名必须严格一致：

```yaml
命名模式: "{时代}：{内容名}"
示例:
  斗一：世界格局         ← 在控制器中: _era + '：世界格局'
  斗一：唐三             ← 在控制器中: _era + '：' + _npcs[_n]
  斗一：星斗大森林       ← 在控制器中: _era + '：' + _places[_p]
  斗一：剧情年表总纲（前期） ← 在控制器中: _era + '：剧情年表总纲（' + _period + '）'
  斗一：第一章 觉醒      ← 在控制器中: _era + '：' + _chapter
  斗三：锻造师设定       ← 在控制器中: '斗三：锻造师设定'
```

---

## 5. EJS 控制器的全局标记

```yaml
在世界书条目中的设置:
  名称: EJS控制器
  启用: true
  激活策略:
    类型: 蓝灯              ← 始终激活
  插入位置:
    类型: 指定深度
    角色: 系统
    深度: 0                  ← 在所有内容之前
    顺序: 1                  ← 第一个条目
  内容: "@@preprocessing\n<%_ ... _%>"   ← 关键标记
```

`@@preprocessing` 标记告诉酒馆系统这是一个预处理条目，需要在提示词构建的最早阶段执行。

---

## 6. EJS 设计的高级模式

### 6.1 按时代分段的大型映射表

对于有多个时代的卡，每个时代有完全不同的NPC和地点：

```ejs
// 优点：不会加载不相关时代的NPC信息
// 实现：根据 _era 变量选择不同的映射表

if (_era === '斗一') {
  _nm = { /* 斗一NPC */ };
} else if (_era === '斗二') {
  _nm = { /* 斗二NPC */ };
} else if (_era === '斗三') {
  _nm = { /* 斗三NPC */ };
}
```

### 6.2 互斥场景 + 条件触发的组合

```ejs
// 第一层：互斥场景（同时只能一种）
// 第二层：条件触发（在某种场景下叠加额外规则）

// 互斥层
if (!_sr && battle)  → 加载战斗规则 + 基于武器类型叠加武器规则
if (!_sr && shopping) → 加载经济规则 + 基于地点叠加市场规则

// 条件层（独立于互斥层）
if (era === '斗三' && mentions_forging) → 额外加载锻造规则
if (soulLevel >= 95 || mentions_godhood) → 额外加载成神规则
```

### 6.3 第0楼跳过逻辑

```ejs
// _isF0: 判断是否是开场第一楼
// 第0楼不需要加载太多内容（还没有游戏状态）

if (!_isF0) {
  // 加载所有游戏相关内容
} else {
  // 第0楼只加载核心规则
}
```

---

## 7. 创世回廊3.0 的多世界融合模式

创世回廊3.0使用了不同于EJS控制器的方案（使用MagVarUpdate框架），但其分层管理的思想值得EJS架构参考：

```yaml
多世界融合的EJS设计思路:
  1. 用变量记录"当前世界"（类似时代的层级）
  2. 每个世界有独立的规则/NPC/地点条目
  3. 通用系统跨世界共享
  4. 世界切换时切换对应的世界书条目组

EJS实现:
  var _world = getvar('stat_data.当前世界', { defaults: '阿拉德' });
  
  // 通用规则（所有世界共享）
  await getwi(null, '通用：战斗规则');
  await getwi(null, '通用：经济系统');
  
  // 世界专属规则
  if (_world === '阿拉德') {
    await getwi(null, 'DNF：世界观');
  } else if (_world === '迪斯博德') {
    await getwi(null, 'NGNL：世界观');
  }
```

---

## 8. EJS 控制器的性能考量

```yaml
Token 预算原则:
  - EJS 控制器本身的代码不计入AI的token
  - 但通过 getwi() 加载的条目计入AI的token
  - 所以控制器的目标是：尽可能精确地只加载当前需要的条目

优化策略:
  1. 常驻条目尽量精简（核心规则不要超过500字）
  2. NPC/地点条目按需加载（只在被提及时）
  3. 使用 _isF0 跳过开场时不必要的加载
  4. 互斥场景确保不会同时加载多个大型规则条目
  5. 定期审查哪些条目极少被触发，考虑合并或删除

命名一致性检查:
  - EJS 控制器中的条目名称必须与世界书中的条目名称完全一致
  - 包括全角/半角标点、空格、冒号类型（中文：vs 英文:）
  - 建议在编写完成后统一检查所有 getwi() 调用的参数
```

---

## 9. EJS 架构 vs 传统世界书的关键决策

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 简单的日常卡 | 传统世界书 | EJS过于复杂，传统关键词激活足够 |
| NPC少于20个的卡 | 传统世界书 | 别名映射表不值得 |
| 只有1个时代/区域的卡 | 传统世界书 | 不需要时代切换逻辑 |
| 3个以上时代/大区域 | **EJS架构** | 需要按时代加载不同内容 |
| NPC超过50个 | **EJS架构** | 按需加载节省大量token |
| 复杂的游戏系统（战斗/锻造/经济） | **EJS架构** | 互斥场景逻辑需要动态判断 |
| 需要根据变量值选择不同规则 | **EJS架构** | 传统世界书做不到 |

---

## 10. EJS 架构检查清单

- [ ] EJS控制器条目是否设置了 `@@preprocessing` 标记？
- [ ] EJS控制器是否插入在深度0、顺序1（最早执行）？
- [ ] 变量初始化是否使用了 `typeof ... === 'undefined'` 防重复？
- [ ] 是否处理了 `_isF0`（第0楼）的特殊情况？
- [ ] 别名映射表是否完整（所有常见称呼都映射到正式名）？
- [ ] 别名映射是否有去重逻辑（多个别名→同一正式名只加载一次）？
- [ ] 互斥场景是否使用 `_sr` 标志确保只加载第一个匹配？
- [ ] NPC/地点条目名称是否与 `getwi()` 参数完全一致？
- [ ] 命名规范是否统一（如 `{时代}：{内容}` 模式）？
- [ ] 常驻条目是否精简到最少？
- [ ] 是否有过多的条件分支（超过200行的控制器建议拆分逻辑）？
