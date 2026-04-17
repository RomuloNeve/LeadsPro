import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Database, Filter, Download, Tag, Copy, Search, Phone, Mail, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureCRM = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "CRM de Vendas com WhatsApp Integrado | LeadsPro",
    description: "Gerencie seus leads em um CRM completo com filtros, categorias, exportação CSV e integração direta com WhatsApp. Organize e converta mais clientes.",
    canonicalUrl: "https://leadspro.app/recursos/crm",
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
              <Database className="h-3.5 w-3.5 mr-2" /> CRM
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Gestão completa de <span className="gradient-text">leads</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Todos os seus leads organizados em um único painel. Filtre, busque, exporte e gerencie sua base com facilidade — sem planilhas confusas, sem ferramentas externas.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📋 Sua base de leads organizada</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              A tela de <strong>Seus Leads</strong> exibe todos os leads capturados em uma tabela completa com <strong>Categoria</strong>, <strong>Nome</strong>, <strong>Telefone</strong>, <strong>E-mail</strong>, <strong>Instagram</strong>, <strong>Site</strong>, <strong>LinkedIn</strong> e <strong>Data de captura</strong>. Use as abas <strong>Únicos</strong> e <strong>Duplicatas</strong> para separar leads novos dos repetidos. A barra de busca e o filtro por categoria ajudam a encontrar qualquer lead em segundos. Os botões <strong>Exportar</strong> (CSV) e <strong>Excluir Tudo</strong> estão sempre acessíveis no topo. Cada link de e-mail, Instagram, site e LinkedIn é clicável, levando direto ao perfil ou página do lead.
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center h-48 sm:h-64">
              <Database className="h-16 w-16 sm:h-24 sm:w-24 text-primary/40" strokeWidth={1} />
            </div>
          </motion.div>

          {/* Bulk Import */}
          <motion.div variants={fadeUp} custom={3.5} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📤 Importação em Massa</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              Traga todos os seus leads de uma vez! Com a <strong>Importação em Massa</strong>, basta arrastar um arquivo <strong>.xlsx</strong>, <strong>.xls</strong> ou <strong>.csv</strong> para o sistema. O mapeamento de colunas é automático — o sistema reconhece variações como "Categoria", "Nome", "Telefone", "Email", "Instagram", "Site" e "LinkedIn". O único campo obrigatório é <strong>Categoria</strong>. Antes de importar, você visualiza todos os leads na pré-visualização e confirma com um clique. Os leads são enviados em lotes de 100 para máxima performance.
            </p>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: Upload, title: "Drag & Drop", desc: "Arraste seu arquivo direto para o modal — sem complicação." },
                { icon: Filter, title: "Mapeamento inteligente", desc: "Reconhece automaticamente nomes de colunas em português e inglês." },
                { icon: Search, title: "Pré-visualização", desc: "Confira todos os dados antes de importar para evitar erros." },
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

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={4} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Filter, title: "Filtros avançados", desc: "Filtre por categoria, data e duplicatas. Encontre qualquer lead em segundos." },
              { icon: Download, title: "Exportação CSV", desc: "Exporte todos os seus leads para planilhas com um clique." },
              { icon: Tag, title: "Categorização automática", desc: "Cada lead é categorizado pelo tipo de negócio automaticamente." },
              { icon: Copy, title: "Detecção de duplicatas", desc: "O sistema identifica e separa leads duplicados para manter sua base limpa." },
              { icon: Search, title: "Busca instantânea", desc: "Pesquise por nome, telefone, e-mail ou qualquer campo." },
              { icon: Mail, title: "Links clicáveis", desc: "E-mail, Instagram, LinkedIn e site são links diretos para acesso rápido." },
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

export default FeatureCRM;
