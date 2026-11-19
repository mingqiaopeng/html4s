/**
 * h4s-cdp.mjs — 零依赖 Chrome DevTools Protocol 驱动（Edge headless）
 * 供 h4s-lint / h4s-shot / h4s-pdf 复用。
 *
 * 用法:
 *   import { withPage } from './h4s-cdp.mjs';
 *   await withPage(fileUrl, async ({ ev }) => {
 *     const title = await ev('document.title');
 *   }, { width: 1920, height: 1080 });
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* 浏览器候选：环境变量 H4S_BROWSER 优先 → Windows Edge/Chrome → Linux Chrome/Chromium/Edge。
   CI（GitHub ubuntu runner 预装 google-chrome）与非 Windows 环境靠后段兜底。 */
const EDGE_CANDIDATES = [
  process.env.H4S_BROWSER || '',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/usr/bin/msedge', '/snap/bin/chromium',
].filter(Boolean);

export function findEdge() {
  for (const p of EDGE_CANDIDATES) if (fs.existsSync(p)) return p;
  /* PATH 兜底（CI/精简镜像上浏览器不在常见固定路径） */
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'msedge', 'chrome']) {
    try {
      const r = spawnSync('which', [name], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split('\n')[0];
    } catch { }
  }
  throw new Error('未找到 Edge/Chrome（可用环境变量 H4S_BROWSER 指定浏览器路径）。');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 启动无头 Edge 打开 url，建立 CDP 会话后调用 fn({ ev, send })，
 * 结束（含异常）时自动关闭浏览器。
 *   ev(expr)         → Runtime.evaluate，returnByValue
 *   send(method,params) → 原始 CDP 命令
 */
export async function withPage(url, fn, { width = 1920, height = 1080, extraArgs = [] } = {}) {
  const edge = findEdge();
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'h4s-edge-'));
  const port = 9223 + Math.floor(Math.random() * 600);
  const proc = spawn(edge, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    `--window-size=${width},${height}`,
    ...extraArgs,
    url,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  try {
    // 1. 等待 DevTools 端口就绪
    const devtools = await (async () => {
      for (let i = 0; i < 60; i++) {
        try {
          const r = await fetch(`http://127.0.0.1:${port}/json/list`);
          const targets = await r.json();
          const page = targets.find((t) => t.type === 'page');
          if (page) return page;
        } catch { /* 未就绪 */ }
        await sleep(200);
      }
      throw new Error('Edge DevTools 连接超时');
    })();

    // 2. WebSocket 会话（Node 22+ 内置 WebSocket）
    const ws = new WebSocket(devtools.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', () => rej(new Error('CDP WebSocket 连接失败')), { once: true });
    });

    let msgId = 0;
    const pending = new Map();
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    });

    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = ++msgId;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

    const ev = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('页面执行异常: ' + (d.exception && d.exception.description || d.text));
      }
      return r.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: false,
    });

    // 3. 等待文档加载完成 + 字体就绪
    for (let i = 0; i < 100; i++) {
      if ((await ev('document.readyState')) === 'complete') break;
      await sleep(150);
    }
    await sleep(400);
    try { await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1'); } catch { }

    return await fn({ send, ev });
  } finally {
    try { proc.kill(); } catch { }
    await sleep(400);
    try {
      fs.rmSync(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch { /* 临时目录留给系统清理 */ }
  }
}
