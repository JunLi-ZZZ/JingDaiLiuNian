# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/mcp.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/前端界面.mdc
@.cursor/rules/脚本.mdc
@.cursor/rules/mvu变量框架.mdc
@.cursor/rules/mvu角色卡.mdc

## 生图素材与本地密钥

- 用户要求生图、改图、图生图或项目图片素材时，必须先读取并遵循 `.agents/skills/gpt-image-assets/SKILL.md`。
- `.env.image.local` 是本地密钥文件。代理不得直接读取、显示、复制、暂存或提交它，也不得使用 `git add -f` 绕过忽略规则。只允许由生图脚本在运行时读取。
