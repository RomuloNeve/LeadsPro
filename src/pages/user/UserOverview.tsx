import { useState, useEffect } from "react";
import { useUserData, getDaysRemaining } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { LeadsCharts } from "@/components/LeadsCharts";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Users, BarChart3, Wifi, WifiOff, Loader2, MessageCircle } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";
import { useNavigate } from "react-router-dom";

const UserOverview = () => {
  const { license, leads } = useUserData();
  const navigate = useNavigate();
  
  // Calculate days remaining: use expires_at if available, otherwise created_at + 30 days for mensal
  const getDaysForRenewal = () => {
    if (!license) return null;
    if (license.expires_at) {
      return getDaysRemaining(license.expires_at);
    }
    // Fallback: 30 days from created_at
    const created = new Date(license.created_at);
    const renewalDate = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };
  
  const days = getDaysForRenewal();
  const isExpired = days !== null && days <= 0;

  const planLabel = (() => {
    switch (license?.plan_type) {
      case "free": return "Free (Teste)";
      case "starter": return "Starter";
      case "profissional": return "Pro";
      case "enterprise": return "Scale";
      default: return license?.plan_type || "—";
    }
  })();
  const today = new Date().toDateString();
  const leadsToday = leads.filter((l) => new Date(l.created_at).toDateString() === today).length;
  const categories = Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[];

  const [whatsappStatus, setWhatsappStatus] = useState<string | null>(null);
  const [loadingWa, setLoadingWa] = useState(true);

  useEffect(() => {
    const checkWa = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("whatsapp_instances")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setWhatsappStatus(data?.status || null);
      setLoadingWa(false);
    };
    checkWa();
  }, []);

  const isConnected = whatsappStatus === "connected";

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Painel"
        description="Aqui você tem uma visão geral da sua conta e dos seus leads."
        steps={[
          { emoji: "📊", text: "Veja o resumo do seu plano (tipo, status, dias restantes)." },
          { emoji: "📈", text: "Acompanhe métricas como total de leads, leads hoje e categorias." },
          { emoji: "📉", text: "Analise os gráficos de crescimento, fontes, distribuição e mais." },
        ]}
      />

      {/* WhatsApp Instance Status Banner */}
      {!loadingWa && (
        <button
          onClick={() => navigate("/user-dashboard/whatsapp-instance")}
          className={`w-full rounded-xl border p-4 card-shadow flex items-center gap-3 transition-colors text-left ${
            isConnected
              ? "border-[#00a884]/30 bg-[#00a884]/5 hover:bg-[#00a884]/10"
              : "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
          }`}
        >
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isConnected ? "bg-[#00a884]/20" : "bg-destructive/20"
          }`}>
            {isConnected ? <Wifi className="h-5 w-5 text-[#00a884]" /> : <WifiOff className="h-5 w-5 text-destructive" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              WhatsApp {isConnected ? "Conectado" : whatsappStatus ? "Desconectado" : "Não configurado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? "Sua instância está ativa. Campanhas, follow-ups e inbox funcionando."
                : "Conecte seu WhatsApp para usar campanhas, follow-ups e caixa de entrada."}
            </p>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"} className={isConnected ? "bg-[#00a884] text-white border-0" : ""}>
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </button>
      )}

      {/* Plan summary */}
      <div className="rounded-xl border border-border bg-card p-5 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Seu Plano</p>
            <p className="text-lg font-bold text-foreground">
              {planLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className={isExpired ? "bg-destructive text-destructive-foreground border-0" : "gradient-bg text-primary-foreground border-0"}>
              {isExpired ? "Expirado" : "Ativo"}
            </Badge>
            {license?.plan_type === "free" ? (
              <Badge variant="outline" className={isExpired ? "border-destructive/50 text-destructive" : "border-muted-foreground/30 text-muted-foreground"}>
                <Calendar className="h-3 w-3 mr-1" />
                {isExpired ? "Teste expirado" : `${days} dias restantes`}
              </Badge>
            ) : (
              <Badge variant="outline" className={isExpired ? "border-destructive/50 text-destructive" : "border-primary/50 text-primary"}>
                {isExpired ? (
                  <><Calendar className="h-3 w-3 mr-1" /> Expirado</>
                ) : days !== null ? (
                  <><Calendar className="h-3 w-3 mr-1" /> {days} dias para renovação</>
                ) : (
                  <><Crown className="h-3 w-3 mr-1" /> {planLabel}</>
                )}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Total de Leads</p>
          <p className="text-3xl font-bold font-display text-foreground">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Leads Hoje</p>
          <p className="text-3xl font-bold font-display text-primary">{leadsToday}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Categorias</p>
          <p className="text-3xl font-bold font-display text-foreground">{categories.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Plano</p>
          <p className="text-xl font-bold font-display text-foreground">{planLabel}</p>
          {days !== null && (
            <p className={`text-xs mt-1 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
              {isExpired ? "Expirado" : `${days} dias restantes`}
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <LeadsCharts leads={leads} />
    </div>
  );
};

export default UserOverview;
