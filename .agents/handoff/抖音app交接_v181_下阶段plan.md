# 抖音 app 交接 + 下阶段 Plan（截至 v181）

> 本文档 = 现状交接 + 下一阶段功能设计蓝图。新会话请先读完「一、二」了解现状，再看「三」的功能 plan。
> 前置阅读：同目录 `抖音app交接_v177.md`（架构、prompt 设计、UI 拟真、踩坑清单的底子，仍然有效）。本文档只补 v178→v181 的变化与后续 plan。

---

## 【最新进度 v196~v201，2026-07-29，已推送 + 工作区待处理】

### 版本线说明（重要，别搞混）
- **v201**（`fe3c1124`，已公开）= v199好抖音功能 + 新封面，**不含转发**
- **v200**（`3605ce94`）= v199功能 + 转发代码（E降级「分享到故事」），用户说"问题挺多"待完善
- **当前工作区（未commit）**：HEAD=v201，但PhonePanel(卡区+src)已被 checkout 成 v200 内容（含转发代码）。这是 v202 的起点：v201封面 + v200转发 + 用户指出的问题修复 = v202。**用`node bump_version.mjs v202` → build → commit → push**

### 工作区当前文件状态
- `卡区/镜待流年/界面/shared/PhonePanel.vue` 和 `src/同路径` = v200内容（openDyShareMenu×6，parser修复，消息中心）—— **未暂存、未commit**
- 其余文件（index.yaml/MirrorPanel/封面/package.json等）= v201状态（已是最新）
- **恢复命令（如工作区丢失）**：`git checkout 3605ce94 -- "卡区/镜待流年/界面/shared/PhonePanel.vue" "src/镜待流年/界面/shared/PhonePanel.vue"`

### v196 #15消息中心
- 评论/回复异步生成后触发通知badge + 列表（仿真实抖音消息tab）
- `dyNotifs`存储，`pushDyNotif`在两个generate函数落库后调用，`openDyFromNotif`跳回对应视频评论区
- localStorage用`dyModeKey(DY_NOTIF_KEY)`，抖音/抖阴各自独立，最多100条

### v197/v198 → v199/v200（parser容错 + 转发，白屏事故恢复）
见「升版提交须源码配置dist齐全」memory。parser容错(3个parser改按行扫描)是v197内容→v199；转发代码是v198内容→v200。原始v197/v198只commit了dist没commit源码，全程无报错极隐蔽，通过stash恢复重建。

### v200 E降级「分享到故事」功能
**入口：**
- 抖音视频卡分享按钮（右下角，已有SVG）→ `openDyShareMenu('video', v)`
- 直播间↗️按钮 → `openDyShareMenu('live', dyLiveRoom)`
- 每条评论meta行右侧↗️ → `openDyShareMenu('comment', {video, comment})`
- 每条子回复meta行右侧↗️ → `openDyShareMenu('reply', {video, comment, reply})`
- 照片详情右上角↗️ → `openDyShareMenu('photo', selectedPhoto)`
- 微信消息点击菜单新增「分享到故事」→ `shareWxMsgToStory()`
- 微信消息点击菜单新增「多选」→ `startWxMultiSelect()` + 底部确认栏 + `shareWxMultiToStory()`

**核心函数：** `openDyShareMenu(type,data)`设`dyShareMenu`→浮层菜单→`shareToStory(type,data)`调`buildShareToStoryText`组装文本→`th.generate({user_input:text})`
**5种注入措辞（buildShareToStoryText）：**
1. 普通抖音视频：`（${me}把手机屏幕转过来——抖音博主@...）`
2. 抖阴公开+pcontent：两段（公开画面+【只给${me}看的私密版】）
3. 抖阴私密陌生成人博主（stranger=true）：`（${me}悄悄翻出抖阴...成人内容）`
4. 抖阴私密红颜私发（isRedYanPrivate，无pcontent）：`（${me}把手机递过去——这是她私下发给${me}看的私密视频）`
5. 直播/评论/子回复/照片/微信单条/微信多选：各自对应模板
**「发给微信」当前是toast占位，待D-2实现。**

