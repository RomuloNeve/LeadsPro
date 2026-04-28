import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, useInView, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRef, useEffect, useState } from "react";
// Feature icons are rendered inline with Lucide icons + gradient backgrounds
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import headerBg from "@/assets/header-bg.png";
import headerBgMobile from "@/assets/header-bg-mobile.jpg";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarAmanda from "@/assets/avatar-amanda.jpg";
import avatarRicardo from "@/assets/avatar-ricardo.jpg";
import avatarJuliana from "@/assets/avatar-juliana.jpg";
import {
  Zap,
  Target,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  TrendingUp,
  Users,
  Clock,
  Crown,
  MousePointerClick,
  Database,
  BarChart3,
  Search,
  MessageCircle,
  Send,
  Repeat,
  AlertTriangle,
  Lock,
  Flame,
  Gift,
  PhoneCall,
  ChevronDown,
  Quote,
  FolderOpen,
  LayoutDashboard,
  Upload,
  Mail,
  Inbox,
  Smartphone,
  UsersRound,
  Menu,
  X,
  Bot,
  Kanban,
  Code,
  Eye,
  Headphones,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import FloatingCTA from "@/components/FloatingCTA";
import HeroProductMockup from "@/components/HeroProductMockup";
import RoiCalculator from "@/components/RoiCalculator";
import HowItWorks3Steps from "@/components/HowItWorks3Steps";
import Features3DStack from "@/components/Features3DStack";

/* ── Animations (lightweight for scroll perf) ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ── Counter ── */
function useCounter(end: number, duration = 2000, suffix = "") {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });

  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [inView, end, duration]);

  return { ref, display: `${count.toLocaleString("pt-BR")}${suffix}` };
}

/* ── Section wrapper for semantic HTML ── */
const Section = ({ id, className = "", children, ariaLabel }: {
  id?: string; className?: string; children: React.ReactNode; ariaLabel?: string;
}) => (
  <section id={id} className={`py-12 sm:py-16 md:py-24 lg:py-32 ${className} will-change-auto`} aria-label={ariaLabel}>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const SectionHeader = ({ badge, title, subtitle }: {
  badge?: string; title: React.ReactNode; subtitle?: string;
}) => (
  <motion.header
    className="text-center mb-10 md:mb-16 lg:mb-20 max-w-3xl mx-auto px-1"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5 }}
  >
    {badge && (
      <Badge variant="outline" className="mb-4 md:mb-5 border-primary/30 text-primary text-xs tracking-wide uppercase px-3 md:px-4 py-1.5">{badge}</Badge>
    )}
    <h2 className="text-[1.5rem] sm:text-3xl md:text-5xl lg:text-[3.25rem] font-bold font-display leading-[1.15] tracking-tight">{title}</h2>
    {subtitle && <p className="text-muted-foreground mt-3 md:mt-5 text-sm md:text-base lg:text-lg leading-relaxed max-w-xl mx-auto">{subtitle}</p>}
  </motion.header>
);

/* ══════════════════════════════════════════════ */
/*                  COMPONENT                    */
/* ══════════════════════════════════════════════ */

