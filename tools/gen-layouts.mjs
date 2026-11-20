#!/usr/bin/env node
/* gen-layouts.mjs — 版式模板库生成器（单一事实源）
 * ${LAYOUTS.length} 种典型页面版式（封面/目录/章节页/大字观点/双栏/对比图/流程/时间线/数据看板/引用/图文/清单/收束）
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
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SNIP_DIR = path.join(ROOT, 'examples', 'layouts');

/* ---------- 版式 CSS（变量化基础层） ---------- */
export const BASE_CSS = `
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
export const LAYOUTS = [
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
    id: 'list', name: '要点清单', use: '图标 + 标题 + 说明行（data-h4s-icon 声明式图标）',
    css: `
.ly-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 30px 56px; }
.ly-list li { display: flex; gap: 24px; align-items: flex-start; border-bottom: 1px solid var(--bd2); padding-bottom: 24px; }
.ly-list .ly-ico { font-size: 40px; line-height: 1.2; color: var(--ac); }
.ly-list b { font-size: 26px; display: block; margin-bottom: 8px; }
.ly-list p { font-size: 22px; line-height: 1.6; color: var(--dim); margin: 0; }`,
    html: `<ul class="ly-list">
    <li class="reveal"><span class="ly-ico" data-h4s-icon="download"></span><div><b>一个文件，双击即演</b><p>运行时/图标/字体全部内嵌，离线可用</p></div></li>
    <li class="reveal"><span class="ly-ico" data-h4s-icon="layers"></span><div><b>播放器专职演播</b><p>20 种转场、特效层、演讲者双屏</p></div></li>
    <li class="reveal"><span class="ly-ico" data-h4s-icon="zap"></span><div><b>AI 创作闭环</b><p>lint / 截图 / 构建指纹 / MCP</p></div></li>
    <li class="reveal"><span class="ly-ico" data-h4s-icon="globe"></span><div><b>中文演示优先</b><p>正文 26px 下限，字体子集 1116KB→34KB</p></div></li>
  </ul>`,
  },
  {
    id: 'checklist', name: '对勾清单', use: '完成项 / 检查表：对勾图标 + 陈述',
    css: `
