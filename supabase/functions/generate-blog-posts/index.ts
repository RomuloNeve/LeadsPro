import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Topic type definition ──
interface Topic {
  title: string;
  page_type: "pillar_master" | "pillar_secondary" | "satellite" | "niche" | "transactional" | "international";
  cluster: string;
  parent_slug: string | null;
  min_words: number;
  keywords: string[];
}

// ── PILLAR MASTER ──
const PILLAR_MASTER: Topic = {
  title: "Automação de WhatsApp para Empresas: Guia Completo 2026",
  page_type: "pillar_master",
  cluster: "Master",
  parent_slug: null,
  min_words: 3000,
  keywords: ["automação whatsapp", "software automação whatsapp", "ferramenta whatsapp marketing", "disparo whatsapp em massa", "plataforma whatsapp para empresas"],
};

// ── PILLARS SECONDARY ──
const PILLARS_SECONDARY: Topic[] = [
  { title: "Disparo em Massa no WhatsApp: Guia Definitivo", page_type: "pillar_secondary", cluster: "Disparo em Massa", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["disparo em massa whatsapp", "envio em massa whatsapp", "mensagem em massa whatsapp"] },
  { title: "Follow Up Automático no WhatsApp: Como Nunca Perder um Lead", page_type: "pillar_secondary", cluster: "Follow Up", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["follow up automático whatsapp", "sequência automática whatsapp", "automação de respostas whatsapp"] },
  { title: "Como Buscar Leads Qualificados: Guia Completo de Prospecção", page_type: "pillar_secondary", cluster: "Busca de Leads", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["buscar leads", "prospecção de leads", "gerar leads B2B", "lista de leads"] },
  { title: "WhatsApp Marketing por Nicho: Estratégias que Funcionam", page_type: "pillar_secondary", cluster: "WhatsApp Nichos", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["whatsapp marketing nicho", "whatsapp para empresas", "whatsapp para negócios"] },
  { title: "Caixa de Entrada Integrada: Centralizar Atendimento WhatsApp", page_type: "pillar_secondary", cluster: "Caixa de Entrada", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["caixa de entrada whatsapp", "multi atendimento whatsapp", "centralizar whatsapp"] },
  { title: "Inteligência Artificial no WhatsApp: Chatbot, Automação e Vendas", page_type: "pillar_secondary", cluster: "IA WhatsApp", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 2000, keywords: ["IA whatsapp", "chatbot whatsapp inteligente", "agente IA whatsapp"] },
];

// ── Helper to create satellite topics ──
function sat(title: string, cluster: string, parentSlug: string, keywords: string[]): Topic {
  return { title, page_type: "satellite", cluster, parent_slug: parentSlug, min_words: 1200, keywords };
}
function niche(title: string, keywords: string[]): Topic {
  return { title, page_type: "niche", cluster: "WhatsApp Nichos", parent_slug: "whatsapp-marketing-por-nicho-estrategias-que-funcionam", min_words: 1500, keywords };
}
function transactional(title: string, keywords: string[]): Topic {
  return { title, page_type: "transactional", cluster: "Transacional", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 1500, keywords };
}
function international(title: string, keywords: string[]): Topic {
  return { title, page_type: "international", cluster: "Internacional", parent_slug: "automacao-de-whatsapp-para-empresas-guia-completo-2026", min_words: 1500, keywords };
}

