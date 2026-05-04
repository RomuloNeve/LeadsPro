import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { UserSidebar } from "@/components/UserSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SupportChat } from "@/components/SupportChat";
import { UserDataProvider, useUserData, getDaysRemaining } from "@/hooks/useUserData";
import { useGlobalWhatsAppNotifications } from "@/hooks/useGlobalWhatsAppNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Clock, Timer, LogOut, Coins, ArrowUpRight, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import BuyCreditsDialog from "@/components/BuyCreditsDialog";
import logoFull from "@/assets/logo-full-text.png";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import LowCreditsAlert from "@/components/LowCreditsAlert";
import { SearchProvider } from "@/contexts/SearchContext";
import { SearchProgressBanner } from "@/components/SearchProgressBanner";

// Activates the 2-hour free trial timer when user first enters the dashboard
const FreeTrialActivator = () => {
  const { license } = useUserData();
  const activated = useRef(false);

  useEffect(() => {
    if (!license || activated.current) return;
    if (license.plan_type === "free" && !license.expires_at) {
      activated.current = true;
      supabase.rpc("activate_free_trial", { p_license_id: license.id }).then(() => {
        window.location.reload();
      });
    }
  }, [license]);

  return null;
};

const FreeTrialCountdown = () => {
  const { license, leads } = useUserData();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  const FREE_LEAD_LIMIT = 420; // 60 créditos/dia × 7 dias
  const freeLeadsUsed = license?.plan_type === "free" ? leads.length : 0;
  const freeLeadsRemaining = Math.max(0, FREE_LEAD_LIMIT - freeLeadsUsed);

  useEffect(() => {
    if (!license || license.plan_type !== "free" || !license.expires_at) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const update = () => {
      const now = new Date().getTime();
      const expires = new Date(license.expires_at!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(null);
        if (interval) clearInterval(interval);
        return;
      }

      const totalMinutes = Math.ceil(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setTimeLeft({ hours, minutes });

      if (totalMinutes <= 15) setUrgency("critical");
      else if (totalMinutes <= 30) setUrgency("warning");
      else setUrgency("normal");
    };

    update();
    interval = setInterval(update, 10000);
    return () => { if (interval) clearInterval(interval); };
  }, [license]);

  if (timeLeft === null || !license || license.plan_type !== "free") return null;

  const timeDisplay = timeLeft.hours > 0
    ? `${timeLeft.hours}h ${timeLeft.minutes}min restantes`
    : `${timeLeft.minutes}min restantes`;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors flex-wrap ${
        urgency === "critical"
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : urgency === "warning"
          ? "bg-yellow-500/90 text-black"
          : "bg-primary/90 text-primary-foreground"
      }`}
    >
      <Timer className="h-4 w-4" />
      <span>Teste grátis: {timeDisplay}</span>
      <span className="hidden sm:inline">·</span>
      <span className="text-xs opacity-90">Leads: {freeLeadsUsed}/{FREE_LEAD_LIMIT} ({freeLeadsRemaining} restantes)</span>
      <span className="hidden sm:inline">—</span>
      <a
        href="https://pay.cakto.com.br/mrhbivc_848520"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-semibold hidden sm:inline"
      >
        Assine agora
      </a>
    </div>
  );
};

const ExpiredTrialModal = () => {
  const { license, isAdmin } = useUserData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) return; // Admin never gets blocked by expiration
    if (!license) return;

    // Free trial expired
    if (license.plan_type === "free" && license.expires_at) {
      const now = new Date();
      const expires = new Date(license.expires_at);
      if (now >= expires) {
        setOpen(true);
        return;
      }
    }

    // Monthly/annual license expired or deactivated
    if (["mensal", "anual", "starter", "profissional", "enterprise"].includes(license.plan_type) && !license.is_active) {
      setOpen(true);
      return;
    }
    if (["mensal", "anual", "starter", "profissional", "enterprise"].includes(license.plan_type) && license.expires_at) {
      const now = new Date();
      const expires = new Date(license.expires_at);
      if (now >= expires) {
        setOpen(true);
      }
    }
  }, [license, isAdmin]);

  // Periodic check every 30s
  useEffect(() => {
    if (isAdmin) return; // Admin never gets blocked
    if (!license) return;
    const interval = setInterval(() => {
      if (!license.is_active) {
        setOpen(true);
        clearInterval(interval);
        return;
      }
      if (license.expires_at) {
        const now = new Date();
        const expires = new Date(license.expires_at);
        if (now >= expires) {
          setOpen(true);
          clearInterval(interval);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [license, isAdmin]);

  const isFree = license?.plan_type === "free";
  const title = isFree ? "Teste grátis expirado" : "Assinatura expirada";
  const description = isFree
    ? "Seu período de teste de 7 dias terminou. Escolha um plano para continuar usando o LeadsPro com todos os recursos."
    : "Sua assinatura expirou ou foi cancelada. Renove para continuar usando o LeadsPro.";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <Clock className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            className="w-full gradient-bg text-primary-foreground h-12 font-semibold"
            onClick={() => window.open("https://pay.cakto.com.br/mrhbivc_848520", "_blank")}
          >
            Pro — R$197/mês <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => window.open("https://pay.cakto.com.br/p69cmy8_848513", "_blank")}
          >
            Starter — R$97/mês
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => window.open("https://pay.cakto.com.br/32icmcq_848524", "_blank")}
          >
            Enterprise — R$397/mês
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AffiliateLayout = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Always redirect to affiliate page
  useEffect(() => {
    if (location.pathname === "/user-dashboard" || location.pathname === "/user-dashboard/") {
      navigate("/user-dashboard/afiliados", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-4 sm:px-6">
        <img
          src={logoFull}
          alt="LeadsPro"
          className="h-12 sm:h-14 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className={`flex-1 ${isMobile ? 'px-3 py-4' : 'px-6 py-8'} w-full max-w-5xl mx-auto`}>
        <Outlet />
      </main>
    </div>
  );
};

const DashboardHeader = () => {
  const { license, isAdmin } = useUserData();
  const navigate = useNavigate();
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);

  const monthlyCredits = license?.monthly_credits || 0;
  const extraCredits = license?.extra_credits || 0;
  const usedCredits = license?.used_credits || 0;
  const totalCredits = Math.max(0, monthlyCredits + extraCredits - usedCredits);

  const planLabel = (() => {
    switch (license?.plan_type) {
      case "free": return "Free";
      case "starter": return "Starter";
      case "profissional": return "Pro";
      case "enterprise": return "Scale";
      default: return license?.plan_type || "";
    }
  })();

  const canUpgrade = license && license.plan_type !== "enterprise";
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <header className="h-12 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          {/* Admin shortcut */}
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="h-8 text-xs px-3 border-primary/40 text-primary hover:bg-primary/10"
              title="Voltar para painel Admin"
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              Admin
            </Button>
          )}
          {/* Credits display */}
          <button
            onClick={() => setBuyCreditsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/60 hover:bg-muted transition-colors text-xs"
            title="Créditos de prospecção"
          >
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">{totalCredits.toLocaleString("pt-BR")}</span>
            <span className="text-muted-foreground hidden sm:inline">créditos</span>
          </button>

          {/* Upgrade button */}
          {canUpgrade && (
            <Button
              size="sm"
              onClick={() => setUpgradeOpen(true)}
              className="gradient-bg text-primary-foreground hover:opacity-90 glow-shadow h-8 text-xs px-3"
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Upgrade
            </Button>
          )}
          <ThemeToggle className="h-8 w-8" />
        </div>
      </header>
      <BuyCreditsDialog open={buyCreditsOpen} onOpenChange={setBuyCreditsOpen} />

      {/* Upgrade plans modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Escolha seu plano</DialogTitle>
            <DialogDescription className="text-center">Faça upgrade para desbloquear mais créditos e recursos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {license?.plan_type !== "starter" && (
              <button
                onClick={() => window.open("https://pay.cakto.com.br/p69cmy8_848513", "_blank")}
                className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Starter</p>
                    <p className="text-sm text-muted-foreground">500 créditos/mês</p>
                  </div>
                  <p className="font-bold text-foreground">R$ 97<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                </div>
              </button>
            )}
            <button
              onClick={() => window.open("https://pay.cakto.com.br/mrhbivc_848520", "_blank")}
              className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left relative"
            >
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-bold uppercase gradient-bg text-primary-foreground rounded-full">Mais popular</span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Pro</p>
                  <p className="text-sm text-muted-foreground">2.000 créditos/mês</p>
                </div>
                <p className="font-bold text-foreground">R$ 197<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </div>
            </button>
            <button
              onClick={() => window.open("https://pay.cakto.com.br/32icmcq_848524", "_blank")}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Enterprise (Scale)</p>
                  <p className="text-sm text-muted-foreground">5.000 créditos/mês</p>
                </div>
                <p className="font-bold text-foreground">R$ 397<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const LayoutContent = () => {
  const { loading, license } = useUserData();
  const isMobile = useIsMobile();
  useGlobalWhatsAppNotifications();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Affiliate-only layout
  if (license?.plan_type === "afiliado") {
    return <AffiliateLayout />;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <FreeTrialCountdown />
        <main className="flex-1 px-3 py-4 pb-24 overflow-y-auto overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Outlet />
          <div className="mt-4">
            <LowCreditsAlert />
          </div>
        </main>
        <MobileBottomNav />
        <FreeTrialActivator />
        <ExpiredTrialModal />
        <SearchProgressBanner />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <FreeTrialCountdown />
        <div className="flex-1 flex w-full">
          <UserSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader />
            <main className="flex-1 px-6 py-8 w-full">
              <Outlet />
              <div className="mt-4">
                <LowCreditsAlert />
              </div>
            </main>
          </div>
        </div>
      </div>
      <FreeTrialActivator />
      <ExpiredTrialModal />
      <SearchProgressBanner />
    </SidebarProvider>
  );
};

const UserLayout = () => {
  return (
    <UserDataProvider>
      <SearchProvider>
        <LayoutContent />
        <SupportChat />
      </SearchProvider>
    </UserDataProvider>
  );
};

export default UserLayout;
