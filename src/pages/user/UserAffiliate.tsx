import { useState, useEffect } from "react";
import {
  Gift, ExternalLink, AlertCircle, Copy, Check, Link2, Loader2, ArrowRight,
  Crown, ChevronRight, DollarSign, ShieldCheck, Sparkles, ArrowDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANDING_URL = "https://leadspro.app";
const CAKTO_REGISTER_URL = "https://app.cakto.com.br/auth/register/";

const AFFILIATE_PLANS = [
  {
    plan: "Starter",
    price: "R$97",
    customerPays: "R$97/mês",
    youEarn: "R$29,10",
    youEarnAnnual: "R$349,20",
    url: "https://app.cakto.com.br/affiliate/invite/4ccb38bd-f59e-4777-961c-27fe1bf203cc",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    plan: "Pro",
    price: "R$197",
    customerPays: "R$197/mês",
    youEarn: "R$59,10",
    youEarnAnnual: "R$709,20",
    popular: true,
    url: "https://app.cakto.com.br/affiliate/invite/edede6e3-3573-41b3-a1d8-e038f4a303e2",
    color: "text-primary",
    bg: "bg-primary/15",
    border: "border-primary/40",
  },
  {
    plan: "Enterprise",
    price: "R$397",
    customerPays: "R$397/mês",
    youEarn: "R$119,10",
    youEarnAnnual: "R$1.429,20",
    url: "https://app.cakto.com.br/affiliate/invite/24363329-3162-4684-8e24-4d4550c17493",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

interface AffiliateData {
  id: string;
  slug: string;
  name: string;
  starter_link: string | null;
  profissional_link: string | null;
  enterprise_link: string | null;
  is_active: boolean;
}

const UserAffiliate = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  /** Beginner mode: only Pro plan visible. Toggleable via "Avançado". */
  const [advancedMode, setAdvancedMode] = useState(false);

  const [slug, setSlug] = useState("");
  const [starterLink, setStarterLink] = useState("");
  const [profissionalLink, setProfissionalLink] = useState("");
  const [enterpriseLink, setEnterpriseLink] = useState("");

  useEffect(() => {
    const fetchAffiliate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        const aff = data as AffiliateData;
        setAffiliate(aff);
        setSlug(aff.slug);
        setStarterLink(aff.starter_link || "");
        setProfissionalLink(aff.profissional_link || "");
        setEnterpriseLink(aff.enterprise_link || "");
        // Auto-enable advanced mode for users that already configured the
        // extra plans previously, so we don't visually drop their setup.
        if (aff.starter_link || aff.enterprise_link) setAdvancedMode(true);
        setStep(2);
        setActiveTab("minha-url");
      }
      setLoading(false);
    };
    fetchAffiliate();
  }, []);

  const handleSave = async () => {
    if (!slug.trim()) {
      toast({ title: "Erro", description: "Preencha o slug (seu identificador único).", variant: "destructive" });
      return;
    }
    if (!starterLink && !profissionalLink && !enterpriseLink) {
      toast({ title: "Erro", description: "Cole pelo menos um link de checkout da Cakto.", variant: "destructive" });
      return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    setSlug(cleanSlug);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const payload = {
      user_id: session.user.id,
      slug: cleanSlug,
      name: profile?.display_name || profile?.email || "Afiliado",
      starter_link: starterLink || null,
      profissional_link: profissionalLink || null,
      enterprise_link: enterpriseLink || null,
    };

    let result;
    if (affiliate) {
      result = await supabase.from("affiliates").update(payload).eq("id", affiliate.id).select().single();
    } else {
      result = await supabase.from("affiliates").insert(payload).select().single();
    }

    if (result.error) {
      const isDuplicate = result.error.message?.includes("duplicate") || result.error.code === "23505";
      toast({ title: "Erro", description: isDuplicate ? "Esse slug já está em uso. Escolha outro." : result.error.message, variant: "destructive" });
    } else {
      setAffiliate(result.data as AffiliateData);
      setActiveTab("minha-url");
      toast({ title: "✅ URL gerada!", description: "Seu link personalizado está pronto para compartilhar." });
    }
    setSaving(false);
  };

  const shareUrl = affiliate ? `${LANDING_URL}/?ref=${affiliate.slug}` : "";
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copiado!", description: shareUrl });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center space-y-3">
        <Badge className="gradient-bg text-primary-foreground border-0">
          <Gift className="h-3.5 w-3.5 mr-1.5" /> Programa de Afiliados
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight">
          Ganhe <span className="gradient-text">30%</span> de comissão recorrente
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Indique o LeadsPro para outras pessoas e receba <strong className="text-foreground">todo mês</strong> enquanto elas continuarem assinantes.
        </p>
      </div>

      {/* ── BIG green safety banner — kills the #1 confusion ── */}
      <Card className="border-2 border-emerald-500/40 bg-emerald-500/[0.06]">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm sm:text-base font-bold text-foreground leading-tight">
              Você <span className="text-emerald-500">não paga nada</span> para se afiliar
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Os valores abaixo (R$97, R$197, R$397) são o que <strong className="text-foreground">o cliente que você indicar paga</strong>. Você só ganha — <strong className="text-foreground">30%</strong> de cada pagamento, todo mês. É grátis e sem mensalidade.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── How it works — 4 numbered steps ── */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">Como funciona em 4 passos</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { n: "1", t: "Crie sua conta na Cakto",     d: "Plataforma gratuita que processa as comissões. Leva 2 minutos." },
              { n: "2", t: "Afilie-se ao plano Pro",       d: "Um clique. É o plano mais vendido (R$59,10 de comissão por venda)." },
              { n: "3", t: "Cole 1 link aqui",             d: "A Cakto te dá um link de checkout. Você cola aqui e geramos sua URL única." },
              { n: "4", t: "Compartilhe e receba",          d: "Divulgue sua URL. A cada compra, você ganha 30% recorrente todo mês." },
            ].map((s) => (
              <div key={s.n} className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-border bg-muted/30">
                <div className="h-7 w-7 rounded-full gradient-bg text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {s.n}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{s.t}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">⚙️ Configuração</TabsTrigger>
          <TabsTrigger value="minha-url" disabled={!affiliate}>
            🔗 Minha URL
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configuração */}
        <TabsContent value="config" className="space-y-6 mt-6">
          {/* Sub-step indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                step === 1
                  ? "gradient-bg text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">1</span>
              Afiliar-se na Cakto
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                step === 2
                  ? "gradient-bg text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">2</span>
              Gerar minha URL
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              {/* Step A — Cakto account */}
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                      A
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">Crie sua conta na Cakto</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        A Cakto é quem processa pagamentos e paga as comissões. <strong className="text-foreground">É 100% gratuito</strong> — você só precisa do CPF e PIX pra receber.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2 gradient-bg text-primary-foreground h-11"
                    onClick={() => window.open(CAKTO_REGISTER_URL, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" /> Criar minha conta gratuita na Cakto
                  </Button>
                </CardContent>
              </Card>

              {/* Step B — Affiliate to all 3 plans */}
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                      B
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {advancedMode ? "Afilie-se aos 3 planos" : "Afilie-se ao plano Pro"}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {advancedMode ? (
                          <>Clique nos 3 botões abaixo (um pra cada plano). Você não paga nada.</>
                        ) : (
                          <>Um clique é tudo. <strong className="text-foreground">Pro é o plano mais vendido</strong> — comissão de R$59,10 por cliente, todo mês.</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2.5">
                    {(advancedMode ? AFFILIATE_PLANS : AFFILIATE_PLANS.filter((p) => p.plan === "Pro")).map((item) => (
                      <div
                        key={item.plan}
                        className={`relative rounded-xl border-2 ${item.border} p-3 sm:p-4`}
                      >
                        {item.popular && (
                          <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Mais vendido
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`rounded-lg p-2 ${item.bg} shrink-0`}>
                              <Crown className={`h-4 w-4 ${item.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm sm:text-base">
                                Plano {item.plan}
                              </p>
                              <p className="text-[11px] sm:text-xs text-muted-foreground">
                                Cliente paga <strong className="text-foreground">{item.customerPays}</strong>
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs shrink-0 gradient-bg text-primary-foreground"
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            Afiliar-se <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Você ganha</p>
                            <p className={`text-sm sm:text-base font-bold ${item.color} tabular-nums`}>
                              {item.youEarn}<span className="text-[10px] text-muted-foreground font-normal">/mês</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por ano</p>
                            <p className="text-sm sm:text-base font-bold text-foreground tabular-nums">
                              {item.youEarnAnnual}<span className="text-[10px] text-muted-foreground font-normal">/cliente</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Earnings example */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-3 flex items-start gap-2.5">
                    <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Exemplo:</strong> 10 clientes no plano Pro = <strong className="text-emerald-500 tabular-nums">R$ 591/mês</strong> recorrentes — todo mês, automático.
                    </p>
                  </div>

                  {/* Advanced toggle */}
                  <button
                    onClick={() => setAdvancedMode((v) => !v)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-1"
                  >
                    {advancedMode ? (
                      <>← Voltar pro modo simples (só Pro)</>
                    ) : (
                      <>+ Quero também Starter e Enterprise (avançado)</>
                    )}
                  </button>
                </CardContent>
              </Card>

              {/* Step C — Get the links */}
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                      C
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">Pegue seus 3 links de checkout</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Depois de se afiliar, vá no painel da Cakto e copie os links exclusivos:
                      </p>
                    </div>
                  </div>
                  <ol className="space-y-1.5 ml-12 list-decimal list-outside text-xs sm:text-sm text-muted-foreground">
                    <li>Acesse <strong className="text-foreground">app.cakto.com.br</strong></li>
                    <li>Menu <strong className="text-foreground">"Produtos"</strong></li>
                    <li>Aba <strong className="text-foreground">"Minhas Afiliações"</strong></li>
                    <li>Em cada produto, clique em <strong className="text-foreground">"Copiar link"</strong></li>
                  </ol>
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep(2)}
                className="w-full gradient-bg text-primary-foreground h-12 text-base gap-2 hover:opacity-90"
              >
                Já me afiliei, próximo passo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Card className="border-primary/30 border-2">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-foreground">
                        {advancedMode ? "Cole seus links da Cakto" : "Cole seu link da Cakto"}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {advancedMode ? (
                          <>Os links exclusivos que você copiou em <strong className="text-foreground">"Minhas Afiliações"</strong> na Cakto.</>
                        ) : (
                          <>O link exclusivo do <strong className="text-foreground">plano Pro</strong> que você copiou em <strong className="text-foreground">"Minhas Afiliações"</strong> na Cakto.</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-foreground">
                        Seu identificador (slug) <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                        placeholder="ex: joao-silva"
                        className="font-mono"
                      />
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        Sua URL será: <span className="text-primary font-mono break-all">{LANDING_URL}/?ref={slug || "seu-slug"}</span>
                      </p>
                    </div>

                    {!advancedMode && (
                      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-2.5 flex items-start gap-2 text-xs">
                        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">
                          Pro é responsável por 80%+ das vendas. Quem visitar seu link e comprar Pro, você ganha. Quem comprar Starter ou Enterprise, a venda acontece normalmente mas a comissão fica com o LeadsPro.
                        </span>
                      </div>
                    )}

                    {(advancedMode
                      ? [
                          { label: "Plano Starter", value: starterLink, set: setStarterLink, color: "text-blue-500" },
                          { label: "Plano Pro", value: profissionalLink, set: setProfissionalLink, color: "text-primary" },
                          { label: "Plano Enterprise", value: enterpriseLink, set: setEnterpriseLink, color: "text-amber-500" },
                        ]
                      : [
                          { label: "Link de checkout — Plano Pro", value: profissionalLink, set: setProfissionalLink, color: "text-primary" },
                        ]
                    ).map((field) => (
                      <div key={field.label} className="space-y-1.5">
                        <label className={`text-xs sm:text-sm font-medium ${field.color}`}>
                          {field.label}
                        </label>
                        <Input
                          value={field.value}
                          onChange={(e) => field.set(e.target.value)}
                          placeholder="https://pay.cakto.com.br/..."
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving || !slug.trim()}
                    className="w-full gradient-bg text-primary-foreground h-12 text-base hover:opacity-90 gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-5 w-5" />}
                    {affiliate ? "Atualizar minha URL" : "Gerar minha URL"}
                  </Button>

                  <button
                    onClick={() => setAdvancedMode((v) => !v)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    {advancedMode ? (
                      <>← Voltar pro modo simples (só Pro)</>
                    ) : (
                      <>+ Adicionar links de Starter e Enterprise (avançado)</>
                    )}
                  </button>
                </CardContent>
              </Card>

              <button
                onClick={() => setStep(1)}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto block"
              >
                ← Voltar para a etapa de afiliação
              </button>
            </div>
          )}
        </TabsContent>

        {/* Tab: Minha URL */}
        <TabsContent value="minha-url" className="mt-6">
          {affiliate && (
            <Card className="border-primary/30 border-2">
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">Sua URL personalizada</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Copie e divulgue. A cada compra feita por esse link, você recebe a comissão.
                    </p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl border-2 border-primary/30 bg-primary/[0.04] space-y-3">
                  <div className="flex items-center gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-xs sm:text-sm bg-background" />
                    <Button size="icon" variant="outline" onClick={copyShareUrl} className="shrink-0 h-9 w-9">
                      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    💡 Quando alguém acessa esse link e clica em comprar, é redirecionado pro seu link de afiliado da Cakto automaticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Links configurados:</p>
                  <div className="grid gap-2">
                    {[
                      { label: "Starter", value: affiliate.starter_link, color: "text-blue-500" },
                      { label: "Pro", value: affiliate.profissional_link, color: "text-primary" },
                      { label: "Enterprise", value: affiliate.enterprise_link, color: "text-amber-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-2.5 sm:p-3 text-xs sm:text-sm gap-2">
                        <span className={`font-medium ${item.color} shrink-0`}>{item.label}</span>
                        {item.value ? (
                          <span className="text-foreground/70 font-mono text-[10px] sm:text-xs truncate flex-1 text-right">
                            {item.value}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] sm:text-xs italic shrink-0">
                            Não configurado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTab("config")}>
                  ⚙️ Editar configuração
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick FAQ */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Perguntas frequentes
          </h3>
          <div className="space-y-2.5">
            {[
              { q: "Eu pago alguma coisa pra ser afiliado?", a: "Não. É 100% gratuito. Sem mensalidade, sem taxa, sem nada. Você só ganha." },
              { q: "Como recebo as comissões?", a: "Direto na Cakto, via PIX ou conta bancária, todo mês. A Cakto repassa o pagamento automaticamente." },
              { q: "Quando paro de receber?", a: "Você recebe enquanto o cliente que indicou continuar pagando. Se ele cancelar, para. Se ele renovar mais 12 meses, você recebe mais 12 meses." },
              { q: "Tem limite de pessoas que posso indicar?", a: "Não. Indique quantas quiser. Quanto mais, mais ganha." },
            ].map((item, i) => (
              <details key={i} className="group rounded-lg border border-border bg-muted/30 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-3 hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden text-xs sm:text-sm font-medium text-foreground">
                  {item.q}
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-2" />
                </summary>
                <div className="px-3 pb-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAffiliate;
