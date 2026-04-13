import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock, Loader2, Crown, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const CLUSTER_META: Record<string, { title: string; description: string }> = {
  "disparo-em-massa": { title: "Disparo em Massa no WhatsApp", description: "Guias completos sobre disparo em massa no WhatsApp: estratégias, ferramentas, anti-ban e boas práticas para campanhas eficazes." },
  "follow-up": { title: "Follow Up Automático", description: "Tudo sobre follow up automático no WhatsApp: sequências, scripts, métricas e automação para nunca perder um lead." },
  "busca-de-leads": { title: "Busca de Leads", description: "Técnicas e ferramentas para buscar leads qualificados: prospecção B2B, Google Maps, CNAE, listas e enriquecimento de dados." },
  "whatsapp-nichos": { title: "WhatsApp Marketing por Nicho", description: "Estratégias de WhatsApp marketing para nichos específicos: imobiliárias, clínicas, restaurantes, academias e mais." },
  "caixa-de-entrada": { title: "Caixa de Entrada Integrada", description: "Como centralizar e gerenciar atendimento WhatsApp com caixa de entrada integrada, CRM e multi-atendimento." },
  "ia-whatsapp": { title: "Inteligência Artificial no WhatsApp", description: "Chatbot com IA, automação inteligente, agente de vendas e atendimento automatizado via WhatsApp." },
  "transacional": { title: "Comparativos e Ferramentas", description: "Comparativos detalhados de ferramentas de automação WhatsApp, CRM, disparo em massa e gestão de leads." },
  "internacional": { title: "WhatsApp Marketing Internacional", description: "Estratégias de WhatsApp marketing para mercados internacionais: Brasil, Portugal, México, EUA e América Latina." },
};

function slugToCluster(slug: string): string {
  const map: Record<string, string> = {
    "disparo-em-massa": "Disparo em Massa",
    "follow-up": "Follow Up",
    "busca-de-leads": "Busca de Leads",
    "whatsapp-nichos": "WhatsApp Nichos",
    "caixa-de-entrada": "Caixa de Entrada",
    "ia-whatsapp": "IA WhatsApp",
    "transacional": "Transacional",
    "internacional": "Internacional",
  };
  return map[slug] || slug;
}

const BlogCategory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const clusterName = slugToCluster(category || "");
  const meta = CLUSTER_META[category || ""] || { title: clusterName, description: `Artigos sobre ${clusterName}` };

  useDocumentMeta({
    title: `${meta.title} — Blog LeadsPro`,
    description: meta.description,
    canonicalUrl: `https://leadspro.app/blog/categoria/${category}`,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-category", clusterName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, category, read_time, published_at, page_type, cluster, hero_image_url")
        .eq("cluster", clusterName)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clusterName,
  });

  // Inject JSON-LD
  useEffect(() => {
    const siteUrl = "https://leadspro.app";
    const pageUrl = `${siteUrl}/blog/categoria/${category}`;
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: meta.title, item: pageUrl },
      ],
    };
    const collectionPage = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.title,
      description: meta.description,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "LeadsPro", url: siteUrl },
    };

    const scriptId = "category-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify([breadcrumb, collectionPage]);

    const canonicalId = "category-canonical";
    let canonical = document.getElementById(canonicalId) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.id = canonicalId;
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    return () => {
      document.getElementById(scriptId)?.remove();
      document.getElementById(canonicalId)?.remove();
    };
  }, [category, meta]);

  const pillars = (posts || []).filter((p) => p.page_type === "pillar_master" || p.page_type === "pillar_secondary");
  const satellites = (posts || []).filter((p) => p.page_type !== "pillar_master" && p.page_type !== "pillar_secondary");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/blog")} className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Blog
        </Button>

        <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <BookOpen className="h-3.5 w-3.5 mr-2" /> {clusterName}
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4">
            {meta.title}
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            {meta.description}
          </motion.p>

          {/* Pillar highlights */}
          {pillars.length > 0 && (
            <motion.div variants={fadeUp} custom={3} className="mb-10">
              <h2 className="flex items-center gap-2 text-lg font-bold font-display mb-4">
                <Crown className="h-5 w-5 text-primary" /> Guia Completo
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pillars.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 hover:border-primary/60 transition-all hover:shadow-xl"
                  >
                    <h3 className="text-lg font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    <span className="inline-flex items-center text-xs font-medium text-primary mt-3 group-hover:underline">
                      Ler guia completo <ArrowRight className="ml-1 h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6">
              {satellites.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group block p-6 md:p-8 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-xs">{post.cluster || post.category}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {formatDate(post.published_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {post.read_time}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                    Ler artigo <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
              {satellites.length === 0 && pillars.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Nenhum artigo nesta categoria ainda.</p>
              )}
            </div>
          )}

          <motion.div variants={fadeUp} custom={10} className="text-center mt-16">
            <p className="text-muted-foreground mb-4">Quer capturar leads e automatizar suas vendas?</p>
            <Button size="lg" onClick={() => navigate("/checkout")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogCategory;
