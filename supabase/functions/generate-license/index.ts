import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join("-");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, plan } = await req.json();

    if (!user_id || !plan) {
      return new Response(
        JSON.stringify({ error: "user_id e plan são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already has a license
    const { data: existing } = await supabase
      .from("licenses")
      .select("id, code")
      .eq("assigned_to", user_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Você já possui uma licença", code: existing.code }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = generateCode();
    const planType = plan === "lifetime" ? "lifetime" : "monthly";
    const expiresAt =
      planType === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data: license, error } = await supabase
      .from("licenses")
      .insert({
        code,
        plan_type: planType,
        is_active: true,
        assigned_to: user_id,
        expires_at: expiresAt,
      })
      .select("code, plan_type, expires_at")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Erro ao gerar licença", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, license }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
