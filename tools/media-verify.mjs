/* 媒体控制验证（用构建产物 media-deck.html4s，播放器内嵌） */
import { withPage } from './h4s-cdp.mjs';
import fs from 'node:fs';

fs.copyFileSync('D:/MyProjects/Html4s/examples/media-test/media-deck.html4s', process.env.TEMP + '/md.html');
const opts = { extraArgs: ['--autoplay-policy=no-user-gesture-required'] };
await withPage('file:///' + process.env.TEMP.replace(/\\/g, '/') + '/md.html', async ({ ev }) => {
  await ev(`window.__mediaLog=[];window.__e=[];window.onerror=function(m){window.__e.push(String(m).slice(0,100));return false;};`);
  for (let i = 0; i < 30; i++) { if (await ev(`!!document.querySelector('.h4s-pageinfo')`)) break; await new Promise(r => setTimeout(r, 150)); }
  const st = () => ev(`(function(){var a=document.querySelector('audio');return a ? (a.paused ? 'paused' : 'playing@' + a.currentTime.toFixed(1)) : 'no-audio';})()`);
  console.log('接管:', await ev(`typeof window.H4S === 'object'`));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'F5'}))`);
  await new Promise(r => setTimeout(r, 800));
  console.log('P1（autoplay 进入）:', await st());
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}))`);
  await new Promise(r => setTimeout(r, 800));
  console.log('P2（离开 → 应暂停）:', await st());
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}))`);
  await new Promise(r => setTimeout(r, 800));
  console.log('回 P1（应恢复播放）:', await st());
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
  await new Promise(r => setTimeout(r, 500));
  console.log('退出放映:', await st());
  console.log('mediaLog:', await ev(`JSON.stringify(window.__mediaLog||[])`));
  console.log('errors:', await ev(`window.__e.join(';')||'none'`));
}, opts);
