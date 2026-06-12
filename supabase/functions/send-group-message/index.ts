import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const MAX_PER_CALL = 2;

// === Anti-Ban Configuration ===
const MIN_DELAY_BETWEEN_MS = 60_000;
const MAX_DELAY_BETWEEN_MS = 180_000;
const DAILY_MESSAGE_LIMIT = 150;
const SAFE_HOUR_START = 8;
const SAFE_HOUR_END = 21;

// === Warm-up system ===
function getWarmupLimit(instanceCreatedAt: string): number {
  const created = new Date(instanceCreatedAt);
  const now = new Date();
  const daysConnected = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  if (daysConnected <= 3) return 30;
  if (daysConnected <= 7) return 60;
  if (daysConnected <= 14) return 100;
  return DAILY_MESSAGE_LIMIT;
}

async function fetchGroupParticipants(instanceName: string, groupId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/group/participants/${instanceName}?groupJid=${groupId}`,
      { headers: { apikey: EVOLUTION_API_KEY } }
    );
    if (!res.ok) {
      console.error(`Failed to fetch participants for ${groupId}: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const participants: any[] = data?.participants || data || [];
    console.log(`Group ${groupId}: ${participants.length} raw participants. Sample:`, JSON.stringify(participants.slice(0, 3)));
    return participants
      .filter((p: any) => {
        // Remove admins and superadmins from the list
        const admin = p.admin || p.role || "";
        return admin !== "admin" && admin !== "superadmin";
      })
      .map((p: any) => {
        // Evolution costuma retornar id @lid + phoneNumber @s.whatsapp.net.
        // Priorizamos campos que já trazem o número real do WhatsApp.
        const candidates = [
          p.phoneNumber,
          p.number,
          p.id,
          p.jid,
          typeof p === "string" ? p : null,
        ].filter((v): v is string => typeof v === "string" && v.length > 0);

        for (const candidate of candidates) {
          if (candidate.includes("@lid")) continue;
          const phone = candidate.replace(/@.*$/, "").replace(/\D/g, "");
          if (phone.length >= 10) return phone;
        }

        return null;
      })
      .filter(Boolean) as string[];
  } catch (e) {
    console.error(`Error fetching participants for ${groupId}:`, e.message);
    return [];
  }
}

