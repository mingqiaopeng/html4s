# html4s 0.3.2 发布说明

发布日期：2026-11-19 · 状态：发布工程 + 规范冻结候选 + 生态起点（阶段 1-4 落地）

## 发布工程（把"重复踩坑"变成"机器把关"）

| 项 | 说明 |
|---|---|
| `tools/release.mjs` 一键发布 | 全 deck 重建 → lint 门禁 → 回归双脚本 → staging **白名单**同步（杜绝 WebView2 缓存误打包）→ 体积阈值检查 → ISCC → zip → 静默安装 → 安装副本自检 |
| 内嵌播放器版本指纹 | 构建注入 `manifest.playerVersion`；播放器浏览模式提示"旧版播放器"（⚠ 徽章 + toast）、lint 报 `W-STALE-PLAYER` —— "版本覆盖缺口"类事故自动检出 |
| GitHub Actions CI | push 即跑：语法检查 / `$$` 完整性 / 全 deck lint / 播放器回归 25 断言（h4s-cdp 支持 Chrome/Chromium 兜底与 `H4S_BROWSER` 环境变量） |
| `h4s-build --share` | 并行产出浏览器直开的 `.share.html` —— "拷一个文件到任何机器"承诺补全（取代 intro-built 手工形态） |

## 规范与语料（v1.0 冻结准备）

- **[docs/SPEC.md](SPEC.md) 规范 v0.9**：从架构文档独立成文，对齐 0.3.2 实现——清单 Schema（含 `playerVersion`/`fontSubsetChars`）、元素与属性注册表、转场 20 种/fx/碎片效果枚举、深链语法、JS API 与事件、版本化兼容策略
- **黄金一致性 deck**：`examples/conformance.html`（25 页覆盖全部转场/fx/碎片/混合内容编辑/混合比例/交互元素）+ `tools/verify-conformance.mjs`（13 断言：指纹/导航/碎片/画布/i18n/深链）——回归基准 + AI 生成对照样板

## 生态与体验

- **MCP 扩展**：`h4s_slides`（insert/move/renumber/sync）+ `h4s_review`（一次调用返回结构化验收结论 verdict/errors/warnings/逐页计数）——共 7 工具
- **导入适配器**：`import-reveal.mjs`（reveal.js → html4s，垂直页平铺/碎片/备注映射）、`import-pptx.mjs`（pptx → html4s 基础版：零依赖 zip 解析、标题/段落/图片 data URI/备注迁移，版式需重套）
- **lint 增强**：W-MEDIA（DOM 级：媒体缺 controls/autoplay 未静音）、按页摘要（🌙 深色页分组聚类）
- **壳设置对话框**（Ctrl+, / 右键标题栏菜单）：界面语言覆盖（跟随演示/中文/English，写入 localStorage 对播放器生效）+ 清空最近打开 + 关于（版本指纹）
- **播放器 i18n 补全**：帮助表/工具条/演讲者窗/网页放映/编辑提示全量双语（zh/en）
- **无障碍**：页码计数器 `aria-live`、工具条按钮 `aria-label`、总览/侧栏格语义化、装饰画布 `aria-hidden`
- **WebHID 翻页笔**（实验性，J 键 / `H4S.connectRemote()`）：常见报告字节模式识别前进/后退/黑屏
- **壳高 DPI 收尾**：对话框按宿主屏真实 DPI 缩放 + `--selftest-dpi` 自测（PrintWindow 安全截图，延时 400ms 防首帧伪影）；Esc 退出壳 F11 全屏同步恢复标题栏

## 修复

- 编辑 Esc 撤销失效（`__h4sOld` 从未赋值）；导出写回失败链路复活（`pendingSave`/`downloadEdited`）+ `.slides` 类 deck 导出定位同规则
- 快照提前到 collectSlides 之前（导出不再被 `h4s-notes-el` 污染）；纯浏览器 Ctrl 系/F11 恢复原生行为；Esc 先关抽屉不结束放映
- 恢复误删的党建 deck 源文件；帮助层版本号纠正

## 0.3.2 基线

- 播放器 `$$` 基线 12 / 单 `$` 37（`tools/check-dollar.mjs`），CI 把关
- 全部 11 个 deck 重建（0.3.2 指纹），lint 0 警告；示例含 `*.share.html` 浏览器直开副本

---

# html4s 0.3.1 发布说明

发布日期：2026-11-16 · 状态：转场特效引擎 + 增量编辑工具

## 新增

