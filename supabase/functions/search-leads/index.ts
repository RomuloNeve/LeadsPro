import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SERPER_KEYS = [
  Deno.env.get("SERPER_API_KEY")!,
  Deno.env.get("SERPER_API_KEY_2")!,
  Deno.env.get("SERPER_API_KEY_3")!,
  Deno.env.get("SERPER_API_KEY_4")!,
  Deno.env.get("SERPER_API_KEY_5")!,
].filter(Boolean);

const MAJOR_CITIES = [
  "São Paulo SP", "Rio de Janeiro RJ", "Belo Horizonte MG",
  "Curitiba PR", "Porto Alegre RS", "Brasília DF",
  "Salvador BA", "Fortaleza CE", "Recife PE", "Goiânia GO",
  "Campinas SP", "Florianópolis SC", "Vitória ES", "Belém PA",
  "Manaus AM",
];

const STATE_CITIES: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "Penedo", "União dos Palmares"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Ilhéus", "Itabuna", "Lauro de Freitas", "Juazeiro", "Barreiras", "Teixeira de Freitas"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu"],
  DF: ["Brasília", "Taguatinga", "Ceilândia", "Samambaia", "Gama", "Águas Claras"],
  ES: ["Vitória", "Vila Velha", "Cariacica", "Serra", "Linhares", "Cachoeiro de Itapemirim", "Colatina", "Guarapari", "São Mateus", "Aracruz"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Catalão"],
  MA: ["São Luís", "Imperatriz", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Poços de Caldas", "Divinópolis"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Parauapebas", "Marituba", "Abaetetuba"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras"],
  PE: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Garanhuns"],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda", "Macaé"],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Caicó", "Açu"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Pacaraima"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Passo Fundo"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Criciúma", "Itajaí", "Lages", "Jaraguá do Sul", "Balneário Camboriú"],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "Estância"],
  SP: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Santos", "São José do Rio Preto", "Piracicaba", "Bauru", "Jundiaí", "Franca"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
};

const COUNTRY_CITIES: Record<string, string[]> = {
  "Estados Unidos": ["New York USA", "Los Angeles USA", "Chicago USA", "Houston USA", "Miami USA", "San Francisco USA", "Dallas USA", "Atlanta USA"],
  "United States": ["New York USA", "Los Angeles USA", "Chicago USA", "Houston USA", "Miami USA", "San Francisco USA", "Dallas USA", "Atlanta USA"],
  "Argentina": ["Buenos Aires", "Córdoba Argentina", "Rosario Argentina", "Mendoza Argentina", "La Plata Argentina"],
  "México": ["Ciudad de México", "Guadalajara México", "Monterrey México", "Puebla México", "Tijuana México"],
  "Colômbia": ["Bogotá", "Medellín", "Cali Colombia", "Barranquilla", "Cartagena Colombia"],
  "Chile": ["Santiago Chile", "Valparaíso Chile", "Concepción Chile", "Antofagasta"],
  "Peru": ["Lima Peru", "Arequipa Peru", "Trujillo Peru", "Cusco Peru"],
  "Uruguai": ["Montevideo Uruguay", "Salto Uruguay", "Punta del Este"],
  "Paraguai": ["Asunción Paraguay", "Ciudad del Este Paraguay"],
  "Portugal": ["Lisboa Portugal", "Porto Portugal", "Braga Portugal", "Coimbra Portugal"],
  "Espanha": ["Madrid España", "Barcelona España", "Valencia España", "Sevilla España"],
  "Itália": ["Roma Italia", "Milano Italia", "Napoli Italia", "Torino Italia"],
  "França": ["Paris France", "Marseille France", "Lyon France", "Toulouse France"],
  "Alemanha": ["Berlin Germany", "München Germany", "Hamburg Germany", "Frankfurt Germany"],
  "Reino Unido": ["London UK", "Manchester UK", "Birmingham UK", "Liverpool UK"],
  "Canadá": ["Toronto Canada", "Vancouver Canada", "Montreal Canada", "Calgary Canada"],
  "Austrália": ["Sydney Australia", "Melbourne Australia", "Brisbane Australia", "Perth Australia"],
  "Japão": ["Tokyo Japan", "Osaka Japan", "Yokohama Japan", "Nagoya Japan"],
  "Índia": ["Mumbai India", "Delhi India", "Bangalore India", "Hyderabad India"],
  "Emirados Árabes Unidos": ["Dubai UAE", "Abu Dhabi UAE"],
};

