import { useState, useRef, useMemo } from "react";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Download, Save, Loader2, MapPin, Globe, Phone, Instagram, Linkedin, StopCircle, FolderOpen, Mail, Clock, ArrowRight, Coins,
} from "lucide-react";
import { SaveToListDialog } from "@/components/SaveToListDialog";
import { PageTutorial } from "@/components/PageTutorial";
import { CnaeCombobox } from "@/components/CnaeCombobox";
import { CityCombobox } from "@/components/CityCombobox";
import { CountryCombobox } from "@/components/CountryCombobox";
import municipiosData from "@/data/municipios.json";
import { useIsMobile } from "@/hooks/use-mobile";
import BuyCreditsDialog from "@/components/BuyCreditsDialog";

interface SearchLead {
  id?: string; // DB id; present when the backend auto-saved the lead
  name: string;
  phone: string;
  email: string;
  instagram: string;
  linkedin: string;
  website: string;
  city: string;
  state: string;
  category: string;
}

const UF_TO_STATE: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

const ESTADOS_BR = Object.keys(UF_TO_STATE).sort();

type LocationMode = "brasil" | "estado" | "estado_cidade" | "pais" | "pais_cidade";

const BuyCreditsInline = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="gradient-bg text-primary-foreground" onClick={() => setOpen(true)}>
        Comprar créditos extras <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      <BuyCreditsDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

