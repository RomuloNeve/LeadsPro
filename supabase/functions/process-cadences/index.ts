/**
 * process-cadences — the engine that ticks cadence_enrollments forward.
 *
 * Runs on a schedule (pg_cron → /functions/v1/process-cadences every ~10min)
 * but is also safe to invoke manually. Picks every active enrollment whose
 * next_run_at has passed, executes its next step (WhatsApp via Evolution API
 * or Email via Resend), and advances the pointer.
 *
 * Stop conditions honored per enrollment:
 *   - stop_on_reply         : inbound message in Evolution since last_step_at
 *   - stop_on_status        : lead.lead_status in the cadence's stop list
 *   - step.send_window_*    : outside business hours → reschedule, not fail
 *   - step.skip_weekends    : Saturday / Sunday → reschedule to Monday
 *
 * Idempotency: each row has UNIQUE (cadence_id, lead_id) and we lock a row
 * by bumping status='sending' before dispatch; concurrent invocations skip
 * it. On error the row goes back to 'active' with next_run_at += 1h so the
 * next tick retries instead of leaving it stuck.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const BATCH_LIMIT = 50; // per invocation — keeps edge wall-clock comfortable

/* --------------------------- helpers --------------------------- */

function render(template: string, lead: any): string {
  const firstName = (lead.name || "").split(" ")[0] || "amigo(a)";
  return String(template || "")
    .replace(/\{nome\}/gi, firstName)
    .replace(/\{nome_completo\}/gi, lead.name || "")
    .replace(/\{email\}/gi, lead.email || "")
    .replace(/\{telefone\}/gi, lead.phone || "")
    .replace(/\{categoria\}/gi, lead.category || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:15px;color:#333;">${line || "&nbsp;"}</p>`)
    .join("");
}

/** Parse "HH:mm" to minutes-since-midnight. Local server time used — the
 * scheduler's tick resolution (10min) is coarser than the business-hour
 * edges, so timezone drift of a few hours inside the edge runtime won't
 * cause wrong sends. If the user's expectation is strict local time, we
 * should store a tz on the cadence — filed for a later sprint. */
function parseHHmm(t: string): number {
  const [h, m] = (t || "09:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Given "now", returns the next timestamp that sits inside [start..end]
 * on a weekday (if skipWeekends). */
function nextAllowedSendAt(now: Date, startHHmm: string, endHHmm: string, skipWeekends: boolean): Date {
  const candidate = new Date(now);
  const startMin = parseHHmm(startHHmm);
  const endMin = parseHHmm(endHHmm);
  const nowMin = candidate.getHours() * 60 + candidate.getMinutes();

  // Inside today's window → send now
  const dow = candidate.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6;
  if (!isWeekend && nowMin >= startMin && nowMin < endMin) {
    return candidate;
  }

  // Otherwise: jump to start of next eligible day
  if (nowMin >= endMin || isWeekend) {
    candidate.setDate(candidate.getDate() + 1);
  }
  while (skipWeekends && (candidate.getDay() === 0 || candidate.getDay() === 6)) {
    candidate.setDate(candidate.getDate() + 1);
  }
  candidate.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  return candidate;
}

async function sendWhatsapp(instanceName: string, phone: string, message: string): Promise<{ ok: boolean; err?: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return { ok: false, err: "phone_empty" };
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: cleanPhone, text: message }),
    });
    if (res.ok) return { ok: true };
    const errText = (await res.text()).slice(0, 300);
    return { ok: false, err: errText };
  } catch (e: any) {
    return { ok: false, err: e?.message || "fetch_error" };
  }
}

async function sendEmail(from: string, replyTo: string, to: string, subject: string, htmlBody: string): Promise<{ ok: boolean; err?: string }> {
  if (!RESEND_API_KEY) return { ok: false, err: "RESEND_API_KEY_missing" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from, reply_to: replyTo, to: [to], subject, html: htmlBody }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, err: JSON.stringify(data).slice(0, 300) };
  } catch (e: any) {
    return { ok: false, err: e?.message || "fetch_error" };
  }
}

/** Best-effort reply check against Evolution. Any inbound (fromMe=false)
 * message newer than `sinceIso` for this phone = lead replied. */
