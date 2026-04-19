import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Clock, MessageCircle, FileText, CalendarDays, Mail, Zap, Shield, Brain, Send, Sparkles, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureChatbot = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Chatbot IA para WhatsApp com Agendamento | LeadsPro",
    description: "Chatbot com inteligência artificial para WhatsApp. Responde automaticamente, agenda reuniões e qualifica leads 24h por dia.",
    canonicalUrl: "https://leadspro.app/recursos/chatbot-ia",
  });

  const capabilities = [
    {
      icon: Clock,
      title: "24/7 sem parar",
      desc: "O bot responde instantaneamente a qualquer hora do dia ou da noite, fins de semana e feriados. Nunca perde um lead por falta de resposta.",
    },
    {
      icon: Brain,
      title: "IA conversacional avançada",
      desc: "Usa inteligência artificial de última geração (Gemini) para manter conversas naturais, entender contexto e responder como um vendedor experiente.",
    },
    {
      icon: MessageCircle,
      title: "Qualificação automática de leads",
      desc: "O bot faz perguntas estratégicas para qualificar o lead, entender suas necessidades e conduzir naturalmente para a venda ou agendamento.",
    },
    {
      icon: FileText,
      title: "Envio de propostas e documentos",
      desc: "Quando o lead pedir proposta comercial, catálogo ou qualquer material, o bot envia automaticamente os PDFs e arquivos que você cadastrou.",
    },
    {
      icon: CalendarDays,
      title: "Agendamento inteligente",
      desc: "O bot detecta quando o lead quer agendar uma reunião e envia seu link de agendamento (Calendly, Google Calendar, etc.) pelo WhatsApp e por e-mail.",
    },
    {
      icon: Mail,
      title: "Envio de e-mails automáticos",
      desc: "Quando o lead compartilha seu e-mail, o bot envia automaticamente o link de agendamento por e-mail com template profissional.",
    },
    {
      icon: UserCheck,
      title: "Transferência para atendente humano",
      desc: "Quando o lead pedir para falar com um humano, o bot transfere automaticamente. Você recebe notificação por e-mail e WhatsApp e atende direto pela Caixa de Entrada.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Configure seu bot",
      desc: "Descreva seu negócio, defina o tom de comunicação (profissional, amigável, consultivo, persuasivo ou casual), objetivos e regras de conduta.",
    },
    {
      step: "2",
      title: "Adicione seus materiais",
      desc: "Faça upload de propostas comerciais, catálogos, tabelas de preços e qualquer material que o bot pode enviar aos leads.",
    },
    {
      step: "3",
      title: "Ative para seus leads",
      desc: "Ative o bot individualmente para cada lead pelo toggle na Caixa de Entrada, ou ative o modo 'Responder Todos' para atender automaticamente qualquer mensagem recebida.",
    },
    {
      step: "4",
      title: "O bot trabalha por você",
      desc: "24 horas por dia, 7 dias por semana, o bot qualifica, envia propostas, agenda reuniões e conduz seus leads até a venda — enquanto você foca no que importa.",
    },
  ];

  const differentials = [
    { icon: Zap, title: "Resposta instantânea", desc: "Responde em segundos, não em horas. Leads quentes não esfriam." },
    { icon: Shield, title: "Controle total", desc: "Você define exatamente como o bot se comporta, o que pode e não pode falar." },
    { icon: Send, title: "WhatsApp nativo", desc: "Funciona direto no seu WhatsApp real, sem números virtuais ou APIs externas." },
    { icon: Sparkles, title: "Chat de teste", desc: "Teste seu bot em tempo real com streaming antes de ativar para leads reais." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <motion.div className="max-w-5xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <Bot className="h-3.5 w-3.5 mr-2" /> Chatbot IA
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Seu vendedor que{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              nunca dorme
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl leading-relaxed">
            Um assistente de IA que trabalha <strong>24 horas por dia, 7 dias por semana</strong> pelo seu WhatsApp.
            Qualifica leads, envia propostas, agenda reuniões e conduz vendas — tudo automaticamente, enquanto você dorme.
          </motion.p>

          {/* Preview */}
          <motion.div variants={fadeUp} custom={2.5} className="mb-12">
            <FeaturePreview variant="chatbot-conversation" />
          </motion.div>

          {/* 24/7 Hero highlight */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12 overflow-hidden">
              <div className="absolute top-4 right-4 md:top-6 md:right-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-400">Online 24/7</span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">24/7</p>
                  <p className="text-sm text-muted-foreground">Funcionando sem parar</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">&lt;3s</p>
                  <p className="text-sm text-muted-foreground">Tempo de resposta</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">∞</p>
                  <p className="text-sm text-muted-foreground">Conversas simultâneas</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Capabilities */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-8">🤖 O que o bot faz por você</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  variants={fadeUp}
                  custom={5 + i}
                  className="p-5 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
                >
                  <cap.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How it works */}
          <motion.div variants={fadeUp} custom={11} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-8">⚡ Como funciona</h2>
            <div className="space-y-6">
              {howItWorks.map((step, i) => (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  custom={12 + i}
                  className="flex gap-5 items-start"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Human Handoff Section */}
          <motion.div variants={fadeUp} custom={15} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">🤝 Atendimento Humano Integrado</h2>
            <p className="text-muted-foreground mb-8 max-w-3xl leading-relaxed">
              Quando o lead pedir para falar com uma pessoa real, o bot transfere automaticamente. Você recebe notificação por <strong>e-mail</strong> e <strong>WhatsApp</strong>, e atende direto pela Caixa de Entrada com um clique.
            </p>
            <FeaturePreview variant="chatbot-handoff" />
          </motion.div>

          {/* Differentials */}
          <motion.div variants={fadeUp} custom={16} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-8">💎 Diferenciais</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {differentials.map((diff, i) => (
                <motion.div
                  key={diff.title}
                  variants={fadeUp}
                  custom={17 + i}
                  className="flex gap-4 p-5 rounded-xl border border-border/60 bg-card"
                >
                  <diff.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{diff.title}</h3>
                    <p className="text-sm text-muted-foreground">{diff.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={21} className="text-center py-12">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-4">
              Pronto para ter um vendedor que nunca dorme?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Configure em minutos e deixe a IA trabalhar 24/7 pelo seu WhatsApp.
            </p>
            <Button onClick={() => navigate("/auth")} size="lg" className="gradient-bg text-primary-foreground gap-2 text-base px-8">
              Começar agora <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureChatbot;
