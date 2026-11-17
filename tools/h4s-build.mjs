#!/usr/bin/env node
/**
 * h4s-build.mjs — html4s 构建工具（P1 最小实现）
 * 把"开发期 deck（引用外部播放器/字体/图标）"打包为单文件 .html4s
 *
 * 用法:
 *   node tools/h4s-build.mjs <deck.html|deck.html4s> [-o out.html4s] [--subset] [--max-font-mb 8]
 *
 * 做什么:
 *   1. 内嵌 h4s 播放器运行时（<script src="…h4s.player.js"> → 内联）
 *   2. 内嵌 lucide 图标库（unpkg CDN 引用 → 下载并内联，离线可用）
 *   3. 字体：读清单 fonts[].file（本机字体文件）→ 有 pyftsubset 时按 deck 实际用字
 *      子集化为 woff2，否则整文件内嵌 → 注入 @font-face data URL
 *   4. 产物: <同名>.html4s（字节仍是合法 HTML，双击用壳播放器打开）
 *
 * 字体许可: 内嵌前请确认字体允许嵌入（fsType）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function download(url) {
  return execFileSync('curl', ['-sL', '--max-time', '90', url], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
}

/* ---------- 参数 ---------- */
const argv = process.argv.slice(2);
const inFile = argv.find(a => !a.startsWith('--'));
const getOpt = (name, def) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : def;
};
const outFile = getOpt('-o', null);
const doSubset = argv.includes('--subset');
const maxFontMB = parseFloat(getOpt('--max-font-mb', '8'));

if (!inFile) { console.error('用法: node tools/h4s-build.mjs <deck> [-o out.html4s] [--subset]'); process.exit(1); }
const inPath = path.resolve(inFile);
let html = fs.readFileSync(inPath, 'utf8');
const deckDir = path.dirname(inPath);
const base = path.basename(inPath).replace(/\.(html|html4s)$/i, '');

const report = [];
const warn = (m) => { report.push('⚠ ' + m); console.error('⚠ ' + m); };
const ok = (m) => { report.push('✓ ' + m); console.log('✓ ' + m); };

/* ---------- 工具函数 ---------- */
function readManifest(src) {
  const m = /<script type="application\/h4s\+json">([\s\S]*?)<\/script>/.exec(src);
  if (!m) return {};
  try { return JSON.parse(m[1]); } catch (e) { warn('清单 JSON 解析失败: ' + e.message); return {}; }
}

function collectUsedChars(src) {
  // 去掉 script/style 后的可见文本 + 属性中的中文，粗略但覆盖 lint 需求
  const visible = src
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const set = new Set();
  for (const ch of visible) {
    const c = ch.codePointAt(0);
    if (c > 0x20) set.add(ch); // 全部非空白字符都收，避免漏字
  }
  // 常用标点与数字保险垫
  for (const ch of "0123456789.,:;%()[]{}+—–·、，。：；！？「」『』《》“”‘’…×÷→←↑↓•©®™°±") set.add(ch);
  return [...set].join('');
}

function trySubset(fontPath, text, outPath) {
  try {
    execFileSync('python', ['-c', 'import fontTools, brotli'], { stdio: 'ignore' });
  } catch { return null; }
  const txtFile = outPath + '.chars.txt';
  fs.writeFileSync(txtFile, text, 'utf8');
  try {
    execFileSync('python', ['-m', 'fontTools.subset', fontPath,
      `--text-file=${txtFile}`,
      '--flavor=woff2',
      `--output-file=${outPath}`,
      '--layout-features=*', '--glyph-names', '--notdef-outline',
      '--name-IDs=*', '--name-languages=*'], { stdio: 'ignore' });
    return outPath;
  } catch (e) { warn('pyftsubset 失败: ' + e.message); return null; }
  finally {
    try { fs.unlinkSync(txtFile); } catch { }
  }
}

