import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent, useMotionValue, useSpring } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send,
  CheckCheck, Search, Users, Calendar, DollarSign, TrendingUp, Bell,
} from "lucide-react";

/**
 * ScrollPhoneStory — scroll-driven 3D phone narrative.
 *
 * As the visitor scrolls through this section (height = N × viewport),
 * a phone stays sticky-centered while its WhatsApp screen evolves through
 * five scenes telling the "lead → close" story. The text on the left
 * cross-fades between matching scene narration.
 *
 * On mobile, the section collapses to a flat stack (no scroll-jacking).
 *
 * Honors prefers-reduced-motion: all five scenes are rendered side-by-side
 * in a flat layout instead of being driven by scroll progress.
 */

const SCENES: { title: string; copy: string; tag: string }[] = [
  {
    tag: "01 · Captura",
    title: "Lead capturado no Google Maps",
    copy: "Você buscou 'Dentista, São Paulo' e o LeadsPro extraiu nome, telefone e WhatsApp. Em 3 segundos. Sem copiar e colar.",
  },
  {
    tag: "02 · Primeiro toque",
    title: "Mensagem disparada automaticamente",
    copy: "A IA varia o texto pra cada lead. Intervalo aleatório de 30-300s entre envios. Seu número fica protegido contra banimento.",
  },
  {
    tag: "03 · Cadência",
    title: "Sem resposta? A cadência continua",
    copy: "Follow-up no dia 1, 3, 5 e 7 — automaticamente. Você não esquece nenhum lead. Eles não esquecem de você.",
  },
  {
    tag: "04 · Resposta",
    title: "O lead respondeu",
    copy: "Bot da IA já qualifica e agenda. Quando o lead pede pra falar com humano, você recebe notificação no app, email e WhatsApp.",
  },
  {
    tag: "05 · Fechamento",
    title: "Negócio fechado no Kanban",
    copy: "Arraste o card pra coluna 'Fechado'. Lance o valor. O painel já mostra a evolução do mês e o ROI da campanha.",
  },
];

