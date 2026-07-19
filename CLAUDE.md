# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/mcp.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/前端界面.mdc
@.cursor/rules/脚本.mdc
@.cursor/rules/mvu变量框架.mdc
@.cursor/rules/mvu角色卡.mdc
<<<<<<< HEAD

## 升版流程（重要）

升版 CDN 版本时，**必须**先用 `node bump_version.mjs vXXX` 脚本，不要手动改文件。脚本自动替换 package.json / index.yaml / MirrorPanel.vue（卡区+src）/ tavern_sync.yaml 里的版本号。详见 memory `bump_version_script.md`。

流程：`node bump_version.mjs vXXX` → `pnpm build` → `git add -A && git commit && git push`

## 生图素材与本地密钥

- 用户要求生图、改图、图生图或项目图片素材时，必须先读取并遵循 `.agents/skills/gpt-image-assets/SKILL.md`。
- `.env.image.local` 是本地密钥文件。Claude 不得直接读取、显示、复制、暂存或提交它，也不得使用 `git add -f` 绕过忽略规则。只允许由生图脚本在运行时读取。
=======
>>>>>>> a4d60f52b8b1b0f872a80088ba7e339b0933eeb2
