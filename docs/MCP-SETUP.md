# MCP 接入指南

html4s 把工具链暴露为 MCP（Model Context Protocol）server——AI Agent（ZCode / Claude Desktop / Cursor 等）打开项目即可调用。

## 工具一览（8 个）

| 工具 | 功能 |
|---|---|
| `h4s_lint` | deck 质量检查：舞台溢出 / 字号 / 对比度 / 结构 / 图表数据 |
| `h4s_shot` | 逐页渲染 PNG（AI 视觉自审） |
| `h4s_outline` | 读取 deck 结构（页数 / 标题 / 备注 / 清单） |
| `h4s_build` | 构建单文件 .html4s（字体子集内嵌，可选 `--share` 浏览器直开副本） |
| `h4s_pdf` | 导出矢量 PDF（1920×1080，文本可选中） |
| `h4s_slides` | 增量编辑：insert（插页）/ move（排序）/ renumber / sync（重编页码+重建） |
| `h4s_review` | 一键验收：lint → 结构化结论（verdict / errors / warnings / 逐页计数） |
| `h4s_scaffold` | deck 脚手架：主题 + Markdown 大纲 → 完整 starter deck |

## ZCode 注册（工作区级，打开项目自动连接）

`.zcode/config.json`：

```json
{
  "mcpServers": {
    "html4s": {
      "command": "node",
      "args": ["D:\\MyProjects\\Html4s\\tools\\h4s-mcp.mjs"]
    }
  }
}
```

或命令行：`zcode mcp add html4s -- node D:\MyProjects\Html4s\tools\h4s-mcp.mjs`

## 其他客户端

通用 stdio 配置（Claude Desktop / Cursor 等）：

```json
{ "command": "node", "args": ["<仓库路径>/tools/h4s-mcp.mjs"] }
```

## 推荐工作流

```
h4s_scaffold（主题+大纲 → 雏形）→ 填充内容 → h4s_lint / h4s_review（质量门）
→ h4s_shot（逐页自审）→ 修复回环 → h4s_build --share（单文件交付）
```

决策依据（主题/骨架/版式选择）见 [DECK-DESIGN.md](DECK-DESIGN.md)；版式片段见 `examples/layouts/`。

## 注意

- 依赖 Node ≥22（CDP 的 WebSocket）与 Edge/Chrome（无头渲染；`H4S_BROWSER` 可指定路径）
- `h4s_review`/`h4s_lint` 在 CI 中以 `--structure` 模式运行（渲染检查依赖字体环境，由 release 管线在真实环境执行）
