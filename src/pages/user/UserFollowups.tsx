import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, Plus, Loader2, Trash2, MessageSquare, Power, CalendarDays, Sparkles, Users } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";

interface FollowupStep {
  id: string;
  sequence_id: string;
  day_number: number;
  message_template: string;
}

interface FollowupSequence {
  id: string;
  license_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  target_filter: string | null;
  steps?: FollowupStep[];
}

const generateTemplates = (servicos: string, nomeEmpresa: string) => [
  {
    day: 1,
    template: `Olá! 👋

Tudo bem? Aqui é da *${nomeEmpresa || "{{nome_empresa}}"}*.

Vi que você demonstrou interesse e quero te apresentar nossos serviços:

${servicos || "{{servicos}}"}

Ficou com alguma dúvida? Pode me responder aqui mesmo! 😊

Abraço! 🚀`,
  },
  {
    day: 3,
    template: `Oi! 😊

Passando aqui para saber se conseguiu ver a mensagem que enviei sobre nossos serviços.

Trabalhamos com:
${servicos || "{{servicos}}"}

Posso te ajudar a encontrar a melhor opção para o que você precisa. É só me responder aqui! 💬

Fico no aguardo!`,
  },
  {
    day: 5,
    template: `Tudo certo? 🤝

Sei que o dia a dia é corrido, mas não queria deixar de reforçar que estamos à disposição.

Nossos clientes já estão aproveitando:
${servicos || "{{servicos}}"}

Que tal conversarmos rapidinho? Sem compromisso, é só responder! ✨

Até mais!`,
  },
  {
    day: 7,
    template: `Oi! 👋

Essa é minha última mensagem por enquanto. Caso tenha interesse em saber mais sobre:

${servicos || "{{servicos}}"}

Pode me chamar a qualquer momento por aqui mesmo!

Quando estiver pronto(a), é só responder. Sucesso! 🎯`,
  },
];

