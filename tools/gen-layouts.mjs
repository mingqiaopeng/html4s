#!/usr/bin/env node
/* gen-layouts.mjs — 版式模板库生成器（单一事实源）
 * 13 种典型页面版式（封面/目录/章节页/大字观点/双栏/对比图/流程/时间线/数据看板/引用/图文/清单/收束）
 * → 一键生成：① 版式图鉴 deck（examples/layouts.html）② 逐版式可复制片段（examples/layouts/<id>.html）
 *   ③ 版式样式表（examples/layouts/layouts.css）④ 生成指南（docs/LAYOUTS.md）
 *
 * 设计约定：版式只用 CSS 变量（--bg/--tx/--tx2/--dim/--ac/--bad/--bd/--bd2/--font），
 * 与 gen-themes.mjs 主题库同一套变量——版式可粘进任何主题 deck（主题 × 版式正交）。
 * 用法: node tools/gen-layouts.mjs
 * 之后: node tools/h4s-build.mjs examples/layouts.html --share
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SNIP_DIR = path.join(ROOT, 'examples', 'layouts');

/* ---------- 版式 CSS（变量化基础层） ---------- */
const BASE_CSS = `
:root { --bg:#0d1117; --tx:#e6edf3; --tx2:#c3cfe2; --dim:#8b949e; --ac:#38bdf8; --bad:#ff7b72; --bd:#30363d; --bd2:#21262d;
  --font:'Segoe UI','Microsoft YaHei',sans-serif; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--bg); }
.slide { position: absolute; inset: 0; width: 1920px; height: 1080px; overflow: hidden;
  background: var(--bg); color: var(--tx); font-family: var(--font); }
.h4s-holder > .slide { visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; position: absolute !important; inset: 0 !important; }
.reveal { opacity: 0; transform: translateY(30px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
.slide.visible .reveal { opacity: 1; transform: translateY(0); }
.ly-body { display: flex; flex-direction: column; height: 100%; box-sizing: border-box; padding: 90px 130px; position: relative; }
.ly-head { margin-bottom: 44px; }
.ly-kicker { font-size: 20px; letter-spacing: .3em; color: var(--ac); text-transform: uppercase; margin: 0 0 18px; }
.ly-head h2 { font-size: 64px; font-weight: 600; margin: 0; letter-spacing: -.01em; }
.ly-tag { position: absolute; right: 44px; bottom: 34px; font-size: 18px; color: var(--dim); letter-spacing: .08em; }
`;

