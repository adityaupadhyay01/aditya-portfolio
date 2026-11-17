/* ============================================================
   EXPLORE - "Which Aditya do you want to explore?"
   ROOMS defines the four doors and their tabs; the door sub-lines
   are built from the tab labels, so renaming a tab happens here only.
============================================================ */
export const ROOMS = {
  ai:    { title: 'AI Engineer', tabs: [['work', 'Work'], ['labs', 'Labs'], ['research', 'Research']] },
  web:   { title: 'Web Dev',     tabs: [['products', 'Products'], ['case-studies', 'Case Studies']] },
  dsa:   { title: 'DSA Paglu',   tabs: [['problems', 'Problems'], ['journal', 'Journal'], ['progress', 'Progress']] },
  human: { title: 'Human Side',  tabs: [['evidence', 'Evidence'], ['stories', 'Stories'], ['experience', 'Experience']],
           meta: 'Languages — Hindi · English · Japanese (basic)' },
};

/* ---- ROOM CONTENT - fill these in ---------------------------------
   An empty array renders an honest empty state (`ls` -> total 0).
   Nothing here is invented: every entry you add must be real.

   Entry shape (only title is required):
     { title: '', desc: '', tags: ['', ''], meta: '', link: '' }
--------------------------------------------------------------------- */
export const ROOM_CONTENT = {
  'ai/work':          [],
  'ai/labs':          [],
  'ai/research':      [],
  'web/products':     [],
  'web/case-studies': [],
  'dsa/problems':     [],
  'dsa/journal':      [],
  'dsa/progress':     [],
  'human/evidence':   [],
  'human/stories':    [],
  'human/experience': [],
};
