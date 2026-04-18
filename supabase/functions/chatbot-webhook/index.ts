import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function evoFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
      ...(options.headers || {}),
    },
  });
  return await res.json();
}

async function getAIResponse(systemPrompt: string, conversationHistory: { role: string; content: string }[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI error:", response.status, text);
    // Don't throw — a 429/5xx from OpenAI would otherwise abort the whole
    // webhook and Evolution API would keep retrying the message delivery.
    // Return a friendly fallback so the conversation keeps flowing and a
    // human can pick up via Atendimento Humano.
    const lowQuota =
      response.status === 429 || /insufficient_quota|quota|billing/i.test(text);
    return lowQuota
      ? "Oi! Nosso atendimento automático está temporariamente indisponível. Um atendente humano vai responder em breve. 🙏"
      : "Desculpe, estou com uma instabilidade aqui. Um atendente humano vai responder em breve.";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Desculpe, não consegui processar sua mensagem.";
}

async function sendWhatsAppMessage(instanceName: string, phone: string, message: string) {
  return await evoFetch(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });
}

async function sendWhatsAppMedia(instanceName: string, phone: string, mediaUrl: string, fileName: string, caption?: string) {
  return await evoFetch(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: phone,
      media: mediaUrl,
      fileName,
      mediatype: "document",
      caption: caption || "",
    }),
  });
}

