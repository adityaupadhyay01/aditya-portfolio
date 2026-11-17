import { useEffect, useRef, useState } from 'react';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './khelified.css';
import './chrome.css';
import WindowCascade from './windows/WindowCascade.jsx';
import Pixel, { ART, BUST } from './Pixel.jsx';
import { CTA, HERO, PLAYER } from './content.js';
import { startSections } from './sections.js';
import { startCursorTrail } from './cursor.js';
import SoundToggle from './SoundToggle.jsx';
import { sfx } from './sound.js';
import { LANDING } from '../content/landing.js';
import { LINKS } from '../content/links.js';
import { ROOMS } from '../content/rooms.js';
import { motionOn } from '../experience/motion.js';

/* Five blocks that land as two full rows. [col, row] cells, row 0 on top. */
const PIECES = [
  { c: 'lime',  cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  { c: 'pink',  cells: [[4, 0], [5, 0], [4, 1], [5, 1]] },
  { c: 'lime',  cells: [[6, 0], [6, 1], [7, 1], [8, 1]] },
  { c: 'white', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { c: 'white', cells: [[7, 0], [8, 0], [9, 0], [9, 1]] },
];

const SECTIONS = [
  ['kf-hero', 'Start'],
  ['kf-player', 'Player'],
  ['kf-windows', 'System'],
  ['kf-tetris', 'Contact'],
];

/* /khelified — the 8-bit version of the site. Lazy-loaded from App.jsx.
   The composition follows jld2nd.dev (centre logo, avatar with a speech
   bubble, mode select, icon dock, section rail); the words, the pixel art
   and the code are this site's own. */
export default function Khelified() {
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const trailRef = useRef(null);
  const [hasAvatar, setHasAvatar] = useState(true);
  const [mode, setMode] = useState(0);
  const [active, setActive] = useState(0);
  const email = LINKS.find(l => l.icon === 'mail');
  const modes = Object.entries(ROOMS);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Khelified — Aditya Upadhyay';
    document.body.classList.add('kf-page');
    const destroy = startSections(rootRef.current, { greetings: HERO.greetings, motion: motionOn() });
    const stopTrail = startCursorTrail(trailRef.current, { motion: motionOn() });
    return () => {
      destroy();
      stopTrail();
      document.title = prevTitle;
      document.body.classList.remove('kf-page');
    };
  }, []);

  /* which section the rail's marker sits beside */
  useEffect(() => {
    const els = SECTIONS.map(([c]) => rootRef.current.querySelector('.' + c));
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let idx = 0;
      els.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= mid) idx = i; });
      setActive(idx);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = i => (sfx('open'), rootRef.current.querySelector('.' + SECTIONS[i][0])
    ?.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto' }));

  /* The mode list works like a game menu: up/down move, Enter opens.
     Focus follows the arrows only - hovering must not steal focus. */
  function onModeKey(e) {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (mode + step + modes.length) % modes.length;
    setMode(next);
    sfx('blip');
    e.currentTarget.querySelectorAll('.kf-mode')[next]?.focus();
  }

  return (
    <div className="kf" ref={rootRef}>
      <canvas className="kf-trail" ref={trailRef} aria-hidden="true" />

      <div className="kf-loader" aria-hidden="true">
        <Pixel rows={ART.lt} size={8} />
        <Pixel rows={ART.slash} size={8} className="kf-lime" />
        <Pixel rows={ART.gt} size={8} />
      </div>

      <a className="kf-logo" href="/khelified" ref={logoRef} aria-label="adithegreat, khelified">ADITHEGREAT</a>

      <nav className="kf-dock" aria-label="Shortcuts">
        <SoundToggle />
        <a href="/kahani" title="The documentary" aria-label="The documentary"><Pixel rows={ART.book} size={4} /></a>
        <a href="/khelified/game" title="Play Keeda Bhag" aria-label="Play Keeda Bhag"><Pixel rows={ART.pad} size={4} /></a>
        <a href="/kahani/explore" title="Explore rooms" aria-label="Explore rooms"><Pixel rows={ART.door} size={4} /></a>
        {email && <a href={email.href} title="Email" aria-label="Email"><Pixel rows={ART.mail} size={4} /></a>}
      </nav>

      <nav className="kf-rail" aria-label="Sections">
        {SECTIONS.map(([, label], i) => (
          <button key={label} type="button" className="kf-rail-dot" data-on={i === active}
                  aria-label={label} aria-current={i === active ? 'true' : undefined} onClick={() => jump(i)}>
            {i === active ? <Pixel rows={ART.ship} size={4} /> : <span />}
          </button>
        ))}
      </nav>

      <main>
        <section className="kf-hero">
          <div className="kf-hero-avatar">
            <p className="kf-bubble kf-box-pixel" aria-hidden="true">
              <span className="kf-greet-text" /><span className="kf-caret" />
            </p>
            {hasAvatar
              ? <img className="kf-bust" src={LANDING.avatar} alt="" onError={() => setHasAvatar(false)} />
              : <Pixel className="kf-bust" rows={BUST.rows} palette={BUST.palette} size={0} />}
          </div>

          <div className="kf-hero-copy">
            <h1 className="kf-hero-headline">
              <span className="sr-only">Aditya Upadhyay. </span>
              {HERO.headline.split(' ').map((w, i) => <span className="kf-word" key={i}>{w} </span>)}
            </h1>
            <p className="kf-lead">{PLAYER.stats.slice(0, 3).map(s => s[1]).join(' · ')}</p>

            <div className="kf-modes" role="group" aria-label="Choose which Aditya to explore" onKeyDown={onModeKey}>
              {modes.map(([key, room], i) => (
                <a key={key} className="kf-mode" data-on={i === mode} href={'/kahani#' + key}
                   tabIndex={i === mode ? 0 : -1}
                   onMouseEnter={() => { if (i !== mode) sfx('blip'); setMode(i); }} onFocus={() => setMode(i)}
                   onClick={() => sfx('select')}>
                  <Pixel rows={ART.play} size={4} className="kf-mode-arrow" />
                  {room.title} Mode
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="kf-player" aria-labelledby="kf-player-title">
          <div className="kf-card kf-box-pixel">
            <div className="kf-card-body">
              <p className="kf-card-eyebrow">Player 1</p>
              <h2 id="kf-player-title" className="kf-card-name">{PLAYER.name}</h2>
              <p className="kf-hearts" aria-hidden="true">
                {[0, 1, 2].map(i => <Pixel key={i} rows={ART.heart} size={3} className="kf-heart" />)}
              </p>
              <dl className="kf-stats">
                {PLAYER.stats.map(([k, v]) => (
                  <div className="kf-stat" key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <WindowCascade headerRef={logoRef} />

        <section className="kf-tetris" aria-labelledby="kf-cta-title">
          <div className="kf-tetris-stage">
            <div className="kf-cta-copy">
              <h2 id="kf-cta-title">{CTA.title}</h2>
              <p>{CTA.line}</p>
              {email && <a className="kf-btn kf-btn-secondary" href={email.href}>{CTA.button}</a>}
            </div>
            <div className="kf-board" aria-hidden="true">
              {PIECES.map((p, i) => (
                <div className={'kf-piece kf-' + p.c} key={i}>
                  {p.cells.map(([x, y]) => <i key={x + '-' + y} style={{ '--x': x, '--y': y }} />)}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="kf-foot">
        <p>
          Design language after{' '}
          <a href="https://jld2nd.dev" target="_blank" rel="noopener noreferrer">JLD&rsquo;2nd</a>
          {' '}by James Lee II, with permission.
        </p>
        <a href="/kahani">Back to the documentary</a>
      </footer>
    </div>
  );
}
