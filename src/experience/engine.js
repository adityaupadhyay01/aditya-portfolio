import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createSignal } from './gl.js';
import { motionOn, onMotionChange, prefersReduced } from './motion.js';
import { KNOWN_PATHS } from '../content/routes.js';

gsap.registerPlugin(ScrollTrigger);

/* The scroll + animation engine, ported from the single-file build.
   React renders the markup; this drives it imperatively, exactly as before.
   startExperience() returns a destroy() that undoes everything, so React's
   dev double-mount never leaves two Lenis instances or two frame loops. */

/* shared with components - the Room needs Lenis to freeze the page */
export const engine = { lenis: null };

/* The chapter label reads these, and so does the command palette. Keeping
   one copy means a renamed chapter cannot go stale in the other place.
   An empty name means "show no label" - the intro is its own title. */
export const CHAPTER_NAMES = {
  intro: '', ch1: 'Curiosity', ch2: 'Discovery', ch3: 'Learning',
  ch4: 'Building', ch5: 'Failures', ch6: 'Restart', ch7: 'Today',
  transition: 'Explore →', explore: 'Explore', ending: 'The End',
};

/* dev only (stripped from production builds): lets the console inspect the
   engine the same way the old page exposed gsap and ScrollTrigger globally */
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ScrollTrigger: ScrollTrigger, __engine: engine });

let ready = false;
const waiting = new Set();
/* Run `cb` once the engine exists (now, if it already does). Returns a cancel. */
export function whenReady(cb) {
  if (ready) { cb(); return () => {}; }
  waiting.add(cb);
  return () => waiting.delete(cb);
}

