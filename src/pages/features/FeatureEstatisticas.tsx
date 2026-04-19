import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, BarChart3, TrendingUp, PieChart, Activity, Clock, Radar, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureEstatisticas = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Estatísticas e Relatórios de Leads em Tempo Real | LeadsPro",
    description: "Acompanhe métricas de leads, campanhas e conversões em tempo real. Gráficos, tendências e insights para tomar decisões melhores.",
    canonicalUrl: "https://leadspro.app/recursos/estatisticas",
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
              <BarChart3 className="h-3.5 w-3.5 mr-2" /> Estatísticas
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Métricas e <span className="gradient-text">relatórios</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Acompanhe sua evolução com gráficos intuitivos e análises avançadas. Entenda padrões, identifique oportunidades e otimize sua estratégia com dados em tempo real.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📈 Análises avançadas da sua base</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              A aba de Estatísticas oferece 6 gráficos especializados: o <strong>Crescimento Acumulado</strong> mostra a evolução total da sua base ao longo do tempo. A <strong>Qualidade dos Dados</strong> usa um gráfico radar para avaliar a completude dos campos (Telefone, E-mail, Instagram, LinkedIn, Site). O <strong>Leads por Dia da Semana</strong> revela quais dias são mais produtivos. <strong>Únicos vs Duplicatas</strong> mostra a proporção de leads novos. A <strong>Atividade por Horário</strong> identifica os picos de captura, e o <strong>Crescimento Semanal</strong> acompanha a evolução semana a semana.
            </p>
            <FeaturePreview variant="stats-chart" />
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: TrendingUp, title: "Crescimento acumulado", desc: "Acompanhe a evolução total da sua base de leads ao longo do tempo." },
              { icon: Radar, title: "Radar de qualidade", desc: "Análise multi-dimensional da completude dos dados capturados." },
              { icon: PieChart, title: "Únicos vs duplicatas", desc: "Visualize a proporção de leads novos vs repetidos na sua base." },
              { icon: Activity, title: "Atividade por horário", desc: "Descubra os melhores horários para capturar leads." },
              { icon: Clock, title: "Distribuição semanal", desc: "Identifique quais dias da semana são mais produtivos." },
              { icon: BarChart3, title: "Crescimento semanal", desc: "Acompanhe a evolução semana a semana com gráficos de barras." },
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

          <motion.div variants={fadeUp} custom={5} className="text-center">
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureEstatisticas;
