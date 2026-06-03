import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, MessageCircle, Kanban, ArrowRight, MapPin, Phone,
  Send, CheckCircle2, Loader2,
} from "lucide-react";

/**
 * HowItWorks3Steps — three-step explainer with embedded mini-screens
 * that match the real product UI. Each step is clickable and shows a
 * focused mockup of the corresponding screen.
 */

type StepKey = "buscar" | "disparar" | "fechar";

const STEPS: {
  key: StepKey;
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  bullets: string[];
}[] = [
  {
    key: "buscar",
    number: "01",
    icon: Search,
    title: "Buscar",
    description: "Pesquise por categoria e cidade. O LeadsPro captura nome, telefone, WhatsApp, Instagram, LinkedIn e site automaticamente.",
    bullets: ["Busca por CNAE ou nome livre", "Brasil + internacional", "Até 60 leads por busca"],
  },
  {
    key: "disparar",
    number: "02",
    icon: MessageCircle,
    title: "Disparar",
    description: "Mande mensagens em massa pelo WhatsApp com proteção anti-banimento. IA varia o texto e o intervalo automaticamente.",
    bullets: ["Variação de texto por IA", "Intervalo aleatório 60-180s", "Limite diário de 150 mensagens"],
  },
  {
    key: "fechar",
    number: "03",
    icon: Kanban,
    title: "Fechar",
    description: "Acompanhe cada lead num pipeline visual. Arraste entre colunas, dispare follow-ups automáticos e veja o que está fechando.",
    bullets: ["Kanban arrastável", "Follow-up dias 1, 3, 5, 7", "Estatísticas em tempo real"],
  },
];

export default function HowItWorks3Steps() {
  const [active, setActive] = useState<StepKey>("buscar");
  const activeStep = STEPS.find((s) => s.key === active)!;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`relative text-left rounded-2xl p-4 sm:p-5 border transition-all ${
                isActive
                  ? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/30 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              {/* Connector arrow on desktop */}
              {i < STEPS.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="hidden md:block absolute top-1/2 -right-2.5 -translate-y-1/2 h-5 w-5 text-primary/40 z-10 bg-background"
                />
              )}
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={`shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? "gradient-bg glow-shadow"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? "text-primary-foreground" : ""}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono px-1.5 py-0 ${isActive ? "border-primary/40 text-primary" : ""}`}
                    >
                      {s.number}
                    </Badge>
                    <span className={`text-base sm:text-lg font-bold font-display ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                      {s.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {s.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active step detail */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.03]">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5 lg:gap-10 items-center">
            {/* Description */}
            <div>
              <Badge className="mb-2 sm:mb-3 bg-primary/10 text-primary hover:bg-primary/10 border-primary/30">
                Passo {activeStep.number}
              </Badge>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-display tracking-tight mb-2 sm:mb-3">
                {activeStep.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-5">
                {activeStep.description}
              </p>
              <ul className="space-y-2">
                {activeStep.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/85">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini screen */}
            <div className="dark">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
                >
                  {active === "buscar" && <BuscarScreen />}
                  {active === "disparar" && <DispararScreen />}
                  {active === "fechar" && <FecharScreen />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Mini screen 1 — BUSCAR
═══════════════════════════════════════════════════════════════ */

function BuscarScreen() {
  const leads = [
    { name: "Clínica Sorriso Perfeito", phone: "(11) 3456-7890" },
    { name: "Odonto Center Premium", phone: "(11) 4567-8901" },
    { name: "Dental Arts Vila Olímpia", phone: "(11) 5678-9012" },
    { name: "Sorri Mais Ortodontia", phone: "(11) 6789-0123" },
    { name: "Clínica OdontoVita", phone: "(11) 7890-1234" },
  ];
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 px-3 h-10 rounded-md bg-input border border-border">
        <Search className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground/80">Dentista · São Paulo, SP</span>
        <span className="ml-auto text-[10px] px-2 py-1 rounded bg-primary/15 text-primary font-bold">BUSCAR</span>
      </div>
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 text-primary animate-spin" />
        <span className="text-xs text-muted-foreground">5/8 leads encontrados...</span>
      </div>
      <div className="space-y-1.5">
        {leads.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
              {l.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{l.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                <Phone className="h-2.5 w-2.5" /> {l.phone}
              </p>
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Mini screen 2 — DISPARAR (WhatsApp messages going out)
═══════════════════════════════════════════════════════════════ */

function DispararScreen() {
  const messages = [
    { name: "Clínica Sorriso", time: "14:32", status: "delivered" },
    { name: "Odonto Center",   time: "14:32", status: "delivered" },
    { name: "Dental Arts",     time: "14:33", status: "read" },
    { name: "Sorri Mais",      time: "14:33", status: "sending" },
  ];
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">Campanha: Dentistas SP</p>
          <p className="text-[10px] text-muted-foreground">Variação por IA · Intervalo 60-180s · Limite 150/dia</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          Em execução
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "62%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">25/40 mensagens enviadas</p>
      </div>

      {/* Recent sends list */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Enviadas agora</p>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.18 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card border border-border"
          >
            <Send className="h-3 w-3 text-primary shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{m.name}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{m.time}</span>
            {m.status === "sending" && <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />}
            {m.status === "delivered" && <span className="text-primary text-[10px]">✓✓</span>}
            {m.status === "read" && <span className="text-emerald-400 text-[10px]">✓✓</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Mini screen 3 — FECHAR (Kanban)
═══════════════════════════════════════════════════════════════ */

function FecharScreen() {
  const cols = [
    { title: "Novos",     color: "#3b82f6", count: 12, cards: ["Dental Arts", "Espaço Odonto"] },
    { title: "Quentes",   color: "#f97316", count: 5,  cards: ["Clínica Sorriso", "Dr. Pedro"] },
    { title: "Agendados", color: "#a855f7", count: 3,  cards: ["Odonto Center"] },
    { title: "Fechados",  color: "#10b981", count: 8,  cards: ["Sorri Mais R$ 4.8k"] },
  ];
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground">Pipeline de Vendas</p>
        <span className="text-[10px] text-muted-foreground">28 leads · R$ 18.4k em fechamento</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {cols.map((c, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-1.5 py-1 border-b border-border bg-muted/50 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[8px] font-bold text-foreground uppercase tracking-wider truncate">{c.title}</span>
              <span className="ml-auto text-[8px] text-muted-foreground tabular-nums">{c.count}</span>
            </div>
            <div className="p-1 space-y-1 min-h-[80px]">
              {c.cards.map((card, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + j * 0.06 }}
                  className="rounded border border-border bg-background px-1.5 py-1 cursor-grab"
                  whileHover={{ y: -2 }}
                >
                  <p className="text-[9px] font-medium text-foreground truncate leading-tight">{card}</p>
                  <span
                    className="inline-block mt-0.5 text-[7px] px-1 py-0.5 rounded font-semibold"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    {c.title.toLowerCase()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
