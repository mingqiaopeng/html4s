#!/usr/bin/env node
/* import-pptx.mjs — PowerPoint (.pptx) → html4s 源（阶段4e 基础导入器）
 *
 * 零依赖：手写 zip 读取（EOCD → 中央目录 → 本地头 → inflate）。
 * 提取：每页标题（ph type=title/ctrTitle）+ 段落文本 + 图片（data URI 内嵌，
 *       单图 ≤2MB / 总量 ≤12MB，超出跳过并警告）+ 备注（notesSlideN）。
 * 定位是"文本与资产迁移"——版式不迁移，导入后需重套模板（正是 html4s 技能擅长的事）。
 *
 * 用法: node tools/import-pptx.mjs <deck.pptx> [-o out.h4s-src.html]
 * 产出: <base>.h4s-src.html → node tools/h4s-build.mjs <out> --subset --share
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const inFile = argv.find((a) => !a.startsWith('--'));
const getOpt = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : null; };
const outFile = getOpt('-o');
if (!inFile || !fs.existsSync(inFile)) {
  console.error('用法: node tools/import-pptx.mjs <deck.pptx> [-o out.h4s-src.html]');
  process.exit(2);
}
const base = path.basename(inFile).replace(/\.pptx$/i, '');

/* ---------- 最小 zip 读取 ---------- */
function readZip(buf) {
  let e = buf.length - 22;
  for (; e >= 0; e--) if (buf.readUInt32LE(e) === 0x06054b50) break;
  if (e < 0) throw new Error('不是 zip 文件（找不到 EOCD）');
  const count = buf.readUInt16LE(e + 10);
  const cdOff = buf.readUInt32LE(e + 16);
  const files = {};
  let p = cdOff;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commLen;
    const lnLen = buf.readUInt16LE(lho + 26), leLen = buf.readUInt16LE(lho + 28);
    const dataOff = lho + 30 + lnLen + leLen;
    const raw = buf.slice(dataOff, dataOff + csize);
    files[name] = method === 0 ? raw
      : method === 8 ? zlib.inflateSync(raw)
      : (() => { throw new Error('不支持的 zip 压缩方法: ' + method); })();
  }
  return files;
}

