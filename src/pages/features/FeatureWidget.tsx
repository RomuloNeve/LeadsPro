import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Code, Globe, Palette, MessageCircle, Database, Zap, Bot, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import featWidget from "@/assets/feat-widget.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureWidget = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Widget de Captura de Leads para Sites | LeadsPro",
    description: "Instale um formulário flutuante no seu site e capture leads direto no CRM. Personalize cores, título e posição. Instalação com uma linha de código.",
    canonicalUrl: "https://leadspro.app/recursos/widget",
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
              <Code className="h-3.5 w-3.5 mr-2" /> Widget de Captura
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Capture leads do seu site <span className="gradient-text">direto no CRM</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Instale um formulário flutuante no seu site com <strong>apenas uma linha de código</strong>. Os visitantes preenchem nome, WhatsApp, e-mail e mensagem — o lead cai automaticamente no seu CRM e <strong>nosso agente de IA envia a primeira mensagem no WhatsApp do lead usando o seu próprio número</strong>, garantindo o primeiro contato instantâneo.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16 rounded-2xl border border-border/60 overflow-hidden bg-card shadow-lg">
            <img src={featWidget} alt="Widget de Captura - Tela de configuração" className="w-full object-contain" loading="lazy" />
          </motion.div>

          {/* How it works */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">🚀 Como funciona</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Personalize", desc: "Escolha a cor, título e posição do balão flutuante (canto esquerdo ou direito) direto no painel." },
                { step: "2", title: "Copie o snippet", desc: "Cole uma única linha de código antes do </body> do seu site. Funciona em qualquer plataforma: WordPress, Wix, HTML puro." },
                { step: "3", title: "IA faz o primeiro contato", desc: "O lead cai no CRM e nosso agente de IA envia automaticamente uma mensagem personalizada no WhatsApp do lead, usando seu próprio número." },
              ].map((s) => (
                <div key={s.step} className="p-6 rounded-2xl border border-border/60 bg-card text-center">
                  <div className="w-10 h-10 rounded-full gradient-bg text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-4">{s.step}</div>
                  <h3 className="font-semibold font-display text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Auto-Response Highlight */}
          <motion.div variants={fadeUp} custom={4} className="mb-16 p-8 rounded-2xl border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-3 bg-primary/10 shrink-0">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-foreground mb-2">🤖 Agente de IA — Primeiro contato automático</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Assim que o lead preenche o formulário no seu site, nosso agente de IA gera uma <strong>mensagem personalizada</strong> com base no nome e na mensagem do visitante e envia automaticamente pelo <strong>seu próprio número do WhatsApp</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  O lead recebe a mensagem em <strong>segundos</strong>, vinda do seu número — como se você estivesse respondendo pessoalmente. Isso aumenta drasticamente a taxa de resposta e cria uma experiência profissional e humanizada.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={5} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Bot, title: "Resposta automática por IA", desc: "Agente de IA envia a primeira mensagem no WhatsApp do lead em segundos, usando seu número. Primeiro contato garantido, 24h por dia." },
              { icon: Palette, title: "100% Personalizável", desc: "Escolha a cor principal, título do formulário e posição do botão para combinar com a identidade do seu site." },
              { icon: Globe, title: "Funciona em qualquer site", desc: "WordPress, Wix, Squarespace, HTML puro — basta colar o snippet antes do </body> e pronto." },
              { icon: Database, title: "Integração direta com CRM", desc: "Leads chegam automaticamente no seu CRM do LeadsPro, categorizados como 'Widget' para fácil segmentação." },
              { icon: MessageCircle, title: "Captura WhatsApp e e-mail", desc: "Formulário otimizado com campos de nome, WhatsApp, e-mail e mensagem personalizada." },
              { icon: Zap, title: "Tempo real", desc: "O lead aparece no CRM e recebe a primeira mensagem no WhatsApp instantaneamente. Sem atrasos." },
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
            <Button size="lg" onClick={() => navigate("/checkout")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureWidget;
