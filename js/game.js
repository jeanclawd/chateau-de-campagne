import { Pix, rgb, iso, hash, mulberry, TW, TH } from './pix.js';
import { W, H, map, block, walkable, buildGround, buildObjects, fireFrames, duckSprite,
  ORIGIN_X, ORIGIN_Y, GROUND_W, GROUND_H, buildings } from './world.js';
import { places, toys, badges, ranks, DAY, START, END, DAYS } from './data.js';

// ================================================================ setup
const view = document.getElementById('game');
const vctx = view.getContext('2d');
const buf = document.createElement('canvas');
const ctx = buf.getContext('2d');
const $ = id => document.getElementById(id);

const ground = buildGround();
const objects = buildObjects(ground);
const groundCv = ground.canvas();
const fire = fireFrames().map(p => ({ p, cv: p.canvas() }));
const duckCv = [duckSprite(false).canvas(), duckSprite(true).canvas()];
for (const t of toys) block[t.y][t.x] = false;
for (const pl of places) block[pl.door[1]][pl.door[0]] = false;
const placeAt = new Map(places.map(p => [p.door[0] + ',' + p.door[1], p]));

const waterTiles = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === 'w') waterTiles.push([x, y]);
const pondTiles = waterTiles.filter(([x, y]) => y < 12);

// Buildings -> the place you reach by tapping them
const buildingPlace = { 'ferme-n': 'ferme', 'ferme-w': 'ferme', 'ferme-s': 'ferme', 'ferme-p': 'ferme', grange: 'grange',
  cottage: 'cottage', spa: 'spa', remise: 'remise', chapelle: 'chapelle', 'chateau-n': 'room', 'chateau-w1': 'room', 'chateau-w2': 'room' };

// ================================================================ characters
const BODY = {
  front: ['...kkkk...', '..khhhhk..', '.khhhhhhk.', '.khsssshk.', '.ksessesk.', '.kssssssk.', '..kssssk..',
          '..kcccck..', '.kcccccck.', 'ksccccccsk', 'ksccccccsk', '.kcccccck.'],
  back: ['...kkkk...', '..khhhhk..', '.khhhhhhk.', '.khhhhhhk.', '.khhhhhhk.', '.kshhhhsk.', '..kssssk..',
         '..kcccck..', '.kcccccck.', 'ksccccccsk', 'ksccccccsk', '.kcccccck.'],
};
const LEGS = [
  ['.kppppppk.', '.kppkkppk.', '.kpk..kpk.', '.kkk..kkk.'],
  ['.kppppppk.', '.kppkkppk.', '.kpk..kk..', '.kkk......'],
  ['.kppppppk.', '.kppkkppk.', '..kk..kpk.', '......kkk.'],
];
function makeCharacter(pal, striped) {
  const frames = {};
  for (const dir of ['front', 'back']) for (let f = 0; f < 3; f++) for (const flip of [false, true]) {
    const p = new Pix(10, 16, -5, -16);
    const rows = BODY[dir].map((r, i) => striped && i >= 7 && i % 2 ? r.replace(/c/g, 'v') : r).concat(LEGS[f]);
    p.map(rows, pal, -5, -16, flip);
    frames[`${dir}${f}${flip ? 'f' : ''}`] = p.canvas();
  }
  return frames;
}
const K = rgb('#3a2a20');
const playerFrames = makeCharacter({ k: K, h: rgb('#5a3a22'), s: rgb('#f1c7a1'), e: rgb('#2a1a10'),
  c: rgb('#f7f4ee'), v: rgb('#27406e'), p: rgb('#3b4a6b') }, true);
const guestPal = [
  ['#e8c07a', '#e89b8a', '#6c8f5a'], ['#2b2b2b', '#6fa3c7', '#d9d2c0'], ['#a0522d', '#f2d06b', '#4b5d7a'],
  ['#d8d8d8', '#9b7fc7', '#555555'], ['#3d2314', '#e05a47', '#2f4f4f'], ['#f0e0a0', '#5fb58a', '#7a6a55'],
  ['#1e1e1e', '#f5f0e6', '#8a3b3b'],
];
const skins = ['#f1c7a1', '#d9a47c', '#a86f4c', '#f6d7b8'];

// ================================================================ state
let S;
function newState() {
  return {
    t: START, x: 24.5, y: 45.5, path: [], facing: 'front', flip: false, walkT: 0, moving: false,
    energy: 78, sat: 55, score: 0, breakdown: { meals: 0, activities: 0, badges: 0, toys: 0, sleep: 0 },
    done: [], items: new Set(), toys: new Set(), badges: new Set(), sleeps: [], announced: new Set(),
    ff: false, busy: null, over: false, started: false, here: null, lateWarned: false, highlights: [],
    doneOn(id, d) { return this.done.some(e => e.id === id && e.day === d); },
    done_(id) { return this.done.some(e => e.id === id); },
    distinct() { return new Set(this.done.map(e => e.id)).size; },
  };
}
S = newState();
S.done = [];
const stateApi = () => ({ ...S, done: id => S.done_(id), doneOn: (a, d) => S.doneOn(a, d), distinct: () => S.distinct() });

const guests = [];
function spawnGuests() {
  guests.length = 0;
  const rnd = mulberry(7);
  for (let i = 0; i < 9; i++) {
    const [h, c, p] = guestPal[i % guestPal.length];
    const pl = places[Math.floor(rnd() * places.length)];
    guests.push({ x: pl.door[0] + 0.5, y: pl.door[1] + 0.5, path: [], wait: rnd() * 6, facing: 'front', flip: false, walkT: 0,
      frames: makeCharacter({ k: K, h: rgb(h), s: rgb(skins[i % 4]), e: rgb('#2a1a10'), c: rgb(c), p: rgb(p) }, false), rnd });
  }
}
spawnGuests();
const ducks = [0, 1, 2, 3].map(i => { const [x, y] = pondTiles[(i * 7) % pondTiles.length]; return { x: x + 0.5, y: y + 0.5, tx: x + 0.5, ty: y + 0.5, flip: false }; });

