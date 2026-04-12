"use client";

import { useState, useEffect } from "react";

/**
 * Animated counter — smoothly counts from 0 → target using
 * requestAnimationFrame with cubic easing. Re-triggers when
 * `resetKey` changes.
 */
export function useAnimatedCounter(
  target: number,
  isVisible: boolean,
  duration = 1200,
  resetKey?: string
) {
  const [count, setCount] = useState(0);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  // Reset when data changes so the animation replays
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCount(0);
  }

  useEffect(() => {
    if (!isVisible || target === 0) return;
    const startTime = performance.now();
    let rafId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, isVisible, duration]);

  return count;
}
