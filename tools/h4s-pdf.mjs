#!/usr/bin/env node
/**
 * h4s-pdf.mjs — 矢量 PDF 导出（文本可选中、字体内嵌、逐页 1920×1080）
 *
 * 用法:
 *   node tools/h4s-pdf.mjs <deck> [-o out.pdf]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const argv = process.argv.slice(2);
const inFile = argv.find(a => !a.startsWith('--'));
const outIdx = argv.indexOf('-o');
const out = outIdx > -1 ? argv[outIdx + 1] : null;

if (!inFile) { console.error('用法: node tools/h4s-pdf.mjs <deck> [-o out.pdf]'); process.exit(2); }
const inPath = path.resolve(inFile);
const deckDir = path.dirname(inPath);
const base = path.basename(inPath).replace(/\.(html4s|html)$/i, '');
const outPath = out ? path.resolve(out) : path.join(deckDir, base + '.pdf');

/* 打印副本：剥离播放器 + 打印规范化（每页一画布、去边距） */
let printHtml = fs.readFileSync(inPath, 'utf8')
  .replace(/<script\s[^>]*src="[^"]*h4s\.player\.js"[^>]*>\s*<\/script>/gi, '')
  .replace(/<script>([\s\S]*?__H4S_LOADED__[\s\S]*?)<\/script>/gi, '');

const printCss = `
<style>
  @page { size: 1920px 1080px; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; }
  h4s-slide, section.slide {
    width: 1920px !important; height: 1080px !important;
    margin: 0 !important; box-shadow: none !important;
    break-after: page; page-break-after: always;
    overflow: hidden;
  }
  h4s-slide:last-of-type, section.slide:last-of-type { break-after: auto; page-break-after: auto; }
</style>`;
if (printHtml.includes('</head>')) printHtml = printHtml.replace('</head>', printCss + '</head>');
else printHtml = printHtml.replace('<style>', printCss + '<style>');

const tmpPath = path.join(deckDir, base + '.h4s-print.html');
printHtml = printHtml.replace('<body', '<style>html,body{overflow:visible!important;height:auto!important}</style><body', 1);
fs.writeFileSync(tmpPath, printHtml);

try {
  await withPage(pathToFileURL(tmpPath).href, async ({ send }) => {
    // 入场动画预隐藏解除（远离视口的页面动画不会触发，强制终态）
    try { await ev("document.body.classList.remove('motion-ready'); document.body.classList.add('no-motion'), 1"); } catch { }
    const pdf = await send('Page.printToPDF', {
      landscape: false,
      paperWidth: 20,      /* 1920px @96dpi */
      paperHeight: 11.25,  /* 1080px @96dpi */
      printBackground: true,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      preferCSSPageSize: false,
    });
    fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    console.log('✓ ' + outPath + ' (' + (fs.statSync(outPath).size / 1024).toFixed(0) + 'KB)');
  });
} finally {
  fs.rmSync(tmpPath, { force: true, maxRetries: 3, retryDelay: 200 });
}
