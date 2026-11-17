/* ============================================================
   TERMINAL NARRATIVE
   One or two lines the jump terminal says before it goes where
   you asked. Each line is shown once per visit; anything not
   listed here jumps straight through, as it always has.

   Keys match the terminal's commands: chapter ids from
   CHAPTER_NAMES, and room paths as 'room/tab' from ROOMS.
   Every line is drawn from what the page itself already says -
   keep it that way, nothing invented.
============================================================ */
export const NARRATIVE = {
  chapters: {
    ch1: ['Before there was any code, there was a question.',
          'How does this even work?'],
    ch3: ['Broke it. Fixed it. Broke it again.',
          'Nobody calls that a curriculum. It was one.'],
    /* ch4 and ch5 are one thought, split across two commands */
    ch4: ['What shipped is the part people see.',
          'The rest is in the next chapter.'],
    ch5: ["This is the part that doesn't make the demo.",
          'It shows up in every build after it.'],
    ch6: ['Starting over takes one command.',
          'Knowing what to do differently takes the rest.'],
    ch7: ['Student. Developer. Builder.',
          'The kid with the question never really left.'],
    ending: ["That's the story so far.",
             'The next part usually starts with a message.'],
  },
  rooms: {
    'web/products':     ['Stories are interesting.',
                         'This is the part that has to work.'],
    'web/case-studies': ['The product is the answer.',
                         'This is the working shown.'],
    'ai/research':      ['The questions got bigger.',
                         'The habit of asking them stayed the same.'],
    'dsa/journal':      ['Some days the problem wins.',
                         'Those get written down too.'],
    'human/stories':    ["The part of the story the code doesn't tell."],
  },
};