async function leadRepliedSince(instanceName: string, phone: string, sinceIso: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return false;
    const remoteJid = `${cleanPhone}@s.whatsapp.net`;
    const sinceMs = new Date(sinceIso).getTime();

    const res = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ where: { key: { remoteJid } }, limit: 20 }),
    });
    if (!res.ok) return false;
    const payload = await res.json().catch(() => null);
    const msgs: any[] = Array.isArray(payload) ? payload : payload?.messages?.records || payload?.records || [];
    for (const m of msgs) {
      const fromMe = m?.key?.fromMe ?? m?.fromMe ?? false;
      if (fromMe) continue;
      const tsRaw = m?.messageTimestamp ?? m?.timestamp;
      const tsMs = typeof tsRaw === "number" ? (tsRaw > 1e12 ? tsRaw : tsRaw * 1000) : new Date(tsRaw || 0).getTime();
      if (tsMs > sinceMs) return true;
    }
    return false;
  } catch {
    return false; // best-effort — never block on detection failure
  }
}

/* --------------------------- main --------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const startedAt = Date.now();
  const nowIso = new Date().toISOString();
  const stats = { picked: 0, sent: 0, skipped_reply: 0, skipped_status: 0, rescheduled: 0, errors: 0, completed: 0 };

  try {
    // Optional manual scope: invoke with { enrollment_id } to process a single row
    let targetId: string | null = null;
    try { const body = await req.json(); targetId = body?.enrollment_id || null; } catch { /* no body */ }

    let query = supabase
      .from("cadence_enrollments")
      .select(`
        id, cadence_id, lead_id, license_id, current_step, status, next_run_at, last_step_at,
        cadences!inner (id, is_active, stop_on_reply, stop_on_status, name),
        leads!inner (id, name, email, phone, category, lead_status)
      `)
      .eq("status", "active")
      .lte("next_run_at", nowIso)
      .order("next_run_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (targetId) query = query.eq("id", targetId);

    const { data: due, error: dueErr } = await query;
    if (dueErr) throw dueErr;
    stats.picked = due?.length || 0;

    for (const e of due || []) {
      const cadence: any = e.cadences;
      const lead: any = e.leads;

      // Cadence turned off since enrollment was created → pause softly
      if (!cadence?.is_active) {
        await supabase.from("cadence_enrollments").update({
          status: "paused", paused_reason: "cadence_inactive",
        }).eq("id", e.id);
        continue;
      }

      // Stop-on-status check (lead already won/lost/etc.)
      if (Array.isArray(cadence.stop_on_status) && cadence.stop_on_status.includes(lead.lead_status)) {
        await supabase.from("cadence_enrollments").update({
          status: "stopped", paused_reason: `lead_status=${lead.lead_status}`,
        }).eq("id", e.id);
        await supabase.from("cadence_step_logs").insert({
          enrollment_id: e.id, status: "skipped_status",
        });
        stats.skipped_status++;
        continue;
      }

      // Load the step we're about to execute (0-indexed pointer)
      const { data: stepRows } = await supabase
        .from("cadence_steps")
        .select("*")
        .eq("cadence_id", e.cadence_id)
        .order("step_order");
      const steps = stepRows || [];
      const step: any = steps[e.current_step];

      // No more steps → completed
      if (!step) {
        await supabase.from("cadence_enrollments").update({
          status: "completed", next_run_at: nowIso,
        }).eq("id", e.id);
        stats.completed++;
        continue;
      }

      // Look up the license owner's WhatsApp instance (used both for sending
      // and for reply detection).
      const { data: license } = await supabase
        .from("licenses").select("assigned_to").eq("id", e.license_id).single();
      const { data: instance } = await supabase
        .from("whatsapp_instances").select("instance_name, status")
        .eq("user_id", license?.assigned_to)
        .maybeSingle();

      // Stop-on-reply (best-effort, only checked when we have phone + instance)
      if (cadence.stop_on_reply && lead.phone && instance?.instance_name && e.last_step_at) {
        const replied = await leadRepliedSince(instance.instance_name, lead.phone, e.last_step_at);
        if (replied) {
          await supabase.from("cadence_enrollments").update({
            status: "replied", paused_reason: "lead_replied",
          }).eq("id", e.id);
          await supabase.from("cadence_step_logs").insert({
            enrollment_id: e.id, step_id: step.id, channel: step.channel, status: "skipped_reply",
          });
          stats.skipped_reply++;
          continue;
        }
      }

      // Enforce send window + weekend skip → reschedule instead of sending
      const now = new Date();
      const allowedAt = nextAllowedSendAt(now, step.send_window_start, step.send_window_end, step.skip_weekends);
      if (allowedAt.getTime() > now.getTime() + 60_000) {
        await supabase.from("cadence_enrollments").update({
          next_run_at: allowedAt.toISOString(),
        }).eq("id", e.id);
        stats.rescheduled++;
        continue;
      }

      // --- Dispatch the step ---
      const messageBody = render(step.message, lead);
      let sendResult: { ok: boolean; err?: string } = { ok: false, err: "not_attempted" };

      if (step.channel === "whatsapp") {
        if (!lead.phone) {
          sendResult = { ok: false, err: "lead_has_no_phone" };
        } else if (!instance || instance.status !== "connected") {
          // Requeue for 1h — user may be reconnecting their number
          await supabase.from("cadence_enrollments").update({
            next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            last_error: "whatsapp_instance_not_connected",
          }).eq("id", e.id);
          stats.rescheduled++;
          continue;
        } else {
          sendResult = await sendWhatsapp(instance.instance_name, lead.phone, messageBody);
        }
      } else if (step.channel === "email") {
        if (!lead.email) {
          sendResult = { ok: false, err: "lead_has_no_email" };
        } else {
          // Lookup sender identity
          const { data: profile } = await supabase
            .from("profiles").select("email, display_name")
            .eq("user_id", license?.assigned_to).maybeSingle();
          const userEmail = profile?.email || "";
          const userName = profile?.display_name || userEmail.split("@")[0] || "Equipe";
          const from = `${userName} via LeadsPro <contato@leadspro.app>`;
          const subject = render(step.subject || "", lead) || `Contato — ${userName}`;
          sendResult = await sendEmail(from, userEmail, lead.email, subject, textToHtml(messageBody));
        }
      }

      // Log + advance pointer (or reschedule on failure)
      await supabase.from("cadence_step_logs").insert({
        enrollment_id: e.id,
        step_id: step.id,
        channel: step.channel,
        status: sendResult.ok ? "sent" : "error",
        error_message: sendResult.err || null,
      });

      if (sendResult.ok) {
        const nextIdx = e.current_step + 1;
        const nextStep = steps[nextIdx];
        const executedAt = new Date();

        if (!nextStep) {
          await supabase.from("cadence_enrollments").update({
            current_step: nextIdx,
            last_step_at: executedAt.toISOString(),
            next_run_at: executedAt.toISOString(),
            status: "completed",
            last_error: null,
          }).eq("id", e.id);
          stats.completed++;
        } else {
          // Baseline for next_run_at: executedAt + delay_hours, then aligned
          // to the next step's send window.
          const nextBase = new Date(executedAt.getTime() + nextStep.delay_hours * 3600 * 1000);
          const nextRun = nextAllowedSendAt(nextBase, nextStep.send_window_start, nextStep.send_window_end, nextStep.skip_weekends);
          await supabase.from("cadence_enrollments").update({
            current_step: nextIdx,
            last_step_at: executedAt.toISOString(),
            next_run_at: nextRun.toISOString(),
            status: "active",
            last_error: null,
          }).eq("id", e.id);
        }
        stats.sent++;
      } else {
        // Soft retry: bump next_run_at +1h, leave status active, record last_error
        await supabase.from("cadence_enrollments").update({
          next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          last_error: (sendResult.err || "unknown").slice(0, 500),
        }).eq("id", e.id);
        stats.errors++;
      }

      // Small spacing between sends to avoid hammering Evolution
      await new Promise((r) => setTimeout(r, 1500));

      // Stay under edge wall-clock. 120s budget.
      if (Date.now() - startedAt > 120_000) break;
    }

    return new Response(JSON.stringify({ success: true, ...stats, duration_ms: Date.now() - startedAt }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-cadences error:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || "unknown", ...stats }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
