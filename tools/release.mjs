#!/usr/bin/env node
/* release.mjs — 一键发布管线（阶段1 可靠性工程）
 * 全流程：版本一致性 → 全 deck 重建（--subset --share）→ lint-all 门禁 →
 * 回归双脚本 → Release 构建壳 → staging 白名单同步（杜绝 WebView2 缓存/垃圾误打包，
 * 0.2 与 0.3.1 各犯过一次）→ 体积阈值检查 → ISCC → zip → 静默重装 → 安装副本自检。
 *
 * 用法: node tools/release.mjs [--no-install]（--no-install 跳过 ISCC/zip/安装，用于快速核对）
 * 退出码: 任一环节失败 → 1
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const ARGV = process.argv.slice(2);
const NO_INSTALL = ARGV.includes('--no-install');
const FAILS = [];
const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const die = (msg) => { console.error('✗ ' + msg); FAILS.push(msg); };
const run = (cmd, args, opt = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 600000, ...opt });
  if (r.status !== 0) die(`命令失败: ${cmd} ${args.join(' ')}\n${(r.stderr || r.stdout || '').slice(-800)}`);
  return r;
};
const dirSize = (p) => {
  const walk = (d) => {
    let n = 0;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      n += e.isDirectory() ? walk(f) : fs.statSync(f).size;
    }
    return n;
  };
  return walk(p);
};
const MB = (b) => (b / 1024 / 1024).toFixed(1) + 'MB';

/* ---------- 0. 版本一致性 ---------- */
step(0, '版本一致性检查');
const playerVer = (/var VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'player/h4s.player.js'), 'utf8')) || [])[1];
const csproj = fs.readFileSync(path.join(ROOT, 'shell/Html4sPlayer/Html4sPlayer.csproj'), 'utf8');
const csVer = (/<Version>([^<]+)<\/Version>/.exec(csproj) || [])[1];
const issPath = path.join(ROOT, 'tools/setup-html4s.iss');
const iss = fs.readFileSync(issPath, 'utf8');
const issVer = (/define\s+MyAppVersion\s+"([^"]+)"/.exec(iss) || [])[1];
console.log(`player=${playerVer} csproj=${csVer} iss=${issVer}`);
if (!(playerVer && playerVer === csVer && playerVer === issVer)) die('版本号不一致——请先统一 player/csproj/iss');
const VER = playerVer;
const STAGING = path.join(ROOT, 'release', `html4s-${VER}`);

/* ---------- 1. 全 deck 重建 ---------- */
step(1, '全 deck 重建（--subset --share）');
const DECKS = [
  'fs-intro', 'huashu-intro', 'fx-showcase', 'html4s-intro', 'html4s-intro-fs',
  '2027-dangjian', 'style-a-pilot', 'fs-bridge', 'huashu-bridge', 'conformance',
  'media-test/media-deck',
  'intro-swiss', 'intro-partyred', 'intro-magazine', 'intro-ink',
  'intro-aurora', 'intro-light', 'intro-terminal',
];
for (const d of DECKS) {
  const src = path.join(ROOT, 'examples', d + '.html');
  if (!fs.existsSync(src)) { die('deck 源不存在: ' + d); continue; }
  const r = run(process.execPath, [path.join(HERE, 'h4s-build.mjs'), src, '--subset', '--share'], { cwd: ROOT });
  const pv = (/"playerVersion":\s*"[^"]+"/.exec(fs.readFileSync(src.replace(/\.html$/, '.html4s'), 'utf8')) || [])[0];
  if (!pv || !pv.includes(VER)) die(`${d} 指纹未注入（期望 ${VER}）`);
  console.log('  ✓ ' + d + '（' + pv + '）');
}
if (FAILS.length) process.exit(1);

/* ---------- 2. 质量门禁 ---------- */
step(2, '质量门禁：lint-all + 回归双脚本');
run(process.execPath, [path.join(HERE, 'lint-all.mjs')], { cwd: ROOT });
run(process.execPath, [path.join(HERE, 'verify-bugfix.mjs')], { cwd: ROOT });
run(process.execPath, [path.join(HERE, 'verify-conformance.mjs')], { cwd: ROOT });

