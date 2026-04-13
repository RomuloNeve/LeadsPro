import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(
        JSON.stringify({ valid: false, message: "Código de licença é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("licenses")
      .select("id, is_active, plan_type, expires_at")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ valid: false, message: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, message: "Licença não encontrada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.is_active) {
      return new Response(
        JSON.stringify({ valid: false, message: "Licença desativada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lifetime plan
    if (data.plan_type === "lifetime") {
      return new Response(
        JSON.stringify({
          valid: true,
          plan_type: "lifetime",
          days_remaining: null,
          message: "Acesso Vitalício",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Monthly plan - check expiration
    if (data.plan_type === "monthly" && data.expires_at) {
      const now = new Date();
      const expires = new Date(data.expires_at);
      const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // Auto-deactivate expired license
        await supabase
          .from("licenses")
          .update({ is_active: false })
          .eq("id", data.id);

        return new Response(
          JSON.stringify({
            valid: false,
            plan_type: "monthly",
            days_remaining: 0,
            message: "Licença expirada. Solicite uma nova licença.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          plan_type: "monthly",
          days_remaining: daysRemaining,
          message: `Faltam ${daysRemaining} dias para vencer sua licença`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({ valid: true, plan_type: data.plan_type, days_remaining: null, message: "Acesso liberado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ valid: false, message: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
