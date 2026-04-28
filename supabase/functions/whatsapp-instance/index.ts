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

      const instanceName = `user_${userId.replace(/-/g, "").substring(0, 16)}`;

      const evoData = await evoFetch("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
        }),
      });

      // Save to DB
      const { error: insertError } = await supabase
        .from("whatsapp_instances")
        .insert({
          user_id: userId,
          instance_name: instanceName,
          status: "created",
        });

      if (insertError) throw insertError;

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