// ── CLUSTER 1: Disparo em Massa (40 satélites) ──
const DM_SLUG = "disparo-em-massa-no-whatsapp-guia-definitivo";
const CLUSTER_DISPARO: Topic[] = [
  sat("Como Fazer Disparo em Massa no WhatsApp em 2026", "Disparo em Massa", DM_SLUG, ["como fazer disparo em massa whatsapp", "disparo whatsapp 2026"]),
  sat("Disparo WhatsApp Marketing: Estratégias que Convertem", "Disparo em Massa", DM_SLUG, ["disparo whatsapp marketing", "marketing whatsapp"]),
  sat("Disparo WhatsApp Sem Bloquear: 7 Técnicas Anti-Ban", "Disparo em Massa", DM_SLUG, ["disparo whatsapp sem bloquear", "whatsapp anti-ban"]),
  sat("Disparo WhatsApp Brasil: Regras e Boas Práticas", "Disparo em Massa", DM_SLUG, ["disparo whatsapp brasil", "regras whatsapp brasil"]),
  sat("Disparo WhatsApp Internacional: Como Alcançar Clientes no Exterior", "Disparo em Massa", DM_SLUG, ["disparo whatsapp internacional", "whatsapp exterior"]),
  sat("Disparo WhatsApp para Imobiliária: Guia Prático", "Disparo em Massa", DM_SLUG, ["disparo whatsapp imobiliária", "whatsapp imobiliária"]),
  sat("Disparo WhatsApp para Logística e Transportadoras", "Disparo em Massa", DM_SLUG, ["disparo whatsapp logística", "whatsapp transportadora"]),
  sat("Disparo WhatsApp para Clínicas e Consultórios", "Disparo em Massa", DM_SLUG, ["disparo whatsapp clínica", "whatsapp consultório"]),
  sat("Disparo WhatsApp para E-commerce: Aumentar Vendas", "Disparo em Massa", DM_SLUG, ["disparo whatsapp ecommerce", "whatsapp loja virtual"]),
  sat("Disparo WhatsApp para Infoprodutores e Cursos Online", "Disparo em Massa", DM_SLUG, ["disparo whatsapp infoprodutor", "whatsapp cursos online"]),
  sat("Como Criar Mensagens de Vendas para WhatsApp que Convertem", "Disparo em Massa", DM_SLUG, ["mensagens vendas whatsapp", "copywriting whatsapp"]),
  sat("Melhores Horários para Enviar Mensagens no WhatsApp", "Disparo em Massa", DM_SLUG, ["melhores horários whatsapp", "quando enviar whatsapp"]),
  sat("WhatsApp Business vs WhatsApp Comum para Vendas", "Disparo em Massa", DM_SLUG, ["whatsapp business vs comum", "whatsapp business vendas"]),
  sat("Como Aquecer Número de WhatsApp para Envio em Massa", "Disparo em Massa", DM_SLUG, ["aquecer número whatsapp", "esquentar whatsapp"]),
  sat("Listas de Transmissão WhatsApp: Guia Completo", "Disparo em Massa", DM_SLUG, ["lista transmissão whatsapp", "broadcast whatsapp"]),
  sat("Disparo WhatsApp para Restaurantes e Delivery", "Disparo em Massa", DM_SLUG, ["disparo whatsapp restaurante", "whatsapp delivery"]),
  sat("Disparo WhatsApp para Academias e Estúdios Fitness", "Disparo em Massa", DM_SLUG, ["disparo whatsapp academia", "whatsapp fitness"]),
  sat("Disparo WhatsApp para Salão de Beleza e Estética", "Disparo em Massa", DM_SLUG, ["disparo whatsapp salão beleza", "whatsapp estética"]),
  sat("Como Segmentar Contatos para Disparo no WhatsApp", "Disparo em Massa", DM_SLUG, ["segmentar contatos whatsapp", "segmentação whatsapp"]),
  sat("Disparo WhatsApp com Imagem e Vídeo: Boas Práticas", "Disparo em Massa", DM_SLUG, ["disparo whatsapp imagem", "whatsapp mídia"]),
  sat("Como Medir Resultados de Campanhas WhatsApp", "Disparo em Massa", DM_SLUG, ["métricas whatsapp", "resultados campanha whatsapp"]),
  sat("Disparo WhatsApp para Eventos e Convites", "Disparo em Massa", DM_SLUG, ["disparo whatsapp evento", "convite whatsapp"]),
  sat("Disparo WhatsApp para Cobrança e Lembretes", "Disparo em Massa", DM_SLUG, ["disparo whatsapp cobrança", "lembrete whatsapp"]),
  sat("Templates de Mensagens WhatsApp para Vendas B2B", "Disparo em Massa", DM_SLUG, ["templates whatsapp B2B", "mensagem whatsapp vendas"]),
  sat("Disparo WhatsApp para Black Friday e Datas Comemorativas", "Disparo em Massa", DM_SLUG, ["disparo whatsapp black friday", "whatsapp promoção"]),
  sat("Como Evitar Ser Marcado como Spam no WhatsApp", "Disparo em Massa", DM_SLUG, ["evitar spam whatsapp", "whatsapp spam"]),
  sat("Disparo WhatsApp para Construtoras e Incorporadoras", "Disparo em Massa", DM_SLUG, ["disparo whatsapp construtora", "whatsapp incorporadora"]),
  sat("Disparo WhatsApp para Concessionárias de Veículos", "Disparo em Massa", DM_SLUG, ["disparo whatsapp concessionária", "whatsapp veículos"]),
  sat("Disparo WhatsApp para Escolas e Cursos Presenciais", "Disparo em Massa", DM_SLUG, ["disparo whatsapp escola", "whatsapp educação"]),
  sat("Como Criar um Funil de Vendas com Disparo WhatsApp", "Disparo em Massa", DM_SLUG, ["funil vendas whatsapp", "funil whatsapp"]),
  sat("Disparo WhatsApp para Seguros e Planos de Saúde", "Disparo em Massa", DM_SLUG, ["disparo whatsapp seguros", "whatsapp plano saúde"]),
  sat("Disparo WhatsApp com Número Próprio vs API Oficial", "Disparo em Massa", DM_SLUG, ["whatsapp número próprio", "whatsapp api oficial"]),
  sat("Como Personalizar Mensagens em Massa no WhatsApp", "Disparo em Massa", DM_SLUG, ["personalizar mensagem whatsapp", "variáveis whatsapp"]),
  sat("Disparo WhatsApp para Consultorias e Coaching", "Disparo em Massa", DM_SLUG, ["disparo whatsapp consultoria", "whatsapp coaching"]),
  sat("Disparo WhatsApp para Franquias: Padronizar Comunicação", "Disparo em Massa", DM_SLUG, ["disparo whatsapp franquia", "whatsapp franquias"]),
  sat("Automação de Disparo WhatsApp: Programar Envios", "Disparo em Massa", DM_SLUG, ["automação disparo whatsapp", "programar envio whatsapp"]),
  sat("Disparo WhatsApp para Agronegócio e Rural", "Disparo em Massa", DM_SLUG, ["disparo whatsapp agronegócio", "whatsapp rural"]),
  sat("Disparo WhatsApp para Farmácias e Drogarias", "Disparo em Massa", DM_SLUG, ["disparo whatsapp farmácia", "whatsapp drogaria"]),
  sat("Disparo WhatsApp para Petshops e Clínicas Veterinárias", "Disparo em Massa", DM_SLUG, ["disparo whatsapp petshop", "whatsapp veterinária"]),
  sat("Disparo WhatsApp para Óticas e Clínicas Oftalmológicas", "Disparo em Massa", DM_SLUG, ["disparo whatsapp ótica", "whatsapp oftalmologia"]),
];

// ── CLUSTER 2: Follow Up (30 satélites) ──
const FU_SLUG = "follow-up-automatico-no-whatsapp-como-nunca-perder-um-lead";
const CLUSTER_FOLLOWUP: Topic[] = [
  sat("Follow Up Automático WhatsApp: Passo a Passo Completo", "Follow Up", FU_SLUG, ["follow up automático whatsapp", "passo a passo follow up"]),
  sat("Automação de Respostas WhatsApp: Como Configurar", "Follow Up", FU_SLUG, ["automação respostas whatsapp", "respostas automáticas"]),
  sat("Funil Automático WhatsApp: Da Captação à Venda", "Follow Up", FU_SLUG, ["funil automático whatsapp", "funil vendas whatsapp"]),
  sat("Sequência Automática WhatsApp: Quantas Mensagens Enviar", "Follow Up", FU_SLUG, ["sequência automática whatsapp", "cadência follow up"]),
  sat("Recuperação de Leads WhatsApp: Reativar Contatos Frios", "Follow Up", FU_SLUG, ["recuperação leads whatsapp", "leads frios whatsapp"]),
  sat("Scripts de Follow Up que Funcionam para Vendas B2B", "Follow Up", FU_SLUG, ["scripts follow up B2B", "follow up vendas"]),
  sat("Como Recuperar Leads que Não Responderam no WhatsApp", "Follow Up", FU_SLUG, ["recuperar leads whatsapp", "leads sem resposta"]),
  sat("A Ciência por Trás do Follow Up de Vendas Eficaz", "Follow Up", FU_SLUG, ["ciência follow up", "follow up eficaz"]),
  sat("Quantos Follow Ups Fazer Antes de Desistir de um Lead", "Follow Up", FU_SLUG, ["quantos follow ups", "persistência vendas"]),
  sat("Como Personalizar Follow Ups em Escala no WhatsApp", "Follow Up", FU_SLUG, ["personalizar follow up", "follow up escala"]),
  sat("Follow Up por WhatsApp vs Email: Qual Funciona Melhor", "Follow Up", FU_SLUG, ["follow up whatsapp vs email", "canal follow up"]),
  sat("Erros Comuns no Follow Up de Vendas e Como Evitar", "Follow Up", FU_SLUG, ["erros follow up", "follow up erros"]),
  sat("Follow Up para Propostas Enviadas: Como Cobrar Sem Pressionar", "Follow Up", FU_SLUG, ["follow up proposta", "cobrar proposta"]),
  sat("Como Criar Gatilhos de Follow Up Automático", "Follow Up", FU_SLUG, ["gatilhos follow up", "trigger follow up"]),
  sat("Follow Up para Pós-Venda: Fidelizar Clientes pelo WhatsApp", "Follow Up", FU_SLUG, ["follow up pós-venda", "fidelizar whatsapp"]),
  sat("Métricas de Follow Up: O que Medir e Como Melhorar", "Follow Up", FU_SLUG, ["métricas follow up", "KPIs follow up"]),
  sat("Follow Up Multicanal: WhatsApp + Email + Ligação", "Follow Up", FU_SLUG, ["follow up multicanal", "omnichannel follow up"]),
  sat("Follow Up para Leads de Eventos e Feiras", "Follow Up", FU_SLUG, ["follow up evento", "leads feira"]),
  sat("Follow Up para Leads de Anúncios Pagos", "Follow Up", FU_SLUG, ["follow up ads", "leads anúncio"]),
  sat("Como Automatizar Follow Up de Orçamentos Enviados", "Follow Up", FU_SLUG, ["follow up orçamento", "automação orçamento"]),
  sat("Follow Up para Agendamento de Reuniões", "Follow Up", FU_SLUG, ["follow up reunião", "agendar reunião whatsapp"]),
  sat("Follow Up para Leads de Landing Page", "Follow Up", FU_SLUG, ["follow up landing page", "leads landing page"]),
  sat("Follow Up Inteligente com IA: O Futuro das Vendas", "Follow Up", FU_SLUG, ["follow up IA", "inteligência artificial follow up"]),
  sat("Como Criar Templates de Follow Up para Cada Etapa do Funil", "Follow Up", FU_SLUG, ["templates follow up", "follow up funil"]),
  sat("Follow Up para Reativação de Clientes Inativos", "Follow Up", FU_SLUG, ["reativação clientes", "clientes inativos whatsapp"]),
  sat("Follow Up para Vendas Complexas e Ciclo Longo", "Follow Up", FU_SLUG, ["vendas complexas follow up", "ciclo longo follow up"]),
  sat("Follow Up para Indicações e Referrals", "Follow Up", FU_SLUG, ["follow up indicação", "referral whatsapp"]),
  sat("Follow Up Sazonal: Datas Comemorativas e Campanhas", "Follow Up", FU_SLUG, ["follow up sazonal", "campanha sazonal"]),
  sat("Follow Up para SaaS: Onboarding e Retenção via WhatsApp", "Follow Up", FU_SLUG, ["follow up SaaS", "onboarding whatsapp"]),
  sat("Follow Up para Leads Inbound vs Outbound", "Follow Up", FU_SLUG, ["follow up inbound", "follow up outbound"]),
];

