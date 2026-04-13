import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_PACKAGES: Record<string, { credits: number; amount: number; label: string }> = {
  "100": { credits: 100, amount: 2990, label: "+100 créditos" },
  "500": { credits: 500, amount: 5990, label: "+500 créditos" },
  "1000": { credits: 1000, amount: 9790, label: "+1.000 créditos" },
  "2000": { credits: 2000, amount: 13790, label: "+2.000 créditos" },
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

      const apiKey = Deno.env.get("ABACATEPAY_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Pagamento não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pixPayload = {
        amount: pkg.amount,
        expiresIn: 1800,
        description: `LeadsPro - ${pkg.label}`,
        customer: {
          name: customer.name,
          cellphone: customer.cellphone.replace(/\D/g, ""),
          email: customer.email,
          taxId: customer.taxId.replace(/\D/g, ""),
        },
        metadata: {
          userId: user.id,
          licenseId: license.id,
          packageId: String(packageId),
          credits: String(pkg.credits),
          type: "extra_credits",
        },
      };

      console.log("Creating PIX with payload:", JSON.stringify(pixPayload));

      const pixRes = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pixPayload),
      });

      const pixText = await pixRes.text();
      console.log("AbacatePay response status:", pixRes.status, "body:", pixText);

      let pixData: any;
      try {
        pixData = JSON.parse(pixText);
      } catch {
        return new Response(
          JSON.stringify({ error: `Erro na resposta do AbacatePay: ${pixText.slice(0, 200)}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!pixRes.ok || pixData.error) {
        const errorMsg = pixData.error?.message || pixData.error || pixData.message || "Erro ao gerar PIX";
        console.error("AbacatePay error:", errorMsg);
        
        // Log to error table
        await supabase.from("api_error_logs").insert({
          function_name: "buy-credits",
          error_message: `AbacatePay: ${errorMsg}`,
          error_details: pixData,
          user_id: user.id,
        });

        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: pixRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          pixId: pixData.data?.id,
          brCode: pixData.data?.brCode,
          brCodeBase64: pixData.data?.brCodeBase64,
          expiresAt: pixData.data?.expiresAt,
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

      const apiKey = Deno.env.get("ABACATEPAY_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Pagamento não configurado" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checkRes = await fetch("https://api.abacatepay.com/v1/pixQrCode/check", {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const checkData = await checkRes.json();
      const status = checkData.data?.status;

      if (status === "PAID" || status === "COMPLETED") {
        // Check if already processed (idempotency)
        const { data: existing } = await supabase
          .from("credit_transactions")
          .select("id")
          .eq("payment_id", pixId)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          const { packageId } = body;
          const pkg = CREDIT_PACKAGES[packageId];
          if (pkg) {
            // Get license
            const { data: license } = await supabase
              .from("licenses")
              .select("id, extra_credits")
              .eq("assigned_to", user.id)
              .limit(1)
              .single();

            if (license) {
              const newExtra = (license.extra_credits || 0) + pkg.credits;

              // Update extra_credits
              await supabase
                .from("licenses")
                .update({ extra_credits: newExtra })
                .eq("id", license.id);

              // Log transaction
              await supabase.from("credit_transactions").insert({
                license_id: license.id,
                type: "extra_purchase",
                amount: pkg.credits,
                balance_after: newExtra,
                description: `Compra ${pkg.label} via PIX`,
                payment_id: pixId,
              });
            }
          }
        }

        return new Response(
          JSON.stringify({ status: "PAID", credited: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: status || "PENDING" }),
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
