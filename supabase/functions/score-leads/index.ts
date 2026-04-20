import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_ids } = await req.json();

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return new Response(JSON.stringify({ error: "lead_ids é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size
    const ids = lead_ids.slice(0, 50);

    // Resolve caller's licenses so we scope the lead lookup to their tenant.
    // Without this, any authenticated user could pass arbitrary lead UUIDs
    // and leak / mutate leads owned by other users.
    const { data: ownedLicenses } = await supabase
      .from("licenses")
      .select("id")
      .eq("assigned_to", user.id);
    const licenseIds = (ownedLicenses || []).map((l: any) => l.id);
    if (licenseIds.length === 0) {
      return new Response(JSON.stringify({ error: "Usuário sem licença" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch leads that belong to the user (scoped by license_id).
    // IMPORTANT: we do NOT filter by `name IS NOT NULL` — leads without a name
    // are still scored (low, based on remaining fields) so nothing is left behind.
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, instagram, phone, category, website, linkedin, notes, lead_status, created_at, license_id")
      .in("id", ids)
      .in("license_id", licenseIds);

    if (leadsError || !leads || leads.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum lead encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for scoring
    const leadsText = leads.map((l: any, i: number) => {
      const fields = [];
      if (l.name) fields.push(`Nome: ${l.name}`);
      if (l.phone) fields.push(`Telefone: ${l.phone}`);
      if (l.email) fields.push(`Email: ${l.email}`);
      if (l.instagram) fields.push(`Instagram: ${l.instagram}`);
      if (l.website) fields.push(`Site: ${l.website}`);
      if (l.linkedin) fields.push(`LinkedIn: ${l.linkedin}`);
      if (l.category) fields.push(`Categoria: ${l.category}`);
      if (l.lead_status) fields.push(`Status: ${l.lead_status}`);
      if (l.notes) fields.push(`Notas: ${l.notes}`);
      return `[Lead ${i + 1} | ID: ${l.id}]\n${fields.join("\n")}`;
    }).join("\n\n");

    const systemPrompt = `Você é um especialista em qualificação de leads B2B. Analise cada lead e atribua um score de 0 a 100 baseado na probabilidade de conversão.

Critérios de scoring:
- Dados de contato completos (telefone + email + site + redes sociais) = maior score
- Presença de website = indica empresa mais estruturada (+pontos)
- Presença de LinkedIn = indica profissionalismo (+pontos)
- Email corporativo (não gmail/hotmail) = mais qualificado (+pontos)  
- Instagram com muitos seguidores potencial (handle profissional) = +pontos
- Status "quente" ou "agendado" = já qualificado previamente (+pontos)
- Notas indicando interesse = +pontos
- Apenas telefone sem outros dados = lead frio (score baixo)
- Sem nome = score muito baixo (5-20), mas AINDA ASSIM atribua um score

REGRA CRÍTICA: VOCÊ DEVE retornar um objeto para CADA lead enviado, sem exceção.
Mesmo leads com pouquíssima informação DEVEM receber um score (baixo).
NUNCA omita um lead do resultado. Se tiver dúvida, atribua 10.

Responda APENAS com um JSON array no formato: [{"id": "uuid", "score": 85}, ...]
Sem explicações adicionais.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: leadsText },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      const lowQuota =
        response.status === 429 || /insufficient_quota|quota|billing/i.test(errorText);
      const friendly = lowQuota
        ? "A IA de qualificação está temporariamente indisponível (cota esgotada)."
        : "Erro ao processar com IA.";
      return new Response(JSON.stringify({ error: friendly, ai_unavailable: true }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content: string | undefined = aiData.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let scores: { id: string; score: number }[];
    try {
      // Extract JSON from potential markdown code blocks
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      scores = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao interpretar resposta da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deterministic fallback score — used when the AI omits a lead from its
    // JSON response. Guarantees every lead sent in gets a score.
    const heuristicScore = (l: any): number => {
      let score = 0;
      const has = (v: any) => !!v && String(v).trim() !== "" && String(v).toLowerCase() !== "não encontrado";
      if (has(l.name)) score += 15;
      if (has(l.phone)) score += 20;
      if (has(l.email)) {
        score += 15;
        const domain = String(l.email).split("@")[1]?.toLowerCase() || "";
        const isCorporate = domain && !/(gmail|hotmail|yahoo|outlook|icloud|live|uol|bol|terra)\./.test(domain);
        if (isCorporate) score += 10;
      }
      if (has(l.website)) score += 15;
      if (has(l.linkedin)) score += 10;
      if (has(l.instagram)) score += 8;
      if (has(l.notes)) score += 5;
      if (l.lead_status === "quente" || l.lead_status === "agendado") score += 10;
      return Math.max(5, Math.min(100, score));
    };

    // Map AI scores by id for quick lookup; anything missing gets heuristic fallback.
    const aiScoreMap = new Map<string, number>();
    for (const item of scores) {
      if (item?.id) aiScoreMap.set(item.id, Math.max(0, Math.min(100, Math.round(item.score))));
    }

    // Update each lead with its score — scoped to caller's licenses so the
    // AI can't be coaxed into writing scores for other tenants' leads.
    const now = new Date().toISOString();
    const results: { id: string; score: number; source: "ai" | "fallback" }[] = [];
    for (const lead of leads) {
      const aiScore = aiScoreMap.get(lead.id);
      const score = aiScore ?? heuristicScore(lead);
      const source: "ai" | "fallback" = aiScore !== undefined ? "ai" : "fallback";
      const { error: updateError } = await supabase
        .from("leads")
        .update({ lead_score: score, scored_at: now })
        .eq("id", lead.id)
        .in("license_id", licenseIds);

      if (!updateError) {
        results.push({ id: lead.id, score, source });
      }
    }

    return new Response(JSON.stringify({ success: true, scores: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("score-leads error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
