import { useUserData, getDaysRemaining } from "@/hooks/useUserData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Calendar, Coins, ExternalLink, AlertTriangle, ArrowUpRight } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";

const UserBilling = () => {
  const { license } = useUserData();

  const planLabel = (() => {
    switch (license?.plan_type) {
      case "free": return "Free (Teste)";
      case "starter": return "Starter";
      case "profissional": return "Pro";
      case "enterprise": return "Enterprise (Scale)";
      case "lifetime": return "Vitalício";
      default: return license?.plan_type || "—";
    }
  })();

  const getDaysForRenewal = () => {
    if (!license) return null;
    if (license.plan_type === "lifetime") return null;
    if (license.expires_at) return getDaysRemaining(license.expires_at);
    const created = new Date(license.created_at);
    const renewalDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const days = getDaysForRenewal();
  const isExpired = days !== null && days <= 0;

  const monthlyCredits = license?.monthly_credits || 0;
  const extraCredits = license?.extra_credits || 0;
  const usedCredits = license?.used_credits || 0;
  const totalAvailable = Math.max(0, monthlyCredits + extraCredits - usedCredits);
  const totalPool = monthlyCredits + extraCredits;

  const planPrice = (() => {
    switch (license?.plan_type) {
      case "starter": return "R$ 97,00/mês";
      case "profissional": return "R$ 197,00/mês";
      case "enterprise": return "R$ 397,00/mês";
      case "free": return "Grátis";
      case "lifetime": return "Vitalício";
      default: return "—";
    }
  })();

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Faturamento"
        description="Gerencie sua assinatura, créditos e renovação."
        steps={[
          { emoji: "📋", text: "Veja os detalhes do seu plano atual." },
          { emoji: "💳", text: "Acompanhe seus créditos de prospecção restantes." },
          { emoji: "🔄", text: "Saiba quantos dias faltam para a renovação." },
        ]}
      />

      {/* Plan Details */}
      <Card className="border-border card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-primary" />
            Seu Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold font-display text-foreground">{planLabel}</p>
              <p className="text-sm text-muted-foreground">{planPrice}</p>
            </div>
            <Badge
              variant="default"
              className={isExpired ? "bg-destructive text-destructive-foreground border-0" : "gradient-bg text-primary-foreground border-0"}
            >
              {isExpired ? "Expirado" : "Ativo"}
            </Badge>
          </div>

          {/* Days remaining */}
          {days !== null && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              isExpired
                ? "border-destructive/30 bg-destructive/5"
                : days <= 5
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-primary/30 bg-primary/5"
            }`}>
              <Calendar className={`h-5 w-5 ${
                isExpired ? "text-destructive" : days <= 5 ? "text-yellow-500" : "text-primary"
              }`} />
              <div>
                <p className={`text-sm font-semibold ${
                  isExpired ? "text-destructive" : "text-foreground"
                }`}>
                  {isExpired
                    ? "Sua assinatura expirou"
                    : `${days} dia${days !== 1 ? "s" : ""} para renovação`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isExpired
                    ? "Renove para continuar usando a plataforma."
                    : `Sua assinatura renova automaticamente em ${days} dia${days !== 1 ? "s" : ""}.`}
                </p>
              </div>
            </div>
          )}

          {license?.plan_type === "lifetime" && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
              <Crown className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Plano Vitalício</p>
                <p className="text-xs text-muted-foreground">Sua licença não expira. Acesso permanente.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credits */}
      <Card className="border-border card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Créditos de Prospecção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/60">
              <p className="text-2xl font-bold font-display text-primary">{totalAvailable.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Disponíveis</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/60">
              <p className="text-2xl font-bold font-display text-foreground">{usedCredits.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Usados</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/60">
              <p className="text-2xl font-bold font-display text-foreground">{totalPool.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Os créditos são utilizados <strong>exclusivamente para prospecção</strong> (busca de leads). Funcionalidades como CRM, campanhas, follow-ups, chatbot e inbox não consomem créditos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade */}
      {license?.plan_type !== "enterprise" && license?.plan_type !== "lifetime" && (
        <Card className="border-primary/30 card-shadow bg-primary/[0.02]">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold font-display text-foreground mb-1">Quer mais créditos?</h3>
                <p className="text-sm text-muted-foreground">Faça upgrade do seu plano para desbloquear mais créditos mensais.</p>
              </div>
              <Button
                onClick={() => window.open("https://leadspro.app/checkout", "_blank")}
                className="gradient-bg text-primary-foreground hover:opacity-90 glow-shadow shrink-0"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Fazer upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel */}
      <Card className="border-border card-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Cancelar assinatura</h3>
              <p className="text-sm text-muted-foreground">Você será redirecionado para a plataforma de pagamento para solicitar o cancelamento.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open("https://app.cakto.com.br/refund/purchases", "_blank")}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Cancelar assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBilling;
