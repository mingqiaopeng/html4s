#!/usr/bin/env node
/* lint-all：全量 deck lint 门禁（CI / 发布前用）。
 * 扫描 examples/*.html，排除：plain-legacy（无清单的兼容示例）、
 * *-slides.html（模板片段）、构建/运行时产物（.h4s-lint/.h4srender/.share）。
 * 任一 deck 有 error → 退出码 1。 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const EXCLUDE = ['plain-legacy.html'];
/* --structure：透传给 h4s-lint，仅结构检查（渲染检查依赖字体环境，CI 无 deck 字体） */
const STRUCT = process.argv.includes('--structure');

const decks = fs.readdirSync(path.join(ROOT, 'examples'))
  .filter((f) => /\.html$/i.test(f))
  .filter((f) => !EXCLUDE.includes(f))
  .filter((f) => !/-slides\.html$/i.test(f))
  .filter((f) => !/\.h4s-lint\.|\.h4srender\.|\.share\.|\.edited\./i.test(f))
  .sort();

let fail = 0;
for (const d of decks) {
  const r = spawnSync(process.execPath, [path.join(HERE, 'h4s-lint.mjs'), path.join(ROOT, 'examples', d),
    ...(STRUCT ? ['--structure'] : [])],
  { encoding: 'utf8', timeout: 180000 });
  const verdict = (r.stdout || '').split('\n').find((l) => l.startsWith('结论')) || '(无结论)';
  const pass = r.status === 0;
  console.log((pass ? '✓ ' : '✗ ') + d + ' → ' + verdict.trim());
  if (!pass) {
    const err = ((r.stderr || '') + '\n' + (r.stdout || '')).trim().split('\n').slice(0, 8).join('\n  ');
    if (err) console.log('  ' + err);
  }
  if (!pass) fail++;
}
console.log(fail ? '\n' + fail + ' 个 deck 未通过 ✗' : '\n全部 ' + decks.length + ' 个 deck 通过 ✓');
process.exit(fail ? 1 : 0);
