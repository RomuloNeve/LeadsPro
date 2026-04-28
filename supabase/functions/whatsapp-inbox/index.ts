import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

function stripDataUrl(base64: string): string {
  if (base64.startsWith("data:")) {
    return base64.split(",")[1] || base64;
  }
  return base64;
}

function normalizeRecipient(remoteJid: string): string {
  // Preserve @lid and @g.us JIDs fully — Evolution API needs them as-is
  if (remoteJid.endsWith("@g.us")) return remoteJid;
  if (remoteJid.endsWith("@lid")) return remoteJid;
  // For @s.whatsapp.net, strip suffix and non-digits
  return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "");
}

// Resolve actual recipient: for @lid, always send the full JID
function resolveRecipient(remoteJid: string, _remoteJidAlt?: string): string {
  return normalizeRecipient(remoteJid);
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isHumanName(value: string): boolean {
  const v = (value || "").trim();
  if (!v) return false;
  if (["você", "voce", "contato"].includes(v.toLowerCase())) return false;
  // Reject pure numeric ids / phone-like ids as display names
  if (!/\p{L}/u.test(v)) return false;
  return true;
}

function formatPhone(phone: string): string {
  const digits = extractDigits(phone);
  if (digits.length < 8) return "";
  return `+${digits}`;
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`Failed to parse JSON (HTTP ${res.status}):`, text.substring(0, 200));
    return null;
  }
}

