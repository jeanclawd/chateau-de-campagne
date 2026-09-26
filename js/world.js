// The estate: tile map, ground painting, buildings, trees and props.
// Layout loosely follows the illustrated map of Villiers-le-Mahieu: the
// moated château on its island, La Ferme's U of farm buildings, La Grange,
// the Cottage, the pond, tennis courts, outdoor pool and the tree-lined avenue.

import { Pix, rgb, shade, hash, mulberry, iso, TW, TH } from './pix.js';

export const W = 60, H = 54;

// Tile codes
// g grass  l lawn  m golf meadow  p path  t trail  y courtyard paving
// w water  o pool water  d pool deck  f field  F forest  c tennis court
// s sand  k parking  b bridge
const WALK = new Set(['g', 'l', 'm', 'p', 't', 'y', 'd', 'f', 'c', 's', 'k', 'b']);

export const C = {
  grass: rgb('#9cc47a'), grassD: rgb('#86b066'), grassL: rgb('#b5d68f'),
  lawn: rgb('#a7d07f'), lawn2: rgb('#98c472'),
  path: rgb('#e8d6a6'), pathD: rgb('#d3bd88'), pathE: rgb('#c2a974'),
  trail: rgb('#c9ad78'),
  pave: rgb('#dcd2ba'), paveD: rgb('#c4b89c'),
  water: rgb('#86c6de'), waterL: rgb('#a8dbeb'), waterD: rgb('#63a8c8'), foam: rgb('#e4f4f2'),
  pool: rgb('#4cc6e4'), poolL: rgb('#8fe3f2'), coping: rgb('#f2efe4'),
  deck: rgb('#c9a06c'), deckD: rgb('#b08756'),
  field: rgb('#dcc48e'), fieldD: rgb('#c7ad76'), crop: rgb('#a9c46c'), cropD: rgb('#8fb058'),
  forest: rgb('#5f8f4c'), forestD: rgb('#4f7c40'),
  court: rgb('#6fa3b8'), courtOut: rgb('#8bbf85'), line: rgb('#f7f7ef'), net: rgb('#3a3a3a'),
  sand: rgb('#ead9aa'), sandD: rgb('#d6c28e'),
  asph: rgb('#a3a39a'), asphD: rgb('#939389'),
  plank: rgb('#b8895a'), plankD: rgb('#8f663f'),
  wall: rgb('#f3ecdc'), wallD: rgb('#ddd2bb'), plinth: rgb('#b9ad96'),
  roof: rgb('#b0714a'), roofD: rgb('#8e5637'), roofL: rgb('#c4885e'),
  slate: rgb('#6f7b8c'),
  win: rgb('#4a6b8c'), winL: rgb('#86a8c4'), frame: rgb('#fbf8f0'), shutter: rgb('#7c9aa6'),
  door: rgb('#6b4a2e'), doorD: rgb('#4e3420'),
  outline: rgb('#4b3a2c'),
  trunk: rgb('#7a5436'), trunkD: rgb('#5a3c26'),
  leaf: [rgb('#3f6e3a'), rgb('#4f8a45'), rgb('#65a152'), rgb('#86bd62'), rgb('#a6d27a')],
  pine: [rgb('#2f5a3c'), rgb('#3d7049'), rgb('#4f8757'), rgb('#6aa168')],
  glass: rgb('#bfe3ea'), glassD: rgb('#8fc4d0'), glassF: rgb('#6f8f7a'),
  stone: rgb('#cfc6b3'), stoneD: rgb('#a89f8c'),
  flowers: [rgb('#f5f0e6'), rgb('#f2c14e'), rgb('#e88a8a'), rgb('#b69ce0')],
};

export const map = [];          // map[y][x] -> tile code
export const block = [];        // blocking props on walkable tiles
for (let y = 0; y < H; y++) { map.push(new Array(W).fill('g')); block.push(new Array(W).fill(false)); }

const fill = (x0, y0, x1, y1, t) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (x >= 0 && y >= 0 && x < W && y < H) map[y][x] = t;
};
const ellipse = (cx, cy, rx, ry, t) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) map[y][x] = t;
};

// ---------------------------------------------------------------- terrain
fill(0, 0, 18, 11, 'f');                 // ploughed fields, north-west
fill(0, 0, 24, 1, 'f');
fill(33, 41, 46, 50, 'f');               // walled garden field below the château
fill(0, 45, 13, 53, 'F');                // woods
fill(0, 13, 2, 44, 'F');
fill(14, 50, 32, 53, 'F');
fill(47, 18, 59, 27, 'F');
fill(47, 34, 59, 53, 'F');
fill(56, 0, 59, 17, 'F');
fill(28, 40, 32, 53, 'F');
fill(4, 13, 18, 21, 'm');                // golf practice meadow
fill(30, 14, 36, 18, 'l');               // yoga lawn
ellipse(33.5, 7.5, 4.6, 3.1, 'w');       // the pond

// Moat ring around the château island
fill(31, 24, 45, 39, 'w');
fill(33, 26, 43, 37, 'g');
fill(36, 29, 43, 37, 'y');               // cour d'honneur

