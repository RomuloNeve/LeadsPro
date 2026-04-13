import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import countriesData from "@/data/countries.json";

interface Country {
  codigo: string;
  fone: string;
  iso: string;
  iso3: string;
  nome: string;
  nomeFormal: string;
}

interface CountryComboboxProps {
  value: string;
  onValueChange: (country: string) => void;
  disabled?: boolean;
}

const countries = (countriesData as Country[]).filter((c) => c.iso !== "BR");

export const CountryCombobox = ({ value, onValueChange, disabled }: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedLabel = countries.find((c) => c.nome === value)?.nome || value || "Selecione o país";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full h-10 justify-between font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="flex items-center gap-2 px-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país..."
              className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.slice(0, 50).map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => {
                onValueChange(c.nome);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2",
                value === c.nome && "bg-accent"
              )}
            >
              <Check className={cn("h-3 w-3", value === c.nome ? "opacity-100" : "opacity-0")} />
              <span className="truncate">{c.nome}</span>
              <span className="text-xs text-muted-foreground ml-auto">{c.iso}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Nenhum país encontrado
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