async function sendSchedulingEmail(toEmail: string, schedulingLink: string, leadName?: string) {
  if (!RESEND_API_KEY || !toEmail || !schedulingLink) return null;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LeadsPro <contato@leadspro.app>",
        to: [toEmail],
        subject: "Link para agendar sua reunião",
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <h2 style="color:#7c3aed">Agende sua reunião</h2>
          <p>Olá${leadName ? ` ${leadName}` : ""}!</p>
          <p>Conforme conversamos, segue o link para agendar nossa reunião:</p>
          <a href="${schedulingLink}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Agendar Reunião</a>
          <p style="color:#666;font-size:14px">Ou copie o link: ${schedulingLink}</p>
        </div>`,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error("Email send error:", e);
    return null;
  }
}

async function fetchRecentMessages(instanceName: string, remoteJid: string, limit = 10) {
  try {
    const data = await evoFetch(`/chat/findMessages/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit,
      }),
    });
    if (Array.isArray(data)) return data;
    if (data?.messages && Array.isArray(data.messages)) return data.messages;
    if (data?.messages?.records && Array.isArray(data.messages.records)) return data.messages.records;
    console.log("fetchRecentMessages unexpected response:", JSON.stringify(data).substring(0, 500));
    return [];
  } catch (e) {
    console.error("fetchRecentMessages error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ── Authenticated actions (manage configs, toggle leads) ──
    if (action) {
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

      // Get user's license
      const { data: license } = await supabase
        .from("licenses")
        .select("id")
        .eq("assigned_to", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!license) {
        return new Response(JSON.stringify({ error: "Licença não encontrada" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET config ──
      if (action === "get-config" && req.method === "GET") {
        const { data: config } = await supabase
          .from("chatbot_configs")
          .select("*")
          .eq("license_id", license.id)
          .maybeSingle();

        return new Response(JSON.stringify({ config }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── SAVE config ──
      if (action === "save-config" && req.method === "POST") {
        const body = await req.json();
        const { name, system_prompt, is_active, scheduling_link, config_id } = body;

        if (config_id) {
          const { data, error } = await supabase
            .from("chatbot_configs")
            .update({ name, system_prompt, is_active, scheduling_link })
            .eq("id", config_id)
            .eq("license_id", license.id)
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ config: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { data, error } = await supabase
            .from("chatbot_configs")
            .insert({ license_id: license.id, name, system_prompt, is_active, scheduling_link })
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ config: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ── Toggle bot for a lead ──
      if (action === "toggle-lead" && req.method === "POST") {
        const { phone, activate, config_id } = await req.json();
        if (!phone || !config_id) {
          return new Response(JSON.stringify({ error: "phone e config_id são obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (activate) {
          const { data, error } = await supabase
            .from("chatbot_leads")
            .upsert(
              { config_id, lead_phone: phone, is_active: true },
              { onConflict: "config_id,lead_phone" }
            )
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify({ chatbot_lead: data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          await supabase
            .from("chatbot_leads")
            .update({ is_active: false })
            .eq("config_id", config_id)
            .eq("lead_phone", phone);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // ── List active chatbot leads ──
      if (action === "list-leads" && req.method === "GET") {
        const configId = url.searchParams.get("config_id");
        if (!configId) {
          return new Response(JSON.stringify({ error: "config_id obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data } = await supabase
          .from("chatbot_leads")
          .select("*")
          .eq("config_id", configId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ leads: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Toggle auto reply all ──
      if (action === "toggle-auto-reply" && req.method === "POST") {
        const { config_id, enabled } = await req.json();
        if (!config_id) {
          return new Response(JSON.stringify({ error: "config_id obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data, error } = await supabase
          .from("chatbot_configs")
          .update({ auto_reply_all: enabled })
          .eq("id", config_id)
          .eq("license_id", license.id)
          .select()
          .single();
        if (error) throw error;

        // When disabling auto_reply, also deactivate ALL individual chatbot leads
        if (!enabled) {
          await supabase
            .from("chatbot_leads")
            .update({ is_active: false })
            .eq("config_id", config_id);
        }

        return new Response(JSON.stringify({ config: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Test chat (simulate a conversation) ──
      if (action === "test-chat" && req.method === "POST") {
        const { message, history } = await req.json();
        if (!message) {
          return new Response(JSON.stringify({ error: "message é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: chatConfig } = await supabase
          .from("chatbot_configs")
          .select("*")
          .eq("license_id", license.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!chatConfig) {
          return new Response(JSON.stringify({ error: "Salve e ative a configuração primeiro" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let enhancedPrompt = chatConfig.system_prompt;
        if (chatConfig.scheduling_link) {
          enhancedPrompt += `\n\nQuando o lead quiser agendar, envie o link: ${chatConfig.scheduling_link}`;
        }

        const conversationHistory = [
          ...(history || []),
          { role: "user", content: message },
        ];

        // Stream response
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: enhancedPrompt },
              ...conversationHistory,
            ],
            temperature: 0.7,
            max_tokens: 500,
            stream: true,
          }),
        });

        if (!aiRes.ok) {
          const t = await aiRes.text();
          console.error("AI Gateway error:", aiRes.status, t);
          if (aiRes.status === 429) {
            return new Response(JSON.stringify({ error: "Limite de requisições atingido, tente novamente em alguns instantes." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(aiRes.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Webhook: incoming message from Evolution API ──
    const body = await req.json();
    const event = body?.event;
    
    if (event !== "messages.upsert") {
      return new Response(JSON.stringify({ ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = body?.data;
    if (!message || message.key?.fromMe) {
      return new Response(JSON.stringify({ ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteJid = message.key?.remoteJid || "";
    if (remoteJid.endsWith("@g.us")) {
      // Ignore group messages
      return new Response(JSON.stringify({ ignored: "group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
    const incomingText = message.message?.conversation ||
      message.message?.extendedTextMessage?.text || "";

    if (!incomingText.trim()) {
      return new Response(JSON.stringify({ ignored: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceName = body?.instance?.instanceName || body?.instance || "";

    // Find the user's whatsapp_instance
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("user_id, instance_name")
      .eq("instance_name", instanceName)
      .eq("status", "connected")
      .maybeSingle();

    if (!instance) {
      return new Response(JSON.stringify({ ignored: "no instance" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user's license
    const { data: license } = await supabase
      .from("licenses")
      .select("id")
      .eq("assigned_to", instance.user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!license) {
      return new Response(JSON.stringify({ ignored: "no license" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find chatbot config
    const { data: config } = await supabase
      .from("chatbot_configs")
      .select("*")
      .eq("license_id", license.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ ignored: "no config" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if auto_reply_all is enabled OR if this specific lead has the chatbot active
    let shouldReply = config.auto_reply_all === true;
    
    if (!shouldReply) {
      // Try matching by phone number OR by full remoteJid (for @lid contacts)
      const { data: chatbotLead } = await supabase
        .from("chatbot_leads")
        .select("*")
        .eq("config_id", config.id)
        .eq("is_active", true)
        .or(`lead_phone.eq.${phone},lead_phone.eq.${remoteJid}`)
        .maybeSingle();

      if (!chatbotLead) {
        return new Response(JSON.stringify({ ignored: "bot not active for this lead" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Chatbot replying to phone="${phone}" remoteJid="${remoteJid}" autoReplyAll=${shouldReply}`);

    // Fetch recent messages for context
    const recentMessages = await fetchRecentMessages(instanceName, remoteJid, 10);
    const conversationHistory: { role: string; content: string }[] = [];

    for (const msg of recentMessages) {
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      if (!text.trim()) continue;
      conversationHistory.push({
        role: msg.key?.fromMe ? "assistant" : "user",
        content: text,
      });
    }

    // Add the current message if not already in history
    if (conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].content !== incomingText) {
      conversationHistory.push({ role: "user", content: incomingText });
    }

    // Build enhanced system prompt with scheduling + file + handoff instructions
    let enhancedPrompt = config.system_prompt;

    // Add human handoff instructions
    enhancedPrompt += `\n\nTRANSFERÊNCIA PARA ATENDENTE HUMANO:
- Se o lead pedir para falar com um humano, atendente, pessoa real, gerente, supervisor ou demonstrar frustração extrema com o bot
- Responda de forma empática e inclua a tag [TRANSFERIR_HUMANO] no final da sua mensagem
- Exemplo: "Entendo! Vou te transferir para um dos nossos atendentes agora mesmo. Aguarde um instante que alguém da equipe vai te atender! 😊 [TRANSFERIR_HUMANO]"
- A tag será removida antes de enviar a mensagem
- Após incluir essa tag, NÃO continue respondendo, pois um humano irá assumir`;

    // Fetch available files for this config
    const { data: chatbotFiles } = await supabase
      .from("chatbot_files")
      .select("file_name, file_url")
      .eq("config_id", config.id);

    if (chatbotFiles && chatbotFiles.length > 0) {
      const fileList = chatbotFiles.map(f => `- "${f.file_name}"`).join("\n");
      enhancedPrompt += `\n\nARQUIVOS DISPONÍVEIS PARA ENVIO:
Você tem os seguintes arquivos que pode enviar ao lead:
${fileList}

INSTRUÇÕES DE ENVIO DE ARQUIVOS:
- Quando o lead pedir proposta comercial, catálogo, PDF, documento, material, apresentação ou qualquer arquivo disponível, responda normalmente e inclua a tag [ENVIAR_ARQUIVO:nome_exato_do_arquivo] no final da resposta.
- Exemplo: se o lead pedir "me manda a proposta", responda algo como "Claro! Segue nossa proposta comercial 📄 [ENVIAR_ARQUIVO:Proposta Comercial 2025.pdf]"
- Use o nome EXATO do arquivo como listado acima.
- A tag será removida da mensagem antes de enviar ao lead.
- Você pode enviar múltiplos arquivos usando múltiplas tags.`;
    }

    if (config.scheduling_link) {
      enhancedPrompt += `\n\nINSTRUÇÕES DE AGENDAMENTO:
- Quando o lead demonstrar interesse em agendar uma reunião/call/conversa, envie o link de agendamento: ${config.scheduling_link}
- Se o lead fornecer um e-mail durante a conversa, responda normalmente e inclua no final da sua mensagem a tag especial [ENVIAR_EMAIL:email_do_lead] para que o sistema envie o link por e-mail também.
- Exemplo: se o lead disser "meu email é joao@email.com", inclua [ENVIAR_EMAIL:joao@email.com] no final da resposta.
- A tag [ENVIAR_EMAIL:...] será removida antes de enviar a mensagem, então o lead não verá isso.`;
    }

    // Get AI response
    const aiResponse = await getAIResponse(enhancedPrompt, conversationHistory);

    // Process tags from AI response
    let cleanResponse = aiResponse;

    // Handle email tag
    const emailMatch = cleanResponse.match(/\[ENVIAR_EMAIL:([^\]]+)\]/);
    if (emailMatch && config.scheduling_link) {
      const leadEmail = emailMatch[1].trim();
      cleanResponse = cleanResponse.replace(/\[ENVIAR_EMAIL:[^\]]+\]/g, "").trim();

      const { data: leadData } = await supabase
        .from("leads")
        .select("name")
        .eq("phone", phone)
        .maybeSingle();

      await sendSchedulingEmail(leadEmail, config.scheduling_link, leadData?.name || undefined);
      console.log(`Scheduling email sent to ${leadEmail}`);
    }

    // Handle file tags
    const fileMatches = cleanResponse.matchAll(/\[ENVIAR_ARQUIVO:([^\]]+)\]/g);
    const filesToSend: { name: string; url: string }[] = [];
    for (const match of fileMatches) {
      const requestedName = match[1].trim();
      const found = chatbotFiles?.find(f => f.file_name === requestedName);
      if (found) {
        filesToSend.push({ name: found.file_name, url: found.file_url });
      }
    }
    cleanResponse = cleanResponse.replace(/\[ENVIAR_ARQUIVO:[^\]]+\]/g, "").trim();

    // Handle human handoff tag
    const handoffRequested = cleanResponse.includes("[TRANSFERIR_HUMANO]");
    cleanResponse = cleanResponse.replace(/\[TRANSFERIR_HUMANO\]/g, "").trim();

    // Send text via WhatsApp
    await sendWhatsAppMessage(instanceName, phone, cleanResponse);

    // Send files via WhatsApp
    for (const file of filesToSend) {
      await sendWhatsAppMedia(instanceName, phone, file.url, file.name);
      console.log(`File sent: ${file.name}`);
    }

    // Process human handoff
    if (handoffRequested) {
      // 1. Deactivate chatbot for this lead
      await supabase
        .from("chatbot_leads")
        .update({ is_active: false })
        .eq("config_id", config.id)
        .or(`lead_phone.eq.${phone},lead_phone.eq.${remoteJid}`);

      // 2. Get lead name from leads table
      const { data: leadData } = await supabase
        .from("leads")
        .select("name")
        .eq("license_id", license.id)
        .eq("phone", phone)
        .maybeSingle();

      // 3. Create handoff request
      await supabase
        .from("human_handoff_requests")
        .insert({
          license_id: license.id,
          lead_phone: phone,
          lead_name: leadData?.name || null,
          instance_name: instanceName,
          remote_jid: remoteJid,
          last_message: incomingText,
          status: "pending",
        });

      // 4. Get user profile for notifications
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email, display_name, whatsapp_phone")
        .eq("user_id", instance.user_id)
        .maybeSingle();

      // 5. Send email notification
      console.log("Handoff email check - RESEND_API_KEY exists:", !!RESEND_API_KEY, "email:", userProfile?.email);
      if (RESEND_API_KEY && userProfile?.email) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "LeadsPro <contato@leadspro.app>",
              to: [userProfile.email],
              subject: "🔔 Solicitação de atendimento humano - LeadsPro",
              html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
                <h2 style="color:#7c3aed">Atendimento Humano Solicitado</h2>
                <p>Olá ${userProfile.display_name || ""}!</p>
                <p>Um lead solicitou falar com um atendente humano:</p>
                <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
                  <p><strong>Telefone:</strong> ${phone}</p>
                  ${leadData?.name ? `<p><strong>Nome:</strong> ${leadData.name}</p>` : ""}
                  <p><strong>Última mensagem:</strong> ${incomingText}</p>
                </div>
                <p>Acesse o painel do LeadsPro na aba <strong>Atendimento Humano</strong> para responder.</p>
              </div>`,
            }),
          });
          const emailResult = await emailRes.json();
          console.log("Handoff email result:", emailRes.status, JSON.stringify(emailResult));
        } catch (e) {
          console.error("Handoff email error:", e);
        }
      } else {
        console.log("Handoff email skipped - missing RESEND_API_KEY or email");
      }

      // 6. Send WhatsApp notification to user's own number
      if (userProfile?.whatsapp_phone) {
        const notifMsg = `🔔 *Atendimento Humano Solicitado*\n\nUm lead pediu para falar com um atendente:\n\n📱 Telefone: ${phone}${leadData?.name ? `\n👤 Nome: ${leadData.name}` : ""}\n💬 Última msg: "${incomingText}"\n\nAcesse o LeadsPro > Atendimento Humano para responder.`;
        await sendWhatsAppMessage(instanceName, userProfile.whatsapp_phone, notifMsg);
        console.log("Handoff WhatsApp notification sent to", userProfile.whatsapp_phone);
      }
    }

    // Update messages count (upsert for auto_reply_all mode)
    if (!handoffRequested) {
      await supabase
        .from("chatbot_leads")
        .upsert(
          { config_id: config.id, lead_phone: phone, is_active: true, messages_count: 1 },
          { onConflict: "config_id,lead_phone" }
        );
    }

    return new Response(JSON.stringify({ success: true, response: cleanResponse, handoff: handoffRequested }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chatbot-webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
