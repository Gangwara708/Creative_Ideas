#!/usr/bin/env node
/**
 * Pre-deploy checker for dist/.
 *   node tools/check.mjs
 *
 * Catches the mistakes that are embarrassing in public: broken internal links,
 * missing images, duplicate or over-long <title>s, missing alt text, and any
 * placeholder that was never filled in. Exits non-zero if anything is broken,
 * so it can gate a deploy.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const errors = [];
const warnings = [];

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

async function main() {
  if (!(await exists(DIST))) {
    console.error('❌ dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = await walk(DIST);
  const pages = files.filter((f) => f.endsWith('.html'));
  const titles = new Map();

  for (const rel of pages) {
    const html = await fs.readFile(path.join(DIST, rel), 'utf8');
    const dir = path.dirname(path.join(DIST, rel));
    const where = (msg) => `${rel}: ${msg}`;

    // --- title / description ---
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
    const desc = html.match(/<meta name="description" content="([\s\S]*?)">/)?.[1]?.trim();

    if (!title) errors.push(where('missing <title>'));
    else {
      if (title.length > 65) warnings.push(where(`title is ${title.length} chars (Google truncates ~60)`));
      if (titles.has(title)) errors.push(where(`duplicate title, also used by ${titles.get(title)}`));
      titles.set(title, rel);
    }
    if (!desc) errors.push(where('missing meta description'));
    else if (desc.length > 165) warnings.push(where(`meta description is ${desc.length} chars (aim < 160)`));

    // --- exactly one h1 ---
    const h1s = html.match(/<h1[\s>]/g) || [];
    if (h1s.length !== 1) errors.push(where(`expected exactly 1 <h1>, found ${h1s.length}`));

    // --- unresolved template tokens ---
    if (/\{\{|\}\}/.test(html)) errors.push(where('unresolved template token ({{ }}) in output'));

    // --- images have alt attributes ---
    for (const tag of html.match(/<img\b[^>]*>/g) || []) {
      if (!/\balt=/.test(tag)) errors.push(where(`<img> without alt: ${tag.slice(0, 70)}…`));
    }

    // --- internal links resolve ---
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
      const clean = href.split('#')[0].split('?')[0];
      if (!clean) continue;
      // Root-relative links only resolve once deployed at the domain root.
      const target = clean.startsWith('/')
        ? path.join(DIST, clean)
        : path.resolve(dir, clean);
      if (!(await exists(target))) errors.push(where(`broken link → ${href}`));
    }
  }

  // --- placeholder sweep: things that must be replaced before launch ---
  const config = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
  const placeholders = [
    ['site.url', config.url, 'https://www.example.com'],
    ['contact.phone', config.contact.phone, '+91 90000 00000'],
    ['contact.email', config.contact.email, 'hello@example.com'],
    ['founder.name', config.founder.name, 'Founder Name'],
  ];
  for (const [key, value, placeholder] of placeholders) {
    if (value === placeholder) warnings.push(`site.config.json: "${key}" is still the placeholder value`);
  }
  if (!config.forms.endpoint) {
    warnings.push('site.config.json: forms.endpoint is empty — the contact form will fall back to WhatsApp');
  }

  // --- required files ---
  for (const required of ['sitemap.xml', 'robots.txt', '404.html', 'site.webmanifest']) {
    if (!files.includes(required)) errors.push(`missing required file: ${required}`);
  }

  console.log(`\nChecked ${pages.length} pages, ${files.length} files.\n`);
  if (warnings.length) {
    console.log(`⚠  ${warnings.length} warning(s) — fine for a preview, fix before launch:`);
    warnings.forEach((w) => console.log(`   • ${w}`));
    console.log('');
  }
  if (errors.length) {
    console.log(`❌ ${errors.length} error(s):`);
    errors.forEach((e) => console.log(`   • ${e}`));
    console.log('');
    process.exit(1);
  }
  console.log('✅ No broken links or structural errors.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
