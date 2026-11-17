/* h4s-fonts.mjs —— 系统字体扫描与内嵌推荐（字体落地闭环）
 *
 * 用法:
 *   node tools/h4s-fonts.mjs scan                     # 列出系统可嵌入字体（ttf/otf/woff）
 *   node tools/h4s-fonts.mjs scan --need "思源黑体,方正小标宋"   # 只显示匹配需求的字体
 *   node tools/h4s-fonts.mjs license <字体文件>        # 查看 fsType 嵌入许可位
 *
 * fsType（OS/2 表）：0=Installable 可安装嵌入；2=Restricted 受限；4=Preview&Print；
 * 8=Editable 可编辑。≥2 时构建会警告——授权问题需自行确认。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const FONT_DIRS = [
  'C:/Windows/Fonts',
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft/Windows/Fonts'),
];

function walkFonts() {
  const out = [];
  for (const dir of FONT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (/\.(ttf|otf|ttc|woff2?)$/i.test(f)) out.push(path.join(dir, f));
    }
  }
  return out;
}

/* 用 fontTools 读字体名与 fsType（python 单进程批量，避免逐文件开销） */
function probe(files) {
  const listFile = path.join(process.env.TEMP || '.', '.h4s-font-probe.json');
  fs.writeFileSync(listFile, JSON.stringify(files), 'utf8');
  const script = `
import json, sys
from fontTools.ttLib import TTFont
out = []
for f in json.load(open(sys.argv[1])):
    try:
        ft = TTFont(f, fontNumber=0, lazy=True)
        name = ft['name'].getDebugName(1) or ''
        family = ft['name'].getDebugName(16) or name
        fstype = ft['OS/2'].fsType if 'OS/2' in ft else -1
        out.append({'file': f, 'family': family, 'name': name, 'fsType': fstype})
    except Exception as e:
        out.append({'file': f, 'family': '', 'name': '', 'fsType': -1, 'err': str(e)[:60]})
print(json.dumps(out, ensure_ascii=False))
`;
  const tmpPy = path.join(process.env.TEMP || '.', '.h4s-font-probe.py');
  fs.writeFileSync(tmpPy, script, 'utf8');
  try {
    return JSON.parse(execFileSync('python', [tmpPy, listFile], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch (e) {
    console.error('需要 python + fontTools（pip install fonttools）: ' + e.message);
    process.exit(2);
  }
}

const FSTYPE_LABEL = {
  0: '可安装嵌入', 1: '私用（勿嵌入）', 2: '受限（谨慎）', 4: '预览打印', 8: '可编辑嵌入',
};

const cmd = process.argv[2];
if (cmd === 'scan') {
  const need = (process.argv.indexOf('--need') > -1 ? process.argv[process.argv.indexOf('--need') + 1] : '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const rows = probe(walkFonts());
  const shown = need.length
    ? rows.filter(r => need.some(n => (r.family + r.name).includes(n)))
    : rows;
  console.log(`系统字体 ${rows.length} 个，显示 ${shown.length} 个：\n`);
  for (const r of shown) {
    const lic = FSTYPE_LABEL[r.fsType] ?? (r.fsType === -1 ? '未知' : `fsType=${r.fsType}`);
    console.log(`  ${r.family.padEnd(24)} ${lic.padEnd(10)} ${path.basename(r.file)}`);
  }
  console.log('\n内嵌方法：把选中的文件拷进 deck 目录 fonts/，清单 fonts[].file 指向它，构建 --subset 自动子集化。');
} else if (cmd === 'license') {
  const f = process.argv[3];
  if (!f || !fs.existsSync(f)) { console.error('用法: h4s-fonts.mjs license <字体文件>'); process.exit(2); }
  const [r] = probe([path.resolve(f)]);
  console.log(`family: ${r.family}\nname:   ${r.name}\nfsType: ${r.fsType}（${FSTYPE_LABEL[r.fsType] ?? '未知'}）`);
  console.log(r.fsType === 0 || r.fsType === 8 ? '✓ 允许嵌入' : r.fsType === 2 ? '⚠ 受限嵌入——需确认授权' : '⚠ 检查许可条款');
} else {
  console.error('用法: node tools/h4s-fonts.mjs scan [--need "字体名,…"] | license <文件>');
  process.exit(2);
}