/* ---------- 13 种版式（SSOT） ---------- */
const LAYOUTS = [
  {
    id: 'cover', name: '封面', use: '开场定调：产品名 / 一句话价值 / 日期作者',
    css: `
.ly-cover-main { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 150px; }
.ly-cover-main h1 { font-size: 150px; font-weight: 300; letter-spacing: -.03em; margin: 28px 0; }
.ly-cover-sub { font-size: 32px; color: var(--tx2); max-width: 60ch; margin: 0; }
.ly-cover-meta { font-size: 22px; color: var(--ac); letter-spacing: .1em; margin-top: 44px; }`,
    html: `<div class="ly-cover-main">
    <p class="ly-kicker reveal">HYPERTEXT MARKUP FOR SLIDES · OPEN FORMAT</p>
    <h1 class="reveal">html4s</h1>
    <p class="ly-cover-sub reveal">一个合法 HTML 文件 + 一个播放器 = 演示文稿。AI 写得准，人演得稳。</p>
    <p class="ly-cover-meta reveal">HTML4S PROJECT · AGPL-3.0 · 2026</p>
  </div>`,
  },
  {
    id: 'agenda', name: '目录', use: '议程页：章节编号 + 标题 + 一句话导读',
    css: `
.ly-agenda-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 36px; }
.ly-agenda-list li { display: flex; gap: 36px; align-items: baseline; border-bottom: 1px solid var(--bd2); padding-bottom: 30px; }
.ly-agenda-list b { font-size: 64px; font-weight: 300; color: var(--ac); min-width: 110px; }
.ly-agenda-list h3 { font-size: 36px; margin: 0 0 8px; }
.ly-agenda-list p { font-size: 22px; color: var(--dim); margin: 0; }`,
    html: `<ol class="ly-agenda-list">
    <li class="reveal"><b>01</b><div><h3>三重困境</h3><p>为什么现有路线都走不通</p></div></li>
    <li class="reveal"><b>02</b><div><h3>能力与对比</h3><p>八个维度看 html4s 的取舍</p></div></li>
    <li class="reveal"><b>03</b><div><h3>上手与生态</h3><p>安装、创作闭环与主题库</p></div></li>
  </ol>`,
  },
  {
    id: 'divider', name: '章节页', use: '章节分隔：大编号 + 章节名 + 引导语',
    css: `
.ly-divider-main { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 150px; }
.ly-divider-num { font-size: 190px; font-weight: 300; color: var(--ac); opacity: .32; margin: 0; line-height: 1; }
.ly-divider-main h2 { font-size: 96px; font-weight: 600; margin: 12px 0 22px; }
.ly-divider-sub { font-size: 30px; color: var(--dim); margin: 0; }`,
    html: `<div class="ly-divider-main">
    <p class="ly-divider-num reveal">01</p>
    <h2 class="reveal">三重困境</h2>
    <p class="ly-divider-sub reveal">用 AI 做 PPT，三条路都走不通</p>
  </div>`,
  },
  {
    id: 'statement', name: '大字观点', use: '大量文字页：一句核心观点 + 三列支撑段落',
    css: `
.ly-lead { font-size: 44px; line-height: 1.55; margin: 0 0 56px; max-width: 62ch; }
.ly-lead b, .ly-lead strong { color: var(--ac); }
.ly-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 44px; }
.ly-cols h3 { font-size: 24px; color: var(--ac); margin: 0 0 14px; }
.ly-cols p { font-size: 24px; line-height: 1.7; color: var(--tx2); margin: 0; }`,
    html: `<p class="ly-lead reveal">html4s 把<b>"AI 写"和"人演"</b>放到两个都做到位的层上——格式面向 AI 与版本控制，播放器面向现场演播。</p>
    <div class="ly-cols">
      <div class="reveal"><h3>给 AI 的</h3><p>纯文本逐行可 diff、固定舞台排版确定、lint 与截图构成质量闭环。</p></div>
      <div class="reveal"><h3>给讲者的</h3><p>PowerPoint 式浏览界面、双屏演讲者、排练计时写回、kiosk 循环放映。</p></div>
      <div class="reveal"><h3>给观众的</h3><p>一个文件双击即演，20 种转场与特效层，离线可用零依赖。</p></div>
    </div>`,
  },
  {
    id: 'twocol', name: '双栏对照', use: '左右分栏：两条线 / 两类受众 / 方案分解',
    css: `
.ly-two { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
.ly-col { border: 1px solid var(--bd); border-top: 6px solid var(--ac); padding: 40px 44px; box-sizing: border-box; }
.ly-col h3 { font-size: 32px; margin: 0 0 20px; color: var(--ac); }
.ly-col p { font-size: 24px; line-height: 1.7; color: var(--tx2); margin: 0 0 18px; }
.ly-col ul { margin: 0; padding-left: 26px; }
.ly-col li { font-size: 23px; line-height: 1.9; color: var(--tx2); }`,
    html: `<div class="ly-two">
    <div class="ly-col reveal"><h3>格式层 · 给 AI</h3><p>合法 HTML 单文件，语义用自定义元素，行为用 data-* 属性。</p><ul><li>纯文本，git 逐行 diff</li><li>清单内嵌机器可读元数据</li><li>固定舞台，排版确定</li></ul></div>
    <div class="ly-col reveal"><h3>播放器层 · 给讲者</h3><p>专职演播软件，PowerPoint 习惯全保留。</p><ul><li>浏览界面 + 双屏演讲者</li><li>排练计时写回文件</li><li>kiosk / 深链 / 黑屏白屏</li></ul></div>
  </div>`,
  },
  {
    id: 'versus', name: '对比图', use: 'A/B 对比：优劣并置，胜方高亮',
    css: `
.ly-versus { display: grid; grid-template-columns: 1fr 120px 1fr; gap: 0; align-items: stretch; }
.ly-vs-card { border: 1px solid var(--bd); padding: 44px 48px; box-sizing: border-box; }
.ly-vs-card h3 { font-size: 30px; margin: 0 0 22px; }
.ly-vs-card li { font-size: 23px; line-height: 1.95; color: var(--tx2); }
.ly-vs-card.is-win { border: 2px solid var(--ac); }
.ly-vs-card.is-win h3 { color: var(--ac); }
.ly-vs-card.is-win li::marker { color: var(--ac); }
.ly-vs-mid { display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; color: var(--dim); }`,
    html: `<div class="ly-versus">
    <div class="ly-vs-card reveal"><h3>方案 A · 传统路线</h3><ul><li>生成依赖脚本摸黑</li><li>版式黑盒不可预测</li><li>二进制难以版本化</li></ul></div>
    <div class="ly-vs-mid reveal">VS</div>
    <div class="ly-vs-card is-win reveal"><h3>方案 B · html4s ✓</h3><ul><li>AI 直接写 HTML 可审阅</li><li>固定舞台排版确定</li><li>纯文本进 git，单文件分发</li></ul></div>
  </div>`,
  },
  {
    id: 'process', name: '流程图', use: '横向流程：步骤编号 + 名称 + 一行说明',
    css: `
.ly-flow { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; }
.ly-flow li { position: relative; padding: 34px 34px 34px 0; }
.ly-flow li:not(:last-child)::after { content: '→'; position: absolute; right: 6px; top: 42px; font-size: 34px; color: var(--ac); }
.ly-step-n { display: inline-block; font-size: 22px; color: var(--bg); background: var(--ac); border-radius: 8px; padding: 4px 14px; margin-bottom: 18px; font-weight: 700; }
.ly-flow h3 { font-size: 27px; margin: 0 0 12px; }
.ly-flow p { font-size: 21px; line-height: 1.6; color: var(--dim); margin: 0; }`,
    html: `<ol class="ly-flow">
    <li class="reveal"><span class="ly-step-n">1</span><h3>AI 写 deck</h3><p>按 skill 版式生成 HTML 源文件</p></li>
    <li class="reveal"><span class="ly-step-n">2</span><h3>lint 检查</h3><p>溢出 / 字号 / 对比度 / 指纹</p></li>
    <li class="reveal"><span class="ly-step-n">3</span><h3>截图自审</h3><p>逐页 PNG 回给 AI 修复回环</p></li>
    <li class="reveal"><span class="ly-step-n">4</span><h3>构建交付</h3><p>字体子集内嵌成单文件</p></li>
  </ol>`,
  },
  {
    id: 'timeline', name: '时间线', use: '里程碑：节点圆点 + 时间 + 事件',
    css: `
.ly-tline { list-style: none; margin: 72px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; position: relative; }
.ly-tline::before { content: ''; position: absolute; top: 9px; left: 4%; right: 4%; height: 3px; background: var(--bd); }
.ly-tline li { position: relative; padding: 44px 30px 0 0; }
.ly-tline .ly-dot { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 0 5px var(--bg); }
.ly-tline h3 { font-size: 25px; margin: 0 0 10px; color: var(--ac); }
.ly-tline p { font-size: 22px; line-height: 1.6; color: var(--tx2); margin: 0; }`,
    html: `<ol class="ly-tline">
    <li class="reveal"><span class="ly-dot"></span><h3>2026-11 上旬</h3><p>P0 概念验证，规范 v0.1 冻结</p></li>
    <li class="reveal"><span class="ly-dot"></span><h3>2026-11 中旬</h3><p>P1 工具链 + P2 桌面壳 β</p></li>
    <li class="reveal"><span class="ly-dot"></span><h3>2026-11 下旬</h3><p>0.3.x 转场特效 / 编辑 / 发布工程</p></li>
    <li class="reveal"><span class="ly-dot"></span><h3>下一步</h3><p>v1.0 规范冻结 · 生态准入</p></li>
  </ol>`,
  },
  {
    id: 'kpi', name: '数据看板', use: '关键指标：2×2 大数字网格',
    css: `
.ly-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; }
.ly-kpis .stat { border-left: 5px solid var(--ac); padding-left: 34px; }
.ly-kpis .n { font-size: 110px; font-weight: 300; letter-spacing: -.02em; line-height: 1.05; }
.ly-kpis .l { font-size: 22px; letter-spacing: .14em; color: var(--dim); text-transform: uppercase; }`,
    html: `<div class="ly-kpis">
    <div class="stat reveal"><span class="n">20</span><span class="l">种转场（含 4 种遮罩）</span></div>
    <div class="stat reveal"><span class="n">13</span><span class="l">种典型版式</span></div>
    <div class="stat reveal"><span class="n">45s</span><span class="l">CI 回归全绿用时</span></div>
    <div class="stat reveal"><span class="n">1</span><span class="l">个文件双击即演</span></div>
  </div>`,
  },
  {
    id: 'quote', name: '引用页', use: '金句 / 原则 / 用户证言',
    css: `
.ly-quote { margin: 0; max-width: 1300px; }
.ly-quote p { font-size: 66px; line-height: 1.5; font-weight: 300; margin: 0 0 40px; }
.ly-quote p::before { content: '“'; color: var(--ac); margin-right: 6px; }
.ly-quote p::after { content: '”'; color: var(--ac); margin-left: 6px; }
.ly-quote cite { font-size: 26px; color: var(--dim); font-style: normal; letter-spacing: .08em; }`,
    html: `<blockquote class="ly-quote reveal">
    <p>工具选型的诚实边界，比"万能"更有说服力。</p>
    <cite>—— html4s 设计原则 · 诚实说明不适用场景</cite>
  </blockquote>`,
  },
  {
    id: 'media', name: '图文页', use: '左图右文：把占位块换成 <img>',
    css: `
.ly-media { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; flex: 1; }
.ly-media-img { border: 2px dashed var(--bd); border-radius: 12px; min-height: 640px; display: flex; align-items: center; justify-content: center; color: var(--dim); font-size: 26px; background: var(--bg2, rgba(255,255,255,.03)); }
.ly-media-txt h3 { font-size: 40px; margin: 0 0 24px; }
.ly-media-txt p { font-size: 25px; line-height: 1.75; color: var(--tx2); margin: 0 0 18px; }`,
    html: `<div class="ly-media">
    <div class="ly-media-img reveal">图片占位——替换为 &lt;img src="…"&gt;</div>
    <div class="ly-media-txt reveal">
      <h3>界面即证明</h3><p>PowerPoint 式浏览界面：缩略图侧栏、页码指示器、舞台预览。</p>
      <p>放映、编辑、特效三种形态各有一张截图——图为封面页实拍。</p>
    </div>
  </div>`,
  },
  {
    id: 'list', name: '要点清单', use: '图标 + 标题 + 说明行的能力清单',
    css: `
.ly-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 30px 56px; }
.ly-list li { display: flex; gap: 24px; align-items: flex-start; border-bottom: 1px solid var(--bd2); padding-bottom: 24px; }
.ly-list .ly-ico { font-size: 40px; line-height: 1.2; }
.ly-list b { font-size: 26px; display: block; margin-bottom: 8px; }
.ly-list p { font-size: 22px; line-height: 1.6; color: var(--dim); margin: 0; }`,
    html: `<ul class="ly-list">
    <li class="reveal"><span class="ly-ico">📦</span><div><b>一个文件，双击即演</b><p>运行时/图标/字体全部内嵌，离线可用</p></div></li>
    <li class="reveal"><span class="ly-ico">🎬</span><div><b>播放器专职演播</b><p>20 种转场、特效层、演讲者双屏</p></div></li>
    <li class="reveal"><span class="ly-ico">🤖</span><div><b>AI 创作闭环</b><p>lint / 截图 / 构建指纹 / MCP</p></div></li>
    <li class="reveal"><span class="ly-ico">🇨🇳</span><div><b>中文演示优先</b><p>正文 26px 下限，字体子集 1116KB→34KB</p></div></li>
  </ul>`,
  },
  {
    id: 'closing', name: '收束页', use: '收束 + 行动号召（居中构图）',
    css: `
.ly-close { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.ly-close h2 { font-size: 110px; font-weight: 300; letter-spacing: -.03em; margin: 30px 0; }
.ly-close .ly-close-sub { font-size: 28px; color: var(--tx2); margin: 0 0 30px; }
.ly-close .ly-cta { font-size: 23px; color: var(--ac); letter-spacing: .14em; margin: 0; }`,
    html: `<div class="ly-close">
    <p class="ly-kicker reveal">CLOSING · GITHUB</p>
    <h2 class="reveal">一个文件，<br>双击即演。</h2>
    <p class="ly-close-sub reveal">github.com/mingqiaopeng/html4s · AGPL-3.0</p>
    <p class="ly-cta reveal">STAR · FORK · ISSUE · CONTRIBUTION WELCOME</p>
  </div>`,
  },
];

