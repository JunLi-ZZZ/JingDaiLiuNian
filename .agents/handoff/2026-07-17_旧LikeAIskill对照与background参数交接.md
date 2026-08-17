# 交接文档 — 旧 LikeAI skill 对照 · `background:opaque` 与 User-Agent 两项脚本改动

- 日期：2026-07-17
- 写给：负责改 `image-assets.mjs` 的 GPT
- 目的：用户找到了当前生图脚本的**来源蓝本**（旧 LikeAI Python skill），对照后挖到两条可落地的脚本改动。**一条直接关系到我们正在打的「透明背景 = 鬼图根因」问题**。
- 阅读顺序：先看「背景」→「发现 A」（重点）→「发现 B」→「精确改哪里」→「怎么验证」→「别动的地方」。

---

## 背景：两套 skill 的关系

- **当前脚本**：`.agents/skills/gpt-image-assets/scripts/image-assets.mjs`（Node，`fetch`），双 provider：`aipaiai`（新站默认）+ `zyuou`（旧站备用）。文档 `SKILL.md` / `REFERENCE.md`。
- **旧蓝本**：`image-generation` skill（Python，LikeAI `api.likeai520.cc`）。当前脚本就是以它为基础、让 GPT 改写而来。
- 三者都是 `gpt-image-2` 的中转站封装，请求结构（`/v1/images/generations`、`b64_json`、`background`、`output_format`）同源。

### 这份旧蓝本 skill 的来历（用户原话）

用户把 zip 发过来时说：

> 「我搞到一个旧站的生图 skill，因为现在的脚本是以旧站的指南为基础让 gpt 弄得嘛，你看下有帮助吗？」

追问来源时补充：

> 「这个 skill 可能是群里 aibot 的生图 skill，我无法区分，只是在群里看到了就搬过来了。」

即：**来源不确定**，可能是**旧站（zyuou）官方群聊**里某个 aibot 的生图 skill，用户在群里看到后搬运过来，无法确认原始出处/作者。（注：这里说的「群聊」特指旧站 zyuou 的群，不是泛指某个群。）因此对照时——**LikeAI 那套请求结构、`background` 字段、User-Agent 经验可作参考线索，但它针对的是 LikeAI 这个站，不是 aipaiai**。凡涉及 aipaiai 行为的推断（尤其发现 A），一律以**在 aipaiai 上实测**为准，别把 LikeAI 文档当 aipaiai 的既定事实。

### 旧蓝本文件位置