// ================================================================ time helpers
const day = t => Math.floor(t / DAY);
const clock = t => { const m = Math.floor(t % DAY); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const fmtWhen = t => `${DAYS[day(t)] || 'Monday'} ${clock(t)}`;

function openNow(act, t = S.t) { return act.when.some(w => t >= w.from && t < w.to); }
function nextOpen(act, t = S.t) { return act.when.filter(w => w.from > t).sort((a, b) => a.from - b.from)[0]; }
function timesToday(id) { return S.done.filter(e => e.id === id && e.day === day(S.t)).length; }

function canDo(act) {
  if (S.over) return 'The weekend is over';
  if (!openNow(act)) {
    const n = nextOpen(act);
    return n ? `Opens ${day(n.from) === day(S.t) ? '' : DAYS[day(n.from)] + ' '}${clock(n.from)}` : 'Not this weekend';
  }
  if (act.need && !S.items.has(act.need)) return act.need === 'racket' ? 'Borrow rackets at the Remise' : act.need === 'clubs' ? 'Borrow clubs at the Remise' : 'Pick up a basket at La Table';
  if (act.give && S.items.has(act.give)) return 'Already have it';
  if (act.special === 'toys') return null;
  if (act.kind === 'meal' && act.s >= 20 && timesToday(act.id) > 0) return 'Already had it today';
  if (act.daily && timesToday(act.id) > 0) return 'Done today — come back tomorrow';
  if (act.kind === 'meal' && S.sat > 85) return 'Too full right now';
  if (act.e < 0 && S.energy < -act.e) return 'Too tired — rest first';
  return null;
}

function mult(act) {
  const notes = [];
  let m = 1;
  if (act.kind === 'meal') {
    m = 0.45 + 1.15 * (1 - S.sat / 100);
    if (S.sat < 30) notes.push('starving → extra tasty');
  } else {
    if (S.sat < 20) { m *= 0.5; notes.push('hangry ×0.5'); }
    if (S.energy < 20 && act.e < 0) { m *= 0.6; notes.push('exhausted ×0.6'); }
    const n = timesToday(act.id); if (n > 0) { m *= Math.pow(0.5, n); notes.push(`again today ×${Math.pow(0.5, n)}`); }
    const h = (S.t % DAY) / 60;
    if (act.golden && h >= 18.5 && h < 20.5) { m *= 1.5; notes.push('golden hour ×1.5'); }
  }
  return { m, notes };
}

// ================================================================ time passing
function passTime(mins, asleep = false) {
  const before = S.t;
  S.t += mins;
  const satRate = asleep ? 0.05 : 0.15, enRate = asleep ? 0 : 0.065;
  S.sat = Math.max(0, S.sat - satRate * mins);
  S.energy = Math.max(0, S.energy - enRate * mins * (S.sat <= 0 ? 3 : 1));
  if (!asleep) announcements(before, S.t);
}

function announcements(a, b) {
  for (const pl of places) for (const act of pl.acts) for (const w of act.when) {
    const len = w.to - w.from;
    if (len > 150 || act.kind === 'sleep' || act.kind === 'leave') continue;
    const at = w.from - 20, key = act.id + w.from;
    if (a < at + 20 && b >= at && !S.announced.has(key)) {
      S.announced.add(key);
      toast(`${pl.icon} ${act.name} — ${pl.name.split(' · ').pop()} at ${clock(w.from)}`, 'info');
    }
  }
  if (!S.lateWarned && b >= END - 60) { S.lateWarned = true; toast('🚗 Check-out at 17:00 — head back to the parking!', 'warn'); }
  const h = (b % DAY) / 60, ha = (a % DAY) / 60;
  if (ha < 23.5 && h >= 23.5) toast('🌙 It\'s getting late. Your bed is in the château.', 'info');
}

// ================================================================ doing things
function addPoints(n, cat) { n = Math.round(n); S.score += n; S.breakdown[cat] += n; return n; }

function doActivity(pl, act) {
  const why = canDo(act);
  if (why) { toast(why, 'warn'); return; }
  if (act.special === 'toys') {
    const left = toys.filter((t, i) => !S.toys.has(i));
    showBusy({ icon: '🧸', title: 'Gustave\'s lost toys', say: left.length
      ? `Gustave lost ${toys.length} toys around the park. You've found ${S.toys.size}. Still missing: ${left.map(t => t.icon + ' ' + t.name).join(', ')}. Look near the edges of the park!`
      : 'Gustave is overjoyed. All his toys are home!', mins: 0, done: () => {} });
    return;
  }
  if (act.kind === 'leave') { endGame(true); return; }
  if (act.kind === 'sleep') { sleepUntil(act.until); return; }

  const { m, notes } = mult(act);
  const first = !S.done_(act.id);
  showBusy({
    icon: pl.icon, title: act.name, say: act.say, mins: act.dur, done: () => {
      passTime(act.dur);
      S.energy = clamp(S.energy + act.e);
      let overfull = false;
      if (act.kind === 'meal') { const ns = S.sat + act.s; if (ns > 105) overfull = true; S.sat = clamp(ns); }
      else S.sat = clamp(S.sat + act.s);
      if (act.give) S.items.add(act.give);
      if (act.consume) S.items.delete(act.need);
      let pts = act.pts * m;
      const cat = act.kind === 'meal' ? 'meals' : 'activities';
      let msg = [];
      if (pts > 0) { const got = addPoints(pts, cat); msg.push(`+${got} ✨`); }
      if (first && act.pts > 0) { addPoints(15, 'activities'); msg.push('+15 first time!'); }
      if (overfull) { S.energy = clamp(S.energy - 10); msg.push('food coma −10⚡'); }
      S.done.push({ id: act.id, day: day(S.t - act.dur), t: S.t });
      if (act.pts > 0) toast(`${pl.icon} ${act.name} ${msg.join(' · ')}${notes.length ? ' (' + notes.join(', ') + ')' : ''}`, 'pts');
      else if (act.give) toast(`${pl.icon} Got it: ${act.name.replace(/^(Borrow|Pick up) /, '')}`, 'info');
      checkBadges();
      renderPanel();
    },
  });
}

function sleepUntil(until) {
  const [hh, mm] = until.split(':').map(Number);
  let wake = day(S.t) * DAY + hh * 60 + mm;
  if (wake <= S.t) wake += DAY;
  if (wake > END) wake = END - 60;
  const hours = (wake - S.t) / 60;
  showBusy({
    icon: '🌙', title: 'Sweet dreams', say: `You sleep ${hours.toFixed(1)} h under the château's beams…`, mins: wake - S.t, night: true,
    done: () => {
      passTime(wake - S.t, true);
      S.energy = clamp(S.energy + hours * 13);
      S.sleeps.push(hours);
      const pts = addPoints(Math.min(hours, 9) * 8, 'sleep');
      toast(`☀️ Good morning! ${DAYS[day(S.t)]} ${clock(S.t)} · +${pts} ✨ for a good night`, 'pts');
      checkBadges(); renderPanel();
    },
  });
}

function collapse() {
  const lose = Math.min(S.score, 25);
  S.score -= lose; S.breakdown.activities -= lose;
  showBusy({ icon: '😵', title: 'You nod off on a garden bench', say: 'Out of energy. Three hours later a gardener gently wakes you.', mins: 180, night: true, done: () => {
    passTime(180, true); S.energy = clamp(S.energy + 35); toast(`😵 Collapsed from exhaustion −${lose} ✨. Mind your ⚡!`, 'warn'); renderPanel();
  } });
}

function checkBadges() {
  const api = stateApi();
  for (const b of badges) if (!S.badges.has(b.id) && b.test(api)) {
    S.badges.add(b.id); addPoints(b.pts, 'badges');
    toast(`🏅 ${b.name} +${b.pts} ✨`, 'badge');
  }
}

const clamp = v => Math.max(0, Math.min(100, v));

// ================================================================ pathfinding
function findPath(sx, sy, tx, ty) {
  if (!walkable(tx, ty)) return null;
  const key = (x, y) => y * W + x;
  const g = new Map([[key(sx, sy), 0]]), from = new Map(), open = [[sx, sy, 0]];
  const hh = (x, y) => Math.hypot(x - tx, y - ty);
  const closed = new Set();
  while (open.length) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][2] < open[bi][2]) bi = i;
    const [x, y] = open.splice(bi, 1)[0];
    const k = key(x, y);
    if (x === tx && y === ty) {
      const path = []; let c = k;
      while (c !== key(sx, sy)) { path.unshift([c % W, Math.floor(c / W)]); c = from.get(c); }
      return path;
    }
    if (closed.has(k)) continue; closed.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(x + dx, y) || !walkable(x, y + dy))) continue;
      const t = map[ny][nx];
      const cost = (dx && dy ? 1.414 : 1) * (t === 'p' || t === 'b' || t === 'y' || t === 'k' ? 0.8 : 1);
      const ng = g.get(k) + cost, nk = key(nx, ny);
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); from.set(nk, k); open.push([nx, ny, ng + hh(nx, ny) * 0.8]); }
    }
  }
  return null;
}

