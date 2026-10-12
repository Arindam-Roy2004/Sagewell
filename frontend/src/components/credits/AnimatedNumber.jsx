import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatCredits } from './credit-utils';

/** Counts from the previous value to the new one, so a spend visibly ticks the balance down. */
export default function AnimatedNumber({ value, className }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (reduce || previous.current === value) {
      previous.current = value;
      setShown(value);
      return undefined;
    }
    const controls = animate(previous.current, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: setShown,
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{formatCredits(shown)}</span>;
}