.ly-check { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 26px; max-width: 1300px; }
.ly-check li { display: flex; gap: 22px; align-items: flex-start; }
.ly-check .ly-ck { color: var(--ac); font-size: 30px; flex: none; margin-top: 2px; }
.ly-check b { font-size: 27px; display: block; margin-bottom: 6px; }
.ly-check p { font-size: 22px; line-height: 1.6; color: var(--dim); margin: 0; }`,
    html: `<ul class="ly-check">
    <li class="reveal"><span class="ly-ck" data-h4s-icon="check"></span><div><b>格式合法</b><p>.html4s 即合法 HTML，浏览器打开兜底</p></div></li>
    <li class="reveal"><span class="ly-ck" data-h4s-icon="check"></span><div><b>数据可校验</b><p>声明式图表与清单，lint 逐项把关</p></div></li>
    <li class="reveal"><span class="ly-ck" data-h4s-icon="check"></span><div><b>分发零门槛</b><p>单文件 + share 副本 + 桌面客户端</p></div></li>
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
  {
    id: 'chart', name: '图表页', use: '数据可视化：声明式 h4s-chart（AI 写数据不写图）',
    css: `
.ly-chart-points { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 26px; }
.ly-chart-points p { font-size: 22px; color: var(--dim); margin: 0; }
.ly-chart-points b { color: var(--ac); }
h4s-chart { min-height: 540px; }`,
    html: `<h4s-chart type="bar" class="reveal" style="height:540px">
    [{"label":"营收","value":4200},{"label":"利润","value":3100},{"label":"现金流","value":5600},{"label":"海外","value":1800}]
  </h4s-chart>
  <div class="ly-chart-points">
    <p class="reveal"><b>42%</b> — 营收增速，三年新高</p>
    <p class="reveal"><b>31%</b> — 利润率改善来自结构优化</p>
    <p class="reveal"><b>1800万</b> — 海外市场首年突破</p>
  </div>`,
  },
  {
    id: 'quadrant', name: '四象限', use: '定位 / 优先级：两轴四格',
    css: `
.ly-quad { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 4px; background: var(--bd); border: 2px solid var(--bd); flex: 1; }
.ly-q { background: var(--bg); padding: 40px 44px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; }
.ly-q b { font-size: 28px; color: var(--ac); }
.ly-q p { font-size: 23px; color: var(--tx2); margin: 0; }
.ly-q.is-do { background: rgba(56, 189, 248, .08); }`,
    html: `<div class="ly-quad">
    <div class="ly-q is-do reveal"><b>高影响 · 低成本</b><p>立即做：AI 创作闭环</p></div>
    <div class="ly-q reveal"><b>高影响 · 高成本</b><p>规划做：macOS 壳</p></div>
    <div class="ly-q reveal"><b>低影响 · 低成本</b><p>顺手做：文档补齐</p></div>
    <div class="ly-q reveal"><b>低影响 · 高成本</b><p>不做：实时协作</p></div>
  </div>`,
  },
  {
    id: 'hierarchy', name: '层级架构', use: '组织 / 递进：顶层 + 子节点',
    css: `
.ly-hier { display: flex; flex-direction: column; flex: 1; gap: 0; }
.ly-hier-top { align-self: center; border: 2px solid var(--ac); color: var(--ac); font-size: 30px; padding: 20px 60px; border-radius: 10px; }
.ly-hier-link { align-self: center; width: 3px; height: 46px; background: var(--bd); }
.ly-hier-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; }
.ly-hier-node { border: 1px solid var(--bd); border-top: 5px solid var(--ac); padding: 30px 34px; box-sizing: border-box; }
.ly-hier-node b { font-size: 26px; display: block; margin-bottom: 10px; }
.ly-hier-node p { font-size: 21px; color: var(--dim); margin: 0; }`,
    html: `<div class="ly-hier">
    <div class="ly-hier-top reveal">html4s 双宿主架构</div>
    <div class="ly-hier-link reveal"></div>
    <div class="ly-hier-row">
      <div class="ly-hier-node reveal"><b>格式层</b><p>合法 HTML 单文件 · 清单 · 自定义元素</p></div>
      <div class="ly-hier-node reveal"><b>播放器层</b><p>零依赖运行时 · 转场特效 · 编辑</p></div>
      <div class="ly-hier-node reveal"><b>工具链层</b><p>lint / shot / build / MCP 闭环</p></div>
    </div>
  </div>`,
  },
  {
    id: 'table', name: '表格页', use: '结构化数据：表头 + 数据行',
    css: `
.ly-table { width: 100%; border-collapse: collapse; font-size: 23px; line-height: 1.55; }
.ly-table th { text-align: left; color: var(--ac); font-weight: 600; padding: 16px 22px; border-bottom: 2px solid var(--ac); }
.ly-table td { padding: 15px 22px; color: var(--tx2); border-bottom: 1px solid var(--bd2); }`,
    html: `<table class="ly-table">
    <tr><th>里程碑</th><th>交付</th><th>状态</th></tr>
    <tr><td>2026-11 上旬</td><td>P0 概念验证 · 规范 v0.1</td><td>✅ 完成</td></tr>
    <tr><td>2026-11 中旬</td><td>P1 工具链 · P2 桌面壳</td><td>✅ 完成</td></tr>
    <tr><td>2026-11 下旬</td><td>0.3.x 转场 / 编辑 / 发布工程</td><td>✅ 完成</td></tr>
    <tr><td>下一步</td><td>0.4.0 图表与脚手架</td><td>🚧 进行中</td></tr>
  </table>`,
  },
  {
    id: 'dual', name: '双图并置', use: '两张图 / 两种形态并排比较',
    css: `
.ly-dual { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; flex: 1; }
.ly-dual-item { margin: 0; display: flex; flex-direction: column; gap: 14px; }
.ly-dual-img { flex: 1; border: 2px dashed var(--bd); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--dim); font-size: 24px; min-height: 400px; }
.ly-dual-item figcaption { font-size: 21px; color: var(--dim); text-align: center; }`,
    html: `<div class="ly-dual">
    <figure class="ly-dual-item reveal"><div class="ly-dual-img">桌面版截图占位</div><figcaption>桌面版：全功能演播（写回 / 双屏 / kiosk）</figcaption></figure>
    <figure class="ly-dual-item reveal"><div class="ly-dual-img">浏览器版截图占位</div><figcaption>浏览器版：自动降级，分享零门槛</figcaption></figure>
  </div>`,
  },
  {
    id: 'appendix', name: '附录页', use: '备查数据 / 详细表格（正文讲完再翻）',
    css: `
.ly-appx { width: 100%; border-collapse: collapse; font-size: 21px; line-height: 1.5; }
.ly-appx th { text-align: left; color: var(--ac); padding: 12px 18px; border-bottom: 2px solid var(--ac); }
.ly-appx td { padding: 11px 18px; color: var(--tx2); border-bottom: 1px solid var(--bd2); }`,
    html: `<table class="ly-appx">
    <tr><th>环境</th><th>能力</th><th>入口</th></tr>
    <tr><td>桌面壳</td><td>双屏演讲者 / 排练写回 / kiosk / 文件写回</td><td>Ctrl+D 演示站 · Ctrl+R 最近</td></tr>
    <tr><td>浏览器</td><td>放映 / 文字微调（降级）</td><td>拖入或 share.html 直开</td></tr>
    <tr><td>AI Agent</td><td>lint / shot / build / scaffold</td><td>MCP 7 工具</td></tr>
    <tr><td>CI</td><td>结构 lint + CDP 回归</td><td>push 自动</td></tr>
  </table>`,
  },
  {
    id: 'subtitle', name: '副标题页', use: '主标题 + 副标题分层定调（比封面信息多一层）',
    css: `
.ly-sub-main { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 150px; }
.ly-sub-main h1 { font-size: 110px; font-weight: 300; margin: 0 0 30px; }
.ly-sub-tag { font-size: 36px; color: var(--ac); margin: 0 0 20px; }
.ly-sub-meta { font-size: 20px; color: var(--dim); letter-spacing: .1em; }`,
    html: `<div class="ly-sub-main">
    <h1 class="reveal">重新发明演示文稿</h1>
    <p class="ly-sub-tag reveal">一个合法 HTML 文件，一个专职播放器。</p>
    <p class="ly-sub-meta reveal">HTML4S PROJECT · 2026</p>
  </div>`,
  },
  {
    id: 'transitional', name: '过渡问句', use: '章节间抛出问题，制造悬念',
    css: `
.ly-trans-main { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 150px; }
.ly-trans-main h2 { font-size: 88px; font-weight: 300; margin: 26px 0; }
.ly-trans-sub { font-size: 26px; color: var(--dim); margin: 0; }`,
    html: `<div class="ly-trans-main">
    <p class="ly-kicker reveal">QUESTION</p>
    <h2 class="reveal">为什么现有路线走不通？</h2>
    <p class="ly-trans-sub reveal">答案在下一章。</p>
  </div>`,
  },
  {
    id: 'threecol', name: '三列卡片', use: '三个并列要点（特性/路线/支柱）',
    css: `
.ly-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 44px; flex: 1; align-content: start; }
.ly-three-card { background: color-mix(in srgb, var(--ac) 5%, var(--bg)); border-radius: 12px; padding: 40px 38px; box-sizing: border-box; }
.ly-three-card h3 { font-size: 28px; color: var(--ac); margin: 0 0 18px; }
.ly-three-card p { font-size: 23px; line-height: 1.7; color: var(--tx2); margin: 0; }`,
    html: `<div class="ly-three">
    <div class="ly-three-card reveal"><h3>给 AI</h3><p>纯文本生成、排版确定、逐行可 diff。</p></div>
    <div class="ly-three-card reveal"><h3>给讲者</h3><p>PowerPoint 式演播、双屏、排练、kiosk。</p></div>
    <div class="ly-three-card reveal"><h3>给观众</h3><p>单文件即开、离线可用、20 种转场。</p></div>
  </div>`,
  },
  {
    id: 'dense-text', name: '密集文字页', use: '长文阅读页：多段正文（法规/方案原文等）',
    css: `
.ly-dense { flex: 1; display: flex; flex-direction: column; gap: 26px; }
.ly-dense p { font-size: 24px; line-height: 1.85; color: var(--tx2); margin: 0; max-width: 1450px; }
.ly-dense p b { color: var(--tx); }`,
    html: `<div class="ly-dense">
    <p class="reveal"><b>定位。</b>html4s 把演示文稿做成"一个合法 HTML 文件 + 一个专职播放器"——格式面向 AI 与版本控制，播放器面向现场演播。</p>
    <p class="reveal"><b>分发。</b>播放器运行时、图标、字体子集全部内嵌进单文件，拷贝即用、离线可用；浏览器打开同文件自动降级兜底。</p>
    <p class="reveal"><b>生态。</b>lint/shot/build 工具链与 MCP 接口把创作闭环交给 AI，主题库与版式库让表达有章可循。</p>
  </div>`,
  },
  {
    id: 'definition', name: '定义页', use: '术语解释：词头 + 释义 + 注解',
    css: `
.ly-def { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.ly-def h2 { font-size: 84px; margin: 0 0 30px; color: var(--ac); }
.ly-def-body { font-size: 30px; line-height: 1.7; color: var(--tx2); margin: 0 0 40px; max-width: 1300px; }
.ly-def-note { border-left: 4px solid var(--bd); padding-left: 26px; }
.ly-def-note b { font-size: 20px; color: var(--dim); letter-spacing: .1em; }
.ly-def-note p { font-size: 22px; color: var(--dim); margin: 8px 0 0; }`,
    html: `<div class="ly-def">
    <p class="ly-kicker reveal">DEFINITION</p>
    <h2 class="reveal">html4s</h2>
    <p class="ly-def-body reveal">HyperText Markup Language For Slides——用超文本标记语言承载演示文稿的开放格式。</p>
    <div class="ly-def-note reveal"><b>词源</b><p>html = 载体，4s = slides 的四个关键：single 文件、stable 稳定、stage 舞台、story 叙事。</p></div>
  </div>`,
  },
  {
    id: 'faq', name: '问答页', use: '常见问题：Q/A 成对排版',
    css: `
.ly-faq { display: flex; flex-direction: column; gap: 30px; }
.ly-faq-item { border-bottom: 1px solid var(--bd2); padding-bottom: 26px; }
.ly-faq-item h3 { font-size: 27px; margin: 0 0 12px; color: var(--ac); }
.ly-faq-item h3::before { content: 'Q '; }
.ly-faq-item p { font-size: 23px; line-height: 1.65; color: var(--tx2); margin: 0; }
.ly-faq-item p::before { content: 'A '; color: var(--dim); }`,
    html: `<div class="ly-faq">
    <div class="ly-faq-item reveal"><h3>离线能用吗？</h3><p>能——播放器/图标/字体全部内嵌进单文件。</p></div>
    <div class="ly-faq-item reveal"><h3>能进 PowerPoint 再编辑吗？</h3><p>不能——html4s 是终点格式，不是 pptx 的替代输入。</p></div>
    <div class="ly-faq-item reveal"><h3>跨平台吗？</h3><p>浏览器全平台；桌面壳目前 Windows。</p></div>
  </div>`,
  },
  {
    id: 'kpi-row', name: '横向数据条', use: '4-6 个关键数字横排（一屏扫完）',
    css: `
.ly-kpirow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; flex: 1; align-content: center; }
.ly-kpirow-item { display: flex; flex-direction: column; gap: 10px; border-left: 4px solid var(--ac); padding-left: 26px; }
.ly-kpirow-item .n { font-size: 84px; font-weight: 300; color: var(--tx); line-height: 1.05; }
.ly-kpirow-item .l { font-size: 20px; letter-spacing: .12em; color: var(--dim); }`,
    html: `<div class="ly-kpirow">
    <div class="ly-kpirow-item reveal"><span class="n">20</span><span class="l">种转场</span></div>
    <div class="ly-kpirow-item reveal"><span class="n">46</span><span class="l">枚内置图标</span></div>
    <div class="ly-kpirow-item reveal"><span class="n">10</span><span class="l">套主题</span></div>
    <div class="ly-kpirow-item reveal"><span class="n">1</span><span class="l">个文件交付</span></div>
  </div>`,
  },
  {
    id: 'progress', name: '进度页', use: '完成度/达成率：进度条组',
    css: `
.ly-progress { display: flex; flex-direction: column; gap: 44px; flex: 1; justify-content: center; }
.ly-progress-item { display: flex; flex-direction: column; gap: 14px; }
.ly-pbar { height: 18px; background: var(--bd2); border-radius: 9px; overflow: hidden; }
.ly-pfill { height: 100%; background: var(--ac); border-radius: 9px; }
.ly-progress-item b { font-size: 26px; }
.ly-progress-item span { font-size: 20px; color: var(--dim); margin-left: 14px; }`,
    html: `<div class="ly-progress">
    <div class="ly-progress-item reveal"><div><b>72%</b><span>里程碑完成度</span></div><div class="ly-pbar"><div class="ly-pfill" style="width:72%"></div></div></div>
    <div class="ly-progress-item reveal"><div><b>45%</b><span>生态准入进度</span></div><div class="ly-pbar"><div class="ly-pfill" style="width:45%"></div></div></div>
    <div class="ly-progress-item reveal"><div><b>100%</b><span>质量门禁覆盖</span></div><div class="ly-pbar"><div class="ly-pfill" style="width:100%"></div></div></div>
  </div>`,
  },
  {
    id: 'stats-compare', name: '数据对比', use: '两组大数字对照（前后/内外/目标实际）',
    css: `
.ly-scomp { flex: 1; display: flex; align-items: center; justify-content: center; gap: 70px; }
.ly-scomp-col { display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center; }
.ly-scomp-col .n { font-size: 130px; font-weight: 300; color: var(--ac); line-height: 1.05; }
.ly-scomp-col .l { font-size: 21px; color: var(--dim); letter-spacing: .1em; }
.ly-scomp-div { width: 2px; height: 220px; background: var(--bd); }`,
    html: `<div class="ly-scomp">
    <div class="ly-scomp-col reveal"><span class="n">12s</span><span class="l">改造前 · 单页制作</span></div>
    <div class="ly-scomp-div reveal"></div>
    <div class="ly-scomp-col reveal"><span class="n">3s</span><span class="l">改造后 · AI 生成闭环</span></div>
  </div>`,
  },
  {
    id: 'cycle', name: '循环图', use: '闭环流程：四步循环回到起点',
    css: `
.ly-cycle { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; }
.ly-cycle li { position: relative; padding: 30px 30px 30px 0; }
.ly-cycle li:not(:last-child)::after { content: '→'; position: absolute; right: 8px; top: 40px; font-size: 30px; color: var(--ac); }
.ly-cycle .ly-cycle-n { display: inline-block; font-size: 20px; color: var(--bg); background: var(--ac); border-radius: 8px; padding: 4px 14px; margin-bottom: 16px; font-weight: 700; }
.ly-cycle h3 { font-size: 26px; margin: 0 0 10px; }
.ly-cycle p { font-size: 21px; color: var(--dim); margin: 0; }
.ly-cycle-loop { text-align: center; font-size: 32px; color: var(--ac); margin-top: 26px; }`,
    html: `<ol class="ly-cycle">
    <li class="reveal"><span class="ly-cycle-n">写</span><h3>AI 生成</h3><p>按版式产出 HTML</p></li>
    <li class="reveal"><span class="ly-cycle-n">查</span><h3>门禁校验</h3><p>lint + 截图自审</p></li>
    <li class="reveal"><span class="ly-cycle-n">演</span><h3>现场交付</h3><p>单文件双击即演</p></li>
    <li class="reveal"><span class="ly-cycle-n">改</span><h3>文字微调</h3><p>现场修改写回源文件</p></li>
  </ol>
  <p class="ly-cycle-loop reveal">↺ 闭环回到"写"——持续迭代</p>`,
  },
  {
    id: 'pyramid', name: '金字塔', use: '层级递进：战略/需求/组织的分层',
    css: `
.ly-pyr { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
.ly-pyr-level { height: 96px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--bg); font-size: 26px; font-weight: 600; box-sizing: border-box; }
.ly-pyr-l1 { background: var(--ac); }
.ly-pyr-l2 { background: var(--ac); opacity: .72; }
.ly-pyr-l3 { background: var(--ac); opacity: .46; }`,
    html: `<div class="ly-pyr">
    <div class="ly-pyr-level ly-pyr-l1 reveal" style="width:36%">价值</div>
    <div class="ly-pyr-level ly-pyr-l2 reveal" style="width:56%">体验 · 交付</div>
    <div class="ly-pyr-level ly-pyr-l3 reveal" style="width:76%">格式 · 工具 · 生态</div>
  </div>`,
  },
  {
    id: 'venn', name: '交集图', use: '两域交叉：各自特点 + 交集价值',
    css: `
.ly-venn { position: relative; flex: 1; min-height: 540px; }
.ly-venn-c { position: absolute; top: 30px; width: 470px; height: 470px; border-radius: 50%; border: 2px solid var(--ac); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; box-sizing: border-box; }
.ly-venn-c1 { left: 10%; }
.ly-venn-c2 { right: 10%; border-color: var(--bad); }
.ly-venn-c b { font-size: 28px; color: var(--ac); }
.ly-venn-c2 b { color: var(--bad); }
.ly-venn-c p { font-size: 22px; color: var(--tx2); margin: 0; text-align: center; }
.ly-venn-mid { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; width: 220px; }
.ly-venn-mid b { font-size: 25px; color: var(--ac); display: block; margin-bottom: 8px; }`,
    html: `<div class="ly-venn">
    <div class="ly-venn-c ly-venn-c1 reveal"><b>AI 写</b><p>纯文本<br>排版确定<br>逐行 diff</p></div>
    <div class="ly-venn-c ly-venn-c2 reveal"><b>人演</b><p>双击即演<br>双屏提词<br>离线可用</p></div>
    <div class="ly-venn-mid reveal"><b>一个文件</b><p>两个世界<br>的接口</p></div>
  </div>`,
  },
  {
    id: 'swot', name: 'SWOT 四格', use: '优势/劣势/机会/威胁四格分析',
    css: `
.ly-swot { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 4px; background: var(--bd); border: 2px solid var(--bd); flex: 1; }
.ly-swot > div { background: var(--bg); padding: 34px 38px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; }
.ly-swot b { font-size: 26px; }
.ly-swot p { font-size: 22px; line-height: 1.6; color: var(--tx2); margin: 0; }
.ly-swot .ly-s b { color: var(--ac); } .ly-swot .ly-w b { color: var(--bad); }
.ly-swot .ly-o b { color: var(--ac); } .ly-swot .ly-t b { color: var(--bad); }
.ly-swot .ly-s, .ly-swot .ly-o { background: color-mix(in srgb, var(--ac) 6%, var(--bg)); }`,
    html: `<div class="ly-swot">
    <div class="ly-s reveal"><b>S · 优势</b><p>单文件分发、AI 原生、排版确定、中文优先</p></div>
    <div class="ly-w reveal"><b>W · 劣势</b><p>终点格式不可回 pptx、动画非可视化编辑</p></div>
    <div class="ly-o reveal"><b>O · 机会</b><p>AI 生成演示的刚需快速增长</p></div>
    <div class="ly-t reveal"><b>T · 威胁</b><p>Web 演示框架也在拥抱 AI</p></div>
  </div>`,
  },
  {
    id: 'gallery', name: '图集', use: '2×2 图片网格（作品/界面/场景）',
    css: `
.ly-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; flex: 1; }
.ly-gallery figure { margin: 0; display: flex; flex-direction: column; gap: 10px; }
.ly-gallery-img { flex: 1; min-height: 200px; border: 2px dashed var(--bd); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--dim); font-size: 22px; }
.ly-gallery figcaption { font-size: 20px; color: var(--dim); text-align: center; }`,
    html: `<div class="ly-gallery">
    <figure class="reveal"><div class="ly-gallery-img">图片占位 1</div><figcaption>浏览界面</figcaption></figure>
    <figure class="reveal"><div class="ly-gallery-img">图片占位 2</div><figcaption>全屏放映</figcaption></figure>
    <figure class="reveal"><div class="ly-gallery-img">图片占位 3</div><figcaption>文字微调</figcaption></figure>
    <figure class="reveal"><div class="ly-gallery-img">图片占位 4</div><figcaption>背景特效</figcaption></figure>
  </div>`,
  },
  {
    id: 'fullbleed', name: '全幅图', use: '整页大图 + 角注（氛围页/封面底图）',
    css: `
.ly-full { position: absolute; inset: 0 0 50px; border: 2px dashed var(--bd); display: flex; align-items: center; justify-content: center; color: var(--dim); font-size: 28px; }
.ly-full-cap { position: absolute; left: 60px; bottom: 44px; font-size: 22px; color: var(--tx2); background: color-mix(in srgb, var(--bg) 72%, transparent); padding: 10px 20px; border-radius: 8px; }`,
    html: `<div class="ly-full reveal">全幅图片占位——构建时自动内嵌为 data URI，单文件分发不断图</div>
  <div class="ly-full-cap reveal">图注：替换为 &lt;img src="…"&gt;，构建时自动内嵌</div>`,
  },
  {
    id: 'video-page', name: '视频页', use: '视频展示：内嵌音频视频策略见构建报告',
    css: `
.ly-video { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.ly-video-demo { flex: 1; border: 2px dashed var(--bd); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--dim); font-size: 26px; }
.ly-video-cap { font-size: 21px; color: var(--dim); margin: 0; }`,
    html: `<div class="ly-video">
    <div class="ly-video-demo reveal">视频占位——替换为 &lt;video src="…"&gt;（大视频随目录交付）</div>
    <p class="ly-video-cap reveal">构建时小音频内嵌、视频保持外部引用并在报告中列出交付清单。</p>
  </div>`,
  },
  {
    id: 'team', name: '团队页', use: '成员卡片：头像首字 + 姓名 + 角色',
    css: `
.ly-team { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; flex: 1; align-content: center; }
.ly-member { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.ly-avatar { width: 130px; height: 130px; border-radius: 50%; background: color-mix(in srgb, var(--ac) 16%, var(--bg)); color: var(--ac); font-size: 52px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.ly-member b { font-size: 25px; }
.ly-member span { font-size: 19px; color: var(--dim); }`,
    html: `<div class="ly-team">
    <div class="ly-member reveal"><div class="ly-avatar">林</div><b>林一</b><span>架构 · 播放器</span></div>
    <div class="ly-member reveal"><div class="ly-avatar">陈</div><b>陈二</b><span>工具链 · CI</span></div>
    <div class="ly-member reveal"><div class="ly-avatar">张</div><b>张三</b><span>主题 · 版式</span></div>
    <div class="ly-member reveal"><div class="ly-avatar">王</div><b>王五</b><span>生态 · 文档</span></div>
  </div>`,
  },
  {
    id: 'profile', name: '人物页', use: '单人介绍：头像 + 定位 + 履历要点',
    css: `
.ly-profile { display: grid; grid-template-columns: 420px 1fr; gap: 70px; align-items: center; flex: 1; }
.ly-avatar-big { width: 340px; height: 340px; border-radius: 50%; background: color-mix(in srgb, var(--ac) 14%, var(--bg)); color: var(--ac); font-size: 130px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.ly-profile-txt h3 { font-size: 44px; margin: 0 0 20px; }
.ly-profile-txt > p { font-size: 25px; line-height: 1.7; color: var(--tx2); margin: 0 0 26px; }
.ly-profile-txt ul { margin: 0; padding-left: 26px; }
.ly-profile-txt li { font-size: 22px; line-height: 1.9; color: var(--tx2); }`,
    html: `<div class="ly-profile">
    <div class="ly-avatar-big reveal">明</div>
    <div class="ly-profile-txt reveal">
      <h3>项目负责人</h3>
      <p>把"AI 写得准，人演得稳"变成一个可运行的格式标准。</p>
      <ul><li>主导 html4s 格式与播放器设计</li><li>构建 AI 创作闭环工具链</li><li>维护开放主题与版式生态</li></ul>
    </div>
  </div>`,
  },
  {
    id: 'testimonial', name: '证言页', use: '用户证言 2-3 条（ credibility ）',
    css: `
.ly-testi { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-content: start; }
.ly-testi-card { border: 1px solid var(--bd); border-radius: 12px; padding: 36px 40px; box-sizing: border-box; }
.ly-testi-card p { font-size: 25px; line-height: 1.7; color: var(--tx2); margin: 0 0 20px; }
.ly-testi-card p::before { content: '“'; color: var(--ac); font-size: 34px; }
.ly-testi-card span { font-size: 19px; color: var(--dim); }`,
    html: `<div class="ly-testi">
    <div class="ly-testi-card reveal"><p>把三天的汇报材料压缩成了一下午——AI 出初稿，我只改数据。</p><span>—— 某国企 · 经营分析岗</span></div>
    <div class="ly-testi-card reveal"><p>现场网络挂了，U 盘里的单文件照样演完。这是选它的决定性理由。</p><span>—— 某技术大会 · 讲者</span></div>
  </div>`,
  },
  {
    id: 'schedule', name: '日程页', use: '时间 + 事项 + 时长的会议议程',
    css: `
.ly-sched { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 22px; }
.ly-sched li { display: flex; gap: 34px; align-items: baseline; border-bottom: 1px solid var(--bd2); padding-bottom: 20px; }
.ly-sched b { font-size: 27px; color: var(--ac); min-width: 130px; font-variant-numeric: tabular-nums; }
.ly-sched h3 { font-size: 26px; margin: 0 0 6px; display: inline; }
.ly-sched span { font-size: 20px; color: var(--dim); margin-left: 16px; }`,
    html: `<ol class="ly-sched">
    <li class="reveal"><b>09:00</b><div><h3>开场与全景</h3><span>20 分钟</span></div></li>
    <li class="reveal"><b>09:20</b><div><h3> live 演示</h3><span>15 分钟</span></div></li>
    <li class="reveal"><b>09:35</b><div><h3>架构与生态</h3><span>20 分钟</span></div></li>
    <li class="reveal"><b>09:55</b><div><h3>Q&amp;A</h3><span>15 分钟</span></div></li>
  </ol>`,
  },
  {
    id: 'roadmap', name: '路线图', use: '三阶段横向推进（现在/中期/远期）',
    css: `
.ly-road { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; flex: 1; align-content: start; }
.ly-road-phase { border-top: 5px solid var(--ac); padding-top: 22px; }
.ly-road-phase.is-now { border-top-color: var(--ac); }
.ly-road-phase.is-mid { border-top-color: color-mix(in srgb, var(--ac) 55%, var(--bd)); }
.ly-road-phase.is-next { border-top-color: var(--bd); }
.ly-road-phase b { font-size: 25px; display: block; margin-bottom: 14px; }
.ly-road-phase p { font-size: 22px; line-height: 1.7; color: var(--tx2); margin: 0; }`,
    html: `<div class="ly-road">
    <div class="ly-road-phase is-now reveal"><b>现在 · 0.5</b><p>提词模式、主题生态、性能基准全达标。</p></div>
    <div class="ly-road-phase is-mid reveal"><b>中期 · 0.6</b><p>媒体内嵌、图表叙事联动、排练洞察。</p></div>
    <div class="ly-road-phase is-next reveal"><b>远期 · 1.x</b><p>社区主题征集、更多准入实现。</p></div>
  </div>`,
  },
  {
    id: 'contact', name: '联系页', use: '联系方式 + 入口（图标引擎）',
    css: `
.ly-contact { display: flex; flex-direction: column; gap: 34px; max-width: 1200px; }
.ly-contact-row { display: flex; gap: 20px; align-items: center; font-size: 26px; color: var(--tx2); }
.ly-contact-row .ly-ico { color: var(--ac); font-size: 30px; }`,
    html: `<div class="ly-contact">
    <div class="ly-contact-row reveal"><span class="ly-ico" data-h4s-icon="globe"></span>mingqiaopeng.github.io/html4s</div>
    <div class="ly-contact-row reveal"><span class="ly-ico" data-h4s-icon="mail"></span>issues · discussions · PR welcome</div>
    <div class="ly-contact-row reveal"><span class="ly-ico" data-h4s-icon="map-pin"></span>themes/ 欢迎你的主题投稿</div>
  </div>`,
  },
];

