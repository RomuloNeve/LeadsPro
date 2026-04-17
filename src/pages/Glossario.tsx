import { Link } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4 } }),
};

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  links: Array<{ label: string; url: string }>;
}

const TERMS: GlossaryTerm[] = [
  {
    id: "cnae",
    term: "CNAE",
    definition: "Classificação Nacional de Atividades Econômicas. Código que identifica a atividade principal de uma empresa no Brasil. No LeadsPro, você pode buscar leads filtrando por CNAE para encontrar empresas de segmentos específicos.",
    links: [
      { label: "Buscar leads por CNAE", url: "/recursos/busca" },
      { label: "Lista de empresas por CNAE", url: "/blog/lista-de-empresas-por-cnae" },
    ],
  },
  {
    id: "prospeccao-ativa",
    term: "Prospecção Ativa",
    definition: "Estratégia de vendas onde o vendedor busca ativamente potenciais clientes, em vez de esperar que eles cheguem. Inclui cold calling, cold email, mensagens no WhatsApp e busca em plataformas como Google Maps e LinkedIn.",
    links: [
      { label: "Como prospectar leads", url: "/recursos/busca" },
      { label: "Prospecção B2B", url: "/blog/prospeccao-b2b-linkedin-instagram" },
    ],
  },
  {
    id: "prospeccao-b2b",
    term: "Prospecção B2B",
    definition: "Prospecção Business-to-Business, focada em encontrar e abordar outras empresas como clientes. Envolve identificar decisores, mapear empresas por segmento e realizar contato personalizado.",
    links: [
      { label: "Ferramentas de prospecção B2B", url: "/recursos/busca" },
    ],
  },
  {
    id: "lead",
    term: "Lead",
    definition: "Pessoa ou empresa que demonstrou interesse ou tem potencial para se tornar cliente. No contexto de prospecção ativa, leads são contatos capturados de fontes como Google Maps, LinkedIn, Instagram e sites.",
    links: [
      { label: "Capturar leads", url: "/recursos/busca" },
      { label: "Gerenciar leads no CRM", url: "/recursos/crm" },
    ],
  },
  {
    id: "lead-qualificado",
    term: "Lead Qualificado",
    definition: "Lead que foi filtrado e validado como tendo real potencial de compra. A qualificação pode ser feita por critérios como cargo, tamanho da empresa, localização e comportamento de resposta.",
    links: [
      { label: "Pipeline de qualificação", url: "/recursos/pipeline" },
    ],
  },
  {
    id: "cold-outreach",
    term: "Cold Outreach",
    definition: "Abordagem inicial a um potencial cliente que não conhece sua empresa. Pode ser feita por WhatsApp, email ou telefone. A chave é personalização e timing.",
    links: [
      { label: "Disparo em massa", url: "/recursos/disparo" },
      { label: "Email marketing", url: "/recursos/email-marketing" },
    ],
  },
  {
    id: "disparo-em-massa",
    term: "Disparo em Massa",
    definition: "Envio de mensagens para múltiplos contatos simultaneamente. No WhatsApp, requer proteção anti-banimento com variação de texto, intervalos randômicos e lotes controlados.",
    links: [
      { label: "Campanhas de disparo", url: "/recursos/disparo" },
      { label: "Como não ser banido", url: "/blog/disparo-massa-whatsapp-sem-banimento" },
    ],
  },
  {
    id: "anti-ban",
    term: "Anti-Ban / Anti-Banimento",
    definition: "Conjunto de técnicas para evitar o bloqueio de número no WhatsApp durante envios em massa. Inclui variação automática de mensagens por IA, intervalos randômicos entre envios e controle de volume por lote.",
    links: [
      { label: "Proteção anti-ban do LeadsPro", url: "/recursos/disparo" },
    ],
  },
  {
    id: "follow-up",
    term: "Follow-up",
    definition: "Contato de acompanhamento feito após a primeira abordagem. Estatísticas mostram que 80% das vendas acontecem após o 3º contato. O follow-up automático envia mensagens nos dias 1, 3, 5 e 7.",
    links: [
      { label: "Follow-up automático", url: "/recursos/followup" },
      { label: "Como fazer follow-up", url: "/blog/followup-automatico-aumentar-vendas" },
    ],
  },
  {
    id: "crm",
    term: "CRM (Customer Relationship Management)",
    definition: "Sistema para gerenciar o relacionamento com clientes e leads. Centraliza informações de contato, histórico de interações, status de negociação e métricas de vendas em um único lugar.",
    links: [
      { label: "CRM do LeadsPro", url: "/recursos/crm" },
      { label: "CRM para pequenas empresas", url: "/blog/crm-para-pequenas-empresas" },
    ],
  },
  {
    id: "pipeline",
    term: "Pipeline de Vendas",
    definition: "Representação visual das etapas do processo de vendas. No modelo Kanban, os leads são organizados em colunas como Novo, Quente, Frio, Agendado, Fechado e Perdido.",
    links: [
      { label: "Pipeline Kanban", url: "/recursos/pipeline" },
      { label: "Como montar um funil", url: "/blog/funil-vendas-pipeline-kanban" },
    ],
  },
  {
    id: "funil-de-vendas",
    term: "Funil de Vendas",
    definition: "Modelo que representa a jornada do lead desde o primeiro contato até a conversão em cliente. As etapas típicas são: Prospecção → Qualificação → Proposta → Negociação → Fechamento.",
    links: [
      { label: "Visualizar funil", url: "/recursos/pipeline" },
    ],
  },
  {
    id: "chatbot",
    term: "Chatbot",
    definition: "Robô de conversação que responde mensagens automaticamente. Chatbots com IA podem entender contexto, qualificar leads, responder perguntas e agendar reuniões sem intervenção humana.",
    links: [
      { label: "Chatbot IA do LeadsPro", url: "/recursos/chatbot-ia" },
      { label: "Chatbot para WhatsApp", url: "/blog/chatbot-whatsapp-ia-atendimento" },
    ],
  },
  {
    id: "scraper",
    term: "Scraper / Web Scraping",
    definition: "Ferramenta que extrai dados automaticamente de páginas web. No contexto de prospecção, scrapers coletam informações como nome, telefone, email e endereço de empresas listadas em diretórios e plataformas.",
    links: [
      { label: "Scraper do Google Maps", url: "/recursos/busca" },
      { label: "Como extrair dados", url: "/blog/extrair-dados-google-maps-scraper" },
    ],
  },
  {
    id: "taxa-de-conversao",
    term: "Taxa de Conversão",
    definition: "Percentual de leads que se tornam clientes. Calculada dividindo o número de vendas pelo número de leads abordados. Uma boa taxa de conversão em prospecção ativa varia de 2% a 10%.",
    links: [
      { label: "Estatísticas de conversão", url: "/recursos/estatisticas" },
    ],
  },
  {
    id: "automacao-de-vendas",
    term: "Automação de Vendas",
    definition: "Uso de tecnologia para automatizar tarefas repetitivas do processo comercial: captura de leads, envio de mensagens, follow-ups, qualificação e relatórios. Libera tempo do vendedor para atividades estratégicas.",
    links: [
      { label: "Automação completa", url: "/" },
      { label: "Guia de automação", url: "/blog/automacao-comercial-pequenas-empresas" },
    ],
  },
  {
    id: "roi",
    term: "ROI (Retorno sobre Investimento)",
    definition: "Métrica que mede o retorno financeiro de um investimento. No contexto de ferramentas de vendas, compara o custo da ferramenta com a receita gerada pelos leads capturados e convertidos.",
    links: [
      { label: "Ver métricas de ROI", url: "/recursos/estatisticas" },
    ],
  },
  {
    id: "cold-email",
    term: "Cold Email",
    definition: "Email enviado para um potencial cliente que não solicitou contato. Diferente de spam, o cold email é personalizado, relevante e direcionado. Taxas de abertura médias variam de 15% a 25%.",
    links: [
      { label: "Email marketing em massa", url: "/recursos/email-marketing" },
      { label: "Guia de cold email", url: "/blog/email-marketing-leads-frios" },
    ],
  },
  {
    id: "whatsapp-business-api",
    term: "WhatsApp Business API",
    definition: "Interface oficial do WhatsApp para empresas que permite envio de mensagens automatizadas em escala. O LeadsPro usa uma abordagem alternativa via QR Code que não requer aprovação da API oficial.",
    links: [
      { label: "Conectar via QR Code", url: "/recursos/instancia" },
    ],
  },
  {
    id: "segmentacao",
    term: "Segmentação de Leads",
    definition: "Divisão dos leads em grupos com características semelhantes (localização, segmento, comportamento). Permite campanhas mais direcionadas e com maior taxa de conversão.",
    links: [
      { label: "Listas segmentadas", url: "/recursos/listas" },
    ],
  },
];