/* ---------- 3. 壳 Release 构建 ---------- */
step(3, '壳 Release 构建');
const binDir = path.join(ROOT, 'shell/Html4sPlayer/bin/Release/net10.0-windows');
run('dotnet', ['build', path.join(ROOT, 'shell/Html4sPlayer/Html4sPlayer.csproj'), '-c', 'Release', '-v', 'q', '-nologo'], { cwd: ROOT });
if (!fs.existsSync(path.join(binDir, 'Html4sPlayer.exe'))) die('Release 产物缺失');

/* ---------- 4. staging 白名单同步 ---------- */
step(4, 'staging 白名单同步（release/html4s-' + VER + '）');
fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGING, { recursive: true });
const copy = (src, destDir) => {
  const d = path.join(STAGING, destDir);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.cpSync(src, d, { recursive: true });
};
const copyFile = (src, destRel) => {
  const d = path.join(STAGING, destRel);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(src, d);
};
/* 壳运行必需件（逐文件——bin 里混有 .pdb/.xml/WebView2 用户缓存，整目录拷曾致 36.7MB 误打包） */
const shellFiles = ['Html4sPlayer.exe', 'Html4sPlayer.dll', 'Html4sPlayer.deps.json',
  'Html4sPlayer.runtimeconfig.json', 'Microsoft.Web.WebView2.Core.dll',
  'Microsoft.Web.WebView2.WinForms.dll', 'Microsoft.Web.WebView2.Wpf.dll'];
for (const f of shellFiles) copyFile(path.join(binDir, f), 'Html4sPlayer/' + f);
copy(path.join(binDir, 'runtimes'), 'Html4sPlayer/runtimes');
copyFile(path.join(ROOT, 'player/h4s.player.js'), 'player/h4s.player.js');
/* examples：deck 三件套 + 功能示例 + 字体/媒体资产 */
for (const d of DECKS) {
  const base = d.replace(/\/[^/]+$/, '');
  copyFile(path.join(ROOT, 'examples', d + '.html'), path.join('examples', d + '.html'));
  copyFile(path.join(ROOT, 'examples', d + '.html4s'), path.join('examples', d + '.html4s'));
  const share = path.join(ROOT, 'examples', d + '.share.html');
  if (fs.existsSync(share)) copyFile(share, path.join('examples', d + '.share.html'));
  void base;
}
for (const legacy of ['hello.h4s.html', 'showcase.h4s.html', 'plain-legacy.html'])
  copyFile(path.join(ROOT, 'examples', legacy), 'examples/' + legacy);
copy(path.join(ROOT, 'examples/fonts'), 'examples/fonts');
copy(path.join(ROOT, 'examples/media-test'), 'examples/media-test');
/* tools / docs / skill / 根文档 */
for (const f of fs.readdirSync(path.join(ROOT, 'tools')))
  if (/\.mjs$|\.iss$|\.html$|\.ico$|\.py$/.test(f)) copyFile(path.join(ROOT, 'tools', f), 'tools/' + f);
copy(path.join(ROOT, 'docs'), 'docs');
copy(path.join(ROOT, 'skills/html4s-ppt-skill'), 'skill'); /* 发布包 skill/ = guizang 视觉技能（AGPL，NOTICE 声明） */
/* LICENSES：汇总 NOTICE 与各技能携带的许可文件（AGPL 合规声明） */
fs.mkdirSync(path.join(STAGING, 'LICENSES'), { recursive: true });
copyFile(path.join(ROOT, 'docs/NOTICE.md'), 'LICENSES/NOTICE.md');
for (const sk of fs.readdirSync(path.join(ROOT, 'skills'))) {
  const skDir = path.join(ROOT, 'skills', sk);
  for (const f of fs.readdirSync(skDir))
    if (/^license|^copying/i.test(f)) copyFile(path.join(skDir, f), 'LICENSES/' + sk + '-' + f);
}
for (const f of ['ARCHITECTURE.md', 'README.md', 'install.bat', 'uninstall.bat'])
  if (fs.existsSync(path.join(ROOT, f))) copyFile(path.join(ROOT, f), f);

/* 体积阈值：壳目录 > 10MB 或出现 WebView2 缓存目录 = 误打包 */
const shellSize = dirSize(path.join(STAGING, 'Html4sPlayer'));
console.log('  壳目录: ' + MB(shellSize) + ' · staging 总量: ' + MB(dirSize(STAGING)));
if (shellSize > 10 * 1024 * 1024) die('壳目录超 10MB——疑似误打包 WebView2 用户缓存');
if (fs.existsSync(path.join(STAGING, 'Html4sPlayer/Html4sPlayer.exe.WebView2'))) die('WebView2 用户缓存被误打包');
if (FAILS.length) process.exit(1);

