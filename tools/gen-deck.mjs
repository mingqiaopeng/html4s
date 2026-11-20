#!/usr/bin/env node
/* gen-deck.mjs — deck 脚手架（0.4.0-M3）：把 DECK-DESIGN 五步决策变成一条命令
 *
 * 用法:
 *   node tools/gen-deck.mjs --theme partyred --title "季度经营汇报" \
 *     --outline outline.md [-o out.html] [--author "汇报人"]
 *
 * 大纲（outline.md，Markdown 简版）映射规则:
 *   # 主标题              → 封面（--title 可覆盖）
 *   ## 章节               → 章节页（divider，自动编号）+ 后续内容页
 *   - 要点                → 要点清单页（连续 - 行合为一页）
 *   > 金句                → 引用页
 *   ```chart … ```        → 图表页（fence 内 JSON：{"type":"bar","data":[…]}）
 *   | a | b |             → 表格页（连续 | 行，首行表头）
 *   普通段落              → 大字观点页（首行 = lead，其余行为三列支撑）
 * 末尾自动追加收束页。目录页由章节自动生成。
 *
 * 主题: gen-themes 的 THEMES 之一（darktech/swiss/partyred/magazine/ink/aurora/light/terminal）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allThemes, BASE_CSS as THEME_BASE } from './gen-themes.mjs';
import { LAYOUTS, BASE_CSS as LAYOUT_BASE } from './gen-layouts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const argv = process.argv.slice(2);
const getOpt = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };

const themeId = getOpt('--theme') || 'darktech';
const titleArg = getOpt('--title');
const author = getOpt('--author') || '';
const outlineFile = getOpt('--outline');
const outFile = getOpt('-o');

const theme = allThemes().find((t) => t.id === themeId);
if (!theme) {
  console.error('未知主题: ' + themeId + ' —— 可用: ' + allThemes().map((t) => t.id).join(' '));
  process.exit(2);
}
if (!outlineFile || !fs.existsSync(path.resolve(outlineFile))) {
  console.error('用法: node tools/gen-deck.mjs --theme <id> --title "标题" --outline outline.md [-o out.html]\n主题: ' + allThemes().map((t) => t.id).join(' '));
  process.exit(2);
}
const title = titleArg || '';

/* ---------- 大纲解析 ---------- */
const outline = fs.readFileSync(path.resolve(outlineFile), 'utf8');
const lines = outline.split(/\r?\n/);
const sections = []; // { title, pages: [{type:'statement'|'list'|'table'|'chart'|'quote', data}] }
let cur = null;
let coverTitle = '';
let chartFence = false, chartBuf = '';

