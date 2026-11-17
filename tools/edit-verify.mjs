/* 编辑功能全链路验证（浏览器版）：
   编辑模式 → 单击进入编辑 → 改字 → 提交同步真 slide → 导出含改动 + 缺字预警 */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/ed.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/ed.html', async ({ ev }) => {
  await ev(`window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await new Promise(r => setTimeout(r, 400));
  console.log('href:', await ev(`location.href.slice(0,70)`));
  console.log('ready/title:', await ev(`document.readyState + ' / ' + document.title.slice(0,30)`));
  console.log('H4S raw:', await ev(`typeof window.H4S`));
  console.log('body:', await ev(`document.body.className.slice(0,40)`));
  console.log('browsebar:', await ev(`!!document.querySelector('.h4s-browsebar')`));
  console.log('errs:', await ev(`window.__e.join(';').slice(0,150)||'none'`));

  /* 1. 开启编辑模式 */
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await new Promise(r => setTimeout(r, 200));
  console.log('编辑模式:', await ev(`document.body.classList.contains('h4s-editing')`));

  /* 2. 选中第 3 页（six 时间轴），找克隆里的可编辑叶子 */
  await ev(`document.querySelectorAll('.h4s-sidecell')[2].click()`);
  await new Promise(r => setTimeout(r, 300));
  console.log('可编辑叶子数:', await ev(`document.querySelectorAll('.h4s-clone [data-h4s-editable]').length`));

  /* 3. 编辑"一年来重点抓的六件事"标题 → 新文本含子集外字符"齉"测试缺字预警 */
  const target = await ev(`(function(){
    var leaves = document.querySelectorAll('.h4s-clone [data-h4s-editable]');
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].textContent.indexOf('一年来重点抓的六件事') > -1) return i;
    }
    return -1;
  })()`);
  console.log('目标叶子索引:', target);
  await ev(`(function(){
    var leaves = document.querySelectorAll('.h4s-clone [data-h4s-editable]');
    var el = leaves[${target}];
    el.setAttribute('contenteditable', 'true');
    el.__editOld = el.textContent;
    el.textContent = '一年来重点抓的六件事齉';
    el.dispatchEvent(new Event('focusout', {bubbles:true}));
  })()`);
  await new Promise(r => setTimeout(r, 300));

  /* 4. 验证同步回真 slide + 缺字预警 */
  console.log('真 slide 同步:', await ev(`(function(){
    var slide = document.querySelectorAll('h4s-deck > section')[2] || document.querySelectorAll('.h4s-holder > *')[2];
    return slide ? slide.textContent.indexOf('齉') > -1 : '?';
  })()`));
  console.log('缺字标记:', await ev(`!!document.querySelector('.h4s-edit-lack')`));
  console.log('导出按钮可见:', await ev(`document.querySelector('[data-bact="export"]').style.display !== 'none'`));

  /* 5. 导出（浏览器版 → 下载。拦截 URL.createObjectURL 验证导出内容） */
  await ev(`
    window.__exported = null;
    var oe = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
      blob.text().then(function(t) { window.__exported = t; });
      return oe.apply(URL, arguments);
    };
  `);
  await ev(`document.querySelector('[data-bact="export"]').click()`);
  await new Promise(r => setTimeout(r, 400));
  console.log('导出内容含新字:', await ev(`(window.__exported||'').indexOf('齉') > -1`));
  console.log('导出大小:', await ev(`(window.__exported||'').length`));
  console.log('errors:', await ev(`window.__e.join(';')||'none'`));
});