function nearestWalkable(tx, ty) {
  let best = null, bd = Infinity;
  for (let y = Math.max(0, ty - 6); y <= Math.min(H - 1, ty + 6); y++)
    for (let x = Math.max(0, tx - 6); x <= Math.min(W - 1, tx + 6); x++)
      if (walkable(x, y)) { const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; } }
  return best;
}

function goTo(tx, ty) {
  const p = findPath(Math.floor(S.x), Math.floor(S.y), tx, ty);
  if (p) { S.path = p; S.target = [tx, ty]; }
}

// ================================================================ camera & input
let scale = 3, dpr = 1, vw = 0, vh = 0, camX = 0, camY = 0, zoomAdj = 0;
function resize() {
  dpr = window.devicePixelRatio || 1;
  const cw = window.innerWidth, ch = window.innerHeight;
  view.width = Math.round(cw * dpr); view.height = Math.round(ch * dpr);
  view.style.width = cw + 'px'; view.style.height = ch + 'px';
  scale = Math.max(location.search.includes("overview") ? 1 : 2, Math.round(Math.min(view.width, view.height) / 250) + zoomAdj);
  vw = Math.ceil(view.width / scale); vh = Math.ceil(view.height / scale);
  buf.width = vw; buf.height = vh;
}
window.addEventListener('resize', resize);
resize();

function screenToWorld(cx, cy) {
  const wx = cx * dpr / scale + camX, wy = cy * dpr / scale + camY;
  return [wx, wy];
}
function worldToTile(wx, wy) {
  const gx = (wx / (TW / 2) + wy / (TH / 2)) / 2, gy = (wy / (TH / 2) - wx / (TW / 2)) / 2;
  return [Math.floor(gx), Math.floor(gy)];
}

