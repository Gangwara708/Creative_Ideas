#!/usr/bin/env node
/**
 * Tiny preview server for dist/. Rebuilds automatically when src/ changes.
 *   node tools/serve.mjs [port]
 */
import { createServer } from 'node:http';
import { promises as fs, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
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

let building = false;
function build() {
  if (building) return;
  building = true;
  const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'build.mjs')], {
    stdio: 'inherit',
  });
  child.on('exit', () => {
    building = false;
  });
}

async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  // Block traversal outside dist/.
  const target = path.join(DIST, path.normalize(clean).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(DIST)) return null;

  const candidates = [target, `${target}.html`, path.join(target, 'index.html')];
  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url === '/' ? '/index.html' : req.url);
  if (!file) {
    const notFound = path.join(DIST, '404.html');
    try {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(await fs.readFile(notFound));
    } catch {
      res.writeHead(404).end('Not found');
    }
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(await fs.readFile(file));
});

build();
for (const dir of ['src', 'site.config.json']) {
  const target = path.join(ROOT, dir);
  try {
    watch(target, { recursive: true }, () => build());
  } catch {
    /* watching is best-effort */
  }
}

server.listen(PORT, () => {
  console.log(`\n🌐 Preview running at http://localhost:${PORT}  (watching src/)\n`);
});
