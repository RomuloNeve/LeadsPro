import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ImagePlus, AlertTriangle, Minimize2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import leandroAvatar from "@/assets/fernando-avatar.png";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";

type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

type Message = { role: "user" | "assistant"; content: MessageContent };
type DisplayMessage = { role: "user" | "assistant"; text: string; imageUrl?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;

function extractText(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content.filter((c) => c.type === "text").map((c) => (c as any).text).join("");
}

function extractImage(content: MessageContent): string | undefined {
  if (typeof content === "string") return undefined;
  const img = content.find((c) => c.type === "image_url");
  return img ? (img as any).image_url.url : undefined;
}

function toDisplay(msg: Message): DisplayMessage {
  return { role: msg.role, text: extractText(msg.content), imageUrl: extractImage(msg.content) };
}

// ─── Ticket Form Component ───
function TicketForm({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Imagem muito grande. Máximo 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setTicketImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !email.trim() || !problem.trim()) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/send-support-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim(),
          problem: problem.trim(),
          image_base64: ticketImage || undefined,
        }),
      });

      if (!resp.ok) {
        const errorBody = await resp.text();
        throw new Error(errorBody || "Falha ao enviar ticket");
      }

      onSent();
    } catch (err) {
      console.error("Ticket error:", err);
      alert("Erro ao enviar ticket. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">Ticket de Suporte Nível 2</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Preencha os dados abaixo. Nossa equipe técnica irá analisar e resolver em até <strong>48 horas</strong>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-foreground">Seu telefone (WhatsApp)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(27) 99999-9999"
            className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Seu email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Descreva o problema</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Descreva em detalhes o que está acontecendo..."
            rows={4}
            className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Print do erro (opcional)</label>
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
          {ticketImage ? (
            <div className="mt-1 flex items-center gap-2">
              <img src={ticketImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button type="button" onClick={() => setTicketImage(null)} className="text-xs text-destructive hover:underline">Remover</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 w-full rounded-lg border border-dashed border-border bg-muted/50 px-3 py-3 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              📎 Clique para anexar imagem
            </button>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose}>
            Voltar ao chat
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={sending || !phone.trim() || !email.trim() || !problem.trim()}>
            {sending ? "Enviando..." : "Enviar Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Chat ───
export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Listen for sidebar support click
  useEffect(() => {
    const handler = () => { setOpen(true); setMinimized(false); };
    window.addEventListener("open-support-chat", handler);
    return () => window.removeEventListener("open-support-chat", handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("profiles").select("display_name").eq("user_id", session.user.id).maybeSingle().then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, 50);
  }, []);

  useEffect(() => {
    if (open && !hasGreeted) {
      const name = displayName?.split(" ")[0] || "";
      const greetMsg: Message = {
        role: "assistant",
        content: `Oi${name ? ` ${name}` : ""}! 👋 Eu sou o Leandro, do suporte do LeadsPro. Como posso te ajudar?`,
      };
      setMessages([greetMsg]);
      setDisplayMessages([toDisplay(greetMsg)]);
      setHasGreeted(true);
    }
  }, [open, hasGreeted, displayName]);

  useEffect(() => { scrollToBottom(); }, [displayMessages, isTyping, scrollToBottom]);
  useEffect(() => { if (open && !minimized) inputRef.current?.focus(); }, [open, minimized]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Imagem muito grande. Máximo 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || isLoading) return;

    let userContent: MessageContent;
    if (pendingImage && text) {
      userContent = [{ type: "text", text }, { type: "image_url", image_url: { url: pendingImage } }];
    } else if (pendingImage) {
      userContent = [{ type: "text", text: "Veja esta imagem:" }, { type: "image_url", image_url: { url: pendingImage } }];
    } else {
      userContent = text;
    }

    const userMsg: Message = { role: "user", content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDisplayMessages((prev) => [...prev, toDisplay(userMsg)]);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);
    setIsTyping(true);

    const typingDelay = 1500 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, typingDelay));

    let assistantSoFar = "";
    let revealedSoFar = "";
    let tokenQueue: string[] = [];
    let revealing = false;

    const revealTokens = () => {
      if (revealing) return;
      revealing = true;
      const tick = () => {
        if (tokenQueue.length === 0) { revealing = false; return; }
        const next = tokenQueue.shift()!;
        revealedSoFar += next;
        setDisplayMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: revealedSoFar } : m));
          }
          return [...prev, { role: "assistant", text: revealedSoFar }];
        });
        const delay = 20 + Math.random() * 40;
        setTimeout(tick, delay);
      };
      tick();
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: newMessages, user_name: displayName || "" }),
      });

      if (!resp.ok || !resp.body) throw new Error("Erro no suporte");
      setIsTyping(false);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { assistantSoFar += content; tokenQueue.push(content); revealTokens(); }
          } catch { /* partial */ }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantSoFar }]);

      const waitForReveal = () => new Promise<void>((resolve) => {
        const check = () => { tokenQueue.length === 0 ? resolve() : setTimeout(check, 50); };
        check();
      });
      await waitForReveal();

      // Check if Fernando triggered L2 escalation
      if (assistantSoFar.includes("##ESCALAR_TICKET##")) {
        setDisplayMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, text: m.text.replace("##ESCALAR_TICKET##", "").trim() }
              : m
          )
        );
        setTimeout(() => setShowTicketForm(true), 800);
      }
    } catch (e) {
      console.error(e);
      setIsTyping(false);
      const errMsg: DisplayMessage = { role: "assistant", text: "Ops, tive um probleminha técnico aqui 😅 Tenta de novo por favor!" };
      setDisplayMessages((prev) => [...prev, errMsg]);
      setMessages((prev) => [...prev, { role: "assistant", content: errMsg.text }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Bubble position: on mobile, move above bottom nav (bottom-20); allow user to minimize
  const bubbleBottom = isMobile ? "bottom-20" : "bottom-6";

  if (!open) {
    if (minimized) {
      // Minimized state: show nothing, user dismissed the bubble
      return null;
    }
    return (
      <div className={`fixed ${bubbleBottom} right-4 z-50 flex flex-col items-end gap-2`}>
        {isMobile && (
          <button
            onClick={() => setMinimized(true)}
            className="h-6 w-6 rounded-full bg-muted/90 border border-border flex items-center justify-center shadow-sm"
            aria-label="Fechar suporte"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:scale-105 transition-transform flex items-center justify-center group relative"
          aria-label="Abrir suporte"
        >
          <img src={leandroAvatar} alt="Leandro - Suporte" className="h-14 w-14 rounded-full object-cover border-2 border-primary" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${bubbleBottom} right-4 z-50 w-[370px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
        <div className="relative">
          <img src={leandroAvatar} alt="Leandro" className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/30" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Leandro</p>
          <p className="text-xs opacity-80">
            {isTyping ? "digitando..." : showTicketForm ? "Formulário de ticket" : "Suporte Nível I • Online"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a href="https://wa.me/5527998133374" target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-primary-foreground/10 transition-colors" title="WhatsApp direto">
            <Phone className="h-4 w-4" />
          </a>
          <a href="mailto:suporte@leadspro.app" className="p-1 rounded hover:bg-primary-foreground/10 transition-colors" title="Email">
            <Mail className="h-4 w-4" />
          </a>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-primary-foreground/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Ticket form or chat */}
      {showTicketForm ? (
        ticketSent ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <p className="font-semibold text-foreground">Ticket enviado com sucesso!</p>
            <p className="text-sm text-muted-foreground">Nossa equipe técnica vai analisar e resolver em até <strong>48 horas</strong>. Você receberá retorno pelo WhatsApp.</p>
            <Button size="sm" variant="outline" onClick={() => { setShowTicketForm(false); setTicketSent(false); }}>
              Voltar ao chat
            </Button>
          </div>
        ) : (
          <TicketForm onClose={() => setShowTicketForm(false)} onSent={() => setTicketSent(true)} />
        )
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/30">
            {displayMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <img src={leandroAvatar} alt="Leandro" className="h-7 w-7 rounded-full object-cover mt-1 shrink-0" />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground border border-border rounded-bl-md"
                  }`}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Imagem enviada" className="rounded-lg mb-2 max-w-full max-h-48 object-contain" />
                  )}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text !== "Veja esta imagem:" && msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <img src={leandroAvatar} alt="Leandro" className="h-7 w-7 rounded-full object-cover mt-1 shrink-0" />
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image preview */}
          {pendingImage && (
            <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-2">
              <img src={pendingImage} alt="Preview" className="h-14 w-14 rounded-lg object-cover border border-border" />
              <button onClick={() => setPendingImage(null)} className="text-xs text-destructive hover:underline">Remover</button>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Enviar imagem">
                <ImagePlus className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm outline-none border border-border focus:ring-2 focus:ring-primary/30"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !pendingImage)}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