let hover = null;
function pickPlace(wx, wy) {
  // tapped a building sprite? (pixel-accurate)
  for (let i = drawList.length - 1; i >= 0; i--) {
    const o = drawList[i];
    if (!o.building) continue;
    if (wx < o.x || wy < o.y || wx >= o.x + o.w || wy >= o.y + o.h) continue;
    if (!o.sprite.get(wx, wy)) continue;
    const pid = buildingPlace[o.building.id];
    let pl = places.find(p => p.id === pid);
    if (o.building.id === 'chateau-n') {           // two doors: pick the nearer one
      const [tx] = worldToTile(wx, wy + 20);
      pl = Math.abs(tx - 37) < Math.abs(tx - 41) ? places.find(p => p.id === 'room') : places.find(p => p.id === 'library');
    }
    return pl;
  }
  const [tx, ty] = worldToTile(wx, wy);
  for (const pl of places) if (Math.abs(pl.door[0] - tx) <= 0 && Math.abs(pl.door[1] - ty) <= 0) return pl;
  return null;
}

function onTap(cx, cy) {
  if (S.busy || S.over || !S.started) return;
  const [wx, wy] = screenToWorld(cx, cy);
  const pl = pickPlace(wx, wy);
  if (pl) { goTo(pl.door[0], pl.door[1]); return; }
  let [tx, ty] = worldToTile(wx, wy);
  if (!walkable(tx, ty)) { const n = nearestWalkable(tx, ty); if (!n) return; [tx, ty] = n; }
  goTo(tx, ty);
  tapFx = { x: tx, y: ty, t: performance.now() };
}
let tapFx = null;

let downAt = null;
view.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY, performance.now()]; });
view.addEventListener('pointerup', e => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  if (moved < 12) onTap(e.clientX, e.clientY);
  downAt = null;
});
view.addEventListener('pointermove', e => {
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  hover = pickPlace(wx, wy);
  view.style.cursor = hover ? 'pointer' : 'default';
});
view.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
function zoom(d) { zoomAdj = Math.max(-3, Math.min(4, zoomAdj + d)); resize(); }

const keys = new Set();
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'z', 'q'].includes(k)) { keys.add(k); e.preventDefault(); }
  if (k === 'f') toggleFF();
  if (k === '+' || k === '=') zoom(1);
  if (k === '-') zoom(-1);
  if (k === 'escape') { closeModal(); }
  if (k >= '1' && k <= '9' && S.here && !S.busy) {
    const act = S.here.acts[Number(k) - 1]; if (act) doActivity(S.here, act);
  }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

// ================================================================ update
let last = performance.now(), fireF = 0;
const REAL_RATE = 2;           // game minutes per real second
const FF_RATE = 24;

function update(dt) {
  if (!S.started || S.over) return;
  if (!S.busy) {
    const rate = S.ff ? FF_RATE : REAL_RATE;
    passTime(rate * dt);
    if (S.t >= END) { endGame(false); return; }
    if (S.energy <= 0) { collapse(); return; }
    movePlayer(dt);
  }
  // guests & ducks keep living
  for (const g of guests) moveGuest(g, dt);
  for (const d of ducks) {
    const dx = d.tx - d.x, dy = d.ty - d.y, dd = Math.hypot(dx, dy);
    if (dd < 0.05) {
      const [x, y] = pondTiles[Math.floor(Math.random() * pondTiles.length)];
      if (Math.hypot(x + 0.5 - d.x, y + 0.5 - d.y) < 3) { d.tx = x + 0.5; d.ty = y + 0.5; }
    } else { const s = Math.min(dd, dt * 0.4); d.x += dx / dd * s; d.y += dy / dd * s; d.flip = (dx - dy) < 0; }
  }
  // toys
  S.toys.size < toys.length && toys.forEach((t, i) => {
    if (!S.toys.has(i) && Math.hypot(S.x - (t.x + 0.5), S.y - (t.y + 0.5)) < 0.8) {
      S.toys.add(i); addPoints(20, 'toys');
      toast(`${t.icon} Found Gustave's ${t.name}! +20 ✨ (${S.toys.size}/${toys.length})`, 'pts');
      checkBadges();
    }
  });
}

function movePlayer(dt) {
  const slow = (S.energy < 15 || S.sat < 10) ? 0.6 : 1;
  const speed = 4.2 * slow;
  let mx = 0, my = 0;
  if (keys.has('arrowup') || keys.has('w') || keys.has('z')) { mx -= 1; my -= 1; }
  if (keys.has('arrowdown') || keys.has('s')) { mx += 1; my += 1; }
  if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) { mx -= 1; my += 1; }
  if (keys.has('arrowright') || keys.has('d')) { mx += 1; my -= 1; }
  S.moving = false;
  if (mx || my) {
    S.path = [];
    const l = Math.hypot(mx, my); mx /= l; my /= l;
    const nx = S.x + mx * speed * dt, ny = S.y + my * speed * dt;
    const ok = (x, y) => walkable(Math.floor(x + Math.sign(mx) * 0.2), Math.floor(y + Math.sign(my) * 0.2)) && walkable(Math.floor(x), Math.floor(y));
    if (ok(nx, ny)) { S.x = nx; S.y = ny; }
    else if (ok(nx, S.y)) S.x = nx;
    else if (ok(S.x, ny)) S.y = ny;
    face(S, mx, my); S.moving = true;
  } else if (S.path.length) {
    const [tx, ty] = S.path[0];
    const dx = tx + 0.5 - S.x, dy = ty + 0.5 - S.y, d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= step) { S.x = tx + 0.5; S.y = ty + 0.5; S.path.shift(); }
    else { S.x += dx / d * step; S.y += dy / d * step; }
    face(S, dx, dy); S.moving = true;
  }
  if (S.moving) S.walkT += dt;
  const here = placeAt.get(Math.floor(S.x) + ',' + Math.floor(S.y)) || null;
  if (here !== S.here) { S.here = here; renderPanel(); }
}