/* ---------- 组装版式图鉴 deck ---------- */
const page = (L, i) => `<section class="slide" data-h4s-title="${L.name}">
  <div class="ly-body">
    <div class="ly-head"><p class="ly-kicker reveal">LAYOUT ${String(i + 1).padStart(2, '0')} · ${L.id.toUpperCase()}</p><h2 class="reveal">${L.name}</h2></div>
${L.html}
    <div class="ly-tag">版式 · ${L.name} · 片段 examples/layouts/${L.id}.html</div>
  </div>
  <h4s-notes hidden>版式「${L.name}」：${L.use}。复制片段文件后替换样例文案即可。</h4s-notes>
</section>
`;

const manifest = {
  h4s: '1.0',
  meta: { title: 'html4s 版式图鉴 · 13 种典型页面版式', lang: 'zh-CN', author: 'Html4s Project' },
  id: 'layouts',
  stage: { width: 1920, height: 1080, fit: 'contain', background: '#0d1117' },
  defaults: { transition: { name: 'fade', duration: 400 } },
  fonts: [],
};

const deck = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>html4s 版式图鉴 · 13 种典型页面版式</title>
<script type="application/h4s+json">
${JSON.stringify(manifest, null, 2)}
</script>
</head>
<body>
<h4s-deck>

