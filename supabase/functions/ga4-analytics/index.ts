import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Analytics Data API v1beta
const GA_PROPERTY_ID = "473abordarmos"; // Will be set via secret

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  
  // Create JWT
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(header))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const claimB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(claim))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const signInput = `${headerB64}.${claimB64}`;

  // Import private key
  const pemContent = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const jwt = `${signInput}.${sigB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function runReport(accessToken: string, propertyId: string, body: any) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const gaServiceAccount = Deno.env.get("GA_SERVICE_ACCOUNT_JSON");
    const gaPropertyId = Deno.env.get("GA_PROPERTY_ID");

    if (!gaServiceAccount || !gaPropertyId) {
      return new Response(JSON.stringify({ error: "GA4 não configurado. Configure GA_SERVICE_ACCOUNT_JSON e GA_PROPERTY_ID nos secrets." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(gaServiceAccount);

    const body = await req.json();
    const { period = "30" } = body;

    // Run multiple reports in parallel
    const [
      overviewReport,
      trafficSourceReport,
      pagesReport,
      conversionReport,
      dailyReport,
    ] = await Promise.all([
      // Overview: users, sessions, pageviews
      runReport(accessToken, gaPropertyId, {
        dateRanges: [{ startDate: `${period}daysAgo`, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "newUsers" },
        ],
      }),
      // Traffic sources
      runReport(accessToken, gaPropertyId, {
        dateRanges: [{ startDate: `${period}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      }),
      // Top pages
      runReport(accessToken, gaPropertyId, {
        dateRanges: [{ startDate: `${period}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      }),
      // Custom events (conversions)
      runReport(accessToken, gaPropertyId, {
        dateRanges: [{ startDate: `${period}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: [
                "sign_up", "login", "begin_checkout", "add_payment_info",
                "purchase", "license_activation", "free_trial_start",
                "lead_search", "campaign_created",
                "exit_intent_shown", "exit_intent_cta_click", "exit_intent_dismissed",
                "floating_cta_click",
              ],
            },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      }),
      // Daily users (for chart)
      runReport(accessToken, gaPropertyId, {
        dateRanges: [{ startDate: `${period}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "newUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      }),
    ]);

    // Parse overview
    const overviewRow = overviewReport.rows?.[0];
    const overview = {
      activeUsers: parseInt(overviewRow?.metricValues?.[0]?.value || "0"),
      sessions: parseInt(overviewRow?.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(overviewRow?.metricValues?.[2]?.value || "0"),
      bounceRate: parseFloat(overviewRow?.metricValues?.[3]?.value || "0"),
      avgSessionDuration: parseFloat(overviewRow?.metricValues?.[4]?.value || "0"),
      newUsers: parseInt(overviewRow?.metricValues?.[5]?.value || "0"),
    };

    // Parse traffic sources
    const trafficSources = (trafficSourceReport.rows || []).map((row: any) => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      newUsers: parseInt(row.metricValues[2].value),
    }));

    // Parse top pages
    const topPages = (pagesReport.rows || []).map((row: any) => ({
      path: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
    }));

    // Parse conversions
    const conversions = (conversionReport.rows || []).map((row: any) => ({
      event: row.dimensionValues[0].value,
      count: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
    }));

    // Parse daily data
    const daily = (dailyReport.rows || []).map((row: any) => ({
      date: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[1].value),
      newUsers: parseInt(row.metricValues[2].value),
    }));

    return new Response(JSON.stringify({
      overview,
      trafficSources,
      topPages,
      conversions,
      daily,
      period,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
