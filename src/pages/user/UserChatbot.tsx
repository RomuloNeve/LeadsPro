import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTutorial } from "@/components/PageTutorial";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Loader2,
  Save,
  Power,
  PowerOff,
  MessageCircle,
  UserPlus,
  Trash2,
  Sparkles,
  Phone,
  Send,
  RotateCcw,
  FileUp,
  FileText,
  X,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface ChatbotConfig {
  id: string;
  license_id: string;
  name: string;
  system_prompt: string;
  is_active: boolean;
}

interface ChatbotFile {
  id: string;
  config_id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  created_at: string;
}

interface ChatbotLead {
  id: string;
  config_id: string;
  lead_phone: string;
  is_active: boolean;
  messages_count: number;
  created_at: string;
}

interface PromptFields {
  businessDescription: string;
  communicationType: string;
  objectives: string;
  rules: string;
  extraInstructions: string;
}

const COMMUNICATION_TYPES = [
  { value: "profissional", label: "Profissional", desc: "Formal e objetivo, ideal para B2B" },
  { value: "amigavel", label: "Amigável", desc: "Informal e próximo, ideal para B2C" },
  { value: "consultivo", label: "Consultivo", desc: "Especialista que orienta e aconselha" },
  { value: "persuasivo", label: "Persuasivo", desc: "Focado em convencer e fechar vendas" },
  { value: "casual", label: "Casual", desc: "Descontraído, como um amigo que ajuda" },
];

function buildPromptFromFields(fields: PromptFields): string {
  const parts: string[] = [];
  if (fields.businessDescription.trim()) parts.push(`Sobre o negócio:\n${fields.businessDescription.trim()}`);
  const ct = COMMUNICATION_TYPES.find(c => c.value === fields.communicationType);
  if (ct) parts.push(`Tipo de comunicação: ${ct.label} — ${ct.desc}`);
  if (fields.objectives.trim()) parts.push(`Objetivos:\n${fields.objectives.trim()}`);
  if (fields.rules.trim()) parts.push(`Regras:\n${fields.rules.trim()}`);
  if (fields.extraInstructions.trim()) parts.push(`Instruções adicionais:\n${fields.extraInstructions.trim()}`);
  return parts.join("\n\n");
}

function parsePromptToFields(prompt: string): PromptFields {
  const fields: PromptFields = { businessDescription: "", communicationType: "profissional", objectives: "", rules: "", extraInstructions: "" };
  const sections = prompt.split(/\n\n+/);
  for (const section of sections) {
    if (section.startsWith("Sobre o negócio:")) {
      fields.businessDescription = section.replace("Sobre o negócio:\n", "").trim();
    } else if (section.startsWith("Tipo de comunicação:")) {
      const match = section.match(/Tipo de comunicação:\s*(\S+)/);
      if (match) {
        const found = COMMUNICATION_TYPES.find(c => c.label === match[1]);
        if (found) fields.communicationType = found.value;
      }
    } else if (section.startsWith("Objetivos:")) {
      fields.objectives = section.replace("Objetivos:\n", "").trim();
    } else if (section.startsWith("Regras:")) {
      fields.rules = section.replace("Regras:\n", "").trim();
    } else if (section.startsWith("Instruções adicionais:")) {
      fields.extraInstructions = section.replace("Instruções adicionais:\n", "").trim();
    } else if (section.trim()) {
      fields.businessDescription = (fields.businessDescription ? fields.businessDescription + "\n" : "") + section.trim();
    }
  }
  return fields;
}

const DEFAULT_FIELDS: PromptFields = {
  businessDescription: "",
  communicationType: "profissional",
  objectives: "1. Qualificar o lead fazendo perguntas estratégicas\n2. Responder dúvidas sobre produtos/serviços\n3. Agendar reuniões quando houver interesse\n4. Conduzir naturalmente para a venda",
  rules: "- Seja cordial, objetivo e persuasivo\n- Use linguagem natural de WhatsApp\n- Máximo 2-3 parágrafos por resposta\n- Não use emojis em excesso (máximo 2-3)\n- Se o lead pedir para falar com humano, diga que vai transferir",
  extraInstructions: "",
};

