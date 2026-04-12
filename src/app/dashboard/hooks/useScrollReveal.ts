"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Scroll-reveal hook — triggers entrance animations when an element
 * enters the viewport. Automatically re-arms when `resetKey` changes
 * (e.g. when the active batch changes and data refreshes).
 */
export function useScrollReveal(threshold = 0.15, resetKey?: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  // Reset visibility when resetKey changes so the animation re-triggers
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setIsVisible(false);
  }

  useEffect(() => {
    if (isVisible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, isVisible, resetKey]);

  return { ref, isVisible };
}

/**
 * Stagger style helper — returns inline styles that fade/slide an
 * element into view based on its index and the parent's visibility.
 */
export function revealStyle(visible: boolean, index: number, baseDelay = 0) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible
      ? "translateY(0) scale(1)"
      : "translateY(24px) scale(0.98)",
    transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${baseDelay + index * 0.08}s, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) ${baseDelay + index * 0.08}s`,
  } as const;
}
