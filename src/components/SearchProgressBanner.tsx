import { useLocation, useNavigate } from "react-router-dom";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Loader2, StopCircle, Search } from "lucide-react";

/**
 * Sticky mini-banner shown on every user-dashboard page while a search is
 * running, so the user can keep tabs on progress — and stop the search —
 * even after navigating away from /user-dashboard/search.
 */
export const SearchProgressBanner = () => {
  const { searching, leads, total, progress, stopSearch } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  if (!searching) return null;
  // Already on the search page — the inline UI is enough.
  if (location.pathname.endsWith("/search")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto">
      <div className="rounded-xl border border-primary/40 bg-card/95 backdrop-blur shadow-lg p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Busca em andamento
          </p>
          <p className="text-xs text-muted-foreground">
            {leads.length}/{total || "?"} leads · {progress}%
          </p>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => navigate("/user-dashboard/search")}
            title="Abrir busca"
          >
            <Search className="h-3.5 w-3.5 mr-1" /> Ver
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-xs"
            onClick={stopSearch}
            title="Parar busca"
          >
            <StopCircle className="h-3.5 w-3.5 mr-1" /> Parar
          </Button>
        </div>
      </div>
    </div>
  );
};
