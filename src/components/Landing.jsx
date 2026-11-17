import { useEffect, useRef, useState } from 'react';
import { LANDING } from '../content/landing.js';
import { createSignal } from '../experience/gl.js';
import { motionOn } from '../experience/motion.js';

/* The front door. Behind it runs the same signal shader the documentary
   opens on, so stepping through feels like one place, not two sites.

   Leaving is an old TV switching off: the picture collapses to a bright
   line, the line to a dot, and the story begins in the dark - which is
   where "Somewhere in 2015..." is waiting, and its first chapter is a CRT. */
export default function Landing({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(true);   /* until the file 404s */
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const done = useRef(false);
  const motion = useRef(motionOn()).current;

  /* the shader: null when WebGL is missing or motion is off, and the page
     simply stays black */
  useEffect(() => {
    const signal = createSignal(canvasRef.current, !motion);
    if (!signal) return undefined;
    let raf = requestAnimationFrame(function tick(t) {
      signal.render(t);
      raf = requestAnimationFrame(tick);
    });
    return () => { cancelAnimationFrame(raf); signal.destroy(); };
  }, [motion]);

  /* a soft light that follows a mouse; touch screens have nothing to follow */
  useEffect(() => {
    if (!motion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const el = rootRef.current;
    let raf = 0;
    const onMove = e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${e.clientX}px`);
        el.style.setProperty('--my', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); };
  }, [motion]);

  /* The timer, not animationend: animationend never fires when motion is
     off (no animation runs), and a missed event would trap the visitor. */
  function enter() {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    setTimeout(onEnter, motion ? 780 : 250);
  }

  const initials = LANDING.name.split(/\s+/).map(w => w[0]).join('');

  return (
    <div className="landing" ref={rootRef} data-leaving={leaving} data-motion-on={motion}>
      <div className="landing-screen">
        <canvas className="landing-gl" ref={canvasRef} aria-hidden="true" />
        <div className="landing-vignette" aria-hidden="true" />
        <div className="landing-light" aria-hidden="true" />
        <div className="landing-frame" aria-hidden="true" />

        <div className="landing-chrome" aria-hidden="true">
          <div className="lc-tl">
            <span className="lc-name">{LANDING.name}</span>
            <span className="lc-role">{LANDING.role}</span>
          </div>
          <div className="lc-bl">{LANDING.mark}</div>
        </div>
        {/* Two copies of the same link; CSS shows exactly one, and a
            display:none element is out of the tab order and the a11y tree. */}
        <a className="landing-alt landing-alt-corner" href={LANDING.alt.href}>{LANDING.alt.label} ↗</a>

        <div className="landing-center">
          <div className={'landing-avatar' + (hasAvatar ? '' : ' is-empty')}>
            {hasAvatar
              ? <img src={LANDING.avatar} alt="" onError={() => setHasAvatar(false)} />
              : <span className="landing-mono" aria-hidden="true">{initials}</span>}
          </div>

          <h1 className="landing-title" aria-label={LANDING.name}>
            {[...LANDING.name].map((c, i) => (
              <span key={i} className="lt-char" style={{ '--i': i }} aria-hidden="true">
                {c === ' ' ? ' ' : c}
              </span>
            ))}
          </h1>
          <p className="landing-line">{LANDING.line}</p>

          <div className="landing-actions">
            <button type="button" className="landing-enter" onClick={enter}>
              <span>{LANDING.enter}</span>
              <span className="le-arrow" aria-hidden="true">→</span>
            </button>
            <a className="landing-alt landing-alt-inline" href={LANDING.alt.href}>{LANDING.alt.label}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
