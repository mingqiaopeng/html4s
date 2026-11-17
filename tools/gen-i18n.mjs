/* 播放器 UI 多语言改造：STR 表 + t() + 全部 UI 字符串替换 */
import fs from 'node:fs';

const p = 'D:/MyProjects/Html4s/player/h4s.player.js';
let s = fs.readFileSync(p, 'utf8');

/* 1. STR 表 + 语言判定（插在 applyUiTheme 注释前，早于一切 UI 使用） */
const strBlock = `  /* ---- UI 多语言（i18n）：清单 meta.lang 优先，回退浏览器语言 ---- */
  var UI_STR = {
    zh: { open: '打开', openT: '打开本地 .html4s 文件 (Ctrl+O)', url: '网址', urlT: '打开网址播放 (Ctrl+L)',
      toLight: '☀ 浅色', toDark: '🌙 深色', themeT: '深色/浅色切换',
      playcur: '从当前放映', playcurT: '从当前选中页放映 (Shift+F5)', play: '▶ 放映', playT: '从头放映 (F5)',
      presenter: '演讲者视图', notes: '备注', thisPage: '本页', total: '总计', fragN: '碎片 ', noFrags: '无碎片',
      nextFrag: '下一状态 · 碎片 ', nextSlide: '下一页 · 最终状态', lastPage: '已是最后一页', firstPage: '已是第一页',
      noNotes: '（本页无备注）', nextCap: '下一状态' },
    en: { open: 'Open', openT: 'Open local .html4s file (Ctrl+O)', url: 'URL', urlT: 'Play from URL (Ctrl+L)',
      toLight: '☀ Light', toDark: '🌙 Dark', themeT: 'Toggle light/dark',
      playcur: 'From current', playcurT: 'Present from selected slide (Shift+F5)', play: '▶ Present', playT: 'Present from start (F5)',
      presenter: 'Presenter', notes: 'Notes', thisPage: 'Slide', total: 'Total', fragN: 'Frag ', noFrags: 'No fragments',
      nextFrag: 'Next state · frag ', nextSlide: 'Next slide · final', lastPage: 'Last page', firstPage: 'First page',
      noNotes: '(no notes)', nextCap: 'Next state' }
  };
  var UILANG = 'zh';
  try {
    var _mlang = ((JSON.parse(($('script[type="application/h4s+json"]') || { textContent: '{}' }).textContent) || {}).meta || {}).lang || '';
    var _nav = (navigator.language || 'zh');
    UILANG = /^zh/i.test(_mlang || _nav) ? 'zh' : 'en';
  } catch (err) {}
  function t(k) { return (UI_STR[UILANG] && UI_STR[UILANG][k]) || UI_STR.zh[k] || k; }

  /* 浏览模式 UI 深浅色 */`;
s = s.replace('  /* 浏览模式 UI 深浅色 */', strBlock);

