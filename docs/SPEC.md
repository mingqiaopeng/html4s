# html4s 格式规范 v1.0-rc1

状态：**发布候选（冻结）**——L1/L2 字段与 §5/§6 枚举自本版起冻结，1.0 正式版仅允许勘误与实现澄清 · 对应实现：h4s-core 0.3.2 · 在线参考实现：**https://mingqiaopeng.github.io/html4s/** · 日期：2026-11-20
父文档：[ARCHITECTURE.md](../ARCHITECTURE.md)（架构与 ADR）。本文件是**格式与运行时行为**的规范文本；与实现不一致处以实现为准并在变更记录中说明。

## 1. 能力分级

| 层 | 名称 | 内容 | 状态 |
|---|---|---|---|
| L0 | 文档模式 | 无播放器时浏览器直接渲染（渐进增强底线） | 冻结 |
| L1 | 基础播放 | 清单/舞台/键盘导航/备注/总览/深链/字体内嵌 | **冻结**（v1.0 前唯一窗口） |
| L2 | 演示能力 | 碎片/转场/自动播放/演讲者双窗/排练写回/kiosk/fx | 冻结候选 |
| L3 | 交互扩展 | 文字微调（增量编辑）/媒体控制/网页放映/i18n/WebHID | 已实现，标 EXPERIMENTAL 的子项允许调整 |

## 2. 文档解剖

`.html4s` 文件是**合法 HTML 单文件**（UTF-8，无 BOM），双击即演，浏览器打开进入文档模式兜底。

```html
<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>…</title>
<script type="application/h4s+json">
{ "h4s": "1.0", "playerVersion": "0.3.1", "meta": {…}, "stage": {…}, "defaults": {…}, "fonts": […] }
</script>
</head><body>
<h4s-deck>
  <h4s-slide data-h4s-title="页标题" data-h4s-transition="slide">
    …页面内容…
    <h4s-notes hidden>演讲者备注（可含 HTML）</h4s-notes>
  </h4s-slide>
</h4s-deck>
<script src="…/h4s.player.js"></script>   <!-- 构建产物中此行已被替换为内联播放器 -->
</body></html>
```

## 3. 清单 Schema（`<script type="application/h4s+json">`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `h4s` | string | ✓ | 格式版本，当前 `"1.0"` |
| `playerVersion` | string | 构建注入 | 构建时写入的内嵌播放器版本（`v0.9` 新增）。播放器/lint 比对自身版本，不一致 → 浏览模式"旧版播放器"提示 / `W-STALE-PLAYER` |
| `meta.title` | string | 建议 | deck 标题（窗口标题/深链 id 派生/写回文件名） |
| `meta.lang` | string | 可选 | UI 语言提示（`zh`/`en` 前缀匹配）；壳设置可覆盖（localStorage `h4s-lang-override`） |
| `meta.author` | string | 可选 | 作者 |
| `id` | string | 可选 | deck 稳定 id（演讲者双窗 BroadcastChannel 频道名派生；缺省由标题+页数哈希） |
| `stage.width/height` | number | 可选 | 舞台像素（默认 1280×720） |
| `stage.fit` | string | 可选 | `contain`（默认）/`cover` |
| `stage.background` | CSS color | 可选 | Letterbox 色（默认 `#000`） |
| `defaults.transition.name` | enum | 可选 | 全局转场（默认 `fade`），枚举见 §5 |
| `defaults.transition.duration` | number | 可选 | 全局转场时长 ms（默认 300） |
| `defaults.transition.color` | CSS color | 可选 | 遮罩式转场的幕布色（默认 `#c8102e`） |
| `defaults.fx` | enum | 可选 | 背景特效层 `stars`/`snow`/`dust`/`none` |
| `defaults.autoslide` | number | 可选 | 全局自动翻页秒数（0=关闭） |
| `defaults.loop` | boolean | 可选 | 循环放映 |
| `defaults.fragment.effect` | enum | 可选 | 全局碎片效果（默认 `fade-up`） |
| `defaults.fragment.delay` | number | 可选 | 自动碎片间隔 ms（默认 150） |
| `fonts[]` | array | 可选 | `{family, file, weight, style}`；`file` 相对 deck 目录；构建后附 `fontsEmbedded`/`fontsSrc`/`fontSubsetChars` |

## 4. 元素与属性注册表

### 4.1 结构元素

| 元素 | 说明 |
|---|---|
| `<h4s-deck>` | deck 容器（可省——兼容 `.slides` 容器 / body 直接子 `section`/`.slide`） |
| `<h4s-slide>` | 页（自定义元素）；兼容别名：`<section>`、`.slide` |
| `<h4s-notes hidden>` | 页备注；兼容别名：`aside.notes`/`.notes` |

页采集顺序：优先全部 `<h4s-slide>`；否则取容器（`h4s-deck`→`.slides`→body）的直接 `section`/`.slide` 子元素。

### 4.2 页级属性（`h4s-slide` / `section`）

| 属性 | 说明 |
|---|---|
| `data-h4s-title` | 页标题（浏览侧栏/总览/页码指示器）；缺省取首个 h1/h2 文本 |
| `data-h4s-stage` | 逐页舞台覆盖，格式 `"WxH"`（混合比例 deck） |
| `data-h4s-transition` | 逐页转场覆盖，枚举见 §5 |
| `data-h4s-autoslide` | 逐页自动翻页秒数 |
| `data-h4s-fx` | 页面级礼花：`confetti`（进页爆发一次） |
| `id` / `data-slide-id` | 深链与工具定位（工具链优先 `data-slide-id`） |

