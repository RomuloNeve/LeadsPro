import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/chatbot-webhook`;

async function configureWebhook(instanceName: string) {
  try {
    await evoFetch(`/webhook/set/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          webhookByEvents: true,
          webhookBase64: false,
          events: ["MESSAGES_UPSERT"],
        },
      }),
    });
    console.log(`Webhook configured for ${instanceName}: ${WEBHOOK_URL}`);
  } catch (e) {
    console.error(`Failed to configure webhook for ${instanceName}:`, e);
  }
}

/** Apply the operating settings to an instance: full history sync,
 *  always online (so we keep receiving messages even when the
 *  WhatsApp app isn't foregrounded), reject calls automatically.
 *  Best-effort — never blocks the create flow. */
async function configureInstanceSettings(instanceName: string) {
  try {
    await evoFetch(`/settings/set/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        rejectCall: false,
        msgCall: "",
        groupsIgnore: false,
        alwaysOnline: true,        // keep WS alive; required for live message flow
        readMessages: false,
        readStatus: false,
        syncFullHistory: true,     // download chat history on first pair
      }),
    });
    console.log(`Settings configured for ${instanceName} (history sync + alwaysOnline)`);
  } catch (e) {
    console.error(`Failed to set settings for ${instanceName}:`, e);
  }
}

async function evoFetch(path: string, options: RequestInit = {}) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error("Servidor WhatsApp não configurado (env vars ausentes). Contate o suporte.");
  }
  const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
  const url = `${baseUrl}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
        ...(options.headers || {}),
      },
      signal: ctrl.signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Tempo esgotado conectando ao servidor WhatsApp. Tente de novo em alguns segundos.");
    }
    throw new Error("Não foi possível alcançar o servidor WhatsApp. Verifique sua conexão e tente novamente.");
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

  if (!res.ok) {
    // Detailed log for the admin error console — includes URL + status + payload
    console.error(
      `Evolution API ${res.status} ${res.statusText} on ${path} —`,
      JSON.stringify(data ?? text).substring(0, 400),
    );
    // Friendly user-facing messages by status family
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Configuração do servidor WhatsApp inválida (chave de API rejeitada). Contate o suporte para regenerar a credencial."
      );
    }
    if (res.status === 404) {
      throw new Error("Recurso WhatsApp não encontrado no servidor. A instância pode ter sido removida.");
    }
    if (res.status === 409) {
      throw new Error("Já existe uma instância com esse nome. Tente reconectar.");
    }
    if (res.status >= 500) {
      throw new Error("Servidor WhatsApp instável no momento. Tente novamente em 30 segundos.");
    }
    throw new Error(data?.message || data?.error || `Erro inesperado (HTTP ${res.status}).`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public diagnostic endpoint — short-circuits before auth so we can
    // verify the function is reading the right secrets even without a
    // valid session. Returns no sensitive values.
    {
      const dbgUrl = new URL(req.url);
      if (dbgUrl.searchParams.get("action") === "debug") {
        const k = EVOLUTION_API_KEY || "";
        const u = EVOLUTION_API_URL || "";
        let probeStatus: number | null = null;
        let probeError: string | null = null;
        try {
          const probeRes = await fetch(
            `${u.replace(/\/+$/, "")}/instance/fetchInstances`,
            { headers: { apikey: k } },
          );
          probeStatus = probeRes.status;
        } catch (e: any) {
          probeError = e?.message || String(e);
        }

        // Real create probe — same path the user code takes
        const testName = `__edgeprobe_${Math.random().toString(36).slice(2, 10)}`;
        let createStatus: number | null = null;
        let createBody: string | null = null;
        let createError: string | null = null;
        try {
          const cRes = await fetch(`${u.replace(/\/+$/, "")}/instance/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: k },
            body: JSON.stringify({
              instanceName: testName,
              integration: "WHATSAPP-BAILEYS",
              qrcode: false,
            }),
          });
          createStatus = cRes.status;
          createBody = (await cRes.text()).slice(0, 600);
          // best-effort cleanup
          if (cRes.ok) {
            await fetch(`${u.replace(/\/+$/, "")}/instance/delete/${testName}`, {
              method: "DELETE",
              headers: { apikey: k },
            }).catch(() => null);
          }
        } catch (e: any) {
          createError = e?.message || String(e);
        }

        return new Response(
          JSON.stringify({
            key_present: k.length > 0,
            key_length: k.length,
            key_first4: k.slice(0, 4),
            key_last4: k.slice(-4),
            key_has_leading_space: k.startsWith(" "),
            key_has_trailing_space: k.endsWith(" "),
            key_matches_expected: k === "leadspro-evo-2026",
            url_present: u.length > 0,
            url_value: u,
            evolution_probe_status: probeStatus,
            evolution_probe_error: probeError,
            create_probe_status: createStatus,
            create_probe_body: createBody,
            create_probe_error: createError,
          }, null, 2),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // CREATE INSTANCE
    if (action === "create" && req.method === "POST") {
      // Check if user already has an instance
      const { data: existing } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Você já possui uma instância WhatsApp." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use a timestamp-suffixed name so EVERY create gets a brand-new
      // Evolution instance. This avoids the "already in use" 403 entirely
      // and prevents accidentally adopting an orphan that may already be
      // paired with someone else's WhatsApp number.
      const baseUserPart = userId.replace(/-/g, "").substring(0, 12);
      const ts = Date.now().toString(36); // ~7 chars
      const instanceName = `user_${baseUserPart}_${ts}`;

      // Best-effort proactive cleanup: if Evolution has a stale instance
      // matching the user's previous naming pattern, log it out and delete
      // it so we don't accumulate zombies on the server.
      const legacyName = `user_${userId.replace(/-/g, "").substring(0, 16)}`;
      try {
        await evoFetch(`/instance/logout/${legacyName}`, { method: "DELETE" });
      } catch { /* not connected, fine */ }
      try {
        await evoFetch(`/instance/delete/${legacyName}`, { method: "DELETE" });
      } catch { /* not present, fine */ }

      // First-pass create — most users hit this path.
      // syncFullHistory: true is critical — without it, Baileys connects
      // but never downloads the user's existing chat history, and the
      // inbox stays empty until a brand-new message arrives.
      const createBody = JSON.stringify({
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
        syncFullHistory: true,
        alwaysOnline: true,
        rejectCall: false,
        readMessages: false,
        readStatus: false,
      });

      let evoData: any;
      try {
        evoData = await evoFetch("/instance/create", { method: "POST", body: createBody });
      } catch (createErr: any) {
        console.warn(`Create failed for ${instanceName}, retrying once:`, createErr?.message);
        await new Promise((r) => setTimeout(r, 1500));
        evoData = await evoFetch("/instance/create", { method: "POST", body: createBody });
      }

      // Belt-and-suspenders: re-apply settings via /settings/set in case
      // Evolution's create endpoint silently ignored the inline flags
      // (different versions accept different body shapes).
      await configureInstanceSettings(instanceName);

      // Save to DB
      const { error: insertError } = await supabase
        .from("whatsapp_instances")
        .insert({
          user_id: userId,
          instance_name: instanceName,
          status: "created",
        });

      if (insertError) {
        // Roll back the Evolution instance so we don't leave orphans for the
        // next attempt.
        try { await evoFetch(`/instance/delete/${instanceName}`, { method: "DELETE" }); } catch { /* best effort */ }
        throw insertError;
      }

      return new Response(
        JSON.stringify({ instance_name: instanceName, qrcode: evoData?.qrcode }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET QR CODE
    if (action === "qrcode" && req.method === "GET") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: "Nenhuma instância encontrada." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const evoData = await evoFetch(`/instance/connect/${instance.instance_name}`);
        return new Response(
          JSON.stringify({ qrcode: evoData?.base64 || evoData?.qrcode }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Não foi possível gerar QR Code. A instância pode já estar conectada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // CHECK STATUS
    if (action === "status" && req.method === "GET") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ status: "none" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const evoData = await evoFetch(
          `/instance/connectionState/${instance.instance_name}`
        );
        const state = evoData?.instance?.state || evoData?.state || "unknown";

        // Update local DB and auto-configure webhook on first connect
        const newStatus = state === "open" ? "connected" : "disconnected";
        if (newStatus !== instance.status) {
          await supabase
            .from("whatsapp_instances")
            .update({ status: newStatus })
            .eq("user_id", userId);

          // Auto-configure webhook when instance just connected
          if (newStatus === "connected") {
            await configureWebhook(instance.instance_name);

            // IMPORTANT: Deactivate chatbot on connect — user must activate manually
            const adminClient = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            const { data: userLicense } = await adminClient
              .from("licenses")
              .select("id")
              .eq("assigned_to", userId)
              .maybeSingle();

            if (userLicense) {
              await adminClient
                .from("chatbot_configs")
                .update({ is_active: false, auto_reply_all: false })
                .eq("license_id", userLicense.id);

              const { data: configs } = await adminClient
                .from("chatbot_configs")
                .select("id")
                .eq("license_id", userLicense.id);

              if (configs) {
                for (const cfg of configs) {
                  await adminClient
                    .from("chatbot_leads")
                    .update({ is_active: false })
                    .eq("config_id", cfg.id);
                }
              }
            }
            console.log(`Chatbot deactivated on instance connect for user ${userId}`);
          }
        }

        return new Response(
          JSON.stringify({
            status: newStatus,
            instance_name: instance.instance_name,
            state,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ status: instance.status, instance_name: instance.instance_name }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // FORCE SYNC — re-applies syncFullHistory + alwaysOnline settings and
    // restarts the instance to force Baileys to re-download history. Used
    // when an instance is "open" but reports zero chats/messages (zombie
    // WebSocket).
    if (action === "force-sync" && req.method === "POST") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: "Nenhuma instância encontrada. Crie uma primeiro." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Re-apply settings (history + alwaysOnline)
      await configureInstanceSettings(instance.instance_name);

      // 2. Re-apply webhook so MESSAGES_UPSERT events keep flowing in
      await configureWebhook(instance.instance_name);

      // 3. Restart the instance so Baileys reconnects with the new
      //    settings and triggers a history download.
      let restartedOk = false;
      try {
        await evoFetch(`/instance/restart/${instance.instance_name}`, { method: "POST" });
        restartedOk = true;
      } catch (e: any) {
        console.warn("instance/restart failed (continuing):", e?.message);
      }

      return new Response(
        JSON.stringify({
          ok: true,
          restarted: restartedOk,
          instance_name: instance.instance_name,
          message: restartedOk
            ? "Sincronização forçada — aguarde 30-60 segundos para o histórico aparecer na inbox."
            : "Configurações reaplicadas, mas o restart falhou. Reconecte manualmente se necessário.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DISCONNECT / DELETE - accept both DELETE and POST methods
    if (action === "disconnect" && (req.method === "DELETE" || req.method === "POST")) {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: "Nenhuma instância encontrada." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deactivate chatbot config when disconnecting instance
      const { data: userLicense } = await supabase
        .from("licenses")
        .select("id")
        .eq("assigned_to", userId)
        .maybeSingle();

      if (userLicense) {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await adminClient
          .from("chatbot_configs")
          .update({ is_active: false, auto_reply_all: false })
          .eq("license_id", userLicense.id);
        
        // Also deactivate all individual chatbot leads
        const { data: configs } = await adminClient
          .from("chatbot_configs")
          .select("id")
          .eq("license_id", userLicense.id);
        
        if (configs && configs.length > 0) {
          for (const cfg of configs) {
            await adminClient
              .from("chatbot_leads")
              .update({ is_active: false })
              .eq("config_id", cfg.id);
          }
        }
      }

      // Remove from DB first (fast operation)
      await supabase
        .from("whatsapp_instances")
        .delete()
        .eq("user_id", userId);

      // Logout + delete on Evolution (best effort, don't block)
      try {
        await evoFetch(`/instance/logout/${instance.instance_name}`, { method: "DELETE" });
      } catch { /* ignore if already disconnected */ }
      try {
        await evoFetch(`/instance/delete/${instance.instance_name}`, { method: "DELETE" });
      } catch { /* ignore */ }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FETCH GROUPS
    if (action === "groups" && req.method === "GET") {
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (!instance || instance.status !== "connected") {
        return new Response(
          JSON.stringify({ error: "Instância não conectada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const groups = await evoFetch(`/group/fetchAllGroups/${instance.instance_name}?getParticipants=false`);
      const formatted = (Array.isArray(groups) ? groups : []).map((g: any) => ({
        id: g.id,
        subject: g.subject,
        size: g.size || 0,
        creation: g.creation,
      }));

      return new Response(
        JSON.stringify(formatted),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
