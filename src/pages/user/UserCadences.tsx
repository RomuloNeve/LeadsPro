import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Zap, Plus, Loader2, Trash2, MessageCircle, Mail, Power, ArrowUp, ArrowDown,
  Sparkles, Users, Clock, Info,
} from "lucide-react";

/* ------------------------------------------------------------------
   Types — match the DB schema from 20260420000002_cadences.sql
------------------------------------------------------------------ */
type Channel = "whatsapp" | "email";

interface CadenceStep {
  id?: string;                // undefined = newly added, not yet saved
  step_order: number;
  channel: Channel;
  delay_hours: number;
  subject: string | null;
  message: string;
  send_window_start: string;  // "HH:mm"
  send_window_end: string;
  skip_weekends: boolean;
}

interface Cadence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  stop_on_reply: boolean;
  stop_on_status: string[];
  created_at: string;
  steps?: CadenceStep[];
  _enrolled_count?: number;
}

/* ------------------------------------------------------------------
   Defaults
------------------------------------------------------------------ */
const newStep = (order: number, channel: Channel = "whatsapp"): CadenceStep => ({
  step_order: order,
  channel,
  delay_hours: order === 1 ? 0 : 48,
  subject: channel === "email" ? "" : null,
  message:
    channel === "whatsapp"
      ? "Olá {nome}! Tudo bem?\n\nAqui é da nossa equipe — vi que você tem interesse e quero entender melhor o que procura.\n\nTem 2 minutinhos pra conversar?"
      : "Olá {nome},\n\nEspero que esteja bem. Estou entrando em contato para apresentar nossa solução.\n\nPodemos agendar uma conversa rápida?",
  send_window_start: "09:00",
  send_window_end: "18:00",
  skip_weekends: true,
});

/* ------------------------------------------------------------------
   Pre-built cadence templates — loaded as starting point for new cadence
------------------------------------------------------------------ */
interface CadenceTemplate {
  key: string;
  label: string;
  description: string;
  build: () => { name: string; description: string; steps: CadenceStep[] };
}

