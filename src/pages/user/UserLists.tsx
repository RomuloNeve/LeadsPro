import { useState, useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  FolderOpen, Trash2, ChevronLeft, Phone, Instagram, Linkedin, Globe, Loader2, Users, Plus, Pencil, Check, X, Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PageTutorial } from "@/components/PageTutorial";

const COLORS = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#06B6D4", "#F97316", "#14B8A6", "#A855F7",
  "#E11D48", "#84CC16", "#0EA5E9", "#D946EF", "#FB923C",
];

interface LeadList {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface ListLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  linkedin: string | null;
  category: string | null;
}

const UserLists = () => {
  const { license } = useUserData();
  const { toast } = useToast();
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<LeadList | null>(null);
  const [leads, setLeads] = useState<ListLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (license?.id) fetchLists();
  }, [license?.id]);

  const fetchLists = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lead_lists")
      .select("*")
      .eq("license_id", license!.id)
      .order("created_at", { ascending: false });
    
    const listsData = (data as LeadList[]) || [];
    setLists(listsData);

    // One round trip instead of N: fetch all list items for these lists,
    // then count client-side. For a user with 50 lists this drops from
    // 50 round trips to 1.
    const countsMap: Record<string, number> = {};
    if (listsData.length > 0) {
      const listIds = listsData.map((l) => l.id);
      const { data: itemsData } = await supabase
        .from("lead_list_items")
        .select("list_id")
        .in("list_id", listIds);
      for (const id of listIds) countsMap[id] = 0;
      for (const row of (itemsData || []) as { list_id: string }[]) {
        countsMap[row.list_id] = (countsMap[row.list_id] || 0) + 1;
      }
    }
    setCounts(countsMap);
    setLoading(false);
  };

  const openList = async (list: LeadList) => {
    setSelectedList(list);
    setLoadingLeads(true);
    const { data } = await supabase
      .from("lead_list_items")
      .select("lead_id, leads(id, name, email, phone, instagram, website, linkedin, category)")
      .eq("list_id", list.id);

    const items = (data || []).map((item: any) => item.leads).filter(Boolean);
    setLeads(items as ListLead[]);
    setLoadingLeads(false);
  };

  const handleCreateList = async () => {
    if (!newName.trim() || !license?.id) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("lead_lists")
      .insert({ name: newName.trim(), color: newColor, license_id: license.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Erro ao criar lista", variant: "destructive" });
    } else {
      setLists((prev) => [data as LeadList, ...prev]);
      setCounts((prev) => ({ ...prev, [(data as LeadList).id]: 0 }));
      setNewName("");
      toast({ title: `Lista "${newName.trim()}" criada!` });
    }
    setCreating(false);
  };

  const deleteList = async (listId: string) => {
    const { error } = await supabase.from("lead_lists").delete().eq("id", listId);
    if (error) {
      toast({ title: "Erro ao excluir lista", variant: "destructive" });
    } else {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      toast({ title: "Lista excluída!" });
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!editingName.trim()) return;
    const { error } = await supabase
      .from("lead_lists")
      .update({ name: editingName.trim() })
      .eq("id", listId);
    if (error) {
      toast({ title: "Erro ao renomear", variant: "destructive" });
    } else {
      setLists((prev) => prev.map((l) => l.id === listId ? { ...l, name: editingName.trim() } : l));
      toast({ title: "Lista renomeada!" });
    }
    setEditingId(null);
  };

  const removeFromList = async (leadId: string) => {
    if (!selectedList) return;
    await supabase.from("lead_list_items").delete()
      .eq("list_id", selectedList.id).eq("lead_id", leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast({ title: "Lead removido da lista" });
  };

  const renderLink = (url: string | null, icon: React.ReactNode) => {
    if (!url || url === "Não encontrado") return <span className="text-muted-foreground">✖️</span>;
    return (
      <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 transition-colors">
        {icon}
      </a>
    );
  };

  const exportListToExcel = () => {
    if (!selectedList || leads.length === 0) return;
    const rows = leads.map((lead) => ({
      Nome: lead.name || "",
      Email: lead.email || "",
      Telefone: lead.phone || "",
      Instagram: lead.instagram || "",
      LinkedIn: lead.linkedin || "",
      Website: lead.website || "",
      Categoria: lead.category || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `${selectedList.name}.xlsx`);
    toast({ title: `${leads.length} leads exportados!` });
  };

  // Detail view
  if (selectedList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setSelectedList(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedList.color }} />
          <h1 className="text-2xl font-bold font-display text-foreground">{selectedList.name}</h1>
          <Badge variant="secondary">{leads.length} leads</Badge>
          {leads.length > 0 && (
            <Button size="sm" variant="outline" onClick={exportListToExcel} className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          )}
        </div>

        {loadingLeads ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 card-shadow text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum lead nesta lista ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-center">Instagram</TableHead>
                    <TableHead className="text-center">LinkedIn</TableHead>
                    <TableHead className="text-center">Site</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{lead.category || "—"}</Badge></TableCell>
                      <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </a>
                        ) : <span className="text-muted-foreground">✖️</span>}
                      </TableCell>
                      <TableCell className="text-center">{renderLink(lead.instagram, <Instagram className="h-4 w-4 mx-auto" />)}</TableCell>
                      <TableCell className="text-center">{renderLink(lead.linkedin, <Linkedin className="h-4 w-4 mx-auto" />)}</TableCell>
                      <TableCell className="text-center">{renderLink(lead.website, <Globe className="h-4 w-4 mx-auto" />)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromList(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lists overview
  return (
    <div className="space-y-6">
      <PageTutorial
        title="Listas"
        description="Organize seus leads em listas personalizadas para segmentar seus disparos."
        steps={[
          { emoji: "1️⃣", text: "Busque leads na aba 'Buscar Leads' e salve no CRM." },
          { emoji: "2️⃣", text: "Após salvar, clique em 'Salvar em Lista' para criar ou adicionar a uma lista." },
          { emoji: "3️⃣", text: "Clique em uma lista para ver os leads e gerenciá-los." },
          { emoji: "4️⃣", text: "Use listas para segmentar campanhas e follow-ups por grupo." },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display gradient-text">Listas de Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organize seus leads em listas personalizadas
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Nome da nova lista..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
            className="flex-1"
          />
          <div className="flex gap-1">
            {COLORS.slice(0, 6).map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full transition-all flex-shrink-0 ${newColor === c ? "ring-2 ring-offset-1 ring-offset-background ring-primary scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleCreateList} disabled={!newName.trim() || creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 card-shadow text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma lista criada</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Após salvar leads no CRM, use o botão "Salvar em Lista" para organizá-los.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-xl border border-border bg-card p-5 card-shadow hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => openList(list)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                  {editingId === list.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameList(list.id); if (e.key === "Escape") setEditingId(null); }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRenameList(list.id)}>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <h3
                      className="font-semibold text-foreground group-hover:text-primary transition-colors truncate cursor-text"
                      onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditingName(list.name); }}
                      title="Clique para renomear"
                    >
                      {list.name}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditingName(list.name); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" /> {counts[list.id] ?? 0} leads
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(list.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserLists;
