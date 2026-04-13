import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Shield,
  Lock,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  PartyPopper,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  Zap,
  BarChart3,
  Download,
  Headphones,
  ShieldCheck,
  Timer,
} from "lucide-react";
import productImage from "@/assets/monster-product.png";
import { trackCheckoutStart, trackPixGenerated, trackPurchaseComplete } from "@/lib/gtag";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

type Step = "form" | "pix" | "paid";

const benefits = [
  { icon: Zap, text: "Leads ilimitados" },
  { icon: BarChart3, text: "Dashboard completo" },
  { icon: Download, text: "Exportação CSV" },
  { icon: Headphones, text: "Suporte prioritário" },
  { icon: ShieldCheck, text: "Atualizações gratuitas" },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plan = searchParams.get("plan") || "monthly";
  const isYearly = plan === "yearly";
  const amount = isYearly ? 120000 : 19700;
  const displayAmount = isYearly ? "R$ 1.200,00" : "R$ 197,00";
  const planLabel = isYearly ? "Anual" : "Mensal";

  const [form, setForm] = useState({ name: "", email: "", cellphone: "", taxId: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [pixData, setPixData] = useState<{
    brCode: string;
    brCodeBase64: string;
    id: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState(15 * 60);

  const isValid =
    form.name.trim().length >= 3 &&
    form.email.includes("@") &&
    form.cellphone.replace(/\D/g, "").length >= 10 &&
    form.taxId.replace(/\D/g, "").length === 11;

  // Countdown timer
  useEffect(() => {
    if (step !== "form") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  // Polling for payment status
  useEffect(() => {
    if (step !== "pix" || !pixData?.id) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-pix`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const result = await res.json();

        if (result.data?.status === "COMPLETED" || result.data?.status === "PAID") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          trackPurchaseComplete(plan, amount);
          setStep("paid");
        }
      } catch {
        // silent retry
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, pixData?.id]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    trackCheckoutStart(plan, amount / 100);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pix`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            plan,
            customer: {
              name: form.name.trim(),
              email: form.email.trim(),
              cellphone: form.cellphone,
              taxId: form.taxId,
            },
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || result.error) {
        toast({
          title: "Erro ao gerar pagamento",
          description: result.error || "Tente novamente.",
          variant: "destructive",
        });
      } else {
        setPixData({
          brCode: result.data.brCode,
          brCodeBase64: result.data.brCodeBase64,
          id: result.data.id,
          expiresAt: result.data.expiresAt,
        });
        trackPixGenerated(plan, amount);
        setStep("pix");
      }
    } catch {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const copyCode = () => {
    if (!pixData?.brCode) return;
    navigator.clipboard.writeText(pixData.brCode);
    setCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setCopied(false), 3000);
  };

  const goToSignup = () => {
    navigate(`/auth?plan=${plan}&paid=true`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.05),transparent_60%)]" />
      </div>

      <motion.div
        className="w-full max-w-4xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Urgency banner */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                  <Timer className="h-4 w-4 animate-pulse" />
                  Oferta expira em {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left column — Product summary */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Product card */}
                  <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
                    <div className="flex items-center gap-4 mb-5">
                      <img
                        src={productImage}
                        alt="LeadsPro"
                        className="w-16 h-16 rounded-xl object-contain border border-border bg-background p-1"
                      />
                      <div>
                        <h1 className="text-lg font-bold font-display text-foreground">LeadsPro</h1>
                        <Badge variant="outline" className="border-primary/40 text-primary text-xs mt-1">
                          <Crown className="h-3 w-3 mr-1" />
                          Plano {planLabel}
                        </Badge>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">O que está incluso</p>
                      {benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                            <b.icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {b.text}
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isLifetime ? "Pagamento único" : "Renovação mensal"}
                          </p>
                          <p className="text-3xl font-bold font-display gradient-text">{displayAmount}</p>
                        </div>
                        {isLifetime && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Melhor oferta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security seals — desktop only */}
                  <div className="hidden lg:block rounded-2xl border border-border bg-card p-5 card-shadow">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4 text-primary" />
                        <span>Pagamento 100% seguro via PIX</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Seus dados estão protegidos</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Garantia de 7 dias ou seu dinheiro de volta</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — Form */}
                <div className="lg:col-span-3">
                  <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 card-shadow">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Lock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold font-display text-foreground">Dados de pagamento</h2>
                        <p className="text-xs text-muted-foreground">Preencha para gerar seu PIX</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="João da Silva"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="pl-10 bg-background/50 border-border/60 h-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="joao@email.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="pl-10 bg-background/50 border-border/60 h-11"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Celular</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="(11) 99999-9999"
                              value={form.cellphone}
                              onChange={(e) => setForm({ ...form, cellphone: formatPhone(e.target.value) })}
                              className="pl-10 bg-background/50 border-border/60 h-11"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="123.456.789-01"
                              value={form.taxId}
                              onChange={(e) => setForm({ ...form, taxId: formatCPF(e.target.value) })}
                              className="pl-10 bg-background/50 border-border/60 h-11"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms checkbox */}
                    <div className="flex items-start gap-3 mt-6 p-4 rounded-xl bg-muted/50 border border-border/60">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        Li e aceito os{" "}
                        <Link to="/termos-de-uso" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
                          Termos de Uso e Política de Reembolso
                        </Link>
                        . Declaro estar ciente de que o LeadsPro é um produto digital de entrega imediata e que, ao acessá-lo, estarei renunciando ao direito de arrependimento previsto no Art. 49 do CDC, conforme Art. 16, I, do Decreto nº 7.962/2013.
                      </label>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={!isValid || loading || !acceptedTerms}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-green-600/20 transition-all duration-300 hover:shadow-green-600/30"
                    >
                      {loading ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Gerando PIX...</>
                      ) : (
                        <><QrCode className="h-5 w-5 mr-2" />Pagar {displayAmount} via PIX</>
                      )}
                    </Button>

                    {/* Mobile security seals */}
                    <div className="flex items-center justify-center gap-5 mt-5 lg:hidden">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" /> Seguro
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" /> Protegido
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" /> Garantia 7 dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "pix" && pixData && (
            <motion.div
              key="pix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="rounded-2xl border border-border bg-card p-8 card-shadow text-center">
                <div className="mb-5">
                  <Badge variant="outline" className="border-primary/30 text-primary px-4 py-1.5">
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Aguardando pagamento
                  </Badge>
                </div>

                <h2 className="text-xl font-bold font-display text-foreground mb-1">Escaneie o QR Code</h2>
                <p className="text-sm text-muted-foreground mb-6">Abra o app do seu banco e escaneie o código</p>

                <div className="bg-white rounded-2xl p-5 w-fit mx-auto mb-6 shadow-sm">
                  <img src={pixData.brCodeBase64} alt="QR Code PIX" className="w-52 h-52 mx-auto" />
                </div>

                <p className="text-xs text-muted-foreground mb-2">Ou copie o código PIX:</p>
                <div className="flex gap-2 mb-6">
                  <Input readOnly value={pixData.brCode} className="font-mono text-xs bg-background/50" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyCode}
                    className={copied ? "border-primary text-primary" : ""}
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  O pagamento será detectado automaticamente
                </div>
              </div>
            </motion.div>
          )}

          {step === "paid" && (
            <motion.div
              key="paid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="rounded-2xl border border-primary/30 bg-card p-10 card-shadow text-center">
                <div className="gradient-bg rounded-full p-5 w-fit mx-auto mb-6 glow-shadow">
                  <PartyPopper className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold font-display text-foreground mb-2">Pagamento Confirmado!</h2>
                <p className="text-muted-foreground mb-8">
                  Crie sua conta para acessar o LeadsPro e gerar sua chave de licença.
                </p>
                <Button
                  size="lg"
                  onClick={goToSignup}
                  className="w-full gradient-bg text-primary-foreground hover:opacity-90 glow-shadow py-6 text-base font-semibold rounded-xl"
                >
                  Criar Minha Conta
                  <CheckCircle2 className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Checkout;
