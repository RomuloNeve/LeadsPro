import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageTutorial } from "@/components/PageTutorial";
import {
  Headphones,
  Send,
  Phone,
  Clock,
  CheckCircle2,
  Loader2,
  BellRing,
  User,
  MessageCircle,
  Trash2,
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const WHATSAPP_INBOX_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-inbox`;

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
    // Second beep
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
  const [selectedRequest, setSelectedRequest] = useState<HandoffRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const loadRequests = useCallback(async () => {
    if (!license?.id) return;
    const { data } = await supabase
      .from("human_handoff_requests")
      .select("*")
      .eq("license_id", license.id)
      .order("created_at", { ascending: false });
    const newRequests = (data as HandoffRequest[] | null) || [];
    
    // Play sound if new pending request appeared
    const pendingCount = newRequests.filter(r => r.status === "pending").length;
    if (pendingCount > prevCountRef.current && prevCountRef.current >= 0) {
      playNotificationSound();
    }
    prevCountRef.current = pendingCount;
    
    setRequests(newRequests);
    setLoading(false);
  }, [license?.id]);

  // Initial load
  useEffect(() => { loadRequests(); }, [loadRequests]);

  // Realtime subscription
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

  // Load chat when selecting a request
  const loadChat = useCallback(async (request: HandoffRequest) => {
    setSelectedRequest(request);
    setLoadingChat(true);
    setChatMessages([]);

    // Mark as in_progress
    if (request.status === "pending") {
      await supabase
        .from("human_handoff_requests")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", request.id);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${WHATSAPP_INBOX_URL}?action=messages&remoteJid=${encodeURIComponent(request.remote_jid)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const json = await res.json();
      const msgs = json.messages || json || [];
      
      if (Array.isArray(msgs)) {
        const parsed: ChatMessage[] = msgs
          .filter((m: any) => {
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
            return text?.trim();
          })
          .map((m: any) => ({
            role: m.key?.fromMe ? "assistant" as const : "user" as const,
            content: m.message?.conversation || m.message?.extendedTextMessage?.text || "",
            timestamp: m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : undefined,
          }));
        setChatMessages(parsed);
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setLoadingChat(false);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  // Send message
  const handleSend = async () => {
    if (!messageInput.trim() || !selectedRequest || sending) return;
    const text = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${WHATSAPP_INBOX_URL}?action=send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          remoteJid: selectedRequest.remote_jid,
          message: text,
        }),
      });

      if (res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: text }]);
      } else {
        toast({ title: "Erro ao enviar", variant: "destructive" });
        setMessageInput(text);
      }
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (request: HandoffRequest) => {
    await supabase
      .from("human_handoff_requests")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    if (selectedRequest?.id === request.id) setSelectedRequest(null);
    toast({ title: "Atendimento finalizado ✅" });
  };

  const handleDelete = async (request: HandoffRequest) => {
    await supabase
      .from("human_handoff_requests")
      .delete()
      .eq("id", request.id);
    if (selectedRequest?.id === request.id) setSelectedRequest(null);
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
        description="Quando um lead pede para falar com uma pessoa, ele aparece aqui. Você pode ver a conversa e responder diretamente."
        steps={[
          { emoji: "🔔", text: "Quando um lead pedir atendente humano, você recebe notificação por email, WhatsApp e som." },
          { emoji: "💬", text: "Clique no lead para ver a conversa e responder em tempo real." },
          { emoji: "✅", text: "Marque como resolvido quando terminar o atendimento." },
        ]}
      />

      <div className="flex items-center justify-between">
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
            <Badge className="bg-yellow-500 text-black">
              {activeCount} em atendimento
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Request List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Solicitações</CardTitle>
            <CardDescription className="text-xs">
              {requests.length === 0 ? "Nenhuma solicitação" : `${requests.length} solicitação(ões)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground px-4">
                  <Headphones className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum lead solicitou atendimento humano ainda.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      onClick={async () => {
                        if (req.status === "pending") {
                          await supabase
                            .from("human_handoff_requests")
                            .update({ status: "in_progress", updated_at: new Date().toISOString() })
                            .eq("id", req.id);
                        }
                        navigate(`/user-dashboard/inbox?contact=${encodeURIComponent(req.remote_jid)}`);
                      }}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedRequest?.id === req.id ? "bg-muted" : ""
                      } ${req.status === "pending" ? "border-l-4 border-l-destructive" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {req.lead_name || req.lead_phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {req.status === "pending" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Novo</Badge>
                          )}
                          {req.status === "in_progress" && (
                            <Badge className="bg-yellow-500 text-black text-[10px] px-1.5 py-0">Atendendo</Badge>
                          )}
                          {req.status === "resolved" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Resolvido</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{req.lead_phone}</span>
                      </div>
                      {req.last_message && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          💬 {req.last_message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground/60">
                          <Clock className="h-3 w-3 inline mr-0.5" />
                          {new Date(req.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex gap-1">
                          {req.status !== "resolved" && (
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleResolve(req); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(req); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

        {/* Chat Area */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              {selectedRequest
                ? `Conversa com ${selectedRequest.lead_name || selectedRequest.lead_phone}`
                : "Selecione um atendimento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedRequest ? (
              <div className="text-center py-20 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Clique em uma solicitação ao lado para abrir a conversa.</p>
              </div>
            ) : loadingChat ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col h-[500px]">
                <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-muted text-foreground rounded-bl-md"
                            : "bg-primary text-primary-foreground rounded-br-md"
                        }`}>
                          <p>{msg.content}</p>
                          {msg.timestamp && (
                            <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                              {msg.timestamp}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedRequest.status !== "resolved" ? (
                  <div className="p-3 border-t border-border">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Digite sua resposta..."
                        disabled={sending}
                      />
                      <Button type="submit" size="icon" disabled={sending || !messageInput.trim()} className="shrink-0">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </form>
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleResolve(selectedRequest)} className="text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
                        Finalizar atendimento
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t border-border text-center">
                    <Badge variant="secondary">Atendimento finalizado</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserHumanSupport;
