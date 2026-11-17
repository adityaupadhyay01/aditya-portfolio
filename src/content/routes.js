/* ============================================================
   ROUTES
     /            the landing
     /kahani      the documentary; its chapters rewrite the address
                  to /kahani/<chapter> as you scroll (the data-url
                  attributes in Story.jsx, Explore.jsx, Ending.jsx)
     /khelified   the 8-bit version

   App.jsx has to decide which of these a path is BEFORE anything
   renders, so the chapter list cannot be read out of the DOM.
   startExperience() compares it with the DOM in dev and warns if
   the two ever drift apart.
============================================================ */
export const KAHANI = '/kahani';
export const KHELIFIED_PATH = '/khelified';

export const KNOWN_PATHS = [
  '/kahani',
  '/kahani/curiosity',
  '/kahani/discovery',
  '/kahani/learning',
  '/kahani/building',
  '/kahani/failures',
  '/kahani/restart',
  '/kahani/today',
  '/kahani/work',
  '/kahani/explore',
  '/kahani/ending',
];

export const cleanPath = p => p.replace(/\/+$/, '') || '/';
export const isKnownPath = p => KNOWN_PATHS.includes(cleanPath(p));
export const isKhelified = p => cleanPath(p) === KHELIFIED_PATH;
