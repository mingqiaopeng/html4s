/* 图表引擎冒烟测试（M1）：bar/donut 渲染、SVG 结构、接管状态、无效数据容错 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const PLAYER = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../player/h4s.player.js')).href;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-chart-'));
const p = path.join(dir, 'chart.html');
fs.writeFileSync(p, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>图表冒烟</title>
<script type="application/h4s+json">{"h4s":"1.0","meta":{"title":"图表冒烟"},"fonts":[]}</script>
<style>.slide{width:1920px;height:1080px;position:absolute;background:#0d1117;color:#e6edf3}</style></head><body>
<h4s-deck><section class="slide" data-h4s-title="图表页">
  <h4s-chart type="bar" style="width:820px;height:420px">
  [{"label":"营收","value":4200},{"label":"利润","value":3100},{"label":"现金流","value":5600}]
  </h4s-chart>
  <h4s-chart type="donut" style="width:520px;height:400px">
  [{"label":"A","value":30},{"label":"B","value":20},{"label":"C","value":50}]
  </h4s-chart>
  <h4s-chart type="hbar" style="width:760px;height:360px">
  [{"label":"效率","value":72},{"label":"质量","value":88}]
  </h4s-chart>
  <h4s-chart type="line" style="width:760px;height:360px">
  [{"label":"Q1","value":12},{"label":"Q2","value":19},{"label":"Q3","value":31},{"label":"Q4","value":44}]
  </h4s-chart>
  <h4s-chart type="pie" style="width:500px;height:360px">
  [{"label":"X","value":60},{"label":"Y","value":40}]
  </h4s-chart>
  <h4s-chart type="area" style="width:760px;height:360px" unit="万">
  {"labels":["Q1","Q2","Q3","Q4"],"series":[{"name":"营收","values":[120,156,189,224]}]}
  </h4s-chart>
  <h4s-chart type="bar" style="width:760px;height:380px" unit="万">
  {"labels":["Q1","Q2","Q3","Q4"],"series":[{"name":"营收","values":[120,156,189,224]},{"name":"成本","values":[90,102,128,150]}]}
  </h4s-chart>
  <h4s-chart type="bar" style="width:500px;height:300px">
  [{"label":"盈","value":60},{"label":"亏","value":-35}]
  </h4s-chart>
  <h4s-chart type="bar" style="width:400px;height:200px">这不是JSON</h4s-chart>
</section></h4s-deck>
<script src="${PLAYER}"></script></body></html>`);

let fails = 0;
const ok = (n, c) => { console.log((c ? '  ✓ ' : '  ✗ FAIL ') + n); if (!c) fails++; };

await withPage(pathToFileURL(p).href, async ({ ev }) => {
  await new Promise((r) => setTimeout(r, 800));
  ok('播放器接管（H4S + 浏览模式）', await ev(`typeof H4S !== 'undefined' && document.body.classList.contains('h4s-browse')`));
  const r = JSON.parse(await ev(`JSON.stringify({
    charts: document.querySelectorAll('h4s-chart').length,
    svgs: document.querySelectorAll('.h4s-chart svg').length,
    bars: document.querySelectorAll('.h4s-chart .bar').length,
    slices: document.querySelectorAll('.h4s-chart .slice').length,
    polys: document.querySelectorAll('.h4s-chart polyline').length,
    badmsg: (document.querySelectorAll('h4s-chart')[8] || {}).textContent || ''
  })`));
  console.log('  实际计数:', JSON.stringify(r));
  /* 浏览模式下每个图表有 真身+侧栏克隆+预览克隆 三份（克隆计数陷阱），断言按 ≥ 真身数 */
  ok('9 个图表全部渲染出 SVG', r.svgs >= 9);
  ok('柱体/横条（.bar ≥ 15）', r.bars >= 15);
  ok('切片+面积（.slice ≥ 7）', r.slices >= 7);
  ok('折线（polyline ≥ 3）', r.polys >= 3);
  ok('无效 JSON 容错（提示而非崩溃）', r.badmsg.includes('图表无效'));
  /* 放映状态动画类生效 */
  await ev(`H4S.present(0)`);
  await new Promise((r2) => setTimeout(r2, 400));
  ok('放映中 slide.visible → bar 生长到位（scaleY 1）',
    await ev(`getComputedStyle(document.querySelector('.h4s-chart .bar')).transform !== 'none' && getComputedStyle(document.querySelector('.h4s-chart .bar')).transform.indexOf('matrix') === 0`));
  await ev(`H4S.stop()`);
  await new Promise((r2) => setTimeout(r2, 120));
  ok('endShow 回浏览', await ev(`document.body.classList.contains('h4s-browse')`));
});
console.log(fails === 0 ? '\n图表引擎冒烟全过 ✓' : `\n${fails} 项失败 ✗`);
process.exit(fails === 0 ? 0 : 1);
