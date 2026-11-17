/* ============================================================
   404 — INVADERS
   A small arcade scene for the page that should not exist.

   Framework-free on purpose: this module is imported only after
   the 404 route is confirmed (see NotFound.jsx), so none of it
   reaches the main bundle.

   Everything lives on an integer pixel grid. The canvas is a fixed
   virtual size scaled by a whole number, so a sprite can never land
   on a half pixel and go soft.
============================================================ */

const VW = 256;        /* virtual width  */
const VH = 192;        /* virtual height */

/* An original 11x8 bug (it is a 404, so: bugs). Two frames so it scuttles. */
const INVADER = [
  [
    'X.........X',
    '.X..XXX..X.',
    '..XXXXXXX..',
    'XXX.XXX.XXX',
    '..XXXXXXX..',
    '.XXXXXXXXX.',
    'X..X...X..X',
    'X.X.....X.X',
  ],
  [
    '.X.......X.',
    '.X..XXX..X.',
    '..XXXXXXX..',
    'XXX.XXX.XXX',
    '..XXXXXXX..',
    '.XXXXXXXXX.',
    '.X.X...X.X.',
    '..X.....X..',
  ],
];

const SHIP = [
  '......X......',
  '.....XXX.....',
  '.....XXX.....',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XX.XXXXXXX.XX',
];

/* Each lit cell becomes one invader, so the swarm spells the status code. */
const DIGITS = {
  '4': ['X..X', 'X..X', 'X..X', 'XXXX', '...X', '...X'],
  '0': ['XXXX', 'X..X', 'X..X', 'X..X', 'X..X', 'XXXX'],
};

const COL_GAP = 16;    /* invader spacing, virtual px */
const ROW_GAP = 13;

function buildSwarm(text) {
  const out = [];
  let col = 0;
  for (const ch of text) {
    const glyph = DIGITS[ch];
    if (!glyph) { col += 2; continue; }
    glyph.forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell === 'X') out.push({ cx: col + c, cy: r, alive: true });
      });
    });
    col += glyph[0].length + 1;      /* one blank column between digits */
  }
  const width = col - 1;
  return { cells: out, cols: width, rows: 6 };
}

function drawSprite(ctx, rows, x, y, px, colour) {
  ctx.fillStyle = colour;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 'X') ctx.fillRect(x + c * px, y + r * px, px, px);
    }
  }
}