// Roads & paths
fill(26, 2, 27, 46, 'p');                // main drive
for (let y = 15; y <= 24; y++) for (let x = 22; x <= 31; x++) {  // roundabout
  const r = Math.hypot(x - 26.5, y - 19.5);
  if (r >= 2.4 && r <= 4.1) map[y][x] = 'p';
  else if (r < 2.4) map[y][x] = 'l';
}
fill(9, 27, 30, 27, 'p');                // lane past La Grange to the boat dock
fill(20, 36, 25, 36, 'p');               // La Ferme courtyard to the drive
fill(28, 31, 30, 31, 'p'); fill(31, 31, 32, 31, 'b');   // west bridge
fill(33, 31, 35, 31, 'y');               // gate passage
fill(44, 31, 45, 31, 'b'); fill(46, 30, 59, 32, 'p');   // east bridge + avenue
fill(38, 38, 38, 39, 'b'); fill(38, 40, 38, 41, 'p');   // south bridge to the garden
fill(30, 19, 45, 19, 'p');               // east lane
fill(44, 4, 44, 19, 'p');                // north lane to the sports
fill(45, 9, 51, 9, 'p');
fill(45, 17, 50, 17, 'p');
fill(40, 17, 40, 18, 'p');
fill(28, 12, 38, 12, 'p');               // pond promenade
fill(38, 10, 38, 11, 'p');
fill(21, 15, 21, 16, 'p'); fill(21, 16, 25, 16, 'p');
fill(12, 21, 12, 26, 'p');               // to the golf tee
fill(28, 4, 29, 11, 'p'); fill(28, 4, 29, 4, 'p');
fill(45, 20, 45, 22, 'p');
fill(46, 22, 57, 22, 't'); fill(57, 19, 57, 26, 't'); fill(48, 26, 57, 26, 't'); fill(48, 22, 48, 26, 't');
fill(41, 10, 43, 10, 'p');
fill(33, 11, 33, 11, 'p');
fill(24, 42, 25, 43, 'p');

fill(14, 44, 25, 48, 'k');               // parking
fill(38, 7, 40, 9, 's');                 // campfire circle

// Sport facilities
fill(45, 2, 50, 8, 'c'); fill(52, 2, 57, 8, 'c');
fill(46, 11, 53, 16, 'd'); fill(47, 12, 52, 15, 'o');

export const courts = [{ x0: 45, y0: 2, x1: 50, y1: 8 }, { x0: 52, y0: 2, x1: 57, y1: 8 }];

// ---------------------------------------------------------------- buildings
// h: wall height px, rh: roof height px, roof: 'x' | 'y' (ridge axis)
export const buildings = [
  // La Ferme — U open to the east, courtyard with greenhouse & terrace
  { id: 'ferme-n', x: 6, y: 29, w: 14, d: 2, h: 22, rh: 14, roof: 'x', floors: 2, doors: [{ face: 'L', at: 13 - 6 }] },
  { id: 'ferme-w', x: 6, y: 31, w: 2, d: 12, h: 22, rh: 14, roof: 'y', floors: 2 },
  { id: 'ferme-s', x: 8, y: 41, w: 12, d: 2, h: 18, rh: 13, roof: 'x', floors: 2 },
  { id: 'ferme-p', x: 18, y: 31, w: 2, d: 3, h: 26, rh: 16, roof: 'y', floors: 2 },
  // La Grange — the long timber barn
  { id: 'grange', x: 10, y: 23, w: 12, d: 3, h: 16, rh: 20, roof: 'x', floors: 1, doors: [{ face: 'L', at: 5 }], barn: true },
  // Le Cottage
  { id: 'cottage', x: 20, y: 11, w: 4, d: 4, h: 18, rh: 14, roof: 'y', floors: 2, doors: [{ face: 'L', at: 1 }] },
  // Spa Nuxe with its glass-roofed pool hall
  { id: 'spa', x: 37, y: 12, w: 6, d: 5, h: 18, rh: 12, roof: 'x', floors: 1, doors: [{ face: 'L', at: 3 }], glass: true },
  // La Remise des Sports
  { id: 'remise', x: 41, y: 8, w: 2, d: 2, h: 12, rh: 8, roof: 'y', floors: 0, doors: [{ face: 'L', at: 0 }], barn: true },
  // Chapel by the pond
  { id: 'chapelle', x: 28, y: 2, w: 2, d: 2, h: 14, rh: 12, roof: 'y', floors: 0, doors: [{ face: 'L', at: 0 }] },
  // Le Château, 1642 — L of wings on the island, round towers
  { id: 'chateau-n', x: 34, y: 27, w: 9, d: 2, h: 30, rh: 20, roof: 'x', floors: 3, doors: [{ face: 'L', at: 3 }, { face: 'L', at: 7 }], dormers: true, grand: true },
  { id: 'chateau-w1', x: 34, y: 29, w: 2, d: 2, h: 30, rh: 20, roof: 'y', floors: 3, grand: true },
  { id: 'chateau-w2', x: 34, y: 32, w: 2, d: 5, h: 30, rh: 20, roof: 'y', floors: 3, grand: true },
];

export const towers = [
  { x: 34.0, y: 27.0, r: 8, h: 40, ch: 26 },
  { x: 43.0, y: 27.2, r: 7, h: 34, ch: 22 },
  { x: 34.2, y: 37.0, r: 7, h: 34, ch: 22 },
  { x: 36.3, y: 31.2, r: 5, h: 38, ch: 18 },   // gatehouse turret
];

for (const b of buildings) fill(b.x, b.y, b.x + b.w - 1, b.y + b.d - 1, '#');
for (const t of towers) map[Math.floor(t.y)][Math.floor(t.x)] = '#';

export function walkable(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  return WALK.has(map[y][x]) && !block[y][x];
}

