import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import logoIcon from "@/assets/logo-icon.png";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const wasDismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  // Show on mobile browsers that aren't standalone, either with native prompt or as iOS fallback
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const shouldShow = isMobile && !isStandalone && !dismissed && (deferredPrompt || isIOS);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom duration-500 md:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-lg">
        <img src={logoIcon} alt="LeadsPro" className="h-14 w-14 shrink-0 rounded-xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Instalar LeadsPro</p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {isIOS ? "Toque em Compartilhar → Tela de Início" : "Acesse direto da sua tela inicial"}
          </p>
        </div>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            Instalar
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
