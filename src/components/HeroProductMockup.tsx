import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Search, MapPin, Phone, Mail, Instagram, Linkedin, Globe,
  Download, FolderOpen, Loader2, CheckCircle2,
  LayoutDashboard, Users, Send, MessageCircle, Kanban, Settings,
} from "lucide-react";

/**
 * HeroProductMockup — faithful recreation of the real LeadsPro UserSearch
 * screen (src/pages/user/UserSearch.tsx) rendered as pure HTML so we can
 * animate rows streaming in as if the search is running live.
 *
 * Honors `prefers-reduced-motion` throughout.
 */

interface FakeLead {
  category: string;
  name: string;
  phone: string;
  hasEmail: boolean;
  hasInstagram: boolean;
  hasLinkedin: boolean;
  hasSite: boolean;
}

const FAKE_LEADS: FakeLead[] = [
  { category: "Dentista", name: "Clínica Sorriso Perfeito",   phone: "(11) 3456-7890", hasEmail: true,  hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Odonto Center Premium",       phone: "(11) 4567-8901", hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
  { category: "Dentista", name: "Dental Arts Vila Olímpia",    phone: "(11) 5678-9012", hasEmail: false, hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Sorri Mais Ortodontia",       phone: "(11) 6789-0123", hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: false },
  { category: "Dentista", name: "Clínica OdontoVita",          phone: "(11) 7890-1234", hasEmail: true,  hasInstagram: false, hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Espaço Odontológico Jardins", phone: "(11) 8901-2345", hasEmail: true,  hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
  { category: "Dentista", name: "Dr. Pedro Martins — Odonto",  phone: "(11) 9012-3456", hasEmail: true,  hasInstagram: true,  hasLinkedin: false, hasSite: true  },
  { category: "Dentista", name: "Instituto Dental Moema",      phone: "(11) 2345-6789", hasEmail: false, hasInstagram: true,  hasLinkedin: true,  hasSite: true  },
];

export default function HeroProductMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();

  // Progressive row reveal — simulates live search streaming
  const [visibleRows, setVisibleRows] = useState(reduce ? FAKE_LEADS.length : 0);
  const [progress, setProgress] = useState(reduce ? 100 : 0);
  const [searching, setSearching] = useState(!reduce);

  useEffect(() => {
    if (!inView || reduce) return;
    let i = 0;
    const total = FAKE_LEADS.length;
    const tick = setInterval(() => {
      i += 1;
      setVisibleRows(i);
      setProgress(Math.round((i / total) * 100));
      if (i >= total) {
        clearInterval(tick);
        setTimeout(() => setSearching(false), 300);
      }
    }, 220);
    return () => clearInterval(tick);
  }, [inView, reduce]);

  // Subtle hover tilt (desktop)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -2, y: px * 2 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full max-w-[620px] mx-auto"
      style={{
        transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
      aria-label="Prévia da plataforma LeadsPro"
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
        {/* ── Sidebar ── */}
        <div className="hidden sm:flex flex-col w-[52px] border-r border-white/5 bg-black/30 py-3 shrink-0">
          <div className="flex flex-col items-center gap-2 mb-3 px-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#1D9E75] to-[#0f6b4e] flex items-center justify-center text-white font-bold text-[11px]">
              L
            </div>
          </div>
          <SidebarIcon icon={<LayoutDashboard className="h-3.5 w-3.5" />} />
          <SidebarIcon icon={<Search className="h-3.5 w-3.5" />} active />
          <SidebarIcon icon={<Users className="h-3.5 w-3.5" />} />
          <SidebarIcon icon={<Send className="h-3.5 w-3.5" />} />
          <SidebarIcon icon={<MessageCircle className="h-3.5 w-3.5" />} />
          <SidebarIcon icon={<Kanban className="h-3.5 w-3.5" />} />
          <div className="mt-auto flex flex-col items-center">
            <SidebarIcon icon={<Settings className="h-3.5 w-3.5" />} />
          </div>
        </div>

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-1.5 px-3 h-7 border-b border-white/5 bg-white/[0.02]">
            <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[9px] font-mono text-white/35 tracking-wide">
              app.leadspro.com.br/user-dashboard/search
            </span>
          </div>

          {/* Page content */}
          <div className="p-3.5 space-y-3 bg-[#0a0a0b]">
            {/* Page header */}
            <div>
              <h1 className="text-[13px] font-bold text-white">Busca de Leads</h1>
              <p className="text-[10px] text-white/45 mt-0.5">
                Encontre empresas por categoria e localização
              </p>
            </div>

            {/* Search form card */}
            <div className="rounded-lg border border-white/8 bg-[#111113] p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-medium text-white/60">Categoria(s) *</label>
                  <div className="mt-1 flex items-center gap-1 flex-wrap min-h-[28px] px-2 py-1 rounded-md bg-black/30 border border-white/10">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#5DCAA5] font-semibold">
                      Dentista ×
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-medium text-white/60">Localização</label>
                  <div className="mt-1 flex items-center gap-1.5 px-2 h-[28px] rounded-md bg-black/30 border border-white/10">
                    <MapPin className="h-2.5 w-2.5 text-[#5DCAA5]" />
                    <span className="text-[10px] text-white/80 truncate">São Paulo, SP</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex-1">
                  {(searching || progress > 0) && (
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1D9E75] to-[#5DCAA5] transition-all duration-300"
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
                  )}
                </div>
                <button
                  className="shrink-0 flex items-center gap-1 px-3 h-7 rounded-md text-[10px] font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, #1D9E75 0%, #0f6b4e 100%)",
                    boxShadow: "0 4px 14px rgba(29,158,117,0.35)",
                  }}
                >
                  <Search className="h-2.5 w-2.5" />
                  Buscar Leads
                </button>
              </div>
            </div>

            {/* Results card */}
            <div className="rounded-lg border border-white/8 bg-[#111113] p-3">
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-[#5DCAA5]" />
                  <span className="text-[11px] font-semibold text-white">
                    {visibleRows} leads
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/15 text-white/60">
                    São Paulo, SP
                  </span>
                  {!searching && visibleRows > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400 font-semibold">
                      ✅ Salvos no CRM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MiniButton icon={<Download className="h-2.5 w-2.5" />} label="CSV" />
                  <MiniButton icon={<FolderOpen className="h-2.5 w-2.5" />} label="Lista" />
                </div>
              </div>

              {/* Table */}
              <div className="rounded border border-white/8 overflow-hidden">
                {/* Head */}
                <div className="grid grid-cols-[70px_1fr_90px_24px_24px_24px_24px] gap-2 px-2 py-1.5 bg-black/30 border-b border-white/5 text-[8px] font-semibold text-white/50 uppercase tracking-wider">
                  <span>Categoria</span>
                  <span>Nome</span>
                  <span>Telefone</span>
                  <span className="text-center">✉</span>
                  <span className="text-center">IG</span>
                  <span className="text-center">IN</span>
                  <span className="text-center">🌐</span>
                </div>
                {/* Rows */}
                <div className="divide-y divide-white/5 max-h-[220px] overflow-hidden">
                  {FAKE_LEADS.slice(0, visibleRows).map((lead, i) => (
                    <motion.div
                      key={i}
                      initial={reduce ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-[70px_1fr_90px_24px_24px_24px_24px] gap-2 px-2 py-1.5 items-center hover:bg-white/[0.02]"
                    >
                      <span className="text-[8px] px-1 py-0.5 rounded border border-white/15 text-white/65 truncate justify-self-start">
                        {lead.category}
                      </span>
                      <span className="text-[10px] font-medium text-white truncate">
                        {lead.name}
                      </span>
                      <span className="text-[9px] text-[#5DCAA5] font-mono flex items-center gap-1 truncate">
                        <Phone className="h-2 w-2 shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </span>
                      <span className="flex justify-center">
                        {lead.hasEmail ? <Mail className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}
                      </span>
                      <span className="flex justify-center">
                        {lead.hasInstagram ? <Instagram className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}
                      </span>
                      <span className="flex justify-center">
                        {lead.hasLinkedin ? <Linkedin className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}
                      </span>
                      <span className="flex justify-center">
                        {lead.hasSite ? <Globe className="h-2.5 w-2.5 text-[#5DCAA5]" /> : <span className="text-white/20 text-[8px]">—</span>}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating "3s per lead" badge */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -bottom-4 -left-3 sm:-left-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f1a18] border border-[#1D9E75]/30"
        style={{ boxShadow: "0 12px 32px rgba(29,158,117,0.28)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center">
          <Search className="h-3.5 w-3.5 text-[#5DCAA5]" />
        </div>
        <div className="leading-tight">
          <p className="text-[9px] text-white/55">Velocidade</p>
          <p className="text-[11px] font-bold text-white">3s por lead</p>
        </div>
      </motion.div>

      {/* Floating "Salvos no CRM" badge (top-right) */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 1.5, duration: 0.4 }}
        className="absolute -top-3 -right-2 sm:-right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f1a18] border border-emerald-500/30"
        style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.4)" }}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-white">Salvos no CRM</span>
      </motion.div>
    </div>
  );
}

/* ── Subcomponents ── */

function SidebarIcon({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={`mx-auto mb-1 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
        active ? "bg-[#1D9E75]/20 text-[#5DCAA5]" : "text-white/30 hover:text-white/60"
      }`}
    >
      {icon}
    </div>
  );
}

function MiniButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 h-6 rounded border border-white/10 text-[9px] font-medium text-white/70">
      {icon}
      {label}
    </div>
  );
}
