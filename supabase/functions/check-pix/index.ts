import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(
        JSON.stringify({ error: "Pagamento não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const pixId = url.searchParams.get("id");
    if (!pixId) {
      return new Response(
        JSON.stringify({ error: "pixId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${pixId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    const mpData = await response.json();

    // Map Mercado Pago status to internal status expected by Checkout.tsx
    // approved → PAID, rejected/cancelled/refunded → FAILED, else PENDING
    const mpStatus = mpData.status;
    const internalStatus = mpStatus === "approved"
      ? "PAID"
      : ["rejected", "cancelled", "refunded", "charged_back"].includes(mpStatus)
        ? "FAILED"
        : "PENDING";

    return new Response(
      JSON.stringify({
        data: {
          id: String(mpData.id),
          status: internalStatus,
          mp_status: mpStatus,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao verificar pagamento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
