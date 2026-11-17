import { ROOMS } from '../content/rooms.js';

/* The URL hash (#ai/labs) is the single source of truth for which room is
   open, so rooms are deep-linkable and never 404 on refresh.
   Shared between the doors (Explore) and the dialog (Room). */

export const nav = {
  pushed: false,   // did opening add a history entry we can pop?
  opener: null,    // element that gets focus back on close
};

const ROOM_HASH = new RegExp('^#(' + Object.keys(ROOMS).join('|') + ')(?:/([a-z-]+))?$');

export function parseHash(hash = window.location.hash) {
  const m = hash.match(ROOM_HASH);
  if (!m) return null;
  const room = ROOMS[m[1]];
  const tab  = room.tabs.some(t => t[0] === m[2]) ? m[2] : room.tabs[0][0];
  return { key: m[1], tab };
}

/* opening pushes a history entry (so Back closes the room);
   switching tabs replaces it (so Back doesn't walk through tabs) */
export function go(key, tab, push) {
  const h = '#' + key + '/' + tab;
  if (push) { nav.pushed = true; window.location.hash = h; }
  else window.location.replace(h);
}
