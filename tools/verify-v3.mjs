/* v3 验证：①caret 精确定位（点 span 编辑 span）②网页放映（普通 HTML） */
import { withPage } from './h4s-cdp.mjs';
import fs from 'node:fs';

/* ---- ① 编辑 v3：caret 精确 ---- */
fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/v3.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/v3.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑模式标记数:', await ev(`document.querySelectorAll('.h4s-stagebox .h4s-clone [data-h4s-editable]').length`));

  /* 找封面 h1 里的 span（"干"字），拿到其坐标并模拟点击 */
  const r = await ev(`(function(){
    var span = document.querySelector('.h4s-stagebox .h4s-clone h1 span');
    if (!span) return null;
    var rc = span.getBoundingClientRect();
    return { x: Math.round(rc.left + rc.width/2), y: Math.round(rc.top + rc.height/2), text: span.textContent };
  })()`);
  console.log('span 位置:', JSON.stringify(r));
  await ev(`(function(){
    var span = document.querySelector('.h4s-stagebox .h4s-clone h1 span');
    span.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:${r.x}, clientY:${r.y}}));
  })()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑 span（包裹）出现:', await ev(`!!document.querySelector('.h4s-stagebox .h4s-clone span[contenteditable]')`));
  await ev(`(function(){
    var span = document.querySelector('.h4s-stagebox .h4s-clone span[contenteditable]');
    span.textContent = '向前冲！';
  })()`);
  await ev(`document.querySelector('.h4s-stagebox .h4s-clone span[contenteditable]').dispatchEvent(new Event('focusout', {bubbles:true}))`);
  await new Promise(r => setTimeout(r, 400));

  /* 真 slide：span 内容被更新、其他兄弟文本不动 */
  console.log('真树同步（span 内文字）:', await ev(`(function(){
    var h1 = document.querySelector('h4s-deck > section[data-slide-id="cover"] h1, .h4s-holder [data-slide-id="cover"] h1');
    if (!h1) { var slides=document.querySelectorAll('[data-slide-id="cover"]'); h1=slides[0]&&slides[0].querySelector('h1'); }
    var sp = h1 && h1.querySelector('span');
    return sp ? JSON.stringify({spanText: sp.textContent, brKept: !!h1.querySelector('br')}) : 'no-span';
  })()`));
  console.log('errors:', await ev(`window.__e.join(';').slice(0,120)||'none'`));
});

/* ---- ② 网页放映：普通 HTML ---- */
fs.writeFileSync(process.env.TEMP + '/plain.html', `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>普通网页</title>
<style>body{margin:0;font:20px/1.8 sans-serif}
section{min-height:100vh;padding:80px;background:#f5f5f5}
section:nth-child(odd){background:#e8e8e8}
h1{font-size:56px}</style></head>
<body>
<section><h1>普通网页 · 第一屏</h1><p>这是没有幻灯片结构的普通 HTML。</p></section>
<section><h1>第二屏</h1><p>内容延续……</p></section>
<section><h1>第三屏</h1><p>结尾。</p></section>
</body></html>`);
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/plain.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  await new Promise(r => setTimeout(r, 700));
  console.log('提示横幅:', await ev(`!!document.querySelector('.h4s-webhint')`));
  console.log('H4S（应 undefined——无幻灯片结构）:', await ev(`typeof window.H4S`));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5'}))`);
  await new Promise(r => setTimeout(r, 400));
  console.log('放映态:', await ev(`document.body.classList.contains('h4s-webp')`));
  console.log('页码徽章:', await ev(`(document.querySelector('.h4s-webbadge')||{textContent:''}).textContent`));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}))`);
  await new Promise(r => setTimeout(r, 600));
  console.log('翻页后 scrollY:', await ev(`Math.round(window.scrollY)`), '· 徽章:', await ev(`(document.querySelector('.h4s-webbadge')||{textContent:''}).textContent`));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
  await new Promise(r => setTimeout(r, 400));
  console.log('Esc 退出:', await ev(`!document.body.classList.contains('h4s-webp')`));
  console.log('errors:', await ev(`window.__e.join(';').slice(0,120)||'none'`));
});
