/* 回归验证：2026-11-19 bug 修复批
 * 覆盖：①编辑 Esc 撤销（__h4sOld）②提交+导出（浏览器下载路径 + <br> 保持
 * + 快照无 h4s-notes-el 污染）③壳回执链（pendingSave：失败→回退下载 / 成功→toast）
 * ④.slides 容器导出定位（snapSections 回退链）⑤Ctrl/F11 壳/浏览器行为分流
 * ⑥Esc 先关抽屉不连带结束放映 ⑦endShow → exitfullscreen 通知。
 * 运行：node tools/verify-bugfix.mjs（任一断言失败 → 退出码 1）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

/* 播放器源相对本文件定位（CI/Linux 可运行，不依赖 Windows 盘符） */
const PLAYER = pathToFileURL(fileURLToPath(new URL('../player/h4s.player.js', import.meta.url))).href;
let fails = 0;
function ok(name, cond) {
  console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + name);
  if (!cond) fails++;
}

function deckA(withStub) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>回归A</title></head><body>
${withStub ? `<script>
window.__posted = []; window.__dl = { n: 0, size: 0, text: null };
window.chrome = { webview: { _ls: [],
  addEventListener: function (t, f) { this._ls.push(f); },
  postMessage: function (m) { window.__posted.push(String(m)); } } };
window.__shellReply = function (obj) { window.chrome.webview._ls.forEach(function (f) { f({ data: JSON.stringify(obj) }); }); };
</script>` : ''}
<script type="application/h4s+json">{"id":"regr-a","meta":{"title":"回归A","lang":"zh"},"stage":{"width":1280,"height":720}}</script>
<h4s-deck>
  <h4s-slide data-h4s-title="封面"><h1>工欲善其事，<br>必先利其器。</h1><h4s-notes hidden><p>备注甲</p></h4s-notes></h4s-slide>
  <h4s-slide data-h4s-title="第二页"><p class="lead">正文内容甲</p></h4s-slide>
</h4s-deck>
<script src="${PLAYER}"></script>
</body></html>`;
}
function deckB() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>回归B</title></head><body>
<script type="application/h4s+json">{"id":"regr-b","meta":{"title":"回归B","lang":"zh"},"stage":{"width":1280,"height":720}}</script>
<div class="slides">
  <section data-h4s-title="S1"><h2>标题一</h2></section>
  <section data-h4s-title="S2"><p class="lead">第二页正文</p></section>
</div>
<script src="${PLAYER}"></script>
</body></html>`;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-bugfix-'));
function writeDeck(name, html) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, html, 'utf8');
  return pathToFileURL(p).href; /* Windows/Linux 通用的 file URL */
}
/* 常用步骤：进入编辑模式并激活某个可编辑元素的 contenteditable */
async function startEdit(ev, sel) {
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await ev(`window.__ed = document.querySelector('.h4s-stagebox ${sel}');
    window.__ed.click()`);
  return ev(`window.__ed.getAttribute('contenteditable') === 'true' && window.__ed.__h4sOld !== undefined`);
}

