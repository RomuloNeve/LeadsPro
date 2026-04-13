import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://leadspro.app";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  // Recursos
  { loc: "/recursos/busca", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/disparo", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/crm", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/pipeline", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/followup", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/chatbot-ia", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/caixa-de-entrada", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/instancia", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/listas", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/painel", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/estatisticas", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/importacao", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/email-marketing", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/criar-grupos", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/widget", priority: "0.8", changefreq: "monthly" },
  { loc: "/recursos/criar-grupos", priority: "0.8", changefreq: "monthly" },
  { loc: "/glossario", priority: "0.7", changefreq: "monthly" },
  { loc: "/auth", priority: "0.5", changefreq: "monthly" },
  { loc: "/termos-de-uso", priority: "0.3", changefreq: "yearly" },
];

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .order("published_at", { ascending: false });

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic blog posts
    for (const post of posts || []) {
      const lastmod = post.published_at
        ? new Date(post.published_at).toISOString().split("T")[0]
        : today;
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
