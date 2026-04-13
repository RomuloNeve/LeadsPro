import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Users, DollarSign, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  instagram: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  category: string | null;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "hsl(200, 70%, 50%)",
  "hsl(120, 50%, 45%)",
  "hsl(50, 90%, 50%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

const axisTickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

const hasValue = (v: string | null | undefined) => !!v && v.trim() !== "" && v.toLowerCase() !== "não encontrado";

type Period = "7d" | "14d" | "30d";

export const LeadsCharts = ({ leads }: { leads: Lead[] }) => {
  const [period, setPeriod] = useState<Period>("14d");
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 180 : 220;

  const periodDays = period === "7d" ? 7 : period === "14d" ? 14 : 30;

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, 0);
    }
    leads.forEach((l) => {
      const key = new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, leads: count }));
  }, [leads, periodDays]);

  const sourceData = useMemo(() => {
    let email = 0, phone = 0, instagram = 0, linkedin = 0, site = 0;
    leads.forEach((l) => {
      if (hasValue(l.email)) email++;
      if (hasValue(l.phone)) phone++;
      if (hasValue(l.instagram)) instagram++;
      if (hasValue(l.linkedin)) linkedin++;
      if (hasValue(l.website)) site++;
    });
    return [
      { source: "Email", count: email, fill: COLORS[0] },
      { source: "Tel", count: phone, fill: COLORS[1] },
      { source: "Insta", count: instagram, fill: COLORS[2] },
      { source: "LinkedIn", count: linkedin, fill: COLORS[3] },
      { source: "Site", count: site, fill: COLORS[4] },
    ];
  }, [leads]);

  const contactDistribution = useMemo(() => {
    const total = sourceData.reduce((s, d) => s + d.count, 0) || 1;
    return sourceData.map((d) => ({
      name: d.source,
      value: d.count,
      pct: Math.round((d.count / total) * 100),
    }));
  }, [sourceData]);

  const completionData = useMemo(() => {
    const total = leads.length || 1;
    const withEmail = leads.filter((l) => hasValue(l.email)).length;
    const withPhone = leads.filter((l) => hasValue(l.phone)).length;
    const withSocial = leads.filter((l) => hasValue(l.instagram) || hasValue(l.linkedin)).length;
    const withSite = leads.filter((l) => hasValue(l.website)).length;
    return [
      { field: "Email", pct: Math.round((withEmail / total) * 100), fill: COLORS[0] },
      { field: "Telefone", pct: Math.round((withPhone / total) * 100), fill: COLORS[1] },
      { field: "Redes Sociais", pct: Math.round((withSocial / total) * 100), fill: COLORS[2] },
      { field: "Site", pct: Math.round((withSite / total) * 100), fill: COLORS[4] },
    ];
  }, [leads]);

  const economyData = useMemo(() => {
    const uniqueLeads = leads.filter((l) => !("is_duplicate" in l) || !(l as any).is_duplicate).length;
    const costPerLead = 0.5;
    const marketCost = 3.0;
    return [
      { label: "LeadsPro", value: Math.round(uniqueLeads * costPerLead), fill: COLORS[1] },
      { label: "Base de Dados", value: Math.round(uniqueLeads * marketCost), fill: COLORS[4] },
    ];
  }, [leads]);

  const segmentData = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      const cat = l.category || "Sem categoria";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const maxLen = isMobile ? 14 : 20;
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > maxLen ? name.substring(0, maxLen) + "..." : name, value, fullName: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, isMobile ? 5 : 8);
  }, [leads, isMobile]);

  if (leads.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Leads por Período
            </h3>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-7">
                <TabsTrigger value="7d" className="text-xs px-2 py-0.5">7d</TabsTrigger>
                <TabsTrigger value="14d" className="text-xs px-2 py-0.5">14d</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2 py-0.5">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} interval={isMobile ? Math.max(Math.floor(dailyData.length / 5), 1) : period === "30d" ? 4 : period === "14d" ? 2 : 0} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={isMobile ? false : { fill: "hsl(var(--primary))", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Distribuição por Contato
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contactDistribution} cx="50%" cy="50%" innerRadius={isMobile ? 35 : 50} outerRadius={isMobile ? 60 : 80} paddingAngle={3} dataKey="value" label={isMobile ? false : ({ pct }: any) => `${pct}%`}>
                  {contactDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value} leads`, name]} />
                <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Leads por Fonte
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} barSize={isMobile ? 24 : 36}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="source" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} leads`]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {sourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Taxa de Leads Completos
          </h3>
          <div className="space-y-3 sm:space-y-4 pt-2">
            {completionData.map((item) => (
              <div key={item.field}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm text-foreground font-medium">{item.field}</span>
                  <span className="text-xs sm:text-sm font-bold" style={{ color: item.fill }}>{item.pct}%</span>
                </div>
                <div className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.pct}%`, backgroundColor: item.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Economia Gerada
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={economyData} barSize={isMobile ? 40 : 60}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {economyData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💰 Economia de até <span className="font-bold text-primary">R$ {((economyData[1]?.value || 0) - (economyData[0]?.value || 0)).toLocaleString("pt-BR")}</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Volume por Segmento
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData} layout="vertical" barSize={isMobile ? 16 : 20} margin={{ left: isMobile ? 0 : 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} width={isMobile ? 80 : 110} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _: any, props: any) => [`${value} leads`, props.payload.fullName]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {segmentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
