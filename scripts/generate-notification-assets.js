#!/usr/bin/env node
/**
 * generate-notification-assets.js
 *
 * Generates two custom notification sounds and a white bell notification icon.
 * Run once: node scripts/generate-notification-assets.js
 *
 * Output:
 *   assets/sounds/absence_alert.wav       — urgent triple beep (absence)
 *   assets/sounds/low_performance_alert.wav — soft descending chime (low score)
 *   assets/notification-icon.png          — white bell on transparent bg (96x96)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const SOUNDS_DIR = path.join(ROOT, 'assets', 'sounds');

fs.mkdirSync(SOUNDS_DIR, { recursive: true });

// ─── WAV helpers ─────────────────────────────────────────────────────────────

const SAMPLE_RATE = 22050;

function buildWav(samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.allocUnsafe(44 + dataLen);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits/sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
    buf.writeInt16LE(v, 44 + i * 2);
  }
  return buf;
}

function sineTone(freq, durationSec, amp, fadeInMs = 8, fadeOutMs = 30) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const arr = new Float64Array(n);
  const fi = Math.floor(SAMPLE_RATE * fadeInMs / 1000);
  const fo = Math.floor(SAMPLE_RATE * fadeOutMs / 1000);
  for (let i = 0; i < n; i++) {
    let env = amp;
    if (i < fi)
      env *= i / fi;
    if (i > n - fo - 1)
      env *= (n - 1 - i) / fo;
    arr[i] = env * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
  }
  return arr;
}

function harmonicTone(freq, durationSec, amp, fadeInMs = 8, fadeOutMs = 30) {
  // Richer tone: fundamental + 2nd + 3rd harmonic
  const f1 = sineTone(freq, durationSec, amp * 0.65, fadeInMs, fadeOutMs);
  const f2 = sineTone(freq * 2, durationSec, amp * 0.25, fadeInMs, fadeOutMs);
  const f3 = sineTone(freq * 2.5, durationSec, amp * 0.10, fadeInMs, fadeOutMs);
  const out = new Float64Array(f1.length);
  for (let i = 0; i < out.length; i++) out[i] = f1[i] + f2[i] + f3[i];
  return out;
}

function silence(durationSec) {
  return new Float64Array(Math.floor(SAMPLE_RATE * durationSec));
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Float64Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

// ─── Sound 1: absence_alert ───────────────────────────────────────────────────
// Urgent triple beep — 880 Hz with harmonics, short and punchy
function generateAbsenceAlert() {
  const beep = harmonicTone(880, 0.13, 0.82, 4, 18);
  const gap = silence(0.07);
  return concat(beep, gap, beep, gap, beep);
}

// ─── Sound 2: low_performance_alert ──────────────────────────────────────────
// Soft descending two-tone chime — E5 → C5, like a gentle warning bell
function generateLowPerformanceAlert() {
  const tone1 = harmonicTone(659.26, 0.28, 0.68, 12, 60); // E5
  const bridge = silence(0.07);
  const tone2 = harmonicTone(523.25, 0.42, 0.58, 12, 110); // C5 - longer decay
  return concat(tone1, bridge, tone2);
}

fs.writeFileSync(
  path.join(SOUNDS_DIR, 'absence_alert.wav'),
  buildWav(generateAbsenceAlert()),
);
console.log('✓  assets/sounds/absence_alert.wav');

fs.writeFileSync(
  path.join(SOUNDS_DIR, 'low_performance_alert.wav'),
  buildWav(generateLowPerformanceAlert()),
);
console.log('✓  assets/sounds/low_performance_alert.wav');

// ─── PNG helpers ─────────────────────────────────────────────────────────────

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePng(width, height, rgbaPixels) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data with PNG filter byte (0 = None) prepended per row
  const rawRows = Buffer.allocUnsafe(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawRows[y * (1 + width * 4)] = 0; // filter type None
    rgbaPixels.copy(rawRows, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idat = zlib.deflateSync(rawRows, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Bell icon (96×96) ───────────────────────────────────────────────────────

function generateBellIcon() {
  const W = 96; const H = 96;
  const px = Buffer.alloc(W * H * 4, 0); // all transparent

  function setPixel(x, y, alpha) {
    if (x < 0 || x >= W || y < 0 || y >= H)
      return;
    const i = (y * W + x) * 4;
    const a = Math.round(alpha * 255);
    if (px[i + 3] >= a)
      return;
    px[i] = px[i + 1] = px[i + 2] = 255;
    px[i + 3] = a;
  }

  // Anti-aliased filled circle
  function fillCircle(cx, cy, r) {
    for (let y = Math.ceil(cy - r - 1); y <= cy + r + 1; y++) {
      for (let x = Math.ceil(cx - r - 1); x <= cx + r + 1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < r - 0.5)
          setPixel(x, y, 1.0);
        else if (d < r + 0.5)
          setPixel(x, y, r + 0.5 - d);
      }
    }
  }

  // Anti-aliased filled rectangle
  function fillRect(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++)
        setPixel(x, y, 1.0);
    }
  }

  // Anti-aliased horizontal scan trapezoid (bell body)
  function fillTrap(yTop, yBot, halfWTop, halfWBot, cx) {
    for (let y = yTop; y <= yBot; y++) {
      const t = yBot === yTop ? 0 : (y - yTop) / (yBot - yTop);
      const halfW = halfWTop + (halfWBot - halfWTop) * t;
      for (let x = Math.floor(cx - halfW - 1); x <= cx + halfW + 1; x++) {
        const dx = Math.abs(x - cx);
        if (dx < halfW - 0.5)
          setPixel(x, y, 1.0);
        else if (dx < halfW + 0.5)
          setPixel(x, y, halfW + 0.5 - dx);
      }
    }
  }

  const cx = 48;

  // 1. Hook / mounting ring at the top
  fillRect(44, 12, 52, 19);
  fillCircle(48, 20, 5.5);
  // Hollow out the hook center
  for (let y = 16; y <= 22; y++) {
    for (let x = 44; x <= 52; x++) {
      const i = (y * W + x) * 4;
      px[i + 3] = 0;
    }
  }

  // 2. Bell dome — semicircle, center (48, 45), radius 24
  for (let y = 20; y <= 45; y++) {
    for (let x = 14; x <= 82; x++) {
      const d = Math.hypot(x - cx, y - 45);
      if (d < 24 - 0.5)
        setPixel(x, y, 1.0);
      else if (d < 24 + 0.5)
        setPixel(x, y, 24 + 0.5 - d);
    }
  }

  // 3. Bell body (widens from dome to flare)
  fillTrap(44, 66, 24, 33, cx);

  // 4. Flare rim at the bottom
  fillTrap(65, 72, 33, 36, cx);

  // 5. Bottom arc of rim (rounded bottom)
  for (let y = 68; y <= 78; y++) {
    for (let x = 10; x <= 86; x++) {
      const dx = Math.abs(x - cx);
      const dy = y - 68;
      // Keep only the outer rim strip (not the hollow)
      if (dx > 28 && dy >= 0) {
        const d = Math.hypot(x - cx, y - 68);
        if (d < 38 - 0.5)
          setPixel(x, y, 1.0);
        else if (d < 38 + 0.5)
          setPixel(x, y, 38 + 0.5 - d);
      }
    }
  }

  // Solid bottom fill (between dome walls)
  fillTrap(66, 74, 30, 36, cx);

  // 6. Clapper — small circle hanging at the bottom center
  fillCircle(cx, 80, 5.5);

  return px;
}

const iconPixels = generateBellIcon();
const iconPng = encodePng(96, 96, iconPixels);
fs.writeFileSync(path.join(ROOT, 'assets', 'notification-icon.png'), iconPng);
console.log('✓  assets/notification-icon.png');
console.log('\nAll notification assets generated successfully!');
