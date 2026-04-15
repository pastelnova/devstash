"use client";

import { useCallback, useEffect, useRef } from "react";

const CHAOS_ICONS = [
  { label: "Notion", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L2.58 2.514c-.467.047-.56.28-.374.466zm.793 3.172v13.85c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.747.327-.747.886zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V8.858l-1.168-.093c-.093-.42.14-1.026.793-1.073l3.453-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM1.934 1.155L15.87 0c1.168-.093 1.448 0 2.148.56l2.988 2.1c.513.373.7.467.7 1.027v17.13c0 1.073-.42 1.68-1.868 1.773l-15.457.933c-1.073.047-1.587-.093-2.148-.746L.46 20.344c-.607-.793-.84-1.4-.84-2.1V2.648c0-.886.42-1.446 1.354-1.587z"/></svg>' },
  { label: "GitHub", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>' },
  { label: "Slack", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>' },
  { label: "VS Code", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>' },
  { label: "Browser", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M2 7h20"/><path d="M9 3v4"/></svg>' },
  { label: "Terminal", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>' },
  { label: "Text File", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>' },
  { label: "Bookmark", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>' },
];

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  scalePhase: number;
}

export function ChaosIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef<IconState[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const initState = useCallback(() => {
    if (stateRef.current.length > 0) return;
    stateRef.current = CHAOS_ICONS.map(() => ({
      x: Math.random() * 0.8 + 0.1,
      y: Math.random() * 0.8 + 0.1,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scale: 0.9 + Math.random() * 0.2,
      scalePhase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    initState();
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const iconSize = 60;
      const repelRadius = 100;
      const repelStrength = 0.4;
      const mouse = mouseRef.current;

      stateRef.current.forEach((icon, i) => {
        const px = icon.x * w;
        const py = icon.y * h;
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * repelStrength;
          icon.vx += (dx / dist) * force;
          icon.vy += (dy / dist) * force;
        }

        icon.x += icon.vx / w;
        icon.y += icon.vy / h;
        icon.vx *= 0.98;
        icon.vy *= 0.98;

        const speed = Math.sqrt(icon.vx * icon.vx + icon.vy * icon.vy);
        if (speed < 0.3) {
          icon.vx += (Math.random() - 0.5) * 0.2;
          icon.vy += (Math.random() - 0.5) * 0.2;
        }

        const minX = iconSize / 2 / w;
        const maxX = 1 - iconSize / 2 / w;
        const minY = iconSize / 2 / h;
        const maxY = 1 - iconSize / 2 / h;

        if (icon.x < minX) { icon.x = minX; icon.vx = Math.abs(icon.vx); }
        if (icon.x > maxX) { icon.x = maxX; icon.vx = -Math.abs(icon.vx); }
        if (icon.y < minY) { icon.y = minY; icon.vy = Math.abs(icon.vy); }
        if (icon.y > maxY) { icon.y = maxY; icon.vy = -Math.abs(icon.vy); }

        icon.rotation += icon.rotationSpeed;
        icon.scalePhase += 0.02;
        const scale = icon.scale + Math.sin(icon.scalePhase) * 0.05;

        const left = icon.x * w - iconSize / 2;
        const top = icon.y * h - iconSize / 2;

        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(${left}px, ${top}px) rotate(${icon.rotation}deg) scale(${scale})`;
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#12121a]"
      style={{ aspectRatio: "4 / 3" }}
    >
      {CHAOS_ICONS.map((icon, i) => (
        <div
          key={icon.label}
          ref={(el) => { iconRefs.current[i] = el; }}
          className="absolute flex h-[60px] w-[60px] select-none items-center justify-center rounded-lg border border-white/10 bg-[#16161f] text-muted-foreground will-change-transform"
          title={icon.label}
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ))}
    </div>
  );
}
