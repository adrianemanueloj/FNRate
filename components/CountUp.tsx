"use client";

import { useEffect, useRef, useState } from "react";

// Counts from 0 to the value once, on first render. Shows the final value
// straight away if the viewer prefers reduced motion.
export default function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const [n, setN] = useState(value);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    setN(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{n}</>;
}
