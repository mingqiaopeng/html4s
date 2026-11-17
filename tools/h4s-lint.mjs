#!/usr/bin/env node
/**
 * h4s-lint.mjs — html4s deck 质量检查（P1）
 *
 * 用法:
 *   node tools/h4s-lint.mjs <deck.html|deck.html4s> [--json out.json]
 *
 * 检查项:
 *   结构: 清单 JSON 合法 · fonts[].file 存在 · 每页标题 · 每页备注
 *   渲染: 舞台溢出（文字元素=错误，装饰=警告） · 文字过小 · 对比度不足
 *
 * 退出码: 有 error → 1（AI 循环据此重试）
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const inFile = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const jsonOutIdx = process.argv.indexOf('--json');
const jsonOut = jsonOutIdx > -1 ? process.argv[jsonOutIdx + 1] : null;
const htmlOutIdx = process.argv.indexOf('--html');
const htmlOut = htmlOutIdx > -1 ? process.argv[htmlOutIdx + 1] : null;

if (!inFile) { console.error('用法: node tools/h4s-lint.mjs <deck> [--json report.json] [--html report.html]'); process.exit(2); }
const inPath = path.resolve(inFile);
if (!fs.existsSync(inPath)) { console.error('文件不存在: ' + inPath); process.exit(2); }

/* ---------- 结构检查（Node 侧） ---------- */
const errors = [];
const warnings = [];
let html = fs.readFileSync(inPath, 'utf8');

let manifest = {};
{
  const m = /<script type="application\/h4s\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) errors.push('E-MANIFEST · 缺少 <script type="application/h4s+json"> 清单');
  else {
    try { manifest = JSON.parse(m[1]); }
    catch (e) { errors.push('E-MANIFEST · 清单 JSON 解析失败: ' + e.message); }
  }
}
for (const f of manifest.fonts || []) {
  if (f.file && !fs.existsSync(path.resolve(path.dirname(inPath), f.file)))
    errors.push('E-FONT · 字体文件不存在: ' + f.file);
}

const KNOWN_TRANS = new Set(['none','fade','slide','push','zoom','wipe','flip','zoomblur','cube','iris','unfold','rise','dissolve','curtain','blinds','checkerboard','pixelate']);
{
  let m2;
  const tre = /<section[^>]*?data-h4s-transition="([^"]*)"/g;
  while ((m2 = tre.exec(html))) {
    const v = m2[1].trim().toLowerCase();
    if (v && !KNOWN_TRANS.has(v)) warnings.push('W-TRANSITION · 未知转场名 "' + v + '"（将被忽略）——可用: ' + [...KNOWN_TRANS].filter(x => x !== 'none').join(' '));
  }
  if (manifest.defaults && manifest.defaults.transition && manifest.defaults.transition.name) {
    const dn = String(manifest.defaults.transition.name).trim().toLowerCase();
    if (dn && !KNOWN_TRANS.has(dn)) warnings.push('W-TRANSITION · 清单 defaults.transition.name "' + dn + '" 未知（将回退 fade）');
  }
  if (manifest.defaults && manifest.defaults.fx) {
    const fxv = String(manifest.defaults.fx).trim().toLowerCase();
    if (fxv !== 'none' && !['stars', 'snow', 'dust'].includes(fxv)) warnings.push('W-FX · 清单 defaults.fx "' + fxv + '" 未知——可用: stars snow dust');
  }
}

/* ---------- 渲染检查（无头 Edge + CDP） ---------- */
// 准备 lint 副本：剥离播放器（保证文档模式，尺寸以模板 CSS 为准）
let lintHtml = html.replace(/<script\s[^>]*src="[^"]*h4s\.player\.js"[^>]*>\s*<\/script>/gi, '');
lintHtml = lintHtml.replace(/<script>([\s\S]*?__H4S_LOADED__[\s\S]*?)<\/script>/gi, '');
const lintPath = path.join(path.dirname(inPath), path.basename(inPath).replace(/\.(html4s|html)$/i, '') + '.h4s-lint.html');
fs.writeFileSync(lintPath, lintHtml);

