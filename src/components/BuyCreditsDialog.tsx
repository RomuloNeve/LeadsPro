import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/useUserData";
import {
  Coins,
  QrCode,
  Loader2,
  Copy,
  CheckCircle2,
  User,
  Mail,
  Phone,
  FileText,
  Sparkles,
  PartyPopper,
  ArrowRight,
} from "lucide-react";

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

const PACKAGES = [
  { id: "100", credits: 100, price: "R$29,90", pricePerLead: "R$0,30" },
  { id: "500", credits: 500, price: "R$59,90", pricePerLead: "R$0,12", popular: false },
  { id: "1000", credits: 1000, price: "R$97,90", pricePerLead: "R$0,10", popular: true },
  { id: "2000", credits: 2000, price: "R$137,90", pricePerLead: "R$0,07" },
];

type Step = "select" | "form" | "pix" | "success";

interface BuyCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BuyCreditsDialog = ({ open, onOpenChange }: BuyCreditsDialogProps) => {
  const [step, setStep] = useState<Step>("select");
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", cellphone: "", taxId: "" });
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    brCode: string;
    brCodeBase64: string;
    pixId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const { fetchLicense } = useUserData();

  const isValid =
    form.name.trim().length >= 3 &&
    form.email.includes("@") &&
    form.cellphone.replace(/\D/g, "").length >= 10 &&
    form.taxId.replace(/\D/g, "").length === 11;

  const selectedPackage = PACKAGES.find((p) => p.id === selectedPkg);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedPkg(null);
      setPixData(null);
      setCopied(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [open]);

  // Poll for payment
  useEffect(() => {
    if (step !== "pix" || !pixData?.pixId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buy-credits`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "check-payment",
              pixId: pixData.pixId,
              packageId: selectedPkg,
            }),
          }
        );
        const result = await res.json();

        if (result.status === "PAID") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStep("success");
          await fetchLicense();
        }
      } catch {
        // silent retry
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, pixData?.pixId]);

  const handleGeneratePix = async () => {
    if (!isValid || !selectedPkg) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buy-credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "create-pix",
            packageId: selectedPkg,
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
        toast({ title: "Erro ao gerar PIX", description: result.error, variant: "destructive" });
      } else {
        setPixData({
          brCode: result.brCode,
          brCodeBase64: result.brCodeBase64,
          pixId: result.pixId,
        });
        setStep("pix");
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {step === "select" && "Comprar Créditos Extras"}
            {step === "form" && `Pacote: ${selectedPackage?.credits} créditos`}
            {step === "pix" && "Pague via PIX"}
            {step === "success" && "Créditos Adicionados! 🎉"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Escolha um pacote de créditos de prospecção"}
            {step === "form" && "Preencha seus dados para gerar o QR Code PIX"}
            {step === "pix" && "Escaneie o QR Code ou copie o código PIX"}
            {step === "success" && `${selectedPackage?.credits} créditos foram adicionados à sua conta`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Select Package ── */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 pt-2"
            >
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPkg(pkg.id);
                    setStep("form");
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all hover:border-primary/50 hover:bg-primary/5 ${
                    pkg.popular ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        +{pkg.credits.toLocaleString("pt-BR")} créditos
                      </p>
                      <p className="text-xs text-muted-foreground">{pkg.pricePerLead}/lead</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.popular && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Melhor custo
                      </Badge>
                    )}
                    <span className="font-bold text-foreground text-lg">{pkg.price}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* ── STEP 2: Form ── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-2"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="João da Silva"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 h-11"
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
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="(11) 99999-9999"
                      value={form.cellphone}
                      onChange={(e) => setForm({ ...form, cellphone: formatPhone(e.target.value) })}
                      className="pl-10 h-11"
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
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleGeneratePix}
                  disabled={!isValid || loading}
                  className="flex-1 gradient-bg text-primary-foreground hover:opacity-90"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
                  ) : (
                    <><QrCode className="h-4 w-4 mr-2" />Gerar QR Code PIX</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: PIX QR Code ── */}
          {step === "pix" && pixData && (
            <motion.div
              key="pix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4 pt-2"
            >
              <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                <img
                  src={pixData.brCodeBase64}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <Button
                variant="outline"
                onClick={copyCode}
                className="w-full"
              >
                {copied ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" />Copiar código PIX</>
                )}
              </Button>

              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando pagamento...
              </div>

              <p className="text-xs text-muted-foreground">
                {selectedPackage?.credits.toLocaleString("pt-BR")} créditos serão adicionados automaticamente após o pagamento
              </p>
            </motion.div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                <PartyPopper className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                +{selectedPackage?.credits.toLocaleString("pt-BR")} créditos adicionados!
              </h3>
              <p className="text-sm text-muted-foreground">
                Seus créditos extras já estão disponíveis para uso imediato.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="gradient-bg text-primary-foreground hover:opacity-90"
              >
                Continuar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditsDialog;
