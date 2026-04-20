import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useUserData, Lead } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users, Search, Download, RefreshCw, Pencil, Check, X, Filter, Trash2,
  ChevronLeft, ChevronRight, Copy, FileSpreadsheet, FileText, MessageCircle,
  Mail, Globe, Instagram, Linkedin, Phone, StickyNote, Kanban, ArrowRight,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { PageTutorial } from "@/components/PageTutorial";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { LeadStatusBadge, LeadStatus } from "@/components/LeadStatusBadge";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import * as XLSX from "xlsx";

const UserLeads = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { license, leads, setLeads, fetchLeads } = useUserData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 20;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("busca");
  const [scoring, setScoring] = useState(false);

  const buscaLeads = leads.filter((l) => !l.is_duplicate && l.category !== "Widget");
  const widgetLeads = leads.filter((l) => !l.is_duplicate && l.category === "Widget");
  const duplicateLeads = leads.filter((l) => l.is_duplicate);
  const currentLeads = activeTab === "busca" ? buscaLeads : activeTab === "widget" ? widgetLeads : duplicateLeads;

  const categories = Array.from(new Set(currentLeads.map((l) => l.category).filter(Boolean))) as string[];

  const filteredLeads = currentLeads.filter((lead) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (lead.name?.toLowerCase().includes(q) ?? false) ||
      (lead.instagram?.toLowerCase().includes(q) ?? false) ||
      (lead.phone?.toLowerCase().includes(q) ?? false) ||
      (lead.category?.toLowerCase().includes(q) ?? false);
    const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const hasValue = (v: string | null | undefined) => !!v && v.trim() !== "" && v.toLowerCase() !== "não encontrado";
  const getFieldCount = (lead: Lead) =>
    [lead.phone, lead.email, lead.instagram, lead.website, lead.linkedin].filter(hasValue).length;

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const diff = getFieldCount(b) - getFieldCount(a);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalPages = Math.ceil(sortedLeads.length / leadsPerPage);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, categoryFilter, activeTab]);

  const handleRefresh = async () => {
    if (!license?.id) return;
    setRefreshing(true);
    await fetchLeads(license.id);
    toast({ title: "Atualizado!" });
    setRefreshing(false);
  };

  const changeLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    } else {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, lead_status: newStatus } : l));
    }
  };

  const startEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditForm({ name: lead.name, email: lead.email, instagram: lead.instagram, phone: lead.phone, category: lead.category, website: lead.website, linkedin: lead.linkedin });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("leads")
      .update({
        name: editForm.name?.trim() || null,
        email: editForm.email?.trim() || null,
        instagram: editForm.instagram?.trim() || null,
        phone: editForm.phone?.trim() || null,
        category: editForm.category?.trim() || null,
        website: editForm.website?.trim() || null,
        linkedin: editForm.linkedin?.trim() || null,
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...editForm } : l));
      toast({ title: "Lead atualizado!" });
    }
    setEditingId(null);
    setEditForm({});
  };

  const deleteAllLeads = async () => {
    if (!license?.id) return;
    if (!window.confirm("Tem certeza que deseja excluir TODOS os leads?")) return;
    const { error } = await supabase.from("leads").delete().eq("license_id", license.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setLeads([]);
      toast({ title: "Todos os leads foram excluídos!" });
    }
  };

  const scoreLeads = async () => {
    // Classifica TODOS os leads sem score — de TODAS as abas (busca, widget, duplicados).
    // Roda em lotes de 50 automaticamente até terminar.
    const allUnscored = leads.filter((l) => l.lead_score === null);
    if (allUnscored.length === 0) {
      toast({ title: "Todos os leads já têm score!" });
      return;
    }

    setScoring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const BATCH_SIZE = 50;
      const totalBatches = Math.ceil(allUnscored.length / BATCH_SIZE);
      let totalClassified = 0;
      const scoreMap = new Map<string, number>();

      for (let i = 0; i < totalBatches; i++) {
        const batch = allUnscored
          .slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
          .map((l) => l.id);

        if (totalBatches > 1) {
          toast({
            title: `Classificando leads com IA...`,
            description: `Lote ${i + 1} de ${totalBatches} (${batch.length} leads)`,
          });
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-leads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ lead_ids: batch }),
          }
        );
        const result = await response.json();

        if (result.success && result.scores) {
          for (const s of result.scores) scoreMap.set(s.id, s.score as number);
          totalClassified += result.scores.length;
        } else if (result.ai_unavailable) {
          toast({
            title: "IA indisponível",
            description: result.error || "Tente novamente mais tarde.",
            variant: "destructive",
          });
          break;
        } else {
          // soft-fail on a single batch — continue with the next one
          console.error("Batch error:", result.error);
        }
      }

      if (scoreMap.size > 0) {
        const now = new Date().toISOString();
        setLeads((prev) =>
          prev.map((l) =>
            scoreMap.has(l.id)
              ? { ...l, lead_score: scoreMap.get(l.id) ?? null, scored_at: now }
              : l
          )
        );
      }

      toast({
        title: `✨ ${totalClassified} leads classificados com IA!`,
        description:
          totalClassified < allUnscored.length
            ? `${allUnscored.length - totalClassified} não puderam ser classificados. Tente novamente.`
            : "Todos os leads pendentes foram classificados.",
      });
    } catch (error) {
      console.error("Score error:", error);
      toast({ title: "Erro ao classificar leads", variant: "destructive" });
    } finally {
      setScoring(false);
    }
  };

  const getExportData = () =>
    filteredLeads.map((l) => ({
      Categoria: l.category || "",
      Nome: l.name || "",
      Telefone: l.phone || "",
      Email: l.email || "",
      Instagram: l.instagram || "",
      Site: l.website || "",
      LinkedIn: l.linkedin || "",
      Status: l.lead_status || "novo",
      Score: l.lead_score ?? "",
      Data: new Date(l.created_at).toLocaleDateString("pt-BR"),
    }));

  const exportCSV = () => {
    const header = "Categoria,Nome,Telefone,Email,Instagram,Site,LinkedIn,Status,Score,Data\n";
    const rows = filteredLeads
      .map((l) => `"${l.category || ""}","${l.name || ""}","${l.phone || ""}","${l.email || ""}","${l.instagram || ""}","${l.website || ""}","${l.linkedin || ""}","${l.lead_status || "novo"}","${l.lead_score ?? ""}","${new Date(l.created_at).toLocaleDateString("pt-BR")}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((r) => String((r as any)[key] || "").length)).valueOf() + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "leads.xlsx");
  };

  return (
    <div className="space-y-6">
      <PageTutorial
        title="CRM — Banco de Contatos"
        description="Base única de todos os seus leads: visualize, edite, importe, exporte e classifique com IA."
        steps={[
          { emoji: "🔍", text: "Busque leads por nome, telefone, Instagram ou categoria." },
          { emoji: "🏷️", text: "Filtre por categoria e alterne entre Busca, Widget e Duplicatas." },
          { emoji: "✏️", text: "Clique no ícone de lápis para editar qualquer campo do lead." },
          { emoji: "⬆️", text: "Use 'Importar' para subir leads em massa via planilha Excel/CSV." },
          { emoji: "✨", text: "Clique em 'Score IA' para classificar automaticamente os leads por probabilidade de conversão." },
          { emoji: "📥", text: "Exporte seus leads em CSV ou Excel a qualquer momento." },
          { emoji: "➡️", text: "Para gerenciar estágios de venda (funil), acesse a página Pipeline no menu." },
        ]}
      />

      {/* Cross-link to Pipeline — makes the two pages complementary, not redundant */}
      <button
        onClick={() => navigate("/user-dashboard/kanban")}
        className="w-full rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Kanban className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Quer trabalhar o funil de vendas?</p>
            <p className="text-xs text-muted-foreground truncate">
              O <strong>Pipeline</strong> mostra os leads em colunas por estágio, com métricas de conversão e alertas de leads parados.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
      </button>
    <div className="rounded-xl border border-border bg-card p-6 card-shadow">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Seus Leads
          </h2>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Atualizar" className="shrink-0">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            {license?.id && (
              <BulkImportDialog licenseId={license.id} onImportComplete={() => fetchLeads(license.id)} />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={filteredLeads.length === 0} className="min-w-0">
                  <Download className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" /> Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportXLS} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" /> Exportar XLS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={scoreLeads}
              disabled={scoring || currentLeads.length === 0}
              className="min-w-0 gap-1.5"
            >
              {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="hidden sm:inline">{scoring ? "Classificando..." : "Score IA"}</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteAllLeads} disabled={leads.length === 0} className="min-w-0">
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Excluir Tudo</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto overflow-x-auto no-scrollbar">
            <TabsTrigger value="busca" className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Busca ({buscaLeads.length})
            </TabsTrigger>
            <TabsTrigger value="widget" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Widget ({widgetLeads.length})
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Duplicatas ({duplicateLeads.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Filtrar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="Widget">🌐 Widget</SelectItem>
                {categories.filter((cat) => cat !== "Widget").map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      <>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || categoryFilter !== "all"
                ? "Nenhum lead encontrado."
                : activeTab === "duplicates"
                  ? "Nenhuma duplicata encontrada."
                  : activeTab === "widget"
                    ? "Nenhum lead do widget ainda. Instale o widget no seu site!"
                    : "Nenhum lead capturado ainda. Use a extensão para começar!"}
            </div>
          ) : isMobile ? (
            <>
              <div className="space-y-3">
                {paginatedLeads.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate flex-1">
                        {lead.name ? lead.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : "—"}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {lead.phone && lead.phone.trim() !== "" && lead.phone !== "Não encontrado" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => window.open(`https://wa.me/${lead.phone!.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.name || ""}! `.trim())}`, "_blank")}
                              title="Abrir WhatsApp">
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => navigate(`/user-dashboard/inbox?phone=${encodeURIComponent(lead.phone!)}&name=${encodeURIComponent(lead.name || "")}`)}>
                              <MessageCircle className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </>
                        )}
                        {lead.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-[250px]">
                                <p className="text-xs whitespace-pre-wrap">{lead.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(lead)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeadStatusBadge status={lead.lead_status || "novo"} onChangeStatus={(s) => changeLeadStatus(lead.id, s)} />
                      {lead.category && <Badge variant="outline" className="text-[10px]">{lead.category}</Badge>}
                      <LeadScoreBadge score={lead.lead_score} compact />
                    </div>
                    {lead.phone && lead.phone !== "Não encontrado" && (
                      <a href={`tel:${lead.phone}`} className="text-primary text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" />{lead.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {lead.email && lead.email !== "Não encontrado" && (
                        <a href={`mailto:${lead.email}`} className="text-primary"><Mail className="h-4 w-4" /></a>
                      )}
                      {lead.instagram && lead.instagram !== "Não encontrado" && (
                        <a href={lead.instagram.startsWith("http") ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {lead.linkedin && lead.linkedin !== "Não encontrado" && (
                        <a href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://linkedin.com/in/${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {lead.website && lead.website !== "Não encontrado" && (
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <p className="text-xs text-muted-foreground">
                    {(currentPage - 1) * leadsPerPage + 1}–{Math.min(currentPage * leadsPerPage, sortedLeads.length)} de {sortedLeads.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{currentPage}/{totalPages}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Categoria</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Nome</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Telefone</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Email</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Instagram</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Site</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">LinkedIn</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Data</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Score</TableHead>
                    <TableHead className="px-2 py-3 w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead, idx) => (
                    <TableRow key={lead.id} className={`group hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                      {editingId === lead.id ? (
                        <>
                          <TableCell className="px-4 py-2.5">
                            <LeadStatusBadge status={lead.lead_status || "novo"} onChangeStatus={(s) => changeLeadStatus(lead.id, s)} />
                          </TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.instagram || ""} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5"><Input value={editForm.linkedin || ""} onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })} className="h-8 text-sm" /></TableCell>
                          <TableCell className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="px-4 py-2.5 text-center"><LeadScoreBadge score={lead.lead_score} /></TableCell>
                          <TableCell className="px-2 py-2.5">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(lead.id)}><Check className="h-4 w-4 text-primary" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}><X className="h-4 w-4 text-muted-foreground" /></Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="px-4 py-3">
                            <LeadStatusBadge status={lead.lead_status || "novo"} onChangeStatus={(s) => changeLeadStatus(lead.id, s)} />
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {lead.category ? <Badge variant="outline" className="text-[10px] font-medium">{lead.category}</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-medium text-sm max-w-[200px] truncate" title={lead.name || ""}>
                            {lead.name ? lead.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">{lead.phone || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="px-4 py-3 max-w-[180px] truncate" title={lead.email || ""}>
                            {lead.email && lead.email !== "Não encontrado" ? (
                              <a href={`mailto:${lead.email}`} className="text-primary hover:underline text-sm">{lead.email}</a>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 max-w-[130px] truncate" title={lead.instagram || ""}>
                            {lead.instagram && lead.instagram !== "Não encontrado" ? (
                              <a href={lead.instagram.startsWith("http") ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                {lead.instagram.startsWith("http") ? lead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@") : lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}
                              </a>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {lead.website && lead.website !== "Não encontrado" ? (
                              <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium">acessa aqui</a>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {lead.linkedin && lead.linkedin !== "Não encontrado" ? (
                              <a href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://linkedin.com/in/${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium">acessa aqui</a>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="px-4 py-3 text-center"><LeadScoreBadge score={lead.lead_score} /></TableCell>
                          <TableCell className="px-2 py-3">
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {lead.phone && lead.phone.trim() !== "" && lead.phone !== "Não encontrado" && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => window.open(`https://wa.me/${lead.phone!.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.name || ""}! `.trim())}`, "_blank")}
                                    title="Abrir WhatsApp">
                                    <WhatsAppIcon className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => navigate(`/user-dashboard/inbox?phone=${encodeURIComponent(lead.phone!)}&name=${encodeURIComponent(lead.name || "")}`)}
                                    title="Conversar na Inbox">
                                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                </>
                              )}
                              {lead.notes && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver mensagem">
                                        <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[300px]">
                                      <p className="text-xs whitespace-pre-wrap">{lead.notes}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(lead)} title="Editar">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(currentPage - 1) * leadsPerPage + 1}–{Math.min(currentPage * leadsPerPage, sortedLeads.length)} de {sortedLeads.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-muted-foreground px-1">…</span>}
                          <Button variant={p === currentPage ? "default" : "ghost"} size="icon" className={`h-8 w-8 text-xs ${p === currentPage ? "gradient-bg text-primary-foreground" : ""}`} onClick={() => setCurrentPage(p)}>
                            {p}
                          </Button>
                        </span>
                      ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
    </div>
    </div>
  );
};

export default UserLeads;
