/* 图表探针：诊断为什么没渲染 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const PLAYER = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../player/h4s.player.js')).href;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-chartdbg-'));
const p = path.join(dir, 'chart.html');
fs.writeFileSync(p, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>图表诊断</title>
<script>window.__err=[];window.onerror=function(m,s,l){window.__err.push(m+' @'+l);};</script>
<script type="application/h4s+json">{"h4s":"1.0","meta":{"title":"图表诊断"},"fonts":[]}</script>
<style>.slide{width:1920px;height:1080px;position:absolute;background:#0d1117;color:#e6edf3}</style></head><body>
<h4s-deck><section class="slide" data-h4s-title="图表页">
  <h4s-chart type="bar" style="width:820px;height:420px">
  [{"label":"营收","value":4200}]
  </h4s-chart>
</section></h4s-deck>
<script src="${PLAYER}"></script></body></html>`);

await withPage(pathToFileURL(p).href, async ({ ev }) => {
  await new Promise((r) => setTimeout(r, 800));
  console.log('onerror:', await ev(`JSON.stringify(window.__err)`));
  console.log(await ev(`JSON.stringify({
    loaded: window.__H4S_LOADED__,
    h4s: typeof H4S,
    chartCount: document.querySelectorAll('h4s-chart').length,
    chartTag: (document.querySelector('h4s-chart') || {}).tagName,
    inner: (document.querySelector('h4s-chart') || {}).innerHTML,
    marked: (document.querySelector('h4s-chart') || {}).__chart,
    clientW: (document.querySelector('h4s-chart') || {}).clientWidth,
    slideCount: document.querySelectorAll('.slide').length,
    deckChildren: [...(document.querySelector('h4s-deck')||{children:[]}).children].map(c=>c.tagName).join(',')
  })`));
}, { width: 1920, height: 1080 });