const UserSearch = () => {
  const isMobile = useIsMobile();
  const { license, fetchLicense, refreshCredits } = useUserData();
  const { toast } = useToast();
  const [role, setRole] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>("brasil");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [countryCity, setCountryCity] = useState("");
  const municipios = municipiosData as Record<string, string[]>;

  const citiesForState = useMemo(() => {
    if (!state) return [];
    const fullName = UF_TO_STATE[state];
    return fullName ? (municipios[fullName] || []) : [];
  }, [state, municipios]);
  const [leads, setLeads] = useState<SearchLead[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([]);
  const [showListDialog, setShowListDialog] = useState(false);
  const [liveCreditsUsed, setLiveCreditsUsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Check credit limits
  const { leads: allLeads } = useUserData();
  const FREE_LEAD_LIMIT = 60;
  const isFreeUser = license?.plan_type === "free";
  const freeLeadsUsed = isFreeUser ? allLeads.length : 0;
  const freeLeadsRemaining = FREE_LEAD_LIMIT - freeLeadsUsed;
  
  // For paid plans, check credits
  const totalCredits = (license?.monthly_credits || 0) + (license?.extra_credits || 0);
  const availableCredits = license ? totalCredits - (license.used_credits || 0) - liveCreditsUsed : 0;
  const isPaidUser = license && license.plan_type !== "free";
  const isSearchLimitReached = isFreeUser ? freeLeadsUsed >= FREE_LEAD_LIMIT : (isPaidUser && availableCredits <= 0 && !searching);

  if (isSearchLimitReached) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Clock className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isFreeUser ? "Limite de leads atingido" : "Créditos esgotados"}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {isFreeUser
            ? `Você atingiu o limite de ${FREE_LEAD_LIMIT} leads do plano gratuito. As demais funcionalidades continuam disponíveis até o fim do seu teste de 2 horas. Para buscar leads ilimitados, assine um plano.`
            : "Seus créditos de prospecção acabaram. Compre créditos extras via PIX ou aguarde a renovação do seu plano mensal."}
        </p>
        {isFreeUser ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="gradient-bg text-primary-foreground" onClick={() => window.open("https://pay.cakto.com.br/mrhbivc_848520", "_blank")}>
              Pro — R$197/mês <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => window.open("https://pay.cakto.com.br/p69cmy8_848513", "_blank")}>
              Starter — R$97/mês
            </Button>
            <Button variant="outline" onClick={() => window.open("https://pay.cakto.com.br/32icmcq_848524", "_blank")}>
              Enterprise — R$397/mês
            </Button>
          </div>
        ) : (
          <BuyCreditsInline />
        )}
      </div>
    );
  }

  const handleSearch = async () => {
    if (!role.trim()) {
      toast({ title: "Preencha a categoria/função!", variant: "destructive" });
      return;
    }

    setSearching(true);
    setLeads([]);
    setProgress(0);
    setTotal(0);
    setLiveCreditsUsed(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Você precisa estar logado!", variant: "destructive" });
        setSearching(false);
        return;
      }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/search-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role: role.trim(),
          state: locationMode === "estado" || locationMode === "estado_cidade" ? state : "",
          city: locationMode === "estado_cidade" ? city.trim() : locationMode === "pais_cidade" ? countryCity.trim() : "",
          code: license?.code || "",
          country: locationMode === "pais" || locationMode === "pais_cidade" ? country.trim() : "",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro na busca");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream não suportado");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;

          try {
            const msg = JSON.parse(match[1]);

            if (msg.type === "total") {
              setTotal(msg.count);
            } else if (msg.type === "lead") {
              setLeads((prev) => [...prev, msg.lead]);
              setProgress(Math.round(((msg.index + 1) / (total || msg.index + 1)) * 100));
              setLiveCreditsUsed((prev) => prev + 1);
              // Backend now auto-saves each lead to DB and returns its id — mark
              // it as saved so the UI reflects persistence without requiring
              // a manual "Salvar no CRM" click.
              if (msg.lead?.id) setSavedLeadIds((prev) => [...prev, msg.lead.id]);
            } else if (msg.type === "done") {
              setProgress(100);
            }
          } catch { /* ignore parse errors */ }
        }
      }

      toast({ title: "🎯 Busca concluída!" });
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast({ title: "Busca cancelada" });
      } else {
        toast({ title: "Erro na busca", description: err.message, variant: "destructive" });
      }
    } finally {
      setSearching(false);
      abortRef.current = null;
      setLiveCreditsUsed(0);
      // Refresh only credits (lightweight, keeps search results intact)
      refreshCredits();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSave = async () => {
    if (!leads.length) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("save-leads", {
        body: {
          code: license?.code || "",
          leads: leads.map((l) => ({
            name: l.name, email: l.email, instagram: l.instagram, linkedin: l.linkedin,
            site: l.website, phone: l.phone, category: l.category,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      const ids = data?.ids || [];
      setSavedLeadIds(ids);
      toast({ title: `✅ ${data?.count || leads.length} leads salvos no CRM!` });

      // Offer to save to a list
      if (ids.length > 0) {
        setShowListDialog(true);
      }
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const header = "Nome,Telefone,Email,Instagram,LinkedIn,Site,Cidade,Estado,Categoria\n";
    const rows = leads
      .map((l) => `"${l.name}","${l.phone}","${l.email}","${l.instagram}","${l.linkedin}","${l.website}","${l.city}","${l.state}","${l.category}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LeadsPro_Leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderLink = (url: string, icon: React.ReactNode) => {
    if (!url || url === "Não encontrado") return <span className="text-muted-foreground">✖️</span>;
    return (
      <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 transition-colors">
        {icon}
      </a>
    );
  };

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Buscar Leads"
        description="Encontre leads qualificados direto do Google Maps com dados de contato completos."
        steps={[
          { emoji: "1️⃣", text: "Selecione a categoria/atividade que deseja prospectar." },
          { emoji: "2️⃣", text: "Escolha a localização: todo Brasil, estado, cidade ou outro país." },
          { emoji: "3️⃣", text: "Clique em 'Buscar Leads' e aguarde os resultados aparecerem em tempo real." },
          { emoji: "4️⃣", text: "Salve os leads no CRM clicando em 'Salvar no CRM'." },
          { emoji: "5️⃣", text: "Opcionalmente, organize em listas ou exporte como CSV." },
        ]}
      />
      {isFreeUser ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Teste Grátis — {freeLeadsRemaining} de {FREE_LEAD_LIMIT} leads restantes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No teste grátis você pode buscar até {FREE_LEAD_LIMIT} leads no teste grátis. Nos planos pagos, a busca é baseada em créditos.
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, (freeLeadsUsed / FREE_LEAD_LIMIT) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{freeLeadsUsed}/{FREE_LEAD_LIMIT} leads utilizados</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card p-4 card-shadow flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              availableCredits <= 0 ? "bg-destructive/10" : availableCredits < (license?.monthly_credits || 0) * 0.1 ? "bg-yellow-500/10" : "bg-primary/10"
            }`}>
              <Coins className={`h-5 w-5 ${
                availableCredits <= 0 ? "text-destructive" : availableCredits < (license?.monthly_credits || 0) * 0.1 ? "text-yellow-500" : "text-primary"
              }`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {availableCredits.toLocaleString("pt-BR")} créditos restantes
              </p>
              <p className="text-xs text-muted-foreground">
                {((license?.used_credits || 0) + liveCreditsUsed).toLocaleString("pt-BR")} usados de {totalCredits.toLocaleString("pt-BR")} · Cada busca consome 1 crédito por lead
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full transition-all ${
                  availableCredits <= 0 ? "bg-destructive" : availableCredits < (license?.monthly_credits || 0) * 0.1 ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(100, (availableCredits / Math.max(1, totalCredits)) * 100)}%` }}
              />
            </div>
            <BuyCreditsInline />
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold font-display gradient-text">Buscar Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isFreeUser
            ? `Busque até ${freeLeadsRemaining} leads restantes (${FREE_LEAD_LIMIT} no total do teste grátis)`
            : `Busca de leads direto no Google Maps com redes sociais · ${availableCredits.toLocaleString("pt-BR")} créditos disponíveis`
          }
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
        {/* Categoria */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Categoria / Atividade *</Label>
          <CnaeCombobox value={role} onValueChange={setRole} disabled={searching} />
          <p className="text-xs text-muted-foreground">Escolha uma categoria popular ou digite livremente (ex: Dentista, Pizzaria, Advogado)</p>
        </div>

        {/* Localização */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Localização da busca</Label>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {[
              { value: "brasil" as LocationMode, label: "🇧🇷 Todo Brasil", desc: "Busca nas principais capitais" },
              { value: "estado" as LocationMode, label: "📍 Estado inteiro", desc: "Todas as cidades do estado" },
              { value: "estado_cidade" as LocationMode, label: "🏙️ Cidade específica", desc: "Estado + cidade" },
              { value: "pais" as LocationMode, label: "🌎 País inteiro", desc: "Busca em todo o país" },
              { value: "pais_cidade" as LocationMode, label: "🌆 País + Cidade", desc: "País e cidade específica" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={searching}
                onClick={() => {
                  setLocationMode(opt.value);
                  if (opt.value === "brasil") { setState(""); setCity(""); setCountry(""); setCountryCity(""); }
                  if (opt.value === "estado") { setCity(""); setCountry(""); setCountryCity(""); }
                  if (opt.value === "estado_cidade") { setCountry(""); setCountryCity(""); }
                  if (opt.value === "pais") { setState(""); setCity(""); setCountryCity(""); }
                  if (opt.value === "pais_cidade") { setState(""); setCity(""); }
                }}
                className={`flex-1 min-w-[140px] rounded-lg border-2 p-3 text-left transition-all ${
                  locationMode === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                } ${searching ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* State selector */}
          {(locationMode === "estado" || locationMode === "estado_cidade") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado *</Label>
                <Select value={state || ""} onValueChange={(v) => { setState(v); setCity(""); }} disabled={searching}>
                  <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (<SelectItem key={uf} value={uf}>{uf} - {UF_TO_STATE[uf]}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {locationMode === "estado_cidade" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cidade * ({citiesForState.length} municípios)</Label>
                  <CityCombobox
                    value={city}
                    onValueChange={setCity}
                    options={citiesForState}
                    disabled={searching || !state}
                  />
                </div>
              )}
            </div>
          )}

          {/* Country selector */}
          {(locationMode === "pais" || locationMode === "pais_cidade") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">País *</Label>
                <CountryCombobox value={country} onValueChange={(v) => { setCountry(v); setCountryCity(""); }} disabled={searching} />
              </div>
              {locationMode === "pais_cidade" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cidade *</Label>
                  <Input
                    value={countryCity}
                    onChange={(e) => setCountryCity(e.target.value)}
                    placeholder="Ex: Miami, London, Buenos Aires..."
                    disabled={searching || !country}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search / Stop button */}
        <div className="flex items-end gap-2 pt-2">
          {searching ? (
            <Button onClick={handleStop} variant="destructive" className="w-full sm:w-auto">
              <StopCircle className="h-4 w-4 mr-2" /> Parar Busca
            </Button>
          ) : (
            <Button onClick={handleSearch}
              disabled={!role.trim() || ((locationMode === "estado" || locationMode === "estado_cidade") && !state) || (locationMode === "estado_cidade" && !city.trim()) || ((locationMode === "pais" || locationMode === "pais_cidade") && !country.trim()) || (locationMode === "pais_cidade" && !countryCity.trim())}
              className="w-full sm:w-auto gradient-bg text-primary-foreground">
              <Search className="h-4 w-4 mr-2" /> Buscar Leads
            </Button>
          )}
        </div>

        {(searching || progress > 0) && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {searching ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {leads.length}/{total || "?"} leads encontrados...
                </span>
              ) : "Busca concluída!"}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {leads.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 card-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold font-display">
                {leads.length} leads {searching && <span className="text-sm text-muted-foreground font-normal">(buscando...)</span>}
              </h2>
              {locationMode === "brasil" && <Badge variant="secondary" className="text-xs">Todo Brasil</Badge>}
              {locationMode === "estado" && state && <Badge variant="secondary" className="text-xs">Estado: {state}</Badge>}
              {locationMode === "estado_cidade" && state && city && <Badge variant="secondary" className="text-xs">{city}, {state}</Badge>}
              {locationMode === "pais" && country && <Badge variant="secondary" className="text-xs">🌎 {country}{countryCity ? `, ${countryCity}` : ""}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {savedLeadIds.length > 0 && !searching && (
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                  ✅ Salvos no CRM automaticamente
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={searching}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              {savedLeadIds.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowListDialog(true)}>
                  <FolderOpen className="h-4 w-4 mr-1" /> Adicionar a lista
                </Button>
              )}
            </div>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {leads.map((lead, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">{lead.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{lead.category}</Badge>
                  </div>
                  {lead.phone && lead.phone !== "Não encontrado" && (
                    <a href={`tel:${lead.phone}`} className="text-primary text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3" />{lead.phone}
                    </a>
                  )}
                  <div className="flex items-center gap-3">
                    {lead.email && lead.email !== "Não encontrado" && (
                      <a href={`mailto:${lead.email}`} className="text-primary"><Mail className="h-4 w-4" /></a>
                    )}
                    {lead.instagram && lead.instagram !== "Não encontrado" && renderLink(lead.instagram, <Instagram className="h-4 w-4" />)}
                    {lead.linkedin && lead.linkedin !== "Não encontrado" && renderLink(lead.linkedin, <Linkedin className="h-4 w-4" />)}
                    {lead.website && lead.website !== "Não encontrado" && renderLink(lead.website, <Globe className="h-4 w-4" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-center">Email</TableHead>
                      <TableHead className="text-center">Instagram</TableHead>
                      <TableHead className="text-center">LinkedIn</TableHead>
                      <TableHead className="text-center">Site</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, i) => (
                      <TableRow key={i} className="animate-in fade-in slide-in-from-top-1 duration-300">
                        <TableCell><Badge variant="outline" className="text-xs">{lead.category}</Badge></TableCell>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          {lead.phone && lead.phone !== "Não encontrado" ? (
                            <a href={`tel:${lead.phone}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />{lead.phone}
                            </a>
                          ) : <span className="text-muted-foreground">✖️</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {lead.email && lead.email !== "Não encontrado" ? (
                            <a href={`mailto:${lead.email}`} className="text-primary hover:text-primary/80 transition-colors">
                              <Mail className="h-4 w-4 mx-auto" />
                            </a>
                          ) : <span className="text-muted-foreground">✖️</span>}
                        </TableCell>
                        <TableCell className="text-center">{renderLink(lead.instagram, <Instagram className="h-4 w-4 mx-auto" />)}</TableCell>
                        <TableCell className="text-center">{renderLink(lead.linkedin, <Linkedin className="h-4 w-4 mx-auto" />)}</TableCell>
                        <TableCell className="text-center">{renderLink(lead.website, <Globe className="h-4 w-4 mx-auto" />)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searching && leads.length === 0 && progress === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 card-shadow text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Pronto para prospectar</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Digite uma categoria (ex: Arquiteto, Dentista) e escolha a localização.
            Deixe estado e cidade vazios para buscar em todo o Brasil. Até 60 leads por busca!
          </p>
        </div>
      )}

      <SaveToListDialog
        open={showListDialog}
        onOpenChange={setShowListDialog}
        leadIds={savedLeadIds}
      />
    </div>
  );
};

export default UserSearch;
