#!/usr/bin/env node
/**
 * adapt-gz-template.mjs — 把 guizang-ppt-skill 模板改造为 html4s 模板
 * （P1 最小实现 · 保留其视觉体系，替换运行时为 html4s 播放器模式）
 *
 * 用法: node tools/adapt-gz-template.mjs <in.html> <out.html> [--title "标题"]
 *
 * 手术内容:
 *   1. CSS: 剥离他们的导航/演讲者运行时样式；`#deck > .slide` → `.h4s-holder > .slide`
 *      （演示页保持透明让 WebGL 背景透出，缩略图克隆在 holder 外自动取不透明底色——沿用原设计意图）
 *      vw/vh 全部转换为 1920×1080 固定舞台的 px 字面量（1vw=19.2px, 1vh=10.8px）
 *   2. body: 剥离低功耗脚本/#hint/#nav/SPEAKER_NOTES/演讲者运行时 JS；保留 WebGL 特效运行时
 *      与 lucide 图标；`<div id="deck">` → `<h4s-deck>`；背景 canvas 加 data-h4s-bg（播放器
 *      会把它们移入舞台置底，transform 上下文里 fixed 按舞台定位）
 *   3. head: 注入 h4s 清单（stage 1920×1080 + 播放信息占位 + fonts 声明占位），移除 Google Fonts
 *      （字体改由 manifest 声明 + 构建期内嵌，见 tools/h4s-build.mjs）
 *   4. 尾部: 注入播放器引用（开发期相对路径，构建期内联）
 */
import fs from 'node:fs';

const [,, inFile, outFile, ...rest] = process.argv;
if (!inFile || !outFile) {
  console.error('用法: node tools/adapt-gz-template.mjs <in.html> <out.html> [--title "标题"]');
  process.exit(1);
}
const titleArg = (rest.indexOf('--title') > -1) ? rest[rest.indexOf('--title') + 1] : '';
const playerArgIdx = rest.indexOf('--player-src');
const playerSrc = (playerArgIdx > -1) ? rest[playerArgIdx + 1] : '../player/h4s.player.js';

let html = fs.readFileSync(inFile, 'utf8');

/* ---------- 定位关键标记 ---------- */
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
if (styleStart < 0 || styleEnd < 0) { console.error('未找到 <style> 块'); process.exit(1); }
const bodyTagRe = /<body[^>]*>/;
const bodyTagMatch = bodyTagRe.exec(html);
if (!bodyTagMatch) { console.error('未找到 <body>'); process.exit(1); }
const bodyStart = bodyTagMatch.index;
const bodyEnd = html.indexOf('</body>');

/* ---------- 1. CSS 手术 ---------- */
let css = html.slice(styleStart + '<style>'.length, styleEnd);

// 1a. 先改写 #deck > .slide 选择器（在剥行之前）
css = css.replaceAll('#deck > .slide', '.h4s-holder > .slide');

// 1b. 剥离运行时样式行
const stripRe = /ppt-|body\.low-power|#deck\{|#nav\b|#hint\b/;
css = css.split('\n').filter(line => !stripRe.test(line)).join('\n');

// 1c. vw/vh → px @1920×1080（1vw=19.2px, 1vh=10.8px）
const px = (n) => { const v = parseFloat(n); const r = Math.round(v * 100) / 100; return String(r); };
css = css.replace(/(-?\d*\.?\d+)vw\b/g, (_, n) => px(parseFloat(n) * 19.2) + 'px');
css = css.replace(/(-?\d*\.?\d+)vh\b/g, (_, n) => px(parseFloat(n) * 10.8) + 'px');

// 1d. 舞台内背景层与幻灯片层序
css += `\n  /* ---- h4s 注入：舞台背景层 ---- */
  .h4s-holder > [data-h4s-bg]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0;margin:0!important;}
  .h4s-holder > .h4s-in{z-index:1;}
`;

