import { ROOMS } from '../content/rooms.js';
import { go, nav } from '../explore/nav.js';
import { openPalette } from './CommandPalette.jsx';

/* STORY and EXPLORE are siblings: the story ends here and the visitor picks
   which Aditya to explore. A door opens its room over the page (see Room). */
export default function Explore() {
  function open(e, key) {
    e.preventDefault();
    nav.opener = e.currentTarget;
    go(key, ROOMS[key].tabs[0][0], true);
  }

  return (
    <section id="explore" data-chapter="explore" data-url="/kahani/explore" aria-labelledby="explore-heading">
      <div className="container">
        <p className="section-eyebrow">Explore</p>
        <h2 className="explore-heading" id="explore-heading">Which Aditya do you<br />want to explore?</h2>
        <nav className="explore-doors" aria-label="Explore Aditya">
          {Object.entries(ROOMS).map(([key, room], i) => (
            <a key={key} className="door" href={'#' + key} data-room={key} aria-haspopup="dialog"
               onClick={e => open(e, key)}>
              <span className="door-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="door-title">{room.title}</span>
              <span className="door-sub">{room.tabs.map(t => t[1]).join(' · ')}</span>
              <span className="door-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
        {/* Both shortcuts, not the detected one: someone reading this on a
            Mac may well be sending the link to someone on Windows. Also the
            only way in on touch, where there is no keyboard to press. */}
        <button
          type="button"
          className="explore-hint"
          onClick={openPalette}
          aria-label="Open the jump terminal. Shortcut: Command K, or Control K."
        >
          <span className="hint-keys" aria-hidden="true">
            <kbd>⌘</kbd><kbd>K</kbd>
            <span className="hint-sep">/</span>
            <kbd>Ctrl</kbd><kbd>K</kbd>
          </span>
          <span className="hint-text hint-text-keys" aria-hidden="true">for teleportation</span>
          <span className="hint-text hint-text-tap" aria-hidden="true">tap to teleport</span>
        </button>
      </div>
    </section>
  );
}
