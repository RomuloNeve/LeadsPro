import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  value: string;
  onValueChange: (city: string) => void;
  options: string[];
  disabled?: boolean;
}

export const CityCombobox = ({ value, onValueChange, options, disabled }: CityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((city) => city.toLowerCase().includes(q));
  }, [options, search]);

  const label = value || "Selecione ou digite a cidade";

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
          <span className="truncate">{label}</span>
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
              placeholder="Digite para filtrar..."
              className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {filteredOptions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                onValueChange(city);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2",
                value === city && "bg-accent"
              )}
            >
              <Check className={cn("h-3 w-3", value === city ? "opacity-100" : "opacity-0")} />
              <span className="truncate">{city}</span>
            </button>
          ))}

          {filteredOptions.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Nenhuma cidade encontrada
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
