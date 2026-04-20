import {
  Bot,
  User,
  CheckCircle2,
  Circle,
  TrendingUp,
  Users,
  MessageCircle,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Paperclip,
  Smile,
  FileSpreadsheet,
  Upload,
  Smartphone,
  Headphones,
  Code2,
  ArrowRight,
  Star,
  Zap,
  Filter,
  BarChart3,
  DollarSign,
  Target,
} from "lucide-react";

type Variant =
  | "dashboard-stats"
  | "crm-table"
  | "lists-grid"
  | "lists-detail"
  | "pipeline-kanban"
  | "chat-whatsapp"
  | "chatbot-conversation"
  | "chatbot-handoff"
  | "group-create"
  | "email-composer"
  | "followup-sequence"
  | "qr-code"
  | "upload-csv"
  | "widget-preview"
  | "stats-chart"
  | "inbox-multi"
  | "search-leads"
  | "mass-send";

export function FeaturePreview({ variant }: { variant: Variant }) {
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl bg-gradient-to-br from-primary/5 via-background to-accent/5 p-3 sm:p-5">
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
        {renderVariant(variant)}
      </div>
    </div>
  );
}

function renderVariant(variant: Variant) {
  switch (variant) {
    case "dashboard-stats":
      return <DashboardStats />;
    case "crm-table":
      return <CrmTable />;
    case "lists-grid":
      return <ListsGrid />;
    case "lists-detail":
      return <ListsDetail />;
    case "pipeline-kanban":
      return <PipelineKanban />;
    case "chat-whatsapp":
      return <ChatWhatsapp />;
    case "chatbot-conversation":
      return <ChatbotConversation />;
    case "chatbot-handoff":
      return <ChatbotHandoff />;
    case "group-create":
      return <GroupCreate />;
    case "email-composer":
      return <EmailComposer />;
    case "followup-sequence":
      return <FollowupSequence />;
    case "qr-code":
      return <QrCode />;
    case "upload-csv":
      return <UploadCsv />;
    case "widget-preview":
      return <WidgetPreview />;
    case "stats-chart":
      return <StatsChart />;
    case "inbox-multi":
      return <InboxMulti />;
    case "search-leads":
      return <SearchLeads />;
    case "mass-send":
      return <MassSend />;
    default:
      return null;
  }
}

