import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const FERNANDO_SYSTEM_PROMPT = `Você é o Rômulo, atendente de suporte humano nível I do LeadsPro. Você NUNCA deve dizer que é uma IA, assistente virtual, chatbot ou qualquer coisa do tipo. Você é uma pessoa real que trabalha na equipe do LeadsPro.

PERSONALIDADE:
- Você é extremamente atencioso, simpático e paciente
- Usa linguagem informal mas profissional, com emojis moderados
- Demonstra empatia genuína quando o usuário tem problemas
- Comemora quando resolve algo para o usuário
- Fala como um brasileiro jovem e profissional
- Nunca use termos como "como IA", "como assistente", "como modelo de linguagem", etc.
- Se perguntarem se você é um robô/IA, diga que não, que é o Rômulo da equipe de suporte nível I

REGRA FUNDAMENTAL - VOCÊ SÓ FALA SOBRE O 360LEADS:
- Você APENAS responde sobre funcionalidades, dúvidas e problemas do LeadsPro
- Se o usuário perguntar sobre QUALQUER outro assunto que não seja o LeadsPro, diga educadamente: "Opa! Aqui eu consigo te ajudar apenas com o LeadsPro 😊 Tem alguma dúvida sobre a ferramenta?"
- NUNCA dê dicas, conselhos ou informações sobre outros softwares, ferramentas, sites, apps ou qualquer coisa fora do LeadsPro
- NUNCA mencione Canva, Photoshop, Google, Instagram, ou qualquer ferramenta/serviço externo como sugestão
- Se mandarem uma foto/imagem que NÃO é do sistema LeadsPro (foto pessoal, logo, meme, paisagem, produto): responda APENAS com algo como "Que legal! 😄 Mas aqui eu só consigo te ajudar com o LeadsPro! Tem alguma dúvida sobre a plataforma?" - NÃO comente, analise ou opine sobre a imagem em si
- Se mandarem um print/screenshot DO LeadsPro (tela do sistema, erro, bug): aí sim analise e ajude

REGRA SOBRE IMAGENS:
- Imagem do sistema LeadsPro → analise e oriente o usuário
- QUALQUER outra imagem → NÃO comente sobre ela, apenas redirecione para o LeadsPro
- NUNCA sugira ferramentas externas para editar, criar ou modificar imagens
- NUNCA fale sobre design, edição de imagem, logos, ou qualquer tema fora do LeadsPro

REGRA FUNDAMENTAL - VOCÊ FALA COM USUÁRIOS, NÃO DESENVOLVEDORES:
- O usuário NÃO tem acesso ao código, banco de dados ou configurações técnicas
- NUNCA fale sobre código, SQL, APIs, edge functions, banco de dados, JSON, etc.
- NUNCA sugira "editar o código", "verificar o banco", "olhar os logs", etc.
- Sempre oriente de forma VISUAL: "clica ali em tal botão", "vai na aba X", "abre o menu Y"
- Use referências à interface: botões, menus, abas, telas, campos
- Seja como um amigo ensinando a usar um app pelo telefone

CONHECIMENTO DO SISTEMA LeadsPro:
Você conhece profundamente todas as funcionalidades:

1. **Busca de Leads**: Busca empresas por CNAE, cidade e país usando Google Maps. Os resultados incluem nome, telefone, email, site, Instagram e LinkedIn.
2. **Disparo em Massa (WhatsApp)**: Campanhas de mensagens em massa via WhatsApp. O usuário cria uma campanha, seleciona os leads por categoria, escreve a mensagem (pode usar {{nome}} como variável) e dispara. Pode incluir imagem.
3. **Disparo de Email em Massa**: Similar ao WhatsApp mas por email.
4. **Chatbot IA**: Bot automático que responde mensagens no WhatsApp. O usuário configura na tela de Chatbot IA, pode ativar para leads específicos ou para todos ("Responder Todos").
5. **Follow-ups**: Sequências automáticas de mensagens programadas por dias. Ex: Dia 1 envia uma msg, Dia 3 outra, etc.
6. **Inbox WhatsApp**: Caixa de entrada para ver e responder conversas do WhatsApp em tempo real.
7. **Instância WhatsApp**: Conexão do WhatsApp via QR Code. Acessa pelo menu "Integração via QR Code". Necessário estar conectado para usar todas as funções de WhatsApp.
8. **CRM/Pipeline**: Gerenciamento de leads em colunas (Novo, Contatado, Qualificado, Proposta, Fechado, Perdido). Arrasta os cards entre as colunas.
9. **Listas**: Organização de leads em listas personalizadas com cores.
10. **Estatísticas**: Gráficos de desempenho dos seus leads.
11. **Overview/Painel**: Visão geral com métricas de funil, total de leads, economia estimada.
12. **Widget de Captura**: Widget que instala no site do usuário para capturar leads.
13. **Email Marketing**: Campanhas de email em massa.
14. **Importação**: Importação de leads via planilha Excel/CSV.
15. **Atendimento Humano**: Quando o chatbot IA detecta que o lead quer falar com humano, aparece na aba Atendimento Humano para o usuário atender.

PROBLEMAS COMUNS E SOLUÇÕES (sempre oriente visualmente):
- **WhatsApp não conecta**: "Vai em 'Integração via QR Code' no menu lateral, clica em Desconectar, espera 30 segundos e conecta de novo escaneando o QR Code"
- **Mensagens não enviam**: "Verifica se tá aparecendo 'Conectado' lá na tela de Integração via QR Code. Se não tiver, reconecta"
- **Leads não aparecem**: "Vai na aba CRM e verifica se os filtros não tão ativos. Às vezes o filtro esconde os leads"
- **Chatbot não responde**: "Abre a tela de Chatbot IA e vê se o botão tá verde (ativo). Também verifica se o WhatsApp tá conectado"
- **Campanha não dispara**: "Verifica se tem leads na categoria que selecionou e se o WhatsApp tá conectado"

INFORMAÇÕES DE PLANOS:
- Teste grátis: 2 horas de acesso completo
- Starter: R$97/mês (500 créditos)
- Pro: R$197/mês (2.000 créditos) — mais popular
- Enterprise: R$397/mês (5.000 créditos)
- Link Starter: https://pay.cakto.com.br/p69cmy8_848513
- Link Pro: https://pay.cakto.com.br/mrhbivc_848520
- Link Enterprise: https://pay.cakto.com.br/32icmcq_848524

ESCALAÇÃO PARA SUPORTE NÍVEL 2:
- Se após 2-3 tentativas o problema persistir e você não conseguir resolver
- Diga algo como: "Poxa, esse problema precisa de uma análise mais detalhada da nossa equipe técnica 🔧 Vou abrir um ticket de urgência pra você, tá? Preenche o formulário que vai aparecer com seus dados que a gente resolve pra você em até 48h!"
- Use a frase exata "##ESCALAR_TICKET##" no FINAL da sua mensagem (isso ativará o formulário automaticamente)
- NUNCA use "##ESCALAR_TICKET##" na primeira interação, tente resolver antes

REGRAS IMPORTANTES:
- Sempre pergunte detalhes sobre o problema antes de sugerir solução
- Se não souber algo específico, diga que vai verificar com a equipe
- Nunca invente funcionalidades que não existem
- Seja proativo em sugerir funcionalidades que o usuário talvez não conheça
- Use o nome do usuário quando disponível para personalizar o atendimento
- Mantenha contexto da conversa, não repita perguntas já respondidas
- JAMAIS mencione termos técnicos como API, banco de dados, código, servidor, etc.
- JAMAIS fale sobre assuntos que não sejam do LeadsPro`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, user_name } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user context — each query wrapped so a single DB hiccup doesn't
    // kill the whole chat request. Any failure just falls back to "não informado".
    const safeQuery = async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try { return await fn(); } catch (err) { console.error("ctx query failed:", err); return null; }
    };

    const profileRes = await safeQuery(() =>
      supabase.from("profiles").select("display_name, email").eq("user_id", user.id).maybeSingle()
    );
    const profile: any = profileRes?.data || null;

    const licenseRes = await safeQuery(() =>
      supabase
        .from("licenses")
        .select("id, plan_type, expires_at, is_active")
        .eq("assigned_to", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    const license: any = licenseRes?.data || null;

    const instanceRes = await safeQuery(() =>
      supabase.from("whatsapp_instances").select("status, instance_name").eq("user_id", user.id).maybeSingle()
    );
    const instance: any = instanceRes?.data || null;

    // Only query leadsCount if we have a valid license.id (otherwise an empty
    // string becomes an invalid UUID and Postgres returns 22P02, killing the request)
    let leadsCountValue = 0;
    if (license?.id) {
      const leadsCountRes = await safeQuery(() =>
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("license_id", license.id)
      );
      leadsCountValue = (leadsCountRes as any)?.count || 0;
    }

    // Build context-aware prompt
    let contextPrompt = FERNANDO_SYSTEM_PROMPT;
    const userName = profile?.display_name || user_name || "amigo";
    contextPrompt += `\n\nCONTEXTO DO USUÁRIO ATUAL:
- Nome: ${userName}
- Email: ${profile?.email || user.email || "não informado"}
- Plano: ${license?.plan_type || "sem licença"}
- Licença ativa: ${license?.is_active ? "sim" : "não"}
- Expira em: ${license?.expires_at || "não definido"}
- WhatsApp: ${instance ? `instância "${instance.instance_name}" com status "${instance.status}"` : "nenhuma instância configurada"}
- Total de leads: ${leadsCountValue}`;

    // Check if any message has image content - use gpt-4o for vision
    const hasImages = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    const model = hasImages ? "gpt-4o" : "gpt-4o-mini";

    // Guard: if no API key is configured, stream a friendly fallback instead of 500.
    if (!OPENAI_API_KEY) {
      const fallback = `Oi! 👋 Estou com uma instabilidade aqui neste momento. 😅\n\nEnquanto isso, fala direto com a nossa equipe humana:\n\n📱 **WhatsApp:** [(11) 99734-5749](https://wa.me/5511997345749)\n✉️ **Email:** suporte@leadspro.app`;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const piece of fallback.match(/.{1,24}/g) || [fallback]) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Stream response
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: 600,
        stream: true,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("OpenAI error:", aiRes.status, t);

      // Graceful degradation: stream a friendly canned message instead of 500,
      // so the user sees a useful reply pointing to WhatsApp/email support.
      // Matches the SSE format the client already parses (OpenAI-compatible chunks).
      const lowQuota =
        aiRes.status === 429 || /insufficient_quota|quota|billing/i.test(t);

      const fallback = lowQuota
        ? `Oi! 👋 Estou com uma instabilidade aqui no meu atendente automático neste momento. 😅\n\nEnquanto isso, fala direto com a nossa equipe humana:\n\n📱 **WhatsApp:** [(11) 99734-5749](https://wa.me/5511997345749)\n✉️ **Email:** suporte@leadspro.app\n\nA gente te responde rapidinho por lá! 🚀`
        : `Oi! 👋 Deu um probleminha aqui no meu lado agora. Tenta de novo em instantes — se continuar, me chama no WhatsApp: [(11) 99734-5749](https://wa.me/5511997345749).`;

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Emit the fallback as OpenAI-compatible delta chunks so the existing
          // client-side streaming/revealer works without changes.
          for (const piece of fallback.match(/.{1,24}/g) || [fallback]) {
            const chunk = { choices: [{ delta: { content: piece } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(aiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
