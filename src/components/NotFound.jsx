import { useEffect, useRef, useState } from 'react';
import { motionOn, onMotionChange } from '../experience/motion.js';

/* The page that should not exist. Every unknown path serves index.html
   (see public/_redirects), so this is where a dead link lands.

   The game is imported only when this component mounts, so none of it
   is in the bundle a normal visitor downloads. */
export default function NotFound({ path }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [state, setState] = useState({ score: 0, over: false, won: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let offMotion = () => {};

    import('../game/invaders.js').then(({ createInvaders }) => {
      if (cancelled || !canvasRef.current) return;
      const game = createInvaders(canvasRef.current, {
        motion: motionOn(),
        onState: setState,
      });
      gameRef.current = game;
      setReady(true);
      /* the site-wide Motion switch pauses this too */
      offMotion = onMotionChange(on => game.setMotion(on));
    });

    return () => {
      cancelled = true;
      offMotion();
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, []);

  return (
    <main className="nf">
      <header className="nf-bar">
        <p className="nf-code" aria-hidden="true">404</p>
        <h1 className="nf-title">Page not found</h1>
        {path && <p className="nf-path" title={path}>{path}</p>}
        <a className="nf-home" href="/">Go home</a>
      </header>

      <div className="nf-stage">
        <canvas
          ref={canvasRef}
          className="nf-canvas"
          role="img"
          aria-label="A row of invaders arranged to spell four zero four. Arrow keys to move, space to fire."
        />
        {!ready && <p className="nf-loading">loading…</p>}

        {(state.over || state.won) && (
          <div className="nf-overlay" role="status">
            <p className="nf-overlay-title">{state.won ? '404 cleared' : 'Game over'}</p>
            <p className="nf-overlay-score">Score {state.score}</p>
            <button type="button" className="nf-restart" onClick={() => gameRef.current?.restart()}>
              Play again
            </button>
          </div>
        )}
      </div>

      <footer className="nf-foot">
        <p className="nf-score">Score <span>{state.score}</span></p>
        <p className="nf-keys" aria-hidden="true">← → move · space fire · drag and tap on touch</p>
        {/* the page still works with the canvas ignored entirely */}
        <p className="sr-only">
          This page does not exist. Use the “Go home” link to return to the start of the site.
        </p>
      </footer>
    </main>
  );
}
