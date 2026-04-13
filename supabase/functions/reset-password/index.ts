import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, phone, new_password } = await req.json();

    if (!email || !phone || !new_password) {
      return new Response(
        JSON.stringify({ error: "E-mail, telefone e nova senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find((u: any) => u.email === email.trim().toLowerCase());

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify phone from profile (if user has one registered)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("whatsapp_phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const normalizePhone = (p: string) => p.replace(/\D/g, "");
    const storedPhone = normalizePhone(profile?.whatsapp_phone || "");
    const inputPhone = normalizePhone(phone);

    // Only verify phone if user has one registered
    if (storedPhone && storedPhone !== inputPhone) {
      return new Response(
        JSON.stringify({ error: "O telefone informado não corresponde ao cadastro." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: new_password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
