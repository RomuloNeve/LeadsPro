import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number | null;
  compact?: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 80) return { label: "Quente", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", emoji: "🔥" };
  if (score >= 60) return { label: "Morno", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", emoji: "🌤️" };
  if (score >= 40) return { label: "Médio", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", emoji: "🌡️" };
  if (score >= 20) return { label: "Frio", color: "bg-sky-500/15 text-sky-600 border-sky-500/30", emoji: "❄️" };
  return { label: "Gelado", color: "bg-slate-500/15 text-slate-500 border-slate-500/30", emoji: "🧊" };
};

export const LeadScoreBadge = ({ score, compact = false }: LeadScoreBadgeProps) => {
  if (score === null || score === undefined) {
    return compact ? null : (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }

  const config = getScoreConfig(score);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${config.color}`}>
              {config.emoji} {score}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Score IA: {score}/100 ({config.label})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${config.color}`}>
      {config.emoji} {score}
    </Badge>
  );
};

export default LeadScoreBadge;
