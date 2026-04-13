import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Search, MapPin, Globe, Building, Phone, Instagram, FileDown, Database, ChevronRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useStructuredData } from "@/hooks/useStructuredData";
import featBusca from "@/assets/feat-busca.png";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const faqs = [
  { question: "Como funciona a busca de leads do LeadsPro?", answer: "Você seleciona a categoria (CNAE ou digitação livre) e a localização (estado, cidade ou país). O sistema busca automaticamente empresas e extrai nome, telefone, e-mail, Instagram, LinkedIn e site de cada resultado. Os dados são exibidos em uma tabela e podem ser salvos no CRM ou exportados para CSV." },
  { question: "Posso buscar leads em qualquer cidade do Brasil?", answer: "Sim. O LeadsPro cobre todos os 5.570 municípios brasileiros. Você pode buscar por estado inteiro, cidade específica ou todas as capitais de uma vez. Também funciona internacionalmente em mais de 190 países." },
  { question: "A busca de leads é gratuita?", answer: "O LeadsPro oferece um teste grátis de 2 horas com acesso completo a todas as funcionalidades, incluindo busca ilimitada de leads. Após o teste, os planos começam em R$97/mês (Starter) e o mais popular é o Pro por R$197/mês." },
  { question: "Quantos leads posso capturar por busca?", answer: "Cada busca retorna dezenas de leads qualificados com dados completos. Você pode fazer buscas ilimitadas durante sua licença ativa e capturar centenas de leads por dia." },
  { question: "Os leads vêm com telefone e WhatsApp?", answer: "Sim. O sistema extrai automaticamente o telefone de cada empresa. Como a maioria dos negócios brasileiros usa WhatsApp comercial, os números capturados geralmente são válidos para envio de mensagens." },
  { question: "Posso buscar leads por CNAE?", answer: "Sim. O sistema inclui a lista completa de CNAEs do Brasil. Você também pode alternar para digitação livre e buscar por qualquer nicho, como 'pizzaria', 'advogado trabalhista' ou 'clínica veterinária'." },
];

const FeatureBusca = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useDocumentMeta({
    title: "Busca de Leads Grátis | Ferramenta de Leads Qualificados — LeadsPro",
    description: "Ferramenta de busca de leads qualificados por categoria e localização. Capture telefone, e-mail, Instagram e LinkedIn automaticamente do Google Maps. Teste grátis 2 horas.",
    ogType: "website",
    twitterCard: "summary_large_image",
    canonicalUrl: "https://leadspro.app/recursos/busca",
  });

  useStructuredData({
    pageUrl: "/recursos/busca",
    pageTitle: "Busca de Leads Grátis | Ferramenta de Leads Qualificados — LeadsPro",
    pageDescription: "Ferramenta de busca de leads qualificados por categoria e localização. Capture telefone, e-mail, Instagram e LinkedIn automaticamente.",
    videoUrl: "/videos/busca-de-leads.mp4",
    videoTitle: "Como Buscar Leads Qualificados com o LeadsPro",
    videoDescription: "Tutorial mostrando como usar a ferramenta de busca de leads do LeadsPro para capturar dados de empresas por categoria e localização.",
    breadcrumbs: [
      { name: "Recursos", url: "/#features" },
      { name: "Busca de Leads", url: "/recursos/busca" },
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
          <span className="text-foreground">Busca de Leads</span>
        </nav>

        <motion.div className="max-w-5xl mx-auto" initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-1.5 text-xs tracking-wide">
              <Search className="h-3.5 w-3.5 mr-2" /> Busca de Leads
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Ferramenta de busca de <span className="gradient-text">leads qualificados</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Encontre leads qualificados em segundos. Pesquise por categoria (CNAE) e localização em todo o Brasil e no exterior. O sistema captura automaticamente nome, telefone, e-mail, Instagram, LinkedIn e site — tudo direto no seu CRM. A melhor ferramenta de busca de leads do mercado.
          </motion.p>

          {/* Video */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">🔍 Como funciona a busca de leads</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Comece selecionando a <strong>Categoria / Atividade (CNAE)</strong> — você pode buscar pelo código oficial ou <strong>digitar livremente</strong> qualquer nicho como "pizzaria", "clínica estética" ou "advocacia trabalhista". Em seguida, escolha a <strong>localização</strong>: Todo Brasil (capitais), Estado inteiro, Cidade específica ou até Outro País. Clique em <strong>Buscar Leads</strong> e os resultados aparecem instantaneamente com dados completos. Exporte para <strong>CSV</strong> ou salve no <strong>CRM</strong> com um clique.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl">
              <video className="w-full aspect-video block" controls preload="metadata" playsInline>
                <source src="/videos/busca-de-leads.mp4" type="video/mp4" />
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>
          </motion.div>

          {/* What you capture */}
          <motion.div variants={fadeUp} custom={3.5} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">📋 O que você captura de cada lead</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Building, label: "Nome da empresa", detail: "Razão social ou nome fantasia capturado automaticamente" },
                { icon: Phone, label: "Telefone / WhatsApp", detail: "Número principal da empresa — funciona para disparo em massa" },
                { icon: Database, label: "E-mail comercial", detail: "E-mail de contato para campanhas de email marketing" },
                { icon: Instagram, label: "Instagram", detail: "Perfil do Instagram extraído via busca secundária no Google" },
                { icon: Globe, label: "LinkedIn", detail: "Página da empresa no LinkedIn para prospecção B2B" },
                { icon: FileDown, label: "Website", detail: "Site oficial da empresa para análise e contato" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card">
                  <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: MapPin, title: "Busca por localização", desc: "Pesquise por estado, cidade ou município. Encontre leads em qualquer região do Brasil — todos os 5.570 municípios cobertos." },
              { icon: Globe, title: "Busca internacional", desc: "Expanda seus horizontes. Pesquise leads em mais de 190 países com nosso banco internacional." },
              { icon: Building, title: "Busca por CNAE ou nicho", desc: "Use a classificação oficial de atividades ou digite livremente o nicho que procura." },
              { icon: Phone, title: "Dados completos e verificados", desc: "Telefone, WhatsApp e e-mail capturados e validados automaticamente de cada resultado." },
              { icon: Instagram, title: "Redes sociais incluídas", desc: "Instagram, LinkedIn e site extraídos via busca secundária inteligente no Google." },
              { icon: FileDown, title: "Exportação e integração CRM", desc: "Exporte para CSV ou salve direto no CRM com um clique. Sem copiar e colar." },
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

          {/* FAQ Section */}
          <motion.div variants={fadeUp} custom={5} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">❓ Perguntas frequentes sobre busca de leads</h2>
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
                { label: "CRM de Vendas", url: "/recursos/crm" },
                { label: "Disparo em Massa WhatsApp", url: "/recursos/disparo" },
                { label: "Follow-up Automático", url: "/recursos/followup" },
                { label: "Pipeline de Vendas", url: "/recursos/pipeline" },
                { label: "Importação em Massa", url: "/recursos/importacao" },
                { label: "Email Marketing", url: "/recursos/email-marketing" },
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

export default FeatureBusca;
