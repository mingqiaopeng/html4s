#!/usr/bin/env node
/* gen-themes.mjs — 主题库生成器（阶段：丰富主题库）
 * 以最新版项目介绍（html4s-intro-fs.html，8 页）为唯一内容源，生成 N 个完整主题变体：
 * 内容/结构完全一致，主题 = 独立 CSS 层（色板变量 + 字体 + 装饰 + 签名转场 + fx 氛围）。
 * 内联色值机械替换为 CSS 变量（#00ffcc→--ac 等），实现真正的内容/表现分离。
 *
 * 用法: node tools/gen-themes.mjs           # 生成 7 个变体（深色科技=html4s-intro-fs 本体）
 * 之后: 逐个 node tools/h4s-build.mjs examples/intro-<id>.html --subset --share
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SRC = path.join(ROOT, 'examples', 'html4s-intro-fs.html');

/* ---------- 提取最新版介绍内容（剥掉 h4s-deck 外壳，只留各页——模板统一再包一层，
   否则嵌套 h4s-deck 会让 collectSlides 采到 0 页、整个 deck 走进网页放映分支） ---------- */
const src = fs.readFileSync(SRC, 'utf8');
const deckChunk = src.slice(src.indexOf('<h4s-deck>'), src.lastIndexOf('</h4s-deck>') + 11);
const COLOR_MAP = [
  ['color:#00ffcc', 'color:var(--ac)'],
  ['color:#9ca3af', 'color:var(--dim)'],
  ['color:#ff6b72', 'color:var(--bad)'],
];
const sections = deckChunk
  .replace(/^\s*<h4s-deck>/, '')
  .replace(/<\/h4s-deck>\s*$/, '')
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/v0\.3\.1/g, 'v0.3.2');
const substituted = (chunk) => COLOR_MAP.reduce((s, [a, b]) => s.split(a).join(b), chunk);

/* ---------- 结构层（变量化，8 主题共享） ---------- */
export const BASE_CSS = `
  html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--bg); }
  .slide {
    position: absolute; inset: 0; width: 1920px; height: 1080px;
    overflow: hidden; display: block;
    background: var(--bg); color: var(--tx);
    font-family: var(--font);
  }
  .h4s-holder > .slide { visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; position: absolute !important; inset: 0 !important; }
  .reveal { opacity: 0; transform: translateY(30px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
  .slide.visible .reveal { opacity: 1; transform: translateY(0); }
  .kicker { font-size: 20px; letter-spacing: .3em; color: var(--ac); text-transform: uppercase; }
  .slide-content { display: flex; flex-direction: column; justify-content: center; padding: 120px; height: 100%; box-sizing: border-box; position: relative; }
  .stat { display: flex; flex-direction: column; gap: 8px; border-left: 4px solid var(--ac); padding-left: 28px; }
  .stat .n { font-size: 96px; font-weight: 300; letter-spacing: -.02em; }
  .stat .l { font-size: 18px; letter-spacing: .18em; color: var(--dim); text-transform: uppercase; }
  .card { border: 1px solid var(--bd); padding: 40px; box-sizing: border-box; }
  .card.good { border-color: var(--ac); }
  .card.bad { border-color: var(--bad); }
  .card .h { font-size: 20px; letter-spacing: .2em; margin-bottom: 24px; }
  .card p { font-size: 24px; line-height: 1.7; color: var(--tx2); margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 22px; line-height: 1.5; }
  th { text-align: left; color: var(--ac); font-weight: 500; padding: 12px 20px; border-bottom: 1px solid var(--bd); letter-spacing: .08em; }
  td { padding: 12px 20px; color: var(--tx2); border-bottom: 1px solid var(--bd2); }
  td:first-child { color: var(--dim); }
`;