// ── CLUSTER 3: Busca de Leads (50 satélites) ──
const BL_SLUG = "como-buscar-leads-qualificados-guia-completo-de-prospeccao";
const CLUSTER_BUSCA: Topic[] = [
  sat("Buscar Leads por CNAE: Como Encontrar Empresas por Atividade", "Busca de Leads", BL_SLUG, ["buscar leads CNAE", "leads por atividade"]),
  sat("Buscar Leads por Estado e Cidade: Prospecção Geolocalizada", "Busca de Leads", BL_SLUG, ["leads por estado", "leads por cidade"]),
  sat("Lista de Empresas por Cidade: Como Montar para Prospecção", "Busca de Leads", BL_SLUG, ["lista empresas cidade", "prospecção local"]),
  sat("Extrair Leads com Telefone e Email: Ferramentas e Técnicas", "Busca de Leads", BL_SLUG, ["extrair leads telefone", "extrair email empresas"]),
  sat("Como Montar Lista de Leads B2B do Zero", "Busca de Leads", BL_SLUG, ["lista leads B2B", "montar lista prospecção"]),
  sat("Como Gerar Leads Internacionais para seu Negócio", "Busca de Leads", BL_SLUG, ["leads internacionais", "prospecção internacional"]),
  sat("Melhores Fontes de Leads B2B Grátis em 2026", "Busca de Leads", BL_SLUG, ["leads B2B grátis", "fontes leads gratuitas"]),
  sat("Como Encontrar Leads Qualificados pelo Google Maps", "Busca de Leads", BL_SLUG, ["leads google maps", "prospecção google maps"]),
  sat("Ferramentas Gratuitas para Capturar Leads de Empresas", "Busca de Leads", BL_SLUG, ["ferramentas capturar leads", "leads grátis"]),
  sat("Como Prospectar Clientes pela Internet Sem Gastar Dinheiro", "Busca de Leads", BL_SLUG, ["prospectar internet grátis", "prospecção gratuita"]),
  sat("Prospecção Ativa vs Passiva: Qual Gera Mais Vendas", "Busca de Leads", BL_SLUG, ["prospecção ativa vs passiva", "tipos prospecção"]),
  sat("Como Abordar Leads Frios Sem Parecer Spam", "Busca de Leads", BL_SLUG, ["abordar leads frios", "cold outreach"]),
  sat("Técnicas de Prospecção B2B que Funcionam em 2026", "Busca de Leads", BL_SLUG, ["técnicas prospecção B2B", "prospecção 2026"]),
  sat("Como Fazer Prospecção de Clientes pelo Instagram", "Busca de Leads", BL_SLUG, ["prospecção instagram", "leads instagram"]),
  sat("Como Fazer Prospecção de Clientes pelo LinkedIn", "Busca de Leads", BL_SLUG, ["prospecção linkedin", "leads linkedin"]),
  sat("Buscar Leads de Restaurantes e Bares por Região", "Busca de Leads", BL_SLUG, ["leads restaurantes", "prospecção food service"]),
  sat("Buscar Leads de Médicos e Profissionais de Saúde", "Busca de Leads", BL_SLUG, ["leads médicos", "prospecção saúde"]),
  sat("Buscar Leads de Contabilidades e Escritórios", "Busca de Leads", BL_SLUG, ["leads contabilidade", "prospecção escritórios"]),
  sat("Buscar Leads de Lojas e Comércios Locais", "Busca de Leads", BL_SLUG, ["leads comércio local", "prospecção varejo"]),
  sat("Como Usar Scraping para Gerar Listas de Leads", "Busca de Leads", BL_SLUG, ["scraping leads", "web scraping prospecção"]),
  sat("Buscar Leads por Porte da Empresa: MEI, ME, EPP", "Busca de Leads", BL_SLUG, ["leads MEI", "leads por porte"]),
  sat("Como Qualificar Leads Antes do Primeiro Contato", "Busca de Leads", BL_SLUG, ["qualificar leads", "lead scoring"]),
  sat("Buscar Leads de Startups e Empresas de Tecnologia", "Busca de Leads", BL_SLUG, ["leads startups", "prospecção tech"]),
  sat("Buscar Leads de Advogados e Escritórios de Advocacia", "Busca de Leads", BL_SLUG, ["leads advogados", "prospecção advocacia"]),
  sat("Como Enriquecer Dados de Leads Automaticamente", "Busca de Leads", BL_SLUG, ["enriquecer leads", "data enrichment"]),
  sat("Buscar Leads de Escolas e Instituições de Ensino", "Busca de Leads", BL_SLUG, ["leads escolas", "prospecção educação"]),
  sat("Como Importar Leads de Planilha Excel para CRM", "Busca de Leads", BL_SLUG, ["importar leads excel", "excel para CRM"]),
  sat("Buscar Leads de Construtoras e Empreiteiras", "Busca de Leads", BL_SLUG, ["leads construtoras", "prospecção construção"]),
  sat("Buscar Leads de Agências de Marketing Digital", "Busca de Leads", BL_SLUG, ["leads agências marketing", "prospecção agências"]),
  sat("Como Montar Lista de Prospecção por Segmento de Mercado", "Busca de Leads", BL_SLUG, ["lista prospecção segmento", "segmentação mercado"]),
  sat("Buscar Leads de Hotéis, Pousadas e Turismo", "Busca de Leads", BL_SLUG, ["leads hotéis", "prospecção turismo"]),
  sat("Buscar Leads de Clínicas Odontológicas por Cidade", "Busca de Leads", BL_SLUG, ["leads dentistas", "prospecção odontologia"]),
  sat("Buscar Leads de Oficinas Mecânicas e Autopeças", "Busca de Leads", BL_SLUG, ["leads oficina", "prospecção autopeças"]),
  sat("Buscar Leads de Energia Solar e Sustentabilidade", "Busca de Leads", BL_SLUG, ["leads energia solar", "prospecção solar"]),
  sat("Buscar Leads de Imobiliárias e Corretores de Imóveis", "Busca de Leads", BL_SLUG, ["leads imobiliárias", "prospecção imóveis"]),
  sat("Como Usar Dados Públicos (CNPJ) para Prospecção", "Busca de Leads", BL_SLUG, ["dados públicos CNPJ", "receita federal prospecção"]),
  sat("Buscar Leads de Academias e Personal Trainers", "Busca de Leads", BL_SLUG, ["leads academias", "prospecção fitness"]),
  sat("Buscar Leads de Freelancers e Profissionais Autônomos", "Busca de Leads", BL_SLUG, ["leads freelancers", "prospecção autônomos"]),
  sat("Como Criar ICP (Perfil de Cliente Ideal) para Prospecção", "Busca de Leads", BL_SLUG, ["ICP prospecção", "perfil cliente ideal"]),
  sat("Buscar Leads de Salões de Beleza e Barbearias", "Busca de Leads", BL_SLUG, ["leads salão beleza", "prospecção barbearia"]),
  sat("Buscar Leads de Supermercados e Atacadistas", "Busca de Leads", BL_SLUG, ["leads supermercado", "prospecção atacado"]),
  sat("Como Validar Números de WhatsApp em Massa", "Busca de Leads", BL_SLUG, ["validar whatsapp", "verificar número whatsapp"]),
  sat("Buscar Leads de ONGs e Organizações do Terceiro Setor", "Busca de Leads", BL_SLUG, ["leads ONGs", "prospecção terceiro setor"]),
  sat("Buscar Leads de Indústrias e Fábricas por Região", "Busca de Leads", BL_SLUG, ["leads indústrias", "prospecção fábricas"]),
  sat("Buscar Leads de E-commerces e Lojas Virtuais", "Busca de Leads", BL_SLUG, ["leads ecommerce", "prospecção lojas virtuais"]),
  sat("Como Exportar Leads do CRM para Campanhas WhatsApp", "Busca de Leads", BL_SLUG, ["exportar leads CRM", "CRM para whatsapp"]),
  sat("Buscar Leads de Contabilidades Online", "Busca de Leads", BL_SLUG, ["leads contabilidade online", "prospecção contábil"]),
  sat("Buscar Leads de Clínicas de Estética e Dermatologia", "Busca de Leads", BL_SLUG, ["leads estética", "prospecção dermatologia"]),
  sat("Como Organizar e Limpar sua Base de Leads", "Busca de Leads", BL_SLUG, ["organizar leads", "limpar base leads"]),
  sat("Buscar Leads de Empresas de Software e SaaS", "Busca de Leads", BL_SLUG, ["leads SaaS", "prospecção software"]),
];