| 项 | 说明 |
|---|---|
| 转场 6→20 种 | 页面动画 +6（zoomblur/cube/iris/unfold/rise/dissolve）+ **遮罩式 4 种**（curtain/blinds/checkerboard/pixelate，PowerPoint 幕布风，色彩可配 defaults.transition.color） |
| 背景特效层 | 清单 defaults.fx = stars/snow/dust（零依赖 canvas，仅放映渲染、后台自动暂停） |
| 页面礼花 | slide data-h4s-fx="confetti"——进页爆发一次，收束/表彰专用 |
| h4s-slides 增量编辑 | insert --after 自动重编页码 / sync --build 消双份真理 |
| h4s-fonts | scan --need 扫描系统字体给内嵌推荐；build 集成 fsType 嵌入许可检查 |
| 中文可读性适配层 v2 | 全字符 ≥18px、正文 26px、大字 ×0.8；三个模板内置 |
| 抽屉备注字号 | Web 版演讲者抽屉 A−/A＋ 调节并记忆 |
| lint text-clipped | E-TEXT-CLIP 抓 nowrap/overflow-hidden 文本裁切（架构 §5.3 落地） |
| 文档 | docs/CAPABILITIES.md 壳/Web 能力矩阵；SKILL.md 适配检查清单 + 字号规则 v2 + 转场文档 |

## 修复

- JS→壳消息通道（双重编码解析）：握手/主题联动/排练写回/快捷键转发**真正生效**
- 标题栏浅色联动 + 观察器注入（旧 deck 也能联动）
- 浏览模式启动恢复浅色偏好；页码指示器；双击缩略图放映
- 构建残留 .chars.txt 清理；发布包补 Html4sPlayer.deps.json

## 补丁轮（2026-11-19 重打包 · 全 bug 清查）

**壳（高 DPI 与全屏）**
- 输入/最近打开对话框高 DPI 完全修复：运行时窗体 `AutoScaleMode.Dpi` 是空操作（缩放基线被当场捕获，系数恒 1），改为按宿主屏真实 DPI 手动缩放（GetDpiForWindow），副屏不同缩放比也正确；新增 `--selftest-dpi` 自测模式（日志断言几何，不截屏）
- Esc 退出放映时同步退出壳 F11 无边框全屏（此前标题栏卡在隐藏态）
- 演讲者窗口尺寸按 DPI 缩放

**播放器（10 处 bug，CDP 回归 25 断言全过）**
- **导出写回失败链路复活**：`pendingSave` 从未声明赋值、`downloadEdited` 不存在——写回失败（含从网址打开的 deck）静默丢弃且用户误以为已保存；现在失败自动回退下载并提示
- 导出页面定位与 collectSlides 同规则（`.slides` 类 deck 此前导出整批失效）
- 编辑 **Esc 撤销修复**（`__h4sOld` 从未赋值——Esc 实际是提交而非撤销）
- 编辑快照提前到 collectSlides 之前（导出不再被 `h4s-notes-el` 类污染）
- Ctrl 系/F11 快捷键仅壳环境接管——纯浏览器恢复原生行为（F11 全屏/Ctrl+L 地址栏/Ctrl+R 刷新等）
- Esc 先关演讲者抽屉，不再连带结束放映
- 帮助层版本号纠正（0.2.0 → 0.3.1）；死代码清理（refreshShellButtons 等）
- 全部 10 个 .html4s（含 bridge/媒体示例）用新播放器重建；党建 deck 源文件（误删）已恢复

# html4s 0.3 发布说明（历史）

发布日期：2026-11-14 · 状态：P2 桌面播放器 β + 工具链完善

## 0.3 新特性

| 特性 | 说明 |
|---|---|
| 深色/浅色主题 | 浏览界面 UI 全面深浅双主题（`☀/🌙` 切换，偏好持久化），**原生标题栏同步换色**（含窗口按钮）；任何旧版内嵌播放器的 deck 也能联动（壳注入观察器） |
| 最近打开 | `Ctrl+R` 或标题栏右键 → 最近文件列表（最多 10 条，去重置顶）；打开文件/网址/启动均记录 |
| 浏览模式增强 | 页码指示器（`3 / 8 · 页标题`）实时更新；双击缩略图直接放映该页 |
| lint tofu 检测 | 构建时把子集字符集指纹写入清单，lint 比对 deck 文本——改字未重建精确报 `W-TOFU` |
| Style A 模板试点 | guizang Style A（电子杂志风）5 页示例 deck 走完 模板→lint→shot→build→播放 全链路 |
| MCP 正式注册 | 工作区级 `.zcode/config.json` 注册 h4s-mcp（lint/shot/outline/build/pdf），打开项目即自动连接 |
| 安装器完善 | install.bat 增加桌面快捷方式 + 开始菜单（含卸载项），chcp 65001 防乱码 |
| 三 deck 重建 | guizang/fs/huashu 三份自述 deck 全部内嵌 v0.3 播放器（含字体 unicode-range） |