const UserChatbot = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [name, setName] = useState("Meu Chatbot");
  const [promptFields, setPromptFields] = useState<PromptFields>(DEFAULT_FIELDS);
  const [isActive, setIsActive] = useState(true);
  const [schedulingLink, setSchedulingLink] = useState("");
  const [leads, setLeads] = useState<ChatbotLead[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [addingPhone, setAddingPhone] = useState(false);
  const [testMessages, setTestMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [chatbotFiles, setChatbotFiles] = useState<ChatbotFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const invokeFunction = useCallback(
    async (action: string, method = "GET", body?: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=${action}${body?.config_id ? `&config_id=${body.config_id}` : ""}`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro na requisição");
      return json;
    },
    []
  );

  const loadConfig = useCallback(async () => {
    try {
      const data = await invokeFunction("get-config");
      if (data.config) {
        setConfig(data.config);
        setName(data.config.name);
        setPromptFields(parsePromptToFields(data.config.system_prompt));
        setIsActive(data.config.is_active);
        setSchedulingLink(data.config.scheduling_link || "");
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false);
    }
  }, [invokeFunction]);

  const loadLeads = useCallback(async (configId: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=list-leads&config_id=${configId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();
      setLeads(json.leads || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config?.id) loadLeads(config.id);
  }, [config?.id, loadLeads]);

  const loadFiles = useCallback(async (configId: string) => {
    try {
      const { data } = await supabase
        .from("chatbot_files")
        .select("*")
        .eq("config_id", configId)
        .order("created_at", { ascending: false });
      setChatbotFiles(data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (config?.id) loadFiles(config.id);
  }, [config?.id, loadFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config?.id) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 20MB", variant: "destructive" });
      return;
    }
    setUploadingFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${config.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("chatbot-files").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("chatbot-files").getPublicUrl(path);
      
      const { error: dbErr } = await supabase.from("chatbot_files").insert({
        config_id: config.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_path: path,
      });
      if (dbErr) throw dbErr;

      toast({ title: "Arquivo enviado!", description: file.name });
      loadFiles(config.id);
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (file: ChatbotFile) => {
    try {
      await supabase.storage.from("chatbot-files").remove([file.file_path]);
      await supabase.from("chatbot_files").delete().eq("id", file.id);
      setChatbotFiles(prev => prev.filter(f => f.id !== file.id));
      toast({ title: "Arquivo removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await invokeFunction("save-config", "POST", {
        name,
        system_prompt: buildPromptFromFields(promptFields),
        is_active: isActive,
        scheduling_link: schedulingLink || null,
        config_id: config?.id,
      });
      setConfig(data.config);
      toast({ title: "Salvo!", description: "Configuração do chatbot atualizada." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.trim() || !config?.id) return;
    setAddingPhone(true);
    try {
      const cleanPhone = newPhone.replace(/\D/g, "");
      await invokeFunction("toggle-lead", "POST", {
        phone: cleanPhone,
        activate: true,
        config_id: config.id,
      });
      setNewPhone("");
      toast({ title: "Lead adicionado!", description: `Bot ativado para ${cleanPhone}` });
      loadLeads(config.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setAddingPhone(false);
    }
  };

  const handleToggleLead = async (phone: string, activate: boolean) => {
    if (!config?.id) return;
    try {
      await invokeFunction("toggle-lead", "POST", {
        phone,
        activate,
        config_id: config.id,
      });
      toast({
        title: activate ? "Bot ativado" : "Bot desativado",
        description: `Para o número ${phone}`,
      });
      loadLeads(config.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleTestChat = async () => {
    if (!testInput.trim() || testLoading) return;
    const userMsg = testInput.trim();
    setTestInput("");
    setTestMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setTestLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/chatbot-webhook?action=test-chat`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ message: userMsg, history: testMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Erro na requisição");
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      // Add empty assistant message
      setTestMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setTestMessages(prev =>
                prev.map((m, i) =>
                  i === prev.length - 1 && m.role === "assistant"
                    ? { ...m, content: snapshot }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      toast({ title: "Erro no teste", description: err.message, variant: "destructive" });
    } finally {
      setTestLoading(false);
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
        title="Chatbot IA"
        description="Configure um assistente de IA que responde automaticamente pelo WhatsApp. Ative manualmente para cada lead que desejar."
        steps={[
          { emoji: "1️⃣", text: "Configure o prompt do chatbot com instruções sobre seu negócio." },
          { emoji: "2️⃣", text: "Salve a configuração e ative o chatbot." },
          { emoji: "3️⃣", text: "Adicione o número do lead para ativar o bot naquela conversa." },
          { emoji: "🤖", text: "O bot responderá automaticamente usando IA quando o lead enviar mensagem." },
        ]}
      />

      <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        Chatbot IA
      </h1>
      <p className="text-sm text-muted-foreground">
        Assistente inteligente que responde leads automaticamente pelo WhatsApp.
      </p>

      {/* Human Handoff Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Headphones className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Atendimento Humano</p>
            <p className="text-xs text-muted-foreground">
              Quando o lead pedir para falar com uma pessoa, o chatbot transfere automaticamente. Você recebe notificação por email, WhatsApp e som, e pode atender na aba dedicada.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate("/user-dashboard/human-support")}>
            Ver solicitações <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Configuração do Bot
            </CardTitle>
            <CardDescription>
              Defina como o chatbot deve se comportar nas conversas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Nome do Chatbot</Label>
              <Input
                id="bot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Assistente de Vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Sobre seu negócio</Label>
              <Textarea
                value={promptFields.businessDescription}
                onChange={(e) => setPromptFields(f => ({ ...f, businessDescription: e.target.value }))}
                placeholder="Ex: Somos uma agência de marketing digital que oferece gestão de tráfego, social media e criação de sites..."
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Descreva brevemente o que sua empresa faz e o que oferece.</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de comunicação</Label>
              <Select value={promptFields.communicationType} onValueChange={(v) => setPromptFields(f => ({ ...f, communicationType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value} className="[&[data-highlighted]_span]:text-accent-foreground">
                      <span className="font-medium">{ct.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs group-data-[highlighted]:text-accent-foreground">— {ct.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Objetivos do bot</Label>
              <Textarea
                value={promptFields.objectives}
                onChange={(e) => setPromptFields(f => ({ ...f, objectives: e.target.value }))}
                placeholder="Ex: Qualificar leads, agendar reuniões, tirar dúvidas..."
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">O que o bot deve tentar alcançar nas conversas.</p>
            </div>

            <div className="space-y-2">
              <Label>Regras</Label>
              <Textarea
                value={promptFields.rules}
                onChange={(e) => setPromptFields(f => ({ ...f, rules: e.target.value }))}
                placeholder="Ex: Não falar de preços, sempre pedir telefone..."
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Limites e orientações que o bot deve seguir.</p>
            </div>

            <div className="space-y-2">
              <Label>Instruções adicionais</Label>
              <Textarea
                value={promptFields.extraInstructions}
                onChange={(e) => setPromptFields(f => ({ ...f, extraInstructions: e.target.value }))}
                placeholder="Qualquer outra orientação para o bot..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Link de agendamento</Label>
              <Input
                value={schedulingLink}
                onChange={(e) => setSchedulingLink(e.target.value)}
                placeholder="Ex: https://calendly.com/seu-nome ou qualquer link"
              />
              <p className="text-xs text-muted-foreground">
                Quando o lead quiser agendar, o bot envia esse link pelo WhatsApp e por e-mail (se tiver o e-mail do lead).
              </p>
            </div>

            {/* Files section */}
            {config && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Arquivos do Bot (PDFs, propostas)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Faça upload de arquivos que o bot pode enviar quando o lead pedir proposta, catálogo, etc.
                </p>

                <div className="space-y-2">
                  {chatbotFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-foreground truncate hover:underline"
                        >
                          {file.file_name}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground">
                    {uploadingFile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                    {uploadingFile ? "Enviando..." : "Clique para enviar arquivo"}
                  </div>
                </label>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Power className="h-4 w-4 text-primary" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {isActive ? "Bot ativo" : "Bot desativado"}
                </span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full gradient-bg text-primary-foreground"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardContent>
        </Card>

        {/* Leads Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Leads com Bot Ativo
              {leads.filter((l) => l.is_active).length > 0 && (
                <Badge className="gradient-bg text-primary-foreground border-0">
                  {leads.filter((l) => l.is_active).length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Adicione números de leads para o chatbot responder automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!config ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Salve a configuração primeiro para ativar o bot.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="5511999999999"
                      className="pl-9"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPhone()}
                    />
                  </div>
                  <Button
                    onClick={handleAddPhone}
                    disabled={addingPhone || !newPhone.trim()}
                    size="icon"
                    className="gradient-bg text-primary-foreground shrink-0"
                  >
                    {addingPhone ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhum lead adicionado ainda.</p>
                    <p className="text-xs mt-1">Adicione o número de um lead para ativar o bot.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${lead.is_active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{lead.lead_phone}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.messages_count} mensagens respondidas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={lead.is_active}
                            onCheckedChange={(checked) =>
                              handleToggleLead(lead.lead_phone, checked)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Chat Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Testar Bot
              </CardTitle>
              <CardDescription>
                Simule uma conversa para ver como seu bot vai responder.
              </CardDescription>
            </div>
            {testMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTestMessages([])}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!config ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Salve a configuração primeiro para testar o bot.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/20 p-4">
                {testMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Envie uma mensagem para testar seu bot</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.content ? (
                            msg.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&_a]:text-primary [&_a]:underline">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : msg.content
                          ) : (testLoading && i === testMessages.length - 1 ? (
                            <div className="flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Digite uma mensagem de teste..."
                  onKeyDown={(e) => e.key === "Enter" && handleTestChat()}
                  disabled={testLoading}
                />
                <Button
                  onClick={handleTestChat}
                  disabled={testLoading || !testInput.trim()}
                  size="icon"
                  className="gradient-bg text-primary-foreground shrink-0"
                >
                  {testLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserChatbot;
