import { useUserData } from "@/hooks/useUserData";
import { StatsCharts } from "@/components/StatsCharts";
import { BarChart3 } from "lucide-react";
import { PageTutorial } from "@/components/PageTutorial";

const UserStats = () => {
  const { leads } = useUserData();
  const uniqueLeads = leads.filter((l) => !l.is_duplicate);
  const duplicateLeads = leads.filter((l) => l.is_duplicate);
  const categories = Array.from(new Set(leads.map((l) => l.category).filter(Boolean))) as string[];
  const today = new Date().toDateString();
  const leadsToday = leads.filter((l) => new Date(l.created_at).toDateString() === today).length;

  // Top categories
  const categoryCount = new Map<string, number>();
  leads.forEach((l) => {
    const cat = l.category || "Sem categoria";
    categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
  });
  const topCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageTutorial
        title="Estatísticas"
        description="Analise o desempenho da sua prospecção com gráficos e métricas detalhadas."
        steps={[
          { emoji: "📊", text: "Veja o total de leads, leads únicos, duplicatas e leads capturados hoje." },
          { emoji: "📈", text: "Analise gráficos de crescimento, fontes, distribuição e economia." },
          { emoji: "🏆", text: "Confira o ranking das suas top categorias mais prospectadas." },
        ]}
      />
      <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        Estatísticas
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Total de Leads</p>
          <p className="text-3xl font-bold font-display text-foreground">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Leads Únicos</p>
          <p className="text-3xl font-bold font-display text-primary">{uniqueLeads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Duplicatas</p>
          <p className="text-3xl font-bold font-display text-destructive">{duplicateLeads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Leads Hoje</p>
          <p className="text-3xl font-bold font-display text-foreground">{leadsToday}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <p className="text-sm text-muted-foreground">Categorias</p>
          <p className="text-3xl font-bold font-display text-foreground">{categories.length}</p>
        </div>
      </div>

      {/* Charts */}
      <StatsCharts leads={leads} />

      {/* Top categories ranking */}
      {topCategories.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <h3 className="text-sm font-semibold font-display text-foreground mb-4">🏆 Top Categorias</h3>
          <div className="space-y-3">
            {topCategories.map(([cat, count], i) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{cat}</span>
                    <span className="text-xs text-muted-foreground">{count} leads</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-bg rounded-full transition-all"
                      style={{ width: `${(count / leads.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats;
