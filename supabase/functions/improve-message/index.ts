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
            content: `Você é um especialista em copywriting para prospecção via WhatsApp no Brasil.
Regras obrigatórias:
- NUNCA use gênero (ele/ela, senhor/senhora, caro/cara). Use linguagem neutra sempre.
- Mantenha tom profissional mas amigável e natural para WhatsApp.
- Foque em despertar interesse e gerar resposta.
- Seja conciso e direto (máximo 3 parágrafos curtos).
- NÃO adicione emojis em excesso, use no máximo 2-3 bem posicionados.
- NÃO adicione saudação genérica tipo "Olá, tudo bem?".
- NÃO invente dados ou promessas que não estejam na mensagem original.
- Retorne APENAS a mensagem melhorada, sem explicações.`,
          },
          {
            role: "user",
            content: `Melhore esta mensagem de prospecção para WhatsApp:\n\n${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
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
    console.error("improve-message error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
