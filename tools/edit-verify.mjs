/* 编辑（元素级）验证：混合内容元素（含 br/span）整体编辑 + 同步 + 导出 */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/ed.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/ed.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  console.log('接管:', await ev(`typeof window.H4S === 'object'`));

  /* 开编辑模式 */
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑模式:', await ev(`document.body.classList.contains('h4s-editing')`));
  console.log('可编辑元素（封面页）:', await ev(`document.querySelectorAll('.h4s-stagebox .h4s-clone [data-h4s-editable]').length`));

  /* 单击封面 h1（混合内容：文<br>字<span>干</span>。） */
  const r = await ev(`(function(){
    var h1 = document.querySelector('.h4s-stagebox .h4s-clone h1');
    if (!h1) return null;
    var rc = h1.getBoundingClientRect();
    return { x: Math.round(rc.left + rc.width/2), y: Math.round(rc.top + rc.height/2) };
  })()`);
  console.log('h1 坐标:', JSON.stringify(r));
  await ev(`(function(){
    var h1 = document.querySelector('.h4s-stagebox .h4s-clone h1');
    h1.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:${r.x}, clientY:${r.y}}));
  })()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('contenteditable:', await ev(`(document.querySelector('.h4s-stagebox .h4s-clone [contenteditable]')||{tagName:'?'}).tagName`));

  /* 改字：textContent 赋值（模拟 contenteditable 编辑后的元素状态） */
  await ev(`(function(){
    var el = document.querySelector('.h4s-stagebox .h4s-clone [contenteditable]');
    el.textContent = '工欲善其事，必先利其器。（修改稿）';
  })()`);
  await ev(`document.querySelector('.h4s-stagebox .h4s-clone [contenteditable]').dispatchEvent(new Event('focusout', {bubbles:true}))`);
  await new Promise(r => setTimeout(r, 400));

  /* 真 slide 同步验证：h1 文本已改 */
  console.log('真树同步:', await ev(`(function(){
    var slides = document.querySelectorAll('[data-slide-id="cover"]');
    var h1 = slides[0] && slides[0].querySelector('h1');
    if (!h1) return 'none';
    return JSON.stringify({text: h1.textContent.slice(0,30)});
  })()`));
  console.log('导出按钮:', await ev(`document.querySelector('[data-bact="export"]').style.display !== 'none'`));

  /* 导出验证 */
  await ev(`
    window.__exported = null;
    var oe = URL.createObjectURL;
    URL.createObjectURL = function(blob) { blob.text().then(function(t){ window.__exported = t; }); return oe.apply(URL, arguments); };
  `);
  await ev(`document.querySelector('[data-bact="export"]').click()`);
  await new Promise(r => setTimeout(r, 400));
  console.log('导出长度:', await ev(`(window.__exported||'').length`));
  console.log('导出含回头看:', await ev(`(window.__exported||'').indexOf('回头看') > -1`));
  console.log('导出含修改稿:', await ev(`(window.__exported||'').indexOf('修改稿') > -1`));
  console.log('导出含新字:', await ev(`(window.__exported||'').indexOf('（修改稿）') > -1`));
  console.log('errors:', await ev(`window.__e.join(';').slice(0,120)||'none'`));
});
