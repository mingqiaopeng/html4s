/* 编辑 v2 验证：混合内容元素（封面 h1 含 <br/>/<span>）+ 纯文本叶子 + 同步/导出 */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/ed.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/ed.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  console.log('接管:', await ev(`typeof window.H4S === 'object'`));

  /* 开编辑模式，选封面页（混合内容 h1） */
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑模式:', await ev(`document.body.classList.contains('h4s-editing')`));
  console.log('可编辑元素（封面）:', await ev(`document.querySelectorAll('.h4s-clone [data-h4s-editable]').length`));

  /* 模拟单击封面 h1 → 包裹 span → 改字 → focusout 提交 */
  await ev(`(function(){
    var h1 = document.querySelector('.h4s-clone [data-h4s-editable]');
    h1.dispatchEvent(new MouseEvent('click', {bubbles:true}));
  })()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑 span 出现:', await ev(`!!document.querySelector('.h4s-clone span[contenteditable]')`));
  await ev(`(function(){
    var span = document.querySelector('.h4s-clone span[contenteditable]');
    span.textContent = '回头看，向前干！';
  })()`);
  await ev(`document.querySelector('.h4s-clone span[contenteditable]').dispatchEvent(new Event('focusout', {bubbles:true}))`);
  await new Promise(r => setTimeout(r, 300));

  /* 真 slide h1 的首个文本节点已更新（混合结构保持：br/span 兄弟不受影响） */
  console.log('真 h1 文本（同步+结构保持）:', await ev(`(function(){
    var h1 = document.querySelector('.h4s-holder [data-slide-id="cover"] h1');
    return h1 ? JSON.stringify({text: h1.childNodes[0].nodeValue, hasBr: !!h1.querySelector('br'), hasSpan: !!h1.querySelector('span')}) : 'none';
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
  console.log('导出含新字:', await ev(`(window.__exported||'').indexOf('向前干！') > -1`));
  console.log('导出保留 <br/>:', await ev(`(window.__exported||'').indexOf('<br') > -1`));
  console.log('errors:', await ev(`window.__e.join(';')||'none'`));
});
