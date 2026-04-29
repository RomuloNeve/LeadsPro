import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Eye, EyeOff, ArrowLeft, Gift, Phone, User } from "lucide-react";
import logoAuth from "@/assets/logo-auth.png";
import authHero from "@/assets/auth-hero.jpg";
import { trackSignup, trackLogin, trackFreeTrialStart } from "@/lib/gtag";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
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
            data: {
              plan: plan || "mensal",
              whatsapp_phone: phone,
              display_name: displayName.trim(),
            },
          },
        });
        if (error) throw error;

        trackSignup(plan || "free");
        if (isFreeTrial) trackFreeTrialStart();

        toast({
          title: "🎉 Conta criada com sucesso!",
          description: isFreeTrial ? "Você tem 7 dias de acesso gratuito a todas as funcionalidades, com 60 créditos por dia. Aproveite!" : "Bem-vindo ao LeadsPro!",
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
    <div className="flex min-h-screen bg-black">
      {/* Left side - Form */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-28 bg-black overflow-hidden">
        {/* Editorial ambient glow — single crimson radial */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[80%] h-[60%]"
          style={{
            background: "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary) / 0.12), transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* Back button — editorial style */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <div className="relative w-full max-w-[400px] mx-auto space-y-8">
          {/* Editorial logo block */}
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 w-6 h-6 gap-0.5">
              <div className="bg-primary w-full h-full" />
              <div className="bg-zinc-700 w-full h-full" />
              <div className="bg-zinc-800 w-full h-full" />
              <div className="bg-white w-full h-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-white">
              LeadsPro
            </span>
          </div>

          {/* Header — editorial label + Manrope */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="font-mono uppercase tracking-[0.2em] text-[10px] font-medium text-primary">
                {isFreeTrial ? "Teste grátis · 7 dias" : isPaid ? "Pagamento confirmado" : mode === "login" ? "Acessar conta" : "Criar conta"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium font-display text-white tracking-tighter leading-[1.05]">
              {isFreeTrial ? <>Teste por <span className="text-primary">7 dias</span></> : isPaid ? <>Crie sua conta</> : mode === "login" ? <>Bem-vindo de <span className="text-primary">volta</span></> : <>Comece <span className="text-primary">agora</span></>}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {isFreeTrial
                ? "Acesso completo por 7 dias com 60 créditos por dia. Sem cartão de crédito."
                : isPaid
                ? "Cadastre-se para acessar o sistema."
                : mode === "login"
                ? "Digite suas credenciais para acessar a plataforma."
                : "Preencha os dados abaixo para começar."}
            </p>
          </div>

          {(isFreeTrial || isPaid) && (
            <div className="grid grid-cols-2 gap-0 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`h-10 text-xs font-mono uppercase tracking-wider transition-colors ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`h-10 text-xs font-mono uppercase tracking-wider transition-colors border-l border-zinc-800 ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                }`}
              >
                Cadastre-se
              </button>
            </div>
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
                className="h-11 bg-background border-input hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
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
                  className="h-11 bg-background border-input pr-11 hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
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
                <Label htmlFor="displayName" className="text-sm font-medium">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="h-11 bg-background border-input pl-10 hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
            )}

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
                    className="h-11 bg-background border-input pl-10 hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit — editorial sharp rectangle with crimson glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.5)" }}
            >
              {loading ? "Carregando..." : isFreeTrial ? "Começar teste grátis" : mode === "login" ? "Continuar →" : "Cadastrar →"}
            </button>
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

      {/* Right side - Hero image with editorial overlay */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
        <img
          src={authHero}
          alt="LeadsPro"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-50"
          decoding="async"
          loading="eager"
        />
        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Sci-fi corner brackets on the panel */}
        <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-primary" />
        <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-primary" />
        <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-primary" />
        <div className="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-primary" />

        {/* Editorial label top-left */}
        <div className="absolute top-10 left-10 flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="font-mono uppercase tracking-[0.2em] text-[10px] font-medium text-primary">
            01 · Customer story
          </span>
        </div>

        {/* Testimonial — editorial card */}
        <div className="absolute bottom-10 left-10 right-10">
          <div className="bg-black/80 backdrop-blur-xl border border-zinc-800 p-6 relative">
            {/* Quote mark in corner */}
            <span className="absolute -top-4 left-5 px-2 py-0.5 bg-black border border-zinc-800 font-mono text-[9px] uppercase tracking-widest text-primary">
              " quote "
            </span>
            <p className="text-white text-sm leading-relaxed mb-5 font-sans">
              "O LeadsPro transformou a maneira como prospectamos clientes. Conseguimos capturar e organizar leads de forma automática, economizando horas de trabalho manual."
            </p>
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800 border-dashed">
              <div className="flex items-center gap-3">
                <img
                  src={authHero}
                  alt="Helena Oliveira"
                  className="h-9 w-9 object-cover object-top border border-white/15"
                />
                <div>
                  <p className="text-sm font-medium text-white font-display">Helena Oliveira</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    CEO · Agência Digital
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-medium font-display text-primary tabular-nums">+450%</span>
                <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 leading-none">leads/mês</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
