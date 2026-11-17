/* ============================================================
   BUG RUN — the /khelified/game runner
   Mechanics in the spirit of the runner on jld2nd.dev (jump, two
   modes, a rechargeable power, speed-ups); the theme, sprites,
   rules and code are this site's own.

   Rules
   - small bugs crawl on the ground: jump them
   - a pink wall is a bug too big to jump: DEBUG (D) deletes it
   - DEBUG then recharges for 2 seconds, and walls never arrive
     closer together than that, so a wall is always solvable
   - a cup of chai recharges it instantly
   - the run speeds up every 5 seconds; score is distance

   Drawn on a fixed virtual canvas scaled by a whole number, so the
   pixels stay square. Returns { jump, power, destroy }.
============================================================ */
const VW = 320, VH = 180, GROUND = 150;
const LIME = '#ceff00', PINK = '#fc5778', WHITE = '#ffffff', INK = '#121212', GOLD = '#ffc531';

const RUN = [
  ['..XXXX....', '..XXXX....', '..XXXX....', '.XXXXXX...', 'XXXXXXXX..', 'X.XXXX.X..', '..XXXX....', '..XXXX....', '..X..X....', '.XX..XX...', '.X....X...', 'XX....XX..'],
  ['..XXXX....', '..XXXX....', '..XXXX....', '.XXXXXX...', 'XXXXXXXX..', 'X.XXXX.X..', '..XXXX....', '..XXXX....', '..X..X....', '..X..X....', '..XXXX....', '..XX.XX...'],
];
const BUG = ['X.......X', '.X.XXX.X.', '..XXXXX..', 'XXX.X.XXX', '..XXXXX..', '.X.....X.', 'X.......X'];
const CUP = ['.X.X.X..', '..X.X...', 'XXXXXX..', 'XXXXXXXX', 'XXXXXX.X', 'XXXXXXXX', '.XXXX...'];

const POWER_COOLDOWN = 2;      /* seconds */
const WALL_SPACING = 2.6;      /* seconds between walls: always more than the cooldown */
const BEST_KEY = 'kf-bugrun-best';

function sprite(ctx, rows, x, y, px, colour) {
  ctx.fillStyle = colour;
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    if (rows[r][c] === 'X') ctx.fillRect((x + c) * px, (y + r) * px, px, px);
  }
}

export function readBest() {
  try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; }
}

