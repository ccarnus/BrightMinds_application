import { useEffect, useRef, useState } from 'react';

/** Animates a displayed number toward `target` (ease-out), e.g. XP counters. */
const useCountUp = (target, { duration = 900, delay = 0, initial = 0 } = {}) => {
  const [value, setValue] = useState(initial);
  const valueRef = useRef(initial);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return undefined;
    let frame;
    const timer = setTimeout(() => {
      const startedAt = Date.now();
      const step = () => {
        const t = Math.min((Date.now() - startedAt) / duration, 1);
        const next = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
        valueRef.current = next;
        setValue(next);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value;
};

export default useCountUp;
