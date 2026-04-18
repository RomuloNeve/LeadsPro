import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Coins, CalendarClock, Trash2, KeyRound, RefreshCw } from "lucide-react";

async function callAdmin(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-manage-user", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ============================================================
// CREATE USER DIALOG
// ============================================================
export const CreateUserDialog = ({ onCreated }: { onCreated: () => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [planType, setPlanType] = useState("enterprise");
  const [monthlyCredits, setMonthlyCredits] = useState(1000);
  const [extraCredits, setExtraCredits] = useState(0);
  const [expiresDays, setExpiresDays] = useState<string>(""); // "" = never

  const submit = async () => {
    if (!email || !password) {
      toast({ title: "Preencha email e senha", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await callAdmin("create-user", {
        email: email.trim().toLowerCase(),
        password,
        display_name: displayName.trim() || null,
        whatsapp_phone: phone.replace(/\D/g, "") || null,
        plan_type: planType,
        monthly_credits: Number(monthlyCredits) || 0,
        extra_credits: Number(extraCredits) || 0,
        expires_days: expiresDays === "" ? null : Number(expiresDays),
      });
      toast({ title: "✅ Usuário criado", description: `${email} agora tem acesso.` });
      setOpen(false);
      setEmail(""); setPassword(""); setDisplayName(""); setPhone("");
      setMonthlyCredits(1000); setExtraCredits(0); setExpiresDays("");
      onCreated();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-bg h-9">
          <UserPlus className="h-4 w-4 mr-1.5" /> Criar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar novo usuário</DialogTitle>
          <DialogDescription>
            Cria uma conta pronta (email já confirmado) e atribui uma licença com os créditos definidos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Senha * (min 6 caracteres)</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="senha inicial" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">WhatsApp</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11999999999" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Plano</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Expira em (dias)</Label>
            <Input
              type="number"
              value={expiresDays}
              onChange={(e) => setExpiresDays(e.target.value)}
              placeholder="vazio = nunca"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Créditos mensais</Label>
            <Input type="number" value={monthlyCredits} onChange={(e) => setMonthlyCredits(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Créditos extras</Label>
            <Input type="number" value={extraCredits} onChange={(e) => setExtraCredits(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading} className="gradient-bg">
            {loading && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
            Criar usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// EDIT CREDITS DIALOG
// ============================================================
export const EditCreditsDialog = ({
  userId,
  userEmail,
  currentMonthly,
  currentExtra,
  onUpdated,
}: {
  userId: string;
  userEmail: string;
  currentMonthly: number;
  currentExtra: number;
  onUpdated: () => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monthly, setMonthly] = useState(currentMonthly);
  const [extraAdd, setExtraAdd] = useState(0);
  const [resetUsed, setResetUsed] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await callAdmin("update-credits", {
        user_id: userId,
        monthly_credits: Number(monthly),
        extra_credits_add: Number(extraAdd) || 0,
        reset_used: resetUsed,
      });
      toast({ title: "✅ Créditos atualizados", description: userEmail });
      setOpen(false);
      setExtraAdd(0); setResetUsed(false);
      onUpdated();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[10px]">
          <Coins className="h-3 w-3 mr-1" /> Créditos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar créditos</DialogTitle>
          <DialogDescription>{userEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Créditos mensais (substitui o valor atual)</Label>
            <Input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">Atual: {currentMonthly}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Adicionar créditos extras</Label>
            <Input type="number" value={extraAdd} onChange={(e) => setExtraAdd(Number(e.target.value))} placeholder="Ex: 500" />
            <p className="text-[10px] text-muted-foreground">Atual: {currentExtra} — serão adicionados ao total</p>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={resetUsed} onChange={(e) => setResetUsed(e.target.checked)} />
            <span>Zerar créditos usados (começar do zero)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading} className="gradient-bg">
            {loading && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// EXTEND LICENSE DIALOG
// ============================================================
export const ExtendLicenseDialog = ({
  userId,
  userEmail,
  hasLicense,
  currentPlan,
  onUpdated,
}: {
  userId: string;
  userEmail: string;
  hasLicense: boolean;
  currentPlan?: string;
  onUpdated: () => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [mode, setMode] = useState<"extend" | "set" | "never">("extend");
  const [isActive, setIsActive] = useState<"keep" | "activate" | "deactivate">("keep");
  const [plan, setPlan] = useState<string>("keep");

  const submit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { user_id: userId };
      if (mode === "extend") payload.extend_days = Number(days);
      else if (mode === "set") payload.expires_days_from_now = Number(days);
      else if (mode === "never") payload.expires_days_from_now = 0;
      if (isActive === "activate") payload.is_active = true;
      if (isActive === "deactivate") payload.is_active = false;
      if (plan !== "keep") payload.plan_type = plan;

      await callAdmin("update-license", payload);
      toast({ title: "✅ Licença atualizada", description: userEmail });
      setOpen(false);
      setPlan("keep");
      onUpdated();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  // Even if the user has no license yet, admin can open this dialog to
  // CREATE one (backend auto-creates when update-license is called without a
  // pre-existing license). Button label just changes to reflect that.
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[10px]">
          <CalendarClock className="h-3 w-3 mr-1" /> {hasLicense ? "Licença" : "Criar licença"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hasLicense ? "Gerenciar licença" : "Criar licença"}</DialogTitle>
          <DialogDescription>{userEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de plano {currentPlan && <span className="text-muted-foreground">(atual: {currentPlan})</span>}</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Manter plano atual</SelectItem>
                <SelectItem value="free">Free (teste)</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="lifetime">Vitalício</SelectItem>
              </SelectContent>
            </Select>
            {plan === "lifetime" && (
              <p className="text-[10px] text-muted-foreground">💡 Dica: para vitalício, escolha "Sem expiração" abaixo.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Expiração</Label>
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="extend">Estender em X dias (a partir da data atual de expiração)</SelectItem>
                <SelectItem value="set">Definir nova expiração em X dias (a partir de hoje)</SelectItem>
                <SelectItem value="never">Sem expiração (vitalício)</SelectItem>
              </SelectContent>
            </Select>
            {mode !== "never" && (
              <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} placeholder="Dias" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status ativo</Label>
            <Select value={isActive} onValueChange={(v: any) => setIsActive(v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Manter como está</SelectItem>
                <SelectItem value="activate">Ativar</SelectItem>
                <SelectItem value="deactivate">Desativar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading} className="gradient-bg">
            {loading && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// RESET PASSWORD DIALOG
// ============================================================
export const ResetPasswordDialog = ({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const submit = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha precisa ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await callAdmin("reset-password", { user_id: userId, new_password: newPassword });
      toast({ title: "✅ Senha redefinida", description: `Nova senha ativa para ${userEmail}` });
      setOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[10px]">
          <KeyRound className="h-3 w-3 mr-1" /> Senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>{userEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs">Nova senha</Label>
          <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 6 caracteres" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading} className="gradient-bg">
            {loading && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
            Redefinir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// DELETE USER DIALOG
// ============================================================
export const DeleteUserDialog = ({
  userId,
  userEmail,
  onDeleted,
}: {
  userId: string;
  userEmail: string;
  onDeleted: () => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (confirm !== userEmail) {
      toast({ title: "Digite o email exato para confirmar", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await callAdmin("delete-user", { user_id: userId });
      toast({ title: "Usuário removido", description: userEmail });
      setOpen(false);
      setConfirm("");
      onDeleted();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/10">
          <Trash2 className="h-3 w-3 mr-1" /> Deletar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Deletar usuário</DialogTitle>
          <DialogDescription>
            Esta ação é permanente. O usuário perde acesso imediato e todos os leads/campanhas são mantidos mas sem dono.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label className="text-xs">
            Digite <span className="font-mono font-bold">{userEmail}</span> para confirmar:
          </Label>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={userEmail} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || confirm !== userEmail} variant="destructive">
            {loading && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
            Deletar permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
