import { useState } from "react";
import { AlertTriangle, Coins, ArrowRight } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import BuyCreditsDialog from "./BuyCreditsDialog";

const LowCreditsAlert = () => {
  const { license } = useUserData();
  const [buyOpen, setBuyOpen] = useState(false);

  if (!license) return null;

  const totalCredits = license.monthly_credits + license.extra_credits - license.used_credits;
  const monthlyCredits = license.monthly_credits || 0;

  // Don't show for free plan (they have different limits)
  if (license.plan_type === "free") return null;

  // Show when < 10% remaining
  const threshold = Math.max(monthlyCredits * 0.1, 10);
  if (totalCredits > threshold) return null;

  const isZero = totalCredits <= 0;

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
          isZero
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium truncate">
            {isZero
              ? "Seus créditos acabaram! Compre mais para continuar gerando leads."
              : `⚠️ Restam apenas ${totalCredits} créditos. Compre mais para não parar.`}
          </p>
        </div>
        <button
          onClick={() => setBuyOpen(true)}
          className="shrink-0 flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <Coins className="h-4 w-4" />
          Comprar créditos
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <BuyCreditsDialog open={buyOpen} onOpenChange={setBuyOpen} />
    </>
  );
};

export default LowCreditsAlert;