function face(c, dx, dy) {
  const sx = dx - dy, sy = dx + dy;   // screen-space direction
  c.facing = sy >= -0.01 ? 'front' : 'back';
  c.flip = c.facing === 'front' ? sx < 0 : sx > 0;
}

function moveGuest(g, dt) {
  if (g.wait > 0) { g.wait -= dt; return; }
  if (!g.path.length) {
    const pl = places[Math.floor(g.rnd() * (places.length - 1))];
    const p = findPath(Math.floor(g.x), Math.floor(g.y), pl.door[0], pl.door[1]);
    if (p && p.length) g.path = p; else g.wait = 2;
    return;
  }
  const [tx, ty] = g.path[0];
  const dx = tx + 0.5 - g.x, dy = ty + 0.5 - g.y, d = Math.hypot(dx, dy), step = 2.2 * dt;
  if (d <= step) { g.x = tx + 0.5; g.y = ty + 0.5; g.path.shift(); if (!g.path.length) g.wait = 4 + g.rnd() * 10; }
  else { g.x += dx / d * step; g.y += dy / d * step; }
  face(g, dx, dy); g.walkT += dt;
}

// ================================================================ render
let drawList = [];
function charDrawable(c, frames, isPlayer) {
  const [sx, sy] = iso(c.x, c.y);
  const f = c.walkT ? (Math.floor(c.walkT * 8) % 4) : 0;
  const frame = (f === 1 ? 1 : f === 3 ? 2 : 0);
  const moving = isPlayer ? S.moving : c.path.length && c.wait <= 0;
  const cv = frames[`${c.facing}${moving ? frame : 0}${c.flip ? 'f' : ''}`];
  return { char: true, isPlayer, cv, x: Math.round(sx - 5), y: Math.round(sy - 16), w: 10, h: 16, sx, sy,
    minX: c.x - 0.2, minY: c.y - 0.2, maxX: c.x + 0.2, maxY: c.y + 0.2 };
}

function behind(a, b) {                       // true if a must be drawn before b
  const ax = a.maxX <= b.minX, bx = b.maxX <= a.minX, ay = a.maxY <= b.minY, by = b.maxY <= a.minY;
  if ((ax || ay) && !(bx || by)) return true;
  if ((bx || by) && !(ax || ay)) return false;
  return (a.minX + a.maxX + a.minY + a.maxY) < (b.minX + b.maxX + b.minY + b.maxY);
}

function depthSort(list) {
  const n = list.length, after = list.map(() => []);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = list[i], b = list[j];
    if (a.x >= b.x + b.w || b.x >= a.x + a.w || a.y >= b.y + b.h || b.y >= a.y + a.h) continue;
    if (behind(a, b)) after[j].push(i); else after[i].push(j);
  }
  const out = [], state = new Uint8Array(n);
  const visit = i => { if (state[i]) return; state[i] = 1; for (const k of after[i]) visit(k); out.push(list[i]); };
  // visit in rough depth order so unrelated items stay stable
  const order = list.map((o, i) => i).sort((i, j) => (list[i].minX + list[i].minY) - (list[j].minX + list[j].minY));
  for (const i of order) visit(i);
  return out;
}

function lightAt(t) {
  const h = (t % DAY) / 60;
  const lerp = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const DAYC = [255, 255, 255], GOLD = [255, 214, 170], DUSK = [150, 130, 190], NIGHT = [70, 82, 145];
  let c, night = 0;
  if (h < 5.5) { c = NIGHT; night = 1; }
  else if (h < 6.5) { const k = h - 5.5; c = lerp(NIGHT, DUSK, k); night = 1 - k * 0.5; }
  else if (h < 7.5) { const k = h - 6.5; c = lerp(DUSK, DAYC, k); night = 0.5 - k * 0.5; }
  else if (h < 18.5) { c = DAYC; }
  else if (h < 20) { c = lerp(DAYC, GOLD, (h - 18.5) / 1.5); }
  else if (h < 21) { const k = h - 20; c = lerp(GOLD, DUSK, k); night = k * 0.6; }
  else if (h < 22) { const k = h - 21; c = lerp(DUSK, NIGHT, k); night = 0.6 + k * 0.4; }
  else { c = NIGHT; night = 1; }
  return { c, night };
}

