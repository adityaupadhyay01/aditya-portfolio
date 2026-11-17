import { useEffect, useState } from 'react';
import { motionOn, onMotionChange, prefersReduced, setMotion } from '../experience/motion.js';

/* Lets a visitor stop the animation without digging through their OS
   settings. Hidden when the OS already asks for reduced motion: there is
   nothing left to switch off, and showing an "on" control in that case
   would suggest the preference had been ignored. */
export default function MotionToggle() {
  const [on, setOn] = useState(motionOn);
  const [osReduced, setOsReduced] = useState(prefersReduced);

  useEffect(() => onMotionChange(next => {
    setOn(next);
    setOsReduced(prefersReduced());
  }), []);

  if (osReduced) return null;

  return (
    <button
      id="motion-toggle"
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Motion is on. Pause the animation.' : 'Motion is off. Resume the animation.'}
      title={on
        ? 'Pause the animation — background shader, drifting dust, screen flicker and smooth scrolling'
        : 'Resume the animation'}
      onClick={() => setMotion(!on)}
    >
      <span className="motion-dot" aria-hidden="true" />
      <span aria-hidden="true">{on ? 'Motion' : 'Paused'}</span>
    </button>
  );
}
