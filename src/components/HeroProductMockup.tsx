import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Search, MapPin, Phone, Mail, Instagram, Linkedin, Globe,
  Loader2, CheckCircle2,
  LayoutDashboard, Users, Send, MessageCircle, Kanban, Settings,
  Bot, Paperclip, Smile, Mic, Plus, Filter, MoreVertical,
  TrendingUp, Target, Flame, Download, FolderOpen,
  PanelLeft, Coins, ArrowUpRight, HelpCircle, ChevronDown,
  FileText, Pencil,
} from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/**
 * HeroProductMockup — pixel-faithful, interactive demo of the LeadsPro app.
 *
 * Uses the EXACT same shadcn/ui primitives and design-system tokens as the
 * real product (Card, Table, Badge, Button, Input + bg-card / border-border
 * / text-foreground / text-primary etc.) so the look matches the production
 * UI 1:1.
 *
 * The mockup is force-wrapped in a `dark` class to render consistently
 * inside the dark hero, regardless of the visitor's current theme.
 */

type View = "dashboard" | "search" | "crm" | "inbox" | "kanban";

interface FakeLead {
  category: string;
  name: string;
  phone: string;
  status?: "novo" | "quente" | "frio" | "agendado" | "fechado";
  email?: boolean;
  instagram?: boolean;
  linkedin?: boolean;
  site?: boolean;
}

