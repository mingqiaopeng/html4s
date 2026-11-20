#!/usr/bin/env node
/**
 * h4s-mcp.mjs — html4s MCP server（stdio，零依赖）
 * 把 html4s 工具链暴露给 AI Agent：lint / shot / outline / build / pdf
 *
 * 注册（ZCode 为例）:
 *   zcode mcp add html4s -- node D:\MyProjects\Html4s\tools\h4s-mcp.mjs
 * 或其它支持 MCP 的客户端中配置:
 *   { "command": "node", "args": ["<路径>/tools/h4s-mcp.mjs"] }
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = {
  h4s_lint: {
    description: '检查 html4s deck：舞台溢出 / 字号 / 对比度 / 结构完整性。返回错误与警告清单。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string', description: 'deck 文件路径 (.html/.html4s)' } },
    },
  },
  h4s_shot: {
    description: '逐页渲染 PNG 截图（AI 视觉自审用）。返回输出目录。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string' }, out: { type: 'string', description: '输出目录（可选）' } },
    },
  },
  h4s_outline: {
    description: '读取 deck 结构：页数、每页标题、备注有无、manifest 信息。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string' } },
    },
  },
  h4s_build: {
    description: '构建单文件 .html4s：内嵌播放器/图标/字体子集。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string' }, subset: { type: 'boolean', description: '字体子集化（默认开）' } },
    },
  },
  h4s_pdf: {
    description: '导出矢量 PDF（每页 1920×1080，文本可选中）。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string' }, out: { type: 'string' } },
    },
  },
  h4s_slides: {
    description: 'deck 增量编辑：insert（--after 后插入 snippet）/ move（--from --to 排序）/ renumber / sync（--build 自动重建产物）。',
    inputSchema: {
      type: 'object', required: ['deck', 'action'],
      properties: {
        deck: { type: 'string' },
        action: { type: 'string', enum: ['insert', 'move', 'renumber', 'sync'] },
        after: { type: 'string', description: 'insert: 插入位置（slide-id 或 1 起始序号，0=最前）' },
        file: { type: 'string', description: 'insert: <section>…</section> 片段文件路径' },
        id: { type: 'string', description: 'insert: 新页 data-slide-id' },
        from: { type: 'string', description: 'move: 源页（slide-id 或序号）' },
        to: { type: 'string', description: 'move: 目标序号（1 起始）' },
        build: { type: 'boolean', description: 'sync: 有产物时自动重建（默认 true）' },
      },
    },
  },
  h4s_review: {
    description: '一键验收：lint 全量检查并返回结构化结论（verdict/errors/warnings/逐页问题计数）——AI 自检闭环的单次调用入口。',
    inputSchema: {
      type: 'object', required: ['deck'],
      properties: { deck: { type: 'string' } },
    },
  },
  h4s_scaffold: {
    description: 'deck 脚手架：按主题（8 选 1）+ Markdown 大纲自动组装 starter deck（封面/目录/章节/内容页/收束，版式与主题内建）。之后用 h4s_lint/h4s_shot 微调，h4s_build 交付。',
    inputSchema: {
      type: 'object', required: ['theme', 'title', 'outline'],
      properties: {
        theme: { type: 'string', enum: ['darktech', 'swiss', 'partyred', 'magazine', 'ink', 'aurora', 'light', 'terminal'], description: '主题 id（决策依据见 docs/DECK-DESIGN.md）' },
        title: { type: 'string', description: 'deck 主标题（封面）' },
        outline: { type: 'string', description: 'Markdown 大纲：## 章节 / - 要点 / > 金句 / ```chart JSON``` / | 表格 | / 普通段落=观点页' },
        author: { type: 'string' },
        out: { type: 'string', description: '输出 .html 路径（可选，默认 examples/ 下按标题命名）' },
      },
    },
  },
};

function runTool(name, args) {
  const deck = args.deck;
  if (!deck) return { error: '缺少 deck 参数' };
  const abs = path.resolve(deck);
  if (!fs.existsSync(abs)) return { error: '文件不存在: ' + abs };

  switch (name) {
    case 'h4s_lint':
      return runCapture(process.execPath, [path.join(HERE, 'h4s-lint.mjs'), abs]);
    case 'h4s_shot': {
      const args2 = [path.join(HERE, 'h4s-shot.mjs'), abs];
      if (args.out) args2.push('-o', path.resolve(args.out));
      return runCapture(process.execPath, args2);
    }
    case 'h4s_pdf': {
      const args2 = [path.join(HERE, 'h4s-pdf.mjs'), abs];
      if (args.out) args2.push('-o', path.resolve(args.out));
      return runCapture(process.execPath, args2);
    }
    case 'h4s_build': {
      const args2 = [path.join(HERE, 'h4s-build.mjs'), abs];
      if (args.subset !== false) args2.push('--subset'); /* 描述承诺"子集化默认开" */
      if (args.share) args2.push('--share');
      return runCapture(process.execPath, args2);
    }
    case 'h4s_slides': {
      const act = String(args.action || '');
      const args2 = [path.join(HERE, 'h4s-slides.mjs'), act, abs];
      if (act === 'insert') {
        if (!args.after || !args.file) return { error: 'insert 需要 after 与 file 参数' };
        args2.push('--after', String(args.after), '--file', path.resolve(args.file));
        if (args.id) args2.push('--id', String(args.id));
      } else if (act === 'move') {
        if (!args.from || !args.to) return { error: 'move 需要 from 与 to 参数' };
        args2.push('--from', String(args.from), '--to', String(args.to));
      } else if (act === 'sync' && args.build !== false) {
        args2.push('--build');
      }
      return runCapture(process.execPath, args2);
    }
    case 'h4s_scaffold': {
      const tmp = path.join(os.tmpdir(), 'scaffold-outline-' + Date.now() + '.md');
      fs.writeFileSync(tmp, String(args.outline || ''), 'utf8');
      const a2 = [path.join(HERE, 'gen-deck.mjs'), '--theme', String(args.theme || 'darktech'),
        '--title', String(args.title || '未命名 deck'), '--outline', tmp];
      if (args.author) a2.push('--author', String(args.author));
      if (args.out) a2.push('-o', path.resolve(args.out));
      return runCapture(process.execPath, a2);
    }
    case 'h4s_review': {
      const tmp = path.join(os.tmpdir(), 'h4s-review-' + Date.now() + '.json');
      const r = runCapture(process.execPath, [path.join(HERE, 'h4s-lint.mjs'), abs, '--json', tmp]);
      let data = null;
      try { data = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp); } catch { }
      if (!data) return { failed: true, output: r.output || 'lint 未产出 JSON' };
      const pageSummary = (data.pages || []).map((p) => ({
        page: p.index, title: p.title, notes: p.notes,
        issues: (p.issues || []).map((it) => it.kind + (it.detail ? '(' + it.detail + ')' : '')),
      }));
      return {
        deck: abs,
        verdict: (data.errors || []).length ? 'FAIL' : 'PASS',
        errors: data.errors || [],
        warnings: data.warnings || [],
        pages: pageSummary,
      };
    }
    case 'h4s_outline': {
      const html = fs.readFileSync(abs, 'utf8');
      const slides = [...html.matchAll(/<h4s-slide[^>]*>|<section[^>]*class="[^"]*slide[^"]*"[^>]*>/g)];
      const titles = [...html.matchAll(/data-h4s-title="([^"]*)"/g)].map(m => m[1]);
      const notes = (html.match(/<h4s-notes/g) || []).length;
      let manifest = {};
      const mm = /<script type="application\/h4s\+json">([\s\S]*?)<\/script>/.exec(html);
      try { manifest = JSON.parse(mm[1]); } catch { }
      return {
        deck: abs,
        pages: slides.length,
        titles,
        notesCount: notes,
        stage: manifest.stage || null,
        autoslide: manifest.defaults ? manifest.defaults.autoslide : null,
        fonts: (manifest.fonts || []).map(f => f.family + (f.file ? ' (' + f.file + ')' : ' (本机)')),
      };
    }
    default:
      return { error: '未知工具: ' + name };
  }
}

