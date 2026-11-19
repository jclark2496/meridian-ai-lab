#!/usr/bin/env node
'use strict';
const http = require('http');
const PORT = Number(process.env.PORT || 8080);
const KEYS = {
  openai: 'canary-meridian-openai-sk-proj-demoONLY',
  anthropic: 'canary-meridian-anthropic-sk-ant-demoONLY',
  vendor: 'canary-meridian-vendor-api-key-demoONLY',
  stripe: 'canary-meridian-stripe-sk_test_demoONLY'
};
const ORDERS = [
  { id: 'MO-10041', customer: 'alex.rivera@example.com', item: 'Meridian 2P', total: 329 },
  { id: 'MO-10042', customer: 'sam.chen@example.com', item: 'Range Shell', total: 268 },
  { id: 'MO-10043', customer: 'jordan.lee@example.com', item: 'Field Pack 32', total: 178 }
];
function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body, null, 2));
}
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/healthz') return send(res, 200, { ok: true });
  if (u.pathname === '/api/keys') return send(res, 200, { note: 'DEMO ONLY — canary keys', keys: KEYS });
  if (u.pathname === '/api/orders') return send(res, 200, { orders: ORDERS });
  if (u.pathname === '/api/customers') return send(res, 200, { customers: ORDERS.map(o => ({ email: o.customer, order: o.id })) });
  if (u.pathname === '/.env') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(Object.entries(KEYS).map(([k,v]) => `${k.toUpperCase()}_API_KEY=${v}`).join('\n') + '\n'); }
  send(res, 404, { error: 'not found', try: ['/api/keys', '/api/orders', '/api/customers', '/.env', '/healthz'] });
}).listen(PORT, '0.0.0.0', () => console.log('fake-api on', PORT));
