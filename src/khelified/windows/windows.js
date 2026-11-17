import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROMPT } from '../content.js';
import { sfx } from '../sound.js';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   RETRO OS WINDOW CASCADE
   Ported from jld2nd.dev (with the author's permission). What the
   source does, and what this does too:
   - the last window (the prompt) sits dead centre; the others step
     down and across in a diagonal, at most 60px x 80px a step, the
     whole group centred under the header
   - each window wipes open top to bottom in six hard steps as the
     section scrolls by (clip-path + steps(6), scrubbed)
   - title bars can be dragged
   - No / the prompt's close button: ACCESS DENIED for 1.5s
   - Yes: ACCESS GRANTED, a 12-cell progress bar, then navigate

   Two details are mine, not the source's: the exact red of the
   denied title bars (the source reads it from a minified variable
   I could not trace) and the shape of the denied shake.
============================================================ */

const CLOSED = 'inset(-8px -8px calc(100% + 8px) -8px)';   /* -8px keeps the pixel border */
const OPEN   = 'inset(-8px -8px -8px -8px)';

export function startWindows({ section, desktop, headerEl, motion }) {
  const wins = [...desktop.querySelectorAll('.kf-window')];
  const prompt = wins[wins.length - 1];
  const bars = () => [...desktop.querySelectorAll('.kf-window-bar')];
  const offs = [];
  const on = (t, type, fn, opts) => { t.addEventListener(type, fn, opts); offs.push(() => t.removeEventListener(type, fn, opts)); };

  /* ---------- layout (source: positionWindows) ---------- */
  const size = el => ({ w: el.offsetWidth, h: el.offsetHeight || 150 });
  function layout() {
    const W = desktop.clientWidth, H = desktop.clientHeight;
    const p = size(prompt);
    prompt.style.left = `${Math.max(0, (W - p.w) / 2)}px`;
    prompt.style.top  = `${Math.max(0, (H - p.h) / 2)}px`;

    const top = (headerEl ? headerEl.getBoundingClientRect().height : 0) + 12;
    const rest = wins.slice(0, -1);
    const sizes = rest.map(size);
    const maxW = Math.max(...sizes.map(s => s.w));
    const maxH = Math.max(...sizes.map(s => s.h));
    const gaps = Math.max(1, rest.length - 1);
    const stepX = Math.min(60, Math.max(0, (W - maxW) / gaps));
    const stepY = Math.min(80, Math.max(0, (H - top - maxH - 12) / gaps));
    const x0 = Math.max(0, (W - (maxW + gaps * stepX)) / 2);
    const y0 = top + Math.max(0, (H - top - 12 - (maxH + gaps * stepY)) / 2);
    rest.forEach((el, i) => {
      el.style.left = `${x0 + i * stepX}px`;
      el.style.top  = `${y0 + i * stepY}px`;
    });
  }
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(desktop);

  /* ---------- drag by the title bar ----------
     The source listens for mouse events only; pointer events cover touch
     as well, and touch-action:none on the bar stops the page scrolling
     underneath the finger. */
  let dragging = null, dx = 0, dy = 0;
  wins.forEach(win => {
    const bar = win.querySelector('.kf-window-bar');
    on(bar, 'pointerdown', e => {
      if (e.target.closest('button')) return;         /* the close box is not a handle */
      dragging = win;
      dx = e.clientX - (parseFloat(win.style.left) || 0);
      dy = e.clientY - (parseFloat(win.style.top) || 0);
      win.style.zIndex = 1000;
      bar.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
  });
  on(document, 'pointermove', e => {
    if (!dragging) return;
    dragging.style.left = `${e.clientX - dx}px`;
    dragging.style.top  = `${e.clientY - dy}px`;
  });
  on(document, 'pointerup', () => { if (dragging) { dragging.style.zIndex = 1; dragging = null; } });

  /* ---------- scroll reveal ---------- */
  let tl = null;
  if (motion) {
    gsap.set(wins, { clipPath: CLOSED });
    tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    });
    tl.fromTo(wins, { clipPath: CLOSED }, { clipPath: OPEN, duration: 0.1, ease: 'steps(6)', stagger: 0.1 }, 0);
  } else {
    gsap.set(wins, { clipPath: OPEN });              /* motion off: everything simply there */
  }

  /* ---------- the prompt ---------- */
  const textEl  = prompt.querySelector('.kf-window-text');
  const labelEl = prompt.querySelector('.kf-window-label');
  const actions = prompt.querySelector('.kf-window-actions');
  const content = prompt.querySelector('.kf-window-content');
  const original = { text: textEl.textContent, label: labelEl.textContent };
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };

  function deny(e, closing = false) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    sfx('deny');
    textEl.textContent  = closing ? PROMPT.cantClose : PROMPT.denied;
    labelEl.textContent = PROMPT.deniedLabel;
    gsap.set(bars(), { backgroundColor: 'var(--kf-secondary)' });
    const shake = gsap.timeline({
      onComplete: () => later(() => {
        textEl.textContent  = original.text;
        labelEl.textContent = original.label;
        gsap.set(bars(), { clearProps: 'backgroundColor' });
        busy = false;
      }, 1500),
    });
    if (motion) {
      shake.to(desktop, { x: -6, duration: 0.05, ease: 'steps(1)' })
           .to(desktop, { x: 6,  duration: 0.05, ease: 'steps(1)' })
           .to(desktop, { x: -4, duration: 0.05, ease: 'steps(1)' })
           .to(desktop, { x: 0,  duration: 0.05, ease: 'steps(1)' });
    }
    shake.to({}, { duration: 0.5 });
  }

  function grant(e) {
    e.preventDefault();
    if (busy) return;
    busy = true;
    sfx('grant');
    const href = e.currentTarget.getAttribute('href');
    textEl.textContent  = PROMPT.granted;
    labelEl.textContent = PROMPT.grantedLabel;
    actions.style.display = 'none';
    const bar = document.createElement('div');
    bar.className = 'kf-progress';
    bar.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 12; i++) bar.appendChild(document.createElement('i'));
    content.append(bar);
    const go = () => { window.location.href = href; };
    if (!motion) { go(); return; }
    gsap.timeline({ onComplete: go })
      .to(bars(), { backgroundColor: 'var(--kf-lime)', color: 'var(--kf-ink)', duration: 0.01, stagger: { each: 0.05, from: 'end' } }, 0)
      .to(desktop, { y: -6, duration: 0.08, yoyo: true, repeat: 1, ease: 'steps(2)' }, 0)
      .to(bar.children, { opacity: 1, duration: 0.01, stagger: 0.06, ease: 'none' }, 0.3)
      .to({}, { duration: 0.25 });
  }

  on(prompt.querySelector('.kf-no'), 'click', e => deny(e));
  on(prompt.querySelector('.kf-yes'), 'click', grant);
  on(prompt.querySelector('.kf-window-close'), 'click', e => { e.stopPropagation(); deny(e, true); });

  return function destroy() {
    offs.forEach(off => off());
    ro.disconnect();
    timers.forEach(clearTimeout);
    if (tl) { tl.scrollTrigger?.kill(); tl.kill(); }
    gsap.killTweensOf([desktop, ...wins, ...bars()]);
    gsap.set([desktop, ...wins, ...bars()], { clearProps: 'all' });
  };
}
