import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

// === Anti-Ban Configuration ===
// Delays between leads: 60-180s (1-3 min) — must match marketing promise of "30-300s between messages"
const MIN_DELAY_BETWEEN_LEADS_MS = 60_000;
const MAX_DELAY_BETWEEN_LEADS_MS = 180_000;
// Daily limit per user — base max (adjusted by warm-up below)
const DAILY_MESSAGE_LIMIT = 150;
// Safe sending hours (24h format, in server timezone)
const SAFE_HOUR_START = 8;
const SAFE_HOUR_END = 21; // exclusive — i.e., up to 20:59:59
// Max leads per single edge function call — MUST be 1 to avoid timeout.
// Each send + AI variation takes 5-15s, and the edge runtime limit is 150s.
// The inter-message delay (60-180s anti-ban) happens CLIENT-SIDE between calls.
const MAX_LEADS_PER_CALL = 1;

// === Warm-up system ===
// New numbers get banned easily. Gradually increase the daily limit.
function getWarmupLimit(instanceCreatedAt: string): number {
  const created = new Date(instanceCreatedAt);
  const now = new Date();
  const daysConnected = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  if (daysConnected <= 3) return 30;     // Day 0-3: max 30/day
  if (daysConnected <= 7) return 60;     // Day 4-7: max 60/day
  if (daysConnected <= 14) return 100;   // Day 8-14: max 100/day
  return DAILY_MESSAGE_LIMIT;            // Day 15+: full 150/day
}

async function sendViaEvolution(instanceName: string, phone: string, message: string, imageUrl?: string | null, audioUrl?: string | null) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return { success: false, error: "no phone" };

  try {
    // If audio, send audio first then text separately
    if (audioUrl) {
      const audioRes = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: cleanPhone, audio: audioUrl }),
      });
      console.log(`send audio ${cleanPhone}: status=${audioRes.status}`);
      if (audioRes.status < 200 || audioRes.status >= 300) {
        const data = await audioRes.json();
        return { success: false, data };
      }
      // Send text message after audio
      if (message.trim()) {
        // Delay entre áudio e texto (5-12s) para parecer humano
        const audioTextDelay = (5 + Math.floor(Math.random() * 8)) * 1000;
        console.log(`Waiting ${Math.round(audioTextDelay / 1000)}s between audio and text...`);
        await new Promise((r) => setTimeout(r, audioTextDelay));
        const textRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: cleanPhone, text: message }),
        });
        const data = await textRes.json();
        return { success: textRes.status >= 200 && textRes.status < 300, data };
      }
      return { success: true, data: {} };
    }

    const endpoint = imageUrl
      ? `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`
      : `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;

    const body = imageUrl
      ? { number: cleanPhone, mediatype: "image", media: imageUrl, caption: message }
      : { number: cleanPhone, text: message };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`send ${cleanPhone}: status=${res.status}`);
    return { success: res.status >= 200 && res.status < 300, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function generateVariations(originalMessage: string, count: number): Promise<{ variations: string[]; error?: string }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set! Variations will NOT work.");
    return { variations: [], error: "OPENAI_API_KEY não configurada" };
  }

  console.log(`Generating ${count} variations for message (${originalMessage.length} chars)...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um humanizador de mensagens de WhatsApp. Sua tarefa é criar variações QUASE IDÊNTICAS ao original, mudando apenas 1-2 palavras por frase para evitar detecção de spam.

