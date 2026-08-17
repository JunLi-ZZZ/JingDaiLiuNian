# 交接：`background=opaque` 实测与透明鬼图结论

- 日期：2026-07-18
- 接手对象：Claude Code / 后续生图 Agent
- 相关 Skill：`.agents/skills/gpt-image-assets/SKILL.md`
- 技术记录：`.agents/skills/gpt-image-assets/REFERENCE.md` 的 `Live Background Observation`

## 结论先行

1. Aipaiai 会接受请求体中的 `background=opaque`，不会因此报 400。
2. 该字段不能保证输出不透明。在一次故意冲突的实测中，提示词要求真实透明 RGBA 背景，同时请求传入
   `background=opaque`；返回图仍有 90.1% 全透明像素和 5.3% 半透明像素。
3. 用户目视确认该返回图仍是“鬼图”。这再次支持当前项目的生产结论：**要求透明背景是鬼图的主要触发条件，不能依赖
   `background=opaque` 抵消透明提示词。**
4. 现有安全流程不变：提示词明确要求不透明实底和完全不透明主体；需要透明素材时，生成后在本地抠图。

注意结论边界：响应没有返回字段处理元数据，所以目前无法区分“中转站忽略了
`background`”和“字段已透传，但透明提示词优先级更高”。已经能确定的是：这个字段在 Aipaiai 上**不是可靠的强制不透明开关**。

## 为什么这样测试

若提示词和 API 参数都要求不透明，即使结果不透明，也无法判断究竟是谁起效。因此本次使用有意冲突：

- 提示词要求：`truly transparent background`、`transparent canvas`、`RGBA alpha`、无棋盘格；
- API 参数要求：`--background opaque`；
- 测试主体：红苹果贴纸和精确中文“测试”；
- 请求：Aipaiai、`gpt-image-2`、`quality=2K`、`size=1024x1536`、`n=1`。

调用通过仓库脚本完成；只有脚本在运行时读取
`.env.image.local`，会话没有读取或显示密钥。第一次沙箱内调用在 0.36 秒立即因本地网络限制
`fetch failed`，未进入生成阶段；获准联网后只执行了一次实际生成，没有自动重试。

## 实测结果

- 请求耗时：约 29.6 秒
- 返回尺寸：`1024x1536`，与请求完全一致
- PNG 大小：2,117,159 bytes
- 总像素：1,572,864
- 全透明：1,417,438（90.1%）
- 半透明：83,706（5.3%）
- 全不透明：71,720（4.6%）
- 用户视觉判断：坏图 / 鬼图

测试文件位于：

`.agents/skills/gpt-image-assets/test-output/aipaiai-background-opaque-conflict.png`

该目录已被 `.gitignore` 忽略，文件只作为本地诊断证据，不是正式素材，不要移动到 `assets/` 使用。

## 已落地改动

### `image-assets.mjs`

- Aipaiai 仍允许显式传入 `--background auto|opaque`，便于以后验证中转站是否修复。
- Aipaiai 默认不发送 `background` 字段。
- 只要给 Aipaiai 显式传入该字段，脚本结果中的 `warnings`
  就会提示：字段曾被接受但没有在冲突实测中强制不透明，必须保留不透明背景提示词并检查 alpha。
- 默认尺寸仍为竖图 `1024x1536`，默认清晰度仍为 `2K`。

### `SKILL.md`

- 已删除“尚未在线测试”的旧说法。
- 已明确：`background=opaque` 不能替代提示词里的不透明背景要求。
- 贴纸提示词仍须包含完全不透明主体、不透明纯色或烘焙棋盘格背景、无 alpha transparency。

### `REFERENCE.md`

- 已新增 2026-07-18 的 `Live Background Observation`，记录请求设计、alpha 统计、结论边界和测试图路径。

### 测试

- `image-assets.test.mjs` 已覆盖 Aipaiai 显式 `background=opaque` 的请求体和警告。
- 当前回归：`11/11` 通过。
- Node 语法、Skill 校验、Prettier、`git diff --check` 均通过。

## Claude 后续生图规则

1. 不要在生产提示词中写 `transparent background`、`透明背景`、`RGBA alpha`、`transparent canvas` 或同义要求。
2. 贴纸明确写：完全不透明主体、干净硬边、不透明纯色背景或烘焙棋盘格背景、无额外物体。
3. 不要因为命令中出现 `--background opaque` 就认为输出安全；必须查看最终图片，并在需要时检查 alpha。
4. 若最终资产必须透明，先生成不透明实底版本，再使用本地去背流程。
5. 不要自动重试超时的付费生成；原请求可能仍在上游执行并扣费。
6. 不要读取、显示、复制、暂存或提交 `.env.image.local`，也不要用 `git add -f` 绕过忽略规则。

## 建议接手方式

- 正常生图或改图：先读取并遵循 `.agents/skills/gpt-image-assets/SKILL.md`。
- 需要核对 provider、尺寸、透明背景证据：读取 `.agents/skills/gpt-image-assets/REFERENCE.md`。
- 若以后站长声明已修复
  `background=opaque`，使用同样的“提示词与字段冲突”方法做一次受控复测；在没有新证据前，不要把该字段改成默认值，也不要删除当前警告。