function inlineScript(htmlStr) {
  // <script src="X"></script> → 内联（X 相对 deck 目录；lucide CDN 下载内联）
  const re = /<script\s+src="([^"]+)"\s*><\/script>/g;
  return htmlStr.replace(re, (m, src0) => {
    if (/^https?:\/\//.test(src0)) {
      if (/lucide/i.test(src0)) {
        try {
          const url = src0
            .replace('unpkg.com', 'cdn.jsdelivr.net/npm')
            .replace('cdn.jsdelivr.net', 'fastly.jsdelivr.net');
          const code = download(url);
          ok('lucide 已内联 (' + (code.length / 1024).toFixed(0) + 'KB)');
          return '<script>\n' + code + '\nif (window.lucide) lucide.createIcons();\n</script>';
        } catch (e) {
          warn('lucide 下载失败，保留 CDN 引用: ' + e.message);
          return m;
        }
        /* 注意: 上面的 return 模板串若改为拼接外部代码，必须用函数替换器（$ 模式陷阱） */
      }
      return m; // 其他 CDN 引用不动
    }
    const p = path.resolve(deckDir, src0);
    if (!fs.existsSync(p)) { warn('内联失败，文件不存在: ' + src0); return m; }
    const code = fs.readFileSync(p, 'utf8');
    ok('内联脚本: ' + src0 + ' (' + (code.length / 1024).toFixed(0) + 'KB)');
    return '<script>\n' + code + '\n</script>';
  });
}

/* ---------- 1. 内嵌播放器 ---------- */
{
  const playerRe = /<script\s+src="([^"]*h4s\.player\.js)"\s*><\/script>/;
  const m = playerRe.exec(html);
  if (m) {
    const playerPath = path.resolve(deckDir, m[1]);
    if (fs.existsSync(playerPath)) {
      const code = fs.readFileSync(playerPath, 'utf8');
      /* 必须用函数替换器：字符串替换会把代码里的 $$/$& 等 $ 模式展开（曾把 function $$ 折叠成 function $） */
      html = html.replace(playerRe, function () { return '<script>\n' + code + '\n</script>'; });
      ok('播放器运行时已内嵌 (' + (code.length / 1024).toFixed(0) + 'KB)');
    } else {
      warn('播放器文件不存在: ' + m[1]);
    }
  } else {
    ok('播放器已内联（无外部引用）');
  }
}

/* ---------- 2. 内嵌 lucide ---------- */
html = inlineScript(html);

/* ---------- 3. 字体处理 ---------- */
const manifest = readManifest(html);
const fonts = Array.isArray(manifest.fonts) ? manifest.fonts : [];
const faceCss = [];
let usedChars = null;
const subsetFamilies = new Set(); /* 子集化的族（写入 fontSubsetChars 指纹） */