/* 2. 逐处替换 */
const reps = [
  /* updateThemeBtn */
  [`b.textContent = uiTheme === 'light' ? '🌙 深色' : '☀ 浅色';`, `b.textContent = uiTheme === 'light' ? t('toDark') : t('toLight');`],
  /* 抽屉 */
  [`'<h3><span>演讲者视图</span><span>'`, `'<h3><span>' + t('presenter') + '</span><span>'`],
  [`font-size:12px;color:#64748b;margin:0 0 4px;">备注</div>'`, `font-size:12px;color:#64748b;margin:0 0 4px;">' + t('notes') + '</div>'`],
  [`'<span>本页 <b id="h4s-t-slide">00:00</b></span>'`, `'<span>' + t('thisPage') + ' <b id="h4s-t-slide">00:00</b></span>'`],
  [`'<span>总计 <b id="h4s-t-total">00:00</b></span>'`, `'<span>' + t('total') + ' <b id="h4s-t-total">00:00</b></span>'`],
  [`s.notesEl ? s.notesEl.innerHTML : '<span style="color:#475569">（本页无备注）</span>';\n    $('#h4s-t-frag', drawer).textContent =\n      s.frags.length ? ('碎片 ' + (S.f + 1) + '/' + s.frags.length) : '无碎片';`,
   `s.notesEl ? s.notesEl.innerHTML : '<span style="color:#475569">' + t('noNotes') + '</span>';\n    $('#h4s-t-frag', drawer).textContent =\n      s.frags.length ? (t('fragN') + (S.f + 1) + '/' + s.frags.length) : t('noFrags');`],
  [`{ fc = S.f + 2; label = '下一状态 · 碎片 ' + (S.f + 2) + '/' + s.frags.length; }`, `{ fc = S.f + 2; label = t('nextFrag') + (S.f + 2) + '/' + s.frags.length; }`],
  [`{ idx = S.i + 1; fc = 'final'; label = '下一页 · 最终状态'; }`, `{ idx = S.i + 1; fc = 'final'; label = t('nextSlide'); }`],
  [`else { fc = null; label = '已是最后一页'; }`, `else { fc = null; label = t('lastPage'); }`],
  /* 浏览栏 */
  [`'<button data-bact="openfile" title="打开本地 .html4s 文件 (Ctrl+O)">打开</button>'`, `'<button data-bact="openfile" title="' + t('openT') + '">' + t('open') + '</button>'`],
  [`'<button data-bact="openurl" title="打开网址播放 (Ctrl+L)">网址</button>'`, `'<button data-bact="openurl" title="' + t('urlT') + '">' + t('url') + '</button>'`],
  [`'<button data-bact="theme" title="深色/浅色切换">' + (uiTheme === 'light' ? '🌙 深色' : '☀ 浅色') + '</button>'`, `'<button data-bact="theme" title="' + t('themeT') + '">' + (uiTheme === 'light' ? t('toDark') : t('toLight')) + '</button>'`],
  [`'<button data-bact="playcur" title="从当前选中页放映 (Shift+F5)">从当前放映</button>'`, `'<button data-bact="playcur" title="' + t('playcurT') + '">' + t('playcur') + '</button>'`],
  [`'<button data-bact="play" class="h4s-play" title="从头放映 (F5)">▶ 放映</button>'`, `'<button data-bact="play" class="h4s-play" title="' + t('playT') + '">' + t('play') + '</button>'`],
  /* presenter 窗口 */
  [`'<div class="pv"><div class="cap" id="h4s-p-nextcap">下一状态</div><div class="box" id="h4s-p-next"></div></div>'`, `'<div class="pv"><div class="cap" id="h4s-p-nextcap">' + t('nextCap') + '</div><div class="box" id="h4s-p-next"></div></div>'`],
  [`'<span class="dim">本页 <b id="h4s-p-slide">00:00</b></span>'`, `'<span class="dim">' + t('thisPage') + ' <b id="h4s-p-slide">00:00</b></span>'`],
  [`'<div class="cap">备注</div>'`, `'<div class="cap">' + t('notes') + '</div>'`],
  [`? ('碎片 ' + (P.f + 1) + '/' + s.frags.length) : '无碎片';`, `? (t('fragN') + (P.f + 1) + '/' + s.frags.length) : t('noFrags');`],
  [`s.notesEl ? s.notesEl.innerHTML : '<span style="color:#475569">（本页无备注）</span>';`, `s.notesEl ? s.notesEl.innerHTML : '<span style="color:#475569">' + t('noNotes') + '</span>';`],
  /* toast */
  [`toast('已是第一页');`, `toast(t('firstPage'));`],
  [`else toast('已是最后一页');`, `else toast(t('lastPage'));`],
];
let done = 0;
for (const [old, neu] of reps) {
  if (!s.includes(old)) { console.error('未找到: ' + old.slice(0, 60)); continue; }
  s = s.replace(old, neu);
  done++;
}
fs.writeFileSync(p, s);
console.log('i18n: ' + done + '/' + reps.length + ' 处替换完成');
