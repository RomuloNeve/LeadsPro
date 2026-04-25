import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/gtag";

const ExitIntentPopup = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 5 && !sessionStorage.getItem("exit_popup_shown")) {
      setShow(true);
      sessionStorage.setItem("exit_popup_shown", "1");
      trackEvent("exit_intent_shown");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Only activate after 5s on page

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleCta = () => {
    trackEvent("exit_intent_cta_click");
    setShow(false);
    navigate("/auth?plan=free");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShow(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg mb-4">
                <Gift className="h-7 w-7 text-primary-foreground" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground mb-2">
                Espera! 🎁 Teste grátis por 7 dias
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Acesso completo a todas as funcionalidades. 60 créditos por dia (420 no total), dispare mensagens em massa e automatize seu WhatsApp — sem pagar nada.
              </p>

              <div className="space-y-3 text-left mb-6">
                {[
                  "Busca ilimitada de leads",
                  "Disparo em massa no WhatsApp",
                  "Chatbot IA 24/7",
                  "Sem cartão de crédito",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleCta}
                className="w-full gradient-bg text-primary-foreground hover:opacity-90 glow-shadow group h-12 text-base"
              >
                Começar meu teste grátis
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <button
                onClick={() => {
                  trackEvent("exit_intent_dismissed");
                  setShow(false);
                }}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Não, obrigado
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
