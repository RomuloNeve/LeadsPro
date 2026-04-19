import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Mail, FileText, Users, BarChart3, Zap, Target, Sparkles, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureEmailMarketing = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "E-mail Marketing em Massa para Leads | LeadsPro",
    description: "Crie campanhas de e-mail marketing segmentadas com IA. Envie e-mails profissionais em massa para seus leads direto do CRM.",
    canonicalUrl: "https://leadspro.app/recursos/email-marketing",
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
              <Mail className="h-3.5 w-3.5 mr-2" /> Email Marketing
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Campanhas de email <span className="gradient-text">em massa</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Além do WhatsApp, alcance seus leads por e-mail. Crie campanhas profissionais com templates personalizados, segmente por categoria e acompanhe métricas de abertura e cliques — tudo dentro da plataforma.
          </motion.p>

          <motion.div variants={fadeUp} custom={2.5} className="mb-12">
            <FeaturePreview variant="email-composer" />
          </motion.div>

          {/* How it works */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">📧 Como funciona</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Crie sua campanha", desc: "Dê um nome, escolha o assunto, escreva o corpo do email e selecione a categoria de leads." },
                { step: "2", title: "Personalize o template", desc: "Use variáveis como {{nome}} e {{empresa}} para personalizar cada email automaticamente." },
                { step: "3", title: "Dispare para todos", desc: "Com um clique, o sistema envia os emails em lotes otimizados para máxima entregabilidade." },
              ].map((s) => (
                <div key={s.step} className="relative p-6 rounded-2xl border border-border/60 bg-card">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold font-display text-foreground mb-2 mt-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">✨ Recursos do Email Marketing</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Uma solução completa de email marketing integrada ao seu CRM. Sem precisar de ferramentas externas como Mailchimp ou ActiveCampaign — tudo em um só lugar.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={5} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: FileText, title: "Templates profissionais", desc: "Crie emails bonitos com editor visual. Adicione imagens, botões e formatação rica." },
              { icon: Users, title: "Segmentação por categoria", desc: "Envie para todos os leads ou filtre por categoria específica." },
              { icon: Sparkles, title: "IA para copywriting", desc: "Use a IA para melhorar o texto do seu email automaticamente." },
              
              { icon: BarChart3, title: "Métricas de campanha", desc: "Acompanhe taxa de abertura, cliques e bounces em tempo real." },
              { icon: Clock, title: "Agendamento", desc: "Agende o envio para o melhor horário e maximize sua taxa de abertura." },
              { icon: Send, title: "Envio em lotes", desc: "Sistema otimizado envia em lotes para garantir entregabilidade." },
              { icon: Zap, title: "Integração CRM", desc: "Leads do CRM são automaticamente elegíveis para campanhas de email." },
              
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

export default FeatureEmailMarketing;
