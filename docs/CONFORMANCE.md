# html4s 一致性认证（Conformance）

本文件定义第三方运行时的认证协议。规范文本见 [SPEC.md](SPEC.md)（v1.0-rc1）；认证是 SPEC §9 准入规则的技术执行环节。

## 套件构成

| 组件 | 内容 |
|---|---|
| `examples/conformance.html` | 黄金一致性 deck 源（26 页：12 动画转场 + 4 遮罩 + none、碎片 6 效果、fx 层 + 礼花、混合内容编辑、混合比例、交互元素、声明式图表） |
| `examples/conformance.html4s` | 官方构建产物（内嵌 h4s-core + playerVersion 指纹） |
| `tools/verify-conformance.mjs` | 14 项行为断言（CDP 无头浏览器，含图表渲染） |
| `tools/h4s-lint.mjs --structure` | 结构检查（清单/枚举/指纹/静态扫描） |

## 被测对象要求

第三方运行时需提供一个**等价构建产物**：与官方 `.html4s` 同页数、同清单（可替换 `playerVersion` 为自身 `runtimeVersion`）、按本运行时的方式注入脚本。推荐直接 fork 官方 deck 源并替换播放器引用。

## 运行方法

```bash
git clone https://github.com/mingqiaopeng/html4s && cd html4s
node tools/h4s-build.mjs examples/conformance.html --share   # 或接入你的运行时
node tools/verify-conformance.mjs                            # 13 断言（无头 Chrome/Edge）
node tools/h4s-lint.mjs examples/conformance.html --structure
```

环境要求：Node ≥22（CDP 客户端依赖全局 WebSocket）、Chrome/Edge 任意一个（`H4S_BROWSER` 可指定路径）。

## 过审标准

| # | 断言 |
|---|---|
| 1 | 指纹一致：清单版本字段 === 运行时版本 |
| 2 | 页数 25（舞台持有，克隆不计） |
| 3 | 浏览模式接管 + 侧栏 25 格 |
| 4 | 文字微调标记生效（≥1 可编辑元素） |
| 5 | aria：页码计数器 live + 侧栏语义化 |
| 6 | fx 背景画布存在（defaults.fx） |
| 7 | 全页导航 0→24（转场锁正常释放） |
| 8 | 碎片 fwd 链推进（f=0） |
| 9 | confetti 独立画布 |
| 10 | endShow 回浏览 |
| 11 | 语言覆盖（localStorage）生效 |
| 12-13 | 深链 #/7 直达 + 放映状态 |

另须：结构 lint 0 错误；§9 渲染抽查的 3 页并排截图。

## 提交流程

1. Fork 仓库 → 按上述方法运行 → 将**运行日志 + 截图 + 枚举支持矩阵**附到 Issue/PR
2. 维护者人工验收渲染一致性 → 在 SPEC.md §9 "已准入实现" 登记

## 当前通过状态

| 运行时 | 版本 | 结果 | 日期 |
|---|---|---|---|
| h4s-core（官方参考实现） | 0.4.0 | 14/14 ✓ · 结构 lint 0 错误（本地 + CI Linux/Chrome 双环境） | 2026-11-21 |
