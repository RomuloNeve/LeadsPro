import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  /** Array of currently selected categories (multi-select). */
  values: string[];
  onValuesChange: (values: string[]) => void;
  disabled?: boolean;
}

export const CnaeCombobox = ({ values, onValuesChange, disabled }: CnaeComboboxProps) => {
  const [mode, setMode] = useState<"cat" | "livre">("cat");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [freeInput, setFreeInput] = useState("");

  const groups = categoriesData as CategoryGroup[];

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

  const toggle = (item: string) => {
    if (values.includes(item)) {
      onValuesChange(values.filter((v) => v !== item));
    } else {
      onValuesChange([...values, item]);
    }
  };

  const remove = (item: string) => onValuesChange(values.filter((v) => v !== item));
  const clearAll = () => onValuesChange([]);

  const addFree = () => {
    const trimmed = freeInput.trim();
    if (!trimmed) return;
    // Support comma/semicolon separated entries
    const parts = trimmed
      .split(/[,;]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...values, ...parts]));
    onValuesChange(merged);
    setFreeInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode("cat")}
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
          onClick={() => setMode("livre")}
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
        <div className="flex gap-2">
          <Input
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFree();
              }
            }}
            placeholder="Ex: Dentista, Pizzaria, Advogado (separe por vírgula)"
            disabled={disabled}
          />
          <Button type="button" variant="outline" onClick={addFree} disabled={disabled || !freeInput.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
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
                {values.length === 0
                  ? "Selecione uma ou mais categorias..."
                  : `${values.length} categoria${values.length > 1 ? "s" : ""} selecionada${values.length > 1 ? "s" : ""}`}
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
                      Nenhuma categoria encontrada. Use "Digitar livremente" para adicionar qualquer termo.
                    </p>
                  );
                }
                let lastGroup = "";
                return filtered.map(({ group, item }) => {
                  const showHeader = group !== lastGroup;
                  lastGroup = group;
                  const isSelected = values.includes(item);
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
                          isSelected && "bg-accent"
                        )}
                        onClick={() => toggle(item)}
                      >
                        <Check className={cn("h-3 w-3 shrink-0", isSelected ? "opacity-100 text-primary" : "opacity-0")} />
                        <span className="truncate">{item}</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
            {values.length > 0 && (
              <div className="border-t border-border p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {values.length} selecionada{values.length > 1 ? "s" : ""}
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                  Limpar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* Selected chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pr-1 pl-2 py-0.5 text-xs font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                disabled={disabled}
                className="ml-0.5 rounded-sm hover:bg-background/60 p-0.5 transition-colors"
                aria-label={`Remover ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