const FAKE_LEADS: FakeLead[] = [
  { category: "Dentista", name: "Clínica Sorriso Perfeito",   phone: "(11) 3456-7890", status: "quente",   email: true,  instagram: true,  linkedin: false, site: true  },
  { category: "Dentista", name: "Odonto Center Premium",       phone: "(11) 4567-8901", status: "agendado", email: true,  instagram: true,  linkedin: true,  site: true  },
  { category: "Dentista", name: "Dental Arts Vila Olímpia",    phone: "(11) 5678-9012", status: "novo",     email: false, instagram: true,  linkedin: false, site: true  },
  { category: "Dentista", name: "Sorri Mais Ortodontia",       phone: "(11) 6789-0123", status: "fechado",  email: true,  instagram: true,  linkedin: true,  site: false },
  { category: "Dentista", name: "Clínica OdontoVita",          phone: "(11) 7890-1234", status: "frio",     email: true,  instagram: false, linkedin: false, site: true  },
  { category: "Dentista", name: "Espaço Odontológico Jardins", phone: "(11) 8901-2345", status: "novo",     email: true,  instagram: true,  linkedin: true,  site: true  },
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

  // Subtle hover tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -1.2, y: px * 1.2 });
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
      className="relative w-full max-w-[680px] mx-auto"
      style={{
        transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      aria-label="Prévia interativa da plataforma LeadsPro"
    >
      {/* Glow */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[32px] pointer-events-none"
        style={{
          background: "radial-gradient(60% 60% at 50% 40%, rgba(29,158,117,0.28), transparent 70%)",
          filter: "blur(26px)",
        }}
      />

      {/* Force dark theme inside the mockup so tokens resolve to the same dark
          palette as the real app, regardless of the visitor's selected theme */}
      <div className="dark">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden flex bg-background border border-border shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
      >
        {/* ── Sidebar (real UserSidebar style) ── */}
        <aside className="flex flex-col w-[60px] border-r border-sidebar-border bg-sidebar-background py-3 shrink-0">
          <div className="flex justify-center mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
              L
            </div>
          </div>
          <NavIcon icon={<LayoutDashboard className="h-4 w-4" />} label="Painel"          active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavIcon icon={<Search className="h-4 w-4" />}          label="Buscar leads"     active={view === "search"}    onClick={() => setView("search")} />
          <NavIcon icon={<Users className="h-4 w-4" />}           label="Meus leads (CRM)" active={view === "crm"}       onClick={() => setView("crm")} />
          <NavIcon icon={<MessageCircle className="h-4 w-4" />}   label="Caixa de entrada" active={view === "inbox"}     onClick={() => setView("inbox")} />
          <NavIcon icon={<Kanban className="h-4 w-4" />}          label="Pipeline"         active={view === "kanban"}    onClick={() => setView("kanban")} />
          <div className="mt-auto">
            <NavIcon icon={<Settings className="h-4 w-4" />} label="Ajustes" />
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Browser top bar */}
          <div className="flex items-center gap-1.5 px-3 h-7 border-b border-border bg-muted/30">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[10px] font-mono text-muted-foreground tracking-wide truncate">
              app.leadspro.com.br{ROUTE_OF[view]}
            </span>
          </div>

          {/* App top bar (real UserLayout header) */}
          <div className="flex items-center gap-2 px-3 h-10 border-b border-border bg-background">
            <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
            <img src={logoIcon} alt="LeadsPro" className="h-6 w-6" />
            <div className="ml-auto flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 h-6 rounded-md border border-border bg-card">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold text-foreground tabular-nums">9.745</span>
                <span className="text-[10px] text-muted-foreground">créditos</span>
              </div>
              <Button size="sm" className="gradient-bg text-primary-foreground h-6 px-2 text-[10px] gap-1">
                <ArrowUpRight className="h-3 w-3" /> Upgrade
              </Button>
            </div>
          </div>

          {/* Page content */}
          <div className="bg-background flex-1 overflow-hidden relative" style={{ minHeight: 420 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 p-4 overflow-y-auto"
              >
                {view === "dashboard" && <DashboardView />}
                {view === "search" && <SearchView reduce={!!reduce} />}
                {view === "crm" && <CrmView />}
                {view === "inbox" && <InboxView reduce={!!reduce} />}
                {view === "kanban" && <KanbanView />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination dots */}
          <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{TITLE_OF[view]}</span>
            <div className="flex items-center gap-1.5">
              {VIEW_ORDER.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`h-1.5 rounded-full transition-all ${v === view ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                  aria-label={TITLE_OF[v]}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Floating "demo interativa" badge */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -bottom-4 -left-3 sm:-left-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-primary/30"
        style={{ boxShadow: "0 12px 32px rgba(29,158,117,0.28)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <span className={`h-2 w-2 rounded-full bg-primary ${reduce ? "" : "animate-pulse"}`} />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-muted-foreground">Clique nos ícones</p>
          <p className="text-xs font-bold text-foreground">Demo interativa</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="absolute -top-3 -right-2 sm:-right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-emerald-500/30"
        style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.4)" }}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-bold text-foreground">5 telas em 1 plataforma</span>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Sidebar nav button (uses real sidebar tokens)
═══════════════════════════════════════════════════════════════ */

function NavIcon({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative mx-auto mb-1 h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
        active
          ? "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/40"
          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      <span className="pointer-events-none absolute left-full ml-2 z-30 px-2 py-1 rounded-md bg-popover border border-border text-[11px] font-medium text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        {label}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 1 — DASHBOARD (real Card + grid)
═══════════════════════════════════════════════════════════════ */

function DashboardView() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold font-display text-foreground">Painel de Controle</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Resumo da sua operação</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Kpi icon={<Target className="h-3.5 w-3.5" />}     value="1.247" label="Leads"     />
        <Kpi icon={<Send className="h-3.5 w-3.5" />}       value="3.802" label="Mensagens" />
        <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} value="38%"   label="Resposta"  />
        <Kpi icon={<Flame className="h-3.5 w-3.5" />}      value="14"    label="Quentes" tone="warn" />
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Leads — últimos 7 dias</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">+24%</Badge>
          </div>
          <div className="flex items-end gap-1.5 h-[72px]">
            {[42, 58, 51, 73, 65, 88, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-primary to-accent"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[8px] text-muted-foreground">{["S","T","Q","Q","S","S","D"][i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <span className="text-xs font-semibold text-foreground block">Atividade recente</span>
          {[
            { color: "bg-primary",      text: "12 novos leads em São Paulo, SP", time: "agora" },
            { color: "bg-primary",      text: "Campanha 'Dentistas SP' enviou 80 mensagens", time: "5 min" },
            { color: "bg-orange-400",   text: "Lead 'Clínica Sorriso' respondeu — quente", time: "12 min" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${a.color}`} />
              <span className="text-[11px] text-foreground/80 flex-1 truncate">{a.text}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, value, label, tone = "primary" }: { icon: React.ReactNode; value: string; label: string; tone?: "primary" | "warn" }) {
  const cls = tone === "primary"
    ? "text-primary bg-primary/10"
    : "text-orange-400 bg-orange-500/10";
  return (
    <Card>
      <CardContent className="p-2">
        <div className={`h-6 w-6 rounded-md ${cls} flex items-center justify-center mb-1`}>{icon}</div>
        <p className="text-base font-bold text-foreground tabular-nums leading-tight font-display">{value}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 2 — SEARCH (real form + Table from shadcn)
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
    }, 220);
    return () => clearInterval(tick);
  }, [reduce]);

  return (
    <div className="space-y-2.5">
      {/* Help banner — matches "Como usar: Buscar Leads" */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-foreground">Como usar: Buscar Leads</span>
        </div>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Credits card */}
      <Card>
        <CardContent className="p-2.5 flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Coins className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground tabular-nums">9.745 créditos restantes</p>
            <p className="text-[9px] text-muted-foreground">255 usados de 10.000 · 1 crédito por lead</p>
          </div>
          <div className="hidden sm:block w-20 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
            <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: "97%" }} />
          </div>
          <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 shrink-0 border-primary/40 text-primary">
            Comprar <ArrowUpRight className="h-2.5 w-2.5 ml-0.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Page title — gradient teal like real app */}
      <div>
        <h1 className="text-lg font-bold font-display gradient-text">Buscar Leads</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Busca de leads direto no Google Maps com redes sociais · 9.745 créditos disponíveis
        </p>
      </div>

      {/* Form card */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          {/* Categoria header + toggle */}
          <div>
            <label className="text-[10px] font-bold text-foreground block mb-1.5">Categoria / Atividade *</label>
            <div className="flex items-center gap-1 mb-1.5">
              <button className="flex items-center gap-1 px-2 h-6 rounded-md border border-primary/40 bg-primary/10 text-primary text-[9px] font-semibold">
                <FileText className="h-2.5 w-2.5" /> Categorias populares
              </button>
              <button className="flex items-center gap-1 px-2 h-6 rounded-md border border-border text-muted-foreground text-[9px] font-medium">
                <Pencil className="h-2.5 w-2.5" /> Digitar livremente
              </button>
            </div>
            <div className="flex items-center justify-between px-2.5 h-7 rounded-md border border-border bg-input">
              <div className="flex items-center gap-1 flex-wrap">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15 text-[9px] py-0">Dentista ×</Badge>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {/* Localização da busca — 5 cards */}
          <div>
            <label className="text-[10px] font-bold text-foreground block mb-1.5">Localização da busca</label>
            <div className="grid grid-cols-5 gap-1">
              <LocationCard flag="🇧🇷" title="Todo Brasil"   sub="Capitais"  active />
              <LocationCard flag="📍" title="Estado"         sub="Inteiro"   />
              <LocationCard flag="🏙️" title="Cidade"         sub="Específica" />
              <LocationCard flag="🌍" title="País"           sub="Inteiro"   />
              <LocationCard flag="🌐" title="País + Cidade" sub="Específica" />
            </div>
          </div>

          {/* Search progress + button */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                {searching ? (
                  <><Loader2 className={`h-3 w-3 ${reduce ? "" : "animate-spin"}`} /> {visibleRows}/{FAKE_LEADS.length} leads encontrados...</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3 text-primary" /> Busca concluída!</>
                )}
              </p>
            </div>
            <Button size="sm" className="gradient-bg text-primary-foreground h-8 text-[10px] shrink-0">
              <Search className="h-3 w-3 mr-1" /> Buscar Leads
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{visibleRows} leads</span>
              <Badge variant="secondary" className="text-[9px] py-0">São Paulo, SP</Badge>
              {!searching && visibleRows > 0 && (
                <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/40 text-emerald-400">✅ Salvos no CRM</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"><Download className="h-2.5 w-2.5 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"><FolderOpen className="h-2.5 w-2.5 mr-1" />Lista</Button>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-7 text-[9px] py-1">Categoria</TableHead>
                  <TableHead className="h-7 text-[9px] py-1">Nome</TableHead>
                  <TableHead className="h-7 text-[9px] py-1">Telefone</TableHead>
                  <TableHead className="h-7 text-[9px] py-1 text-center">✉</TableHead>
                  <TableHead className="h-7 text-[9px] py-1 text-center">IG</TableHead>
                  <TableHead className="h-7 text-[9px] py-1 text-center">IN</TableHead>
                  <TableHead className="h-7 text-[9px] py-1 text-center">🌐</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FAKE_LEADS.slice(0, visibleRows).map((lead, i) => (
                  <motion.tr
                    key={i}
                    initial={reduce ? false : { opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="border-b border-border last:border-0"
                  >
                    <TableCell className="py-1.5 text-[10px]"><Badge variant="outline" className="text-[9px] py-0">{lead.category}</Badge></TableCell>
                    <TableCell className="py-1.5 text-[10px] font-medium truncate max-w-[140px]">{lead.name}</TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[10px] text-primary font-mono flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{lead.phone}</span>
                    </TableCell>
                    <TableCell className="py-1.5 text-center">{lead.email ? <Mail className="h-3 w-3 text-primary mx-auto" /> : <span className="text-muted-foreground text-[9px]">—</span>}</TableCell>
                    <TableCell className="py-1.5 text-center">{lead.instagram ? <Instagram className="h-3 w-3 text-primary mx-auto" /> : <span className="text-muted-foreground text-[9px]">—</span>}</TableCell>
                    <TableCell className="py-1.5 text-center">{lead.linkedin ? <Linkedin className="h-3 w-3 text-primary mx-auto" /> : <span className="text-muted-foreground text-[9px]">—</span>}</TableCell>
                    <TableCell className="py-1.5 text-center">{lead.site ? <Globe className="h-3 w-3 text-primary mx-auto" /> : <span className="text-muted-foreground text-[9px]">—</span>}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LocationCard({ flag, title, sub, active = false }: { flag: string; title: string; sub: string; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-start gap-0.5 px-1.5 py-1.5 rounded-md border text-left transition-all ${
        active
          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <span className="text-[10px] leading-none">{flag}</span>
      <span className="text-[8px] font-bold text-foreground leading-tight truncate w-full">{title}</span>
      <span className="text-[7px] text-muted-foreground leading-tight truncate w-full">{sub}</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 3 — CRM
═══════════════════════════════════════════════════════════════ */

const STATUS_VARIANT: Record<NonNullable<FakeLead["status"]>, { label: string; cls: string }> = {
  novo:     { label: "Novo",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  quente:   { label: "Quente",   cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  frio:     { label: "Frio",     cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  agendado: { label: "Agendado", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  fechado:  { label: "Fechado",  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

function CrmView() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold font-display text-foreground">Meus Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">1.247 leads no CRM</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-[10px] px-2"><Filter className="h-2.5 w-2.5 mr-1" />Filtros</Button>
          <Button size="sm" className="gradient-bg text-primary-foreground h-7 text-[10px] px-2"><Plus className="h-2.5 w-2.5 mr-1" />Novo</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input className="h-8 pl-8 text-[11px]" placeholder="Buscar por nome, telefone ou categoria..." readOnly />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className="text-[10px] py-0.5 border-blue-500/30 text-blue-400 bg-blue-500/10">42 Novos</Badge>
        <Badge variant="outline" className="text-[10px] py-0.5 border-orange-500/30 text-orange-400 bg-orange-500/10">14 Quentes</Badge>
        <Badge variant="outline" className="text-[10px] py-0.5 border-purple-500/30 text-purple-400 bg-purple-500/10">8 Agendados</Badge>
        <Badge variant="outline" className="text-[10px] py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">29 Fechados</Badge>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {FAKE_LEADS.slice(0, 5).map((lead, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                {lead.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground truncate">{lead.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{lead.phone} · {lead.category}</p>
              </div>
              {lead.status && (
                <Badge variant="outline" className={`text-[9px] py-0 ${STATUS_VARIANT[lead.status].cls}`}>
                  {STATUS_VARIANT[lead.status].label}
                </Badge>
              )}
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   View 4 — INBOX (WhatsApp)
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
    const t1 = setTimeout(() => setTyping(true), 1500);
    const t2 = setTimeout(() => setTyping(false), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduce]);

  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 h-full">
      {/* Threads */}
      <Card className="overflow-hidden flex flex-col">
        <CardContent className="p-1.5 space-y-0.5 overflow-y-auto flex-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1 rounded bg-input border border-border">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Buscar</span>
          </div>
          {INBOX_THREADS.map((t, i) => (
            <div key={i} className={`flex items-center gap-2 px-1.5 py-1.5 rounded transition-colors ${i === 0 ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/5"}`}>
              <div className="relative shrink-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                  {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                {t.online && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-card" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-foreground truncate">{t.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{t.last}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] text-muted-foreground">{t.time}</p>
                {t.unread > 0 && (
                  <Badge className="mt-0.5 text-[8px] bg-primary text-primary-foreground hover:bg-primary h-3.5 min-w-3.5 px-1 leading-none rounded-full">{t.unread}</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
          <div className="relative">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[9px] font-bold text-primary-foreground">CS</div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-foreground truncate">Clínica Sorriso Perfeito</p>
            <p className="text-[9px] text-emerald-400">online</p>
          </div>
          <Bot className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto" style={{ background: "linear-gradient(180deg, hsl(160 20% 6%), hsl(240 10% 4%))" }}>
          {INBOX_MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-2.5 py-1 rounded-lg text-[11px] ${
                  m.from === "me"
                    ? "bg-primary/85 text-primary-foreground rounded-br-sm"
                    : "bg-card text-foreground rounded-bl-sm border border-border"
                }`}
              >
                {m.text}
                <span className="block text-[8px] opacity-60 mt-0.5 text-right">{m.time}</span>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-card border border-border px-3 py-2 rounded-lg rounded-bl-sm flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-2 flex items-center gap-1.5 bg-muted/30">
          <Smile className="h-3.5 w-3.5 text-muted-foreground" />
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex-1 px-2.5 h-7 rounded-md bg-input border border-border flex items-center">
            <span className="text-[10px] text-muted-foreground">Digite uma mensagem...</span>
          </div>
          <Mic className="h-3.5 w-3.5 text-muted-foreground" />
          <Button size="icon" className="h-7 w-7 gradient-bg text-primary-foreground">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </Card>
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
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-display text-foreground">Pipeline de Vendas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Arraste leads entre colunas</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2">
          <Filter className="h-2.5 w-2.5 mr-1" />Categoria
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        {KANBAN_COLUMNS.map((col, ci) => (
          <Card key={ci} className="flex flex-col overflow-hidden">
            <div className="px-2 py-1.5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: col.color }} />
                <span className="text-[9px] font-bold text-foreground uppercase tracking-wider truncate">{col.title}</span>
              </div>
              <Badge variant="secondary" className="text-[8px] py-0 h-3.5 min-w-4 px-1">{col.cards.length}</Badge>
            </div>
            <div className="p-1.5 space-y-1.5 overflow-y-auto flex-1">
              {col.cards.map((c, i) => (
                <div key={i} className="rounded border border-border bg-card px-1.5 py-1.5 hover:border-primary/40 cursor-grab transition-colors">
                  <p className="text-[10px] font-semibold text-foreground truncate leading-tight">{c.name}</p>
                  {c.tag && (
                    <span
                      className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${col.color}22`, color: col.color }}
                    >
                      {c.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
