#!/usr/bin/env node
/**
 * make-pilot.mjs — 用改造后的瑞士模板生成试点 deck
 * 演示 P1 五个理念：固定分辨率 / 缩略图 / 本机字体内嵌 / 播放信息 / .html4s 交付
 */
import fs from 'node:fs';

let html = fs.readFileSync('skills/html4s-ppt-skill/assets/template-style-b.html', 'utf8');

/* 1. 清单：标题 + 本机字体声明（构建期子集内嵌） + 播放信息 */
html = html.replace(/<script type="application\/h4s\+json">[\s\S]*?<\/script>/, `
  <script type="application/h4s+json">
  {
    "h4s": "1.0",
    "meta": { "title": "html4s × 归藏瑞士风 · 试点", "lang": "zh-CN", "author": "Html4s Project" },
    "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "transparent" },
    "defaults": {
      "transition": { "name": "slide", "duration": 450 },
      "fragment": { "effect": "fade-up", "delay": 150 },
      "autoslide": 0,
      "loop": false,
      "progress": true,
      "slideNumber": true
    },
    "fonts": [
      { "family": "Noto Sans SC", "file": "pilot/fonts/noto-sans-sc-chinese-simplified-400-normal.woff2", "weight": 400 },
      { "family": "Noto Sans SC", "file": "pilot/fonts/noto-sans-sc-latin-400-normal.woff2", "weight": 400 }
    ]
  }
  </script>
`);

/* 2. 每个示例页注入演讲备注；第 2 页加自动播放与碎片演示 */
let slideNo = 0;
html = html.replace(/<\/section>/g, (m) => {
  slideNo++;
  const notes = {
    1: `<h4s-notes hidden>
      <p>【目的】让观众记住一件事：html4s = 文本格式 + 播放器，AI 写完双击即演。</p>
      <p>【要点】这页由归藏瑞士模板生成，舞台上按 1920×1080 固定分辨率渲染；左侧缩略图来自播放器。</p>
      <p>【转场】下一页用同一视觉系统的双栏版式，说明"核心内容不变"。</p>
    </h4s-notes>`,
    2: `<h4s-notes hidden>
      <p>【目的】展示播放信息写入：本页声明了 15 秒自动翻页（data-h4s-autoslide），kiosk/巡展场景零操作。</p>
      <p>【要点】字体已按本页用字子集内嵌——离线打开不缺字。</p>
      <p>【转场】结束页。</p>
    </h4s-notes>`
  }[slideNo] || '';
  return notes + m;
});

/* 第二个 section 加自动播放 */
html = html.replace(/(<section[^>]*class="[^"]*slide[^"]*"[^>]*>)([\s\S]*?<\/section>)([\s\S]*?<section)/, (m, open, body, next) => {
  return m; /* 占位，下面用计数法 */
});

/* 逐 section 处理：给第 2 个 section 开自动播放 */
let idx = 0;
html = html.replace(/<section([^>]*)>/g, (m, attrs) => {
  idx++;
  if (idx === 2 && !/data-h4s-autoslide/.test(attrs)) {
    return `<section${attrs} data-h4s-autoslide="15">`;
  }
  return m;
});

/* 3. 试点页标题 + 播放器路径按 pilot 位置重写 */
html = html.replace(/<title>[^<]*<\/title>/, '<title>html4s × 归藏瑞士风 · 试点</title>');
html = html.replace('../../../player/h4s.player.js', '../player/h4s.player.js');

fs.writeFileSync('examples/pilot-swiss.html', html);
console.log('试点生成: examples/pilot-swiss.html | sections:', slideNo);
