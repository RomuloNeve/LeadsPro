import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, LayoutDashboard, TrendingUp, PieChart, DollarSign, Gauge, BarChart3, Activity, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import featOverview1 from "@/assets/feat-overview-1.png";
import featOverview2 from "@/assets/feat-overview-2.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureOverview = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Painel de Controle e Dashboard de Vendas | LeadsPro",
    description: "Visualize todos os seus leads, campanhas e métricas em um dashboard intuitivo. Controle total das suas vendas em um só lugar.",
    canonicalUrl: "https://leadspro.app/recursos/painel",
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
              <LayoutDashboard className="h-3.5 w-3.5 mr-2" /> Painel de Controle
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Visão geral <span className="gradient-text">inteligente</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Seu dashboard pessoal com todas as métricas que importam. Veja seus números em tempo real e tome decisões baseadas em dados concretos — tudo consolidado em uma única tela.
          </motion.p>

          {/* Screenshot 1 - Métricas principais */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📊 Métricas e gráficos em tempo real</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              No topo, você tem os números que mais importam: <strong>Total de Leads</strong>, <strong>Leads capturados hoje</strong>, <strong>Categorias ativas</strong> e seu <strong>Plano atual</strong>. Logo abaixo, o gráfico <strong>Leads por Período</strong> mostra sua evolução diária (7, 14 ou 30 dias), enquanto a <strong>Distribuição por Tipo de Contato</strong> revela a proporção de e-mails, telefones, Instagram, LinkedIn e sites capturados. Mais abaixo, o gráfico <strong>Leads por Fonte de Dados</strong> mostra o volume por canal, e a <strong>Taxa de Leads Completos</strong> indica a qualidade dos dados capturados.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl">
              <img src={featOverview1} alt="Dashboard com métricas, gráficos de evolução e distribuição" className="w-full" />
            </div>
          </motion.div>

          {/* Screenshot 2 - Economia e segmento */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">💰 Economia gerada e volume por segmento</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              O gráfico de <strong>Economia Gerada</strong> compara o custo do LeadsPro com a compra de bases de dados prontas no mercado — mostrando quanto você está economizando em prospecção. Ao lado, o <strong>Volume por Segmento</strong> exibe um ranking horizontal das categorias com mais leads, ajudando você a identificar quais nichos estão trazendo mais resultados.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl">
              <img src={featOverview2} alt="Gráficos de economia gerada e volume por segmento" className="w-full" />
            </div>
          </motion.div>

          {/* Benefits grid */}
          <motion.div variants={fadeUp} custom={5} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Gauge, title: "Métricas de funil", desc: "Total de leads, capturas do dia, categorias ativas e plano — tudo num único painel." },
              { icon: TrendingUp, title: "Evolução diária", desc: "Gráficos de evolução mostram seu progresso ao longo de 7, 14 ou 30 dias." },
              { icon: PieChart, title: "Distribuição por contato", desc: "Veja a proporção de e-mails, telefones, Instagram, LinkedIn e sites." },
              { icon: DollarSign, title: "Economia gerada", desc: "Compare o custo da plataforma vs bases prontas e veja quanto economiza." },
              { icon: BarChart3, title: "Volume por segmento", desc: "Ranking das categorias com mais leads para direcionar seus esforços." },
              { icon: Activity, title: "Taxa de completude", desc: "Saiba a qualidade dos dados: % de leads com e-mail, telefone e redes." },
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
            <Button size="lg" onClick={() => navigate("/checkout")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureOverview;
