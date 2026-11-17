/* 转场与特效演示 deck 生成器：展示 v0.3 全部新转场 + 背景特效 + 礼花 */
import fs from 'node:fs';

const frame = (n, tot, body, notes, layoutCls) => `
<section class="slide ${layoutCls || 'light'}" data-h4s-transition="${body.transition}" ${body.fx ? 'data-h4s-fx="' + body.fx + '"' : ''} data-slide-id="${body.id}" data-h4s-title="${body.title}">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">转场特效演示 · html4s v0.3</div>
      <div class="r">FX · ${n} / ${tot}</div>
    </header>
    <div style="flex:1;display:grid;align-content:center;gap:28px">
      <span class="t-cat">${body.cat}</span>
      <h1 style="font-weight:200;font-size:110px;letter-spacing:-.03em;margin:0;line-height:1.05;color:${body.dark ? 'var(--accent-on)' : 'var(--ink)'}">${body.h1}</h1>
      <p class="lead" style="max-width:60ch;color:${body.dark ? 'rgba(255,255,255,.9)' : 'var(--text-secondary)'}">${body.p}</p>
      <div style="display:grid;gap:10px;font-size:22px;line-height:1.5;color:${body.dark ? 'rgba(255,255,255,.75)' : 'var(--text-helper)'}">
        <span style="color:${body.dark ? '#fff' : 'var(--text-secondary)'}">data-h4s-transition="<b style="color:${body.dark ? '#fff' : 'var(--accent)'}">${body.transition}</b>"</span>
        ${body.extra ? '<span style="color:' + (body.dark ? '#fff' : 'var(--text-secondary)') + '">' + body.extra + '</span>' : ''}
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】${body.notes}</p>
    <p>【要点】方向键进入本页即可看到转场效果。</p>
    <p>【转场】继续下一页看更多效果。</p>
  </h4s-notes>
</section>`;

const pages = [
  { id: 'cover', transition: 'zoomblur', cat: 'COVER · 缩放模糊', h1: '转场特效<br>演示', p: 'html4s v0.3 播放器新增 12 种转场与 4 种背景特效——零依赖、纯 WAAPI、单文件。', notes: '定调：本 deck 每翻一页换一种转场效果。', dark: true },
  { id: 't-zoomblur', transition: 'zoomblur', cat: '01 · ZOOM-BLUR', h1: '缩放模糊', p: '大字从模糊中聚焦而来——适合章节开场与金句。', notes: 'zoomblur：大字聚焦效果。' },
  { id: 't-cube', transition: 'cube', cat: '02 · CUBE', h1: '三维推转', p: '带透视的三维推转——适合"翻到下一章"。', notes: 'cube：3D 透视推转。' },
  { id: 't-iris', transition: 'iris', cat: '03 · IRIS', h1: '圆形揭开', p: '从中心圆形展开——聚焦单一大图或单一信息。', notes: 'iris：圆形揭开，聚焦型转场。' },
  { id: 't-unfold', transition: 'unfold', cat: '04 · UNFOLD', h1: '中线展开', p: '从中线向上下展开，像展开一幅卷轴。', notes: 'unfold：卷轴式展开。' },
  { id: 't-rise', transition: 'rise', cat: '05 · RISE', h1: '托起', p: '页面从下方托起并恢复饱和度——温和的章节递进。', notes: 'rise：托起转场。' },
  { id: 't-dissolve', transition: 'dissolve', cat: '06 · DISSOLVE', h1: '溶解', p: '步进式溶解——老胶片的味道。', notes: 'dissolve：steps 溶解。' },
  { id: 't-curtain', transition: 'curtain', cat: '07 · CURTAIN', h1: '幕布', p: '红色幕布合拢再展开——舞台剧的仪式感。默认色可用清单 transition.color 配置。', notes: 'curtain：幕布合拢，PowerPoint 同款。' },
  { id: 't-blinds', transition: 'blinds', cat: '08 · BLINDS', h1: '百叶窗', p: '十条叶片交错闭合与打开。', notes: 'blinds：百叶窗。' },
  { id: 't-checkerboard', transition: 'checkerboard', cat: '09 · CHECKERBOARD', h1: '棋盘', p: '36 块方格交错盖下再揭开。', notes: 'checkerboard：棋盘遮罩。' },
  { id: 't-pixelate', transition: 'pixelate', cat: '10 · PIXELATE', h1: '像素溶解', p: '100 块随机顺序像素化——数字世界的感觉。', notes: 'pixelate：随机像素溶解。' },
  { id: 'fx-stars', transition: 'fade', cat: 'FX · 背景特效', h1: '星空漂移', p: '本页清单或全局 defaults.fx = "stars"——粒子层置于内容之下，放映时渲染、离开自动暂停。', extra: '<span>manifest: "fx": "stars" | "snow" | "dust"</span>', notes: '背景特效：stars。', fx: '' },
  { id: 't-confetti', transition: 'curtain', cat: 'FX · 礼花', h1: '礼花时刻', p: '本页标记 data-h4s-fx="confetti"——进入时金色礼花爆发一次，适合收束页与表彰时刻。', extra: 'data-h4s-fx="confetti"', notes: 'confetti：礼花爆发。', fx: 'confetti' },
  { id: 'closing', transition: 'zoomblur', cat: 'CLOSING', h1: '配合原有<br>slide/push/wipe/flip', p: '原 6 种转场全部保留。新转场写法与旧完全一致——清单 defaults 或每页 data-h4s-transition。', notes: '收束。', dark: true },
];

