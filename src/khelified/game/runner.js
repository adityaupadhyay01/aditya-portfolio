/* ============================================================
   KEEDA BHAG — the /khelified/game runner
   Mechanics in the spirit of the runner on jld2nd.dev (jump, two
   modes, a rechargeable power, speed-ups); the theme, sprites,
   rules and code are this site's own.

   Rules
   - crawlers sit on the ground: jump them
   - hoppers bounce: jump while they are low, or run under at the top
   - flyers cruise at head height of a JUMP: stay on the ground
   - dashers stop, flash, then charge: jump when they come
     (new kinds join as the run goes on: 8s, 16s, 24s)
   - a pink wall is a bug too big to jump: DEBUG (D) deletes it
   - DEBUG then recharges for 2 seconds, and walls never arrive
     closer together than that, so a wall is always solvable
   - a cup of chai recharges it instantly
   - FIRE (F) shoots: a bullet kills any bug, walls stop it. Six
     bullets; the gold bullet pickup refills them all
   - every 500 points a red boss walks in. It cannot be jumped or
     debugged, only shot, and it keeps coming until it is dead
   - the run speeds up every 5 seconds; score is distance

   Drawn on a fixed virtual canvas scaled by a whole number, so the
   pixels stay square. Returns { jump, power, fire, destroy }.
============================================================ */
const VW = 320, VH = 180, GROUND = 150;
const LIME = '#ceff00', PINK = '#fc5778', WHITE = '#ffffff', INK = '#121212', GOLD = '#ffc531', BLUE = '#5fd4ff', PURPLE = '#b48cff', RED = '#ff3b3b';

const RUN = [
  ['..XXXX....', '..XXXX....', '..XXXX....', '.XXXXXX...', 'XXXXXXXX..', 'X.XXXX.X..', '..XXXX....', '..XXXX....', '..X..X....', '.XX..XX...', '.X....X...', 'XX....XX..'],
  ['..XXXX....', '..XXXX....', '..XXXX....', '.XXXXXX...', 'XXXXXXXX..', 'X.XXXX.X..', '..XXXX....', '..XXXX....', '..X..X....', '..X..X....', '..XXXX....', '..XX.XX...'],
];
const BUG = ['X.......X', '.X.XXX.X.', '..XXXXX..', 'XXX.X.XXX', '..XXXXX..', '.X.....X.', 'X.......X'];
const FLY = ['XX.....XX', '.XX.X.XX.', '..XXXXX..', '.XXXXXXX.', '..X.X.X..'];
const AMMO = ['..XX..', '.XXXX.', '.XXXX.', '.XXXX.', '.XXXX.', 'XXXXXX', 'XXXXXX'];
const CUP = ['.X.X.X..', '..X.X...', 'XXXXXX..', 'XXXXXXXX', 'XXXXXX.X', 'XXXXXXXX', '.XXXX...'];

const POWER_COOLDOWN = 2;      /* seconds */
const WALL_SPACING = 2.6;      /* seconds between walls: always more than the cooldown */
const MAX_AMMO = 6;
const BOSS_EVERY = 500;       /* points */
const BOSS_SCALE = 3;         /* the bug sprite, three times the size */
/* What the game-over screen says, by what killed you: [error, the hint]. */
const ERRORS = {
  crawler: ['Segmentation fault', 'Walked straight into it. Jump the white ones.'],
  hopper:  ['Stack overflow', 'It bounced, you did not. Jump when it is low.'],
  flyer:   ['Null pointer exception', 'You jumped into it. Stay on the ground for blue.'],
  dasher:  ['Race condition', 'It got there first. Jump when the blinking stops.'],
  wall:    ['Syntax error', 'Unexpected wall. Press D to debug it.'],
  boss:    ['Time limit exceeded', 'Too slow. Shoot the red one with F before it reaches you.'],
};

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

