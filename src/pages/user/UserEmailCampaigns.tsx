import { useState, useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Plus, Send, Clock, CheckCircle2, FileText, Loader2, Trash2, Users, Sparkles, LayoutTemplate, User, Save } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";
import { Separator } from "@/components/ui/separator";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  category_filter: string;
  total_leads: number;
  sent_count: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Rascunho", icon: <FileText className="h-3 w-3" />, color: "bg-muted text-muted-foreground" },
  sending: { label: "Enviando...", icon: <Loader2 className="h-3 w-3 animate-spin" />, color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  sent: { label: "Enviado", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-green-500/15 text-green-600 dark:text-green-400" },
};

const EMAIL_TEMPLATES = [
  {
    name: "Apresentação comercial",
    subject: "Conheça nossos serviços — podemos ajudar sua empresa!",
    body: `Olá!\n\nMeu nome é [Seu Nome] e trabalho com soluções que podem ajudar sua empresa a crescer.\n\nGostaria de apresentar brevemente nossos serviços e entender se faz sentido para o momento de vocês.\n\nPosso enviar mais detalhes ou agendar uma conversa rápida?\n\nFico à disposição!\n\nAbraços`,
  },
  {
    name: "Promoção / Oferta",
    subject: "🔥 Oferta especial por tempo limitado!",
    body: `Olá!\n\nTemos uma condição especial disponível por tempo limitado e não queria que você perdesse.\n\n🎯 [Descreva a oferta aqui]\n\n📅 Válido até: [Data]\n\nAproveite enquanto está disponível! Responda este email ou entre em contato para saber mais.\n\nAbraços`,
  },
  {
    name: "Follow-up / Recontato",
    subject: "Conseguiu ver minha mensagem anterior?",
    body: `Olá!\n\nEstou passando para verificar se conseguiu ver minha mensagem anterior.\n\nSei que a rotina é corrida, mas acredito que o que compartilhei pode ser útil para vocês.\n\nSe preferir, posso ligar em um horário melhor. Qual seria o ideal?\n\nAguardo seu retorno!\n\nAbraços`,
  },
  {
    name: "Newsletter / Novidades",
    subject: "📬 Novidades da semana — confira!",
    body: `Olá!\n\nSeparamos as principais novidades desta semana para você:\n\n📌 [Novidade 1]\n📌 [Novidade 2]\n📌 [Novidade 3]\n\nQuer saber mais sobre algum desses tópicos? É só responder este email!\n\nAté a próxima 👋`,
  },
  {
    name: "Convite para evento",
    subject: "🎉 Você está convidado(a) para nosso evento!",
    body: `Olá!\n\nTemos o prazer de convidá-lo(a) para um evento especial:\n\n📅 Data: [Data]\n🕐 Horário: [Horário]\n📍 Local: [Local ou link do evento online]\n\nSerá uma ótima oportunidade para [benefício do evento].\n\nConfirme sua presença respondendo este email!\n\nEsperamos você lá! 🚀`,
  },
];

const UserEmailCampaigns = () => {
  const { license, leads } = useUserData();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [emailFilterMode, setEmailFilterMode] = useState<"category" | "expired_users">("category");
  const [expiredUsersCount, setExpiredUsersCount] = useState(0);
  const [improving, setImproving] = useState(false);

  // Load display name
  useEffect(() => {
    const loadName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) setDisplayName((data as any).display_name || "");
      setNameLoaded(true);
    };
    loadName();
  }, []);

  const handleSaveName = async () => {
    setSavingName(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSavingName(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null } as any)
      .eq("user_id", session.user.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nome atualizado! ✅", description: "Seus próximos emails usarão este nome como remetente." });
    }
    setSavingName(false);
  };

  const categories = Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[];
  const uniqueLeads = leads.filter((l) => !l.is_duplicate);
  const leadsWithEmail = uniqueLeads.filter((l) => l.email && l.email.trim() !== "" && l.email !== "Não encontrado");
  const targetLeads = emailFilterMode === "expired_users"
    ? []
    : categoryFilter === "all"
      ? leadsWithEmail
      : leadsWithEmail.filter((l) => l.category === categoryFilter);

  // Fetch expired users count (only for Floriano)
  const FLORIANO_ID_EMAIL = "fb82d9ab-3cfb-492d-b96e-32cd0fcfd94b";
  const isFlorianoEmail = license?.assigned_to === FLORIANO_ID_EMAIL;
  
  useEffect(() => {
    const fetchExpiredCount = async () => {
      if (!license?.id || !isFlorianoEmail) return;
      try {
        const { data, error } = await supabase.functions.invoke("admin-test-send", {
          body: { type: "bulk-whatsapp", planFilter: "expirados", dryRun: true },
        });
        console.log("[EmailExpiredCount] Response:", JSON.stringify(data), "Error:", error);
        if (!error && data?.totalUsers) {
          setExpiredUsersCount(data.totalUsers);
        }
      } catch (e) { console.error("[EmailExpiredCount]", e); }
    };
    fetchExpiredCount();
  }, [license?.id, isFlorianoEmail]);

  // Load campaigns from DB
  useEffect(() => {
    if (!license?.id) return;
    const fetchCampaigns = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_campaigns" as any)
        .select("*")
        .eq("license_id", license.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setCampaigns(data as any);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, [license?.id]);

  const handleImproveBody = async () => {
    if (!body.trim()) {
      toast({ title: "Escreva algo primeiro", description: "Digite o corpo do email para melhorar com IA.", variant: "destructive" });
      return;
    }
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke("improve-email", {
        body: { message: body },
      });
      if (error) throw error;
      if (data?.improved) {
        setBody(data.improved);
        toast({ title: "Email melhorado com IA! ✨" });
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (e: any) {
      toast({ title: "Erro ao melhorar", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setImproving(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (!license?.id) {
      toast({ title: "Licença não encontrada", variant: "destructive" });
      return;
    }
    if (emailFilterMode !== "expired_users" && targetLeads.length === 0) {
      toast({ title: "Nenhum lead com email", description: "Seus leads precisam ter email cadastrado.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const totalCount = emailFilterMode === "expired_users" ? expiredUsersCount : targetLeads.length;
    const { data, error } = await supabase
      .from("email_campaigns" as any)
      .insert({
        license_id: license.id,
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
        category_filter: emailFilterMode === "expired_users" ? "expired_users" : categoryFilter,
        total_leads: totalCount,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar campanha", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    setCampaigns((prev) => [data as any, ...prev]);
    toast({ title: "Campanha de email criada!" });
    setName("");
    setSubject("");
    setBody("");
    setCategoryFilter("all");
    setEmailFilterMode("category");
    setOpen(false);
    setSaving(false);
  };

  const handleSend = async (campaignId: string) => {
    if (!window.confirm("Tem certeza que deseja disparar esta campanha? Os emails serão enviados imediatamente.")) return;

    setSendingId(campaignId);
    setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, status: "sending" } : c));

    try {
      // Edge function has a ~150s wall-clock; 500ms/send caps it at ~200
      // emails per invocation. We loop client-side so larger lists can go
      // out without hitting the timeout.
      let offset = 0;
      let totalSent = 0;
      let totalErrors = 0;
      let grandTotal = 0;
      // Safety ceiling to prevent runaway loops (200 × 100 = 20k recipients).
      for (let i = 0; i < 100; i++) {
        const { data, error } = await supabase.functions.invoke("send-email-campaign", {
          body: { campaign_id: campaignId, batch_offset: offset, batch_size: 200 },
        });
        if (error) throw error;
        totalSent = data.total_sent ?? (totalSent + (data.sent || 0));
        totalErrors += data.errors || 0;
        grandTotal = data.total || grandTotal;
        if (!data.has_more) break;
        offset = data.next_offset;
        // Show progress mid-flight
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaignId ? { ...c, status: "sending", sent_count: totalSent } : c
          )
        );
      }

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, status: "sent", sent_count: totalSent } : c
        )
      );
      toast({
        title: "Campanha enviada! ✉️",
        description: `${totalSent}/${grandTotal} emails enviados${totalErrors > 0 ? `, ${totalErrors} erros` : ""}.`,
      });
    } catch (e: any) {
      setCampaigns((prev) => prev.map((c) => c.id === campaignId ? { ...c, status: "draft" } : c));
      toast({ title: "Erro no disparo", description: e.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta campanha de email?")) return;
    const { error } = await supabase.from("email_campaigns" as any).delete().eq("id", id);
    if (!error) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Campanha excluída!" });
    }
  };

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Email Marketing"
        description="Crie e envie campanhas de email em massa para seus leads."
        steps={[
          { emoji: "1️⃣", text: "Clique em 'Nova Campanha' para criar uma campanha de email." },
          { emoji: "2️⃣", text: "Defina o nome, assunto e corpo do email." },
          { emoji: "3️⃣", text: "Filtre por categoria para segmentar seus leads." },
          { emoji: "4️⃣", text: "Após criar, clique em 'Disparar' para enviar os emails." },
          { emoji: "💡", text: "Os emails serão enviados com seu nome via leadspro.app e respostas vão para seu email." },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Marketing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie campanhas de email e envie para seus leads em massa.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="h-3 w-3" /> {leadsWithEmail.length} leads com email
            </Badge>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg">
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Campanha de Email</DialogTitle>
              <DialogDescription>Crie uma campanha de email marketing para seus leads.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Template selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Usar template pronto
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {EMAIL_TEMPLATES.map((tpl, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 justify-start text-left"
                      onClick={() => {
                        setSubject(tpl.subject);
                        setBody(tpl.body);
                        if (!name.trim()) setName(tpl.name);
                      }}
                    >
                      {tpl.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome da campanha</Label>
                <Input placeholder="Ex: Newsletter Março" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label>Assunto do email</Label>
                <Input placeholder="Ex: Novidades especiais para você!" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label>Enviar para</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={emailFilterMode === "category" ? "default" : "outline"}
                    size="sm"
                    className={emailFilterMode === "category" ? "gradient-bg" : ""}
                    onClick={() => setEmailFilterMode("category")}
                  >
                    Por Categoria
                  </Button>
                  {isFlorianoEmail && (
                    <Button
                      type="button"
                      variant={emailFilterMode === "expired_users" ? "default" : "outline"}
                      size="sm"
                      className={emailFilterMode === "expired_users" ? "gradient-bg" : ""}
                      onClick={() => { setEmailFilterMode("expired_users"); setCategoryFilter("all"); }}
                    >
                      Testes Expirados
                    </Button>
                  )}
                </div>

                {emailFilterMode === "category" && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os leads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos com email ({leadsWithEmail.length})</SelectItem>
                      {categories.map((cat) => {
                        const count = leadsWithEmail.filter((l) => l.category === cat).length;
                        return <SelectItem key={cat} value={cat}>{cat} ({count})</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                )}

                {emailFilterMode === "expired_users" && (
                  <p className="text-sm text-muted-foreground p-3 rounded-lg border border-border bg-muted/30">
                    🎯 Email será enviado para <strong>{expiredUsersCount}</strong> usuários com teste gratuito expirado.
                  </p>
                )}

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {emailFilterMode === "expired_users" ? expiredUsersCount : targetLeads.length} leads receberão este email
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Corpo do email</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImproveBody}
                    disabled={improving || !body.trim()}
                    className="gap-1.5 text-xs"
                  >
                    {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Melhorar com IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Olá, temos novidades incríveis para compartilhar com você..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  maxLength={5000}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving} className="gradient-bg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configuração do remetente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Configuração do remetente
          </CardTitle>
          <CardDescription className="text-xs">
            Defina como seu nome aparecerá para quem receber o email. Os destinatários verão algo como: <strong>"{displayName || "Seu Nome"} via LeadsPro"</strong>. Se responderem, a resposta vai direto para o seu email cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="displayNameEmail" className="text-xs">Nome de exibição</Label>
              <Input
                id="displayNameEmail"
                placeholder="Ex: João Silva"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveName}
              disabled={savingName || !displayName.trim()}
              className="gradient-bg gap-1.5"
            >
              {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </div>
          {displayName.trim() && (
            <p className="text-xs text-muted-foreground mt-2">
              📧 Prévia do remetente: <strong className="text-foreground">{displayName} via LeadsPro</strong> &lt;contato@leadspro.app&gt;
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma campanha de email criada ainda.</p>
            <p className="text-sm text-muted-foreground">Crie sua primeira campanha para disparar emails em massa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const st = statusConfig[campaign.status] || statusConfig.draft;
            const isSending = sendingId === campaign.id;
            return (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <Badge className={`${st.color} gap-1 text-xs`}>
                      {st.icon} {st.label}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {new Date(campaign.created_at).toLocaleDateString("pt-BR")} · {campaign.total_leads} leads
                    {campaign.sent_count > 0 && ` · ${campaign.sent_count} enviados`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Assunto: {campaign.subject}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/30 p-2 rounded-md line-clamp-4">
                      {campaign.body}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        className="flex-1 gradient-bg gap-1.5"
                        disabled={isSending}
                        onClick={() => handleSend(campaign.id)}
                      >
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {isSending ? "Enviando..." : "Disparar"}
                      </Button>
                    )}
                    {campaign.status === "sent" && (
                      <div className="flex-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {campaign.sent_count} emails enviados
                      </div>
                    )}
                    {campaign.status === "sending" && (
                      <div className="flex-1 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(campaign.id)}
                      disabled={isSending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserEmailCampaigns;
