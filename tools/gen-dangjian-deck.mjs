/* 党建工作务虚会 deck 生成器：html4s-intro 瑞士框架 + 党建红品牌主题 + 11 页内容 */
import fs from 'node:fs';

let s = fs.readFileSync('D:/MyProjects/Html4s/examples/html4s-intro.html', 'utf8');

/* 1. 标题与主题 */
s = s.replace(/<title>[^<]*<\/title>/, '<title>党建工作务虚会上的发言 · html4s</title>');
s = s.replace('data-theme="ikb"', 'data-theme="brand"');

/* 2. 注入党建红品牌主题（gz-theme.mjs brand "#C8102E" --family swiss 生成） */
const brandCss = '\n/* 党建红品牌主题 · gz-theme.mjs brand "#C8102E" --family swiss */\n' +
  '[data-theme="brand"]{--paper:#fafaf8;--paper-2:#f0f0ee;--ink:#0a0a0a;--muted:#737373;--grey-1:#f0f0ee;--grey-2:#d4d4d2;--grey-3:#737373;--accent:#c8102e;--accent-on:#ffffff;--accent-ink:#c8102e;--accent-bright:#ff6a6b;--accent-deep:#810018;--accent-display:#c8102e;--accent-ink-inverse:#ff928f;--accent-soft:#f8dedb;--text-primary:#0a0a0a;--text-body:#252524;--text-secondary:#525252;--text-helper:#737373;--text-placeholder:#a3a3a3;--text-on-color:#ffffff;--line-strong:#a3a3a3;--line:#d4d4d2;--line-subtle:#e0e0e0;--ink-rgb:10,10,10;--paper-rgb:250,250,248;--accent-rgb:200,16,46;--accent-on-rgb:255,255,255;--accent-on-text:#ffffff;--accent-on-text-rgb:255,255,255;color-scheme:light}\n' +
  /* 红底比 IKB 蓝亮：accent 色块上的白色小字透明度需提高才能过对比度门 */
  '[data-theme="brand"] .slide.accent .canvas-card .chrome-min,' +
  '[data-theme="brand"] .split-half > .half.b-accent .chrome-min{color:rgba(255,255,255,.88)}\n' +
  '[data-theme="brand"] .slide.accent .ascii-bg,' +
  '[data-theme="brand"] .split-half > .half.b-accent .ascii-bg{opacity:.42}\n' +
  /* 中文四字标签放不下默认 7.6em 的 .multi 列 —— 加宽 */
  '.slide[data-layout="S02"] .tl-node{grid-template-columns:var(--tl-axis-w) minmax(0,7em) minmax(0,300px) 1fr}\n' +
  '.slide[data-layout="S02"] .tl-node .multi{font-size:clamp(28px,42px,46px)}\n';
s = s.replace(/(\[data-theme="safety-orange"\]\{[^}]*\})/, '$1' + brandCss);

/* 3. 替换 deck 内容 */
const CH = '党建工作务务虚会 · 党建处'.replace('务务', '务'); // 防手误
const chromeL = '党建工作务虚会 · 党建处';
const chromeR = (n) => `DJ · 26.12 · ${String(n).padStart(2, '0')} / 11`;