/* ---------- 组装版式图鉴 deck ---------- */
function main() {
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
  meta: { title: 'html4s 版式图鉴 · ${LAYOUTS.length} 种典型页面版式', lang: 'zh-CN', author: 'Html4s Project' },
  id: 'layouts',
  stage: { width: 1920, height: 1080, fit: 'contain', background: '#0d1117' },
  defaults: { transition: { name: 'fade', duration: 400 } },
  fonts: [],
};

const deck = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>html4s 版式图鉴 · ${LAYOUTS.length} 种典型页面版式</title>
<script type="application/h4s+json">
${JSON.stringify(manifest, null, 2)}
</script>
</head>
<body>
<h4s-deck>

<!-- gen-layouts.mjs · 版式模板库图鉴：${LAYOUTS.length} 种典型页面版式（同内容样例 · CSS 变量主题化） -->
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

${LAYOUTS.length} 种典型页面版式（对标常见 deck 设计软件的内置版式），由 \`tools/gen-layouts.mjs\` 单一事实源生成。**主题 × 版式正交**：版式只用 CSS 变量（与[主题库](LAYOUTS.md)同一套变量），粘进任何主题 deck 自动适配配色。

> **决策前置**：生成 deck 前先读 [DECK-DESIGN.md](DECK-DESIGN.md)——"场景 → 主题 → 叙事骨架 → 版式分配 → 特效强度"五步决策；本文档只负责版式层。

## 版式目录

| # | 片段 | 版式 | 适用场景 |
|---|---|---|---|
${catalog}

在线预览：**https://mingqiaopeng.github.io/html4s/decks/layouts.html**（版式图鉴 deck，每页右下角标注片段文件名）。

## 图标引擎

要点/清单类版式使用内置图标引擎：\`<i data-h4s-icon="名称"></i>\`——46 枚 24×24 stroke 图标（check / zap / layers / download / globe / trending-up / rocket…），颜色随 currentColor、尺寸随 font-size，零依赖（替代全量图标库）。可用名称与 deck 校验：\`node tools/icon-list.mjs\` / \`--check <deck>\`。

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
- v1.1（2026-11-21）：版式 13→20（+图表页/四象限/层级架构/表格页/双图并置/对勾清单/附录页）；要点清单改用图标引擎；新增图标引擎章节
- v1（2026-11-21）：13 版式首发
`;

fs.writeFileSync(path.join(ROOT, 'docs', 'LAYOUTS.md'), guide, 'utf8');

console.log('生成完成:');
console.log('  图鉴 deck: examples/layouts.html（' + LAYOUTS.length + ' 页）');
console.log('  片段+样式: examples/layouts/（' + (LAYOUTS.length + 1) + ' 个文件）');
console.log('  生成指南: docs/LAYOUTS.md');
}

/* 直接运行时才生成；被 gen-deck 导入时只取 LAYOUTS/BASE_CSS */
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