/* ---------- 主题定义 ---------- */
export const THEMES = [
  {
    id: 'darktech', label: '深色科技', transition: 'fade', fx: 'stars',
    vars: `--bg:#0a0f1c;--tx:#ffffff;--tx2:#c9d1d9;--dim:#9ca3af;--ac:#00ffcc;--bad:#ff6b72;--bd:#263041;--bd2:#1a2233;
    --font:'Space Grotesk','Noto Sans SC',sans-serif;`,
    deco: `
    /* 深色科技：单色锚点极简（html4s-intro-fs 同源；Space Grotesk 由清单 fonts 内嵌时生效） */`,
    fxCopy: null,
  },
  {
    id: 'swiss', label: '瑞士克莱因蓝', transition: 'slide', fx: 'none',
    vars: `--bg:#ffffff;--tx:#0f172a;--tx2:#1e293b;--dim:#5b6b7f;--ac:#002fa7;--bad:#c0272d;--bd:#c9d4e2;--bd2:#eef2f6;
    --font:'Segoe UI','Microsoft YaHei',sans-serif;`,
    deco: `
    /* 瑞士：左侧克莱因蓝竖条 + 页题水印 + 重磅黑体标题 */
    .slide-content::before { content: ''; position: absolute; left: 56px; top: 64px; bottom: 64px; width: 14px; background: var(--ac); }
    .slide::after { content: attr(data-h4s-title); position: absolute; right: 64px; bottom: 44px; font-size: 20px; color: var(--dim); letter-spacing: .1em; }
    .slide h1, .slide h2 { font-weight: 700 !important; }
    .card { border-width: 2px; }`,
    fxCopy: { h1: '留白，即是舞台。', note: '本主题 defaults.fx 未启用——清单中一行即可开启 stars / snow / dust 全页氛围。' },
  },
  {
    id: 'partyred', label: '党建红', transition: 'curtain', fx: 'none',
    vars: `--bg:#f7f3ea;--tx:#262626;--tx2:#3d3a35;--dim:#6b5d52;--ac:#c8102e;--bad:#a8391e;--bd:#e0d6c2;--bd2:#ece4d4;
    --font:'Noto Serif SC','Source Han Serif SC','SimSun',serif;`,
    deco: `
    /* 党建红：顶部红色条带 + 金色点缀 + 衬线标题 */
    .slide::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 16px; background: var(--ac); }
    .slide { padding-top: 16px; }
    .kicker::before { content: '◆ '; color: #9a7b2d; }
    .card.good { border-left: 6px solid #9a7b2d; }
    .slide h1, .slide h2 { font-weight: 700 !important; }`,
    fxCopy: { h1: '留白，即是舞台。', note: '本主题 defaults.fx 未启用——清单中一行即可开启 stars / snow / dust 全页氛围。' },
  },
  {
    id: 'magazine', label: '电子杂志', transition: 'push', fx: 'dust',
    vars: `--bg:#101010;--tx:#f5f2e8;--tx2:#c9c5ba;--dim:#a3a3a3;--ac:#ffd400;--bad:#ff6b6b;--bd:#2e2e2e;--bd2:#232323;
    --font:'Georgia','Noto Serif SC','SimSun',serif;`,
    deco: `
    /* 杂志：黄标段落符 + 块状卡 + 衬线大标题 */
    .kicker::before { content: '¶ '; color: var(--ac); }
    .card { background: #191919; border: none; }
    .card.good { background: #1d1c14; }
    .slide h1, .slide h2 { font-style: italic; letter-spacing: -.01em !important; }
    .stat .n { font-style: italic; }`,
    fxCopy: { h1: '微尘，浮动在光里。' },
  },
  {
    id: 'ink', label: '水墨编辑', transition: 'fade', fx: 'none',
    vars: `--bg:#f4f1ea;--tx:#1c1c1c;--tx2:#333;--dim:#57534e;--ac:#1a1a1a;--bad:#9a3412;--bd:#d6cfc0;--bd2:#e5dfd2;
    --font:'Noto Serif SC','Source Han Serif SC','SimSun',serif;`,
    deco: `
    /* 水墨：右上朱砂印章 + 细线框 */
    .slide::after { content: 'html4s'; position: absolute; right: 72px; top: 64px; width: 84px; height: 84px;
      background: #b42318; color: #f4f1ea; font-size: 17px; letter-spacing: .2em;
      display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; border-radius: 4px; }
    .card { border: 1px solid var(--bd); background: transparent; }
    .card.good { border-left: 6px solid #b42318; }
    .slide h1, .slide h2 { font-weight: 700 !important; }`,
    fxCopy: { h1: '留白，即是舞台。', note: '本主题 defaults.fx 未启用——清单中一行即可开启 stars / snow / dust 全页氛围。' },
  },
  {
    id: 'aurora', label: '极光渐变', transition: 'zoomblur', fx: 'stars',
    vars: `--bg:#0b1020;--tx:#e6edf3;--tx2:#c3cfe2;--dim:#8fa3c2;--ac:#93c5fd;--bad:#fda4af;--bd:#2a3555;--bd2:#1c2740;
    --font:'Segoe UI','Microsoft YaHei',sans-serif;`,
    deco: `
    /* 极光：双色径向渐变底 + 霓虹描边 */
    .slide { background: linear-gradient(135deg, #0b1020 0%, #131a3a 45%, #0d2b33 100%); }
    .card.good { border-color: #7dd3fc; box-shadow: 0 0 26px rgba(125, 211, 252, .14); }
    .kicker { text-shadow: 0 0 18px rgba(125, 211, 252, .55); }`,
  },
  {
    id: 'light', label: '晨雾浅色', transition: 'wipe', fx: 'none',
    vars: `--bg:#f8fafc;--tx:#0f172a;--tx2:#334155;--dim:#64748b;--ac:#0369a1;--bad:#b91c1c;--bd:#dbe2ea;--bd2:#e9eef4;
    --font:'Segoe UI','Microsoft YaHei',sans-serif;`,
    deco: `
    /* 晨雾：大量留白 + 无框左线卡 */
    .slide-content { padding: 140px 160px; }
    .card { border: none; border-left: 4px solid var(--bd); background: #fff; }
    .card.good { border-left-color: var(--ac); }
    .card.bad { border-left-color: var(--bad); }`,
    fxCopy: { h1: '留白，即是舞台。', note: '本主题 defaults.fx 未启用——清单中一行即可开启 stars / snow / dust 全页氛围。' },
  },
  {
    id: 'terminal', label: '终端绿', transition: 'dissolve', fx: 'dust',
    vars: `--bg:#0a0a0a;--tx:#d6ffe3;--tx2:#b8d8c4;--dim:#7ba86f;--ac:#4ade80;--bad:#ff7b72;--bd:#1e2b22;--bd2:#14201a;
    --font:ui-monospace,'Cascadia Mono',Consolas,'Noto Sans SC',monospace;`,
    deco: `
    /* 终端：扫描线 + 命令提示符 + 直角卡 */
    .slide::before { content: ''; position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.16) 3px 4px); }
    .kicker::before { content: '$ '; color: var(--ac); }
    .card { border-radius: 0; background: #0f1412; }
    .slide h1, .slide h2 { font-weight: 600 !important; }`,
    fxCopy: { h1: '微尘，浮动在光里。' },
  },
];