- **用户原始 zip（稳定，桌面）**：`C:\Users\lenovo\Desktop\linshi\st\image-generation (2)(2).zip`
- **本会话解压副本（临时目录，可能被清理，别依赖长期存在）**：`C:\Users\lenovo\AppData\Local\Temp\img_skill_old\image-generation\`
  - `SKILL.md` —— 用法/默认值/Common Mistakes（含 User-Agent 那条）
  - `references/api.md` —— **关键**：`background: auto|opaque`、`output_format`、价目表都在这
  - `scripts/likeai_image.py` —— Python CLI 实现（User-Agent 常量、multipart、超时不重试逻辑）
  - `agents/openai.yaml`、`tests/test_likeai_image.py`

### 已确认的大前提：透明背景 = 鬼图根因（本会话验证，别推翻）

这是理解发现 A 为什么重要的前提，完整交代来龙去脉：

**症状**：早前用 aipaiai 出的贴纸大面积「鬼图」——主体虚糊、线稿软塌、中文文字崩成乱码（如「呜呜」→「crbugg」）。一度误判成三个独立故障：先当「中文烤字 = 鬼图开关」，又当「soft/pale 提示词把角色做糊、文字是另一回事」。**都错。**

**排除过的因素**（别再走回头路）：
- **编码**：本地 HTTP 测试确认中文 prompt 文本完整穿过 CLI argv → JSON 序列化，模型收到的中文是对的。不是编码问题。
- **尺寸**：真 4K `3840x2160` 照样崩。不是尺寸问题。
- **provider 身份**：zyuou 和 aipaiai 都见过鬼图。不是单一站的问题。

**真根因**：**prompt 里请求「透明背景」**。gpt-image-2 出不了干净 alpha，被逼出透明就产**劣质 RGBA 蒙版**（大片全透明 + 半透明混杂），把整张图（主体、细线、文字）一起做虚做糊 → 鬼图。**主体糊和文字糊不是两个独立故障，是同一个透明背景蒙版的症状**，文字糊只是最显眼那个。
- **PNG 实测佐证**：崩掉的 aipaiai 贴纸是真 RGBA，含大量全透明 + 半透明像素（如某张 29.9% 全透 + 27.7% 半透）；而两张一直好看的标杆虽然 prompt 也写了 `transparent background`，实际输出却是**不透明 RGB、棋盘格画进像素里（0% 真 alpha）**——所以它们逃过一劫。差别就在真 alpha vs 假棋盘。

**已验证的解法**：prompt 用**实底/棋盘格背景 + 要求主体完全不透明**；真要透明就**本地抠图**去背，不让模型出 alpha。本会话据此重出的贴纸（摸摸头、你好呀 v1/v3/v4）+ 3 张壁纸**全部干净、无鬼图**；对照之前崩的全都请求了透明背景。

**当前解法的局限**：现在是**在 prompt 里塞「opaque checkerboard background」的实底描述**——能用，但属 prompt hack，占提示词、且棋盘格比纯色难本地抠。**发现 A 提供的是 API 层的原生解法**（`background: opaque`），若 aipaiai 支持就能把这个 hack 从 prompt 里拿掉。

> 注：`SKILL.md` / `REFERENCE.md` 里原本对透明背景持「未确认假设」的保守口径（写脚本的 GPT 早期的猜测），本会话已据上述证据改成确认口径。别再被旧口径误导。

---

## 发现 A（重点）：`background: opaque` 是 gpt-image-2 原生字段，但当前脚本对 aipaiai 封死了

### 证据
- 旧 LikeAI `references/api.md` 把 `background: auto | opaque` 列为 generation 的**文档化原生字段**（与 `output_format`、`response_format` 并列）。
- 当前 `image-assets.mjs` 里：
  - 第 16 行：`const BACKGROUND_VALUES = new Set(['auto', 'opaque']);`（已定义）
  - 第 17-40 行 provider 表：`aipaiai.supportsOutputOptions: false`、`zyuou.supportsOutputOptions: true`
  - 第 206 行：`const background = options.background || (config.provider.supportsOutputOptions ? 'auto' : undefined);` —— aipaiai 恒为 `undefined`
  - 第 214-220 行：`if (!config.provider.supportsOutputOptions) { ... if (options.background) fail('${config.name} does not document --background support'); }` —— **给 aipaiai 传 `--background` 直接报错**
  - 第 401-404 行：只有 `supportsOutputOptions` 为真才把 `background`/`output_format` 写进请求体 —— **aipaiai 的请求体里根本不带 `background`**
- 当初对 aipaiai 关掉，理由是「aipaiai 自家指南没写 `output_format`/`background`」（见 `REFERENCE.md` Aipaiai 段）。这是**保守假设，不是实测否证**。

### 推断（未验证，需 GPT 拿一张实测）
aipaiai 同是 gpt-image-2 中转，**很可能把 `background: opaque` 透传上游**。若成立：
- 我们能在 **API 层直接拿到不透明背景的图**，不必再往 prompt 里塞「opaque checkerboard background」的实底描述。
- 对贴纸这种最终要透明的资源，**纯色不透明底比棋盘格更好本地抠图**（单色 key 比格纹干净）。
- 这是鬼图根因的**原生解法**，比 prompt hack 更稳。

**诚实标注：这是假设。** aipaiai 也可能：① 忽略该字段（不报错但无效）；② 报 400 拒绝。必须实测，不能默认它有效就全量改。

---

## 发现 B（次要，别当超时解药）：显式浏览器 User-Agent

### 证据
- 旧 LikeAI 脚本设 `USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Codex-LikeAI-Image/1.0"`，SKILL.md 的 Common Mistakes 明写：**Python 默认 `Python-urllib/*` UA 会被 Cloudflare 判源站 502，换应用 UA 同样请求就成**。
- 当前 `image-assets.mjs` 第 302-312 行 `requestJson` 的 headers：只有 `Authorization` + `Content-Type`，**没设 `User-Agent`**，走 Node `fetch` 默认（`node`）。

### 诚实评估
- 旧 skill 治的是「**秒失败的 502**」（Cloudflare 按 UA 拦截）。
- 我们本会话遇到的是「**180 秒超时**」（v3 第一次跑 timeout）——那更像**上游真慢/排队**，不是 UA 被秒拒。**两者对不上号，UA 不能当超时的解药卖。**
- 但设个正常浏览器 UA 是**便宜的保险**，防 Cloudflare 那类基于 UA 的拦截，顺手加无害。别指望它降超时率。

---

## 精确改哪里（给 GPT）

