import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

async function generateGreeting(leadName: string, leadMessage: string | null, userName: string | null): Promise<string | null> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, skipping AI greeting");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `Você é um assistente comercial simpático e profissional. Sua tarefa é gerar UMA mensagem curta e personalizada de primeiro contato via WhatsApp para um lead que acabou de preencher um formulário de contato no site.

Regras:
- Seja breve (2-4 linhas no máximo)
- Use o nome do lead se disponível
- Se o lead deixou uma mensagem, faça referência a ela de forma natural
- Seja acolhedor e demonstre interesse genuíno
- NÃO use emojis em excesso (máximo 2)
- ${userName ? `Assine como "${userName}"` : "NÃO assine a mensagem"}
- Retorne APENAS a mensagem, sem explicações
- Tom: profissional mas amigável, como um WhatsApp real`,
          },
          {
            role: "user",
            content: `Lead: ${leadName || "sem nome"}${leadMessage ? `\nMensagem do lead: "${leadMessage}"` : "\nO lead não deixou mensagem, apenas preencheu o formulário de contato."}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI greeting error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.error("AI greeting fetch error:", e.message);
    return null;
  }
}

async function sendWhatsApp(instanceName: string, phone: string, message: string) {
  let cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return false;
  // Add Brazil country code if missing (numbers starting with DDD 2-9 digits)
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = "55" + cleanPhone;
  }

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: cleanPhone, text: message }),
    });
    const data = await res.json();
    console.log(`Auto-greeting to ${cleanPhone}: status=${res.status}`, JSON.stringify(data));
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.error(`Failed to send greeting to ${cleanPhone}:`, e.message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, leads } = await req.json();

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: "Leads são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let license: any = null;
    let userId: string | null = null;

    // Try auth token first
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data } = await supabase
          .from("licenses")
          .select("id, is_active, plan_type, expires_at, assigned_to")
          .eq("assigned_to", user.id)
          .eq("is_active", true)
          .maybeSingle();
        license = data;
      }
    }

    // Fallback to code-based lookup
    if (!license && code) {
      const { data, error } = await supabase
        .from("licenses")
        .select("id, is_active, plan_type, expires_at, assigned_to")
        .eq("code", code)
        .maybeSingle();
      if (!error && data) {
        license = data;
        userId = data.assigned_to;
      }
    }

    if (!license) {
      return new Response(
        JSON.stringify({ valid: false, error: "Licença não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!license.is_active) {
      return new Response(
        JSON.stringify({ valid: false, error: "Licença inativa" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (license.plan_type === "monthly" && license.expires_at) {
      if (new Date(license.expires_at) < new Date()) {
        await supabase.from("licenses").update({ is_active: false }).eq("id", license.id);
        return new Response(
          JSON.stringify({ valid: false, error: "Licença expirada" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert leads
    const leadsToInsert = leads.map((lead: Record<string, any>) => ({
      license_id: license.id,
      name: (lead.name || lead.nome)?.trim() || null,
      email: (lead.email)?.trim() || null,
      instagram: (lead.instagram)?.trim() || null,
      phone: (lead.phone || lead.telefone || lead.phoneNumber)?.trim() || null,
      category: (lead.category || lead.categoria || lead.role)?.trim() || null,
      website: (lead.website || lead.site || lead.url || lead.link)?.trim() || null,
      linkedin: (lead.linkedin)?.trim() || null,
      notes: (lead.notes || lead.message || lead.mensagem || lead.nota)?.trim() || null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert(leadsToInsert)
      .select();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Erro ao salvar leads", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = (inserted || []).map((l: any) => l.id);

    // Auto-greeting for widget leads (fire-and-forget, don't block response)
    const isWidgetLead = leads.some((l: any) => 
      (l.category || l.categoria || l.role)?.trim()?.toLowerCase() === "widget"
    );

    if (isWidgetLead && userId && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
      // Run async without blocking the response
      (async () => {
        try {
          // Get user's WhatsApp instance
          const { data: instance } = await supabase
            .from("whatsapp_instances")
            .select("instance_name, status")
            .eq("user_id", userId)
            .maybeSingle();

          if (!instance || instance.status !== "connected") {
            console.log("No connected WhatsApp instance, skipping auto-greeting");
            return;
          }

          // Get user's display name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", userId)
            .single();

          // Send greeting to each widget lead with a phone
          for (const lead of leadsToInsert) {
            if (!lead.phone || lead.category?.toLowerCase() !== "widget") continue;

            const greeting = await generateGreeting(
              lead.name || "",
              lead.notes || null,
              profile?.display_name || null
            );

            if (greeting) {
              await sendWhatsApp(instance.instance_name, lead.phone, greeting);
              console.log(`Auto-greeting sent to widget lead: ${lead.name || lead.phone}`);
            }
          }
        } catch (e) {
          console.error("Auto-greeting background error:", e);
        }
      })();
    }

    return new Response(
      JSON.stringify({ success: true, count: inserted?.length || 0, ids }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
