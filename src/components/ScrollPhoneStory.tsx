import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import {
  ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send,
  CheckCheck, Search, Users, Calendar, DollarSign, TrendingUp,
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

  // Phone hover-tilt (combined with subtle scroll-driven rotation)
  const phoneRotateY = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [0, 0, 0] : [-6, 0, 6]);

  // Mobile / reduced-motion: render flat narrative
  if (reduce) {
    return (
      <FlatNarrative />
    );
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
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-16 items-center">
            {/* Left: scene narration */}
            <SceneText activeScene={activeScene} />

            {/* Center: phone */}
            <div className="flex justify-center" style={{ perspective: "1400px" }}>
              <motion.div
                style={{
                  rotateY: phoneRotateY,
                  transformStyle: "preserve-3d",
                }}
              >
                <Phone3D activeScene={activeScene} />
              </motion.div>
            </div>

            {/* Right: scene progress dots + visual cue */}
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

function Phone3D({ activeScene }: { activeScene: number }) {
  return (
    <div
      className="relative"
      style={{
        width: 300,
        height: 600,
      }}
    >
      {/* Glow */}
      <div
        aria-hidden
        className="absolute -inset-12 rounded-[64px] pointer-events-none"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, rgba(29,158,117,0.32), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Phone body */}
      <div
        className="relative w-full h-full rounded-[44px] p-[10px]"
        style={{
          background: "linear-gradient(145deg, #1a1a1c, #0a0a0b)",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.04) inset, 0 0 0 8px rgba(0,0,0,0.6)",
        }}
      >
        {/* Screen */}
        <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-black">
          {/* Notch / dynamic island */}
          <div
            aria-hidden
            className="absolute top-1.5 left-1/2 -translate-x-1/2 z-30 h-6 w-24 rounded-full bg-black"
          />
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-20 h-9 px-6 flex items-center justify-between text-[10px] font-semibold text-white">
            <span className="tabular-nums">9:41</span>
            <span className="opacity-80">●●● 5G</span>
          </div>

          {/* Screen content */}
          <div className="absolute inset-0 pt-9 dark">
            <PhoneScreen activeScene={activeScene} />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
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