<!-- gen-layouts.mjs · 版式模板库图鉴：13 种典型页面版式（同内容样例 · CSS 变量主题化） -->
<style>${BASE_CSS}
${LAYOUTS.map((L) => L.css).join('\n')}</style>

${LAYOUTS.map(page).join('')}
</h4s-deck>
<script src="../player/h4s.player.js"></script>
</body>
</html>
`;

fs.mkdirSync(SNIP_DIR, { recursive: true });
fs.writeFileSync(path.join(ROOT, 'examples', 'layouts.html'), deck, 'utf8');

/* ---------- 逐版式片段 + layouts.css ---------- */
const cssFile = `/* layouts.css — html4s 版式模板库样式（gen-layouts.mjs 生成）
   用法：把 <section> 片段粘进 deck 后，引入本文件（或拷贝所需规则）。
   全部颜色走 CSS 变量——与 gen-themes.mjs 主题库同一套变量，自动适配任何主题。
   变量：--bg/--tx/--tx2/--dim/--ac/--bad/--bd/--bd2/--font */
${BASE_CSS}
${LAYOUTS.map((L) => L.css).join('\n')}
`;
fs.writeFileSync(path.join(SNIP_DIR, 'layouts.css'), cssFile, 'utf8');

for (const L of LAYOUTS) {
  const snip = `<!-- 版式「${L.name}」（ly-${L.id === L.id ? L.id : ''}${L.id}）· 适用：${L.use}
     依赖 layouts.css 的 .ly-${L.id} 规则；data-h4s-title 供浏览侧栏/总览显示 -->