for (const f of fonts) {
  if (!f.file) { ok(`字体 "${f.family}" 未指定文件 → 使用本机已安装字体（不内嵌）`); continue; }
  const fp = path.resolve(deckDir, f.file);
  if (!fs.existsSync(fp)) { warn(`字体文件不存在: ${f.file}`); continue; }

  const mb = fs.statSync(fp).size / 1024 / 1024;
  if (mb > maxFontMB && !doSubset) {
    warn(`字体 ${f.file} ${mb.toFixed(1)}MB 超预算 ${maxFontMB}MB —— 加 --subset 启用子集化`);
  }

  let embedPath = fp;
  if (doSubset) {
    if (!usedChars) usedChars = collectUsedChars(html);
    const sub = trySubset(fp, usedChars, path.join(deckDir, `.h4s-sub-${Date.now()}.woff2`));
    if (sub) {
      const subSize = fs.statSync(sub).size / 1024;
      ok(`字体 ${path.basename(fp)} 子集化: ${(mb * 1024).toFixed(0)}KB → ${subSize.toFixed(0)}KB (${usedChars.length} 字符)`);
      embedPath = sub;
    } else {
      warn('子集化不可用（需 python + fonttools + brotli），整文件内嵌');
    }
  }

  const ext = path.extname(embedPath).toLowerCase().replace('.', '');
  const formatMap = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype', ttcc: 'truetype-collection' };
  const format = formatMap[ext] || 'truetype';
  /* fsType 嵌入许可检查（OS/2 表）：0=可安装 8=可编辑 → OK；2=受限 4=预览打印 → 警告。
     此前只在注释里提醒，现在真正读字体文件检查。 */
  try {
    execFileSync('python', ['-c', 'import fontTools'], { stdio: 'ignore' });
    const py = `from fontTools.ttLib import TTFont
import sys
ft = TTFont(sys.argv[1], fontNumber=0, lazy=True)
print(ft['OS/2'].fsType if 'OS/2' in ft else -1)`;
    const tmpPy = path.join(deckDir, '.h4s-fstype.py');
    fs.writeFileSync(tmpPy, py, 'utf8');
    const fstype = parseInt(execFileSync('python', [tmpPy, embedPath], { encoding: 'utf8' }).trim(), 10);
    fs.unlinkSync(tmpPy);
    if (fstype === 2 || fstype === 4) warn(`字体 ${f.family} fsType=${fstype}（${fstype === 2 ? '受限嵌入' : '仅预览打印'}）——分发前请确认授权条款`);
  } catch { /* fontTools 不可用则跳过检查（子集化本身也依赖它） */ }

  const b64 = fs.readFileSync(embedPath).toString('base64');
  /* 子集化时写入 unicode-range：让浏览器/工具准确知道该 face 覆盖哪些字符
     （缺 range 时浏览器误认为全覆盖，lint 无法检测缺字） */
  let rangeCss = '';
  if (embedPath !== fp && typeof usedChars === 'string' && usedChars.length) {
    subsetFamilies.add(f.family);
    const pts = [...new Set([...usedChars].map((c) => c.codePointAt(0)))].sort((a, b) => a - b);
    const hex = (n) => n.toString(16).toUpperCase().padStart(4, '0');
    const parts = [];
    let s = pts[0], prev = pts[0];
    for (let i = 1; i <= pts.length; i++) {
      const p = pts[i];
      if (p !== prev + 1) {
        parts.push(s === prev ? 'U+' + hex(s) : 'U+' + hex(s) + '-' + hex(prev));
        s = p;
      }
      prev = p;
    }
    if (parts.length) rangeCss = 'unicode-range:' + parts.join(',') + ';';
  }
  faceCss.push(
    `@font-face{font-family:"${f.family}";src:url(data:font/${format};base64,${b64}) format("${format}");` +
    `font-weight:${f.weight || 'normal'};font-style:${f.style || 'normal'};font-display:swap;${rangeCss}}`
  );
  if (embedPath !== fp && fs.existsSync(embedPath) && embedPath.includes('.h4s-sub-')) fs.unlinkSync(embedPath);
}

if (faceCss.length) {
  const styleTag = '<style>/* h4s build: 内嵌字体 */\n' + faceCss.join('\n') + '\n</style>';
  if (html.includes('</head>')) html = html.replace('</head>', styleTag + '\n</head>');
  else html = styleTag + html;
  ok(`内嵌字体 @font-face × ${faceCss.length}`);
}

/* ---------- 4. 清单中的字体声明改为内嵌态标记（向前兼容） ---------- */
if (fonts.length && html.includes('"fonts":')) {
  /* 子集字符集指纹：lint 用它判定 deck 文本是否超出内嵌覆盖（改字未重建 → W-TOFU） */
  let flags = '"fontsEmbedded": true, "fontsSrc": "inline",';
  if (subsetFamilies.size) {
    const map = {};
    for (const fam of subsetFamilies) map[fam] = [...new Set([...usedChars].map((c) => c.codePointAt(0)))];
    flags += ' "fontSubsetChars": ' + JSON.stringify(map) + ',';
  }
  html = html.replace(/"fonts":\s*\[/, flags + ' "fonts": [');
}

/* ---------- 5. 输出 ---------- */
const out = outFile || path.join(deckDir, base + '.html4s');
fs.writeFileSync(out, html);
const totalKB = (fs.statSync(out).size / 1024).toFixed(0);
console.log('\n=== 构建完成 ===');
console.log('产物: ' + out + ' (' + totalKB + ' KB)');
console.log(report.join('\n'));