async function evoFetch(path: string, options: RequestInit = {}, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
        ...(options.headers || {}),
      },
      signal: ctrl.signal,
    });
    return await safeJson(res);
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Get user's instance
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("instance_name, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!instance || instance.status !== "connected") {
      return new Response(
        JSON.stringify({ error: "Instância WhatsApp não conectada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST CHATS
    if (action === "chats") {
      console.log("Fetching chats for instance:", instance.instance_name);

      // Wrap with timeout + try/catch — Evolution API can hang or drop the
      // connection mid-request (reported as "connection reset"); without
      // this guard the whole edge function throws to the platform error log.
      let res: Response;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25000);
        try {
          res = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      } catch (e: any) {
        const isTimeout = e?.name === "AbortError";
        const isReset = String(e?.message || "").includes("connection reset")
          || String(e?.message || "").includes("connection error");
        const friendly = isTimeout
          ? "Tempo esgotado ao buscar conversas. Tente recarregar."
          : isReset
            ? "Conexão com o WhatsApp instável. Tente recarregar em alguns segundos."
            : "Não foi possível buscar suas conversas agora. Tente novamente.";
        console.warn("findChats network error:", e?.message || e);
        return new Response(
          JSON.stringify({ chats: [], error: friendly, transient: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!res.ok) {
        console.error(`findChats failed: HTTP ${res.status}`);
        const errText = await res.text();
        console.error("Response body:", errText.substring(0, 200));
        return new Response(JSON.stringify({ chats: [], error: `Evolution API returned ${res.status}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await safeJson(res);

      console.log("findChats status:", res.status, "type:", typeof data, "isArray:", Array.isArray(data));
      if (Array.isArray(data)) {
        console.log("Total chats:", data.length);
        if (data.length > 0) console.log("Sample chat keys:", Object.keys(data[0]).join(","));
        if (data.length > 0) console.log("Sample:", JSON.stringify(data[0]).substring(0, 800));
      } else {
        console.log("Response:", JSON.stringify(data).substring(0, 800));
      }

      const allChats = Array.isArray(data) ? data : [];

      // Fetch saved contacts to get user's agenda names (saved name on phone)
      // Two maps: by full JID and by phone number (for @lid cross-referencing)
      let contactsMapByJid: Record<string, string> = {};
      let contactsMapByPhone: Record<string, string> = {};
      try {
        const ctCtrl = new AbortController();
        const ctTimer = setTimeout(() => ctCtrl.abort(), 15000);
        let contactsRes: Response;
        try {
          contactsRes = await fetch(`${EVOLUTION_API_URL}/chat/findContacts/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            body: JSON.stringify({}),
            signal: ctCtrl.signal,
          });
        } finally {
          clearTimeout(ctTimer);
        }
        const contactsData = await safeJson(contactsRes);
        if (Array.isArray(contactsData)) {
          for (const ct of contactsData) {
            const cJid = ct.remoteJid || "";
            const rawName = ct.pushName || ct.name || ct.verifiedName || ct.shortName || "";
            const cName = isHumanName(rawName) ? rawName : "";
            if (cJid && cName) {
              contactsMapByJid[cJid] = cName;
              const phone = cJid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
              if (phone.length >= 8) {
                contactsMapByPhone[phone] = cName;
              }
            }
          }
        }
        console.log("Contacts by JID:", Object.keys(contactsMapByJid).length, "by phone:", Object.keys(contactsMapByPhone).length);
        // Log sample @lid contacts from findContacts for diagnostics
        const lidContacts = Object.entries(contactsMapByJid).filter(([k]) => k.endsWith("@lid")).slice(0, 3);
        if (lidContacts.length > 0) console.log("LID contacts from findContacts:", JSON.stringify(lidContacts));
      } catch (e) {
        console.log("findContacts failed:", e);
      }

      // CRM fallback: fetch lead names from DB to use as fallback for @lid contacts
      let crmNamesByPhone: Record<string, string> = {};
      try {
        const { data: license } = await supabase
          .from("licenses")
          .select("id")
          .eq("assigned_to", userId)
          .eq("is_active", true)
          .maybeSingle();
        if (license) {
          const { data: leads } = await supabase
            .from("leads")
            .select("name, phone")
            .eq("license_id", license.id)
            .not("phone", "is", null)
            .not("name", "is", null)
            .limit(1000);
          if (leads) {
            for (const lead of leads) {
              if (lead.phone && lead.name) {
                const cleanPhone = lead.phone.replace(/\D/g, "");
                if (cleanPhone.length >= 8) crmNamesByPhone[cleanPhone] = lead.name;
              }
            }
          }
        }
        console.log("CRM names loaded:", Object.keys(crmNamesByPhone).length);
      } catch (e) {
        console.log("CRM fallback failed:", e);
      }

      // Also fetch owner JID for client to know own number
      let ownerJid: string | null = null;
      try {
        const connRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instance.instance_name}`, {
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        });
        const connData = await safeJson(connRes);
        if (connData?.instance?.ownerJid) {
          ownerJid = connData.instance.ownerJid;
        }
      } catch {}
      if (!ownerJid) {
        try {
          const instRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instance.instance_name}`, {
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          });
          const instData = await safeJson(instRes);
          const inst = Array.isArray(instData) ? instData[0] : instData;
          ownerJid = inst?.instance?.ownerJid || inst?.ownerJid || null;
        } catch {}
      }

      // Pre-scan: build a map of @lid JID -> pushName AND @lid JID -> realPhone from chat-level data
      const lidPushNameMap: Record<string, string> = {};
      const lidRealPhoneMap: Record<string, string> = {};
      for (const c of allChats) {
        const jid = c.remoteJid || "";
        if (!jid.endsWith("@lid")) continue;
        if (isHumanName(c.pushName || "")) lidPushNameMap[jid] = c.pushName;
        else if (isHumanName(c.lastMessage?.pushName || "") && !c.lastMessage?.key?.fromMe) {
          lidPushNameMap[jid] = c.lastMessage.pushName;
        }
        // Collect remoteJidAlt from lastMessage key
        const alt = c.lastMessage?.key?.remoteJidAlt || "";
        if (alt) {
          const phone = extractDigits(alt);
          if (phone.length >= 8) lidRealPhoneMap[jid] = phone;
        }
      }

      // Batch fetch messages for @lid contacts that still have NO name and NO realPhone (max 50)
      const unresolvedLids = allChats
        .filter((c: any) => {
          const jid = c.remoteJid || "";
          if (!jid.endsWith("@lid")) return false;
          if (lidPushNameMap[jid]) return false;
          if (contactsMapByJid[jid]) return false;
          if (lidRealPhoneMap[jid] && contactsMapByPhone[lidRealPhoneMap[jid]]) return false;
          return true;
        })
        .slice(0, 50);

      if (unresolvedLids.length > 0) {
        console.log("Fetching messages for", unresolvedLids.length, "unresolved @lid chats");
        const batchResults = await Promise.allSettled(
          unresolvedLids.map((c: any) =>
            evoFetch(`/chat/findMessages/${instance.instance_name}`, {
              method: "POST",
              body: JSON.stringify({ where: { key: { remoteJid: c.remoteJid } }, limit: 5 }),
            }).then((data: any) => ({ jid: c.remoteJid, data }))
          )
        );
        for (const result of batchResults) {
          if (result.status !== "fulfilled") continue;
          const { jid, data } = result.value;
          const msgs = Array.isArray(data) ? data : (data?.messages?.records || data?.messages || data?.records || []);
          for (const m of msgs) {
            if (isHumanName(m.pushName || "") && !m.key?.fromMe && !lidPushNameMap[jid]) {
              lidPushNameMap[jid] = m.pushName;
            }
            // Get remoteJidAlt (real phone mapping)
            const mAlt = m.key?.remoteJidAlt || "";
            if (mAlt && !lidRealPhoneMap[jid]) {
              const phone = extractDigits(mAlt);
              if (phone.length >= 8) lidRealPhoneMap[jid] = phone;
            }
          }
        }
      }
      console.log("LID pushName map:", Object.keys(lidPushNameMap).length, "LID realPhone map:", Object.keys(lidRealPhoneMap).length);

      const chats = allChats
        .filter((c: any) => {
          const jid = c.remoteJid || "";
          return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@g.us") || jid.endsWith("@lid");
        })
        .sort((a: any, b: any) => {
          const ta = a.updatedAt || a.lastMsgTimestamp || a.conversationTimestamp || "";
          const tb = b.updatedAt || b.lastMsgTimestamp || b.conversationTimestamp || "";
          return String(tb).localeCompare(String(ta));
        })
        .slice(0, 300)
        .map((c: any) => {
          const jid = c.remoteJid || "";
          const isGroup = jid.endsWith("@g.us");
          const isLid = jid.endsWith("@lid");
          
          // For @lid contacts, get real phone from batch scan or lastMessage
          const altJid = c.lastMessage?.key?.remoteJidAlt || "";
          const realPhone = (isLid ? lidRealPhoneMap[jid] : "") || extractDigits(altJid) || "";

          // 1. Saved contact name from findContacts (phone agenda)
          const savedNameRaw = contactsMapByJid[jid]
            || (altJid ? contactsMapByJid[altJid] : "")
            || (realPhone ? contactsMapByPhone[realPhone] : "")
            || "";

          // 2. Chat-level name
          const chatPushNameRaw = c.pushName || c.name || c.contactName || "";

          // 3. lastMessage pushName (only received msgs)
          const lastMsgPushNameRaw = c.lastMessage?.key?.fromMe ? "" : (c.lastMessage?.pushName || "");

          // 4. Batch-scanned LID pushName (from message history)
          const lidScannedNameRaw = isLid ? (lidPushNameMap[jid] || "") : "";

          // 5. Business name
          const bizNameRaw = c.lastMessage?.verifiedBizName || "";

          // 6. CRM fallback
          const crmNameRaw = realPhone ? (crmNamesByPhone[realPhone] || "") : "";

          const savedName = isHumanName(savedNameRaw) ? savedNameRaw : "";
          const chatPushName = isHumanName(chatPushNameRaw) ? chatPushNameRaw : "";
          const lastMsgPushName = isHumanName(lastMsgPushNameRaw) ? lastMsgPushNameRaw : "";
          const lidScannedName = isHumanName(lidScannedNameRaw) ? lidScannedNameRaw : "";
          const bizName = isHumanName(bizNameRaw) ? bizNameRaw : "";
          const crmName = isHumanName(crmNameRaw) ? crmNameRaw : "";

          // Priority: saved > chat > lastMsg > lidScan > biz > CRM
          const contactName = savedName || chatPushName || lastMsgPushName || lidScannedName || bizName || crmName;

          let fallbackName: string;
          if (isGroup) {
            fallbackName = c.subject || c.groupMetadata?.subject || c.name || "Grupo";
          } else if (contactName) {
            fallbackName = contactName;
          } else if (realPhone && realPhone.length >= 8) {
            // Prefer WhatsApp phone in +55... format whenever available
            fallbackName = formatPhone(realPhone);
          } else {
            // Never show raw @lid numeric codes
            fallbackName = "Contato";
          }

          return {
            remoteJid: c.remoteJid,
            remoteJidAlt: realPhone || null,
            name: fallbackName,
            isGroup,
            lastMessage: c.lastMessage?.message?.conversation ||
              c.lastMessage?.message?.extendedTextMessage?.text ||
              c.lastMessage?.message?.imageMessage?.caption || "",
            lastMessageFromMe: c.lastMessage?.key?.fromMe === true,
            lastTimestamp: c.updatedAt || c.lastMsgTimestamp || 0,
            unreadCount: c.unreadCount || 0,
            profilePicUrl: c.profilePicUrl || null,
          };
        });

      return new Response(JSON.stringify({ chats, total_raw: allChats.length, ownerJid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // FETCH PROFILE PICTURE
    if (action === "profile-pic" && req.method === "POST") {
      const { remoteJid } = await req.json();
      if (!remoteJid) {
        return new Response(JSON.stringify({ error: "remoteJid é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const data = await evoFetch(`/chat/fetchProfilePictureUrl/${instance.instance_name}`, {
          method: "POST",
          body: JSON.stringify({ number: remoteJid }),
        });
        return new Response(JSON.stringify({ profilePicUrl: data?.profilePictureUrl || data?.profilePicUrl || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ profilePicUrl: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // GET MESSAGES FOR A CHAT
    if (action === "messages" && req.method === "POST") {
      const { remoteJid, limit } = await req.json();
      if (!remoteJid) {
        return new Response(JSON.stringify({ error: "remoteJid é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await evoFetch(`/chat/findMessages/${instance.instance_name}`, {
        method: "POST",
        body: JSON.stringify({
          where: { key: { remoteJid } },
          limit: limit || 100,
        }),
      });

      console.log("findMessages response type:", typeof data, "isArray:", Array.isArray(data));
      if (!Array.isArray(data)) {
        console.log("findMessages raw:", JSON.stringify(data).substring(0, 500));
      }

      // Handle various response formats
      let rawMessages: any[] = [];
      if (Array.isArray(data)) {
        rawMessages = data;
      } else if (data?.messages?.records && Array.isArray(data.messages.records)) {
        rawMessages = data.messages.records;
      } else if (data?.messages && Array.isArray(data.messages)) {
        rawMessages = data.messages;
      } else if (data?.records && Array.isArray(data.records)) {
        rawMessages = data.records;
      }

      const messages = rawMessages
        .map((m: any) => {
          const key = m.key || {};
          const msg = m.message || {};
          const text = msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.buttonsResponseMessage?.selectedDisplayText ||
            msg.listResponseMessage?.title ||
            msg.templateButtonReplyMessage?.selectedDisplayText ||
            m.body || m.content || "";
          const messageType = m.messageType || "text";
          const hasMedia = !!(msg.imageMessage || msg.videoMessage || msg.audioMessage || msg.documentMessage || msg.stickerMessage || msg.contactMessage || msg.contactsArrayMessage || msg.locationMessage || msg.pollCreationMessage || msg.pollCreationMessageV3);
          const type = msg.imageMessage ? "image" :
            msg.videoMessage ? "video" :
            msg.audioMessage ? "audio" :
            msg.documentMessage ? "document" :
            msg.stickerMessage ? "sticker" :
            msg.contactMessage || msg.contactsArrayMessage ? "contact" :
            msg.locationMessage ? "location" :
            msg.pollCreationMessage || msg.pollCreationMessageV3 ? "poll" :
            messageType;

          // Extract rich metadata per type
          const meta: Record<string, any> = {};
          if (msg.imageMessage) {
            meta.mediaUrl = msg.imageMessage.url || "";
            meta.mimetype = msg.imageMessage.mimetype || "image/jpeg";
            meta.caption = msg.imageMessage.caption || "";
            meta.thumbnailBase64 = msg.imageMessage.jpegThumbnail || "";
          }
          if (msg.videoMessage) {
            meta.mediaUrl = msg.videoMessage.url || "";
            meta.mimetype = msg.videoMessage.mimetype || "video/mp4";
            meta.caption = msg.videoMessage.caption || "";
            meta.seconds = msg.videoMessage.seconds || 0;
            meta.thumbnailBase64 = msg.videoMessage.jpegThumbnail || "";
          }
          if (msg.audioMessage) {
            meta.mediaUrl = msg.audioMessage.url || "";
            meta.mimetype = msg.audioMessage.mimetype || "audio/ogg";
            meta.seconds = msg.audioMessage.seconds || 0;
            meta.ptt = msg.audioMessage.ptt ?? true;
          }
          if (msg.documentMessage) {
            meta.mediaUrl = msg.documentMessage.url || "";
            meta.mimetype = msg.documentMessage.mimetype || "application/octet-stream";
            meta.fileName = msg.documentMessage.fileName || "Documento";
            meta.fileSize = msg.documentMessage.fileLength ? Number(msg.documentMessage.fileLength) : 0;
            meta.pageCount = msg.documentMessage.pageCount || 0;
            meta.thumbnailBase64 = msg.documentMessage.jpegThumbnail || "";
          }
          if (msg.contactMessage) {
            meta.contactName = msg.contactMessage.displayName || "Contato";
            meta.vcard = msg.contactMessage.vcard || "";
          }
          if (msg.contactsArrayMessage) {
            meta.contacts = (msg.contactsArrayMessage.contacts || []).map((c: any) => ({
              name: c.displayName || "Contato",
              vcard: c.vcard || "",
            }));
          }
          const pollMsg = msg.pollCreationMessage || msg.pollCreationMessageV3;
          if (pollMsg) {
            meta.pollName = pollMsg.name || "Enquete";
            meta.pollOptions = (pollMsg.options || []).map((o: any) => o.optionName || o.name || o);
            meta.pollSelectableCount = pollMsg.selectableOptionsCount || 1;
          }
          if (msg.locationMessage) {
            meta.latitude = msg.locationMessage.degreesLatitude || 0;
            meta.longitude = msg.locationMessage.degreesLongitude || 0;
            meta.locationName = msg.locationMessage.name || "";
            meta.locationAddress = msg.locationMessage.address || "";
          }
          if (msg.stickerMessage) {
            meta.mediaUrl = msg.stickerMessage.url || "";
            meta.mimetype = msg.stickerMessage.mimetype || "image/webp";
          }

          return {
            id: key.id || m.id || String(Math.random()),
            fromMe: key.fromMe ?? m.fromMe ?? false,
            text,
            timestamp: m.messageTimestamp || m.createdAt || m.updatedAt || 0,
            type,
            hasMedia,
            pushName: m.pushName || "",
            meta,
          };
        })
        .filter((m: any) => m.text || m.hasMedia)
        .sort((a: any, b: any) => {
          const ta = typeof a.timestamp === "string" ? new Date(a.timestamp).getTime() / 1000 : Number(a.timestamp);
          const tb = typeof b.timestamp === "string" ? new Date(b.timestamp).getTime() / 1000 : Number(b.timestamp);
          return ta - tb;
        });

      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND MESSAGE
    if (action === "send" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, text } = await req.json();
      if (!remoteJid || !text) {
        return new Response(JSON.stringify({ error: "remoteJid e text são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For @lid contacts, send the full JID directly — Evolution API handles it
      const recipient = normalizeRecipient(remoteJid);
      console.log("Sending text to:", recipient, "via instance:", instance.instance_name);
      const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: recipient, text }),
      });
      const result = await safeJson(res);
      const ok = res.status >= 200 && res.status < 300;

      if (!ok) {
        console.error("Send failed:", res.status, JSON.stringify(result).substring(0, 500));
        return new Response(JSON.stringify({ success: false, error: `Erro ao enviar (HTTP ${res.status}). Verifique se sua instância está conectada.`, data: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE GROUP
    if (action === "create-group" && req.method === "POST") {
      const { subject, description, participants } = await req.json();
      if (!subject || !participants || !Array.isArray(participants) || participants.length === 0) {
        return new Response(JSON.stringify({ error: "Nome do grupo e pelo menos 1 participante são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean participant numbers (remove @s.whatsapp.net if present)
      const cleanParticipants = participants.map((p: string) => p.replace("@s.whatsapp.net", ""));

      const res = await fetch(`${EVOLUTION_API_URL}/group/create/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ subject, description: description || "", participants: cleanParticipants }),
      });
      const result = await safeJson(res);
      console.log("create-group result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE MESSAGE
    if (action === "delete-message" && req.method === "POST") {
      const { remoteJid, messageId, fromMe } = await req.json();
      if (!remoteJid || !messageId) {
        return new Response(JSON.stringify({ error: "remoteJid e messageId são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/chat/deleteMessageForEveryone/${instance.instance_name}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ id: messageId, remoteJid, fromMe: fromMe ?? true }),
      });
      const result = await safeJson(res);
      console.log("delete-message result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND REACTION
    if (action === "send-reaction" && req.method === "POST") {
      const { remoteJid, messageId, reaction, fromMe } = await req.json();
      if (!remoteJid || !messageId) {
        return new Response(JSON.stringify({ error: "remoteJid e messageId são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendReaction/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          key: { remoteJid, id: messageId, fromMe: fromMe ?? false },
          reaction: reaction || "",
        }),
      });
      const result = await safeJson(res);
      console.log("send-reaction result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND AUDIO
    if (action === "send-audio" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, audioBase64 } = await req.json();
      if (!remoteJid || !audioBase64) {
        return new Response(JSON.stringify({ error: "remoteJid e audioBase64 são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: resolveRecipient(remoteJid, remoteJidAlt), audio: stripDataUrl(audioBase64) }),
      });
      const result = await safeJson(res);
      console.log("send-audio result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND MEDIA (image/video)
    if (action === "send-media" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, mediaBase64, caption, mediaType, mimeType, fileName } = await req.json();
      if (!remoteJid || !mediaBase64) {
        return new Response(JSON.stringify({ error: "remoteJid e mediaBase64 são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const endpoint = mediaType === "video" ? "sendMedia" : "sendMedia";
      const res = await fetch(`${EVOLUTION_API_URL}/message/${endpoint}/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: resolveRecipient(remoteJid, remoteJidAlt),
          media: stripDataUrl(mediaBase64),
          caption: caption || "",
          mediatype: mediaType || "image",
          mimetype: mimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
          fileName: fileName || (mediaType === "video" ? "video.mp4" : "imagem.jpg"),
        }),
      });
      const result = await safeJson(res);
      console.log("send-media result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND DOCUMENT
    if (action === "send-document" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, documentBase64, fileName, mimeType } = await req.json();
      if (!remoteJid || !documentBase64) {
        return new Response(JSON.stringify({ error: "remoteJid e documentBase64 são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: resolveRecipient(remoteJid, remoteJidAlt),
          media: stripDataUrl(documentBase64),
          mediatype: "document",
          fileName: fileName || "documento",
          mimetype: mimeType || "application/pdf",
        }),
      });
      const result = await safeJson(res);
      console.log("send-document result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND CONTACT (vCard)
    if (action === "send-contact" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, contactName, contactPhone } = await req.json();
      if (!remoteJid || !contactName || !contactPhone) {
        return new Response(JSON.stringify({ error: "remoteJid, contactName e contactPhone são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendContact/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: resolveRecipient(remoteJid, remoteJidAlt),
          contact: [{ fullName: contactName, wuid: contactPhone.replace(/\D/g, ""), phoneNumber: contactPhone }],
        }),
      });
      const result = await safeJson(res);
      console.log("send-contact result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND POLL
    if (action === "send-poll" && req.method === "POST") {
      const { remoteJid, remoteJidAlt, pollName, pollOptions, selectableCount } = await req.json();
      if (!remoteJid || !pollName || !pollOptions || !Array.isArray(pollOptions) || pollOptions.length < 2) {
        return new Response(JSON.stringify({ error: "remoteJid, pollName e pelo menos 2 opções são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/message/sendPoll/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: resolveRecipient(remoteJid, remoteJidAlt),
          name: pollName,
          values: pollOptions,
          selectableCount: selectableCount || 1,
        }),
      });
      const result = await safeJson(res);
      console.log("send-poll result:", JSON.stringify(result).substring(0, 500));

      return new Response(JSON.stringify({ success: res.status >= 200 && res.status < 300, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LIST CONTACTS (for group creation)
    if (action === "contacts") {
      try {
        const data = await evoFetch(
          `/chat/findContacts/${instance.instance_name}`,
          { method: "POST", body: JSON.stringify({}) },
          25000,
        );

        if (!Array.isArray(data)) {
          // Evolution returned an error object or null — surface a clean message
          // instead of returning empty contacts (which the UI then shows as
          // "Nenhuma conversa encontrada", masking the real problem).
          const errMsg = (data && typeof data === "object" && "message" in data)
            ? String((data as any).message)
            : "A Evolution API não retornou a lista. Tente novamente em alguns segundos.";
          return new Response(JSON.stringify({ contacts: [], error: errMsg }), {
            status: 200, // 200 so the client doesn't throw on res.ok
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const contacts = data
          .filter((c: any) => {
            const jid = c?.remoteJid || c?.id || "";
            return typeof jid === "string" && jid.endsWith("@s.whatsapp.net");
          })
          .map((c: any) => ({
            jid: c.remoteJid || c.id,
            name: c.pushName || c.name || c.contactName || String(c.remoteJid || c.id || "").replace("@s.whatsapp.net", ""),
            profilePicUrl: c.profilePicUrl || null,
          }))
          .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));

        return new Response(JSON.stringify({ contacts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        const isTimeout = e?.name === "AbortError";
        console.error("contacts action failed:", e?.message || e);
        return new Response(JSON.stringify({
          contacts: [],
          error: isTimeout
            ? "Tempo esgotado ao buscar contatos. Sua agenda do WhatsApp pode estar muito grande — tente de novo."
            : (e?.message || "Erro ao carregar contatos. Verifique se sua instância está conectada."),
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // GET MEDIA (base64 from a message)
    if (action === "get-media" && req.method === "POST") {
      const { messageId, remoteJid, fromMe } = await req.json();
      if (!messageId || !remoteJid) {
        return new Response(JSON.stringify({ error: "messageId e remoteJid são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instance.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          message: { key: { id: messageId, remoteJid, fromMe: fromMe ?? false } },
          convertToMp4: false,
        }),
      });
      const result = await res.json();
      console.log("get-media response keys:", Object.keys(result).join(","), "base64 length:", result?.base64?.length || 0);

      return new Response(JSON.stringify({
        success: !!result?.base64,
        base64: result?.base64 || "",
        mimetype: result?.mimetype || result?.mediaType || "",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    // Log error to api_error_logs
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceKey);
      await sb.from("api_error_logs").insert({
        function_name: "whatsapp-inbox",
        error_message: error.message || "Erro desconhecido",
        error_details: { stack: error.stack },
      });
    } catch (_) {}
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
