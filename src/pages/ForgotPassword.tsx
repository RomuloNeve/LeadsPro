import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, Lock } from "lucide-react";
import logoAuth from "@/assets/logo-auth.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { email, phone, new_password: newPassword },
      });

      if (error) throw new Error(data?.error || error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✅ Senha alterada com sucesso!",
        description: "Agora você pode fazer login com a nova senha.",
      });

      navigate("/auth");
    } catch (error: any) {
      const msg = error.message || "";
      let description = "Não foi possível alterar a senha.";
      if (msg.includes("telefone informado não corresponde")) {
        description = msg;
      } else if (msg.includes("Usuário não encontrado")) {
        description = msg;
      } else if (msg.includes("Failed to send")) {
        description = "Erro de conexão. Tente novamente em alguns segundos.";
      } else if (msg.includes("non-2xx")) {
        description = "Erro ao processar. Verifique os dados e tente novamente.";
      } else if (msg) {
        description = msg;
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Button>

        <img src={logoAuth} alt="LeadsPro" className="h-28" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display text-foreground">
            Recuperar senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail, telefone cadastrado e a nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 bg-background border-input pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">WhatsApp cadastrado</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm font-medium">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="h-11 bg-background border-input pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 gradient-bg text-primary-foreground font-semibold"
            disabled={loading}
          >
            {loading ? "Alterando..." : "Alterar senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
