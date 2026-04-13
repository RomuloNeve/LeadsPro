import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Link2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMMON_SOURCES = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "email", label: "Email" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];

const COMMON_MEDIUMS = [
  { value: "social", label: "Social" },
  { value: "cpc", label: "CPC (Pago)" },
  { value: "email", label: "Email" },
  { value: "organic", label: "Orgânico" },
  { value: "referral", label: "Referral" },
  { value: "banner", label: "Banner" },
  { value: "affiliate", label: "Afiliado" },
];

interface SavedLink {
  url: string;
  label: string;
  createdAt: string;
}

const UtmGenerator = () => {
  const [baseUrl, setBaseUrl] = useState("https://leadspro.app");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("utm_saved_links") || "[]");
    } catch {
      return [];
    }
  });
  const { toast } = useToast();

  const generatedUrl = (() => {
    if (!baseUrl || !source || !medium || !campaign) return "";
    const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
    if (term.trim()) url.searchParams.set("utm_term", term);
    if (content.trim()) url.searchParams.set("utm_content", content);
    return url.toString();
  })();

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const saveLink = () => {
    if (!generatedUrl) return;
    const newLinks = [
      { url: generatedUrl, label: `${source} / ${medium} — ${campaign}`, createdAt: new Date().toISOString() },
      ...savedLinks,
    ].slice(0, 20);
    setSavedLinks(newLinks);
    localStorage.setItem("utm_saved_links", JSON.stringify(newLinks));
    toast({ title: "Link salvo!" });
  };

  const removeLink = (idx: number) => {
    const newLinks = savedLinks.filter((_, i) => i !== idx);
    setSavedLinks(newLinks);
    localStorage.setItem("utm_saved_links", JSON.stringify(newLinks));
  };

  const clearAll = () => {
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold font-display">Gerador de Links UTM</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">URL Base</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://leadspro.app"
              className="bg-background"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Origem (utm_source) *</Label>
            <div className="flex gap-2">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-background flex-1">
                  <SelectValue placeholder="Selecionar origem" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ou digite..."
                className="bg-background w-32"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Meio (utm_medium) *</Label>
            <div className="flex gap-2">
              <Select value={medium} onValueChange={setMedium}>
                <SelectTrigger className="bg-background flex-1">
                  <SelectValue placeholder="Selecionar meio" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_MEDIUMS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="ou digite..."
                className="bg-background w-32"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Campanha (utm_campaign) *</Label>
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="ex: lancamento-março"
              className="bg-background"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Termo (utm_term) <span className="text-muted-foreground/50">— opcional</span></Label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ex: prospecção b2b"
              className="bg-background"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Conteúdo (utm_content) <span className="text-muted-foreground/50">— opcional</span></Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ex: banner-header"
              className="bg-background"
            />
          </div>
        </div>

        {/* Generated URL */}
        {generatedUrl && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <Label className="text-xs text-primary font-semibold">Link Gerado</Label>
            <p className="text-sm text-foreground break-all font-mono">{generatedUrl}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => copyLink(generatedUrl)} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
              <Button size="sm" variant="outline" onClick={saveLink} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={clearAll} className="gap-1.5 text-muted-foreground">
                Limpar
              </Button>
            </div>
          </div>
        )}

        {!generatedUrl && (source || medium || campaign) && (
          <p className="text-xs text-muted-foreground">Preencha origem, meio e campanha para gerar o link.</p>
        )}
      </div>

      {/* Saved Links */}
      {savedLinks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
          <h3 className="text-sm font-bold font-display text-muted-foreground">Links Salvos ({savedLinks.length})</h3>
          <div className="space-y-2">
            {savedLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{link.label}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">{link.url}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyLink(link.url)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeLink(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UtmGenerator;