### 【待办·下次接着做】
- **v202（当前工作区起点）**：先让用户说出v200转发的具体问题，修复后bump v202 build push。**工作区PhonePanel已是v200内容，只需修哪改哪再bump。**
- **D-2 分享到微信（唯一剩余大功能）**：联系人选择弹层（ownerLogs所有contact+搜索）+ 新消息类型`'分享'`（消息对象加`shareData`字段）+ 分享卡片渲染（transform:scale缩小版）+ `putBoth`直写logs不走`putPending`（不触发AI/正文）。详细设计已在本轮会话讨论完毕，见下方阶段D-2节。

---

## 【最新进度 v189~v195，2026-07-27，已推送】

### v190：手机输入法浮层（#6，最重要）
全部文本/数字输入框改为 readonly + 点击弹自绘 IME 浮层，不再触发系统键盘顶缩小手机。
- **结构**：浮层挂在 `.mp-phone`（有 transform 缩放）**外面**、`.mp-overlay` 里面，是 `.mp-phone` 的 sibling，不受缩放影响；position:absolute;inset:0 覆盖全屏。
- **聚焦修复**：浮层 teleport 到 `window.parent.document.body`，querySelector 必须用 `doc.querySelector`（`const doc = window.parent ? window.parent.document : document`），否则找不到元素。
- **覆盖范围**：微信 draft/newContact/searchQuery(两处，微信聊天tab+手机主搜索)/remarkDraft/cameraDraft/dyCommentDraft/dySearchDraft/dyLiveChatDraft（8个文本）+ histDraft/livePctDraft/chatBatchDraft/strangerDraft/rechargeDraft（5个数字）。
- **openIME 入口**：每个输入框有专属 `openIMEXxx()` 函数，统一调 `openIME({placeholder,getValue,setValue,onSubmit?,multiline?})`，每次击键 `_imeSetValue(value)` 实时同步回原 ref。
- **IME CSS 关键**：ST 环境会全局把 `.mp-overlay input` 染黑，必须加 `.mp-overlay .mp-ime-in/.mp-ime-ta { background:#fff!important; color:#111!important }`。

### v191~v195：抖音/直播/评论大批修复
1. **抖音/抖阴数据完全分离**：`dyModeKey(base)` → `base + (_n | _r)`，10 个 localStorage 键各自独立（feed/idx/follows/idxmap/history/fanclub/diamond/hot/searches）。settings 仍共享（存模式本身）。`watch(dyR18, (new,old)→ 先用 old 对应 key 存当前数据 → 清内存 → loadDyData(true) 加载新模式)` 挂在 `onMounted` 内。

2. **直播间系列修复**：
   - 进直播间不再自动生成聊天（删了 `enterDyLiveRoom` 里的自动补批），底部加 ▶ 按钮手动触发 `generateLiveChat(false)`。
   - `closeDyLiveRoom` 退出前把全量 `chatLog` 写回 feed，不再丢消息。
   - 每批聊天也同步 `douyinFeed[fi].chatLog = [...chatLog]`（之前只存 slice(-8)）。
   - 等级字段解析容错 `Lv.85` → `(level||'').match(/\d+/)` 提取数字。
   - user 发言默认用粉丝团等级（无粉丝团=0），不再是 null（防止 AI 看历史以为等级可省）。
   - 观众数递增：修了万格式解析（`parseFloat * 10000`）；红颜直播（`isRedYan=true`）不加随机路人，只按 join 消息增；普通直播仍加 2-8 随机隐藏观众。
   - `dyLiveViewers` computed：含 user 自己（用粉丝团真实等级），每人取最高等级（多次出现取 max）。
   - 直播加入历史记录：`enterDyLiveRoom` 调 `pushDyHistory({…, type:'live'})`，历史列表有红色「直播」标记；`openDyFromHistory` 对 `type==='live'` 直接打开直播间。
   - 直播间左上角等级徽章删掉（会挡主播头像）；点赞数独占一行不与名字挤。
   - 礼物面板：14档礼物+批量数量选择（×1/5/10/50/99）+充值多档（6/30/98/198/328/648）+自定义。