### 4.3 行为属性

| 属性/类 | 说明 |
|---|---|
| `data-h4s-frag` | 碎片标记，值 = 效果枚举（见 §6）；兼容 `.fragment` 类 |
| `data-h4s-frag-order` | 碎片顺序（缺省按 DOM 序）；兼容 `data-fragment-index` |
| `data-h4s-frag-delay` | 自动播放时该碎片的额外延迟 ms |
| `data-h4s-media` | 媒体控制容器，`~="autoplay"` 时进页自动播放、离页暂停（可直接置于 video/audio 上） |
| `data-h4s-noclick` | 阻断"点击翻页"冒泡（交互元素用） |
| `data-h4s-editable` | 播放器内部：文字微调标记（规范外属性，勿手写） |

### 4.4 深链 hash 语法

`#/页号` · `#/页号/碎片号`（1 起始） · `#/kiosk`（循环放映+隐藏 UI，壳 `--kiosk` 自动追加） · `#presenter`（演讲者窗） · `#auto=N`（临时自动播放秒数）

## 5. 转场枚举（data-h4s-transition / defaults.transition.name）

动画 12：`fade` `slide` `push` `zoom` `wipe` `flip` `zoomblur` `cube` `iris` `unfold` `rise` `dissolve`
遮罩 4：`curtain` `blinds` `checkerboard` `pixelate`（覆盖层式，幕布色 `defaults.transition.color`）
其他：`none`
未知值按 `fade` 回退并触发 `W-TRANSITION`。

## 6. 碎片效果枚举（data-h4s-frag 值）

`fade-up`（默认） `slide-left` `slide-right` `zoom` `fade` `none`

## 7. JS API 与事件

`window.H4S`：`version` `next()` `prev()` `go(n)` `present(n)` `stop()` `state()` `toggleOverview()` `toggleDrawer()` `toggleLaser()` `toggleFullscreen()` `connectRemote()`（L3 实验性，WebHID） `timings()`

| 事件 | detail |
|---|---|
| `h4s:ready` | `{count, index, presenting}` |
| `h4s:slidechange` | `{index, id, title, frags, frag}` |
| `h4s:fragchange` | `{index, frag, total}` |
| `h4s:rehearse` | `{log, total}` |
| `h4s:showend` | `{index}` |
| `h4s:presenter-ready` | `{slides}` |

## 8. 版本化与兼容策略

1. **L1 字段自 v0.1 冻结**，破坏性变更只能进新大版本（`"h4s": "2.0"`）。
2. 新增字段必须**可选**且旧播放器忽略不报错（本规范的 `playerVersion`/`fontSubsetChars`/fx 系列均满足）。
3. 未知转场/fx 值一律回退默认并告警（lint 静态检出，不阻断播放）。
4. **playerVersion 语义**：构建产物必含；播放器 `H4S.version ≠ playerVersion` 时功能可能缺失（重建以升级），lint 报 `W-STALE-PLAYER`。该字段是"deck 内嵌能力级别"的权威依据。
5. 构建产物额外约定：单文件（播放器/lucide/字体子集全部内联）；`*.share.html` 为同内容的浏览器直开副本；壳写回（文字微调 save）保持 UTF-8 无 BOM 并同步 shim。

## 9. 第三方运行时准入规则

1. **层级声明**：实现方须声明支持层级（L0/L1/L2/L3），并提交枚举支持矩阵（§5 转场 20 种 / §6 碎片 6 效果 / fx 4 种）——未支持项必须降级不得报错（§8.3）。
2. **一致性套件**：须对官方 conformance deck（`examples/conformance.html` 构建产物）运行 [docs/CONFORMANCE.md](CONFORMANCE.md) 定义的套件：13 项行为断言全过 + 结构 lint 0 错误。
3. **渲染抽查**：提交 ≥3 页（封面/内容/收束）与参考实现的并排截图，由维护者人工验收——固定舞台等比缩放不得变形，Letterbox 色由清单控制。
4. **宽容原则**：未知字段忽略、未知枚举回退默认；不得因清单超前字段拒绝加载（§8.2）。
5. **版本互通**：第三方运行时复用 `playerVersion` 字段语义（或并列 `runtimeVersion`）暴露自身版本，供 stale 检测生态互通。
6. **准入流程**：PR 附 conformance 运行日志 + 截图 → 维护者验收 → 在本节"已准入实现"登记。
7. **已准入实现**：h4s-core（官方参考实现，0.3.2，2026-11-20）。

## 变更记录

- **v1.0-rc1（2026-11-20）**：**冻结候选**——L1/L2 字段与全部枚举冻结；新增 §9 第三方运行时准入规则；在线参考实现上线（mingqiaopeng.github.io/html4s）。
- v0.9（2026-11-19）：从 ARCHITECTURE.md §3 独立成文并对齐 0.3.1 实现：转场 6→20 种、fx 层、页面礼花、文字微调（L3）、媒体控制、网页放映、i18n（含壳语言覆盖）、WebHID、`playerVersion`/`fontSubsetChars`/`fontsEmbedded` 字段、深链完整语法。
- v0.1（2026-11-10）：初版（ARCHITECTURE.md §3）。
