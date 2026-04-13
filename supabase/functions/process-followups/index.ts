import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let body: any = {};
    try { body = await req.json(); } catch {}

    const sequenceId = body?.sequence_id;

    let seqQuery = supabase
      .from("followup_sequences")
      .select("*, followup_steps(*)")
      .eq("is_active", true);

    if (sequenceId) {
      seqQuery = supabase
        .from("followup_sequences")
        .select("*, followup_steps(*)")
        .eq("id", sequenceId);
    }

    const { data: sequences, error: seqError } = await seqQuery;

    if (seqError) {
      console.error("Error fetching sequences:", seqError);
      throw seqError;
    }

    if (!sequences || sequences.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhuma sequência encontrada", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSent = 0;
    let errors: string[] = [];

    for (const sequence of sequences) {
      const steps = sequence.followup_steps || [];
      if (steps.length === 0) continue;

      // Get the license owner
      const { data: license } = await supabase
        .from("licenses")
        .select("id, assigned_to")
        .eq("id", sequence.license_id)
        .single();

      if (!license?.assigned_to) continue;

      // Get user's WhatsApp instance
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("instance_name, status")
        .eq("user_id", license.assigned_to)
        .maybeSingle();

      if (!instance || instance.status !== "connected") {
        console.log(`Skipping sequence ${sequence.id}: WhatsApp instance not connected for user ${license.assigned_to}`);
        continue;
      }

      // Get leads for this license
      let leadsQuery = supabase
        .from("leads")
        .select("*")
        .eq("license_id", sequence.license_id)
        .eq("is_duplicate", false);

      const seqFilter = sequence.target_filter;
      if (seqFilter) {
        if (seqFilter.startsWith("cat:")) {
          leadsQuery = leadsQuery.eq("category", seqFilter.replace("cat:", ""));
        } else if (seqFilter.startsWith("list:")) {
          const listId = seqFilter.replace("list:", "");
          const { data: listItems } = await supabase
            .from("lead_list_items")
            .select("lead_id")
            .eq("list_id", listId);
          const leadIds = (listItems || []).map((li: any) => li.lead_id);
          if (leadIds.length === 0) continue;
          leadsQuery = leadsQuery.in("id", leadIds);
        }
      }

      const { data: leads } = await leadsQuery;
      if (!leads || leads.length === 0) continue;

      // Find step matching today
      const createdAt = new Date(sequence.created_at);
      const now = new Date();

      const matchingStep = steps.find((step: any) => {
        const sendDate = new Date(createdAt);
        sendDate.setDate(sendDate.getDate() + step.day_number);
        return sendDate.getFullYear() === now.getFullYear() &&
          sendDate.getMonth() === now.getMonth() &&
          sendDate.getDate() === now.getDate();
      });

      if (!matchingStep) continue;

      // Check if already sent
      const { data: existingLog } = await supabase
        .from("followup_logs")
        .select("id")
        .eq("step_id", matchingStep.id)
        .eq("status", "sent")
        .limit(1);

      if (existingLog && existingLog.length > 0) continue;

      // Remove {{whatsapp_link}} from template since we send from own number now
      const message = matchingStep.message_template
        .replace(/\{\{whatsapp_link\}\}/g, "")
        .replace(/\n{3,}/g, "\n\n") // clean extra blank lines
        .trim();

      // Send to each lead via Evolution API
      let sentCount = 0;
      for (const lead of leads) {
        const phone = lead.phone?.replace(/\D/g, "");
        if (!phone) continue;

        try {
          const sendRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text: message }),
          });

          if (sendRes.ok) {
            sentCount++;
          } else {
            const errData = await sendRes.text();
            console.error(`Failed to send to ${phone}:`, errData);
          }

          // Small delay between messages to avoid rate limiting
          await new Promise((r) => setTimeout(r, 2000));
        } catch (sendErr) {
          console.error(`Error sending to ${phone}:`, sendErr);
          errors.push(`${phone}: ${sendErr instanceof Error ? sendErr.message : "unknown"}`);
        }
      }

      // Log sent messages
      const logs = leads
        .filter((lead: any) => lead.phone)
        .map((lead: any) => ({
          step_id: matchingStep.id,
          lead_id: lead.id,
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          status: "sent",
        }));

      await supabase.from("followup_logs").insert(logs);
      totalSent += sentCount;

      console.log(`Sequence ${sequence.id}, day ${matchingStep.day_number}: sent to ${sentCount}/${leads.length} leads via Evolution API`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Follow-ups processados via WhatsApp", total_sent: totalSent, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-followups:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
