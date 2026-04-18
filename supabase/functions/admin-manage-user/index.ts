import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await authedClient.auth.getUser();
    if (authErr || !user) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!callerProfile?.is_admin) return json({ error: "Acesso negado" }, 403);

    const body = await req.json();
    const action = body.action as string;

    // ========================================================
    // CREATE USER: email + password + optional name/phone + license
    // ========================================================
    if (action === "create-user") {
      const {
        email,
        password,
        display_name,
        whatsapp_phone,
        plan_type = "enterprise",
        monthly_credits = 1000,
        extra_credits = 0,
        expires_days = null, // null = never expires
      } = body;

      if (!email || !password) return json({ error: "Email e senha são obrigatórios" }, 400);
      if (password.length < 6) return json({ error: "Senha precisa ter no mínimo 6 caracteres" }, 400);

      // Create auth user (auto-confirm email)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || null },
      });
      if (createErr || !created.user) {
        return json({ error: createErr?.message || "Erro ao criar usuário" }, 400);
      }

      const newUserId = created.user.id;

      // Upsert profile (trigger usually creates it, but be safe)
      await admin.from("profiles").upsert(
        {
          user_id: newUserId,
          email,
          display_name: display_name || null,
          whatsapp_phone: whatsapp_phone || null,
          is_admin: false,
        },
        { onConflict: "user_id" }
      );

      // Create license assigned to this user
      const code = `ADMIN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const expires_at = expires_days
        ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: license, error: licErr } = await admin
        .from("licenses")
        .insert({
          code,
          plan_type,
          is_active: true,
          assigned_to: newUserId,
          monthly_credits,
          used_credits: 0,
          extra_credits,
          expires_at,
          search_expires_at: expires_at,
        })
        .select()
        .single();

      if (licErr) {
        // Rollback: delete the auth user we just created
        await admin.auth.admin.deleteUser(newUserId);
        return json({ error: `Falha ao criar licença: ${licErr.message}` }, 500);
      }

      return json({ success: true, user_id: newUserId, license });
    }

    // ========================================================
    // UPDATE CREDITS: set or add credits on an existing user's license
    // ========================================================
    if (action === "update-credits") {
      const {
        user_id,
        monthly_credits, // if provided, replaces
        extra_credits_add = 0, // adds to existing
        extra_credits_set, // if provided, replaces
        reset_used = false, // if true, zeroes used_credits
      } = body;

      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      const { data: lic, error: fetchErr } = await admin
        .from("licenses")
        .select("*")
        .eq("assigned_to", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) return json({ error: fetchErr.message }, 500);
      if (!lic) return json({ error: "Usuário não tem licença atribuída" }, 404);

      const patch: Record<string, unknown> = {};
      if (typeof monthly_credits === "number") patch.monthly_credits = monthly_credits;
      if (typeof extra_credits_set === "number") {
        patch.extra_credits = extra_credits_set;
      } else if (extra_credits_add) {
        patch.extra_credits = (lic.extra_credits || 0) + extra_credits_add;
      }
      if (reset_used) patch.used_credits = 0;

      if (Object.keys(patch).length === 0) return json({ error: "Nada para atualizar" }, 400);

      const { data: updated, error: updErr } = await admin
        .from("licenses")
        .update(patch)
        .eq("id", lic.id)
        .select()
        .single();

      if (updErr) return json({ error: updErr.message }, 500);
      return json({ success: true, license: updated });
    }

    // ========================================================
    // UPDATE LICENSE: extend expiration, toggle active, change plan
    // ========================================================
    if (action === "update-license") {
      const {
        user_id,
        plan_type,
        is_active,
        expires_days_from_now, // positive number = set expires_at = now + N days, 0 or null = never
        extend_days, // adds to existing expires_at
      } = body;

      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      let { data: lic } = await admin
        .from("licenses")
        .select("*")
        .eq("assigned_to", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If the user has no license yet, create one so admin can upgrade any
      // user (even "sem licença") into free/mensal/anual/lifetime/etc.
      if (!lic) {
        const code = `ADMIN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const { data: created, error: createErr } = await admin
          .from("licenses")
          .insert({
            code,
            plan_type: plan_type || "free",
            is_active: true,
            assigned_to: user_id,
            monthly_credits: 60,
            used_credits: 0,
            extra_credits: 0,
          })
          .select()
          .single();
        if (createErr) return json({ error: `Falha ao criar licença: ${createErr.message}` }, 500);
        lic = created;
      }

      const patch: Record<string, unknown> = {};
      if (plan_type) patch.plan_type = plan_type;
      if (typeof is_active === "boolean") patch.is_active = is_active;
      if (typeof expires_days_from_now === "number") {
        if (expires_days_from_now <= 0) {
          patch.expires_at = null;
          patch.search_expires_at = null;
        } else {
          const newDate = new Date(Date.now() + expires_days_from_now * 86400000).toISOString();
          patch.expires_at = newDate;
          patch.search_expires_at = newDate;
        }
      } else if (typeof extend_days === "number" && extend_days > 0) {
        const base = lic.expires_at ? new Date(lic.expires_at) : new Date();
        const newDate = new Date(base.getTime() + extend_days * 86400000).toISOString();
        patch.expires_at = newDate;
        patch.search_expires_at = newDate;
      }

      if (Object.keys(patch).length === 0) return json({ error: "Nada para atualizar" }, 400);

      const { data: updated, error: updErr } = await admin
        .from("licenses")
        .update(patch)
        .eq("id", lic.id)
        .select()
        .single();

      if (updErr) return json({ error: updErr.message }, 500);
      return json({ success: true, license: updated });
    }

    // ========================================================
    // DELETE USER: removes auth user, profile cascades, license unassigns
    // ========================================================
    if (action === "delete-user") {
      const { user_id } = body;
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);
      if (user_id === user.id) return json({ error: "Você não pode se deletar" }, 400);

      // Unassign licenses first (so they're not lost)
      await admin.from("licenses").update({ assigned_to: null, is_active: false }).eq("assigned_to", user_id);

      const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
      if (delErr) return json({ error: delErr.message }, 500);

      return json({ success: true });
    }

    // ========================================================
    // RESET PASSWORD: set a new password for a user
    // ========================================================
    if (action === "reset-password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) return json({ error: "user_id e new_password obrigatórios" }, 400);
      if (new_password.length < 6) return json({ error: "Senha muito curta" }, 400);

      const { error: updErr } = await admin.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (updErr) return json({ error: updErr.message }, 500);
      return json({ success: true });
    }

    return json({ error: `Ação inválida: ${action}` }, 400);
  } catch (err) {
    console.error("admin-manage-user error:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