// ── CLUSTER 4: WhatsApp Nichos (30 niche pages) ──
const CLUSTER_NICHOS: Topic[] = [
  niche("WhatsApp Marketing para Imobiliárias: Guia Completo", ["whatsapp imobiliária", "marketing imobiliária whatsapp"]),
  niche("WhatsApp Marketing para Clínicas e Hospitais", ["whatsapp clínica", "marketing saúde whatsapp"]),
  niche("WhatsApp Marketing para Logística e Transportadoras", ["whatsapp logística", "marketing logística"]),
  niche("WhatsApp Marketing para Dentistas e Odontologia", ["whatsapp dentista", "marketing odontológico"]),
  niche("WhatsApp Marketing para Academias e CrossFit", ["whatsapp academia", "marketing fitness"]),
  niche("WhatsApp Marketing para Concessionárias de Veículos", ["whatsapp concessionária", "marketing automotivo"]),
  niche("WhatsApp Marketing para Restaurantes e Food Service", ["whatsapp restaurante", "marketing food service"]),
  niche("WhatsApp Marketing para Advogados e Escritórios Jurídicos", ["whatsapp advogado", "marketing jurídico"]),
  niche("WhatsApp Marketing para Contabilidade e Finanças", ["whatsapp contabilidade", "marketing contábil"]),
  niche("WhatsApp Marketing para SaaS e Empresas de Tecnologia", ["whatsapp SaaS", "marketing tech whatsapp"]),
  niche("WhatsApp Marketing para Agências de Marketing Digital", ["whatsapp agência", "marketing agência digital"]),
  niche("WhatsApp Marketing para Energia Solar e Renováveis", ["whatsapp energia solar", "marketing solar"]),
  niche("WhatsApp Marketing para Construção Civil e Engenharia", ["whatsapp construção civil", "marketing construção"]),
  niche("WhatsApp Marketing para Salões de Beleza e Barbearias", ["whatsapp salão", "marketing beleza"]),
  niche("WhatsApp Marketing para Escolas e Educação", ["whatsapp escola", "marketing educacional"]),
  niche("WhatsApp Marketing para Seguradoras e Corretores", ["whatsapp seguros", "marketing seguros"]),
  niche("WhatsApp Marketing para Hotéis e Pousadas", ["whatsapp hotel", "marketing hotelaria"]),
  niche("WhatsApp Marketing para Petshops e Veterinários", ["whatsapp petshop", "marketing pet"]),
  niche("WhatsApp Marketing para Farmácias e Drogarias", ["whatsapp farmácia", "marketing farmacêutico"]),
  niche("WhatsApp Marketing para Consultorias e Coaching", ["whatsapp consultoria", "marketing coaching"]),
  niche("WhatsApp Marketing para Infoprodutores e Cursos", ["whatsapp infoprodutor", "marketing digital cursos"]),
  niche("WhatsApp Marketing para Franquias: Padronizar Vendas", ["whatsapp franquia", "marketing franquias"]),
  niche("WhatsApp Marketing para Supermercados e Varejo", ["whatsapp supermercado", "marketing varejo"]),
  niche("WhatsApp Marketing para Óticas e Oftalmologia", ["whatsapp ótica", "marketing oftalmológico"]),
  niche("WhatsApp Marketing para Indústrias e Fábricas", ["whatsapp indústria", "marketing industrial"]),
  niche("WhatsApp Marketing para Agronegócio", ["whatsapp agronegócio", "marketing rural"]),
  niche("WhatsApp Marketing para Oficinas Mecânicas", ["whatsapp oficina", "marketing automotivo oficina"]),
  niche("WhatsApp Marketing para Fotógrafos e Videomakers", ["whatsapp fotógrafo", "marketing fotografia"]),
  niche("WhatsApp Marketing para Arquitetos e Designers de Interiores", ["whatsapp arquiteto", "marketing arquitetura"]),
  niche("WhatsApp Marketing para Clínicas de Estética", ["whatsapp estética", "marketing estética"]),
];

