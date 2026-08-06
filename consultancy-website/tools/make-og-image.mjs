#!/usr/bin/env node
/**
 * Renders src/assets/img/og-cover.svg into a real 1200x630 PNG.
 *   node tools/make-og-image.mjs
 *
 * WhatsApp, LinkedIn and X will not render an SVG social preview, so the
 * share card has to be a raster image. Run this after you edit the SVG (for
 * example when you change the brand name on it).
 *
 * Requires Chrome or Chromium on the machine. If you don't have one, open the
 * SVG in any browser, screenshot it at 1200x630, and save it over
 * src/assets/img/og-cover.png — the result is identical.
 */
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVG = path.join(ROOT, 'src', 'assets', 'img', 'og-cover.svg');
const OUT = path.join(ROOT, 'src', 'assets', 'img', 'og-cover.png');
const W = 1200;
const H = 630;

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

async function findChrome() {
  for (const candidate of CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

/** Decode a PNG, keep the top `height` rows, re-encode. Chrome's viewport is
 *  taller than the image, so the screenshot needs trimming. */
function cropPngHeight(buffer, height) {
  const chunks = [];
  let pos = 8;
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    chunks.push({ type: buffer.subarray(pos + 4, pos + 8).toString('latin1'), data: buffer.subarray(pos + 8, pos + 8 + len) });
    pos += 12 + len;
  }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const depth = ihdr[8];
  const colour = ihdr[9];
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colour];
  const bpp = (channels * depth) / 8;
  const stride = width * bpp;

  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));

  // Undo the per-scanline filters.
  const out = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  let i = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[i++];
    const line = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 255;
      else if (filter === 2) line[x] = (line[x] + b) & 255;
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    line.copy(out, y * stride);
    prev = line;
  }

  // Re-encode with filter 0 on every row.
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (stride + 1)] = 0;
    out.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, data) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(body) >>> 0 : crc32(body) >>> 0);
    return Buffer.concat([head, body, crc]);
  };

  const newIhdr = Buffer.from(ihdr);
  newIhdr.writeUInt32BE(height, 4);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', newIhdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Node < 22.15 has no zlib.crc32; this is the standard PNG CRC.
let TABLE;
function crc32(buf) {
  if (!TABLE) {
    TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

const chrome = await findChrome();
if (!chrome) {
  console.error('❌ No Chrome/Chromium found. Set CHROME_PATH, or screenshot the SVG by hand.');
  process.exit(1);
}

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'og-'));
const shot = path.join(tmp, 'shot.png');

// The viewport is taller than the image because Chrome reserves some chrome
// even in headless mode; we crop the extra rows off afterwards.
const result = spawnSync(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${Math.round(H * 1.155)}`,
    `--screenshot=${shot}`,
    `file://${SVG}`,
  ],
  { encoding: 'utf8' }
);
if (result.error) throw result.error;

const raw = await fs.readFile(shot);
await fs.writeFile(OUT, cropPngHeight(raw, H));
await fs.rm(tmp, { recursive: true, force: true });

console.log(`✅ Wrote ${path.relative(ROOT, OUT)} (${W}×${H})`);