const TEMPLATES: CadenceTemplate[] = [
  {
    key: "prospeccao-fria",
    label: "Prospecção fria (5 dias · 3 toques)",
    description: "Primeiro contato + 2 follow-ups progressivos para leads que ainda não te conhecem.",
    build: () => ({
      name: "Prospecção fria",
      description: "Sequência de 3 toques para abrir conversa com leads novos.",
      steps: [
        {
          step_order: 1, channel: "whatsapp", delay_hours: 0, subject: null,
          message: "Olá {nome}! Tudo bem?\n\nAqui é da nossa equipe — vi seu contato e queria entender rapidamente se o que fazemos faz sentido pra você.\n\nTem 2 minutinhos pra uma conversa?",
          send_window_start: "09:00", send_window_end: "18:00", skip_weekends: true,
        },
        {
          step_order: 2, channel: "whatsapp", delay_hours: 48, subject: null,
          message: "Oi {nome}, passando só pra confirmar se minha mensagem de ontem chegou 🙂\n\nSe preferir, posso te mandar um resumo rápido por aqui mesmo. O que acha?",
          send_window_start: "10:00", send_window_end: "17:00", skip_weekends: true,
        },
        {
          step_order: 3, channel: "email", delay_hours: 72,
          subject: "Última tentativa — {nome}",
          message: "Olá {nome},\n\nTentei te chamar no WhatsApp nos últimos dias e não tive retorno — imagino que esteja numa correria.\n\nSe fizer sentido retomarmos, é só responder esse email. Caso contrário, entendo e paramos por aqui.\n\nAbraço!",
          send_window_start: "08:00", send_window_end: "19:00", skip_weekends: false,
        },
      ],
    }),
  },
  {
    key: "reengajamento",
    label: "Reengajamento (leads frios há +30 dias)",
    description: "Reconquistar leads que pararam de responder com abordagem leve.",
    build: () => ({
      name: "Reengajamento",
      description: "Reativar conversa com leads que sumiram.",
      steps: [
        {
          step_order: 1, channel: "whatsapp", delay_hours: 0, subject: null,
          message: "Oi {nome}, tudo certo?\n\nFaz um tempo que conversamos — queria só entender se você ainda tem interesse ou se o momento mudou.\n\nQualquer resposta ajuda 🙏",
          send_window_start: "10:00", send_window_end: "18:00", skip_weekends: true,
        },
        {
          step_order: 2, channel: "email", delay_hours: 96,
          subject: "Ainda faz sentido, {nome}?",
          message: "Olá {nome},\n\nNão quero ser insistente — só queria confirmar se ainda há espaço pra conversarmos ou se você prefere que eu não volte a te procurar.\n\nMe avisa, por favor. Prometo respeitar.\n\nAbraço!",
          send_window_start: "08:00", send_window_end: "19:00", skip_weekends: false,
        },
      ],
    }),
  },
  {
    key: "pos-venda",
    label: "Pós-venda (onboarding + NPS)",
    description: "Acompanhamento de cliente novo: boas-vindas, check-in e pesquisa.",
    build: () => ({
      name: "Pós-venda",
      description: "Onboarding de cliente recém-fechado com check-in e NPS.",
      steps: [
        {
          step_order: 1, channel: "whatsapp", delay_hours: 1, subject: null,
          message: "Oi {nome}! Seja muito bem-vindo(a) 🎉\n\nFicamos felizes em ter você com a gente. Se precisar de qualquer ajuda para começar, é só responder por aqui.",
          send_window_start: "09:00", send_window_end: "20:00", skip_weekends: false,
        },
        {
          step_order: 2, channel: "whatsapp", delay_hours: 168, subject: null,
          message: "Oi {nome}, tudo bem?\n\nPassando só pra saber como tem sido sua experiência até aqui. Tem algo que eu posso ajudar ou explicar melhor?",
          send_window_start: "10:00", send_window_end: "18:00", skip_weekends: true,
        },
        {
          step_order: 3, channel: "email", delay_hours: 336,
          subject: "Como estamos indo, {nome}?",
          message: "Olá {nome},\n\nJá faz algumas semanas desde que começamos juntos — adoraríamos ouvir sua opinião.\n\nNuma escala de 0 a 10, o quanto você recomendaria a gente para um amigo ou colega?\n\nÉ só responder esse email com o número e, se quiser, um comentário rápido. Isso nos ajuda demais!\n\nObrigado 🙏",
          send_window_start: "08:00", send_window_end: "19:00", skip_weekends: false,
        },
      ],
    }),
  },
];

