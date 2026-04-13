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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get client IP from headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // CHECK: Has this IP already used a free trial?
    if (action === "check") {
      const { data: existing } = await supabase
        .from("free_trial_ips")
        .select("id")
        .eq("ip_address", clientIp)
        .maybeSingle();

      return new Response(
        JSON.stringify({ allowed: !existing, ip: clientIp }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // REGISTER: Record this IP as having used a free trial
    if (action === "register") {
      const { userId } = await req.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("free_trial_ips")
        .select("id")
        .eq("ip_address", clientIp)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "free_trial_already_used", message: "Este IP já utilizou o teste grátis." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("free_trial_ips")
        .insert({ ip_address: clientIp, user_id: userId });

      if (error) {
        // Unique constraint violation = already used
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({ error: "free_trial_already_used", message: "Este IP já utilizou o teste grátis." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
