import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Kanban, GripVertical, Eye, Zap, BarChart3, MessageCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeaturePipeline = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Pipeline de Vendas Kanban para Leads | LeadsPro",
    description: "Gerencie seu funil de vendas com pipeline Kanban. Arraste leads entre etapas, visualize o progresso e feche mais negócios.",
    canonicalUrl: "https://leadspro.app/recursos/pipeline",
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
              <Kanban className="h-3.5 w-3.5 mr-2" /> Pipeline de Vendas
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Gerencie seus leads no <span className="gradient-text">Pipeline visual</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Visualize todo o seu funil de vendas em um Kanban intuitivo. Arraste e solte leads entre as etapas — de <strong>Novo</strong> a <strong>Fechado</strong> — e acompanhe cada oportunidade em tempo real. Integrado diretamente com a Caixa de Entrada do WhatsApp: ao categorizar um contato no chat, ele aparece automaticamente na coluna correspondente.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📊 Seu funil de vendas em uma única tela</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Cada coluna representa uma etapa do funil: <strong>Novo</strong>, <strong>Quente</strong>, <strong>Frio</strong>, <strong>Agendado</strong>, <strong>Fechado</strong> e <strong>Perdido</strong>. Os cards mostram o nome do lead, categoria, e ações rápidas de contato (telefone, WhatsApp, email, Instagram, LinkedIn). Basta arrastar um card para outra coluna e o status é atualizado instantaneamente no banco de dados.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center h-48 sm:h-64">
              <Kanban className="h-16 w-16 sm:h-24 sm:w-24 text-primary/40" strokeWidth={1} />
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: GripVertical, title: "Drag and Drop", desc: "Arraste leads entre colunas para atualizar o status instantaneamente. Sem formulários, sem cliques extras." },
              { icon: Eye, title: "Visão completa do funil", desc: "Veja quantos leads estão em cada etapa. Identifique gargalos e oportunidades em segundos." },
              { icon: Zap, title: "Atualização em tempo real", desc: "Categorizou um lead no WhatsApp? Ele aparece automaticamente na coluna certa do Pipeline." },
              { icon: MessageCircle, title: "Ações rápidas no card", desc: "Ligue, mande WhatsApp, email ou acesse o Instagram do lead direto do card do Pipeline." },
              { icon: BarChart3, title: "Métricas visuais", desc: "Contador de leads por coluna para acompanhar a saúde do seu funil de vendas." },
              { icon: Shield, title: "Persistência garantida", desc: "Toda movimentação é salva no banco de dados. Seus dados estão seguros e sincronizados." },
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

export default FeaturePipeline;
