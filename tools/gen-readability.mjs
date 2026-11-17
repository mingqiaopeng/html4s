/* 中文演示可读性适配层 v2：全字符下限 18px + 正文 26px + 大字适度压缩
   幂等：先移除旧层再插入新层 */
import fs from 'node:fs';

const OLD = /\n  \/\* ===== 中文演示可读性适配层[\s\S]*?<\/style>/;
const layer = `
  /* ===== 中文演示可读性适配层 v2 · html4s 修订 =====
     中文演示需求（1920 固定舞台投影）：
     ① 全字符下限 18px（含元数据/页码/角标，无一例外）
     ② 正文 26px、辅助说明 22px
     ③ 大字标题适度压缩（×0.8），层级靠字号差+字重保持
     原体系为西文杂志排版校订，中文投影后排不可读。 */
  .lead{font-size:max(min(24px,30px),26px)!important;line-height:1.6!important}
  .meta-list li,.loop-step p,.desc{font-size:26px!important;line-height:1.65!important}
  .stat-note,.lbl,.duo-half .meta-list li{font-size:22px!important;line-height:1.6!important}
  .t-meta,.t-cat,.chrome-min,.stmt-anchor,.foot,.yr,.stat-label,.kpi-cell .lbl,.unit{font-size:18px!important}
  /* 大字压缩（不用 important —— deck 内联定制尺寸保持优先） */
  .h-hero{font-size:min(246px,246px)}
  .h-statement{font-size:min(148px,148px)}
  .h-xl{font-size:min(138px,138px)}
  .display{font-size:min(246px,246px)}
  .display-zh{font-size:min(184px,184px)}
  .h1-zh{font-size:min(108px,108px)}
`;

const targets = [
  'D:/MyProjects/Html4s/examples/html4s-intro.html',
  'D:/MyProjects/Html4s/skills/html4s-ppt-skill/assets/template-style-a.html',
  'D:/MyProjects/Html4s/skills/html4s-ppt-skill/assets/template-style-b.html',
];
for (const f of targets) {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(OLD, '\n</style>');
  s = s.replace('</style>', layer + '</style>');
  fs.writeFileSync(f, s, 'utf8');
  console.log('v2 injected:', f);
}