const total = pages.length;
const secs = pages.map((b, i) => frame(String(i + 1).padStart(2, '0'), String(total), b, b.notes, b.dark ? 'accent' : 'light')).join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-family="swiss" data-medium="slide" data-theme="brand">
<head>
<meta charset="utf-8">
<title>转场特效演示 · html4s v0.3</title>
<script type="application/h4s+json">
{
  "h4s": "1.0",
  "meta": { "title": "转场特效演示 · html4s v0.3", "lang": "zh-CN" },
  "stage": { "width": 1920, "height": 1080, "fit": "contain", "background": "transparent" },
  "defaults": {
    "transition": { "name": "fade", "duration": 700, "color": "#1f2937" },
    "fx": "stars",
    "autoslide": 0, "loop": false
  },
  "fonts": []
}
</script>
<style>
/* 兼容 guizang swiss 主题的最小基底（借用 html4s-intro 的 token 精简版） */
:root{
  --paper:#fafaf8;--paper-2:#f0f0ee;--ink:#0a0a0a;--muted:#737373;--grey-1:#f0f0ee;--grey-2:#d4d4d2;--grey-3:#737373;
  --accent:#c8102e;--accent-on:#ffffff;--accent-ink:#c8102e;--accent-rgb:200,16,46;--accent-on-rgb:255,255,255;
  --text-primary:#0a0a0a;--text-body:#252524;--text-secondary:#525252;--text-helper:#737373;
  --line:#d4d4d2;--sans:'Noto Sans SC','Microsoft YaHei',sans-serif;--sans-zh:'Noto Sans SC','Microsoft YaHei',sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;--serif-zh:'Noto Serif SC',serif;
}
html,body{margin:0;background:#101010;font-family:var(--sans)}
.slide{position:relative;width:1920px;height:1080px;margin:0 auto;overflow:hidden;display:flex;flex-direction:column;background:var(--paper)}
.slide.accent{background:var(--accent)}
.slide.accent .h-xl,.slide.accent h1{color:var(--accent-on)}
.canvas-card{display:flex;flex-direction:column;flex:1;padding:43.2px 61.44px 36px;position:relative}
.chrome-min{display:flex;justify-content:space-between;font-family:var(--mono);font-size:18px;letter-spacing:.08em;color:var(--text-helper);margin-bottom:24px}
.slide.accent .chrome-min,.slide.accent .chrome-min .l,.slide.accent .chrome-min .r{color:rgba(255,255,255,.88)}
.slide.accent .t-cat{color:rgba(255,255,255,.8)}
.slide.accent .lead{color:rgba(255,255,255,.92)}
.t-cat{font-family:var(--mono);font-size:18px;letter-spacing:.18em;color:var(--text-helper);text-transform:uppercase}
.slide.accent .t-cat{color:rgba(255,255,255,.85)}
.lead{font-size:26px;line-height:1.6;font-weight:300}
</style>
</head>
<body>
<h4s-deck>
${secs}
</h4s-deck>
<script src="../player/h4s.player.js"></script>
</body>
</html>
`;

fs.writeFileSync('D:/MyProjects/Html4s/examples/fx-showcase.html', html);
console.log('written', fs.statSync('D:/MyProjects/Html4s/examples/fx-showcase.html').size, 'bytes,', total, 'pages');