/* ------------------------------------------------------------
   createInvaders(canvas, opts) -> { destroy }
   opts.motion   : false renders one still frame and never loops
   opts.onState  : called with { score, wave, over, won } on change
------------------------------------------------------------ */
export function createInvaders(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const onState = opts.onState || (() => {});

  const INK    = '#4dff4d';   /* --green-crt */
  const SHIP_C = '#f5f5f5';   /* --white     */
  const SHOT   = '#4a8fff';   /* --blue      */
  const BG     = '#000000';

  let scale = 1, offX = 0, offY = 0;
  let raf = 0, last = 0, running = false;
  let motion = opts.motion !== false;

  const swarm = buildSwarm('404');
  let cells, swarmX, swarmY, dir, stepTimer, frame, bullets, bombs, ship, score, over, won, bombTimer;

  function reset() {
    cells = swarm.cells.map(c => ({ ...c, alive: true }));
    swarmX = Math.round((VW - swarm.cols * COL_GAP) / 2);
    swarmY = 24;
    dir = 1;
    stepTimer = 0;
    bombTimer = 0;
    frame = 0;
    bullets = [];
    bombs = [];
    ship = { x: VW / 2 - 6, w: 13, h: 8, y: VH - 16, cooldown: 0, hit: 0 };
    score = 0;
    over = false;
    won = false;
    onState({ score, over, won });
  }

  /* ---------- layout ---------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.imageSmoothingEnabled = false;       /* reset by a resize, so set it here */
    /* whole-number scale only: a fractional one is what makes pixel art mushy */
    scale = Math.max(1, Math.floor(Math.min(canvas.width / VW, canvas.height / VH)));
    offX = Math.floor((canvas.width - VW * scale) / 2);
    offY = Math.floor((canvas.height - VH * scale) / 2);
    draw();
  }

  /* ---------- input ---------- */
  const keys = new Set();
  const onKeyDown = e => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) e.preventDefault();
    keys.add(e.key);
    if ((over || won) && (e.key === 'Enter' || e.key === ' ')) { reset(); }
  };
  const onKeyUp = e => keys.delete(e.key);

  /* touch: drag to move, tap to fire */
  let pointerX = null;
  const onPointerDown = e => {
    canvas.setPointerCapture?.(e.pointerId);
    pointerX = e.clientX;
    if (over || won) { reset(); return; }
    fire();
  };
  const onPointerMove = e => { if (pointerX !== null) pointerX = e.clientX; };
  const onPointerUp = () => { pointerX = null; };

  function fire() {
    if (over || won || ship.cooldown > 0) return;
    bullets.push({ x: ship.x + 6, y: ship.y - 4 });
    ship.cooldown = 0.28;
  }

  /* ---------- simulation ---------- */
  function liveCells() { return cells.filter(c => c.alive); }

  function step(dt) {
    if (over || won) return;

    /* ship */
    const speed = 92;
    if (keys.has('ArrowLeft'))  ship.x -= speed * dt;
    if (keys.has('ArrowRight')) ship.x += speed * dt;
    if (pointerX !== null) {
      const r = canvas.getBoundingClientRect();
      const vx = ((pointerX - r.left) * (canvas.width / r.width) - offX) / scale;
      ship.x += Math.max(-speed * dt, Math.min(speed * dt, vx - (ship.x + 6)));
    }
    ship.x = Math.max(2, Math.min(VW - ship.w - 2, ship.x));
    if (keys.has(' ') || keys.has('Spacebar')) fire();
    ship.cooldown = Math.max(0, ship.cooldown - dt);
    ship.hit = Math.max(0, ship.hit - dt);

    /* swarm marches faster as it thins out */
    const alive = liveCells();
    const pace = Math.max(0.09, 0.55 - (swarm.cells.length - alive.length) * 0.01);
    stepTimer += dt;
    if (stepTimer >= pace) {
      stepTimer = 0;
      frame ^= 1;
      const minC = Math.min(...alive.map(c => c.cx));
      const maxC = Math.max(...alive.map(c => c.cx));
      const left = swarmX + minC * COL_GAP;
      const right = swarmX + maxC * COL_GAP + 11;
      if ((dir > 0 && right >= VW - 4) || (dir < 0 && left <= 4)) {
        dir *= -1;
        swarmY += 6;
      } else {
        swarmX += dir * 4;
      }
      const lowest = Math.max(...alive.map(c => c.cy));
      if (swarmY + lowest * ROW_GAP + 8 >= ship.y) { over = true; onState({ score, over, won }); }
    }

    /* invader bombs */
    bombTimer -= dt;
    if (bombTimer <= 0 && alive.length) {
      bombTimer = 0.55 + Math.random() * 0.9;
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      bombs.push({ x: swarmX + shooter.cx * COL_GAP + 5, y: swarmY + shooter.cy * ROW_GAP + 8 });
    }

    /* bullets up */
    for (const b of bullets) b.y -= 160 * dt;
    bullets = bullets.filter(b => b.y > -4);

    /* bombs down */
    for (const b of bombs) b.y += 70 * dt;
    bombs = bombs.filter(b => b.y < VH + 4);

    /* bullet -> invader */
    for (const b of bullets) {
      for (const c of alive) {
        const ix = swarmX + c.cx * COL_GAP, iy = swarmY + c.cy * ROW_GAP;
        if (b.x >= ix && b.x <= ix + 11 && b.y >= iy && b.y <= iy + 8) {
          c.alive = false;
          b.y = -99;
          score += 10;
          onState({ score, over, won });
          break;
        }
      }
    }
    bullets = bullets.filter(b => b.y > -4);

    /* bomb -> ship */
    for (const b of bombs) {
      if (b.x >= ship.x && b.x <= ship.x + ship.w && b.y >= ship.y && b.y <= ship.y + ship.h) {
        b.y = VH + 99;
        over = true;
        onState({ score, over, won });
      }
    }
    bombs = bombs.filter(b => b.y < VH + 4);

    if (!liveCells().length) { won = true; onState({ score, over, won }); }
  }

  /* ---------- paint ---------- */
  function draw() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offX, offY);
    const px = scale;

    for (const c of cells) {
      if (!c.alive) continue;
      drawSprite(ctx, INVADER[frame], (swarmX + c.cx * COL_GAP) * px, (swarmY + c.cy * ROW_GAP) * px, px, INK);
    }

    if (!over) drawSprite(ctx, SHIP, Math.round(ship.x) * px, ship.y * px, px, SHIP_C);

    ctx.fillStyle = SHOT;
    for (const b of bullets) ctx.fillRect(Math.round(b.x) * px, Math.round(b.y) * px, px, px * 3);
    ctx.fillStyle = INK;
    for (const b of bombs) ctx.fillRect(Math.round(b.x) * px, Math.round(b.y) * px, px, px * 3);

    ctx.restore();
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);   /* clamp: a backgrounded tab returns a huge delta */
    last = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || !motion) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* a hidden tab should not keep simulating */
  const onVisibility = () => { if (document.hidden) stop(); else if (motion) start(); };

  reset();
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  document.addEventListener('visibilitychange', onVisibility);

  if (motion) start(); else draw();

  return {
    restart: reset,
    setMotion(on) {
      motion = on;
      if (on) start(); else { stop(); draw(); }
    },
    destroy() {
      stop();
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
