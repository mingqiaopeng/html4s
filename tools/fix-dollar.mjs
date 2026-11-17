/* 修复播放器里 6 处 $$ 塌陷为单 $ 的调用 */
import fs from 'node:fs';

const p = 'D:/MyProjects/Html4s/player/h4s.player.js';
let s = fs.readFileSync(p, 'utf8');

const fixes = [
  ["$('[id]', c).forEach", "$$('[id]', c).forEach"],
  ["$('video,audio', c).forEach", "$$('video,audio', c).forEach"],
  ["$('.h4s-clone', miniBox).forEach", "$$('.h4s-clone', miniBox).forEach"],
  ["$('[data-h4s-editable]', miniBox).forEach", "$$('[data-h4s-editable]', miniBox).forEach"],
  ["$('video,audio', root).forEach", "$$('video,audio', root).forEach"],
  ["$('[data-h4s-media~=\"autoplay\"]', root).forEach", "$$('[data-h4s-media~=\"autoplay\"]', root).forEach"],
];

let n = 0;
for (const [old, neu] of fixes) {
  if (s.includes(old)) { s = s.split(old).join(neu); n++; }
  else console.error('未找到: ' + old);
}
fs.writeFileSync(p, s);
console.log('修复 ' + n + '/6 处');
