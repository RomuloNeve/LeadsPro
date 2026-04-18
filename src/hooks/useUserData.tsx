import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface License {
  id: string;
  code: string;
  is_active: boolean;
  plan_type: string;
  expires_at: string | null;
  search_expires_at: string | null;
  created_at: string;
  monthly_credits: number;
  used_credits: number;
  extra_credits: number;
  assigned_to: string | null;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  instagram: string | null;
  phone: string | null;
  category: string | null;
  website: string | null;
  linkedin: string | null;
  notes: string | null;
  is_duplicate: boolean;
  lead_status: string;
  lead_score: number | null;
  scored_at: string | null;
  created_at: string;
}

interface UserDataContextType {
  license: License | null;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  loading: boolean;
  hasLicense: boolean | null;
  isAdmin: boolean;
  fetchLicense: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  fetchLeads: (licenseId: string) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

export const useUserData = () => {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used within UserDataProvider");
  return ctx;
};

export const getDaysRemaining = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [license, setLicense] = useState<License | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchLeads = async (licenseId: string) => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("license_id", licenseId)
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
  };

  const fetchLicense = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .not("assigned_to", "is", null)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error(error);
    }

    if (data) {
      setLicense(data as License);
      setHasLicense(true);
      await fetchLeads(data.id);
    } else {
      setHasLicense(false);
    }
    setLoading(false);
  };

  const refreshCredits = async () => {
    if (!license?.id) return;
    const { data } = await supabase
      .from("licenses")
      .select("used_credits, extra_credits, monthly_credits")
      .eq("id", license.id)
      .maybeSingle();
    if (data) {
      setLicense((prev) => prev ? { ...prev, used_credits: data.used_credits, extra_credits: data.extra_credits, monthly_credits: data.monthly_credits } : prev);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Admins can freely browse /user-dashboard to use every feature
      // (WhatsApp, CRM, campaigns, etc) without being kicked back to /dashboard.
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setIsAdmin(Boolean(profile?.is_admin));

      await fetchLicense();
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!license?.id) return;

    const channel = supabase
      .channel("user-leads")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `license_id=eq.${license.id}`,
        },
        (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev]);
          toast({
            title: "🎉 Novo lead recebido!",
            description: `${newLead.name || newLead.instagram || "Lead sem nome"} foi adicionado.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [license?.id]);

  return (
    <UserDataContext.Provider value={{ license, leads, setLeads, loading, hasLicense, isAdmin, fetchLicense, refreshCredits, fetchLeads }}>
      {children}
    </UserDataContext.Provider>
  );
};
