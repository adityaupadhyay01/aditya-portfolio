import { lazy, Suspense, useEffect, useState } from 'react';
import { engine, startExperience, whenReady } from './experience/engine.js';
import { KAHANI, KHELIFIED_PATH, cleanPath, isKnownPath } from './content/routes.js';
import CodeBackdrop from './components/CodeBackdrop.jsx';
import Story from './components/Story.jsx';
import Explore from './components/Explore.jsx';
import Ending from './components/Ending.jsx';
import Room from './components/Room.jsx';
import MotionToggle from './components/MotionToggle.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import NotFound from './components/NotFound.jsx';
import Landing from './components/Landing.jsx';

/* Its own chunk: fonts, styles and code for /khelified are fetched only
   when someone actually opens /khelified. */
const Khelified = lazy(() => import('./khelified/Khelified.jsx'));

/* Read before anything can rewrite it: the engine replaces the path as the
   visitor scrolls. On file:// the pathname is a disk path, so routing is
   skipped there and the page behaves as the landing. */
const IS_WEB = window.location.protocol === 'http:' || window.location.protocol === 'https:';
const HAS_ROOM_HASH = window.location.hash.length > 1;

/* Room links used to look like /#ai/labs, from when the story lived at /.
   Send them where the story lives now instead of to the landing. */
if (IS_WEB && cleanPath(window.location.pathname) === '/' && HAS_ROOM_HASH) {
  try { window.history.replaceState(null, '', KAHANI + window.location.hash); } catch { /* opaque origin */ }
}

const INITIAL_PATH = window.location.pathname;
const PATH = IS_WEB ? cleanPath(INITIAL_PATH) : '/';
const IS_KHELIFIED = PATH === KHELIFIED_PATH;
const IS_404 = PATH !== '/' && !IS_KHELIFIED && !isKnownPath(PATH);

/* A /kahani/today link opens at Today, not at the 2015 intro. Used once:
   coming back to the story later starts it from the top. A room hash is
   left to Room.jsx, which parks the page behind the room itself. */
let startAt = !IS_404 && PATH !== '/' && PATH !== KAHANI && !HAS_ROOM_HASH ? PATH : null;

/* Element order matches the single-file build: the fixed layers share
   z-indexes, so paint order is decided by position in the DOM. */
export default function App() {
  const [entered, setEntered] = useState(PATH !== '/');

  /* The engine only starts once the story is actually on the page - it
     reaches for elements by id, and before `entered` none of them exist. */
  useEffect(() => {
    if (IS_404 || IS_KHELIFIED) return undefined;
    document.body.classList.toggle('landing-open', !entered);
    if (!entered) return undefined;
    const destroy = startExperience();
    let cancel = () => {};
    if (startAt) {
      const target = startAt;
      startAt = null;
      cancel = whenReady(() => {
        const el = document.querySelector(`[data-url="${target}"]`);
        if (el && engine.lenis) engine.lenis.scrollTo(el, { immediate: true, force: true });
      });
    }
    return () => { cancel(); destroy(); };
  }, [entered]);

  /* Back from /kahani to / shows the landing again; forward goes back in. */
  useEffect(() => {
    if (!IS_WEB || IS_404 || IS_KHELIFIED) return undefined;
    const onPop = () => {
      const p = cleanPath(window.location.pathname);
      if (p === '/') setEntered(false);
      else if (isKnownPath(p)) setEntered(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function enter() {
    if (IS_WEB) {
      try { window.history.pushState(null, '', KAHANI); } catch { /* opaque origin */ }
    }
    window.scrollTo(0, 0);
    setEntered(true);
  }

  if (IS_KHELIFIED) return <Suspense fallback={null}><Khelified /></Suspense>;
  if (IS_404) return <NotFound path={INITIAL_PATH} />;

  return (
    <>
      {!entered && <Landing onEnter={enter} />}

      {entered && (
        <>
          <button id="skip-intro" aria-label="Skip the story and go to Explore">Skip intro</button>
          <canvas id="gl-canvas" aria-hidden="true" />
          <CodeBackdrop />
          <div id="cursor" aria-hidden="true" />
          <div id="cursor-ring" aria-hidden="true" />
          <div id="scroll-progress" aria-hidden="true" />
          <div id="chapter-label" aria-live="polite" />
          <div id="grain" aria-hidden="true" />
          <canvas id="vhs-canvas" aria-hidden="true" />
          <div id="ambient-light" aria-hidden="true" />
          <MotionToggle />

          <Story />
          <Explore />
          <Ending />
          <Room />

          <CommandPalette />
        </>
      )}
    </>
  );
}
