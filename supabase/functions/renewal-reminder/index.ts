import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

async function generateVariations(baseMessage: string, count: number): Promise<string[]> {
  if (!OPENAI_API_KEY || count <= 1) return [baseMessage];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Reescreva mensagens de WhatsApp mantendo EXATAMENTE o mesmo sentido, informações e links. Gere ${count} variações. Retorne SOMENTE as variações separadas por "%%%SPLIT%%%". NÃO adicione links que não estejam no original.`,
          },
          { role: "user", content: `Gere ${count} variações:\n\n${baseMessage}` },
        ],
        temperature: 0.9,
        max_tokens: count * 500,
      }),
    });

    if (!res.ok) return [baseMessage];
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return [baseMessage];

    const variants = text.split("%%%SPLIT%%%").map((v: string) => v.trim()).filter((v: string) => v.length > 10);
    return variants.length > 0 ? variants : [baseMessage];
  } catch {
    return [baseMessage];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("=== RENEWAL REMINDER CRON ===");

    // Find monthly licenses expiring in exactly 5 days (±12h window)
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const windowStart = new Date(fiveDaysFromNow.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(fiveDaysFromNow.getTime() + 12 * 60 * 60 * 1000).toISOString();

    const { data: expiringLicenses, error: licError } = await supabase
      .from("licenses")
      .select("id, assigned_to, expires_at, plan_type")
      .eq("is_active", true)
      .eq("plan_type", "mensal")
      .gte("expires_at", windowStart)
      .lte("expires_at", windowEnd);

    if (licError) {
      console.error("Error fetching licenses:", licError);
      return new Response(JSON.stringify({ error: licError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiringLicenses || expiringLicenses.length === 0) {
      console.log("No licenses expiring in 5 days");
      return new Response(JSON.stringify({ message: "No reminders needed", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${expiringLicenses.length} licenses expiring in ~5 days`);

    // Get profiles for these users
    const userIds = expiringLicenses.map(l => l.assigned_to).filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, whatsapp_phone, display_name")
      .in("user_id", userIds);

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found for expiring users");
      return new Response(JSON.stringify({ message: "No profiles with WhatsApp", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter only those with WhatsApp
    const targets = profiles.filter(p => p.whatsapp_phone && p.whatsapp_phone.trim() !== "");
    if (targets.length === 0) {
      console.log("No users with WhatsApp phone");
      return new Response(JSON.stringify({ message: "No WhatsApp phones", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find admin instance to send from
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_admin", true)
      .limit(1)
      .maybeSingle();

    if (!adminProfile) {
      console.error("No admin profile found");
      return new Response(JSON.stringify({ error: "No admin profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("instance_name, status")
      .eq("user_id", adminProfile.user_id)
      .eq("status", "connected")
      .maybeSingle();

    if (!instance) {
      console.error("No connected WhatsApp instance for admin");
      return new Response(JSON.stringify({ error: "No connected instance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build base message
    const baseMessage = `Olá {nome}! 👋

Passando para avisar que faltam *5 dias* para a renovação do seu plano no *LeadsPro*.

Para continuar usando sem interrupção, garanta que a renovação seja feita a tempo! Se tiver qualquer dúvida, estou por aqui. 🚀

Renovar agora: https://pay.cakto.com.br/mrhbivc_848520`;

    // Generate variations
    const variants = await generateVariations(baseMessage, Math.min(targets.length, 6));

    let sent = 0;
    let errors = 0;
    const results: string[] = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const phone = target.whatsapp_phone!.replace(/\D/g, "");
      const name = target.display_name || target.email?.split("@")[0] || "";
      
      let text = variants[i % variants.length];
      text = text.replace(/\{nome\}/gi, name);

      try {
        const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: phone, text }),
        });
        const data = await res.json();
        if (res.status >= 200 && res.status < 300) {
          sent++;
          results.push(`✅ ${phone} (${name})`);
          console.log(`Sent to ${phone} (${name})`);
        } else {
          errors++;
          results.push(`❌ ${phone}: ${JSON.stringify(data).substring(0, 80)}`);
          console.error(`Failed ${phone}:`, data);
        }
      } catch (e) {
        errors++;
        results.push(`❌ ${phone}: ${(e as Error).message}`);
      }

      // Anti-ban delay: 8-20 seconds
      if (i < targets.length - 1) {
        const delayMs = (8 + Math.floor(Math.random() * 13)) * 1000;
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    // Log the reminder run
    await supabase.from("api_error_logs").insert({
      function_name: "renewal-reminder",
      error_message: `Lembrete enviado: ${sent} OK, ${errors} erros`,
      error_details: { sent, errors, results, targets: targets.length },
    });

    console.log(`Reminder complete: ${sent} sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, sent, errors, results, total: targets.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Renewal reminder error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
