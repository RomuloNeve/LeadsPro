import { useState, useMemo } from "react";
import { useUserData, Lead } from "@/hooks/useUserData";
import { EnrollInCadenceDialog } from "@/components/EnrollInCadenceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUSES, LeadStatus } from "@/components/LeadStatusBadge";
import LeadKanban from "@/components/LeadKanban";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Kanban, TrendingUp, Trophy, AlertTriangle, Filter, Users, Flame, CalendarCheck, ArrowRight,
} from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";
import { useNavigate } from "react-router-dom";

type Period = "7" | "30" | "90" | "all";
const PERIOD_LABELS: Record<Period, string> = {
  "7": "Últimos 7 dias",
  "30": "Últimos 30 dias",
  "90": "Últimos 90 dias",
  all: "Todos os leads",
};

const STALE_DAYS = 7; // Lead in non-"novo" status without update for N days = stale

const UserKanban = () => {
  const navigate = useNavigate();
  const { leads, setLeads, loading, license } = useUserData();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("30");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Derive categories from all non-duplicate leads
  const categories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (!l.is_duplicate && l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Apply period + category filter
  const filteredLeads: Lead[] = useMemo(() => {
    const now = Date.now();
    const cutoff =
      period === "all" ? 0 : now - Number(period) * 24 * 60 * 60 * 1000;
    return leads.filter((l) => {
      if (l.is_duplicate) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (cutoff > 0 && new Date(l.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [leads, period, categoryFilter]);

  // Funnel metrics
  const metrics = useMemo(() => {
    const total = filteredLeads.length;
    const byStatus: Record<string, number> = {};
    LEAD_STATUSES.forEach((s) => { byStatus[s.value] = 0; });
    filteredLeads.forEach((l) => {
      const s = (l.lead_status as string) || "novo";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });

    const contatados = total - byStatus.novo;
    const engajados = byStatus.quente + byStatus.agendado + byStatus.fechado;
    const fechados = byStatus.fechado;

    const taxaResposta = contatados > 0 ? Math.round((engajados / contatados) * 100) : 0;
    const taxaConversao = total > 0 ? Math.round((fechados / total) * 100) : 0;

    // Stale: leads NOT in 'novo', 'fechado' or 'perdido', that were created
    // more than STALE_DAYS ago (proxy for "not updated" since we don't track
    // updated_at separately — created_at is what we have).
    const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
    const activeStatuses = new Set(["quente", "frio", "agendado"]);
    const stale = filteredLeads.filter((l) => {
      const s = (l.lead_status as string) || "novo";
      return activeStatuses.has(s) && new Date(l.created_at).getTime() < staleCutoff;
    });

    return { total, byStatus, contatados, engajados, fechados, taxaResposta, taxaConversao, stale };
  }, [filteredLeads]);

  const changeLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l))
    );
    const { error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus })
      .eq("id", leadId);
    if (error) {
      toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
      // Realtime subscription in useUserData will reconcile; no manual revert needed
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando funil...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTutorial
        title="Pipeline — Funil de Vendas"
        description="Acompanhe o avanço dos leads pelos estágios da venda e identifique oportunidades paradas."
        steps={[
          { emoji: "🎯", text: "Cada coluna é um estágio do funil: Novo → Quente/Frio → Agendado → Fechado (ou Perdido)." },
          { emoji: "🖱️", text: "Arraste cards entre colunas para atualizar o estágio — o banco atualiza em tempo real." },
          { emoji: "📅", text: "Use o filtro de período para focar em leads recentes (7/30/90 dias)." },
          { emoji: "⚠️", text: "Fique de olho no alerta 'Leads parados': contatos quentes sem movimentação há mais de 7 dias." },
          { emoji: "📇", text: "Para editar dados de contato, importar em massa ou ver duplicatas, use a página CRM." },
        ]}
      />

      {/* Header + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Kanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Pipeline de Vendas</h1>
            <p className="text-sm text-muted-foreground">
              {metrics.total} leads · {PERIOD_LABELS[period]}
              {categoryFilter !== "all" && ` · ${categoryFilter}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todos os leads</SelectItem>
            </SelectContent>
          </Select>

          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {license?.id && (
            <EnrollInCadenceDialog
              licenseId={license.id}
              leadIds={filteredLeads.map((l) => l.id)}
            />
          )}
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Total no funil"
          value={metrics.total.toLocaleString("pt-BR")}
          sub={`${metrics.byStatus.novo} novos`}
          tone="neutral"
        />
        <MetricCard
          icon={<Flame className="h-4 w-4" />}
          label="Em aquecimento"
          value={(metrics.byStatus.quente + metrics.byStatus.frio).toLocaleString("pt-BR")}
          sub={`${metrics.byStatus.quente} quentes · ${metrics.byStatus.frio} frios`}
          tone="warn"
        />
        <MetricCard
          icon={<CalendarCheck className="h-4 w-4" />}
          label="Taxa de resposta"
          value={`${metrics.taxaResposta}%`}
          sub={`${metrics.engajados}/${metrics.contatados} contatados`}
          tone="info"
        />
        <MetricCard
          icon={<Trophy className="h-4 w-4" />}
          label="Conversão"
          value={`${metrics.taxaConversao}%`}
          sub={`${metrics.fechados} fechados`}
          tone="success"
        />
      </div>

      {/* Stale alert */}
      {metrics.stale.length > 0 && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {metrics.stale.length} {metrics.stale.length === 1 ? "lead parado" : "leads parados"} há mais de {STALE_DAYS} dias
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Contatos em "Quente", "Frio" ou "Agendado" sem movimento. Mova-os para Fechado/Perdido ou retome o contato.
            </p>
          </div>
          <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-500 shrink-0">
            {metrics.stale.length}
          </Badge>
        </div>
      )}

      {/* Cross-link to CRM */}
      <button
        onClick={() => navigate("/user-dashboard/leads")}
        className="w-full rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors p-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Editar dados, importar planilha ou ver duplicatas?</p>
            <p className="text-xs text-muted-foreground truncate">
              O <strong>CRM</strong> tem a tabela completa com busca, edição em linha, export CSV/Excel e Score IA.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {/* Kanban board */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Kanban className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Nenhum lead no período selecionado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aumente o período ou busque novos leads na página de Busca.
          </p>
        </div>
      ) : (
        <LeadKanban leads={filteredLeads} onChangeStatus={changeLeadStatus} />
      )}
    </div>
  );
};

type MetricTone = "neutral" | "warn" | "info" | "success";
const TONE_CLASSES: Record<MetricTone, { bg: string; text: string }> = {
  neutral: { bg: "bg-muted/50", text: "text-foreground" },
  warn: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-500" },
  info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-500" },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-500" },
};

const MetricCard = ({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: MetricTone;
}) => {
  const t = TONE_CLASSES[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-3 card-shadow">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-7 w-7 rounded-lg ${t.bg} ${t.text} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
    </div>
  );
};

export default UserKanban;
