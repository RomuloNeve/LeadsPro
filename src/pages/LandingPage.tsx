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
    className="mb-10 md:mb-16 lg:mb-20 max-w-3xl mx-auto px-1"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5 }}
  >
    {badge && (
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <span className="h-px w-8 bg-primary" />
        <span className="font-mono uppercase tracking-[0.2em] text-xs font-medium text-primary">
          {badge}
        </span>
      </div>
    )}
    <h2 className="text-[1.75rem] sm:text-3xl md:text-5xl lg:text-[3.5rem] font-medium font-display leading-[1.1] tracking-tighter text-white">
      {title}
    </h2>
    {subtitle && (
      <p className="text-zinc-400 mt-4 md:mt-6 text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl font-sans">
        {subtitle}
      </p>
    )}
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
      {/* ═══ NAV — editorial floating bar ═══ */}
      <div className="fixed flex w-full z-50 pt-4 sm:pt-6 px-3 sm:px-4 top-0 left-0 justify-center pointer-events-none">
        <nav
          role="navigation"
          aria-label="Navegação principal"
          className="pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-2 sm:gap-4 bg-black/70 backdrop-blur-lg shadow-2xl shadow-black/50 px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10"
        >
          <a href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0" aria-label="LeadsPro">
            {/* Editorial logo block — 4-square mark */}
            <div className="grid grid-cols-2 w-5 h-5 gap-0.5">
              <div className="bg-primary w-full h-full" />
              <div className="bg-zinc-700 w-full h-full" />
              <div className="bg-zinc-800 w-full h-full" />
              <div className="bg-white w-full h-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>
            <span className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
              LeadsPro
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {/* Recursos dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRecursosOpen(true)}
              onMouseLeave={() => setRecursosOpen(false)}
            >
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                Recursos <ChevronDown className={`h-3.5 w-3.5 transition-transform ${recursosOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {recursosOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[540px] p-3 border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl grid grid-cols-2 gap-0 max-h-[70vh] overflow-y-auto no-scrollbar"
                  >
                    {recursosMenuItems.map((r) => (
                      <button
                        key={r.title}
                        onClick={() => { setRecursosOpen(false); navigate(r.route); }}
                        className="flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left group border border-transparent hover:border-primary/20"
                      >
                        <div className="p-2 bg-zinc-900 group-hover:bg-primary/15 transition-colors">
                          <r.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-white">{r.title}</span>
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
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle className="text-zinc-400 hover:text-white hover:bg-white/5" />
            <button
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors px-2 sm:px-3"
            >
              Entrar
            </button>
            {!isAffiliateRef && (
              <button
                onClick={() => navigate("/auth?plan=free")}
                className="hidden lg:inline-flex h-9 px-4 items-center gap-1.5 border border-primary/40 bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                <Gift className="h-3.5 w-3.5" /> Testar 7d
              </button>
            )}
            <button
              onClick={() => scrollTo("pricing")}
              className="hidden lg:inline-flex h-9 px-4 items-center bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider hover:bg-primary/90 transition-colors"
              style={{ boxShadow: "0 0 20px -5px hsl(var(--primary) / 0.5)" }}
            >
              Começar
            </button>
            {/* Mobile sticky CTA — visible once scrolled */}
            {!isAffiliateRef && scrolled && (
              <button
                onClick={() => navigate("/auth?plan=free")}
                className="lg:hidden h-8 px-2.5 bg-primary text-primary-foreground text-[11px] font-medium uppercase tracking-wider shrink-0 flex items-center gap-1"
              >
                <Gift className="h-3 w-3" /> Grátis
              </button>
            )}
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-white hover:bg-white/5 transition-colors"
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
        </nav>
      </div>

      {/* Mobile menu — full overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 top-16 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
              <button
                onClick={() => setMobileRecursosOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                <span>Recursos</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileRecursosOpen ? "rotate-180" : ""}`} />
              </button>

              {mobileRecursosOpen && (
                <div className="space-y-0">
                  {recursosMenuItems.map((r) => (
                    <button
                      key={r.title}
                      onClick={() => handleMobileResourceSelect(r.route)}
                      className="flex w-full items-start gap-2.5 text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-primary"
                    >
                      <r.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="leading-snug">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {[
                { label: "Como funciona", id: "how" },
                { label: "Preços", id: "pricing" },
                { label: "Afiliados", id: "afiliados" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMobileMenuSelect(item.id)}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-white border border-white/10 hover:bg-white/5 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { navigate("/blog"); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                Blog
              </button>
              <div className="flex flex-col gap-2 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}
                    className="h-10 border border-white/15 text-white text-xs font-medium uppercase tracking-wider hover:bg-white/5 transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => handleMobileMenuSelect("pricing")}
                    className="h-10 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-wider hover:bg-primary/90"
                  >
                    Começar
                  </button>
                </div>
                {!isAffiliateRef && (
                  <button
                    onClick={() => { navigate("/auth?plan=free"); setMobileMenuOpen(false); }}
                    className="h-10 border border-primary/40 bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Gift className="h-3.5 w-3.5" /> Testar Grátis — 7 dias
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO — editorial style ═══ */}
      <header className="relative min-h-[100dvh] flex items-center bg-black overflow-hidden">
        {/* Subtle radial glow behind hero */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-[60%]"
            style={{
              background: "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary) / 0.15), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          {/* Mask for the bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 pt-28 sm:pt-36 lg:pt-32 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 xl:gap-16 items-center">

            {/* ── LEFT: Editorial copy ── */}
            <motion.div className="max-w-xl" initial="hidden" animate="visible">
              {/* Top mono badges */}
              <motion.div variants={fadeUp} custom={0} className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-white/[0.03] backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/70">
                    +50K leads · 2K usuários
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-primary/40 bg-primary/10 backdrop-blur-sm">
                  <Flame className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary font-semibold">
                    7 dias grátis
                  </span>
                </span>
              </motion.div>

              {/* Headline — gradient white fade, Manrope */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display font-medium tracking-tighter text-white leading-[1.05] mb-6 sm:mb-8 text-[2.25rem] sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-[4rem] 2xl:text-7xl"
              >
                <span className="block text-gradient-white">Encontre clientes.</span>
                <span className="block text-gradient-white">Dispare em massa.</span>
                <span className="block text-gradient-crimson">Feche no automático.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-base sm:text-lg lg:text-base xl:text-lg text-zinc-400 max-w-xl mb-6 sm:mb-8 leading-relaxed font-sans"
              >
                Capture leads do Google Maps em 3 segundos. Dispare mensagens no WhatsApp sem ser banido. Automatize follow-ups. CRM, chatbot IA e pipeline — tudo numa plataforma só.
              </motion.p>

              {/* Reassurance line */}
              <motion.div variants={fadeUp} custom={2.5} className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-8 sm:mb-10">
                {["Sem cartão", "Acesso imediato", "Cancele quando quiser"].map((t) => (
                  <span key={t} className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <span className="text-primary">✓</span> {t}
                  </span>
                ))}
              </motion.div>

              {/* CTAs — sharp corners, conic hover */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Primary — solid crimson */}
                <button
                  onClick={() => scrollTo("pricing")}
                  className="group relative inline-flex h-12 items-center justify-center px-7 bg-primary text-primary-foreground font-medium text-sm uppercase tracking-wider transition-all hover:bg-primary/90 active:scale-95"
                  style={{ boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.6)" }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Quero dominar meu mercado
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Secondary — outline with conic spin on hover */}
                {!isAffiliateRef && (
                  <button
                    onClick={() => navigate("/auth?plan=free")}
                    className="group relative inline-flex h-12 items-center justify-center px-7 overflow-hidden text-white font-medium text-sm uppercase tracking-wider transition-transform active:scale-95"
                  >
                    {/* Animated conic border */}
                    <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,hsl(var(--primary))_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="absolute inset-0 bg-zinc-800 transition-opacity duration-300 group-hover:opacity-0" />
                    <span className="absolute inset-[1px] bg-black z-10" />
                    <span className="relative z-20 flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      Testar grátis 7d
                    </span>
                  </button>
                )}
              </motion.div>
            </motion.div>

            {/* ── RIGHT: Product mockup with sci-fi corner brackets ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex items-center justify-center lg:justify-end mt-8 lg:mt-0"
            >
              <div className="corner-brackets-full w-full max-w-[680px] p-4 sm:p-6">
                <span className="cb-tl" />
                <span className="cb-tr" />
                <span className="cb-bl" />
                <span className="cb-br" />
                <HeroProductMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ═══ STATS — editorial 4-up panel ═══ */}
      <section className="py-12 md:py-20 border-t border-zinc-800 bg-black" aria-label="Números">
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto border border-zinc-800"
          >
            {[
              { ref: stat1.ref, display: stat1.display, label: "Leads capturados", code: "[ 01 ]", delay: 0 },
              { ref: stat2.ref, display: stat2.display, label: "Usuários ativos",  code: "[ 02 ]", delay: 1 },
              { ref: stat3.ref, display: `${stat3.display}s`, label: "Tempo por lead", code: "[ 03 ]", delay: 2 },
              { ref: stat4.ref, display: stat4.display, label: "Satisfação", code: "[ 04 ]", delay: 3 },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={s.delay}
                className={`relative p-6 sm:p-8 md:p-10 group hover:bg-zinc-900/30 transition-colors ${
                  i < 2 ? "md:border-r border-b md:border-b-0 border-zinc-800" : ""
                } ${
                  i === 1 ? "border-r-0 md:border-r border-zinc-800" : ""
                } ${
                  i === 2 ? "md:border-r border-zinc-800" : ""
                } ${
                  i === 0 ? "border-r border-zinc-800" : ""
                }`}
              >
                <span className="block text-[10px] font-mono text-zinc-600 mb-3 tracking-widest">{s.code}</span>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium font-display text-white tabular-nums tracking-tighter">
                  <span ref={s.ref}>{s.display}</span>
                </p>
                <p className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-zinc-500 mt-3">{s.label}</p>
                {/* Hover line */}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 visual steps ═══ */}
      <Section id="how" className="border-t border-zinc-800" ariaLabel="Como funciona em 3 passos">
        <SectionHeader
          badge="Como funciona"
          title={<>Em 3 passos você sai do <span className="gradient-text">manual</span> para o automático</>}
          subtitle="Clique em cada passo para ver a tela real do sistema."
        />
        <HowItWorks3Steps />
      </Section>

      {/* ═══ PROBLEM / PAIN ═══ */}
      <Section className="border-t border-zinc-800 relative bg-black" ariaLabel="Problemas que resolvemos">
        <div className="relative max-w-4xl mx-auto">
          <SectionHeader
            badge="A verdade"
            title={<>Você está <span className="text-primary">perdendo dinheiro</span> agora mesmo</>}
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
                <details className="group border border-zinc-800 bg-black hover:border-primary/40 transition-colors">
                  <summary className="flex items-center justify-between cursor-pointer p-5 hover:bg-zinc-900/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-medium">[ {String(i+1).padStart(2,'0')} ]</span>
                      <span className="text-base font-medium font-display text-white">{item.trigger}</span>
                    </div>
                    <ChevronDown className="h-5 w-5 text-zinc-500 transition-transform group-open:rotate-180 shrink-0 ml-3" />
                  </summary>
                  <div className="px-5 pb-5 space-y-2 border-t border-zinc-800 border-dashed pt-4">
                    {item.content.map((line, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 bg-zinc-900/40 border-l-2 border-destructive/60">
                        <span className="text-destructive font-bold text-sm mt-0.5 shrink-0">✗</span>
                        <p className="text-sm text-zinc-400 leading-relaxed">{line}</p>
                      </div>
                    ))}
                    <div className="mt-4 p-4 border border-primary/30 bg-primary/[0.05]">
                      <p className="text-sm font-medium text-white flex items-start gap-2">
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
            <button
              onClick={() => scrollTo("pricing")}
              className="group inline-flex items-center justify-center gap-3 h-12 sm:h-14 px-6 sm:px-10 bg-primary text-primary-foreground text-xs sm:text-sm font-medium uppercase tracking-wider hover:bg-primary/90 transition-all w-full sm:w-auto"
              style={{ boxShadow: "0 0 30px -5px hsl(var(--primary) / 0.5)" }}
            >
              Chega de perder dinheiro — comece agora
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </Section>

      {/* ═══ ROI CALCULATOR ═══ */}
      <Section id="calculadora-roi" className="border-t border-zinc-800" ariaLabel="Calculadora de prejuízo">
        <RoiCalculator onCta={() => scrollTo("pricing")} />
      </Section>

      {/* ═══ FEATURES 3D STACK ═══ */}
      <Section className="border-t border-zinc-800 relative overflow-hidden" ariaLabel="Recursos da plataforma">
        <SectionHeader
          badge="Tudo num só lugar"
          title={<>Os recursos que <span className="gradient-text">tiram o manual</span> do seu dia</>}
          subtitle="Mexa o mouse pra explorar — tudo aqui está disponível em qualquer plano."
        />
        <Features3DStack />
      </Section>

      {/* ═══ TESTIMONIALS — editorial cards ═══ */}
      <Section id="testimonials" className="border-t border-zinc-800 bg-black" ariaLabel="Depoimentos de clientes">
        <SectionHeader
          badge="Resultados reais"
          title={<>Profissionais que <span className="text-primary">já transformaram</span> seus resultados</>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto border border-zinc-800">
          {testimonials.map((t, i) => (
            <motion.article
              key={t.name}
              className={`relative p-5 sm:p-6 group hover:bg-zinc-900/40 transition-colors flex flex-col ${
                i < 3 ? "border-b lg:border-b-0 lg:border-r border-zinc-800" : ""
              } ${
                i === 1 ? "sm:border-r-0 lg:border-r border-zinc-800" : ""
              } ${
                i === 0 ? "sm:border-r border-zinc-800" : ""
              } ${
                i === 2 ? "sm:border-b-0 lg:border-b-0 border-zinc-800 sm:border-r border-r-0" : ""
              }`}
            >
              {/* Quote mark */}
              <Quote className="h-8 w-8 text-primary/30 mb-4" aria-hidden="true" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 leading-relaxed flex-1 font-sans">{t.text}</p>
              {/* Divider — dashed editorial */}
              <div className="border-t border-zinc-800 border-dashed pt-4 mt-5 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-medium font-display text-primary tabular-nums tracking-tighter">{t.metric}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{t.metricLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-9 w-9 object-cover" />
                  <div>
                    <p className="font-medium text-white text-sm font-sans">{t.name}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
              {/* Hover side line */}
              <span className="absolute left-0 top-0 h-full w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
            </motion.article>
          ))}
        </div>
      </Section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <Section className="border-t border-zinc-800" ariaLabel="Comparação antes e depois">
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
      <Section id="afiliados" className="border-t border-zinc-800 relative overflow-hidden" ariaLabel="Programa de Afiliados">
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
        className="border-t border-zinc-800 relative overflow-hidden"
        ariaLabel="Planos e preços"
      >
        {/* Mouse tracker wraps everything inside the section so cursor
            events from any child (cards included) reach the listener. */}
        <div
          className="relative"
          onMouseMove={(e) => {
            const root = e.currentTarget as HTMLElement;
            const rect = root.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            root.style.setProperty("--sx", String(x));
            root.style.setProperty("--sy", String(y));
          }}
          onMouseLeave={(e) => {
            const root = e.currentTarget as HTMLElement;
            root.style.setProperty("--sx", "0");
            root.style.setProperty("--sy", "0");
          }}
        >
          {/* Animated background blobs — drift toward cursor */}
          <div className="absolute inset-0 pointer-events-none -z-0" aria-hidden="true">
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

                    {/* ── Cursor-tracked glow that drifts behind the popular card ──
                        Soft blurred shape (not a card outline) so it reads as
                        ambient light, not a stacked second card. */}
                    {plan.popular && (
                      <div
                        aria-hidden
                        className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
                        style={{
                          background:
                            "linear-gradient(135deg, hsl(var(--primary) / 0.38), hsl(160 60% 45% / 0.28))",
                          filter: "blur(28px)",
                          transform: `
                            translate3d(
                              calc(var(--sx, 0) * 26px),
                              calc(8px + var(--sy, 0) * 22px),
                              0
                            )
                            scale(1.04)
                          `,
                          transition:
                            "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                          opacity: 0.85,
                        }}
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
        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section id="faq" className="border-t border-zinc-800" ariaLabel="Perguntas frequentes">
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
      <Section id="seguranca" className="border-t border-zinc-800" ariaLabel="Política de Segurança">
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
        className="border-t border-zinc-800 py-10"
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
          <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
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