// ---------------------------------------------------------------- ground
function groundPixel(t, x, y, gx, gy, px, py) {
  const n = hash(px, py, 7);
  const nb = (dx, dy) => (map[y + dy] && map[y + dy][x + dx]) || 'g';
  switch (t) {
    case 'g': case '#': {
      if (n < 0.06) return C.grassD;
      if (n > 0.965) return C.grassL;
      if (n > 0.996) return C.flowers[Math.floor(hash(px, py, 3) * 4)];
      return C.grass;
    }
    case 'l': return (Math.floor((gx) * 4) % 2) ? C.lawn : C.lawn2;
    case 'm': {
      const s = (Math.floor(gx * 2 + x * 2) % 2) ? C.lawn : C.lawn2;
      return n < 0.04 ? C.grassD : s;
    }
    case 'p': case 'k': case 't': {
      const base = t === 'p' ? C.path : t === 't' ? C.trail : C.asph;
      const dark = t === 'k' ? C.asphD : C.pathD;
      const e = 0.1;
      const edge = (gx < e && !isRoad(nb(-1, 0))) || (gx > 1 - e && !isRoad(nb(1, 0))) ||
                   (gy < e && !isRoad(nb(0, -1))) || (gy > 1 - e && !isRoad(nb(0, 1)));
      if (edge) return t === 'k' ? C.pathE : C.pathE;
      if (t === 'k' && x % 3 === 0 && gx < 0.07) return C.line;
      return n < 0.1 ? dark : base;
    }
    case 'y': {
      const cx = Math.floor(gx * 3), cy = Math.floor(gy * 3);
      const fx = gx * 3 - cx, fy = gy * 3 - cy;
      if (fx < 0.12 || fy < 0.12) return C.paveD;
      return n < 0.08 ? C.paveD : C.pave;
    }
    case 'w': {
      const e = 0.14;
      const shoreFar = (gx < e && nb(-1, 0) !== 'w' && nb(-1, 0) !== 'b') || (gy < e && nb(0, -1) !== 'w' && nb(0, -1) !== 'b');
      const shoreNear = (gx > 1 - e && nb(1, 0) !== 'w' && nb(1, 0) !== 'b') || (gy > 1 - e && nb(0, 1) !== 'w' && nb(0, 1) !== 'b');
      if (shoreFar) return (gx < e / 2 || gy < e / 2) ? C.stoneD : C.waterD;
      if (shoreNear) return (gx > 1 - e / 2 || gy > 1 - e / 2) ? C.stone : C.foam;
      const r = Math.sin(px * 0.7 + py * 1.9) + Math.sin(py * 0.9 - px * 0.3);
      return r > 1.55 ? C.waterL : C.water;
    }
    case 'o': {
      if ((gx * 4) % 1 < 0.06 || (gy * 4) % 1 < 0.06) return C.poolL;
      return C.pool;
    }
    case 'd': {
      const nt = [nb(-1, 0), nb(1, 0), nb(0, -1), nb(0, 1)];
      if ((gx > 0.88 && nt[1] === 'o') || (gx < 0.12 && nt[0] === 'o') || (gy > 0.88 && nt[3] === 'o') || (gy < 0.12 && nt[2] === 'o')) return C.coping;
      return (Math.floor(gy * 5) % 2) ? C.deck : C.deckD;
    }
    case 'f': {
      const crop = hash(Math.floor(x / 6), Math.floor(y / 5), 11) > 0.5;
      const row = Math.floor(gx * 4) % 2;
      if (crop) return row ? (n < 0.3 ? C.cropD : C.crop) : C.field;
      return row ? C.fieldD : (n < 0.05 ? C.crop : C.field);
    }
    case 'F': return n < 0.3 ? C.forestD : C.forest;
    case 'c': {
      const court = courts.find(k => x >= k.x0 && x <= k.x1 && y >= k.y0 && y <= k.y1);
      const inner = x > court.x0 && x < court.x1 && y > court.y0 && y < court.y1;
      if (!inner) {
        const lx = (x === court.x0 + 1 && gx < 0.08) || (x === court.x1 - 1 && gx > 0.92);
        return lx && y > court.y0 && y < court.y1 ? C.line : C.courtOut;
      }
      if ((y === court.y0 + 1 && gy < 0.08) || (y === court.y1 - 1 && gy > 0.92)) return C.line;
      if ((x === court.x0 + 1 && gx < 0.08) || (x === court.x1 - 1 && gx > 0.92)) return C.line;
      const mx = Math.floor((court.x0 + court.x1) / 2);
      if (x === mx && gx > 0.94) return C.line;                      // centre service line
      if ((y === court.y0 + 2 || y === court.y1 - 2) && gy > 0.94 && x > court.x0 && x < court.x1) return C.line;
      return C.court;
    }
    case 's': {
      const d = Math.hypot(x + gx - 39.5, y + gy - 8.5);
      if (d > 1.45) return C.grass;
      return n < 0.2 ? C.sandD : C.sand;
    }
    case 'b': {
      const alongX = nb(-1, 0) === 'b' || nb(1, 0) === 'b' || isRoad(nb(-1, 0)) && isRoad(nb(1, 0));
      const g = alongX ? gy : gx, a = alongX ? gx : gy;
      if (g < 0.1 || g > 0.9) return C.plankD;
      return (Math.floor(a * 6) % 2) ? C.plank : shade(C.plank, 0.92);
    }
  }
  return C.grass;
}
const isRoad = t => t === 'p' || t === 'b' || t === 'y' || t === 'k' || t === 't';

export const ORIGIN_X = H * TW / 2 + 16;       // world px -> ground canvas px
export const ORIGIN_Y = 80;
export const GROUND_W = (W + H) * TW / 2 + 32;
export const GROUND_H = (W + H) * TH / 2 + 120;

export function buildGround() {
  const p = new Pix(GROUND_W, GROUND_H, -ORIGIN_X, -ORIGIN_Y);
  p.rect(-ORIGIN_X, -ORIGIN_Y, GROUND_W, GROUND_H, C.forestD);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [sx, sy] = iso(x, y);
    const t = map[y][x];
    for (let r = 0; r < TH; r++) {
      const dy = r + 0.5;
      const hw = TW / 2 * (1 - Math.abs(dy - TH / 2) / (TH / 2));
      for (let px = Math.ceil(sx - hw - 0.5); px < Math.ceil(sx + hw - 0.5); px++) {
        const dx = px + 0.5 - sx;
        const gx = (dx / (TW / 2) + dy / (TH / 2)) / 2;
        const gy = (dy / (TH / 2) - dx / (TW / 2)) / 2;
        p.set(px, sy + r, groundPixel(t, x, y, gx, gy, px, sy + r));
      }
    }
  }
  return p;
}

