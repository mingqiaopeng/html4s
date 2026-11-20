/* 提词模式冒烟测试（0.5.0-M3）：备注分段渲染/Shift 段推进/翻页重置/提词大字开关 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const PLAYER = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../player/h4s.player.js')).href;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-tele-'));
const p = path.join(dir, 'tele.html');
fs.writeFileSync(p, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>提词冒烟</title>
<script type="application/h4s+json">{"h4s":"1.0","meta":{"title":"提词冒烟"},"fonts":[]}</script>
<style>.slide{width:1920px;height:1080px;position:absolute;background:#0d1117;color:#e6edf3}</style></head><body>
<h4s-deck><section class="slide" data-h4s-title="首页">
  <h1>提词冒烟</h1>
  <h4s-notes hidden>
    <p>第一段：开场白。</p>
    <p>第二段：核心观点。</p>
    <p>第三段：过渡台词。</p>
  </h4s-notes>
</section>
<section class="slide" data-h4s-title="次页">
  <h1>次页</h1>
  <h4s-notes hidden><p>次页唯一段落。</p></h4s-notes>
</section></h4s-deck>
<script src="${PLAYER}"></script></body></html>`);

let fails = 0;
const ok = (n, c) => { console.log((c ? '  ✓ ' : '  ✗ FAIL ') + n); if (!c) fails++; };
const key = (k, shift) => `document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'${k}',shiftKey:${!!shift},bubbles:true}))`;

await withPage(pathToFileURL(p).href, async ({ ev }) => {
  await new Promise((r) => setTimeout(r, 700));
  await ev(`H4S.present(0)`);
  await new Promise((r) => setTimeout(r, 300));
  await ev(`H4S.toggleDrawer()`);
  await new Promise((r) => setTimeout(r, 100));

  ok('备注分段渲染（3 段）', await ev(`document.querySelectorAll('#h4s-draw-notes .ly-np').length === 3`));
  ok('首段默认高亮', await ev(`!!document.querySelector('#h4s-draw-notes .ly-np.is-cur') && document.querySelector('#h4s-draw-notes .ly-np.is-cur').textContent.includes('第一段')`));

  await ev(key('ArrowRight', true));
  await new Promise((r) => setTimeout(r, 80));
  const cur1 = await ev(`(document.querySelector('#h4s-draw-notes .ly-np.is-cur')||{}).textContent||''`);
  ok('Shift+→ 段推进（幻灯片不动）', cur1.includes('第二段') && JSON.parse(await ev(`JSON.stringify(H4S.state())`)).i === 0);

  await ev(key('ArrowLeft', true));
  await new Promise((r) => setTimeout(r, 80));
  ok('Shift+← 段回退', (await ev(`(document.querySelector('#h4s-draw-notes .ly-np.is-cur')||{}).textContent||''`)).includes('第一段'));

  /* 翻页后提词指针重置（H4S.go 为 1 基 API：go(2) → 0 基页 1 = 次页） */
  await ev(`H4S.go(2)`);
  await new Promise((r) => setTimeout(r, 400));
  const cur2 = await ev(`JSON.stringify({i:H4S.state().i, cur:(document.querySelector('#h4s-draw-notes .ly-np.is-cur')||{}).textContent||''})`);
  const c2 = JSON.parse(cur2);
  ok('翻页后指针重置到该页首段', c2.i === 1 && c2.cur.includes('次页唯一段落'));

  /* 提词大字开关 */
  await ev(`document.querySelector('[data-dact="tmode"]').click()`);
  await new Promise((r) => setTimeout(r, 80));
  ok('提词大字开关（drawer 类 + localStorage）',
    await ev(`document.querySelector('.h4s-drawer').classList.contains('h4s-tele') && localStorage.getItem('h4s-notes-tele') === '1'`));
  ok('大字生效（段落字号 40px）',
    await ev(`getComputedStyle(document.querySelector('#h4s-draw-notes .ly-np')).fontSize === '40px'`));
  await ev(`document.querySelector('[data-dact="tmode"]').click()`);
}, { width: 1920, height: 1080 });

console.log(fails === 0 ? '\n提词模式冒烟全过 ✓' : `\n${fails} 项失败 ✗`);
process.exit(fails === 0 ? 0 : 1);
