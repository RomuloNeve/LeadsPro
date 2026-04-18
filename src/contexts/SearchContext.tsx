import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SearchLead {
  id?: string;
  name: string;
  phone: string;
  email: string;
  instagram: string;
  linkedin: string;
  website: string;
  city: string;
  state: string;
  category: string;
}

export interface SearchParams {
  role: string;
  state?: string;
  city?: string;
  country?: string;
  code?: string;
}

export interface SearchMeta {
  role: string;
  locationLabel: string;
}

interface SearchContextValue {
  leads: SearchLead[];
  searching: boolean;
  progress: number;
  total: number;
  savedLeadIds: string[];
  liveCreditsUsed: number;
  lastMeta: SearchMeta | null;
  startSearch: (params: SearchParams, meta: SearchMeta, onCreditsDone?: () => void) => Promise<void>;
  stopSearch: () => void;
  resetSearch: () => void;
  setSavedLeadIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<SearchLead[]>([]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([]);
  const [liveCreditsUsed, setLiveCreditsUsed] = useState(0);
  const [lastMeta, setLastMeta] = useState<SearchMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const totalRef = useRef(0);

  const stopSearch = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetSearch = useCallback(() => {
    if (searching) return;
    setLeads([]);
    setProgress(0);
    setTotal(0);
    setSavedLeadIds([]);
    setLiveCreditsUsed(0);
    setLastMeta(null);
  }, [searching]);

  const startSearch = useCallback(
    async (params: SearchParams, meta: SearchMeta, onCreditsDone?: () => void) => {
      if (searching) return;
      setSearching(true);
      setLeads([]);
      setSavedLeadIds([]);
      setProgress(0);
      setTotal(0);
      totalRef.current = 0;
      setLiveCreditsUsed(0);
      setLastMeta(meta);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({ title: "Você precisa estar logado!", variant: "destructive" });
          setSearching(false);
          return;
        }

        // Guard: block if the caller's license is inactive or expired.
        // (The server also enforces this, but we want to fail fast client-side
        // with a clear toast instead of streaming an empty result.)
        if (params.code) {
          const { data: lic } = await supabase
            .from("licenses")
            .select("is_active, expires_at")
            .eq("code", params.code)
            .maybeSingle();
          const expired =
            lic?.expires_at && new Date(lic.expires_at).getTime() <= Date.now();
          if (lic && (lic.is_active === false || expired)) {
            toast({
              title: "Licença inativa ou expirada",
              description: "Renove seu plano para continuar buscando leads.",
              variant: "destructive",
            });
            setSearching(false);
            return;
          }
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/search-leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            role: params.role,
            state: params.state || "",
            city: params.city || "",
            country: params.country || "",
            code: params.code || "",
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Erro na busca");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream não suportado");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const match = line.match(/^data: (.+)$/);
            if (!match) continue;
            try {
              const msg = JSON.parse(match[1]);
              if (msg.type === "total") {
                totalRef.current = msg.count;
                setTotal(msg.count);
              } else if (msg.type === "lead") {
                setLeads((prev) => [...prev, msg.lead]);
                const denom = totalRef.current || msg.index + 1;
                setProgress(Math.round(((msg.index + 1) / denom) * 100));
                setLiveCreditsUsed((prev) => prev + 1);
                if (msg.lead?.id) {
                  setSavedLeadIds((prev) => [...prev, msg.lead.id]);
                }
              } else if (msg.type === "done") {
                setProgress(100);
              }
            } catch {
              /* ignore */
            }
          }
        }

        // Use a setState callback to read the final count without stale closure
        setLeads((curr) => {
          if (curr.length === 0) {
            toast({
              title: "Nenhum lead encontrado",
              description: "Tente outra categoria ou localização mais ampla.",
            });
          } else {
            toast({ title: `🎯 Busca concluída! ${curr.length} leads encontrados` });
          }
          return curr;
        });
      } catch (err: any) {
        if (err.name === "AbortError") {
          toast({ title: "Busca cancelada" });
        } else {
          toast({ title: "Erro na busca", description: err.message, variant: "destructive" });
        }
      } finally {
        setSearching(false);
        abortRef.current = null;
        setLiveCreditsUsed(0);
        onCreditsDone?.();
      }
    },
    [searching, toast]
  );

  return (
    <SearchContext.Provider
      value={{
        leads,
        searching,
        progress,
        total,
        savedLeadIds,
        liveCreditsUsed,
        lastMeta,
        startSearch,
        stopSearch,
        resetSearch,
        setSavedLeadIds,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
};