// Soft blob shadows under trees & buildings, painted into the ground buffer.
function groundShadow(p, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if ((x / rx) ** 2 + (y / ry) ** 2 > 1) continue;
    if ((x + y) & 1 && (x / rx) ** 2 + (y / ry) ** 2 > 0.6) continue;   // dithered rim
    const c = p.get(cx + x, cy + y);
    if (c) p.set(cx + x, cy + y, shade(c, 0.8));
  }
}

// ---------------------------------------------------------------- buildings
const O = 0.14; // eave overhang, in tiles

function wallTex(base) {
  return (x, y) => hash(x, y, 5) < 0.07 ? shade(base, 0.95) : base;
}

function windowsOnFace(p, b, face, lit) {
  const { x, y, w, d, h, floors } = b;
  if (!floors) return;
  const len = face === 'L' ? w : d;
  const fh = (h - 4) / floors;
  const doors = (b.doors || []).filter(dd => dd.face === face).map(dd => dd.at);
  for (let i = 0; i < len; i++) {
    for (let f = 0; f < floors; f++) {
      if (f === 0 && doors.includes(i)) continue;
      if (b.barn && f === 0 && i % 3 !== 1) continue;
      const u0 = i + 0.3, u1 = i + 0.7;
      const z1 = 4 + fh * f + fh * 0.25, z2 = z1 + Math.min(9, fh * 0.6);
      paintQuad(p, b, face, u0, u1, z1, z2, (cx, cy, fu, fz) => {
        if (fu < 0.08 || fu > 0.92 || fz < 0.08 || fz > 0.92) return C.frame;
        if (fz > 0.48 && fz < 0.56) return C.frame;
        return (fu < 0.3 && fz > 0.6) ? C.winL : C.win;
      });
      if (b.grand || b.floors >= 2) {       // shutters
        paintQuad(p, b, face, u0 - 0.12, u0 - 0.02, z1, z2, () => C.shutter);
        paintQuad(p, b, face, u1 + 0.02, u1 + 0.12, z1, z2, () => C.shutter);
      }
    }
  }
  for (const at of doors) {
    paintQuad(p, b, face, at + 0.28, at + 0.72, 1, Math.min(h - 3, 14), (cx, cy, fu, fz) => {
      if (fz > 0.85 && (fu < 0.2 || fu > 0.8)) return null;      // arched top
      if (fu < 0.1 || fu > 0.9 || fz > 0.9) return C.doorD;
      return Math.abs(fu - 0.5) < 0.04 ? C.doorD : C.door;
    });
  }
}

// Paint a rectangle lying on a wall face: u along the face (tiles), z height (px).
function paintQuad(p, b, face, u0, u1, z0, z1, fn) {
  const { x, y, w, d } = b;
  let ax, ay, dirx, diry;
  if (face === 'L') { [ax, ay] = iso(x, y + d); dirx = 16; diry = 8; }
  else { [ax, ay] = iso(x + w, y + d); dirx = 16; diry = -8; }
  const c0 = Math.round(ax + u0 * dirx), c1 = Math.round(ax + u1 * dirx);
  for (let cx = c0; cx < c1; cx++) {
    const base = ay + (cx + 0.5 - ax) / dirx * diry;
    const fu = (cx + 0.5 - (ax + u0 * dirx)) / ((u1 - u0) * dirx);
    for (let z = Math.round(z0); z < Math.round(z1); z++) {
      const fz = (z - z0) / (z1 - z0);
      const col = fn(cx, 0, fu, fz);
      if (col) p.set(cx, Math.floor(base - z), col);
    }
  }
}

function roofTex(base, eaveFn) {
  return (px, py) => {
    const t = eaveFn(px, py);
    if (t % 4 < 1) return shade(base, 0.82);
    return hash(px, py, 9) < 0.05 ? shade(base, 1.08) : base;
  };
}

