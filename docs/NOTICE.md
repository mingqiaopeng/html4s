# 组件许可与归属（NOTICE）

## html4s 自有组件

- `player/h4s.player.js`、`shell/Html4sPlayer/`、`tools/*.mjs`、`docs/ARCHITECTURE.md`
- 版权 © 2026 Html4s Project。许可证未定稿前按"保留所有权利"处理；正式开源时将在此更新（播放器与工具链计划采用宽松许可，与 AGPL 部分分离）。

## 派生内容（AGPL-3.0）

- `skill/html4s-ppt-skill/` 的视觉体系（电子杂志风/瑞士国际主义双风格）、版式骨架、主题色预设、质量清单（`references/`）**派生自**：
  - **guizang-ppt-skill** — Copyright © 2026 op7418（歸藏）
  - 原项目：<https://github.com/op7418/guizang-ppt-skill>（AGPL-3.0）
- 按 AGPL-3.0 要求：分发本包即附带其许可证文本（`LICENSES/AGPL-3.0.txt`）；对本 skill 的修改（运行时替换为 html4s 播放器、固定舞台改造、备注契约调整）同样以 AGPL-3.0 提供，完整源码见项目仓库 `vendor/guizang-ppt-skill/`（原版）与 `skills/html4s-ppt-skill/`（改造版）。

## 第三方运行时依赖

- **WebView2 Runtime**（Microsoft，随 Windows 10/11 分发）— 桌面壳渲染内核
- **lucide**（ISC License）— 图标库，构建期内嵌进 deck（ISC 文本见 lucide 仓库）
- **Noto Sans SC**（SIL Open Font License 1.1）— 示例 deck 内嵌字体
- **fontsource** 项目打包的字体子集文件（OFL 1.1）
- **fontTools / brotli**（Python 软件许可）— 构建期字体子集化工具（MIT/BSD 系）

以上均以各自许可证提供，本包的分发不改变其许可。
