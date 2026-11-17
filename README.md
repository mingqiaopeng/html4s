# html4s

> **HyperText Markup Language For Slides** — 用"一个合法 HTML 文件 + 一个播放器"做演示文稿。
> pptx 的操作习惯 × HTML 的表达力 × 纯文本的 AI 友好度。

设计规范与路线图见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## AI Agent 工具链与 MCP（P1 已上线）

```
node tools/h4s-lint.mjs  <deck>            # 溢出/字号/对比度/结构检查（无头 Edge，零依赖）
node tools/h4s-shot.mjs  <deck>            # 逐页 PNG（AI 视觉自审）
node tools/h4s-pdf.mjs   <deck>            # 矢量 PDF 导出（文本可选中）
node tools/h4s-mcp.mjs                     # MCP server（stdio）
node tools/h4s-slides.mjs insert <deck> --after <id|n> --file <snippet.html>   # 增量插页 + 自动重编页码
node tools/h4s-slides.mjs sync <deck> --build   # 页码重编 + 自动重建 .html4s（消双份真理）
node tools/h4s-fonts.mjs scan --need "字体名"   # 扫描系统字体给内嵌推荐（含 fsType 许可）```

**转场与特效（v0.3.1 播放器）**：20 种转场（原有 6 种 + zoomblur/cube/iris/unfold/rise/dissolve + 遮罩式 curtain/blinds/checkerboard/pixelate）+ 背景特效（清单 `defaults.fx = "stars"|"snow"|"dust"`）+ 页面礼花（`data-h4s-fx="confetti"`）。写法不变：清单 defaults 或每页 `data-h4s-transition`。完整清单见 SKILL.md。

MCP 注册（让 AI Agent 直接调用 lint/shot/outline/build/pdf）：

```
zcode mcp add html4s -- node <路径>/tools/h4s-mcp.mjs
```

AI 创作闭环：**生成 deck → h4s_lint（修错误）→ h4s_shot（视觉自审）→ h4s_build（单文件交付）**。

## 三个创作技能（生成 html4s deck）