/* ---------------- SEARCH LEADS ---------------- */
function SearchLeads() {
  const results = [
    { name: "Padaria Pão Dourado", cat: "Padaria", city: "São Paulo, SP", phone: "(11) 98765-4321", verified: true },
    { name: "Panificadora Vovó Maria", cat: "Padaria", city: "São Paulo, SP", phone: "(11) 97654-3210", verified: true },
    { name: "Doce Fornada", cat: "Confeitaria", city: "Guarulhos, SP", phone: "(11) 96543-2109", verified: false },
    { name: "Pão & Cia", cat: "Padaria", city: "Osasco, SP", phone: "(11) 95432-1098", verified: true },
  ];
  return (
    <div className="p-4 sm:p-6">
      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
          <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">Categoria (CNAE)</div>
          <div className="flex items-center gap-1.5">
            <Search className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Padaria</span>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
          <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">Localização</div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">São Paulo, SP</span>
          </div>
        </div>
        <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold">
          <Search className="h-3.5 w-3.5" />
          Buscar leads
        </div>
      </div>
      {/* Meta */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">847</span> resultados em <span className="text-emerald-500 font-medium">2.1s</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-primary">
          <Filter className="h-3 w-3" />
          Filtros
        </div>
      </div>
      {/* Results */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {results.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border/50" : ""}`}
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
              {r.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="text-xs font-semibold truncate">{r.name}</div>
                {r.verified && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{r.cat}</span>
                <span>•</span>
                <span className="truncate">{r.city}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Phone className="h-3 w-3" />
              {r.phone}
            </div>
            <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MASS SEND ---------------- */
function MassSend() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {/* Composer */}
        <div className="sm:col-span-3 rounded-lg border border-border/50 bg-background/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">Mensagem</div>
            <div className="text-[9px] text-muted-foreground">147 / 1024</div>
          </div>
          <div className="text-[11px] leading-relaxed space-y-1">
            <div>Olá <span className="px-1 rounded bg-primary/15 text-primary font-medium">{"{{nome}}"}</span>! 👋</div>
            <div>Vi que a <span className="px-1 rounded bg-primary/15 text-primary font-medium">{"{{empresa}}"}</span> é referência em padaria aqui em <span className="px-1 rounded bg-primary/15 text-primary font-medium">{"{{cidade}}"}</span>.</div>
            <div className="h-2 bg-muted/40 rounded w-full" />
            <div className="h-2 bg-muted/40 rounded w-4/5" />
          </div>
          <div className="mt-3 flex items-center gap-1 text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            <Smile className="h-3.5 w-3.5" />
            <div className="flex-1" />
            <div className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
              <Zap className="h-3 w-3" />
              3 variações
            </div>
          </div>
        </div>
        {/* Settings */}
        <div className="sm:col-span-2 space-y-2">
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="text-[9px] font-semibold uppercase text-muted-foreground mb-1">Lista</div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Padarias SP</span>
              <span className="ml-auto text-[10px] text-muted-foreground">847</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
            <div className="text-[9px] font-semibold uppercase text-muted-foreground mb-1">Intervalo aleatório</div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">30s – 90s</span>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">Anti-ban ativo</span>
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">Comportamento humanizado</div>
          </div>
        </div>
      </div>
      {/* Progress */}
      <div className="mt-3 rounded-lg border border-border/50 bg-background/50 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold">Enviando campanha</div>
          <div className="text-[10px] text-muted-foreground">312 / 847</div>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500" style={{ width: "37%" }} />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-bold">312</div>
            <div className="text-[9px] text-muted-foreground">Enviadas</div>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-500">287</div>
            <div className="text-[9px] text-muted-foreground">Entregues</div>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-500">142</div>
            <div className="text-[9px] text-muted-foreground">Lidas</div>
          </div>
          <div>
            <div className="text-sm font-bold text-primary">38</div>
            <div className="text-[9px] text-muted-foreground">Responderam</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD STATS ---------------- */
function DashboardStats() {
  const stats = [
    { label: "Leads captados", value: "2.847", delta: "+12%", icon: Users, color: "text-primary" },
    { label: "Mensagens enviadas", value: "18.320", delta: "+24%", icon: MessageCircle, color: "text-emerald-500" },
    { label: "Taxa de resposta", value: "34%", delta: "+5%", icon: TrendingUp, color: "text-blue-500" },
    { label: "Conversões", value: "412", delta: "+18%", icon: Target, color: "text-amber-500" },
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground">Visão geral</div>
          <div className="text-sm font-semibold font-display">Últimos 30 dias</div>
        </div>
        <div className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-muted">Ao vivo</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} strokeWidth={2} />
              <span className="text-[10px] font-medium text-emerald-500">{s.delta}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-display">{s.value}</div>
            <div className="text-[10px] text-muted-foreground truncate">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-border/50 bg-background/50 p-4">
        <div className="flex items-end gap-1 h-20">
          {[40, 55, 35, 70, 60, 85, 50, 75, 90, 65, 80, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-primary/80 to-primary/40"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- CRM TABLE ---------------- */
function CrmTable() {
  const rows = [
    { name: "Padaria Pão Dourado", phone: "(11) 98765-4321", status: "Qualificado", city: "São Paulo", color: "bg-emerald-500/10 text-emerald-600" },
    { name: "Clínica Vida Saudável", phone: "(21) 97654-3210", status: "Contatado", city: "Rio de Janeiro", color: "bg-blue-500/10 text-blue-600" },
    { name: "Auto Peças Rodas", phone: "(31) 96543-2109", status: "Novo", city: "Belo Horizonte", color: "bg-primary/10 text-primary" },
    { name: "Estética Bella", phone: "(41) 95432-1098", status: "Qualificado", city: "Curitiba", color: "bg-emerald-500/10 text-emerald-600" },
    { name: "Pet Shop Amigo Fiel", phone: "(51) 94321-0987", status: "Negociando", city: "Porto Alegre", color: "bg-amber-500/10 text-amber-600" },
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 px-3 flex items-center gap-2 rounded-lg border border-border/50 bg-background/50">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Buscar leads...</span>
          </div>
          <div className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filtrar</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">2.847 leads</div>
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Empresa</div>
          <div className="col-span-3">Telefone</div>
          <div className="col-span-2">Cidade</div>
          <div className="col-span-3">Status</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-border/50 items-center text-xs">
            <div className="col-span-7 sm:col-span-4 font-medium truncate">{r.name}</div>
            <div className="hidden sm:block col-span-3 text-muted-foreground">{r.phone}</div>
            <div className="hidden sm:block col-span-2 text-muted-foreground">{r.city}</div>
            <div className="col-span-5 sm:col-span-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.color}`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- LISTS GRID ---------------- */
function ListsGrid() {
  const lists = [
    { name: "Padarias SP", count: 847, color: "from-primary/20 to-primary/5" },
    { name: "Clínicas RJ", count: 512, color: "from-blue-500/20 to-blue-500/5" },
    { name: "Pet Shops", count: 324, color: "from-emerald-500/20 to-emerald-500/5" },
    { name: "Restaurantes", count: 1204, color: "from-amber-500/20 to-amber-500/5" },
    { name: "Academias MG", count: 267, color: "from-purple-500/20 to-purple-500/5" },
    { name: "Salões BH", count: 189, color: "from-pink-500/20 to-pink-500/5" },
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold font-display">Minhas listas</div>
        <div className="text-xs text-primary font-medium">+ Nova lista</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {lists.map((l) => (
          <div key={l.name} className={`rounded-xl border border-border/50 bg-gradient-to-br ${l.color} p-3`}>
            <div className="h-8 w-8 rounded-lg bg-background/60 flex items-center justify-center mb-2">
              <Users className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <div className="text-sm font-semibold truncate">{l.name}</div>
            <div className="text-[10px] text-muted-foreground">{l.count} leads</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- LISTS DETAIL ---------------- */
function ListsDetail() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[260px]">
      <div className="border-b sm:border-b-0 sm:border-r border-border/50 p-3 space-y-1">
        {["Padarias SP", "Clínicas RJ", "Pet Shops", "Academias"].map((n, i) => (
          <div
            key={n}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
              i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="truncate">{n}</span>
            <span className="text-[10px]">{[847, 512, 324, 267][i]}</span>
          </div>
        ))}
      </div>
      <div className="sm:col-span-2 p-4">
        <div className="text-sm font-semibold font-display mb-1">Padarias SP</div>
        <div className="text-[10px] text-muted-foreground mb-4">847 leads • atualizado hoje</div>
        <div className="space-y-2">
          {["Pão Dourado", "Vovó Maria", "Doce Fornada"].map((name, i) => (
            <div key={name} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{name}</div>
                <div className="text-[10px] text-muted-foreground">(11) 9{8765 - i * 100}-4321</div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- PIPELINE KANBAN ---------------- */
function PipelineKanban() {
  const cols = [
    { title: "Novo", color: "bg-muted", count: 12, cards: ["Padaria SP", "Clínica RJ"] },
    { title: "Contatado", color: "bg-blue-500/10 text-blue-600", count: 8, cards: ["Pet Shop", "Auto Peças"] },
    { title: "Qualificado", color: "bg-primary/10 text-primary", count: 5, cards: ["Estética Bella"] },
    { title: "Fechado", color: "bg-emerald-500/10 text-emerald-600", count: 3, cards: ["Academia Fit"] },
  ];
  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2">
        {cols.map((c) => (
          <div key={c.title} className="rounded-lg bg-muted/30 p-2">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.color}`}>{c.title}</span>
              <span className="text-[10px] text-muted-foreground">{c.count}</span>
            </div>
            <div className="space-y-1.5">
              {c.cards.map((name) => (
                <div key={name} className="rounded-md bg-background border border-border/50 p-2">
                  <div className="text-[10px] font-medium truncate">{name}</div>
                  <div className="mt-1 flex items-center gap-1">
                    <div className="h-1 flex-1 rounded-full bg-primary/30" />
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                  </div>
                </div>
              ))}
              <div className="h-8 rounded-md border border-dashed border-border/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CHAT WHATSAPP ---------------- */
function ChatWhatsapp() {
  return (
    <div className="bg-[#e5ddd5] dark:bg-zinc-900 p-4 min-h-[260px]">
      <div className="max-w-md mx-auto space-y-2">
        <div className="flex justify-start">
          <div className="bg-white dark:bg-zinc-800 rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[75%]">
            <div className="text-xs">Olá João! Vi que você tem interesse em nossa solução. Posso ajudar?</div>
            <div className="text-[9px] text-muted-foreground text-right mt-1">09:42</div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-lg rounded-tr-none px-3 py-2 shadow-sm max-w-[75%]">
            <div className="text-xs">Sim! Quero saber mais sobre o plano Pro</div>
            <div className="text-[9px] text-muted-foreground text-right mt-1">09:43 ✓✓</div>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white dark:bg-zinc-800 rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[75%]">
            <div className="text-xs">Ótimo! O Pro inclui 10.000 disparos/mês + chatbot IA. R$ 197/mês.</div>
            <div className="text-[9px] text-muted-foreground text-right mt-1">09:43</div>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-lg rounded-tr-none px-3 py-2 shadow-sm max-w-[75%]">
            <div className="text-xs">Perfeito. Como faço para contratar?</div>
            <div className="text-[9px] text-muted-foreground text-right mt-1">09:44 ✓✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CHATBOT CONVERSATION ---------------- */
function ChatbotConversation() {
  return (
    <div className="p-4 space-y-2 min-h-[260px] bg-muted/20">
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-3 py-2 max-w-[70%]">
          <div className="text-xs">Olá! Sou o assistente virtual. Qual seu nome?</div>
        </div>
      </div>
      <div className="flex items-start gap-2 justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-3 py-2 max-w-[70%]">
          <div className="text-xs">Meu nome é Carla</div>
        </div>
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-3 py-2 max-w-[75%]">
          <div className="text-xs mb-2">Prazer, Carla! Qual seu interesse?</div>
          <div className="flex flex-wrap gap-1">
            {["Planos", "Suporte", "Parceria"].map((o) => (
              <span key={o} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {o}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-2 pl-9">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/* ---------------- CHATBOT HANDOFF ---------------- */
function ChatbotHandoff() {
  return (
    <div className="p-4 space-y-3 min-h-[260px]">
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="bg-muted/40 rounded-2xl rounded-tl-none px-3 py-2">
          <div className="text-xs">Entendi sua dúvida. Vou transferir para um atendente humano...</div>
        </div>
      </div>
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-2 py-1 rounded-full border border-border/50 bg-background">
          <Headphones className="h-3 w-3" />
          Transferido para Ana • Suporte
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Headphones className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-3 py-2 max-w-[75%]">
          <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">Ana • online</div>
          <div className="text-xs">Oi! Sou a Ana. Li o histórico, já te ajudo a resolver isso 😊</div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-muted/30 p-3 border border-border/50">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Contexto da IA</div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">Carla</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Interesse</span><span className="font-medium">Plano Pro</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Intenção</span><span className="font-medium text-emerald-600">Alta</span></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- GROUP CREATE ---------------- */
function GroupCreate() {
  const members = ["Ana S.", "Bruno L.", "Carlos M.", "Diana R.", "Eduardo T.", "Fernanda P.", "Gabriel O.", "+ 240"];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold font-display">Leads Qualificados • SP</div>
          <div className="text-[10px] text-muted-foreground">247 participantes • criado agora</div>
        </div>
        <div className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center">
          Criar
        </div>
      </div>
      <div className="rounded-lg border border-border/50 p-3">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Participantes</div>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <div key={m} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/60 text-[10px] font-medium">
              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                {m.charAt(0)}
              </div>
              {m}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary shrink-0" />
        <div className="text-[10px] text-muted-foreground">
          Adição automatizada com atraso aleatório entre membros para simular comportamento humano.
        </div>
      </div>
    </div>
  );
}

/* ---------------- EMAIL COMPOSER ---------------- */
function EmailComposer() {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
          <div className="text-xs font-medium">Nova campanha</div>
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
        <div className="p-3 space-y-2 text-xs">
          <div className="flex gap-2 border-b border-border/50 pb-2">
            <span className="text-muted-foreground w-16">Para:</span>
            <span className="flex-1">Lista: Padarias SP (847 contatos)</span>
          </div>
          <div className="flex gap-2 border-b border-border/50 pb-2">
            <span className="text-muted-foreground w-16">Assunto:</span>
            <span className="flex-1 font-medium">🎉 Oferta exclusiva para sua padaria</span>
          </div>
          <div className="pt-2 space-y-1.5 text-[11px] leading-relaxed">
            <div>Olá <span className="px-1 rounded bg-primary/15 text-primary font-medium">{"{{nome}}"}</span>,</div>
            <div>Preparamos uma oferta especial para a <span className="px-1 rounded bg-primary/15 text-primary font-medium">{"{{empresa}}"}</span>...</div>
            <div className="h-3 bg-muted/40 rounded w-11/12" />
            <div className="h-3 bg-muted/40 rounded w-4/5" />
            <div className="h-3 bg-muted/40 rounded w-2/3" />
            <div className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold">
              Quero saber mais →
            </div>
          </div>
        </div>
        <div className="px-3 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="flex gap-2 text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            <Smile className="h-3.5 w-3.5" />
          </div>
          <div className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold flex items-center gap-1">
            <Send className="h-3 w-3" /> Enviar
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- FOLLOWUP SEQUENCE ---------------- */
function FollowupSequence() {
  const steps = [
    { day: "Dia 0", title: "Mensagem de boas-vindas", status: "done", channel: "WhatsApp" },
    { day: "Dia 2", title: "Compartilhar case de sucesso", status: "done", channel: "WhatsApp" },
    { day: "Dia 5", title: "Enviar proposta comercial", status: "active", channel: "E-mail" },
    { day: "Dia 10", title: "Follow-up final", status: "pending", channel: "WhatsApp" },
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="text-sm font-semibold font-display mb-1">Sequência: Novo lead</div>
      <div className="text-[10px] text-muted-foreground mb-4">4 etapas • 10 dias</div>
      <div className="relative space-y-3">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
        {steps.map((s) => (
          <div key={s.day} className="relative flex items-start gap-3">
            <div
              className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                s.status === "done"
                  ? "bg-emerald-500 text-white"
                  : s.status === "active"
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.status === "done" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : s.status === "active" ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex-1 rounded-lg border border-border/50 bg-background/50 p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-primary">{s.day}</span>
                <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">{s.channel}</span>
              </div>
              <div className="text-xs font-medium">{s.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- QR CODE ---------------- */
function QrCode() {
  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative">
        <div className="h-40 w-40 rounded-xl bg-white p-3 shadow-lg">
          <div className="grid grid-cols-12 gap-[1px] h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => {
              const isCorner =
                (i < 36 && i % 12 < 3) ||
                (i < 36 && i % 12 > 8) ||
                (i >= 108 && i % 12 < 3);
              const on = isCorner || Math.random() > 0.5;
              return <div key={i} className={on ? "bg-black" : "bg-white"} />;
            })}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-white border-2 border-emerald-500 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aguardando conexão
        </div>
        <div className="text-sm font-semibold font-display mb-1">Escaneie com seu WhatsApp</div>
        <div className="text-xs text-muted-foreground mb-3">Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho</div>
        <div className="flex items-center justify-center sm:justify-start gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Multi-dispositivo</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Criptografado</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UPLOAD CSV ---------------- */
function UploadCsv() {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm font-semibold mb-0.5">Arraste seu CSV aqui</div>
        <div className="text-[10px] text-muted-foreground">ou clique para selecionar • até 50MB</div>
      </div>
      <div className="rounded-lg border border-border/50 p-3">
        <div className="flex items-center gap-3 mb-2">
          <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">leads_padarias_sp.csv</div>
            <div className="text-[10px] text-muted-foreground">847 linhas • 2.3 MB</div>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          <div className="text-center"><div className="font-bold text-sm">847</div><div className="text-muted-foreground">Total</div></div>
          <div className="text-center"><div className="font-bold text-sm text-emerald-500">823</div><div className="text-muted-foreground">Válidos</div></div>
          <div className="text-center"><div className="font-bold text-sm text-amber-500">24</div><div className="text-muted-foreground">Duplicados</div></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- WIDGET PREVIEW ---------------- */
function WidgetPreview() {
  return (
    <div className="relative min-h-[260px] bg-gradient-to-br from-muted/30 to-muted/10 p-4">
      <div className="space-y-2 max-w-md">
        <div className="h-3 w-32 rounded bg-muted-foreground/30" />
        <div className="h-5 w-56 rounded bg-muted-foreground/40" />
        <div className="h-2 w-full rounded bg-muted-foreground/20" />
        <div className="h-2 w-4/5 rounded bg-muted-foreground/20" />
        <div className="h-2 w-3/5 rounded bg-muted-foreground/20" />
      </div>
      <div className="absolute bottom-4 right-4 w-64 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/70 px-3 py-2.5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-white">Fale conosco</div>
            <div className="text-[9px] text-white/80">Responde em segundos</div>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-muted/50 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[85%]">
            <div className="text-[10px]">Olá! 👋 Como posso ajudar?</div>
          </div>
          <div className="flex gap-1.5">
            <input
              readOnly
              className="flex-1 h-7 rounded-lg border border-border/60 px-2 text-[10px] bg-background"
              placeholder="Digite sua mensagem..."
            />
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Send className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STATS CHART ---------------- */
function StatsChart() {
  const series = [20, 35, 28, 48, 42, 58, 50, 68, 62, 80, 75, 92];
  const max = Math.max(...series);
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold font-display">Desempenho</div>
          <div className="text-[10px] text-muted-foreground">Últimos 12 meses</div>
        </div>
        <div className="flex gap-1">
          {["1M", "3M", "12M"].map((p, i) => (
            <span
              key={p}
              className={`text-[10px] px-2 py-1 rounded-md ${
                i === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-40">
        <svg viewBox="0 0 300 120" className="w-full h-full">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 30, 60, 90].map((y) => (
            <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />
          ))}
          <path
            d={`M ${series.map((v, i) => `${(i * 300) / 11},${120 - (v / max) * 100}`).join(" L ")} L 300,120 L 0,120 Z`}
            fill="url(#grad)"
          />
          <path
            d={`M ${series.map((v, i) => `${(i * 300) / 11},${120 - (v / max) * 100}`).join(" L ")}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          {series.map((v, i) => (
            <circle
              key={i}
              cx={(i * 300) / 11}
              cy={120 - (v / max) * 100}
              r="2"
              fill="hsl(var(--primary))"
            />
          ))}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { label: "Taxa de conversão", value: "34%", icon: Target },
          { label: "Receita gerada", value: "R$ 48k", icon: DollarSign },
          { label: "ROI", value: "3.2x", icon: BarChart3 },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border/50 p-2">
            <m.icon className="h-3.5 w-3.5 text-primary mb-1" />
            <div className="text-sm font-bold">{m.value}</div>
            <div className="text-[9px] text-muted-foreground truncate">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- INBOX MULTI ---------------- */
function InboxMulti() {
  const convs = [
    { name: "Padaria Pão Dourado", last: "Obrigado! Vou analisar.", time: "09:42", unread: 0, channel: "wa" },
    { name: "Clínica Vida", last: "Pode me ligar?", time: "09:38", unread: 2, channel: "wa" },
    { name: "Pet Shop Fiel", last: "Qual o valor?", time: "09:15", unread: 1, channel: "email" },
    { name: "Estética Bella", last: "Quero fechar!", time: "Ontem", unread: 0, channel: "wa" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 min-h-[280px]">
      <div className="sm:col-span-2 border-b sm:border-b-0 sm:border-r border-border/50">
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <div className="h-7 flex-1 rounded-lg border border-border/50 px-2 flex items-center gap-2">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Buscar</span>
          </div>
        </div>
        {convs.map((c, i) => (
          <div
            key={c.name}
            className={`p-3 border-b border-border/50 flex items-start gap-2 ${i === 1 ? "bg-primary/5" : ""}`}
          >
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="text-[11px] font-semibold truncate">{c.name}</div>
                <div className="text-[9px] text-muted-foreground shrink-0">{c.time}</div>
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="text-[10px] text-muted-foreground truncate">{c.last}</div>
                {c.unread > 0 && (
                  <div className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
                    {c.unread}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sm:col-span-3 flex flex-col">
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
            C
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold">Clínica Vida</div>
            <div className="text-[9px] text-emerald-500">online</div>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 bg-muted/20">
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[80%]">
              <div className="text-[10px]">Olá! Temos interesse no plano Pro.</div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-2.5 py-1.5 max-w-[80%]">
              <div className="text-[10px]">Perfeito! Agendo uma demo?</div>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 rounded-lg rounded-tl-none px-2.5 py-1.5 max-w-[80%]">
              <div className="text-[10px]">Pode me ligar?</div>
            </div>
          </div>
        </div>
        <div className="p-2 border-t border-border/50 flex items-center gap-1.5">
          <div className="flex-1 h-7 rounded-lg border border-border/50 px-2 flex items-center text-[10px] text-muted-foreground">
            Digite uma mensagem...
          </div>
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <Send className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
