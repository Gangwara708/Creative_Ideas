#!/usr/bin/env node
/**
 * Zero-dependency static site builder.
 *
 *   node tools/build.mjs        -> builds src/ into dist/
 *
 * Why a build step at all? So the header, footer, contact details and brand
 * name live in exactly one place. Change site.config.json, rebuild, and all
 * 25+ pages update together. The output in dist/ is plain HTML/CSS/JS that
 * any host on earth can serve — no runtime, no framework, no lock-in.
 *
 * Template syntax (deliberately tiny):
 *   {{ site.brand }}      value lookup, HTML-escaped
 *   {{& site.rawHtml }}   value lookup, NOT escaped
 *   {{> header }}         include src/partials/header.html
 *   {{{ content }}}       the page body (layout only)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const read = (p) => fs.readFile(p, 'utf8');

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Resolve "site.contact.phone" against the context object. */
function lookup(ctx, expr) {
  return expr
    .trim()
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), ctx);
}

async function renderPartial(name, ctx, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Partial loop detected at "${name}"`);
  seen.add(name);
  const file = path.join(SRC, 'partials', `${name.trim()}.html`);
  let html;
  try {
    html = await read(file);
  } catch {
    throw new Error(`Missing partial: src/partials/${name.trim()}.html`);
  }
  return render(html, ctx, seen);
}

async function render(tpl, ctx, seen = new Set()) {
  // Partials first (they may themselves contain variables and partials).
  const partialRe = /\{\{>\s*([\w-]+)\s*\}\}/g;
  const names = [...tpl.matchAll(partialRe)].map((m) => m[1]);
  for (const name of new Set(names)) {
    const rendered = await renderPartial(name, ctx, new Set(seen));
    tpl = tpl.replaceAll(new RegExp(`\\{\\{>\\s*${name}\\s*\\}\\}`, 'g'), () => rendered);
  }

  // Raw (unescaped) values, then escaped values.
  tpl = tpl.replace(/\{\{&\s*([\w.]+)\s*\}\}/g, (_, expr) => {
    const v = lookup(ctx, expr);
    return v == null ? '' : String(v);
  });

  tpl = tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, expr) => {
    if (expr === 'content') return whole; // handled by the layout pass
    const v = lookup(ctx, expr);
    if (v == null) {
      warnings.push(`Unknown template value: {{ ${expr} }}`);
      return '';
    }
    return escapeHtml(v);
  });

  return tpl;
}

const warnings = [];

/** Pull the leading `<!-- { ...json... } -->` block off a page file. */
function parseMeta(raw, relPath) {
  const m = raw.match(/^\s*<!--\s*(\{[\s\S]*?\})\s*-->/);
  if (!m) throw new Error(`${relPath}: missing metadata comment at top of file`);
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (err) {
    throw new Error(`${relPath}: metadata is not valid JSON — ${err.message}`);
  }
  return { meta, body: raw.slice(m[0].length) };
}

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dest);
    // Notes-to-self in the asset folders are for developers, not visitors.
    else if (entry.name !== 'README.md') await fs.copyFile(src, dest);
  }
}

function buildNav(root) {
  // Kept here so header/footer/sitemap never drift apart.
  return [
    { label: 'Home', href: `${root}index.html`, match: 'home' },
    { label: 'Services', href: `${root}services.html`, match: 'services' },
    { label: 'Pricing', href: `${root}pricing.html`, match: 'pricing' },
    { label: 'About', href: `${root}about.html`, match: 'about' },
    { label: 'Insights', href: `${root}blog/index.html`, match: 'blog' },
    { label: 'FAQ', href: `${root}faq.html`, match: 'faq' },
  ];
}

async function main() {
  const site = JSON.parse(await read(path.join(ROOT, 'site.config.json')));
  site.year = new Date().getFullYear();
  site.contact.fullAddress = [
    site.contact.addressLine,
    site.contact.city,
    `${site.contact.state} ${site.contact.postalCode}`,
  ]
    .filter(Boolean)
    .join(', ');
  site.contact.whatsappHref = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(
    `Hi ${site.brand}, I would like to book a free discovery call.`
  )}`;

  // Only emit the analytics snippet when an ID is configured — an empty ID
  // means no third-party script and no cookie-consent obligation.
  site.analyticsHtml = site.analytics.ga4Id
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.analytics.ga4Id}"></script>\n` +
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
      `gtag('js',new Date());gtag('config','${site.analytics.ga4Id}');</script>`
    : '<!-- analytics disabled: set analytics.ga4Id in site.config.json -->';

  const layout = await read(path.join(SRC, 'layouts', 'base.html'));
  const pagesDir = path.join(SRC, 'pages');
  const pageFiles = (await walk(pagesDir)).filter((f) => f.endsWith('.html')).sort();

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  const built = [];

  for (const rel of pageFiles) {
    const raw = await read(path.join(pagesDir, rel));
    const { meta, body } = parseMeta(raw, rel);

    const depth = rel.split(path.sep).length - 1;
    const root = depth === 0 ? '' : '../'.repeat(depth);
    const urlPath = rel.split(path.sep).join('/');

    const jsonSafe = (s) => JSON.stringify(String(s ?? '')).slice(1, -1);

    const page = {
      ...meta,
      root,
      // Canonical for the homepage is the bare domain, not /index.html.
      url:
        urlPath === 'index.html'
          ? `${site.url.replace(/\/$/, '')}/`
          : `${site.url.replace(/\/$/, '')}/${urlPath}`,
      jsonTitle: jsonSafe(meta.title),
      jsonDescription: jsonSafe(meta.description),
      path: urlPath,
      ogImage: `${site.url.replace(/\/$/, '')}/assets/img/og-cover.png`,
      noindex: meta.noindex ? 'noindex, nofollow' : 'index, follow',
    };

    const ctx = { site, page, nav: buildNav(root) };

    // Nav is data, but the template language is intentionally loop-free:
    // render it here and hand the header a ready-made HTML string.
    ctx.navHtml = buildNav(root)
      .map(
        (i) =>
          `<li><a class="nav__link" data-nav="${i.match}" href="${i.href}">${escapeHtml(i.label)}</a></li>`
      )
      .join('\n          ');

    const renderedBody = await render(body, ctx);
    const shell = await render(layout, ctx);
    let html = shell.replace('{{{ content }}}', () => renderedBody);

    if (html.includes('{{{ content }}}')) {
      throw new Error('Layout must contain exactly one {{{ content }}} slot');
    }

    const outPath = path.join(DIST, rel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html);
    built.push({ ...page, meta });
  }

  // Assets + root-level static files (robots.txt, favicon, manifest…).
  await copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  await copyDir(path.join(SRC, 'static'), DIST);

  // sitemap.xml, generated from what actually got built.
  const base = site.url.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const urls = built
    .filter((p) => !p.meta.noindex)
    .map((p) => {
      const loc = p.path === 'index.html' ? `${base}/` : `${base}/${p.path}`;
      const priority = p.path === 'index.html' ? '1.0' : p.path.includes('/') ? '0.6' : '0.8';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  await fs.writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );

  await fs.writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
  );

  const unique = [...new Set(warnings)];
  if (unique.length) {
    console.warn('\n⚠  Template warnings:');
    unique.forEach((w) => console.warn(`   - ${w}`));
  }
  console.log(`\n✅ Built ${built.length} pages -> dist/`);
  console.log(`   Preview with: npm run dev   (http://localhost:8080)\n`);
}

main().catch((err) => {
  console.error(`\n❌ Build failed: ${err.message}\n`);
  process.exit(1);
});