| 技能 | 视觉体系来源 | 语言/风格 | 位置 |
|---|---|---|---|
| html4s-ppt-skill | [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)（AGPL-3.0） | 中文 · 电子杂志 + 瑞士国际主义，32 锁定版式 | [skills/html4s-ppt-skill](skills/html4s-ppt-skill/) |
| frontend-slides-html4s | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) | 英文 · 动画丰富 · bold template pack（多模板） | [skills/frontend-slides-html4s](skills/frontend-slides-html4s/) |
| huashu-html4s | [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | 中文 · 三稿探索 · 工作室方法论 · 多媒介 | [skills/huashu-html4s](skills/huashu-html4s/) |

三者共用同一 html4s 契约（清单 + h4s-deck + h4s-notes + 播放器引用）与同一构建/验收工具链；技能内的设计体系、版式文档、工作流保持各自原貌（归属见 NOTICE.md）。桥接验证试点：、。

## 发布

- **[release/html4s-0.3.1-setup.exe](release/html4s-0.3.1-setup.exe)**（10.5MB，Inno Setup 安装器）— **0.3.1 版**
  - 转场 20 种（含 PowerPoint 幕布/百叶窗/棋盘/像素溶解）+ 背景特效（stars/snow/dust）+ 页面礼花（data-h4s-fx="confetti"）
  - h4s-slides 增量编辑（insert/sync 自动重编页码）· h4s-fonts 系统字体扫描 · fsType 嵌入许可检查
  - 中文可读性适配层 v2（全字符 ≥18px）· JS→壳消息通道修复 · lint text-clipped 规则
  - 免安装版：[release/html4s-0.3.1.zip](release/html4s-0.3.1.zip)（9.8MB）· 历史：[0.2](release/html4s-0.2.zip) · [0.1](release/html4s-0.1.zip)
- 开发者在仓库根目录工作（本 README 面向开发流程）



- **[release/html4s-0.1.zip](release/html4s-0.1.zip)**（4.5MB）— 0.1 版安装包：播放器 + skill + 工具 + 示例 + 文档
  - 解压后运行 `install.bat`（注册 `.html4s` 双击关联，用户级）或直接运行 `Html4sPlayer/Html4sPlayer.exe`
  - 发布说明：[docs/RELEASE-NOTES.md](docs/RELEASE-NOTES.md) · 许可归属：[docs/NOTICE.md](docs/NOTICE.md)
- 开发者在仓库根目录工作（本 README 面向开发流程）



## 当前状态（2026-11-17 · v0.3.1）

**已实现并实测**：20 种转场（含 PowerPoint 幕布/百叶窗/棋盘/像素溶解 4 种遮罩式）+ 背景特效层（stars/snow/dust）+ 页面礼花（confetti）；PowerPoint 式浏览界面（页码指示器、双击缩略图放映、深浅色主题联动原生标题栏）；演讲者双窗口（副屏自动放置）+ 同屏抽屉（备注字号可调、下一页预览、计时）；排练计时写回 .timings.json；kiosk（`--kiosk` 直接放映 + 循环 + 隐藏工具条）；深链 `#/页/碎片`；多语言 UI（meta.lang）；kiosk/深链/媒体/排练全链路自动化验证通过。

**工具链**：lint（7 类检查 + --html 分页报告）/ shot / pdf / build（字体子集 + 子集指纹 + fsType 许可）/ slides（insert/move/sync 增量编辑）/ fonts（系统扫描）/ mcp（5 工具已注册）。

**三创作技能**：guizang（电子杂志+瑞士，32 锁定版式，中文可读性适配层 v2）/ frontend-slides / huashu，各含示例 deck 与转场特效演示（examples/fx-showcase.html4s）。

---
## 历史状态（2026-11-10 · P0 播放器原型完成）

`player/h4s.player.js`（约 1000 行，零依赖、无构建、单文件）已实现并经浏览器自动化逐项实测：

| 能力 | 状态 | 说明 |
|---|---|---|
| **PowerPoint 式浏览界面** | ✅ | 打开即缩略图侧栏 + 当前页大预览 + "▶ 放映"按钮；F5/点击 → 全屏放映；Esc 退回浏览 |
| 固定舞台 + 等比缩放 Letterbox | ✅ | 清单 `stage` 声明，`--h4s-scale` 暴露 |
| 导航状态机 | ✅ | 碎片递进 / 非线性跳页=最终状态 / 转场锁排队 |
| 碎片（含 reveal `.fragment` 兼容） | ✅ | 效果 fade-up/slide-left/zoom/fade/none，顺序覆盖，延迟 |
| 转场（WAAPI） | ✅ | fade/slide/push/zoom/wipe/flip/none，尊重 reduced-motion |
| 清单解析 | ✅ | `application/h4s+json`，未知字段宽容 |
| 逐页混合比例 | ✅ | `data-h4s-stage="1024x768"` 单独 Letterbox |
| 总览网格 | ✅ | 实时 DOM 缩略图，键盘可达，点击跳页 |
| 黑屏/白屏 | ✅ | B / W，自动播放挂起 |
| 演讲者抽屉（同屏练习） | ✅ | S 键；下一状态预览 + 备注 + 双计时器 + 舞台让位缩放 |
| 双窗口演讲者视图 | ✅ | BroadcastChannel 总线；舞台持真值，演讲者发命令；需 http 访问 |
| 计时器 / 排练录制 | ✅ | T 暂停；R 录制，`H4S.timings()` 读取 |
| 自动播放 / kiosk | ✅ | `data-h4s-autoslide`、碎片自动排期、`#kiosk` 循环、倒计时条 |
| L4 事件与页内脚本 | ✅ | `h4s:ready/slidechange/fragchange/rehearse` |
| 深链 | ✅ | `#/页/碎片`、`#kiosk`、`#auto=N`、`#presenter` |
| **L0 遗留 deck 适配** | ✅ | 纯 `section` / `.slide` + `.fragment` + `aside.notes`，无清单可播 |
| 无 JS 文档模式 | ✅ | 无幻灯片结构时不接管；deck 自带兜底样式可读可打印 |

### 已知限制（P0 → P1 待办）

- 键盘为标准 `document` 级 keydown（真实浏览器直接可用）；自动化环境（IAB）的 CUA 按键路由不到页面，测试用合成事件完成，**请手动按方向键确认一次真实键盘路径**。
- 混合比例页之间的转场目前是瞬切（未做跨尺寸补间）。
- 排练结果仅在内存/控制台，尚未写回清单文件（P2 桌面壳职责）。
- 独立演讲者窗口依赖 `window.open` + BroadcastChannel，`file://` 下自动降级为本地练习模式。
- 媒体"离开页面自动暂停"已实现，真实视频用例待 P1 补充测试。
- 未开始：lint / 导出 / 字体子集 / 主题库（P1 工具链）。

## 桌面壳播放器（.NET + WebView2，2026-11-10 打通）

**这就是正式的播放器形态**：现代 Chromium 内核（Windows 自带 WebView2），双击 `.html4s` 文件直接演示，也可打开网址播放。无需起任何本地服务。

```
shell\Html4sPlayer\bin\Release\net10.0-windows\Html4sPlayer.exe deck.html4s   # 打开本地文件
Html4sPlayer.exe https://example.com/deck.html4s                              # 打开网址播放
Html4sPlayer.exe deck.html4s --kiosk                                          # kiosk（无边框置顶）
shell\register-html4s.bat       # 注册 .html4s 双击关联（当前用户级，HKCU）
shell\unregister-html4s.bat     # 撤销关联
```

- `Ctrl+L` 运行中换地址/文件；`F11` 全屏；演讲者窗口走 deck 内工具条 `⧉`
- **现代化自绘标题栏**（v0.2）：无边框窗口 + 深色标题栏（应用名/文档标题/打开/网址/最小化/最大化/关闭，纯 GDI 自绘零字体依赖），标题栏可拖拽移动、双击最大化，支持把 `.html4s` 文件拖进窗口打开；放映全屏时标题栏自动隐藏、退出自动恢复；放映中关窗有确认；Ctrl+O/Ctrl+W/Ctrl+L 快捷键（由播放器 JS 经 `chrome.webview.postMessage` 转发，WebView2 键盘独占问题的解法）
- 本地 deck 通过虚拟主机 `https://app.html4s.local/` 映射获得 http 同源语义（BroadcastChannel 双窗口可用）
- **实现细节 1**：WebView2 虚拟主机按扩展名推断 MIME，`.html4s` 会被当下载（且顶层请求不触发 WebResourceRequested 无法拦截），因此壳在 deck 同目录生成隐藏的 `<名字>.h4srender.html` 镜像加载（相对资源引用不变，每次打开自动刷新）
- **实现细节 2**：deck 若用相对路径引用目录外的资源（如 `../player/h4s.player.js`），壳会按 `../` 逃逸层数自动上移虚拟主机映射根，保证引用可解析；窗口标题带"✓播放器已接管 / ✗播放器未加载"诊断标记，可一眼发现静默加载失败
- 局限：单实例占用 WebView2 用户数据目录（再次双击新文件请用 `Ctrl+L` 或先关旧窗口，多实例/单实例激活属 P2）；macOS 路线待 Tauri

## 快速开始

```bash
# 本地服务（演讲者双窗口需要 http；单窗口浏览用 file:// 双击也可以）
python -m http.server 8899
# 打开 http://127.0.0.1:8899/examples/showcase.h4s.html
```

给你的 deck 接入播放器——在 `</body>` 前加一行：

```html
<script src="player/h4s.player.js"></script>
```

### 标记速查

```html
<!-- 清单（可选，缺省 1280×720） -->
<script type="application/h4s+json">
{ "h4s": "1.0",
  "stage": { "width": 1280, "height": 720, "fit": "contain", "background": "#05070a" },
  "defaults": { "transition": { "name": "fade", "duration": 300 },
                "fragment": { "effect": "fade-up", "delay": 150 } } }
</script>

<h4s-deck>
  <h4s-slide id="s1" data-h4s-title="标题"
             data-h4s-transition="zoom"
             data-h4s-autoslide="8"
             data-h4s-stage="1024x768">
    <h1>…</h1>
    <li data-h4s-frag="fade-up" data-h4s-frag-order="2" data-h4s-frag-delay="600">…</li>
    <h4s-notes hidden>演讲者备注（富文本）</h4s-notes>
  </h4s-slide>
</h4s-deck>
```

兼容惯例：`<section>` 子页 / `.slide` / `.fragment` / `aside.notes`（reveal.js、常见 HTML deck 直接可播）。

### 键盘

`→ ↓ 空格 PgDn` 下一步 · `← ↑ PgUp` 上一步 · `数字+Enter` 跳页 · `B/W` 黑白屏 · `G` 总览 · `S` 演讲者抽屉 · `T` 暂停计时 · `R` 排练 · `L` 激光笔 · `F` 全屏 · `Esc` 退出

### 深链

`#/3` 直达第 3 页 · `#/2/3` 第 2 页第 3 个碎片 · `#kiosk` 无人值守循环 · `#auto=8` 全局自动播放 · `#presenter` 演讲者窗口角色

## 目录

```
ARCHITECTURE.md          设计规范 v0.1 + 路线图
player/h4s.player.js     播放器运行时（唯一的硬编码资产）
examples/showcase.h4s.html   全特性参考 deck（验收用例 + AI 创作模板）
examples/hello.h4s.html      最小示例
examples/plain-legacy.html   L0 遗留 deck 适配用例
```

## P1 进展：skill + 构建闭环（2026-11-12）

基于 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)（AGPL-3.0，视觉体系来源）改造出 **html4s 创作闭环**：

