import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Smartphone, QrCode, Wifi, Shield, Zap, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureInstancia = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Conectar WhatsApp ao CRM via QR Code | LeadsPro",
    description: "Conecte seu WhatsApp ao LeadsPro em segundos via QR Code. Instância dedicada, reconexão automática e sem risco de banimento.",
    canonicalUrl: "https://leadspro.app/recursos/instancia",
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
              <Smartphone className="h-3.5 w-3.5 mr-2" /> Integração via QR Code
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-[1.05] tracking-tight mb-6">
            Conecte seu <span className="gradient-text">WhatsApp</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Vincule seu número pessoal de WhatsApp via QR Code para enviar mensagens, criar campanhas e usar todas as automações com o seu próprio número.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📱 Conexão rápida via QR Code</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Na seção <strong>Integração via QR Code</strong>, escaneie o QR Code com seu celular (WhatsApp → Dispositivos conectados → Conectar dispositivo). Em segundos, seu número estará vinculado e pronto para disparos, follow-ups e a caixa de entrada.
            </p>
            <FeaturePreview variant="qr-code" />
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: QrCode, title: "QR Code instantâneo", desc: "Escaneie e conecte em segundos, sem configurações complexas." },
              { icon: Wifi, title: "Status em tempo real", desc: "Monitore se sua instância está conectada ou desconectada." },
              { icon: Smartphone, title: "Seu próprio número", desc: "Use seu número pessoal para todas as automações." },
              { icon: Shield, title: "Conexão segura", desc: "Sua instância é exclusiva e protegida por autenticação." },
              { icon: MessageCircle, title: "Integração total", desc: "Funciona com campanhas, follow-ups e caixa de entrada." },
              { icon: Zap, title: "Desconectar e reconectar", desc: "Gerencie sua instância a qualquer momento com um clique." },
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Pronto para conectar seu WhatsApp?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Crie sua conta e vincule seu número em menos de 1 minuto.
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

export default FeatureInstancia;
