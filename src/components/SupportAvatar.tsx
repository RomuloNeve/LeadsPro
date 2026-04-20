import { Headphones } from "lucide-react";
import romuloAvatar from "@/assets/avatar-romulo.jpg";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { wrap: string; badge: string; icon: string; ring: string }> = {
  sm: { wrap: "h-7 w-7", badge: "h-3 w-3 -bottom-0.5 -right-0.5", icon: "h-2 w-2", ring: "ring-1" },
  md: { wrap: "h-10 w-10", badge: "h-4 w-4 -bottom-0.5 -right-0.5", icon: "h-2.5 w-2.5", ring: "ring-2" },
  lg: { wrap: "h-14 w-14", badge: "h-5 w-5 -bottom-0.5 -right-0.5", icon: "h-3 w-3", ring: "ring-2" },
};

interface SupportAvatarProps {
  size?: Size;
  className?: string;
  showBadge?: boolean;
}

/**
 * Avatar premium do agente de suporte (Rômulo).
 * Foto real + badge de fones com status online.
 */
export function SupportAvatar({ size = "md", className = "", showBadge = true }: SupportAvatarProps) {
  const s = sizeMap[size];
  return (
    <span className={`relative inline-flex shrink-0 ${s.wrap} ${className}`}>
      <span
        className={`relative ${s.wrap} rounded-full overflow-hidden ${s.ring} ring-white/30 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]`}
      >
        <img
          src={romuloAvatar}
          alt="Rômulo - Suporte LeadsPro"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* Subtle top highlight for premium feel */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
        />
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
