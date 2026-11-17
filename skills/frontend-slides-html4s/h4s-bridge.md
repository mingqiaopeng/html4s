# html4s 桥接契约（frontend-slides → html4s 播放器）

本文件是 frontend-slides 视觉体系与 html4s 播放器之间的集成规范。

## 结构映射

| 原版 | html4s 版 | 说明 |
|---|---|---|
| `deck-stage.js` 运行时 | `player/h4s.player.js`（引用或内嵌） | 翻页/碎片/演讲者/导出全由播放器承担 |
| `.deck-viewport` + `.deck-stage` 包装 | `<h4s-deck>` 直容纳 `.slide` | 播放器的 `.h4s-holder` 即固定舞台 |
| `.slide.active/.visible` 显隐 | 播放器自动管理 | 当前页自动获得两个类；`.slide.visible .reveal` 入场动画照常触发 |
| ESC 索引 / 底部圆点 / 导航区 | 播放器总览（G）/进度条 | deck 内不再写导航 UI |
| 排练 / 演讲者模式 | 播放器 S 抽屉 / ⧉ 双窗口 | 数据走 BroadcastChannel 与 timings.json |

## 交付契约

- 清单 `application/h4s+json`：stage 1920×1080、transition、fonts[]
- 每页 `data-h4s-title` + `<h4s-notes hidden>`
- 构建：`h4s-build.mjs --subset` → 单文件 `.html4s`
- 验证：`h4s-lint.mjs`（0 错误）+ `h4s-shot.mjs`（视觉抽查）

## 保留不变

- Fixed Stage Rules（1920×1080 唯一坐标系）
- 密度模式决策（speaker-led / reading）
- bold-template-pack 全部 design.md（版式与生成规范）
- animation-patterns.md（入场动画模式，经 `.slide.visible .reveal` 触发）
- STYLE_PRESETS.md（风格预设）