${L.html}
`;
  fs.writeFileSync(path.join(SNIP_DIR, L.id + '.html'), snip, 'utf8');
}

/* ---------- 生成指南 docs/LAYOUTS.md ---------- */
const catalog = LAYOUTS.map((L, i) =>
  `| ${String(i + 1).padStart(2, '0')} | [\`${L.id}\`](../examples/layouts/${L.id}.html) | ${L.name} | ${L.use} |`).join('\n');

const guide = `# html4s 版式模板库 · 生成指南

13 种典型页面版式（对标常见 deck 设计软件的内置版式），由 \`tools/gen-layouts.mjs\` 单一事实源生成。**主题 × 版式正交**：版式只用 CSS 变量（与[主题库](LAYOUTS.md)同一套变量），粘进任何主题 deck 自动适配配色。

## 版式目录

| # | 片段 | 版式 | 适用场景 |
|---|---|---|---|
${catalog}

在线预览：**https://mingqiaopeng.github.io/html4s/decks/layouts.html**（版式图鉴 deck，每页右下角标注片段文件名）。

## 使用三步（人类 / AI Agent 通用）

1. **选版式**：按页面意图从目录表选择（对比 → \`versus\`；步骤 → \`process\`；议程 → \`agenda\`…）
2. **复制填充**：把 \`examples/layouts/<id>.html\` 片段粘进你的 deck（\`<h4s-deck>\` 内），替换样例文案——保持 class 与结构不动，只改文字/数据
3. **引入样式**：确保 deck 引入 \`examples/layouts/layouts.css\`（整文件引入，或按需拷贝该版式的规则）；随后 \`h4s-lint\` → \`h4s-shot\` → \`h4s-build\` 走标准闭环

## 主题适配

版式只用以下变量（与 \`tools/gen-themes.mjs\` 主题库一致）：

| 变量 | 用途 |
|---|---|
| \`--bg\` / \`--tx\` / \`--tx2\` | 页面底色 / 主文字 / 次级文字 |
| \`--ac\` / \`--bad\` | 强调色（编号/边框/图标）/ 风险色 |
| \`--dim\` / \`--bd\` / \`--bd2\` | 弱化文字 / 主边框 / 次边框 |
| \`--font\` | 字体栈 |

把版式片段粘进 \`gen-themes.mjs\` 生成的主题 deck（或任何定义了这些变量的 deck）即自动换肤——**同一个版式在不同主题下呈现完全不同的气质**。

## AI 生成指南（Agent 工作流）

- 生成 deck 前先读本文件选版式；一页一个版式，不要混叠多个版式的结构
- 保持片段的 **DOM 结构与 class 不动**（版式的几何与响应式全靠它们），只替换文本、数字、图片
- 图片页（\`media\`）的占位块替换为 \`<img src="…">\`，并给图配 \`data-h4s-title\`
- 替换文案后必须走 \`h4s-lint → h4s-shot → h4s-build\` 闭环（大量文字页优先检查 \`statement\` 溢出）
- 页面右下角 \`ly-tag\` 标注了片段来源，正式交付时可删除该行

## 变更

- 版式由 \`tools/gen-layouts.mjs\` 生成——**改版式请改生成器再重新生成**，勿直接手改产物
- v1（2026-11-21）：13 版式首发
`;

fs.writeFileSync(path.join(ROOT, 'docs', 'LAYOUTS.md'), guide, 'utf8');

console.log('生成完成:');
console.log('  图鉴 deck: examples/layouts.html（' + LAYOUTS.length + ' 页）');
console.log('  片段+样式: examples/layouts/（' + (LAYOUTS.length + 1) + ' 个文件）');
console.log('  生成指南: docs/LAYOUTS.md');
