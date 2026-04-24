import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Search, MapPin, MessageCircle, Database, Zap } from "lucide-react";

/**
 * HeroProductMockup
 * ------------------------------------------------------------
 * Interactive, animated preview of the LeadsPro product used in the
 * landing page hero — replaces the stock background photo.
 *
 * Design tokens follow the spec:
 *  - container: #0f1a18 bg, subtle teal border, deep shadow
 *  - pins:      #1D9E75 with 2px white ring + 4px teal glow
 *  - grid:      18px × 18px faint teal grid on map
 *
 * All non-essential motion is gated behind `prefers-reduced-motion`.
 */

interface Pin {
  id: number;
  x: number; // % left
  y: number; // % top
  pulsing?: boolean;
}

// Deterministic pin positions — feels organic but is stable across reloads
const PINS: Pin[] = [
  { id: 1, x: 18, y: 28 },
  { id: 2, x: 32, y: 42, pulsing: true },
  { id: 3, x: 46, y: 22 },
  { id: 4, x: 58, y: 54 },
  { id: 5, x: 70, y: 36 },
  { id: 6, x: 26, y: 66 },
  { id: 7, x: 50, y: 72, pulsing: true },
  { id: 8, x: 78, y: 62 },
  { id: 9, x: 38, y: 84 },
  { id: 10, x: 82, y: 24 },
];

const LEADS_PREVIEW = [
  { name: "Clínica Sorriso Perfeito", phone: "(11) 9••••-4523", badge: "Novo" },
  { name: "Odonto Center Premium", phone: "(11) 9••••-8891", badge: "Novo" },
];

function useCounter(end: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return value;
}

export default function HeroProductMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();

  // Counter: 0 → 127 on first view
  const count = useCounter(127, 1500, inView);

  // Subtle perspective tilt on hover (desktop only; disabled under reduce-motion)
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -3, y: px * 3 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full max-w-[560px] mx-auto"
      style={{
        transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      aria-label="Prévia interativa do produto LeadsPro"
    >
      {/* Radial glow behind the card */}
      <div
        className="absolute -inset-8 rounded-[32px] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(29,158,117,0.25), transparent 70%)",
          filter: "blur(22px)",
        }}
      />

      {/* ── Mockup card ── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative rounded-[12px] overflow-hidden"
        style={{
          background: "#0f1a18",
          border: "0.5px solid rgba(93,202,165,0.22)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        {/* window chrome */}
        <div className="flex items-center gap-1.5 px-3 h-7 border-b border-white/[0.06] bg-white/[0.015]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[10px] font-mono text-white/40 tracking-wide">
            app.leadspro.com.br
          </span>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 px-3 pt-3 border-b border-white/[0.04]">
          <Tab icon={<Search className="h-3 w-3" />} label="Busca de leads" active />
          <Tab icon={<MessageCircle className="h-3 w-3" />} label="Disparos" />
          <Tab icon={<Database className="h-3 w-3" />} label="CRM" />
        </div>

        {/* search bar */}
        <div className="px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-black/30 border border-white/[0.06]">
            <Search className="h-3.5 w-3.5 text-[#5DCAA5] shrink-0" />
            <span className="text-[11px] font-mono text-white/75 truncate">
              CNAE: 8630-5 · <span className="text-white">Dentistas</span> · São Paulo, SP
            </span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#5DCAA5] font-semibold">
              BUSCAR
            </span>
          </div>
        </div>

        {/* map */}
        <div className="px-4 pb-3">
          <div
            className="relative aspect-[16/9] rounded-lg overflow-hidden border border-white/[0.06]"
            style={{
              backgroundColor: "#0a1210",
              backgroundImage:
                "linear-gradient(rgba(93,202,165,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(93,202,165,0.065) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          >
            {/* soft glow hotspots */}
            <div
              className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full pointer-events-none"
              aria-hidden="true"
              style={{
                background: "radial-gradient(circle, rgba(29,158,117,0.18), transparent 70%)",
              }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full pointer-events-none"
              aria-hidden="true"
              style={{
                background: "radial-gradient(circle, rgba(29,158,117,0.12), transparent 70%)",
              }}
            />

            {/* leads counter badge */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-[#1D9E75]/30">
              <span
                className={`h-1.5 w-1.5 rounded-full bg-[#1D9E75] ${reduce ? "" : "animate-pulse"}`}
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold text-[#5DCAA5] tabular-nums">
                {count} leads
              </span>
            </div>

            {/* pins */}
            {PINS.map((p, i) => (
              <Pin key={p.id} pin={p} index={i} inView={inView} reduce={!!reduce} />
            ))}
          </div>
        </div>

        {/* leads list */}
        <div className="px-4 pb-4 space-y-1.5">
          {LEADS_PREVIEW.map((l, i) => (
            <motion.div
              key={l.name}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: 1.3 + i * 0.15, duration: 0.4 }}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.025] border border-white/[0.04]"
            >
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white truncate">{l.name}</p>
                <p className="text-[10px] font-mono text-white/45">{l.phone}</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#5DCAA5] font-bold uppercase tracking-wide shrink-0">
                {l.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating capture badge (bottom-left) */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -bottom-4 -left-3 sm:-left-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f1a18] border border-[#1D9E75]/30 shadow-xl"
        style={{ boxShadow: "0 10px 30px rgba(29,158,117,0.25)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-[#5DCAA5]" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-white/55">Capturando</p>
          <p className="text-[11px] font-bold text-white">3s por lead</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Subcomponents ── */

function Tab({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-md text-[10px] font-medium transition-colors ${
        active
          ? "bg-white/[0.04] text-white border-b-2 border-[#1D9E75]"
          : "text-white/45"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Pin({ pin, index, inView, reduce }: { pin: Pin; index: number; inView: boolean; reduce: boolean }) {
  // Stagger entry: 200ms base + 90ms per pin
  const delay = 0.2 + index * 0.09;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
      initial={reduce ? false : { opacity: 0, scale: 0 }}
      animate={inView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ delay, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      aria-hidden="true"
    >
      {/* outer glow ring */}
      {pin.pulsing && !reduce && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: "rgba(29,158,117,0.35)",
            width: "100%",
            height: "100%",
            animationDuration: "2s",
          }}
        />
      )}
      <span
        className="relative block rounded-full"
        style={{
          width: 10,
          height: 10,
          background: "#1D9E75",
          border: "2px solid #ffffff",
          boxShadow: "0 0 0 4px rgba(29,158,117,0.25), 0 2px 6px rgba(0,0,0,0.4)",
        }}
      />
    </motion.div>
  );
}
