#!/usr/bin/env python
"""html4s 开发服务器：no-cache 头 + .html4s 按 text/html 提供。
用法: python tools/serve.py [端口]  （默认 8899，服务当前目录）
替代 python -m http.server——普通 http.server 会缓存旧页面，
且 .html4s 被当 octet-stream 下载，开发时无法在浏览器直接预览。
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8899

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.html4s': 'text/html; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.mjs': 'text/javascript',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Handler) as httpd:
    print(f'html4s dev server: http://127.0.0.1:{PORT}/  (no-cache)', file=sys.stderr)
    httpd.serve_forever()
