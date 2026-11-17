/* ============================================================
   KHELIFIED SOUND
   Everything is synthesised in the browser with Web Audio: square
   and triangle oscillators, no audio files, no bytes to download.
   The effects and the little loop are written for this site.

   Off by default. Browsers only allow audio after a user gesture,
   and the toggle is that gesture. The choice lasts the visit
   (sessionStorage), like the motion switch.
============================================================ */
const KEY = 'kf-sound';
let ctx = null, master = null, musicTimer = 0, step = 0;
const listeners = new Set();

const stored = () => { try { return sessionStorage.getItem(KEY) === 'on'; } catch { return false; } };
let on = false;                       /* never true before a gesture in this page load */
export const wantsSound = stored;     /* the visitor turned it on earlier this visit */
export const soundOn = () => on;
export function onSoundChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function ensure() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return true;
}

/* one note: type, start frequency, optional end frequency (a slide), length, volume */
function tone(type, f0, f1, dur, vol = 0.5, at = 0) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

const SFX = {
  blip:    () => tone('square', 660, 0, 0.05, 0.35),
  select:  () => { tone('square', 520, 0, 0.06, 0.4); tone('square', 780, 0, 0.08, 0.4, 0.06); },
  open:    () => tone('square', 300, 600, 0.09, 0.35),
  deny:    () => { tone('square', 180, 120, 0.16, 0.5); tone('square', 140, 90, 0.2, 0.5, 0.12); },
  grant:   () => [392, 523, 659, 784].forEach((f, i) => tone('square', f, 0, 0.09, 0.4, i * 0.07)),
  jump:    () => tone('square', 320, 720, 0.12, 0.4),
  switch:  () => { tone('triangle', 440, 0, 0.05, 0.6); tone('triangle', 330, 0, 0.07, 0.6, 0.05); },
  power:   () => tone('sawtooth', 900, 120, 0.3, 0.35),
  pickup:  () => { tone('square', 880, 0, 0.06, 0.4); tone('square', 1320, 0, 0.1, 0.4, 0.06); },
  hit:     () => tone('sawtooth', 220, 40, 0.4, 0.55),
};

export function sfx(name) {
  if (!on || !ctx) return;
  SFX[name]?.();
}

/* A 16-step loop: a bass note every four steps under a minor arpeggio. */
const BASS = [110, 110, 87.3, 98];
const ARP  = [220, 261.6, 329.6, 392, 329.6, 261.6, 220, 261.6, 174.6, 220, 261.6, 349.2, 196, 246.9, 293.7, 392];
function tick() {
  if (!on) return;
  if (step % 4 === 0) tone('triangle', BASS[(step / 4) % 4], 0, 0.5, 0.5);
  tone('square', ARP[step % 16], 0, 0.11, 0.12);
  step++;
}

export function setSound(next) {
  if (next && !ensure()) return false;
  on = next;
  try { sessionStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  clearInterval(musicTimer);
  if (on) {
    ctx.resume?.();
    step = 0;
    musicTimer = setInterval(tick, 150);
    SFX.select();
  }
  listeners.forEach(fn => fn(on));
  return on;
}

/* leaving the page: silence, but keep the stored choice */
export function stopSound() {
  clearInterval(musicTimer);
  on = false;
  ctx?.suspend?.();
}