/* ---------- 5. ISCC + zip ---------- */
if (NO_INSTALL) { console.log('\n[--no-install] 跳过 ISCC/zip/安装'); process.exit(0); }
step(5, 'ISCC 编译安装器 + zip 重打包');
const iscc = path.join(process.env.LOCALAPPDATA || '', 'Programs/Inno Setup 6/ISCC.exe');
if (!fs.existsSync(iscc)) die('未找到 ISCC（%LOCALAPPDATA%/Programs/Inno Setup 6）');
run(iscc, [issPath], { cwd: ROOT });
const zipPath = path.join(ROOT, 'release', `html4s-${VER}.zip`);
fs.rmSync(zipPath, { force: true });
run('powershell', ['-NoProfile', '-Command',
  `Compress-Archive -Path '${STAGING}\\*' -DestinationPath '${zipPath}' -Force`], { cwd: ROOT });
console.log('  setup/zip 已生成');

/* ---------- 6. 静默重装 + 安装副本自检 ---------- */
step(6, '静默重装 + 安装副本自检');
{
  const tk = spawnSync('taskkill', ['/IM', 'Html4sPlayer.exe', '/F'], { encoding: 'utf8' });
  console.log(tk.status === 0 ? '  已关闭驻留壳进程' : '  （无驻留壳进程）');
}
const setupExe = path.join(ROOT, 'release', `html4s-${VER}-setup.exe`);
run(setupExe, ['/VERYSILENT', '/NORESTART', '/CLOSEAPPLICATIONS=no'], { cwd: ROOT });
/* Inno 父进程立即返回，setup.tmp 继续写盘——轮询等待安装落地（≤30s） */
const instApp = path.join(process.env.LOCALAPPDATA || '', 'Html4s');
const instExe = path.join(instApp, 'Player/Html4sPlayer.exe');
const binExeMtime = fs.statSync(path.join(binDir, 'Html4sPlayer.exe')).mtimeMs;
let landed = false;
for (let t = 0; t < 120; t++) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  try {
    /* Inno 写入的 mtime 被截断到整秒（最多差 ~1s）——用 ±60s 窗口；
       旧副本的时间戳差一天，不会误判 */
    if (fs.existsSync(instExe) && Math.abs(fs.statSync(instExe).mtimeMs - binExeMtime) <= 60000) { landed = true; break; }
  } catch { }
}
if (!landed) die('安装副本未更新（setup 60s 内未落地）');
else console.log('  安装落地 ✓');
const instDeck = path.join(instApp, 'Examples', 'conformance.html4s');
if (!fs.existsSync(instDeck)) die('安装副本缺 conformance 示例');
const instMark = fs.readFileSync(instDeck, 'utf8');
if (!instMark.includes('"playerVersion": "' + VER + '"')) die('安装副本 deck 指纹非 ' + VER);
const logPath = path.join(instApp, 'debug.log');
const dbgBefore = (() => { try { return fs.readFileSync(logPath, 'utf8').length; } catch { return 0; } })();
run(instExe, ['--selftest-dpi'], { cwd: ROOT });
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1200);
/* 按 UTF-16 码元长度切片（statSync().size 是字节数，中文日志会错位） */
const dbgLog = fs.readFileSync(logPath, 'utf8').slice(dbgBefore);
if (!dbgLog.includes('shell v' + VER)) die('安装副本 selftest 版本指纹非 ' + VER + '（debug.log 无记录）');
if (!/clientSize=\d+x\d+/.test(dbgLog)) die('安装副本 selftest 几何缺失');
console.log('  安装副本自检通过（shell v' + VER + ' 指纹 + 对话框几何断言）');

/* ---------- 总结 ---------- */
if (FAILS.length) { console.error('\n发布存在失败项:'); FAILS.forEach((f) => console.error('  ✗ ' + f)); process.exit(1); }
console.log('\n=== 发布完成 html4s-' + VER + ' ===');
console.log('setup: release/html4s-' + VER + '-setup.exe');
console.log('zip:   release/html4s-' + VER + '.zip');
process.exit(0);
