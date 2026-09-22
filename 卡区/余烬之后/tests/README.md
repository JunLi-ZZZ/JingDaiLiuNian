# 测试与证据

在卡片根目录运行npm test（105项当前回归），npm run test:ui（三组浏览器检查）。
node tests/reproduce-feedback.cjs复现2026-09-22截图的关键错误；输出logs/feedback-20260922.json。该脚本验证现存问题，不能作为修复通过的证明。

*.test.cjs为常规单元/集成测试；numerical-fixture.cjs为中性数值场景；creative/iteration/opening-preview-check.cjs为当前三组UI验证。其他*-check.cjs保留用于专项历史诊断，其运行条件需先看文件开头；installed-runtime-check.cjs依赖历史MVU构建中压缩函数名，不能冒充当前在线解析测试。

logs/reorganization-*.log为本轮目录整理证据，logs/history/保留旧日志。当前截图输出仍在build/verification子目录。
日志与样例包含具体人物/能力只为了复现，不属于模型常驻世界书。