function ensureCur() {
  if (!cur) cur = { title: '内容', pages: [] };
}
function curPage(type, data) {
  ensureCur();
  cur.pages.push({ type, data });
}
for (const raw of lines) {
  const line = raw.trim();
  if (chartFence) {
    if (/^```/.test(line)) { curPage('chart', JSON.parse(chartBuf)); chartFence = false; chartBuf = ''; }
    else chartBuf += line;
    continue;
  }
  if (!line || /^---+$/.test(line)) continue;
  if (/^```chart/.test(line)) { ensureCur(); chartFence = true; chartBuf = ''; continue; }
  if (/^#\s[^#]/.test(line)) { coverTitle = line.replace(/^#\s+/, '').trim(); continue; }
  if (/^##\s/.test(line)) {
    if (cur) { sections.push(cur); cur = null; }
    cur = { title: line.replace(/^##\s+/, '').trim(), pages: [] };
    continue;
  }
  if (/^>\s?/.test(line)) { curPage('quote', line.replace(/^>\s?/, '')); continue; }
  if (/^-\s/.test(line)) {
    ensureCur();
    const last = cur.pages[cur.pages.length - 1];
    if (last && last.type === 'list') last.data.push(line.replace(/^-\s+/, ''));
    else curPage('list', [line.replace(/^-\s+/, '')]);
    continue;
  }
  if (/^\|/.test(line)) {
    ensureCur();
    const last = cur.pages[cur.pages.length - 1];
    if (last && last.type === 'table') last.data.push(line);
    else curPage('table', [line]);
    continue;
  }
  if (/^#{3,}\s/.test(line)) { const t = line.replace(/^#+\s+/, ''); curPage('statement', { lead: t, cols: [] }); continue; }
  /* 普通段落 → statement（首行 lead，后续行并入支撑列） */
  ensureCur();
  const st = cur.pages.find((p) => p.type === 'statement' && p.data.cols.length < 3 && !p.data.locked);
  if (st) st.data.cols.push(line);
  else curPage('statement', { lead: line, cols: [] });
}
if (cur) sections.push(cur);
if (!coverTitle) coverTitle = title || '未命名 deck';

/* ---------- 页面构建 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ICO = ['📦', '🎬', '🤖', '🇨🇳', '✏️', '🖥️'];
let secNo = 0;

const P = {
  cover: () => `<div class="ly-cover-main">
    <p class="ly-kicker reveal">GENERATED · SCAFFOLD · ${esc(theme.label).toUpperCase()} THEME</p>
    <h1 class="reveal">${esc(coverTitle)}</h1>
    <p class="ly-cover-sub reveal">由 gen-deck 脚手架生成 · 版式来自版式模板库 · 主题「${esc(theme.label)}」</p>
    ${author ? `<p class="ly-cover-meta reveal">${esc(author)}</p>` : ''}
  </div>`,
  agenda: (secs) => `<ol class="ly-agenda-list">
${secs.map((s, i) => `    <li class="reveal"><b>${String(i + 1).padStart(2, '0')}</b><div><h3>${esc(s.title)}</h3><p>第 ${i + 1} 部分</p></div></li>`).join('\n')}
  </ol>`,
  divider: (n, s) => `<div class="ly-divider-main">
    <p class="ly-divider-num reveal">${String(n).padStart(2, '0')}</p>
    <h2 class="reveal">${esc(s.title)}</h2>
  </div>`,
  statement: (d) => `<p class="ly-lead reveal">${esc(d.lead)}</p>
    ${d.cols.length ? `<div class="ly-cols">${d.cols.map((c) => `<div class="reveal"><p>${esc(c)}</p></div>`).join('')}</div>` : ''}`,
  list: (items) => `<ul class="ly-list">
${items.map((it, i) => `    <li class="reveal"><span class="ly-ico">${ICO[i % ICO.length]}</span><div><b>${esc(it)}</b></div></li>`).join('\n')}
  </ul>`,
  table: (rows) => {
    const cells = rows.map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
    const head = cells[0] || [];
    const body = cells.slice(1);
    return `<table class="ly-table">
    <tr>${head.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>
${body.map((r) => `    <tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
  </table>`;
  },
  chart: (cfg) => `<h4s-chart type="${esc(cfg.type || 'bar')}" class="reveal" style="height:560px">
    ${JSON.stringify(cfg.data || [])}
  </h4s-chart>`,
  quote: (q) => `<blockquote class="ly-quote reveal">
    <p>${esc(q)}</p>
  </blockquote>`,
  closing: () => `<div class="ly-close">
    <p class="ly-kicker reveal">CLOSING · THANKS</p>
    <h2 class="reveal">${esc(coverTitle)}<br>谢谢观看。</h2>
    <p class="ly-close-sub reveal">github.com/mingqiaopeng/html4s · 由 gen-deck 脚手架生成</p>
    <p class="ly-cta reveal">STAR · FORK · ISSUE</p>
  </div>`,
};

const bodyPages = [];
bodyPages.push(`<section class="slide" data-h4s-title="封面">
  ${P.cover()}
  <h4s-notes hidden>封面：30 秒定调「${esc(coverTitle)}」。</h4s-notes>
</section>
`);
if (sections.length) {
  bodyPages.push(`<section class="slide" data-h4s-title="目录">
  <div class="ly-body">
    <div class="ly-head"><p class="ly-kicker reveal">AGENDA</p><h2 class="reveal">目录</h2></div>
${P.agenda(sections)}
  </div>
  <h4s-notes hidden>目录页：${sections.length} 个部分。</h4s-notes>
</section>
`);
}
sections.forEach((s, si) => {
  bodyPages.push(`<section class="slide" data-h4s-title="${esc(s.title)}">
  ${P.divider(si + 1, s)}
  <h4s-notes hidden>章节分隔：${esc(s.title)}。</h4s-notes>
</section>
`);
  for (const pg of s.pages) {
    const label = pg.type;
    const inner = P[pg.type] ? P[pg.type](pg.data) : '';
    bodyPages.push(`<section class="slide" data-h4s-title="${esc(s.title)} · ${label}">
  <div class="ly-body">
    <div class="ly-head"><p class="ly-kicker reveal">${esc(s.title).toUpperCase()}</p><h2 class="reveal">${esc(pg.type === 'statement' ? s.title : label.toUpperCase())}</h2></div>
${inner}
    <div class="ly-tag">版式 · ${label} · gen-deck 脚手架</div>
  </div>
  <h4s-notes hidden>${esc(s.title)} · ${label} 版式内容页。</h4s-notes>
</section>
`);
  }
});
bodyPages.push(`<section class="slide" data-h4s-title="收束">
  ${P.closing()}
  <h4s-notes hidden>收束：引导互动。</h4s-notes>
</section>
`);

/* ---------- 组装 ---------- */
const manifest = {
  h4s: '1.0',
  meta: { title: coverTitle, lang: 'zh-CN', author: author || 'gen-deck scaffold' },
  id: 'scaffold-' + themeId + '-' + Date.now().toString(36),
  stage: { width: 1920, height: 1080, fit: 'contain', background: (theme.vars.match(/--bg:(#[0-9a-fA-F]+)/) || [])[1] || '#0d1117' },
  defaults: { transition: { name: theme.transition, duration: 450 }, fx: theme.fx },
  fonts: [],
};

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${esc(coverTitle)}</title>
<script type="application/h4s+json">
${JSON.stringify(manifest, null, 2)}
</script>
</head>
<body>
<h4s-deck>

<!-- gen-deck.mjs · 主题「${theme.label}」· 大纲 ${sections.length} 章节 · 0.4.0 脚手架 -->
<style>
${LAYOUT_BASE}
${LAYOUTS.map((L) => L.css).join('\n')}
:root { ${theme.vars.replace(/\n\s*/g, ' ')} }
${THEME_BASE}
${theme.deco}
</style>

${bodyPages.join('')}
</h4s-deck>
<script src="../player/h4s.player.js"></script>
</body>
</html>
`;

const slug = coverTitle.replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40) || 'deck';
const out = outFile || path.join(ROOT, 'examples', slug + '.html');
fs.writeFileSync(out, html, 'utf8');
console.log('脚手架完成: ' + out);
console.log('  主题「' + theme.label + '」· 章节 ' + sections.length + ' · 总页数 ' + (bodyPages.length));
console.log('下一步: node tools/h4s-build.mjs "' + out + '" --subset --share');
