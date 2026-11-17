/* 在 docs/RELEASE-NOTES.md 顶部插入 0.3 发布说明 */
import fs from 'node:fs';

const p = 'D:/MyProjects/Html4s/docs/RELEASE-NOTES.md';
const v03 = [
  '# html4s 0.3 发布说明',
  '',
  '发布日期：2026-11-14 · 状态：P2 桌面播放器 β + 工具链完善',
  '',
  '## 0.3 新特性',
  '',
  '| 特性 | 说明 |',
  '|---|---|',
  '| 深色/浅色主题 | 浏览界面 UI 全面深浅双主题（`☀/🌙` 切换，偏好持久化），**原生标题栏同步换色**（含窗口按钮）；任何旧版内嵌播放器的 deck 也能联动（壳注入观察器） |',
  '| 最近打开 | `Ctrl+R` 或标题栏右键 → 最近文件列表（最多 10 条，去重置顶）；打开文件/网址/启动均记录 |',
  '| 浏览模式增强 | 页码指示器（`3 / 8 · 页标题`）实时更新；双击缩略图直接放映该页 |',
  '| lint tofu 检测 | 构建时把子集字符集指纹写入清单，lint 比对 deck 文本——改字未重建精确报 `W-TOFU` |',
  '| Style A 模板试点 | guizang Style A（电子杂志风）5 页示例 deck 走完 模板→lint→shot→build→播放 全链路 |',
  '| MCP 正式注册 | 工作区级 `.zcode/config.json` 注册 h4s-mcp（lint/shot/outline/build/pdf），打开项目即自动连接 |',
  '| 安装器完善 | install.bat 增加桌面快捷方式 + 开始菜单（含卸载项），chcp 65001 防乱码 |',
  '| 三 deck 重建 | guizang/fs/huashu 三份自述 deck 全部内嵌 v0.3 播放器（含字体 unicode-range） |',
  '',
  '---',
  '',
].join('\n');

let s = fs.readFileSync(p, 'utf8');
fs.writeFileSync(p, v03 + s.replace(/^# html4s 0\.1 发布说明/, '# html4s 0.2 发布说明（历史）'));
console.log('release notes updated');
