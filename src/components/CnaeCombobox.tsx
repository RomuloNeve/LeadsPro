import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import cnaesData from "@/data/cnaes.json";

interface CnaeItem {
  cod: string;
  desc: string;
}

interface CnaeComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const CnaeCombobox = ({ value, onValueChange, disabled }: CnaeComboboxProps) => {
  const [mode, setMode] = useState<"cnae" | "livre">("cnae");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const cnaes = cnaesData as CnaeItem[];

  const filtered = useMemo(() => {
    if (!search.trim()) return cnaes.slice(0, 50);
    const q = search.toLowerCase();
    return cnaes.filter(
      (c) => c.desc.toLowerCase().includes(q) || c.cod.includes(q)
    ).slice(0, 50);
  }, [search, cnaes]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setMode("cnae"); onValueChange(""); }}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
            mode === "cnae"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          📋 Buscar por CNAE
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setMode("livre"); onValueChange(""); }}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
            mode === "livre"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          ✏️ Digitar livremente
        </button>
      </div>

      {mode === "livre" ? (
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Ex: Dentista, Pizzaria, Advogado..."
          disabled={disabled}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between font-normal h-10 text-left"
            >
              <span className="truncate">
                {value || "Selecione um CNAE..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Filtrar CNAE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[250px] overflow-y-auto p-1">
              {filtered.map((cnae) => (
                <button
                  key={cnae.cod}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2",
                    value === cnae.desc && "bg-accent"
                  )}
                  onClick={() => {
                    onValueChange(cnae.desc);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("h-3 w-3 shrink-0", value === cnae.desc ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{cnae.desc}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">{cnae.cod}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum CNAE encontrado</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