// ── CLUSTER 5: Caixa de Entrada (20 satélites) ──
const CI_SLUG = "caixa-de-entrada-integrada-centralizar-atendimento-whatsapp";
const CLUSTER_INBOX: Topic[] = [
  sat("Caixa de Entrada WhatsApp para Equipe: Multi Atendimento", "Caixa de Entrada", CI_SLUG, ["caixa entrada equipe whatsapp", "multi atendimento"]),
  sat("CRM para WhatsApp: Como Integrar Vendas e Atendimento", "Caixa de Entrada", CI_SLUG, ["CRM whatsapp", "integrar CRM whatsapp"]),
  sat("Centralizar Atendimento WhatsApp: Múltiplos Atendentes", "Caixa de Entrada", CI_SLUG, ["centralizar whatsapp", "múltiplos atendentes"]),
  sat("Como Organizar Conversas do WhatsApp por Prioridade", "Caixa de Entrada", CI_SLUG, ["organizar conversas whatsapp", "prioridade atendimento"]),
  sat("Atendimento WhatsApp para Equipes de Vendas", "Caixa de Entrada", CI_SLUG, ["atendimento whatsapp vendas", "equipe vendas whatsapp"]),
  sat("Como Transferir Conversas entre Atendentes no WhatsApp", "Caixa de Entrada", CI_SLUG, ["transferir conversa whatsapp", "roteamento whatsapp"]),
  sat("Tempo de Resposta WhatsApp: Como Reduzir e Aumentar Vendas", "Caixa de Entrada", CI_SLUG, ["tempo resposta whatsapp", "SLA whatsapp"]),
  sat("Etiquetas e Tags no WhatsApp: Organizar Leads", "Caixa de Entrada", CI_SLUG, ["etiquetas whatsapp", "tags leads whatsapp"]),
  sat("Dashboard de Atendimento WhatsApp: Métricas Essenciais", "Caixa de Entrada", CI_SLUG, ["dashboard whatsapp", "métricas atendimento"]),
  sat("Como Gerenciar Múltiplos Números de WhatsApp", "Caixa de Entrada", CI_SLUG, ["múltiplos números whatsapp", "gerenciar whatsapp"]),
  sat("Integrar WhatsApp com CRM: Passo a Passo", "Caixa de Entrada", CI_SLUG, ["integrar whatsapp CRM", "CRM integração"]),
  sat("Histórico de Conversas WhatsApp: Por que é Importante", "Caixa de Entrada", CI_SLUG, ["histórico conversas whatsapp", "backup whatsapp"]),
  sat("SAC via WhatsApp: Como Estruturar o Atendimento", "Caixa de Entrada", CI_SLUG, ["SAC whatsapp", "suporte whatsapp"]),
  sat("Respostas Rápidas WhatsApp: Aumentar Produtividade", "Caixa de Entrada", CI_SLUG, ["respostas rápidas whatsapp", "atalhos whatsapp"]),
  sat("Como Usar WhatsApp para Suporte ao Cliente", "Caixa de Entrada", CI_SLUG, ["suporte cliente whatsapp", "helpdesk whatsapp"]),
  sat("Caixa de Entrada Unificada: WhatsApp + Email + Instagram", "Caixa de Entrada", CI_SLUG, ["caixa entrada unificada", "omnichannel"]),
  sat("Como Medir Satisfação do Cliente via WhatsApp", "Caixa de Entrada", CI_SLUG, ["satisfação cliente whatsapp", "NPS whatsapp"]),
  sat("Automação de Atendimento WhatsApp: Boas Práticas", "Caixa de Entrada", CI_SLUG, ["automação atendimento whatsapp", "bot atendimento"]),
  sat("Como Escalar Atendimento WhatsApp Sem Perder Qualidade", "Caixa de Entrada", CI_SLUG, ["escalar atendimento whatsapp", "crescer whatsapp"]),
  sat("Relatórios de Atendimento WhatsApp: O que Acompanhar", "Caixa de Entrada", CI_SLUG, ["relatórios whatsapp", "analytics atendimento"]),
];

