import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] || "Cliente",
    last_name: parts.slice(1).join(" ") || "LeadsPro",
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, description, customer, plan } = await req.json();

    if (!amount || !customer?.name || !customer?.cellphone || !customer?.email || !customer?.taxId) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: amount, name, cellphone, email, taxId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(
        JSON.stringify({ error: "Pagamento não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { first_name, last_name } = splitName(customer.name);
    const idempotencyKey = `${customer.email}-${amount}-${Date.now()}`;

    const mpPayload = {
      transaction_amount: amount / 100, // cents → BRL
      description: description || `LeadsPro - Plano ${plan || "mensal"}`,
      payment_method_id: "pix",
      payer: {
        email: customer.email,
        first_name,
        last_name,
        identification: {
          type: "CPF",
          number: customer.taxId.replace(/\D/g, ""),
        },
      },
      metadata: {
        plan: plan || "monthly",
      },
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await response.json();

    if (!response.ok || mpData.error) {
      return new Response(
        JSON.stringify({ error: mpData.message || mpData.error || "Erro ao criar pagamento" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      return new Response(
        JSON.stringify({ error: "Resposta do Mercado Pago sem QR Code" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        data: {
          id: String(mpData.id),
          brCode: qrCode,
          brCodeBase64: `data:image/png;base64,${qrCodeBase64}`,
          expiresAt: mpData.date_of_expiration,
          amount,
          status: mpData.status,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
