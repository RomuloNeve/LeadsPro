import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Zap, Loader2, ExternalLink } from "lucide-react";

interface CadenceLite {
  id: string;
  name: string;
  is_active: boolean;
  _step_count: number;
}

interface Props {
  licenseId: string;
  leadIds: string[];                // leads to enroll
  trigger?: React.ReactNode;        // optional custom trigger (defaults to a button)
  onEnrolled?: () => void;
}

/**
 * Inscreve um conjunto de leads numa cadência existente. Se o lead já tiver
 * inscrição ativa naquela cadência (UNIQUE cadence_id+lead_id), pulamos —
 * o banco retorna conflito e ignoramos, evitando duplicata acidental.
 */
export function EnrollInCadenceDialog({ licenseId, leadIds, trigger, onEnrolled }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cadences, setCadences] = useState<CadenceLite[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!open || !licenseId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("cadences")
        .select("id, name, is_active, cadence_steps(id)")
        .eq("license_id", licenseId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar cadências", description: error.message, variant: "destructive" });
      } else {
        const list = (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
          _step_count: (c.cadence_steps || []).length,
        }));
        setCadences(list);
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
      }
      setLoading(false);
    })();
  }, [open, licenseId]);

  const count = leadIds.length;

  const handleEnroll = async () => {
    if (!selectedId || count === 0) return;
    setSaving(true);
    try {
      // Build enrollments — one row per lead
      const rows = leadIds.map((lead_id) => ({
        cadence_id: selectedId,
        lead_id,
        license_id: licenseId,
        current_step: 0,
        status: "active" as const,
        next_run_at: new Date().toISOString(), // fire on next cron tick
      }));
      // `upsert` with onConflict keeps existing active enrollments untouched
      // instead of failing the whole insert on one duplicate.
      const { error, count: inserted } = await supabase
        .from("cadence_enrollments")
        .upsert(rows, { onConflict: "cadence_id,lead_id", ignoreDuplicates: true, count: "exact" });
      if (error) throw error;
      toast({
        title: "Leads inscritos na cadência ✓",
        description: `${inserted ?? count} novo(s) lead(s) entraram na régua. O envio começa no próximo ciclo.`,
      });
      setOpen(false);
      onEnrolled?.();
    } catch (e: any) {
      toast({ title: "Erro ao inscrever", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={count === 0} className="gap-1.5">
            <Zap className="h-4 w-4" /> Inscrever em cadência
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Inscrever em cadência
          </DialogTitle>
          <DialogDescription>
            {count > 0 ? (
              <>
                Você vai inscrever <strong>{count}</strong> lead(s) na régua selecionada.
                O primeiro passo será disparado no próximo ciclo do sistema (até 10 minutos).
              </>
            ) : (
              "Selecione pelo menos um lead para inscrever."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : cadences.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Você ainda não tem nenhuma cadência ativa.</p>
              <Button asChild variant="outline" size="sm">
                <a href="/user-dashboard/cadences"><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Criar cadência</a>
              </Button>
            </div>
          ) : (
            <>
              <label className="text-xs font-medium text-muted-foreground">Cadência</label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma cadência..." />
                </SelectTrigger>
                <SelectContent>
                  {cadences.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} <span className="text-xs text-muted-foreground ml-2">· {c._step_count} passo(s)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                <p><strong>Como funciona:</strong> cada lead recebe os passos da cadência na ordem configurada, com os intervalos e janelas de envio que você definiu.</p>
                <p className="text-muted-foreground">Leads que já estão inscritos nesta cadência são ignorados automaticamente.</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleEnroll}
            disabled={saving || cadences.length === 0 || !selectedId || count === 0}
            className="gradient-bg"
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Inscrevendo...</> : (
              <><Zap className="h-4 w-4 mr-1.5" /> Inscrever {count > 0 ? count : ""} lead(s)</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
