#!/usr/bin/env node
/**
 * h4s-shot.mjs — 逐页 PNG 截图（AI 视觉自审闭环的"看"）
 *
 * 用法:
 *   node tools/h4s-shot.mjs <deck> [-o shots 目录] [--width 1920]
 *
 * 输出: <dir>/slide-01.png … slide-NN.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const argv = process.argv.slice(2);
const inFile = argv.find(a => !a.startsWith('--'));
const outDirIdx = argv.indexOf('-o');
const outDir = outDirIdx > -1 ? argv[outDirIdx + 1] : null;
const width = parseInt(getOpt('--width'), 10) || 1920;
function getOpt(name) { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : null; }

if (!inFile) { console.error('用法: node tools/h4s-shot.mjs <deck> [-o 目录]'); process.exit(2); }
const inPath = path.resolve(inFile);
const deckDir = path.dirname(inPath);
const base = path.basename(inPath).replace(/\.(html4s|html)$/i, '');
const dir = outDir ? path.resolve(outDir) : path.join(deckDir, base + '-shots');
fs.mkdirSync(dir, { recursive: true });

/* 文档模式副本（剥离播放器，尺寸由模板 CSS 决定） */
let lintHtml = fs.readFileSync(inPath, 'utf8')
  .replace(/<script\s[^>]*src="[^"]*h4s\.player\.js"[^>]*>\s*<\/script>/gi, '')
  .replace(/<script>([\s\S]*?__H4S_LOADED__[\s\S]*?)<\/script>/gi, '');
const tmpPath = path.join(deckDir, base + '.h4s-shot.html');
lintHtml = lintHtml.replace('<body', '<style>html,body{overflow:visible!important;height:auto!important}</style><body', 1);
fs.writeFileSync(tmpPath, lintHtml);

const height = Math.round(width * 9 / 16);

try {
  await withPage(pathToFileURL(tmpPath).href, async ({ send, ev }) => {
    // 入场动画预隐藏解除（远离视口的页面动画不会触发，强制终态）
    try { await ev("document.body.classList.remove('motion-ready'); document.body.classList.add('no-motion'), 1"); } catch { }
    const info = await ev(`(function(){
      var slides = Array.prototype.slice.call(document.querySelectorAll(
        'h4s-slide, h4s-deck > section, .slides > section, body > section.slide'
      )).filter(function (el) { return el.getBoundingClientRect().width > 300; });
      return JSON.stringify(slides.map(function (el) {
        return { top: Math.round(el.getBoundingClientRect().top + window.scrollY),
                 h: Math.round(el.getBoundingClientRect().height) };
      }));
    })()`);
    const pages = JSON.parse(info);

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      /* 确定性取景：其余页隐藏，目标页 fixed 到视口原点
         （无头模式 captureBeyondViewport 不合成首屏外；html/body overflow:hidden 锁滚动） */
      await ev(`(function(){ var ss = Array.prototype.slice.call(document.querySelectorAll(
        'h4s-slide, h4s-deck > section, .slides > section, body > section.slide'
      ));
      ss.forEach(function (s, j) {
        if (j === ${i}) { s.style.position = 'fixed'; s.style.top = '0'; s.style.left = '0'; s.style.zIndex = 9; s.style.display = ''; s.classList.add('visible', 'active'); }
        else { s.style.display = 'none'; }
      }); })()`);
      await new Promise(r => setTimeout(r, 120));
      if (process.env.H4S_DEBUG) {
        console.log('dbg[' + i + ']:', await ev(`(function(){ var vis = Array.prototype.slice.call(document.querySelectorAll(
          'h4s-slide, h4s-deck > section, .slides > section, body > section.slide'
        )).filter(function (el) { return el.getBoundingClientRect().width > 300; });
        var t = vis[${i}];
        var cs = t ? getComputedStyle(t) : null;
        return JSON.stringify({ visN: vis.length, tExists: !!t, disp: cs ? cs.display : null,
          pos: cs ? cs.position : null, z: cs ? cs.zIndex : null,
          rect: t ? (function(){ var r = t.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height); })() : null }); })()`));
      }
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width, height: p.h || height, scale: 1 },
      });
      const file = path.join(dir, 'slide-' + String(i + 1).padStart(2, '0') + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log('✓ ' + file);
    }
    console.log('共 ' + pages.length + ' 页 → ' + dir);
  });
} finally {
  fs.rmSync(tmpPath, { force: true, maxRetries: 3, retryDelay: 200 });
}