// 1e. 版式补充：layouts-swiss.md 登记但模板缺失的类（按模板既有约定实现）
css += `
  /* ---- h4s 注入：版式补充（文档登记、模板缺失） ---- */
  /* P3 Statement */
  .slide[data-layout="S03"] .canvas-card{display:flex;flex-direction:column}
  .h-statement{margin:auto 0 auto 23%;font-weight:200;font-size:184.32px;line-height:1.08;letter-spacing:-.05em;color:var(--ink)}
  .stmt-anchor{display:block;margin:32px 0 48px 23%;font-family:var(--mono);font-size:14px;color:var(--text-helper)}
  /* P8 Duo Compare（.duo-compare/.vrule 模板已有，补 .duo-half 与列表） */
  .duo-half{display:flex;flex-direction:column;gap:24px}
  .duo-half h2{margin:0;font-weight:200;font-size:64px;letter-spacing:-.02em;color:var(--ink)}
  .duo-half .t-cat{color:var(--text-helper)}
  .meta-list{list-style:none;margin:0;padding:0;display:grid;gap:18px}
  .meta-list li{position:relative;padding-left:1.4em;font-weight:300;font-size:18px;line-height:1.7;color:var(--text-secondary)}
  .meta-list li::before{content:"—";position:absolute;left:0;color:var(--text-helper)}
  /* P2 Timeline：.tl-axis/.tl-body 文档写了但模板用平铺子元素，这里补 axis 容器 */
  .slide[data-layout="S02"] .timeline-v{margin-top:16px}
  .slide[data-layout="S02"] .tl-node{padding:20px 0}
  .slide[data-layout="S02"] .kpi-row-4{margin-top:auto}
  .tl-axis{position:relative;align-self:stretch}
  .tl-body{display:contents}
  /* P6 KPI Tower（.bar-tower/.num-mega/.lbl 模板已有，补容器与列） */
  .slide[data-layout="S06"] .canvas-card{display:flex;flex-direction:column}
  .kpi-tower-row{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:48px;align-items:end;margin-top:32px}
  .tower-col{display:flex;flex-direction:column;gap:10px;min-height:0}
  .tower-col svg{width:26px;height:26px}
  .kpi-tower-row .bar-tower{height:var(--h,64.8px);min-height:0;background:var(--accent);margin-top:auto}
  .kpi-tower-row .bar-tower .cap{background:var(--accent);opacity:.9}
  /* P14 Loop */
  .slide[data-layout="S14"] .canvas-card{display:flex;flex-direction:column}
  .loop-diagram{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;margin-top:16px}
  .loop-steps{display:grid;gap:28px;align-content:center}
  .loop-step{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:baseline;border-top:1px solid var(--border-subtle);padding-top:16px}
  .loop-step .big-num{font-weight:200;font-size:44px;color:var(--accent);letter-spacing:-.02em}
  .loop-step h4{margin:0;font-size:22px;font-weight:600}
  .loop-step p{margin:4px 0 0;font-size:16px;color:var(--text-secondary);font-weight:300}
  /* 通用 */
  .grid-2-9{display:grid;grid-template-columns:2fr 3fr;gap:48px;align-items:end}
  .lead-col{display:flex;flex-direction:column;gap:12px}
`;

/* ---------- 2. 分段组装 ---------- */
const preStyle = html.slice(0, styleStart);            // <head> 开头与 style 前的子元素
const postStyle = html.slice(styleEnd + '</style>'.length, bodyStart); // </head> 与 body 前的间隙
const bodyTag = bodyTagMatch[0];                        // <body …>
let body = html.slice(bodyStart + bodyTag.length, bodyEnd);

// 2a. 移除 Google Fonts（构建期按 manifest 内嵌或回退本机字体）
const preStyleClean = preStyle
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" data-gz-fonts[^>]*>\s*/g, '');

