import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Search, MapPin, Phone, Mail, Instagram, Linkedin, Globe,
  Download, FolderOpen, Loader2, CheckCircle2,
  LayoutDashboard, Users, Send, MessageCircle, Kanban, Settings,
  Bot, Paperclip, Smile, Mic, Plus, Filter, MoreVertical,
  TrendingUp, Target, Clock, Flame,
} from "lucide-react";

/**
 * HeroProductMockup — faithful, interactive recreation of LeadsPro screens.
 *
 * Click sidebar icons to switch between 5 real-app screens:
 *   1. Dashboard  (overview stats)
 *   2. Search     (busca de leads, with live streaming animation)
 *   3. CRM        (table of saved leads)
 *   4. Inbox      (WhatsApp conversation)
 *   5. Kanban     (sales pipeline drag-drop columns)
 *
 * Auto-cycles every 6s; pauses while the visitor is hovering / interacting.
 * Honors prefers-reduced-motion.
 */

type View = "dashboard" | "search" | "crm" | "inbox" | "kanban";

interface FakeLead {
  category: string;
  name: string;
  phone: string;
  status?: "novo" | "quente" | "frio" | "agendado" | "fechado";
  hasEmail?: boolean;
  hasInstagram?: boolean;
  hasLinkedin?: boolean;
  hasSite?: boolean;
}

