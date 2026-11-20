#!/usr/bin/env node
/* bench.mjs — 性能基准（0.5.0-M6a，P2 出口标准项：双击→首帧 ≤2s / 50 页）
 * 流程：生成 50 页 deck → build --share → CDP 三次冷载测「导航开始 → 播放器接管」
 * 耗时（performance.timeOrigin → body.h4s-browse 出现），取中位数，超 2s → 退出码 1。
 * 用法: node tools/bench.mjs [--pages 50]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const pages = Math.max(10, parseInt(process.argv[process.argv.indexOf('--pages') + 1] || '50', 10) || 50);

/* ---------- 生成 50 页 deck（复用 intro-fs 主题变量体系的最小页型） ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-bench-'));
let body = '';
for (let i = 1; i <= pages; i++) {
  body += `<section class="slide" data-h4s-title="第 ${i} 页">
  <div class="slide-content">
    <p class="kicker">BENCHMARK · ${String(i).padStart(2, '0')}</p>
    <h1 style="font-size:72px;font-weight:300;margin:24px 0">性能基准 · 第 ${i} 页</h1>
    <p style="font-size:26px;color:#9ca3af">固定舞台 1920×1080，${pages} 页整装待发。</p>
  </div>
</section>
`;
}
const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>性能基准 ${pages} 页</title>
<script type="application/h4s+json">{"h4s":"1.0","meta":{"title":"性能基准"},"stage":{"width":1920,"height":1080},"fonts":[]}</script>
<style>body{margin:0;background:#0d1117;color:#e6edf3;font-family:system-ui,'Microsoft YaHei',sans-serif}
.slide{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;background:#0d1117;box-sizing:border-box;padding:100px 140px}
.h4s-holder > .slide{visibility:visible!important;opacity:1!important;position:absolute!important;inset:0!important}
.kicker{font-size:20px;letter-spacing:.3em;color:#38bdf8}</style></head><body>
<h4s-deck>
${body}</h4s-deck>
<script src="${pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../player/h4s.player.js')).href}"></script>
</body></html>
`;
const deckPath = path.join(tmp, 'bench.html');
fs.writeFileSync(deckPath, html, 'utf8');
console.log(`基准 deck: ${pages} 页 → ${deckPath}`);

/* ---------- 三次冷载测首帧 ---------- */
const times = [];
for (let run = 1; run <= 3; run++) {
  const dst = path.join(tmp, `run${run}.html`);
  fs.copyFileSync(deckPath, dst);
  const url = pathToFileURL(dst).href;
  const t0 = Date.now();
  await withPage(url, async ({ ev }) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 50));
      const ready = await ev(`document.body.classList.contains('h4s-browse') || document.body.classList.contains('h4s-live')`);
      if (ready === true || ready === 'true') break;
    }
    times.push(Date.now() - t0);
  }, { width: 1920, height: 1080 });
  console.log(`run${run}: 播放器接管 ${times[times.length - 1]}ms（含浏览器冷启动）`);
}

times.sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];
console.log(`\n中位数: ${median}ms（3 次冷载，含浏览器进程启动）`);
/* 判定：P2 出口是「双击→首帧 ≤2s」，本基准含浏览器进程启动（比真实双击场景更严苛，
   进程启动约 300-600ms）——上限 2s 不变，但解读时注意含冷启动 */
if (median > 2000) {
  console.error('✗ 超出 2s 预算');
  process.exit(1);
}
console.log('✓ 达标（≤2s）');
