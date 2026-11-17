/* ============================================================
   KHELIFIED — content
   Text for /khelified. The layout and interaction patterns follow jld2nd.dev (James Lee II).
   Every word here is this site's own.
   PLACEHOLDER: the window jokes are mine - swap in your own.
============================================================ */

/* Hero. The greetings cycle with a typing effect. The three languages are
   the ones already listed on the Human Side room (Hindi, English, Japanese).
   `headline` is your own line. */
export const HERO = {
  greetings: [
    { t: 'Hello' },
    { t: "I'm Aditya" },
    { t: 'नमस्ते', lang: 'hi' },
    { t: 'こんにちは', lang: 'ja' },
  ],
  headline: 'Developer by curiosity, gamer by origin, professional bug creator by choice.',
};

/* Player card. Every value is already published elsewhere on this site. */
export const PLAYER = {
  name: 'Aditya Upadhyay',
  stats: [
    ['Class', 'CS Student'],
    ['Build', 'Full Stack Developer'],
    ['Perk', 'AI Builder'],
    ['Languages', 'Hindi · English · Japanese (basic)'],
  ],
};

/* PLACEHOLDER copy for the closing section - replace with your own words. */
export const CTA = {
  title: 'Got an idea?',
  line: 'Let’s stack it into something real.',
  button: 'Send me an email',
};

/* The retro OS cascade. The last entry is the prompt with Yes / No. */
export const WINDOWS = [
  { label: 'boot.sys',       text: 'Waking up the pixels…' },
  { label: 'coffee.exe',     text: 'Caffeine levels: acceptable.' },
  { label: 'bugs.log',       text: '0 bugs found. (Nobody looked very hard.)' },
  { label: 'curiosity.dll',  text: 'Loaded in 2015. Still running.' },
  { label: 'npm_install',    text: 'Downloading half the internet…' },
  { label: 'focus.exe',      text: 'Not responding. Try again after chai.' },
  { label: 'git_push',       text: 'Everything is up to date. Probably.' },
  { label: 'rooms.scan',     text: 'Scanning /adhbut/explore…' },
  { label: 'ready.sys',      text: 'All parts assembled. Mostly.' },
  {
    label: 'explore.exe',
    text: 'The doors are open.\nWant to look inside?',
    prompt: true,
  },
];

export const PROMPT = {
  yesHref: '/kahani/explore',
  denied:      'NOPE.\nWrong button.',
  cantClose:   'NICE TRY.\nThis one stays open.',
  granted:     'GOOD CHOICE.\nOpening the doors…',
  deniedLabel: 'nope.exe',
  grantedLabel:'lets_go.exe',
};
