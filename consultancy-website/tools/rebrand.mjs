#!/usr/bin/env node
/**
 * Renames the business everywhere in one command.
 *
 *   node tools/rebrand.mjs "Sankalp Career Guidance" "Sankalp"
 *
 * site.config.json already drives the header, footer, contact blocks and legal
 * pages. This script covers the places a config value cannot reach: page
 * <title> tags, meta descriptions, the social share image and body copy that
 * names the business.
 *
 * It prints a summary and asks for nothing — run it once, check `git diff`,
 * then `npm run check`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const [newFull, newShort] = process.argv.slice(2);
if (!newFull) {
  console.error(`
Usage:  node tools/rebrand.mjs "<New Full Name>" ["<ShortName>"]

Example:
  node tools/rebrand.mjs "Sankalp Career Guidance" "Sankalp"
`);
  process.exit(1);
}

const OLD_FULL = 'Disha Consultancy';
const OLD_SHORT = 'Disha';
const short = newShort || newFull.split(' ')[0];

const TARGET_DIRS = ['src'];
const TARGET_FILES = ['site.config.json', 'README.md'];
const EXTENSIONS = new Set(['.html', '.json', '.svg', '.md', '.css', '.js', '.webmanifest']);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = [];
for (const dir of TARGET_DIRS) files.push(...(await walk(path.join(ROOT, dir))));
for (const file of TARGET_FILES) files.push(path.join(ROOT, file));

let changed = 0;
let replacements = 0;

for (const file of files) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch {
    continue;
  }

  const before = text;
  // Longest match first, so "Disha Consultancy" never becomes "<Short> Consultancy".
  text = text.split(OLD_FULL).join(newFull);
  // Then the standalone short name, respecting word boundaries.
  text = text.replace(new RegExp(`\\b${OLD_SHORT}\\b`, 'g'), short);

  if (text !== before) {
    const count =
      before.split(OLD_FULL).length - 1 + (before.match(new RegExp(`\\b${OLD_SHORT}\\b`, 'g')) || []).length;
    await fs.writeFile(file, text);
    console.log(`  ✎ ${path.relative(ROOT, file)} (${count})`);
    changed++;
    replacements += count;
  }
}

console.log(`
✅ Renamed to "${newFull}" (short: "${short}")
   ${replacements} replacements across ${changed} files.

Next:
   1. Check the brand mark in src/assets/img/*.svg — the compass icon is generic,
      but swap it for a real logo if you have one.
   2. npm run og      (regenerates the social share image with the new name)
   3. npm run check   (rebuilds and verifies every link)
`);
