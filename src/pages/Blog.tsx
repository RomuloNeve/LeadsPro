import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Calendar, Clock, BookOpen, Loader2, Crown, Filter, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const CLUSTERS = [
  { name: "Todos", slug: "" },
  { name: "Disparo em Massa", slug: "disparo-em-massa" },
  { name: "Follow Up", slug: "follow-up" },
  { name: "Busca de Leads", slug: "busca-de-leads" },
  { name: "WhatsApp Nichos", slug: "whatsapp-nichos" },
  { name: "Caixa de Entrada", slug: "caixa-de-entrada" },
  { name: "IA WhatsApp", slug: "ia-whatsapp" },
  { name: "Transacional", slug: "transacional" },
  { name: "Internacional", slug: "internacional" },
];

const Blog = () => {
  const navigate = useNavigate();
  const [activeCluster, setActiveCluster] = useState("Todos");

  useDocumentMeta({
    title: "Blog LeadsPro — Dicas de Prospecção, Vendas e Automação",
    description: "Artigos sobre captura de leads, disparo em massa no WhatsApp, follow-up automático, CRM e automação de vendas.",
    canonicalUrl: "https://leadspro.app/blog",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, category, read_time, published_at, page_type, cluster, hero_image_url")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pillars = (posts || []).filter((p) => p.page_type === "pillar_master" || p.page_type === "pillar_secondary");
  const filteredPosts = (posts || []).filter((p) => {
    if (activeCluster === "Todos") return true;
    return p.cluster === activeCluster || p.category === activeCluster;
  });

  const categoriesWithCounts = CLUSTERS.filter(c => c.slug).map(c => ({
    ...c,
    count: (posts || []).filter(p => p.cluster === c.name || p.category === c.name).length,
  })).filter(c => c.count > 0);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const pageTypeLabel: Record<string, string> = {
    pillar_master: "Pilar Master",
    pillar_secondary: "Pilar",
    transactional: "Comparativo",
    niche: "Nicho",
    international: "Internacional",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <BookOpen className="h-3.5 w-3.5 mr-2" /> Blog
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4">
            Blog <span className="gradient-text">LeadsPro</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            Dicas, estratégias e tutoriais para capturar mais leads, automatizar suas vendas e escalar seu negócio.
          </motion.p>

          {/* Pillar highlights */}
          {pillars.length > 0 && (
            <motion.div variants={fadeUp} custom={3} className="mb-10">
              <h2 className="flex items-center gap-2 text-lg font-bold font-display mb-4">
                <Crown className="h-5 w-5 text-primary" /> Guias Completos
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pillars.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 hover:border-primary/60 transition-all hover:shadow-xl"
                  >
                    <Badge className="gradient-bg text-primary-foreground border-0 text-[10px] mb-3">
                      {pageTypeLabel[p.page_type || "satellite"] || "Artigo"}
                    </Badge>
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

          {/* Category hub links */}
          {categoriesWithCounts.length > 0 && (
            <motion.div variants={fadeUp} custom={3.5} className="mb-8">
              <h2 className="flex items-center gap-2 text-lg font-bold font-display mb-4">
                <FolderOpen className="h-5 w-5 text-primary" /> Categorias
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoriesWithCounts.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/blog/categoria/${c.slug}`}
                    className="group p-4 rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all hover:shadow-md text-center"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{c.name}</span>
                    <span className="block text-xs text-muted-foreground mt-1">{c.count} artigos</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Cluster filters */}
          <motion.div variants={fadeUp} custom={4} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtrar por tema:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLUSTERS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveCluster(c.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCluster === c.name
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group block p-6 md:p-8 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-xs">{post.cluster || post.category}</Badge>
                    {post.page_type && pageTypeLabel[post.page_type] && (
                      <Badge variant="outline" className="text-[10px]">{pageTypeLabel[post.page_type]}</Badge>
                    )}
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
                    Ler artigo completo <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
              {filteredPosts.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Nenhum artigo encontrado nesse tema ainda.</p>
              )}
            </div>
          )}

          <motion.div variants={fadeUp} custom={10} className="text-center mt-16">
            <p className="text-muted-foreground mb-4">Quer capturar leads e automatizar suas vendas?</p>
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
