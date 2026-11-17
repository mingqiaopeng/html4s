#!/usr/bin/env node
/**
 * make-deck.mjs — 把 slides 片段组装进 html4s 模板，生成 deck 源文件
 *
 * 用法:
 *   node tools/make-deck.mjs --template <模板.html> --slides <slides片段.html> \
 *        --title "标题" [-o out.html] [--fonts fonts.json] [--autoslide 0]
 *
 * slides 片段: 只包含 <section class="slide …">…</section> 序列的文件，
 *              会整体替换模板中 <h4s-deck> … </h4s-deck> 之间的内容。
 * fonts.json:  JSON 数组，合并进清单 fonts[]（字体文件路径相对 deck 所在目录）。
 */
import fs from 'node:fs';

const argv = process.argv.slice(2);
const get = (name, def) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : def;
};
const templatePath = get('--template');
const slidesPath = get('--slides');
const title = get('--title', 'html4s 演示');
const outPath = get('-o');
const fontsFile = get('--fonts');
const autoslide = get('--autoslide', '0');
const playerSrc = get('--player-src');

if (!templatePath || !slidesPath) {
  console.error('用法: node tools/make-deck.mjs --template <t.html> --slides <s.html> --title "…" [-o out.html] [--fonts fonts.json] [--autoslide N]');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');
const slides = fs.readFileSync(slidesPath, 'utf8').trim();

/* 1. 替换 h4s-deck 内容（嵌套深度已由 adapt 保证，直接定位标签对） */
const openIdx = html.indexOf('<h4s-deck>');
const closeIdx = html.lastIndexOf('</h4s-deck>');
if (openIdx < 0 || closeIdx < 0 || closeIdx < openIdx) {
  console.error('模板中未找到 <h4s-deck>…</h4s-deck>');
  process.exit(1);
}
html = html.slice(0, openIdx) + '<h4s-deck>\n\n' + slides + '\n\n</h4s-deck>' + html.slice(closeIdx + '</h4s-deck>'.length);

/* 1b. 播放器引用路径（deck 位置与模板位置不同时重写） */
if (playerSrc) {
  html = html.replace(/(<script\s+src=")([^"]*h4s\.player\.js)("\s*><\/script>)/, '$1' + playerSrc + '$3');
}

/* 2. 标题 */
html = html.replace(/<title>[^<]*<\/title>/, '<title>' + title + '</title>');
html = html.replace(/"meta":\s*\{[^}]*\}/, '"meta": { "title": ' + JSON.stringify(title) + ', "lang": "zh-CN", "author": "Html4s Project" }');

/* 3. 播放信息 */
html = html.replace(/"autoslide":\s*\d+/, '"autoslide": ' + (parseInt(autoslide, 10) || 0));

/* 4. 字体声明 */
if (fontsFile) {
  const fonts = JSON.parse(fs.readFileSync(fontsFile, 'utf8'));
  html = html.replace(/"fonts":\s*\[[\s\S]*?\]/, '"fonts": ' + JSON.stringify(fonts, null, 2));
}

const out = outPath || templatePath.replace(/\.html$/, '.deck.html');
fs.writeFileSync(out, html);
console.log('deck 生成: ' + out + ' | 页数: ' + (slides.match(/<section/g) || []).length);
