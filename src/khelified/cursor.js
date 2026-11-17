/* ============================================================
   PIXEL CURSOR TRAIL
   A full-screen grid of square cells. Cells near the pointer light
   up lime in a ragged cluster and switch off again a moment later.
   The canvas sits on top of everything with mix-blend-mode:
   difference, so anything the cluster crosses inverts - white text
   turns blue, the dark page turns lime.

   Same effect as the grid overlay on jld2nd.dev, written fresh: one
   canvas instead of a div per cell. Only runs for a real mouse with
   motion on. Returns a destroy().
============================================================ */
const CELL = 24;          /* px */
const RADIUS = 3.2;       /* cells */
const LIFE = [260, 620];  /* ms a cell stays lit: min, max */

export function startCursorTrail(canvas, { motion }) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!motion || !fine) { canvas.style.display = 'none'; return () => {}; }

  const ctx = canvas.getContext('2d');
  const lit = new Map();            /* "col,row" -> time it switches off */
  let raf = 0, dirty = false, lastCol = -1, lastRow = -1;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dirty = true;
  }

  function stamp(col, row, now) {
    const r = Math.ceil(RADIUS);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > RADIUS) continue;
        /* solid in the middle, ragged at the edge */
        if (Math.random() > 1.15 - d / RADIUS) continue;
        lit.set((col + dx) + ',' + (row + dy), now + LIFE[0] + Math.random() * (LIFE[1] - LIFE[0]));
      }
    }
  }

  function onMove(e) {
    const col = Math.floor(e.clientX / CELL), row = Math.floor(e.clientY / CELL);
    if (col === lastCol && row === lastRow) return;     /* same cell: nothing new to light */
    lastCol = col; lastRow = row;
    stamp(col, row, performance.now());
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function draw(now) {
    raf = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ceff00';
    for (const [key, until] of lit) {
      if (until <= now) { lit.delete(key); continue; }
      const i = key.indexOf(',');
      ctx.fillRect(+key.slice(0, i) * CELL, +key.slice(i + 1) * CELL, CELL, CELL);
    }
    dirty = false;
    /* keep ticking only while something is lit, then go fully idle */
    if (lit.size) raf = requestAnimationFrame(draw);
  }

  const onLeave = () => { lastCol = lastRow = -1; };
  const onResize = () => { resize(); if (!raf && dirty) raf = requestAnimationFrame(draw); };

  resize();
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onResize);
    lit.clear();
  };
}
