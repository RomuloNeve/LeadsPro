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

const FEATURES: FeatureCard[] = [
  { icon: Search,        title: "Busca de Leads",     blurb: "Pesquise por categoria + cidade. Telefone, IG, LinkedIn extraídos.",        metric: "3s/lead",        depth:   60, x: 12, y: 18, rotate: -3, tint: "#5DCAA5" },
  { icon: MessageCircle, title: "Disparo WhatsApp",   blurb: "Em massa com IA + intervalos randômicos. Anti-banimento.",                  metric: "Sem ban",        depth:   30, x: 76, y: 12, rotate:  4, tint: "#1D9E75" },
  { icon: Database,      title: "CRM Brasileiro",     blurb: "Filtros, tags, listas. Tudo num painel feito pra quem vende no BR.",        metric: "1.247 leads",    depth:  -40, x: 48, y: 30, rotate:  0, tint: "#5DCAA5" },
  { icon: Kanban,        title: "Pipeline Kanban",    blurb: "Drag-and-drop entre colunas. Acompanhe cada negociação.",                   metric: "4 estágios",     depth:  -10, x: 16, y: 62, rotate:  3, tint: "#a855f7" },
  { icon: Bot,           title: "Chatbot IA 24/7",    blurb: "Qualifica leads, envia propostas e agenda reuniões automaticamente.",       metric: "24h online",     depth:   45, x: 84, y: 56, rotate: -4, tint: "#1D9E75" },
  { icon: Mail,          title: "Email Marketing",    blurb: "Campanhas com seu domínio + IA pra copy + estatísticas de entrega.",         metric: "Bulk + IA",      depth:  -80, x: 60, y: 72, rotate:  2, tint: "#3b82f6" },
  { icon: Code,          title: "Widget de Captura",  blurb: "Formulário no seu site. Lead vai pro CRM e IA já manda WhatsApp.",          metric: "1 linha",        depth: -120, x: 26, y: 82, rotate: -2, tint: "#f97316" },
  { icon: Zap,           title: "Cadência Multi-canal", blurb: "WhatsApp + email em sequência automática até o lead responder.",           metric: "Auto",           depth:  -60, x: 78, y: 84, rotate:  3, tint: "#5DCAA5" },
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
            [0, 2], [1, 2], [2, 3], [2, 4], [3, 6], [4, 5], [5, 7], [2, 5],
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
  // Parallax: closer cards (higher depth) move more
  const intensity = (feature.depth + 200) / 260; // ≈ 0.31 to 1.0
  const tx = useTransform(sx, (v) => v * 26 * intensity);
  const ty = useTransform(sy, (v) => v * 18 * intensity);
  const rx = useTransform(sy, (v) => -v * 4);
  const ry = useTransform(sx, (v) => v * 4);

  // Far cards get more blur; near cards stay sharp
  const blur = feature.depth < -60 ? 1.2 : 0;
  const opacity = feature.depth < -100 ? 0.85 : 1;

  const [hovered, setHovered] = useState(false);

  const Icon = feature.icon;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity, y: 0, scale: 1 }}
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
        zIndex: Math.round(feature.depth + 200),
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      <motion.div
        animate={hovered && !reduce ? { scale: 1.06, y: -4 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-[200px] sm:w-[230px] rounded-xl border bg-card/95 backdrop-blur-md p-3.5 cursor-default"
        style={{
          borderColor: hovered ? `${feature.tint}66` : "hsl(var(--border))",
          boxShadow: hovered
            ? `0 20px 50px ${feature.tint}33, 0 0 0 1px ${feature.tint}55 inset`
            : "0 14px 36px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
          transition: "border-color 0.25s, box-shadow 0.25s",
        }}
      >
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
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{feature.blurb}</p>
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
