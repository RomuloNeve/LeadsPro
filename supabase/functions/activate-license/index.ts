import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: "Código e user_id são obrigatórios" }),
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
      .select("id")
      .eq("assigned_to", user_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Você já possui uma licença ativada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the license
    const { data: license, error: findError } = await supabase
      .from("licenses")
      .select("id, is_active, assigned_to")
      .eq("code", code)
      .maybeSingle();

    if (findError || !license) {
      return new Response(
        JSON.stringify({ error: "Licença não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!license.is_active) {
      return new Response(
        JSON.stringify({ error: "Esta licença está inativa" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (license.assigned_to) {
      return new Response(
        JSON.stringify({ error: "Esta licença já está em uso por outro usuário" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign license to user
    const { error: updateError } = await supabase
      .from("licenses")
      .update({ assigned_to: user_id })
      .eq("id", license.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Erro ao ativar licença", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Licença ativada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