export function createRunner(canvas, { onState, sfx = () => {} }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let scale = 1, offX = 0, offY = 0, raf = 0, last = 0;

  let started, over, t, dist, speed, cooldown, flash, things, nextGap, player, frame, frameT, lastWall;
  let best = readBest();

  function emit() {
    onState({ started, over, score: Math.floor(dist / 10), best, cooldown: Math.ceil(cooldown) });
  }

  function reset() {
    started = false; over = false;
    t = 0; dist = 0; speed = 110; cooldown = 0; flash = 0; lastWall = -99;
    things = []; nextGap = 140; frame = 0; frameT = 0;
    player = { x: 44, y: GROUND - 12, vy: 0, grounded: true };
    emit();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.imageSmoothingEnabled = false;
    scale = Math.max(1, Math.floor(Math.min(canvas.width / VW, canvas.height / VH)));
    offX = Math.floor((canvas.width - VW * scale) / 2);
    offY = Math.floor((canvas.height - VH * scale) / 2);
    draw();
  }

  /* ---------- actions (keyboard, pointer and the on-screen buttons) ---------- */
  function begin() {
    if (over) reset();
    if (!started) { started = true; last = performance.now(); emit(); loop(last); }
  }
  function jump() {
    if (!started || over) { begin(); return; }
    if (player.grounded) { player.vy = -330; player.grounded = false; sfx('jump'); }
  }
  function power() {
    if (!started || over || cooldown > 0) return;
    things = things.filter(o => o.kind !== 'wall');     /* only the walls: small bugs still need a jump */
    cooldown = POWER_COOLDOWN; flash = 0.18; sfx('power'); emit();
  }

  /* ---------- world ---------- */
  function spawn() {
    const roll = Math.random();
    if (roll < 0.12) things.push({ kind: 'chai', x: VW + 8, y: GROUND - 44, w: 8, h: 7 });
    else if (roll < 0.55) things.push({ kind: 'bug', x: VW + 8, y: GROUND - 7, w: 9, h: 7 });
    else if (t - lastWall >= WALL_SPACING) { things.push({ kind: 'wall', x: VW + 8, y: 24, w: 6, h: GROUND - 24 }); lastWall = t; }
    else things.push({ kind: 'bug', x: VW + 8, y: GROUND - 7, w: 9, h: 7 });
    /* enough room to land a jump or switch, even at speed */
    nextGap = 90 + Math.random() * 90 + speed * 0.25;
  }

  function step(dt) {
    t += dt;
    speed = 110 + Math.floor(t / 5) * 14;
    dist += speed * dt;
    if (flash > 0) flash -= dt;
    if (cooldown > 0) { const before = Math.ceil(cooldown); cooldown = Math.max(0, cooldown - dt); if (Math.ceil(cooldown) !== before) emit(); }

    player.vy += 900 * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND - 12) { player.y = GROUND - 12; player.vy = 0; player.grounded = true; }

    frameT += dt;
    if (frameT > 0.11) { frameT = 0; frame ^= 1; }

    nextGap -= speed * dt;
    if (nextGap <= 0) spawn();

    const scoreBefore = Math.floor((dist - speed * dt) / 10);
    for (const o of things) o.x -= speed * dt;
    things = things.filter(o => o.x + o.w > -4);

    for (const o of things) {
      const hit = player.x + 2 < o.x + o.w && player.x + 8 > o.x && player.y + 1 < o.y + o.h && player.y + 12 > o.y;
      if (!hit) continue;
      if (o.kind === 'chai') { o.x = -99; cooldown = 0; sfx('pickup'); emit(); continue; }
      over = true;
      sfx('hit');
      const score = Math.floor(dist / 10);
      if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ } }
      emit();
      return;
    }
    if (Math.floor(dist / 10) !== scoreBefore) emit();
  }

  function draw() {
    ctx.fillStyle = flash > 0 ? WHITE : INK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offX, offY);
    const px = scale;

    /* ground: a line and a few dashes scrolling with the run */
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, GROUND * px, VW * px, px);
    for (let i = 0; i < 12; i++) {
      const x = ((i * 31 - dist) % VW + VW) % VW;
      ctx.fillRect(Math.floor(x) * px, (GROUND + 4 + (i % 3) * 4) * px, 6 * px, px);
    }

    for (const o of things) {
      const x = Math.round(o.x);
      if (o.kind === 'bug') sprite(ctx, BUG, x, o.y, px, WHITE);
      else if (o.kind === 'chai') sprite(ctx, CUP, x, o.y, px, GOLD);
      else {
        ctx.fillStyle = PINK;
        for (let y = o.y; y < o.y + o.h; y += 6) ctx.fillRect(x * px, y * px, o.w * px, 5 * px);
      }
    }

    sprite(ctx, player.grounded ? RUN[frame] : RUN[0], player.x, Math.round(player.y), px, LIME);
    ctx.restore();
  }

  function loop(now) {
    if (!started || over) { draw(); return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0);   /* a backgrounded tab returns a huge delta */
    last = now;
    step(dt);
    draw();
    if (!over) raf = requestAnimationFrame(loop);
  }

  const onKey = e => {
    if (e.target.closest?.('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'arrowup') { e.preventDefault(); jump(); }
    else if (k === 'd') power();
    else if (k === 'enter' && (!started || over)) begin();
  };
  const onPointer = e => { e.preventDefault(); jump(); };
  const onVis = () => { if (!document.hidden && started && !over) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } };

  reset();
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);
  document.addEventListener('visibilitychange', onVis);

  return {
    jump, power,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
