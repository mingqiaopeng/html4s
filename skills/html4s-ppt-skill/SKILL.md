---
name: html4s-ppt-skill
description: 基于 guizang-ppt-skill 视觉体系（电子杂志风/瑞士国际主义）生成 html4s 演示文稿：固定 1920×1080 舞台、h4s 结构、本机字体内嵌、播放信息写入，构建为单文件 .html4s 交付。触发词：html4s PPT、瑞士风 html4s、杂志风 html4s、生成 html4s 演示。
---

# html4s PPT Skill（基于 guizang-ppt-skill 改造）

> 视觉体系与版式来源：[op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)（AGPL-3.0，本 skill 为其派生，分发时需附源）。
> 改造点：运行时与交付格式换成 **html4s**——固定分辨率舞台、播放器缩略图、字体内嵌、播放信息、单文件 `.html4s`。

## 两个不可动摇的原则

1. **视觉体系不变**：双风格（Style A 电子杂志 / Style B 瑞士国际主义）、锁定版式、主题色只选不调、`references/` 里的版式骨架与 checklist 照用。
2. **格式即 html4s**：deck 是合法 HTML + h4s 语义（清单/元素/备注），由 `player/h4s.player.js` 播放，构建为单文件 `.html4s` 双击即演。**不要引入原版的横向翻页运行时和内嵌演讲者模式**——那些能力由播放器承担。

## 工作流

1. **选风格** — Style A（叙事/观点）或 Style B（事实/产品/方法论）；用户没指定时按内容类型推荐。
2. **需求澄清** — 沿用 7 问清单（受众、时长、素材、配图、主题色、硬约束、**演示环境**：本机壳播放器 or 浏览器分享）。
3. **拷贝模板** — `assets/template-style-a.html` 或 `assets/template-style-b.html`（已是 h4s 结构：清单 + `<h4s-deck>` + 播放器引用）。
4. **填充内容** — 从 `references/layouts.md`（A）或 `references/layouts-swiss.md`（B）挑版式骨架粘进 `<h4s-deck>`；组件用法看 `references/components.md` / `gz-components.md`。**每页必带 `<h1>/h2` 或 `data-h4s-title`（缩略图与大纲来源）**。
5. **演讲备注** — 写进每页 `<h4s-notes hidden>`（目的/要点/转场），替代原版 SPEAKER_NOTES 数组契约。
6. **播放信息** — 按大纲写入：每页 `data-h4s-autoslide="秒"` 或清单 `defaults.autoslide`；循环 `defaults.loop`；逐页转场 `data-h4s-transition`（fade/slide/push/zoom/wipe/flip）。
7. **增量编辑** — 改内容不要全量重写：`node tools/h4s-slides.mjs insert <deck> --after <slide-id|序号> --file <snippet.html>` 插页并自动重编页码；`sync <deck> --build` 页码重编 + 重建产物（消双份真理）。
8. **字体（本机可选可内嵌）** — 在清单 `fonts[]` 声明：`{ "family": "…", "file": "相对路径.woff2", "weight": 400 }`。有字体文件 → 构建期子集内嵌（离线不缺字）；只有字体名 → 使用本机已安装字体。**同步更新 CSS 里的 `--ff-*` 变量**。禁止引用 Google Fonts CDN。
8. **自检** — 原版 `references/checklist.md` P0 全过 + 本文件 h4s 检查项（见下）。
9. **构建交付** — `node tools/h4s-build.mjs <deck.html> --subset` → 单文件 `.html4s`（运行时/图标/字体全部内嵌）。
10. **验证** — 转场/特效写法见"转场与背景特效"一节；动态效果参考 `examples/fx-showcase.html4s`。双击 `.html4s` 用壳播放器打开：确认"✓播放器已接管"、缩略图渲染、放映全屏、字体无缺字；或浏览器直接打开（分享场景）。

## h4s 格式速查（本 skill 的输出契约）