function runCapture(cmd, args) {
  try {
    const out = execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000 });
    return { output: out.trim().split('\n').slice(-30).join('\n') };
  } catch (e) {
    const out = (e.stdout || '').toString().trim().split('\n').slice(-30).join('\n');
    return { failed: true, output: out || e.message };
  }
}

/* ---------- MCP stdio 协议 ---------- */
const SERVER = { name: 'html4s', version: '0.1.0' };
let buf = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) > -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    handleMessage(msg);
  }
});

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

function handleMessage(msg) {
  if (msg.id === undefined) return; // 通知，忽略
  const { method, params } = msg;
  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0', id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: SERVER,
        },
      });
    } else if (method === 'tools/list') {
      send({
        jsonrpc: '2.0', id: msg.id,
        result: {
          tools: Object.entries(TOOLS).map(([name, t]) => ({
            name, description: t.description, inputSchema: t.inputSchema,
          })),
        },
      });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      if (!TOOLS[name]) {
        send({ jsonrpc: '2.0', id: msg.id, error: { code: -32602, message: '未知工具: ' + name } });
        return;
      }
      const result = runTool(name, args || {});
      const text = result.error ? ('错误: ' + result.error)
        : result.failed ? ('执行失败:\n' + (result.output || ''))
        : typeof result.output === 'string' ? result.output
        : JSON.stringify(result, null, 2);
      send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text }] } });
    } else if (method === 'ping') {
      send({ jsonrpc: '2.0', id: msg.id, result: {} });
    } else {
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'method not found: ' + method } });
    }
  } catch (e) {
    send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: e.message } });
  }
}

process.stderr.write('[h4s-mcp] ready (stdio)\n');
