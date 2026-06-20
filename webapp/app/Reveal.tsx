"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Staggered scroll-reveal. Wraps content, fades + lifts it in once it enters
 * the viewport. `delay` (ms) cascades siblings. Respects reduced-motion via CSS.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "li" | "section";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as "div";
  return (
    <Comp
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${shown ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  );
}
