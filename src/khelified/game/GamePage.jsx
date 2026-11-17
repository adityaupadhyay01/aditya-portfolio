import { useEffect, useRef, useState } from 'react';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '../khelified.css';
import '../chrome.css';
import './game.css';
import { createRunner, readBest } from './runner.js';
import SoundToggle from '../SoundToggle.jsx';
import { sfx } from '../sound.js';

/* /khelified/game — Keeda Bhag. Its own lazy chunk (see App.jsx). */
export default function GamePage() {
  const canvasRef = useRef(null);
  const api = useRef(null);
  const toastTimer = useRef(0);
  /* { text, n }: n changes on every pickup, so two in a row replay the pop */
  const [toast, setToast] = useState(null);
  const [s, setS] = useState({ started: false, over: false, score: 0, best: readBest(), cooldown: 0, ammo: 6, boss: null, error: null });

  useEffect(() => {
    const prev = document.title;
    document.title = 'Keeda Bhag — adithegreat';
    document.body.classList.add('kf-page');
    api.current = createRunner(canvasRef.current, {
      onState: setS,
      sfx,
      onPickup: kind => {
        setToast(t => ({ text: kind === 'chai' ? 'Chai mil gayi! Debug ready.' : 'Goliyan full!', n: (t ? t.n : 0) + 1 }));
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 1600);
      },
    });
    return () => {
      api.current.destroy();
      clearTimeout(toastTimer.current);
      document.title = prev;
      document.body.classList.remove('kf-page');
    };
  }, []);

  const ready = s.cooldown === 0;

  return (
    <div className="kf kg">
      <a className="kf-logo" href="/khelified" aria-label="adithegreat, back to khelified">ADITHEGREAT</a>

      <nav className="kf-dock" aria-label="Sound"><SoundToggle /></nav>

      <main className="kg-main">
        <h1 className="sr-only">Keeda Bhag, a small running game</h1>

        <div className="kg-hud" aria-live="off">
          <p>Debug <b>{ready ? 'Ready' : s.cooldown + 's'}</b></p>
          <p>Ammo <b className={s.ammo ? undefined : 'kg-pink'}>{s.ammo}</b></p>
          {s.boss && <p>Boss <b className="kg-pink">{s.boss.hp}/{s.boss.max}</b></p>}
          <p>Score <b>{s.score}</b></p>
          <p>Best <b>{s.best}</b></p>
        </div>

        <div className="kg-stage kf-box-pixel">
          <canvas ref={canvasRef} className="kg-canvas" role="img"
                  aria-label="Keeda Bhag. Space to jump, D to debug, F to fire." />
          {toast && <p className="kg-toast" key={toast.n} role="status">{toast.text}</p>}
          {(!s.started || s.over) && (
            <div className="kg-overlay" role="status">
              <p className="kg-title">{s.over ? (s.error ? s.error[0] : 'Crashed') : 'Keeda Bhag'}</p>
              {s.over && s.error && <p className="kg-hint">{s.error[1]}</p>}
              {s.over && <p className="kg-sub">Score {s.score} · Best {s.best}</p>}
              <button type="button" className="kf-btn kf-btn-secondary" onClick={() => api.current.jump()}>
                {s.over ? 'Run again' : 'Click to start'}
              </button>
            </div>
          )}
        </div>

        <div className="kg-pad">
          <button type="button" className="kf-btn kf-btn-light" onClick={() => api.current.jump()}>Jump</button>
          <button type="button" className="kf-btn kf-btn-light" disabled={!ready} onClick={() => api.current.power()}>Debug</button>
          <button type="button" className="kf-btn kf-btn-light" disabled={!s.ammo} onClick={() => api.current.fire()}>Fire</button>
        </div>

        <ul className="kg-tips">
          <li><kbd>Space</kbd> jump the bugs: white ones sit still, lime ones hop (go under at the top), purple ones blink and charge</li>
          <li>Blue flyers hit jumpers. Stay on the ground for those.</li>
          <li><kbd>D</kbd> debug: deletes the pink wall bugs, then recharges for 2 seconds</li>
          <li><kbd>F</kbd> fire: kills any bug, but not the pink walls. Six bullets; the gold bullet refills them all</li>
          <li>Every 500 points a red boss walks in. Only bullets hurt it. Shoot until it drops.</li>
          <li>The orange cup is chai: grab it to recharge Debug at once. It speeds up every 5 seconds.</li>
        </ul>

        <a className="kg-back" href="/khelified">← back to khelified</a>
      </main>
    </div>
  );
}
