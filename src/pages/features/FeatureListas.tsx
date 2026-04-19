import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, FolderOpen, Palette, Tag, Plus, ListChecks, Target, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureListas = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Listas Personalizadas de Leads | LeadsPro",
    description: "Organize seus leads em listas coloridas e segmentadas. Crie listas por nicho, região ou status e gerencie suas campanhas com precisão.",
    canonicalUrl: "https://leadspro.app/recursos/listas",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <motion.div className="max-w-5xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <FolderOpen className="h-3.5 w-3.5 mr-2" /> Listas
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Listas <span className="gradient-text">personalizadas</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Organize seus leads em listas customizadas por cor e nome. Use como filtro para campanhas e follow-ups — sua base, do seu jeito.
          </motion.p>

          {/* Screenshot 1 - Visão geral */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📁 Suas listas de leads</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              A tela de <strong>Listas de Leads</strong> mostra todas as suas listas criadas. Cada card exibe o <strong>nome da lista</strong>, a <strong>cor identificadora</strong>, a <strong>quantidade de leads</strong> e a <strong>data de criação</strong>. Clique em qualquer lista para ver todos os leads dentro dela.
            </p>
            <FeaturePreview variant="lists-grid" />
          </motion.div>

          {/* Screenshot 2 - Detalhe */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">👁️ Detalhe da lista</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Ao abrir uma lista, você vê todos os leads que pertencem a ela em uma tabela com <strong>Categoria</strong>, <strong>Nome</strong>, <strong>Telefone</strong>, <strong>Instagram</strong>, <strong>LinkedIn</strong> e <strong>Site</strong>. Cada ícone é clicável e leva direto ao perfil do lead. Você pode remover leads individualmente clicando no ícone de lixeira.
            </p>
            <FeaturePreview variant="lists-detail" />

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={5} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Plus, title: "Criação rápida", desc: "Crie listas em segundos com nome e cor personalizados." },
              { icon: Palette, title: "Cores personalizadas", desc: "Identifique cada lista visualmente com cores diferentes." },
              { icon: Tag, title: "Salvar leads em listas", desc: "Adicione leads a qualquer lista diretamente do CRM." },
              { icon: Target, title: "Filtro para campanhas", desc: "Use listas como filtro para disparos e follow-ups." },
              { icon: ListChecks, title: "Gerenciamento completo", desc: "Veja quantos leads tem em cada lista, remova ou adicione." },
              { icon: Eye, title: "Visualização detalhada", desc: "Abra qualquer lista e veja todos os leads com dados completos." },
            ].map((b) => (
              <div key={b.title} className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors">
                <div className="rounded-xl p-2.5 w-fit mb-4 bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold font-display text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="text-center">
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureListas;
