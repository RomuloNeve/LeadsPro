import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "overview") {
      // Fetch all stats in parallel
      const [
        profilesRes,
        licensesRes,
        leadsRes,
        campaignsRes,
        instancesRes,
        errorLogsRes,
        recentErrorsRes,
        authUsersRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, user_id, email, created_at, whatsapp_phone, is_admin"),
        supabase.from("licenses").select("*"),
        supabase.from("leads").select("id, license_id, created_at", { count: "exact", head: true }),
        supabase.from("campaigns").select("id, status, license_id", { count: "exact" }),
        supabase.from("whatsapp_instances").select("*"),
        supabase.from("api_error_logs").select("id", { count: "exact", head: true }),
        supabase.from("api_error_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      const profiles = profilesRes.data || [];
      const licenses = licensesRes.data || [];
      const instances = instancesRes.data || [];
      const recentErrors = recentErrorsRes.data || [];
      const authUsers = authUsersRes.data?.users || [];

      // Build user details with their auth info
      const users = profiles.map((p: any) => {
        const authUser = authUsers.find((u: any) => u.id === p.user_id);
        const userLicense = licenses.find((l: any) => l.assigned_to === p.user_id);
        const userInstance = instances.find((i: any) => i.user_id === p.user_id);
        return {
          ...p,
          last_sign_in: authUser?.last_sign_in_at || null,
          created_at_auth: authUser?.created_at || p.created_at,
          license: userLicense || null,
          instance: userInstance || null,
        };
      });

      return new Response(JSON.stringify({
        users,
        licenses,
        instances,
        totalLeads: leadsRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        totalErrors: errorLogsRes.count || 0,
        recentErrors,
        stats: {
          totalUsers: profiles.length,
          adminUsers: profiles.filter((p: any) => p.is_admin).length,
          activeLicenses: licenses.filter((l: any) => l.is_active).length,
          inactiveLicenses: licenses.filter((l: any) => !l.is_active).length,
          assignedLicenses: licenses.filter((l: any) => l.assigned_to).length,
          unassignedLicenses: licenses.filter((l: any) => !l.assigned_to).length,
          activeInstances: instances.filter((i: any) => i.status === "connected").length,
          inactiveInstances: instances.filter((i: any) => i.status !== "connected").length,
          totalInstances: instances.length,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "errors") {
      const { data, error } = await supabase
        .from("api_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({ errors: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "clear-errors") {
      const { error } = await supabase.from("api_error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      return new Response(JSON.stringify({ success: !error }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "api-credits") {
      const results: any[] = [];

      // Check SerpAPI keys
      const serpApiKeys = [
        { name: "SerpAPI 1", key: Deno.env.get("SERPAPI_KEY_1") },
        { name: "SerpAPI 2", key: Deno.env.get("SERPAPI_KEY_2") },
      ];

      for (const { name, key } of serpApiKeys) {
        if (!key) { results.push({ name, error: "Chave não configurada" }); continue; }
        try {
          const res = await fetch(`https://serpapi.com/account.json?api_key=${key}`);
          if (res.ok) {
            const data = await res.json();
            results.push({
              name,
              plan: data.plan_name || data.plan_id || "N/A",
              searches_per_month: data.searches_per_month || 0,
              searches_left: data.plan_searches_left ?? data.total_searches_left ?? 0,
              this_month_usage: data.this_month_usage || 0,
              extra_credits: data.extra_credits || 0,
              total_left: data.total_searches_left || 0,
            });
          } else {
            results.push({ name, error: `HTTP ${res.status}` });
          }
        } catch (e) {
          results.push({ name, error: (e as Error).message });
        }
      }

      // Serper keys - no account API, just list them as configured
      const serperKeys = [
        { name: "Serper 1", key: Deno.env.get("SERPER_API_KEY") },
        { name: "Serper 2", key: Deno.env.get("SERPER_API_KEY_2") },
        { name: "Serper 3", key: Deno.env.get("SERPER_API_KEY_3") },
        { name: "Serper 4", key: Deno.env.get("SERPER_API_KEY_4") },
      ];

      for (const { name, key } of serperKeys) {
        if (!key) { results.push({ name, error: "Chave não configurada", type: "serper" }); continue; }
        try {
          // Use /account endpoint (no credit cost)
          const res = await fetch("https://google.serper.dev/account", {
            method: "GET",
            headers: { "X-API-KEY": key, "Content-Type": "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            results.push({
              name,
              type: "serper",
              status: "active",
              remaining_credits: data.credits ?? data.credit ?? data.balance ?? null,
              raw_account: data,
            });
          } else if (res.status === 404) {
            // /account not available, fallback: do a minimal search and read headers
            const searchRes = await fetch("https://google.serper.dev/search", {
              method: "POST",
              headers: { "X-API-KEY": key, "Content-Type": "application/json" },
              body: JSON.stringify({ q: "test", num: 1 }),
            });
            // Capture ALL headers for debugging
            const allHeaders: Record<string, string> = {};
            searchRes.headers.forEach((value, headerName) => {
              const lower = headerName.toLowerCase();
              if (lower.includes("credit") || lower.includes("remaining") || lower.includes("limit") || lower.includes("usage") || lower.includes("quota")) {
                allHeaders[headerName] = value;
              }
            });
            if (searchRes.ok) {
              // Try known header names
              const credits = searchRes.headers.get("x-credits-remaining") 
                || searchRes.headers.get("x-remaining-credits") 
                || searchRes.headers.get("x-credit-usage")
                || searchRes.headers.get("x-ratelimit-remaining");
              results.push({
                name,
                type: "serper",
                status: "active",
                remaining_credits: credits ? parseInt(credits) : null,
                credit_headers: allHeaders,
                note: Object.keys(allHeaders).length === 0 
                  ? "Nenhum header de créditos encontrado. Verifique em serper.dev/dashboard" 
                  : undefined,
              });
            } else if (searchRes.status === 403 || searchRes.status === 401) {
              results.push({ name, type: "serper", status: "expired", error: "Chave expirada ou sem créditos" });
            } else {
              results.push({ name, type: "serper", status: "error", error: `HTTP ${searchRes.status}` });
            }
          } else if (res.status === 403 || res.status === 401) {
            results.push({ name, type: "serper", status: "expired", error: "Chave expirada ou sem créditos" });
          } else {
            results.push({ name, type: "serper", status: "error", error: `HTTP ${res.status}` });
          }
        } catch (e) {
          results.push({ name, type: "serper", error: (e as Error).message });
        }
      }

      return new Response(JSON.stringify({ credits: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============ EXPORT LEADS ============
    if (action === "export-leads") {
      const { license_id, category, fields } = body;
      
      let query = supabase.from("leads").select("name, phone, email, instagram, category, website, linkedin, created_at")
        .eq("is_duplicate", false);

      if (license_id) {
        query = query.eq("license_id", license_id);
      }
      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      // Paginate to get all leads (bypass 1000 limit)
      let allLeads: any[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) break;
        allLeads = [...allLeads, ...(data || [])];
        if (!data || data.length < pageSize) break;
        page++;
      }

      // Get categories for filter options
      const cats = [...new Set(allLeads.map((l: any) => l.category).filter(Boolean))].sort();

      return new Response(JSON.stringify({ leads: allLeads, categories: cats, total: allLeads.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
