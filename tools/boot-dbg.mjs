/* 2027-dangjian boot 深查（console.error 拦截） */
import { withPage } from 'file:///D:/MyProjects/Html4s/tools/h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html4s', process.env.TEMP + '/ed.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/ed.html', async ({ send, ev }) => {
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__cerrs=[];(function(){var oe=console.error;console.error=function(){window.__cerrs.push([].slice.call(arguments).map(function(a){return typeof a==='object'?JSON.stringify(a).slice(0,400):String(a).slice(0,400)}).join(' '));oe.apply(console,arguments);};})();window.__errs=[];window.onerror=function(m,s,l){window.__errs.push(String(m).slice(0,150)+'@'+l);return false;};`
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('H4S:', await ev(`typeof window.H4S`));
  console.log('body:', await ev(`document.body.className.slice(0,60)`));
  console.log('console.error:', await ev(`(window.__cerrs||[]).join('\\n----\\n').slice(0,800)||'none'`));
  console.log('onerror:', await ev(`(window.__errs||[]).join(' ; ').slice(0,400)||'none'`));
});
