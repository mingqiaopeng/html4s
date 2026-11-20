# html4s 版式模板库 · 生成指南

42 种典型页面版式（对标常见 deck 设计软件的内置版式），由 `tools/gen-layouts.mjs` 单一事实源生成。**主题 × 版式正交**：版式只用 CSS 变量（与[主题库](LAYOUTS.md)同一套变量），粘进任何主题 deck 自动适配配色。

> **决策前置**：生成 deck 前先读 [DECK-DESIGN.md](DECK-DESIGN.md)——"场景 → 主题 → 叙事骨架 → 版式分配 → 特效强度"五步决策；本文档只负责版式层。

## 版式目录

| # | 片段 | 版式 | 适用场景 |
|---|---|---|---|
| 01 | [`cover`](../examples/layouts/cover.html) | 封面 | 开场定调：产品名 / 一句话价值 / 日期作者 |
| 02 | [`agenda`](../examples/layouts/agenda.html) | 目录 | 议程页：章节编号 + 标题 + 一句话导读 |
| 03 | [`divider`](../examples/layouts/divider.html) | 章节页 | 章节分隔：大编号 + 章节名 + 引导语 |
| 04 | [`statement`](../examples/layouts/statement.html) | 大字观点 | 大量文字页：一句核心观点 + 三列支撑段落 |
| 05 | [`twocol`](../examples/layouts/twocol.html) | 双栏对照 | 左右分栏：两条线 / 两类受众 / 方案分解 |
| 06 | [`versus`](../examples/layouts/versus.html) | 对比图 | A/B 对比：优劣并置，胜方高亮 |
| 07 | [`process`](../examples/layouts/process.html) | 流程图 | 横向流程：步骤编号 + 名称 + 一行说明 |
| 08 | [`timeline`](../examples/layouts/timeline.html) | 时间线 | 里程碑：节点圆点 + 时间 + 事件 |
| 09 | [`kpi`](../examples/layouts/kpi.html) | 数据看板 | 关键指标：2×2 大数字网格 |
| 10 | [`quote`](../examples/layouts/quote.html) | 引用页 | 金句 / 原则 / 用户证言 |
| 11 | [`media`](../examples/layouts/media.html) | 图文页 | 左图右文：把占位块换成 <img> |
| 12 | [`list`](../examples/layouts/list.html) | 要点清单 | 图标 + 标题 + 说明行（data-h4s-icon 声明式图标） |
| 13 | [`checklist`](../examples/layouts/checklist.html) | 对勾清单 | 完成项 / 检查表：对勾图标 + 陈述 |
| 14 | [`closing`](../examples/layouts/closing.html) | 收束页 | 收束 + 行动号召（居中构图） |
| 15 | [`chart`](../examples/layouts/chart.html) | 图表页 | 数据可视化：声明式 h4s-chart（AI 写数据不写图） |
| 16 | [`quadrant`](../examples/layouts/quadrant.html) | 四象限 | 定位 / 优先级：两轴四格 |
| 17 | [`hierarchy`](../examples/layouts/hierarchy.html) | 层级架构 | 组织 / 递进：顶层 + 子节点 |
| 18 | [`table`](../examples/layouts/table.html) | 表格页 | 结构化数据：表头 + 数据行 |
| 19 | [`dual`](../examples/layouts/dual.html) | 双图并置 | 两张图 / 两种形态并排比较 |
| 20 | [`appendix`](../examples/layouts/appendix.html) | 附录页 | 备查数据 / 详细表格（正文讲完再翻） |
| 21 | [`subtitle`](../examples/layouts/subtitle.html) | 副标题页 | 主标题 + 副标题分层定调（比封面信息多一层） |
| 22 | [`transitional`](../examples/layouts/transitional.html) | 过渡问句 | 章节间抛出问题，制造悬念 |
| 23 | [`threecol`](../examples/layouts/threecol.html) | 三列卡片 | 三个并列要点（特性/路线/支柱） |
| 24 | [`dense-text`](../examples/layouts/dense-text.html) | 密集文字页 | 长文阅读页：多段正文（法规/方案原文等） |
| 25 | [`definition`](../examples/layouts/definition.html) | 定义页 | 术语解释：词头 + 释义 + 注解 |
| 26 | [`faq`](../examples/layouts/faq.html) | 问答页 | 常见问题：Q/A 成对排版 |
| 27 | [`kpi-row`](../examples/layouts/kpi-row.html) | 横向数据条 | 4-6 个关键数字横排（一屏扫完） |
| 28 | [`progress`](../examples/layouts/progress.html) | 进度页 | 完成度/达成率：进度条组 |
| 29 | [`stats-compare`](../examples/layouts/stats-compare.html) | 数据对比 | 两组大数字对照（前后/内外/目标实际） |
| 30 | [`cycle`](../examples/layouts/cycle.html) | 循环图 | 闭环流程：四步循环回到起点 |
| 31 | [`pyramid`](../examples/layouts/pyramid.html) | 金字塔 | 层级递进：战略/需求/组织的分层 |
| 32 | [`venn`](../examples/layouts/venn.html) | 交集图 | 两域交叉：各自特点 + 交集价值 |
| 33 | [`swot`](../examples/layouts/swot.html) | SWOT 四格 | 优势/劣势/机会/威胁四格分析 |
| 34 | [`gallery`](../examples/layouts/gallery.html) | 图集 | 2×2 图片网格（作品/界面/场景） |
| 35 | [`fullbleed`](../examples/layouts/fullbleed.html) | 全幅图 | 整页大图 + 角注（氛围页/封面底图） |
| 36 | [`video-page`](../examples/layouts/video-page.html) | 视频页 | 视频展示：内嵌音频视频策略见构建报告 |
| 37 | [`team`](../examples/layouts/team.html) | 团队页 | 成员卡片：头像首字 + 姓名 + 角色 |
| 38 | [`profile`](../examples/layouts/profile.html) | 人物页 | 单人介绍：头像 + 定位 + 履历要点 |
| 39 | [`testimonial`](../examples/layouts/testimonial.html) | 证言页 | 用户证言 2-3 条（ credibility ） |
| 40 | [`schedule`](../examples/layouts/schedule.html) | 日程页 | 时间 + 事项 + 时长的会议议程 |
| 41 | [`roadmap`](../examples/layouts/roadmap.html) | 路线图 | 三阶段横向推进（现在/中期/远期） |
| 42 | [`contact`](../examples/layouts/contact.html) | 联系页 | 联系方式 + 入口（图标引擎） |

