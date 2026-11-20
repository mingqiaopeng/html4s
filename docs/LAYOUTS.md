# html4s 版式模板库 · 生成指南

13 种典型页面版式（对标常见 deck 设计软件的内置版式），由 `tools/gen-layouts.mjs` 单一事实源生成。**主题 × 版式正交**：版式只用 CSS 变量（与主题库同一套变量），粘进任何主题 deck 自动适配配色。

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
| 12 | [`list`](../examples/layouts/list.html) | 要点清单 | 图标 + 标题 + 说明行的能力清单 |
| 13 | [`closing`](../examples/layouts/closing.html) | 收束页 | 收束 + 行动号召（居中构图） |

在线预览：**https://mingqiaopeng.github.io/html4s/decks/layouts.html**（版式图鉴 deck，每页右下角标注片段文件名）。

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
- v1（2026-11-21）：13 版式首发
