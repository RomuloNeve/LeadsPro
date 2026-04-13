import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download, Smartphone, Apple, Chrome, Share2, Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
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
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold font-display text-foreground mb-2">App Instalado!</h1>
        <p className="text-muted-foreground mb-6">O LeadsPro já está na sua tela inicial.</p>
        <Button onClick={() => navigate("/")} className="gradient-bg text-primary-foreground">
          Ir para o App
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-5 py-8 max-w-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="text-center mb-8">
          <img src={logoFull} alt="LeadsPro" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Instalar LeadsPro</h1>
          <p className="text-muted-foreground text-sm">
            Adicione o LeadsPro à sua tela inicial e use como um app nativo.
          </p>
        </div>

        {/* Install button for Android/Chrome */}
        {deferredPrompt && (
          <div className="mb-8">
            <Button onClick={handleInstall} size="lg" className="w-full gradient-bg text-primary-foreground glow-shadow h-14 text-base">
              <Download className="h-5 w-5 mr-2" /> Instalar Agora
            </Button>
          </div>
        )}

        {/* Android Instructions */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg p-2 bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold font-display text-foreground">Android (Chrome/Edge)</h2>
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">1.</span>
              <span>Abra o site no navegador <strong className="text-foreground">Chrome</strong> ou <strong className="text-foreground">Edge</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">2.</span>
              <span>Aguarde — um banner "<strong className="text-foreground">Adicionar à tela inicial</strong>" deve aparecer automaticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">3.</span>
              <span>Toque em "<strong className="text-foreground">Instalar</strong>" ou "<strong className="text-foreground">Adicionar</strong>"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">4.</span>
              <span>O app aparecerá como ícone na sua tela inicial! 🎉</span>
            </li>
          </ol>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <strong className="text-foreground">Método alternativo:</strong> No Chrome, toque nos <strong>3 pontos (⋮)</strong> → "<strong>Adicionar à tela inicial</strong>"
          </div>
        </div>

        {/* iOS Instructions */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg p-2 bg-primary/10">
              <Apple className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold font-display text-foreground">iPhone / iPad (Safari)</h2>
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">1.</span>
              <span>Abra o site no <strong className="text-foreground">Safari</strong> (obrigatório no iOS)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">2.</span>
              <span>Toque no botão <strong className="text-foreground">Compartilhar</strong> <Share2 className="h-3.5 w-3.5 inline text-primary" /> (quadrado com seta para cima)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">3.</span>
              <span>Role para baixo e toque em "<strong className="text-foreground">Adicionar à Tela de Início</strong>" <Plus className="h-3.5 w-3.5 inline text-primary" /></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary shrink-0">4.</span>
              <span>Confirme tocando em "<strong className="text-foreground">Adicionar</strong>" — pronto! 🎉</span>
            </li>
          </ol>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <h3 className="font-semibold font-display text-foreground mb-3">✨ Vantagens do App</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Acesso rápido direto da tela inicial",
              "Funciona em tela cheia (sem barra do navegador)",
              "Carregamento mais rápido com cache inteligente",
              "Experiência idêntica a um app nativo",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Install;