function render(now) {
  // camera follows the player
  const [px, py] = iso(S.x, S.y);
  const tx = px - vw / 2, ty = py - 12 - vh / 2;
  camX += (tx - camX) * 0.12; camY += (ty - camY) * 0.12;
  camX = Math.max(-ORIGIN_X, Math.min(GROUND_W - ORIGIN_X - vw, camX));
  camY = Math.max(-ORIGIN_Y, Math.min(GROUND_H - ORIGIN_Y - vh, camY));
  const cx = Math.round(camX), cy = Math.round(camY);

  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4f7c40'; ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(groundCv, -ORIGIN_X - cx, -ORIGIN_Y - cy);

  // water sparkles
  const tb = Math.floor(now / 350);
  ctx.fillStyle = '#e8f7fb';
  for (const [x, y] of waterTiles) {
    const [sx, sy] = iso(x, y);
    if (sx - cx < -20 || sx - cx > vw + 20 || sy - cy < -20 || sy - cy > vh + 20) continue;
    const r = hash(x, y, tb);
    if (r < 0.35) {
      const ox = Math.floor(hash(x, y, tb + 1) * 16) - 8, oy = 4 + Math.floor(hash(x, y, tb + 2) * 8);
      ctx.fillRect(sx - cx + ox, sy - cy + oy, 2, 1);
    }
  }

  // door markers: pulsing diamond where something is open now
  for (const pl of places) {
    const open = pl.acts.some(a => !canDo(a) && a.pts > 0);
    if (!open) continue;
    const [sx, sy] = iso(pl.door[0], pl.door[1]);
    const k = (Math.sin(now / 250) + 1) / 2;
    ctx.strokeStyle = `rgba(255, 216, 90, ${0.5 + k * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - cx + 0.5, sy - cy + 1.5); ctx.lineTo(sx - cx + 14.5, sy - cy + 8); ctx.lineTo(sx - cx + 0.5, sy - cy + 14.5); ctx.lineTo(sx - cx - 13.5, sy - cy + 8); ctx.closePath();
    ctx.stroke();
  }
  if (tapFx && now - tapFx.t < 500) {
    const [sx, sy] = iso(tapFx.x, tapFx.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    const k = (now - tapFx.t) / 500;
    ctx.beginPath(); ctx.ellipse(sx - cx + 0.5, sy - cy + 8, 6 + k * 6, 3 + k * 3, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // gather drawables
  const vis = [];
  const onScreen = o => !(o.x - cx > vw || o.y - cy > vh || o.x + o.w - cx < 0 || o.y + o.h - cy < 0);
  for (const o of objects) if (onScreen(o)) vis.push(o);
  fireF += 0.2;
  { const f = fire[Math.floor(fireF) % 4]; const [sx, sy] = iso(39.5, 8.5);
    vis.push({ cv: f.cv, x: sx + f.p.ox, y: sy + f.p.oy, w: f.p.w, h: f.p.h, minX: 39.1, minY: 8.1, maxX: 39.9, maxY: 8.9, fire: true }); }
  for (const d of ducks) { const [sx, sy] = iso(d.x, d.y); vis.push({ cv: duckCv[d.flip ? 1 : 0], x: Math.round(sx - 4), y: Math.round(sy - 5 + Math.sin(now / 400 + d.x) * 0.6), w: 8, h: 6, minX: d.x - 0.1, minY: d.y - 0.1, maxX: d.x + 0.1, maxY: d.y + 0.1 }); }
  const shadows = [];
  for (const g of guests) { const o = charDrawable(g, g.frames, false); if (onScreen(o)) { vis.push(o); shadows.push(o); } }
  let player = null;
  if (!S.busy) { player = charDrawable(S, playerFrames, true); vis.push(player); shadows.push(player); }
  drawList = depthSort(vis);

  ctx.fillStyle = 'rgba(40, 50, 30, 0.28)';
  for (const s of shadows) { ctx.fillRect(Math.round(s.sx - cx) - 3, Math.round(s.sy - cy) - 1, 7, 2); ctx.fillRect(Math.round(s.sx - cx) - 2, Math.round(s.sy - cy) - 2, 5, 4); }

  let occluded = false;
  let seenPlayer = false;
  for (const o of drawList) {
    ctx.drawImage(o.cv, o.x - cx, o.y - cy);
    if (o === player) seenPlayer = true;
    else if (seenPlayer && player && o.sprite && !occluded) {
      if (o.sprite.get(player.sx, player.sy - 8) || o.sprite.get(player.sx, player.sy - 3)) occluded = true;
    }
  }
  if (occluded) { ctx.globalAlpha = 0.5; ctx.drawImage(player.cv, player.x - cx, player.y - cy); ctx.globalAlpha = 1; }

  // lighting
  const L = lightAt(S.t);
  if (L.c[0] < 255 || L.c[1] < 255 || L.c[2] < 255) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${L.c.join(',')})`;
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (L.night > 0.05) {
    ctx.globalAlpha = Math.min(1, L.night);
    for (const o of drawList) if (o.glow) ctx.drawImage(o.glow, o.x - cx, o.y - cy);
    // warm light pools: campfire and lamps at doors
    ctx.globalCompositeOperation = 'lighter';
    const glowAt = (wx, wy, r, a) => {
      const g = ctx.createRadialGradient(wx - cx, wy - cy, 0, wx - cx, wy - cy, r);
      g.addColorStop(0, `rgba(255,170,80,${a})`); g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g; ctx.fillRect(wx - cx - r, wy - cy - r, r * 2, r * 2);
    };
    { const [sx, sy] = iso(39.5, 8.5); glowAt(sx, sy - 4, 34 + Math.sin(now / 90) * 2, 0.35); }
    for (const pl of places) if (!['golf', 'trail', 'picnic', 'ducks', 'tennis', 'pool', 'yoga', 'fire'].includes(pl.id)) { const [sx, sy] = iso(pl.door[0] + 0.5, pl.door[1] + 0.2); glowAt(sx, sy - 6, 18, 0.22); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // blit to the screen
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(buf, 0, 0, vw * scale, vh * scale);

  // hi-res overlay: place icons & labels, toys
  const fs = Math.round(11 * dpr);
  vctx.textAlign = 'center';
  vctx.textBaseline = 'middle';
  for (const pl of places) {
    const [sx, sy] = iso(pl.door[0] + 0.5, pl.door[1] + 0.5);
    const X = (sx - cx) * scale, Y = (sy - cy - 26) * scale;
    if (X < -50 || Y < -50 || X > view.width + 50 || Y > view.height + 50) continue;
    const bob = Math.sin(now / 400 + pl.door[0]) * 2 * dpr;
    const open = pl.acts.some(a => !canDo(a) && a.pts > 0);
    vctx.globalAlpha = open ? 1 : 0.55;
    vctx.font = `${Math.round(16 * dpr)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
    vctx.fillStyle = 'rgba(30,24,18,0.55)';
    vctx.beginPath(); vctx.arc(X, Y + bob, 13 * dpr, 0, Math.PI * 2); vctx.fill();
    if (open) { vctx.strokeStyle = '#ffd85a'; vctx.lineWidth = 2 * dpr; vctx.stroke(); }
    vctx.fillText(pl.icon, X, Y + bob + 1 * dpr);
    const near = Math.hypot(S.x - pl.door[0], S.y - pl.door[1]) < 5 || hover === pl;
    if (near) {
      vctx.font = `${fs}px "Pixelify Sans", system-ui, sans-serif`;
      const label = pl.name;
      const tw = vctx.measureText(label).width + 12 * dpr;
      vctx.fillStyle = 'rgba(30,24,18,0.8)';
      roundRect(vctx, X - tw / 2, Y + bob - 30 * dpr, tw, 17 * dpr, 4 * dpr); vctx.fill();
      vctx.fillStyle = '#fff6e0';
      vctx.fillText(label, X, Y + bob - 21 * dpr);
    }
    vctx.globalAlpha = 1;
  }
  vctx.font = `${Math.round(14 * dpr)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
  toys.forEach((t, i) => {
    if (S.toys.has(i)) return;
    const [sx, sy] = iso(t.x + 0.5, t.y + 0.5);
    const X = (sx - cx) * scale, Y = (sy - cy - 6) * scale + Math.sin(now / 300 + i) * 3 * dpr;
    if (X < -30 || Y < -30 || X > view.width + 30 || Y > view.height + 30) return;
    const tw = (Math.sin(now / 200 + i * 2) + 1) / 2;
    vctx.fillStyle = `rgba(255,255,220,${0.25 + tw * 0.35})`;
    vctx.beginPath(); vctx.arc(X, Y, 10 * dpr, 0, Math.PI * 2); vctx.fill();
    vctx.fillText(t.icon, X, Y);
  });
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ================================================================ UI
function hud() {
  $('day').textContent = (DAYS[day(S.t)] || 'Sunday').slice(0, 3);
  $('time').textContent = clock(S.t);
  $('score').textContent = S.score;
  $('energy').style.width = S.energy + '%';
  $('sat').style.width = S.sat + '%';
  $('energy').classList.toggle('low', S.energy < 20);
  $('sat').classList.toggle('low', S.sat < 20);
  const prog = (S.t - START) / (END - START);
  $('weekbar').style.width = Math.min(100, prog * 100) + '%';
  $('items').textContent = [...S.items].map(i => ({ racket: '🎾', clubs: '🏌️', basket: '🧺' })[i]).join(' ') + (S.toys.size ? ` 🧸${S.toys.size}/${toys.length}` : '');
}

function renderPanel() {
  const panel = $('panel');
  const pl = S.here;
  if (!pl || S.over) { panel.hidden = true; return; }
  panel.hidden = false;
  $('p-title').textContent = `${pl.icon} ${pl.name}`;
  $('p-blurb').textContent = pl.blurb;
  const list = $('p-acts'); list.innerHTML = '';
  pl.acts.forEach((act, i) => {
    const why = canDo(act);
    const b = document.createElement('button');
    b.className = 'act' + (why ? ' off' : '');
    const eff = [];
    if (act.dur) eff.push(`${act.dur} min`);
    if (act.kind === 'sleep') eff.push('restores ⚡');
    if (act.e) eff.push(`${act.e > 0 ? '+' : ''}${act.e}⚡`);
    if (act.s) eff.push(`${act.s > 0 ? '+' : ''}${act.s}🍽️`);
    let pts = '';
    if (act.pts) { const { m } = mult(act); pts = `+${Math.round(act.pts * m)}✨`; }
    b.innerHTML = `<span class="k">${i + 1}</span><span class="n">${act.name}<small>${why ? why : eff.join(' · ')}</small></span><span class="pts">${why ? '' : pts}</span>`;
    b.onclick = () => doActivity(pl, act);
    list.appendChild(b);
  });
}

let toastN = 0;
function toast(msg, kind = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('toasts').prepend(el);
  const n = ++toastN;
  setTimeout(() => el.classList.add('out'), kind === 'badge' ? 5200 : 3800);
  setTimeout(() => el.remove(), kind === 'badge' ? 5800 : 4400);
  while ($('toasts').children.length > 4) $('toasts').lastChild.remove();
}

function showBusy({ icon, title, say, mins, done, night }) {
  S.busy = { t0: performance.now(), mins, done, fromT: S.t };
  S.path = [];
  $('busy').hidden = false;
  $('busy').classList.toggle('night', !!night);
  $('b-icon').textContent = icon;
  $('b-title').textContent = title;
  $('b-say').textContent = say || '';
  $('b-bar').style.width = '0%';
  $('b-ok').hidden = mins > 0;
  $('b-ok').onclick = finishBusy;
}
function busyTick(now) {
  if (!S.busy || !S.busy.mins) return;
  const dur = Math.min(2600, 900 + S.busy.mins * 8);
  const k = Math.min(1, (now - S.busy.t0) / dur);
  $('b-bar').style.width = (k * 100) + '%';
  $('b-clock').textContent = `${clock(S.busy.fromT + S.busy.mins * k)}`;
  if (k >= 1) finishBusy();
}
function finishBusy() {
  const b = S.busy; if (!b) return;
  S.busy = null;
  $('busy').hidden = true;
  $('b-clock').textContent = '';
  b.done();
  if (S.t >= END) endGame(false);
}

function toggleFF() { S.ff = !S.ff; $('ff').classList.toggle('on', S.ff); }
$('ff').onclick = toggleFF;
$('zin').onclick = () => zoom(1);
$('zout').onclick = () => zoom(-1);

function openModal(html) { $('modal-body').innerHTML = html; $('modal').hidden = false; }
function closeModal() { if (!S.over) $('modal').hidden = true; }
$('modal-close').onclick = closeModal;

$('book').onclick = () => {
  const rows = places.filter(p => p.id !== 'parking').map(pl => {
    const acts = pl.acts.filter(a => a.pts > 0).map(a => {
      const n = S.done.filter(e => e.id === a.id).length;
      const nx = openNow(a) ? '<b class="open">open now</b>' : (nextOpen(a) ? 'next ' + fmtWhen(nextOpen(a).from) : '—');
      return `<li class="${n ? 'did' : ''}">${n ? '✅' : '▫️'} ${a.name} <small>${nx}</small></li>`;
    }).join('');
    return acts ? `<h4>${pl.icon} ${pl.name}</h4><ul>${acts}</ul>` : '';
  }).join('');
  const bs = badges.map(b => `<li class="${S.badges.has(b.id) ? 'did' : ''}">${S.badges.has(b.id) ? '🏅' : '▫️'} ${b.name} <small>+${b.pts}</small></li>`).join('');
  openModal(`<h2>📖 Weekend notebook</h2><p class="muted">${S.distinct()} different activities so far · ${S.toys.size}/${toys.length} of Gustave's toys</p><h3>Bonus badges</h3><ul>${bs}</ul><h3>What's on</h3>${rows}`);
};
$('help').onclick = () => openModal(helpHtml());

function helpHtml() {
  return `<h2>How to play</h2>
  <p>You have <b>one weekend</b> at the château — Friday 18:00 to Sunday 17:00 check-out. Make the most of it.</p>
  <ul class="plain">
   <li>👆 <b>Tap</b> the ground to walk, tap a building or icon to go there (or use arrows / WASD).</li>
   <li>🟡 A <b>glowing ring</b> means something is on right now. Stand on the spot to see what you can do.</li>
   <li>✨ Every activity earns points. <b>First time</b> doing something: +15. Repeating the same thing on the same day earns less.</li>
   <li>🍽️ <b>Meals score more when you're hungry</b>. Skip meals and you get hangry: everything scores half.</li>
   <li>⚡ Sport burns energy; the spa, naps and coffee restore it. Sleep in your château room at night — run out and you'll collapse on a bench.</li>
   <li>🎾 Rackets and golf clubs are free at the <b>Remise des Sports</b>. Picnic baskets come from La Table.</li>
   <li>🧸 Gustave lost 8 toys around the park. 🏅 Bonus badges for combos — see the 📖 notebook.</li>
   <li>⏩ Fast-forward time while you wait for something to open.</li>
  </ul>`;
}

function endGame(onTime) {
  if (S.over) return;
  if (onTime) { addPoints(30, 'badges'); }
  S.over = true; S.busy = null; $('busy').hidden = true; $('panel').hidden = true;
  const rank = [...ranks].reverse().find(r => S.score >= r[0]);
  let best = 0; try { best = Number(localStorage.getItem('cdc-best') || 0); if (S.score > best) localStorage.setItem('cdc-best', S.score); } catch (e) {}
  const b = S.breakdown;
  const fav = Object.entries(S.done.reduce((a, e) => (a[e.id] = (a[e.id] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id]) => places.flatMap(p => p.acts).find(a => a.id === id)?.name).filter(Boolean);
  openModal(`<div class="end">
    <p class="muted">${onTime ? 'Checked out on time (+30)' : 'Sunday 17:00 — the weekend is over'}</p>
    <h2 class="rank">${rank[1]}</h2><p>${rank[2]}</p>
    <div class="big">✨ ${S.score}</div>
    ${best && S.score <= best ? `<p class="muted">Your best: ${best}</p>` : (best ? '<p class="muted">New personal best!</p>' : '')}
    <table class="bd">
      <tr><td>🍽️ Meals</td><td>${b.meals}</td></tr>
      <tr><td>🎾 Activities</td><td>${b.activities}</td></tr>
      <tr><td>🌙 Sleep</td><td>${b.sleep}</td></tr>
      <tr><td>🧸 Toys</td><td>${b.toys}</td></tr>
      <tr><td>🏅 Badges</td><td>${b.badges}</td></tr>
    </table>
    <p class="muted">${S.distinct()} different activities · ${S.badges.size}/${badges.length} badges${fav.length ? ' · favourites: ' + fav.join(', ') : ''}</p>
    <button class="primary" id="again">Another weekend</button></div>`);
  $('modal-close').hidden = true;
  $('again').onclick = restart;
}

function restart() {
  S = newState(); S.started = true;
  spawnGuests();
  $('modal').hidden = true; $('modal-close').hidden = false;
  toast('🚗 Friday 18:00 — you pull into the parking. Dinner at La Table from 19:30!', 'info');
  renderPanel();
}

$('start').onclick = () => {
  $('intro').hidden = true;
  S.started = true;
  toast('🚗 Friday 18:00 — you pull into the parking. Dinner at La Table from 19:30!', 'info');
  setTimeout(() => toast('👆 Tap anywhere to walk. Tap a building to go inside.', 'info'), 1500);
};

// ================================================================ loop
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  update(dt);
  busyTick(now);
  render(now);
  hud();
  requestAnimationFrame(frame);
}
// Snap the camera on the first frame
{ const [px, py] = iso(S.x, S.y); camX = px - vw / 2; camY = py - vh / 2; }
// Debug/test hooks: ?autostart&t=<minutes since Fri 00:00>&x=&y=&zoom=
const Q = new URLSearchParams(location.search);
if (Q.has('autostart')) {
  $('intro').hidden = true; S.started = true;
  if (Q.has('t')) S.t = Number(Q.get('t'));
  if (Q.has('x')) { S.x = Number(Q.get('x')) + 0.5; S.y = Number(Q.get('y')) + 0.5; }
  if (Q.has('zoom')) { zoomAdj = Number(Q.get('zoom')); resize(); }
  const [px, py] = iso(S.x, S.y); camX = px - vw / 2; camY = py - vh / 2;
}
requestAnimationFrame(frame);
window.__game = { get S() { return S; }, places, goTo, doActivity, finishBusy };
