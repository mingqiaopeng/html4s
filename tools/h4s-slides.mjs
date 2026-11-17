/* h4s-slides.mjs —— deck 增量编辑工具（消掉"改页码靠脚本全量替换"的手感缺口）
 *
 * 用法:
 *   node tools/h4s-slides.mjs insert <deck.html> --after <slide-id|序号> --file <snippet.html> [--id <新id>]
 *   node tools/h4s-slides.mjs move   <deck.html> --from <slide-id|序号> --to <序号>   # 排序（目标位置 1 起始）
 *   node tools/h4s-slides.mjs renumber <deck.html>          # 仅重编页码
 *   node tools/h4s-slides.mjs sync <deck.html> [--build]    # 重编号 + 有 .html4s 产物时自动重建（消双份真理）
 *
 * insert:
 *   - snippet 必须是 <section>…</section>（可多个），插入到指定 slide 之后
 *   - --after 支持 data-slide-id 或 1 起始序号；"0" = 插在最前
 *   - 新 section 的 data-slide-id 必须全 deck 唯一（--id 覆盖 snippet 内 id）
 * renumber / sync:
 *   - 重编 chrome/foot 区域里的 "NN / MM" 页码文本为顺序页码（其他正文数字不动）
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const cmd = args[0];
const deckFile = args[1];
const getOpt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };

if (!cmd || !deckFile || !['insert', 'move', 'renumber', 'sync'].includes(cmd)) {
  console.error('用法: node tools/h4s-slides.mjs insert|move|renumber|sync <deck.html> [选项]\n'
    + '  insert  --after <slide-id|序号> --file <snippet.html> [--id <新id>]\n'
    + '  move    --from <slide-id|序号> --to <序号>  排序\n'
    + '  sync    [--build]  重编页码 + 自动重建 .html4s 产物');
  process.exit(2);
}
const deckPath = path.resolve(deckFile);
if (!fs.existsSync(deckPath)) { console.error('deck 不存在: ' + deckPath); process.exit(2); }
let html = fs.readFileSync(deckPath, 'utf8');

/* ---- 解析 h4s-deck 内的 section 边界 ---- */
const deckStart = html.indexOf('<h4s-deck>');
const deckEnd = html.lastIndexOf('</h4s-deck>');
if (deckStart < 0 || deckEnd < 0) { console.error('未找到 <h4s-deck> 区'); process.exit(2); }
const before = html.slice(0, deckStart + '<h4s-deck>'.length);
const deck = html.slice(deckStart + '<h4s-deck>'.length, deckEnd);
const after = html.slice(deckEnd);

function splitSections(deckStr) {
  /* 按顶层 <section>…</section> 配对切分（容忍伪 section 注释不计入，因为注释里的
     "<section" 若以 <!-- --> 包裹不会被 tag 正则直接命中闭合配对——扫描只认真实 tag 序列） */
  const secs = [];
  const openRe = /<section\b/g;
  let pos = 0, depth = 0, start = 0;
  while (pos < deckStr.length) {
    const o = deckStr.slice(pos).search(openRe);
    const c = deckStr.slice(pos).indexOf('</section>');
    if (o < 0 && c < 0) break;
    if (o >= 0 && (c < 0 || o < c)) {
      depth++; pos += o + 8;
      if (depth === 1) start = pos - 8;
    } else {
      depth--; pos += c + 10;
      if (depth === 0) secs.push(deckStr.slice(start, pos));
    }
  }
  return secs;
}

