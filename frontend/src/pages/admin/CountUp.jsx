import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Whole number that counts up to its value on first render and on change. */
export default function CountUp({ value, className }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const previous = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return undefined;
    }
    const controls = animate(previous.current, value, { duration: 0.8, ease: 'easeOut', onUpdate: setShown });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{Math.round(shown).toLocaleString()}</span>;
}
