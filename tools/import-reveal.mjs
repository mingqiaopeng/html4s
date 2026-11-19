#!/usr/bin/env node
/* import-reveal.mjs — reveal.js deck → html4s 源（阶段4e 导入适配器）
 *
 * 用法: node tools/import-reveal.mjs <reveal-deck.html> [-o out.h4s-src.html]
 * 映射: section→h4s-slide（垂直嵌套平铺）· data-transition→data-h4s-transition ·
 *       .fragment→data-h4s-frag · data-fragment-index→data-h4s-frag-order ·
 *       aside.notes→h4s-notes。保留原 <head>（主题样式），剥离 reveal 运行时脚本。
 * 产出: <base>.h4s-src.html —— 再用 h4s-build 构建：
 *       node tools/h4s-build.mjs <out> --subset --share
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const inFile = argv.find((a) => !a.startsWith('--'));
const getOpt = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const outFile = getOpt('-o');

if (!inFile || !fs.existsSync(inFile)) {
  console.error('用法: node tools/import-reveal.mjs <reveal-deck.html> [-o out.h4s-src.html]');
  process.exit(2);
}
const src = fs.readFileSync(path.resolve(inFile), 'utf8');
const base = path.basename(inFile).replace(/\.(html|htm)$/i, '');

/* ---- 栈式 <section> 解析（支持嵌套=reveal 垂直页）：嵌套子节点在父 inner 里
   留占位符，flatten 时剔除——外层内容一页 + 每个嵌套 section 各成一页 ---- */
function parseSections2(html) {
  const re = /<(\/?)section\b([^>]*)>/gi;
  const root = { attrs: '', inner: '', children: [] };
  const stack = [root];
  let last = 0, nid = 0;
  let m;
  while ((m = re.exec(html))) {
    stack[stack.length - 1].inner += html.slice(last, m.index);
    last = m.index + m[0].length;
    if (m[1] === '/') {
      if (stack.length > 1) {
        const done = stack.pop();
        stack[stack.length - 1].inner += `__H4S_NESTED_${done.__id ?? nid++}__`;
      }
    } else {
      const node = { attrs: m[2] || '', inner: '', children: [], __id: nid++ };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
  }
  stack[stack.length - 1].inner += html.slice(last);
  return { root, slots: null };
}
const parsed = parseSections2(src);
const byId = {};
(function index(node) { byId[node.__id] = node; node.children.forEach(index); })(parsed.root);
function flatten2(node) {
  const pages = [];
  if (node !== parsed.root) pages.push({ attrs: node.attrs, inner: node.inner.replace(/__H4S_NESTED_(\d+)__/g, '') });
  for (const c of node.children) pages.push(...flatten2(c));
  return pages;
}
const pages = flatten2(parsed.root).filter((p) => p.attrs !== '' || p.inner.trim());

/* ---- 属性/内容映射 ---- */
function toSlide(p, idx) {
  const attrs = p.attrs
    .replace(/data-transition=/gi, 'data-h4s-transition=');
  let inner = p.inner
    .replace(/data-fragment-index=/gi, 'data-h4s-frag-order=')
    .replace(/<aside\b([^>]*)>/gi, (mm, a) => /h4s-notes/.test(mm) ? mm : '<h4s-notes hidden' + a + '>')
    .replace(/<\/aside>/gi, '</h4s-notes>')
    /* .fragment / reveal 渐进类 → data-h4s-frag（已带 h4s 碎片属性的不动） */
    .replace(/<(\w+)((?:[^>"]|"[^"]*")*class="[^"]*\bfragment\b[^"]*"(?:[^>"]|"[^"]*")*)>/gi,
      (mm) => /data-h4s-frag/.test(mm) ? mm : mm.replace(/class="/i, 'data-h4s-frag="fade-up" class="'));
  /* 剥掉 reveal 的内联配置/依赖脚本残留标记 */
  inner = inner.replace(/<!--\s*\.slide:\s*data-transition=([^\s>]+)\s*-->/gi,
    (_mm, v) => ''); /* 伪注释分隔符在适配层已改写，这里兜底清掉 */
  const titleM = /<h[12][^>]*>([\s\S]*?)<\/h[12]>/i.exec(inner);
  const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim().slice(0, 40) : '第 ' + (idx + 1) + ' 页';
  return `  <h4s-slide data-h4s-title="${title.replace(/"/g, '&quot;')}"${attrs}>
${inner.trim()}
  </h4s-slide>
`;
}

/* ---- 组装输出（保留原 head 主题；剥离 reveal 脚本；追加热身清单+播放器） ---- */
let out = src;
/* 去掉 body 里原 reveal 容器（整个 body 由我们重建） */
const headM = /([\s\S]*?<head>[\s\S]*?<\/head>)/i.exec(out);
const head = headM ? headM[1] : '';
const title = (/<title>([^<]*)<\/title>/i.exec(head) || [])[1] || base;
const bodyCss = `
<style>/* h4s import: 基础页几何（reveal 主题样式保留作用于内容） */
  h4s-slide{display:block;width:1280px;height:720px;box-sizing:border-box;overflow:hidden;
    position:relative;background:#111;color:#eee;padding:80px 100px;font-family:inherit;}
  h4s-slide img{max-width:100%;max-height:70%;}
</style>`;
const deck = `<body>
<h4s-deck>
${pages.map(toSlide).join('')}
</h4s-deck>
<script type="application/h4s+json">
{ "h4s": "1.0", "meta": { "title": ${JSON.stringify(title || base)}, "lang": "zh-CN" }, "stage": { "width": 1280, "height": 720, "background": "#111" }, "fonts": [] }
</script>
${bodyCss}
<script src="${path.relative(path.dirname(path.resolve(outFile || path.join(path.dirname(inFile), base + '.h4s-src.html'))), path.resolve(HERE, '..', 'player/h4s.player.js')).replace(/\\/g, '/')}"></script>
</body></html>
`;
out = head + '\n' + deck;

const outPath = path.resolve(outFile || path.join(path.dirname(inFile), base + '.h4s-src.html'));
fs.writeFileSync(outPath, out, 'utf8');
console.log('导入完成: ' + outPath + '（' + pages.length + ' 页）');
console.log('下一步: node tools/h4s-build.mjs "' + outPath + '" --subset --share');
console.log('注意: reveal 运行时已剥离；全局主题样式保留，个别依赖 .reveal 容器选择器的样式可能需要微调。');