3. **评论系列修复**：
   - **pcontent 规则**：不再依赖用户是否翻转，只要 `video.pcontent && isR18` 就带入 comment prompt（博主可表现，他人不得提及）。
   - **陌生人私密视频**：生成时打 `video.stranger = true`；comment 函数改用 `isRedYanPrivate = isPrivate && !video.stranger` 判断——只有红颜私发才限制评论者，陌生博主的私密内容(公开成人内容)可有陌生人评论。
   - 主评论触发异步生成：`submitDyComment` 普通评论也调 `generateDyTopCommentResponse(v, newComment)`，博主/路人的回应挂成该评论的**子回复**（不是新主评论）。
   - 子回复布局：`margin-left:0`，竖线对齐评论首字；去掉微型头像，简化为行内 display。
   - 回复提示栏删掉（`mp-dy-cm-reply-bar`），✕ 移到输入框行内。
   - 评论区删掉 `@` 按钮（placeholder 已有"回复@xxx"提示）。
   - join 进场消息格式容错：`text==='join'` 也识别为进场消息。

4. **平台定语补全**：所有 `isR18` 的直播聊天/评论 prompt 统一用 `'抖阴（成人向短视频平台）'`（不再裸用"抖阴"，AI 把握不住尺度）。

### 【待办·下次接着做】
- **#15 消息中心（唯一剩余大功能）**：异步生成回复后触发通知 badge + 消息列表（仿真实抖音"消息"tab，显示"xxx回复了xxx"）+ 点击定位到对应视频评论区。用户提到以后还能做私聊界面（消息界面复用）。这是独立功能，规模中等，需要：notification 队列 ref + 计数 badge + 新 panel + openDyFromHistory 定位联动。
- 提示词一致性检查：基本已完成，无明显遗漏。

**重要工作方式提醒（用户多次强调）：** 用户关闭了自动压缩记忆，长会话 agent 会混乱。**上下文将满先更文档+记忆再压缩**，别拖到快满才压（压完会很混乱、效果差）。遇卡壳先写状态别空转。升版必用 `node bump_version.mjs vXXX`。git 只精准 add 卡区相关（绝不 -A），bot PNG stash 挪开。rebase 时 dist 产物冲突用 `git checkout --theirs` 取我方 v 版本产物，再 rebuild 推。

---

## 一、当前状态（v181，已推送）

- CDN 版本 v181，代码在 `卡区/镜待流年/界面/shared/PhonePanel.vue`，抖音部分搜 `// ---- 抖音 ----`
- **改完必须 `cp` 到 `src/镜待流年/界面/shared/PhonePanel.vue`**（src 是编译源，卡区是酒馆同步源，逐字一致）
- 升版流程照旧：`node bump_version.mjs vXXX` → `pnpm build` → grep 校验 `__webpack_require__` 为 0 → 精准 `git add`（**绝不 `-A`**）→ commit → `git pull --rebase` → push。webpack 锁死 `5.106.2`。
- push 前工作区常挂着 `卡区/.../镜待流年v17X.png`（bot 改的）、`.agents/`、`assets/`、`.env.image.*`——**只暂存卡区相关文件**，png 用 `git stash` 挪开再 pull。

## 二、v178→v181 累积的抖音变化（相对 v177 交接文档）

### 数据结构新增字段（video 对象）
```js
{
  ...v177的字段,
  vis: 'public'|'private',      // v177已有
  pcontent: '',                 // v179新增：抖阴公开流翻转后只给user看的私密版画面
  pending: true,                // v179新增：占位卡标记，生成中；填充后删除；saveDyFeed会剔除
}
```
评论对象 v180 去掉了 `replyCount`（曾是假的"展开N条回复"装饰，已删）。

### localStorage 键（全部在 clearDyCache 里一并清）
- `jdnl_dy_feed` 视频列表（存时剔除 pending 占位卡）
- `jdnl_dy_idx` 当前下标
- `jdnl_dy_settings` `{ mode:'normal'|'r18', strangerPct:0 }`
- `jdnl_dy_follows` **独立关注名单**（v178+，不随 feed 50 条上限淘汰）
- `jdnl_dy_idxmap` **各 tab 独立当前下标** `{推荐,关注,私密}`（v179+）
- `jdnl_dy_history` 观看历史（v179+，最多 80 条，作者名+content前40字+vis+ts）

### 核心机制（新会话动抖音前必须懂）

**占位卡流程（v179，解决"刷一次出好几条"+"箭头进度不更新"）**
上滑到底 → `generateDyVideo` 立刻 push 一个 `pending:true` 占位卡并把视口滚过去 → 当前条立刻是占位卡（箭头/进度同步）→ 后台生成回来 `splice` 原地替换。失败/异常则移除占位卡回退。

