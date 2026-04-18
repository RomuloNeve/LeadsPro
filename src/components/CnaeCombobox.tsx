import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import categoriesData from "@/data/categories.json";

interface CategoryGroup {
  group: string;
  items: string[];
}

interface CnaeComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const CnaeCombobox = ({ value, onValueChange, disabled }: CnaeComboboxProps) => {
  const [mode, setMode] = useState<"cat" | "livre">("cat");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const groups = categoriesData as CategoryGroup[];

  // Flatten for search + keep group info for display
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: { group: string; item: string }[] = [];
    for (const g of groups) {
      for (const item of g.items) {
        if (!q || item.toLowerCase().includes(q) || g.group.toLowerCase().includes(q)) {
          out.push({ group: g.group, item });
        }
      }
    }
    return out;
  }, [search, groups]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setMode("cat"); onValueChange(""); }}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
            mode === "cat"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          📋 Categorias populares
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
                {value || "Selecione uma categoria..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Buscar categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1">
              {(() => {
                if (filtered.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma categoria encontrada. Use "Digitar livremente" para buscar qualquer termo.
                    </p>
                  );
                }
                // Group the flat list back by group name for visual headers
                let lastGroup = "";
                return filtered.map(({ group, item }) => {
                  const showHeader = group !== lastGroup;
                  lastGroup = group;
                  return (
                    <div key={`${group}-${item}`}>
                      {showHeader && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1">
                          {group}
                        </p>
                      )}
                      <button
                        type="button"
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2",
                          value === item && "bg-accent"
                        )}
                        onClick={() => {
                          onValueChange(item);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check className={cn("h-3 w-3 shrink-0", value === item ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{item}</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
