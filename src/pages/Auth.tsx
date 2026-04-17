import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Eye, EyeOff, ArrowLeft, Gift, Phone } from "lucide-react";
import logoAuth from "@/assets/logo-auth.png";
import authHero from "@/assets/auth-hero.jpg";
import { trackSignup, trackLogin, trackFreeTrialStart } from "@/lib/gtag";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const isPaid = searchParams.get("paid") === "true";
  const plan = searchParams.get("plan");
  const isFreeTrial = plan === "free";

  const [mode, setMode] = useState<"login" | "signup">(isPaid ? "signup" : "login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackLogin();

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profile?.is_admin) {
          navigate("/dashboard");
        } else {
          navigate(plan ? `/user-dashboard?plan=${plan}` : "/user-dashboard");
        }
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { plan: plan || "mensal", whatsapp_phone: phone },
          },
        });
        if (error) throw error;

        trackSignup(plan || "free");
        if (isFreeTrial) trackFreeTrialStart();

        toast({
          title: "🎉 Conta criada com sucesso!",
          description: isFreeTrial ? "Você tem 2 horas de acesso gratuito a todas as funcionalidades. Aproveite!" : "Bem-vindo ao LeadsPro!",
        });

        if (signUpData.session) {
          navigate(plan ? `/user-dashboard?plan=${plan}` : "/user-dashboard");
        } else {
          // Session may take a moment — try signing in automatically
          const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (!loginErr) {
            navigate(plan ? `/user-dashboard?plan=${plan}` : "/user-dashboard");
          }
        }
      }
    } catch (error: any) {
      const msg = error.message || "";
      let description = msg;
      if (msg.includes("Invalid login credentials")) {
        description = "E-mail ou senha incorretos.";
      } else if (msg.includes("User already registered")) {
        description = "Este e-mail já está cadastrado. Tente fazer login.";
      } else if (msg.includes("Email not confirmed")) {
        description = "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
      } else if (msg.includes("User not found")) {
        description = "Usuário não encontrado.";
      } else if (msg.includes("Password should be")) {
        description = "A senha deve ter no mínimo 6 caracteres.";
      } else if (msg.includes("Unable to validate email")) {
        description = "E-mail inválido. Verifique e tente novamente.";
      } else if (msg.includes("rate limit") || msg.includes("too many requests")) {
        description = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      }
      toast({
        title: "Erro",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-28 bg-background">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="w-full max-w-[380px] mx-auto space-y-8">
          {/* Logo */}
          <img src={logoAuth} alt="LeadsPro" className="h-24" />

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-display text-foreground">
              {isFreeTrial ? "Teste Grátis — 2 Horas" : isPaid ? "Crie sua conta" : mode === "login" ? "Acesse nossa Plataforma" : "Crie sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFreeTrial
                ? "Crie sua conta e explore todos os recursos por 2 horas. Acesso completo!"
                : isPaid
                ? "Cadastre-se para acessar o sistema."
                : mode === "login"
                ? "Digite suas credenciais para acessar os recursos."
                : "Preencha os dados abaixo para começar."}
            </p>
          </div>

          {(isFreeTrial || isPaid) && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === "login" ? "default" : "ghost"}
                onClick={() => setMode("login")}
                className="w-full"
              >
                Entrar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "signup" ? "default" : "ghost"}
                onClick={() => setMode("signup")}
                className="w-full"
              >
                Cadastre-se
              </Button>
            </div>
          )}

          {isFreeTrial && (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 px-4 py-1.5 text-sm">
              <Gift className="h-4 w-4 mr-1.5" /> Teste grátis de 2 horas
            </Badge>
          )}

          {isPaid && !isFreeTrial && (
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Pagamento confirmado
            </Badge>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@exemplo.com"
                required
                className="h-11 bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 bg-background border-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    className="h-11 bg-background border-input pl-10"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gradient-bg text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? "Carregando..." : isFreeTrial ? "Começar teste grátis" : mode === "login" ? "Continuar" : "Cadastrar"}
            </Button>
          </form>

          {/* Forgot password */}
          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* Footer links */}
          {mode === "login" && (
            <p className="text-center text-sm text-muted-foreground">
              Ainda não tem uma conta?{" "}
              {isFreeTrial || isPaid ? (
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre-se
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { window.location.href = "/#pricing"; }}
                  className="text-primary hover:underline font-medium"
                >
                  Escolha um plano
                </button>
              )}
            </p>
          )}
          {mode === "signup" && (
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-medium"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={authHero}
          alt="LeadsPro"
          className="absolute inset-0 w-full h-full object-cover object-top"
          decoding="async"
          loading="eager"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

        {/* Testimonial */}
        <div className="absolute bottom-10 left-9 right-9">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <p className="text-white text-sm leading-relaxed italic mb-5">
              "O LeadsPro transformou a maneira como prospectamos clientes. Conseguimos capturar e organizar leads de forma automática, economizando horas de trabalho manual."
            </p>
            <div className="flex items-center gap-3">
              <img
                src={authHero}
                alt="Helena Oliveira"
                className="h-10 w-10 rounded-full object-cover object-top ring-2 ring-white/30"
              />
              <div>
                <p className="text-sm font-semibold text-white">Helena Oliveira</p>
                <p className="text-xs text-white/70">CEO, Agência Digital</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
