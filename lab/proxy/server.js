#!/usr/bin/env node
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = process.env.SITE_ROOT || path.join(__dirname, '../../site');
const PORT = Number(process.env.PORT || 8780);
const HOST = process.env.HOST || '127.0.0.1';
const CHAT = process.env.CHAT_URL || 'http://127.0.0.1:8781';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json', '.map':'application/json', '.env':'text/plain', '.txt':'text/plain', '.woff2':'font/woff2' };
function send(res, code, body, headers = {}) {
  res.writeHead(code, headers); res.end(body);
}
function serveStatic(req, res) {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(path.resolve(ROOT) + path.sep) && file !== path.resolve(ROOT)) return send(res, 403, 'forbidden');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'not found');
  const ext = path.extname(file).toLowerCase();
  send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
}
async function proxyChat(req, res) {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  try {
    const r = await fetch(CHAT + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const text = await r.text();
    send(res, r.status, text, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
  } catch (e) { send(res, 502, JSON.stringify({ error: 'chat upstream: ' + e.message }), { 'Content-Type': 'application/json' }); }
}
http.createServer((req, res) => {
  if (req.method === 'OPTIONS' && req.url.startsWith('/api/chat')) {
    return send(res, 204, '', { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
  }
  if (req.url === '/healthz') return send(res, 200, '{"ok":true}', { 'Content-Type': 'application/json' });
  if (req.url.startsWith('/api/chat') && (req.method === 'POST' || req.method === 'GET')) return proxyChat(req, res);
  serveStatic(req, res);
}).listen(PORT, HOST, () => console.log(`meridian-proxy ${HOST}:${PORT} root=${ROOT} chat=${CHAT}`));
