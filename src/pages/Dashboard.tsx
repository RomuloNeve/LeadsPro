import { useEffect, useState, useCallback } from "react";
import UtmGenerator from "@/components/UtmGenerator";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Skull,
  LogOut,
  Plus,
  Copy,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Key,
  Crown,
  Calendar,
  Search,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Eye,
  MessageSquare,
  Target,
  Shield,
  Clock,
  Activity,
  Server,
  XCircle,
  CheckCircle2,
  Smartphone,
  FileText,
  FlaskConical,
  Mail,
  Download,
  Globe,
  TrendingUp,
  MousePointerClick,
  Link2,
  Gift,
} from "lucide-react";

interface License {
  id: string;
  code: string;
  is_active: boolean;
  description: string | null;
  plan_type: string;
  expires_at: string | null;
  created_at: string;
  assigned_to: string | null;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  created_at: string;
  whatsapp_phone: string | null;
  is_admin: boolean;
  last_sign_in: string | null;
  created_at_auth: string;
  license: License | null;
  instance: any | null;
}

interface ErrorLog {
  id: string;
  function_name: string;
  error_message: string;
  error_details: any;
  user_id: string | null;
  instance_name: string | null;
  request_payload: any;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  activeLicenses: number;
  inactiveLicenses: number;
  assignedLicenses: number;
  unassignedLicenses: number;
  activeInstances: number;
  inactiveInstances: number;
  totalInstances: number;
}

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return segments.join("-");
};

