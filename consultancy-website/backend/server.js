#!/usr/bin/env node
/**
 * Optional lead-capture server.
 * ---------------------------------------------------------------------------
 * You do NOT need this to launch. The website is static and works on free
 * hosting with a form service (see docs/03-deployment.md). Use this when you
 * want the enquiries to land on your own server instead of a third party's.
 *
 * What it does:
 *   - serves the built site in ../dist
 *   - POST /api/lead   accepts the contact form, validates it, stores it
 *   - GET  /api/leads  returns stored leads as JSON (admin token required)
 *   - GET  /api/leads.csv  same data as CSV, for Excel
 *   - GET  /admin      a small dashboard to read and export leads
 *   - GET  /healthz    for uptime monitoring
 *
 * Zero npm dependencies on purpose: nothing to install, nothing to patch, and
 * no supply-chain surface on a box that holds students' personal data.
 *
 * Run:  ADMIN_TOKEN=some-long-secret node backend/server.js
 */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DIST = path.resolve(__dirname, '..', 'dist');
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.jsonl');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const MAX_BODY = 16 * 1024; // 16 KB is plenty for a contact form

if (!ADMIN_TOKEN) {
  console.warn(
    '\n⚠  ADMIN_TOKEN is not set. /api/leads and /admin will refuse to serve data.\n' +
      '   Start with:  ADMIN_TOKEN="$(openssl rand -hex 24)" node backend/server.js\n'
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/* ---------- rate limiting (in-memory, per IP) ----------------------------- */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // crude memory bound; fine at this scale
  return list.length > MAX_PER_WINDOW;
}

/* ---------- helpers -------------------------------------------------------- */
const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers,
  });
  res.end(body);
};

const json = (res, status, obj, headers = {}) =>
  send(res, status, JSON.stringify(obj), { 'Content-Type': MIME['.json'], ...headers });

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket.remoteAddress ||
  'unknown';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function authorised(req, url) {
  if (!ADMIN_TOKEN) return false;
  const header = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = header || url.searchParams.get('token') || '';
  return token.length > 0 && timingSafeEqual(token, ADMIN_TOKEN);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ---------- validation ----------------------------------------------------- */
// Strip control characters (log/CSV-injection hygiene), trim, cap length.
const clean = (v, max = 500) =>
  typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max) : '';

function validateLead(input) {
  const errors = [];
  const lead = {
    name: clean(input.name, 120),
    phone: clean(input.phone, 20),
    email: clean(input.email, 160),
    city: clean(input.city, 80),
    role: clean(input.role, 80),
    service: clean(input.service, 120),
    message: clean(input.message, 2000),
    consent: input.consent === 'yes' || input.consent === true,
    guardian_consent: input.guardian_consent === 'yes' || input.guardian_consent === true,
    page: clean(input.page, 200),
  };

  if (lead.name.length < 2) errors.push('name');
  const digits = lead.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) errors.push('phone');
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) errors.push('email');
  if (!lead.role) errors.push('role');
  if (!lead.service) errors.push('service');
  if (!lead.consent) errors.push('consent');

  return { lead, errors };
}

/* ---------- storage -------------------------------------------------------- */
async function storeLead(lead) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const record = {
    id: crypto.randomUUID(),
    received_at: new Date().toISOString(),
    ...lead,
  };
  await fsp.appendFile(LEADS_FILE, JSON.stringify(record) + '\n', 'utf8');
  return record;
}

