/* verify-conformance.mjs — 黄金一致性 deck 的播放器行为断言（CI/发布门禁用）
 * 对构建产物（conformance.html4s → 拷为 .html 避免 file:// 扩展名不渲染的坑）逐项断言。
 * 注意：querySelectorAll('h4s-slide') 会把侧栏/预览克隆也计入 —— 真页数用
 * .h4s-holder > h4s-slide（collectSlides 已把页面搬进舞台）。
 * 运行：node tools/verify-conformance.mjs（任一断言失败 → 退出码 1）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { withPage } from './h4s-cdp.mjs';

const DECK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../examples/conformance.html4s');
let fails = 0;
function ok(name, cond) {
  console.log((cond ? '  ✓ ' : '  ✗ FAIL ') + name);
  if (!cond) fails++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* go() 有转场锁（300ms）——轮询到状态就位为止。
   注意 H4S.go(n) 是 1 基 API（页码），0 基索引 i 需传 i+1 */
async function goTo(ev, i) {
  await ev(`H4S.go(${i + 1})`);
  for (let t = 0; t < 20; t++) {
    await sleep(80);
    const st = JSON.parse(await ev(`JSON.stringify(H4S.state())`));
    if (st.i === i) return st;
  }
  return JSON.parse(await ev(`JSON.stringify(H4S.state())`));
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-conf-'));
const dst = path.join(tmp, 'conformance.html');
fs.copyFileSync(DECK, dst);
const url = pathToFileURL(dst).href;

await withPage(url, async ({ ev }) => {
  await sleep(700);

  const ver = JSON.parse(await ev(`JSON.stringify({
    player: window.H4S && window.H4S.version,
    manifest: (() => { try { return JSON.parse(document.querySelector('script[type="application/h4s+json"]').textContent).playerVersion; } catch (e) { return null; } })(),
    pages: document.querySelectorAll('.h4s-holder > h4s-slide').length,
    browse: document.body.classList.contains('h4s-browse'),
    sidecells: document.querySelectorAll('.h4s-sidecell').length
  })`));
  ok('指纹一致（manifest.playerVersion === H4S.version）', ver.player === ver.manifest && !!ver.player);
  ok('真页数 25（舞台持有，克隆不计）', ver.pages === 25);
  ok('浏览模式接管 + 侧栏 25 格', ver.browse && ver.sidecells === 25);

  /* 编辑标记：进入文字微调模式后统计（舞台箱显示当前选中页=封面，≥1 即为标记生效） */
  await ev(`document.querySelector('[data-bact="edit"]').click()`);
  await sleep(150);
  ok('文字微调标记（当前页可编辑元素 ≥ 1）',
    (await ev(`document.querySelectorAll('.h4s-stagebox [data-h4s-editable]').length`)) >= 1);
  await ev(`document.querySelector('[data-bact="edit"]').click()`);

  ok('aria：页码计数器 live + 侧栏格 label',
    await ev(`document.querySelector('.h4s-counter').getAttribute('aria-live') === 'polite'
      && !!document.querySelector('.h4s-sidecell[aria-label]')`));

  /* 放映 + fx 画布 + 全页导航（轮询等锁释放） */
  await ev(`H4S.present(0)`);
  await sleep(400);
  ok('fx 背景画布存在（defaults.fx=stars）', await ev(`!!document.querySelector('canvas.h4s-fx')`));

  let navOk = true, where = '';
  for (let i = 0; i < 25; i++) {
    const st = await goTo(ev, i);
    if (st.i !== i || st.presenting !== true) { navOk = false; where = '目标 ' + i + ' 实得 ' + JSON.stringify(st); break; }
  }
  ok('全页导航 0→24（lock 正常释放、状态同步）', navOk && where === '');

  /* 碎片推进：jump 到碎片页前一页（none 页 i=17），next() 以 fwd 语义进入碎片页
     （f=-1），再 next() 揭示第一个碎片（jump/back 进碎片页会呈现最终状态，故用 fwd 链） */
  await goTo(ev, 17);
  await ev(`H4S.next()`);
  await sleep(380);
  await ev(`H4S.next()`);
  await sleep(150);
  const fs16 = JSON.parse(await ev(`JSON.stringify(H4S.state())`));
  ok('碎片推进（fwd 进入第 19 页后 next → f=0）', fs16.i === 18 && fs16.f === 0);

  /* confetti 页（索引 19）：fx + confetti 两张画布 */
  await goTo(ev, 19);
  await sleep(200);
  ok('confetti 独立画布出现',
    (await ev(`document.querySelectorAll('canvas.h4s-fx').length`)) >= 2);

  /* endShow 回浏览 */
  await ev(`H4S.stop()`);
  await sleep(120);
  ok('endShow 回浏览', await ev(`document.body.classList.contains('h4s-browse')`));

  /* i18n 语言覆盖（壳设置写入的 localStorage 键） */
  await ev(`localStorage.setItem('h4s-lang-override','en')`);
  await ev(`location.reload()`);
  await sleep(700);
  ok('语言覆盖 en：浏览栏出现 Present',
    await ev(`(document.querySelector('[data-bact="play"]').textContent || '').indexOf('Present') !== -1`));
  await ev(`localStorage.removeItem('h4s-lang-override')`);
}, { width: 1920, height: 1080 });

/* 场景 B：深链 #/7 直接打开到第 7 页 */
await withPage(url + '#/7', async ({ ev }) => {
  await sleep(700);
  const st = JSON.parse(await ev(`JSON.stringify(H4S.state())`));
  ok('深链 #/7 → 停在第 7 页放映中', st.i === 6 && st.presenting === true);
});

console.log(fails === 0 ? '\nconformance 全部通过 ✓' : `\n${fails} 项失败 ✗`);
process.exit(fails === 0 ? 0 : 1);