REGRAS ABSOLUTAS (violar qualquer uma = resposta inválida):
1. COPIE o texto original e mude APENAS 1-2 palavras por frase (sinônimos diretos)
2. NUNCA mude a estrutura das frases
3. NUNCA adicione ou remova frases, saudações, despedidas ou parágrafos
4. NUNCA adicione emojis, sinais (*, #, ~, etc.) ou pontuação que não existem no original
5. NUNCA remova emojis ou formatação que existem no original
6. NUNCA corrija erros de português — copie os erros exatamente como estão
7. NUNCA mude links, URLs, números de telefone, preços ou dados
8. NUNCA mude nomes próprios, marcas ou palavras em inglês
9. Cada variação deve ter entre 90% e 110% do tamanho do original
10. O leitor NÃO deve perceber que é uma variação — deve parecer a mesma mensagem

EXEMPLO:
Original: "Oi tudo bem? To vendendo uns doces caseiros, tem brigadeiro por 3 reais e beijinho por 2,50. Me chama se quiser!"
Variação OK: "Oi tudo bem? Estou vendendo uns doces caseiros, tem brigadeiro por 3 reais e beijinho por 2,50. Me chama se tiver interesse!"
Variação OK: "Oi tudo bem? To vendendo doces caseiros, tem brigadeiro por 3 reais e beijinho por 2,50. Me manda msg se quiser!"
Variação RUIM: "Olá! 🍬 Está tudo bem? Estou comercializando doces artesanais..." (mudou demais, adicionou emoji, mudou tom)

Gere EXATAMENTE ${count} variações.
Separe cada variação com: %%%SPLIT%%%
NÃO numere. NÃO explique. Apenas as variações separadas por %%%SPLIT%%%`,
          },
          { role: "user", content: originalMessage },
        ],
        temperature: 0.4,
        max_tokens: count * 400,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI variation error:", response.status, errText);
      return { variations: [], error: `OpenAI erro ${response.status}: ${errText.substring(0, 150)}` };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error("AI returned empty content");
      return { variations: [], error: "OpenAI retornou resposta vazia" };
    }

    // Split by our custom delimiter (tolerant: 2-4 % signs on each side)
    let variations = text.split(/%%+SPLIT%%+/).map((v: string) => v.trim()).filter((v: string) => v.length > 10);

    // Fallback: try splitting by "---" or double newlines if custom delimiter wasn't used
    if (variations.length <= 1) {
      variations = text.split(/\n{2,}|---/).map((v: string) => v.trim()).filter((v: string) => v.length > 10);
    }

    // === POST-GENERATION VALIDATION ===
    const origLen = originalMessage.length;
    const maxLen = origLen * 1.5; // max 50% longer
    const minLen = origLen * 0.5; // min 50% of original

    // Analyze original characteristics
    const origLines = originalMessage.split("\n").length;
    const origWords = originalMessage.split(/\s+/).length;

    variations = variations.filter((v: string) => {
      // 1. Size check
      if (v.length > maxLen || v.length < minLen) {
        console.log(`REJECTED (size): ${v.length} chars, orig=${origLen}`);
        return false;
      }

      // 2. Line count check (should not add/remove many paragraphs)
      const vLines = v.split("\n").length;
      if (Math.abs(vLines - origLines) > 3) {
        console.log(`REJECTED (lines): ${vLines} lines, orig=${origLines}`);
        return false;
      }

      // 3. Word count check
      const vWords = v.split(/\s+/).length;
      if (vWords > origWords * 1.5 || vWords < origWords * 0.5) {
        console.log(`REJECTED (words): ${vWords} words, orig=${origWords}`);
        return false;
      }

      // 4. Reject if it looks like the AI added labels/numbering
      if (/^(variação|versão|opção|\d+[\.\)\-])\s/i.test(v)) {
        console.log(`REJECTED (has label/numbering)`);
        return false;
      }

      // 5. Reject if links/URLs in original were changed or removed
      const origUrls = originalMessage.match(/https?:\/\/\S+/g) || [];
      for (const url of origUrls) {
        if (!v.includes(url)) {
          console.log(`REJECTED (URL changed/removed): ${url}`);
          return false;
        }
      }

      // 6. Reject if phone numbers in original were changed
      const origPhones = originalMessage.match(/\(\d{2}\)\s?\d{4,5}[-\s]?\d{4}|\d{10,13}/g) || [];
      for (const phone of origPhones) {
        if (!v.includes(phone)) {
          console.log(`REJECTED (phone changed): ${phone}`);
          return false;
        }
      }

      return true;
    });

    if (variations.length === 0) {
      console.error("All variations rejected by strict filters — using original message");
      return { variations: [], error: "Todas as variações foram rejeitadas pelos filtros de qualidade" };
    }

    console.log(`APPROVED ${variations.length}/${text.split("%%%SPLIT%%%").length} variations (orig: ${origLen} chars)`);
    return { variations };
  } catch (e) {
    console.error("AI variation fetch error:", e.message);
    return { variations: [], error: `Erro de conexão com OpenAI: ${e.message}` };
  }
}

function hasAnyLink(text: string): boolean {
  return /(https?:\/\/|wa\.me\/)/i.test(text);
}

function stripUnexpectedLinks(message: string, allowLinks: boolean): string {
  if (allowLinks) return message.trim();

  return message
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/wa\.me\/\S+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado", code: "UNAUTHORIZED" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado", code: "UNAUTHORIZED" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let campaign_id: string | undefined;
    let test_mode: boolean | undefined;
    try {
      const body = await req.json();
      campaign_id = body.campaign_id;
      test_mode = body.test_mode;
    } catch (parseErr) {
      console.error("Body parse error:", parseErr);
      return new Response(JSON.stringify({ error: "Corpo da requisição inválido", code: "PARSE_ERROR" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id é obrigatório", code: "VALIDATION_ERROR" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign, error: campError } = await supabase
      .from("campaigns").select("*").eq("id", campaign_id).single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada", code: "NOT_FOUND" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get user's whatsapp instance
    const { data: instance } = await serviceClient
      .from("whatsapp_instances")
      .select("instance_name, status, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!instance || instance.status !== "connected") {
      return new Response(
        JSON.stringify({ error: "Sua instância WhatsApp não está conectada.", code: "INSTANCE_NOT_CONNECTED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ANTI-BAN: Block sending outside safe hours (8h-21h) ===
    if (!test_mode) {
      const now = new Date();
      // Use São Paulo timezone (BRT, UTC-3) since the app is BR-focused
      const spFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo",
        hour: "numeric",
        hour12: false,
      });
      const currentHourSP = parseInt(spFormatter.format(now), 10);
      if (currentHourSP < SAFE_HOUR_START || currentHourSP >= SAFE_HOUR_END) {
        return new Response(
          JSON.stringify({
            error: `Fora do horário seguro de envio (${SAFE_HOUR_START}h-${SAFE_HOUR_END}h). Aguarde até ${SAFE_HOUR_START}h para disparar novamente. Disparar fora desse horário aumenta significativamente o risco de ban.`,
            code: "OUTSIDE_SAFE_HOURS",
            safe_hours: `${SAFE_HOUR_START}h-${SAFE_HOUR_END}h`,
            current_hour_sp: currentHourSP,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === ANTI-BAN: Check daily message limit (with warm-up) ===
    let dailySent = 0;
    let dailyLimit = instance.created_at
      ? getWarmupLimit(instance.created_at)
      : DAILY_MESSAGE_LIMIT;
    if (!test_mode) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const { count: sentToday } = await serviceClient
        .from("campaign_sent_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", todayStart.toISOString())
        // Filter by user via campaigns table
        .in("campaign_id", (
          await serviceClient
            .from("campaigns")
            .select("id")
            .eq("license_id", campaign.license_id)
        ).data?.map((c: any) => c.id) || []);

      dailySent = sentToday || 0;
      const remaining = Math.max(0, dailyLimit - dailySent);
      console.log(`Daily limit check: ${dailySent}/${dailyLimit} sent today, ${remaining} remaining`);

      if (dailySent >= dailyLimit) {
        const isWarmup = dailyLimit < DAILY_MESSAGE_LIMIT;
        const warmupMsg = isWarmup
          ? ` Seu número está em período de aquecimento (limite atual: ${dailyLimit}/dia). O limite aumenta automaticamente com o tempo até ${DAILY_MESSAGE_LIMIT}/dia.`
          : "";
        return new Response(
          JSON.stringify({
            error: `Limite diário atingido: você já enviou ${dailySent} mensagens hoje. O limite é ${dailyLimit}/dia para proteger seu número de ban.${warmupMsg} Tente novamente amanhã.`,
            code: "DAILY_LIMIT_REACHED",
            daily_sent: dailySent,
            daily_limit: dailyLimit,
            max_limit: DAILY_MESSAGE_LIMIT,
            is_warmup: isWarmup,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === Cleanup stale "sending" locks (older than 2 minutes) ===
    // If a previous call crashed/timed out, leads stay locked as "sending" forever.
    // This unblocks them so they can be retried.
    if (!test_mode) {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: staleRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("id")
        .eq("campaign_id", campaign_id)
        .eq("status", "sending")
        .lt("created_at", twoMinAgo);

      if (staleRows && staleRows.length > 0) {
        console.log(`Cleaning ${staleRows.length} stale "sending" locks (>2min old)`);
        await serviceClient
          .from("campaign_sent_leads")
          .delete()
          .in("id", staleRows.map((r: any) => r.id));
      }
    }

    // Fetch target leads
    let leads: any[] = [];
    if (test_mode) {
      leads = [
        { id: "test1", name: "Teste 1", phone: "5527998133374" },
        { id: "test2", name: "Teste 2", phone: "5527996922875" },
      ];
    } else if (campaign.target_filter && (campaign.target_filter as any).expired_users) {
      // Fetch expired trial users from profiles/licenses
      const { data: profilesData } = await serviceClient
        .from("profiles")
        .select("user_id, email, whatsapp_phone, display_name")
        .not("whatsapp_phone", "is", null)
        .neq("whatsapp_phone", "")
        .eq("is_admin", false);

      const { data: licensesData } = await serviceClient
        .from("licenses")
        .select("assigned_to, plan_type, is_active, expires_at");

      const licenseMap = new Map<string, any>();
      for (const l of (licensesData || [])) {
        if (l.assigned_to) licenseMap.set(l.assigned_to, l);
      }

      const expiredProfiles = (profilesData || []).filter((p: any) => {
        const lic = licenseMap.get(p.user_id);
        if (!lic || lic.plan_type !== "free" || !lic.expires_at) return false;
        return new Date(lic.expires_at) < new Date();
      });

      // Convert profiles to lead-like objects
      leads = expiredProfiles.map((p: any, idx: number) => ({
        id: `expired_${idx}`,
        name: p.display_name || p.email?.split("@")[0] || "",
        phone: p.whatsapp_phone,
      }));

      // Get already sent phones for this campaign to prevent duplicates (only final statuses)
      const { data: sentRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("lead_id, status")
        .eq("campaign_id", campaign_id)
        .in("status", ["sent", "failed", "skipped"]);
      const sentIds = new Set((sentRows || []).map((r: any) => r.lead_id));
      leads = leads.filter((l: any) => !sentIds.has(l.id));
    } else {
      // Get leads NOT already sent for this campaign
      let query = serviceClient.from("leads").select("*")
        .eq("license_id", campaign.license_id).eq("is_duplicate", false);

      if (campaign.target_filter && (campaign.target_filter as any).category) {
        query = query.eq("category", (campaign.target_filter as any).category);
      }
      const { data: allLeads } = await query;

      // If filtering by list, get lead IDs from that list
      let listLeadIds: Set<string> | null = null;
      if (campaign.target_filter && (campaign.target_filter as any).list_id) {
        const { data: listItems } = await serviceClient
          .from("lead_list_items")
          .select("lead_id")
          .eq("list_id", (campaign.target_filter as any).list_id);
        listLeadIds = new Set((listItems || []).map((r: any) => r.lead_id));
      }

      let filteredLeads = allLeads || [];
      if (listLeadIds) {
        filteredLeads = filteredLeads.filter((l: any) => listLeadIds!.has(l.id));
      }

      // Get already processed lead IDs — only exclude leads that should NOT be retried.
      // "sending" = transient lock (cleaned above), "failed" with temporary errors = retryable.
      // Only permanently exclude: "sent", "skipped", and "failed" with permanent errors.
      const { data: sentRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("lead_id, status, error_reason")
        .eq("campaign_id", campaign_id)
        .in("status", ["sent", "failed", "skipped"]);

      const permanentFailReasons = ["Número não existe no WhatsApp", "Número inválido (blacklist)", "Sem número de telefone"];
      const sentIds = new Set(
        (sentRows || [])
          .filter((r: any) => {
            if (r.status === "sent" || r.status === "skipped") return true;
            if (r.status === "failed") {
              return permanentFailReasons.some((reason) => (r.error_reason || "").includes(reason));
            }
            return false;
          })
          .map((r: any) => r.lead_id)
      );

      // Delete retryable "failed" entries so they can be re-processed cleanly
      const retryableRows = (sentRows || []).filter((r: any) =>
        r.status === "failed" && !permanentFailReasons.some((reason) => (r.error_reason || "").includes(reason))
      );
      if (retryableRows.length > 0) {
        console.log(`Clearing ${retryableRows.length} retryable failed entries for re-send`);
        await serviceClient
          .from("campaign_sent_leads")
          .delete()
          .eq("campaign_id", campaign_id)
          .in("lead_id", retryableRows.map((r: any) => r.lead_id));
      }

      leads = filteredLeads.filter((l: any) => !sentIds.has(l.id));

      // Do NOT slice by batch_size here — the frontend controls the batch count
      // via its own loop counter. We need the full unsent list to compute has_more accurately.
    }

    // === ANTI-BAN: Filter out known invalid numbers BEFORE selecting leads ===
    if (!test_mode && leads.length > 0) {
      const { data: invalidRows } = await serviceClient
        .from("invalid_numbers")
        .select("phone")
        .eq("user_id", user.id);

      const invalidPhones = new Set(
        (invalidRows || []).map((r: any) => (r.phone || "").replace(/\D/g, ""))
      );

      if (invalidPhones.size > 0) {
        const invalidLeads = leads.filter((l: any) => {
          const cleanPhone = (l.phone || "").replace(/\D/g, "");
          return invalidPhones.has(cleanPhone);
        });
        leads = leads.filter((l: any) => {
          const cleanPhone = (l.phone || "").replace(/\D/g, "");
          return !invalidPhones.has(cleanPhone);
        });

        // Mark invalid leads as "skipped" so they are not re-fetched on the next call
        if (invalidLeads.length > 0) {
          console.log(`Pre-filtered ${invalidLeads.length} leads with known invalid numbers — marking as skipped`);
          const skipInserts = invalidLeads
            .filter((l: any) => l.id && !l.id.startsWith("expired_"))
            .map((l: any) => ({
              campaign_id,
              lead_id: l.id,
              status: "skipped",
              error_reason: "Número inválido (blacklist)",
            }));
          if (skipInserts.length > 0) {
            await serviceClient
              .from("campaign_sent_leads")
              .upsert(skipInserts, { onConflict: "campaign_id,lead_id", ignoreDuplicates: true });
          }
        }
      }
    }

    // Total unsent leads BEFORE sending (used for has_more)
    const totalRemaining = leads.length;

    // Now limit to MAX_LEADS_PER_CALL for THIS single execution
    const leadsThisCall = leads.slice(0, test_mode ? leads.length : MAX_LEADS_PER_CALL);

    // === ANTI-BAN: Cap leadsThisCall by remaining daily quota ===
    if (!test_mode && dailyLimit > 0) {
      const remaining = Math.max(0, dailyLimit - dailySent);
      if (leadsThisCall.length > remaining) {
        console.log(`Capping leads from ${leadsThisCall.length} to ${remaining} (daily limit)`);
        leadsThisCall.length = remaining;
      }
    }

    if (leadsThisCall.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Todos os leads já foram enviados!",
          leads_count: 0,
          errors: 0,
          failed_leads: [],
          all_sent: true,
          has_more: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LOCK: Prevent concurrent calls from processing the same leads
    // Pre-register all leads as "sending" BEFORE actually sending, to prevent race conditions
    if (!test_mode) {
      const preInserts = leadsThisCall
        .filter((l: any) => l.id)
        .map((l: any) => ({
          campaign_id,
          lead_id: l.id,
          status: "sending",
        }));
      
      if (preInserts.length > 0) {
        const { error: lockError } = await serviceClient
          .from("campaign_sent_leads")
          .upsert(preInserts, { onConflict: "campaign_id,lead_id", ignoreDuplicates: true });
        
        if (lockError) {
          console.error("Lock error:", lockError);
        }
      }

      // Re-check which leads are actually ours to send (weren't already locked by another call)
      const { data: lockedRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("lead_id, status")
        .eq("campaign_id", campaign_id)
        .in("lead_id", leadsThisCall.filter((l: any) => l.id).map((l: any) => l.id));

      const myLeadIds = new Set(
        (lockedRows || [])
          .filter((r: any) => r.status === "sending")
          .map((r: any) => r.lead_id)
      );

      // Remove leads that were already sent or locked by another concurrent call
      const filteredLeads = leadsThisCall.filter((l: any) => !l.id || myLeadIds.has(l.id));
      leadsThisCall.length = 0;
      leadsThisCall.push(...filteredLeads);

      if (leadsThisCall.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "Leads já sendo processados por outra chamada", leads_count: 0, errors: 0, failed_leads: [], all_sent: false, has_more: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use the user's message template as-is (no forced links)
    const baseMessage = campaign.message_template;
    const allowLinksInMessage = hasAnyLink(baseMessage);

    const variationCount = Math.max(leadsThisCall.length, 12);
    const variationResult = await generateVariations(baseMessage, variationCount);
    const variations = variationResult.variations;
    const variationWarning = variations.length === 0
      ? `Variação por IA indisponível: ${variationResult.error || "erro desconhecido"}. Mensagens enviadas com texto original.`
      : null;
    console.log(`Variations ready: ${variations.length} for ${leadsThisCall.length} leads`);

    let sentCount = 0;
    let errorCount = 0;
    const failedLeads: Array<{ name: string | null; phone: string | null; reason: string }> = [];

    for (let i = 0; i < leadsThisCall.length; i++) {
      const lead = leadsThisCall[i];
      if (!lead.phone) {
        errorCount++;
        failedLeads.push({ name: lead.name, phone: lead.phone, reason: "Sem número de telefone" });
        if (!test_mode && lead.id) {
          await serviceClient.from("campaign_sent_leads").upsert({
            campaign_id, lead_id: lead.id, status: "failed", error_reason: "Sem número de telefone",
          }, { onConflict: "campaign_id,lead_id" });
        }
        continue;
      }

      // Pick varied message
      let messageToSend = baseMessage;
      if (variations.length > 0) {
        messageToSend = variations[i % variations.length];
        console.log(`Lead ${i + 1}/${leadsThisCall.length}: variation ${i + 1} (first 50: "${messageToSend.substring(0, 50)}...")`);
      }

      messageToSend = stripUnexpectedLinks(messageToSend, allowLinksInMessage);
      if (!messageToSend) {
        messageToSend = baseMessage;
      }

      // Pick a random image from image_urls array, fallback to single image_url
      const imageUrlsList: string[] = campaign.image_urls?.length > 0 ? campaign.image_urls : (campaign.image_url ? [campaign.image_url] : []);
      const selectedImage = imageUrlsList.length > 0 ? imageUrlsList[Math.floor(Math.random() * imageUrlsList.length)] : null;

      // Pick a random audio from audio_urls array
      const audioUrlsList: string[] = campaign.audio_urls?.length > 0 ? campaign.audio_urls : [];
      const selectedAudio = audioUrlsList.length > 0 ? audioUrlsList[Math.floor(Math.random() * audioUrlsList.length)] : null;

      const result = await sendViaEvolution(instance.instance_name, lead.phone, messageToSend, selectedImage, selectedAudio);

      if (result.success) {
        sentCount++;
        if (!test_mode && lead.id) {
          await serviceClient.from("campaign_sent_leads").upsert({
            campaign_id, lead_id: lead.id, status: "sent",
          }, { onConflict: "campaign_id,lead_id" });
        }
      } else {
        errorCount++;
        let reason = "Erro desconhecido";
        if (result.error) {
          reason = result.error;
        } else if (result.data) {
          const dataStr = JSON.stringify(result.data);
          if (dataStr.includes('"exists":false') || dataStr.includes('"exists": false')) {
            reason = "Número não existe no WhatsApp";
            // === ANTI-BAN: Add to blacklist to skip in future campaigns ===
            if (!test_mode && lead.phone) {
              const cleanPhone = lead.phone.replace(/\D/g, "");
              await serviceClient.from("invalid_numbers").upsert({
                user_id: user.id,
                phone: cleanPhone,
                last_campaign_id: campaign_id,
                last_seen_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,phone",
                // Increment occurrences counter on update
                ignoreDuplicates: false,
              }).then(async (res) => {
                if (res.error) {
                  // Fallback: try raw increment
                  await serviceClient.rpc("increment_invalid_occurrences" as any, {
                    p_user_id: user.id,
                    p_phone: cleanPhone,
                  }).then(() => {}, () => {});
                }
              });
            }
          } else if (result.data?.message) {
            reason = typeof result.data.message === "string" ? result.data.message : dataStr.substring(0, 120);
          } else {
            reason = dataStr.substring(0, 120);
          }
        }
        failedLeads.push({ name: lead.name, phone: lead.phone, reason });
        if (!test_mode && lead.id) {
          await serviceClient.from("campaign_sent_leads").upsert({
            campaign_id, lead_id: lead.id, status: "failed", error_reason: reason,
          }, { onConflict: "campaign_id,lead_id" });
        }
      }

      // Anti-ban delay between leads is now handled CLIENT-SIDE (frontend
      // loop pauses 60-180s between each invoke call). With MAX_LEADS_PER_CALL=1
      // there's nothing to delay here. Keeping this block only for test_mode
      // with multiple leads or if MAX is increased in the future.
      if (i < leadsThisCall.length - 1 && test_mode) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    // Check total sent for this campaign
    const { count: totalSent } = await serviceClient
      .from("campaign_sent_leads")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .eq("status", "sent");

    // Check remaining unsent leads — must use the SAME filters as the leads query above
    let totalTargetLeads = 0;
    if (!test_mode) {
      if (campaign.target_filter && (campaign.target_filter as any).expired_users) {
        // For expired users campaigns, count from the leads we fetched
        totalTargetLeads = totalRemaining + (totalSent || 0);
      } else {
        let q = serviceClient.from("leads").select("*", { count: "exact", head: true })
          .eq("license_id", campaign.license_id).eq("is_duplicate", false);
        if (campaign.target_filter && (campaign.target_filter as any).category) {
          q = q.eq("category", (campaign.target_filter as any).category);
        }
        const { count } = await q;
        let targetCount = count || 0;

        // If campaign uses a list filter, count only leads in that list
        if (campaign.target_filter && (campaign.target_filter as any).list_id) {
          const { count: listCount } = await serviceClient
            .from("lead_list_items")
            .select("*", { count: "exact", head: true })
            .eq("list_id", (campaign.target_filter as any).list_id);
          targetCount = Math.min(targetCount, listCount || 0);
        }
        totalTargetLeads = targetCount;
      }
    }

    const allSent = test_mode || (totalTargetLeads > 0 && (totalSent || 0) >= totalTargetLeads);
    // hasMore: there are still unsent leads in the queue for this batch
    // Fallback: if totalRemaining shows leads exist, always continue regardless of allSent calculation
    const remainingInBatch = totalRemaining - leadsThisCall.length;
    const hasMore = !test_mode && remainingInBatch > 0;

    // Log for debugging
    console.log(`[LOOP DEBUG] totalSent=${totalSent}, totalTargetLeads=${totalTargetLeads}, allSent=${allSent}, totalRemaining=${totalRemaining}, leadsThisCall=${leadsThisCall.length}, remainingInBatch=${remainingInBatch}, hasMore=${hasMore}`);

    // Update campaign status
    await serviceClient.from("campaigns")
      .update({
        status: allSent ? "sent" : "partial",
        sent_count: totalSent || sentCount,
      }).eq("id", campaign.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enviado: ${sentCount} ok, ${errorCount} erros`,
        leads_count: sentCount,
        errors: errorCount,
        failed_leads: failedLeads,
        all_sent: allSent,
        has_more: hasMore,
        total_sent: totalSent || 0,
        total_target: totalTargetLeads,
        remaining: Math.max(0, totalTargetLeads - (totalSent || 0)),
        daily_sent: dailySent + sentCount,
        daily_limit: dailyLimit,
        variation_warning: variationWarning,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in trigger-campaign:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno", code: "INTERNAL_ERROR" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
