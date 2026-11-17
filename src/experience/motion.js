/* ============================================================
   MOTION PREFERENCE
   Two inputs, one answer: the operating system's setting and the
   visitor's own toggle. The toggle lives in sessionStorage, so it
   lasts the visit without outliving it - nobody has to remember
   they switched something off on a portfolio six months ago.

   `document.documentElement.dataset.motion` is the single value
   CSS and JS both read. The OS setting always wins: if someone
   asked their machine for less motion, the toggle cannot override
   that, it can only agree.
============================================================ */
const KEY = 'motion';

export const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Safari in private mode throws on sessionStorage rather than returning
   null, and a page that cannot animate is better than a page that will
   not render. */
function stored() {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}

export const motionOn = () => !prefersReduced() && stored() !== 'off';

const listeners = new Set();
export function onMotionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function publish() {
  const on = motionOn();
  document.documentElement.dataset.motion = on ? 'on' : 'off';
  listeners.forEach(fn => fn(on));
  return on;
}

export function setMotion(on) {
  try { sessionStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  return publish();
}

/* The OS setting can change while the page is open. */
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', publish);

/* index.html sets the attribute before first paint so nothing flashes;
   this re-states it for anyone who loaded the module some other way. */
publish();
