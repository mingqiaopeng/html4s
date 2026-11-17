/* 最小 deck（hello）回归：新播放器在极简结构下是否正常 */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/hello.h4s.html', process.env.TEMP + '/hello.html');
const opts = { extraArgs: ['--autoplay-policy=no-user-gesture-required'] };
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/hello.html', async ({ send, ev }) => {
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__errs=[];window.__cerrs=[];window.onerror=function(m){window.__errs.push(String(m).slice(0,150));return false;};
      (function(){var oe=console.error;console.error=function(){window.__cerrs.push([].slice.call(arguments).map(String).join(' ').slice(0,300));oe.apply(console,arguments);};})();`
  });
  await new Promise(r => setTimeout(r, 800));
  console.log('href:', await ev(`location.href.slice(0,80)`));
  console.log('ready:', await ev(`document.readyState+' / '+document.title.slice(0,30)`));
  console.log('onerror:', await ev(`(window.__errs||[]).join(';')||'none'`));
  console.log('console.error:', await ev(`(window.__cerrs||[]).join(' ; ')||'none'`));
}, opts);