// Converts verbose CNAE descriptions into concise Maps-friendly keywords.
// Examples:
//   "Comércio varejista de pães, bolos, biscoitos..." -> "pães bolos biscoitos"
//   "Atividades odontológicas"                        -> "odontológicas"
//   "Fabricação de móveis de madeira"                 -> "móveis de madeira"
//   "Serviços de alimentação para eventos"            -> "alimentação para eventos"
//   "Cultivo de arroz"                                -> "arroz"
// Leaves short free-text searches ("Dentista", "Pizzaria") untouched.
function normalizeRole(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  // Skip normalization for short terms — user probably typed free text.
  if (s.split(/\s+/).length <= 2 && s.length < 30) return s;

  const prefixes: RegExp[] = [
    /^com[ée]rcio\s+varejista\s+especializado\s+de\s+/i,
    /^com[ée]rcio\s+varejista\s+de\s+/i,
    /^com[ée]rcio\s+atacadista\s+especializado\s+de\s+/i,
    /^com[ée]rcio\s+atacadista\s+de\s+/i,
    /^com[ée]rcio\s+a\s+varejo\s+de\s+/i,
    /^com[ée]rcio\s+varejista\s+/i,
    /^com[ée]rcio\s+atacadista\s+/i,
    /^com[ée]rcio\s+de\s+/i,
    /^fabrica[çc][ãa]o\s+de\s+/i,
    /^produ[çc][ãa]o\s+de\s+/i,
    /^cultivo\s+de\s+/i,
    /^cria[çc][ãa]o\s+de\s+/i,
    /^extra[çc][ãa]o\s+de\s+/i,
    /^atividades?\s+de\s+/i,
    /^atividades?\s+/i,
    /^servi[çc]os?\s+de\s+/i,
    /^servi[çc]os?\s+/i,
    /^presta[çc][ãa]o\s+de\s+servi[çc]os?\s+de\s+/i,
    /^manuten[çc][ãa]o\s+e\s+repara[çc][ãa]o\s+de\s+/i,
    /^manuten[çc][ãa]o\s+de\s+/i,
    /^repara[çc][ãa]o\s+de\s+/i,
    /^instala[çc][ãa]o\s+de\s+/i,
    /^transporte\s+rodovi[áa]rio\s+de\s+/i,
    /^transporte\s+de\s+/i,
    /^constru[çc][ãa]o\s+de\s+/i,
  ];
  for (const re of prefixes) {
    if (re.test(s)) { s = s.replace(re, ""); break; }
  }

  // Strip trailing "não especificados anteriormente", parentheticals,
  // "exceto ...", and anything after a semicolon.
  s = s
    .replace(/\s*n[ãa]o\s+especific[ao]s?\s+anteriormente.*$/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*,?\s*exceto\s+.*$/i, "")
    .replace(/;.*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // If the cleaned term is too long, take the first 6 words.
  const words = s.split(/\s+/);
  if (words.length > 6) s = words.slice(0, 6).join(" ");
  return s || raw.trim();
}

async function searchMapsPage(query: string, key: string, page = 1): Promise<any[]> {
  const response = await fetch("https://google.serper.dev/maps", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, page }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.places || [];
}

async function searchMapsWithKey(query: string, key: string): Promise<any[]> {
  const [p1, p2, p3] = await Promise.all([
    searchMapsPage(query, key, 1),
    searchMapsPage(query, key, 2),
    searchMapsPage(query, key, 3),
  ]);
  return [...p1, ...p2, ...p3];
}

async function searchMapsQuery(query: string): Promise<any[]> {
  for (const key of SERPER_KEYS) {
    try {
      const results = await searchMapsWithKey(query, key);
      if (results.length > 0) return results;
    } catch { continue; }
  }
  return [];
}

function deduplicatePlaces(places: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const place of places) {
    // Deduplicate by phone or by name
    const phone = (place.phoneNumber || place.phone || "").replace(/\D/g, "");
    const name = (place.title || "").toLowerCase().trim();
    const key = phone.length >= 8 ? phone : name;
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(place);
    }
  }
  return unique;
}

