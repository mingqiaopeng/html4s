# html4s 架构设计与路线图

> **HyperText Markup Language For Slides**（演示文稿超文本标记语言）
>
> 版本 v0.1（设计评审稿）· 日期 2026-11-10 · 状态：待评审
>
> 一句话定位：**pptx 的操作习惯 × HTML 的表达力 × 纯文本的 AI 友好度** —— 用"一个合法 HTML 文件 + 一个播放器"替代"二进制 OOXML + 办公软件"。

---

## 目录

1. [背景与问题定义](#1-背景与问题定义)
2. [核心设计决策（ADR）](#2-核心设计决策adr)
3. [格式规范 v0.1](#3-格式规范-v01)
4. [播放器架构](#4-播放器架构)
5. [工具链与 AI 创作工作流](#5-工具链与-ai-创作工作流)
6. [互操作与导出](#6-互操作与导出)
7. [质量与测试策略](#7-质量与测试策略)
8. [安全与信任模型](#8-安全与信任模型)
9. [路线图](#9-路线图)
10. [风险登记册](#10-风险登记册)
11. [附录](#11-附录)

---

## 1. 背景与问题定义

### 1.1 现状：两条路线，各有硬伤

AI 制作演示文稿目前只有两条主路线，痛点互补：

| 维度 | 路线 A：AI → pptx/OOXML | 路线 B：AI → HTML 演示（reveal.js / Slidev / Marp） |
|---|---|---|
| AI 可控性 | 差：二进制 ZIP 包 + 强布局引擎（autofit 不可预测），坐标手工计算，易产出"文字溢出/错位" | 好：纯文本、声明式，AI 训练语料里 CSS/HTML 极充足 |
| 工具生态 | MCP/脚本工具链（python-pptx 等）笨重，无所见即所得反馈闭环 | 无需专用工具即可生成，但缺"生成→预览→自检"闭环 |
| 视觉表达 | 受模板限制，表达力弱 | 强：CSS 全能力（任意排版、动画、图表、代码高亮） |
| 演播能力 | 成熟：演讲者视图、计时、黑屏、翻页笔、导出 PDF | 粗糙：比例控制靠框架 scaling、备注/计时/总览靠插件或没有、无双击打开习惯、字体内嵌各自为政 |
| 分发 | 单文件，通用 | "一个工程"而非"一个文件"，分享困难 |
| 版本控制 | 二进制，diff 不友好 | 文本，友好 |

**结论**：视觉表达与 AI 可控性上 HTML 路线全面占优，输在"演播最后一公里"——问题不在 HTML 本身，而在于**没有一份标准化的演示语义层 + 没有一个专职播放器**。html4s 就是补上这两块。

### 1.2 定位

html4s 不是又一个 reveal.js 分叉，而是三层分离的体系：

```
┌──────────────────────────────────────────────┐
│ ① 格式规范（Format Spec）                     │
│    .html4s = 合法 HTML + 内嵌演示语义（元素/属性） │
│    + 一段机器可读清单（JSON）                  │
├──────────────────────────────────────────────┤
│ ② 播放器（Player）                            │
│    Web 运行时（可内嵌进文件）+ 桌面壳（双击关联）│
│    操作习惯对齐 PowerPoint                    │
├──────────────────────────────────────────────┤
│ ③ 工具链（Toolchain）                         │
│    CLI（build/lint/shot/export）+ 编辑器插件   │
│    + MCP server —— 专为 AI 创作闭环设计        │
└──────────────────────────────────────────────┘
```

关键关系：**deck 文件面向"格式"创作，而不是面向"框架"创作**。运行时可整体替换（自研 / 未来第三方），deck 不绑定任何 JS API。这是与 reveal.js 类框架最本质的区别，也是格式能长期存活的前提。

### 1.3 设计目标

- **G1 一个文件**：分发形态是单个 `.html4s` 文件（字节上就是 HTML），双击即演；浏览器直接打开也能播（内嵌运行时）。
- **G2 AI-first**：纯文本、声明式、可 lint、可截图自检；不要求构建步骤即可播放；AI 一轮对话产出的文件直接可用。
- **G3 演播习惯对齐 PowerPoint**：演讲者视图、计时/排练、黑屏/白屏、总览跳页、翻页笔、kiosk 自动播放，全部一等公民。
- **G4 精确比例**：固定舞台（stage）坐标系 + 等比缩放，任意窗口/投影尺寸下版式不漂移；支持混合页面比例。
- **G5 字体内嵌**：声明式清单 + 构建期自动子集化，中文 deck 单文件可控；无网环境字体不缺字。
- **G6 无 JS 优雅降级**：不开 JS 时文件仍是可滚动、可打印、可检索的普通网页（文档模式）。
- **G7 导出一等公民**：矢量 PDF（含备注版）、逐页 PNG、单文件 HTML；PPTX 兼容导出为辅助。
- **G8 版本控制友好**：文本可 diff；同一文件既是"源码"也是"成品"，无生成物与源的双份真理。
- **G9 播放器只是渲染器**：不锁定编辑方式（文本编辑器 / AI / 未来 GUI 编辑器皆可）。

### 1.4 非目标（明确不做，避免范围蔓延）

- ✗ 近期不做 WYSIWYG 编辑器（远期可做，播放器只读是 v1 边界）。
- ✗ 不做云协作/多人实时编辑（远期）。
- ✗ 不承诺跨浏览器引擎像素级一致（承诺 Chromium 系一致；其余引擎优雅降级，见 §6.4）。
- ✗ 不做 DRM / 加密分发。
- ✗ 不是通用网页框架，不为非演示场景做兼容。

---

## 2. 核心设计决策（ADR）

每条决策记录：决策 → 理由 → 被否备选 → 后果。

### D1 格式本体 = 合法 HTML 单文件

- **决策**：`.html4s` 文件的字节就是一份合法 HTML5 文档。不引入 ZIP 容器、不引入私有二进制。
- **理由**：① AI 直接写、人直接 diff/版本控制；② 浏览器是天然兜底渲染器（文档模式）；③ 生态工具（编辑器、爬虫、无障碍工具）零成本继承。
- **被否备选**：ZIP 包（类 OOXML）——破坏"一个纯文本文件"的故事，且浏览器无法直接打开。
- **后果**：超大媒体（视频）不能真正内嵌；用相对路径外链资产解决（见 D8 的打包规则）。

### D2 语义扩展：结构用自定义元素，行为用 data-* 属性

- **决策**：
  - 结构性概念用保留前缀的自定义元素：`<h4s-deck>`、`<h4s-slide>`、`<h4s-notes>`；
  - 行为性标记用属性附着在任意元素上：`data-h4s-frag`（碎片/分步显示）、`data-h4s-autoslide` 等，**不改变 DOM 结构**；
  - 机器元数据用一段 `<script type="application/h4s+json">` 清单（见 D3）。
- **理由**：自定义元素天然命名空间化且是合法 HTML；属性方式不侵入作者布局（包一层 wrapper 会破坏 flex/grid 布局），无 JS 时也不产生多余盒子。
- **被否备选**：侧车 XML（`.html4s.meta.json`）作为主载体——会产生"两份真理"不同步的问题，且浏览器预览失效。侧车仅保留给**机器单向输出**（排练计时导出、lint 报告）。
- **后果**：运行时通过自定义元素注册（Web Components）自然挂载，升级运行时不改文档。

### D3 机器可读清单内嵌于 `<script type="application/h4s+json">`

- **决策**：舞台尺寸、默认转场、字体声明、排练计时等"机器元数据"以 JSON 内嵌在文档 `<head>`；字段宽容（读方必须忽略未知字段）。
- **理由**：HTML 里嵌 JSON 是成熟做法（`ld+json` 先例）；单文件原则下无侧车；JSON Schema 可校验、可被 AI 精确生成。
- **后果**：见 §3.2 完整 schema 草案。

### D4 视口模型 = 固定舞台 + 等比缩放（contain），支持逐页覆盖

- **决策**：deck 声明逻辑舞台分辨率（默认 1920×1080）；播放器计算 `scale = min(vw/W, vh/H)` 对舞台整体 `transform: scale()` 居中 Letterbox；`fit: cover` 可选裁切；单页可用 `data-h4s-stage="1024x768"` 覆盖（混合比例逐页 Letterbox）。
- **理由**：这是唯一能同时满足"精确比例 + 任意屏幕 + 文本可选中/可检索"的方案（canvas/位图方案牺牲 G6）。PowerPoint 的等比缩放心智模型直接迁移。
- **后果**：作者应使用舞台相对坐标（px）；提供 `--h4s-scale` CSS 变量应对个别需要。

### D5 运行时双形态：内嵌 Web 运行时 + 桌面薄壳

- **决策**：
  - **形态 A（Web）**：构建时把运行时（`h4s-core`，目标 min+gzip ≤ 80KB）内嵌进 deck，任何浏览器打开即播；
  - **形态 B（桌面）**：壳软件注册 `.html4s` 文件关联，双击→专用窗口；提供真正的双窗口演讲者视图、排练计时写回文件、kiosk、更新器。**Windows 实现为 .NET + WebView2**（2026-11-10 P0 已跑通：现代 Chromium 内核系统自带、无需 Rust 工具链、可发布单 exe；用 `SetVirtualHostNameToFolderMapping` 把本地 deck 映射为 http 原源，解决 file:// 跨窗口广播与字体加载）；mac 后续走 Tauri。
- **理由**：Web 形态保证分享/AI 预览零门槛；桌面形态保证"双击即演 + 双屏"的 PowerPoint 级体验。两者复用同一核心，不产生两套逻辑。
- **被否备选**：Electron——体积大（~100MB+ vs 壳 ~1MB）；Rust/Tauri 需引入完整 Rust 工具链，Windows 上 WebView2 运行时系统自带且必然为 Chromium，.NET 壳零额外内核分发。
- **后果**：macOS 上 Tauri 用 WKWebView（Safari 内核），渲染差异风险见 §10 R1。

### D6 演讲者视图 = 双窗口 + 状态总线

- **决策**：舞台窗与演讲者窗各自加载同一 deck（各自一套 DOM），通过 `BroadcastChannel('h4s:<deckId>')` 同步：舞台窗持有状态真值，广播 `state`；演讲者窗发送 `cmd`。桌面壳下两窗由壳管理并自动分配到副屏。
- **理由**：双 DOM 复制比单 DOM 跨窗口搬移节点简单可靠一个数量级；deck 体积小，内存代价可接受；BroadcastChannel 在同源双窗下延迟 <5ms。
- **被否备选**：WebRTC/multiplex（reveal 做法）——为跨机器设计，本机场景过重；localStorage 事件仅作降级通道。
- **后果**：单显示器场景提供"演讲者抽屉"覆盖层（练习模式）。

### D7 字体 = 声明式清单 + 构建期子集内嵌

- **决策**：清单 `fonts[]` 声明家族与文件；`h4s build` 扫描全文用到的码点 → `pyftsubset` 子集化 → woff2 → base64 内嵌为 data URL；构建时读取字体 `fsType` 嵌入许可位，不可嵌入字体报错。
- **理由**：中文全量字体 5–20MB 不可接受，子集后典型 0.5–2MB；声明式让 AI 只写清单，脏活交给工具。
- **后果**：发布单文件前必须跑 build（或由桌面播放器对未 build 的 deck 给出"字体未内嵌"提示并走本地字体缓存）。

### D8 时间轴 = 声明式 + 排练录制回写

- **决策**：
  - 声明层：每页 `data-h4s-autoslide="30"`（秒）、碎片 `data-h4s-frag-delay`、全局 `defaults.loop/autoslide`；
  - 录制层：播放器"排练模式"记录每页停留时长与碎片节奏，停止后可写回清单 `timings`（桌面壳直接改文件；Web 运行时导出 `.html4s.timings.json` 侧车或用 File System Access 写回）；
  - kiosk/自动播放 = 按声明时长自动推进（碎片按 delay 自动出现）。
- **理由**：声明式保证 AI/文本可写；录制保证"人肉校准"的 practiced timing 能沉淀回文本（pptx 排练计时对等物）。
- **后果**：`timings` 是建议值，播放时可全局关闭。

### D9 导出以矢量 PDF 为一等公民

- **决策**：CLI/桌面壳内置导出：用 pinned Chromium（Playwright）逐页渲染 `page.pdf({ width:'20in', height:'11.25in', printBackground:true })`（1920×1080 @96dpi 的物理映射），文本保持矢量可选中，Chromium 自动内嵌字体子集；`--notes` 产出"页 + 备注"版。浏览器内 Ctrl+P 走 deck 自带 `@media print` 样式作为兜底（近似）。
- **理由**：PDF 是演示分发的事实终点（打印、审阅、存档）；headless 管线是唯一能同时保证"比例精确 + 字体嵌入 + 备注"的方式。
- **被否备选**：依赖用户浏览器打印对话框——页边距/页眉页脚不可控，放弃作为主路径。

### D10 质量门 + AI 自检闭环是产品能力，不是附加品

- **决策**：`h4s lint` 包含**舞台溢出检测**（headless 加载后逐元素 bounding box 越界判定）、豆腐块（tofu）字形检测、最小字号/对比度/备注缺失等规则（§5.3）；`h4s shot` 逐页截图；MCP server 把 validate/shot/outline 暴露给 AI，形成 **生成 → lint → 截图 → 视觉自审 → 修复** 闭环。
- **理由**：AI 产 deck 的最大失败模式是"溢出/截断看不见"；把这个检查工具化，AI 路线的质量就能系统性超过 pptx 路线。
- **后果**：lint 规则集与截图协议成为规范的一部分，需配套金标准语料做回归（§7）。

---

## 3. 格式规范 v0.1

### 3.1 规范分层（能力分级）

分级的目的：AI 可以按需升档，简单 deck 用 L0–L1 就能交付；读方（播放器）必须对低于自身等级的一切保持宽容。

| 层级 | 名称 | 内容 | 典型来源 |
|---|---|---|---|
| L0 | 纯 HTML 约定 | 无清单、无专属元素，仅按"多个全屏 section"惯例排列；浏览器文档模式浏览 | 快速草稿 |
| L1 | Core | 清单 + `h4s-deck/slide/notes` + 舞台模型 + 主题声明 | 日常 95% 场景 |
| L2 | Timing | 碎片、autoslide、转场、排练计时回写 | 正式演讲 |
| L3 | Package | 字体/资产声明、单文件内嵌规则、构建产物约定 | 分发 |
| L4 | Interactive | 允许页面自带 JS（图表/ECharts/iframe 嵌入）、`h4s:*` 事件约定、kiosk 沙箱 | 数据大屏、互动演示 |

### 3.2 文档解剖（完整示例见 `examples/hello.h4s.html`）

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>季度业务回顾</title>

  <!-- H4S 清单：机器元数据（L1）。读方必须忽略未知字段 -->
  <script type="application/h4s+json">
  {
    "h4s": "1.0",
    "id": "可选，用于同步总线与排练数据关联",
    "meta": { "title": "季度业务回顾", "author": "…", "lang": "zh-CN" },
    "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "#000" },
    "defaults": {
      "transition": { "name": "fade", "duration": 300 },
      "fragment": { "effect": "fade-up", "delay": 150 },
      "autoslide": 0, "loop": false, "progress": true, "slideNumber": true
    },
    "fonts": [
      { "family": "MiSans", "src": "assets/MiSans-subset.woff2", "weight": 400 }
    ],
    "timings": { "recorded": "2026-11-10T10:00:00Z",
                 "slides": [ { "index": 0, "seconds": 42.3, "fragOffsets": [8.1, 15.0] } ] }
  }
  </script>

  <!-- 文档模式兜底样式（无 JS 时文件仍是可读网页）。
       播放器激活后会注入等价样式并接管布局，作者无需手写以下内容 -->
  <style> /* …h4s-doc 兜底… */ </style>
</head>
<body>
  <h4s-deck>
    <h4s-slide id="cover" data-h4s-title="封面" data-h4s-transition="zoom" data-h4s-autoslide="15">
      <h1>季度业务回顾</h1>
      <p>2026 Q3 · 战略与增长</p>
      <h4s-notes hidden>
        <p>开场 30 秒：先给结论——增长 23%，两句话讲清楚为什么。</p>
      </h4s-notes>
    </h4s-slide>

    <h4s-slide id="s2" data-h4s-title="三个亮点" data-h4s-layout="bullets">
      <h2>三个亮点</h2>
      <ul>
        <li data-h4s-frag>营收 +23% …</li>
        <li data-h4s-frag>新客户 1,240 家…</li>
        <li data-h4s-frag data-h4s-frag-delay="800">NPS 提升 12 分…</li>
      </ul>
      <h4s-notes hidden><p>逐条展开，每条配一个真实客户故事。</p></h4s-notes>
    </h4s-slide>
  </h4s-deck>

  <!-- 运行时：构建时内嵌（单文件分发）；开发期可为相对路径 -->
  <script src="./h4s.player.js"></script>
</body>
</html>
```

### 3.3 清单 Schema（v0.1 草案，字段表）

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `h4s` | string | ✓ | 格式版本，如 `"1.0"`。主版本不识别→文档模式+提示；次版本忽略未知字段继续 |
| `id` | string | – | deck 稳定标识（uuid v7 建议）。缺省由 title+页数+首页文本哈希派生 |
| `meta` | object | – | `title / subtitle / author / company / lang / created / modified` |
| `stage` | object | ✓* | `width`(默认1920) `height`(默认1080) `fit: contain\|cover` `background`（Letterbox 色） |
| `defaults.transition` | object | – | `name / duration(ms) / easing`，可被每页覆盖 |
| `defaults.fragment` | object | – | `effect / delay(ms)`，碎片全局默认 |
| `defaults.autoslide` | number | – | 全局每页秒数，0=关闭；`data-h4s-autoslide` 逐页覆盖 |
| `defaults.loop / progress / slideNumber` | bool | – | kiosk 循环 / 进度条 / 页码显示 |
| `fonts[]` | array | – | `{ family, src, weight, style, subset?, license? }`；L3：build 后 `src` 变为内嵌 data URL |
| `timings` | object | – | 排练录制结果（D8），播放器可选用 |
| `overrides.slides[]` | array | – | 按页覆盖 `stage / transition / autoslide`（等价于逐页属性，二选一即可） |
| `capabilities` | object | – | `{ script: true, network: false }`：L4 声明页内脚本/外网访问意向，kiosk 沙箱据此收紧 |

\* 无 `stage` 时按 L0 处理（文档模式或默认 1280×720）。

### 3.4 元素与属性参考

| 名称 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `<h4s-deck>` | 元素 | ✓ | 页容器，body 内至多一个 |
| `<h4s-slide>` | 元素 | ✓ | 单页。属性：`id`、`data-h4s-title`（缺省取页内首个 h1/h2 文本）、`data-h4s-stage`（如 `"1024x768"`，混合比例）、`data-h4s-transition`、`data-h4s-autoslide`、`data-h4s-bg`、`data-h4s-layout`（主题布局类，见 3.8） |
| `<h4s-notes hidden>` | 元素 | – | 演讲者备注（富文本）。`hidden` 保证文档模式与浏览器原生渲染下不可见，演讲者窗中由播放器展开渲染 |
| `data-h4s-frag` | 属性 | – | 碎片标记，值为效果名（`fade-up / fade / slide-left / zoom / none`），可空取全局默认 |
| `data-h4s-frag-order` | 属性 | – | 碎片顺序，缺省按文档顺序 |
| `data-h4s-frag-delay` | 属性 | – | 自动模式下距上一碎片的毫秒数 |
| `data-h4s-media` | 属性 | – | 媒体行为：`autoplay`（进入本页自动播）、播放器保证**离开页面即暂停**所有媒体 |

### 3.5 碎片（Fragments，L2）

- 状态机：每页碎片序列 `f = -1 … n-1`；`next()` 在碎片段内推进，耗尽后翻页；非线性跳页（总览点击、数字跳转）直接呈现**最终碎片状态**（对齐 PowerPoint 习惯）。
- 碎片元素获得类：`.is-frag-visible / .is-frag-entering / .is-frag-hidden`（前两者由 WAAPI 驱动入场，随后持久化）。
- **文档模式与打印下碎片全部可见**（隐藏只在播放器激活后生效）——保证打印/无障碍语义完整。

### 3.6 转场（Transitions，L2）

- 内置集（WAAPI 实现，播放器负责，不由作者 CSS 承担）：`none / fade / slide / push / wipe / zoom / flip / cube`；`duration`、`easing` 可配；尊重 `prefers-reduced-motion`（自动退化为淡入或直切）。
- 转场期间输入进入排队（防止连按丢帧）；转场在引擎内是**确定性的**（同一输入序列 → 同一视觉序列），便于截图回归。

### 3.7 备注与大纲

- 备注 = `<h4s-notes hidden>` 内的富文本；大纲 = 各页 `data-h4s-title`（缺省首个标题元素）。
- 大纲用于：总览/大纲视图、PDF 书签、无障碍导航树、AI 生成后的结构审查。

### 3.8 主题与布局库（stdlib，可选项但强烈建议）

- 主题 = 纯 CSS + 一份 `theme.json`（设计令牌：色板/字号阶梯/间距/栅格），清单 `"theme": "corporate-2026"` 引用；**主题不引入 JS**。
- 内置布局类（AI 生成的主力路径，保证一致质量）：`ly-title / ly-section / ly-bullets / ly-two-col / ly-image-right / ly-quote / ly-code / ly-data / ly-end`。
- 布局类只是约定 CSS 类，作者完全可以脱离主题手写 CSS（表达力不设上限，lint 负责兜底质量）。

### 3.9 无障碍与文档模式（G6）

- 无 JS：文件是普通网页——页面纵向排列、备注隐藏、可全文检索、可 Ctrl+P 兜底打印（`@media print` 由播放器构建注入，作者零成本）。
- 每页一个地标标题、图片 alt、视频字幕轨约定（`<track kind="captions">`）纳入 lint 提示。
- 播放器 UI（总览/工具条）全部可键盘到达并带 aria 标注。

### 3.10 版本化与向前兼容策略

- 读方宽容原则：未知清单字段、未知元素/属性一律忽略（当作普通内容渲染），不报错。
- 能力协商：`H4S.supported` 与清单 `h4s` 版本比对；主版本不匹配 → 文档模式 + 可见提示条。
- 规范演进通过"层级"进行：新能力进新层级或新次版本，L1 冻结后极难破坏性变更（v1.0 前唯一窗口）。

---

## 4. 播放器架构

### 4.1 总体分层

```
┌──────────────────────────────────────────────────────────────┐
│ 形态层（同一核心，两种宿主）                                    │
│   A. 浏览器：内嵌运行时的 .html4s 文件                             │
│   B. 桌面壳（.NET+WebView2，Windows）：文件关联/双窗/文件写回/更新器              │
├──────────────────────────────────────────────────────────────┤
│ h4s-core（运行时核心，引擎无关纯 JS）                           │
│   清单解析器 · 导航状态机 · 缩放器 · 转场引擎(WAAPI)            │
│   碎片控制器 · 计时器/排练记录器 · 媒体管理 · 主题注入           │
├──────────────────────────────────────────────────────────────┤
│ 服务层                                                        │
│   状态总线(BroadcastChannel，localStorage 降级) · 偏好存储      │
│   字体加载器(document.fonts + 就绪门控) · 事件(h4s:*) · i18n   │
├──────────────────────────────────────────────────────────────┤
│ UI 组件层                                                     │
│   舞台视图 · 演讲者视图 · 总览网格 · 悬浮工具条 · 帮助层         │
├──────────────────────────────────────────────────────────────┤
│ 平台适配层                                                    │
│   全屏 API · 窗口管理(.NET+WebView2) · 文件读写 · 打印/导出 · 外设       │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 运行时核心

**导航状态机**（真值仅存在于舞台窗）：

```
state := { i: 页索引, f: 碎片索引(-1 起), overlay: none|black|white|overview|help,
           mode: manual|kiosk|rehearse, transitionLock: bool }
next():  f < n-1 ? f++ : goto(i+1, f=-1, 线性)
prev():  f > -1 ? f-- : goto(i-1, f=末碎片)          // 与 PowerPoint 逐退一致
jump(i): goto(i, f=末碎片)                            // 非线性跳页=最终状态
约束: transitionLock 期间输入排队; overlay 优先于一切导航
```

**缩放器**：`resize → scale=min(vw/W, vh/H)`，舞台 `transform: scale(s)` 居中；对外暴露 `--h4s-scale`。`fit:cover` 时取 max 并裁切。逐页覆盖舞台尺寸时按页重算（Letterbox 条随页变化，转场做 crossfade）。

**转场引擎**：新旧两页舞台短暂并存（绝对定位），`element.animate()` 双向关键帧；结束移除旧节点；`transitionend` + 超时兜底。

**字体就绪门控**：开演前 `document.fonts.load(声明面)` + `fonts.ready`，超时 3s 带降级提示开演——杜绝演示中途字体跳变（FOUT）。

**事件**（供页内脚本与插件）：`h4s:ready`、`h4s:slidechange {index,id,title}`、`h4s:fragchange {index,frag,total}`、`h4s:overlay {name}`。

**深链**：URL hash 路由 `#/3/1`（页/碎片）、`#kiosk`、`#present`——分享链接与排练恢复的基础。

### 4.3 状态总线协议（D6）

| 消息 | 方向 | 载荷 |
|---|---|---|
| `hello` / `bye` | 双向 | 窗口角色声明（stage/presenter）、心跳 |
| `state` | stage → all | `{i, f, overlay, mode, ts}`（真值广播，频率限流至变化时） |
| `cmd` | presenter → stage | `{action: next/prev/jump/black/white/overview/rehearse…}` |
| `request-sync` | 任意 | 新窗口加入后请求全量状态 |

- 主从仲裁：最早存在的 stage 窗为真值窗；演讲者窗崩溃重开自动 `request-sync`。
- 桌面壳额外通道（IPC）：显示器枚举、文件写回、打印——Web 形态下不可用的能力全部收口在此层，核心不感知宿主。

### 4.4 演讲者视图（功能规格）

```
┌───────────────────────────────┬──────────────────────┐
│ 当前页实时渲染                  │ 下一页/下一碎片预览     │
│ （含当前碎片状态）              │ （下一状态渲染）        │
│───────────────────────────────│──────────────────────│
│ 备注（字号可调、可滚动）        │ 计时器：本页停留/总时长 │
│                               │ 系统时钟 · 页码 12/48  │
│                               │ 自动播放倒计时环       │
│───────────────────────────────┴──────────────────────│
│ 工具条: 黑屏 白屏 总览 激光 排练 全屏 翻页按钮            │
└───────────────────────────────────────────────────────┘
```

- **双屏**（桌面壳）：壳枚举显示器，舞台投主/副屏（用户可换），演讲者窗落另一屏。
- **单屏练习模式**：演讲者面板以覆盖抽屉呈现在舞台同窗。
- **大纲视图**：标题列表快速跳页（信息密度高于网格总览时的补充）。

### 4.5 控制与外设

- 输入：键盘（附录 A 映射，兼容 PowerPoint 肌肉记忆）、鼠标点击/滚轮、触摸滑动、翻页笔（绝大多数以 PageUp/PageDown/方向键仿真，天然覆盖；WebHID 原生支持留待 Phase 3）。
- 激光笔：屏幕跟随光标的半透明光点 + 按住增强；墨迹标注（画笔层）列 Phase 3。

### 4.6 总览 / Kiosk / 媒体规则

- **总览网格**：实时缩放渲染（transform 缩小而非截图，清晰且零成本），键盘可达，点击跳页（非线性=最终状态），Esc 关闭。
- **Kiosk**：`#kiosk` + `defaults.loop`：按 autoslide 自动推进、隐藏一切 UI、可选沙箱（§8）、触摸無效化。
- **媒体规则**：进入页面触发 `data-h4s-media="autoplay"`；离开页面强制 pause+reset（可配）；kiosk 下禁止外链跳转。

---

## 5. 工具链与 AI 创作工作流

### 5.1 CLI（`h4s`，Node 实现，Rust 化留待需要）

| 命令 | 作用 |
|---|---|
| `h4s init` | 脚手架：清单骨架 + 主题选择 + 最小 deck |
| `h4s dev` | 本地服务 + 热更新（编辑器外快速预览） |
| `h4s build` | 字体子集化→内嵌、图片按预算内嵌（默认单图 ≤200KB 内嵌否则保留外链并警告）、注入文档模式/打印样式、内嵌运行时 → 单文件 `.html4s` |
| `h4s lint` | §5.3 规则集；`--fix` 可修部分（如补 title、加 alt 占位） |
| `h4s shot` | 逐页 PNG（1x/2x）+ 联络表（contact sheet） |
| `h4s export` | `pdf / pdf-notes / png / html`（单一产物），`pptx` 兼容导出（§6.2） |
| `h4s doctor` | 环境/浏览器/字体许可检查；钉住 Playwright Chromium 版本 |
| `h4s theme` | 主题脚手架与令牌预览页 |

### 5.2 构建管线（`h4s build` 步骤）

1. 解析清单与 DOM → 收集文本码点（含 notes，含 `extraChars` 缓冲，中文安全垫 20%）；
2. 字体子集化（pyftsubset）→ woff2 → 校验 `fsType` 嵌入许可 → data URL 内嵌；
3. 图片按预算内嵌/保留 → 媒体完整性检查；
4. 注入运行时 + 文档模式样式 + 打印样式；
5. 产物体积报告（超 8MB 警告，给出最大贡献项排行）；
6. 输出 `.html4s`（字节即 HTML）+ `build-report.json`。

### 5.3 lint 规则集 v1

| 规则 | 级别 | 说明 |
|---|---|---|
| `stage-overflow` | error | headless 加载后逐元素 bounding box 越界（容差 2px），报告选择器路径与越界量 |
| `text-clipped` | warn | 文本节点 `scrollWidth/Height > client` 的截断嫌疑 |
| `tofu-glyphs` | error | 声明字体缺字形（canvas 测量比对）或字体文件缺失 |
| `font-license` | error | fsType 禁止嵌入 |
| `font-budget` | warn | 内嵌字体总量 > 2MB |
| `min-font-size` | warn | 正文 < 18px@1080p（投影可读性） |
| `contrast-low` | info | WCAG 快速估算（正文 < 4.5，大字 < 3） |
| `title-missing` | warn | 页缺 `data-h4s-title` 且缺标题元素 |
| `notes-missing` | info | 无备注页提示 |
| `frag-order-conflict` / `id-duplicate` | error | 结构一致性 |
| `external-refs` | info | 单文件产物仍含外链资源 |
| `media-no-poster` | warn | 视频无封面 |

### 5.4 AI 创作闭环 + MCP Server

```
AI 生成 deck.html4s ──► h4s lint（结构/溢出/字体）
                    ──► h4s shot（逐页 PNG）
                    ──► AI 视觉自审 → 修复 → 循环直至通过
                    ──► h4s build → 单文件交付（/或直接交付源文件）
```

MCP 工具面（Phase 1 交付）：`h4s_validate(path)`、`h4s_screenshot(path, slide?)`、`h4s_outline(path)`、`h4s_export(path, format)`、`h4s_new(template)`。配套发布 **《AI 创作规范提示包》**（版式预算：每页 ≤ 5 个内容单元、最小字号、对比度、布局类优先等），作为 system prompt 素材随 MCP 分发——这一步把"AI 生成质量"从运气变成工程。

### 5.5 编辑器集成（VS Code 扩展，Phase 1 α）

- 清单 JSON Schema 校验与悬浮文档；`h4s-*` 元素/属性补全与片段；
- 大纲树（页/碎片/备注）；预览面板（webview 加载 deck，支持"定位到第 N 页"）；
- 保存即 lint；主题选择器。

---

## 6. 互操作与导出

### 6.1 PDF（主路径）

- 尺寸映射：舞台 1920×1080px @96dpi → 页面 `20in × 11.25in`（或缩放映射到 PPT 标准 `13.33in × 7.5in`，CLI 可选）；`margin: 0`、`printBackground: true`。
- 文本保持矢量可选中/可检索；Chromium 自动嵌入字体子集。
- `--notes`：页与备注交替或右侧栏版式（默认：页 + 下方备注，类 PowerPoint 备注页）。
- 确定性：pinned Chromium + 禁用动画（导出时强制最终状态）→ 同输入同字节（回归测试依赖）。
- 浏览器 Ctrl+P 兜底：deck 内置 `@media print`（等比缩放至纸张、隐藏 UI），近似即可，不承诺像素级。

### 6.2 PPTX 兼容导出（辅助，明确有损）

- 策略：每页 2x PNG 作为整页图 + **透明文本层**（保持可选中/可搜索）+ 备注写入 pptx 备注 + PDF 书签式大纲。
- 定位诚实标注为"演示兼容导出"，非可编辑还原；诉求是"对方机器只有 PowerPoint 时能放"。

### 6.3 导入适配器（Phase 3）

- `reveal.js → h4s`：薄包装迁移（配置映射 + section 直转），工作量小、价值高（存量演示搬家）。
- `pptx → h4s`：OOXML 解包 → 文本/图片/顺序/备注抽取 → 主题占位重排；标注"迁移辅助，需人工润色"。
- `Markdown（Marp 风格）→ h4s`：简单分隔符映射，覆盖轻量场景。

### 6.4 引擎支持矩阵

| 引擎 | 角色 | 支持 |
|---|---|---|
| Chromium 系（含 WebView2 / Playwright） | **参考实现** | 全功能，像素级回归 |
| Firefox | 浏览器兜底播放 | 全功能（无 BroadcastChannel 之外的缺口），不做像素回归 |
| Safari / WKWebView（macOS 桌面壳） | 桌面兜底 | 功能全，视觉差异文档化（见 R1） |
| 旧 Edge / IE | — | 文档模式（G6 天然覆盖） |

---

## 7. 质量与测试策略

- **金标准语料**：10+ 覆盖型 deck（中文长文/代码/图表/视频/混合比例/大量碎片/超长备注/深色主题…），既是回归集也是文档示例。
- **一致性套件**：清单解析、碎片顺序、跳页语义、计时行为 → JSON 测试向量驱动的 conformance tests（未来第三方运行时的准入门槛）。
- **视觉回归**：pinned Chromium 截图 + pixelmatch 阈值比对；转场前后双帧采样。
- **性能预算**：50 页 deck 双击→首帧 ≤ 2s（桌面）；翻页输入响应 ≤ 1 帧排队（< 16ms 入队）；总览网格 100 页可流畅滚动（虚拟化）。
- **无障碍审计**：键盘全路径 + 屏幕阅读器过一遍播放器 UI（Phase 2）。

---

## 8. 安全与信任模型

- deck = HTML = 代码，信任模型与"打开一个 HTML 文件"一致，明确文档化（不装作更安全）。
- 播放器默认允许页内脚本（L4 表达力依赖）；提供 **Kiosk 沙箱开关**：禁外链导航、禁外网请求（CSP 收紧）、禁下载。
- 桌面壳写回文件仅限：清单 `timings`、构建产物——写前备份原文件（`.bak`）。
- 无遥测默认；崩溃报告可选开启。

---

## 9. 路线图

> 人力估算按"1–2 名全栈工程师"口径给 person-weeks（pw）与自然月（1–2 人并行）。原则：**每个阶段以"真实演讲成功一场"为验收，不以功能清单为验收。**

| 阶段 | 周期 | 主题 | 关键交付 | 退出标准 |
|---|---|---|---|---|
| **P0 概念验证** | 3–4 pw（M1–M2） | 打通闭环，冻结 L1 | 规范 v0.1（§3）；`h4s-core` MVP（舞台缩放/键盘导航/碎片/备注双窗/计时/总览/黑屏，纯 Web）；3 个真实试点 deck（其中 ≥1 个由 AI 全程生成）；浏览器打印 PDF 路线验证 | 3 个 deck 在 Chromium 完整走完一场真实演讲（含双屏演讲者视图）；AI 生成 deck 经 2 轮 lint+截图迭代达到可用；规范 v0.1 冻结不再动 L1 字段 |
| **P1 工具链 α** | 6–8 pw（M3–M5） | AI 可规模生产 | CLI 全命令（§5.1）；lint 含 stage-overflow/tofu/字体许可；字体子集管线；`export pdf/png/html`；VS Code 扩展 α；MCP server β；金标准语料 v1 | 溢出检测在人工标注的 20 处错误上召回 100%；中文 deck 子集后单文件 ≤ 8MB；3 名种子 AI 用户完成"生成→交付"全程无人工修文件 |
| **P2 播放器 β** | 8–10 pw（M6–M9） | 双击即演 | 桌面壳：Win 用 .NET+WebView2（P0 已打通），mac 走 Tauri；安装包+签名公证；`.html4s` 文件关联；桌面双窗演讲者视图+显示器枚举；排练计时写回；kiosk；更新器；无障碍过审 | 10 名外部演讲者完成 ≥5 场真实演示零事故；双击→首帧 ≤ 2s（50 页）；崩溃率 < 0.1%/deck；Windows/macOS 双平台安装→演示全程无文档级障碍 |
| **P3 生态** | 持续（M10–M12） | 采用与迁移 | 主题库 v1（≥5 主题）；MCP 1.0 + AI 提示包；pptx/reveal 导入适配器；静态分享页（deck 上传→链接）；WebHID 翻页笔/墨迹标注 | 首月 ≥100 个真实 deck 通过工具链；导入适配器迁移成功率（人工验收）≥ 70% |
| **P4 v1.0** | M12+ | 冻结与治理 | 规范 1.0 + conformance 套件发布；文档站；第三方运行时准入规则；品牌/商标终审（命名见 R6） | conformance 对自家运行时全绿；规范由 ≥1 个外部实现复刻通过 |

**MVP 分界线**：P2 结束即构成对外可宣传的 MVP（"一个文件、双击即演、AI 能写"）；P0 结束的 Web 运行时即可内部使用。

**近期三件事（本周可启动）**：
1. 冻结 §3.2–3.4 的 L1 语法（本文件即草案，评审后定稿）；
2. `h4s-core` spike：状态机 + 缩放器 + BroadcastChannel 双窗（预计 1 周内可见可演）；
3. 用 AI 生成 3 个试点 deck，跑通"生成→lint→截图→修复"闭环并记录 AI 失败模式清单（反哺 lint 规则与提示包）。

---

## 10. 风险登记册

| # | 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|---|
| R1 | macOS WKWebView（Tauri）渲染与 Chromium 参考不一致（转场/字体/布局） | 中 | 高 | 参考引擎文档化差异；保留 Electron 后备构建路径（核心引擎无关，成本低）；关键用户场景优先验证 macOS |
| R2 | AI 生成质量波动（溢出/审美差）损害口碑 | 中 | 高 | lint 硬门 + 截图自审闭环 + 布局类 stdlib 收敛下限；提示包持续维护失败模式清单 |
| R3 | 单文件体积失控（中文字体/图片/视频） | 中 | 中 | 子集化默认开启 + 体积预算告警 + 大媒体外链规范（L3 打包规则） |
| R4 | 字体嵌入许可（部分商用字体禁嵌） | 低 | 中 | 构建期 fsType 检查报错；推荐可嵌入开源字体清单（MiSans/思源/HarmonyOS Sans 等） |
| R5 | `.html4s` 扩展名较长 / 与既有格式撞名 | 低 | 低 | 2026-11-10 检索确认无演示格式冲突（原 `.h4s` 与 HoMM4 存档的微弱撞名已随更名消除）；正式发布前做商标终审 |
| R6 | 命名/商标冲突（"html4s"） | 低 | 中 | P4 前完成商标检索；社区名与产品名可分离 |
| R6.5 | 浏览器打印路线（Ctrl+P）被误当主路径，体验不佳 | 中 | 低 | UI 上引导至"导出 PDF"；打印样式仅承诺"可用" |
| R7 | 播放器与页内脚本（L4）冲突 | 低 | 中 | 事件命名空间化（`h4s:*`）；文档明确"页脚本不得操作舞台容器"约定 + lint 静态检查 |
| R8 | 单人/小团队带宽不足导致 P2 桌面壳延期 | 中 | 中 | P1 结束时 Web 形态已可用（分享链接方案顶上）；桌面壳范围收缩（先 Win 后 mac） |

---

## 11. 附录

### 附录 A：键盘映射（对齐 PowerPoint 习惯）

| 按键 | 动作 |
|---|---|
| `→ ↓ Space PgDn Enter N` | 下一步（碎片内推进 → 翻页） |
| `← ↑ PgUp Backspace P` | 上一步 |
| `Home / End` | 首页 / 末页 |
| `数字 + Enter` | 跳页（非线性 = 最终碎片状态） |
| `B` 或 `.` / `W` 或 `,` | 黑屏 / 白屏 |
| `F5` / `Shift+F5`（桌面） | 从头放映 / 从当前页放映 |
| `F` | 窗口全屏切换 |
| `G` / `O` | 总览网格 / 大纲视图 |
| `S` / `T` / `R` | 演讲者视图 / 计时暂停继续 / 排练录制开关 |
| `L` | 激光笔 |
| `Esc` | 退出浮层 → 退出全屏 |
| `?` | 帮助浮层 |

### 附录 B：运行时暴露面（摘要）

- CSS 变量：`--h4s-scale`、`--h4s-stage-w/h`、`--h4s-progress`
- 类：`.h4s-live`（播放器已接管）、`.is-frag-visible/entering/hidden`、`.h4s-blackout`
- 事件：`h4s:ready / slidechange / fragchange / overlay`
- 全局：`window.H4S = { version, supported, deck }`

### 附录 C：对比矩阵（定位备忘）

| 能力 | pptx | reveal.js | Slidev | Marp | **html4s** |
|---|---|---|---|---|---|
| AI 直写难度 | 高（二进制） | 中（绑框架 API） | 中（需工程化） | 低（表达受限） | **低（纯 HTML 单文件）** |
| 演播（备注/计时/黑屏/总览） | ✓ 成熟 | 插件/弱 | 部分 | ✗ | **✓ 一等公民** |
| 双击即演 | ✓ | ✗ | ✗ | ✗ | **✓（文件关联 + 浏览器兜底）** |
| 字体内嵌 | ✓ | 手动 | 构建 | 手动 | **声明式 + 自动子集** |
| 精确比例 / 混合比例 | ✓ / 弱 | contain / ✗ | contain / ✗ | ~ / ✗ | **✓ / ✓** |
| 矢量 PDF + 备注版 | ✓ | 打印近似 | ✓ | ✓ | **✓（headless 确定性管线）** |
| 版本控制友好 | ✗ | 中 | 中 | ✓ | **✓（文本即成品）** |
| 运行时可替换（deck 不绑框架） | — | ✗ | ✗ | ✗ | **✓（格式与运行时解耦）** |

### 附录 D：术语表

| 术语 | 含义 |
|---|---|
| Stage（舞台） | 页的逻辑坐标系（如 1920×1080），内容以其为准，播放器等比缩放 |
| Letterbox | 舞台比例与屏幕不一致时的留黑边策略 |
| Fragment（碎片） | 页内分步显示单元（对应 PPT 动画窗格中的分步对象） |
| Deck | 一份演示文档（.html4s 文件） |
| 文档模式 | 无 JS 时的纯网页降级形态 |
| Kiosk | 无人值守自动循环播放模式 |

---

*变更记录：v0.1 — 首版架构设计与路线图（2026-11-10）。*
