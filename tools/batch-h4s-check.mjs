/* 批量验证新构建 deck 的播放器接管状态 */
import { withPage } from './h4s-cdp.mjs';
import fs from 'node:fs';

const decks = ['fx-showcase', '2027-dangjian', 'html4s-intro', 'fs-intro', 'huashu-intro', 'style-a-pilot', 'media-test/media-deck'];
for (const d of decks) {
  const src = `D:/MyProjects/Html4s/examples/${d}.html4s`;
  if (!fs.existsSync(src)) { console.log(d + ': 文件不存在'); continue; }
  const dst = process.env.TEMP + '/batch-' + d.replace(/[\/]/g, '_') + '.html';
  fs.copyFileSync(src, dst);
  const url = 'file:///' + dst.replace(/\\/g, '/');
  try {
    await withPage(url, async ({ ev }) => {
      await new Promise(r => setTimeout(r, 700));
      const h4s = await ev(`typeof window.H4S`);
      const body = await ev(`document.body.className.slice(0,40)`);
      const slides = await ev(`document.querySelectorAll('h4s-deck > section, h4s-deck > h4s-slide, .slides > section').length`);
      const errs = await ev(`window.__e2 ? window.__e2.join(';').slice(0,150) : ''`);
      console.log(`${d}: H4S=${h4s} body="${body}" slides=${slides}${errs ? ' ERR=' + errs : ''}`);
    }, { extraArgs: [] });
  } catch (e) {
    console.log(`${d}: 异常 ${e.message.slice(0, 100)}`);
  }
}
