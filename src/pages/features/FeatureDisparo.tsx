import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, MessageCircle, Users, Sparkles, Image, Send, Target, FileText, Shield, Clock, Shuffle, ChevronRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useStructuredData } from "@/hooks/useStructuredData";

import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const faqs = [
  { question: "Como fazer disparo em massa no WhatsApp sem ser banido?", answer: "O LeadsPro usa 3 camadas de proteção: variação automática de texto por IA (nenhuma mensagem é idêntica), intervalos randômicos de 30 a 300 segundos entre envios, e recomendações de lotes pequenos (20-50 leads). Seu número fica protegido contra banimento." },
  { question: "Quantas mensagens posso enviar por dia?", answer: "Recomendamos entre 50 a 200 mensagens por dia para números novos, aumentando gradualmente. Números aquecidos podem enviar mais. O sistema sugere o volume ideal baseado no comportamento do seu número." },
  { question: "Posso enviar imagens junto com as mensagens?", answer: "Sim. Cada campanha pode incluir uma imagem que é enviada junto com a mensagem de texto. Ideal para catálogos, promoções e apresentações visuais." },
  { question: "As mensagens são enviadas do meu número?", answer: "Sim. Todas as mensagens são enviadas diretamente do seu próprio número de WhatsApp, conectado via QR Code. Isso garante autenticidade e proximidade com seus leads." },
  { question: "Posso segmentar os leads para envio?", answer: "Sim. Você pode filtrar leads por categoria, lista personalizada ou selecionar manualmente. Isso permite campanhas direcionadas para públicos específicos com mensagens relevantes." },
  { question: "O que acontece se o lead responder?", answer: "As respostas aparecem na Caixa de Entrada integrada. Você pode responder em tempo real ou ativar o Chatbot IA para responder automaticamente 24h por dia." },
];

const FeatureDisparo = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useDocumentMeta({
    title: "Disparo em Massa WhatsApp 2026 | Envio Automático Sem Ban — LeadsPro",
    description: "Envie mensagens em massa pelo WhatsApp com proteção anti-banimento inteligente. Variação automática por IA, intervalos randômicos e campanhas segmentadas. Teste grátis 2 horas.",
    ogType: "website",
    twitterCard: "summary_large_image",
    canonicalUrl: "https://leadspro.app/recursos/disparo",
  });

  useStructuredData({
    pageUrl: "/recursos/disparo",
    pageTitle: "Disparo em Massa WhatsApp | Envio Automático Sem Ban — LeadsPro",
    pageDescription: "Envie mensagens em massa pelo WhatsApp com proteção anti-banimento inteligente.",
    videoUrl: "/videos/disparo-em-massa.mp4",
    videoTitle: "Como Fazer Disparo em Massa no WhatsApp com LeadsPro",
    videoDescription: "Tutorial completo de como criar campanhas de disparo em massa no WhatsApp com proteção anti-banimento usando o LeadsPro.",
    breadcrumbs: [
      { name: "Recursos", url: "/#features" },
      { name: "Disparo em Massa", url: "/recursos/disparo" },
    ],
    faqs,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 max-w-5xl mx-auto">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Disparo em Massa WhatsApp</span>
        </nav>

        <motion.div className="max-w-5xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <MessageCircle className="h-3.5 w-3.5 mr-2" /> Disparo em Massa
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Disparo em massa no <span className="gradient-text">WhatsApp</span> sem ser banido
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Crie campanhas segmentadas e envie mensagens personalizadas para centenas de leads simultaneamente. O LeadsPro é a ferramenta de disparo em massa mais segura do mercado, com proteção anti-banimento em 3 camadas. Todas as mensagens são enviadas do seu próprio número via WhatsApp.
          </motion.p>

          {/* Video */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📨 Como fazer disparo em massa no WhatsApp</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Clique em <strong>+ Nova Campanha</strong>, defina o nome, selecione os leads por categoria, escreva sua mensagem e opcionalmente anexe uma <strong>imagem</strong>. Use o botão <strong>Melhorar com IA</strong> para gerar mensagens profissionais e persuasivas. Quando estiver pronto, clique em <strong>Disparar</strong>, escolha o tamanho do lote e o sistema envia todas as mensagens com variação automática e intervalos randômicos.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl">
              <video className="w-full aspect-video block" controls preload="metadata" playsInline>
                <source src="/videos/disparo-em-massa.mp4" type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Users, title: "Segmentação por categoria", desc: "Selecione leads por categoria ou lista personalizada. Envie apenas para quem importa." },
              { icon: Sparkles, title: "IA para mensagens", desc: "Otimize suas mensagens com IA. Textos profissionais, persuasivos e únicos para cada lead." },
              { icon: Image, title: "Envio de imagens", desc: "Anexe imagens, catálogos e promoções para aumentar engajamento e taxa de resposta." },
              { icon: Send, title: "WhatsApp integrado", desc: "Mensagens enviadas do seu próprio número via QR Code. Autenticidade garantida." },
              { icon: Target, title: "Campanhas segmentadas", desc: "Filtros avançados para enviar a mensagem certa ao público certo no momento ideal." },
              { icon: FileText, title: "Rascunhos salvos", desc: "Crie campanhas e salve como rascunho. Dispare quando estiver pronto." },
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

          {/* Anti-ban Protection */}
          <motion.div variants={fadeUp} custom={4.5} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">🛡️ Proteção anti-banimento inteligente</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Sabemos que disparos em massa podem colocar seu número em risco. Por isso, o LeadsPro implementa <strong>múltiplas camadas de proteção</strong> para simular comportamento humano e manter seu WhatsApp seguro.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Shuffle, title: "Variação automática de mensagens", desc: "A IA reescreve automaticamente cada mensagem antes do envio, mantendo o contexto original mas alterando palavras e estrutura. Nenhuma mensagem é idêntica à anterior." },
                { icon: Clock, title: "Intervalos randômicos entre envios", desc: "Cada mensagem é enviada com um delay aleatório entre 30 e 300 segundos, simulando o ritmo natural de uma pessoa digitando e enviando manualmente." },
                { icon: Shield, title: "Recomendações de segurança", desc: "O sistema sugere lotes pequenos (20-50 leads) e horários ideais de envio. Painel de orientações visível antes de cada disparo para máxima proteção." },
              ].map((b) => (
                <div key={b.title} className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors">
                  <div className="rounded-xl p-2.5 w-fit mb-4 bg-primary/10">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold font-display text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div variants={fadeUp} custom={5} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">❓ Perguntas frequentes sobre disparo em massa</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-foreground pr-4">{faq.question}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Internal links */}
          <motion.div variants={fadeUp} custom={5.5} className="mb-16 p-6 rounded-2xl border border-border/60 bg-muted/30">
            <h3 className="font-bold font-display text-foreground mb-4">Recursos relacionados</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Busca de Leads", url: "/recursos/busca" },
                { label: "Follow-up Automático", url: "/recursos/followup" },
                { label: "Caixa de Entrada WhatsApp", url: "/recursos/caixa-de-entrada" },
                { label: "Chatbot IA 24/7", url: "/recursos/chatbot-ia" },
                { label: "Integração via QR Code", url: "/recursos/instancia" },
                { label: "Listas Personalizadas", url: "/recursos/listas" },
              ].map((link) => (
                <Link key={link.url} to={link.url} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ArrowRight className="h-3 w-3" /> {link.label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="text-center">
             <Button size="lg" onClick={() => navigate("/checkout")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
               Testar grátis — 2 horas <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureDisparo;
