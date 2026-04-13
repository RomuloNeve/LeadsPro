import { useState, useEffect } from "react";
import { Gift, ExternalLink, AlertCircle, Copy, Check, Link2, Loader2, ArrowRight, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANDING_URL = "https://leadspro.app";

const AFFILIATE_PLANS = [
  {
    plan: "Starter",
    price: "R$97/mês",
    commission: "R$29,10/mês",
    url: "https://app.cakto.com.br/affiliate/invite/3e85d24c-d5a9-4c79-81a4-71ee8d6fc475",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    plan: "Pro",
    price: "R$197/mês",
    commission: "R$59,10/mês",
    url: "https://app.cakto.com.br/affiliate/invite/adae9e6f-eb3b-48d7-9025-6a17ceaa9aff",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    plan: "Enterprise",
    price: "R$397/mês",
    commission: "R$119,10/mês",
    url: "https://app.cakto.com.br/affiliate/invite/011dc8a2-5f77-449f-b914-44bf05637382",
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
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge className="gradient-bg text-primary-foreground border-0">
          <Gift className="h-3.5 w-3.5 mr-1.5" /> Programa de Afiliados
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">
          Ganhe <span className="gradient-text">30%</span> de comissão recorrente
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Para cada pagamento feito pelos clientes que você indicar, enquanto eles permanecerem ativos.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">⚙️ Configuração</TabsTrigger>
          <TabsTrigger value="minha-url" disabled={!affiliate}>
            🔗 Minha URL
          </TabsTrigger>
        </TabsList>

        {/* Tab: Configuração */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                step === 1
                  ? "gradient-bg text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-xs font-bold">1</span>
              Afiliar-se
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Primeiro, <strong className="text-foreground">crie uma conta na Cakto</strong> (gratuito). Depois, clique em cada plano abaixo para se afiliar.
                    </span>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => window.open("https://app.cakto.com.br/auth/register/", "_blank")}>
                    <ExternalLink className="h-4 w-4" /> Criar conta na Cakto
                  </Button>
                  <div className="grid gap-3">
                    {AFFILIATE_PLANS.map((item) => (
                      <div key={item.plan} className={`rounded-xl border ${item.border} p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${item.bg}`}><Crown className={`h-4 w-4 ${item.color}`} /></div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{item.plan} — {item.price}</p>
                            <p className="text-xs text-muted-foreground">Comissão: <strong className={item.color}>{item.commission}</strong></p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => window.open(item.url, "_blank")}>
                          Afiliar-se <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Onde encontrar seus links?</strong> Na Cakto → <strong className="text-foreground">Produtos</strong> → aba <strong className="text-foreground">"Minhas Afiliações"</strong>.
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={() => setStep(2)} className="w-full gradient-bg text-primary-foreground h-12 text-base gap-2 hover:opacity-90">
                Já me afiliei, próximo passo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Card className="border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold font-display text-foreground">Cole seus links da Cakto</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Na Cakto → <strong className="text-foreground">Produtos</strong> → <strong className="text-foreground">"Minhas Afiliações"</strong>, copie seus links de checkout exclusivos e cole abaixo.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Seu identificador (slug) *</label>
                      <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))} placeholder="ex: joao-silva" className="font-mono" />
                      <p className="text-xs text-muted-foreground">Seu link será: <span className="text-primary font-mono">{LANDING_URL}/?ref={slug || "seu-slug"}</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Link de checkout — Starter</label>
                      <Input value={starterLink} onChange={(e) => setStarterLink(e.target.value)} placeholder="https://pay.cakto.com.br/..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Link de checkout — Pro</label>
                      <Input value={profissionalLink} onChange={(e) => setProfissionalLink(e.target.value)} placeholder="https://pay.cakto.com.br/..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Link de checkout — Enterprise</label>
                      <Input value={enterpriseLink} onChange={(e) => setEnterpriseLink(e.target.value)} placeholder="https://pay.cakto.com.br/..." />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving || !slug.trim()} className="w-full gradient-bg text-primary-foreground h-12 text-base hover:opacity-90 gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-5 w-5" />}
                    {affiliate ? "Atualizar minha URL" : "Gerar minha URL"}
                  </Button>
                </CardContent>
              </Card>
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto block">
                ← Voltar para a etapa de afiliação
              </button>
            </div>
          )}
        </TabsContent>

        {/* Tab: Minha URL */}
        <TabsContent value="minha-url" className="mt-6">
          {affiliate && (
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold font-display text-foreground">Sua URL personalizada</h2>
                </div>
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-sm bg-background" />
                    <Button size="icon" variant="outline" onClick={copyShareUrl} className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando alguém acessar esse link, os botões de compra serão substituídos pelos seus links de afiliado automaticamente.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Links configurados:</p>
                  <div className="grid gap-2">
                    {[
                      { label: "Starter", value: affiliate.starter_link },
                      { label: "Pro", value: affiliate.profissional_link },
                      { label: "Enterprise", value: affiliate.enterprise_link },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <span className="font-medium text-foreground">{item.label}</span>
                        <span className={item.value ? "text-primary font-mono text-xs truncate max-w-[200px] sm:max-w-[300px]" : "text-muted-foreground text-xs"}>
                          {item.value || "Não configurado"}
                        </span>
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
    </div>
  );
};

export default UserAffiliate;