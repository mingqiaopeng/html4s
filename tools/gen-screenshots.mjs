/* README 界面截图：浏览界面 / 放映 / 编辑模式 / 背景特效（CDP 驱动，内容可控） */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

const OUT = 'D:/MyProjects/Html4s/docs/images';
fs.mkdirSync(OUT, { recursive: true });

async function shot(send, name) {
  const d = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT + '/' + name, Buffer.from(d.data, 'base64'));
  console.log('✓', name);
}

/* ---- 图1：浏览界面（2027-dangjian 深色，1600×1000 视口） ---- */
fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/s1.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/s1.html', async ({ send, ev }) => {
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.querySelectorAll('.h4s-sidecell')[2].click()`);  /* 选中第 3 页让缩略图描边可见 */
  await new Promise(r => setTimeout(r, 300));
  await shot(send, 'browse.png');
}, { width: 1600, height: 1000 });

/* ---- 图2：放映封面（全屏） ---- */
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/s1.html', async ({ send, ev }) => {
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5'}))`);
  await new Promise(r => setTimeout(r, 800));
  await shot(send, 'present.png');
}, { width: 1600, height: 1000 });

/* ---- 图3：编辑模式（第 3 页描边 + 编辑中） ---- */
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/s1.html', async ({ send, ev }) => {
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await new Promise(r => setTimeout(r, 200));
  await ev(`document.querySelectorAll('.h4s-sidecell')[2].click()`);
  await new Promise(r => setTimeout(r, 300));
  /* 进入编辑：单击标题元素 → 包裹 span → 改字 */
  await ev(`(function(){
    var parent = document.querySelector('.h4s-clone [data-h4s-editable]');
    if (!parent) return;
    var tn = null;
    for (var k = 0; k < parent.childNodes.length; k++) {
      if (parent.childNodes[k].nodeType === 3 && parent.childNodes[k].nodeValue.trim()) { tn = parent.childNodes[k]; break; }
    }
    if (!tn) return;
    var span = document.createElement('span');
    span.setAttribute('contenteditable', 'true');
    span.textContent = tn.nodeValue;
    parent.replaceChild(span, tn);
    span.focus();
  })()`);
  await new Promise(r => setTimeout(r, 300));
  await shot(send, 'edit.png');
}, { width: 1600, height: 1000 });

/* ---- 图4：背景特效（fx-showcase 星空 + 放映） ---- */
fs.copyFileSync('D:/MyProjects/Html4s/examples/fx-showcase.html4s', process.env.TEMP + '/s2.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/s2.html', async ({ send, ev }) => {
  for (let i = 0; i < 40; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5'}))`);
  await new Promise(r => setTimeout(r, 900));
  await shot(send, 'fx.png');
}, { width: 1600, height: 1000 });

console.log('screenshots done');
