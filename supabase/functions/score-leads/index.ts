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

    // Fetch leads that belong to the user
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, instagram, phone, category, website, linkedin, notes, lead_status, created_at")
      .in("id", ids)
      .not("name", "is", null);

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
- Sem nome = score muito baixo

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
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content?.trim();

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

    // Update each lead with its score
    const now = new Date().toISOString();
    const results = [];
    for (const item of scores) {
      const score = Math.max(0, Math.min(100, Math.round(item.score)));
      const { error: updateError } = await supabase
        .from("leads")
        .update({ lead_score: score, scored_at: now })
        .eq("id", item.id);

      if (!updateError) {
        results.push({ id: item.id, score });
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