export default function UserCadences() {
  const { license } = useUserData();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [cadences, setCadences] = useState<Cadence[]>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Cadence | null>(null);
  const [editSteps, setEditSteps] = useState<CadenceStep[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchCadences = useCallback(async () => {
    if (!license?.id) return;
    setLoading(true);
    try {
      const { data: list, error } = await supabase
        .from("cadences")
        .select("id, name, description, is_active, stop_on_reply, stop_on_status, created_at")
        .eq("license_id", license.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch steps + enrollment counts in parallel per cadence (small lists, fine)
      const enriched: Cadence[] = await Promise.all(
        (list || []).map(async (c) => {
          const [{ data: steps }, { count }] = await Promise.all([
            supabase
              .from("cadence_steps")
              .select("id, step_order, channel, delay_hours, subject, message, send_window_start, send_window_end, skip_weekends")
              .eq("cadence_id", c.id)
              .order("step_order"),
            supabase
              .from("cadence_enrollments")
              .select("id", { count: "exact", head: true })
              .eq("cadence_id", c.id)
              .eq("status", "active"),
          ]);
          return {
            ...c,
            steps: (steps || []) as CadenceStep[],
            _enrolled_count: count || 0,
          };
        })
      );
      setCadences(enriched);
    } catch (e: any) {
      toast({ title: "Erro ao carregar cadências", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [license?.id, toast]);

  useEffect(() => { fetchCadences(); }, [fetchCadences]);

  /* ----------------------------- Editor ----------------------------- */
  const openNew = () => {
    setEditing({
      id: "",
      name: "",
      description: "",
      is_active: true,
      stop_on_reply: true,
      stop_on_status: ["ganho", "perdido"],
      created_at: new Date().toISOString(),
    });
    setEditSteps([newStep(1, "whatsapp")]);
    setEditorOpen(true);
  };

  const openEdit = (c: Cadence) => {
    setEditing(c);
    setEditSteps((c.steps || []).map((s) => ({ ...s })));
    setEditorOpen(true);
  };

  const addStep = (channel: Channel) => {
    setEditSteps((prev) => [...prev, newStep(prev.length + 1, channel)]);
  };

  const removeStep = (idx: number) => {
    setEditSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    setEditSteps((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  };

  const updateStep = (idx: number, patch: Partial<CadenceStep>) => {
    setEditSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const improveStepMessage = async (idx: number) => {
    const step = editSteps[idx];
    if (!step.message.trim()) {
      toast({ title: "Escreva algo primeiro", description: "A IA melhora a mensagem que você já começou.", variant: "destructive" });
      return;
    }
    try {
      const endpoint = step.channel === "email" ? "improve-email" : "improve-message";
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { message: step.message, subject: step.subject || undefined, tone: "profissional" },
      });
      if (error) throw error;
      const improved = data?.improved || data?.message || data?.body;
      if (improved) {
        updateStep(idx, { message: improved });
        if (data?.subject && step.channel === "email") updateStep(idx, { subject: data.subject });
        toast({ title: "Mensagem melhorada ✨" });
      }
    } catch (e: any) {
      toast({ title: "Não foi possível melhorar agora", description: e.message, variant: "destructive" });
    }
  };

  /* ----------------------------- Save ----------------------------- */
  const saveCadence = async () => {
    if (!editing || !license?.id) return;
    if (!editing.name.trim()) {
      toast({ title: "Dê um nome à cadência", variant: "destructive" });
      return;
    }
    if (editSteps.length === 0) {
      toast({ title: "Adicione pelo menos 1 passo", variant: "destructive" });
      return;
    }
    // Basic per-step validation
    for (const s of editSteps) {
      if (!s.message.trim()) {
        toast({ title: `Passo ${s.step_order}: mensagem vazia`, variant: "destructive" });
        return;
      }
      if (s.channel === "email" && !(s.subject || "").trim()) {
        toast({ title: `Passo ${s.step_order}: assunto do email vazio`, variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) throw new Error("Sessão expirada");

      const payload = {
        license_id: license.id,
        name: editing.name.trim(),
        description: editing.description?.trim() || null,
        is_active: editing.is_active,
        stop_on_reply: editing.stop_on_reply,
        stop_on_status: editing.stop_on_status,
      };

      let cadenceId = editing.id;
      if (cadenceId) {
        const { error } = await supabase.from("cadences").update(payload).eq("id", cadenceId);
        if (error) throw error;
        // Replace steps wholesale — simpler than diffing, and these are small lists
        await supabase.from("cadence_steps").delete().eq("cadence_id", cadenceId);
      } else {
        const { data, error } = await supabase
          .from("cadences")
          .insert({ ...payload, created_by: uid })
          .select("id")
          .single();
        if (error) throw error;
        cadenceId = data!.id;
      }

      const stepRows = editSteps.map((s, i) => ({
        cadence_id: cadenceId,
        step_order: i + 1,
        channel: s.channel,
        delay_hours: s.delay_hours,
        subject: s.channel === "email" ? (s.subject || "").trim() : null,
        message: s.message.trim(),
        send_window_start: s.send_window_start,
        send_window_end: s.send_window_end,
        skip_weekends: s.skip_weekends,
      }));
      const { error: insErr } = await supabase.from("cadence_steps").insert(stepRows);
      if (insErr) throw insErr;

      toast({ title: "Cadência salva ✓" });
      setEditorOpen(false);
      await fetchCadences();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Cadence) => {
    const { error } = await supabase
      .from("cadences")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchCadences();
    }
  };

  const deleteCadence = async (c: Cadence) => {
    if (!confirm(`Excluir a cadência "${c.name}"? Isso também remove todas as inscrições relacionadas.`)) return;
    const { error } = await supabase.from("cadences").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadência excluída" });
      fetchCadences();
    }
  };

  /* ----------------------------- Summary ----------------------------- */
  const totalDays = useMemo(
    () => Math.ceil(editSteps.reduce((acc, s) => acc + s.delay_hours, 0) / 24),
    [editSteps]
  );

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" /> Cadências
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sequências automatizadas de WhatsApp e Email. Crie uma régua de toques e deixe o sistema executar no ritmo certo.
          </p>
        </div>
        <Button onClick={openNew} className="gradient-bg">
          <Plus className="h-4 w-4 mr-1.5" /> Nova cadência
        </Button>
      </div>

      {/* Info banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex gap-3 items-start">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p><strong>Como funciona:</strong> você define os passos (ex.: dia 0 WhatsApp, dia 2 Email, dia 5 WhatsApp). Depois inscreve leads do seu CRM/Pipeline na cadência. O sistema envia cada passo no horário comercial configurado e pausa automaticamente se o lead responder ou mudar de status.</p>
            <p className="text-muted-foreground">Placeholders suportados na mensagem: <code className="bg-muted px-1 rounded">{"{nome}"}</code>, <code className="bg-muted px-1 rounded">{"{email}"}</code>, <code className="bg-muted px-1 rounded">{"{telefone}"}</code>, <code className="bg-muted px-1 rounded">{"{categoria}"}</code>.</p>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : cadences.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground">Você ainda não tem nenhuma cadência</p>
            <p className="text-sm mt-1">Crie a primeira para automatizar o follow-up dos seus leads.</p>
            <Button onClick={openNew} className="mt-4 gradient-bg">
              <Plus className="h-4 w-4 mr-1.5" /> Criar primeira cadência
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cadences.map((c) => (
            <Card key={c.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{c.name}</CardTitle>
                    {c.description && <CardDescription className="text-xs mt-0.5 line-clamp-2">{c.description}</CardDescription>}
                  </div>
                  <Badge variant={c.is_active ? "default" : "outline"} className={c.is_active ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : ""}>
                    {c.is_active ? "Ativa" : "Pausada"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {(c.steps || []).map((s) => (
                    <span key={s.step_order} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${s.channel === "whatsapp" ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"}`}>
                      {s.channel === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                      <span>Passo {s.step_order}</span>
                      <span className="text-muted-foreground">· {s.delay_hours === 0 ? "agora" : `+${Math.round(s.delay_hours / 24)}d`}</span>
                    </span>
                  ))}
                  {(c.steps?.length || 0) === 0 && (
                    <span className="text-xs text-muted-foreground italic">Sem passos definidos</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c._enrolled_count || 0} leads ativos</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.steps?.length || 0} passo(s)</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/user-dashboard/cadences/${c.id}`}>Ver detalhes</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(c)} title={c.is_active ? "Pausar" : "Ativar"}>
                    <Power className={`h-4 w-4 ${c.is_active ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCadence(c)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {editing?.id ? "Editar cadência" : "Nova cadência"}
            </DialogTitle>
            <DialogDescription>
              Configure os toques e o sistema executa automaticamente para cada lead inscrito.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-5">
              {/* Templates (only for new cadence) */}
              {!editing.id && (
                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Começar a partir de um template
                  </div>
                  <Select
                    onValueChange={(key) => {
                      const tpl = TEMPLATES.find((t) => t.key === key);
                      if (!tpl) return;
                      const built = tpl.build();
                      setEditing((prev) => prev ? { ...prev, name: prev.name || built.name, description: prev.description || built.description } : prev);
                      setEditSteps(built.steps.map((s) => ({ ...s })));
                      toast({ title: "Template carregado", description: `${built.steps.length} passo(s) preenchidos — ajuste à vontade.` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um modelo pronto (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{t.label}</span>
                            <span className="text-xs text-muted-foreground">{t.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Meta */}
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex.: Prospecção fria — 5 dias"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Para que serve essa cadência?"
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-6 flex-wrap pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Switch
                      checked={editing.stop_on_reply}
                      onCheckedChange={(v) => setEditing({ ...editing, stop_on_reply: v })}
                    />
                    Pausar automaticamente se o lead responder
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Switch
                      checked={editing.is_active}
                      onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                    />
                    Cadência ativa
                  </label>
                </div>
              </div>

              <Separator />

              {/* Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Passos da cadência</h3>
                    <p className="text-xs text-muted-foreground">
                      {editSteps.length} passo(s) · duração total estimada: {totalDays} dia(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addStep("whatsapp")}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addStep("email")}>
                      <Mail className="h-3.5 w-3.5 mr-1" /> Email
                    </Button>
                  </div>
                </div>

                {editSteps.map((s, idx) => (
                  <Card key={idx} className={`border-l-4 ${s.channel === "whatsapp" ? "border-l-green-500" : "border-l-blue-500"}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Passo {s.step_order}</Badge>
                          <Badge className={s.channel === "whatsapp" ? "bg-green-500/20 text-green-600 dark:text-green-400 border-0" : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0"}>
                            {s.channel === "whatsapp" ? <><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</> : <><Mail className="h-3 w-3 mr-1" /> Email</>}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveStep(idx, -1)}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === editSteps.length - 1} onClick={() => moveStep(idx, 1)}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeStep(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Aguardar</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={720}
                              value={s.delay_hours}
                              onChange={(e) => updateStep(idx, { delay_hours: Math.max(0, Math.min(720, Number(e.target.value) || 0)) })}
                              className="h-9"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">horas</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {idx === 0 ? "desde a inscrição" : "desde o passo anterior"}
                            {s.delay_hours >= 24 && ` (~${Math.round(s.delay_hours / 24)}d)`}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Enviar a partir de</Label>
                          <Input
                            type="time"
                            value={s.send_window_start}
                            onChange={(e) => updateStep(idx, { send_window_start: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Até</Label>
                          <Input
                            type="time"
                            value={s.send_window_end}
                            onChange={(e) => updateStep(idx, { send_window_end: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <label className="flex items-center gap-2 text-xs cursor-pointer pb-1">
                            <Switch
                              checked={s.skip_weekends}
                              onCheckedChange={(v) => updateStep(idx, { skip_weekends: v })}
                            />
                            Pular fins de semana
                          </label>
                        </div>
                      </div>

                      {s.channel === "email" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Assunto do email *</Label>
                          <Input
                            value={s.subject || ""}
                            onChange={(e) => updateStep(idx, { subject: e.target.value })}
                            placeholder="Ex.: {nome}, temos uma ideia pra você"
                            className="h-9"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Mensagem *</Label>
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => improveStepMessage(idx)}>
                            <Sparkles className="h-3 w-3" /> Melhorar com IA
                          </Button>
                        </div>
                        <Textarea
                          value={s.message}
                          onChange={(e) => updateStep(idx, { message: e.target.value })}
                          rows={5}
                          className="font-mono text-xs"
                          placeholder="Use {nome}, {email}, {telefone}, {categoria}"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {editSteps.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      Nenhum passo ainda. Adicione o primeiro acima.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveCadence} disabled={saving} className="gradient-bg">
              {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Salvando...</> : "Salvar cadência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
