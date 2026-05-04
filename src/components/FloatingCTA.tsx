import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/gtag";

const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past hero (>600px)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border-2 border-primary bg-white p-3 sm:p-4"
            style={{ boxShadow: "0 0 0 1px rgba(239,35,60,0.15), 0 8px 40px -8px rgba(239,35,60,0.5), 0 24px 60px -20px rgba(0,0,0,0.6)" }}
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors shadow-md"
            >
              <X className="h-3 w-3" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                🚀 Teste grátis por 7 dias
              </p>
              <p className="text-[10px] sm:text-xs text-zinc-500 truncate">
                Sem cartão • 60 créditos/dia • Acesso completo
              </p>
            </div>

            <button
              onClick={() => {
                trackEvent("floating_cta_click");
                navigate("/auth?plan=free");
              }}
              className="shrink-0 flex items-center gap-1.5 gradient-bg text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity group"
              style={{ boxShadow: "0 0 16px -2px rgba(239,35,60,0.6)" }}
            >
              Começar
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
