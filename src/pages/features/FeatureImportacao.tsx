import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, Filter, Search, FileSpreadsheet, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FeatureImportacao = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Importação de Leads via Planilha Excel e CSV | LeadsPro",
    description: "Importe leads em massa via planilha Excel ou CSV. Detecção automática de duplicados, filtros inteligentes e integração direta com o CRM.",
    canonicalUrl: "https://leadspro.app/recursos/importacao",
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
              <Upload className="h-3.5 w-3.5 mr-2" /> Importação em Massa
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Traga todos os seus leads <span className="gradient-text">de uma vez</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Já tem uma planilha com centenas ou milhares de leads? Importe tudo com um único clique. Basta arrastar seu arquivo Excel ou CSV e o sistema cuida do resto — mapeamento automático de colunas, validação e envio em lotes de alta performance.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={2.5} className="mb-16">
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center h-48 sm:h-64">
              <Upload className="h-16 w-16 sm:h-24 sm:w-24 text-primary/40" strokeWidth={1} />
            </div>
          </motion.div>

          {/* How it works */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">🚀 Como funciona</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Arraste o arquivo", desc: "Abra o modal de importação e arraste seu .xlsx, .xls ou .csv direto para a área de upload." },
                { step: "2", title: "Confira a prévia", desc: "O sistema mapeia as colunas automaticamente e mostra uma pré-visualização dos leads antes de importar." },
                { step: "3", title: "Importe com 1 clique", desc: "Confirme e todos os leads são enviados em lotes de 100 para máxima velocidade." },
              ].map((s) => (
                <div key={s.step} className="relative p-6 rounded-2xl border border-border/60 bg-card">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold font-display text-foreground mb-2 mt-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Supported columns */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">📋 Colunas aceitas</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              O sistema reconhece automaticamente variações em <strong>português</strong> e <strong>inglês</strong>. Você pode usar "Categoria", "Category", "Nome", "Name", "Telefone", "Phone", "E-mail", "Email", "Instagram", "Insta", "Site", "Website", "URL", "LinkedIn" — o mapeamento é inteligente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className="gradient-bg text-primary-foreground border-0 px-4 py-2 text-sm">Categoria *</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Nome</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Telefone</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Email</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Instagram</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">Site</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">LinkedIn</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">* Único campo obrigatório. Linhas sem categoria são ignoradas automaticamente.</p>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={5} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: Upload, title: "Drag & Drop", desc: "Arraste seu arquivo direto para o modal — sem complicação, sem formulários." },
              { icon: Filter, title: "Mapeamento inteligente", desc: "Reconhece automaticamente nomes de colunas em português e inglês." },
              { icon: Search, title: "Pré-visualização", desc: "Confira todos os dados antes de importar para evitar erros." },
              { icon: FileSpreadsheet, title: "Múltiplos formatos", desc: "Suporte a .xlsx, .xls e .csv — traga leads de qualquer planilha." },
              { icon: Zap, title: "Upload em lotes", desc: "Importação otimizada em lotes de 100 leads para máxima performance." },
              { icon: ShieldCheck, title: "Validação automática", desc: "Leads sem categoria são filtrados automaticamente. Sem lixo na sua base." },
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

          <motion.div variants={fadeUp} custom={6} className="text-center">
            <Button size="lg" onClick={() => navigate("/auth?plan=free")} className="gradient-bg text-primary-foreground hover:opacity-90 text-lg px-10 h-14 glow-shadow group">
              Começar agora <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureImportacao;
