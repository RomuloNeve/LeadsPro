import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Mensagem vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

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
            content: `Você é um especialista em email marketing e copywriting para o mercado brasileiro.
Regras obrigatórias:
- Use linguagem natural e masculina como padrão (ex: "animados", "interessados", etc).
- Escreva um email profissional, persuasivo e com boa estrutura visual.
- Use parágrafos curtos e espaçados para facilitar a leitura.
- Inclua uma chamada para ação (CTA) clara e objetiva.
- Mantenha tom profissional mas acessível e humano.
- NÃO use emojis em excesso, no máximo 2-3 bem posicionados.
- NÃO invente dados, estatísticas ou promessas que não estejam na mensagem original.
- Preserve a intenção e informações-chave da mensagem original.
- Melhore a estrutura, clareza e poder de persuasão do texto.
- Retorne APENAS o corpo do email melhorado, sem assunto, sem explicações extras.`,
          },
          {
            role: "user",
            content: `Melhore este corpo de email marketing:\n\n${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const improved = data.choices?.[0]?.message?.content?.trim();

    return new Response(JSON.stringify({ improved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("improve-email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
