# deck 设计决策指南（AI 先读）

**本文档是 AI 生成 deck 的第一步**：在写任何 HTML 之前，按"场景 → 主题 → 叙事骨架 → 版式分配 → 特效强度"五步做出设计决策，再进入创作闭环。人类作者同样适用。

> 配套文件：主题库 `tools/gen-themes.mjs`（8 主题）· 版式库 `examples/layouts/`（13 版式，见 [LAYOUTS.md](LAYOUTS.md)）· 规范 [SPEC.md](SPEC.md)（v1.0-rc1）· 在线参考 https://mingqiaopeng.github.io/html4s/

---

## 0. 决策五步（总览）

| 步骤 | 决策 | 依据 |
|---|---|---|
| ① 场景分析 | 观众是谁 / 场合正式度 / 投影环境 / 内容类型 | 用户输入 |
| ② 选主题 | 8 主题选 1（§1 决策表） | 观众身份 + 场合正式度 |
| ③ 定叙事骨架 | 页面序列模板（§2 四种骨架） | 内容类型 + 时长 |
| ④ 分配版式 | 每页一个版式（§3 意图映射，13 选 N） | 每页的信息意图 |
| ⑤ 定特效强度 | 转场 2-3 种 + fx 开关（§5 强度分级） | 场合正式度（与主题联动） |

---

## 1. 主题决策表（8 选 1）

| 场景 | 主题 | 理由 |
|---|---|---|
| 政府汇报 / 党建 / 国企 | **党建红**（intro-partyred） | 米纸底红条带，庄重；衬线标题符合公文气质 |
| 学术报告 / 咨询提案 / 正式商务 | **瑞士克莱因蓝**（intro-swiss） | 国际主义网格，克制专业 |
| 科技产品发布 / 开发者分享 | **深色科技**（html4s-intro-fs） | 深底单色锚点，代码感 |
| 程序员受众 / 工具类产品 | **终端绿**（intro-terminal） | 等宽字体 + 提示符，受众自带认同 |
| 品牌 / 创意 / 时尚 | **电子杂志**（intro-magazine） | 衬线斜体大标题 + 高对比黄标 |
| 人文 / 文化 / 出版 | **水墨编辑**（intro-ink） | 暖纸 + 墨黑衬线 + 朱砂印 |
| 发布会 / 愿景宣言 / 年度大会 | **极光渐变**（intro-aurora） | 渐变底 + 霓虹感，气氛最重 |
| 投影偏亮的会议室 / 通用文档 | **晨雾浅色**（intro-light） | 浅底在亮环境对比度最高 |

**硬规则**：
- 政务/党建场合**禁用**深底主题（投影发灰）与炫技特效（fx 一律 none，转场 fade/curtain）
- 亮环境投影选浅色主题，暗环境（发布会/讲堂）选深色主题
- 一个 deck 只用一个主题；同一系列 deck 保持主题一致

---

## 2. 叙事骨架（页面序列模板）

页数规则：**8-15 页最佳**；每章 2-4 个内容页；超过 15 页必须拆 deck。四种骨架（版式名对应 §3）：

### 骨架 A · 产品/项目发布（Tech Launch）
```
cover → agenda → statement(为什么做) → versus(对比旧路线) → process(工作原理)
→ list(能力清单) → kpi(关键数据) → divider(章节) → media(界面/演示) → closing
```

### 骨架 B · 工作/政务汇报（Report）
```
cover → agenda → kpi(成绩) → timeline(历程) → twocol(两条线) → statement(问题与反思)
→ process(下一步计划) → divider → list(保障措施) → closing
```

### 骨架 C · 教学/培训（Teaching）
```
cover → agenda → statement(为什么学) → list(概念清单) → media(示例) → quote(原则)
→ process(步骤) → twocol(练习分组) → closing
```

### 骨架 D · 提案/论证（Proposal）
```
cover → agenda → versus(现状 vs 提案) → statement(核心主张) → kpi(预期收益)
→ timeline(里程碑) → process(实施路径) → quote(原则收束) → closing
```

**自适应规则**：骨架是起点不是枷锁——按真实内容增删页面，但**保持"封面→目录→章节→收束"的首尾结构**与"每章有分隔页"的节奏。

---

## 3. 版式分配（意图 → 版式速查）

完整目录见 [LAYOUTS.md](LAYOUTS.md)；按页面信息意图选：

