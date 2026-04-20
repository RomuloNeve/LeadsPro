import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Repeat, Clock, CalendarDays, Zap, Settings, MessageSquare, Send, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureFollowup = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Follow-up Automático por WhatsApp | LeadsPro",
    description: "Configure sequências automáticas de follow-up por WhatsApp. Envie mensagens nos dias 1, 3, 5 e 7 automaticamente e triplique suas conversões.",
    canonicalUrl: "https://leadspro.app/recursos/followup",
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
              <Repeat className="h-3.5 w-3.5 mr-2" /> Follow-up Automático
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-[1.05] tracking-tight mb-6">
            Follow-up <span className="gradient-text">automático</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Nunca mais perca um lead por falta de acompanhamento. Configure uma sequência uma única vez e o sistema envia mensagens automáticas nos dias 1, 3, 5 e 7 — mantendo seus leads aquecidos até a conversão.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">✨ Criando uma sequência de follow-up</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Clique em <strong>+ Nova Sequência</strong> e preencha: <strong>Nome da sequência</strong>, <strong>Nome da sua empresa</strong> e <strong>Serviços que você oferece</strong>. Em seguida, selecione <strong>para quais leads</strong> enviar (todos, por categoria ou por lista). As <strong>mensagens são geradas automaticamente</strong> com base nos seus dados — você não precisa escrever nada. O sistema cria 4 mensagens otimizadas para os dias 1, 3, 5 e 7, cada uma com um tom diferente (primeiro contato, reforço, oferta, última tentativa). Tudo fica registrado e pode ser disparado manualmente por etapa se necessário.
            </p>
            <FeaturePreview variant="followup-sequence" />
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: CalendarDays, title: "Sequências D+1 a D+7", desc: "Mensagens automáticas nos dias 1, 3, 5 e 7 após a captura." },
              { icon: Zap, title: "100% automático", desc: "Configure uma vez e esqueça. O sistema envia no horário certo." },
              { icon: Settings, title: "Configuração simples", desc: "Preencha seus serviços uma vez. As mensagens são geradas pela IA." },
              { icon: Clock, title: "Agendamento às 09h", desc: "Envio automático diário às 09:00 no melhor horário comercial." },
              { icon: Send, title: "Disparo manual por etapa", desc: "Controle extra: dispare qualquer etapa individual quando quiser." },
              { icon: Filter, title: "Filtro por destino", desc: "Envie para todos, por categoria ou por lista específica." },
            ].map((b) => (
              <div key={b.title} className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300">
                <div className="rounded-xl p-2.5 w-fit mb-4 bg-primary/10 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
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

export default FeatureFollowup;
