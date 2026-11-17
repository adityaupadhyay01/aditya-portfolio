import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Scroll and timer behaviour for the hero, player card and tetris sections.
   Everything moves in hard steps - steps() eases, no tweened fades - which
   is most of what makes the page read as 8-bit. Returns a destroy(). */
export function startSections(root, { greetings, motion }) {
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const q = sel => root.querySelector(sel);

  /* ---------- loader ---------- */
  const loader = q('.kf-loader');
  if (!motion) loader.remove();
  else later(() => { loader.classList.add('is-done'); later(() => loader.remove(), 500); }, 1300);

  /* ---------- greeting: type, hold, erase, next ---------- */
  const greet = q('.kf-greet-text');
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter
    ? s => Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), x => x.segment)
    : s => Array.from(s);                       /* Devanagari must not be split mid-cluster */
  function show(i, n) {
    const g = greetings[i];
    greet.lang = g.lang || 'en';
    greet.textContent = seg(g.t).slice(0, n).join('');
  }
  if (!motion) {
    greet.textContent = greetings.slice(0, 2).map(g => g.t).join(', ');
  } else {
    let i = 0;
    const run = () => {
      const len = seg(greetings[i].t).length;
      let n = 0;
      const type = () => {
        show(i, ++n);
        if (n < len) later(type, 100);
        else later(erase, 1000);
      };
      const erase = () => {
        show(i, --n);
        if (n > 0) later(erase, 60);
        else { i = (i + 1) % greetings.length; later(run, 200); }
      };
      type();
    };
    later(run, 1500);
  }

  /* ---------- scroll ---------- */
  const ctx = gsap.context(() => {
    if (!motion) return;

    gsap.from('.kf-hero-headline .kf-word', {
      opacity: 0, duration: 0.01, stagger: 0.12, delay: 1.5, ease: 'none',
    });

    gsap.from('.kf-stat', {
      clipPath: 'inset(0 100% 0 0)', duration: 0.4, ease: 'steps(8)', stagger: 0.15,
      scrollTrigger: { trigger: '.kf-player', start: 'top 65%' },
    });
    gsap.from('.kf-heart', {
      opacity: 0, duration: 0.01, stagger: 0.18,
      scrollTrigger: { trigger: '.kf-player', start: 'top 65%' },
    });

    /* tetris: pieces drop one after another as the section scrolls by */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.kf-tetris', start: 'top top', end: 'bottom bottom', scrub: true },
    });
    root.querySelectorAll('.kf-piece').forEach((p, i) => {
      tl.from(p, { y: () => -window.innerHeight, duration: 1, ease: 'steps(14)' }, i * 0.8);
    });
    tl.from('.kf-cta-copy > *', { opacity: 0, duration: 0.01, stagger: 0.25 }, '>-0.2');
  }, root);

  return () => {
    timers.forEach(clearTimeout);
    ctx.revert();
  };
}
