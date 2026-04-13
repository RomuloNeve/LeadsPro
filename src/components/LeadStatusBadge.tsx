import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Flame, Snowflake, CalendarCheck, Trophy, XCircle, Sparkles } from "lucide-react";

export const LEAD_STATUSES = [
  { value: "novo", label: "Novo", icon: Sparkles, color: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400" },
  { value: "quente", label: "Quente", icon: Flame, color: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400" },
  { value: "frio", label: "Frio", icon: Snowflake, color: "bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400" },
  { value: "agendado", label: "Agendado", icon: CalendarCheck, color: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400" },
  { value: "fechado", label: "Fechado", icon: Trophy, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  { value: "perdido", label: "Perdido", icon: XCircle, color: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400" },
] as const;

export type LeadStatus = typeof LEAD_STATUSES[number]["value"];

export const getStatusConfig = (status: string) =>
  LEAD_STATUSES.find((s) => s.value === status) || LEAD_STATUSES[0];

interface LeadStatusBadgeProps {
  status: string;
  onChangeStatus?: (newStatus: LeadStatus) => void;
  size?: "sm" | "md";
}

export const LeadStatusBadge = ({ status, onChangeStatus, size = "sm" }: LeadStatusBadgeProps) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const badgeContent = (
    <span
      className={`inline-flex items-center rounded-full border ${config.color} ${size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5"} font-semibold cursor-pointer hover:opacity-80 transition-opacity select-none`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </span>
  );

  if (!onChangeStatus) return badgeContent;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="outline-none focus:outline-none" onClick={(e) => e.stopPropagation()}>
          {badgeContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] z-[9999]" sideOffset={8}>
        {LEAD_STATUSES.map((s) => {
          const SIcon = s.icon;
          return (
            <DropdownMenuItem
              key={s.value}
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus(s.value);
              }}
              className={`gap-2 cursor-pointer ${s.value === status ? "bg-muted" : ""}`}
            >
              <SIcon className="h-3.5 w-3.5" />
              {s.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
