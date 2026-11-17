import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ROOMS } from '../content/rooms.js';
import { NARRATIVE } from '../content/narrative.js';
import { go } from '../explore/nav.js';
import { CHAPTER_NAMES, engine } from '../experience/engine.js';

/* A terminal you can jump from. Cmd/Ctrl+K anywhere, or the prompt under
   the Explore doors. Rendered into <body> like the Room, and deliberately
   refuses to open while a room is up - the Room makes everything else
   inert, which would include this. */

/* Explore's prompt opens the palette through this, so neither component
   has to own the other's state. */
export const openPalette = () => window.dispatchEvent(new CustomEvent('palette:open'));

/* Commands whose line has already been said this visit. Module scope, so
   it outlives the palette closing and is never touched during render. */
const told = new Set();

/* long enough to read, short enough not to be in the way; Enter skips it */
const holdFor = lines => {
  const words = lines.join(' ').split(/\s+/).length;
  return Math.min(2200, Math.max(1200, 600 + words * 80));
};

function buildItems() {
  const chapters = Object.entries(CHAPTER_NAMES)
    .filter(([, name]) => name)
    .map(([id, name]) => ({
      key: 'ch:' + id,
      group: 'chapter',
      label: name,
      hint: '/' + id,
      narrative: NARRATIVE.chapters[id],
      run: () => {
        const target = '#' + id;
        if (engine.lenis) engine.lenis.scrollTo(target, { duration: 1.4 });
        else document.querySelector(target)?.scrollIntoView();
      },
    }));

  const rooms = Object.entries(ROOMS).flatMap(([key, room]) =>
    room.tabs.map(([tab, tabLabel]) => ({
      key: 'room:' + key + '/' + tab,
      group: room.title.toLowerCase(),
      label: tabLabel,
      hint: '#' + key + '/' + tab,
      narrative: NARRATIVE.rooms[key + '/' + tab],
      run: () => go(key, tab, true),
    }))
  );

  return [
    {
      key: 'top',
      group: 'chapter',
      label: 'Top',
      hint: '/',
      run: () => {
        if (engine.lenis) engine.lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo(0, 0);
      },
    },
    ...chapters,
    ...rooms,
  ];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(null);      // chosen item, while its line is on screen
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const opener = useRef(null);

  const items = useMemo(buildItems, []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => (i.label + ' ' + i.group + ' ' + i.hint).toLowerCase().includes(q));
  }, [items, query]);

  const close = useCallback(() => { setOpen(false); setPending(null); }, []);

  const show = useCallback(() => {
    if (document.body.classList.contains('room-open')) return;   /* it would be inert */
    opener.current = document.activeElement;
    setQuery('');
    setActive(0);
    setPending(null);
    setOpen(true);
  }, []);

  /* Cmd/Ctrl+K from anywhere, plus the Explore prompt */
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (document.body.classList.contains('room-open')) return;
        e.preventDefault();
        setPending(null);
        setOpen(prev => {
          if (prev) return false;
          opener.current = document.activeElement;
          setQuery('');
          setActive(0);
          return true;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('palette:open', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('palette:open', show);
    };
  }, [show]);

  /* freeze the page behind the overlay, restore focus on the way out */
  useEffect(() => {
    if (!open) return;
    const lenis = engine.lenis;
    if (lenis) lenis.stop();
    inputRef.current?.focus();
    document.body.classList.add('palette-open');
    return () => {
      document.body.classList.remove('palette-open');
      /* Picking a room closes this and opens the Room in the same tick. The
         Room has already stopped Lenis and taken focus by then, so
         restarting scroll or pulling focus back would undo its work. */
      const roomOpen = document.body.classList.contains('room-open');
      if (lenis && !roomOpen) lenis.start();
      const back = opener.current;
      opener.current = null;
      if (back && !roomOpen && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, [open]);

  /* keep the highlighted row in view */
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function run(item) {
    close();
    /* Lenis is still stopped for this overlay, and it drops a scrollTo while
       stopped (lenis.mjs: `if ((this.isStopped || this.isLocked) && !force)
       return`). Let the close - and its lenis.start() - land first. */
    requestAnimationFrame(() => item.run());
  }

  /* a command with a line says it once, then goes; everything else goes now */
  function choose(item) {
    if (!item) return;
    if (item.narrative && !told.has(item.key)) {
      told.add(item.key);
      setPending(item);
      return;
    }
    run(item);
  }

  /* the line is a pause, never a gate: it moves on by itself */
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => run(pending), holdFor(pending.narrative));
    return () => clearTimeout(t);
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  function onKeyDown(e) {
    if (pending) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(pending); }
      else if (e.key === 'Escape')            { e.preventDefault(); close(); }   /* stay where you are */
      else if (e.key === 'Tab')               { e.preventDefault(); }
      return;
    }
    const last = results.length - 1;
    if (e.key === 'ArrowDown')      { e.preventDefault(); setActive(i => (i >= last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => (i <= 0 ? last : i - 1)); }
    else if (e.key === 'Home')      { e.preventDefault(); setActive(0); }
    else if (e.key === 'End')       { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter')     { e.preventDefault(); choose(results[active]); }
    else if (e.key === 'Escape')    { e.preventDefault(); close(); }
    else if (e.key === 'Tab')       { e.preventDefault(); }   /* nothing behind this to reach */
  }

  if (!open) return null;

  return createPortal(
    <div className="palette" role="dialog" aria-modal="true" aria-label="Jump to a chapter or room">
      <div className="palette-backdrop" onClick={close} />

      {/* a click anywhere on the terminal moves past the line */}
      <div className="palette-term" data-lenis-prevent="" onClick={() => { if (pending) run(pending); }}>
        <div className="terminal-bar">
          <div className="t-btn" /><div className="t-btn" /><div className="t-btn" />
          <div className="terminal-title-bar">aditya — jump</div>
        </div>

        <div className="palette-term-body">
          {/* the command is already typed: this is what you asked the page */}
          <div className="palette-row">
            <span className="t-user">aditya</span>
            <span className="t-path">@portfolio:~$</span>
            <span className="t-input">/help</span>
          </div>
          <p className="t-output">Type to filter. &uarr;&darr; to move, &crarr; to open, esc to close.</p>
          <p className="t-output">
            Shortcut &mdash; macOS <b>&#8984;K</b> &middot; Windows and Linux <b>Ctrl&nbsp;K</b>
          </p>

          <div className="palette-row palette-prompt">
            <span className="t-user">aditya</span>
            <span className="t-path">@portfolio:~$</span>
            <input
              ref={inputRef}
              className="palette-input"
              type="text"
              role="combobox"
              aria-expanded={!pending}
              aria-controls="palette-list"
              aria-activedescendant={!pending && results[active] ? 'palette-opt-' + results[active].key : undefined}
              aria-autocomplete="list"
              aria-label="Filter chapters and rooms"
              placeholder="jump to…"
              readOnly={!!pending}
              value={pending ? pending.hint : query}
              onChange={e => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
            />
          </div>

          {/* present from the start so screen readers announce the line */}
          <div className="palette-narrative" role="status">
            {pending && pending.narrative.map(line => (
              <p key={line} className="palette-narrative-line">{line}</p>
            ))}
          </div>
          {pending && (
            <p className="t-output palette-continue" aria-hidden="true">
              <span className="continue-keys">&crarr; continue &middot; esc stay</span>
              <span className="continue-tap">tap to continue</span>
            </p>
          )}

          <ul className="palette-list" id="palette-list" role="listbox" ref={listRef}
              aria-label="Chapters and rooms" hidden={!!pending}>
            {results.map((item, i) => (
              <li
                key={item.key}
                id={'palette-opt-' + item.key}
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                className="palette-item"
                onMouseEnter={() => setActive(i)}
                onMouseDown={e => e.preventDefault()}   /* keep focus in the input */
                onClick={() => choose(item)}
              >
                <span className="palette-caret" aria-hidden="true">{i === active ? '>' : ' '}</span>
                <span className="palette-group">{item.group}</span>
                <span className="palette-label">{item.label}</span>
                <span className="palette-hint">{item.hint}</span>
              </li>
            ))}
            {results.length === 0 && (
              <li className="palette-empty">no match — try a chapter name, or a room</li>
            )}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
