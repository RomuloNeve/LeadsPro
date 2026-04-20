import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, MessageCircle, Bell, Search, Send, Smartphone, Users, Mic, Image, FileText, Contact, BarChart3, MapPin, Play, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { FeaturePreview } from "@/components/FeaturePreview";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const messageTypes = [
  {
    icon: Mic,
    title: "Áudios (PTT)",
    desc: "Ouça os áudios direto no navegador com player integrado, barra de waveform e duração — igual no WhatsApp.",
    preview: (
      <div className="flex items-center gap-2 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl px-4 py-3 max-w-xs">
        <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-[2px] h-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-[2px] rounded-full bg-[#00a884]" style={{ height: `${3 + Math.abs(Math.sin(i * 0.7 + 1)) * 12}px` }} />
            ))}
          </div>
          <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">0:14</span>
        </div>
      </div>
    ),
  },
  {
    icon: Image,
    title: "Imagens e Vídeos",
    desc: "Visualize imagens e thumbnails de vídeos em alta qualidade direto na conversa, com legendas quando enviadas.",
    preview: (
      <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl overflow-hidden max-w-[200px]">
        <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center">
          <Image className="h-10 w-10 text-primary/60" />
        </div>
        <div className="px-3 py-1.5 flex justify-end">
          <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">18:35 ✓✓</span>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: "Documentos e Arquivos",
    desc: "PDFs, planilhas Excel, Word e outros arquivos aparecem com ícone colorido, nome do arquivo e tamanho.",
    preview: (
      <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl max-w-[240px]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-lg bg-[#22c55e] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">XLS</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#111b21] dark:text-[#e9edef]">leads.xlsx</p>
            <p className="text-[11px] text-[#667781] dark:text-[#8696a0]">XLS • 24 KB</p>
          </div>
        </div>
        <div className="px-3 py-1.5 flex justify-end border-t border-black/5">
          <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">18:35 ✓✓</span>
        </div>
      </div>
    ),
  },
  {
    icon: Contact,
    title: "Contatos (vCard)",
    desc: "Receba cartões de contato com nome, telefone e botão 'Conversar' para iniciar chat direto com o número.",
    preview: (
      <div className="bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl max-w-[220px]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-[#dfe5e7] dark:bg-[#2a3942] flex items-center justify-center">
            <Contact className="h-5 w-5 text-[#8696a0]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#111b21] dark:text-[#e9edef]">Lucas</p>
            <p className="text-[11px] text-[#667781] dark:text-[#8696a0]">+55 27 99801-3374</p>
          </div>
        </div>
        <div className="border-t border-black/10 dark:border-white/10 px-4 py-2 text-center">
          <span className="text-sm text-primary font-medium">Conversar</span>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Enquetes",
    desc: "Veja enquetes recebidas com o título e todas as opções de resposta diretamente na conversa.",
    preview: (
      <div className="bg-card rounded-xl max-w-[220px] border border-border/40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Qual horário?</span>
          </div>
          <div className="space-y-1.5">
            {["Manhã", "Tarde", "Noite"].map((opt) => (
              <div key={opt} className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">{opt}</div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: MapPin,
    title: "Localização",
    desc: "Mensagens de localização exibem o endereço e nome do local compartilhado, com ícone de mapa.",
    preview: (
      <div className="bg-card rounded-xl max-w-[220px] border border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-[#25d366]/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-[#25d366]" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Escritório</p>
            <p className="text-[11px] text-muted-foreground">Av. Paulista, 1000</p>
          </div>
        </div>
      </div>
    ),
  },
];

const FeatureInbox = () => {
  const navigate = useNavigate();

  useDocumentMeta({
    title: "Caixa de Entrada WhatsApp Integrada ao CRM | LeadsPro",
    description: "Receba e responda mensagens do WhatsApp direto no CRM. Áudio, imagem, vídeo e localização — tudo em uma caixa de entrada profissional.",
    canonicalUrl: "https://leadspro.app/recursos/caixa-de-entrada",
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
              <MessageCircle className="h-3.5 w-3.5 mr-2" /> Caixa de Entrada
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-[1.05] tracking-tight mb-6">
            Caixa de Entrada <span className="gradient-text">WhatsApp</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Visualize e responda todas as suas conversas do WhatsApp diretamente pelo sistema. Sem precisar abrir o celular — tudo em tempo real, integrado ao seu painel de leads.
          </motion.p>

          {/* Screenshot */}
          <motion.div variants={fadeUp} custom={3} className="mb-16">
            <h2 className="text-2xl font-bold font-display text-foreground mb-4">💬 Converse sem sair da plataforma</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              A caixa de entrada replica a interface do WhatsApp Web dentro da sua ferramenta de prospecção. Veja todas as conversas à esquerda, abra o histórico de mensagens e responda instantaneamente. As mensagens são sincronizadas em tempo real com seu WhatsApp conectado.
            </p>
            <FeaturePreview variant="inbox-multi" />
          </motion.div>

          {/* Message Types Section */}
          <motion.div variants={fadeUp} custom={4} className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-display text-foreground mb-3">
                📱 Todos os tipos de mensagem, <span className="gradient-text">como no WhatsApp</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A caixa de entrada exibe cada tipo de mensagem exatamente como você veria no WhatsApp. Áudios tocam no navegador, imagens carregam em alta qualidade, documentos mostram ícone e nome — tudo sem sair do sistema.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {messageTypes.map((mt, i) => (
                <motion.div
                  key={mt.title}
                  variants={fadeUp}
                  custom={4 + i * 0.5}
                  className="rounded-2xl border border-border/60 bg-card overflow-hidden card-shadow group hover:border-primary/30 transition-colors"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <mt.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{mt.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mt.desc}</p>
                  </div>
                  <div className="px-5 pb-5 flex justify-center">
                    {mt.preview}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Notification Sound Feature */}
          <motion.div variants={fadeUp} custom={7} className="mb-16">
            <div className="rounded-2xl border border-border/60 bg-card p-8 card-shadow">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">🔔 Notificações com som</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quando uma nova mensagem chega, você recebe um alerta sonoro estilo iPhone — independente da aba que estiver usando na plataforma. Nunca mais perca uma mensagem importante de um lead.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeUp} custom={8} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {[
              { icon: MessageCircle, title: "Mensagens em tempo real", desc: "Envie e receba mensagens instantaneamente sem trocar de aplicativo." },
              { icon: Search, title: "Busca de contatos", desc: "Pesquise conversas e encontre contatos rapidamente na lista." },
              { icon: Bell, title: "Notificações automáticas", desc: "Receba alertas visuais e sonoros de novas mensagens no painel." },
              { icon: Users, title: "Suporte a grupos", desc: "Visualize e interaja com conversas de grupos do WhatsApp." },
              { icon: Smartphone, title: "Conectado ao seu número", desc: "Use seu próprio número de WhatsApp conectado via instância." },
              { icon: Send, title: "Envio direto", desc: "Responda leads e clientes sem sair da ferramenta de prospecção." },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-border/60 bg-card p-5 card-shadow">
                <b.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={9} className="text-center py-12 border-t border-border/40">
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Pronto para conversar direto pelo painel?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Conecte sua instância e comece a responder seus leads em tempo real.
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

export default FeatureInbox;
