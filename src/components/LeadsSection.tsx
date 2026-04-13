import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search, Trash2, Download } from "lucide-react";

interface Lead {
  id: string;
  license_id: string;
  name: string | null;
  instagram: string | null;
  phone: string | null;
  created_at: string;
}

interface License {
  id: string;
  code: string;
  description: string | null;
}

const LeadsSection = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar leads", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  const fetchLicenses = async () => {
    const { data } = await supabase
      .from("licenses")
      .select("id, code, description");
    if (data) setLicenses(data as License[]);
  };

  useEffect(() => {
    fetchLeads();
    fetchLicenses();
  }, []);

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const getLicenseLabel = (licenseId: string) => {
    const lic = licenses.find((l) => l.id === licenseId);
    if (!lic) return "—";
    return lic.description || lic.code;
  };

  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase();
    return (
      (lead.name?.toLowerCase().includes(q) ?? false) ||
      (lead.instagram?.toLowerCase().includes(q) ?? false) ||
      (lead.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  const exportCSV = () => {
    const header = "Nome,Instagram,Telefone,Site,LinkedIn,Data\n";
    const rows = filteredLeads
      .map((l) =>
        `"${l.name || ""}","${l.instagram || ""}","${l.phone || ""}","${(l as any).website || ""}","${(l as any).linkedin || ""}","${new Date(l.created_at).toLocaleDateString("pt-BR")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 card-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Leads Capturados ({filteredLeads.length})
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredLeads.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? "Nenhum lead encontrado." : "Nenhum lead capturado ainda."}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Licença</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                  <TableCell>
                    {lead.instagram ? (
                      <a href={lead.instagram.startsWith("http") ? lead.instagram : `https://instagram.com/${lead.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        {lead.instagram.startsWith("http") ? lead.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@") : lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{lead.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs truncate max-w-[120px]">
                      {getLicenseLabel(lead.license_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteLead(lead.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* API Info */}
      <div className="mt-4 p-3 rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground font-semibold mb-1">Endpoint para a extensão enviar leads:</p>
        <code className="text-xs text-foreground break-all">
          POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-leads
        </code>
        <p className="text-xs text-muted-foreground mt-1">
          Body: {'{'} "code": "XXXX-XXXX-XXXX-XXXX", "leads": [{'{'} "name": "...", "instagram": "...", "phone": "..." {'}'}] {'}'}
        </p>
      </div>
    </div>
  );
};

export default LeadsSection;
