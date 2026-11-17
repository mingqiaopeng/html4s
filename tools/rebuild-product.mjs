/* 从构建产物重建：剥旧内联播放器 → 插绝对路径引用 → h4s-build 重新内嵌新版 */
import fs from 'node:fs';

const prod = 'C:/Users/Mingqiao/Desktop/工欲善其事必先利其器/工欲善其事-必先利其器.html4s';
let s = fs.readFileSync(prod, 'utf8');

/* 定位含播放器版本头的 <script> 块，整体替换为相对/绝对路径引用 */
const marker = s.indexOf('h4s-core — html4s 播放器运行时');
if (marker < 0) { console.error('未找到播放器版本头'); process.exit(1); }
const open = s.lastIndexOf('<script>', marker);
const close = s.indexOf('</script>', marker);
if (open < 0 || close < 0) { console.error('script 块边界定位失败'); process.exit(1); }
const head = s.slice(0, open);
const tail = s.slice(close + '</script>'.length);
const replaced = head + '<script src="D:/MyProjects/Html4s/player/h4s.player.js"></script>' + tail;
fs.writeFileSync(prod, replaced, 'utf8');
console.log('旧内联播放器已剥出（' + (close + 9 - open) + ' 字节），引用已替换');
console.log('产物保留：字体 base64 子集 + lucide 内联 + 清单（原样）');
