import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Phone, ExternalLink, Save, Loader2 } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";

const UserProfile = () => {
  const { toast } = useToast();
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("profiles")
        .select("email, whatsapp_phone, display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setEmail(data.email || "");
        setWhatsappPhone(data.whatsapp_phone || "");
        setDisplayName((data as any).display_name || "");
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, "")}`
    : "";

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (whatsappPhone && cleanPhone.length < 10) {
      toast({ title: "Número inválido", description: "Insira um número com DDD e código do país.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ whatsapp_phone: cleanPhone || null, display_name: displayName.trim() || null } as any)
      .eq("user_id", session.user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Meu Perfil"
        description="Configure seu nome de exibição e número de WhatsApp."
        steps={[
          { emoji: "1️⃣", text: "Defina seu nome de exibição — ele aparecerá como remetente nos emails." },
          { emoji: "2️⃣", text: "Digite seu número com código do país + DDD (ex: 5511999887766)." },
          { emoji: "3️⃣", text: "Clique em 'Salvar' para atualizar." },
          { emoji: "💡", text: "Seu nome será usado como remetente nos disparos de email marketing." },
        ]}
      />
      <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        Meu Perfil
      </h1>
      <p className="text-sm text-muted-foreground">Configure seu nome de exibição e dados de contato.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações</CardTitle>
            <CardDescription>Seus dados pessoais e configurações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={email} disabled className="opacity-70" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Nome de exibição
              </Label>
              <Input
                id="displayName"
                placeholder="Ex: João Silva"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Aparecerá como remetente nos emails: "João Silva via LeadsPro"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Número WhatsApp
              </Label>
              <Input
                id="whatsapp"
                placeholder="5511999887766"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Inclua código do país + DDD + número (ex: 5511999887766)
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-bg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Link WhatsApp</CardTitle>
            <CardDescription>
              Este link será usado nas mensagens de follow-up como <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{whatsapp_link}}"}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {whatsappLink ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border break-all">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1.5 text-sm font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    {whatsappLink}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique para testar. Seus leads verão este link nas mensagens de follow-up.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Configure seu número WhatsApp ao lado para gerar o link.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