const slides = `
<section class="slide accent" data-layout="S01" data-animate="hero" data-slide-id="cover" data-h4s-transition="zoom">
  <div class="canvas-card">
    <canvas class="ascii-bg" aria-hidden="true"></canvas>
    <div class="chrome-min">
      <div class="l">${chromeL}</div>
      <div class="r">${chromeR(1)}</div>
    </div>
    <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr auto;gap:28.08px">
      <div data-anim="kicker" class="t-meta" style="color:#fff;letter-spacing:.22em;opacity:.95">党建 · 思想 · 组织 · 统战 · 2026-2027</div>
      <h1 data-anim="title" style="align-self:center;font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:min(178px,172px);line-height:.98;letter-spacing:-.025em;color:var(--accent-on)">回头看，<br/>向前<span style="font-weight:400">干</span>。</h1>
      <div data-anim="bottom" style="display:grid;grid-template-rows:auto auto;gap:17.28px;border-top:1px solid rgba(255,255,255,.35);padding-top:21.6px">
        <div data-anim="lead" class="lead" style="max-width:52ch;color:#fff;opacity:.92;font-weight:300">2026 年工作完成情况回顾，三个问题的思考，以及 2027 年"三化"突破的七个行动。</div>
        <div style="display:flex;justify-content:space-between;align-items:end">
          <div class="t-meta" style="color:#fff;opacity:.85">党建工作务虚会发言 · 修改稿</div>
          <div class="t-meta" style="color:#fff;opacity:.85">→ 方向键翻页 · F5 放映</div>
        </div>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】开场定调：这是一份"回顾 + 思考 + 打算"的务实发言，不是表彰汇报。</p>
    <p>【要点】"回头看、向前干"五个字统领全篇；深红主色呼应主题。</p>
    <p>【转场】先用一句话交代 2026 的总盘子。</p>
  </h4s-notes>
</section>

<!-- 02 · P3 Statement · 总盘子 -->
<section class="slide" data-layout="S03" data-animate="statement-rise" data-slide-id="statement" data-h4s-transition="fade">
  <div class="canvas-card">
    <h1 class="h-statement">
      <span>7 个方面、24 项重点任务，</span><br>
      <span>重点抓了<span style="color:var(--accent)">六个方面</span>。</span>
    </h1>
    <span class="stmt-anchor">— 围绕深化落实新时代高质量党建工程 · 2026 全年 · 党建处</span>
  </div>
  <h4s-notes hidden>
    <p>【目的】用一句话交代 2026 的总盘子：紧扣分部党委部署，围绕 7 方面 24 项重点任务。</p>
    <p>【要点】"六个方面"是下面三页的骨架。</p>
    <p>【转场】展开六个方面。</p>
  </h4s-notes>
</section>

<!-- 03 · P2 Timeline · 六个方面 -->
<section class="slide" data-layout="S02" data-animate="timeline-vertical" data-slide-id="six" data-h4s-transition="slide">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 完成情况</div>
      <div class="r">${chromeR(3)}</div>
    </header>
    <div style="padding-top:12px">
      <span class="t-cat">2026 · 六个方面</span>
      <h2 style="font-weight:200;font-size:42px;letter-spacing:-.02em;margin:8px 0 0">一年来重点抓的六件事</h2>
    </div>
    <div class="timeline-v" style="flex:1">
      <div class="tl-node">
        <span class="dot"></span><span class="yr">01</span><span class="multi">学习教育</span>
        <p class="desc">牵头专班日常工作，编发通知单 7 期、推进会 4 次、专题党课 21 次，问题全部按期整改销号</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">02</span><span class="multi">理论武装</span>
        <p class="desc">中心组专题学习 4 次、集中学习 12 次、研讨发言 39 人次，党建思想落实措施 4 方面 13 项</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">03</span><span class="multi">基层基础</span>
        <p class="desc">13 个支部高质量完成换届，"月督导、季检查、年考核"闭环；系统运行处获评"示范党支部"</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">04</span><span class="multi">党员教育</span>
        <p class="desc">培训覆盖率 100%，季度集中学习全覆盖，发展党员 2 名</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">05</span><span class="multi">深度融合</span>
        <p class="desc">10 项工程组建突击队，陕武直流"每日三件事"做法获国网特高压部表扬</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">06</span><span class="multi">思想统战</span>
        <p class="desc">建党 105 周年微党课展示暨"两优一先"表彰大会，10 支队伍登台授课</p>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】用一根时间轴扫过六个方面，每条只留一句最硬的事实。</p>
    <p>【要点】每条都带数字或荣誉，不讲过程；讲的时候可以按听众反应展开。</p>
    <p>【转场】下一页把一年浓缩成四个数字。</p>
  </h4s-notes>
</section>

<!-- 04 · P6 KPI Tower · 一年数字 -->
<section class="slide" data-layout="S06" data-animate="tower-grow" data-slide-id="kpi" data-h4s-transition="zoom">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 完成情况</div>
      <div class="r">${chromeR(4)}</div>
    </header>
    <div class="grid-2-9" style="align-items:end">
      <div class="lead-col">
        <span class="t-cat">2026 · 数说党建</span>
        <h2 class="h-xl" style="font-weight:200">一年下来<br>四个硬数字</h2>
      </div>
      <p class="lead" style="font-weight:300;color:var(--text-secondary)">学习教育、理论武装、组织建设、党员培训——每一条都有可核对的台账。</p>
    </div>
    <div class="kpi-tower-row" style="align-items:end">
      <div class="tower-col">
        <i data-lucide="megaphone"></i>
        <span class="num-mega">21</span>
        <span class="lbl">专题党课（班子成员、支部书记讲授）</span>
        <div class="bar-tower" style="--h:190px"></div>
      </div>
      <div class="tower-col">
        <i data-lucide="book-open"></i>
        <span class="num-mega">12</span>
        <span class="lbl">中心组集中学习（12 个专题）</span>
        <div class="bar-tower" style="--h:120px"></div>
      </div>
      <div class="tower-col">
        <i data-lucide="users"></i>
        <span class="num-mega">100%</span>
        <span class="lbl">党员培训覆盖率</span>
        <div class="bar-tower" style="--h:230px"></div>
      </div>
      <div class="tower-col">
        <i data-lucide="git-branch"></i>
        <span class="num-mega">13</span>
        <span class="lbl">党支部高质量完成换届</span>
        <div class="bar-tower" style="--h:150px"></div>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】把一年的工作压成四个可核对的数字。</p>
    <p>【要点】100% 覆盖率是最重的一条；21 次党课是密度最高的动作。</p>
    <p>【转场】成绩之外，还有一块最难的——党建与生产经营的融合，下一页展开。</p>
  </h4s-notes>
</section>

<!-- 05 · P8 Duo Compare · 融合的两种打法 -->
<section class="slide" data-layout="S08" data-animate="duo-mirror" data-slide-id="fusion" data-h4s-transition="slide">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 深度融合</div>
      <div class="r">${chromeR(5)}</div>
    </header>
    <div class="duo-compare">
      <div class="duo-half" data-h4s-frag="fade-up">
        <span class="t-cat">面上 · 组织体系</span>
        <h2 style="font-size:56px">制度到岗</h2>
        <ul class="meta-list" style="margin-top:32px;display:grid;gap:18px;font-size:18px;line-height:1.7;color:var(--text-secondary)">
          <li>党员责任区、示范岗、突击队"岗区队"成体系</li>
          <li>青豫、陕武直流等 10 项工程组建突击队</li>
          <li>西北区域电力职工创新联盟联合攻关</li>
        </ul>
      </div>
      <span class="vrule"></span>
      <div class="duo-half" data-h4s-frag="fade-up">
        <span class="t-cat">点上 · 一线攻坚</span>
        <h2 style="font-size:56px">党员到台</h2>
        <ul class="meta-list" style="margin-top:32px;display:grid;gap:18px;font-size:18px;line-height:1.7;color:var(--text-primary)">
          <li>陕北—安徽特高压送端调试：进场即建临时党小组</li>
          <li>"每日三件事"：调试前碰头、调试后复盘、突发集体研判</li>
          <li>高风险操作党员先到主控台盯守——获国网特高压部表扬</li>
        </ul>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】展示"党建+生产经营"的两个层次：面上的制度体系，点上的现场攻坚。</p>
    <p>【要点】重点讲"每日三件事"——这是组织作用在现场最具体的形态。</p>
    <p>【转场】成绩讲完。务实会的价值在直面问题——第二部分。</p>
  </h4s-notes>
</section>

<!-- 06 · P3 Statement · 幕封 -->
<section class="slide" data-layout="S03" data-animate="statement-rise" data-slide-id="problems-lead" data-h4s-transition="fade">
  <div class="canvas-card">
    <h1 class="h-statement">
      <span>成绩之后，</span><br>
      <span>更要直面<span style="color:var(--accent)">三个"不够"</span>。</span>
    </h1>
    <span class="stmt-anchor">— 务虚会的价值，在于把问题摆上台面 · 几点思考</span>
  </div>
  <h4s-notes hidden>
    <p>【目的】转场进入问题部分，定下直面问题的基调。</p>
    <p>【要点】停顿。语气从汇报切换到反思。</p>
    <p>【转场】逐条展开三个问题。</p>
  </h4s-notes>
</section>

<!-- 07 · P2 Timeline · 三个问题 -->
<section class="slide" data-layout="S02" data-animate="timeline-vertical" data-slide-id="problems" data-h4s-transition="slide">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 几点思考</div>
      <div class="r">${chromeR(7)}</div>
    </header>
    <div style="padding-top:12px">
      <span class="t-cat">问题清单 · 三条</span>
      <h2 style="font-weight:200;font-size:42px;letter-spacing:-.02em;margin:8px 0 0">队伍 · 责任 · 融合</h2>
    </div>
    <div class="timeline-v" style="flex:1">
      <div class="tl-node">
        <span class="dot"></span><span class="yr">一</span><span class="multi">队伍承压</span>
        <p class="desc">兼职党务"两头兼顾、疲于应付"，激励有限、通道偏窄，"不愿干、盼着换"——整体状态撑不起高质量发展</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">二</span><span class="multi">责任不实</span>
        <p class="desc">部分书记把党建当"软任务"，"一岗双责"停在签责任书、开会议的层面，没有真正扛在肩上</p>
      </div>
      <div class="tl-node">
        <span class="dot"></span><span class="yr">三</span><span class="multi">融合不实</span>
        <p class="desc">"两张皮"没根本解决：物理叠加多、化学反应少；投向"容易出彩"而非"最需要攻坚"；成效缺衡量尺度</p>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】把三个问题一条条钉实，每条都有具体表现。</p>
    <p>【要点】"物理叠加、化学反应"是最容易记住的表述；第三条着墨最多。</p>
    <p>【转场】针对问题，2027 的总思路是什么——下一页。</p>
  </h4s-notes>
</section>

<!-- 08 · P3 Statement · 2027 总思路 -->
<section class="slide" data-layout="S03" data-animate="statement-rise" data-slide-id="plan" data-h4s-transition="fade">
  <div class="canvas-card">
    <h1 class="h-statement" style="font-size:120px">
      <span>二十一大主线 · 党委换届重点，</span><br>
      <span>在"<span style="color:var(--accent)">三化</span>"上求突破。</span>
    </h1>
    <span class="stmt-anchor">— 具体化 · 机制化 · 特色化 · 为"十五五"高质量发展提供组织保证 · 2027 思路</span>
  </div>
  <h4s-notes hidden>
    <p>【目的】给出 2027 总思路：一条主线、一个重点、一个抓手、三个突破方向。</p>
    <p>【要点】"具体化、机制化、特色化"是全篇的纲，下面七个行动都是它的展开。</p>
    <p>【转场】七个行动总览。</p>
  </h4s-notes>
</section>

<!-- 09 · P14 Loop · 七个行动 -->
<section class="slide" data-layout="S14" data-animate="loop-form" data-slide-id="actions" data-h4s-title="2027 七个专项行动" data-h4s-transition="fade">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 2027 打算</div>
      <div class="r">${chromeR(9)}</div>
    </header>
    <div style="padding-top:12px">
      <span class="t-cat">2027 · 重点抓好七个方面</span>
      <h2 style="font-weight:200;font-size:42px;letter-spacing:-.02em;margin:8px 0 0">七个专项行动</h2>
    </div>
    <div class="loop-diagram">
      <div class="loop-steps">
        <div class="loop-step" data-anim="step"><span class="big-num">01</span><div><h4>举旗凝心 · 引领行动</h4><p>迎接学习贯彻党的二十一大精神，逐项分解纳入任务清单</p></div></div>
        <div class="loop-step" data-anim="step"><span class="big-num">02</span><div><h4>换届规范 · 提质行动</h4><p>分部党委换届 + 6 个支部换届，"一支部一清单"三级把关</p></div></div>
        <div class="loop-step" data-anim="step"><span class="big-num">03</span><div><h4>铸魂赋能 · 育人行动</h4><p>党员轮流讲微党课，每月规定动作清单，支部照单落实</p></div></div>
        <div class="loop-step" data-anim="step"><span class="big-num">04</span><div><h4>名家领学 · 提升行动</h4><p>名家讲堂 + 延安照金实境研学 + 以考促学，三位一体</p></div></div>
      </div>
      <div class="loop-steps">
        <div class="loop-step" data-anim="step"><span class="big-num">05</span><div><h4>书记领题 · 攻坚行动</h4><p>由"讲"到"领"：每书记年初认领 1 个难题，年末述评</p></div></div>
        <div class="loop-step" data-anim="step"><span class="big-num">06</span><div><h4>帮带提质 · 强基行动</h4><p>党建"二十四节气表" + 一对一联系支部 + 考评硬挂钩</p></div></div>
        <div class="loop-step" data-anim="step"><span class="big-num">07</span><div><h4>融合聚力 · 特色行动</h4><p>重大现场临时党支部 + "一支部一实事"，不贪多、只求实</p></div></div>
        <div style="display:flex;align-items:center;justify-content:center">
          <span class="t-meta" style="color:var(--text-helper)">→ 三化：具体化 · 机制化 · 特色化</span>
        </div>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】七个行动一页总览，名称 + 一句核心动作。</p>
    <p>【要点】不逐条细讲——点 02 换届（头等大事）和 07 融合聚力（呼应第三问题）即可。</p>
    <p>【转场】下一页展开最有代表性的一项：书记领题。</p>
  </h4s-notes>
</section>

<!-- 10 · P8 Duo · 书记领题：讲台到战场 -->
<section class="slide" data-layout="S08" data-animate="duo-mirror" data-slide-id="shuji" data-h4s-transition="slide">
  <div class="canvas-card">
    <header class="chrome-min">
      <div class="l">${chromeL} · 书记领题攻坚</div>
      <div class="r">${chromeR(10)}</div>
    </header>
    <div class="duo-compare">
      <div class="duo-half" data-h4s-frag="fade-up">
        <span class="t-cat">过去 · 讲台</span>
        <h2 style="font-size:56px">由"讲"到"领"</h2>
        <ul class="meta-list" style="margin-top:32px;display:grid;gap:18px;font-size:18px;line-height:1.7;color:var(--text-secondary)">
          <li>"支部书记讲党建"已完成全员轮讲</li>
          <li>2027 迭代升级：把"讲台"转向"战场"</li>
          <li>每书记年初认领 1 个难题，年内拿出成果、年末集中述评</li>
        </ul>
      </div>
      <span class="vrule"></span>
      <div class="duo-half" data-h4s-frag="fade-up">
        <span class="t-cat">未来 · 战场</span>
        <h2 style="font-size:56px">由"谈"到"晒"</h2>
        <ul class="meta-list" style="margin-top:32px;display:grid;gap:18px;font-size:18px;line-height:1.7;color:var(--text-primary)">
          <li>党建月度例会：把堵点难点摆到台面上共同会诊</li>
          <li>例会开成解决问题的小型现场会</li>
          <li>配"二十四节气表"按表作业 + 一对一联系支部帮带</li>
        </ul>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】用"讲台→战场"的对照，讲清书记领题攻坚的核心变化。</p>
    <p>【要点】两个"由…到…"是本页记忆点；呼应第二部分的"责任不实"。</p>
    <p>【转场】收束。</p>
  </h4s-notes>
</section>

<!-- 11 · P9 Closing -->
<section class="slide split" data-layout="S09" data-animate="split-statement" data-slide-id="closing" data-h4s-transition="fade">
  <div class="canvas-card">
    <div class="split-half">
      <div class="half b-accent" style="padding:60.48px 69.12px 47.52px;justify-content:space-between;position:relative;overflow:hidden">
        <canvas class="ascii-bg" aria-hidden="true"></canvas>
        <div class="chrome-min" style="margin-bottom:0;position:relative;z-index:1">
          <div class="l" style="opacity:.9">11 / 11</div>
          <div class="r" style="opacity:.9">CLOSING</div>
        </div>
        <div data-anim="manifesto" style="display:flex;flex-direction:column;gap:21.6px;position:relative;z-index:1">
          <div class="t-meta" style="color:#fff;opacity:.95;letter-spacing:.22em;margin-bottom:17.28px">以上考虑还不成熟</div>
          <h2 style="font-family:var(--sans),var(--sans-zh);font-size:min(89.6px,88px);line-height:1.02;letter-spacing:-.025em;font-weight:200;color:var(--accent-on)">让党建<br>在攻坚一线<br><span style="font-weight:400">看得见、量得出。</span></h2>
          <div style="font-family:var(--sans),var(--sans-zh);font-size:19.2px;line-height:1.6;color:#fff;opacity:.92;font-weight:300;max-width:36ch;margin-top:15.12px">请领导和同志们批评指正。</div>
        </div>
        <div data-anim="signature" style="display:flex;justify-content:space-between;align-items:end;border-top:1px solid rgba(255,255,255,.35);padding-top:21.6px;position:relative;z-index:1">
          <div class="t-meta" style="color:#fff;opacity:.85">党建工作务虚会 · 党建处</div>
          <div class="t-meta" style="color:#fff;opacity:.85">2026.12</div>
        </div>
      </div>
      <div class="half" style="padding:60.48px 69.12px 47.52px;justify-content:space-between">
        <div class="chrome-min"><div class="l">TAKEAWAYS</div><div class="r">03 RULES</div></div>
        <div data-anim="rules" style="display:grid;gap:40px">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start">
            <span class="num-mega" style="font-size:34px">01</span>
            <div><h4 style="margin:0 0 8px;font-size:24px;font-weight:600">一条主线</h4><p style="margin:0;font-size:16px;line-height:1.6;color:var(--text-secondary)">迎接学习贯彻党的二十一大精神，落实分部党委换届。</p></div>
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start">
            <span class="num-mega" style="font-size:34px">02</span>
            <div><h4 style="margin:0 0 8px;font-size:24px;font-weight:600">三个突破</h4><p style="margin:0;font-size:16px;line-height:1.6;color:var(--text-secondary)">具体化、机制化、特色化——七个行动逐项落地。</p></div>
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:24px;align-items:start">
            <span class="num-mega" style="font-size:34px;color:var(--accent)">03</span>
            <div><h4 style="margin:0 0 8px;font-size:24px;font-weight:600;color:var(--accent)">一个落点</h4><p style="margin:0;font-size:16px;line-height:1.6;color:var(--text-secondary)">一支部一实事——把党建成效落到看得见的实事上。</p></div>
          </div>
        </div>
        <div class="t-meta" style="color:var(--text-helper);text-align:right">→ 完 · 谢谢</div>
      </div>
    </div>
  </div>
  <h4s-notes hidden>
    <p>【目的】收束：一条主线、三个突破、一个落点。</p>
    <p>【要点】"看得见、量得出"回应第三问题的融合尺度；姿态是"请批评指正"。</p>
    <p>【转场】Q&amp;A。</p>
  </h4s-notes>
</section>
`;

const start = s.indexOf('<h4s-deck>') + '<h4s-deck>'.length;
const end = s.indexOf('</h4s-deck>');
s = s.slice(0, start) + '\n' + slides + s.slice(end);

fs.writeFileSync('D:/MyProjects/Html4s/examples/2027-dangjian.html', s);
console.log('written', fs.statSync('D:/MyProjects/Html4s/examples/2027-dangjian.html').size, 'bytes');
console.log('sections:', (s.match(/<section /g) || []).length);
