# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/mcp.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/前端界面.mdc
@.cursor/rules/脚本.mdc
@.cursor/rules/mvu变量框架.mdc
@.cursor/rules/mvu角色卡.mdc

## 升版流程（重要）

升版 CDN 版本时，**必须**先用 `node bump_version.mjs vXXX` 脚本，不要手动改文件。脚本自动替换 package.json / index.yaml / MirrorPanel.vue（卡区+src）/ tavern_sync.yaml 里的版本号。详见 memory `bump_version_script.md`。

流程：`node bump_version.mjs vXXX` → `pnpm build` → `git add -A && git commit && git push`