```html
<script type="application/h4s+json">
{ "h4s": "1.0",
  "meta": { "title": "…" },
  "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "transparent" },
  "defaults": { "transition": { "name": "slide", "duration": 450 },
                "autoslide": 0, "loop": false },
  "fonts": [ { "family": "Noto Sans SC", "file": "fonts/xxx.woff2", "weight": 400 } ] }
</script>
<h4s-deck>
  <h4s-slide id="cover" data-h4s-title="封面" data-h4s-transition="zoom" data-h4s-autoslide="15">
    <h1>…</h1>
    <li data-h4s-frag>碎片（可选）</li>
    <h4s-notes hidden><p>【目的】…</p><p>【要点】…</p><p>【转场】…</p></h4s-notes>
  </h4s-slide>
</h4s-deck>
<script src="…/player/h4s.player.js"></script>
```

- 舞台固定 **1920×1080**，模板 CSS 已按此换算（无 vw/vh），版式还原度与原模板一致。
- 背景画布（`canvas.bg` + `data-gz-effect`）保留原设计，播放器自动置底层；清单 `stage.background: "transparent"` 让其透出。
- 碎片/交互可用 `data-h4s-frag`；页面级脚本只通过 `h4s:*` 事件与播放器协作。

## 构建期检查项（P0 级，必须全过）

- [ ] 清单 JSON 合法；`fonts[].file` 相对路径存在
- [ ] 每页有标题（`data-h4s-title` 或首个 h1/h2）
- [ ] 每页有 `h4s-notes`（目的/要点/转场齐全）
- [ ] 自动播放页已标 `data-h4s-autoslide`；整体循环用 `defaults.loop`
- [ ] 无 Google Fonts / unpkg CDN 残留引用（构建会内嵌 lucide，字体必须本地）
- [ ] 构建产物体积报告无 ⚠（字体超预算会警告）
- [ ] 双击产物：标题栏显示"✓播放器已接管"（✗ = 静默失败，先查路径）


## 中文字号规则（P0 · html4s 修订 v2）

1920×1080 固定舞台投影到会议室后排，中文需要可读性底线。html4s 模板已内置**可读性适配层 v2**：

| 类别 | 规则 | 涉及类 |
|---|---|---|
| 全字符下限 | **≥18px，无一例外** | `.t-meta` `.t-cat` `.chrome-min` `.foot` `.stmt-anchor` `.yr` `.stat-label` |
| 正文 / 说明文字 | **26px** | `.lead` `.meta-list li` `.desc` `.loop-step p` |
| 辅助说明 / 注释 | **22px** | `.stat-note` `.lbl` |
| 大字标题 | 适度压缩（×0.8） | `.h-hero`→246px `.h-statement`→148px `.h-xl`→138px `.display`→246px `.display-zh`→184px `.h1-zh`→108px |

- 适配层在模板 `</style>` 前，正文/小字用 `!important` 强制；**大字规则不用 important**——deck 内联定制字号保持优先
- 不要手动把正文调回 16-18px；新增版式遵守同底线
- 检查工具：`h4s-lint` 的 font-small 规则（<13px 错误、<14px 警告）


## 已知坑（改模板/排错时必读）

- **构建内联代码必须用函数替换器**：`replace(re, 字符串)` 会把代码里的 `$$` 当 `$` 模式展开（曾把 `function $$` 折叠成 `function $` 导致播放器静默失效）。
- deck 内不要自建翻页/演讲者 UI；放映能力全部来自播放器。
- lucide 图标库在构建期从 unpkg 下载并**内嵌进产物**；无网环境构建时内联失败，图标保留 CDN 引用、离线演示会缺图标（构建输出会给出 ⚠，标题栏显示 ✗ 提示）。源 deck 写 unpkg CDN 引用不算违规——构建负责消除它。

## 适配检查清单（改模板 / 手工适配原版 deck 时必读）

适配器 `tools/adapt-gz-template.mjs` 的手术契约——以下标记**丢了就会被剥掉**，别依赖人工记忆：

