// Tiny software rasterizer: every sprite is painted pixel by pixel into an
// ImageData buffer, so edges stay hard (no canvas anti-aliasing) and the whole
// game is real pixel art without shipping a single image file.

export const TW = 32, TH = 16;           // isometric tile size in pixels

export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function shade(col, k) {           // k<1 darker, k>1 lighter
  const r = col & 255, g = (col >> 8) & 255, b = (col >> 16) & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k)));
  return ((255 << 24) | (f(b) << 16) | (f(g) << 8) | f(r)) >>> 0;
}

// Deterministic hash noise so the map looks the same on every load.
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// World-space iso projection (pixels, before camera offset).
export function iso(x, y, z = 0) {
  return [(x - y) * (TW / 2), (x + y) * (TH / 2) - z];
}

export class Pix {
  // ox/oy: world-pixel coordinate of this buffer's top-left corner, so callers
  // can draw in world coordinates and the sprite lands at (ox, oy).
  constructor(w, h, ox = 0, oy = 0) {
    this.w = Math.ceil(w); this.h = Math.ceil(h);
    this.ox = Math.floor(ox); this.oy = Math.floor(oy);
    this.d = new Uint32Array(this.w * this.h);
  }
  set(x, y, c) {
    x = Math.floor(x) - this.ox; y = Math.floor(y) - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) {
    x = Math.floor(x) - this.ox; y = Math.floor(y) - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // Scanline polygon fill, sampling pixel centres. `fn(x,y)` may return a
  // colour per pixel (for texture/dither) instead of a flat colour.
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc))
          xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x < Math.ceil(xs[k + 1] - 0.5); x++)
          this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  disc(cx, cy, r, c, sy = 1) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (x * x + (y * y) / (sy * sy) <= r * r + r * 0.8)
        this.set(cx + x, cy + y * 1, typeof c === 'function' ? c(x, y) : c);
  }
  // Draw a pixel-map: array of strings, palette maps char -> colour.
  map(rows, pal, x, y, flip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[flip ? row.length - 1 - i : i];
        if (ch !== '.' && pal[ch] !== undefined) this.set(x + i, y + j, pal[ch]);
      }
    });
  }
  canvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
  // Mask of only the pixels matching a predicate (used for glowing windows).
  filter(pred, col) {
    const p = new Pix(this.w, this.h, this.ox, this.oy);
    for (let i = 0; i < this.d.length; i++) if (pred(this.d[i])) p.d[i] = col;
    return p;
  }
}