// ── CLUSTER 6: IA no WhatsApp (30 satélites) ──
const IA_SLUG = "inteligencia-artificial-no-whatsapp-chatbot-automacao-e-vendas";
const CLUSTER_IA: Topic[] = [
  sat("Agente de IA para WhatsApp: Como Funciona", "IA WhatsApp", IA_SLUG, ["agente IA whatsapp", "IA whatsapp"]),
  sat("Chatbot WhatsApp Inteligente: Além das Respostas Prontas", "IA WhatsApp", IA_SLUG, ["chatbot inteligente whatsapp", "chatbot IA"]),
  sat("Atendimento 24/7 com IA no WhatsApp", "IA WhatsApp", IA_SLUG, ["atendimento 24/7 whatsapp", "IA 24 horas"]),
  sat("Automação com IA WhatsApp: Casos de Uso Reais", "IA WhatsApp", IA_SLUG, ["automação IA whatsapp", "casos de uso IA"]),
  sat("Como Usar IA para Qualificar Leads no WhatsApp", "IA WhatsApp", IA_SLUG, ["qualificar leads IA", "lead scoring IA"]),
  sat("Chatbot para WhatsApp: Vale a Pena para Pequenas Empresas?", "IA WhatsApp", IA_SLUG, ["chatbot pequenas empresas", "chatbot custo benefício"]),
  sat("Ferramentas de IA Grátis para Equipes de Vendas", "IA WhatsApp", IA_SLUG, ["IA grátis vendas", "ferramentas IA vendas"]),
  sat("Como Treinar um Chatbot de Vendas para seu Negócio", "IA WhatsApp", IA_SLUG, ["treinar chatbot", "chatbot personalizado"]),
  sat("IA para Geração de Mensagens de Vendas no WhatsApp", "IA WhatsApp", IA_SLUG, ["IA mensagens vendas", "copywriting IA"]),
  sat("Como a IA Melhora a Taxa de Resposta no WhatsApp", "IA WhatsApp", IA_SLUG, ["IA taxa resposta", "melhorar resposta whatsapp"]),
  sat("Chatbot WhatsApp para Agendamento Automático", "IA WhatsApp", IA_SLUG, ["chatbot agendamento", "agendar IA whatsapp"]),
  sat("IA para Análise de Sentimento nas Conversas WhatsApp", "IA WhatsApp", IA_SLUG, ["análise sentimento whatsapp", "IA sentimento"]),
  sat("Como Usar GPT no WhatsApp para Vendas", "IA WhatsApp", IA_SLUG, ["GPT whatsapp", "ChatGPT vendas"]),
  sat("IA para Personalização de Mensagens em Escala", "IA WhatsApp", IA_SLUG, ["personalização IA", "mensagens personalizadas IA"]),
  sat("Chatbot WhatsApp para Captação de Leads", "IA WhatsApp", IA_SLUG, ["chatbot captação leads", "bot leads whatsapp"]),
  sat("IA para Previsão de Vendas e Pipeline", "IA WhatsApp", IA_SLUG, ["IA previsão vendas", "forecast IA"]),
  sat("Como Criar Respostas Automáticas Inteligentes no WhatsApp", "IA WhatsApp", IA_SLUG, ["respostas automáticas IA", "smart replies"]),
  sat("IA para E-mail Marketing: Otimizar Assuntos e Copy", "IA WhatsApp", IA_SLUG, ["IA email marketing", "IA copywriting email"]),
  sat("Como a IA Reduz Custo de Atendimento ao Cliente", "IA WhatsApp", IA_SLUG, ["IA reduzir custo", "automação custo"]),
  sat("Chatbot WhatsApp Multilíngue: Atender em Vários Idiomas", "IA WhatsApp", IA_SLUG, ["chatbot multilíngue", "whatsapp idiomas"]),
  sat("IA para Identificar Leads Quentes Automaticamente", "IA WhatsApp", IA_SLUG, ["leads quentes IA", "scoring automático"]),
  sat("IA no WhatsApp para Cobranças e Lembretes Automáticos", "IA WhatsApp", IA_SLUG, ["IA cobrança whatsapp", "lembrete automático"]),
  sat("Como Integrar IA com CRM para Vendas Inteligentes", "IA WhatsApp", IA_SLUG, ["IA CRM", "vendas inteligentes"]),
  sat("Chatbot para FAQ: Automatizar Perguntas Frequentes", "IA WhatsApp", IA_SLUG, ["chatbot FAQ", "FAQ automático"]),
  sat("IA para Criação de Conteúdo de Vendas", "IA WhatsApp", IA_SLUG, ["IA conteúdo vendas", "criar conteúdo IA"]),
  sat("O Futuro do Atendimento: IA + Humano no WhatsApp", "IA WhatsApp", IA_SLUG, ["futuro atendimento IA", "híbrido IA humano"]),
  sat("IA para Otimizar Campanhas de WhatsApp Marketing", "IA WhatsApp", IA_SLUG, ["IA campanhas whatsapp", "otimizar campanhas"]),
  sat("Como Medir ROI de um Chatbot com IA no WhatsApp", "IA WhatsApp", IA_SLUG, ["ROI chatbot", "medir chatbot"]),
  sat("IA para Segmentação Automática de Leads", "IA WhatsApp", IA_SLUG, ["segmentação IA", "auto segmentação"]),
  sat("Tendências de IA para Vendas em 2026", "IA WhatsApp", IA_SLUG, ["tendências IA vendas", "IA 2026"]),
];

// ── TRANSACTIONAL PAGES (20) ──
const CLUSTER_TRANSACIONAL: Topic[] = [
  transactional("Ferramenta de Disparo WhatsApp: Comparativo Completo 2026", ["ferramenta disparo whatsapp", "software disparo whatsapp"]),
  transactional("Software de Disparo WhatsApp Profissional: Qual Escolher", ["software disparo whatsapp", "disparo profissional"]),
  transactional("Melhor Plataforma de WhatsApp Marketing em 2026", ["melhor plataforma whatsapp marketing", "plataforma whatsapp"]),
  transactional("Sistema de Disparo WhatsApp Profissional com CRM", ["sistema disparo whatsapp", "disparo com CRM"]),
  transactional("Automação WhatsApp Preço: Quanto Custa em 2026", ["automação whatsapp preço", "custo automação"]),
  transactional("Plataforma WhatsApp com CRM Integrado", ["plataforma whatsapp CRM", "CRM integrado whatsapp"]),
  transactional("Disparo WhatsApp com Número Próprio: Guia Completo", ["disparo número próprio", "whatsapp número próprio"]),
  transactional("Ferramenta para Buscar Leads por CNAE e Localização", ["ferramenta buscar leads", "buscar leads CNAE"]),
  transactional("Software de Prospecção B2B: Comparativo 2026", ["software prospecção B2B", "ferramenta prospecção"]),
  transactional("CRM com WhatsApp: As Melhores Opções do Mercado", ["CRM com whatsapp", "CRM whatsapp integrado"]),
  transactional("Chatbot WhatsApp com IA: Ferramentas e Preços", ["chatbot whatsapp IA preço", "ferramenta chatbot"]),
  transactional("Ferramenta de Follow Up Automático para Vendas", ["ferramenta follow up", "software follow up"]),
  transactional("Plataforma de Email Marketing com WhatsApp Integrado", ["email marketing whatsapp", "plataforma integrada"]),
  transactional("Software de Automação de Vendas para PMEs", ["software automação vendas", "automação PME"]),
  transactional("Ferramenta de Captura de Leads pelo Google Maps", ["captura leads google maps", "ferramenta google maps"]),
  transactional("Pipeline de Vendas Kanban: Melhores Ferramentas", ["pipeline kanban", "CRM kanban"]),
  transactional("Plataforma de Disparo WhatsApp + Email Marketing", ["disparo whatsapp email", "plataforma multicanal"]),
  transactional("Software de Gestão de Leads: Comparativo Completo", ["software gestão leads", "gestão leads"]),
  transactional("Ferramenta de Criação de Grupos WhatsApp em Massa", ["criar grupos whatsapp massa", "ferramenta grupos"]),
  transactional("Widget de Captação de Leads para Site: Comparativo", ["widget captação leads", "ferramenta widget"]),
];

// ── INTERNATIONAL PAGES (10) ──
const CLUSTER_INTERNACIONAL: Topic[] = [
  international("Disparo WhatsApp Brasil: Regras, Estratégias e Ferramentas", ["disparo whatsapp brasil", "whatsapp marketing brasil"]),
  international("Disparo WhatsApp Portugal: Como Prospectar no Mercado Português", ["disparo whatsapp portugal", "whatsapp marketing portugal"]),
  international("Disparo WhatsApp México: Estratégias para o Mercado Mexicano", ["disparo whatsapp méxico", "whatsapp marketing méxico"]),
  international("WhatsApp Marketing nos Estados Unidos: Oportunidades e Desafios", ["whatsapp marketing EUA", "whatsapp USA"]),
  international("Disparo WhatsApp Espanha: Como Entrar no Mercado Espanhol", ["disparo whatsapp espanha", "whatsapp marketing espanha"]),
  international("Disparo WhatsApp Argentina: Prospecção no Mercado Argentino", ["disparo whatsapp argentina", "whatsapp marketing argentina"]),
  international("Disparo WhatsApp Chile: Estratégias para o Mercado Chileno", ["disparo whatsapp chile", "whatsapp marketing chile"]),
  international("Disparo WhatsApp Colômbia: Oportunidades na América Latina", ["disparo whatsapp colômbia", "whatsapp marketing colômbia"]),
  international("WhatsApp Marketing na África: Oportunidades Emergentes", ["whatsapp marketing áfrica", "whatsapp business africa"]),
  international("WhatsApp Marketing Global: Como Escalar Internacionalmente", ["whatsapp marketing global", "escalar whatsapp internacional"]),
];