export function buildingSprite(b) {
  const { x, y, w, d, h, rh } = b;
  const [lx] = iso(x - 1, y + d + 1), [rx] = iso(x + w + 1, y - 1);
  const [, ty] = iso(x, y, h + rh + 8), [, by] = iso(x + w, y + d);
  const p = new Pix(rx - lx, by - ty + 4, lx, ty);
  const wallL = b.barn ? rgb('#e9dcc2') : C.wall, wallR = shade(wallL, 0.84);
  const N = iso(x, y), E = iso(x + w, y), S = iso(x + w, y + d), Wp = iso(x, y + d);
  const up = (pt, z) => [pt[0], pt[1] - z];

  // walls
  p.poly([Wp, S, up(S, h), up(Wp, h)], wallTex(wallL));
  p.poly([S, E, up(E, h), up(S, h)], wallTex(wallR));
  // plinth
  p.poly([Wp, S, up(S, 3), up(Wp, 3)], C.plinth);
  p.poly([S, E, up(E, 3), up(S, 3)], shade(C.plinth, 0.85));
  if (b.barn) {                                          // timber framing
    const beam = rgb('#8a6a4a');
    for (let i = 0; i <= w; i += 1) paintQuad(p, b, 'L', i - 0.03, i + 0.05, 3, h, () => beam);
    for (let i = 0; i <= d; i += 1) paintQuad(p, b, 'R', i - 0.03, i + 0.05, 3, h, () => shade(beam, 0.85));
    paintQuad(p, b, 'L', 0, w, h * 0.55, h * 0.55 + 1.5, () => beam);
    paintQuad(p, b, 'R', 0, d, h * 0.55, h * 0.55 + 1.5, () => shade(beam, 0.85));
  }
  if (b.grand) {                                         // stone quoins at corners
    for (let z = 3; z < h; z += 4) {
      paintQuad(p, b, 'L', 0, 0.12, z, z + 2, () => C.stone);
      paintQuad(p, b, 'L', w - 0.12, w, z, z + 2, () => C.stone);
      paintQuad(p, b, 'R', d - 0.12, d, z, z + 2, () => shade(C.stone, 0.85));
    }
    paintQuad(p, b, 'L', 0, w, h - 2, h, () => C.stoneD);
    paintQuad(p, b, 'R', 0, d, h - 2, h, () => shade(C.stoneD, 0.85));
  }
  windowsOnFace(p, b, 'L');
  windowsOnFace(p, b, 'R');

  // roof
  const roofC = b.grand ? C.slate : C.roof;
  const zr = h + rh;
  if (b.roof === 'x') {
    const ym = y + d / 2;
    const P = (xx, yy, z) => iso(xx, yy, z);
    p.poly([P(x - O, y - O, h), P(x + w + O, y - O, h), P(x + w + O, ym, zr), P(x - O, ym, zr)], shade(roofC, 0.7));
    p.poly([P(x + w, y + d, h), P(x + w, y, h), P(x + w, ym, zr)], wallTex(wallR));
    const [ex, ey] = P(x - O, y + d + O, h);
    const front = [P(x - O, y + d + O, h), P(x + w + O, y + d + O, h), P(x + w + O, ym, zr), P(x - O, ym, zr)];
    p.poly(front, roofTex(roofC, (px, py) => (ey + (px - ex) / 2) - py));
    // verge + ridge
    p.line(...P(x + w + O, y + d + O, h), ...P(x + w + O, ym, zr), shade(roofC, 0.6));
    p.line(...P(x - O, ym, zr), ...P(x + w + O, ym, zr), shade(roofC, 1.2));
    p.line(...P(x - O, y + d + O, h), ...P(x + w + O, y + d + O, h), shade(roofC, 0.6));
    if (b.glass) {                                       // glass pool hall
      p.poly([P(x + 1, y + d + O, h), P(x + w - 1, y + d + O, h), P(x + w - 1, ym, zr), P(x + 1, ym, zr)],
        (px, py) => ((px + py) % 5 === 0 ? C.glassD : (px % 6 === 0 ? C.glassF : C.glass)));
    }
    if (b.dormers) {
      for (let i = 1; i < w; i += 2) {
        const [dx, dy] = P(x + i + 0.2, y + d * 0.78, h + rh * 0.35);
        p.rect(dx - 1, dy - 7, 7, 8, C.wall);
        p.rect(dx, dy - 5, 5, 5, C.win);
        p.set(dx + 1, dy - 4, C.winL);
        for (let k = 0; k < 4; k++) p.rect(dx - 1 + k, dy - 8 - k, 7 - 2 * k, 1, shade(roofC, 0.8));
      }
    }
    if (b.barn) {                                        // skylights on the barn
      for (let i = 2; i < w - 1; i += 3) {
        p.poly([P(x + i, y + d * 0.8, h + rh * 0.35), P(x + i + 1, y + d * 0.8, h + rh * 0.35), P(x + i + 1, y + d * 0.65, h + rh * 0.62), P(x + i, y + d * 0.65, h + rh * 0.62)], C.glassD);
      }
    }
  } else {
    const xm = x + w / 2;
    const P = (xx, yy, z) => iso(xx, yy, z);
    p.poly([P(x - O, y - O, h), P(x - O, y + d + O, h), P(xm, y + d + O, zr), P(xm, y - O, zr)], shade(roofC, 0.7));
    p.poly([P(x, y + d, h), P(x + w, y + d, h), P(xm, y + d, zr)], wallTex(wallL));
    const [ex, ey] = P(x + w + O, y + d + O, h);
    const front = [P(x + w + O, y - O, h), P(x + w + O, y + d + O, h), P(xm, y + d + O, zr), P(xm, y - O, zr)];
    const rc = shade(roofC, 0.86);
    p.poly(front, roofTex(rc, (px, py) => (ey - (px - ex) / 2) - py));
    p.line(...P(x - O, y + d + O, h), ...P(xm, y + d + O, zr), shade(roofC, 0.6));
    p.line(...P(xm, y + d + O, zr), ...P(x + w + O, y + d + O, h), shade(roofC, 0.6));
    p.line(...P(xm, y - O, zr), ...P(xm, y + d + O, zr), shade(roofC, 1.15));
    if (b.dormers || b.grand) {
      for (let i = 1; i < d; i += 2) {
        const [dx, dy] = P(x + w * 0.78, y + i + 0.2, h + rh * 0.35);
        p.rect(dx - 1, dy - 7, 7, 8, wallR);
        p.rect(dx, dy - 5, 5, 5, C.win);
        for (let k = 0; k < 4; k++) p.rect(dx - 1 + k, dy - 8 - k, 7 - 2 * k, 1, shade(roofC, 0.7));
      }
    }
    // chimney
    const [cx, cy] = P(xm - 0.3, y + d * 0.3, zr - 4);
    p.rect(cx, cy - 8, 4, 9, rgb('#b89a80')); p.rect(cx + 2, cy - 8, 2, 9, rgb('#9a7e66')); p.rect(cx - 1, cy - 9, 6, 2, rgb('#7a6250'));
  }
  if (b.roof === 'x' && !b.grand && !b.glass) {
    const [cx, cy] = iso(x + w * 0.7, y + d / 2, zr - 3);
    p.rect(cx, cy - 8, 4, 9, rgb('#b89a80')); p.rect(cx + 2, cy - 8, 2, 9, rgb('#9a7e66')); p.rect(cx - 1, cy - 9, 6, 2, rgb('#7a6250'));
  }
  return p;
}

