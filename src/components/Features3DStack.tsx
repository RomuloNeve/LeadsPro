import { useRef, useState } from "react";
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Search, MessageCircle, Database, Bot, Mail, Kanban, Code, Zap,
} from "lucide-react";

/**
 * Features3DStack — interactive 3D-parallax showcase of platform features.
 *
 * Eight cards float in z-space around the section. As the visitor moves
 * the cursor, each card translates/rotates by an amount proportional to
 * its depth (closer cards move more, farther cards move less). Creates a
 * tangible "depth window" feel without WebGL.
 *
 * On mobile (touch), the parallax is disabled — cards just sit in a tidy
 * grid layout.
 *
 * Honors prefers-reduced-motion: disables parallax, breathing, and entry
 * animations.
 */

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  metric: string;
  /** depth from -200 (far) to +60 (close); influences parallax intensity */
  depth: number;
  /** % position on the canvas (0-100) */
  x: number;
  y: number;
  /** subtle rotation rest angle in deg */
  rotate: number;
  tint: string; // primary accent color (HSL or hex)
}

// 3-row grid (3 + 2 + 3) — spread out so cards don't overlap each other.
// Subtle depth (-30..+30) still gives a 3D feel via translateZ + rotation
// without sacrificing legibility.
const FEATURES: FeatureCard[] = [
  // Row 1
  { icon: Search,        title: "Busca de Leads",       blurb: "Pesquise por categoria + cidade. Telefone, IG, LinkedIn extraídos.",  metric: "3s/lead",     depth:  20, x: 16, y: 18, rotate: -2, tint: "#5DCAA5" },
  { icon: Database,      title: "CRM Brasileiro",       blurb: "Filtros, tags, listas. Tudo num painel feito pra quem vende no BR.",  metric: "1.247 leads", depth:  30, x: 50, y: 14, rotate:  0, tint: "#5DCAA5" },
  { icon: MessageCircle, title: "Disparo WhatsApp",     blurb: "Em massa com IA + intervalos randômicos. Anti-banimento.",            metric: "Sem ban",     depth:  20, x: 84, y: 18, rotate:  2, tint: "#1D9E75" },
  // Row 2
  { icon: Bot,           title: "Chatbot IA 24/7",      blurb: "Qualifica leads, envia propostas e agenda reuniões automaticamente.", metric: "24h online",  depth: -10, x: 25, y: 50, rotate:  1, tint: "#1D9E75" },
  { icon: Kanban,        title: "Pipeline Kanban",      blurb: "Drag-and-drop entre colunas. Acompanhe cada negociação.",             metric: "4 estágios",  depth: -10, x: 75, y: 50, rotate: -1, tint: "#a855f7" },
  // Row 3
  { icon: Mail,          title: "Email Marketing",      blurb: "Campanhas com seu domínio + IA pra copy + estatísticas de entrega.",  metric: "Bulk + IA",   depth:   0, x: 16, y: 82, rotate: -1, tint: "#3b82f6" },
  { icon: Zap,           title: "Cadência Multi-canal", blurb: "WhatsApp + email em sequência automática até o lead responder.",      metric: "Auto",        depth:  10, x: 50, y: 86, rotate:  1, tint: "#5DCAA5" },
  { icon: Code,          title: "Widget de Captura",    blurb: "Formulário no seu site. Lead vai pro CRM e IA já manda WhatsApp.",    metric: "1 linha",     depth:   0, x: 84, y: 82, rotate:  2, tint: "#f97316" },
];

export default function Features3DStack() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Mouse position normalized to [-1, 1] — center is 0,0
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Spring smoothing so the parallax doesn't twitch
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mx.set((px - 0.5) * 2);
    my.set((py - 0.5) * 2);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full max-w-6xl mx-auto"
      style={{ perspective: "1600px" }}
    >
      {/* Canvas — fixed aspect on desktop, falls back to grid on mobile */}
      <div
        className="hidden md:block relative w-full"
        style={{ aspectRatio: "16/9", minHeight: 460, transformStyle: "preserve-3d" }}
        aria-hidden="true"
      >
        {/* radial backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(29,158,117,0.12), transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* connecting lines (subtle) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" aria-hidden="true">
          <defs>
            <linearGradient id="line-grad" x1="0" x2="1">
              <stop offset="0" stopColor="rgba(29,158,117,0.0)" />
              <stop offset="0.5" stopColor="rgba(29,158,117,0.5)" />
              <stop offset="1" stopColor="rgba(29,158,117,0.0)" />
            </linearGradient>
          </defs>
          {[
            // Top row + verticals to middle
            [0, 1], [1, 2], [0, 3], [2, 4],
            // Middle to bottom
            [3, 5], [4, 7], [3, 6], [4, 6],
            // Bottom row
            [5, 6], [6, 7],
          ].map(([a, b], idx) => (
            <line
              key={idx}
              x1={`${FEATURES[a].x}%`}
              y1={`${FEATURES[a].y}%`}
              x2={`${FEATURES[b].x}%`}
              y2={`${FEATURES[b].y}%`}
              stroke="url(#line-grad)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {FEATURES.map((f, i) => (
          <FloatingCard key={i} feature={f} index={i} sx={sx} sy={sy} reduce={!!reduce} />
        ))}
      </div>

      {/* Mobile fallback — flat grid */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f, i) => (
          <FlatCard key={i} feature={f} />
        ))}
      </div>
    </div>
  );
}

/* ── 3D floating card ── */

function FloatingCard({
  feature, index, sx, sy, reduce,
}: {
  feature: FeatureCard;
  index: number;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  reduce: boolean;
}) {
  // Parallax: closer cards (higher depth) move slightly more — kept subtle so
  // the layout reads as 3D without making any card hard to follow.
  const intensity = (feature.depth + 60) / 90; // ≈ 0.33 to 1.0
  const tx = useTransform(sx, (v) => v * 18 * intensity);
  const ty = useTransform(sy, (v) => v * 12 * intensity);
  const rx = useTransform(sy, (v) => -v * 3);
  const ry = useTransform(sx, (v) => v * 3);

  const [hovered, setHovered] = useState(false);

  const Icon = feature.icon;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute"
      style={{
        left: `${feature.x}%`,
        top: `${feature.y}%`,
        translateX: "-50%",
        translateY: "-50%",
        x: tx,
        y: ty,
        rotateX: rx,
        rotateY: ry,
        rotate: feature.rotate,
        transformStyle: "preserve-3d",
        transform: `translateZ(${feature.depth}px)`,
        zIndex: Math.round(feature.depth + 100),
      }}
    >
      <motion.div
        animate={hovered && !reduce ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-[230px] sm:w-[260px] rounded-xl border bg-card p-4 cursor-default"
        style={{
          borderColor: hovered ? `${feature.tint}80` : "hsl(var(--border))",
          boxShadow: hovered
            ? `0 24px 60px ${feature.tint}40, 0 0 0 1px ${feature.tint}66 inset`
            : "0 18px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05) inset",
          transition: "border-color 0.25s, box-shadow 0.25s",
        }}
      >
        <div className="flex items-start gap-2.5 mb-2">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${feature.tint}22`, color: feature.tint }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold font-display text-foreground leading-tight">{feature.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{feature.metric}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{feature.blurb}</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Mobile flat card ── */

function FlatCard({ feature }: { feature: FeatureCard }) {
  const Icon = feature.icon;
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-2.5 mb-2">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${feature.tint}20`, color: feature.tint }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-display text-foreground leading-tight">{feature.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{feature.metric}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{feature.blurb}</p>
    </div>
  );
}
