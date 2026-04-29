import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTutorial } from "@/components/PageTutorial";
import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BotMessageSquare,
  MessageSquare,
} from "lucide-react";

type InstanceStatus = "none" | "created" | "connected" | "disconnected";

const UserWhatsAppInstance = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<InstanceStatus>("none");
  const [instanceName, setInstanceName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const invokeFunction = useCallback(
    async (action: string, method: string = "GET") => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/whatsapp-instance?action=${action}`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro na requisição");
      return json;
    },
    []
  );

  // Fast local check from DB
  const checkStatusLocal = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!instance) {
        setStatus("none");
      } else {
        setStatus(instance.status as InstanceStatus);
        setInstanceName(instance.instance_name);
      }
    } catch {
      setStatus("none");
    } finally {
      setLoading(false);
    }
  }, []);

  // Full check via Evolution API (background)
  const checkStatusRemote = useCallback(async () => {
    try {
      const data = await invokeFunction("status");
      setStatus(data.status as InstanceStatus);
      if (data.instance_name) setInstanceName(data.instance_name);
    } catch { /* ignore, local status is already shown */ }
  }, [invokeFunction]);

  useEffect(() => {
    // Show local data immediately, then sync with remote
    checkStatusLocal().then(() => checkStatusRemote());
  }, [checkStatusLocal, checkStatusRemote]);

  // Auto-refresh status when waiting for QR scan.
  // Dual strategy: (1) Supabase Realtime on whatsapp_instances (instant when
  // backend writes "connected") + (2) fast polling as fallback in case the
  // backend only learns the state when we poll Evolution API.
  useEffect(() => {
    if (status !== "created" && status !== "disconnected") return;
    if (!qrCode) return;

    let active = true;
    const markConnected = () => {
      if (!active) return;
      setStatus("connected");
      setQrCode(null);
      toast({ title: "WhatsApp conectado!", description: "Seu número foi vinculado com sucesso." });
    };

    // (1) Realtime subscription — fires instantly when backend updates row
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      channel = supabase
        .channel(`whatsapp-instance-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "whatsapp_instances",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const newStatus = (payload.new as { status?: string })?.status;
            if (newStatus === "connected") markConnected();
          }
        )
        .subscribe();
    })();

    // (2) Polling fallback — 2s (was 5s). Triggers backend to refresh the row
    // from Evolution API, which then triggers the realtime listener above.
    const interval = setInterval(async () => {
      try {
        const data = await invokeFunction("status");
        if (data.status === "connected") markConnected();
      } catch { /* ignore */ }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [status, qrCode, invokeFunction, toast]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const data = await invokeFunction("create", "POST");
      setInstanceName(data.instance_name);
      setStatus("created");
      if (data.qrcode) {
        setQrCode(data.qrcode.base64 || data.qrcode);
      } else {
        // Fetch QR code separately
        await handleRefreshQR();
      }
      toast({ title: "Instância criada!", description: "Escaneie o QR Code com seu WhatsApp." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRefreshQR = async () => {
    setRefreshing(true);
    try {
      const data = await invokeFunction("qrcode");
      setQrCode(data.qrcode || null);
      if (!data.qrcode) {
        toast({ title: "Info", description: "QR Code não disponível. A instância pode já estar conectada." });
        await checkStatusRemote();
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      await checkStatusRemote();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await invokeFunction("disconnect", "POST");
      setStatus("none");
      setQrCode(null);
      setInstanceName("");
      toast({ title: "Desconectado", description: "Integração WhatsApp removida." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const [forcingSync, setForcingSync] = useState(false);
  const handleForceSync = async () => {
    setForcingSync(true);
    try {
      const data = await invokeFunction("force-sync", "POST");
      toast({
        title: "Sincronização iniciada",
        description: data?.message || "Aguarde 30-60 segundos para o histórico aparecer.",
      });
    } catch (err: any) {
      toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
    } finally {
      setForcingSync(false);
    }
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
        title="Integração via QR Code"
        description="Conecte seu número de WhatsApp pessoal para enviar mensagens em massa diretamente pelo sistema."
        steps={[
          { emoji: "1️⃣", text: "Clique em 'Criar Instância' para gerar um QR Code." },
          { emoji: "2️⃣", text: "Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo." },
          { emoji: "3️⃣", text: "Escaneie o QR Code exibido na tela." },
          { emoji: "✅", text: "Pronto! Seu número estará conectado para disparos." },
        ]}
      />

      <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
        <Smartphone className="h-6 w-6 text-primary" />
        Integração via QR Code
      </h1>
      <p className="text-sm text-muted-foreground">
        Vincule seu WhatsApp pessoal para disparar mensagens com seu próprio número.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Status da Conexão
              {status === "connected" ? (
                <Badge className="gradient-bg text-primary-foreground border-0">
                  <Wifi className="h-3 w-3 mr-1" /> Conectado
                </Badge>
              ) : status === "none" ? (
                <Badge variant="outline" className="text-muted-foreground">
                  Sem instância
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" /> Desconectado
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {status === "connected"
                ? "Seu WhatsApp está conectado e pronto para disparos."
                : status === "none"
                ? "Crie uma instância para começar."
                : "Escaneie o QR Code para conectar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "none" && (
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full gradient-bg text-primary-foreground"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {creating ? "Criando..." : "Criar Instância"}
              </Button>
            )}

            {status === "connected" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">WhatsApp ativo</p>
                    <p className="text-xs text-muted-foreground">
                      Instância: {instanceName}
                    </p>
                  </div>
                </div>

                {/* Automações ativas */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mensagens sincronizadas</p>
                      <p className="text-xs text-muted-foreground">
                        Sua caixa de entrada recebe mensagens automaticamente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <BotMessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Assistente IA pronto</p>
                      <p className="text-xs text-muted-foreground">
                        Ative o bot na Caixa de Entrada para responder automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleForceSync}
                    disabled={forcingSync}
                    className="w-full"
                  >
                    {forcingSync ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar conversas
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Desconectar
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Sem mensagens aparecendo? Clique em <strong>Sincronizar conversas</strong> — força o servidor a recarregar o histórico do WhatsApp (~30-60s).
                </p>
              </div>
            )}

            {(status === "created" || status === "disconnected") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Aguardando conexão via QR Code...
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefreshQR}
                    disabled={refreshing}
                    className="flex-1"
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar QR
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex-1"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code
            </CardTitle>
            <CardDescription>
              Escaneie com WhatsApp → Dispositivos conectados → Conectar dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-xl">
                  <img
                    src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  O QR Code expira em alguns segundos. Clique em "Atualizar QR" se necessário.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <QrCode className="h-16 w-16 mb-3 opacity-20" />
                <p className="text-sm">
                  {status === "connected"
                    ? "WhatsApp já está conectado!"
                    : status === "none"
                    ? "Crie uma instância para gerar o QR Code."
                    : "Clique em 'Atualizar QR' para gerar um novo código."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserWhatsAppInstance;