---
# html4s 0.2 发布说明（历史）

发布日期：2026-11-12 · 版本 0.2.0 · 状态：早期可用（P1 最小闭环）

## 这个包里有什么

| 组件 | 说明 |
|---|---|
| `Html4sPlayer/` | 桌面播放器（.NET 10 + WebView2 壳）。双击 `.html4s` 放映；打开网址播放；浏览模式（缩略图侧栏 + ▶ 放映）；演讲者视图/计时/排练/黑屏白屏/kiosk |
| `player/h4s.player.js` | 播放器运行时（约 60KB 单文件，零依赖）。任何遵循 html4s 约定的 HTML 引入即变播放器 |
| `skill/html4s-ppt-skill/` | AI 创作技能：双风格模板（电子杂志 / 瑞士国际主义）+ 32 种锁定版式 + 质量清单。视觉体系来自 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)（AGPL-3.0），运行时与交付格式已改造为 html4s |
| `tools/` | 构建工具：`adapt-gz-template.mjs`（模板适配）、`make-deck.mjs`（deck 组装）、`h4s-build.mjs`（单文件构建，字体子集内嵌） |
| `examples/` | 示例：`html4s-intro.html4s`（8 页瑞士风完整 deck，双击即演）、showcase（全特性）、hello、plain-legacy（零标记遗留 HTML 可播） |
| `docs/` | `ARCHITECTURE.md` 架构与路线图 · `RELEASE-NOTES.md` 本文件 |

## 安装（Windows 10/11，需 WebView2 运行时——系统自带）

1. 运行 `install.bat`（当前用户级：复制播放器 + 注册 `.html4s` 双击关联，可用 `uninstall.bat` 撤销）
2. 双击 `examples/html4s-intro.html4s` —— 应看到 PowerPoint 式浏览界面，点"▶ 放映"全屏演示

不安装也可以：直接运行 `Html4sPlayer/Html4sPlayer.exe` 打开文件或网址。

## 0.2 新增（在 0.1 基础上）

- **P1 工具链上线**：`tools/h4s-lint.mjs`（舞台溢出/字号/对比度/结构检查，无头 Edge 零依赖）、`h4s-shot.mjs`（逐页 PNG）、`h4s-pdf.mjs`（矢量 PDF 导出）、`h4s-mcp.mjs`（MCP server，把 lint/shot/outline/build/pdf 暴露给 AI Agent）
- **壳 v0.2**：单实例激活（二次双击自动转发给已有窗口）、演讲者窗自动副屏、排练计时写回 `<deck>.timings.json`
- 播放器 0.2.0：排练结束自动转发计时数据给壳

## 0.1 已实现

- 固定 1920×1080 舞台 + 等比缩放 Letterbox（混合比例逐页支持）
- PowerPoint 式浏览界面（缩略图侧栏/大预览/放映按钮）+ 全屏放映 + Esc 返回
- 碎片（兼容 reveal.js `.fragment`）、6 种转场、逐页/全局自动播放、kiosk 循环
- 演讲者视图：同屏抽屉 + 双窗口（BroadcastChannel）、计时/排练/备注
- 黑屏/白屏/总览/激光笔/深链/数字跳页
- 字体声明式内嵌（pyftsubset 子集化，中文 deck 字体 1116KB→34KB）
- 矢量文本（可选中/可检索/可打印），无 JS 优雅降级为文档模式

## 0.1 已知限制

- 仅 Chromium 系内核完整验证（壳用 WebView2；Firefox 基本可用，Safari 未测）
- 单实例：再次双击新文件需先关闭旧窗口（或 Ctrl+L 换文件）
- 混合比例页之间转场为瞬切；排练计时未写回文件
- 生成端 lint / 逐页截图 / MCP 工具、矢量 PDF 导出、macOS 壳：路线图 P1 后半至 P2

## 许可

- html4s 自有代码（播放器/壳/工具）：见仓库 LICENSE（未定稿前按"保留所有权利"处理）
- `skill/` 视觉体系与版式文档派生自 guizang-ppt-skill，遵循 **AGPL-3.0**（见 `LICENSES/`）
