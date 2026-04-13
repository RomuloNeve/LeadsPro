import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Loader2 } from "lucide-react";

interface LeadList {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface SaveToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
}

const COLORS = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#06B6D4", "#F97316", "#14B8A6", "#A855F7",
  "#E11D48", "#84CC16", "#0EA5E9", "#D946EF", "#FB923C",
  "#22D3EE", "#4ADE80", "#FACC15", "#F472B6", "#818CF8",
];

export function SaveToListDialog({ open, onOpenChange, leadIds }: SaveToListDialogProps) {
  const { license } = useUserData();
  const { toast } = useToast();
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  useEffect(() => {
    if (open && license?.id) {
      fetchLists();
    }
  }, [open, license?.id]);

  const fetchLists = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lead_lists")
      .select("*")
      .eq("license_id", license!.id)
      .order("created_at", { ascending: false });
    setLists((data as LeadList[]) || []);
    setLoading(false);
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
      setSelectedListId((data as LeadList).id);
      setNewName("");
      toast({ title: `Lista "${newName.trim()}" criada!` });
    }
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selectedListId || !leadIds.length) return;
    setSaving(true);

    const items = leadIds.map((lead_id) => ({
      list_id: selectedListId,
      lead_id,
    }));

    const { error } = await supabase
      .from("lead_list_items")
      .upsert(items, { onConflict: "list_id,lead_id" });

    if (error) {
      toast({ title: "Erro ao salvar na lista", description: error.message, variant: "destructive" });
    } else {
      const listName = lists.find((l) => l.id === selectedListId)?.name;
      toast({ title: `✅ ${leadIds.length} leads salvos na lista "${listName}"!` });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Salvar em uma Lista
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new list */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Criar nova lista</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da lista..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleCreateList} disabled={!newName.trim() || creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Existing lists */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : lists.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-foreground">Ou escolha uma lista existente</p>
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selectedListId === list.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                  <span className="text-sm font-medium text-foreground flex-1">{list.name}</span>
                  {selectedListId === list.id && (
                    <Badge className="gradient-bg text-primary-foreground border-0 text-[10px]">Selecionada</Badge>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhuma lista criada ainda. Crie uma acima!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!selectedListId || saving}
            className="gradient-bg text-primary-foreground"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderOpen className="h-4 w-4 mr-2" />}
            Salvar {leadIds.length} leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
