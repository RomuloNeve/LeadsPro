import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoFull from "@/assets/logo-full-text.png";

const AffiliateSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", whatsapp: "" });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Check if user already exists by trying to sign in
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInData?.session) {
      toast({ title: "Bem-vindo de volta!", description: "Redirecionando para o painel de afiliados..." });
      navigate("/user-dashboard/afiliados");
      setLoading(false);
      return;
    }

    // Register affiliate via edge function (auto-confirmed, no email verification)
    const { data: fnData, error: fnError } = await supabase.functions.invoke("register-affiliate", {
      body: { email: form.email, password: form.password, name: form.name, whatsapp: form.whatsapp },
    });

    if (fnError || fnData?.error) {
      toast({ title: "Erro", description: fnData?.error || fnError?.message || "Erro ao criar conta.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      toast({ title: "Conta criada!", description: "Faça login para acessar o painel de afiliados." });
      navigate("/auth");
      setLoading(false);
      return;
    }

    toast({ title: "✅ Conta criada!", description: "Redirecionando para o painel de afiliados..." });
    navigate("/user-dashboard/afiliados");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img
            src={logoFull}
            alt="LeadsPro"
            className="h-16 sm:h-20 mx-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <Badge className="gradient-bg text-primary-foreground border-0">
            <Gift className="h-3.5 w-3.5 mr-1.5" /> Programa de Afiliados
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            Cadastre-se como <span className="gradient-text">Afiliado</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie sua conta para acessar o painel de afiliados, gerar seu link personalizado e começar a ganhar 30% de comissão recorrente.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome completo *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">E-mail *</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Senha *</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">WhatsApp (opcional)</label>
            <Input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-primary-foreground h-12 text-base gap-2 hover:opacity-90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-5 w-5" />}
            Criar conta de afiliado
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">
            Faça login
          </button>
          {" "}e acesse o painel de afiliados.
        </p>
      </div>
    </div>
  );
};

export default AffiliateSignup;
