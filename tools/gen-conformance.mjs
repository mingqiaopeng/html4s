#!/usr/bin/env node
/* gen-conformance.mjs — 生成"黄金一致性 deck"（examples/conformance.html）
 * 覆盖：全部 12 动画转场 + 4 遮罩转场 + none、碎片 6 效果、fx 背景层 + 礼花、
 * 混合内容（文字微调场景）、混合比例页、交互元素。25 页。
 * 重建：node tools/gen-conformance.mjs && node tools/h4s-build.mjs examples/conformance.html --share
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'examples', 'conformance.html');

const TRANS = [
  ['fade', '淡入淡出', '最朴素也最安全：观感轻、不抢戏，任何内容都适用。'],
  ['slide', '滑动', '上一页滑出、下一页滑入，方向感明确。'],
  ['push', '推挤', '两页同向位移，PowerPoint 经典推入的手感。'],
  ['zoom', '缩放', '缩小进场 + 放大离场，强调舞台纵深感。'],
  ['wipe', '擦除', 'clip-path 从左到右揭开，图表页常用。'],
  ['flip', '翻转', '透视 rotateY 进出，带轻微透明过渡。'],
  ['zoomblur', '缩放模糊', '大模糊 + 缩放，科技感强的开场/收束。'],
  ['cube', '立方体', '1200px 透视的双面旋转，几何感强。'],
  ['iris', '圆形揭开', 'circle() clip-path 收放，聚光灯效果。'],
  ['unfold', '上下展开', '水平中缝向两侧展开。'],
  ['rise', '升起', '自下而上浮起 + 饱和度恢复，叙事页友好。'],
  ['dissolve', '颗粒溶解', 'steps() 硬切模拟颗粒溶解，复古质感。'],
];
const MASK = [
  ['curtain', '幕布', '两片幕布上下合拢再揭开（PowerPoint 幕布式）。'],
  ['blinds', '百叶窗', '10 条叶片交错收放。'],
  ['checkerboard', '棋盘', '6×6 方块交错淡入淡出。'],
  ['pixelate', '像素溶解', '10×10 随机次序像素化溶解。'],
];

const head = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>html4s 一致性基准</title>
<script type="application/h4s+json">
{
  "h4s": "1.0",
  "meta": { "title": "html4s 一致性基准", "lang": "zh-CN", "author": "Html4s Project" },
  "id": "conformance",
  "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "#0d1117" },
  "defaults": { "transition": { "name": "fade", "duration": 300 }, "fx": "stars" },
  "fonts": []
}
</script>
<style>
  body{margin:0;background:#0d1117;color:#e6edf3;font-family:system-ui,'Microsoft YaHei',sans-serif;}
  h4s-slide{display:block;width:1920px;height:1080px;box-sizing:border-box;padding:110px 150px;position:relative;background:#0d1117;}
  .kicker{font-size:24px;letter-spacing:.35em;color:#38bdf8;margin:0 0 26px;}
  h1{font-size:92px;margin:0 0 34px;line-height:1.15;}
  .desc{font-size:36px;color:#9fb0c3;margin:0;max-width:1400px;line-height:1.6;}
  .meta-foot{position:absolute;bottom:56px;left:150px;font-size:20px;color:#6e7d92;}
  .fragbox{margin-top:26px;display:flex;flex-direction:column;gap:14px;}
  .frag{font-size:30px;color:#e6edf3;}
  .mixed{font-size:60px;line-height:1.5;}
  .mixed .hl{color:#fbbf24;}
  .chip{display:inline-block;font-size:26px;border:1px solid #30363d;border-radius:8px;padding:10px 22px;margin-right:18px;color:#9fb0c3;}
</style></head>
<body>
<h4s-deck>
`;

function page(trans, kicker, title, desc, extra = '', notes = '') {
  return `  <h4s-slide data-h4s-title="${title}"${trans ? ` data-h4s-transition="${trans}"` : ''}>
    <p class="kicker">${kicker}</p>
    <h1>${title}</h1>
    <p class="desc">${desc}</p>
    ${extra}
    <p class="meta-foot">html4s 一致性基准 · 覆盖格式与播放器的全部能力</p>
    <h4s-notes hidden>${notes || desc}</h4s-notes>
  </h4s-slide>
`;
}

let body = '';
body += page('fade', '一致 · CONFORMANCE', 'html4s 一致性基准', '本 deck 覆盖格式规范的全部可枚举能力：转场 20 种、碎片 6 效果、特效层、文字微调、混合比例。供 lint/verify/第三方实现对照。');
for (const [k, name, desc] of TRANS) body += page(k, '转场 · TRANSITION', name, desc);
for (const [k, name, desc] of MASK) body += page(k, '遮罩转场 · MASK', name, desc + ' 幕布色由清单 defaults.transition.color 配置。');
body += page('none', '转场 · NONE', '无转场', 'trans 硬切——教学场景与高速翻页用。');

body += page('', '碎片 · FRAGMENTS', '碎片效果集', '本页含 6 个碎片，依次展示全部效果；J 键为实验性翻页笔，常规翻页键即可推进。', `
    <div class="fragbox">
      <p class="frag" data-h4s-frag="fade-up">① fade-up · 默认上浮（默认效果）</p>
      <p class="frag" data-h4s-frag="slide-left" data-h4s-frag-delay="200">② slide-left · 左侧滑入</p>
      <p class="frag" data-h4s-frag="slide-right">③ slide-right · 右侧滑入</p>
      <p class="frag" data-h4s-frag="zoom">④ zoom · 缩放进入</p>
      <p class="frag" data-h4s-frag="fade">⑤ fade · 纯淡入</p>
      <p class="frag" data-h4s-frag="none">⑥ none · 直切</p>
    </div>`, '六个碎片依次推进，覆盖全部碎片效果枚举与 frag-delay。');

body += page('', '特效 · FX', '背景特效层', '本 deck 清单 defaults.fx="stars"：放映模式全页星空背景；浏览模式在右侧预览箱同步预览。特效画布仅放映渲染、后台自动暂停。', '',
  '背景特效层由清单 defaults.fx 声明，仅放映渲染。');

const confettiPage = page('', '特效 · 礼花', '页面级礼花 confetti', '进入本页爆发一次 130 片礼花——收束与表彰场景专用。', '', 'data-h4s-fx="confetti" 页面礼花，进页爆发一次。').replace('<h4s-slide ', '<h4s-slide data-h4s-fx="confetti" ');
body += confettiPage;

body += page('', '编辑 · EDIT', '混合内容可编辑', '下方大标题含 <br> 与 <span> 混合结构——文字微调（元素级整体编辑）应能整体选中并保留内联结构。', `
    <p class="mixed">工欲善其事，<br>必先<span class="hl">利其器</span>。</p>
    <p><span class="chip">BR 保持</span><span class="chip">SPAN 保持</span><span class="chip">导出还原</span></p>`,
  '文字微调目标页：混合内容整元素编辑，提交后真树与导出均保持 br/span 结构。');

body += page('', '比例 · STAGE', '混合比例页', '本页舞台覆盖为 1280×720（data-h4s-stage），其余页 1920×1080——逐页混合比例与 Letterbox 行为。', '',
  'data-h4s-stage="1280x720" 混合比例页。').replace('<h4s-slide ', '<h4s-slide data-h4s-stage="1280x720" ');

body += page('', '交互 · INTERACT', '交互元素与点击翻页', '放映中点击空白处翻页；按钮/链接等交互元素不受影响（data-h4s-noclick 阻断）。', `
    <p><button style="font-size:30px;padding:14px 34px;border-radius:10px;border:1px solid #30363d;background:#161b22;color:#e6edf3">按钮（可聚焦，点击不翻页）</button>
    <a href="https://github.com/mingqiaopeng/html4s" style="font-size:30px;color:#38bdf8">链接（不翻页）</a></p>`,
  '交互元素页：验证 data-h4s-noclick 与点击翻页的边界。');

body += page('', '收束 · END', '基准结束', '一致性基准走完：转场/碎片/特效/编辑/比例/交互全部覆盖。回浏览模式检查侧栏与页码指示器。', '',
  '收束页。');

fs.writeFileSync(OUT, head + body + '</h4s-deck>\n<script src="../player/h4s.player.js"></script>\n</body></html>\n', 'utf8');
const pages = (body.match(/<h4s-slide/g) || []).length;
console.log('生成: ' + OUT + '（' + pages + ' 页）');
if (pages !== 25) { console.error('页数异常，预期 25'); process.exit(1); }
