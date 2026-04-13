import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  emoji: string;
  text: string;
}

interface PageTutorialProps {
  title: string;
  description: string;
  steps: TutorialStep[];
  image?: string;
}

export function PageTutorial({ title, description, steps, image }: PageTutorialProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Como usar: {title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/10">
          <p className="text-sm text-muted-foreground pt-3">{description}</p>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="flex-shrink-0 mt-0.5">{step.emoji}</span>
                <span className="text-foreground/90">{step.text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span>Dica: clique aqui novamente para fechar este tutorial.</span>
          </div>
          {image && (
            <div className="pt-2">
              <img src={image} alt={`Preview de ${title}`} className="w-full rounded-lg border border-border shadow-sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