const FAKE_LEADS: FakeLead[] = [
  { category: "Dentista", name: "Clínica Sorriso Perfeito",   phone: "(11) 3456-7890", status: "quente",   hasEmail: true,  hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Odonto Center Premium",       phone: "(11) 4567-8901", status: "agendado", hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
  { category: "Dentista", name: "Dental Arts Vila Olímpia",    phone: "(11) 5678-9012", status: "novo",     hasEmail: false, hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Sorri Mais Ortodontia",       phone: "(11) 6789-0123", status: "fechado",  hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: false },
  { category: "Dentista", name: "Clínica OdontoVita",          phone: "(11) 7890-1234", status: "frio",     hasEmail: true,  hasInstagram: false, hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Espaço Odontológico Jardins", phone: "(11) 8901-2345", status: "novo",     hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
  { category: "Dentista", name: "Dr. Pedro Martins — Odonto",  phone: "(11) 9012-3456", status: "quente",   hasEmail: true,  hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Instituto Dental Moema",      phone: "(11) 2345-6789", status: "novo",     hasEmail: false, hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
];

const VIEW_ORDER: View[] = ["dashboard", "search", "crm", "inbox", "kanban"];
const ROUTE_OF: Record<View, string> = {
  dashboard: "/user-dashboard",
  search:    "/user-dashboard/search",
  crm:       "/user-dashboard/leads",
  inbox:     "/user-dashboard/inbox",
  kanban:    "/user-dashboard/kanban",
};
const TITLE_OF: Record<View, string> = {
  dashboard: "Painel",
  search:    "Buscar leads",
  crm:       "Meus leads (CRM)",
  inbox:     "Caixa de entrada",
  kanban:    "Pipeline (Kanban)",
};

export default function HeroProductMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();

  const [view, setView] = useState<View>("search");
  const [hovering, setHovering] = useState(false);

  // Auto-cycle through screens every 6s while not interacting
  useEffect(() => {
    if (reduce || !inView || hovering) return;
    const t = setInterval(() => {
      setView((prev) => {
        const idx = VIEW_ORDER.indexOf(prev);
        return VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
      });
    }, 6000);
    return () => clearInterval(t);
  }, [reduce, inView, hovering]);

  // Subtle hover tilt (desktop)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -1.5, y: px * 1.5 });
  };
  const onLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onLeave}
      className="relative w-full max-w-[640px] mx-auto"
      style={{
        transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      aria-label="Prévia interativa da plataforma LeadsPro"
    >
      {/* Glow behind card */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[32px] pointer-events-none"
        style={{
          background: "radial-gradient(60% 60% at 50% 40%, rgba(29,158,117,0.28), transparent 70%)",
          filter: "blur(26px)",
        }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.6 }}
        className="relative rounded-[14px] overflow-hidden flex"
        style={{
          background: "hsl(240 10% 3.9%)",
          border: "1px solid hsl(240 3.7% 15.9% / 0.8)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        {/* ── Sidebar (interactive) ── */}
        <div className="flex flex-col w-[52px] border-r border-white/5 bg-black/30 py-3 shrink-0">
          <div className="flex flex-col items-center gap-2 mb-3 px-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center text-white font-bold text-[11px]">
              L
            </div>
          </div>
          <NavIcon icon={<LayoutDashboard className="h-3.5 w-3.5" />} label="Painel"               active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavIcon icon={<Search className="h-3.5 w-3.5" />}           label="Buscar leads"        active={view === "search"}    onClick={() => setView("search")} />
          <NavIcon icon={<Users className="h-3.5 w-3.5" />}            label="Meus leads (CRM)"    active={view === "crm"}       onClick={() => setView("crm")} />
          <NavIcon icon={<MessageCircle className="h-3.5 w-3.5" />}    label="Caixa de entrada"    active={view === "inbox"}     onClick={() => setView("inbox")} />
          <NavIcon icon={<Kanban className="h-3.5 w-3.5" />}           label="Pipeline (Kanban)"   active={view === "kanban"}    onClick={() => setView("kanban")} />
          <div className="mt-auto flex flex-col items-center">
            <NavIcon icon={<Settings className="h-3.5 w-3.5" />} label="Ajustes" />
          </div>
        </div>

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-1.5 px-3 h-7 border-b border-white/5 bg-white/[0.02]">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[9px] font-mono text-white/35 tracking-wide truncate">
              app.leadspro.com.br{ROUTE_OF[view]}
            </span>
          </div>

          {/* Page content (animated transition between views) */}
          <div className="bg-[#0a0a0b] flex-1 overflow-hidden relative" style={{ minHeight: 380 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 p-3.5"
              >
                {view === "dashboard" && <DashboardView />}
                {view === "search" && <SearchView reduce={!!reduce} />}
                {view === "crm" && <CrmView />}
                {view === "inbox" && <InboxView reduce={!!reduce} />}
                {view === "kanban" && <KanbanView />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom hint */}
          <div className="border-t border-white/5 bg-black/30 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[9px] text-white/35">{TITLE_OF[view]}</span>
            <div className="flex items-center gap-1">
              {VIEW_ORDER.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`h-1.5 rounded-full transition-all ${v === view ? "w-4 bg-[#5DCAA5]" : "w-1.5 bg-white/15 hover:bg-white/30"}`}
                  aria-label={TITLE_OF[v]}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating "tela ao vivo" badge */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -bottom-4 -left-3 sm:-left-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f1a18] border border-[#1D9E75]/30"
        style={{ boxShadow: "0 12px 32px rgba(29,158,117,0.28)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center">
          <span className={`h-2 w-2 rounded-full bg-[#5DCAA5] ${reduce ? "" : "animate-pulse"}`} />
        </div>
        <div className="leading-tight">
          <p className="text-[9px] text-white/55">Clique nos ícones</p>
          <p className="text-[11px] font-bold text-white">Demo interativa</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="absolute -top-3 -right-2 sm:-right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f1a18] border border-emerald-500/30"
        style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.4)" }}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-white">5 telas em 1 plataforma</span>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Sidebar nav button — with hover-expand tooltip
═══════════════════════════════════════════════════════════════ */

function NavIcon({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative mx-auto mb-1 h-8 w-8 rounded-md flex items-center justify-center transition-all ${
        active
          ? "bg-[#1D9E75]/20 text-[#5DCAA5] ring-1 ring-[#1D9E75]/40"
          : "text-white/35 hover:text-white hover:bg-white/[0.04]"
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 z-30 px-2 py-1 rounded-md bg-black/90 border border-white/10 text-[10px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 1 — DASHBOARD
═══════════════════════════════════════════════════════════════ */

function DashboardView() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-[13px] font-bold text-white">Painel de Controle</h1>
        <p className="text-[10px] text-white/45 mt-0.5">Resumo da sua operação</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-2">
        <Kpi icon={<Target className="h-3 w-3" />} value="1.247" label="Leads"   tone="emerald" />
        <Kpi icon={<Send className="h-3 w-3" />}   value="3.802" label="Mensagens" tone="emerald" />
        <Kpi icon={<TrendingUp className="h-3 w-3" />} value="38%" label="Resposta" tone="emerald" />
        <Kpi icon={<Flame className="h-3 w-3" />}  value="14"    label="Quentes"  tone="orange" />
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-white/8 bg-[#111113] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-white">Leads capturados — últimos 7 dias</span>
          <span className="text-[9px] text-[#5DCAA5]">+24%</span>
        </div>
        <div className="flex items-end gap-1.5 h-[80px]">
          {[42, 58, 51, 73, 65, 88, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-sm bg-gradient-to-t from-[#1D9E75] to-[#5DCAA5]"
                style={{ height: `${h}%` }}
              />
              <span className="text-[7px] text-white/40">{["S","T","Q","Q","S","S","D"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-white/8 bg-[#111113] p-3">
        <span className="text-[10px] font-semibold text-white block mb-2">Atividade recente</span>
        <div className="space-y-1.5">
          {[
            { dot: "#5DCAA5", text: "12 novos leads capturados em São Paulo, SP", time: "agora" },
            { dot: "#5DCAA5", text: "Campanha 'Dentistas SP' enviou 80 mensagens", time: "5 min" },
            { dot: "#fbbf24", text: "Lead 'Clínica Sorriso' respondeu — quente", time: "12 min" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.dot }} />
              <span className="text-[10px] text-white/75 flex-1 truncate">{a.text}</span>
              <span className="text-[8px] text-white/35">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: "emerald" | "orange" }) {
  const toneCls = tone === "emerald" ? "text-[#5DCAA5] bg-[#1D9E75]/10" : "text-orange-300 bg-orange-500/10";
  return (
    <div className="rounded-lg border border-white/8 bg-[#111113] p-2">
      <div className={`h-5 w-5 rounded ${toneCls} flex items-center justify-center mb-1`}>{icon}</div>
      <p className="text-[12px] font-bold text-white tabular-nums leading-tight">{value}</p>
      <p className="text-[8px] text-white/45 uppercase tracking-wider">{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 2 — SEARCH (live streaming)
═══════════════════════════════════════════════════════════════ */

function SearchView({ reduce }: { reduce: boolean }) {
  const [visibleRows, setVisibleRows] = useState(reduce ? FAKE_LEADS.length : 0);
  const [progress, setProgress] = useState(reduce ? 100 : 0);
  const [searching, setSearching] = useState(!reduce);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const total = FAKE_LEADS.length;
    setVisibleRows(0); setProgress(0); setSearching(true);
    const tick = setInterval(() => {
      i += 1;
      setVisibleRows(i);
      setProgress(Math.round((i / total) * 100));
      if (i >= total) {
        clearInterval(tick);
        setTimeout(() => setSearching(false), 250);
      }
    }, 200);
    return () => clearInterval(tick);
  }, [reduce]);

  return (
    <div className="space-y-2.5">
      <div>
        <h1 className="text-[13px] font-bold text-white">Busca de Leads</h1>
        <p className="text-[10px] text-white/45 mt-0.5">Encontre empresas por categoria e localização</p>
      </div>

      <div className="rounded-lg border border-white/8 bg-[#111113] p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] font-medium text-white/60">Categoria(s) *</label>
            <div className="mt-1 flex items-center gap-1 flex-wrap min-h-[26px] px-2 py-1 rounded-md bg-black/30 border border-white/10">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#5DCAA5] font-semibold">Dentista ×</span>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-medium text-white/60">Localização</label>
            <div className="mt-1 flex items-center gap-1.5 px-2 h-[26px] rounded-md bg-black/30 border border-white/10">
              <MapPin className="h-2.5 w-2.5 text-[#5DCAA5]" />
              <span className="text-[10px] text-white/80 truncate">São Paulo, SP</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex-1">
            <div className="space-y-1">
              <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1D9E75] to-[#5DCAA5] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[9px] text-white/50 flex items-center gap-1">
                {searching ? (
                  <>
                    <Loader2 className={`h-2.5 w-2.5 ${reduce ? "" : "animate-spin"}`} />
                    {visibleRows}/{FAKE_LEADS.length} leads encontrados...
                  </>
                ) : (
                  <><CheckCircle2 className="h-2.5 w-2.5 text-[#5DCAA5]" /> Busca concluída!</>
                )}
              </p>
            </div>
          </div>
          <button
            className="shrink-0 flex items-center gap-1 px-3 h-7 rounded-md text-[10px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #1D9E75 0%, #0f6b4e 100%)", boxShadow: "0 4px 14px rgba(29,158,117,0.35)" }}
          >
            <Search className="h-2.5 w-2.5" /> Buscar Leads
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/8 bg-[#111113] p-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-[#5DCAA5]" />
            <span className="text-[11px] font-semibold text-white">{visibleRows} leads</span>
            {!searching && visibleRows > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-semibold">✅ Salvos no CRM</span>
            )}
          </div>
        </div>
        <div className="rounded border border-white/8 overflow-hidden">
          <div className="grid grid-cols-[64px_1fr_88px_22px_22px_22px_22px] gap-2 px-2 py-1.5 bg-black/30 border-b border-white/5 text-[8px] font-semibold text-white/50 uppercase tracking-wider">
            <span>Categoria</span><span>Nome</span><span>Telefone</span>
            <span className="text-center">✉</span><span className="text-center">IG</span>
            <span className="text-center">IN</span><span className="text-center">🌐</span>
          </div>
          <div className="divide-y divide-white/5">
            {FAKE_LEADS.slice(0, visibleRows).map((lead, i) => (
              <motion.div
                key={i}
                initial={reduce ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-[64px_1fr_88px_22px_22px_22px_22px] gap-2 px-2 py-1.5 items-center"
              >
                <span className="text-[8px] px-1 py-0.5 rounded border border-white/15 text-white/65 truncate">{lead.category}</span>
                <span className="text-[10px] font-medium text-white truncate">{lead.name}</span>
                <span className="text-[9px] text-[#5DCAA5] font-mono flex items-center gap-1 truncate">
                  <Phone className="h-2 w-2 shrink-0" />
                  <span className="truncate">{lead.phone}</span>
                </span>
                <span className="flex justify-center">{lead.hasEmail ? <Mail className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}</span>
                <span className="flex justify-center">{lead.hasInstagram ? <Instagram className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}</span>
                <span className="flex justify-center">{lead.hasLinkedin ? <Linkedin className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}</span>
                <span className="flex justify-center">{lead.hasSite ? <Globe className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 3 — CRM
═══════════════════════════════════════════════════════════════ */

const STATUS_META: Record<NonNullable<FakeLead["status"]>, { label: string; cls: string }> = {
  novo:     { label: "Novo",     cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  quente:   { label: "Quente",   cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  frio:     { label: "Frio",     cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  agendado: { label: "Agendado", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  fechado:  { label: "Fechado",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

function CrmView() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[13px] font-bold text-white">Meus Leads</h1>
          <p className="text-[10px] text-white/45 mt-0.5">1.247 leads no CRM</p>
        </div>
        <div className="flex items-center gap-1">
          <MiniBtn icon={<Filter className="h-2.5 w-2.5" />} label="Filtros" />
          <MiniBtn icon={<Plus className="h-2.5 w-2.5" />} label="Novo" primary />
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-2.5 h-7 rounded-md bg-black/30 border border-white/8">
        <Search className="h-3 w-3 text-white/35" />
        <span className="text-[10px] text-white/45">Buscar por nome, telefone ou categoria...</span>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-1.5">
        <Chip count={42} label="Novos" tone="blue" />
        <Chip count={14} label="Quentes" tone="orange" />
        <Chip count={8}  label="Agendados" tone="purple" />
        <Chip count={29} label="Fechados" tone="emerald" />
      </div>

      {/* Lead cards list */}
      <div className="rounded-lg border border-white/8 bg-[#111113] divide-y divide-white/5">
        {FAKE_LEADS.slice(0, 6).map((lead, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-white/[0.02]">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {lead.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-white truncate">{lead.name}</p>
              <p className="text-[9px] text-white/45 font-mono truncate">{lead.phone} · {lead.category}</p>
            </div>
            {lead.status && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${STATUS_META[lead.status].cls}`}>
                {STATUS_META[lead.status].label}
              </span>
            )}
            <MoreVertical className="h-3 w-3 text-white/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBtn({ icon, label, primary = false }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 h-6 rounded text-[9px] font-semibold ${
        primary
          ? "bg-gradient-to-r from-[#1D9E75] to-[#0f6b4e] text-white"
          : "border border-white/10 text-white/70"
      }`}
    >
      {icon}{label}
    </div>
  );
}

function Chip({ count, label, tone }: { count: number; label: string; tone: "blue" | "orange" | "purple" | "emerald" }) {
  const cls = {
    blue:    "bg-blue-500/10 text-blue-300 border-blue-500/20",
    orange:  "bg-orange-500/10 text-orange-300 border-orange-500/20",
    purple:  "bg-purple-500/10 text-purple-300 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  }[tone];
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${cls}`}>
      <span className="tabular-nums">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 4 — INBOX (WhatsApp conversation)
═══════════════════════════════════════════════════════════════ */

const INBOX_THREADS = [
  { name: "Clínica Sorriso Perfeito", last: "Pode ser hoje 15h?", time: "agora", unread: 1, online: true },
  { name: "Odonto Center Premium",    last: "Obrigado pelas info",  time: "5 min", unread: 0 },
  { name: "Dental Arts Vila Olímpia", last: "Vou pensar e volto",   time: "32 min", unread: 0 },
  { name: "Sorri Mais Ortodontia",    last: "Quero saber preço",    time: "1h",    unread: 2 },
];

const INBOX_MESSAGES = [
  { from: "lead", text: "Oi, vi vocês e fiquei interessada", time: "14:32" },
  { from: "me",   text: "Olá! Que bom 😊 Em qual região você está?", time: "14:32" },
  { from: "lead", text: "Vila Mariana, SP. Atendem aqui?", time: "14:33" },
  { from: "me",   text: "Sim! Atendemos Vila Mariana e região. Posso te explicar como funciona?", time: "14:33" },
  { from: "lead", text: "Pode ser hoje 15h?", time: "14:34" },
];

function InboxView({ reduce }: { reduce: boolean }) {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setTyping(true), 1500);
    const t2 = setTimeout(() => setTyping(false), 3500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [reduce]);

  return (
    <div className="grid grid-cols-[150px_1fr] gap-2 h-full">
      {/* Threads */}
      <div className="rounded-lg border border-white/8 bg-[#111113] p-1.5 space-y-0.5 overflow-y-auto">
        <div className="flex items-center gap-1.5 px-1.5 py-1 mb-1">
          <Search className="h-2.5 w-2.5 text-white/35" />
          <span className="text-[9px] text-white/40">Buscar conversa</span>
        </div>
        {INBOX_THREADS.map((t, i) => (
          <div key={i} className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded ${i === 0 ? "bg-[#1D9E75]/10 border border-[#1D9E75]/20" : "hover:bg-white/[0.03]"}`}>
            <div className="relative shrink-0">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center text-[8px] font-bold text-white">
                {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              {t.online && <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 border border-[#111113]" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold text-white truncate">{t.name}</p>
              <p className="text-[8px] text-white/45 truncate">{t.last}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[7px] text-white/40">{t.time}</p>
              {t.unread > 0 && (
                <span className="inline-block mt-0.5 text-[7px] font-bold bg-[#1D9E75] text-white rounded-full h-3 min-w-3 px-1 leading-3">{t.unread}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Conversation */}
      <div className="rounded-lg border border-white/8 bg-[#111113] flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-white/5 bg-black/30">
          <div className="relative">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center text-[8px] font-bold text-white">CS</div>
            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 border border-[#111113]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-white truncate">Clínica Sorriso Perfeito</p>
            <p className="text-[8px] text-emerald-400">online</p>
          </div>
          <Bot className="h-3 w-3 text-[#5DCAA5]" />
        </div>

        <div className="flex-1 px-2.5 py-2 space-y-1.5 overflow-y-auto" style={{ background: "linear-gradient(180deg, #0a1210, #0a0a0b)" }}>
          {INBOX_MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-2 py-1 rounded-lg text-[10px] ${
                  m.from === "me"
                    ? "bg-[#1D9E75]/85 text-white rounded-br-sm"
                    : "bg-white/[0.06] text-white/90 rounded-bl-sm"
                }`}
              >
                {m.text}
                <span className="block text-[7px] opacity-60 mt-0.5 text-right">{m.time}</span>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white/[0.06] px-2 py-1.5 rounded-lg rounded-bl-sm flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="h-1 w-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 p-1.5 flex items-center gap-1 bg-black/30">
          <Smile className="h-3 w-3 text-white/40" />
          <Paperclip className="h-3 w-3 text-white/40" />
          <div className="flex-1 px-2 h-6 rounded-md bg-white/[0.04] flex items-center">
            <span className="text-[9px] text-white/40">Digite uma mensagem...</span>
          </div>
          <Mic className="h-3 w-3 text-white/40" />
          <button className="h-6 w-6 rounded-md bg-[#1D9E75] flex items-center justify-center">
            <Send className="h-2.5 w-2.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 5 — KANBAN
═══════════════════════════════════════════════════════════════ */

const KANBAN_COLUMNS: { title: string; color: string; cards: { name: string; tag?: string }[] }[] = [
  { title: "Novos",     color: "#3b82f6", cards: [
    { name: "Dental Arts Vila Olímpia", tag: "Dentista" },
    { name: "Espaço Odontológico",      tag: "Dentista" },
    { name: "Instituto Dental Moema",   tag: "Dentista" },
  ]},
  { title: "Quentes",   color: "#f97316", cards: [
    { name: "Clínica Sorriso Perfeito", tag: "WhatsApp" },
    { name: "Dr. Pedro Martins",        tag: "Email" },
  ]},
  { title: "Agendados", color: "#a855f7", cards: [
    { name: "Odonto Center Premium",    tag: "15h hoje" },
  ]},
  { title: "Fechados",  color: "#10b981", cards: [
    { name: "Sorri Mais Ortodontia",    tag: "R$ 4.800" },
    { name: "Clínica OdontoVita",       tag: "R$ 2.300" },
  ]},
];

function KanbanView() {
  return (
    <div className="space-y-2.5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[13px] font-bold text-white">Pipeline de Vendas</h1>
          <p className="text-[10px] text-white/45 mt-0.5">Arraste os leads entre as colunas</p>
        </div>
        <div className="flex items-center gap-1">
          <MiniBtn icon={<Filter className="h-2.5 w-2.5" />} label="Categoria" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {KANBAN_COLUMNS.map((col, ci) => (
          <div key={ci} className="rounded-lg border border-white/8 bg-[#111113] flex flex-col overflow-hidden">
            <div className="px-2 py-1.5 border-b border-white/5 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                <span className="text-[9px] font-semibold text-white uppercase tracking-wider">{col.title}</span>
              </div>
              <span className="text-[8px] text-white/45 tabular-nums">{col.cards.length}</span>
            </div>
            <div className="p-1.5 space-y-1 overflow-y-auto flex-1">
              {col.cards.map((c, i) => (
                <div key={i} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-1.5 hover:bg-white/[0.06] cursor-grab">
                  <p className="text-[9px] font-medium text-white truncate">{c.name}</p>
                  {c.tag && (
                    <span
                      className="inline-block mt-0.5 text-[7px] px-1 py-0.5 rounded font-semibold"
                      style={{ background: `${col.color}22`, color: col.color }}
                    >
                      {c.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
