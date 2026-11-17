import { useEffect, useState } from 'react';
import Pixel from './Pixel.jsx';
import { onSoundChange, setSound, soundOn, stopSound } from './sound.js';

const SPEAKER = ['...X....', '..XX..X.', 'XXXX...X', 'XXXX.X.X', 'XXXX...X', '..XX..X.', '...X....'];
const MUTED   = ['...X....', '..XX....', 'XXXX.X.X', 'XXXX..X.', 'XXXX.X.X', '..XX....', '...X....'];

/* Sound is off until this is pressed: the press is the user gesture
   browsers require before any audio may play. */
export default function SoundToggle() {
  const [on, setOn] = useState(soundOn);
  useEffect(() => {
    const off = onSoundChange(setOn);
    return () => { off(); stopSound(); };
  }, []);

  return (
    <button type="button" className="kf-sound" aria-pressed={on}
            aria-label={on ? 'Sound is on. Turn it off.' : 'Sound is off. Turn it on.'}
            title={on ? 'Sound on' : 'Sound off'}
            onClick={() => setSound(!on)}>
      <Pixel rows={on ? SPEAKER : MUTED} size={4} />
    </button>
  );
}
