#!/usr/bin/env node
/* gen-web.mjs — 生成 GitHub Pages 默认参考站（docs/ 根——Pages 源路径只支持 /docs）
 * 定位：html4s 的在线默认参考——项目简介 + 主题库画廊（在线播放）+ 键位速查 + 文档导航。
 * 用法: node tools/gen-web.mjs（新 deck 上线前先 h4s-build --share）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'docs');
const GH = 'https://github.com/mingqiaopeng/html4s';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const DECKS = [
  { id: 'html4s-intro-fs', title: '深色科技', skill: 'frontend-slides', desc: '8 页最新版介绍：三重困境 / 竞品对比 / 键位与能力——推荐从这里开始' },
  { id: 'intro-swiss', title: '瑞士克莱因蓝', skill: 'guizang 风格', desc: '白底蓝竖条 + 重磅黑体标题 + 页题水印，国际主义网格感' },
  { id: 'intro-partyred', title: '党建红', skill: 'guizang + gz-theme', desc: '米纸底 + 红色条带 + 衬线标题 + 金色点缀，政务实战风格' },
  { id: 'intro-magazine', title: '电子杂志', skill: 'guizang Style A', desc: '黑底黄标段落符 + 衬线斜体大标题 + 块状卡' },
  { id: 'intro-ink', title: '水墨编辑', skill: '花叔风格', desc: '暖纸底 + 墨黑衬线 + 右上朱砂印章，编辑排版气质' },
  { id: 'intro-aurora', title: '极光渐变', skill: '官方', desc: '深蓝紫双色径向渐变底 + 霓虹描边卡，星空特效层' },
  { id: 'intro-light', title: '晨雾浅色', skill: '官方', desc: '浅灰白极简：无框左线卡 + 大量留白' },
  { id: 'intro-terminal', title: '终端绿', skill: '官方', desc: '黑底等宽字体 + $ 提示符 + 扫描线，程序员浪漫' },
];

fs.mkdirSync(path.join(OUT, 'decks'), { recursive: true });
const cards = [];
const wanted = new Set();
for (const d of DECKS) {
  const share = path.join(ROOT, 'examples', d.id + '.share.html');
  if (!fs.existsSync(share)) { console.log('跳过（无 share 版）: ' + d.id); continue; }
  fs.copyFileSync(share, path.join(OUT, 'decks', d.id + '.html'));
  wanted.add(d.id + '.html');
  cards.push(`<a class="card" href="decks/${d.id}.html">
    <span class="theme">${esc(d.title)}</span>
    <b>html4s 项目介绍</b>
    <span class="desc">${esc(d.desc)}</span>
    <span class="meta">${esc(d.skill)} · 在线播放 →</span><span class="alt">备用：cdn.jsdelivr.net/gh/mingqiaopeng/html4s@master/docs/decks/${d.id}.html</span></a>`);
}
/* 清理画廊里已下线的 deck 副本（画廊只保留当前 DECKS 集合 + 独立入口的 layouts） */
wanted.add('layouts.html'); /* 版式图鉴独立入口（复制在其后的 main 内） */
for (const f of fs.readdirSync(path.join(OUT, 'decks'))) {
  if (!wanted.has(f)) { fs.rmSync(path.join(OUT, 'decks', f)); console.log('清理下线副本: ' + f); }
}
const themes = ['深色科技', '瑞士克莱因蓝', '党建红', '电子杂志', '水墨编辑', '极光渐变', '晨雾浅色', '终端绿'];
/* 版式图鉴（非主题画廊成员，独立入口） */
const layoutsShare = path.join(ROOT, 'examples', 'layouts.share.html');
if (fs.existsSync(layoutsShare)) fs.copyFileSync(layoutsShare, path.join(OUT, 'decks', 'layouts.html'));
wanted.add('layouts.html'); /* 防清理误删（复制发生在清理后，双保险） */

