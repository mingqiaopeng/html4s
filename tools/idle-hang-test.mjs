/* 长时间闲置复现：F5 放映 → 等待 180s（每 30s 采样主线程延迟 + 堆内存）→ 测翻页响应 */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

const deck = process.argv[2] || 'D:/MyProjects/Html4s/examples/2027-dangjian.html4s';
fs.copyFileSync(deck, process.env.TEMP + '/idle.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/idle.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,120));return false;};`);
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5'}))`);
  await new Promise(r => setTimeout(r, 600));
  console.log('放映开始:', await ev(`document.body.classList.contains('h4s-live')`));

  const probe = await ev(`(function(){var t0=performance.now();
    /* 主线程探针：同步计一段 50ms 循环，若主线程被长任务占用，ev 本身会延迟返回 */
    while (performance.now() - t0 < 20) {}
    return Math.round(performance.now() - t0);})()`);
  console.log('t=0s 主线程探针:', probe, 'ms');
  console.log('heap:', await ev(`performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576)+'MB' : 'n/a'`));

  for (var w = 1; w <= 6; w++) {
    await new Promise(r => setTimeout(r, 30000));
    const d = await ev(`(function(){var t0=performance.now();var a=[];for(var i=0;i<200000;i++)a.push(i);a.length=0;return Math.round(performance.now()-t0);})()`);
    const heap = await ev(`performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576)+'MB' : 'n/a'`);
    const raf = await ev(`(function(){var n=0;var t0=performance.now();requestAnimationFrame(function(){n=1;});return n;})()`);
    console.log('t=' + (w * 30) + 's: 主线程探针=' + d + 'ms heap=' + heap + ' live=' + await ev(`document.body.classList.contains('h4s-live')`));
  }

  /* 翻页响应测试 */
  console.log('--- 翻页响应测试:');
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}))`);
  await new Promise(r => setTimeout(r, 900));
  console.log('state:', await ev(`JSON.stringify(window.H4S.state())`));
  console.log('errors:', await ev(`window.__e.join(';').slice(0,200)||'none'`));
}, { extraArgs: ['--enable-precise-memory-info'] });
