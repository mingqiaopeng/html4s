/* intro-fs 深查：全部 console 拦截 + DOM 结构 */
import { withPage } from './h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/html4s-intro-fs.html4s', process.env.TEMP + '/s1.html');
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/s1.html', async ({ send, ev }) => {
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__logs=[];(function(){var oe=console.error,oi=console.info,ow=console.warn;
      console.error=function(){window.__logs.push('ERR:'+[].slice.call(arguments).map(String).join(' ').slice(0,300));oe.apply(console,arguments);};
      console.info=function(){window.__logs.push('INFO:'+[].slice.call(arguments).map(String).join(' ').slice(0,300));oi.apply(console,arguments);};
      console.warn=function(){window.__logs.push('WARN:'+[].slice.call(arguments).map(String).join(' ').slice(0,300));ow.apply(console,arguments);};})();`
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('logs:', await ev(`(window.__logs||[]).join('\\n')||'none'`));
  console.log('body children:', await ev(`[...document.body.children].map(e=>e.tagName+'.'+(e.className||'').slice(0,20)).join(', ')`));
  console.log('h4s-deck:', await ev(`!!document.querySelector('h4s-deck')`));
  console.log('browsebar:', await ev(`!!document.querySelector('.h4s-browsebar')`));
  console.log('pageinfo:', await ev(`(document.querySelector('.h4s-pageinfo')||{textContent:'?'}).textContent.slice(0,20)`));
  console.log('sidecell:', await ev(`document.querySelectorAll('.h4s-sidecell').length`));
});