async function searchMultiCity(role: string, cities: string[], suffix = ""): Promise<any[]> {
  const allPlaces: any[] = [];

  for (let i = 0; i < cities.length; i += 5) {
    const batch = cities.slice(i, i + 5);
    const results = await Promise.all(
      batch.map((c) => searchMapsQuery(`${role} ${c}${suffix ? " " + suffix : ""}`))
    );
    for (const places of results) {
      allPlaces.push(...places);
    }
    if (deduplicatePlaces(allPlaces).length >= 80) break;
  }

  return deduplicatePlaces(allPlaces);
}

async function searchBrazilWide(role: string): Promise<any[]> {
  return searchMultiCity(role, MAJOR_CITIES);
}

async function searchStateWide(role: string, state: string): Promise<any[]> {
  const cities = STATE_CITIES[state];
  if (!cities || cities.length === 0) {
    // Fallback: just search role + state
    const results = await searchMapsQuery(`${role} ${state}`);
    return deduplicatePlaces(results);
  }
  return searchMultiCity(role, cities, state);
}

function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Filter out common false positives
  return matches.filter(
    (e) =>
      !e.includes("@sentry") &&
      !e.includes("@example") &&
      !e.includes("@test") &&
      !e.endsWith(".png") &&
      !e.endsWith(".jpg") &&
      !e.endsWith(".svg")
  );
}

async function searchSocials(businessName: string): Promise<{ instagram: string; linkedin: string; site: string; email: string }> {
  for (const key of SERPER_KEYS) {
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q: `${businessName} contato email`, num: 10 }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const organic = data.organic || [];

      const insta = organic.find((r: any) => r.link?.includes("instagram.com"));
      const linkedin = organic.find((r: any) => r.link?.includes("linkedin.com"));
      const site = organic.find(
        (r: any) =>
          r.link?.includes("www.") &&
          !r.link?.includes("instagram.com") &&
          !r.link?.includes("linkedin.com") &&
          !r.link?.includes("facebook.com") &&
          !r.link?.includes("youtube.com")
      );

      // Extract emails from snippets and titles
      const allText = organic.map((r: any) => `${r.title || ""} ${r.snippet || ""}`).join(" ");
      const emails = extractEmailsFromText(allText);

      // Also check knowledgeGraph if available
      const kgText = data.knowledgeGraph
        ? `${data.knowledgeGraph.description || ""} ${JSON.stringify(data.knowledgeGraph.attributes || {})}`
        : "";
      const kgEmails = extractEmailsFromText(kgText);

      const allEmails = [...new Set([...emails, ...kgEmails])];

      return {
        instagram: insta?.link || "",
        linkedin: linkedin?.link || "",
        site: site?.link || "",
        email: allEmails[0] || "",
      };
    } catch { continue; }
  }
  return { instagram: "", linkedin: "", site: "", email: "" };
}

