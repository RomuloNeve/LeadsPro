import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Zap, MessageCircle, Mail, Users, Activity, CheckCircle2,
  XCircle, Pause, Play, Trash2, AlertTriangle, Loader2, PlayCircle, RefreshCw,
  Clock,
} from "lucide-react";

type EnrollmentStatus = "active" | "paused" | "completed" | "replied" | "stopped" | "failed";

interface StepRow {
  id: string;
  step_order: number;
  channel: "whatsapp" | "email";
  delay_hours: number;
  subject: string | null;
  message: string;
}

interface EnrollmentRow {
  id: string;
  lead_id: string;
  current_step: number;
  status: EnrollmentStatus;
  next_run_at: string;
  last_step_at: string | null;
  last_error: string | null;
  paused_reason: string | null;
  created_at: string;
  lead: { id: string; name: string | null; email: string | null; phone: string | null; lead_status: string | null } | null;
}

interface StepPerf {
  step_id: string;
  sent: number;
  errors: number;
  skipped_reply: number;
  skipped_status: number;
}

/* Visual helpers for status -- keep in sync with DB CHECK */
const STATUS_META: Record<EnrollmentStatus, { label: string; className: string }> = {
  active:    { label: "Ativo",     className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  paused:    { label: "Pausado",   className: "bg-muted text-muted-foreground border-muted-foreground/20" },
  completed: { label: "Concluído", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  replied:   { label: "Respondeu", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  stopped:   { label: "Parado",    className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" },
  failed:    { label: "Falha",     className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function UserCadenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { license } = useUserData();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [cadence, setCadence] = useState<{ id: string; name: string; description: string | null; is_active: boolean } | null>(null);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">("all");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [stepPerf, setStepPerf] = useState<StepPerf[]>([]);

  const fetchAll = useCallback(async () => {
    if (!id || !license?.id) return;
    setLoading(true);
    try {
      const [{ data: cad, error: cadErr }, { data: stepRows }, { data: enrollRows }, { data: logRows }] = await Promise.all([
        supabase.from("cadences").select("id, name, description, is_active, license_id").eq("id", id).single(),
        supabase.from("cadence_steps").select("id, step_order, channel, delay_hours, subject, message").eq("cadence_id", id).order("step_order"),
        supabase
          .from("cadence_enrollments")
          .select("id, lead_id, current_step, status, next_run_at, last_step_at, last_error, paused_reason, created_at, lead:leads(id, name, email, phone, lead_status)")
          .eq("cadence_id", id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("cadence_step_logs")
          .select("step_id, status, enrollment_id, enrollment:cadence_enrollments!inner(cadence_id)")
          .eq("enrollment.cadence_id", id),
      ]);
      if (cadErr) throw cadErr;
      if (!cad || cad.license_id !== license.id) {
        toast({ title: "Cadência não encontrada", variant: "destructive" });
        navigate("/user-dashboard/cadences");
        return;
      }
      setCadence({ id: cad.id, name: cad.name, description: cad.description, is_active: cad.is_active });
      setSteps((stepRows || []) as StepRow[]);
      setEnrollments((enrollRows || []) as unknown as EnrollmentRow[]);

      // Aggregate step perf in JS (avoid a group-by RPC)
      const byStep = new Map<string, StepPerf>();
      for (const log of logRows || []) {
        const sid = (log as any).step_id as string;
        if (!sid) continue;
        const curr = byStep.get(sid) || { step_id: sid, sent: 0, errors: 0, skipped_reply: 0, skipped_status: 0 };
        const st = (log as any).status;
        if (st === "sent") curr.sent++;
        else if (st === "error") curr.errors++;
        else if (st === "skipped_reply") curr.skipped_reply++;
        else if (st === "skipped_status") curr.skipped_status++;
        byStep.set(sid, curr);
      }
      setStepPerf([...byStep.values()]);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, license?.id, toast, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* --- Stats --- */
  const stats = useMemo(() => {
    const by: Record<EnrollmentStatus, number> = { active: 0, paused: 0, completed: 0, replied: 0, stopped: 0, failed: 0 };
    for (const e of enrollments) by[e.status] = (by[e.status] || 0) + 1;
    const total = enrollments.length;
    const engaged = by.replied + by.completed;
    const reply_rate = total > 0 ? Math.round((by.replied / total) * 100) : 0;
    return { ...by, total, engaged, reply_rate };
  }, [enrollments]);

  /* --- Actions --- */
  const toggleCadence = async () => {
    if (!cadence) return;
    await supabase.from("cadences").update({ is_active: !cadence.is_active }).eq("id", cadence.id);
    fetchAll();
  };

  const setEnrollmentStatus = async (enrId: string, nextStatus: EnrollmentStatus, reason?: string) => {
    const patch: any = { status: nextStatus };
    if (reason) patch.paused_reason = reason;
    if (nextStatus === "active") {
      patch.paused_reason = null;
      patch.next_run_at = new Date().toISOString(); // run on next tick
    }
    const { error } = await supabase.from("cadence_enrollments").update(patch).eq("id", enrId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchAll();
    }
  };

  const removeEnrollment = async (enrId: string) => {
    if (!confirm("Remover este lead da cadência? (histórico de envios é preservado apenas no log)")) return;
    const { error } = await supabase.from("cadence_enrollments").delete().eq("id", enrId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead removido da cadência" });
      fetchAll();
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-cadences", { body: {} });
      if (error) throw error;
      toast({
        title: "Motor executado ✓",
        description: `Processados: ${data?.picked ?? 0} · Enviados: ${data?.sent ?? 0} · Erros: ${data?.errors ?? 0}`,
      });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Erro ao executar", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  if (loading || !cadence) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link to="/user-dashboard/cadences" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar para cadências
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" /> {cadence.name}
          </h1>
          {cadence.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{cadence.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={runNow} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1.5" />}
            Executar agora
          </Button>
          <label className="flex items-center gap-2 text-sm cursor-pointer px-3 py-1.5 rounded-md border border-border">
            <Switch checked={cadence.is_active} onCheckedChange={toggleCadence} />
            {cadence.is_active ? "Ativa" : "Pausada"}
          </label>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <StatCard icon={Users} label="Inscritos" value={stats.total} tone="neutral" />
        <StatCard icon={Activity} label="Ativos" value={stats.active} tone="info" />
        <StatCard icon={CheckCircle2} label="Respondeu" value={stats.replied} tone="success" sub={`${stats.reply_rate}% do total`} />
        <StatCard icon={Clock} label="Concluído" value={stats.completed} tone="info" />
        <StatCard icon={Pause} label="Pausados" value={stats.paused + stats.stopped} tone="neutral" />
        <StatCard icon={XCircle} label="Falhas" value={stats.failed} tone="warn" />
      </div>

      {/* Per-step performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance por passo</CardTitle>
          <CardDescription>Quantos envios cada passo teve e onde leads saem da régua.</CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta cadência ainda não tem passos configurados.</p>
          ) : (
            <div className="space-y-2">
              {steps.map((step) => {
                const perf = stepPerf.find((p) => p.step_id === step.id) || { sent: 0, errors: 0, skipped_reply: 0, skipped_status: 0 };
                const totalTouched = perf.sent + perf.errors + perf.skipped_reply + perf.skipped_status;
                const barPct = stats.total > 0 ? Math.round((perf.sent / stats.total) * 100) : 0;
                return (
                  <div key={step.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Passo {step.step_order}</Badge>
                        <Badge className={step.channel === "whatsapp" ? "bg-green-500/20 text-green-600 dark:text-green-400 border-0" : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0"}>
                          {step.channel === "whatsapp" ? <><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</> : <><Mail className="h-3 w-3 mr-1" /> Email</>}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {step.delay_hours === 0 ? "na inscrição" : `+${Math.round(step.delay_hours / 24) || 1}d`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-500 font-medium">{perf.sent} enviados</span>
                        {perf.errors > 0 && <span className="text-destructive">{perf.errors} erro(s)</span>}
                        {perf.skipped_reply > 0 && <span className="text-purple-500">{perf.skipped_reply} responderam antes</span>}
                        {perf.skipped_status > 0 && <span className="text-yellow-500">{perf.skipped_status} pulados por status</span>}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollments table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leads inscritos ({enrollments.length})</CardTitle>
          <CardDescription>Cada linha é um lead percorrendo a cadência. Você pode pausar, retomar ou retirar.</CardDescription>
          {/* Status filter chips */}
          {enrollments.length > 0 && (() => {
            const counts: Record<string, number> = enrollments.reduce((acc, e) => {
              acc[e.status] = (acc[e.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const FILTERS: { key: EnrollmentStatus | "all"; label: string }[] = [
              { key: "all",        label: "Todos" },
              { key: "active",     label: "Ativos" },
              { key: "paused",     label: "Pausados" },
              { key: "replied",    label: "Respondeu" },
              { key: "completed",  label: "Concluído" },
              { key: "stopped",    label: "Parados" },
              { key: "failed",     label: "Falhas" },
            ];
            return (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {FILTERS.map((f) => {
                  const cnt = f.key === "all" ? enrollments.length : (counts[f.key] || 0);
                  if (f.key !== "all" && cnt === 0) return null;
                  const active = statusFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`text-xs px-2.5 h-7 rounded-md border transition-colors ${
                        active
                          ? "border-primary bg-primary/15 text-primary font-semibold"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {f.label} <span className="opacity-70 tabular-nums">({cnt})</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </CardHeader>
        <CardContent>
          {(() => {
            const filtered = statusFilter === "all" ? enrollments : enrollments.filter((e) => e.status === statusFilter);
            if (enrollments.length === 0) {
              return (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum lead inscrito ainda. Vá para o CRM ou Pipeline e use "Inscrever em cadência".
                </div>
              );
            }
            if (filtered.length === 0) {
              return (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum inscrito com status "{STATUS_META[statusFilter as EnrollmentStatus]?.label || statusFilter}". Mude o filtro.
                </div>
              );
            }
            return (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Próximo envio</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const meta = STATUS_META[e.status];
                    const stepLabel = `${Math.min(e.current_step, steps.length)}/${steps.length}`;
                    const nextRun = new Date(e.next_run_at);
                    const isOverdue = e.status === "active" && nextRun.getTime() < Date.now();
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-[260px]">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium truncate">{e.lead?.name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[e.lead?.email, e.lead?.phone].filter(Boolean).join(" · ") || "Sem contato"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{stepLabel}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.status === "active" ? (
                            isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                                <Clock className="h-3 w-3" />
                                Aguardando processamento
                              </span>
                            ) : (
                              nextRun.toLocaleString("pt-BR")
                            )
                          ) : "—"}
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {e.last_error ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{e.last_error}</span>
                            </span>
                          ) : e.paused_reason ? (
                            <span className="text-xs text-muted-foreground truncate">{e.paused_reason}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            {e.status === "active" ? (
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Pausar" onClick={() => setEnrollmentStatus(e.id, "paused", "manual")}>
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            ) : (e.status === "paused" || e.status === "stopped" || e.status === "failed") ? (
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Retomar" onClick={() => setEnrollmentStatus(e.id, "active")}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Remover da cadência" onClick={() => removeEnrollment(e.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            );
          })()}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        O motor roda automaticamente a cada 10 minutos. Use <strong>Executar agora</strong> para forçar um ciclo imediato (útil para testar após criar uma inscrição).
      </p>
    </div>
  );
}

/* ------------------ Tiny stat card ------------------ */
function StatCard({
  icon: Icon, label, value, tone, sub,
}: {
  icon: any; label: string; value: number; tone: "neutral" | "info" | "success" | "warn"; sub?: string;
}) {
  const toneClass = {
    neutral: "text-foreground",
    info: "text-blue-500",
    success: "text-emerald-500",
    warn: "text-destructive",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-3 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value.toLocaleString("pt-BR")}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