const title = titleArg || 'html4s 演示';
const manifest = `
  <!-- H4S 清单：固定舞台 + 播放信息（自动播放/循环/字体声明）。构建期处理 fonts[].file -->
  <script type="application/h4s+json">
  {
    "h4s": "1.0",
    "meta": { "title": ${JSON.stringify(title)}, "lang": "zh-CN" },
    "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "transparent" },
    "defaults": {
      "transition": { "name": "slide", "duration": 450 },
      "fragment": { "effect": "fade-up", "delay": 150 },
      "autoslide": 0,
      "loop": false,
      "progress": true,
      "slideNumber": true
    },
    "fonts": []
  }
  </script>
`;

/* ---------- 3. body 手术 ---------- */
// 3a. 删除所有 <script> 块，仅保留 GZ 特效运行时与 lucide
const kept = [];
body = body.replace(
  /<script(\b[^>]*)?>[\s\S]*?<\/script>|<script[^>]*src=[^>]*><\/script>/g,
  (m) => {
    if (/GZ:EFFECTS:START/.test(m)) { kept.push('gz-effects'); return m; }
    if (/lucide/.test(m)) { kept.push('lucide'); return m; }
    return '';
  });

// 3b. 删除 #hint 与 #nav 块
body = body.replace(/<div id="hint"[\s\S]*?<\/div>\s*/g, '');
body = body.replace(/<div id="nav"><\/div>\s*/g, '');

// 3c. #deck → h4s-deck；背景 canvas 打 data-h4s-bg 标记
// 闭合位置必须按 div 嵌套深度配对（示例页内容里有大量 <div>，首个 </div> 在幻灯片内部）
{
  const openIdx = body.indexOf('<div id="deck">');
  if (openIdx > -1) {
    let depth = 0, closeIdx = -1;
    const divRe = /<\/?div\b[^>]*>/g;
    divRe.lastIndex = openIdx;
    let m;
    while ((m = divRe.exec(body))) {
      if (m[0][1] === '/') {
        depth--;
        if (depth === 0) { closeIdx = m.index; break; }
      } else depth++;
    }
    if (closeIdx > -1) {
      body = body.slice(0, openIdx) + '<h4s-deck>'
        + body.slice(openIdx + '<div id="deck">'.length, closeIdx)
        + '</h4s-deck>' + body.slice(closeIdx + '</div>'.length);
    }
  }
}
body = body.replace(/<canvas ([^>]*class="bg")/g, '<canvas data-h4s-bg $1');

// 3d. 更新 SLIDES_HERE 注释为 h4s 备注契约
body = body.replace(
  /<!-- SLIDES_HERE[^>]*-->/,
  `<!-- SLIDES_HERE · 在此处填充所有 <section class="slide ..."> 页面
       版式参考 references/layouts.md / layouts-swiss.md · 组件参考 references/components.md
       演讲备注写进每页：<h4s-notes hidden><p>…</p></h4s-notes>
       自动播放：<h4s-slide data-h4s-autoslide="20" …> 或清单 defaults.autoslide -->
  -->`
);

// 3e. body 内联样式同样按舞台换算（瑞士模板自带示例页含 vh/vw 内联样式）
body = body.replace(/(-?\d*\.?\d+)vw\b/g, (_, n) => px(parseFloat(n) * 19.2) + 'px');
body = body.replace(/(-?\d*\.?\d+)vh\b/g, (_, n) => px(parseFloat(n) * 10.8) + 'px');

// 3f. 尾部注入播放器引用（构建期内联为单文件）
body += `\n<!-- h4s 播放器：构建期(h4s-build)内联为单文件；开发期相对路径 -->
<script src="${playerSrc}"></script>
`;

/* ---------- 4. 组装输出 ---------- */
const outHtml = preStyleClean + manifest + '<style>' + css + '</style>'
  + postStyle + bodyTag + body + '\n</body>\n</html>\n';
fs.writeFileSync(outFile, outHtml);
console.log('完成:', outFile, '| 保留脚本:', [...new Set(kept)].join(', ') || '(无)',
  '| CSS行:', css.split('\n').length,
  '| manifest:', outHtml.includes('h4s+json') ? '已注入' : '缺失!');
