/**
 * Auto Internal Linking System
 * Detects keyword mentions in blog content and injects internal links
 * to pillar pages, resource pages, and the glossary.
 */

interface LinkMapping {
  keyword: string;
  url: string;
  title: string;
}

const INTERNAL_LINKS: LinkMapping[] = [
  // Resource pages (money pages)
  { keyword: "busca inteligente", url: "/recursos/busca", title: "Busca Inteligente de Leads" },
  { keyword: "busca de leads", url: "/recursos/busca", title: "Busca de Leads" },
  { keyword: "capturar leads", url: "/recursos/busca", title: "Captura de Leads" },
  { keyword: "captura de leads", url: "/recursos/busca", title: "Captura de Leads" },
  { keyword: "extrair dados", url: "/recursos/busca", title: "Extração de Dados" },
  { keyword: "google maps", url: "/recursos/busca", title: "Busca no Google Maps" },
  { keyword: "crm de vendas", url: "/recursos/crm", title: "CRM de Vendas" },
  { keyword: "crm completo", url: "/recursos/crm", title: "CRM Completo" },
  { keyword: "gestão de leads", url: "/recursos/crm", title: "Gestão de Leads" },
  { keyword: "disparo em massa", url: "/recursos/disparo", title: "Disparo em Massa no WhatsApp" },
  { keyword: "disparo whatsapp", url: "/recursos/disparo", title: "Disparo WhatsApp" },
  { keyword: "mensagem em massa", url: "/recursos/disparo", title: "Mensagem em Massa" },
  { keyword: "campanhas whatsapp", url: "/recursos/disparo", title: "Campanhas WhatsApp" },
  { keyword: "envio em massa", url: "/recursos/disparo", title: "Envio em Massa" },
  { keyword: "follow-up automático", url: "/recursos/followup", title: "Follow-up Automático" },
  { keyword: "follow-up", url: "/recursos/followup", title: "Follow-up Automático" },
  { keyword: "followup", url: "/recursos/followup", title: "Follow-up Automático" },
  { keyword: "sequência automática", url: "/recursos/followup", title: "Sequência Automática" },
  { keyword: "chatbot ia", url: "/recursos/chatbot-ia", title: "Chatbot IA 24/7" },
  { keyword: "chatbot whatsapp", url: "/recursos/chatbot-ia", title: "Chatbot WhatsApp" },
  { keyword: "chatbot inteligente", url: "/recursos/chatbot-ia", title: "Chatbot Inteligente" },
  { keyword: "atendimento automático", url: "/recursos/chatbot-ia", title: "Atendimento Automático" },
  { keyword: "caixa de entrada", url: "/recursos/caixa-de-entrada", title: "Caixa de Entrada WhatsApp" },
  { keyword: "pipeline de vendas", url: "/recursos/pipeline", title: "Pipeline de Vendas" },
  { keyword: "funil de vendas", url: "/recursos/pipeline", title: "Funil de Vendas" },
  { keyword: "kanban", url: "/recursos/pipeline", title: "Pipeline Kanban" },
  { keyword: "email marketing", url: "/recursos/email-marketing", title: "Email Marketing" },
  { keyword: "cold email", url: "/recursos/email-marketing", title: "Email Marketing" },
  { keyword: "importação", url: "/recursos/importacao", title: "Importação em Massa" },
  { keyword: "importar planilha", url: "/recursos/importacao", title: "Importação de Planilhas" },
  { keyword: "listas personalizadas", url: "/recursos/listas", title: "Listas Personalizadas" },
  { keyword: "listas de leads", url: "/recursos/listas", title: "Listas de Leads" },
  { keyword: "widget de captura", url: "/recursos/widget", title: "Widget de Captura" },
  { keyword: "estatísticas", url: "/recursos/estatisticas", title: "Estatísticas e Relatórios" },
  { keyword: "qr code", url: "/recursos/instancia", title: "Integração via QR Code" },
  { keyword: "criar grupos", url: "/recursos/criar-grupos", title: "Criação de Grupos WhatsApp" },
  { keyword: "anti-ban", url: "/recursos/disparo", title: "Proteção Anti-Banimento" },
  { keyword: "anti-banimento", url: "/recursos/disparo", title: "Proteção Anti-Banimento" },
  { keyword: "prospecção b2b", url: "/recursos/busca", title: "Prospecção B2B" },
  { keyword: "prospecção ativa", url: "/recursos/busca", title: "Prospecção Ativa" },
  // Blog hub categories
  { keyword: "automação de vendas", url: "/blog/categoria/automacao-vendas", title: "Automação de Vendas" },
  { keyword: "automação comercial", url: "/blog/categoria/automacao-vendas", title: "Automação Comercial" },
  // Glossary
  { keyword: "cnae", url: "/glossario#cnae", title: "O que é CNAE" },
];

/**
 * Injects internal links into markdown content.
 * Rules:
 * - Only links the FIRST occurrence of each keyword
 * - Never links inside headings (#, ##, ###)
 * - Never links inside existing markdown links [text](url)
 * - Max 5 internal links per article to avoid over-optimization
 */
export function injectInternalLinks(content: string): string {
  let linkedCount = 0;
  const maxLinks = 5;
  const usedUrls = new Set<string>();
  let result = content;

  for (const mapping of INTERNAL_LINKS) {
    if (linkedCount >= maxLinks) break;
    if (usedUrls.has(mapping.url)) continue;

    // Case-insensitive match, but not inside headings or existing links
    const regex = new RegExp(
      `(?<!#\\s)(?<!#\\s#\\s)(?<!\\[)(?<!\\]\\()\\b(${escapeRegex(mapping.keyword)})\\b(?![^\\[]*\\])(?![^(]*\\))`,
      "i"
    );

    const match = result.match(regex);
    if (match && match.index !== undefined) {
      // Check if it's inside a heading line
      const lineStart = result.lastIndexOf("\n", match.index) + 1;
      const lineContent = result.substring(lineStart, match.index + match[0].length);
      if (lineContent.trimStart().startsWith("#")) continue;

      const original = match[1];
      const link = `[${original}](${mapping.url} "${mapping.title}")`;
      result = result.substring(0, match.index) + link + result.substring(match.index + match[0].length);
      linkedCount++;
      usedUrls.add(mapping.url);
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
