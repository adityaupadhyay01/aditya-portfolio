import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ROOMS, ROOM_CONTENT } from '../content/rooms.js';
import { go, nav, parseHash } from '../explore/nav.js';
import { engine, whenReady } from '../experience/engine.js';

/* A room opened from an Explore door. Rendered straight into <body> (not
   inside #root) so that making everything behind it inert can't make the
   room itself inert. */

function Entry({ entry: e }) {
  const inner = (
    <>
      {e.meta && <p className="room-entry-meta">{e.meta}</p>}
      <h3 className="room-entry-title">{e.title || ''}</h3>
      {e.desc && <p className="room-entry-desc">{e.desc}</p>}
      {e.tags && e.tags.length > 0 && (
        <div className="pc-tech">
          {e.tags.map((t, i) => <span key={i} className="tech-pill">{t}</span>)}
        </div>
      )}
      {e.link && <span className="room-entry-arrow" aria-hidden="true">↗</span>}
    </>
  );
  return e.link
    ? <a className="room-entry" href={e.link} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <article className="room-entry">{inner}</article>;
}

/* honest empty state, in the site's own voice */
function EmptyState({ roomKey, tab, label }) {
  return (
    <div className="room-empty">
      <div aria-hidden="true">
        <div>
          <span className="t-user">aditya</span>
          <span className="t-path">{`:~/${roomKey}/${tab} $ `}</span>ls
        </div>
        <div>total 0</div>
        <div><span className="terminal-cursor" /></div>
      </div>
      <p className="sr-only">Nothing in {label} yet.</p>
    </div>
  );
}

export default function Room() {
  const [route, setRoute] = useState(null);          // { key, tab } while open
  const [phase, setPhase] = useState('closed');      // closed | open | closing
  const lastRoute = useRef(null);                    // keeps content painted while fading out
  if (route) lastRoute.current = route;
  const view = route || lastRoute.current;

  const rootRef = useRef(null);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  /* modal: freeze the page, make everything behind the room inert */
  function lock(on) {
    const body = document.body;
    body.classList.toggle('room-open', on);
    [...body.children].forEach(el => {
      if (el === rootRef.current || el.tagName === 'SCRIPT') return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    const lenis = engine.lenis;
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
    body.classList.remove('cursor-hover');
  }

  function requestClose() {
    if (nav.pushed) { nav.pushed = false; window.history.back(); return; }  // hashchange closes it
    /* deep-linked: there is no entry of ours to pop */
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); }
    catch { window.location.replace('#'); }
    setRoute(null);
  }

  /* hash -> route. Idempotent, so every entry point can just call it. */
  useEffect(() => {
    const sync = () => {
      const s = parseHash();
      if (s) {
        const canonical = '#' + s.key + '/' + s.tab;
        if (window.location.hash !== canonical) window.location.replace(canonical);
      }
      setRoute(prev => (!s ? null : prev && prev.key === s.key && prev.tab === s.tab ? prev : s));
    };
    window.addEventListener('hashchange', sync);

    /* deep link: park the page on the hub behind the room, so closing it
       leaves the visitor at the doors rather than the 2015 intro */
    let cancel = () => {};
    if (parseHash()) {
      cancel = whenReady(() => {
        if (engine.lenis) engine.lenis.scrollTo('#explore', { immediate: true });
        sync();
      });
    }
    return () => { window.removeEventListener('hashchange', sync); cancel(); };
  }, []);

  /* route changes drive the phase */
  useLayoutEffect(() => {
    if (route && phase !== 'open') setPhase('open');
    else if (!route && phase === 'open') setPhase('closing');
  }, [route, phase]);

  /* phase changes drive the choreography */
  useLayoutEffect(() => {
    if (phase === 'open') {
      if (!nav.opener && route) nav.opener = document.querySelector('.door[data-room="' + route.key + '"]');
      lock(true);
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: true });
      gsap.fromTo(panelRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
      titleRef.current.focus({ preventScroll: true });
    } else if (phase === 'closing') {
      nav.pushed = false;
      lock(false);
      gsap.to(panelRef.current, { opacity: 0, y: 16, duration: 0.3, ease: 'power2.in', overwrite: true });
      gsap.to(backdropRef.current, {
        opacity: 0, duration: 0.3, overwrite: true,
        onComplete: () => setPhase(p => (p === 'closing' ? 'closed' : p)),
      });
      const opener = nav.opener;
      nav.opener = null;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* a different room starts at its top */
  useLayoutEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [view && view.key]);

  /* entries write themselves in when a tab is shown */
  useLayoutEffect(() => {
    if (!route || !bodyRef.current) return;
    const items = bodyRef.current.querySelectorAll('.room-entry');
    if (items.length) {
      gsap.fromTo(items, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
    }
  }, [route && route.key, route && route.tab]);

  /* Escape closes */
  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); requestClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* never leave the page frozen if this ever unmounts while open */
  useEffect(() => () => {
    if (document.body.classList.contains('room-open')) lock(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* roving tabs: arrows / Home / End */
  function onTabKey(e) {
    const ids = ROOMS[view.key].tabs.map(t => t[0]);
    let i = ids.indexOf(view.tab);
    if (e.key === 'ArrowRight')     i = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft') i = (i - 1 + ids.length) % ids.length;
    else if (e.key === 'Home')      i = 0;
    else if (e.key === 'End')       i = ids.length - 1;
    else return;
    e.preventDefault();
    go(view.key, ids[i], false);
    const next = document.getElementById('room-tab-' + ids[i]);
    if (next) next.focus();
  }

  const room  = view ? ROOMS[view.key] : null;
  const label = room ? room.tabs.find(t => t[0] === view.tab)[1] : '';
  const list  = view ? (ROOM_CONTENT[view.key + '/' + view.tab] || []) : [];

  return createPortal(
    <div className="room" id="room" role="dialog" aria-modal="true" aria-labelledby="room-title"
         hidden={phase === 'closed'} ref={rootRef}>
      <div className="room-backdrop" onClick={requestClose} ref={backdropRef} />
      <div className="room-panel" data-lenis-prevent="" ref={panelRef}>
        <header className="room-head">
          <p className="room-path" id="room-path" aria-hidden="true">{'~/aditya' + (view ? '/' + view.key : '')}</p>
          <h2 className="room-title" id="room-title" tabIndex={-1} ref={titleRef}>{room ? room.title : 'Room'}</h2>
          <p className="room-meta" id="room-meta" hidden={!(room && room.meta)}>{(room && room.meta) || ''}</p>
          <button className="room-close" type="button" aria-label="Close" onClick={requestClose}>×</button>
        </header>
        <div className="room-tabs" id="room-tabs" role="tablist" aria-labelledby="room-title">
          {room && room.tabs.map(([id, tabLabel]) => (
            <button key={view.key + '/' + id} type="button" className="room-tab" id={'room-tab-' + id}
                    data-tab={id} role="tab" aria-controls="room-body"
                    aria-selected={id === view.tab ? 'true' : 'false'} tabIndex={id === view.tab ? 0 : -1}
                    onClick={() => go(view.key, id, false)} onKeyDown={onTabKey}>
              {tabLabel}
            </button>
          ))}
        </div>
        <div className="room-body" id="room-body" role="tabpanel" tabIndex={0}
             aria-labelledby={view ? 'room-tab-' + view.tab : undefined} ref={bodyRef}>
          {view && (list.length
            ? <div className="room-list">{list.map((e, i) => <Entry key={i} entry={e} />)}</div>
            : <EmptyState roomKey={view.key} tab={view.tab} label={label} />)}
        </div>
      </div>
    </div>,
    document.body
  );
}
