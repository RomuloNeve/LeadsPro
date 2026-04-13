import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

async function sendEmail(from: string, replyTo: string, to: string, subject: string, htmlBody: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [to],
      subject,
      html: htmlBody,
    }),
  });

  const data = await res.json();
  return { success: res.status >= 200 && res.status < 300, data };
}

function textToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:15px;color:#333;">${line || "&nbsp;"}</p>`)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get campaign
    const { data: campaign, error: campError } = await serviceClient
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for display name and email
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", user.id)
      .single();

    const userEmail = profile?.email || user.email || "";
    const userName = profile?.display_name || userEmail.split("@")[0] || "Usuário";

    // From address: "Nome via LeadsPro" <contato@leadspro.app>
    const fromAddress = `${userName} via LeadsPro <contato@leadspro.app>`;

    // Get target leads with email
    let validLeads: any[] = [];

    if (campaign.category_filter === "expired_users") {
      // Fetch expired trial users with emails from profiles
      const { data: profilesData } = await serviceClient
        .from("profiles")
        .select("user_id, email, display_name")
        .not("email", "is", null)
        .neq("email", "")
        .eq("is_admin", false);

      const { data: licensesData } = await serviceClient
        .from("licenses")
        .select("assigned_to, plan_type, expires_at");

      const licenseMap = new Map<string, any>();
      for (const l of (licensesData || [])) {
        if (l.assigned_to) licenseMap.set(l.assigned_to, l);
      }

      validLeads = (profilesData || [])
        .filter((p: any) => {
          const lic = licenseMap.get(p.user_id);
          if (!lic || lic.plan_type !== "free" || !lic.expires_at) return false;
          return new Date(lic.expires_at) < new Date();
        })
        .filter((p: any) => p.email && p.email.includes("@"))
        .map((p: any) => ({
          id: p.user_id,
          name: p.display_name || p.email?.split("@")[0] || "",
          email: p.email,
        }));
    } else {
      let query = serviceClient
        .from("leads")
        .select("id, name, email")
        .eq("license_id", campaign.license_id)
        .eq("is_duplicate", false)
        .not("email", "is", null)
        .neq("email", "")
        .neq("email", "Não encontrado");

      if (campaign.category_filter && campaign.category_filter !== "all") {
        query = query.eq("category", campaign.category_filter);
      }

      const { data: leads } = await query;
      validLeads = (leads || []).filter((l: any) => l.email && l.email.includes("@"));
    }

    if (validLeads.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum lead com email válido encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to sending
    await serviceClient
      .from("email_campaigns")
      .update({ status: "sending", total_leads: validLeads.length })
      .eq("id", campaign_id);

    const htmlBody = textToHtml(campaign.body);
    let sentCount = 0;
    let errors = 0;

    for (const lead of validLeads) {
      try {
        const result = await sendEmail(fromAddress, userEmail, lead.email, campaign.subject, htmlBody);
        if (result.success) {
          sentCount++;
        } else {
          errors++;
          console.error(`Failed to send to ${lead.email}:`, JSON.stringify(result.data));
        }
      } catch (e) {
        errors++;
        console.error(`Error sending to ${lead.email}:`, e.message);
      }

      // Rate limit: ~2 emails per second
      await new Promise((r) => setTimeout(r, 500));
    }

    // Update campaign as sent
    await serviceClient
      .from("email_campaigns")
      .update({ status: "sent", sent_count: sentCount })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, errors, total: validLeads.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email-campaign:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
