import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import { TrendingUp, Target, Clock, Zap } from "lucide-react";
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
  is_duplicate?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(50, 90%, 50%)",
  "hsl(120, 50%, 45%)",
  "hsl(280, 65%, 60%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  padding: "8px 12px",
};

const tooltipLabelStyle = { color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 };
const tooltipItemStyle = { color: "hsl(var(--foreground))" };

const axisTickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

const hasValue = (v: string | null | undefined) => !!v && v.trim() !== "" && v.toLowerCase() !== "não encontrado";

export const StatsCharts = ({ leads }: { leads: Lead[] }) => {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 180 : 220;

  const cumulativeData = useMemo(() => {
    const sorted = [...leads].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const map = new Map<string, number>();
    let total = 0;
    sorted.forEach((l) => {
      const key = new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      total++;
      map.set(key, total);
    });
    const entries = Array.from(map.entries());
    return entries.slice(-14);
  }, [leads]);

  const radarData = useMemo(() => {
    const total = leads.length || 1;
    return [
      { field: "Tel", pct: Math.round((leads.filter((l) => hasValue(l.phone)).length / total) * 100) },
      { field: "Email", pct: Math.round((leads.filter((l) => hasValue(l.email)).length / total) * 100) },
      { field: "Insta", pct: Math.round((leads.filter((l) => hasValue(l.instagram)).length / total) * 100) },
      { field: "LinkedIn", pct: Math.round((leads.filter((l) => hasValue(l.linkedin)).length / total) * 100) },
      { field: "Site", pct: Math.round((leads.filter((l) => hasValue(l.website)).length / total) * 100) },
    ];
  }, [leads]);

  const weekdayData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = new Array(7).fill(0);
    leads.forEach((l) => {
      const d = new Date(l.created_at).getDay();
      counts[d]++;
    });
    return days.map((day, i) => ({ day, count: counts[i], fill: COLORS[i % COLORS.length] }));
  }, [leads]);

  const duplicateData = useMemo(() => {
    const unique = leads.filter((l) => !l.is_duplicate).length;
    const dupes = leads.filter((l) => l.is_duplicate).length;
    return [
      { name: "Únicos", value: unique },
      { name: "Duplicatas", value: dupes },
    ];
  }, [leads]);

  const hourlyData = useMemo(() => {
    const hours = new Array(24).fill(0);
    leads.forEach((l) => {
      const h = new Date(l.created_at).getHours();
      hours[h]++;
    });
    return hours.map((count, h) => ({
      hour: `${String(h).padStart(2, "0")}h`,
      count,
    })).filter((_, i) => i >= 6 && i <= 23);
  }, [leads]);

  const weeklyGrowth = useMemo(() => {
    const weeks = new Map<string, number>();
    leads.forEach((l) => {
      const d = new Date(l.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      weeks.set(key, (weeks.get(key) || 0) + 1);
    });
    return Array.from(weeks.entries())
      .map(([week, count]) => ({ week: `Sem ${week}`, count }))
      .slice(-8);
  }, [leads]);

  if (leads.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Crescimento Acumulado
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="0" tick={axisTickStyle} tickLine={false} axisLine={false} interval={isMobile ? 3 : 2} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value: number) => [`${value} leads`, "Total"]} />
                <Area type="monotone" dataKey="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Qualidade dos Dados
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "70%"}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="field" tick={{ fontSize: isMobile ? 9 : 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="pct" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Leads por Dia da Semana
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData} barSize={isMobile ? 22 : 32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value: number) => [`${value} leads`]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Únicos vs Duplicatas
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={duplicateData} cx="50%" cy="50%" innerRadius={isMobile ? 40 : 55} outerRadius={isMobile ? 65 : 85} paddingAngle={4} dataKey="value"
                  label={isMobile ? false : ({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(340, 75%, 55%)" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value: number, name: string) => [`${value} leads`, name]} />
                <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Atividade por Horário
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={axisTickStyle} tickLine={false} axisLine={false} interval={isMobile ? 3 : 2} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value: number) => [`${value} leads`]} />
                <Area type="monotone" dataKey="count" stroke="hsl(160, 60%, 45%)" fill="hsl(160, 60%, 45% / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Crescimento Semanal
          </h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyGrowth} barSize={isMobile ? 18 : 28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisTickStyle} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={(value: number) => [`${value} leads`]} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