/* ---- L1: Esc 撤销 ---- */
{
  const url = writeDeck('a1.html', deckA(false));
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    ok('编辑元素被标记且 __h4sOld 已记录', await startEdit(ev, 'h1'));
    await ev(`window.__ed.innerHTML = '被改掉的文字'`);
    await ev(`window.__ed.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
    await new Promise(r => setTimeout(r, 100));
    const h1 = await ev(`document.querySelector('h4s-slide h1').innerHTML`);
    ok('Esc 撤销：真树恢复原文', h1.includes('必先利其器') && !h1.includes('被改掉'));
    ok('Esc 撤销：不产生改动记录（导出按钮仍隐藏）',
      await ev(`document.querySelector('[data-bact="export"]').style.display === 'none'`));
  });
}

/* ---- L2: 提交 + 浏览器导出 + Ctrl/F11 原生放行 ---- */
{
  const url = writeDeck('a2.html', deckA(false));
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    ok('编辑元素激活', await startEdit(ev, 'h1'));
    await ev(`window.__ed.innerHTML = '工欲善其事，<br>必先改其器。'`);
    await ev(`window.__ed.blur()`);
    await new Promise(r => setTimeout(r, 100));
    const h1 = await ev(`document.querySelector('h4s-slide h1').innerHTML`);
    ok('提交同步回真树（<br> 保持）', h1.includes('必先改其器') && /<br/i.test(h1));
    ok('改动记录后导出按钮可见',
      await ev(`document.querySelector('[data-bact="export"]').style.display !== 'none'`));
    await ev(`window.__dl={n:0,size:0,text:null};(function(){const o=URL.createObjectURL;URL.createObjectURL=b=>{
      window.__dl.size=b.size;b.text().then(t=>{window.__dl.text=t});window.__dl.n++;return o(b);}})()`);
    await ev(`document.querySelector('[data-bact="export"]').click()`);
    await new Promise(r => setTimeout(r, 150));
    const dl = await ev(`JSON.stringify({n:window.__dl.n,size:window.__dl.size,text:(window.__dl.text||'').slice(0,4000)})`);
    const d = JSON.parse(dl);
    ok('导出走下载（downloadEdited）', d.n === 1 && d.size > 300);
    ok('导出含新文字', (d.text || '').includes('必先改其器'));
    ok('导出无 h4s-notes-el 污染（快照先于 collectSlides）', !(d.text || '').includes('h4s-notes-el'));
    ok('导出保留备注内容', (d.text || '').includes('备注甲'));
    /* 浏览器（未握手）环境：Ctrl+L / F11 不得被吞 */
    const f11 = await ev(`dispatchEvent(new KeyboardEvent('keydown',{key:'F11',bubbles:true,cancelable:true}))`);
    const ctrlL = await ev(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'l',ctrlKey:true,bubbles:true,cancelable:true}))`);
    ok('未握手：F11/Ctrl+L 放行原生行为', f11 === true && ctrlL === true);
  });
}