async function sendToPhone(instanceName: string, phone: string, message: string, imageUrl?: string | null, audioUrl?: string | null) {
  try {
    // If audio, send audio first then text separately
    if (audioUrl) {
      const audioRes = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: phone, audio: audioUrl }),
      });
      console.log(`send audio ${phone}: status=${audioRes.status}`);
      if (audioRes.status < 200 || audioRes.status >= 300) {
        const data = await audioRes.json();
        return { success: false, data };
      }
      if (message.trim()) {
        // Delay entre áudio e texto (5-12s) para parecer humano
        const audioTextDelay = (5 + Math.floor(Math.random() * 8)) * 1000;
        console.log(`Waiting ${Math.round(audioTextDelay / 1000)}s between audio and text...`);
        await new Promise((r) => setTimeout(r, audioTextDelay));
        const textRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: phone, text: message }),
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
      ? { number: phone, mediatype: "image", media: imageUrl, caption: message }
      : { number: phone, text: message };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`send ${phone}: status=${res.status}`);
    return { success: res.status >= 200 && res.status < 300, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function generateVariations(originalMessage: string, count: number): Promise<string[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return [];

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
            content: `Você reescreve mensagens de WhatsApp. Gere EXATAMENTE ${count} variações da mensagem do usuário.

REGRAS CRÍTICAS:
- Cada variação é UMA mensagem completa e independente
- Separe cada variação com a linha exata: %%%SPLIT%%%
- NÃO numere as variações
- NÃO adicione explicações ou títulos
- Mantenha o mesmo sentido, tom e formalidade
- NÃO adicione ou remova informações, links ou números
- Cada variação deve ter tamanho similar ao original

FORMATO OBRIGATÓRIO:
variação 1 aqui
%%%SPLIT%%%
variação 2 aqui`,
          },
          { role: "user", content: originalMessage },
        ],
        temperature: 0.9,
        max_tokens: count * 600,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return [];

    const maxLen = originalMessage.length * 2.5;
    let variations = text.split("%%%SPLIT%%%").map((v: string) => v.trim()).filter((v: string) => v.length > 10 && v.length <= maxLen);
    if (variations.length === 0) {
      variations = text.split("---").map((v: string) => v.trim()).filter((v: string) => v.length > 10 && v.length <= maxLen);
    }
    return variations;
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

    const { group_ids, message, image_urls, audio_urls, batch_size, sent_phones } = await req.json();
    if (!group_ids?.length || !message?.trim()) {
      return new Response(JSON.stringify({ error: "Selecione pelo menos um grupo e escreva uma mensagem" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: instance } = await serviceClient
      .from("whatsapp_instances")
      .select("instance_name, status, phone_connected, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!instance || instance.status !== "connected") {
      return new Response(
        JSON.stringify({ error: "Sua instância WhatsApp não está conectada.", code: "INSTANCE_NOT_CONNECTED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ANTI-BAN: Block outside safe hours ===
    const now = new Date();
    const spFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    });
    const currentHourSP = parseInt(spFormatter.format(now), 10);
    if (currentHourSP < SAFE_HOUR_START || currentHourSP >= SAFE_HOUR_END) {
      return new Response(
        JSON.stringify({
          error: `Fora do horário seguro (${SAFE_HOUR_START}h-${SAFE_HOUR_END}h). Aguarde até ${SAFE_HOUR_START}h.`,
          code: "OUTSIDE_SAFE_HOURS",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ANTI-BAN: Daily limit ===
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const userCampaignIds = (
      await serviceClient
        .from("campaigns")
        .select("id")
        .eq("license_id", (
          await serviceClient.from("licenses").select("id").eq("assigned_to", user.id).maybeSingle()
        ).data?.id || "")
    ).data?.map((c: any) => c.id) || [];

    const { count: sentToday } = await serviceClient
      .from("campaign_sent_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("created_at", todayStart.toISOString())
      .in("campaign_id", userCampaignIds);

    const dailySent = sentToday || 0;
    const dailyLimit = instance.created_at
      ? getWarmupLimit(instance.created_at)
      : DAILY_MESSAGE_LIMIT;

    if (dailySent >= dailyLimit) {
      const isWarmup = dailyLimit < DAILY_MESSAGE_LIMIT;
      return new Response(
        JSON.stringify({
          error: `Limite diário atingido: ${dailySent}/${dailyLimit}.${isWarmup ? ` Número em aquecimento (limite aumenta automaticamente até ${DAILY_MESSAGE_LIMIT}/dia).` : ""} Tente amanhã.`,
          code: "DAILY_LIMIT_REACHED",
          daily_sent: dailySent,
          daily_limit: dailyLimit,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch participants from all selected groups
    const allPhones = new Set<string>();
    for (const groupId of group_ids) {
      const participants = await fetchGroupParticipants(instance.instance_name, groupId);
      participants.forEach((p) => allPhones.add(p));
    }

    // Remove own phone number
    const ownPhone = (instance.phone_connected || "").replace(/\D/g, "");
    if (ownPhone) allPhones.delete(ownPhone);

    // Remove already sent phones (from previous batches)
    const alreadySent = new Set<string>(Array.isArray(sent_phones) ? sent_phones : []);
    const phonesToSend = Array.from(allPhones).filter((p) => !alreadySent.has(p));

    const totalParticipants = phonesToSend.length + alreadySent.size;

    // Apply batch size limit
    const limit = batch_size && batch_size > 0 ? batch_size : phonesToSend.length;
    const batchPhones = phonesToSend.slice(0, limit);

    // Now limit to MAX_PER_CALL for this single execution
    const thisCallPhones = batchPhones.slice(0, MAX_PER_CALL);

    if (thisCallPhones.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Todos os participantes já foram enviados!",
          sent_count: 0,
          errors: 0,
          failed: [],
          all_sent: true,
          has_more: false,
          total_participants: totalParticipants,
          total_sent: alreadySent.size,
          sent_phones_list: Array.from(alreadySent),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate variations
    const variations = await generateVariations(message, Math.max(thisCallPhones.length, 6));
    const imageList: string[] = Array.isArray(image_urls) && image_urls.length > 0 ? image_urls : [];
    const audioList: string[] = Array.isArray(audio_urls) && audio_urls.length > 0 ? audio_urls : [];

    let sentCount = 0;
    let errorCount = 0;
    const failed: Array<{ phone: string; reason: string }> = [];
    const newSentPhones: string[] = [];

    for (let i = 0; i < thisCallPhones.length; i++) {
      const phone = thisCallPhones[i];
      const msgToSend = variations.length > 0 ? variations[i % variations.length] : message;
      const selectedImage = imageList.length > 0 ? imageList[Math.floor(Math.random() * imageList.length)] : null;
      const selectedAudio = audioList.length > 0 ? audioList[Math.floor(Math.random() * audioList.length)] : null;

      const result = await sendToPhone(instance.instance_name, phone, msgToSend, selectedImage, selectedAudio);

      if (result.success) {
        sentCount++;
        newSentPhones.push(phone);
      } else {
        errorCount++;
        failed.push({ phone, reason: result.error || "Erro desconhecido" });
        // Still mark as "sent" to avoid retrying failed numbers
        newSentPhones.push(phone);
      }

      // Anti-ban delay between sends: 60-180s (1-3 min)
      // 30% chance of extra "typing pause" 10-30s for humanization
      if (i < thisCallPhones.length - 1) {
        const baseDelay = MIN_DELAY_BETWEEN_MS + Math.floor(Math.random() * (MAX_DELAY_BETWEEN_MS - MIN_DELAY_BETWEEN_MS));
        const typingPause = Math.random() < 0.3 ? (10_000 + Math.floor(Math.random() * 21_000)) : 0;
        const totalDelay = baseDelay + typingPause;
        const minutes = Math.floor(totalDelay / 60_000);
        const seconds = Math.floor((totalDelay % 60_000) / 1000);
        console.log(`Anti-ban delay: ${minutes}m${seconds}s before next phone`);
        // Count down in chunks
        let remaining = totalDelay;
        while (remaining > 0) {
          await new Promise((r) => setTimeout(r, Math.min(5000, remaining)));
          remaining -= 5000;
        }
      }
    }

    const updatedSentPhones = [...Array.from(alreadySent), ...newSentPhones];
    const remaining = phonesToSend.length - thisCallPhones.length;
    const allSent = remaining <= 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enviado para ${sentCount} participantes. ${errorCount} erros.`,
        sent_count: sentCount,
        errors: errorCount,
        failed,
        all_sent: allSent,
        has_more: !allSent,
        total_participants: totalParticipants,
        total_sent: updatedSentPhones.length,
        remaining,
        sent_phones_list: updatedSentPhones,
        daily_sent: dailySent + sentCount,
        daily_limit: DAILY_MESSAGE_LIMIT,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-group-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