**suppressDyScroll（v181，解决"取关/切tab误触发生成"）**
`onDyScroll` 分不清"人手滑到底"和"列表被程序改短"。所以取关、切 tab、插占位卡、恢复位置这些**程序性改动列表/滚动**的瞬间，调 `suppressDyScroll(800)` 屏蔽生成触发。改抖音里任何"程序性改动 feed 长度或 scrollTop"的地方，都要记得 suppress，否则会误触发生成。

**dyVisibleFeed 过滤（三 tab 语义，v179 定稿，用户已确认保留）**
- 推荐 = `vis!=='private'`（含关注博主的公开视频——真抖音行为，关注的人也在推荐刷得到）
- 关注 = `isFollowing`（含红颜的私密视频，所以红颜私密在关注和私密两个 tab 都出现——用户确认这是要的）
- 私密 = `vis==='private'`
- **一条视频按性质出现在多个 tab 是正常的**，不是 bug。占位时多个 tab 看到同一张占位卡在转，只生成一条。

**翻转 pcontent（v179）**
仅抖阴模式的公开流（推荐/关注）生成时要 AI 多输出一行 `pcontent`（大尺度私密版）。点视频文字翻转显示，`dyFlipped[_i]` 记状态。**评论区/弹幕在 prompt 里被硬约束只能围绕公开的 content，绝不能提及 pcontent**（否则穿帮=全网都知道 ta 私发你）。抖音全年龄模式不生成翻转。

**私密页红颜/陌生比例（v180）**
`dyStrangerPct`（默认 0=全红颜私发）。生成私密视频时 `Math.random()*100 < strangerPct` 决定这条是陌生成人博主还是红颜私发。**两者评论规则完全不同**：红颜私发有评论铁则（仅 user+红颜、否则留空）；陌生博主是公开成人内容，走正常陌生评论。设置里有 ⚠️ 红字说明这个区别。

**关注 tab（v178-v181）**
- 空名单时不生成、显示引导页
- 生成时从 `dyFollows` 定向选人，且 prompt 不加 `seen`（否则"从已关注选"和"换新人别重复"冲突）
- 取关同步 `dyFollows` + feed 里同作者所有视频

### v178→v181 已修 bug 清单（避免重复踩）
- 空评论行（AI 吐 `c3:|||` 空占位）→ user 和 text 都非空才收
- 进 tab 就打 API → `onDyScroll` 空列表 guard
- 生成完退出再进不显示 → `openDouyin` 重新 `loadDyData` + `dyRestorePos` 加 clientHeight 重试
- 清缓存没清历史 → clearDyCache 一并清所有键 + dyFlipped
- 自定义输入黑底 → `.mp-overlay .xxx{...!important}`（ST 表单染色老坑）
- 自定义输入被 2 秒轮询清空 → 改本地草稿 ref，回车/失焦才 apply
- 静音胶囊被底栏遮挡 → bottom 20→58px，z-index 提到 16
- 评论展开假数字 → 删掉，改成底部"共X条评论，仅显示N条"（claimed vs real）

---

## 三、下一阶段 Plan（用户已确认方向与优先级）

**总原则（用户定）**：先易后难、先独立后联动。独立展示功能先做，跨 app 转发/联动留到最后，避免"先做转发结果新功能出来又要补转发"。

### 阶段 A：搜索（独立，最简单，先做）
- 顶栏放大镜已存在（现在无功能）。点开 → 输入框 → 关键词
- 本质：`generateDyVideo` 加一个 `query` 参数，prompt 里加"user 搜索了『X』，生成与之相关的视频"
- 结果进一个临时搜索结果流（或复用推荐流并标记来源）。需 user 定：搜索结果是独立一屏，还是塞进当前流
- 抖音/抖阴模式各自的尺度规则沿用

### 阶段 B：热榜（独立，中等）
- 一个榜单列表：话题文字 + 热度数字（如 `1. #xxx 328.5万`）
- 抖音/抖阴两套榜（用户明确：热榜就是抖音/抖阴的区分，关键在 prompt）
- 点某条 → 带着该话题去 `generateDyVideo`（等于带 query 的搜索）
- 与阶段 A 共享"带 query 生成"的底层，所以 A 做完 B 顺带

### 阶段 C：直播（v185 骨架已推但用户说大改，v186+ 重构）