export function towerSprite(t) {
  const [sx, sy] = iso(t.x, t.y);
  const r = t.r, R = r + 2;
  const p = new Pix(R * 2 + 4, t.h + t.ch + R + 8, sx - R - 2, sy - t.h - t.ch - 4);
  const light = [rgb('#fbf6ea'), rgb('#f0e8d6'), rgb('#ddd2bb'), rgb('#c6b99f')];
  for (let dx = -r; dx <= r; dx++) {
    const e = Math.round(Math.sqrt(r * r - dx * dx) / 2);
    const k = (dx + r) / (2 * r);
    const col = light[Math.min(3, Math.floor(k * 4))];
    for (let yy = sy - t.h - e; yy <= sy + e; yy++) {
      let c = col;
      if (yy > sy + e - 3) c = shade(C.plinth, 1 - k * 0.2);
      if (hash(sx + dx, yy, 2) < 0.05) c = shade(c, 0.95);
      p.set(sx + dx, yy, c);
    }
  }
  for (let f = 1; f <= 3; f++) {                      // slit windows
    const wy = sy - t.h * f / 3.6;
    p.rect(sx - 3, wy - 6, 3, 6, C.frame); p.rect(sx - 2, wy - 5, 1, 4, C.win);
  }
  p.rect(sx - r, sy - t.h - 1, 2 * r + 1, 2, C.stoneD);
  const roofC = C.slate;
  for (let dx = -R; dx <= R; dx++) {
    const e = Math.round(Math.sqrt(R * R - dx * dx) / 2);
    const bottom = sy - t.h + e;
    const top = sy - t.h - t.ch * (1 - Math.abs(dx) / (R + 0.5));
    const k = (dx + R) / (2 * R);
    for (let yy = Math.floor(top); yy <= bottom; yy++) {
      let c = shade(roofC, 1.15 - k * 0.45);
      if ((bottom - yy) % 4 === 0) c = shade(c, 0.85);
      p.set(sx + dx, yy, c);
    }
  }
  p.rect(sx, sy - t.h - t.ch - 4, 1, 5, rgb('#d9b24c'));
  return p;
}

// ---------------------------------------------------------------- trees
function treeSprite(seed, kind) {
  const rnd = mulberry(seed);
  const p = new Pix(28, 40, -14, -36);
  if (kind === 'pine') {
    p.rect(-1, -5, 3, 6, C.trunk);
    const tiers = 4, hgt = 26 + Math.floor(rnd() * 6);
    for (let i = 0; i < tiers; i++) {
      const topY = -hgt + i * 5, wid = 4 + i * 2.2;
      for (let yy = 0; yy < 9; yy++) {
        const hw = Math.round(wid * yy / 8);
        for (let xx = -hw; xx <= hw; xx++) {
          const k = (xx + hw) / (2 * hw + 1);
          let c = C.pine[k < 0.3 ? 3 : k < 0.6 ? 2 : k < 0.85 ? 1 : 0];
          if (yy === 8 || Math.abs(xx) === hw) c = C.pine[0];
          p.set(xx, topY + yy, c);
        }
      }
    }
    return p;
  }
  const small = kind === 'small';
  const trunkH = small ? 5 : 7;
  p.rect(-1, -trunkH, 3, trunkH + 1, C.trunk); p.rect(1, -trunkH, 1, trunkH + 1, C.trunkD);
  const R = small ? 6 : 8 + Math.floor(rnd() * 3);
  const cy = -trunkH - R + 2;
  const lobes = [[0, 0, R]];
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    lobes.push([Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.45 - 1, R * (0.5 + rnd() * 0.25)]);
  }
  const inside = (x, y) => lobes.some(([lx, ly, lr]) => (x - lx) ** 2 + (y - ly) ** 2 <= lr * lr);
  for (let y = -R - 6; y <= R + 4; y++) for (let x = -R - 6; x <= R + 6; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    let best = lobes[0];
    for (const l of lobes) if ((x - l[0]) ** 2 + (y - l[1]) ** 2 < (x - best[0]) ** 2 + (y - best[1]) ** 2) best = l;
    const lx = (x - best[0]) / best[2], ly = (y - best[1]) / best[2];
    let v = -(lx * 0.55 + ly * 0.85) + (hash(x, y, seed) - 0.5) * 0.5;
    let idx = v > 0.55 ? 4 : v > 0.1 ? 3 : v > -0.35 ? 2 : 1;
    if (edge && (y > 0 || x > 0)) idx = 0;
    p.set(x, cy + y, C.leaf[idx]);
  }
  return p;
}

// ---------------------------------------------------------------- props
function fountainSprite() {
  const p = new Pix(40, 34, -20, -24);
  for (let y = -6; y <= 6; y++) for (let x = -14; x <= 14; x++) {
    const d = (x / 14) ** 2 + (y / 7) ** 2;
    if (d <= 1) p.set(x, y + 2, d > 0.72 ? (y > 0 ? C.stone : C.stoneD) : (hash(x, y, 1) < 0.1 ? C.waterL : C.water));
  }
  p.rect(-1, -12, 3, 13, C.stone); p.rect(1, -12, 1, 13, C.stoneD);
  p.rect(-4, -12, 9, 2, C.stone);
  for (let i = 0; i < 6; i++) { p.set(-5 - i % 2, -14 + i * 2, C.waterL); p.set(5 + i % 2, -14 + i * 2, C.waterL); }
  p.rect(0, -18, 1, 6, C.foam);
  return p;
}

function fireSprite(f) {
  const p = new Pix(24, 24, -12, -18);
  for (let a = 0; a < 10; a++) {
    const x = Math.round(Math.cos(a / 10 * Math.PI * 2) * 7), y = Math.round(Math.sin(a / 10 * Math.PI * 2) * 3.5);
    p.rect(x - 1, y - 1, 3, 2, a % 2 ? C.stoneD : C.stone);
  }
  p.rect(-4, -2, 9, 2, C.trunk); p.rect(-3, -3, 7, 1, C.trunkD);
  const fl = [rgb('#f7d154'), rgb('#f39a3c'), rgb('#e0572e')];
  for (let i = 0; i < 12; i++) {
    const x = Math.round(Math.sin(i * 1.7 + f * 2) * 3), h = 3 + ((i * 7 + f * 3) % 7);
    p.rect(x, -3 - h, 1, h, fl[i % 3]);
  }
  return p;
}