const DEFAULT_CHECKOUT_LINKS = {
  starter: "https://pay.cakto.com.br/p69cmy8_848513",
  profissional: "https://pay.cakto.com.br/mrhbivc_848520",
  enterprise: "https://pay.cakto.com.br/32icmcq_848524",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [recursosOpen, setRecursosOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileRecursosOpen, setMobileRecursosOpen] = useState(false);
  
  const [checkoutLinks, setCheckoutLinks] = useState(DEFAULT_CHECKOUT_LINKS);
  const [isAffiliateRef, setIsAffiliateRef] = useState(false);

  // Load affiliate links if ?ref= is present
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    const loadAffiliate = async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("starter_link, profissional_link, enterprise_link")
        .eq("slug", ref)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setIsAffiliateRef(true);
        setCheckoutLinks({
          starter: data.starter_link || DEFAULT_CHECKOUT_LINKS.starter,
          profissional: data.profissional_link || DEFAULT_CHECKOUT_LINKS.profissional,
          enterprise: data.enterprise_link || DEFAULT_CHECKOUT_LINKS.enterprise,
        });
      }
    };
    loadAffiliate();
  }, [searchParams]);

  const scrollTo = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    const navOffset = window.innerWidth < 768 ? 86 : 96;
    const y = section.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  const handleMobileMenuSelect = (id: string) => {
    setMobileMenuOpen(false);
    setMobileRecursosOpen(false);
    window.setTimeout(() => scrollTo(id), 180);
  };

  const handleMobileResourceSelect = (route: string) => {
    setMobileMenuOpen(false);
    setMobileRecursosOpen(false);
    navigate(route);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Data ── */
  const recursosMenuItems = [
    { icon: Search, title: "Busca Inteligente", route: "/recursos/busca" },
    { icon: Database, title: "CRM Completo", route: "/recursos/crm" },
    { icon: Upload, title: "Importação em Massa", route: "/recursos/importacao" },
    { icon: MessageCircle, title: "Campanhas com disparo em massa no WhatsApp", route: "/recursos/disparo" },
    { icon: Mail, title: "Email Marketing", route: "/recursos/email-marketing" },
    { icon: Repeat, title: "Follow-up Automático", route: "/recursos/followup" },
    { icon: BarChart3, title: "Estatísticas", route: "/recursos/estatisticas" },
    { icon: FolderOpen, title: "Listas", route: "/recursos/listas" },
    { icon: LayoutDashboard, title: "Painel de Controle", route: "/recursos/painel" },
    { icon: WhatsAppIcon, title: "Caixa de Entrada", route: "/recursos/caixa-de-entrada" },
    { icon: Smartphone, title: "Integração via QR Code", route: "/recursos/instancia" },
    { icon: UsersRound, title: "Criar Grupos", route: "/recursos/criar-grupos" },
    { icon: Bot, title: "Chatbot IA 24/7", route: "/recursos/chatbot-ia" },
    { icon: Kanban, title: "Pipeline de Vendas", route: "/recursos/pipeline" },
    { icon: Code, title: "Widget de Captura", route: "/recursos/widget" },
  ];

  const features = [
    { icon: Search, title: "Busca Inteligente", desc: "Pesquise por categoria e localização. Extraia nome, telefone, WhatsApp, Instagram, LinkedIn e site automaticamente.", highlight: false, route: "/recursos/busca" },
    { icon: Database, title: "CRM Completo", desc: "Visualize, filtre, edite e organize todos os seus leads por categoria com atualização em tempo real.", highlight: false, route: "/recursos/crm" },
    { icon: Upload, title: "Importação em Massa", desc: "Importe milhares de leads de uma vez via Excel ou CSV. Mapeamento automático de colunas e upload em lotes.", highlight: false, route: "/recursos/importacao" },
    { icon: MessageCircle, title: "Campanhas com disparo em massa no WhatsApp", desc: "Campanhas segmentadas com envio em massa via WhatsApp. Proteção anti-banimento com variação automática de mensagens por IA e intervalos randômicos entre envios.", highlight: true, route: "/recursos/disparo" },
    { icon: Mail, title: "Email Marketing", desc: "Campanhas de email em massa com templates personalizados, segmentação por categoria e métricas de entrega.", highlight: true, route: "/recursos/email-marketing" },
    { icon: Repeat, title: "Follow-up Automático", desc: "Sequências automáticas nos dias 1, 3, 5 e 7 após a captura. Configure uma vez e esqueça.", highlight: true, route: "/recursos/followup" },
    { icon: BarChart3, title: "Estatísticas & Relatórios", desc: "Acompanhe sua evolução diária, volume por categoria e taxa de conversão com gráficos intuitivos.", highlight: false, route: "/recursos/estatisticas" },
    { icon: MousePointerClick, title: "Listas Personalizadas", desc: "Organize seus leads em listas customizadas por cor e nome. Use como filtro para campanhas.", highlight: false, route: "/recursos/listas" },
    { icon: Target, title: "Painel de Controle", desc: "Métricas de funil, economia gerada e evolução diária — tudo num único painel inteligente.", highlight: false, route: "/recursos/painel" },
    { icon: WhatsAppIcon, title: "Caixa de Entrada WhatsApp", desc: "Converse com seus leads direto pelo WhatsApp sem sair da ferramenta. Histórico completo de mensagens em tempo real.", highlight: true, route: "/recursos/caixa-de-entrada" },
    { icon: Smartphone, title: "Integração via QR Code", desc: "Conecte seu próprio número de WhatsApp via QR Code. Sua instância pessoal para automações e disparos.", highlight: true, route: "/recursos/instancia" },
    { icon: UsersRound, title: "Criação de Grupos", desc: "Crie grupos no WhatsApp direto pela plataforma. Selecione contatos, defina nome e descrição em segundos.", highlight: true, route: "/recursos/criar-grupos" },
    { icon: Bot, title: "Chatbot IA 24/7", desc: "Assistente de IA que trabalha 24h por dia respondendo leads, enviando propostas, agendando reuniões e conduzindo vendas pelo WhatsApp. Inclui transferência automática para atendimento humano quando o lead solicitar.", highlight: true, route: "/recursos/chatbot-ia" },
    { icon: Kanban, title: "Pipeline de Vendas", desc: "Visualize seu funil em um Kanban drag-and-drop. Arraste leads entre Novo, Quente, Frio, Agendado, Fechado e Perdido com atualização em tempo real.", highlight: true, route: "/recursos/pipeline" },
    { icon: Code, title: "Widget de Captura", desc: "Formulário flutuante para seu site. Lead cai no CRM e nosso agente de IA envia a primeira mensagem no WhatsApp do lead usando seu número — tudo automático.", highlight: true, route: "/recursos/widget" },
    { icon: Headphones, title: "Atendimento Humano", desc: "Quando o lead pedir para falar com uma pessoa, o chatbot transfere automaticamente. Você recebe notificação por e-mail, WhatsApp e som, e atende direto pela Caixa de Entrada com um clique.", highlight: true, route: "/recursos/chatbot-ia" },
  ];

  const testimonials = [
    { name: "Carlos M.", role: "Corretor de Imóveis", text: "Antes eu perdia 2 horas por dia copiando dados. Com o LeadsPro, capturo mais de 50 leads por dia em minutos. Meu faturamento triplicou em 60 dias.", metric: "+300%", metricLabel: "faturamento", stars: 5, avatar: avatarCarlos },
    { name: "Amanda S.", role: "Consultora de Marketing", text: "O disparo em massa pelo WhatsApp transformou minha operação. Meus clientes não acreditam na velocidade que entrego resultados.", metric: "200+", metricLabel: "clientes atendidos", stars: 5, avatar: avatarAmanda },
    { name: "Ricardo O.", role: "Dono de Agência Digital", text: "Cancelei 3 ferramentas no primeiro mês. Os follow-ups automáticos sozinhos me trouxeram 40 novos clientes. ROI absurdo.", metric: "40", metricLabel: "clientes em 30 dias", stars: 5, avatar: avatarRicardo },
    { name: "Juliana C.", role: "Vendedora Digital", text: "De 10 leads por dia para mais de 80. O investimento se pagou na primeira semana. Ferramenta indispensável para quem vende.", metric: "8x", metricLabel: "mais leads", stars: 5, avatar: avatarJuliana },
  ];

  const faqs = [
    { q: "Como capturar leads do Google Maps?", a: "Com o LeadsPro você pesquisa por categoria (CNAE) e localização. O sistema extrai automaticamente nome, telefone, e-mail, Instagram, LinkedIn e site de cada empresa. Funciona em todo o Brasil e internacionalmente." },
    { q: "Como enviar mensagem em massa no WhatsApp sem ser banido?", a: "O LeadsPro usa 3 camadas de proteção: variação automática de texto por IA (nenhuma mensagem idêntica), intervalos randômicos de 30 a 300 segundos entre envios, e recomendações de lotes pequenos. Seu número fica 100% protegido." },
    { q: "O follow-up automático realmente funciona sozinho?", a: "Sim. Configure seus serviços uma única vez. As mensagens dos dias 1, 3, 5 e 7 são geradas com IA e enviadas automaticamente pelo WhatsApp. 80% das vendas acontecem após o 3º contato." },
    { q: "Preciso de conhecimento técnico?", a: "Nenhum. Se você sabe navegar na internet, já sabe usar o LeadsPro. Interface intuitiva, sem configurações complexas. Crie sua conta e comece a capturar leads em minutos." },
    { q: "O que é o chatbot IA do LeadsPro?", a: "É um assistente inteligente que responde mensagens do WhatsApp 24h por dia. Qualifica leads, responde perguntas frequentes, envia propostas e agenda reuniões — tudo automaticamente. Quando o lead pedir um atendente humano, o bot transfere automaticamente e você recebe notificação por email e WhatsApp." },
    { q: "Meus dados estão seguros?", a: "Totalmente. Utilizamos criptografia de nível bancário. Nenhum terceiro tem acesso aos seus leads. Seus dados ficam protegidos na nuvem com backup automático." },
    { q: "Posso importar leads de uma planilha?", a: "Sim. Importe milhares de leads via Excel (.xlsx) ou CSV. O sistema detecta duplicados, filtra dados inválidos e organiza tudo no CRM com categorias e tags automaticamente." },
    { q: "Quanto custa o LeadsPro?", a: "Teste grátis por 7 dias com todas as funcionalidades (60 créditos por dia · 420 no total). Depois: Plano Mensal R$197/mês ou Plano Anual R$1.200/ano (até 12x de R$139,50). Todos os planos incluem todas as funcionalidades." },
    { q: "Posso cancelar a qualquer momento?", a: "Claro. Sem multa, sem fidelidade. Mas dificilmente você vai querer cancelar depois de ver os resultados." },
    { q: "O LeadsPro substitui outras ferramentas?", a: "Sim. Ele substitui CRM, ferramenta de e-mail marketing, automação WhatsApp, scraper de dados e chatbot — tudo em uma única plataforma por uma fração do preço." },
    { q: "Como funciona o CRM do LeadsPro?", a: "Todos os leads capturados vão automaticamente para o CRM. Lá você filtra por categoria, status, data, lista personalizada e muito mais. Também conta com pipeline Kanban visual para acompanhar cada etapa da negociação." },
    { q: "Como funciona o widget de captura para sites?", a: "Você instala um formulário flutuante no seu site com apenas uma linha de código. Quando o visitante preenche, o lead cai direto no CRM e nosso agente de IA envia a primeira mensagem no WhatsApp dele usando o seu número — tudo automático." },
    { q: "O que é a caixa de entrada do WhatsApp?", a: "É um painel dentro do LeadsPro onde você vê e responde todas as conversas do WhatsApp em tempo real, sem precisar abrir o celular. Funciona como um help desk integrado ao CRM." },
    { q: "Posso criar listas personalizadas de leads?", a: "Sim. Crie quantas listas quiser: por nicho, região, status de negociação, campanha — e organize seus leads do jeito que fizer mais sentido pro seu fluxo de vendas." },
    { q: "Como funciona o e-mail marketing?", a: "Monte campanhas de e-mail diretamente pelo LeadsPro. Escolha seus leads por filtros, personalize o assunto e corpo do e-mail, e dispare em massa. Ideal para complementar a prospecção via WhatsApp." },
    { q: "O LeadsPro funciona com meu próprio número de WhatsApp?", a: "Sim! Você conecta seu número via QR Code — exatamente como no WhatsApp Web. Não precisa de chip extra, API paga ou número virtual. Suas mensagens saem do seu número real." },
    { q: "Posso criar grupos no WhatsApp pelo LeadsPro?", a: "Sim. Selecione leads do CRM e crie grupos automaticamente pelo painel. Ótimo para comunidades, turmas, eventos ou grupos de vendas segmentados." },
    { q: "Consigo ver estatísticas das minhas campanhas?", a: "Sim. O painel de estatísticas mostra leads capturados por período, campanhas enviadas, taxa de duplicados, leads por categoria e muito mais — tudo com gráficos visuais e exportação." },
    { q: "O sistema funciona no celular?", a: "Sim. O LeadsPro é 100% responsivo e funciona como um app no navegador do celular. Você também pode instalar como PWA na tela inicial do seu smartphone." },
    { q: "Como a IA melhora minhas mensagens?", a: "A IA do LeadsPro reescreve suas mensagens de campanha e follow-up com variações naturais, evitando bloqueios do WhatsApp. Também gera a primeira mensagem automática para leads do widget e respostas inteligentes pelo chatbot." },
  ];

  const stat1 = useCounter(50000, 2500, "+");
  const stat2 = useCounter(2000, 2000, "+");
  const stat3 = useCounter(3, 800);
  const stat4 = useCounter(98, 2000, "%");

  const planFeatures = [
    "Busca ilimitada de leads por categoria e localização",
    "Captura telefone, WhatsApp, Instagram, LinkedIn e site",
    "CRM completo com filtros e organização",
    "Disparo em massa via WhatsApp",
    "Follow-ups automáticos (dias 1, 3, 5, 7)",
    "Caixa de entrada WhatsApp integrada",
    "Chatbot IA 24/7 com atendimento humano",
    "Integração via QR Code com seu próprio número",
    "Criação de grupos no WhatsApp",
    "Widget de captura para sites",
    "Suporte com chat IA + ticket nível 2",
    "Leads em tempo real",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ NAV ═══ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border/40" : "bg-transparent"}`} role="navigation" aria-label="Navegação principal">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 sm:gap-3 group" aria-label="LeadsPro - Página inicial">
            <img src={logoIcon} alt="LeadsPro" className="h-16 sm:h-20 lg:h-24 transition-all duration-300" />
            <span className="text-lg sm:text-xl font-bold font-display text-foreground">
              Leads<span className="gradient-text">Pro</span>
            </span>
          </a>
          <div className="hidden lg:flex items-center gap-8">
            {/* Recursos dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRecursosOpen(true)}
              onMouseLeave={() => setRecursosOpen(false)}
            >
              <button
                className={`text-sm transition-colors flex items-center gap-1 ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
              >
                Recursos <ChevronDown className={`h-3.5 w-3.5 transition-transform ${recursosOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {recursosOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[540px] p-4 rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl grid grid-cols-2 gap-1 max-h-[70vh] overflow-y-auto no-scrollbar"
                  >
                    {recursosMenuItems.map((r) => (
                      <button
                        key={r.title}
                        onClick={() => { setRecursosOpen(false); navigate(r.route); }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/10 transition-colors text-left group"
                      >
                        <div className="rounded-lg p-2 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <r.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-popover-foreground">{r.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {["Como funciona", "Preços", "Afiliados", "Blog"].map((item) => (
              <button
                key={item}
                onClick={() => item === "Blog" ? navigate("/blog") : scrollTo(item === "Como funciona" ? "how" : item === "Preços" ? "pricing" : "afiliados")}
                className={`text-sm transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle className={scrolled ? "" : "text-white/70 hover:text-white hover:bg-white/10"} />
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className={`text-xs sm:text-sm px-2 sm:px-3 ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
              Entrar
            </Button>
            {!isAffiliateRef && (
              <Button size="sm" onClick={() => navigate("/auth?plan=free")} className="hidden lg:inline-flex border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs sm:text-sm px-3 sm:px-4" variant="outline">
                <Gift className="h-3.5 w-3.5 mr-1.5" /> Testar Grátis
              </Button>
            )}
            <Button size="sm" onClick={() => scrollTo("pricing")} className="hidden lg:inline-flex gradient-bg text-primary-foreground hover:opacity-90 glow-shadow text-xs sm:text-sm px-3 sm:px-4">
              Começar
            </Button>
            {/* Mobile sticky CTA — appears once scrolled past hero */}
            {!isAffiliateRef && scrolled && (
              <Button
                size="sm"
                onClick={() => navigate("/auth?plan=free")}
                className="lg:hidden gradient-bg text-primary-foreground hover:opacity-90 text-[11px] px-2.5 h-8 shrink-0"
              >
                <Gift className="h-3 w-3 mr-1" /> Grátis
              </Button>
            )}
            {/* Mobile hamburger */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
              onClick={() => {
                setMobileMenuOpen((prev) => {
                  const next = !prev;
                  if (!next) setMobileRecursosOpen(false);
                  return next;
                });
              }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto no-scrollbar">
                <button
                  onClick={() => setMobileRecursosOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span>Recursos</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileRecursosOpen ? "rotate-180" : ""}`} />
                </button>

                {mobileRecursosOpen && (
                  <div className="pl-1 space-y-1">
                    {recursosMenuItems.map((r) => (
                      <button
                        key={r.title}
                        onClick={() => handleMobileResourceSelect(r.route)}
                        className="flex w-full items-start gap-2.5 text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <r.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span className="leading-snug">{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {[
                  { label: "Preços", id: "pricing" },
                  { label: "Afiliados", id: "afiliados" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleMobileMenuSelect(item.id)}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => { navigate("/blog"); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Blog
                </button>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="flex-1">
                      Entrar
                    </Button>
                    <Button size="sm" onClick={() => handleMobileMenuSelect("pricing")} className="flex-1 gradient-bg text-primary-foreground">
                      Começar
                    </Button>
                  </div>
                  {!isAffiliateRef && (
                    <Button size="sm" variant="outline" onClick={() => { navigate("/auth?plan=free"); setMobileMenuOpen(false); }} className="w-full border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20">
                      <Gift className="h-3.5 w-3.5 mr-1.5" /> Testar Grátis — 7 dias
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="relative min-h-[100dvh] flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <img src={headerBg} alt="" className="absolute inset-0 w-full h-full object-cover object-top hidden lg:block opacity-30" fetchPriority="high" decoding="async" loading="eager" />
          <img src={headerBgMobile} alt="" className="absolute inset-0 w-full h-full object-cover object-center lg:hidden" fetchPriority="high" decoding="async" loading="eager" />
          <div className="absolute inset-0 bg-black/75 lg:bg-black/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
          {/* Teal radial glow (desktop only) — anchored top-right behind the mockup */}
          <div
            className="absolute top-0 right-0 w-[55%] h-[70%] pointer-events-none hidden lg:block"
            style={{
              background:
                "radial-gradient(60% 60% at 70% 30%, rgba(29,158,117,0.18), transparent 70%)",
            }}
          />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 pt-28 sm:pt-36 lg:pt-32 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-10 xl:gap-14 items-center">
          <motion.div className="max-w-xl" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex flex-wrap items-center gap-2 mb-5 sm:mb-8">
              <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs tracking-wide">
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                +50.000 leads capturados na plataforma
              </Badge>
              <Badge className="bg-red-600 text-white border-red-500 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Flame className="h-3 w-3 mr-1" />
                7 dias grátis
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-[1.85rem] leading-[1.12] sm:text-4xl sm:leading-[1.08] md:text-5xl lg:text-[2.75rem] lg:leading-[1.06] xl:text-[3.25rem] 2xl:text-6xl font-bold font-display tracking-tight mb-4 sm:mb-6 text-white"
            >
              Encontre clientes.{" "}
              <span className="inline sm:hidden">Dispare em massa.</span>
              <span className="hidden sm:inline">Dispare em massa.<br /></span>
              <span className="gradient-text">Feche vendas no automático.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-sm sm:text-base lg:text-base xl:text-lg text-white/75 max-w-xl mb-3 sm:mb-4 leading-relaxed"
            >
              Capture leads do Google Maps em 3 segundos. Dispare mensagens no WhatsApp sem ser banido. Automatize follow-ups. CRM, chatbot IA e pipeline de vendas — tudo numa única plataforma.
            </motion.p>

            <motion.div variants={fadeUp} custom={2.5} className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 mb-6 sm:mb-8">
              {[
                "✅ Sem cartão de crédito",
                "✅ Acesso imediato",
                "✅ Cancele quando quiser",
              ].map((t) => (
                <span key={t} className="text-[11px] sm:text-sm text-white/60">{t}</span>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => scrollTo("pricing")}
                className="gradient-bg text-primary-foreground hover:opacity-90 text-sm sm:text-base px-5 sm:px-7 h-11 sm:h-12 glow-shadow group"
              >
                Quero dominar meu mercado
                <ArrowRight className="ml-2 h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Button>
              {!isAffiliateRef && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/auth?plan=free")}
                  className="border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm sm:text-base px-5 sm:px-7 h-11 sm:h-12"
                >
                  <Gift className="h-4 w-4 mr-2 shrink-0" /> Testar Grátis — 7d
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Product mockup — same component on every breakpoint, lets its
              internal flex layout scale to whatever width is available. */}
          <div className="flex items-center justify-center lg:justify-end mt-6 sm:mt-8 lg:mt-0">
            <HeroProductMockup />
          </div>
          </div>
        </div>
      </header>

      {/* ═══ STATS ═══ */}
      <section className="py-12 md:py-20 border-t border-border/40" aria-label="Números">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 max-w-4xl mx-auto"
          >
            {[
              { ref: stat1.ref, display: stat1.display, label: "Leads capturados", icon: Target, delay: 0 },
              { ref: stat2.ref, display: stat2.display, label: "Usuários ativos", icon: Users, delay: 1 },
              { ref: stat3.ref, display: `${stat3.display}s`, label: "Tempo por lead", icon: Clock, delay: 2 },
              { ref: stat4.ref, display: stat4.display, label: "Satisfação", icon: TrendingUp, delay: 3 },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} custom={s.delay} className="text-center p-4 sm:p-6 rounded-2xl border border-border/60 bg-card card-shadow">
                <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-2 sm:mb-3" />
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground">
                  <span ref={s.ref}>{s.display}</span>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 visual steps ═══ */}
      <Section id="how" className="border-t border-border/40" ariaLabel="Como funciona em 3 passos">
        <SectionHeader
          badge="Como funciona"
          title={<>Em 3 passos você sai do <span className="gradient-text">manual</span> para o automático</>}
          subtitle="Clique em cada passo para ver a tela real do sistema."
        />
        <HowItWorks3Steps />
      </Section>

      {/* ═══ PROBLEM / PAIN ═══ */}
      <Section className="border-t border-border/40 relative" ariaLabel="Problemas que resolvemos">
        <div className="absolute inset-0 bg-destructive/[0.015] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto">
          <SectionHeader
            badge="A verdade que ninguém te conta"
            title={<>Você está <span className="text-destructive">perdendo dinheiro</span> agora mesmo</>}
            subtitle="Clique em cada item e descubra o que está sabotando seus resultados."
          />

          <motion.div
            className="space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                trigger: "💸 Tráfego pago está te sangrando",
                content: [
                  "Você já queimou R$ 500, R$ 1.000, R$ 3.000 em Meta Ads e Google Ads este mês?",
                  "Precisa pagar agência + gestor de tráfego + designer + copywriter só pra TENTAR vender.",
                  "O algoritmo muda toda semana. O que funcionava ontem, hoje não entrega mais.",
                  "E o pior: os leads que chegam são frios, desqualificados e nem atendem o telefone.",
                ],
                cta: "Com o LeadsPro você prospecta direto na fonte. Zero custo por clique. Zero dependência de algoritmo.",
              },
              {
                trigger: "🐌 Prospecção manual está te matando",
                content: [
                  "Você abre o Google Maps, copia o telefone, cola no WhatsApp, manda mensagem... UM POR UM.",
                  "Perde 3 a 4 horas por dia fazendo trabalho repetitivo que uma máquina faz em segundos.",
                  "Enquanto você copia e cola, seu concorrente já disparou pra 500 leads e fechou 10 vendas.",
                  "Cada minuto que você gasta no manual é dinheiro que você DEIXA DE GANHAR.",
                ],
                cta: "O LeadsPro captura nome, telefone, WhatsApp, Instagram, LinkedIn e email em 3 segundos. Automático.",
              },
              {
                trigger: "🧊 Seus leads estão esfriando (e você nem percebe)",
                content: [
                  "Você captura o lead hoje e só manda mensagem na semana que vem? Ele já esqueceu de você.",
                  "Sem follow-up automático, 80% dos seus leads morrem em 48 horas.",
                  "Seu concorrente que tem automação responde em minutos. Você demora dias.",
                  "Lead quente vira lead frio vira lead perdido. Todo dia. Sem parar.",
                ],
                cta: "O LeadsPro envia follow-ups nos dias 1, 3, 5 e 7 automaticamente. Nenhum lead esfria.",
              },
              {
                trigger: "🔥 Você paga por 5 ferramentas que o LeadsPro substitui",
                content: [
                  "CRM: R$ 97/mês. Ferramenta de email: R$ 79/mês. Automação WhatsApp: R$ 149/mês. Planilhas: grátis mas inúteis.",
                  "São R$ 300+ por mês em ferramentas que não conversam entre si.",
                  "Você exporta CSV de um, importa no outro, perde dados no caminho. Um caos.",
                  "E ainda precisa aprender 5 dashboards diferentes. Tempo é dinheiro — e você está desperdiçando os dois.",
                ],
                cta: "O LeadsPro faz TUDO isso numa única plataforma. Por uma fração do preço.",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={itemFade}>
                <details className="group rounded-2xl border border-destructive/15 bg-card overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-destructive/[0.03] transition-colors list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-base font-bold font-display text-foreground">{item.trigger}</span>
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-3" />
                  </summary>
                  <div className="px-5 pb-5 space-y-3">
                    {item.content.map((line, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/[0.04] border border-destructive/10">
                        <span className="text-destructive font-bold text-sm mt-0.5 shrink-0">✗</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{line}</p>
                      </div>
                    ))}
                    <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/[0.04]">
                      <p className="text-sm font-semibold text-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {item.cta}
                      </p>
                    </div>
                  </div>
                </details>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              onClick={() => scrollTo("pricing")}
              className="gradient-bg text-primary-foreground hover:opacity-90 text-sm sm:text-base px-5 sm:px-10 h-12 sm:h-14 glow-shadow group w-full sm:w-auto"
            >
              Chega de perder dinheiro — comece agora
              <ArrowRight className="ml-2.5 h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ═══ ROI CALCULATOR ═══ */}
      <Section id="calculadora-roi" className="border-t border-border/40" ariaLabel="Calculadora de prejuízo">
        <RoiCalculator onCta={() => scrollTo("pricing")} />
      </Section>

      {/* ═══ FEATURES 3D STACK ═══ */}
      <Section className="border-t border-border/40 relative overflow-hidden" ariaLabel="Recursos da plataforma">
        <SectionHeader
          badge="Tudo num só lugar"
          title={<>Os recursos que <span className="gradient-text">tiram o manual</span> do seu dia</>}
          subtitle="Mexa o mouse pra explorar — tudo aqui está disponível em qualquer plano."
        />
        <Features3DStack />
      </Section>

      {/* ═══ TESTIMONIALS ═══ */}
      <Section id="testimonials" className="border-t border-border/40" ariaLabel="Depoimentos de clientes">
        <SectionHeader
          badge="Resultados reais"
          title={<>Profissionais que <span className="gradient-text">já transformaram</span> seus resultados</>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.article
              key={t.name}
              className="p-4 sm:p-6 rounded-2xl border border-border/60 bg-card card-shadow flex flex-col"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <Quote className="h-5 w-5 text-primary/20 mb-2" aria-hidden="true" />
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t.text}</p>
              <div className="border-t border-border/50 pt-4 mt-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold font-display gradient-text">{t.metric}</span>
                  <span className="text-xs text-muted-foreground">{t.metricLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <Section className="border-t border-border/40" ariaLabel="Comparação antes e depois">
        <SectionHeader
          title={<>O que muda <span className="gradient-text">quando você começa</span></>}
        />

        <div className="max-w-4xl mx-auto space-y-0">
          {[
            { sem: "10–15 leads por dia, copiando manualmente", com: "80+ leads por dia com busca inteligente" },
            { sem: "Mensagens enviadas uma por uma no WhatsApp", com: "Disparo em massa para centenas de leads" },
            { sem: "Leads esfriam sem nenhum follow-up", com: "Follow-ups automáticos nos dias 1, 3, 5, 7" },
            { sem: "3+ ferramentas diferentes (custo alto)", com: "Uma única plataforma integrada" },
            { sem: "Planilhas desorganizadas e confusas", com: "Dashboard organizado e inteligente" },
            { sem: "Horas perdidas em trabalho operacional", com: "Mais tempo vendendo, menos operando" },
          ].map((row, i) => (
            <motion.div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {/* Lado negativo */}
              <div className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/30 bg-destructive/[0.03] ${i === 0 ? 'md:rounded-tl-xl' : ''} ${i === 5 ? 'md:rounded-bl-xl' : ''}`}>
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="text-destructive text-xs font-bold">✗</span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground line-through decoration-destructive/30">{row.sem}</span>
              </div>
              {/* Lado positivo */}
              <div className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-primary/10 bg-primary/[0.03] ${i === 0 ? 'md:rounded-tr-xl' : ''} ${i === 5 ? 'md:rounded-br-xl' : ''}`}>
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm text-foreground font-medium">{row.com}</span>
              </div>
            </motion.div>
          ))}

          {/* Headers fixos no topo */}
          <div className="grid grid-cols-1 md:grid-cols-2 -order-1">
            <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-destructive">Sem LeadsPro</span>
            </div>
            <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary">Com LeadsPro</span>
            </div>
          </div>
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a href="#pricing">
            <Button size="lg" className="gradient-bg text-primary-foreground font-bold px-10 text-base rounded-full shadow-lg">
              Quero esses resultados <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </a>
        </motion.div>
      </Section>

      {/* ═══ PROGRAMA DE AFILIADOS ═══ */}
      <Section id="afiliados" className="border-t border-border/40 relative overflow-hidden" ariaLabel="Programa de Afiliados">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 opacity-[0.04] pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="currentColor" className="text-primary w-full h-full">
            <circle cx="100" cy="100" r="80" />
            <path d="M100 40 L130 100 L100 160 L70 100 Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-5 border-primary/30 text-primary text-xs tracking-wide uppercase px-4 py-1.5">
              <Gift className="h-3.5 w-3.5 mr-2" /> Programa de Afiliados
            </Badge>
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold font-display leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Ganhe <span className="gradient-text">30% de comissões recorrentes</span> para cada pagamento feito pelos clientes indicados!
          </motion.h2>

          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Indique o LeadsPro e receba <strong className="text-foreground">30% de comissão recorrente</strong> em cada pagamento — nos planos Starter, Pro ou Enterprise — enquanto o cliente indicado permanecer ativo. Sem limite de indicações.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="gradient-bg text-primary-foreground h-14 px-12 text-lg gap-3 rounded-xl hover:opacity-90 transition-opacity"
              onClick={() => navigate("/afiliados/cadastro")}
            >
              <Gift className="h-5 w-5" />
              Quero ser afiliado
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ═══ PRICING — glass morphism ═══ */}
      <Section
        id="pricing"
        className="border-t border-border/40 relative overflow-hidden"
        ariaLabel="Planos e preços"
      >
        {/* Section-level cursor tracker — shifts blobs subtly toward the
            cursor for ambient response. Listens at the section root. */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          onMouseMove={(e) => {
            const root = e.currentTarget.parentElement as HTMLElement | null;
            if (!root) return;
            const rect = root.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            root.style.setProperty("--sx", String(x));
            root.style.setProperty("--sy", String(y));
          }}
          style={{ pointerEvents: "auto" }}
        >
          <div
            className="blob top-1/4 left-1/4 w-[28rem] h-[28rem] bg-primary/30"
            style={{
              animationDelay: "0s",
              transform: "translate(calc(var(--sx, 0) * 40px), calc(var(--sy, 0) * 30px))",
              transition: "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          />
          <div
            className="blob bottom-1/4 right-1/4 w-[24rem] h-[24rem] bg-emerald-500/20"
            style={{
              animationDelay: "4s",
              transform: "translate(calc(var(--sx, 0) * -30px), calc(var(--sy, 0) * -25px))",
              transition: "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          />
          <div
            className="blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-primary/15"
            style={{
              animationDelay: "8s",
              transform: "translate(calc(-50% + var(--sx, 0) * 20px), calc(-50% + var(--sy, 0) * 20px))",
              transition: "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          />
        </div>

        <div className="relative">
          <SectionHeader
            badge="Investimento"
            title={<>Quanto custa <span className="gradient-text">dominar seu mercado</span>?</>}
            subtitle="Menos que um almoço de negócios por mês. O retorno? Imensurável."
          />

          {(() => {
            const PLANS = [
              !isAffiliateRef && {
                id: "free",
                name: "Teste Grátis",
                tagline: "7 dias com acesso completo",
                price: "R$0",
                priceSuffix: "/7 dias",
                creditsBadge: "100% Grátis",
                creditsBadgeIcon: <Gift className="h-3 w-3 mr-1" />,
                creditsBadgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                detail: "60 créditos por dia · 420 no total",
                accent: "Sem cartão de crédito",
                features: ["Acesso completo à plataforma", "Filtros de busca de leads", "Exportação de leads"],
                ctaLabel: "Cadastre-se grátis",
                ctaIcon: <Gift className="mr-2 h-4 w-4" />,
                ctaPrimary: true,
                onCta: () => navigate("/auth?plan=free"),
              },
              {
                id: "starter",
                name: "Starter",
                tagline: "Para quem está começando",
                price: "R$97",
                priceSuffix: "/mês",
                creditsBadge: "300 créditos/mês",
                creditsBadgeClass: "bg-primary/15 text-primary border-primary/30",
                detail: "1 crédito = 1 lead gerado",
                accent: "⚡ CRM, campanhas, chatbot e demais recursos ilimitados",
                features: ["Acesso completo à plataforma", "Filtros de busca de leads", "Exportação de leads", "Compra de créditos extras"],
                ctaLabel: "Começar agora",
                ctaIcon: null,
                ctaPrimary: false,
                onCta: () => window.open(checkoutLinks.starter, "_blank"),
              },
              {
                id: "pro",
                name: "Pro",
                tagline: "Prospecção constante",
                price: "R$197",
                priceSuffix: "/mês",
                creditsBadge: "1.000 créditos/mês",
                creditsBadgeClass: "bg-primary/15 text-primary border-primary/30",
                detail: "1 crédito = 1 lead gerado",
                accent: "⚡ CRM, campanhas, chatbot e demais recursos ilimitados",
                features: ["Acesso completo à plataforma", "Filtros de busca de leads", "Exportação de leads", "Compra de créditos extras"],
                ctaLabel: "Garantir acesso",
                ctaIcon: null,
                ctaPrimary: true,
                popular: true,
                onCta: () => window.open(checkoutLinks.profissional, "_blank"),
              },
              {
                id: "enterprise",
                name: "Enterprise",
                tagline: "Grandes volumes de leads",
                price: "R$397",
                priceSuffix: "/mês",
                creditsBadge: "5.000 créditos/mês",
                creditsBadgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                detail: "1 crédito = 1 lead gerado",
                accent: "⚡ CRM, campanhas, chatbot e demais recursos ilimitados",
                features: ["Acesso completo à plataforma", "Filtros de busca de leads", "Exportação de leads", "Compra de créditos extras"],
                ctaLabel: "Começar agora",
                ctaIcon: null,
                ctaPrimary: false,
                onCta: () => window.open(checkoutLinks.enterprise, "_blank"),
              },
            ].filter(Boolean) as Array<{
              id: string; name: string; tagline: string; price: string; priceSuffix: string;
              creditsBadge: string; creditsBadgeIcon?: React.ReactNode; creditsBadgeClass: string;
              detail: string; accent: string; features: string[];
              ctaLabel: string; ctaIcon: React.ReactNode; ctaPrimary: boolean; popular?: boolean;
              onCta: () => void;
            }>;

            return (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAffiliateRef ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-5 sm:gap-6 max-w-6xl mx-auto pt-6`}>
                {PLANS.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    className={`relative ${plan.popular ? "lg:scale-[1.03] z-10" : ""}`}
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: plan.popular ? 1.03 : 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  >
                    {/* "Most popular" pill — sits above */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
                        <Badge className="gradient-bg text-primary-foreground border-0 px-5 py-1.5 glow-shadow text-xs tracking-wide whitespace-nowrap">
                          MAIS ESCOLHIDO 🔥
                        </Badge>
                      </div>
                    )}

                    {/* Decorative card peeking from behind (popular only) */}
                    {plan.popular && (
                      <div
                        aria-hidden
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/20 translate-x-3 translate-y-3 -z-10 opacity-60"
                      />
                    )}

                    {/* Glass card with cursor-aware spotlight + interactive lift */}
                    <div
                      className="relative rounded-2xl overflow-hidden h-full flex flex-col p-5 sm:p-6 glass-card glass-card-interactive"
                      onMouseMove={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        const rect = el.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        el.style.setProperty("--mx", `${x}%`);
                        el.style.setProperty("--my", `${y}%`);
                      }}
                    >
                      {/* Diagonal split borders (white top-left, primary bottom-right) */}
                      <div className="glass-border-overlay rounded-2xl" />

                      {/* Cursor-aware radial spotlight (fills the card on hover) */}
                      <div className="glass-spotlight rounded-2xl" />

                      {/* Cursor-aware bright border ring (chases the cursor along the edge) */}
                      <div className="glass-spotlight-border rounded-2xl" />

                      {/* Card content */}
                      <div className="relative flex flex-col flex-1">
                        {/* Header */}
                        <div className="mb-5">
                          <h3 className="text-lg font-bold font-display text-foreground mb-1">{plan.name}</h3>
                          <p className="text-xs text-white/65">{plan.tagline}</p>
                        </div>

                        {/* Price — gradient text */}
                        <div className="mb-3 flex items-end gap-2">
                          <span className={`text-4xl sm:text-5xl font-bold font-display tracking-tight leading-none ${plan.popular ? "gradient-text" : "text-white"}`}>
                            {plan.price}
                          </span>
                          <span className="text-sm text-white/55 mb-1">{plan.priceSuffix}</span>
                        </div>

                        <Badge className={`w-fit mb-2 text-[11px] ${plan.creditsBadgeClass}`}>
                          {plan.creditsBadgeIcon}
                          {plan.creditsBadge}
                        </Badge>
                        <p className="text-xs text-white/65 mb-1">{plan.detail}</p>
                        <p className="text-[10px] text-primary/85 mb-5 leading-relaxed">{plan.accent}</p>

                        {/* Divider */}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

                        {/* Features */}
                        <ul className="space-y-2.5 mb-6 flex-1 text-xs" role="list">
                          {plan.features.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-white/75">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <Button
                          size="lg"
                          onClick={plan.onCta}
                          className={
                            plan.ctaPrimary
                              ? "w-full h-11 gradient-bg text-primary-foreground hover:opacity-90 glow-shadow text-sm border-0"
                              : "w-full h-11 text-sm bg-white/[0.06] hover:bg-white/[0.12] text-foreground border border-white/15 backdrop-blur-sm"
                          }
                        >
                          {plan.ctaIcon}
                          {plan.ctaLabel}
                          {!plan.ctaIcon && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}

          {/* Credits extra info */}
          <motion.div
            className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl border border-border/60 bg-card card-shadow text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="text-base font-bold font-display text-foreground mb-2">Precisa de mais créditos?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Compre créditos extras diretamente na plataforma via PIX. Liberação automática.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { credits: "+100", price: "R$29,90" },
                { credits: "+500", price: "R$59,90" },
                { credits: "+1.000", price: "R$97,90" },
                { credits: "+2.000", price: "R$137,90" },
              ].map((pkg) => (
                <div key={pkg.credits} className="p-3 rounded-xl bg-muted/50 border border-border/40">
                  <p className="font-semibold text-foreground">{pkg.credits}</p>
                  <p className="text-xs text-muted-foreground">{pkg.price}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Acesso imediato</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Garantia de satisfação</span>
            <span className="flex items-center gap-1.5"><PhoneCall className="h-3.5 w-3.5" /> Suporte humano</span>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="border-t border-border/40" ariaLabel="Perguntas frequentes">
        <SectionHeader
          title={<>Perguntas <span className="gradient-text">frequentes</span></>}
        />

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.details
              key={faq.q}
              className="group p-5 rounded-xl border border-border/60 bg-card card-shadow cursor-pointer"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <summary className="font-semibold font-display text-foreground text-sm list-none flex items-center justify-between">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0 ml-4" />
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-8">{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </Section>

      {/* ═══ SECURITY POLICY ═══ */}
      <Section id="seguranca" className="border-t border-border/40" ariaLabel="Política de Segurança">
        <SectionHeader
          title={<>Seus dados estão <span className="gradient-text">100% seguros</span></>}
          subtitle="Privacidade e proteção são prioridades absolutas na LeadsPro."
        />

        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {[
              { icon: Lock, title: "Criptografia de ponta", desc: "Todos os dados são transmitidos e armazenados com criptografia AES-256, o mesmo padrão utilizado por bancos e instituições financeiras." },
              { icon: Shield, title: "Isolamento total de dados", desc: "Cada conta possui isolamento completo. Nenhum outro usuário, funcionário ou terceiro tem acesso aos seus leads, campanhas ou conversas." },
              { icon: Database, title: "Backup automático", desc: "Backups diários automáticos garantem que seus dados nunca sejam perdidos, mesmo em caso de falhas técnicas imprevistas." },
              { icon: Eye, title: "Sem venda de dados", desc: "Seus leads são 100% seus. Nunca vendemos, compartilhamos ou utilizamos seus dados para fins de terceiros. Ponto final." },
              { icon: Lock, title: "Conformidade LGPD", desc: "A plataforma segue as diretrizes da Lei Geral de Proteção de Dados (LGPD), garantindo o tratamento adequado de informações pessoais." },
              { icon: Shield, title: "Infraestrutura segura", desc: "Hospedagem em servidores com certificação SOC2 e ISO 27001, monitoramento 24/7 e proteção contra ataques DDoS." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="p-4 sm:p-6 rounded-2xl border border-border/60 bg-card card-shadow"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="rounded-xl p-2.5 w-fit mb-4 bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold font-display text-foreground mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center p-6 rounded-2xl border border-primary/20 bg-primary/5"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-foreground font-medium mb-2">🔒 Compromisso de Privacidade</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              A LeadsPro se compromete a proteger a privacidade e segurança dos dados de todos os seus usuários. 
              Não coletamos dados além do necessário para o funcionamento da plataforma. 
              Seus leads, mensagens, campanhas e informações pessoais são de sua propriedade exclusiva 
              e jamais serão compartilhados com terceiros sem seu consentimento explícito.
            </p>
            <a href="/termos-de-uso" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3">
              Leia nossos Termos de Uso completos <ArrowRight className="h-3 w-3" />
            </a>
          </motion.div>
        </div>
      </Section>

      {/* ═══ FOOTER ═══ */}
      <motion.footer
        className="border-t border-border/40 py-10"
        role="contentinfo"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <a href="/" className="flex items-center gap-2 mb-4" aria-label="LeadsPro">
                <img src={logoIcon} alt="LeadsPro" className="h-14" />
                <span className="text-lg font-bold font-display text-foreground">Leads<span className="gradient-text">Pro</span></span>
              </a>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Plataforma completa para capturar leads do Google Maps, Instagram e LinkedIn. Disparo em massa no WhatsApp, follow-up automático, CRM de vendas, pipeline Kanban, chatbot com IA e e-mail marketing.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Links do rodapé">
              <a href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</a>
              <a href="/recursos/busca" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Busca de Leads</a>
              <a href="/recursos/disparo" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Disparo WhatsApp</a>
              <a href="/recursos/crm" className="text-xs text-muted-foreground hover:text-foreground transition-colors">CRM</a>
              <a href="/recursos/followup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Follow-up</a>
              <a href="/recursos/chatbot-ia" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Chatbot IA</a>
              <a href="/recursos/pipeline" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pipeline</a>
              <a href="/recursos/widget" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Widget de Captura</a>
              <a href="/termos-de-uso" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</a>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} LeadsPro. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Capturar leads • Prospecção de clientes • Disparo em massa WhatsApp • CRM de vendas • Automação comercial
            </p>
          </div>
        </div>
      </motion.footer>

      <ExitIntentPopup />
      <FloatingCTA />
    </div>
  );
};

export default LandingPage;