/* ---- L3: 壳回执链（失败→回退下载）+ 握手后 Ctrl 接管 + exitfullscreen ---- */
{
  const url = writeDeck('a3.html', deckA(true));
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    await ev(`window.__shellReply({h4sShellHello:true})`);
    await new Promise(r => setTimeout(r, 50));
    ok('编辑元素激活', await startEdit(ev, 'h1'));
    await ev(`window.__ed.innerHTML = '工欲善其事，<br>壳内改其器。'`);
    await ev(`window.__ed.blur()`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`(function(){const o=URL.createObjectURL;URL.createObjectURL=b=>{
      b.text().then(t=>{window.__dl.text=t});window.__dl.n++;return o(b);}})()`);
    await ev(`document.querySelector('[data-bact="export"]').click()`);
    await new Promise(r => setTimeout(r, 100));
    ok('导出走壳消息（save）',
      await ev(`window.__posted.some(m=>m.includes('"h4sShell":"save"'))`));
    await ev(`window.__shellReply({h4sSaved:false,reason:'deck-from-url'})`);
    await new Promise(r => setTimeout(r, 150));
    const t1 = await ev(`document.querySelector('.h4s-toast').textContent`);
    ok('写回失败 → toast 提示', (t1 || '').includes('写回失败'));
    ok('写回失败 → 回退下载且内容含新文字',
      await ev(`window.__dl.n === 1 && (window.__dl.text||'').includes('壳内改其器')`));
    /* 握手后：Ctrl+L 被壳接管 */
    const ctrlL = await ev(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'l',ctrlKey:true,bubbles:true,cancelable:true}))`);
    ok('握手后：Ctrl+L 接管（preventDefault + shell 消息）',
      ctrlL === false && await ev(`window.__posted.some(m=>m.includes('"openurl"'))`));
    /* endShow → exitfullscreen 通知 */
    await ev(`H4S.present(0)`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`H4S.stop()`);
    await new Promise(r => setTimeout(r, 100));
    const last = await ev(`window.__posted[window.__posted.length-1]`);
    ok('endShow 通知壳 exitfullscreen', String(last).includes('exitfullscreen'));
  });
}

/* ---- L4: 壳回执成功路径 ---- */
{
  const url = writeDeck('a4.html', deckA(true));
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    await ev(`window.__shellReply({h4sShellHello:true})`);
    await new Promise(r => setTimeout(r, 50));
    await ev(`document.querySelectorAll('.h4s-sidecell')[1].click()`);
    await new Promise(r => setTimeout(r, 50));
    ok('编辑元素激活', await startEdit(ev, '.lead'));
    await ev(`window.__ed.innerHTML = '正文内容乙'`);
    await ev(`window.__ed.blur()`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`(function(){const o=URL.createObjectURL;URL.createObjectURL=b=>{window.__dl.n++;return o(b);}})()`);
    await ev(`document.querySelector('[data-bact="export"]').click()`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`window.__shellReply({h4sSaved:true})`);
    await new Promise(r => setTimeout(r, 150));
    const t1 = await ev(`document.querySelector('.h4s-toast').textContent`);
    ok('写回成功 → toast 确认', (t1 || '').includes('已写回源文件'));
    ok('写回成功 → 不触发下载', await ev(`window.__dl.n === 0`));
  });
}

/* ---- L5: .slides 容器导出定位 ---- */
{
  const url = writeDeck('b1.html', deckB());
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    await ev(`document.querySelector('[data-bact="edit"]').click()`);
    await ev(`document.querySelectorAll('.h4s-sidecell')[1].click()`);
    await new Promise(r => setTimeout(r, 50));
    await ev(`window.__ed = document.querySelectorAll('.h4s-stagebox [data-h4s-editable]')[1] || document.querySelectorAll('.h4s-stagebox [data-h4s-editable]')[0];
      window.__ed.click()`);
    ok('.slides deck 编辑元素激活',
      await ev(`window.__ed.getAttribute('contenteditable') === 'true'`));
    await ev(`window.__ed.innerHTML = '第二页已改'`);
    await ev(`window.__ed.blur()`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`window.__dl={n:0,size:0,text:null};(function(){const o=URL.createObjectURL;URL.createObjectURL=b=>{
      b.text().then(t=>{window.__dl.text=t});window.__dl.n++;return o(b);}})()`);
    await ev(`document.querySelector('[data-bact="export"]').click()`);
    await new Promise(r => setTimeout(r, 150));
    const d = JSON.parse(await ev(`JSON.stringify({n:window.__dl.n,text:window.__dl.text||''})`));
    ok('.slides 导出走下载', d.n === 1);
    ok('.slides 导出第二页改动落位（snapSections 回退链）',
      d.text.includes('第二页已改') && d.text.includes('标题一'));
  });
}

/* ---- L6: Esc 先关抽屉，不连带结束放映 ---- */
{
  const url = writeDeck('a6.html', deckA(false));
  await withPage(url, async ({ ev }) => {
    await new Promise(r => setTimeout(r, 600));
    await ev(`H4S.present(0)`);
    await new Promise(r => setTimeout(r, 100));
    await ev(`H4S.toggleDrawer()`);
    await new Promise(r => setTimeout(r, 50));
    await ev(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
    await new Promise(r => setTimeout(r, 50));
    ok('Esc 关抽屉但仍处放映中',
      await ev(`!document.body.classList.contains('h4s-presenting') && document.body.classList.contains('h4s-live')`));
    await ev(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
    await new Promise(r => setTimeout(r, 50));
    ok('再按 Esc 才结束放映回浏览',
      await ev(`document.body.classList.contains('h4s-browse')`));
  });
}

console.log(fails === 0 ? '\n全部通过 ✓' : `\n${fails} 项失败 ✗`);
process.exit(fails === 0 ? 0 : 1);
