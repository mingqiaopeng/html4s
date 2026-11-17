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
      if (args.subset === false) args2.push('--no-subset-marker');
      return runCapture(process.execPath, args2);
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