const measurement = `
(function () {
  function slideRect(el) { return el.getBoundingClientRect(); }
  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling)
      if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  }
  function bgOf(el, slideBg) {
    var cur = el;
    while (cur && cur !== document.body) {
      var c = getComputedStyle(cur).backgroundColor;
      if (c && !/rgba?\\([^)]*,\\s*0\\s*\\)/.test(c) && c !== 'transparent') return c;
      cur = cur.parentElement;
    }
    return slideBg;
  }
  function parseColor(c) {
    var m = /rgba?\\(([^)]+)\\)/.exec(c);
    if (!m) return null;
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function blend(fg, bg) {
    var a = fg.a === undefined ? 1 : fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a)
    };
  }
  function lum(c) {
    var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(fg, bg) {
    var l1 = lum(fg), l2 = lum(bg);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function rgbStr(c) {
    return 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')';
  }

  var slides = Array.prototype.slice.call(
    document.querySelectorAll('h4s-slide, h4s-deck > section, .slides > section, body > section.slide')
  ).filter(function (el) { return el.getBoundingClientRect().width > 300; });

  var bodyBg = getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';

  var pages = slides.map(function (slide, index) {
    var sRect = slideRect(slide);
    var title = slide.getAttribute('data-h4s-title')
      || (slide.querySelector('h1,h2') ? slide.querySelector('h1,h2').textContent.trim().slice(0, 40) : '');
    var notes = !!slide.querySelector('h4s-notes, .h4s-notes-el');
    var sBg = bgOf(slide, bodyBg);

    var issues = [];
    var checked = 0;
    var all = slide.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var r = el.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) continue;
      checked++;

      // 舞台溢出（行内叶子元素按字号放宽容差：字体下行度不是可见墨迹）
      var fs0 = parseFloat(cs.fontSize) || 16;
      var tol = (cs.display === 'inline' && el.children.length === 0) ? Math.max(2, fs0 * 0.25) : 2;
      var over = [];
      if (r.left < sRect.left - tol) over.push('左' + Math.round(sRect.left - r.left) + 'px');
      if (r.right > sRect.right + tol) over.push('右' + Math.round(r.right - sRect.right) + 'px');
      if (r.top < sRect.top - tol) over.push('上' + Math.round(sRect.top - r.top) + 'px');
      if (r.bottom > sRect.bottom + tol) over.push('下' + Math.round(r.bottom - sRect.bottom) + 'px');
      if (over.length) {
        var leaf = el.children.length === 0;
        var text = (el.textContent || '').trim().slice(0, 24);
        issues.push({
          kind: leaf || hasOwnText(el) ? 'overflow-text' : 'overflow-deco',
          sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''),
          detail: over.join('/'), text: text
        });
      }

      // 文本被容器裁切（架构 §5.3 text-clipped）：bounding box 未越界，
      // 但 white-space:nowrap / overflow:hidden 把文本裁掉了——最隐蔽的一类。
      // 仅检测自身可裁（overflowX/Y 为 hidden/clip/auto/scroll）的元素：
      // 纯行高压缩的 scroll 超出（overflow 可见时墨迹完整渲染）不是裁切。
      if (hasOwnText(el)) {
        var csx = cs.overflowX, csy = cs.overflowY;
        var clippable = csx === 'hidden' || csx === 'clip' || csx === 'auto' || csx === 'scroll'
          || csy === 'hidden' || csy === 'clip' || csy === 'auto' || csy === 'scroll';
        if (clippable) {
          var clip = [];
          if (el.scrollWidth > el.clientWidth + 2) clip.push('右' + (el.scrollWidth - el.clientWidth) + 'px');
          /* 垂直方向：行高压缩时字形墨迹通常仍在盒内，仅布局溢出——
             容差 = 字号 × 0.35（下行度/紧排范围），超出才报 */
          if (el.scrollHeight > el.clientHeight + Math.max(8, fs0 * 0.35)) clip.push('下' + (el.scrollHeight - el.clientHeight) + 'px');
          if (clip.length) {
            issues.push({
              kind: 'text-clipped',
              sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''),
              detail: clip.join('/'), text: (el.textContent || '').trim().slice(0, 24)
            });
          }
        }
      }

      var text = (el.textContent || '').trim();
      if (!hasOwnText(el) || !text) continue;

      // 字号
      var fs = parseFloat(cs.fontSize);
      if (fs < 13) issues.push({ kind: 'font-small', sel: el.tagName.toLowerCase(), detail: fs.toFixed(1) + 'px', text: text.slice(0, 24) });
      else if (fs < 14) issues.push({ kind: 'font-small-warn', sel: el.tagName.toLowerCase(), detail: fs.toFixed(1) + 'px', text: text.slice(0, 24) });

      // 对比度
      var fgC = parseColor(cs.color);
      var bgC = parseColor(bgOf(el, rgbStr(parseColor(sBg) || { r: 255, g: 255, b: 255 })));
      if (fgC && bgC) {
        var ratio = contrast(blend(fgC, bgC), bgC);
        if (ratio < 3) issues.push({ kind: 'contrast', sel: el.tagName.toLowerCase(), detail: ratio.toFixed(2) + ':1', text: text.slice(0, 24) });
        else if (ratio < 4.5 && fs < 24) issues.push({ kind: 'contrast-warn', sel: el.tagName.toLowerCase(), detail: ratio.toFixed(2) + ':1', text: text.slice(0, 24) });
      }
    }

    return {
      index: index + 1,
      id: slide.id || '',
      title: title,
      notes: notes,
      checked: checked,
      issues: issues
    };
  });

  return { pages: pages, bodyBg: bodyBg, count: slides.length };
})();
`;

