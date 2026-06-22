// tools/gen-icons.mjs — generates simple baseball-style PNG icons, no dependencies.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function png(size) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const o = 1 + x * 4;
      if (dist <= r) {
        // white baseball
        row[o] = 255; row[o + 1] = 255; row[o + 2] = 255; row[o + 3] = 255;
        // red seams near left/right edges
        if (dist > r * 0.74 && Math.abs(dx) > r * 0.5) {
          row[o] = 200; row[o + 1] = 30; row[o + 2] = 30;
        }
      } else {
        // navy background
        row[o] = 11; row[o + 1] = 42; row[o + 2] = 74; row[o + 3] = 255;
      }
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const dir = fileURLToPath(new URL('../icons/', import.meta.url));
mkdirSync(dir, { recursive: true });
for (const s of [180, 192, 512]) {
  writeFileSync(new URL(`../icons/icon-${s}.png`, import.meta.url), png(s));
}
console.log('icons generated: 180, 192, 512');