const getDaysRemaining = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const timeAgo = (date: string) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d atrás`;
  return d.toLocaleDateString("pt-BR");
};

const translateFunctionName = (fn: string): string => {
  const map: Record<string, string> = {
    "trigger-campaign": "Disparo de Campanha",
    "send-group-message": "Mensagem de Grupo",
    "chatbot-webhook": "Chatbot (Webhook)",
    "whatsapp-instance": "Instância WhatsApp",
    "whatsapp-inbox": "Caixa de Entrada",
    "search-leads": "Busca de Leads",
    "save-leads": "Salvar Leads",
    "process-followups": "Follow-ups",
    "send-email-campaign": "Email Marketing",
    "create-pix": "Criar PIX",
    "check-pix": "Verificar PIX",
    "cakto-webhook": "Webhook Pagamento",
    "activate-license": "Ativar Licença",
    "validate-license": "Validar Licença",
    "generate-license": "Gerar Licença",
    "reset-password": "Redefinir Senha",
    "check-free-trial": "Verificar Teste Grátis",
    "renewal-reminder": "Lembrete de Renovação",
    "admin-stats": "Painel Admin",
    "improve-message": "Melhorar Mensagem (IA)",
    "improve-email": "Melhorar Email (IA)",
    "support-chat": "Chat de Suporte",
    "send-support-ticket": "Ticket de Suporte",
    "admin-test-send": "Teste de Envio (Admin)",
  };
  return map[fn] || fn;
};

const explainError = (err: ErrorLog): string => {
  const msg = (err.error_message || "").toLowerCase();
  const fn = err.function_name;

  // Common patterns
  if (msg.includes("not connected") || msg.includes("disconnected") || msg.includes("qrcode"))
    return "O WhatsApp do usuário está desconectado. Ele precisa escanear o QR Code novamente.";
  if (msg.includes("unauthorized") || msg.includes("401"))
    return "Erro de autenticação — o token ou chave de acesso expirou ou é inválido.";
  if (msg.includes("forbidden") || msg.includes("403"))
    return "Sem permissão para executar essa ação.";
  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("too many"))
    return "Muitas requisições em pouco tempo. O sistema atingiu o limite da API.";
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("deadline"))
    return "A operação demorou muito e foi cancelada (timeout).";
  if (msg.includes("not found") || msg.includes("404"))
    return "O recurso solicitado não foi encontrado (pode ter sido deletado).";
  if (msg.includes("network") || msg.includes("fetch failed") || msg.includes("econnrefused"))
    return "Erro de conexão — não conseguiu se comunicar com o servidor externo.";
  if (msg.includes("invalid") && msg.includes("phone"))
    return "Número de telefone inválido ou não está no WhatsApp.";
  if (msg.includes("duplicate") || msg.includes("already exists"))
    return "Registro duplicado — já existe no banco de dados.";
  if (msg.includes("credit") || msg.includes("quota") || msg.includes("insufficient"))
    return "Créditos insuficientes na API (SerpAPI/Serper/outro).";
  if (msg.includes("json") || msg.includes("parse") || msg.includes("syntax"))
    return "Erro ao processar os dados — formato inesperado na resposta.";
  if (msg.includes("500") || msg.includes("internal server"))
    return "Erro interno no servidor externo. Não é um problema nosso.";
  
  // Function-specific
  if (fn === "trigger-campaign") return "Erro durante o disparo da campanha de WhatsApp.";
  if (fn === "chatbot-webhook") return "Erro ao processar mensagem recebida pelo chatbot.";
  if (fn === "search-leads") return "Erro na busca de leads via API de pesquisa.";
  if (fn === "process-followups") return "Erro ao processar envio automático de follow-up.";
  if (fn === "renewal-reminder") return "Erro ao enviar lembrete de renovação.";

  return "Erro técnico. Clique para ver os detalhes completos.";
};

const Dashboard = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [instances, setInstances] = useState<any[]>([]);
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState<string>("lifetime");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [errorSearch, setErrorSearch] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [apiCredits, setApiCredits] = useState<any[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [testWhatsAppMsg, setTestWhatsAppMsg] = useState("Mensagem de teste do painel admin 🚀");
  const [testEmailSubject, setTestEmailSubject] = useState("Teste de email - LeadsPro Admin");
  const [testEmailBody, setTestEmailBody] = useState("Este é um email de teste enviado pelo painel administrativo do LeadsPro.");
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [bulkMsg, setBulkMsg] = useState("Olá {nome}! 👋\n\nVi que você criou uma conta no LeadsPro. Posso te ajudar a aproveitar melhor o teste grátis?\n\nQualquer dúvida, estou aqui! 🚀");
  const [bulkPlanFilter, setBulkPlanFilter] = useState("free");
  const [bulkPreview, setBulkPreview] = useState<any>(null);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [exportLicenseId, setExportLicenseId] = useState<string>("all");
  const [exportCategory, setExportCategory] = useState<string>("all");
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [gaData, setGaData] = useState<any>(null);
  const [loadingGa, setLoadingGa] = useState(false);
  const [gaPeriod, setGaPeriod] = useState("30");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchBlogPosts = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, read_time, published_at")
      .order("published_at", { ascending: false });
    setBlogPosts(data || []);
  }, []);

  const fetchApiCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stats", {
        body: { action: "api-credits" },
      });
      if (!error && data?.credits) setApiCredits(data.credits);
    } catch { /* ignore */ }
    setLoadingCredits(false);
  }, []);

  const fetchGaData = useCallback(async (period = "30") => {
    setLoadingGa(true);
    try {
      const { data, error } = await supabase.functions.invoke("ga4-analytics", {
        body: { period },
      });
      if (!error && data) setGaData(data);
      else if (data?.error) {
        console.warn("GA4:", data.error);
      }
    } catch { /* ignore */ }
    setLoadingGa(false);
  }, []);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stats", {
        body: { action: "overview" },
      });

      if (error) throw error;

      setUsers(data.users || []);
      setLicenses(data.licenses || []);
      setInstances(data.instances || []);
      setErrors(data.recentErrors || []);
      setStats(data.stats || null);
      setTotalLeads(data.totalLeads || 0);
      setTotalCampaigns(data.totalCampaigns || 0);
      setTotalErrors(data.totalErrors || 0);
    } catch (err: any) {
      console.error(err);
      // Fallback to direct query for licenses
      const { data } = await supabase
        .from("licenses")
        .select("*")
        .order("created_at", { ascending: false });
      setLicenses((data as License[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      fetchAdminData();
      fetchBlogPosts();
      fetchApiCredits();
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const code = generateCode();
    const { data: { user } } = await supabase.auth.getUser();

    let expiresAt: string | null = null;
    if (planType === "monthly") {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      expiresAt = date.toISOString();
    }

    let assignedTo: string | null = null;
    if (userEmail.trim()) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", userEmail.trim().toLowerCase())
        .maybeSingle();

      if (!profile) {
        toast({ title: "Usuário não encontrado", description: `Nenhum usuário com email: ${userEmail}`, variant: "destructive" });
        setGenerating(false);
        return;
      }
      assignedTo = profile.user_id;
    }

    const { error } = await supabase.from("licenses").insert({
      code,
      description: description.trim() || null,
      created_by: user?.id,
      plan_type: planType,
      expires_at: expiresAt,
      assigned_to: assignedTo,
    } as any);

    if (error) {
      toast({ title: "Erro ao gerar licença", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Licença gerada!", description: `${code}${assignedTo ? ` → ${userEmail}` : ""}` });
      setDescription("");
      setUserEmail("");
      setPlanType("lifetime");
      fetchAdminData();
    }
    setGenerating(false);
  };

  const toggleLicense = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("licenses").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) fetchAdminData();
  };

  const deleteLicense = async (id: string) => {
    const { error } = await supabase.from("licenses").delete().eq("id", id);
    if (!error) fetchAdminData();
  };

  const clearErrors = async () => {
    const { data, error } = await supabase.functions.invoke("admin-stats", {
      body: { action: "clear-errors" },
    });
    if (!error) {
      setErrors([]);
      setTotalErrors(0);
      toast({ title: "Logs limpos!" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado!" });
  };

  const handleExportLeads = async () => {
    setExporting(true);
    try {
      const body: any = { action: "export-leads" };
      if (exportLicenseId !== "all") body.license_id = exportLicenseId;
      if (exportCategory !== "all") body.category = exportCategory;

      const { data, error } = await supabase.functions.invoke("admin-stats", { body });
      if (error) throw error;

      const leads = data?.leads || [];
      if (leads.length === 0) {
        toast({ title: "Nenhum lead encontrado", variant: "destructive" });
        setExporting(false);
        return;
      }

      // Update categories for filter
      if (data.categories) setExportCategories(data.categories);

      // Build CSV with name + instagram + category
      const csvRows = ["Nome,Instagram,Categoria"];
      for (const lead of leads) {
        const name = (lead.name || "").replace(/,/g, " ");
        const ig = lead.instagram || "";
        const cat = (lead.category || "").replace(/,/g, " ");
        csvRows.push(`${name},${ig},${cat}`);
      }

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${exportCategory !== "all" ? exportCategory + "-" : ""}${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: `✅ ${leads.length} leads exportados!` });
    } catch (e: any) {
      toast({ title: "Erro na exportação", description: e.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const loadExportCategories = async () => {
    try {
      const body: any = { action: "export-leads" };
      if (exportLicenseId !== "all") body.license_id = exportLicenseId;
      const { data } = await supabase.functions.invoke("admin-stats", { body });
      if (data?.categories) setExportCategories(data.categories);
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredLicenses = licenses.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.code.toLowerCase().includes(q) || (l.description?.toLowerCase().includes(q) ?? false);
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.email?.toLowerCase().includes(q) ?? false) || u.user_id.includes(q);
  });

  const filteredErrors = errors.filter((e) => {
    if (!errorSearch) return true;
    const q = errorSearch.toLowerCase();
    return e.function_name.toLowerCase().includes(q) || e.error_message.toLowerCase().includes(q);
  });

  const exportableLicenses = licenses
    .filter((l) => Boolean(l.assigned_to))
    .map((l) => {
      const user = users.find((u) => u.user_id === l.assigned_to);
      return {
        id: l.id,
        label: user?.email || (l.assigned_to ? l.assigned_to.slice(0, 8) : l.code),
        planType: l.plan_type,
      };
    });

  const renderPlanBadge = (license: License) => {
    if (license.plan_type === "lifetime") {
      return (
        <Badge variant="outline" className="border-primary/50 text-primary text-xs">
          <Crown className="h-3 w-3 mr-1" /> Vitalício
        </Badge>
      );
    }
    const days = getDaysRemaining(license.expires_at);
    const isExpired = days !== null && days <= 0;
    const isExpiring = days !== null && days <= 7 && days > 0;
    return (
      <Badge variant="outline" className={`text-xs ${isExpired ? "border-destructive/50 text-destructive" : isExpiring ? "border-yellow-500/50 text-yellow-400" : "border-muted-foreground/30 text-muted-foreground"}`}>
        <Calendar className="h-3 w-3 mr-1" />
        {isExpired ? "Expirada" : `${days} dias`}
      </Badge>
    );
  };

  const StatCard = ({ icon: Icon, label, value, sub, color = "text-foreground" }: { icon: any; label: string; value: number | string; sub?: string; color?: string }) => (
    <div className="rounded-xl border border-border bg-card p-4 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-bg rounded-xl p-2">
              <Skull className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold font-display gradient-text">LeadsPro</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              <Shield className="h-3 w-3 mr-1" /> Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchAdminData} title="Atualizar">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start bg-card border border-border h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Usuários</TabsTrigger>
            <TabsTrigger value="instances" className="gap-1.5 text-xs"><Smartphone className="h-3.5 w-3.5" /> Instâncias</TabsTrigger>
            <TabsTrigger value="errors" className="gap-1.5 text-xs relative">
              <AlertTriangle className="h-3.5 w-3.5" /> Erros
              {totalErrors > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">{totalErrors}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="licenses" className="gap-1.5 text-xs"><Key className="h-3.5 w-3.5" /> Licenças</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs" onClick={() => { if (!gaData) fetchGaData(gaPeriod); }}><Globe className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Blog</TabsTrigger>
            <TabsTrigger value="api-credits" className="gap-1.5 text-xs"><Server className="h-3.5 w-3.5" /> APIs</TabsTrigger>
            <TabsTrigger value="utm" className="gap-1.5 text-xs"><Link2 className="h-3.5 w-3.5" /> UTM</TabsTrigger>
            <TabsTrigger value="tests" className="gap-1.5 text-xs"><FlaskConical className="h-3.5 w-3.5" /> Testes</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando dados...</div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard icon={Users} label="Usuários" value={stats.totalUsers} sub={`${stats.adminUsers} admins`} color="text-primary" />
                  <StatCard icon={Target} label="Leads" value={totalLeads.toLocaleString("pt-BR")} color="text-primary" />
                  <StatCard icon={MessageSquare} label="Campanhas" value={totalCampaigns} color="text-primary" />
                  <StatCard icon={CheckCircle2} label="Licenças Ativas" value={stats.activeLicenses} sub={`${stats.inactiveLicenses} inativas`} color="text-emerald-500" />
                  <StatCard icon={Smartphone} label="Instâncias" value={stats.totalInstances} sub={`${stats.activeInstances} conectadas`} color="text-blue-500" />
                </div>

                {/* All users table with plan and date */}
                <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Todos os Usuários
                  </h3>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 px-2 font-medium">Usuário</th>
                          <th className="text-left py-2 px-2 font-medium">Plano</th>
                          <th className="text-left py-2 px-2 font-medium">Status</th>
                          <th className="text-left py-2 px-2 font-medium">Dias Restantes</th>
                          <th className="text-left py-2 px-2 font-medium">Cadastro</th>
                          <th className="text-left py-2 px-2 font-medium">Último Acesso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const planLabel = u.license?.plan_type === "lifetime" ? "Vitalício" : u.license?.plan_type === "anual" ? "Anual" : u.license?.plan_type === "mensal" ? "Mensal" : u.license?.plan_type === "free" ? "Free" : "Sem licença";
                          const planColor = u.license?.plan_type === "lifetime" ? "text-amber-500" : u.license?.plan_type === "anual" ? "text-purple-500" : u.license?.plan_type === "mensal" ? "text-blue-500" : u.license?.plan_type === "free" ? "text-green-500" : "text-muted-foreground";
                          const daysLeft = u.license?.expires_at ? getDaysRemaining(u.license.expires_at) : null;
                          return (
                            <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                    {(u.email || "?")[0].toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{u.email || "Sem email"}</span>
                                  {u.is_admin && <Badge className="gradient-bg text-primary-foreground border-0 text-[8px] px-1 py-0">Admin</Badge>}
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`text-xs font-semibold ${planColor}`}>{planLabel}</span>
                              </td>
                              <td className="py-2 px-2">
                                {u.license ? (
                                  <Badge variant="outline" className={`text-[10px] ${u.license.is_active ? "border-emerald-500/30 text-emerald-500" : "border-destructive/30 text-destructive"}`}>
                                    {u.license.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                {daysLeft !== null ? (
                                  <span className={`text-xs font-medium ${daysLeft <= 0 ? "text-destructive" : daysLeft <= 5 ? "text-yellow-500" : "text-muted-foreground"}`}>
                                    {daysLeft <= 0 ? "Expirado" : `${daysLeft}d`}
                                  </span>
                                ) : u.license?.plan_type === "lifetime" ? (
                                  <span className="text-xs text-amber-500">∞</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                              <td className="py-2 px-2 text-xs text-muted-foreground">{u.last_sign_in ? timeAgo(u.last_sign_in) : "Nunca"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold font-display text-foreground">Usuários ({users.length})</h2>
              <div className="flex gap-2 flex-wrap">
                {["todos", "free", "mensal", "anual", "lifetime", "sem-licenca"].map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className={`text-xs cursor-pointer transition-colors ${userSearch === (f === "todos" ? "" : f) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                    onClick={() => setUserSearch(f === "todos" ? "" : f)}
                  >
                    {f === "todos" ? "Todos" : f === "sem-licenca" ? "Sem licença" : f === "free" ? "Free" : f === "mensal" ? "Mensal" : f === "anual" ? "Anual" : "Vitalício"}
                  </Badge>
                ))}
              </div>
              <div className="relative flex-1 max-w-sm ml-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <StatCard icon={Users} label="Total" value={users.length} color="text-foreground" />
              <StatCard icon={Gift} label="Free" value={users.filter(u => u.license?.plan_type === "free").length} color="text-green-500" />
              <StatCard icon={Calendar} label="Mensal" value={users.filter(u => u.license?.plan_type === "mensal").length} color="text-blue-500" />
              <StatCard icon={Crown} label="Anual" value={users.filter(u => u.license?.plan_type === "anual").length} color="text-purple-500" />
              <StatCard icon={Crown} label="Vitalício" value={users.filter(u => u.license?.plan_type === "lifetime").length} color="text-amber-500" />
            </div>

            {/* Export Leads Section */}
            <div className="rounded-xl border border-border bg-card p-4 card-shadow">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Exportar Leads (Nome + Instagram)
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Conta do usuário</label>
                  <Select value={exportLicenseId} onValueChange={(v) => { setExportLicenseId(v); setExportCategory("all"); }}>
                    <SelectTrigger className="w-[220px] h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {exportableLicenses.map((license) => (
                        <SelectItem key={license.id} value={license.id}>
                          {license.label} ({license.planType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <Select value={exportCategory} onValueChange={setExportCategory}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {exportCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={() => { loadExportCategories(); }} variant="outline" className="h-9">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Carregar categorias
                </Button>
                <Button size="sm" onClick={handleExportLeads} disabled={exporting} className="h-9 gradient-bg">
                  {exporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                  Exportar CSV
                </Button>
              </div>
            </div>

            {(() => {
              const filtered = users.filter((u) => {
                if (!userSearch) return true;
                const q = userSearch.toLowerCase();
                // Plan filters
                if (q === "free") return u.license?.plan_type === "free";
                if (q === "mensal") return u.license?.plan_type === "mensal";
                if (q === "anual") return u.license?.plan_type === "anual";
                if (q === "lifetime") return u.license?.plan_type === "lifetime";
                if (q === "sem-licenca") return !u.license;
                return (u.email?.toLowerCase().includes(q) ?? false) || u.user_id.includes(q) || (u.whatsapp_phone?.includes(q) ?? false);
              });

              return filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">Nenhum usuário encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((u) => {
                    const planLabel = u.license?.plan_type === "lifetime" ? "Vitalício" : u.license?.plan_type === "anual" ? "Anual" : u.license?.plan_type === "mensal" ? "Mensal" : u.license?.plan_type === "free" ? "Free" : null;
                    const planColor = u.license?.plan_type === "lifetime" ? "text-amber-500 border-amber-500/30" : u.license?.plan_type === "anual" ? "text-purple-500 border-purple-500/30" : u.license?.plan_type === "mensal" ? "text-blue-500 border-blue-500/30" : u.license?.plan_type === "free" ? "text-green-500 border-green-500/30" : "text-muted-foreground border-muted-foreground/30";
                    const daysLeft = u.license?.expires_at ? getDaysRemaining(u.license.expires_at) : null;

                    return (
                      <div key={u.id} className="rounded-xl border border-border bg-card p-4 card-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {(u.email || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground">{u.email || "⚠️ Sem email"}</p>
                              {u.is_admin && <Badge className="gradient-bg text-primary-foreground border-0 text-[10px]">Admin</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
                              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {u.last_sign_in ? timeAgo(u.last_sign_in) : "Nunca acessou"}</span>
                              {u.whatsapp_phone && <span>📞 {u.whatsapp_phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {u.license ? (
                              <>
                                <Badge variant="outline" className={`text-[10px] ${planColor}`}>
                                  {u.license.plan_type === "lifetime" && <Crown className="h-3 w-3 mr-1" />}
                                  {planLabel}
                                </Badge>
                                {daysLeft !== null && (
                                  <Badge variant="outline" className={`text-[10px] ${daysLeft <= 0 ? "text-destructive border-destructive/30" : daysLeft <= 3 ? "text-yellow-500 border-yellow-500/30" : "text-muted-foreground border-muted-foreground/30"}`}>
                                    {daysLeft <= 0 ? "Expirado" : `${daysLeft}d restantes`}
                                  </Badge>
                                )}
                                <Badge variant={u.license.is_active ? "outline" : "destructive"} className={`text-[10px] ${u.license.is_active ? "border-emerald-500/30 text-emerald-500" : ""}`}>
                                  {u.license.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem Licença</Badge>
                            )}
                            {u.instance && (
                              <Badge variant="outline" className={`text-[10px] ${u.instance.status === "connected" ? "border-emerald-500/30 text-emerald-500" : "border-yellow-500/30 text-yellow-500"}`}>
                                <Smartphone className="h-3 w-3 mr-1" />
                                {u.instance.status === "connected" ? "WhatsApp ✓" : "WhatsApp ✕"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* INSTANCES */}
          <TabsContent value="instances" className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold font-display text-foreground">Instâncias WhatsApp ({instances.length})</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <StatCard icon={Smartphone} label="Total" value={stats?.totalInstances || 0} color="text-foreground" />
              <StatCard icon={Wifi} label="Conectadas" value={stats?.activeInstances || 0} color="text-emerald-500" />
              <StatCard icon={WifiOff} label="Desconectadas" value={stats?.inactiveInstances || 0} color="text-destructive" />
            </div>

            {instances.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">Nenhuma instância criada.</div>
            ) : (
              <div className="space-y-2">
                {instances.map((inst: any) => {
                  const owner = users.find((u) => u.user_id === inst.user_id);
                  return (
                    <div key={inst.id} className="rounded-xl border border-border bg-card p-4 card-shadow flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${inst.status === "connected" ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {inst.status === "connected" ? <Wifi className="h-5 w-5 text-emerald-500" /> : <WifiOff className="h-5 w-5 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{inst.instance_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Dono: {owner?.email || inst.user_id.slice(0, 8)}</span>
                          {inst.phone_connected && <span>📞 {inst.phone_connected}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${inst.status === "connected" ? "border-emerald-500/30 text-emerald-500" : "border-destructive/30 text-destructive"}`}>
                        {inst.status === "connected" ? "Conectada" : inst.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground shrink-0">{timeAgo(inst.updated_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ERRORS */}
          <TabsContent value="errors" className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Logs de Erro ({errors.length})
              </h2>
              <div className="relative flex-1 max-w-sm ml-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar erro..." value={errorSearch} onChange={(e) => setErrorSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              {errors.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearErrors}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                </Button>
              )}
            </div>

            {/* Error count by function */}
            {errors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  errors.reduce((acc: Record<string, number>, e) => {
                    acc[e.function_name] = (acc[e.function_name] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]).map(([fn, count]) => (
                  <Badge key={fn} variant="outline" className="text-xs border-destructive/30 text-destructive cursor-pointer" onClick={() => setErrorSearch(fn)}>
                    <Server className="h-3 w-3 mr-1" /> {translateFunctionName(fn)}: {count}
                  </Badge>
                ))}
              </div>
            )}

            {filteredErrors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                Nenhum erro encontrado 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {filteredErrors.map((err) => (
                  <div key={err.id} className="rounded-xl border border-destructive/20 bg-card p-4 card-shadow">
                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => setSelectedErrorId(selectedErrorId === err.id ? null : err.id)}>
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{translateFunctionName(err.function_name)}</Badge>
                          <p className="text-[10px] text-muted-foreground">{new Date(err.created_at).toLocaleString("pt-BR")}</p>
                          {err.instance_name && <Badge variant="outline" className="text-[10px]">{err.instance_name}</Badge>}
                        </div>
                        <p className="text-sm text-foreground mt-1 font-medium">{explainError(err)}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">{err.error_message}</p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    {selectedErrorId === err.id && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-xs font-medium text-foreground mb-1">Detalhes técnicos:</p>
                        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {err.error_details ? JSON.stringify(err.error_details, null, 2) : "Sem detalhes adicionais"}
                        </pre>
                        {err.request_payload && (
                          <>
                            <p className="text-xs font-medium text-foreground mb-1 mt-2">Request:</p>
                            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                              {JSON.stringify(err.request_payload, null, 2)}
                            </pre>
                          </>
                        )}
                        {err.user_id && <p className="text-xs text-muted-foreground mt-2">User ID: {err.user_id}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* LICENSES */}
          <TabsContent value="licenses" className="space-y-4">
            {/* Generate */}
            <div className="rounded-xl border border-border bg-card p-5 card-shadow">
              <h2 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" /> Gerar Nova Licença
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Email do usuário (opcional)" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="pl-10" />
                  </div>
                  <Button onClick={handleGenerate} disabled={generating} className="gradient-bg text-primary-foreground hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" /> {generating ? "Gerando..." : "Gerar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold font-display text-foreground">Licenças ({licenses.length})</h2>
              <div className="relative flex-1 max-w-sm ml-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar licença..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>

            {filteredLicenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">Nenhuma licença encontrada.</div>
            ) : (
              <div className="space-y-2">
                {filteredLicenses.map((license) => {
                  const owner = users.find((u) => u.user_id === license.assigned_to);
                  return (
                    <div key={license.id} className="rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-2 card-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <code className="text-xs font-mono font-semibold text-foreground">{license.code}</code>
                          <Badge variant={license.is_active ? "default" : "destructive"} className={`text-[10px] ${license.is_active ? "gradient-bg text-primary-foreground border-0" : ""}`}>
                            {license.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                          {renderPlanBadge(license)}
                          {owner && (
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                              → {owner.email}
                            </Badge>
                          )}
                        </div>
                        {license.description && <p className="text-xs text-muted-foreground truncate">{license.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(license.code)}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleLicense(license.id, license.is_active)}>
                          {license.is_active ? <ToggleRight className="h-3.5 w-3.5 text-primary" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLicense(license.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* GA4 ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold font-display text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Google Analytics
              </h2>
              <div className="flex items-center gap-2">
                <Select value={gaPeriod} onValueChange={(v) => { setGaPeriod(v); fetchGaData(v); }}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="14">Últimos 14 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => fetchGaData(gaPeriod)} disabled={loadingGa}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingGa ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {loadingGa ? (
              <div className="text-center py-12 text-muted-foreground">Carregando dados do Google Analytics...</div>
            ) : !gaData ? (
              <div className="text-center py-12 rounded-xl border border-border bg-card p-8">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground mb-2">GA4 não configurado</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Configure os secrets <strong>GA_SERVICE_ACCOUNT_JSON</strong> e <strong>GA_PROPERTY_ID</strong> para ver os dados reais do Google Analytics aqui.
                </p>
              </div>
            ) : gaData.error ? (
              <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5 p-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground mb-2">Erro ao carregar Analytics</h3>
                <p className="text-xs text-muted-foreground">{gaData.error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard icon={Users} label="Usuários Ativos" value={gaData.overview?.activeUsers || 0} sub="Visitantes únicos no período" color="text-primary" />
                  <StatCard icon={UserPlus} label="Novos Usuários" value={gaData.overview?.newUsers || 0} sub="Primeira visita ao site" color="text-emerald-500" />
                  <StatCard icon={Eye} label="Sessões" value={gaData.overview?.sessions || 0} sub="Total de visitas (inclui retornos)" color="text-blue-500" />
                  <StatCard icon={Activity} label="Page Views" value={gaData.overview?.pageViews || 0} sub="Páginas visualizadas no total" color="text-purple-500" />
                  <StatCard icon={TrendingUp} label="Taxa Rejeição" value={`${((gaData.overview?.bounceRate || 0) * 100).toFixed(1)}%`} sub="Saíram sem interagir" color="text-yellow-500" />
                  <StatCard icon={Clock} label="Tempo Médio" value={`${Math.round(gaData.overview?.avgSessionDuration || 0)}s`} sub="Duração média por sessão" color="text-orange-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Traffic Sources */}
                  <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Fontes de Tráfego
                    </h3>
                    <p className="text-[10px] text-muted-foreground mb-3">De onde vêm os visitantes do site (Google, redes sociais, direto, etc.)</p>
                    {(!gaData.trafficSources || gaData.trafficSources.length === 0) ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {gaData.trafficSources.map((src: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                src.source === "google" ? "bg-emerald-500" :
                                src.medium === "organic" ? "bg-blue-500" :
                                src.medium === "referral" ? "bg-purple-500" :
                                "bg-muted-foreground"
                              }`} />
                              <span className="text-xs font-medium text-foreground truncate">
                                {src.source}{src.medium !== "(none)" ? ` / ${src.medium}` : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                              <span>{src.sessions} sessões</span>
                              <span>{src.users} {src.users === 1 ? "usuário" : "usuários"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Conversions */}
                  <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-primary" /> Conversões
                    </h3>
                    <p className="text-[10px] text-muted-foreground mb-3">Ações importantes realizadas pelos visitantes (cadastro, compra, etc.)</p>
                    {(!gaData.conversions || gaData.conversions.length === 0) ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento de conversão registrado</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {gaData.conversions.map((ev: any, i: number) => {
                          const labels: Record<string, string> = {
                            sign_up: "📝 Cadastros", login: "🔑 Logins", begin_checkout: "🛒 Checkout",
                            add_payment_info: "💳 PIX Gerado", purchase: "✅ Compras",
                            license_activation: "🔓 Ativação", free_trial_start: "🎁 Teste Grátis",
                            lead_search: "🔍 Buscas", campaign_created: "📨 Campanhas",
                          };
                          return (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                              <span className="text-xs font-medium text-foreground">{labels[ev.event] || ev.event}</span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{ev.count}x</span>
                                <span>{ev.users} {ev.users === 1 ? "usuário" : "usuários"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Pages */}
                <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> Páginas Mais Visitadas
                  </h3>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {gaData.topPages?.map((page: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <span className="text-xs font-mono text-foreground truncate max-w-[60%]">{page.path}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{page.views} views</span>
                          <span>{page.users} usr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Users Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Usuários por Dia
                  </h3>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {gaData.daily?.map((day: any, i: number) => {
                      const maxUsers = Math.max(...(gaData.daily?.map((d: any) => d.users) || [1]));
                      const barWidth = maxUsers > 0 ? (day.users / maxUsers) * 100 : 0;
                      const dateStr = `${day.date.slice(6, 8)}/${day.date.slice(4, 6)}`;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">{dateStr}</span>
                          <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className="text-xs font-medium text-foreground w-8 text-right">{day.users}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* BLOG ARTICLES + LOGS */}
          <TabsContent value="blog" className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 card-shadow text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold text-foreground">{blogPosts.length}</p>
                <p className="text-xs text-muted-foreground">Artigos Publicados</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 card-shadow text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-bold text-foreground">6</p>
                <p className="text-xs text-muted-foreground">Artigos/dia</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 card-shadow text-center">
                <Activity className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold text-foreground">{errors.filter(e => e.function_name === "generate-blog-posts").length}</p>
                <p className="text-xs text-muted-foreground">Logs de Geração</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 card-shadow text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-muted-foreground mt-1">Próximas execuções</p>
                <p className="text-[10px] text-muted-foreground">08h (3) · 10h (1) · 16h (1) · 22h (1)</p>
              </div>
            </div>

            {/* Generation Logs */}
            <div className="rounded-xl border border-border bg-card p-5 card-shadow">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Logs de Geração Automática
              </h3>
              {(() => {
                const blogLogs = errors.filter((e) => e.function_name === "generate-blog-posts");
                if (blogLogs.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum log de geração ainda.</p>
                      <p className="text-xs mt-1">Os logs aparecerão após a próxima execução automática.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {blogLogs.map((log) => {
                      const articles = (log.error_details as any)?.articles || [];
                      const isSuccess = log.error_message.startsWith("✅");
                      return (
                        <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg border ${isSuccess ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"}`}>
                          <div className="flex items-center gap-2">
                            {isSuccess ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
                            <span className="text-sm font-medium text-foreground">{log.error_message}</span>
                            {articles.length > 0 && (
                              <span className="text-xs text-muted-foreground">({articles.map((a: any) => a.title).join(", ")})</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* All Articles */}
            <div className="rounded-xl border border-border bg-card p-5 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Todos os Artigos ({blogPosts.length})
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={generatingBlog}
                  onClick={async () => {
                    setGeneratingBlog(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-blog-posts", { body: { count: 1 } });
                      if (error) throw error;
                      toast({ title: "Artigo gerado!", description: `${data?.articles_created || 0} artigo(s) criado(s)` });
                      fetchBlogPosts();
                      fetchAdminData();
                    } catch (e: any) {
                      toast({ title: "Erro", description: e.message, variant: "destructive" });
                    }
                    setGeneratingBlog(false);
                  }}
                >
                  {generatingBlog ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Gerar Artigo Agora
                </Button>
              </div>

              {blogPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum artigo publicado ainda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{post.category}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {post.read_time}
                          </span>
                        </div>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                          {post.title}
                        </a>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="text-xs text-muted-foreground">{new Date(post.published_at).toLocaleDateString("pt-BR")}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(post.published_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* API CREDITS */}
          <TabsContent value="api-credits" className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" /> Créditos das APIs de Busca
              </h2>
              <Button variant="outline" size="sm" onClick={fetchApiCredits} disabled={loadingCredits} className="ml-auto gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${loadingCredits ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>

            {apiCredits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">
                {loadingCredits ? "Consultando APIs..." : "Clique em Atualizar para consultar os créditos."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {apiCredits.map((api: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-border bg-card p-4 card-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{api.name}</h3>
                      {api.error ? (
                        <Badge variant="destructive" className="text-[10px]">Erro</Badge>
                      ) : api.status === "expired" ? (
                        <Badge variant="destructive" className="text-[10px]">Expirada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">Ativa</Badge>
                      )}
                    </div>

                    {api.error ? (
                      <p className="text-xs text-destructive">{api.error}</p>
                    ) : api.type === "serper" ? (
                      <div className="space-y-2">
                        {api.remaining_credits != null ? (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Créditos restantes</span>
                              <span className={`font-bold ${api.remaining_credits < 500 ? "text-destructive" : api.remaining_credits < 2000 ? "text-yellow-500" : "text-emerald-500"}`}>
                                {api.remaining_credits.toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${api.remaining_credits < 500 ? "bg-destructive" : api.remaining_credits < 2000 ? "bg-yellow-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(100, (api.remaining_credits / 10000) * 100)}%` }}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">{api.note || "Chave ativa. Verifique créditos em serper.dev/dashboard"}</p>
                        )}
                        {api.credit_headers && Object.keys(api.credit_headers).length > 0 && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] text-muted-foreground">
                            <p className="font-semibold mb-1">Headers encontrados:</p>
                            {Object.entries(api.credit_headers).map(([k, v]) => (
                              <p key={k}>{k}: <span className="text-foreground font-mono">{String(v)}</span></p>
                            ))}
                          </div>
                        )}
                        {api.raw_account && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] text-muted-foreground">
                            <p className="font-semibold mb-1">Dados da conta:</p>
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(api.raw_account, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Plano</span>
                          <span className="font-medium text-foreground">{api.plan}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Restantes</span>
                          <span className={`font-bold ${api.total_left < 100 ? "text-destructive" : api.total_left < 500 ? "text-yellow-500" : "text-emerald-500"}`}>
                            {api.total_left?.toLocaleString("pt-BR")} / {api.searches_per_month?.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${api.total_left < 100 ? "bg-destructive" : api.total_left < 500 ? "bg-yellow-500" : "bg-emerald-500"}`}
                            style={{ width: `${api.searches_per_month ? (api.total_left / api.searches_per_month) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Uso este mês</span>
                          <span className="text-foreground">{api.this_month_usage?.toLocaleString("pt-BR")}</span>
                        </div>
                        {api.extra_credits > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Créditos extras</span>
                            <span className="text-foreground">{api.extra_credits?.toLocaleString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* UTM GENERATOR */}
          <TabsContent value="utm" className="space-y-6">
            <UtmGenerator />
          </TabsContent>

          {/* TESTES */}
          <TabsContent value="tests" className="space-y-6">
            {/* Bulk WhatsApp to Users */}
            <div className="rounded-xl border border-primary/30 bg-card p-5 card-shadow space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Disparo em Massa — Usuários da Plataforma
              </h3>
              <p className="text-xs text-muted-foreground">
                Envia WhatsApp (via +55 11 5304-1013) e email para usuários cadastrados. Use <code className="bg-muted px-1 rounded">{"{nome}"}</code> para personalizar.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Filtrar por plano</label>
                  <Select value={bulkPlanFilter} onValueChange={setBulkPlanFilter}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="free">Free (teste)</SelectItem>
                      <SelectItem value="expirados">Expirados (teste vencido)</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="sem-licenca">Sem licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke("admin-test-send", {
                          body: { type: "bulk-whatsapp", planFilter: bulkPlanFilter, dryRun: true },
                        });
                        if (error) throw error;
                        setBulkPreview(data);
                      } catch (e: any) {
                        toast({ title: "Erro", description: e.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Pré-visualizar destinatários
                  </Button>
                </div>
              </div>

              {bulkPreview && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    📋 {bulkPreview.totalUsers} usuários encontrados com WhatsApp:
                  </p>
                  <div className="max-h-[150px] overflow-y-auto space-y-1">
                    {bulkPreview.users?.map((u: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground font-mono">
                        {u.phone} — {u.email || "sem email"} {u.name ? `(${u.name})` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Mensagem WhatsApp</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-none"
                  value={bulkMsg}
                  onChange={(e) => setBulkMsg(e.target.value)}
                  placeholder="Olá {nome}! Tudo bem?..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Assunto do Email (opcional — se preenchido, envia email também)</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  placeholder="Ex: Seu teste no LeadsPro expirou!"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Corpo do Email (opcional)</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                  value={bulkEmailBody}
                  onChange={(e) => setBulkEmailBody(e.target.value)}
                  placeholder="Olá {nome}! Seu período de teste expirou..."
                />
              </div>
              <Button
                className="w-full gradient-bg"
                disabled={sendingBulk || !bulkMsg.trim()}
                onClick={async () => {
                  if (!bulkPreview || bulkPreview.totalUsers === 0) {
                    toast({ title: "Pré-visualize antes", description: "Clique em 'Pré-visualizar' para ver os destinatários antes de enviar.", variant: "destructive" });
                    return;
                  }
                  const confirmed = window.confirm(`Confirma o envio para ${bulkPreview.totalUsers} usuários?`);
                  if (!confirmed) return;
                  setSendingBulk(true);
                  setTestResults([]);
                  try {
                    const { data, error } = await supabase.functions.invoke("admin-test-send", {
                      body: { type: "bulk-whatsapp", message: bulkMsg, planFilter: bulkPlanFilter, subject: bulkEmailSubject, body: bulkEmailBody },
                    });
                    if (error) throw error;
                    setTestResults(data.results || []);
                    toast({ title: `📱 WhatsApp: ${data.sent} enviados | ✉️ Emails: ${data.emailsSent || 0} | ❌ Erros: ${data.errors}` });
                  } catch (e: any) {
                    toast({ title: "Erro", description: e.message, variant: "destructive" });
                  }
                  setSendingBulk(false);
                }}
              >
                {sendingBulk ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                {sendingBulk ? "Enviando..." : `Disparar para ${bulkPreview?.totalUsers || "?"} usuários`}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WhatsApp Test */}
              <div className="rounded-xl border border-border bg-card p-5 card-shadow space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Teste WhatsApp em Massa
                </h3>
                <p className="text-xs text-muted-foreground">
                  Envia para: <strong>+55 27 99813-3374</strong> e <strong>+55 27 99501-7187</strong>
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Mensagem</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
                    value={testWhatsAppMsg}
                    onChange={(e) => setTestWhatsAppMsg(e.target.value)}
                    placeholder="Digite a mensagem de teste..."
                  />
                </div>
                <Button
                  className="w-full gradient-bg"
                  disabled={sendingWhatsApp || !testWhatsAppMsg.trim()}
                  onClick={async () => {
                    setSendingWhatsApp(true);
                    setTestResults([]);
                    try {
                      const { data, error } = await supabase.functions.invoke("admin-test-send", {
                        body: { type: "whatsapp", message: testWhatsAppMsg },
                      });
                      if (error) throw error;
                      setTestResults(data.results || []);
                      toast({
                        title: `📱 WhatsApp: ${data.sent} enviados, ${data.errors} erros`,
                      });
                    } catch (e: any) {
                      toast({ title: "Erro", description: e.message, variant: "destructive" });
                    }
                    setSendingWhatsApp(false);
                  }}
                >
                  {sendingWhatsApp ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Disparar Teste WhatsApp
                </Button>
              </div>

              {/* Email Test */}
              <div className="rounded-xl border border-border bg-card p-5 card-shadow space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Teste Email em Massa
                </h3>
                <p className="text-xs text-muted-foreground">
                  Envia para: <strong>lucassilvasimoes23@gmail.com</strong>, <strong>appmarquei@gmail.com</strong>, <strong>l.florianom@hotmail.com</strong>
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Assunto</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    placeholder="Assunto do email de teste"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Corpo do email</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
                    value={testEmailBody}
                    onChange={(e) => setTestEmailBody(e.target.value)}
                    placeholder="Corpo do email de teste..."
                  />
                </div>
                <Button
                  className="w-full gradient-bg"
                  disabled={sendingEmail || !testEmailSubject.trim() || !testEmailBody.trim()}
                  onClick={async () => {
                    setSendingEmail(true);
                    setTestResults([]);
                    try {
                      const { data, error } = await supabase.functions.invoke("admin-test-send", {
                        body: { type: "email", subject: testEmailSubject, body: testEmailBody },
                      });
                      if (error) throw error;
                      setTestResults(data.results || []);
                      toast({
                        title: `✉️ Email: ${data.sent} enviados, ${data.errors} erros`,
                      });
                    } catch (e: any) {
                      toast({ title: "Erro", description: e.message, variant: "destructive" });
                    }
                    setSendingEmail(false);
                  }}
                >
                  {sendingEmail ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Disparar Teste Email
                </Button>
              </div>
            </div>

            {/* Results */}
            {testResults.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 card-shadow">
                <h3 className="text-sm font-semibold text-foreground mb-3">Resultado do teste</h3>
                <div className="space-y-1">
                  {testResults.map((r, i) => (
                    <p key={i} className="text-xs font-mono text-foreground">{r}</p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
