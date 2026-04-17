import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/logo-icon.png";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? "/dashboard" : "/auth");
    };
    check();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 animate-pulse-glow">
        <img src={logoIcon} alt="LeadsPro" className="h-20 w-20" />
        <h1 className="text-4xl font-bold font-display gradient-text">LeadsPro</h1>
      </div>
    </div>
  );
};

export default Index;