function greenhouseSprite() {
  const b = { x: 14, y: 36, w: 3, d: 2, h: 12, rh: 8 };
  const { x, y, w, d, h, rh } = b;
  const [lx] = iso(x - 1, y + d + 1), [rx] = iso(x + w + 1, y - 1);
  const [, ty] = iso(x, y, h + rh + 4), [, by] = iso(x + w, y + d);
  const p = new Pix(rx - lx, by - ty + 4, lx, ty);
  const S = iso(x + w, y + d), E = iso(x + w, y), Wp = iso(x, y + d);
  const up = (pt, z) => [pt[0], pt[1] - z];
  const g = (px, py) => (px % 4 === 0 || py % 5 === 0) ? C.frame : ((px + py) % 7 === 0 ? C.glass : C.glassD);
  p.poly([Wp, S, up(S, h), up(Wp, h)], g);
  p.poly([S, E, up(E, h), up(S, h)], (px, py) => shade(g(px, py), 0.9));
  const ym = y + d / 2;
  p.poly([iso(x, y + d, h), iso(x + w, y + d, h), iso(x + w, ym, h + rh), iso(x, ym, h + rh)], (px, py) => (px % 4 === 0 ? C.frame : C.glass));
  p.poly([iso(x + w, y + d, h), iso(x + w, y, h), iso(x + w, ym, h + rh)], (px, py) => (px % 4 === 0 ? C.frame : C.glassD));
  // plants inside
  for (let i = 0; i < 18; i++) p.set(Wp[0] + 4 + i * 2.5, Wp[1] + i * 1.25 - 2 - (i % 3), C.leaf[2 + (i % 2)]);
  return p;
}

function carSprite(col, flip) {
  const rows = [
    '....kkkkkk....',
    '...kwwwwwwk...',
    '..kwbbwbbbwk..',
    '.kccccccccccck',
    'kccccccccccccck',
    'kcccccccccccck.',
    '.kkaakkkkaakk..',
    '...kk....kk....',
  ];
  const p = new Pix(18, 12, -8, -9);
  p.map(rows, { k: C.outline, w: rgb('#dfe9ef'), b: rgb('#7d9fb5'), c: col, a: rgb('#333333') }, -7, -8, flip);
  return p;
}

function flagSprite() {
  const p = new Pix(12, 22, -2, -20);
  p.rect(0, -18, 1, 18, C.frame);
  p.rect(1, -18, 6, 4, rgb('#e04b3a')); p.rect(1, -15, 4, 1, rgb('#b8362a'));
  p.rect(-1, 0, 3, 1, rgb('#3d6b3a'));
  return p;
}

function netSprite(court) {
  const my = Math.floor((court.y0 + court.y1) / 2) + 0.5;
  const [ax, ay] = iso(court.x0 + 0.6, my), [bx, by] = iso(court.x1 + 0.4, my);
  const p = new Pix(bx - ax + 4, Math.abs(by - ay) + 12, ax - 2, Math.min(ay, by) - 8);
  for (let x = Math.round(ax); x <= Math.round(bx); x++) {
    const yb = ay + (x - ax) / 2;
    for (let z = 0; z < 5; z++) p.set(x, yb - z, z === 4 ? C.line : ((x + z) % 2 ? C.net : 0));
  }
  p.rect(ax, ay - 7, 1, 7, C.net); p.rect(bx, by - 7, 1, 7, C.net);
  return p;
}

function fenceSprite(court) {
  // simple back fence along the far edges (x0 side and y0 side)
  const [nx, ny] = iso(court.x0, court.y0), [ex, ey] = iso(court.x1 + 1, court.y0), [wx, wy] = iso(court.x0, court.y1 + 1);
  const p = new Pix(ex - wx + 4, wy - ny + 24, wx - 2, ny - 20);
  const post = rgb('#5b6b5a'), mesh = rgb('#8fa58c');
  const seg = (ax, ay, bx, by) => {
    const n = Math.max(Math.abs(bx - ax), 1);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(ax + (bx - ax) * i / n), y = Math.round(ay + (by - ay) * i / n);
      for (let z = 0; z < 14; z++) if (i % 8 === 0 || z === 13 || (x + z) % 3 === 0) p.set(x, y - z, i % 8 === 0 || z === 13 ? post : mesh);
    }
  };
  seg(nx, ny, ex, ey); seg(nx, ny, wx, wy);
  return p;
}

function gateSprite() {
  const p = new Pix(16, 34, -8, -30);
  p.rect(-3, -22, 7, 22, C.stone); p.rect(1, -22, 3, 22, C.stoneD);
  p.rect(-4, -24, 9, 3, C.stoneD);
  p.disc(0, -27, 3, C.stone);
  return p;
}

function blanketSprite() {
  const p = new Pix(34, 18, -17, -2);
  const red = rgb('#d9534f'), wht = rgb('#f7f2e8');
  p.poly([[-12, 8], [0, 2], [12, 8], [0, 14]], (x, y) => ((Math.floor((x + 2 * y) / 3) + Math.floor((2 * y - x) / 3)) % 2 ? red : wht));
  p.rect(2, 3, 5, 4, rgb('#b0824f')); p.rect(3, 2, 3, 1, rgb('#8f663f'));
  return p;
}

function dockSprite() {
  const p = new Pix(40, 20, -20, -2);
  p.poly([[0, 8], [16, 0], [22, 3], [6, 11]], (x, y) => ((x + y) % 3 ? C.plank : C.plankD));
  // a rowboat
  const bt = rgb('#e8e2d4'), bd = rgb('#3f6f8f');
  p.poly([[8, 12], [20, 6], [26, 8], [14, 15]], bd);
  p.poly([[10, 11], [20, 6.5], [24, 8], [14, 13.5]], bt);
  return p;
}

