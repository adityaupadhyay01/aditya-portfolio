import { useEffect, useRef } from 'react';
import { PROMPT, WINDOWS } from '../content.js';
import { startWindows } from './windows.js';
import { motionOn } from '../../experience/motion.js';

/* A 7x7 pixel X, drawn with rects so it stays crisp at any scale. */
function PixelX() {
  const cells = [0, 1, 2, 3, 4, 5, 6].flatMap(i => (i === 3 ? [[3, 3]] : [[i, i], [6 - i, i]]));
  return (
    <svg viewBox="0 0 7 7" width="14" height="14" aria-hidden="true" shapeRendering="crispEdges">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />)}
    </svg>
  );
}

/* Static markup; windows.js lays it out, reveals it and wires the prompt. */
export default function WindowCascade({ headerRef }) {
  const sectionRef = useRef(null);
  const desktopRef = useRef(null);

  useEffect(() => startWindows({
    section: sectionRef.current,
    desktop: desktopRef.current,
    headerEl: headerRef?.current,
    motion: motionOn(),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="kf-windows" ref={sectionRef} aria-label="System messages">
      <div className="kf-desktop" ref={desktopRef}>
        {WINDOWS.map((w, i) => (
          <div key={i} className="kf-window kf-box-pixel">
            <div className="kf-window-bar">
              <span className="kf-window-label">{w.label}</span>
              {w.prompt
                ? <button type="button" className="kf-window-close" aria-label="Close"><PixelX /></button>
                : <span className="kf-window-close" aria-hidden="true"><PixelX /></span>}
            </div>
            <div className="kf-window-body">
              <div className="kf-window-content">
                {/* aria-live so the ACCESS DENIED / GRANTED swap is announced */}
                <p className="kf-window-text" aria-live={w.prompt ? 'polite' : undefined}>{w.text}</p>
                {w.prompt && (
                  <div className="kf-window-actions">
                    <button type="button" className="kf-btn kf-btn-light kf-no">No</button>
                    <a className="kf-btn kf-btn-secondary kf-yes" href={PROMPT.yesHref}>Yes</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
