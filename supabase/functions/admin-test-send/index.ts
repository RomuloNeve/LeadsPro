import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

async function generateWhatsAppVariations(baseMessage: string, count: number): Promise<string[]> {
  if (!OPENAI_API_KEY || count <= 1) return [];

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
            content: `Reescreva mensagens de WhatsApp mantendo EXATAMENTE o mesmo sentido e informações. Gere ${count} variações bem diferentes na estrutura. Retorne SOMENTE as variações separadas por "---".`,
          },
          {
            role: "user",
            content: `Gere ${count} variações desta mensagem:\n\n${baseMessage}`,
          },
        ],
        temperature: 0.9,
        max_tokens: count * 500,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return [];

    return text
      .split("---")
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 10)
      .slice(0, count);
  } catch {
    return [];
  }
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

    // Check admin or lifetime user
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("is_admin, display_name, email, whatsapp_phone")
      .eq("user_id", user.id)
      .single();

    // Check if user has a lifetime license
    const { data: userLicense } = await serviceClient
      .from("licenses")
      .select("plan_type")
      .eq("assigned_to", user.id)
      .maybeSingle();

    const isLifetime = userLicense?.plan_type === "lifetime" && user.id === "fb82d9ab-3cfb-492d-b96e-32cd0fcfd94b";

    const { type, message, subject, body, planFilter, dryRun } = await req.json();

    // Non-admin: only Floriano (lifetime) can do dryRun
    if (!profile?.is_admin && !(isLifetime && dryRun)) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ BULK WHATSAPP TO USERS ============
    if (type === "bulk-whatsapp") {
      // Use the admin's own connected WhatsApp instance
      const { data: instance } = await serviceClient
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", user.id)
        .eq("status", "connected")
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: "Sua instância WhatsApp não está conectada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const instanceName = instance.instance_name;

      // Get users with whatsapp_phone based on plan filter
      let query = serviceClient
        .from("profiles")
        .select("user_id, email, whatsapp_phone, display_name")
        .not("whatsapp_phone", "is", null)
        .neq("whatsapp_phone", "")
        .eq("is_admin", false);

      const { data: profilesData } = await query;
      let targetProfiles = profilesData || [];

      // Filter by plan type if specified
      if (planFilter && planFilter !== "all") {
        const { data: licensesData } = await serviceClient
          .from("licenses")
          .select("assigned_to, plan_type, is_active, expires_at");

        const licenseMap = new Map<string, any>();
        for (const l of (licensesData || [])) {
          if (l.assigned_to) licenseMap.set(l.assigned_to, l);
        }

        targetProfiles = targetProfiles.filter(p => {
          const lic = licenseMap.get(p.user_id);
          if (planFilter === "sem-licenca") return !lic;
          if (planFilter === "expirados") {
            if (!lic) return false;
            if (lic.plan_type !== "free") return false;
            if (!lic.expires_at) return false;
            return new Date(lic.expires_at) < new Date();
          }
          return lic?.plan_type === planFilter;
        });
      }

      if (targetProfiles.length === 0) {
        return new Response(
          JSON.stringify({ error: "Nenhum usuário encontrado com WhatsApp para esse filtro." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Dry run - just return the list
      if (dryRun) {
        return new Response(
          JSON.stringify({
            dryRun: true,
            totalUsers: targetProfiles.length,
            users: targetProfiles.map(p => ({
              email: p.email,
              phone: p.whatsapp_phone,
              name: p.display_name,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contacts = targetProfiles.map(p => ({
        phone: p.whatsapp_phone!.replace(/\D/g, ""),
        name: p.display_name || p.email?.split("@")[0] || "",
        email: p.email || "",
      }));

      // Generate AI variations
      const baseMsg = message || "Olá! Teste do admin";
      let messageVariants = await generateWhatsAppVariations(baseMsg, Math.min(contacts.length, 8));
      if (messageVariants.length === 0) messageVariants = [baseMsg];

      let sent = 0;
      let errors = 0;
      const results: string[] = [];
      let emailsSent = 0;

      // Send email to all contacts with email (in parallel, before WhatsApp)
      if (RESEND_API_KEY && (subject || body)) {
        const userEmail = profile.email || user.email || "";
        const userName = profile.display_name || userEmail.split("@")[0] || "Admin";
        const fromAddress = `${userName} via LeadsPro <contato@leadspro.app>`;
        const emailSubject = subject || "Novidade do LeadsPro";
        const emailBody = body || baseMsg;

        const htmlBody = emailBody
          .split("\n")
          .map((line: string) => `<p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:15px;color:#333;">${line || "&nbsp;"}</p>`)
          .join("");

        for (const c of contacts) {
          if (!c.email || !c.email.includes("@")) continue;
          try {
            const personalizedBody = htmlBody.replace(/\{nome\}/gi, c.name || "");
            const personalizedSubject = emailSubject.replace(/\{nome\}/gi, c.name || "");
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: fromAddress,
                reply_to: userEmail,
                to: [c.email],
                subject: personalizedSubject,
                html: personalizedBody,
              }),
            });
            if (res.status >= 200 && res.status < 300) {
              emailsSent++;
              results.push(`✉️ ${c.email}`);
            }
          } catch { /* ignore email errors */ }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      for (let i = 0; i < contacts.length; i++) {
        const { phone, name } = contacts[i];
        let textToSend = messageVariants[i % messageVariants.length] || baseMsg;
        textToSend = textToSend.replace(/\{nome\}/gi, name || "");

        try {
          const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text: textToSend }),
          });
          const data = await res.json();
          if (res.status >= 200 && res.status < 300) {
            sent++;
            results.push(`✅ ${phone} (${name})`);
          } else {
            errors++;
            results.push(`❌ ${phone} (${name}): ${JSON.stringify(data).substring(0, 80)}`);
          }
        } catch (e) {
          errors++;
          results.push(`❌ ${phone} (${name}): ${(e as Error).message}`);
        }

        // Anti-ban delay: 8-20s between messages
        if (i < contacts.length - 1) {
          const delayMs = (8 + Math.floor(Math.random() * 13)) * 1000;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent, errors, emailsSent, results, total: contacts.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ WHATSAPP TEST ============
    if (type === "whatsapp") {
      const phones = ["551153041013"];

      // Get admin's whatsapp instance
      const { data: instance } = await serviceClient
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!instance || instance.status !== "connected") {
        return new Response(
          JSON.stringify({ error: "Sua instância WhatsApp não está conectada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const whatsappPhone = profile.whatsapp_phone || "";
      const whatsappLink = whatsappPhone ? `https://wa.me/${whatsappPhone.replace(/\D/g, "")}` : "";
      const fullMessage = `${message || "Mensagem de teste do painel admin"}\n\n${whatsappLink ? `Entre em contato:\n${whatsappLink}` : ""}`;

      let messageVariants = await generateWhatsAppVariations(fullMessage, phones.length);
      if (messageVariants.length < phones.length) {
        const fallback = [
          fullMessage,
          fullMessage
            .replace("Olá", "Oi")
            .replace("Ola", "Oi")
            .replace("Tudo bem?", "Como você está?")
            .replace("tudo bem?", "como você está?"),
        ];
        messageVariants = [...messageVariants, ...fallback].slice(0, phones.length);
      }

      let sent = 0;
      let errors = 0;
      const results: string[] = [];

      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i];
        const textToSend = messageVariants[i] || fullMessage;

        try {
          const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text: textToSend }),
          });
          const data = await res.json();
          if (res.status >= 200 && res.status < 300) {
            sent++;
            results.push(`✅ ${phone} (variação ${i + 1})`);
          } else {
            errors++;
            results.push(`❌ ${phone}: ${JSON.stringify(data).substring(0, 100)}`);
          }
        } catch (e) {
          errors++;
          results.push(`❌ ${phone}: ${(e as Error).message}`);
        }

        if (i < phones.length - 1) {
          const delayMs = (3 + Math.floor(Math.random() * 6)) * 1000;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent, errors, results, variations_applied: messageVariants.length > 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ EMAIL TEST ============
    if (type === "email") {
      const emails = ["lucassilvasimoes23@gmail.com", "appmarquei@gmail.com", "l.florianom@hotmail.com"];

      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurada" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userEmail = profile.email || user.email || "";
      const userName = profile.display_name || userEmail.split("@")[0] || "Admin";
      const fromAddress = `${userName} via LeadsPro <contato@leadspro.app>`;
      const emailSubject = subject || "Teste de email - LeadsPro Admin";
      const emailBody = body || "Este é um email de teste enviado pelo painel administrativo do LeadsPro.";

      const htmlBody = emailBody
        .split("\n")
        .map((line: string) => `<p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:15px;color:#333;">${line || "&nbsp;"}</p>`)
        .join("");

      let sent = 0;
      let errors = 0;
      const results: string[] = [];

      for (const to of emails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: fromAddress,
              reply_to: userEmail,
              to: [to],
              subject: emailSubject,
              html: htmlBody,
            }),
          });

          const data = await res.json();
          if (res.status >= 200 && res.status < 300) {
            sent++;
            results.push(`✅ ${to}`);
          } else {
            errors++;
            results.push(`❌ ${to}: ${JSON.stringify(data).substring(0, 100)}`);
          }
        } catch (e) {
          errors++;
          results.push(`❌ ${to}: ${(e as Error).message}`);
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      return new Response(
        JSON.stringify({ success: true, sent, errors, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Tipo inválido. Use 'whatsapp', 'email' ou 'bulk-whatsapp'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-test-send:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