// ---------------------------------------------------------------- objects
// Every static thing that has height becomes a drawable with a footprint
// (for depth sorting) and a sprite.
export function buildObjects(ground) {
  const objs = [];
  const add = (sprite, fx, fy, fw = 1, fh = 1, extra = {}) => {
    const cv = sprite.canvas();
    objs.push({ sprite, cv, x: sprite.ox, y: sprite.oy, w: sprite.w, h: sprite.h,
      minX: fx, minY: fy, maxX: fx + fw, maxY: fy + fh, ...extra });
  };
  for (const b of buildings) {
    const spr = buildingSprite(b);
    const glow = spr.filter(c => c === C.win || c === C.winL, rgb('#ffd27a'));
    add(spr, b.x, b.y, b.w, b.d, { building: b, glow: glow.canvas() });
  }
  for (const t of towers) {
    const spr = towerSprite(t);
    const glow = spr.filter(c => c === C.win, rgb('#ffd27a'));
    const [sx, sy] = iso(t.x, t.y);
    groundShadow(ground, sx + 4, sy + 2, t.r + 2, 5);
    add(spr, t.x - 0.45, t.y - 0.45, 0.9, 0.9, { glow: glow.canvas(), tower: true });
  }

  const treeKinds = [];
  for (let i = 0; i < 10; i++) treeKinds.push({ spr: treeSprite(100 + i, i < 6 ? 'round' : i < 8 ? 'small' : 'pine') });
  treeKinds.forEach(k => k.cv = k.spr.canvas());
  const placeTree = (x, y, kind, jitter = 0.25) => {
    const jx = (hash(x, y, 21) - 0.5) * jitter, jy = (hash(x, y, 22) - 0.5) * jitter;
    const [sx, sy] = iso(x + 0.5 + jx, y + 0.5 + jy);
    const k = treeKinds[kind];
    groundShadow(ground, sx + 3, sy, 7, 3);
    objs.push({ sprite: k.spr, cv: k.cv, x: Math.round(sx + k.spr.ox), y: Math.round(sy + k.spr.oy), w: k.spr.w, h: k.spr.h,
      minX: x + 0.1, minY: y + 0.1, maxX: x + 0.9, maxY: y + 0.9, tree: true });
  };

  // Forest: dense on 'F' tiles
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = map[y][x];
    if (t === 'F') {
      if (hash(x, y, 30) < 0.82) placeTree(x, y, Math.floor(hash(x, y, 31) * 10), 0.5);
    }
  }
  // Scattered trees on open grass, away from paths and buildings
  const nearPath = (x, y) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const t = map[y + j] && map[y + j][x + i];
      if (t && t !== 'g' && t !== 'F' && t !== 'f') return true;
    }
    return false;
  };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (map[y][x] !== 'g' || nearPath(x, y)) continue;
    if (x >= 33 && x <= 43 && y >= 26 && y <= 37) continue;   // keep the island clear-ish
    if (hash(x, y, 40) < 0.13) { placeTree(x, y, Math.floor(hash(x, y, 41) * 10)); block[y][x] = true; }
  }
  // Avenue: double row of trees along the east approach
  for (let x = 47; x <= 57; x += 2) {
    placeTree(x, 29, 3, 0); placeTree(x, 33, 3, 0);
    map[29][x] = 'g'; map[33][x] = 'g'; block[29][x] = block[33][x] = true;
  }
  // Pollarded trees along the moat's south bank
  for (let x = 33; x <= 45; x += 2) { if (map[40][x] === 'f') { placeTree(x, 40, 7, 0); block[40][x] = true; } }
  // Roundabout centre tree
  placeTree(26, 19, 0, 0); block[19][26] = true; block[19][27] = true; block[20][26] = true; block[20][27] = true;

  // Props
  const fnt = fountainSprite(); { const [sx, sy] = iso(39.5, 33.5); fnt.ox += sx; fnt.oy += sy; add(fnt, 39, 33); block[33][39] = true; }
  const gh = greenhouseSprite(); add(gh, 14, 36, 3, 2); fill(14, 36, 16, 37, '#');
  for (const court of courts) {
    const n = netSprite(court); add(n, court.x0, Math.floor((court.y0 + court.y1) / 2), court.x1 - court.x0 + 1, 0.6);
    const f = fenceSprite(court); add(f, court.x0 - 0.1, court.y0 - 0.1, 0.1, 0.1);
  }
  const flag = flagSprite(); { const [sx, sy] = iso(7.5, 16.5); flag.ox += sx; flag.oy += sy; add(flag, 7.2, 16.2, 0.6, 0.6); }
  for (const [gx, gy] of [[58, 29], [58, 33]]) { const g = gateSprite(); const [sx, sy] = iso(gx + 0.5, gy + 0.5); g.ox += sx; g.oy += sy; add(g, gx, gy); block[gy][gx] = true; }
  const cars = [[16, 45, '#c0392b'], [18, 45, '#2e86c1'], [22, 45, '#f4d03f'], [16, 47, '#27ae60'], [20, 47, '#8e44ad'], [23, 47, '#ecf0f1']];
  cars.forEach(([cx, cy, col], i) => {
    const c = carSprite(rgb(col), i % 2); const [sx, sy] = iso(cx + 0.5, cy + 0.5); c.ox += sx; c.oy += sy;
    add(c, cx, cy); block[cy][cx] = true;
  });
  // flat decals go straight into the ground
  const stamp = (spr, x, y) => {
    const [sx, sy] = iso(x, y);
    for (let j = 0; j < spr.h; j++) for (let i = 0; i < spr.w; i++) {
      const c = spr.d[j * spr.w + i]; if (c) ground.set(sx + spr.ox + i, sy + spr.oy + j, c);
    }
  };
  stamp(blanketSprite(), 30.2, 13.0);
  stamp(dockSprite(), 30.9, 26.6);

  return objs;
}

export function fireFrames() {
  const frames = [];
  for (let f = 0; f < 4; f++) frames.push(fireSprite(f));
  return frames;
}

// Ducks swim on the pond.
export function duckSprite(flip) {
  const p = new Pix(8, 6, -4, -5);
  p.map(['..kk....', '.kwyk...', '.kwwwwk.', 'kwwwwwwk', '.kkkkkk.'],
    { k: rgb('#6a6a6a'), w: rgb('#fafafa'), y: rgb('#f0a830') }, -4, -5, flip);
  return p;
}