**用户反馈与参考截图（2026-07-26）：**
- 直播不该是独立"直播广场"页（已删除），要**融入视频流**
- 参考截图：`assets/素材/Screenshot_20260726_211253.jpg`（关注tab直播头像条）/ `211300.jpg`（视频流里的直播卡样式）/ `211814.jpg`（直播间内部）

**重构方案（用户已确认）：**

#### 数据层
- feed 里的直播是普通 video 对象加 `type:'live'`（区别于普通视频 `type:'video'`，默认值）
- `generateDyVideo` 生成前掷骰：`isLive = !isSearch && !isPrivate && Math.random()*100 < dyLivePct`
- 直播卡字段：`creator/verified/title/viewers/content（当前直播内容描述）/chatLog（初始聊天列表）/vis/isFollowing/type:'live'`
- 聊天格式：`{user, text, level, isJoin, isMe}` — `level` 是数字（粉丝等级）、`isJoin` 是"xxx来了"类型

#### 直播卡（feed 里）
- 对照截图2：深色背景 + 上半部分大字"直播内容描述" + 左上角「直播中」红标 + 居中「点击进入直播间」CTA 按钮
- 底部 info 行：@creator + title（不要普通视频的 likes/comments/saves/shares 按钮，直播用进入按钮代替）
- 上划照常刷新（和视频一样，到底触发 generateDyVideo 可能再出一个直播或视频）

#### 直播间（全屏 overlay）
- **顶部**：头像 + 主播名 + 「关注」红按钮 | 在线观众小头像堆叠 + 人数 | ×关闭
- **内容区（上~45%）**：深色背景，显示当前直播内容文字（`dyLiveRoom.content`，可随生成更新）
- **聊天区（下~45%）**：滚动列表，最新在底部；每条：`[等级徽章] 昵称: 内容`；"来了"类型 = 灰色简单文字
- **底部栏**：`说点什么...` 输入框 | 😊 | ❤️ | 🎁 | ↗️ share
- **推进逻辑（用户确认：发言即推进）**：用户发一条 → 插入聊天列表 → 触发 `generateLiveChat()` → AI 生成主播回应+其他观众新发言（8-10条），继续追加到聊天列表；保留一个「主播继续」兜底按钮不发言也能推进
- 进房间时自动生成第一批聊天（开场内容+初始弹幕10条）

#### 生成格式
```
===LIVECARD===
creator:xxx
verified:true/false
title:直播标题(15字内)
viewers:在线人数
content:当前直播画面描述(2-3句)
chat1:等级数字|||昵称|||内容|||join(可选，填join=进场消息)
...chat8:
===LCEND===
```
生成更多聊天（`generateLiveChat`）：
```
===LIVECHAT===
c1:等级|||昵称|||内容
...c10:
===CHATEND===
```

#### 设置
- `dyLivePct`（0~100，默认15）：feed 里直播出现概率，设置面板加「直播出现概率」行（和 strangerPct 同款 UI）
- 保存在 `douyinSettings.livePct`

#### 关注 tab 直播头像条（对照截图1）
- `dyLiveInFollowed` = feed 里 `type==='live' && isFollowing` 的条目
- 当有数据时，在关注 tab 的 feed 顶部显示横排头像圆圈 + 「直播中」红标
- 点头像 = 直接进入该直播间（`enterDyLiveRoom(v)`）

#### 抖阴直播
- 与视频逻辑一致：推荐/关注里可出直播；生成时 `isR18` 决定风格
- 发布者用 `isPrivateStranger` 分支：红颜私密直播（仅 user+红颜可发言，评论铁则同私密视频）vs 陌生成人博主公开直播
- 私密tab不出直播（`isPrivate=false` 才掷骰）

#### 视频评论回复
- 评论对象加 `replies:[]` 字段
- 评论项加「回复」按钮 → 设置 `dyReplyTo` ref → 输入框 placeholder 变 `回复 @xxx`
- 提交时：发给当前视频的 `myComments` + 异步 `generateDyCommentReply()` → AI 生成被回复者/博主/其他人的回复 → 追加到 replies