try {
  const deckUrl = pathToFileURL(lintPath).href;
  const result = await withPage(deckUrl, async ({ ev }) => await ev(measurement), { width: 1920, height: 1080 });

  /* ---------- tofu / 缺字检测：内嵌子集字符集指纹比对 ----------
     document.fonts.check 在 Chromium 对未覆盖字符仍返回 true（不可信），
     canvas 像素法受字体回退怪癖干扰 —— 改用构建时写入清单的
     fontSubsetChars 指纹：deck 文本字符 ∉ 子集 → 回退系统字体 → W-TOFU。
     栈内回退（拉丁族→中族混排）是设计意图，不算缺字。 */
  if (manifest.fontSubsetChars && Object.keys(manifest.fontSubsetChars).length) {
    const fams = Object.keys(manifest.fontSubsetChars);
    const subsetSets = {};
    for (const [fam, pts] of Object.entries(manifest.fontSubsetChars)) subsetSets[fam] = new Set(pts);
    const collectScript = `
(() => {
  const m = document.querySelector('script[type="application/h4s+json"]');
  if (!m) return {};
  let mf = {}; try { mf = JSON.parse(m.textContent); } catch (e) { return {}; }
  const fams = Object.keys(mf.fontSubsetChars || {});
  if (!fams.length) return {};
  const groups = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent || !n.textContent.trim()) continue;
    const p = n.parentElement;
    if (!p) continue;
    const cs = getComputedStyle(p);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    /* 元素栈中出现的内嵌族（按序） */
    const famInStack = fams.filter(f => (cs.fontFamily || '').indexOf(f) !== -1);
    if (!famInStack.length) continue;
    const key = famInStack.join('|');
    const g = groups[key] = groups[key] || { chars: new Set(), sample: '' };
    for (const ch of n.textContent) {
      if (!/\\s/.test(ch)) g.chars.add(ch);
      if (!g.sample) g.sample = (p.textContent || '').trim().slice(0, 16);
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(groups)) out[k] = { chars: [...v.chars], sample: v.sample };
  return out;
})()
`;
    try {
      const groups = await withPage(deckUrl, async ({ ev }) => await ev(collectScript), { width: 1920, height: 1080 });
      for (const [stackFams, info] of Object.entries(groups || {})) {
        const stackList = stackFams.split('|');
        const missing = new Map(); /* ch -> first missing fam */
        for (const ch of info.chars) {
          const covered = stackList.some((fam) => subsetSets[fam] && subsetSets[fam].has(ch.codePointAt(0)));
          if (!covered) missing.set(ch, stackList[0]);
        }
        if (missing.size) {
          const chars = [...missing.keys()];
          const list = chars.slice(0, 12).map((c) => c + '(「' + info.sample + '」)').join(' ');
          const more = chars.length > 12 ? ' …共 ' + chars.length + ' 字' : '';
          warnings.push('W-TOFU · 内嵌子集缺少 ' + missing.size + ' 个字符: ' + list + more +
            ' —— 该处将回退系统字体，请重新构建（h4s-build --subset）');
        }
      }
    } catch { /* tofu 检查失败不影响主结果 */ }
  }

  for (const p of result.pages) {
    if (!p.title) warnings.push('W-TITLE · 第 ' + p.index + ' 页缺少标题（data-h4s-title 或首个 h1/h2）');
    if (!p.notes) warnings.push('W-NOTES · 第 ' + p.index + ' 页缺少演讲备注 h4s-notes');
    for (const it of p.issues) {
      const loc = '第 ' + p.index + ' 页 · ' + it.sel + (it.text ? '「' + it.text + '」' : '');
      if (it.kind === 'overflow-text') errors.push('E-OVERFLOW · ' + loc + ' 舞台溢出(' + it.detail + ')');
      else if (it.kind === 'font-small') errors.push('E-FONT-SIZE · ' + loc + ' 字号过小(' + it.detail + ')');
      else if (it.kind === 'contrast') errors.push('E-CONTRAST · ' + loc + ' 对比度过低(' + it.detail + ')');
      else if (it.kind === 'contrast-warn') warnings.push('W-CONTRAST · ' + loc + ' 对比度偏低(' + it.detail + ')');
      else if (it.kind === 'font-small-warn') warnings.push('W-FONT-SIZE · ' + loc + ' 字号偏小(' + it.detail + ')');
      else if (it.kind === 'overflow-deco') warnings.push('W-OVERFLOW-DECO · ' + loc + ' 装饰元素溢出(' + it.detail + ')——若为有意出血可忽略');
      else if (it.kind === 'text-clipped') errors.push('E-TEXT-CLIP · ' + loc + ' 文本被容器裁切(' + it.detail + ')——bounding box 未越界但 nowrap/overflow-hidden 裁掉了文字');
    }
  }

  /* ---------- 报告 ---------- */
  const errCount = errors.length, warnCount = warnings.length;
  console.log('deck: ' + inPath);
  console.log('页面: ' + result.count + ' · 元素检查: ' + result.pages.reduce((a, p) => a + p.checked, 0));
  console.log('');
  if (errCount) { console.log('✗ 错误 ' + errCount + '：'); errors.forEach((e) => console.log('  ' + e)); }
  if (warnCount) { console.log('⚠ 警告 ' + warnCount + '：'); warnings.forEach((w) => console.log('  ' + w)); }
  if (!errCount && !warnCount) console.log('✓ 未发现问题');
  console.log('');
  console.log(errCount ? '结论: 未通过（' + errCount + ' 错误 / ' + warnCount + ' 警告）' : '结论: 通过（' + warnCount + ' 警告）');

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify({ deck: inPath, errors, warnings, pages: result.pages }, null, 2), 'utf8');
    console.log('JSON 报告: ' + jsonOut);
  }
  if (htmlOut) {
    /* 自包含分页 HTML 报告（深色风格，可直接发给作者/AI 修复回环） */
    const KIND = {
      'overflow-text': ['E', '舞台溢出'], 'font-small': ['E', '字号过小'], 'contrast': ['E', '对比度过低'],
      'text-clipped': ['E', '文本被裁切'], 'overflow-deco': ['W', '装饰溢出'], 'contrast-warn': ['W', '对比度偏低'],
      'font-small-warn': ['W', '字号偏小'],
    };
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const pageCards = result.pages.map((p) => {
      const items = p.issues.map((it) => {
        const [lv, label] = KIND[it.kind] || [it.kind.startsWith('E') ? 'E' : 'W', it.kind];
        return `<div class="iss ${lv}"><span class="tag">${lv}</span><b>${esc(label)}</b> <code>${esc(it.sel)}</code> — ${esc(it.detail)}${it.text ? ' ·「' + esc(it.text) + '」' : ''}</div>`;
      }).join('');
      return `<div class="page ${p.issues.length ? 'bad' : 'ok'}">
  <div class="ph"><span class="pn">第 ${p.index} 页</span><span class="pt">${esc(p.title || '(无标题)')}</span>
    <span class="pm">${p.notes ? '备注 ✓' : '备注 ✗'} · 元素 ${p.checked}</span></div>
  ${items || '<div class="clean">✓ 无问题</div>'}
</div>`;
    }).join('\n');
    const verdict = errCount ? '未通过' : '通过';
    const vcolor = errCount ? '#e5484d' : '#2ea043';
    const doc = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>lint 报告 · ${esc(path.basename(inPath))}</title>
<style>
body{margin:0;background:#0d1117;color:#e2e8f0;font:14px/1.6 system-ui,'Microsoft YaHei',sans-serif;padding:32px}
h1{font-weight:200;font-size:28px;letter-spacing:-.02em;margin:0 0 4px}
.meta{color:#7d8590;font-size:13px;margin-bottom:20px}
.badge{display:inline-block;padding:4px 14px;border-radius:20px;background:${vcolor}22;color:${vcolor};border:1px solid ${vcolor}55;font-weight:600}
.stats{color:#c9d1d9;margin:10px 0 26px}
.page{background:#161b22;border:1px solid #30363d;border-radius:10px;margin:14px 0;padding:14px 18px}
.page.ok{border-left:3px solid #2ea043}
.page.bad{border-left:3px solid #e5484d}
.ph{display:flex;gap:14px;align-items:baseline;margin-bottom:10px}
.pn{font-weight:600;color:#e6edf3}.pt{color:#8b949e}.pm{margin-left:auto;color:#7d8590;font-size:12px}
.iss{padding:5px 0;border-top:1px solid #21262d}
.iss.E .tag{background:#e5484d}.iss.W .tag{background:#d29922}
.tag{display:inline-block;width:20px;height:20px;border-radius:4px;text-align:center;line-height:20px;font-weight:700;font-size:12px;color:#0d1117;margin-right:8px}
.iss b{color:#c9d1d9}
code{background:#21262d;padding:1px 6px;border-radius:4px;color:#79c0ff;font-size:12px}
.clean{color:#2ea043}
code,pre{font-family:ui-monospace,Consolas,monospace}
</style></head><body>
<h1>lint 报告 · ${esc(path.basename(inPath))}</h1>
<div class="meta">生成时间 ${new Date().toLocaleString('zh-CN')} · ${result.count} 页 · 元素检查 ${result.pages.reduce((a, p) => a + p.checked, 0)} · <span class="badge">${verdict}</span></div>
<div class="stats">错误 ${errCount} · 警告 ${warnCount}</div>
${pageCards}
</body></html>`;
    fs.writeFileSync(htmlOut, doc, 'utf8');
    console.log('HTML 报告: ' + htmlOut);
  }
  process.exit(errCount ? 1 : 0);
} catch (e) {
  console.error('lint 执行失败: ' + e.message);
  process.exit(2);
}
