"use client";

import { useEffect, useRef, useState } from "react";

export function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "visible">("idle");

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return; // stay "idle" = fully visible

    const el = ref.current;
    if (!el) return;

    // If already in viewport, don't animate — just stay visible
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    // Off-screen: hide it and observe for intersection
    setState("hidden");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        state === "idle"
          ? undefined
          : `transition-all duration-600 ease-out ${
              state === "visible"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`
      }
    >
      {children}
    </div>
  );
}
