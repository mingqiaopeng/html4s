/* 媒体控制验证 deck：wav 生成 + 两页结构（P1 autoplay audio / P2 无媒体） */
import fs from 'node:fs';

/* 1 秒 440Hz 正弦波 wav（16bit mono 8kHz，循环播放便于观察） */
const sr = 8000, n = sr; // 1s
const data = Buffer.alloc(n * 2);
for (let i = 0; i < n; i++) {
  const v = Math.round(Math.sin(i / sr * 440 * Math.PI * 2) * 12000);
  data.writeInt16LE(v, i * 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8);
hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
hdr.writeUInt32LE(sr, 24); hdr.writeUInt32LE(sr * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
fs.writeFileSync('D:/MyProjects/Html4s/examples/media-test/loop.wav',
  Buffer.concat([hdr, data]));
console.log('wav written');
