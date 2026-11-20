/* 图标引擎冒烟测试（0.4.1）：渲染/缺失容错/主题自适应 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const PLAYER = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../player/h4s.player.js')).href;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-icon-'));
const p = path.join(dir, 'icon.html');
fs.writeFileSync(p, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>图标冒烟</title>
<script type="application/h4s+json">{"h4s":"1.0","meta":{"title":"图标冒烟"},"fonts":[]}</script>
<style>.slide{width:1920px;height:1080px;position:absolute;background:#0d1117;color:#e6edf3}
.ic{font-size:48px;color:#38bdf8}</style></head><body>
<h4s-deck><section class="slide" data-h4s-title="图标页">
  <i data-h4s-icon="check" class="ic"></i>
  <i data-h4s-icon="rocket" class="ic"></i>
  <i data-h4s-icon="chart-bar" class="ic"></i>
  <i data-h4s-icon="no-such-icon" class="ic"></i>
</section></h4s-deck>
<script src="${PLAYER}"></script></body></html>`);

let fails = 0;
const ok = (n, c) => { console.log((c ? '  ✓ ' : '  ✗ FAIL ') + n); if (!c) fails++; };

await withPage(pathToFileURL(p).href, async ({ ev }) => {
  await new Promise((r) => setTimeout(r, 700));
  const r = JSON.parse(await ev(`JSON.stringify({
    svgs: document.querySelectorAll('.h4s-icon-svg').length,
    check: !!document.querySelector('[data-h4s-icon="check"] svg'),
    rocket: !!document.querySelector('[data-h4s-icon="rocket"] svg'),
    missingMarked: document.querySelectorAll('[data-h4s-icon-missing="no-such-icon"]').length,
    color: getComputedStyle(document.querySelector('[data-h4s-icon="check"]')).color,
    size: document.querySelector('.h4s-icon-svg').getBoundingClientRect().width
  })`));
  ok('合法图标渲染 SVG（含克隆 ≥ 3）', r.svgs >= 3);
  ok('check/rocket 均有内嵌图', r.check && r.rocket);
  ok('缺失图标容错（标记不崩溃）', r.missingMarked >= 1);
  ok('颜色继承 currentColor（主题色 #38bdf8）', r.color === 'rgb(56, 189, 248)');
  ok('尺寸随 font-size（CSS 宽 = 48px，不受 holder 缩放影响）',
    await ev(`getComputedStyle(document.querySelector('[data-h4s-icon="check"] .h4s-icon-svg')).width === '48px'`));
});
console.log(fails === 0 ? '\n图标引擎冒烟全过 ✓' : `\n${fails} 项失败 ✗`);
process.exit(fails === 0 ? 0 : 1);