| 标记 / 结构 | 作用 | 丢了会怎样 |
|---|---|---|
| `GZ:EFFECTS:START ... GZ:EFFECTS:END` 注释对 | 包住 WebGL 特效运行时与 lucide 脚本 | 整段脚本被剥，WebGL 背景与图标全失效 |
| `<canvas class="bg" data-gz-effect="...">` | 背景画布，适配器自动加 `data-h4s-bg` | 播放器不把它置底，背景层错乱 |
| `GZ:TOKENS:START/END` | 主题 token 区（`--accent` 等 CSS 变量） | data-theme 机制失效 |
| `<div id="deck">` | 原版容器 | 不被转换成 `<h4s-deck>` |
| CSS 行含 `ppt-` / `body.low-power` / `#deck{` / `#nav` / `#hint` | 原版运行时样式 | 被剥离（这是预期行为） |

**伪 `<section` 误计数**：HTML 注释里出现 `<section` 字样（如示例代码注释）会被页面计数工具当成真实页面——注释里要写 `&lt;section&gt;` 或改写文字。同理，`splitSections` 类工具只认真实标签序列。

**验证命令**：适配完成后立即 `h4s-lint`（页数 = 预期页数）+ `h4s-shot`（WebGL 背景是否渲染）。

## 转场与背景特效（v0.3 播放器）

逐页转场写 `data-h4s-transition="名称"`，全局默认写清单 `defaults.transition.name`。

**页面动画转场（14 种）**：`fade` `slide` `push` `zoom` `wipe` `flip`（原有）+ `zoomblur` 缩放模糊（章节开场/金句）`cube` 3D 推转`iris` 圆形揭开（聚焦单一大图）`unfold` 中线卷轴展开`rise` 托起`dissolve` 步进溶解。

**遮罩式转场（4 种，PowerPoint 幕布风）**：`curtain` 幕布合拢`blinds` 百叶窗`checkerboard` 棋盘`pixelate` 像素溶解。幕布色用清单 `defaults.transition.color` 配置（默认 `#c8102e`）。

**背景特效层**（零依赖 canvas，仅放映时渲染、离开自动暂停）：
- 全局：清单 `defaults.fx = "stars" | "snow" | "dust"`（星空漂移 / 雪花 / 上升尘埃）
- 页面级礼花：slide 上 `data-h4s-fx="confetti"`——进入该页时金色礼花爆发一次，适合收束页/表彰时刻

选用建议：章节开场 zoomblur/cube；聚焦重点 iris/unfold；仪式感页面 curtain；科技风 pixelate；喜庆时刻 confetti。转场不宜每页都换——一份 deck 2-3 种为主。

## 多语言 UI 与报告（v0.3.1 播放器）

- **UI 语言**：清单 `meta.lang: "en-US"` → 播放器界面英文（Open/URL/Light/Presenter/Notes…）；`"zh-CN"` 或缺省 → 中文。deck 内容语言与 UI 语言独立。
- **lint HTML 报告**：`h4s-lint <deck> --html report.html` 生成自包含分页报告（深色风格、逐页问题色标、结论徽章）——可直接发给作者或贴进修复回环。
- **页面排序**：`h4s-slides move <deck> --from <slide-id|序号> --to <序号>`，页码自动重编。

## 文字微调（浏览模式编辑 · v0.3.1 播放器）

**定位**：演讲前微调几个字（改错别字/换日期/调称呼）——不是编辑器，重大修改仍走源码 + 工具链。

- 浏览栏 **✎ 编辑** 开启 → 预览中可编辑文字显示虚线描边 → **单击直接改字**（Enter/Esc 结束）
- 提交后自动同步回真实页面 + 记入改动表；**子集缺字预警**：输入的字符不在内嵌子集时黄框标记并提示
- **⬇ 导出**：壳内=写回源文件（含 shim 同步，提示重建字体子集）；浏览器=下载 edited.html4s
- 仅支持纯文本叶子元素（标题/段落/列表项）；canvas/SVG/伪元素内容不可编辑
