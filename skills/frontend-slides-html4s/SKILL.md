---
name: frontend-slides-html4s
description: 基于 frontend-slides（zarazhangrui）的动画-rich HTML 演示体系改造：固定 1920×1080 舞台、html4s 单文件交付、由 html4s 播放器承担放映/演讲者/导出。触发词：frontend-slides deck、动画演示文稿、bold template、风格探索 PPT。
---

# Frontend Slides · html4s 版

> 视觉体系与版式来源：[zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides)。本 skill 保留其全部设计原则与模板包，将**运行时与交付格式**替换为 html4s：放映、演讲者视图、导出、缩略图由 `player/h4s.player.js`（html4s 播放器）承担。

## 与原版的三个差异（其余一切不变）

1. **运行时替换**：原 `deck-stage.js`（导航/校验运行时）不再嵌入——html4s 播放器承担翻页、碎片、演讲者视图、导出。`deck-stage.js` 的 data-om-validate 校验由 `tools/h4s-lint.mjs` 等价承接。
2. **结构契约**：deck 是 html4s 单文件——清单 + `<h4s-deck>` + `<section class="slide …">` 序列 + `<h4s-notes hidden>` 备注 + 播放器引用。
3. **交付格式**：`.html4s`（构建后单文件，双击用 html4s 播放器放映）。

**完全保留**：固定 1920×1080 舞台（NON-NEGOTIABLE）、密度模式（speaker-led/reading）、风格探索流程、`bold-template-pack/` 全部模板设计文档、`animation-patterns.md`、`STYLE_PRESETS.md`、`viewport-base.css`（追加 h4s 桥接段）。

## deck 骨架（h4s 契约）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>…</title>
  <!-- 字体：Fontshare/Google Fonts 可用于创作期；正式交付用清单声明 + h4s-build 内嵌 -->
  <style>
    /* 1. PASTE viewport-base.css CONTENTS HERE（含末尾 h4s 桥接段） */
    /* 2. 主题 tokens + 模板 CSS（按 bold-template-pack/<模板>/design.md） */
  </style>
  <script type="application/h4s+json">
  {
    "h4s": "1.0",
    "meta": { "title": "…" },
    "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "#000" },
    "defaults": { "transition": { "name": "fade", "duration": 450 } },
    "fonts": []
  }
  </script>
</head>
<body>
  <h4s-deck>
    <section class="slide" data-h4s-title="…">
      <!-- 按 design.md 版式填充；单位：1920×1080 舞台 px -->
      <h4s-notes hidden><p>【目的】…</p><p>【要点】…</p></h4s-notes>
    </section>
    <!-- 更多页 -->
  </h4s-deck>
  <script src="../../player/h4s.player.js"></script>
</body>
</html>
```

## 桥接要点（原类名 → html4s 播放器行为）

- `.slide` 的 `.active/.visible` 显隐由播放器管理：当前页自动获得这两个类（入场动画 `.slide.visible .reveal` 照常触发），非当前页 `display:none`。
- `.deck-viewport/.deck-stage` 包装层可省略——播放器把每个 `.slide` 直接放入等比缩放的舞台。`viewport-base.css` 的 `.slide{position:absolute;inset:0;width:1920px;height:1080px}` 与舞台几何一致，桥接段已处理显隐冲突。
- 翻页/键盘/滚轮/触屏/导出/缩略图全部由播放器提供，deck 内不再写导航代码。

## 构建与验证

```bash
node tools/make-deck.mjs --template <模板或deck源> --slides <片段> --title "…" -o deck.html
node tools/h4s-lint.mjs deck.html          # 溢出/字号/对比度（退出码驱动修复）
node tools/h4s-shot.mjs deck.html          # 逐页 PNG 视觉自审
node tools/h4s-build.mjs deck.html --subset -o deck.html4s   # 单文件交付
```

## 质量门槛（P0）

- 原版 SKILL.md 的 Fixed Stage Rules 全过（本补充样式表已处理显隐冲突，其余照旧）
- 每页 `data-h4s-title` + `h4s-notes`
- `h4s-lint` 0 错误；`h4s-shot` 抽查无溢出/无缺字
- 动画仅作为入场增强（`.slide.visible .reveal`），不承担信息可达性

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

---
|---|---|
| 正文 / 说明文字 | **26px** | `.lead` `.meta-list li` `.desc` `.loop-step p` |
| 辅助说明 / 注释 | **22px** | `.stat-note` `.lbl` |
| 元数据标签（chrome/页码/kicker） | 14px 可 | `.t-meta` `.chrome-min`（装饰性元数据，非正文） |

- 适配层以 `!important` 注入模板 `</style>` 前，**不要手动调回 16-18px**
- 新增版式或自定义段落类遵守同底线；标题大字层级不变（对比度靠字号差 + 字重，不靠把正文压小）
- 检查工具：`h4s-lint` 的 font-small 规则（<13px 错误、<14px 警告）