// ── ALL TOPICS combined ──
const ALL_TOPICS: Topic[] = [
  PILLAR_MASTER,
  ...PILLARS_SECONDARY,
  ...CLUSTER_DISPARO,
  ...CLUSTER_FOLLOWUP,
  ...CLUSTER_BUSCA,
  ...CLUSTER_NICHOS,
  ...CLUSTER_INBOX,
  ...CLUSTER_IA,
  ...CLUSTER_TRANSACIONAL,
  ...CLUSTER_INTERNACIONAL,
];

// ── Utility ──
function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 100);
}

/** Build prompt based on page type */
function buildPrompt(topic: Topic, existingTitles: string[]): string {
  const interlinkInstructions = topic.parent_slug
    ? `\n- OBRIGATÓRIO: inclua pelo menos 2 links internos em Markdown:\n  - Link para o pilar pai: [texto relevante](/blog/${topic.parent_slug})\n  - Link para a página de checkout: [começar agora](/checkout)\n  - Se possível, link para artigos relacionados do cluster`
    : `\n- OBRIGATÓRIO: inclua links internos para os artigos dos clusters:\n  - [disparo em massa](/blog/${DM_SLUG})\n  - [follow up automático](/blog/${FU_SLUG})\n  - [busca de leads](/blog/${BL_SLUG})\n  - [whatsapp para nichos](/blog/whatsapp-marketing-por-nicho-estrategias-que-funcionam)\n  - [caixa de entrada](/blog/${CI_SLUG})\n  - [IA no WhatsApp](/blog/${IA_SLUG})`;

  const typeInstructions: Record<string, string> = {
    pillar_master: `Este é um ARTIGO PILAR MASTER — deve ter pelo menos 3000 palavras, ser extremamente completo e abrangente, cobrindo TODOS os aspectos do tema. Use H2 para cada grande seção e H3 para subtópicos. Inclua estatísticas, exemplos reais e cases.`,
    pillar_secondary: `Este é um PILAR SECUNDÁRIO — deve ter pelo menos 2000 palavras, ser bem detalhado e linkar para artigos satélite do cluster.`,
    satellite: `Este é um artigo SATÉLITE — deve ter pelo menos 1200 palavras com foco em uma palavra-chave específica. Conteúdo prático e direto.`,
    niche: `Esta é uma PÁGINA NICHADA — deve ter pelo menos 1500 palavras focando nos problemas específicos do nicho, incluindo um case fictício detalhado de como uma empresa desse segmento usou o LeadsPro para crescer. CTA forte.`,
    transactional: `Esta é uma PÁGINA TRANSACIONAL — deve ter pelo menos 1500 palavras com foco total em conversão. Inclua comparativos, features, preços e vantagens do LeadsPro. CTA agressivo. Fale como se o leitor estivesse prestes a comprar.`,
    international: `Esta é uma PÁGINA INTERNACIONAL — deve ter pelo menos 1500 palavras adaptada ao mercado do país mencionado. Inclua particularidades culturais, regulação local e oportunidades específicas.`,
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long" });

  // Show recent titles to avoid repetition
  const recentTitlesStr = existingTitles.length > 0
    ? `\n\nARTIGOS JÁ PUBLICADOS (NÃO repita estes títulos nem abordagens similares):\n${existingTitles.slice(0, 30).map(t => `- ${t}`).join("\n")}`
    : "";

  return `Você é um redator SEO especialista em marketing digital, prospecção B2B e vendas pelo WhatsApp no Brasil.

A data de hoje é ${currentMonth} de ${currentYear}. Escreva um artigo ATUALIZADO e relevante para o cenário ATUAL.

Escreva um artigo completo de blog sobre: "${topic.title}"

Tipo de página: ${topic.page_type}
${typeInstructions[topic.page_type] || ""}

Palavras-chave alvo: ${topic.keywords.join(", ")}
${recentTitlesStr}

Regras CRÍTICAS para SEO e ranqueamento no Google:
- O TÍTULO deve ser ÚNICO e DIFERENTE de todos os artigos já publicados listados acima
- O título DEVE conter a palavra-chave principal mas com um ângulo/abordagem ORIGINAL
- NÃO use "Guia Definitivo" ou "Guia Completo" se já existem artigos com esses termos
- Use ângulos criativos: "X Estratégias", "Passo a Passo", "Erros que...", "Como [resultado específico]", "Por que...", "[Número] Dicas", "O Segredo de..."
- Título SEO otimizado com palavra-chave principal no INÍCIO (máx 70 caracteres)
- Meta description com call-to-action e palavra-chave (150-160 caracteres)
- Excerpt/resumo com 2-3 frases (máx 300 caracteres)
- Conteúdo em Markdown com pelo menos ${topic.min_words} palavras
- Use H2 (máx 8) e H3 para estruturar — inclua a palavra-chave em pelo menos 2 H2
- PRIMEIRA frase do artigo DEVE conter a palavra-chave principal
- Inclua dados estatísticos recentes de ${currentYear}, tendências atuais e referências reais
- Mencione ferramentas, estratégias e novidades do mercado de ${currentYear}
- Inclua listas numeradas, bullet points, dicas práticas e exemplos reais do mercado brasileiro
- Mencione a LeadsPro naturalmente como solução (máx 3 vezes no artigo)${interlinkInstructions}
- Tom: profissional mas acessível, como um consultor de vendas experiente
- Palavras-chave: use variações long-tail e sinônimos naturalmente ao longo do texto
- Use perguntas como H2/H3 para capturar featured snippets do Google
- Termine com FAQ (3-5 perguntas) seguido de CTA para experimentar a LeadsPro
- Categoria: ${topic.cluster}
- Tempo de leitura estimado

Responda usando estes delimitadores EXATOS (NÃO use JSON):

---TITLE---
Título SEO do artigo (ÚNICO, diferente de todos os listados acima)
---META_DESCRIPTION---
Meta description de 150-160 chars
---EXCERPT---
Resumo de 2-3 frases
---READ_TIME---
X min
---CONTENT---
Conteúdo completo em Markdown aqui`;
}

/** Generate hero image via OpenAI DALL-E */
async function generateHeroImage(title: string, category: string): Promise<string | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) { console.error("OPENAI_API_KEY not set, skipping hero image"); return null; }
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A professional, modern 16:9 blog hero image for "${title}" in category "${category}". Clean, corporate, tech/digital marketing aesthetic. Blue and green tones. No text or letters. Ultra high resolution. Professional stock photo style.`,
        n: 1,
        size: "1792x1024",
        response_format: "b64_json",
      }),
    });
    if (!res.ok) { console.error("DALL-E error:", res.status, await res.text()); return null; }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;
  } catch (e) { console.error("Image error:", e.message); return null; }
}

/** Upload base64 image to storage */
async function uploadHeroImage(supabase: any, slug: string, base64DataUrl: string): Promise<string | null> {
  try {
    const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1];
    const binaryStr = atob(matches[2]);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const filePath = `heroes/${slug}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(filePath, bytes, { contentType: `image/${ext}`, upsert: true });
    if (error) { console.error("Upload error:", error.message); return null; }
    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  } catch (e) { console.error("Upload error:", e.message); return null; }
}