export function startExperience() {
  const $ = id => document.getElementById(id);
  const body = document.body;

  /* NotFound decides what is a real path from content/routes.js, before any
     of this markup exists. This is the only place both lists are in reach,
     so it is where they get compared. Dev only - stripped from production. */
  if (import.meta.env.DEV) {
    const inDom = [...document.querySelectorAll('[data-url]')].map(el => el.dataset.url);
    const missing = inDom.filter(p => !KNOWN_PATHS.includes(p));
    const stale   = KNOWN_PATHS.filter(p => p !== '/' && !inDom.includes(p));
    if (missing.length || stale.length) {
      console.warn('[routes] KNOWN_PATHS is out of step with the chapters.',
        { notListed: missing, listedButGone: stale });
    }
  }

  /* bookkeeping so destroy() can undo everything */
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
    return t;
  };
  const offs = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    offs.push(() => target.removeEventListener(type, fn, opts));
  };
  let ctx = null;
  /* one-shot story animations are recorded so a revert can undo them */
  const rec = fn => (ctx ? ctx.add(fn) : fn());

  /* The CSS media query cannot touch GSAP or Lenis - both are JS-driven. */
  const REDUCED = !motionOn();
  /* `motion` tracks the live preference. REDUCED is only the state at
     startup; the toggle moves this one without restarting the engine, so
     the visitor keeps their scroll position. */
  let motion = !REDUCED;

  /* Built from the OS setting alone, never from the toggle: a WebGL context
     cannot be created later without a restart, so switching motion back on
     has to find the shader already there. CSS hides it while motion is off. */
  const GL = createSignal($('gl-canvas'), prefersReduced());

  const lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !REDUCED,
  });
  engine.lenis = lenis;
  /* a deep-linked room can open before the engine exists */
  if (body.classList.contains('room-open')) lenis.stop();
  /* Content still lands in its final state, it just gets there without travel. */
  gsap.globalTimeline.timeScale(REDUCED ? 80 : 1);

  /* Every effect registers a frame hook here instead of starting a
     requestAnimationFrame loop of its own - independent loops meant chances
     to be scheduled out of step with the scroll. */
  const frameTasks = [];
  let rafId = 0;
  function raf(time) {
    /* A throw inside lenis.raf() or any ScrollTrigger callback used to skip the
       re-schedule below, killing the loop for good and freezing the page. */
    try {
      lenis.raf(time);
      ScrollTrigger.update();
      if (GL && motion) GL.render(time);
      for (let i = 0; i < frameTasks.length; i++) frameTasks[i](time);
    } catch (err) {
      console.error('[frame]', err);
    }
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  const floatEls = [];
  const dustCanvas = $('dust-canvas');
  const dctx = dustCanvas.getContext('2d');
  let dustW = 0, dustH = 0, dustParticles = [];
  const vhsCv = $('vhs-canvas');
  const vctx = vhsCv.getContext('2d');

  function initDust() {
    const r = dustCanvas.parentElement.getBoundingClientRect();
    dustW = dustCanvas.width  = r.width  + 120;
    dustH = dustCanvas.height = r.height + 120;
    dustParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * dustW, y: Math.random() * dustH,
      r: 0.5 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.1 - Math.random() * 0.15,
      a: 0.1 + Math.random() * 0.3,
    }));
  }
  function resizeVhs() {
    vhsCv.width  = window.innerWidth;
    vhsCv.height = window.innerHeight;
  }

  /* ============================================================
     LIVE MOTION SWITCH
     Nothing is torn down, so the visitor keeps their scroll position.
     timeScale(80) is the same lever reduced-motion pulls: animations
     still run to their final state, they just arrive in one frame
     instead of travelling there.
  ============================================================ */
  offs.push(onMotionChange(on => {
    motion = on;
    gsap.globalTimeline.timeScale(on ? 1 : 80);
    lenis.options.smoothWheel = on;   /* Lenis reads this per wheel event */
    if (!on) {
      /* the two 2D canvases keep their last frame until something clears it */
      dctx.clearRect(0, 0, dustW, dustH);
      vctx.clearRect(0, 0, vhsCv.width, vhsCv.height);
    }
  }));

  ctx = gsap.context(() => {

    /* ============================================================
       INITIAL HIDDEN STATES (JS sets them, not CSS)
    ============================================================ */
    gsap.set('#intro-year',       { opacity: 0, y: 12 });
    gsap.set('.scroll-hint',      { opacity: 0 });
    gsap.set('.crt-line',         { opacity: 0 });
    gsap.set('.speech-bubble',    { opacity: 0, y: -8, scale: 0.92 });
    gsap.set('.ch1-headline',     { opacity: 0, y: 24 });
    gsap.set('#ch2-text',         { opacity: 0 });
    gsap.set('#ch3-headline',     { opacity: 0 });
    gsap.set('#journey-eyebrow',  { opacity: 0 });
    gsap.set('.j-entry',          { opacity: 0, x: -24 });
    gsap.set('#fail-1',           { opacity: 0 });
    gsap.set('#fail-spacer',      { opacity: 0, scaleY: 0 });
    gsap.set('#fail-2',           { opacity: 0 });
    gsap.set('#ch6-phrase',       { opacity: 0 });
    gsap.set('#terminal-window',  { opacity: 0, y: 16 });
    gsap.set('#today-eyebrow',    { opacity: 0 });
    gsap.set('.today-role',       { opacity: 0, y: 36 });
    gsap.set('#today-sub',        { opacity: 0 });
    gsap.set('#trans-1',          { opacity: 0 });
    gsap.set('#trans-sep',        { opacity: 0, scaleY: 0 });
    gsap.set('#ending-heading',   { opacity: 0, y: 30 });
    gsap.set('.ending-links',     { opacity: 0 });
    gsap.set('.ending-epilogue',  { opacity: 0 });

    /* ============================================================
       CUSTOM CURSOR
    ============================================================ */
    const cursor       = $('cursor');
    const cursorRing   = $('cursor-ring');
    const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let mx = 0, my = 0, rx = 0, ry = 0, cursorShown = false;

    /* Is the CRT chapter anywhere on screen? Parallax and dust both ask. */
    let ch1InView = false;
    ScrollTrigger.create({
      trigger: '#ch1', start: 'top bottom', end: 'bottom top',
      onToggle: self => { ch1InView = self.isActive; },
    });

    if (FINE_POINTER) {
      /* Hiding the native cursor before we have drawn a replacement would leave a
         broken page with no pointer at all, so the class goes on here. */
      body.classList.add('custom-cursor');

      on(document, 'mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!cursorShown) {
          cursorShown = true;
          rx = mx; ry = my;                    /* no swoop in from the corner */
          gsap.set(cursorRing, { x: rx, y: ry });
          body.classList.add('cursor-ready');
        }
        gsap.to(cursor, { x: mx, y: my, duration: 0.06, ease: 'none' });

        /* CRT parallax - only while the monitor is actually on screen */
        if (ch1InView) {
          gsap.to('.crt-wrap', {
            x: (mx / window.innerWidth  - 0.5) * 10,
            y: (my / window.innerHeight - 0.5) * 6,
            duration: 1.2, ease: 'power2.out', overwrite: 'auto',
          });
        }
      });

      frameTasks.push(() => {
        if (!cursorShown) return;
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
        gsap.set(cursorRing, { x: rx, y: ry });   /* transform, not left/top */
      });

      /* Delegated, so links and buttons React renders later (room tabs,
         entries) grow the cursor too - no per-element binding to forget. */
      on(document, 'mouseover', e => {
        if (e.target.closest && e.target.closest('a, button')) body.classList.add('cursor-hover');
      });
      on(document, 'mouseout', e => {
        const from = e.target.closest && e.target.closest('a, button');
        if (!from) return;
        const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('a, button') : null;
        if (to !== from) body.classList.remove('cursor-hover');
      });
    }

    /* ============================================================
       SCROLL PROGRESS
    ============================================================ */
    const progressBar = $('scroll-progress');
    lenis.on('scroll', ({ progress, velocity }) => {
      /* scaleX, not width: a width change relayouts the bar on every frame
         of every scroll, a transform only recomposites it. */
      progressBar.style.transform = `scaleX(${progress})`;
      if (GL) GL.setVelocity(velocity);
    });

    /* ============================================================
       CODE BACKDROP
    ============================================================ */
    const codeBlocks = {};
    document.querySelectorAll('.code-block').forEach(b => { codeBlocks[b.dataset.for] = b; });
    let activeCode = null;

    function setCode(name) {
      const next = codeBlocks[name] || null;
      if (next === activeCode) return;
      if (activeCode) gsap.to(activeCode, { opacity: 0, duration: 0.5, overwrite: 'auto' });
      activeCode = next;
      if (!next) return;
      gsap.set(next, { opacity: 1 });
      const lines = next.querySelectorAll('.l');
      if (REDUCED) { gsap.set(lines, { opacity: 1, x: 0 }); return; }
      /* lines write themselves in, top to bottom */
      gsap.fromTo(lines,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', overwrite: 'auto' });
    }

    /* ============================================================
       CHAPTER LABEL + HISTORY API
    ============================================================ */
    const chapterLabel = $('chapter-label');
    let lastUrl = '/';
    /* Rewriting the path throws SecurityError on opaque origins (file://, data:). */
    const canRewriteUrl = location.protocol === 'http:' || location.protocol === 'https:';
    const chapterNames = CHAPTER_NAMES;
    function updateChapter(sec) {
      const url  = sec.dataset.url;
      const name = chapterNames[sec.dataset.chapter] || '';
      if (GL) GL.setMood(sec.dataset.chapter);
      setCode(sec.dataset.chapter);
      if (name) { chapterLabel.textContent = name; chapterLabel.classList.add('visible'); }
      else chapterLabel.classList.remove('visible');
      /* while a room is open the URL belongs to its #hash */
      if (url && url !== lastUrl && !body.classList.contains('room-open')) {
        lastUrl = url;
        if (canRewriteUrl) {
          try { history.replaceState(null, '', url); } catch { /* opaque origin */ }
        }
      }
    }
    document.querySelectorAll('[data-chapter]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 45%',
        onEnter: () => updateChapter(sec),
        onEnterBack: () => updateChapter(sec),
      });
    });

    /* ============================================================
       SKIP INTRO - story and explore are siblings
    ============================================================ */
    const skipBtn = $('skip-intro');
    ScrollTrigger.create({
      trigger: '#ch1', start: 'top 80%',
      onEnter:     () => skipBtn.classList.add('visible'),
      onLeaveBack: () => skipBtn.classList.remove('visible'),
    });
    on(skipBtn, 'click', () => lenis.scrollTo('#explore', { duration: 1.6 }));

    /* ============================================================
       EXPLORE - reveal the hub the same way the rest of the page reveals
    ============================================================ */
    gsap.fromTo('.explore-heading', { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#explore', start: 'top 72%', toggleActions: 'play none none none' },
    });
    gsap.fromTo('.door', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.explore-doors', start: 'top 85%', toggleActions: 'play none none none' },
    });

    /* ============================================================
       AMBIENT LIGHT (warms when CRT chapter is in view)
    ============================================================ */
    /* overwrite: flying past a section fires enter and leave in one tick; without it
       the longer fade-in outlived the fade-out and the glow stayed stuck on. */
    const ambientLight = $('ambient-light');
    ScrollTrigger.create({
      trigger: '#ch1', start: 'top 60%', end: 'bottom 40%',
      onEnter:     () => gsap.to(ambientLight, { opacity: 1, duration: 1.8, overwrite: true }),
      onLeave:     () => gsap.to(ambientLight, { opacity: 0, duration: 1.2, overwrite: true }),
      onEnterBack: () => gsap.to(ambientLight, { opacity: 1, duration: 1.8, overwrite: true }),
      onLeaveBack: () => gsap.to(ambientLight, { opacity: 0, duration: 1.2, overwrite: true }),
    });

    /* ============================================================
       DUST PARTICLES (canvas, ch1 only)
    ============================================================ */
    initDust();
    let dustRevealed = false;
    ScrollTrigger.create({
      trigger: '#ch1', start: 'top 65%', once: true,
      onEnter: () => {
        dustRevealed = true;
        rec(() => gsap.to(dustCanvas, { opacity: 1, duration: 2.5 }));
      },
    });
    frameTasks.push(() => {
      if (!dustRevealed || !ch1InView || !motion) return;   /* nothing to draw for off-screen dust */
      dctx.clearRect(0, 0, dustW, dustH);
      dustParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = dustH + 5; p.x = Math.random() * dustW; }
        if (p.x < -5) p.x = dustW + 5;
        if (p.x > dustW + 5) p.x = -5;
        dctx.beginPath();
        dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        dctx.fillStyle = `rgba(180,200,160,${p.a})`;
        dctx.fill();
      });
    });

    /* ============================================================
       VHS GLITCH (ch5 failures)
    ============================================================ */
    let vhsActive = false;
    resizeVhs();
    ScrollTrigger.create({
      trigger: '#ch5', start: 'top 60%', end: 'bottom 40%',
      onEnter:     () => { vhsActive = true;  gsap.to(vhsCv, { opacity: 1, duration: 0.6, overwrite: true }); },
      onLeave:     () => { vhsActive = false; gsap.to(vhsCv, { opacity: 0, duration: 0.4, overwrite: true }); },
      onEnterBack: () => { vhsActive = true;  gsap.to(vhsCv, { opacity: 1, duration: 0.6, overwrite: true }); },
      onLeaveBack: () => { vhsActive = false; gsap.to(vhsCv, { opacity: 0, duration: 0.4, overwrite: true }); },
    });
    frameTasks.push(() => {
      if (vhsActive && motion && Math.random() < 0.06) {
        const W = vhsCv.width, H = vhsCv.height;
        vctx.clearRect(0, 0, W, H);
        const lines = Math.floor(1 + Math.random() * 3);
        for (let i = 0; i < lines; i++) {
          const y = Math.random() * H;
          const h = 1 + Math.random() * 3;
          const x = (Math.random() - 0.5) * 24;
          vctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
          vctx.fillRect(x, y, W, h);
        }
        later(() => vctx.clearRect(0, 0, W, H), 60 + Math.random() * 80);
      }
    });

    /* ============================================================
       INTRO ANIMATION
    ============================================================ */
    gsap.to('#intro-year',  { opacity: 1, y: 0, duration: 1.8, delay: 0.35, ease: 'power3.out' });
    gsap.to('.scroll-hint', { opacity: 1, duration: 1, delay: 2.2, ease: 'power2.out' });

    /* ============================================================
       CH1 - CURIOSITY
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch1', start: 'top 65%', once: true,
      onEnter: () => rec(() => {
        // CRT lines appear one by one
        ['crt-l1', 'crt-l2', 'crt-l3', 'crt-l4', 'crt-l5'].forEach((id, i) => {
          gsap.to('#' + id, { opacity: 1, duration: 0.01, delay: 0.3 + i * 0.25 });
        });
        // CRT flicker starts after lines appear
        later(() => $('crt-monitor').classList.add('flickering'), 1600);
        // Speech bubble pops in
        gsap.to('.speech-bubble', { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 1.1, ease: 'back.out(1.5)' });
        // Headline
        gsap.to('.ch1-headline', { opacity: 1, y: 0, duration: 1.2, delay: 1.3, ease: 'power3.out' });
      }),
    });

    /* ============================================================
       CH2 - DISCOVERY
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch2', start: 'top 65%', once: true,
      onEnter: () => rec(() => gsap.to('#ch2-text', { opacity: 1, duration: 2.4, ease: 'power2.out' })),
    });

    /* ============================================================
       CH3 - LEARNING (floating code tags)
    ============================================================ */
    const floatTags = [
      'HTML', 'CSS', 'JavaScript', './src', 'index.html', 'VS Code',
      'Terminal', 'npm i', 'Chrome', 'Git', '<!DOCTYPE>', ':3000',
      'const', '.catch()', 'async/await', 'fetch()', '404', 'git push',
    ];
    const floatField = $('float-field');
    floatTags.forEach(tag => {
      const el = document.createElement('div');
      el.className   = 'float-tag';
      el.textContent = tag;
      el.style.left  = (6 + Math.random() * 84) + '%';
      el.style.top   = (6 + Math.random() * 84) + '%';
      floatField.appendChild(el);
      floatEls.push(el);
      gsap.set(el, { opacity: 0 });
    });
    ScrollTrigger.create({
      trigger: '#ch3', start: 'top 70%', once: true,
      onEnter: () => rec(() => {
        floatEls.forEach((el, i) => {
          gsap.to(el, {
            opacity: 0.12 + Math.random() * 0.2,
            duration: 1.6 + Math.random() * 0.8,
            delay: i * 0.07,
            ease: 'power2.out',
          });
          gsap.to(el, {
            y: '+=18', x: (Math.random() - 0.5) * 28,
            duration: 5 + Math.random() * 5,
            repeat: -1, yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 4,
          });
        });
        gsap.to('#ch3-headline', { opacity: 1, duration: 1.4, delay: 0.5, ease: 'power3.out' });
      }),
    });

    /* ============================================================
       CH4 - BUILDING (staggered emotional chapters)
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch4', start: 'top 70%', once: true,
      onEnter: () => rec(() => {
        gsap.to('#journey-eyebrow', { opacity: 1, duration: 0.9, ease: 'power2.out' });
        document.querySelectorAll('.j-entry').forEach((el, i) => {
          gsap.to(el, { opacity: 1, x: 0, duration: 1, delay: 0.2 + i * 0.28, ease: 'power3.out' });
        });
      }),
    });

    /* ============================================================
       CH5 - FAILURES
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch5', start: 'top 65%', once: true,
      onEnter: () => rec(() => {
        gsap.to('#fail-1', { opacity: 1, duration: 2, ease: 'power2.out' });
        gsap.to('#fail-spacer', {
          opacity: 1, scaleY: 1, duration: 1.2, delay: 1.4,
          ease: 'power3.out', transformOrigin: 'top',
        });
        gsap.to('#fail-2', { opacity: 1, duration: 1.8, delay: 2.2, ease: 'power2.out' });
      }),
    });

    /* ============================================================
       CH6 - RESTART (terminal typing)
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch6', start: 'top 65%', once: true,
      onEnter: () => {
        rec(() => {
          gsap.to('#ch6-phrase',      { opacity: 1, duration: 2, ease: 'power2.out' });
          gsap.to('#terminal-window', { opacity: 1, y: 0, duration: 1, delay: 1.3, ease: 'power3.out' });
        });

        const cmdEl      = $('term-cmd');
        const outputEl   = $('term-output');
        const termCursor = $('term-cursor');
        const cmd        = 'npm create vite@latest';
        let idx = 0;

        function typeChar() {
          if (idx < cmd.length) {
            cmdEl.textContent += cmd[idx++];
            later(typeChar, 55 + Math.random() * 45);
          } else {
            later(() => {
              termCursor.style.display = 'none';
              [
                { cls: 't-output',  text: '✔ Project name: my-app' },
                { cls: 't-output',  text: '✔ Framework: React' },
                { cls: 't-output',  text: '' },
                { cls: 't-success', text: 'Scaffolding project in ./my-app...' },
                { cls: 't-success', text: 'Done. Now run: cd my-app && npm install' },
              ].forEach((line, i) => {
                later(() => {
                  const row = document.createElement('div');
                  row.className   = line.cls;
                  row.textContent = line.text;
                  outputEl.appendChild(row);
                }, i * 220);
              });
            }, 500);
          }
        }
        later(typeChar, 1700);
      },
    });

    /* ============================================================
       CH7 - TODAY
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ch7', start: 'top 65%', once: true,
      onEnter: () => rec(() => {
        gsap.to('#today-eyebrow', { opacity: 1, duration: 0.8, ease: 'power2.out' });
        ['tr-0', 'tr-1', 'tr-2', 'tr-3', 'tr-4'].forEach((id, i) => {
          gsap.to('#' + id, { opacity: 1, y: 0, duration: 1.1, delay: 0.1 + i * 0.16, ease: 'power3.out' });
        });
        gsap.to('#today-sub', { opacity: 1, duration: 1, delay: 1.2, ease: 'power2.out' });
      }),
    });

    /* ============================================================
       TRANSITION
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#transition', start: 'top 65%', once: true,
      onEnter: () => rec(() => {
        gsap.to('#trans-1',   { opacity: 1, duration: 1.6, ease: 'power2.out' });
        gsap.to('#trans-sep', { opacity: 1, scaleY: 1, duration: 1, delay: 0.9, ease: 'power3.out', transformOrigin: 'top' });
      }),
    });

    /* ============================================================
       ENDING
    ============================================================ */
    ScrollTrigger.create({
      trigger: '#ending', start: 'top 65%', once: true,
      onEnter: () => rec(() => {
        gsap.to('#ending-heading',   { opacity: 1, y: 0, duration: 1.4, delay: 0.2, ease: 'power3.out' });
        gsap.to('.ending-links',     { opacity: 1, duration: 1, delay: 0.8, ease: 'power2.out' });
        gsap.to('.ending-epilogue',  { opacity: 1, duration: 1.2, delay: 1.4, ease: 'power2.out' });
      }),
    });
  });

  /* ============================================================
     RESIZE
  ============================================================ */
  const COARSE = window.matchMedia('(pointer: coarse)').matches;
  let resizeTimer = null, lastW = window.innerWidth;
  on(window, 'resize', () => {
    /* On phones the URL bar sliding away fires resize with an unchanged width.
       A full ScrollTrigger.refresh() on every one of those is pure jank. */
    if (COARSE && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    timers.delete(resizeTimer);
    resizeTimer = later(() => {
      resizeVhs();
      initDust();        // dust canvas was keeping its old backing store
      ScrollTrigger.refresh();
    }, 180);
  });

  /* A page opened in a BACKGROUND tab lays out at the wrong size (or not at all),
     so every trigger position is measured against a stale document. Re-measure
     the first time the page actually becomes visible. */
  on(document, 'visibilitychange', () => {
    if (!document.hidden) ScrollTrigger.refresh();
  });

  ready = true;
  waiting.forEach(cb => cb());
  waiting.clear();

  return function destroy() {
    ready = false;
    cancelAnimationFrame(rafId);
    timers.forEach(clearTimeout);
    timers.clear();
    offs.forEach(off => off());
    ctx.revert();                         // ScrollTriggers, sets, recorded tweens
    lenis.destroy();
    if (engine.lenis === lenis) engine.lenis = null;
    if (GL) GL.destroy();
    gsap.globalTimeline.timeScale(1);

    /* DOM this engine wrote outside GSAP's records. Every lookup is
       optional: going Back from /kahani to the landing removes the story's
       markup BEFORE React runs this cleanup, and a throw here took the whole
       app down with it. Only the dev double-mount ever left it in place. */
    floatEls.forEach(el => el.remove());
    body.classList.remove('custom-cursor', 'cursor-ready', 'cursor-hover');
    const label = $('chapter-label');
    if (label) { label.textContent = ''; label.classList.remove('visible'); }
    $('scroll-progress')?.style.removeProperty('transform');
    $('skip-intro')?.classList.remove('visible');
    $('crt-monitor')?.classList.remove('flickering');
    const cmd = $('term-cmd');
    if (cmd) cmd.textContent = '';
    $('term-output')?.replaceChildren();
    $('term-cursor')?.style.removeProperty('display');
    document.querySelectorAll(
      '.code-block, .code-block .l, #ambient-light, #vhs-canvas, #dust-canvas, #cursor, #cursor-ring, .crt-wrap'
    ).forEach(el => el.removeAttribute('style'));
    vctx.clearRect(0, 0, vhsCv.width, vhsCv.height);
    dctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
  };
}
