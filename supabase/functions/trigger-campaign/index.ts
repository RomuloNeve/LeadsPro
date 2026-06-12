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

async function generateVariations(originalMessage: string, count: number): Promise<string[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set! Variations will NOT work.");
    return [];
  }

  console.log(`Generating ${count} variations...`);

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
            content: `Você reescreve mensagens de WhatsApp para um sistema de envio em massa que precisa evitar detecção de spam.

Gere EXATAMENTE ${count} variações da mensagem do usuário.

REGRAS CRÍTICAS ANTI-SPAM:
- Cada variação deve PARECER escrita por uma pessoa diferente em um momento diferente
- VARIE a estrutura: inverta ordem de frases, mude abertura, mude fechamento
- Use SINÔNIMOS sempre que possível (não repita as mesmas palavras)
- Mude a PONTUAÇÃO: às vezes exclamação, às vezes interrogação, às vezes nada
- Mude o TAMANHO: algumas 10% mais curtas, outras 10% mais longas
- Mude ABERTURAS: alterne entre "Olá", "Oi", "Fala", "Bom dia", etc.
- Mude FECHAMENTOS: varie entre "Abraços", "Até logo", "Obrigado", "Qualquer dúvida me chama", etc.
- Mantenha o mesmo SENTIDO, TOM e FORMALIDADE do original
- Mantenha links, números de telefone, preços e informações factuais IDÊNTICOS

FORMATO OBRIGATÓRIO:
variação 1 aqui
%%%SPLIT%%%
variação 2 aqui
%%%SPLIT%%%
variação 3 aqui

- NÃO numere as variações
- NÃO adicione explicações ou títulos
- Separe cada variação com a linha exata: %%%SPLIT%%%`,
          },
          { role: "user", content: originalMessage },
        ],
        temperature: 1.2,
        max_tokens: count * 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI variation error:", response.status, errText);
      return [];
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.error("AI returned empty content");
      return [];
    }

    // Split by our custom delimiter
    let variations = text.split("%%%SPLIT%%%").map((v: string) => v.trim()).filter((v: string) => v.length > 10);

    // Fallback: try splitting by "---" if custom delimiter wasn't used
    if (variations.length <= 1) {
      variations = text.split("---").map((v: string) => v.trim()).filter((v: string) => v.length > 10);
    }

    // Safety: discard any "variation" that is way too long (merged multiple variations)
    const maxLen = originalMessage.length * 2.5;
    variations = variations.filter((v: string) => v.length <= maxLen);

    if (variations.length === 0) {
      console.error("No valid variations after filtering, using original");
      return [];
    }

    console.log(`Generated ${variations.length} valid variations (original len: ${originalMessage.length})`);
    return variations;
  } catch (e) {
    console.error("AI variation fetch error:", e.message);
    return [];
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
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_id, test_mode, batch_size } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign, error: campError } = await supabase
      .from("campaigns").select("*").eq("id", campaign_id).single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

      // Get already sent phones for this campaign to prevent duplicates
      const { data: sentRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("lead_id")
        .eq("campaign_id", campaign_id);
      const sentIds = new Set((sentRows || []).map((r: any) => r.lead_id));
      leads = leads.filter((l: any) => !sentIds.has(l.id));

      const userLimit = batch_size && batch_size > 0 ? batch_size : leads.length;
      leads = leads.slice(0, userLimit);
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

      // Get already sent/sending lead IDs (prevent duplicates AND race conditions)
      const { data: sentRows } = await serviceClient
        .from("campaign_sent_leads")
        .select("lead_id")
        .eq("campaign_id", campaign_id);

      const sentIds = new Set((sentRows || []).map((r: any) => r.lead_id));
      leads = filteredLeads.filter((l: any) => !sentIds.has(l.id));

      // Apply user-requested batch_size as the TOTAL they want to send across all calls
      // But per-call we only send MAX_LEADS_PER_CALL
      const userLimit = batch_size && batch_size > 0 ? batch_size : leads.length;
      leads = leads.slice(0, userLimit);
    }

    // Now limit to MAX_LEADS_PER_CALL for THIS single execution
    const leadsThisCall = leads.slice(0, test_mode ? leads.length : MAX_LEADS_PER_CALL);
    const totalRemaining = leads.length; // total unsent before this call

    // === ANTI-BAN: Filter out known invalid numbers for this user ===
    if (!test_mode && leadsThisCall.length > 0) {
      const { data: invalidRows } = await serviceClient
        .from("invalid_numbers")
        .select("phone")
        .eq("user_id", user.id);

      const invalidPhones = new Set(
        (invalidRows || []).map((r: any) => (r.phone || "").replace(/\D/g, ""))
      );

      if (invalidPhones.size > 0) {
        const before = leadsThisCall.length;
        for (let i = leadsThisCall.length - 1; i >= 0; i--) {
          const cleanPhone = (leadsThisCall[i].phone || "").replace(/\D/g, "");
          if (invalidPhones.has(cleanPhone)) {
            leadsThisCall.splice(i, 1);
          }
        }
        const skipped = before - leadsThisCall.length;
        if (skipped > 0) {
          console.log(`Skipped ${skipped} leads with known invalid numbers`);
        }
      }
    }

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
        JSON.stringify({ success: true, message: "Todos os leads já foram enviados!", leads_count: 0, errors: 0, failed_leads: [], all_sent: true, has_more: false }),
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
    const variations = await generateVariations(baseMessage, variationCount);
    const variationWarning = variations.length === 0
      ? "Variação por IA indisponível. Todas as mensagens serão enviadas com o texto original (maior risco de detecção)."
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

    // Check remaining unsent leads  
    let totalTargetLeads = 0;
    if (!test_mode) {
      let q = serviceClient.from("leads").select("*", { count: "exact", head: true })
        .eq("license_id", campaign.license_id).eq("is_duplicate", false);
      if (campaign.target_filter && (campaign.target_filter as any).category) {
        q = q.eq("category", (campaign.target_filter as any).category);
      }
      const { count } = await q;
      totalTargetLeads = count || 0;
    }

    const allSent = test_mode || (totalSent || 0) >= totalTargetLeads;
    const hasMore = !test_mode && !allSent && (totalRemaining - leadsThisCall.length) > 0;

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
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