| 页面意图 | 版式 |
|---|---|
| 开场 / 收束 | `cover` / `closing` |
| 章节转折 | `divider`（大编号分隔） |
| 列提纲 | `agenda` |
| 抛核心观点 / 大量文字 | `statement`（观点 44px + 三列支撑，**文字多的页面用它拆分，不要堆一页**） |
| 讲两条线 / 两个受众 | `twocol` |
| 方案优劣对比 | `versus`（胜方加 `is-win`） |
| 讲步骤 / 流程 / 闭环 | `process` |
| 讲历程 / 里程碑 | `timeline` |
| 摆数据 / 成绩 | `kpi`（≤4 个数字，多了拆两页） |
| 金句 / 原则 / 转折 | `quote` |
| 有图 / 截图 | `media`（占位块换 `<img>`） |
| 能力 / 卖点罗列 | `list` |

---

## 4. 内容密度规则（中文）

- 页标题 ≤ 12 字；要点行 ≤ 20 字；`statement` 引导句 ≤ 60 字
- 每页要点组 ≤ 3-4 个（`list`/`kpi` 网格上限 4-6 项）
- 大字（h1/h2）靠字号与字重分层，**不靠缩小正文**（正文 ≥24px、辅助 ≥22px、元数据 ≥18px——中文可读性适配层底线）
- 连续两页用同一版式可以，**连续三页禁止**（换版式或插 divider 调节奏）

---

## 5. 转场与特效强度（与主题联动）

| 强度 | 转场 | fx | 适用 |
|---|---|---|---|
| 零（庄重） | fade / curtain | none | 党建红、政务汇报 |
| 低 | fade / slide / wipe | none | 瑞士蓝、晨雾浅色、商务 |
| 中 | push / rise / unfold | dust | 电子杂志、终端绿 |
| 高 | zoomblur / cube / dissolve | stars | 深色科技、极光渐变 |

**硬规则**：一个 deck 转场 **2-3 种封顶**（全局 1 种 + 页级 1-2 个点缀）；礼花 confetti 只给收束页或表彰页；政务/庄重场合特效一律关闭。

---

## 6. 反模式清单

- ❌ 纯文字墙——超过 6 行的文字页拆成 `statement` + `list` 两页
- ❌ 转场炫技——每页不同转场 = 观众晕；特效永远服务于章节感
- ❌ 深底主题配亮环境投影 / 政务场合配霓虹色
- ❌ 一个 deck 混多个主题、混超过 3 种字体
- ❌ 数据页堆 8 个数字——kpi 上限 4 个，其余进附录
- ❌ 跳过 lint 直接交付——`h4s-lint → h4s-shot → h4s-build` 是硬闭环

---

## 7. 决策示例（worked examples）

### 例 1 · 输入："给国企做季度经营汇报，会议室投影，10 分钟"
→ 主题 **党建红**；骨架 **B**（10 页）；版式序列 `cover → agenda → kpi(营收/利润) → timeline(季度大事) → twocol(两条业务线) → statement(问题) → process(下季度计划) → list(保障) → divider → closing`；转场 fade（全局）+ curtain（章节分隔）；fx **none**；正文衬线，页标题 ≤12 字。

### 例 2 · 输入："开发者工具的发布会，礼堂大屏，15 分钟"
→ 主题 **深色科技**；骨架 **A**（12 页）；版式序列 `cover → agenda → statement(痛点) → versus(对比) → process(工作原理) → list(能力) → divider → media(演示截图) → kpi(性能数据) → timeline(路线图) → quote → closing`；转场 fade 全局 + zoomblur（封面/收束）；fx **stars**；`statement` 页放痛点大字。

---

## 8. 与工具链的接线

1. 主题落地：用 `tools/gen-themes.mjs` 的变量/装饰体系（或对应技能模板）确定 deck 的 CSS 层
2. 版式落地：从 `examples/layouts/<id>.html` 复制片段（只换文字数据，结构/class 不动），deck 引入 `layouts.css`
3. 内容落笔：遵守 §4 密度规则；`media` 占位换真实图片
4. 质量闭环：`h4s-lint → h4s-shot → h4s-build --subset --share`
5. 交付：`.html4s` 双击即演 + `.share.html` 浏览器直开副本

**脚手架（0.4.0）**：五步决策可直接交给命令——

```bash
node tools/gen-deck.mjs --theme partyred --title "季度经营汇报" --outline outline.md
```

主题 + 骨架 + 版式 + 主题配色全部内建，AI 只需把内容写进大纲（`## 章节`/`- 要点`/`> 金句`/` ```chart 数据``` `/段落）。MCP 工具 `h4s_scaffold` 同能力。

---

*变更：v1（2026-11-21）— 首版：五步决策 / 8 主题矩阵 / 4 骨架 / 版式映射 / 密度与特效规则 / 双决策示例。*