```
skills/html4s-ppt-skill/     创作技能：SKILL.md + 双风格模板（已适配 h4s）+ 原版 references
tools/adapt-gz-template.mjs  模板手术：剥离原运行时 → h4s 结构；vw/vh→1920×1080 px；补版式缺失类
tools/make-deck.mjs          deck 组装：slides 片段 + 模板 + 标题/字体/播放信息
tools/h4s-build.mjs          构建：内嵌播放器/lucide/字体子集(pyftsubset) → 单文件 .html4s
examples/html4s-intro.*      试点 deck：8 页瑞士风《把演示文稿还给一个文件》（891KB 单文件）
```

试点验证（浏览器逐页截图 + 壳双击）：S01 封面 / S03 陈述 / S08 双轨对照（碎片） / S02 时间线+KPI / S06 KPI 塔 / S14 闭环 / S10 点阵宣言（自动播放 15s） / S09 收束——字体子集 6 面 ×8-54KB，字形精确落位，缩略图/放映/备注/深链全部工作。

已知坑（详见 SKILL.md）：构建内联代码必须用函数替换器（`$$` 会被字符串 replace 当 `$` 模式展开）；版式文档与模板 CSS 存在漂移（`adapt` 附带版式补充样式表补齐缺失类）。

## 下一步（按路线图）

1. **P1 工具链**：`h4s lint`（舞台溢出检测/豆腐块/字号）→ `h4s shot`（逐页截图）→ MCP server —— 打通 AI "生成→lint→截图→自审→修复"闭环
2. 矢量 PDF 导出（pinned Chromium）
3. P2 壳完善：单实例激活（再次双击→唤起已有窗口加载新 deck）、显示器枚举自动分屏、排练计时写回文件、安装包+文件关联正式化、macOS（Tauri）
