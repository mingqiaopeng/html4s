# html4s 主题规范（theme.json v1）

主题 = deck 的**表现层**（色板 / 字体 / 装饰 / 签名转场 / 特效氛围），与内容、版式完全正交：同一份内容 × 任意主题 × 任意版式自由组合。本文件定义**主题文件**的正式格式与投稿流程。

## 主题文件格式

`themes/<id>.theme.json`：

```json
{
  "id": "sunset",
  "label": "落日暖橙",
  "desc": "暖橙浅色：晨昏光感，适合文化与生活方式主题",
  "transition": "slide",
  "fx": "none",
  "vars": {
    "--bg": "#fff7ee",
    "--tx": "#2b1d12",
    "--tx2": "#4a3a2a",
    "--dim": "#7a5f47",
    "--ac": "#9a4a0c",
    "--bad": "#b3261e",
    "--bd": "#ead9c3",
    "--bd2": "#f3e8d8",
    "--font": "'Segoe UI','Microsoft YaHei',sans-serif"
  },
  "deco": ".slide::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 10px; background: linear-gradient(90deg, #9a4a0c, #e8a34d); }"
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✓ | 主题标识（`[a-z]` + `-`），不得与内置冲突 |
| `label` | ✓ | 显示名 |
| `desc` | 建议 | 一句话定位（演示站画廊展示） |
| `transition` | 建议 | 签名转场（SPEC §5 枚举；主题与全局转场联动） |
| `fx` | 建议 | 特效氛围：`stars` / `snow` / `dust` / `none` |
| `vars` | ✓ | CSS 变量集，**必须包含全套九变量**（下表） |
| `deco` | 建议 | 主题装饰 CSS（任意规则；建议只做氛围不做布局） |

## 变量全套（九变量缺一不可）

| 变量 | 用途 | 对比度要求 |
|---|---|---|
| `--bg` | 页面底色 | — |
| `--tx` / `--tx2` | 主文字 / 次级文字 | 对 `--bg` ≥ 7:1 / ≥ 4.5:1 |
| `--dim` | 弱化文字（18-22px 处使用） | 对 `--bg` ≥ 4.5:1 |
| `--ac` | 强调色（kicker/编号/边框/图表） | 对 `--bg` ≥ 4.5:1 |
| `--bad` | 风险/错误色 | 对 `--bg` ≥ 3:1 |
| `--bd` / `--bd2` | 主边框 / 次边框 | 装饰性，无硬性要求 |
| `--font` | 字体栈 | — |

## 工具链

```bash
node tools/gen-themes.mjs --validate themes/my.theme.json   # 校验格式与 id 冲突
node tools/gen-themes.mjs                                    # 生成全部变体（内置 + themes/*.theme.json）
node tools/h4s-build.mjs examples/intro-my.html --share      # 构建变体 deck
node tools/gen-deck.mjs --theme my --title "…" --outline a.md  # 用该主题组装任意 deck
node tools/gen-deck.mjs --apply? / gen-themes --apply deck.html --theme my  # 给已有 deck 套主题层
```

`--apply` 只注入 CSS 变量与装饰层——对使用 CSS 变量的 deck（gen-deck 产物 / 版式库）即换肤；字面量色值的 deck 不受影响。

## 内置主题（9）

darktech 深色科技 · swiss 瑞士克莱因蓝 · partyred 党建红 · magazine 电子杂志 · ink 水墨编辑 · aurora 极光渐变 · light 晨雾浅色 · terminal 终端绿 · sunset 落日暖橙 · emerald 翡翠深绿（10，含 darktech 本体说明见 [DECK-DESIGN.md](DECK-DESIGN.md) §1）。

## 投稿流程

1. 按 §1 写 `themes/<id>.theme.json`（色板过 §对比度要求——用 `h4s-lint` 对变体 deck 自测）
2. `node tools/gen-themes.mjs --validate themes/<id>.theme.json` 通过
3. 生成变体 → `h4s-shot` 逐页截图（证明在封面/内容/表格三类页面上可读）
4. PR 附截图与设计说明 → 合并后自动进入演示站画廊