export function createRunner(canvas, { onState, onPickup = () => {}, sfx = () => {} }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let scale = 1, offX = 0, offY = 0, raf = 0, last = 0;

  let started, over, t, dist, speed, cooldown, flash, things, nextGap, player, frame, frameT, lastWall, ammo, bullets, boss, nextBossAt, dropT, cause;
  let best = readBest();

  function emit() {
    onState({ started, over, score: Math.floor(dist / 10), best, cooldown: Math.ceil(cooldown), ammo, boss: boss ? { hp: boss.hp, max: boss.max } : null, error: cause ? ERRORS[cause] : null });
  }

  function reset() {
    started = false; over = false; cause = null;
    t = 0; dist = 0; speed = 110; cooldown = 0; flash = 0; lastWall = -99;
    ammo = MAX_AMMO; bullets = []; boss = null; nextBossAt = BOSS_EVERY; dropT = 0;
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

  function fire() {
    if (!started || over || ammo <= 0) return;
    ammo--;
    bullets.push({ x: player.x + 10, y: Math.round(player.y) + 5 });
    sfx('fire'); emit();
  }

  function die(by) {
    over = true; cause = by; sfx('hit');
    const score = Math.floor(dist / 10);
    if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ } }
    emit();
  }

  /* ---------- world ---------- */
  const ground = extra => ({ x: VW + 8, y: GROUND - 7, w: 9, h: 7, ...extra });
  function spawnBug() {
    /* the cast grows with the run, so the first seconds teach one thing at a time */
    const cast = ['crawler'];
    if (t > 8) cast.push('hopper');
    if (t > 16) cast.push('flyer');
    if (t > 24) cast.push('dasher');
    const kind = cast[Math.floor(Math.random() * cast.length)];
    if (kind === 'hopper') things.push(ground({ kind, phase: Math.random() * Math.PI }));
    /* 21px up: clear of a runner on the ground (12 tall), in the path of a jump */
    else if (kind === 'flyer') things.push({ kind, x: VW + 8, y: GROUND - 26, w: 9, h: 5, phase: 0 });
    else if (kind === 'dasher') things.push(ground({ kind, state: 'walk', wait: 0 }));
    else things.push(ground({ kind }));
  }

  function spawn() {
    const roll = Math.random();
    if (roll < 0.1) things.push({ kind: 'chai', x: VW + 8, y: GROUND - 44, w: 8, h: 7 });
    else if (roll < 0.2) things.push({ kind: 'ammo', x: VW + 8, y: GROUND - 44, w: 6, h: 7 });
    else if (roll >= 0.6 && t - lastWall >= WALL_SPACING) { things.push({ kind: 'wall', x: VW + 8, y: 24, w: 6, h: GROUND - 24 }); lastWall = t; }
    else spawnBug();
    /* enough room to land a jump before the next thing, even at speed */
    nextGap = 90 + Math.random() * 90 + speed * 0.25;
  }

  /* each bug's own behaviour, on top of the world scrolling past */
  function behave(o, dt) {
    if (o.kind === 'hopper') {
      o.phase += dt * 5;
      o.y = GROUND - 7 - Math.abs(Math.sin(o.phase)) * 30;     /* peak 30px: room to run under */
    } else if (o.kind === 'flyer') {
      o.phase += dt * 6;
      o.y = GROUND - 26 + Math.sin(o.phase) * 2;
    } else if (o.kind === 'dasher') {
      if (o.state === 'walk' && o.x < VW * 0.72) { o.state = 'wait'; o.wait = 0.55; }
      if (o.state === 'wait') {
        o.x += speed * dt;                                     /* holds its place on screen */
        o.wait -= dt;
        if (o.wait <= 0) o.state = 'dash';
      } else if (o.state === 'dash') o.x -= 150 * dt;          /* on top of the scroll speed */
    }
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

    if (!boss && Math.floor(dist / 10) >= nextBossAt) {
      /* the stage clears for the fight; pickups already on screen stay */
      things = things.filter(o => o.kind === 'chai' || o.kind === 'ammo');
      const hp = 3 + Math.floor(nextBossAt / BOSS_EVERY);
      boss = { x: VW + 10, y: GROUND - 7 * BOSS_SCALE, w: 9 * BOSS_SCALE, h: 7 * BOSS_SCALE, hp, max: hp };
      dropT = ammo < hp ? 0 : 2.5;          /* short on bullets: one arrives at once */
      sfx('boss'); emit();
    }

    if (boss) {
      /* walks in with the scroll, then keeps advancing on its own */
      boss.x -= (boss.x > VW - 70 ? speed : 16) * dt;
      dropT -= dt;
      if (dropT <= 0) { things.push({ kind: 'ammo', x: VW + 8, y: GROUND - 44, w: 6, h: 7 }); dropT = 2.5; }
    } else {
      nextGap -= speed * dt;
      if (nextGap <= 0) spawn();
    }

    /* bullets */
    for (const b of bullets) {
      b.x += 300 * dt;
      if (boss && b.x + 4 > boss.x && b.x < boss.x + boss.w && b.y > boss.y && b.y < boss.y + boss.h) {
        b.x = VW + 99; boss.hp--; sfx('blip'); emit();
        if (boss.hp <= 0) { boss = null; nextBossAt += BOSS_EVERY; flash = 0.18; nextGap = 160; sfx('kill'); emit(); }
        continue;
      }
      for (const o of things) {
        if (o.kind === 'chai' || o.kind === 'ammo') continue;
        if (b.x + 4 > o.x && b.x < o.x + o.w && b.y + 2 > o.y && b.y < o.y + o.h) {
          b.x = VW + 99;
          if (o.kind !== 'wall') { o.x = -99; sfx('blip'); }     /* walls only fall to Debug */
          break;
        }
      }
    }
    bullets = bullets.filter(b => b.x < VW + 8);

    const scoreBefore = Math.floor((dist - speed * dt) / 10);
    for (const o of things) { o.x -= speed * dt; behave(o, dt); }
    things = things.filter(o => o.x + o.w > -4);

    for (const o of things) {
      const hit = player.x + 2 < o.x + o.w && player.x + 8 > o.x && player.y + 1 < o.y + o.h && player.y + 12 > o.y;
      if (!hit) continue;
      if (o.kind === 'chai') { o.x = -99; cooldown = 0; sfx('pickup'); onPickup('chai'); emit(); continue; }
      if (o.kind === 'ammo') { o.x = -99; ammo = MAX_AMMO; sfx('pickup'); onPickup('ammo'); emit(); continue; }
      die(o.kind);
      return;
    }
    if (boss && player.x + 8 > boss.x && player.x + 2 < boss.x + boss.w && player.y + 12 > boss.y) { die('boss'); return; }
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
      if (o.kind === 'crawler') sprite(ctx, BUG, x, Math.round(o.y), px, WHITE);
      else if (o.kind === 'hopper') sprite(ctx, BUG, x, Math.round(o.y), px, LIME);
      else if (o.kind === 'flyer') sprite(ctx, FLY, x, Math.round(o.y), px, BLUE);
      /* a waiting dasher blinks: that is the warning */
      else if (o.kind === 'dasher') sprite(ctx, BUG, x, o.y, px, o.state === 'wait' && Math.floor(o.wait * 12) % 2 ? WHITE : PURPLE);
      else if (o.kind === 'chai') sprite(ctx, CUP, x, o.y, px, GOLD);
      else if (o.kind === 'ammo') sprite(ctx, AMMO, x, o.y, px, GOLD);
      else {
        ctx.fillStyle = PINK;
        for (let y = o.y; y < o.y + o.h; y += 6) ctx.fillRect(x * px, y * px, o.w * px, 5 * px);
      }
    }

    if (boss) {
      sprite(ctx, BUG, Math.round(boss.x) / BOSS_SCALE, boss.y / BOSS_SCALE, px * BOSS_SCALE, RED);
      /* health: one block per hit left */
      ctx.fillStyle = RED;
      for (let i = 0; i < boss.hp; i++) ctx.fillRect((Math.round(boss.x) + i * 5) * px, (boss.y - 8) * px, 4 * px, 3 * px);
    }
    ctx.fillStyle = WHITE;
    for (const b of bullets) ctx.fillRect(Math.round(b.x) * px, b.y * px, 4 * px, 2 * px);

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
    else if (k === 'f') fire();
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
    jump, power, fire,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
