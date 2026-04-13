import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPPORT_PHONE = "551153041013";
const SUPPORT_EMAIL = "appmarquei@gmail.com";
const SUPPORT_INSTANCE = "LeadsPro-Suporte";

function stripDataUrl(base64: string): string {
  if (base64.startsWith("data:")) {
    return base64.split(",")[1] || base64;
  }
  return base64;
}

function extractMimeType(base64: string): string {
  const match = base64.match(/^data:([^;]+);base64,/);
  return match?.[1] || "image/jpeg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, email, problem, image_base64 } = await req.json();
    if (!phone || !problem || !email) {
      return new Response(JSON.stringify({ error: "phone, email e problem são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile info
    const { data: profile } = await supabase
      .from("profiles").select("display_name, email").eq("user_id", user.id).maybeSingle();

    const { data: license } = await supabase
      .from("licenses").select("plan_type, expires_at").eq("assigned_to", user.id).eq("is_active", true).maybeSingle();

    const message = `🚨 *TICKET DE SUPORTE NÍVEL 2*\n\n👤 *Cliente:* ${profile?.display_name || "N/A"}\n📧 *Email:* ${email}\n📱 *Telefone:* ${phone}\n💼 *Plano:* ${license?.plan_type || "N/A"}\n\n📝 *Problema:*\n${problem}`;

    // Get any active instance to send from
    const { data: instances } = await supabase
      .from("whatsapp_instances")
      .select("instance_name")
      .eq("status", "connected")
      .limit(1);

    const instanceName = instances?.[0]?.instance_name || SUPPORT_INSTANCE;

    // Send text message
    const textRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: SUPPORT_PHONE, text: message }),
    });

    const textResult = await textRes.text();
    console.log("Ticket text sent:", textRes.status, textResult);

    if (!textRes.ok) {
      return new Response(JSON.stringify({ error: "Falha ao enviar ticket no WhatsApp" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send image if provided (base64)
    if (image_base64) {
      const strippedBase64 = stripDataUrl(image_base64);
      const mimetype = extractMimeType(image_base64);

      const imgRes = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: SUPPORT_PHONE,
          mediatype: "image",
          mimetype,
          media: strippedBase64,
          fileName: "ticket-erro.jpg",
          caption: "📎 Print do erro reportado pelo cliente",
        }),
      });

      const imgResult = await imgRes.text();
      console.log("Ticket image sent:", imgRes.status, imgResult);

      if (!imgRes.ok) {
        return new Response(JSON.stringify({ error: "Imagem do ticket não foi enviada", details: imgResult }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Send email notification to support
    if (RESEND_API_KEY) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LeadsPro Suporte <contato@leadspro.app>",
            to: [SUPPORT_EMAIL],
            subject: `🚨 Ticket de Suporte Nível 2 - ${profile?.display_name || email}`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#dc2626">🚨 Ticket de Suporte Nível 2</h2>
              <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
                <p><strong>👤 Cliente:</strong> ${profile?.display_name || "N/A"}</p>
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>📱 Telefone:</strong> ${phone}</p>
                <p><strong>💼 Plano:</strong> ${license?.plan_type || "N/A"}</p>
              </div>
              <h3>📝 Problema:</h3>
              <p style="background:#fff;padding:12px;border:1px solid #e5e7eb;border-radius:8px">${problem.replace(/\n/g, "<br>")}</p>
              ${image_base64 ? '<p style="color:#666;font-size:13px">📎 Uma imagem foi anexada e enviada via WhatsApp.</p>' : ''}
            </div>`,
          }),
        });
        const emailResult = await emailRes.json();
        console.log("Support email sent:", emailRes.status, JSON.stringify(emailResult));
      } catch (e) {
        console.error("Support email error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-support-ticket error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