const Glossario = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useDocumentMeta({
    title: "Glossário de Vendas e Prospecção — LeadsPro",
    description: "Dicionário completo de termos de vendas, prospecção, CRM, automação e marketing digital. Aprenda o significado de CNAE, lead qualificado, pipeline, follow-up e muito mais.",
    canonicalUrl: "https://leadspro.app/glossario",
    ogType: "website",
    twitterCard: "summary_large_image",
  });

  // Inject JSON-LD
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      name: "Glossário de Vendas e Prospecção — LeadsPro",
      description: "Dicionário completo de termos de vendas, prospecção, CRM e automação comercial.",
      url: "https://leadspro.app/glossario",
      hasDefinedTerm: TERMS.map((t) => ({
        "@type": "DefinedTerm",
        name: t.term,
        description: t.definition,
        url: `https://leadspro.app/glossario#${t.id}`,
      })),
    };

    const scriptId = "glossary-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => { document.getElementById(scriptId)?.remove(); };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return TERMS;
    const q = search.toLowerCase();
    return TERMS.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [search]);

  const letters = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <motion.div initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-display">Glossário de Vendas</h1>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8 text-lg">
            Dicionário completo de termos usados em prospecção, CRM, automação e marketing digital.
          </motion.p>

          {/* Search */}
          <motion.div variants={fadeUp} custom={2} className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar termo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </motion.div>

          {/* Terms */}
          {letters.map(([letter, terms], li) => (
            <motion.div key={letter} variants={fadeUp} custom={3 + li * 0.5} className="mb-8">
              <h2 className="text-2xl font-bold font-display text-primary mb-4 border-b border-border/40 pb-2">{letter}</h2>
              <div className="space-y-6">
                {terms.map((t) => (
                  <div key={t.id} id={t.id} className="scroll-mt-24">
                    <h3 className="text-lg font-semibold font-display text-foreground mb-1">{t.term}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-2">{t.definition}</p>
                    {t.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {t.links.map((link) => (
                          <Link
                            key={link.url}
                            to={link.url}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            {link.label} <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Nenhum termo encontrado para "{search}".</p>
          )}

          {/* CTA */}
          <motion.div variants={fadeUp} custom={10} className="mt-16 p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center">
            <h3 className="text-2xl font-bold font-display mb-3">Aplique esses conceitos na prática</h3>
            <p className="text-muted-foreground mb-6">O LeadsPro reúne todas essas ferramentas em uma única plataforma. Teste grátis por 2 horas.</p>
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Glossario;
