import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_PACKAGES: Record<string, { credits: number; amount: number; label: string }> = {
  // amount in cents (Mercado Pago expects decimal BRL — we'll divide by 100)
  "100": { credits: 100, amount: 2990, label: "+100 créditos" },
  "500": { credits: 500, amount: 5990, label: "+500 créditos" },
  "1000": { credits: 1000, amount: 9790, label: "+1.000 créditos" },
  "2000": { credits: 2000, amount: 13790, label: "+2.000 créditos" },
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] || "Cliente",
    last_name: parts.slice(1).join(" ") || "LeadsPro",
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "Pagamento não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: create-pix ──
    if (action === "create-pix") {
      const { packageId, customer } = body;
      const pkg = CREDIT_PACKAGES[packageId];
      if (!pkg) {
        return new Response(JSON.stringify({ error: "Pacote inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!customer?.name || !customer?.cellphone || !customer?.email || !customer?.taxId) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: nome, celular, email, CPF" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user license
      const { data: license } = await supabase
        .from("licenses")
        .select("id")
        .eq("assigned_to", user.id)
        .limit(1)
        .single();

      if (!license) {
        return new Response(JSON.stringify({ error: "Licença não encontrada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { first_name, last_name } = splitName(customer.name);
      const idempotencyKey = `${user.id}-${packageId}-${Date.now()}`;

      const mpPayload = {
        transaction_amount: pkg.amount / 100,
        description: `LeadsPro - ${pkg.label}`,
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
          user_id: user.id,
          license_id: license.id,
          package_id: String(packageId),
          credits: String(pkg.credits),
          type: "extra_credits",
        },
      };

      console.log("Creating Mercado Pago PIX:", JSON.stringify(mpPayload));

      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(mpPayload),
      });

      const mpText = await mpRes.text();
      console.log("Mercado Pago response status:", mpRes.status, "body:", mpText.slice(0, 500));

      let mpData: any;
      try {
        mpData = JSON.parse(mpText);
      } catch {
        return new Response(
          JSON.stringify({ error: `Erro na resposta do Mercado Pago: ${mpText.slice(0, 200)}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!mpRes.ok || mpData.error) {
        const errorMsg = mpData.message || mpData.error || "Erro ao gerar PIX";
        console.error("Mercado Pago error:", errorMsg);

        await supabase.from("api_error_logs").insert({
          function_name: "buy-credits",
          error_message: `MercadoPago: ${errorMsg}`,
          error_details: mpData,
          user_id: user.id,
        });

        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: mpRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          pixId: String(mpData.id),
          brCode: qrCode,
          brCodeBase64: `data:image/png;base64,${qrCodeBase64}`,
          expiresAt: mpData.date_of_expiration,
          credits: pkg.credits,
          amount: pkg.amount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: check-payment ──
    if (action === "check-payment") {
      const { pixId } = body;
      if (!pixId) {
        return new Response(JSON.stringify({ error: "pixId obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checkRes = await fetch(`https://api.mercadopago.com/v1/payments/${pixId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${mpToken}` },
      });

      const checkData = await checkRes.json();
      const status = checkData.status;

      // Mercado Pago: "approved" = paid
      if (status === "approved") {
        // Check if already processed (idempotency)
        const { data: existing } = await supabase
          .from("credit_transactions")
          .select("id")
          .eq("payment_id", String(pixId))
          .limit(1)
          .maybeSingle();

        if (!existing) {
          const { packageId } = body;
          const pkg = CREDIT_PACKAGES[packageId];
          if (pkg) {
            const { data: license } = await supabase
              .from("licenses")
              .select("id, extra_credits")
              .eq("assigned_to", user.id)
              .limit(1)
              .single();

            if (license) {
              const newExtra = (license.extra_credits || 0) + pkg.credits;

              await supabase
                .from("licenses")
                .update({ extra_credits: newExtra })
                .eq("id", license.id);

              await supabase.from("credit_transactions").insert({
                license_id: license.id,
                type: "extra_purchase",
                amount: pkg.credits,
                balance_after: newExtra,
                description: `Compra ${pkg.label} via PIX`,
                payment_id: String(pixId),
              });
            }
          }
        }

        return new Response(
          JSON.stringify({ status: "PAID", credited: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Map Mercado Pago statuses to our internal ones
      // pending, in_process → PENDING; rejected, cancelled, refunded → FAILED
      const internalStatus = status === "approved"
        ? "PAID"
        : ["rejected", "cancelled", "refunded", "charged_back"].includes(status)
          ? "FAILED"
          : "PENDING";

      return new Response(
        JSON.stringify({ status: internalStatus, mp_status: status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
