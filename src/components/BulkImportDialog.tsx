import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface BulkImportDialogProps {
  licenseId: string;
  onImportComplete: () => void;
}

interface ImportRow {
  category: string;
  name?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  linkedin?: string;
}

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  categoria: "category",
  category: "category",
  nome: "name",
  name: "name",
  telefone: "phone",
  phone: "phone",
  tel: "phone",
  email: "email",
  "e-mail": "email",
  instagram: "instagram",
  insta: "instagram",
  site: "website",
  website: "website",
  url: "website",
  linkedin: "linkedin",
};

function normalizeColumns(raw: Record<string, any>): ImportRow | null {
  const row: Partial<ImportRow> = {};
  for (const [key, value] of Object.entries(raw)) {
    const normalized = key.toLowerCase().trim().replace(/[^a-záàãéêíóôõúç-]/g, "");
    const mapped = COLUMN_MAP[normalized];
    if (mapped && value != null && String(value).trim()) {
      row[mapped] = String(value).trim();
    }
  }
  if (!row.category) return null;
  return row as ImportRow;
}

export function BulkImportDialog({ licenseId, onImportComplete }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setRows([]);
    setInvalidCount(0);
    setDuplicateCount(0);
    setProgress({ current: 0, total: 0 });
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

        const valid: ImportRow[] = [];
        let invalid = 0;

        for (const raw of json) {
          const mapped = normalizeColumns(raw);
          if (mapped) {
            valid.push(mapped);
          } else {
            invalid++;
          }
        }

        // Deduplicate by phone within the file itself
        const seenPhones = new Set<string>();
        const deduped: ImportRow[] = [];
        let dupeCount = 0;
        for (const row of valid) {
          const phone = row.phone?.trim();
          if (phone && seenPhones.has(phone)) {
            dupeCount++;
          } else {
            if (phone) seenPhones.add(phone);
            deduped.push(row);
          }
        }

        setRows(deduped);
        setInvalidCount(invalid);
        setDuplicateCount(dupeCount);

        if (valid.length === 0) {
          toast({
            title: "Nenhum lead válido",
            description: "Verifique se a coluna 'Categoria' está presente e preenchida.",
            variant: "destructive",
          });
        }
      } catch {
        toast({ title: "Erro ao ler arquivo", description: "Formato inválido.", variant: "destructive" });
      }
    };

    reader.readAsArrayBuffer(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setProgress({ current: 0, total: rows.length });

    const BATCH_SIZE = 50;
    const MAX_RETRIES = 3;
    let imported = 0;
    let failed = 0;
    let lastError = "";
    const insertedLeadIds: string[] = [];

    // Create a list named after the uploaded file
    const listName = fileName.replace(/\.(xlsx|xls|csv)$/i, "").trim() || "Importação";
    const { data: listData, error: listError } = await supabase
      .from("lead_lists")
      .insert({ name: listName, license_id: licenseId })
      .select("id")
      .single();

    if (listError || !listData) {
      toast({ title: "Erro ao criar lista", description: listError?.message, variant: "destructive" });
      setImporting(false);
      return;
    }

    const listId = listData.id;

    // Insert leads and link to list in small batches
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
        license_id: licenseId,
        category: r.category,
        name: r.name || null,
        phone: r.phone || null,
        email: r.email || null,
        instagram: r.instagram || null,
        website: r.website || null,
        linkedin: r.linkedin || null,
      }));

      let success = false;
      for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
        const { data: insertedBatch, error, status, statusText } = await supabase
          .from("leads")
          .insert(batch)
          .select("id");

        console.log(`[Import] Batch ${Math.floor(i / BATCH_SIZE) + 1}: status=${status} statusText=${statusText} rows=${insertedBatch?.length ?? 0} error=${error?.message ?? "none"}`);

        if (!error && insertedBatch && insertedBatch.length > 0) {
          success = true;
          imported += insertedBatch.length;
          // Link this batch to the list immediately
          const linkRows = insertedBatch.map((l) => ({ list_id: listId, lead_id: l.id }));
          await supabase.from("lead_list_items").insert(linkRows);
        } else if (!error) {
          // Insert succeeded but no data returned - count as success
          success = true;
          imported += batch.length;
        } else if (attempt === MAX_RETRIES - 1) {
          failed += batch.length;
          lastError = error?.message || `Status ${status}: ${statusText}`;
          console.error(`[Import] Batch ${Math.floor(i / BATCH_SIZE) + 1} FAILED after ${MAX_RETRIES} retries:`, error);
        } else {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }

      setProgress({ current: imported, total: rows.length });

      if (i + BATCH_SIZE < rows.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setImporting(false);

    if (failed === 0) {
      toast({ title: `${imported} leads importados na lista "${listName}"!` });
    } else {
      toast({
        title: `${imported} importados, ${failed} falharam`,
        description: lastError || "Alguns lotes não puderam ser salvos. Tente novamente.",
        variant: "destructive",
      });
    }

    if (imported > 0) {
      onImportComplete();
    }
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importação em Massa
          </DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              Arraste seu arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Formatos aceitos: .xlsx, .xls, .csv
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-xs font-semibold text-foreground mb-2">Colunas aceitas:</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="default" className="text-[10px]">Categoria *</Badge>
                <Badge variant="outline" className="text-[10px]">Nome</Badge>
                <Badge variant="outline" className="text-[10px]">Telefone</Badge>
                <Badge variant="outline" className="text-[10px]">Email</Badge>
                <Badge variant="outline" className="text-[10px]">Instagram</Badge>
                <Badge variant="outline" className="text-[10px]">Site</Badge>
                <Badge variant="outline" className="text-[10px]">LinkedIn</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">* Campo obrigatório</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{rows.length} leads válidos</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{invalidCount} ignorados (sem categoria)</span>
                  </div>
                )}
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">{duplicateCount} duplicatas removidas</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Trocar arquivo
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>

            <div className="border rounded-lg overflow-auto flex-1 max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Telefone</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Instagram</TableHead>
                    <TableHead className="text-xs">Site</TableHead>
                    <TableHead className="text-xs">LinkedIn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/10"}>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{r.category}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{r.name || "—"}</TableCell>
                      <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{r.email || "—"}</TableCell>
                      <TableCell className="text-xs">{r.instagram || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{r.website || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{r.linkedin || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 50 de {rows.length} leads na pré-visualização
                </p>
              )}
            </div>

            {importing && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Importando...</span>
                  <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleImport} disabled={importing} className="w-full gradient-bg">
              {importing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando {Math.round((progress.current / progress.total) * 100)}%</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Importar {rows.length.toLocaleString()} leads</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