/** Call AI for text content — OpenAI only */
async function callAI(prompt: string, openaiApiKey: string | undefined): Promise<string> {
  if (!openaiApiKey) throw new Error("OPENAI_API_KEY not available");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.8 }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`OpenAI error ${res.status}: ${t}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let articleCount = 1;
    let skipImages = true;
    let forceCluster: string | null = null;
    try {
      const body = await req.json();
      if (body?.count && Number(body.count) >= 1 && Number(body.count) <= 20) articleCount = Number(body.count);
      if (body?.skip_images === false) skipImages = false;
      if (body?.cluster) forceCluster = body.cluster;
    } catch { /* default: 1 article, no images for speed */ }

    // Get existing slugs AND titles (for dedup and prompt context)
    const { data: existingPosts } = await supabase.from("blog_posts").select("slug, title").order("published_at", { ascending: false });
    const existingSlugs = new Set((existingPosts || []).map((p: any) => p.slug));
    const existingTitles = (existingPosts || []).map((p: any) => p.title as string);

    // Filter available topics — use TOPIC title slug for dedup (not AI-generated title)
    const priority: Record<string, number> = { pillar_master: 0, pillar_secondary: 1, transactional: 2, niche: 3, international: 4, satellite: 5 };
    let availableTopics = ALL_TOPICS
      .filter((t) => !existingSlugs.has(slugify(t.title)))
      .sort((a, b) => (priority[a.page_type] ?? 99) - (priority[b.page_type] ?? 99));

    // Filter by cluster if requested
    if (forceCluster) {
      availableTopics = availableTopics.filter((t) => t.cluster === forceCluster);
    }

    if (availableTopics.length === 0) {
      return new Response(JSON.stringify({ message: forceCluster ? `All topics in cluster "${forceCluster}" exhausted` : "All 307 topics exhausted" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Round-robin: count existing articles per cluster, pick from the cluster with fewest
    const { data: clusterCounts } = await supabase.from("blog_posts").select("cluster");
    const countByCluster: Record<string, number> = {};
    for (const r of (clusterCounts || [])) { countByCluster[r.cluster] = (countByCluster[r.cluster] || 0) + 1; }

    // Sort available topics: prefer clusters with fewer existing articles
    availableTopics.sort((a, b) => {
      const pa = priority[a.page_type] ?? 99;
      const pb = priority[b.page_type] ?? 99;
      if (pa !== pb) return pa - pb; // pillar types first
      const ca = countByCluster[a.cluster] || 0;
      const cb = countByCluster[b.cluster] || 0;
      return ca - cb; // then least-populated cluster first
    });

    const selectedTopics = availableTopics.slice(0, articleCount);
    const results = [];

    for (const topic of selectedTopics) {
      // Use TOPIC slug as the canonical slug (prevents AI title variations creating duplicates)
      const canonicalSlug = slugify(topic.title);

      const prompt = buildPrompt(topic, existingTitles);
      // Resilience: a single OpenAI failure (e.g. 429/quota) shouldn't abort
      // the whole batch — catch, log, and continue with the next topic.
      let rawContent: string;
      try {
        rawContent = await callAI(prompt, openaiApiKey);
      } catch (err: any) {
        console.error(`callAI failed for "${topic.title}":`, err?.message || err);
        results.push({ slug: canonicalSlug, status: "skipped", reason: String(err?.message || err) });
        continue;
      }

      const raw = rawContent.trim();
      
      // Try delimiter parsing first
      const extract = (tag: string): string => {
        const re = new RegExp(`-{2,}\\s*${tag}\\s*-{2,}\\s*([\\s\\S]*?)(?=-{2,}\\s*[A-Z_]+\\s*-{2,}|$)`);
        const m = raw.match(re);
        return m ? m[1].trim() : "";
      };
      
      let article: any = null;
      const titleD = extract("TITLE");
      const contentD = extract("CONTENT");
      
      if (titleD && contentD && contentD.length > 200) {
        article = { title: titleD, meta_description: extract("META_DESCRIPTION"), excerpt: extract("EXCERPT"), read_time: extract("READ_TIME") || "7 min", content: contentD };
      } else {
        // Fallback: try JSON parse
        let jsonStr = raw.replace(/^```(?:json)?\s*/gis, "").replace(/\s*```\s*$/gis, "");
        const fb = jsonStr.indexOf("{");
        if (fb !== -1) {
          jsonStr = jsonStr.substring(fb);
          for (let i = jsonStr.length; i > 0; i--) {
            if (jsonStr[i - 1] === "}") {
              try { article = JSON.parse(jsonStr.substring(0, i)); break; } catch { /* next */ }
            }
          }
        }
      }
      
      if (!article || !(article.content || "").length) { console.error("No parseable content for:", topic.title, "raw length:", raw.length, "first 100:", raw.substring(0, 100)); continue; }

      // Use canonical slug from topic title (not AI-generated title)
      if (existingSlugs.has(canonicalSlug)) { console.log(`Slug ${canonicalSlug} exists, skip`); continue; }

      // Generate hero image (skip if bulk mode)
      let heroImageUrl: string | null = null;
      if (!skipImages) {
        const base64 = await generateHeroImage(article.title || topic.title, topic.cluster);
        if (base64) heroImageUrl = await uploadHeroImage(supabase, canonicalSlug, base64);
      }

      // Count words
      const wordCount = (article.content || "").split(/\s+/).filter(Boolean).length;

      const { error } = await supabase.from("blog_posts").insert({
        slug: canonicalSlug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: topic.cluster,
        read_time: article.read_time || "7 min",
        meta_description: article.meta_description,
        hero_image_url: heroImageUrl,
        published_at: new Date().toISOString(),
        page_type: topic.page_type,
        parent_slug: topic.parent_slug,
        cluster: topic.cluster,
        keywords: topic.keywords,
        word_count: wordCount,
      });

      if (error) { console.error("Insert error:", error); continue; }

      existingSlugs.add(canonicalSlug);
      existingTitles.unshift(article.title); // Add to context for next article in batch
      results.push({ slug: canonicalSlug, title: article.title, page_type: topic.page_type, cluster: topic.cluster, word_count: wordCount, has_image: !!heroImageUrl });
    }

    if (results.length > 0) {
      console.log(`✅ ${results.length} artigo(s) criado(s):`, JSON.stringify(results.map(r => r.slug)));
    }

    return new Response(
      JSON.stringify({ success: true, articles_created: results.length, total_remaining: availableTopics.length - results.length, articles: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