function idOf(sec) {
  const m = /data-slide-id="([^"]*)"/.exec(sec) || /data-h4s-title="([^"]*)"/.exec(sec);
  return m ? m[1] : '';
}

/* ---- 页码重编号：chrome-min / foot 块内的 "NN / MM" ---- */
function renumberSections(secs) {
  const total = secs.length;
  let changed = 0;
  return secs.map((sec, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const tot = String(total).padStart(2, '0');
    let out = sec.replace(
      /(<div class="(l|r)"[^>]*>)([^<]*?)(\d{1,2}\s*\/\s*\d{1,3})([^<]*<\/div>)/g,
      (full, open, side, pre, oldNum, post) => { changed++; return open + pre + num + ' / ' + tot + post; });
    out = out.replace(/(<div class="foot">)([\s\S]*?)(<\/div>\s*<\/div>)/g,
      (full) => { /* foot 内若有 NN / MM 同样处理 */ return full.replace(/(\d{1,2})\s*\/\s*(\d{1,3})/, num + ' / ' + tot); });
    return out;
  });
}

/* ---- 命令实现 ---- */
if (cmd === 'move') {
  const fromRef = getOpt('--from'), toRef = getOpt('--to');
  if (!fromRef || !toRef) { console.error('move 需要 --from 与 --to'); process.exit(2); }
  const secs = splitSections(deck);
  const ids = secs.map(idOf);
  let fromIdx = /^\d+$/.test(fromRef) ? parseInt(fromRef, 10) - 1 : ids.indexOf(fromRef);
  if (fromIdx < 0 || fromIdx >= secs.length) { console.error('from 不存在: ' + fromRef); process.exit(2); }
  let toPos = parseInt(toRef, 10); // 移动后的目标位置（1 起始）
  if (!toPos || toPos < 1 || toPos > secs.length) { console.error('to 超出范围 1-' + secs.length); process.exit(2); }
  const [moved] = secs.splice(fromIdx, 1);
  secs.splice(toPos - 1, 0, moved);
  html = before + '\n' + renumberSections(secs).join('\n') + after;
  fs.writeFileSync(deckPath, html, 'utf8');
  console.log('✓ 已把第 ' + (fromIdx + 1) + ' 页移至第 ' + toPos + ' 位，页码已重编（共 ' + secs.length + ' 页）');
  console.log('  提醒: h4s-slides sync ' + deckFile + ' --build 重建产物');
} else if (cmd === 'insert') {
  const afterRef = getOpt('--after');
  const file = getOpt('--file');
  const newId = getOpt('--id');
  if (!afterRef || !file) { console.error('insert 需要 --after 与 --file'); process.exit(2); }
  let snippet = fs.readFileSync(path.resolve(file), 'utf8');
  if (!/<section\b/.test(snippet)) { console.error('snippet 里没有 <section>'); process.exit(2); }
  if (newId) snippet = snippet.replace(/data-slide-id="[^"]*"/, `data-slide-id="${newId}"`);

  const secs = splitSections(deck);
  // id 冲突检查
  const newIds = [...snippet.matchAll(/data-slide-id="([^"]*)"/g)].map(m => m[1]);
  const existIds = secs.map(idOf);
  for (const id of newIds) {
    if (existIds.includes(id)) { console.error(`data-slide-id "${id}" 已存在——用 --id 指定新 id`); process.exit(2); }
  }
  // 定位插入点
  let idx;
  if (/^\d+$/.test(afterRef)) {
    idx = parseInt(afterRef, 10); // 0 = 最前；n = 插到第 n 页之后
    if (idx < 0 || idx > secs.length) { console.error(`序号超出范围 0-${secs.length}`); process.exit(2); }
  } else {
    idx = existIds.findIndex(id => id === afterRef);
    if (idx < 0) { console.error(`找不到 data-slide-id "${afterRef}"`); process.exit(2); }
    idx += 1;
  }
  const out = secs.slice(0, idx).join('\n') + '\n' + snippet + '\n' + secs.slice(idx).join('\n');
  html = before + '\n' + renumberSections(splitSections(out)).join('\n') + after;
  fs.writeFileSync(deckPath, html, 'utf8');
  console.log(`✓ 已插入 ${newIds.length} 页至第 ${idx} 页之后，全 deck 重编页码（现共 ${secs.length + newIds.length} 页）`);
  console.log('  提醒: 运行 h4s-build 重建 .html4s，或直接 sync --build');
} else if (cmd === 'renumber' || cmd === 'sync') {
  const secs = splitSections(deck);
  const beforeCount = (deck.match(/\d{1,2}\s*\/\s*\d{1,3}/g) || []).length;
  html = before + '\n' + renumberSections(secs).join('\n') + after;
  fs.writeFileSync(deckPath, html, 'utf8');
  console.log(`✓ 页码重编完成（${secs.length} 页）`);
  if (cmd === 'sync') {
    const prod = deckPath.replace(/\.(html)$/, '.html4s');
    if (fs.existsSync(prod)) {
      console.log('→ 同步重建 ' + path.basename(prod));
      const r = spawnSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'h4s-build.mjs'), deckPath, '--subset'], { stdio: 'inherit' });
      if (r.status !== 0) { console.error('构建失败'); process.exit(1); }
    } else {
      console.log('  （无同名 .html4s 产物，跳过构建）');
    }
  }
}