const UserFollowups = () => {
  const { license, leads } = useUserData();
  const { toast } = useToast();
  const [sequences, setSequences] = useState<FollowupSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string; color: string }[]>([]);
  const [targetFilter, setTargetFilter] = useState("all");

  const [name, setName] = useState("");
  const [servicos, setServicos] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [steps, setSteps] = useState(generateTemplates("", ""));

  useEffect(() => {
    setSteps(generateTemplates(servicos, nomeEmpresa));
  }, [servicos, nomeEmpresa]);

  const fetchSequences = async () => {
    if (!license?.id) return;
    const { data: seqs } = await supabase
      .from("followup_sequences")
      .select("*")
      .eq("license_id", license.id)
      .order("created_at", { ascending: false });

    if (!seqs || seqs.length === 0) {
      setSequences([]);
      setLoading(false);
      return;
    }

    const seqIds = seqs.map((s) => s.id);
    const { data: stepsData } = await supabase
      .from("followup_steps")
      .select("*")
      .in("sequence_id", seqIds)
      .order("day_number", { ascending: true });

    const mapped = seqs.map((s) => ({
      ...s,
      steps: ((stepsData as FollowupStep[]) || []).filter((st) => st.sequence_id === s.id),
    })) as FollowupSequence[];

    setSequences(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchSequences(); }, [license?.id]);

  // Fetch lists and categories
  const uniqueLeads = leads.filter((l) => !l.is_duplicate);
  const categories = Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[];

  const fetchLists = async () => {
    if (!license?.id) return;
    const { data } = await supabase
      .from("lead_lists")
      .select("id, name, color")
      .eq("license_id", license.id)
      .order("name");
    setLists(data || []);
  };

  useEffect(() => { fetchLists(); }, [license?.id]);

  const handleCreate = async () => {
    if (!license?.id || !name.trim()) {
      toast({ title: "Dê um nome à sequência", variant: "destructive" });
      return;
    }
    if (!servicos.trim()) {
      toast({ title: "Preencha seus serviços", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: seq, error } = await supabase
      .from("followup_sequences")
      .insert({
        license_id: license.id,
        name: name.trim(),
        target_filter: targetFilter !== "all" ? targetFilter : null,
      })
      .select("id")
      .single();

    if (error || !seq) {
      toast({ title: "Erro", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const stepsToInsert = steps.map((s) => ({
      sequence_id: seq.id,
      day_number: s.day,
      message_template: s.template.trim(),
    }));

    const { error: stepsError } = await supabase.from("followup_steps").insert(stepsToInsert);

    if (stepsError) {
      toast({ title: "Erro ao salvar steps", description: stepsError.message, variant: "destructive" });
    } else {
      toast({ title: "Sequência criada!" });
      setName("");
      setServicos("");
      setNomeEmpresa("");
      setTargetFilter("all");
      setSteps(generateTemplates("", ""));
      setOpen(false);
      fetchSequences();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("followup_sequences")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSequences((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta sequência e todos seus steps?")) return;
    const { error } = await supabase.from("followup_sequences").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sequência excluída!" });
      fetchSequences();
    }
  };




  const dayLabels: Record<number, string> = {
    1: "Primeiro contato",
    3: "Reforço de interesse",
    5: "Prova social",
    7: "Última mensagem",
  };

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Follow-ups"
        description="Crie sequências automáticas de mensagens que são enviadas nos dias 1, 3, 5 e 7 após a criação."
        steps={[
          { emoji: "1️⃣", text: "Clique em 'Nova Sequência' para criar um follow-up." },
          { emoji: "2️⃣", text: "Preencha o nome da empresa e os serviços que você oferece." },
          { emoji: "3️⃣", text: "Selecione para quais leads enviar (todos, por categoria ou por lista)." },
          { emoji: "4️⃣", text: "As 4 mensagens são geradas automaticamente com base nos seus dados." },
          { emoji: "5️⃣", text: "Após criar, a sequência começa a rodar automaticamente nas datas programadas." },
          { emoji: "⚡", text: "Use o switch para ativar/desativar uma sequência a qualquer momento." },
        ]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Follow-ups
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg">
              <Plus className="h-4 w-4 mr-2" /> Nova Sequência
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Nova Sequência de Follow-up
              </DialogTitle>
              <DialogDescription>
                Preencha seus serviços e o nome da empresa. As mensagens são geradas automaticamente para os dias 1, 3, 5 e 7.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da sequência</Label>
                <Input placeholder="Ex: Follow-up Leads Google Maps" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label>Nome da sua empresa</Label>
                <Input placeholder="Ex: LeadsPro" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label>Serviços que você oferece</Label>
                <Textarea
                  placeholder={"Ex:\n✅ Criação de sites profissionais\n✅ Tráfego pago (Google e Meta)\n✅ Automação de WhatsApp"}
                  value={servicos}
                  onChange={(e) => setServicos(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">Dica: use emojis e quebre em linhas para ficar mais visual.</p>
              </div>

              {/* Lead target filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Enviar para quais leads?
                </Label>
                <Select value={targetFilter} onValueChange={setTargetFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os leads ({uniqueLeads.length})</SelectItem>
                    {categories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Por categoria</div>
                        {categories.map((cat) => (
                          <SelectItem key={`cat:${cat}`} value={`cat:${cat}`}>
                            {cat} ({uniqueLeads.filter((l) => l.category === cat).length})
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {lists.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Por lista</div>
                        {lists.map((list) => (
                          <SelectItem key={`list:${list.id}`} value={`list:${list.id}`}>
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: list.color }} />
                              {list.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Os follow-ups serão enviados automaticamente apenas para os leads deste grupo.
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <Label className="text-sm font-medium">Mensagens geradas automaticamente</Label>
                <p className="text-xs text-muted-foreground mt-1">As mensagens são geradas com base nos seus dados e não podem ser editadas.</p>
              </div>

              {steps.map((step) => (
                <div key={step.day} className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
                  <Label className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    Dia {step.day} — {dayLabels[step.day]}
                    <Badge variant="secondary" className="text-[10px] ml-auto">Auto</Badge>
                  </Label>
                  <div className="p-3 rounded-md bg-background border border-border text-sm whitespace-pre-wrap text-foreground">
                    {step.template}
                  </div>
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                As mensagens serão enviadas diretamente do seu WhatsApp conectado.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving} className="gradient-bg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Sequência
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma sequência de follow-up criada.</p>
            <p className="text-sm text-muted-foreground">Preencha seus serviços e as mensagens são geradas automaticamente para os dias 1, 3, 5 e 7.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <Card key={seq.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{seq.name}</CardTitle>
                    <Badge variant={seq.is_active ? "default" : "secondary"} className={seq.is_active ? "gradient-bg text-primary-foreground" : ""}>
                      {seq.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Power className="h-3.5 w-3.5 text-muted-foreground" />
                      <Switch checked={seq.is_active} onCheckedChange={() => toggleActive(seq.id, seq.is_active)} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(seq.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs flex items-center gap-2 flex-wrap">
                  <span>Criada em {new Date(seq.created_at).toLocaleDateString("pt-BR")} · {seq.steps?.length || 0} mensagens</span>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {seq.target_filter
                      ? seq.target_filter.startsWith("cat:")
                        ? `Categoria: ${seq.target_filter.replace("cat:", "")}`
                        : seq.target_filter.startsWith("list:")
                          ? `Lista: ${lists.find((l) => l.id === seq.target_filter?.replace("list:", ""))?.name || "..."}`
                          : seq.target_filter
                      : "Todos os leads"}
                  </Badge>
                </CardDescription>
              </CardHeader>

              {seq.steps && seq.steps.length > 0 && (
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="steps" className="border-none">
                      <AccordionTrigger className="text-sm py-2 hover:no-underline">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> Ver mensagens
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {seq.steps.map((step) => {
                            const sendDate = addDays(new Date(seq.created_at), step.day_number);
                            const isPast = sendDate < new Date();
                            return (
                              <div key={step.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                                <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" /> Dia {step.day_number} — {dayLabels[step.day_number] || `Dia ${step.day_number}`}
                                  <span className={`ml-auto text-[10px] font-normal ${isPast ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                    {format(sendDate, "dd/MM/yyyy")} {isPast ? "✓ Enviado" : "⏳ Agendado"}
                                  </span>
                                </p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{step.message_template}</p>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default UserFollowups;