const zip = readZip(fs.readFileSync(path.resolve(inFile)));
const MB = (b) => (b / 1024 / 1024).toFixed(1) + 'MB';
const decode = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
/* 段落文本：<a:p> 内所有 <a:t> 拼接 */
const paragraphs = (xml) => {
  const out = [];
  const re = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g;
  let m;
  while ((m = re.exec(xml))) {
    const ts = [...m[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((x) => decode(x[1])).join('');
    if (ts.trim()) out.push(ts.trim());
  }
  return out;
};

/* ---------- 枚举幻灯片（slideN.xml 数字序） ---------- */
const slideNames = Object.keys(zip)
  .filter((n) => /^ppt\/slides\/slide(\d+)\.xml$/.test(n))
  .sort((a, b) => parseInt(/(\d+)\.xml$/.exec(a)[1], 10) - parseInt(/(\d+)\.xml$/.exec(b)[1], 10));
if (!slideNames.length) { console.error('✗ 未找到 ppt/slides/*.xml —— 确认是 .pptx 文件'); process.exit(1); }

const relOf = (slideName) => {
  const relPath = slideName.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
  return zip[relPath] ? zip[relPath].toString('utf8') : '';
};
const relTarget = (rels, rid) => {
  const m = new RegExp('<Relationship[^>]*Id="' + rid + '"[^>]*Target="([^"]+)"').exec(rels)
    || new RegExp('<Relationship[^>]*Target="([^"]+)"[^>]*Id="' + rid + '"').exec(rels);
  return m ? m[1] : null;
};

let imgTotal = 0, imgSkipped = 0;
function mediaDataUri(rels, rid) {
  const t = relTarget(rels, rid);
  if (!t) return null;
  const norm = t.replace(/^\.\.\//, 'ppt/').replace(/^\//, '').replace(/^(?!ppt\/)/, 'ppt/');
  const raw = zip[norm];
  if (!raw) return null;
  if (raw.length > 2 * 1024 * 1024) { imgSkipped++; return null; }
  imgTotal += raw.length;
  if (imgTotal > 12 * 1024 * 1024) { imgSkipped++; return null; }
  const ext = (norm.split('.').pop() || 'png').toLowerCase();
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp' }[ext] || 'image/png';
  return `data:${mime};base64,${raw.toString('base64')}`;
}

function slideToHtml(xml, idx) {
  const rels = relOf('ppt/slides/slide' + (idx + 1) + '.xml');
  let title = '', body = [];
  /* 逐形状（p:sp）：标题占位符 → title；其余 → 正文段落 */
  const spRe = /<p:sp>([\s\S]*?)<\/p:sp>/g;
  let sp;
  while ((sp = spRe.exec(xml))) {
    const block = sp[1];
    const isTitle = /<p:ph[^>]*type="(ctrTitle|title)"/.test(block);
    const paras = paragraphs(block);
    if (isTitle && !title) title = paras.join(' ');
    else body.push(...paras);
  }
  /* 图片（p:pic 的 blip r:embed） */
  const imgs = [];
  const picRe = /<p:pic>[\s\S]*?<\/p:pic>/g;
  let pic;
  while ((pic = picRe.exec(xml))) {
    const rid = /r:embed="(rId\d+)"/.exec(pic[0]);
    if (rid) { const uri = mediaDataUri(rels, rid[1]); if (uri) imgs.push(uri); }
  }
  /* 备注（notesSlideN 与 slideN 同序对应） */
  const notesXml = zip['ppt/notesSlides/notesSlide' + (idx + 1) + '.xml'];
  const notes = notesXml ? paragraphs(notesXml.toString('utf8')).join(' ') : '';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const t = title || ('第 ' + (idx + 1) + ' 页');
  return `  <h4s-slide data-h4s-title="${esc(t).slice(0, 60).replace(/"/g, '&quot;')}">
    <h1>${esc(t)}</h1>
${body.map((p) => `    <p class="pt">${esc(p)}</p>`).join('\n')}
${imgs.map((u) => `    <img src="${u}" alt="">`).join('\n')}
    <h4s-notes hidden>${esc(notes)}</h4s-notes>
  </h4s-slide>
`;
}

const pages = slideNames.map((n, i) => slideToHtml(zip[n].toString('utf8'), i)).join('');
const deck = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${base}（pptx 导入）</title>
<script type="application/h4s+json">
{ "h4s": "1.0", "meta": { "title": ${JSON.stringify(base + "（pptx 导入）")}, "lang": "zh-CN", "author": "pptx import" }, "stage": { "width": 1920, "height": 1080, "background": "#fff" }, "fonts": [] }
</script>
<style>/* h4s pptx 导入基础版式：文本与图片迁移，视觉需重套模板 */
  body{margin:0;background:#fff;color:#111;font-family:system-ui,'Microsoft YaHei',sans-serif;}
  h4s-slide{display:block;width:1920px;height:1080px;box-sizing:border-box;padding:120px 140px;position:relative;background:#fff;overflow:hidden;}
  h1{font-size:64px;margin:0 0 50px;}
  .pt{font-size:30px;line-height:1.7;margin:0 0 22px;color:#222;}
  h4s-slide img{max-width:70%;max-height:60%;display:block;margin:30px 0;}
</style></head>
<body>
<h4s-deck>
${pages}</h4s-deck>
<script src="${path.relative(path.dirname(path.resolve(outFile || path.join(path.dirname(inFile), base + '.h4s-src.html'))), path.resolve(HERE, '..', 'player/h4s.player.js')).replace(/\\/g, '/')}"></script>
</body></html>
`;

const outPath = path.resolve(outFile || path.join(path.dirname(inFile), base + '.h4s-src.html'));
fs.writeFileSync(outPath, deck, 'utf8');
console.log('导入完成: ' + outPath + '（' + slideNames.length + ' 页' +
  (imgSkipped ? '，跳过大图 ' + imgSkipped + ' 张' : imgTotal ? '，内嵌图片 ' + MB(imgTotal) : '') + '）');
console.log('下一步: node tools/h4s-build.mjs "' + outPath + '" --subset --share');
console.log('注意: 基础版导入只迁移文本/图片/备注，版式请用 html4s 技能重套。');
