import { useEffect, useRef, useState } from 'react';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '../khelified.css';
import '../chrome.css';
import './game.css';
import { createRunner, readBest } from './runner.js';
import SoundToggle from '../SoundToggle.jsx';
import { sfx } from '../sound.js';

/* /khelified/game — Bug Run. Its own lazy chunk (see App.jsx). */
export default function GamePage() {
  const canvasRef = useRef(null);
  const api = useRef(null);
  const [s, setS] = useState({ started: false, over: false, score: 0, best: readBest(), cooldown: 0 });

  useEffect(() => {
    const prev = document.title;
    document.title = 'Bug Run — adithegreat';
    document.body.classList.add('kf-page');
    api.current = createRunner(canvasRef.current, { onState: setS, sfx });
    return () => {
      api.current.destroy();
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
        <h1 className="sr-only">Bug Run, a small running game</h1>

        <div className="kg-hud" aria-live="off">
          <p>Debug <b>{ready ? 'Ready' : s.cooldown + 's'}</b></p>
          <p>Score <b>{s.score}</b></p>
          <p>Best <b>{s.best}</b></p>
        </div>

        <div className="kg-stage kf-box-pixel">
          <canvas ref={canvasRef} className="kg-canvas" role="img"
                  aria-label="Bug Run. Space to jump, D to debug." />
          {(!s.started || s.over) && (
            <div className="kg-overlay" role="status">
              <p className="kg-title">{s.over ? 'Segfault.' : 'Bug Run'}</p>
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
        </div>

        <ul className="kg-tips">
          <li><kbd>Space</kbd> jump over the small bugs</li>
          <li><kbd>D</kbd> debug: deletes the pink wall bugs, then recharges for 2 seconds</li>
          <li>Grab the chai to recharge at once. It speeds up every 5 seconds.</li>
        </ul>

        <a className="kg-back" href="/khelified">← back to khelified</a>
      </main>
    </div>
  );
}
