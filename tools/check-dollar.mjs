/* 权威检查：播放器源 $$ 完整性（不经 bash） */
import fs from 'node:fs';

const s = fs.readFileSync('D:/MyProjects/Html4s/player/h4s.player.js', 'utf8');
const triple = (s.match(/\$\$\$/g) || []).length;
const ok = (s.match(/\$\$\(/g) || []).length;
const single = (s.match(/(?<!\$)\$\(/g) || []).length;

console.log('$$$ 残留:', triple, triple === 0 ? '✓ 无' : '✗ 仍有');
console.log('$$ 调用:', ok, '（预期 16）');
console.log('单 $ 调用（正常，querySelector 等非集合）:', single);

/* 精确定位任何剩余三$ */
let idx = s.indexOf('$$$');
while (idx > -1) {
  const line = s.slice(0, idx).split('\n').length;
  console.log('  三$@行' + line + ':', s.slice(Math.max(0, idx - 50), idx + 40).replace(/\n/g, '⏎'));
  idx = s.indexOf('$$$', idx + 1);
}