const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="html4s 在线演示与默认参考——一个合法 HTML 文件 + 一个播放器 = 演示文稿；AI 写得准，人演得稳，格式永远可版本化。">
<title>html4s — 在线演示与参考</title>
<style>
:root{--bg:#0d1117;--bg2:#161b22;--bd:#30363d;--tx:#e6edf3;--dim:#8b949e;--ac:#38bdf8;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.65 system-ui,'Microsoft YaHei',sans-serif;}
.wrap{max-width:1020px;margin:0 auto;padding:64px 24px 48px;}
.badge{display:inline-block;font-size:13px;color:var(--ac);border:1px solid #38bdf855;border-radius:20px;padding:3px 14px;margin-bottom:14px;}
h1{font-weight:200;font-size:46px;letter-spacing:-.02em;margin:0 0 10px;}
.sub{color:var(--dim);font-size:18px;margin:0 0 26px;max-width:760px;}
.sub b{color:var(--tx);font-weight:600;}
.cta{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 14px;}
.cta a{display:inline-block;padding:11px 26px;border-radius:10px;font-weight:600;text-decoration:none;font-size:15px;}
.cta .go{background:#2563eb;color:#fff;} .cta .go:hover{background:#1d4ed8;}
.cta .gh{border:1px solid var(--bd);color:var(--tx);} .cta .gh:hover{background:var(--bg2);}
.note{color:var(--dim);font-size:13px;margin:0 0 46px;}
h2{font-size:22px;font-weight:600;margin:52px 0 6px;}
.h2d{color:var(--dim);font-size:14px;margin:0 0 20px;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.card{display:flex;flex-direction:column;gap:7px;background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:18px 20px;color:var(--tx);text-decoration:none;transition:border-color .15s,transform .15s;}
.card:hover{border-color:var(--ac);transform:translateY(-2px);}
.theme{align-self:flex-start;font-size:12px;color:#0d1117;background:var(--ac);border-radius:12px;padding:2px 12px;font-weight:700;}
.card b{font-size:18px;} .desc{color:var(--dim);font-size:14px;} .meta{color:var(--ac);font-size:12px;margin-top:auto;}
.alt{color:#6e7681;font-size:10.5px;word-break:break-all;}
.altbox{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:14px 18px;margin:0 0 26px;font-size:13.5px;color:var(--dim);}
.altbox b{color:var(--tx);} .altbox kbd{background:#21262d;padding:1px 7px;border-radius:4px;font:12px ui-monospace,monospace;color:#e2e8f0;}
.altbox a{color:var(--ac);}
.kbd{background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:18px 22px;}
.kbd table{width:100%;border-collapse:collapse;font-size:14.5px;}
.kbd td{padding:7px 10px;border-bottom:1px solid #21262d;}
.kbd td:first-child{width:46%;color:var(--ac);white-space:nowrap;}
.kbd kbd{background:#21262d;padding:2px 9px;border-radius:5px;font:12.5px ui-monospace,Consolas,monospace;color:#e2e8f0;}
.docs{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.docs a{display:block;background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:14px 18px;color:var(--tx);text-decoration:none;font-size:14.5px;}
.docs a:hover{border-color:var(--ac);} .docs b{color:var(--ac);display:block;margin-bottom:3px;} .docs span{color:var(--dim);font-size:13px;}
footer{margin-top:56px;color:var(--dim);font-size:13px;border-top:1px solid #21262d;padding-top:20px;}
footer a{color:var(--ac);}
@media (max-width:760px){.grid,.docs{grid-template-columns:1fr;}h1{font-size:34px;}}
</style></head><body><div class="wrap">
<span class="badge">v0.3.2 · AGPL-3.0 · Windows + Web</span>
<h1>html4s</h1>
<p class="sub"><b>HyperText Markup Language For Slides</b>——用"一个合法 HTML 文件 + 一个播放器"做演示文稿。<b>AI 写得准</b>（纯文本、排版确定性、git 可版本化），<b>人演得稳</b>（双击即演、20 种转场、演讲者双屏、排练写回、kiosk）。</p>
<div class="cta">
  <a class="go" href="decks/html4s-intro-fs.html">▶ 在线播放项目介绍</a>
  <a class="gh" href="${GH}">⬇ Windows 桌面版（全功能）</a>
</div>
<p class="note">在线版是浏览器降级形态：F5 放映 · → 翻页 · ✎ 文字微调可用；双屏演讲者 / 排练写回 / 文件写回 / kiosk 请用桌面版。</p>

<h2>主题库画廊 <span style="font-size:14px;color:var(--dim);font-weight:400">（v1.1 · ${themes.length} 主题 · 同一最新版项目介绍 × ${themes.length} 种表达 · 点击在线播放）</span></h2>
<p class="h2d">全部 deck 使用同一份最新版项目介绍（gen-themes.mjs 生成）——内容完全一致，主题即独立 CSS 层，横向对比即见"内容 / 表现分离"的 html4s 核心设计。工程与验收 deck（一致性基准 conformance · 转场特效 fx-showcase）见 <a href="${GH}/tree/master/examples" style="color:var(--ac)">GitHub examples/</a>。</p>
<div class="altbox"><b>打不开？</b>①先硬刷新（<kbd>Ctrl+F5</kbd>）——部署后 CDN 可能缓存了旧 404；②github.io 在部分网络间歇性不稳，稍候再试；③每张卡下方有 <b>jsDelivr CDN 备用地址</b>（浏览器直接打开即可播放，deck 是零依赖自包含文件）；④彻底离线的兜底：从 <a href="${GH}/tree/master/examples" style="color:var(--ac)">examples/</a> 下载 .html4s 文件双击播放（桌面客户端）或拖入浏览器。</div>
<div class="grid">
${cards.join('\n')}
</div>

<h2>在线版键位速查</h2>
<div class="kbd"><table>
<tr><td><kbd>F5</kbd> / <kbd>Shift+F5</kbd></td><td>从头放映 / 从当前页放映</td></tr>
<tr><td><kbd>→ ↓ 空格</kbd> / <kbd>← ↑</kbd></td><td>翻页与碎片推进 / 回退</td></tr>
<tr><td><kbd>G</kbd> 总览 · <kbd>B</kbd>/<kbd>W</kbd> 黑白屏 · <kbd>L</kbd> 激光笔</td><td>放映辅助</td></tr>
<tr><td><kbd>S</kbd> 演讲者抽屉 · <kbd>T</kbd> 计时暂停 · <kbd>R</kbd> 排练</td><td>讲者工具</td></tr>
<tr><td><kbd>✎ 编辑</kbd>（浏览栏）· <kbd>Esc</kbd></td><td>文字微调（改字可直接导出） / 退出</td></tr>
</table></div>

<h2>版式模板库 <span style="font-size:14px;color:var(--dim);font-weight:400">（20 种典型页面版式 · 封面/目录/对比图/流程图/时间线/数据看板/图表页…）</span></h2>
<p class="h2d">对标常见 deck 设计软件的内置版式——每个版式一个可复制片段 + 统一 CSS 变量（与主题库正交组合）。在线版式图鉴每页右下角标注片段文件名。</p>
<div class="cta"><a class="go" href="decks/layouts.html">▶ 在线浏览版式图鉴</a><a class="gh" href="${GH}/blob/master/docs/LAYOUTS.md">📖 生成指南 docs/LAYOUTS.md</a></div>

<h2>文档与规范</h2>
<div class="docs">
<a href="${GH}/blob/master/docs/DECK-DESIGN.md"><b>deck 设计决策指南（AI 先读）</b><span>场景 → 主题 8 选 1 → 叙事骨架 4 模板 → 版式分配 → 特效强度分级</span></a>
<a href="${GH}/blob/master/docs/SPEC.md"><b>格式规范 v1.0-rc1</b><span>清单 Schema · 元素与属性注册表 · 转场/fx/碎片枚举 · 版本化与第三方准入</span></a>
<a href="${GH}/blob/master/docs/LAYOUTS.md"><b>版式模板库</b><span>20 种典型页面版式 · 生成指南 · 主题适配（CSS 变量正交）</span></a>
<a href="${GH}/blob/master/ARCHITECTURE.md"><b>架构与路线图</b><span>核心设计决策（ADR）· P0-P4 里程碑 · 风险清单</span></a>
<a href="${GH}/blob/master/docs/CONFORMANCE.md"><b>一致性认证</b><span>第三方运行时如何跑 conformance 套件并过审</span></a>
<a href="${GH}/blob/master/docs/CAPABILITIES.md"><b>能力矩阵</b><span>桌面壳 / 浏览器版能力差异一览</span></a>
<a href="${GH}/blob/master/docs/MCP-SETUP.md"><b>MCP 接入</b><span>把 lint/shot/build/review 暴露给 AI Agent</span></a>
<a href="${GH}/blob/master/README.md"><b>README</b><span>完整说明 · 创作工作流 · 三技能矩阵</span></a>
</div>

<footer>html4s · AGPL-3.0 · 视觉体系派生自 <a href="https://github.com/op7418/guizang-ppt-skill">guizang-ppt-skill</a> 等（<a href="${GH}/blob/master/docs/NOTICE.md">归属与许可</a>）· 本页由 <a href="${GH}/blob/master/tools/gen-web.mjs">tools/gen-web.mjs</a> 生成</footer>
</div></body></html>`;

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
console.log('生成: docs/index.html（' + cards.length + ' deck · ' + themes.length + ' 主题）');