/* ---------- fx 页文案替换（与主题 fx 氛围一致） ---------- */
function applyFxCopy(sections, theme) {
  if (theme.fx === 'stars') return sections; /* 原文即 stars */
  let s = sections;
  const fxName = theme.fx === 'none' ? 'stars / snow / dust（按需开启）' : theme.fx;
  s = s.split('星空，就在你身后。').join(theme.fxCopy.h1);
  s = s.split('本页清单 defaults.fx = "stars"——零依赖 canvas，仅放映时渲染，离开自动暂停。另有 snow / dust 与页面级 confetti 礼花。')
    .join(theme.fxCopy.note
      ? `本主题清单 defaults.fx 未启用——零依赖 canvas 特效层（stars / snow / dust）在清单中一行开启，仅放映时渲染，离开自动暂停。另有页面级 confetti 礼花。`
      : `本页清单 defaults.fx = "${theme.fx}"——零依赖 canvas，仅放映时渲染，离开自动暂停。另有 stars / snow 与页面级 confetti 礼花。`);
  s = s.split('defaults.fx="stars"').join(`defaults.fx="${theme.fx === 'none' ? 'stars|snow|dust' : theme.fx}"`);
  return s;
}

/* ---------- 生成 ---------- */
function main() {
let made = 0;
for (const theme of THEMES) {
  const css = `:root { ${theme.vars.replace(/\n\s*/g, ' ')} }\n${BASE_CSS}\n${theme.deco}`;
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>html4s · 项目介绍 · ${theme.label}主题</title>
<script type="application/h4s+json">
{
  "h4s": "1.0",
  "meta": { "title": "html4s · 项目介绍 · ${theme.label}主题", "lang": "zh-CN", "author": "Html4s Project" },
  "id": "intro-${theme.id}",
  "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "${theme.vars.match(/--bg:(#[0-9a-fA-F]+)/)[1]}" },
  "defaults": { "transition": { "name": "${theme.transition}", "duration": 450 }, "fx": "${theme.fx}", "autoslide": 0, "loop": false },
  "fonts": []
}
</script>
</head>
<body>
<h4s-deck>

<!-- gen-themes.mjs · 项目介绍（最新版内容）× ${theme.label}主题 · 签名转场 ${theme.transition} · fx ${theme.fx} -->
<style>${css}</style>

${applyFxCopy(substituted(sections), theme)}
</h4s-deck>
<script src="../player/h4s.player.js"></script>
</body>
</html>
`;
  const out = path.join(ROOT, 'examples', `intro-${theme.id}.html`);
  fs.writeFileSync(out, html, 'utf8');
  const pages = (html.match(/<section\b/g) || []).length;
  console.log('生成: intro-' + theme.id + '（' + pages + ' 页 · ' + theme.label + ' · 转场 ' + theme.transition + ' · fx ' + theme.fx + '）');
  if (pages !== 8) { console.error('页数异常'); process.exit(1); }
  made++;
}
console.log('共 ' + made + ' 个主题变体（深色科技 = html4s-intro-fs 本体，不在生成范围）');
}

/* 直接运行时才生成；被 gen-deck 导入时只取 THEMES/BASE_CSS */
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