async function readLeads() {
  try {
    const raw = await fsp.readFile(LEADS_FILE, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // newest first
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function toCsv(rows) {
  const cols = [
    'received_at', 'name', 'phone', 'email', 'city', 'role',
    'service', 'message', 'consent', 'guardian_consent', 'page',
  ];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

/* ---------- static files ---------------------------------------------------- */
async function serveStatic(req, res, pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = path.join(DIST, path.normalize(decoded).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(DIST)) return send(res, 403, 'Forbidden');

  for (const candidate of [target, `${target}.html`, path.join(target, 'index.html')]) {
    try {
      const stat = await fsp.stat(candidate);
      if (!stat.isFile()) continue;
      const ext = path.extname(candidate);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(candidate).pipe(res);
      return;
    } catch {
      /* try the next candidate */
    }
  }

  try {
    const notFound = await fsp.readFile(path.join(DIST, '404.html'));
    send(res, 404, notFound, { 'Content-Type': MIME['.html'] });
  } catch {
    send(res, 404, 'Not found', { 'Content-Type': MIME['.txt'] });
  }
}

/* ---------- admin dashboard -------------------------------------------------- */
const ADMIN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Leads · admin</title>
<style>
 :root{--navy:#12224a;--line:#e5e2da;--ink:#16203a}
 *{box-sizing:border-box}
 body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#fbf8f3;color:var(--ink)}
 header{background:var(--navy);color:#fff;padding:1rem 1.5rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
 header h1{font-size:1.1rem;margin:0}
 main{padding:1.5rem;max-width:1400px;margin:0 auto}
 input,button{font:inherit;padding:.55rem .8rem;border-radius:8px;border:1px solid var(--line)}
 button{background:var(--navy);color:#fff;border:0;cursor:pointer}
 button.secondary{background:#fff;color:var(--navy);border:1px solid var(--line)}
 table{width:100%;border-collapse:collapse;background:#fff;font-size:14px}
 th,td{padding:.6rem .7rem;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
 th{background:#e5ebf8;position:sticky;top:0}
 td.msg{max-width:340px;white-space:pre-wrap}
 .wrap{overflow:auto;max-height:75vh;border:1px solid var(--line);border-radius:10px}
 .muted{color:#6f7899}
 .count{margin:.8rem 0}
</style></head>
<body>
<header>
  <h1>📥 Enquiries</h1>
  <input id="token" type="password" placeholder="Admin token" autocomplete="current-password">
  <button id="load">Load</button>
  <button id="csv" class="secondary">Download CSV</button>
  <span id="status" class="muted"></span>
</header>
<main>
  <p class="count muted" id="count"></p>
  <div class="wrap"><table id="tbl">
    <thead><tr><th>Received</th><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>I am a</th><th>Service</th><th>Message</th><th>Minor?</th></tr></thead>
    <tbody></tbody>
  </table></div>
</main>
<script>
 const $ = (s) => document.querySelector(s);
 const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const saved = sessionStorage.getItem('lead_token');
 if (saved) $('#token').value = saved;

 async function load() {
   const token = $('#token').value.trim();
   if (!token) return ($('#status').textContent = 'Enter the admin token.');
   sessionStorage.setItem('lead_token', token);
   $('#status').textContent = 'Loading…';
   const res = await fetch('/api/leads', { headers: { Authorization: 'Bearer ' + token } });
   if (!res.ok) { $('#status').textContent = res.status === 401 ? 'Wrong token.' : 'Error ' + res.status; return; }
   const { leads } = await res.json();
   $('#status').textContent = '';
   $('#count').textContent = leads.length + ' enquir' + (leads.length === 1 ? 'y' : 'ies') + ', newest first';
   $('#tbl tbody').innerHTML = leads.map(l => \`<tr>
     <td>\${esc(new Date(l.received_at).toLocaleString('en-IN'))}</td>
     <td>\${esc(l.name)}</td>
     <td><a href="tel:\${esc(l.phone)}">\${esc(l.phone)}</a></td>
     <td>\${l.email ? '<a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>' : ''}</td>
     <td>\${esc(l.city)}</td><td>\${esc(l.role)}</td><td>\${esc(l.service)}</td>
     <td class="msg">\${esc(l.message)}</td>
     <td>\${l.guardian_consent ? 'yes' : ''}</td></tr>\`).join('');
 }
 $('#load').addEventListener('click', load);
 $('#token').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
 $('#csv').addEventListener('click', () => {
   const token = $('#token').value.trim();
   if (token) location.href = '/api/leads.csv?token=' + encodeURIComponent(token);
 });
 if (saved) load();
</script>
</body></html>`;

/* ---------- router ---------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  if (ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (pathname === '/healthz') return json(res, 200, { ok: true, uptime: process.uptime() });

  if (pathname === '/api/lead' && req.method === 'POST') {
    const ip = clientIp(req);
    if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'Too many requests. Please try again later.' });

    let payload;
    try {
      payload = JSON.parse(await readBody(req) || '{}');
    } catch {
      return json(res, 400, { ok: false, error: 'Invalid JSON' });
    }

    // Honeypot: a filled "website" field means a bot. Answer 200 so it
    // stops retrying, but store nothing.
    if (clean(payload.website)) return json(res, 200, { ok: true });

    const { lead, errors } = validateLead(payload);
    if (errors.length) return json(res, 422, { ok: false, error: 'Invalid fields', fields: errors });

    try {
      const record = await storeLead(lead);
      console.log(`[lead] ${record.received_at} ${record.name} ${record.phone} — ${record.service}`);
      return json(res, 201, { ok: true, id: record.id });
    } catch (err) {
      console.error('[lead] store failed:', err.message);
      return json(res, 500, { ok: false, error: 'Could not save. Please call or WhatsApp us.' });
    }
  }

  if (pathname === '/api/leads' || pathname === '/api/leads.csv') {
    if (!authorised(req, url)) {
      return json(res, 401, { ok: false, error: 'Unauthorised' }, { 'Cache-Control': 'no-store' });
    }
    const leads = await readLeads();
    if (pathname.endsWith('.csv')) {
      return send(res, 200, toCsv(leads), {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      });
    }
    return json(res, 200, { ok: true, count: leads.length, leads }, { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    return send(res, 200, ADMIN_HTML, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  return serveStatic(req, res, pathname === '/' ? '/index.html' : pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 ${new Date().toISOString()}  serving ${DIST}`);
  console.log(`   site   http://localhost:${PORT}/`);
  console.log(`   admin  http://localhost:${PORT}/admin`);
  console.log(`   leads  ${LEADS_FILE}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
