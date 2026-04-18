import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageTutorial } from "@/components/PageTutorial";
import {
  Headphones,
  Phone,
  Clock,
  CheckCircle2,
  Loader2,
  BellRing,
  User,
  MessageCircle,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface HandoffRequest {
  id: string;
  license_id: string;
  lead_phone: string;
  lead_name: string | null;
  instance_name: string;
  remote_jid: string;
  status: string;
  last_message: string | null;
  created_at: string;
  updated_at: string;
}

// Notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      gain2.gain.value = 0.3;
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    }, 200);
  } catch { /* ignore */ }
}

const UserHumanSupport = () => {
  const { license } = useUserData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HandoffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether we've completed the initial fetch. The notification sound
  // must NOT fire on first load (would beep every page visit if there are
  // already-pending requests). It fires only when the pending count grows
  // while the page is open.
  const hasLoadedOnceRef = useRef(false);
  const prevPendingCountRef = useRef(0);

  const loadRequests = useCallback(async () => {
    if (!license?.id) return;
    const { data } = await supabase
      .from("human_handoff_requests")
      .select("*")
      .eq("license_id", license.id)
      .order("created_at", { ascending: false });
    const newRequests = (data as HandoffRequest[] | null) || [];

    const pendingCount = newRequests.filter(r => r.status === "pending").length;
    if (hasLoadedOnceRef.current && pendingCount > prevPendingCountRef.current) {
      playNotificationSound();
    }
    prevPendingCountRef.current = pendingCount;
    hasLoadedOnceRef.current = true;

    setRequests(newRequests);
    setLoading(false);
  }, [license?.id]);

  // Initial load
  useEffect(() => { loadRequests(); }, [loadRequests]);

  // Realtime subscription: refetch on any change to this license's handoffs.
  useEffect(() => {
    if (!license?.id) return;
    const channel = supabase
      .channel("human-handoffs")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "human_handoff_requests",
        filter: `license_id=eq.${license.id}`,
      }, () => {
        loadRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [license?.id, loadRequests]);

  const openConversation = async (request: HandoffRequest) => {
    // Auto-move pending → in_progress when the user opens the chat,
    // so the "Novo" badge doesn't stay on after they've seen it.
    if (request.status === "pending") {
      await supabase
        .from("human_handoff_requests")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", request.id);
    }
    navigate(`/user-dashboard/inbox?contact=${encodeURIComponent(request.remote_jid)}`);
  };

  const handleResolve = async (request: HandoffRequest) => {
    await supabase
      .from("human_handoff_requests")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    toast({ title: "Atendimento finalizado ✅" });
  };

  const handleDelete = async (request: HandoffRequest) => {
    await supabase
      .from("human_handoff_requests")
      .delete()
      .eq("id", request.id);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const activeCount = requests.filter(r => r.status === "in_progress").length;

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
        title="Atendimento Humano"
        description="Quando um lead pede para falar com uma pessoa, ele aparece aqui. Clique em 'Abrir conversa' para responder na Caixa de Entrada."
        steps={[
          { emoji: "🔔", text: "Quando um lead pedir atendente humano, você recebe notificação por email, WhatsApp e som (nesta aba)." },
          { emoji: "💬", text: "Clique em 'Abrir conversa' para ir direto à Caixa de Entrada e responder pelo WhatsApp." },
          { emoji: "✅", text: "Depois de atender, clique em 'Resolvido' aqui para marcar a solicitação como finalizada." },
          { emoji: "🗑️", text: "Se foi engano ou já resolveu fora do sistema, use a lixeira para remover da lista." },
        ]}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            Atendimento Humano
          </h1>
          <p className="text-sm text-muted-foreground">
            Leads que pediram para falar com uma pessoa real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <BellRing className="h-3 w-3 mr-1" />
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
          {activeCount > 0 && (
            <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">
              {activeCount} em atendimento
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solicitações</CardTitle>
          <CardDescription className="text-xs">
            {requests.length === 0 ? "Nenhuma solicitação ainda" : `${requests.length} solicitação(ões)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[70vh]">
            {requests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground px-4">
                <Headphones className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-foreground">Nenhum lead solicitou atendimento humano ainda.</p>
                <p className="text-xs mt-1">
                  Quando o chatbot identificar essa necessidade, a solicitação aparece aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 transition-colors hover:bg-muted/40 ${
                      req.status === "pending" ? "border-l-4 border-l-destructive" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-semibold text-foreground truncate">
                            {req.lead_name || req.lead_phone}
                          </span>
                          {req.status === "pending" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Novo</Badge>
                          )}
                          {req.status === "in_progress" && (
                            <Badge className="bg-yellow-500 text-black hover:bg-yellow-500 text-[10px] px-1.5 py-0">Atendendo</Badge>
                          )}
                          {req.status === "resolved" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Resolvido</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{req.lead_phone}</span>
                        </div>
                        {req.last_message && (
                          <p className="text-xs text-muted-foreground truncate">
                            💬 {req.last_message}
                          </p>
                        )}
                        <div className="text-[10px] text-muted-foreground/60">
                          <Clock className="h-3 w-3 inline mr-0.5" />
                          {new Date(req.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => openConversation(req)}
                          className="gap-1.5"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Abrir conversa
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        {req.status !== "resolved" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleResolve(req)}
                            title="Marcar como resolvido"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(req)}
                          title="Remover solicitação"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHumanSupport;
