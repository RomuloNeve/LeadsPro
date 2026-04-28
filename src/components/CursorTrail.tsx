import { useEffect, useRef } from "react";

/**
 * CursorTrail — custom cursor with a leading ring + center dot and an
 * 18-segment comet trail that lerps behind the actual mouse position.
 * Adapted from the glass-green-effect reference, recolored to LeadsPro
 * crimson (#ef233c).
 *
 * - Hidden entirely on touch devices and on prefers-reduced-motion
 * - Hidden on viewports < md (1024px wide → mostly tablet/mobile)
 * - Each segment lerps toward the position of the segment ahead of it,
 *   creating a smooth tail without per-frame state allocation
 * - Hover targets (a, button, [role=button], inputs, .cursor-grow) cause
 *   the leading ring to enlarge + brighten
 * - Click feedback compresses the ring briefly (mousedown / mouseup)
 *
 * Mount once at the page root. Doesn't render anything visible on
 * mobile, so safe to leave on.
 */

const SEGMENTS = 18;
const BASE_COLOR = "239, 35, 60"; // crimson #ef233c — adjust here only
const ACCENT_COLOR = "248, 113, 113"; // lighter crimson for the dot fill

export default function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Bail on touch / reduced-motion / narrow viewports
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.innerWidth < 768) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const segEls = segRefs.current.filter(Boolean);
    if (!ring || !dot || segEls.length === 0) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX, ringY = targetY;
    const segPositions = segEls.map(() => ({ x: targetX, y: targetY }));
    let sizeBoost = 0;
    let rafId = 0;

    const setImmediate = (x: number, y: number) => {
      targetX = ringX = x;
      targetY = ringY = y;
      segPositions.forEach((p) => { p.x = x; p.y = y; });
      ring.style.left = dot.style.left = `${x}px`;
      ring.style.top = dot.style.top = `${y}px`;
      segEls.forEach((el) => {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      });
    };

    const updateSegmentSizes = () => {
      const baseSize = 12;
      for (let i = 0; i < segEls.length; i++) {
        const t = i / (segEls.length - 1);
        // Decreasing size: 12px near cursor → 4px at tail end
        const size = (baseSize - t * 8) + sizeBoost * (1 - t);
        const opacity = Math.max(0.18, 0.9 - i * 0.04);
        segEls[i].style.width = `${size}px`;
        segEls[i].style.height = `${size}px`;
        segEls[i].style.opacity = String(opacity);
      }
    };

    const animate = () => {
      // Ring + dot lerp toward target
      ringX += (targetX - ringX) * 0.35;
      ringY += (targetY - ringY) * 0.35;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      dot.style.left = `${targetX}px`;  // dot snaps exactly to cursor
      dot.style.top = `${targetY}px`;

      // Each segment lerps toward the position of the previous one (or ring)
      for (let i = 0; i < segPositions.length; i++) {
        const target = i === 0
          ? { x: ringX, y: ringY }
          : segPositions[i - 1];
        const speed = 0.32 - (i / segPositions.length) * 0.12; // 0.32 → 0.20
        segPositions[i].x += (target.x - segPositions[i].x) * speed;
        segPositions[i].y += (target.y - segPositions[i].y) * speed;
        segEls[i].style.left = `${segPositions[i].x}px`;
        segEls[i].style.top = `${segPositions[i].y}px`;
      }

      rafId = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const enlarge = () => {
      ring.style.width = "44px";
      ring.style.height = "44px";
      ring.style.borderColor = `rgba(${BASE_COLOR}, 1)`;
      ring.style.boxShadow = `0 0 0 3px rgba(${BASE_COLOR}, 0.18), 0 0 60px rgba(${BASE_COLOR}, 0.4)`;
      sizeBoost = 2;
      updateSegmentSizes();
    };

    const reset = () => {
      ring.style.width = "28px";
      ring.style.height = "28px";
      ring.style.borderColor = `rgba(${BASE_COLOR}, 0.85)`;
      ring.style.boxShadow = `0 0 0 2px rgba(${BASE_COLOR}, 0.15), 0 0 30px rgba(${BASE_COLOR}, 0.28)`;
      sizeBoost = 0;
      updateSegmentSizes();
    };

    const hide = () => {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
      segEls.forEach((el) => (el.style.visibility = "hidden"));
    };

    const show = () => {
      ring.style.opacity = "0.9";
      dot.style.opacity = "0.95";
      segEls.forEach((el) => (el.style.visibility = "visible"));
    };

    setImmediate(window.innerWidth / 2, window.innerHeight / 2);
    show();
    updateSegmentSizes();
    rafId = requestAnimationFrame(animate);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseenter", show);
    document.documentElement.addEventListener("mouseleave", hide);

    // Hover targets
    const targetSelector = 'a, button, [role="button"], input, textarea, select, label, .cursor-grow';
    const enterHandlers = new WeakMap<Element, () => void>();
    const leaveHandlers = new WeakMap<Element, () => void>();
    const targets = document.querySelectorAll<HTMLElement>(targetSelector);
    targets.forEach((el) => {
      const en = () => enlarge();
      const lv = () => reset();
      enterHandlers.set(el, en);
      leaveHandlers.set(el, lv);
      el.addEventListener("mouseenter", en);
      el.addEventListener("mouseleave", lv);
    });

    // Click feedback
    const onMouseDown = () => {
      ring.style.transform = "translate(-50%, -50%) scale(0.85)";
    };
    const onMouseUp = () => {
      ring.style.transform = "translate(-50%, -50%) scale(1)";
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Pause when tab hidden
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseenter", show);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      targets.forEach((el) => {
        const en = enterHandlers.get(el);
        const lv = leaveHandlers.get(el);
        if (en) el.removeEventListener("mouseenter", en);
        if (lv) el.removeEventListener("mouseleave", lv);
      });
    };
  }, []);

  // Don't render on touch devices / reduced motion / small viewports.
  // Use a CSS query to hide; the JS guard above also bails so no events
  // are wired in those cases.
  return (
    <div
      ref={containerRef}
      className="hidden md:block pointer-events-none fixed inset-0 z-[60]"
      aria-hidden="true"
      style={{
        // Hide on touch / reduced-motion via CSS too, defense-in-depth
      }}
    >
      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 28,
          height: 28,
          borderRadius: "9999px",
          border: `2px solid rgba(${BASE_COLOR}, 0.85)`,
          background: "transparent",
          boxShadow: `0 0 0 2px rgba(${BASE_COLOR}, 0.15), 0 0 30px rgba(${BASE_COLOR}, 0.28)`,
          transform: "translate(-50%, -50%)",
          transition: "width 0.2s, height 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.1s, opacity 0.2s",
          opacity: 0.9,
          willChange: "left, top, transform",
        }}
      />
      {/* Center dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "9999px",
          background: `rgba(${ACCENT_COLOR}, 0.95)`,
          boxShadow: `0 0 12px rgba(${BASE_COLOR}, 0.6)`,
          transform: "translate(-50%, -50%)",
          transition: "opacity 0.2s",
          opacity: 0.95,
          willChange: "left, top",
        }}
      />
      {/* Trail segments */}
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) segRefs.current[i] = el; }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 12,
            height: 12,
            borderRadius: "9999px",
            background: `rgba(${BASE_COLOR}, ${0.95 - i * 0.04})`,
            boxShadow: `0 0 0 2px rgba(${BASE_COLOR}, 0.08), 0 0 18px rgba(${BASE_COLOR}, 0.25), inset 0 0 6px rgba(255, 255, 255, 0.06)`,
            transform: "translate(-50%, -50%)",
            transition: "width 0.2s, height 0.2s, opacity 0.2s",
            willChange: "left, top",
          }}
        />
      ))}
    </div>
  );
}
