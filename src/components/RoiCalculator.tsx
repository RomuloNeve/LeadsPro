import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, ArrowRight, Calculator, AlertTriangle, Sparkles,
} from "lucide-react";

/**
 * RoiCalculator
 * --------------------------------------------------------------
 * Lets the visitor input their current numbers (leads/day, ticket,
 * conversion %) and shows a live monthly revenue gap vs. what they'd
 * be doing with LeadsPro at industry-standard capacity (100 leads/day).
 *
 * Conversion-driving piece: the visitor literally calculates the
 * money they're losing by NOT using LeadsPro, with their own numbers.
 */

interface Props {
  onCta?: () => void;
}

const ANIMATION_MS = 600;

function formatBRL(value: number): string {
  if (!Number.isFinite(value) || value < 0) value = 0;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function useAnimatedNumber(target: number, duration = ANIMATION_MS): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function RoiCalculator({ onCta }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const [leadsPerDay, setLeadsPerDay] = useState(15);   // current manual capture
  const [ticket, setTicket] = useState(800);            // R$ per sale
  const [conversionPct, setConversionPct] = useState(5); // % of leads that close

  const LEADSPRO_CAPACITY = 100; // realistic daily capacity with LeadsPro
  const TOOLS_REPLACED_COST = 350; // conservative monthly cost of CRM+email+WA tool replaced
  const LEADSPRO_PRICE = 197; // monthly price of the standard plan

  const calc = useMemo(() => {
    const conv = conversionPct / 100;
    const currentMonthlyRevenue = leadsPerDay * 30 * conv * ticket;
    const proMonthlyRevenue = LEADSPRO_CAPACITY * 30 * conv * ticket;
    const revenueGap = Math.max(0, proMonthlyRevenue - currentMonthlyRevenue);
    const toolsSavings = TOOLS_REPLACED_COST - LEADSPRO_PRICE; // monthly savings on tools
    const totalMonthlyGain = revenueGap + Math.max(0, toolsSavings);
    const annualGain = totalMonthlyGain * 12;
    return { currentMonthlyRevenue, proMonthlyRevenue, revenueGap, toolsSavings, totalMonthlyGain, annualGain };
  }, [leadsPerDay, ticket, conversionPct]);

  const animatedGap = useAnimatedNumber(calc.revenueGap);
  const animatedTotal = useAnimatedNumber(calc.totalMonthlyGain);
  const animatedAnnual = useAnimatedNumber(calc.annualGain);
  const animatedCurrent = useAnimatedNumber(calc.currentMonthlyRevenue);
  const animatedPro = useAnimatedNumber(calc.proMonthlyRevenue);

  return (
    <div ref={ref} className="max-w-5xl mx-auto">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] card-shadow">
        <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <Badge className="mb-3 bg-destructive/15 text-destructive hover:bg-destructive/15 border-destructive/30">
              <AlertTriangle className="h-3 w-3 mr-1.5" />
              Quanto você está deixando na mesa?
            </Badge>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight mb-2 sm:mb-3">
              Calcule seu prejuízo <span className="gradient-text">em tempo real</span>
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Ajuste os 3 valores abaixo com seus números reais. O cálculo é instantâneo.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
            {/* Inputs */}
            <div className="space-y-5">
              <SliderField
                label="Leads que você captura por dia (hoje)"
                value={leadsPerDay}
                min={1}
                max={50}
                step={1}
                onChange={setLeadsPerDay}
                suffix=" leads/dia"
                hint="No manual normalmente fica entre 5-20 leads/dia"
              />
              <SliderField
                label="Ticket médio por venda fechada"
                value={ticket}
                min={100}
                max={10000}
                step={100}
                onChange={setTicket}
                prefix="R$ "
                hint="Quanto você fatura quando converte um lead?"
              />
              <SliderField
                label="Sua taxa de conversão"
                value={conversionPct}
                min={1}
                max={30}
                step={1}
                onChange={setConversionPct}
                suffix="%"
                hint="% dos leads que viram cliente"
              />

              {/* Comparison row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 truncate">Receita hoje</p>
                  <p className="text-base sm:text-xl font-bold font-display text-destructive tabular-nums break-all">
                    {formatBRL(animatedCurrent)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">por mês</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 truncate">Com LeadsPro</p>
                  <p className="text-base sm:text-xl font-bold font-display text-primary tabular-nums break-all">
                    {formatBRL(animatedPro)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">por mês</p>
                </div>
              </div>
            </div>

            {/* Result */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={inView ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 sm:p-5 md:p-6 relative overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(29,158,117,0.18), transparent 70%)", filter: "blur(20px)" }}
              />

              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center glow-shadow">
                    <Calculator className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Você está deixando na mesa:</span>
                </div>

                <div>
                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display gradient-text tabular-nums leading-none break-all">
                    {formatBRL(animatedTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">por mês — todo mês</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <Line label="Vendas extras (mais leads/dia)" value={formatBRL(animatedGap)} />
                  <Line
                    label="Economia em ferramentas (CRM + email + WA)"
                    value={formatBRL(Math.max(0, calc.toolsSavings))}
                  />
                </div>

                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs sm:text-sm">
                      <span className="font-bold text-primary">{formatBRL(animatedAnnual)}</span>
                      <span className="text-muted-foreground"> em 12 meses</span>
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={onCta}
                  className="w-full gradient-bg text-primary-foreground hover:opacity-90 glow-shadow group h-12"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quero parar de perder — testar grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Cálculo conservador. LeadsPro captura até 100 leads/dia mantendo sua taxa de conversão atual.
                </p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Subcomponents ── */

function SliderField({
  label, value, min, max, step, onChange, prefix = "", suffix = "", hint,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  prefix?: string; suffix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-base sm:text-lg font-bold font-display text-primary tabular-nums">
          {prefix}{value.toLocaleString("pt-BR")}{suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="cursor-pointer"
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">+ {value}</span>
    </div>
  );
}
