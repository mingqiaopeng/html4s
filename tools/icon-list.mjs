#!/usr/bin/env node
/* icon-list.mjs — 图标引擎配套工具
 * ① 无参数：列出播放器内置的全部图标名（46 枚）
 * ② --check <deck.html|html4s>：校验 deck 里 data-h4s-icon 名称是否都在内置集内
 *    （未知名称播放器会静默留空——本工具提前揪出拼写错误），发现未知 → 退出码 1
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const playerSrc = fs.readFileSync(path.resolve(HERE, '..', 'player', 'h4s.player.js'), 'utf8');
const block = /var ICONS = \{([\s\S]*?)\n  \};/.exec(playerSrc);
if (!block) { console.error('未在播放器源中找到 ICONS 表'); process.exit(2); }
const names = [...block[1].matchAll(/'([a-z0-9-]+)':\s*'</g)].map((m) => m[1]);

const argv = process.argv.slice(2);
const checkIdx = argv.indexOf('--check');

if (checkIdx === -1) {
  console.log('内置图标 ' + names.length + ' 枚：');
  for (let i = 0; i < names.length; i += 6) {
    console.log('  ' + names.slice(i, i + 6).map((n) => n.padEnd(14)).join(''));
  }
  console.log('\n用法：deck 中写 <i data-h4s-icon="名称"></i>（尺寸随 font-size、颜色随 currentColor）');
  console.log('校验：node tools/icon-list.mjs --check <deck>');
  process.exit(0);
}

const deck = argv[checkIdx + 1];
if (!deck || !fs.existsSync(deck)) { console.error('deck 文件不存在'); process.exit(2); }
const html = fs.readFileSync(path.resolve(deck), 'utf8');
const used = [...html.matchAll(/data-h4s-icon="([^"]+)"/g)].map((m) => m[1]);
const missing = [...new Set(used.filter((n) => !names.includes(n)))];
console.log('deck 引用图标 ' + used.length + ' 处 · 去重 ' + new Set(used).size + ' 种');
if (missing.length) {
  console.log('✗ 未知图标名（播放器将留空）: ' + missing.join(' '));
  process.exit(1);
}
console.log('✓ 全部名称有效');