export default function ScrollPhoneStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Active scene index (0–4) — usable progress range is roughly 0.15–0.85
  // (start..end gives full window of intersection; we cluster scenes inside).
  const [activeScene, setActiveScene] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    // Map [0.15, 0.85] → 0..5 buckets (clamped)
    const norm = Math.max(0, Math.min(1, (v - 0.15) / 0.7));
    const idx = Math.min(SCENES.length - 1, Math.floor(norm * SCENES.length));
    setActiveScene(idx);
  });

  // ─── Cursor parallax ──────────────────────────────────────────────
  // The phone always sits at a base isometric tilt; the cursor adds extra
  // rotation on top so it really feels like a 3D object you're moving around.
  const mx = useMotionValue(0); // -1 to 1
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 80, damping: 20, mass: 0.6 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  // Base isometric tilt (-12° Y, 6° X) + cursor parallax (±10°) +
  // subtle scroll sweep (-4° to +4°)
  const scrollSweep = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-4, 4]);
  const phoneRotateY = useTransform(
    () => -12 + scrollSweep.get() + sx.get() * 12 // -12° base + scroll sweep + cursor
  );
  const phoneRotateX = useTransform(() => 6 + sy.get() * -8); // 6° base + cursor

  // Reduced motion: render flat narrative
  if (reduce) {
    return <FlatNarrative />;
  }

  return (
    <>
      {/* Mobile: render the flat narrative */}
      <div className="md:hidden">
        <FlatNarrative />
      </div>

      {/* Desktop: sticky scroll-driven story */}
      <div
        ref={ref}
        className="hidden md:block relative"
        style={{ height: "420vh" }}
      >
        <div
          className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <div className="container mx-auto px-6 lg:px-8 grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-16 items-center">
            {/* Left: scene narration */}
            <SceneText activeScene={activeScene} />

            {/* Center: phone with full 3D — perspective lives on the parent */}
            <div className="flex justify-center" style={{ perspective: "1800px", perspectiveOrigin: "50% 50%" }}>
              <motion.div
                style={{
                  rotateY: phoneRotateY,
                  rotateX: phoneRotateX,
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                }}
              >
                <Phone3D activeScene={activeScene} sx={sx} sy={sy} />
              </motion.div>
            </div>

            {/* Right: scene progress dots */}
            <div className="hidden lg:flex flex-col gap-3 items-start">
              {SCENES.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    i === activeScene ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === activeScene ? "w-8 bg-primary" : "w-3 bg-muted-foreground/30"
                    }`}
                  />
                  <span className={`text-xs font-mono ${i === activeScene ? "text-primary" : "text-muted-foreground"}`}>
                    {s.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   Scene text (cross-fade as scene index changes)
═══════════════════════════════════════════════════════════════ */

function SceneText({ activeScene }: { activeScene: number }) {
  const s = SCENES[activeScene];
  return (
    <div className="text-left max-w-md">
      <motion.div
        key={activeScene}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono mb-4">
          {s.tag}
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight mb-4 leading-tight">
          {s.title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {s.copy}
        </p>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Phone 3D
═══════════════════════════════════════════════════════════════ */

function Phone3D({
  activeScene, sx, sy,
}: {
  activeScene: number;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
}) {
  // Glossy highlight gradient — moves with cursor for "real glass" effect
  const sheen = useTransform(
    () => `radial-gradient(circle at ${50 + sx.get() * 35}% ${30 + sy.get() * 20}%, rgba(255,255,255,0.18), transparent 35%)`
  );

  // Floating notification card behind the phone — drifts slightly with cursor
  const floatX = useTransform(sx, (v) => v * 16);
  const floatY = useTransform(sy, (v) => v * 12);

  const W = 320; // phone width
  const H = 640; // phone height
  const D = 28;  // phone thickness (depth)

  return (
    <div className="relative" style={{ width: W, height: H, transformStyle: "preserve-3d" }}>
      {/* Ambient glow — sits flat behind the phone */}
      <div
        aria-hidden
        className="absolute -inset-16 pointer-events-none"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, rgba(29,158,117,0.38), transparent 70%)",
          filter: "blur(50px)",
          transform: `translateZ(-${D * 2}px)`,
        }}
      />

      {/* ─── BACK FACE (deep) ─── */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[46px]"
        style={{
          transform: `translateZ(-${D}px)`,
          background: "linear-gradient(135deg, #1c1c1e 0%, #0a0a0b 60%, #050505 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Camera bump on the back */}
        <div
          className="absolute top-6 left-6 h-16 w-16 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #2a2a2c, #050505)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-black ring-2 ring-zinc-700">
            <div className="absolute inset-1 rounded-full bg-zinc-900 ring-1 ring-primary/20" />
          </div>
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black ring-2 ring-zinc-700">
            <div className="absolute inset-1 rounded-full bg-zinc-900 ring-1 ring-primary/20" />
          </div>
          <div className="absolute bottom-2 left-2 h-5 w-5 rounded-full bg-black ring-2 ring-zinc-700">
            <div className="absolute inset-1 rounded-full bg-zinc-900" />
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE (volume buttons) ─── */}
      <div
        aria-hidden
        className="absolute top-0 right-0 h-full"
        style={{
          width: D,
          transform: `rotateY(90deg) translateZ(${W / 2 - D / 2}px)`,
          transformOrigin: "right center",
          background: "linear-gradient(90deg, #050505 0%, #1c1c1e 50%, #050505 100%)",
        }}
      >
        {/* Power button */}
        <div className="absolute top-[140px] right-0 h-16 w-1 rounded-l bg-zinc-700/60" style={{ transform: "translateX(0)" }} />
      </div>

      {/* ─── LEFT SIDE (volume buttons) ─── */}
      <div
        aria-hidden
        className="absolute top-0 left-0 h-full"
        style={{
          width: D,
          transform: `rotateY(-90deg) translateZ(${W / 2 - D / 2}px)`,
          transformOrigin: "left center",
          background: "linear-gradient(90deg, #050505 0%, #1c1c1e 50%, #050505 100%)",
        }}
      >
        <div className="absolute top-[120px] left-0 h-9 w-1 rounded-r bg-zinc-700/60" />
        <div className="absolute top-[170px] left-0 h-12 w-1 rounded-r bg-zinc-700/60" />
        <div className="absolute top-[200px] left-0 h-12 w-1 rounded-r bg-zinc-700/60" style={{ top: 215 }} />
      </div>

      {/* ─── TOP EDGE ─── */}
      <div
        aria-hidden
        className="absolute top-0 left-0 w-full"
        style={{
          height: D,
          transform: `rotateX(90deg) translateZ(${D / 2}px)`,
          transformOrigin: "center top",
          background: "linear-gradient(180deg, #1c1c1e 0%, #050505 100%)",
        }}
      />

      {/* ─── BOTTOM EDGE ─── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: D,
          transform: `rotateX(-90deg) translateZ(${D / 2}px)`,
          transformOrigin: "center bottom",
          background: "linear-gradient(0deg, #1c1c1e 0%, #050505 100%)",
        }}
      />

      {/* ─── FRONT FACE (the actual phone face with screen) ─── */}
      <div
        className="absolute inset-0 rounded-[46px] p-[10px]"
        style={{
          transform: `translateZ(0px)`,
          background: "linear-gradient(145deg, #2a2a2c 0%, #1a1a1c 35%, #0a0a0b 100%)",
          boxShadow: `
            0 40px 80px rgba(0,0,0,0.55),
            0 0 0 1.5px rgba(255,255,255,0.06) inset,
            0 0 0 4px rgba(0,0,0,0.7)
          `,
        }}
      >
        {/* Screen */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black">
          {/* Notch / dynamic island */}
          <div
            aria-hidden
            className="absolute top-2 left-1/2 -translate-x-1/2 z-40 h-7 w-28 rounded-full bg-black"
            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.8) inset" }}
          >
            {/* Camera dot */}
            <div className="absolute top-1.5 right-3 h-3 w-3 rounded-full bg-zinc-900 ring-1 ring-zinc-800">
              <div className="absolute inset-0.5 rounded-full bg-black">
                <div className="absolute top-0.5 left-0.5 h-1 w-1 rounded-full bg-primary/60" />
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-30 h-10 px-7 flex items-center justify-between text-[10px] font-semibold text-white">
            <span className="tabular-nums">9:41</span>
            <span className="opacity-80 flex items-center gap-1">
              <span className="text-[8px]">●●●</span>
              <span className="text-[9px]">5G</span>
              <span className="ml-0.5 inline-block w-4 h-2 rounded-sm border border-white/60 relative">
                <span className="absolute inset-0.5 bg-white rounded-[1px]" />
              </span>
            </span>
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 pt-10 dark">
            <PhoneScreen activeScene={activeScene} />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 h-1 w-28 rounded-full bg-white/30" />

          {/* ── GLOSSY SHEEN (moves with cursor) ── */}
          <motion.div
            aria-hidden
            className="absolute inset-0 z-50 pointer-events-none rounded-[38px] mix-blend-screen"
            style={{ background: sheen }}
          />

          {/* ── Edge highlight on the right (catches light when tilted) ── */}
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-px z-40 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.18) 70%, transparent)",
            }}
          />
        </div>
      </div>

      {/* ─── FLOATING NOTIFICATION CARD (behind the phone, popping out) ─── */}
      <motion.div
        style={{
          x: floatX,
          y: floatY,
          transform: `translateZ(80px)`,
          transformStyle: "preserve-3d",
        }}
        className="absolute"
      >
        <FloatingNotification activeScene={activeScene} />
      </motion.div>

      {/* ─── REFLECTION on the floor below the phone ─── */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          top: "100%",
          width: W * 0.85,
          height: 120,
          marginTop: 8,
          background: "radial-gradient(ellipse at center top, rgba(29,158,117,0.16), transparent 70%)",
          filter: "blur(20px)",
          transform: "rotateX(75deg) translateZ(-30px)",
          transformOrigin: "top center",
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Floating notification — sits behind/above the phone in 3D space,
   contextual to the active scene.
═══════════════════════════════════════════════════════════════ */

function FloatingNotification({ activeScene }: { activeScene: number }) {
  const cards = [
    { icon: <Search className="h-3 w-3" />,        title: "8 leads novos",       sub: "Dentistas em SP",     pos: { top: -20,  right: -110 } },
    { icon: <Send className="h-3 w-3" />,          title: "Mensagem enviada",    sub: "(11) 9••••-7890",    pos: { top: 120,  right: -130 } },
    { icon: <Calendar className="h-3 w-3" />,      title: "Cadência ativa",      sub: "3/4 enviadas",       pos: { top: -10,  left: -130  } },
    { icon: <Bell className="h-3 w-3" />,          title: "Lead respondeu",      sub: "Movido para Quentes", pos: { top: 240, right: -150 } },
    { icon: <DollarSign className="h-3 w-3" />,    title: "Negócio fechado",     sub: "R$ 4.800",           pos: { top: -10,  right: -120 } },
  ];
  const c = cards[activeScene];

  return (
    <motion.div
      key={activeScene}
      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="absolute"
      style={c.pos}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/40 bg-card/95 backdrop-blur-md shadow-2xl whitespace-nowrap"
        style={{
          boxShadow: "0 16px 40px rgba(29,158,117,0.35), 0 0 0 1px rgba(29,158,117,0.2) inset",
        }}
      >
        <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          {c.icon}
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-bold text-foreground">{c.title}</p>
          <p className="text-[9px] text-muted-foreground">{c.sub}</p>
        </div>
        {/* Glow dot */}
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0 ml-1" />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Phone screen content per scene
═══════════════════════════════════════════════════════════════ */

function PhoneScreen({ activeScene }: { activeScene: number }) {
  return (
    <motion.div
      key={activeScene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-full w-full flex flex-col"
      style={{ background: "#0a1210" }}
    >
      {activeScene === 0 && <Scene1Capture />}
      {activeScene === 1 && <Scene2FirstMessage />}
      {activeScene === 2 && <Scene3Cadence />}
      {activeScene === 3 && <Scene4Reply />}
      {activeScene === 4 && <Scene5Closed />}
    </motion.div>
  );
}

/* ── WhatsApp-style header used in scenes 2-4 ── */
function WhatsAppHeader({ name = "Clínica Sorriso", status = "online" }: { name?: string; status?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 h-11 bg-[#075E54] text-white shrink-0">
      <ArrowLeft className="h-4 w-4" />
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold">
        CS
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate">{name}</p>
        <p className="text-[9px] opacity-80">{status}</p>
      </div>
      <Video className="h-3.5 w-3.5 opacity-90" />
      <Phone className="h-3.5 w-3.5 opacity-90" />
      <MoreVertical className="h-3.5 w-3.5 opacity-90" />
    </div>
  );
}

/* ── WhatsApp-style input bar ── */
function WhatsAppInput({ text }: { text: string }) {
  return (
    <div className="shrink-0 flex items-center gap-1.5 p-1.5 bg-[#0a0a0b] border-t border-white/5">
      <Smile className="h-4 w-4 text-white/50" />
      <Paperclip className="h-4 w-4 text-white/50" />
      <div className="flex-1 px-2.5 h-7 rounded-full bg-white/[0.06] flex items-center text-[10px] text-white/55 truncate">
        {text}
      </div>
      <Mic className="h-4 w-4 text-white/50" />
      <button className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
        <Send className="h-3 w-3 text-white" />
      </button>
    </div>
  );
}

/* ── Scene 1 — Lead capture (LeadsPro app, not WhatsApp) ── */
function Scene1Capture() {
  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0b]">
      {/* App header */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-white/5 shrink-0">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">L</div>
        <p className="text-[11px] font-bold text-white">Buscar Leads</p>
      </div>
      {/* Search bar */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 px-2.5 h-8 rounded-md bg-white/[0.04] border border-white/8">
          <Search className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-white/80">Dentista · São Paulo, SP</span>
        </div>
      </div>
      {/* Progress */}
      <div className="px-3 mb-2 shrink-0">
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
          />
        </div>
        <p className="text-[9px] text-white/55 mt-1">8 leads encontrados em 3s</p>
      </div>
      {/* Lead list */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {[
          "Clínica Sorriso Perfeito",
          "Odonto Center Premium",
          "Dental Arts Vila Olímpia",
          "Sorri Mais Ortodontia",
          "Clínica OdontoVita",
        ].map((n, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18 }}
            className="flex items-center gap-2 p-2 rounded-md bg-white/[0.03] border border-white/5"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {n.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-white truncate">{n}</p>
              <p className="text-[9px] text-primary font-mono truncate">(11) 9{Math.floor(1000 + Math.random() * 9000)}-{Math.floor(1000 + Math.random() * 9000)}</p>
            </div>
            <CheckCheck className="h-3 w-3 text-primary shrink-0" />
          </motion.div>
        ))}
      </div>
      {/* Footer badge */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/15 border border-primary/30">
          <CheckCheck className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-bold text-primary">Salvos no CRM</span>
        </div>
      </div>
    </div>
  );
}

/* ── Scene 2 — First message sent ── */
function Scene2FirstMessage() {
  return (
    <div className="h-full w-full flex flex-col" style={{ background: "linear-gradient(180deg, #0a1210, #0a0a0b)" }}>
      <WhatsAppHeader />
      <div className="flex-1 px-2.5 py-2 space-y-2 overflow-y-auto">
        <div className="flex justify-center">
          <span className="text-[8px] text-white/40 px-2 py-0.5 rounded bg-white/5">HOJE</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <div className="max-w-[80%] px-2.5 py-1.5 rounded-lg bg-[#005c4b] text-white rounded-br-sm">
            <p className="text-[10px] leading-snug">Olá! Vi sua clínica e fiquei interessado em conhecer melhor o trabalho de vocês. Vocês atendem convênios?</p>
            <span className="block text-[8px] opacity-70 mt-0.5 text-right flex items-center justify-end gap-0.5">
              14:32 <CheckCheck className="h-2.5 w-2.5" />
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center"
        >
          <div className="px-2 py-1 rounded bg-primary/10 border border-primary/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-mono text-primary">IA · variando texto · próximo lead em 47s</span>
          </div>
        </motion.div>
      </div>
      <WhatsAppInput text="Mensagem disparada pela campanha" />
    </div>
  );
}

/* ── Scene 3 — Cadence sequence ── */
function Scene3Cadence() {
  const messages = [
    { day: "DIA 1", text: "Olá! Vi sua clínica...", sent: true, delay: 0 },
    { day: "DIA 3", text: "Oi, passando só pra confirmar se minha mensagem chegou 🙂", sent: true, delay: 0.4 },
    { day: "DIA 5", text: "Última tentativa — caso prefira, posso te mandar um resumo rápido", sent: true, delay: 0.8 },
  ];
  return (
    <div className="h-full w-full flex flex-col" style={{ background: "linear-gradient(180deg, #0a1210, #0a0a0b)" }}>
      <WhatsAppHeader status="visto pela última vez ontem" />
      <div className="flex-1 px-2.5 py-2 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: m.delay }}
          >
            <div className="flex justify-center mb-1">
              <span className="text-[8px] text-white/40 px-2 py-0.5 rounded bg-white/5">{m.day}</span>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[80%] px-2.5 py-1.5 rounded-lg bg-[#005c4b] text-white rounded-br-sm">
                <p className="text-[10px] leading-snug">{m.text}</p>
                <span className="block text-[8px] opacity-70 mt-0.5 text-right flex items-center justify-end gap-0.5">
                  <CheckCheck className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center pt-2"
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold text-primary">Cadência ativa · 3/4 enviadas</span>
          </div>
        </motion.div>
      </div>
      <WhatsAppInput text="Cadência rodando automaticamente" />
    </div>
  );
}

/* ── Scene 4 — Lead replies ── */
function Scene4Reply() {
  return (
    <div className="h-full w-full flex flex-col" style={{ background: "linear-gradient(180deg, #0a1210, #0a0a0b)" }}>
      <WhatsAppHeader status="digitando..." />
      <div className="flex-1 px-2.5 py-2 space-y-2 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }} className="flex justify-end">
          <div className="max-w-[80%] px-2.5 py-1.5 rounded-lg bg-[#005c4b] text-white rounded-br-sm">
            <p className="text-[10px] leading-snug">Última tentativa — caso prefira, posso te mandar um resumo rápido</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-start"
        >
          <div className="bg-white/[0.06] border border-white/10 px-3 py-2 rounded-lg rounded-bl-sm flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "120ms" }} />
            <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "240ms" }} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex justify-start"
        >
          <div className="max-w-[80%] px-2.5 py-1.5 rounded-lg bg-white/[0.08] text-white rounded-bl-sm border border-white/10">
            <p className="text-[10px] leading-snug">Oi! Tenho interesse sim. Pode me passar valores?</p>
            <span className="block text-[8px] opacity-70 mt-0.5 text-right">14:48</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.2 }}
          className="flex justify-center pt-1"
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center gap-1.5">
            <Users className="h-3 w-3 text-orange-400" />
            <span className="text-[9px] font-bold text-orange-400">Lead movido pra "Quentes"</span>
          </div>
        </motion.div>
      </div>
      <WhatsAppInput text="Você atende ou deixa o bot continuar?" />
    </div>
  );
}

/* ── Scene 5 — Closed ── */
function Scene5Closed() {
  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0b]">
      <div className="flex items-center gap-2 px-3 h-10 border-b border-white/5 shrink-0">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">L</div>
        <p className="text-[11px] font-bold text-white">Pipeline</p>
      </div>
      {/* Kanban-ish */}
      <div className="flex-1 px-2.5 py-2 grid grid-rows-4 gap-1.5 overflow-hidden">
        {[
          { name: "Novos",     cnt: 12, color: "#3b82f6", lit: false },
          { name: "Quentes",   cnt: 5,  color: "#f97316", lit: false },
          { name: "Agendados", cnt: 3,  color: "#a855f7", lit: false },
          { name: "Fechados",  cnt: 9,  color: "#10b981", lit: true  },
        ].map((c, i) => (
          <div
            key={i}
            className={`rounded-md border px-2 py-1.5 flex items-center justify-between transition-all ${
              c.lit ? "ring-2 ring-emerald-500/50" : ""
            }`}
            style={{ borderColor: `${c.color}55`, background: c.lit ? `${c.color}15` : "transparent" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{c.name}</span>
            </div>
            <span className="text-[10px] tabular-nums" style={{ color: c.color }}>{c.cnt}</span>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="mx-2.5 mb-2.5 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-white truncate">Clínica Sorriso Perfeito</p>
            <p className="text-[9px] text-emerald-400">Fechado · R$ 4.800</p>
          </div>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[8px] text-white/55">
          <span className="text-primary">+24%</span> vs mês passado · pipeline R$ 18.4k
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Flat narrative (mobile + reduced motion)
═══════════════════════════════════════════════════════════════ */

function FlatNarrative() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {SCENES.map((s, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 rounded-2xl border border-border bg-card"
        >
          <div className="shrink-0 h-10 w-10 rounded-xl gradient-bg flex items-center justify-center text-primary-foreground font-bold font-mono text-sm">
            {String(i + 1).padStart(2, "0")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono text-primary uppercase tracking-wider mb-1">{s.tag}</p>
            <h4 className="text-base sm:text-lg font-bold font-display text-foreground mb-1.5 leading-tight">{s.title}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.copy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
