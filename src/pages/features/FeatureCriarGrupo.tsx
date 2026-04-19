import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Users, UserPlus, Search, MessageCircle, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureCriarGrupo = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Criar Grupos de WhatsApp Automaticamente | LeadsPro",
    description: "Crie grupos no WhatsApp automaticamente com seus leads. Adicione membros por categoria e comece a vender em grupo.",
    canonicalUrl: "https://leadspro.app/recursos/criar-grupos",
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
              <Users className="h-3.5 w-3.5 mr-2" /> Criação de Grupos
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Crie grupos no <span className="gradient-text">WhatsApp</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Crie grupos no WhatsApp diretamente pela plataforma. Selecione contatos da sua lista, defina um nome e descrição, e o grupo é criado instantaneamente — sem precisar abrir o celular.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">👥 Monte grupos em segundos</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Na caixa de entrada, clique no ícone de grupo, defina o nome, adicione uma descrição opcional e selecione os participantes da sua lista de contatos. Com um clique em <strong>Criar Grupo</strong>, o grupo é criado automaticamente no seu WhatsApp conectado.
            </p>
            <FeaturePreview variant="group-create" />
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Users, title: "Criação rápida", desc: "Monte grupos em segundos, direto pela plataforma." },
              { icon: Search, title: "Busca de contatos", desc: "Pesquise e selecione participantes facilmente na lista." },
              { icon: UserPlus, title: "Seleção múltipla", desc: "Adicione vários participantes de uma vez ao grupo." },
              { icon: MessageCircle, title: "Integrado à inbox", desc: "O grupo aparece automaticamente na sua caixa de entrada." },
              { icon: Zap, title: "Sem sair do sistema", desc: "Não precisa abrir o celular para criar o grupo." },
              { icon: Shield, title: "Seu número", desc: "O grupo é criado usando sua instância pessoal conectada." },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-border/60 bg-card p-5 card-shadow">
                <b.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={5} className="text-center py-12 border-t border-border/40">
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Pronto para criar grupos rapidamente?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Conecte sua instância e comece a criar grupos direto pelo painel.
            </p>
            <Button size="lg" className="gradient-bg text-primary-foreground border-0 gap-2 text-base px-8 py-6" onClick={() => navigate("/auth")}>
              Começar agora <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureCriarGrupo;
