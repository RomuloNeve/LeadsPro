import { Headphones } from "lucide-react";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { wrap: string; letter: string; badge: string; icon: string; ring: string }> = {
  sm: { wrap: "h-7 w-7", letter: "text-xs", badge: "h-3 w-3 -bottom-0.5 -right-0.5", icon: "h-2 w-2", ring: "ring-1" },
  md: { wrap: "h-10 w-10", letter: "text-base", badge: "h-4 w-4 -bottom-0.5 -right-0.5", icon: "h-2.5 w-2.5", ring: "ring-2" },
  lg: { wrap: "h-14 w-14", letter: "text-xl", badge: "h-5 w-5 -bottom-0.5 -right-0.5", icon: "h-3 w-3", ring: "ring-2" },
};

interface SupportAvatarProps {
  size?: Size;
  className?: string;
  showBadge?: boolean;
}

/**
 * Premium, deterministic avatar for the AI support agent (Rômulo).
 * Uses a gradient circle + initial "R" + headphones badge — no external image needed.
 */
export function SupportAvatar({ size = "md", className = "", showBadge = true }: SupportAvatarProps) {
  const s = sizeMap[size];
  return (
    <span className={`relative inline-flex shrink-0 ${s.wrap} ${className}`}>
      <span
        className={`relative ${s.wrap} rounded-full overflow-hidden flex items-center justify-center ${s.ring} ring-white/20 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]`}
        style={{
          background:
            "radial-gradient(circle at 30% 25%, hsl(var(--primary)) 0%, hsl(var(--primary)/0.85) 45%, hsl(var(--accent)) 100%)",
        }}
        aria-hidden
      >
        {/* Subtle top highlight */}
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
        <span className={`relative font-display font-bold text-white ${s.letter} tracking-tight select-none`}>
          R
        </span>
      </span>
      {showBadge && (
        <span
          className={`absolute ${s.badge} rounded-full bg-green-500 border-2 border-background flex items-center justify-center shadow`}
          aria-hidden
        >
          <Headphones className={`${s.icon} text-white`} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}
