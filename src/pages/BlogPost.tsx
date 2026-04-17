import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock, Loader2, ChevronRight, List } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { injectInternalLinks } from "@/lib/autoInternalLinks";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

/** Extract headings from markdown content for TOC */
function extractHeadings(content: string): Array<{ id: string; text: string; level: number }> {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      const id = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Get related articles from same cluster
  const { data: relatedPosts } = useQuery({
    queryKey: ["blog-related", article?.cluster, slug],
    queryFn: async () => {
      if (!article?.cluster) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, page_type, read_time")
        .eq("cluster", article.cluster)
        .neq("slug", slug!)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!article?.cluster,
  });

  // Get parent pillar if exists
  const { data: parentPillar } = useQuery({
    queryKey: ["blog-parent", article?.parent_slug],
    queryFn: async () => {
      if (!article?.parent_slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title")
        .eq("slug", article.parent_slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!article?.parent_slug,
  });

  // Get prev/next
  const { data: navPosts } = useQuery({
    queryKey: ["blog-nav", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const currentIndex = navPosts?.findIndex((p) => p.slug === slug) ?? -1;
  const prevSlug = currentIndex > 0 ? navPosts![currentIndex - 1].slug : null;
  const nextSlug = currentIndex >= 0 && currentIndex < (navPosts?.length || 0) - 1 ? navPosts![currentIndex + 1].slug : null;

  // Extract TOC headings
  const headings = useMemo(() => {
    if (!article?.content) return [];
    return extractHeadings(article.content);
  }, [article?.content]);

  const siteUrl = "https://leadspro.app";

  useDocumentMeta({
    title: article ? `${article.title} — Blog LeadsPro` : "Blog LeadsPro",
    description: article?.meta_description || "Artigo do blog LeadsPro.",
    ogImage: article?.hero_image_url || `${siteUrl}/og-image.jpg`,
    ogType: "article",
    twitterCard: "summary_large_image",
    canonicalUrl: article ? `${siteUrl}/blog/${article.slug}` : undefined,
  });

  // Preload hero image for LCP optimization
  useEffect(() => {
    if (!article?.hero_image_url) return;
    const preloadId = "blog-hero-preload";
    let link = document.getElementById(preloadId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = preloadId;
      link.rel = "preload";
      link.as = "image";
      document.head.appendChild(link);
    }
    link.href = article.hero_image_url;
    return () => { document.getElementById(preloadId)?.remove(); };
  }, [article?.hero_image_url]);

  // Inject JSON-LD structured data
  useEffect(() => {
    if (!article) return;
    const articleUrl = `${siteUrl}/blog/${article.slug}`;

    // Article schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.meta_description || article.excerpt,
      image: article.hero_image_url || `${siteUrl}/og-image.jpg`,
      datePublished: article.published_at,
      dateModified: article.created_at,
      author: { "@type": "Organization", name: "LeadsPro", url: siteUrl },
      publisher: {
        "@type": "Organization",
        name: "LeadsPro",
        logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      wordCount: article.word_count || undefined,
      keywords: (article.keywords || []).join(", "),
    };

    // BreadcrumbList schema
    const breadcrumbItems = [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
    ];
    if (parentPillar) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: parentPillar.title,
        item: `${siteUrl}/blog/${parentPillar.slug}`,
      });
      breadcrumbItems.push({ "@type": "ListItem", position: 4, name: article.title, item: articleUrl });
    } else {
      breadcrumbItems.push({ "@type": "ListItem", position: 3, name: article.title, item: articleUrl });
    }
    const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbItems };

    // FAQPage schema — extract from FAQ section in content
    const faqItems: Array<{ "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }> = [];
    const faqMatch = article.content?.match(/##\s*(?:FAQ|Perguntas\s*Frequentes|Dúvidas)[^\n]*\n([\s\S]*?)(?=\n##\s|$)/i);
    if (faqMatch) {
      const faqSection = faqMatch[1];
      const qMatches = faqSection.matchAll(/###?\s*\d*\.?\s*(.+\?)\s*\n+([\s\S]*?)(?=\n###?\s|\n##\s|$)/g);
      for (const m of qMatches) {
        faqItems.push({
          "@type": "Question",
          name: m[1].trim(),
          acceptedAnswer: { "@type": "Answer", text: m[2].trim().replace(/\n+/g, " ").substring(0, 500) },
        });
      }
    }

    const schemas = [articleSchema, breadcrumbSchema];
    if (faqItems.length > 0) {
      schemas.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems } as any);
    }

    // Inject into head
    const scriptId = "blog-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemas);

    // Canonical URL
    const canonicalId = "blog-canonical";
    let canonical = document.getElementById(canonicalId) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.id = canonicalId;
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = articleUrl;

    return () => {
      document.getElementById(scriptId)?.remove();
      document.getElementById(canonicalId)?.remove();
    };
  }, [article, parentPillar]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Button onClick={() => navigate("/blog")}>Voltar ao Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/blog")} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Blog
        </Button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 max-w-3xl mx-auto">
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          {parentPillar && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/blog/${parentPillar.slug}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                {parentPillar.title}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </nav>

        <motion.article className="max-w-3xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="gradient-bg text-primary-foreground border-0">{article.cluster || article.category}</Badge>
            {article.page_type && article.page_type !== "satellite" && (
              <Badge variant="outline" className="text-[10px]">
                {article.page_type === "pillar_master" ? "Pilar Master" : article.page_type === "pillar_secondary" ? "Pilar" : article.page_type === "transactional" ? "Comparativo" : article.page_type === "niche" ? "Nicho" : "Internacional"}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(article.published_at)}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {article.read_time}
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold font-display leading-tight mb-8">
            {article.title}
          </motion.h1>

          {/* Table of Contents */}
          {headings.length >= 3 && (
            <motion.nav variants={fadeUp} custom={1.5} className="mb-10 p-5 rounded-2xl border border-border/60 bg-muted/30">
              <h2 className="flex items-center gap-2 text-base font-bold font-display mb-3">
                <List className="h-4 w-4 text-primary" /> Índice do Artigo
              </h2>
              <ul className="space-y-1.5">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
                    <a
                      href={`#${h.id}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors leading-relaxed"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}

          <motion.div variants={fadeUp} custom={2} className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-blockquote:border-primary prose-blockquote:text-muted-foreground prose-a:text-primary prose-a:underline">
            {article.hero_image_url && (
              <img
                src={article.hero_image_url}
                alt={article.title}
                className="w-full rounded-2xl shadow-lg mb-8 aspect-video object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            )}
            <ReactMarkdown
              components={{
                h2: ({ children, ...props }) => {
                  const text = String(children).replace(/\*\*/g, "");
                  const id = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                  return <h2 id={id} {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const text = String(children).replace(/\*\*/g, "");
                  const id = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                  return <h3 id={id} {...props}>{children}</h3>;
                },
                a: ({ href, children, ...props }) => {
                  if (href?.startsWith("/")) {
                    return <Link to={href} className="text-primary underline" {...props}>{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                },
              }}
            >
              {injectInternalLinks(article.content)}
            </ReactMarkdown>
          </motion.div>

          {/* Related articles */}
          {relatedPosts && relatedPosts.length > 0 && (
            <motion.div variants={fadeUp} custom={3} className="mt-12 p-6 rounded-2xl border border-border/60 bg-muted/30">
              <h3 className="text-xl font-bold font-display mb-4">Artigos Relacionados</h3>
              <div className="grid gap-3">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    to={`/blog/${rp.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {rp.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">{rp.read_time}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div variants={fadeUp} custom={4} className="mt-12 p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center">
            <h3 className="text-2xl font-bold font-display mb-3">Pronto para capturar mais leads?</h3>
            <p className="text-muted-foreground mb-6">Comece gratuitamente e veja resultados nas primeiras horas.</p>
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Nav prev/next */}
          <motion.div variants={fadeUp} custom={5} className="flex justify-between mt-10 gap-4">
            {prevSlug ? (
              <Link to={`/blog/${prevSlug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Artigo anterior
              </Link>
            ) : <span />}
            {nextSlug ? (
              <Link to={`/blog/${nextSlug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Próximo artigo <ArrowRight className="h-4 w-4" />
              </Link>
            ) : <span />}
          </motion.div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogPost;