### 改动 1：放开 aipaiai 的 `background`，先做成可试
不要一刀切改默认值（默认仍别自动发，避免影响现有调用）。做成**允许显式 `--background opaque` 传给 aipaiai**：
- provider 表 `aipaiai` 增加一个细分能力位，例如 `supportsBackground: true`（与 `supportsOutputOptions` 解耦——因为 aipaiai 仍不支持 `output_format`，别把两者绑死）。
- 第 214-220 行的校验：把「`background` 仅限 `supportsOutputOptions`」拆开，改成「`background` 看 `supportsBackground`、`output_format` 看 `supportsOutputOptions`」。
- 第 401-404 行 generate 请求体：当 provider `supportsBackground` 且用户显式传了 `--background`，把 `background` 写进 body（即使 `supportsOutputOptions` 为假）。
- edit 路径（第 451-454、470-473 行）同理，酌情同步。
- **默认行为不变**：不显式传 `--background` 时，aipaiai 请求体照旧不带该字段。这样这次改动零风险回退。

### 改动 2：加显式 User-Agent
- 第 302-312 行 `requestJson`（以及第 282-300 行 `apiRequest` 里下载 url 图片的分支）headers 加：
  `'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TavernImageAssets/1.0'`
- 一处集中定义常量复用即可。

---

## 怎么验证（改完必跑，别跳）

1. **改动 1 实测**（关键）：
   ```
   node .agents/skills/gpt-image-assets/scripts/image-assets.mjs generate \
     --provider aipaiai --background opaque \
     --prompt "简单测试图，纯色背景，一只白狐狸头像，不透明背景" \
     --size 1536x1536 --quality 2K --output assets/stickers/_bgtest.png
   ```
   - **接受且出干净不透明图** → 发现 A 成立，采纳；更新 `SKILL.md`/`REFERENCE.md` 把 aipaiai 的 `background: opaque` 记为已验证支持；告诉出图方「贴纸可用 `--background opaque` + 本地抠图替代 prompt 里的棋盘格」。
   - **报 400 / 忽略（出图仍透明或无变化）** → 发现 A 不成立，回退改动 1（保留 `supportsBackground` 位设 false 即可），文档记「aipaiai 实测不支持 background，继续用 prompt 实底 hack」。
   - 用完删 `_bgtest.png`。
2. **改动 2**：跑任意一张确认 UA 加了之后仍正常出图、不报错即可（UA 不改变图像结果）。
3. 跑现有测试：`node .agents/skills/gpt-image-assets/scripts/image-assets.test.mjs`（工作区根有这个测试文件，`git status` 显示它本就在改动中，注意别冲突）。

---

## 别动的地方（防过度改）

- **aipaiai / zyuou 的双 provider 隔离、各自专用 key、拒绝通用 `ZYUOU_API_KEY`** —— 安全设计，别动。
- **超时不自动重试**（第 292-299 行）—— 旧指南和当前都对：原请求可能仍在上游跑，重试会重复扣费。别改成自动重试。
- **`output_format` 对 aipaiai 的封锁** —— aipaiai 指南确实没 `output_format`，这条别跟着 `background` 一起放开（除非另行实测）。改动 1 只解 `background`。
- **尺寸校验**（第 176-198 行）、**quality 大小写归一**（第 172-174 行，aipaiai 用 `1K/2K/4K`、zyuou 用 `low/medium/high`）—— 都对，别动。
- **价格**：旧 LikeAI `api.md` 写 1K/2K/4K = 0.03/0.06/0.18（阶梯价），但**那是 LikeAI 的**；用户明确说 aipaiai 三档**同价**。别把 LikeAI 价目当 aipaiai 的。

---

## 关键路径速查
- 当前脚本：`.agents/skills/gpt-image-assets/scripts/image-assets.mjs`
- 当前脚本测试：`.agents/skills/gpt-image-assets/scripts/image-assets.test.mjs`
- 当前文档：`.agents/skills/gpt-image-assets/{SKILL.md,REFERENCE.md}`（本会话已把「透明背景=鬼图根因」写成确认口径）
- 旧蓝本 zip（原始，稳）：用户桌面 `C:\Users\lenovo\Desktop\linshi\st\image-generation (2)(2).zip`
- 旧蓝本解压副本（临时目录，可能被清理，别当长期）：`C:\Users\lenovo\AppData\Local\Temp\img_skill_old\image-generation\`
  - `SKILL.md`（用法/凭据/Common Mistakes 里的 UA 坑）
  - `references/api.md`（含 `background: auto|opaque` 原生字段、价目）
  - `scripts/likeai_image.py`（Python 实现，UA 常量在第 22 行）
  - `tests/test_likeai_image.py`、`agents/openai.yaml`
- 记忆索引：`C:\Users\lenovo\.claude\projects\e--st-main-tavern-helper-template-main\memory\MEMORY.md`（生图经验在 `生图素材技巧.md`）