async function searchWithSerpApi(query: string, apiKey: string, num = 60): Promise<any[]> {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: query,
    api_key: apiKey,
    num: String(num),
  });

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SerpAPI falhou (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.local_results || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role: rawRole, state, city, code, country } = await req.json();

    if (!rawRole) {
      return new Response(
        JSON.stringify({ error: "Categoria é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize CNAE descriptions into Google-Maps-friendly search terms.
    // Official CNAE descriptions like "Comércio varejista de produtos de padaria"
    // don't map well onto Google Maps queries. Strip common verbose prefixes
    // and redundant tail phrases so the search becomes "padaria" instead.
    const role = normalizeRole(String(rawRole));

    // Auth: get user from token and find their license
    const authHeader = req.headers.get("Authorization");
    let licenseId: string | null = null;
    let availableCredits = 0;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: license } = await supabase
          .from("licenses")
          .select("id, monthly_credits, used_credits, extra_credits, plan_type")
          .eq("assigned_to", user.id)
          .eq("is_active", true)
          .maybeSingle();
        if (license) {
          licenseId = license.id;
          availableCredits = (license.monthly_credits || 0) + (license.extra_credits || 0) - (license.used_credits || 0);
        }
      }
    }
    // Also try code-based lookup as fallback
    if (!licenseId && code) {
      const { data: license } = await supabase
        .from("licenses")
        .select("id, monthly_credits, used_credits, extra_credits, plan_type")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (license) {
        licenseId = license.id;
        availableCredits = (license.monthly_credits || 0) + (license.extra_credits || 0) - (license.used_credits || 0);
      }
    }

    // Check credits
    if (licenseId && availableCredits <= 0) {
      return new Response(
        JSON.stringify({ error: "Seus créditos acabaram. Compre mais créditos para continuar buscando leads." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isInternational = !!country;
    const isNationwide = !state && !city && !country;

    let places: any[] = [];

    if (isInternational) {
      if (city) {
        // Specific city in country
        const query = `${role} ${city} ${country}`;
        try {
          places = await searchMapsQuery(query);
          places = deduplicatePlaces(places);
        } catch (e) {
          console.log("International city search failed:", (e as Error).message);
        }
      } else {
        // Country-wide: search across major cities
        const countryCities = COUNTRY_CITIES[country];
        if (countryCities && countryCities.length > 0) {
          try {
            places = await searchMultiCity(role, countryCities);
          } catch (e) {
            console.log("International multi-city search failed:", (e as Error).message);
          }
        } else {
          // Fallback for unknown countries: generic search
          try {
            places = await searchMapsQuery(`${role} ${country}`);
            places = deduplicatePlaces(places);
          } catch (e) {
            console.log("International search failed:", (e as Error).message);
          }
        }
      }
      // Fallback to SerpAPI if still low
      if (places.length < 20) {
        const query = city ? `${role} ${city} ${country}` : `${role} ${country}`;
        try {
          const serpResults = await searchWithSerpApi(query, Deno.env.get("SERPAPI_KEY_1")!, 60);
          places = deduplicatePlaces([...places, ...serpResults]);
        } catch { /* ignore */ }
      }
    } else if (isNationwide) {
      // Search across multiple major cities for nationwide results
      try {
        places = await searchBrazilWide(role);
      } catch (e) {
        console.log("Nationwide search failed:", (e as Error).message);
      }

      // Fallback to SerpAPI if still low
      if (places.length < 20) {
        try {
          const serpResults = await searchWithSerpApi(`${role} Brasil`, Deno.env.get("SERPAPI_KEY_1")!, 60);
          places = deduplicatePlaces([...places, ...serpResults]);
        } catch { /* ignore */ }
      }
    } else if (state && !city) {
      // State-only: search across multiple cities in that state
      try {
        places = await searchStateWide(role, state);
      } catch (e) {
        console.log("State-wide search failed:", (e as Error).message);
      }

      // Fallback to SerpAPI if still low
      if (places.length < 20) {
        try {
          const serpResults = await searchWithSerpApi(`${role} ${state}`, Deno.env.get("SERPAPI_KEY_1")!, 60);
          places = deduplicatePlaces([...places, ...serpResults]);
        } catch { /* ignore */ }
      }
    } else {
      // Specific city + state search
      const query = `${role} ${city} ${state}`;

      try {
        places = await searchMapsQuery(query);
        places = deduplicatePlaces(places);
      } catch (e1) {
        console.log("Serper falhou:", (e1 as Error).message);
        try {
          places = await searchWithSerpApi(query, Deno.env.get("SERPAPI_KEY_1")!, 60);
        } catch (e2) {
          console.log("SerpAPI 1 falhou:", (e2 as Error).message);
          try {
            places = await searchWithSerpApi(query, Deno.env.get("SERPAPI_KEY_2")!, 60);
          } catch {
            return new Response(
              JSON.stringify({ error: "Todas as APIs falharam." }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    if (places.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum resultado encontrado para esta busca." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap results at available credits
    if (licenseId && availableCredits > 0 && places.length > availableCredits) {
      places = places.slice(0, availableCredits);
    }

    // Stream results using SSE — deduct 1 credit per lead as it streams
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "total", count: places.length })}\n\n`));

        let leadsStreamed = 0;
        for (let i = 0; i < places.length; i++) {
          const p = places[i];
          const name = p.title || "Não encontrado";
          const phone = p.phoneNumber || p.phone || "";

          const socials = await searchSocials(name);

          const lead = {
            name,
            phone,
            email: socials.email,
            instagram: socials.instagram,
            linkedin: socials.linkedin,
            website: p.website || socials.site,
            city: city || p.address || "",
            state: state || country || "",
            category: role,
          };

          // Persist lead to DB immediately so it survives navigation and shows
          // up live in the CRM via the existing realtime subscription.
          // (Previously the lead only lived in frontend state and was lost when
          // the user left the search page without clicking "Save to CRM".)
          let savedLeadId: string | null = null;
          if (licenseId) {
            try {
              const { data: ins } = await supabase
                .from("leads")
                .insert({
                  license_id: licenseId,
                  name: lead.name && lead.name !== "Não encontrado" ? lead.name : null,
                  email: lead.email && lead.email !== "Não encontrado" ? lead.email : null,
                  instagram: lead.instagram && lead.instagram !== "Não encontrado" ? lead.instagram : null,
                  phone: lead.phone && lead.phone !== "Não encontrado" ? lead.phone : null,
                  website: lead.website && lead.website !== "Não encontrado" ? lead.website : null,
                  linkedin: lead.linkedin && lead.linkedin !== "Não encontrado" ? lead.linkedin : null,
                  category: lead.category || null,
                })
                .select("id")
                .single();
              savedLeadId = ins?.id || null;
            } catch (e) {
              console.error("Failed to persist lead", i, e);
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "lead", lead: { ...lead, id: savedLeadId }, index: i })}\n\n`));
          leadsStreamed++;

          // Deduct 1 credit immediately for this lead
          if (licenseId) {
            try {
              await supabase.rpc("increment_used_credits", { p_license_id: licenseId, p_amount: 1 });
            } catch (e) {
              console.error("Failed to increment credit for lead", i, e);
            }
          }
        }

        // Log the transaction once at the end with actual count
        if (licenseId && leadsStreamed > 0) {
          try {
            const { data: finalLicense } = await supabase
              .from("licenses")
              .select("monthly_credits, used_credits, extra_credits")
              .eq("id", licenseId)
              .single();
            if (finalLicense) {
              const balanceAfter = (finalLicense.monthly_credits || 0) + (finalLicense.extra_credits || 0) - (finalLicense.used_credits || 0);
              await supabase.from("credit_transactions").insert({
                license_id: licenseId,
                type: "usage",
                amount: -leadsStreamed,
                balance_after: balanceAfter,
                description: `Busca: ${role} (${leadsStreamed} leads)`,
              });
            }
          } catch (e) {
            console.error("Failed to log credit transaction:", e);
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
