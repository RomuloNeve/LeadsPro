import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LEAD_STATUSES, LeadStatus, getStatusConfig } from "@/components/LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, Instagram, Globe, Linkedin, MessageCircle, GripVertical, Loader2, Kanban } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface KanbanLead {
  id: string;
  name: string | null;
  email: string | null;
  instagram: string | null;
  phone: string | null;
  category: string | null;
  website: string | null;
  linkedin: string | null;
  lead_status: string;
  created_at: string;
}

const hasValue = (v: string | null | undefined) => !!v && v.trim() !== "" && v.toLowerCase() !== "não encontrado";

const UserKanban = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data: licData } = await supabase
      .from("licenses")
      .select("id")
      .not("assigned_to", "is", null)
      .limit(1)
      .maybeSingle();

    if (!licData) { setLoading(false); return; }

    const { data } = await supabase
      .from("leads")
      .select("id, name, email, instagram, phone, category, website, linkedin, lead_status, created_at")
      .eq("license_id", licData.id)
      .order("created_at", { ascending: false });

    setLeads((data as KanbanLead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("kanban-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const handleChangeStatus = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
    setDraggedLead(null);
    setDragOverColumn(null);

    const { error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
      fetchLeads(); // Revert
    } else {
      const config = getStatusConfig(newStatus);
      toast({ title: `${config.label}`, description: "Lead movido com sucesso." });
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedLead) {
      handleChangeStatus(draggedLead, status as LeadStatus);
    }
  };

  const getLeadsByStatus = (status: string) =>
    leads.filter((l) => (l.lead_status || "novo") === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Kanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Pipeline de Vendas</h1>
            <p className="text-sm text-muted-foreground">{leads.length} leads no total</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {LEAD_STATUSES.map((statusConfig) => {
          const Icon = statusConfig.icon;
          const columnLeads = getLeadsByStatus(statusConfig.value);
          const isDragOver = dragOverColumn === statusConfig.value;

          return (
            <div
              key={statusConfig.value}
              className={`flex-shrink-0 w-[280px] rounded-xl border bg-card transition-all ${
                isDragOver ? "border-primary/50 ring-2 ring-primary/20" : "border-border"
              }`}
              onDragOver={(e) => handleDragOver(e, statusConfig.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, statusConfig.value)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${statusConfig.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{statusConfig.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                  {columnLeads.length}
                </Badge>
              </div>

              {/* Cards */}
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[300px]">
                <div className="p-2 space-y-2">
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Arraste leads aqui
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all group ${
                          draggedLead === lead.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p className="text-sm font-medium text-foreground truncate">
                              {lead.name
                                ? lead.name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
                                : "Sem nome"}
                            </p>
                            {lead.category && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{lead.category}</Badge>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {hasValue(lead.phone) && (
                                <>
                                  <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary">
                                    <Phone className="h-3 w-3" />
                                  </a>
                                  <button
                                    onClick={() => navigate(`/user-dashboard/inbox?phone=${encodeURIComponent(lead.phone!)}&name=${encodeURIComponent(lead.name || "")}`)}
                                    className="text-[#25d366] hover:text-[#1da851]"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                              {hasValue(lead.email) && (
                                <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary">
                                  <Mail className="h-3 w-3" />
                                </a>
                              )}
                              {hasValue(lead.instagram) && (
                                <a href={lead.instagram!.startsWith("http") ? lead.instagram! : `https://instagram.com/${lead.instagram!.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <Instagram className="h-3 w-3" />
                                </a>
                              )}
                              {hasValue(lead.website) && (
                                <a href={lead.website!.startsWith("http") ? lead.website! : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <Globe className="h-3 w-3" />
                                </a>
                              )}
                              {hasValue(lead.linkedin) && (
                                <a href={lead.linkedin!.startsWith("http") ? lead.linkedin! : `https://linkedin.com/in/${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <Linkedin className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserKanban;