在线预览：**https://mingqiaopeng.github.io/html4s/decks/layouts.html**（版式图鉴 deck，每页右下角标注片段文件名）。

## 图标引擎

要点/清单类版式使用内置图标引擎：`<i data-h4s-icon="名称"></i>`——46 枚 24×24 stroke 图标（check / zap / layers / download / globe / trending-up / rocket…），颜色随 currentColor、尺寸随 font-size，零依赖（替代全量图标库）。可用名称与 deck 校验：`node tools/icon-list.mjs` / `--check <deck>`。

## 使用三步（人类 / AI Agent 通用）

1. **选版式**：按页面意图从目录表选择（对比 → `versus`；步骤 → `process`；议程 → `agenda`…）
2. **复制填充**：把 `examples/layouts/<id>.html` 片段粘进你的 deck（`<h4s-deck>` 内），替换样例文案——保持 class 与结构不动，只改文字/数据
3. **引入样式**：确保 deck 引入 `examples/layouts/layouts.css`（整文件引入，或按需拷贝该版式的规则）；随后 `h4s-lint` → `h4s-shot` → `h4s-build` 走标准闭环

## 主题适配

版式只用以下变量（与 `tools/gen-themes.mjs` 主题库一致）：

| 变量 | 用途 |
|---|---|
| `--bg` / `--tx` / `--tx2` | 页面底色 / 主文字 / 次级文字 |
| `--ac` / `--bad` | 强调色（编号/边框/图标）/ 风险色 |
| `--dim` / `--bd` / `--bd2` | 弱化文字 / 主边框 / 次边框 |
| `--font` | 字体栈 |

把版式片段粘进 `gen-themes.mjs` 生成的主题 deck（或任何定义了这些变量的 deck）即自动换肤——**同一个版式在不同主题下呈现完全不同的气质**。

## AI 生成指南（Agent 工作流）

- 生成 deck 前先读本文件选版式；一页一个版式，不要混叠多个版式的结构
- 保持片段的 **DOM 结构与 class 不动**（版式的几何与响应式全靠它们），只替换文本、数字、图片
- 图片页（`media`）的占位块替换为 `<img src="…">`，并给图配 `data-h4s-title`
- 替换文案后必须走 `h4s-lint → h4s-shot → h4s-build` 闭环（大量文字页优先检查 `statement` 溢出）
- 页面右下角 `ly-tag` 标注了片段来源，正式交付时可删除该行

## 变更

- 版式由 `tools/gen-layouts.mjs` 生成——**改版式请改生成器再重新生成**，勿直接手改产物
- v1.1（2026-11-21）：版式 13→20（+图表页/四象限/层级架构/表格页/双图并置/对勾清单/附录页）；要点清单改用图标引擎；新增图标引擎章节
- v1（2026-11-21）：13 版式首发
