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

      // Idempotency: fetch ALL existing logs for this step, then skip leads
      // that already have a row (regardless of status — a "sending" row means
      // another invocation is in-flight for that lead; a "sent"/"failed" row
      // means we already tried). This prevents duplicate sends when the cron
      // retries or the function is invoked twice concurrently.
      const { data: existingLogs } = await supabase
        .from("followup_logs")
        .select("lead_id, status")
        .eq("step_id", matchingStep.id);

      const processedLeadIds = new Set((existingLogs || []).map((l: any) => l.lead_id));

      // If every targeted lead already has a log, skip the whole step.
      const pendingLeads = leads.filter((l: any) => l.phone && !processedLeadIds.has(l.id));
      if (pendingLeads.length === 0) continue;

      // Remove {{whatsapp_link}} from template since we send from own number now
      const message = matchingStep.message_template
        .replace(/\{\{whatsapp_link\}\}/g, "")
        .replace(/\n{3,}/g, "\n\n") // clean extra blank lines
        .trim();

      // Claim the leads BEFORE sending by inserting 'sending' rows. If a
      // concurrent invocation reaches the idempotency check after this insert,
      // it sees the rows and skips — avoiding double sends.
      const nowIso = new Date().toISOString();
      const claimRows = pendingLeads.map((lead: any) => ({
        step_id: matchingStep.id,
        lead_id: lead.id,
        scheduled_for: nowIso,
        status: "sending",
      }));
      const { error: claimErr } = await supabase.from("followup_logs").insert(claimRows);
      if (claimErr) {
        console.error(`Could not claim followup logs for step ${matchingStep.id}:`, claimErr);
        continue; // another instance likely claimed first — bail out safely
      }

      // Send to each claimed lead via Evolution API and update per-row status.
      let sentCount = 0;
      for (const lead of pendingLeads) {
        const phone = lead.phone.replace(/\D/g, "");
        if (!phone) continue;

        let ok = false;
        let errMsg = "";
        try {
          const sendRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text: message }),
          });

          if (sendRes.ok) {
            ok = true;
            sentCount++;
          } else {
            errMsg = (await sendRes.text()).slice(0, 300);
            console.error(`Failed to send to ${phone}:`, errMsg);
          }
        } catch (sendErr) {
          errMsg = sendErr instanceof Error ? sendErr.message : "unknown";
          console.error(`Error sending to ${phone}:`, sendErr);
          errors.push(`${phone}: ${errMsg}`);
        }

        await supabase
          .from("followup_logs")
          .update({
            status: ok ? "sent" : "failed",
            sent_at: ok ? new Date().toISOString() : null,
            error_message: ok ? null : errMsg,
          })
          .eq("step_id", matchingStep.id)
          .eq("lead_id", lead.id);

        // Small delay between messages to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
      }

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
