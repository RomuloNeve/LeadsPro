import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log("=== CAKTO WEBHOOK RECEIVED ===");
    console.log(`Event: ${payload.event}`);

    // Validate secret from payload body
    const expectedSecret = Deno.env.get("CAKTO_CLIENT_SECRET");
    if (expectedSecret && payload.secret !== expectedSecret) {
      console.error("Invalid Cakto secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log webhook
    await supabase.from("api_error_logs").insert({
      function_name: "cakto-webhook",
      error_message: `Webhook: ${payload.event}`,
      error_details: payload,
    });

    // Extract email from Cakto payload structure
    const email = payload.data?.customer?.email;
    const event = payload.event || "unknown";

    console.log(`Event: ${event}, Email: ${email}`);

    if (!email) {
      console.log("No email in payload, skipping license logic");
      return new Response(
        JSON.stringify({ success: true, message: "No email, logged only" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      console.log(`No profile found for email ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "User not found, logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = profile.user_id;

    // Find the user's license
    const { data: license } = await supabase
      .from("licenses")
      .select("id, is_active, plan_type, expires_at")
      .eq("assigned_to", userId)
      .maybeSingle();

    if (!license) {
      console.log(`No license found for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: "No license found, logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map Cakto events to actions
    const activateEvents = ["paid", "subscription_created", "subscription_renewed", "subscription_active"];
    const deactivateEvents = ["subscription_canceled", "refunded", "chargedback", "subscription_renewal_refused"];

    if (deactivateEvents.includes(event)) {
      await supabase
        .from("licenses")
        .update({ is_active: false })
        .eq("id", license.id);
      console.log(`License ${license.id} DEACTIVATED for user ${userId} (event: ${event})`);
    } else if (activateEvents.includes(event)) {
      const recurrencePeriod = payload.data?.subscription?.recurrence_period || 30;
      const newExpiry = new Date(Date.now() + recurrencePeriod * 24 * 60 * 60 * 1000).toISOString();
      
      // Determine credits based on plan
      const planType = license.plan_type || "profissional";
      let monthlyCredits = 1000;
      if (planType === "starter") monthlyCredits = 300;
      else if (planType === "enterprise") monthlyCredits = 5000;

      await supabase
        .from("licenses")
        .update({ is_active: true, expires_at: newExpiry, used_credits: 0, monthly_credits: monthlyCredits })
        .eq("id", license.id);
      console.log(`License ${license.id} RENEWED until ${newExpiry} for user ${userId} (event: ${event}, credits reset to ${monthlyCredits})`);
    } else {
      console.log(`Event "${event}" not mapped to any action`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ success: true, message: "Received" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
