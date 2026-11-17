/* ============================================================
   LANDING — the frame before the story starts

   AVATAR: public/avatar.webp - your pixel portrait, background removed.
   If the file goes missing, the landing falls back to your initials and
   /khelified to a generic pixel bust. Nothing here invents a likeness.

   Every string below already existed somewhere in this project:
     name  -> <meta name="author">, the footer signature
     role  -> the <h1> in Story.jsx and <meta name="description">
     line  -> the epilogue in Ending.jsx
     mark  -> "Still curious." in chapter 7
   Change them freely - just keep them true.

   PLACEHOLDER: there is deliberately no location line (the
   "BASED IN ___" rail). This project does not record where you
   are, so I have not written one. Add `place` below if you want it.
============================================================ */
export const LANDING = {
  name: 'Aditya Upadhyay',
  role: 'CS Student · Full Stack Developer · AI Builder',
  line: 'Still building. Still learning. Still curious.',
  mark: 'Still curious',
  avatar: '/avatar.webp',

  /* Your words, kept exactly. Note: "it's" means "it is" - the
     possessive is "its". One character if you want it changed. */
  enter: "let adithegreat do it's greatness",

  /* the other door: the 8-bit version */
  alt: { label: 'or play it khelified', href: '/khelified' },
};