#### 代码实现关键点
- 删除：`showDyLive/dyLiveList/generatingLiveList/dyLiveRoom（旧）/generatingLiveSeg/dyLiveContentEl/DY_LIVE_GIFTS`及所有旧直播函数+CSS
- 新增：`dyLivePct/dyLiveRoom（新，全屏overlay状态）/dyLiveChatEl/dyLiveChatDraft/generatingLiveChat` 及相关函数
- 顶栏「直播」按钮：抖音模式下改为 `showToast('直播在推荐和关注流里刷就有')` 或直接去掉（已被「直播中」头像条替代）
- `loadDyData` 加载 `douyinSettings.livePct` → `dyLivePct`
- `clearDyCache` 加 `dyLiveRoom=null`
- `goHome` 加 `dyLiveRoom=null; stopDanmaku()`

### 阶段 D：跨 app 转发 + 联动（最复杂，最后做，可能单开会话）
这是用户口中"挂钩微信"的真正含义——**不是把评论生成进微信消息**，而是：

1. **抖音消息区（拟真）**：抖音底栏"消息"tab（现在是 toast 占位）做成真消息列表。评论区互动后，博主的回复**异步**出现在这里（现实也不是秒回）。陌生人→陌生人消息分组，关注的人→关注人消息分组。
   - 异步：点了评论/回复 → 记一个 pending → 过一会（轮询或延时）生成博主回复 → 落到消息区 + 红点
   - 复用微信那套 healPending/异步落库的思路

2. **视频/照片/微信内容互相转发**：
   - 抖音视频 → 转发到微信（微信里出现一条带缩略图的分享卡片）
   - 照片（相册）↔ 微信 ↔ 抖音 互转
   - **难点（用户明确指出）：底层数据如何呈现**——三个 app 的数据结构不同（微信是 logs 按 owner/contact 分组、相册是 photos 数组、抖音是 douyinFeed），转发要设计一个通用的"分享卡片"数据格式，能在三边都渲染
   - 建议：先设计统一的转发 payload schema，再各端做渲染

3. **真评论回复**：评论 → 博主回复；回复某条评论 → 博主/被评论者回复。异步生成。与阶段 D-1 消息区挂钩。

### 阶段 E：用到正文（联动正文，最后 + 需求最模糊）
用户澄清：**这就是纯手机模式 vs 正文模式的区别**。
- 现在抖音是纯手机模式 only（内容不进正文，无世界书条目）
- 用户设想：像微信那样，在小手机里给抖音也做一个**纯手机模式 / 正文模式切换**
- 正文模式 = AI 在正文楼层吐 `<抖音>` 块 → 正则渲染成卡片 → syncScrape 扒进抖音面板（完全复用微信 `<手机>` 块 + `手机与照片格式.yaml` 世界书的现成机制）
- **关键记忆已更新（别再信旧版）**：
  - `feedback_不污染正文与输入`：**块状内容正常进正文由正则渲染成卡片是当前正确设计**，只有纯手机模式才绕过正文。做正文模式抖音就照微信 `<手机>` 块的路子走。
  - `generateRaw深度条目不注入`：纯手机模式用 generateRaw，**深度注入的世界书条目接不到**，格式规则要么内嵌进 instruction，要么放 world_info_before/after 位置，要么带上系统深度。抖音纯手机模式现在就是把格式写死在 instruction 里（对的做法）。
  - 正文模式则可以像微信一样建一个抖音格式的世界书条目（走正则渲染），不受 generateRaw 限制。

### 依赖关系图（决定做的顺序）
```
A 搜索 ─┐
        ├─→ 共享"带query生成"底层
B 热榜 ─┘
C 直播（独立骨架，抖阴细节待议）
D 转发+消息区+真回复（跨app，需先定统一分享payload schema）
E 正文模式（复用微信<手机>块机制 + 抖音格式世界书条目）
```

## 四、需要 user 继续拍板的点（新会话开工前问清）
- A：搜索结果独立一屏 vs 塞进当前流
- C：抖阴直播的大尺度/送礼/私密怎么设计（用户已知这块麻烦）
- D：统一分享卡片 payload 长什么样、微信里分享卡片的视觉
- E：正文模式抖音块的格式设计（可对着 `手机与照片格式.yaml` 里微信块的写法起草）

## 五、会话建议
用户问接着压缩 vs 开新会话：**开新会话**。本阶段是全新设计工作，旧会话堆了 v177→v181 大量已解决的 bug 细节，是噪音。本文档已覆盖开工所需全部现状 + plan。
