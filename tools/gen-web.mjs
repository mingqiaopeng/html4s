#!/usr/bin/env node
/* gen-web.mjs — 生成 GitHub Pages 在线演示页（docs/web/）
 * Pages 从 master 分支 /docs 目录服务；share.html 是浏览器直开形态。
 * 用法: node tools/gen-web.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'docs', 'web');
const DECKS = [
  { id: 'html4s-intro-fs', title: 'html4s 项目介绍', desc: '8 页深色科技风（frontend-slides 技能生成）——本项目的自述 deck' },
  { id: 'conformance', title: '一致性基准', desc: '25 页覆盖全部转场/碎片/特效/编辑能力' },
  { id: 'fx-showcase', title: '转场特效演示', desc: '14 页全转场轨迹 + 遮罩转场 + 背景特效' },
  { id: 'html4s-intro', title: '项目介绍（瑞士风）', desc: 'guizang 技能 · 克莱因蓝瑞士风格' },
  { id: 'huashu-intro', title: '项目介绍（编辑风）', desc: '花叔技能 · 反差编辑风格' },
  { id: 'fs-intro', title: '项目介绍（极简深色）', desc: 'frontend-slides 技能早期版本' },
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

fs.mkdirSync(path.join(OUT, 'decks'), { recursive: true });
const cards = [];
for (const d of DECKS) {
  const share = path.join(ROOT, 'examples', d.id + '.share.html');
  if (!fs.existsSync(share)) { console.log('跳过（无 share 版）: ' + d.id); continue; }
  fs.copyFileSync(share, path.join(OUT, 'decks', d.id + '.html'));
  cards.push(`<a class="card" href="decks/${d.id}.html">
    <b>${esc(d.title)}</b><span>${esc(d.desc)}</span><em>在线播放 →</em></a>`);
}

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>html4s 在线演示</title>
<style>
body{margin:0;background:#0d1117;color:#e6edf3;font:16px/1.6 system-ui,'Microsoft YaHei',sans-serif;}
.wrap{max-width:960px;margin:0 auto;padding:60px 24px;}
h1{font-weight:200;font-size:42px;margin:0 0 8px;} .sub{color:#7d8590;margin:0 0 40px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.card{display:flex;flex-direction:column;gap:6px;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px 22px;color:#e6edf3;text-decoration:none;transition:border-color .15s;}
.card:hover{border-color:#38bdf8;}
.card b{font-size:19px;} .card span{color:#8b949e;font-size:14px;} .card em{color:#38bdf8;font-style:normal;font-size:13px;}
footer{margin-top:48px;color:#7d8590;font-size:13px;}
a{color:#38bdf8;}
</style></head><body><div class="wrap">
<h1>html4s 在线演示</h1>
<p class="sub">一个合法 HTML 文件 + 一个播放器 = 演示文稿。以下 deck 是标准 .html4s 构建产物的浏览器直开副本（浏览器版自动降级，播放/文字微调可用）。</p>
<div class="grid">
${cards.join('\n')}
</div>
<footer>桌面版全功能（双屏演讲者/排练写回/kiosk/文件写回）请使用 <a href="https://github.com/mingqiaopeng/html4s">Windows 播放器</a>。 · 在线版键盘：F5 放映 · → 翻页 · Esc 退出</footer>
</div></body></html>`;

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
console.log('生成: docs/web/index.html（' + cards.length + ' 个 deck）');
