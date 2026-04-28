import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

/**
 * TestimonialMarquee — three vertical scrolling columns of testimonial
 * cards, each at a different speed and direction. Adapted from the
 * creative-agency reference. Content is duplicated inside each track
 * so the loop is seamless.
 *
 * Speed accelerates with the user's scroll velocity (decays back to
 * baseline) — the section feels alive as you scroll past it.
 *
 * Cards alternate between three visual styles to keep the wall varied:
 *  - dashed border + zinc-900/20
 *  - solid white/5 border + zinc-900/40
 *  - dashed black/50 + italic copy
 */

interface Testimonial {
  text: string;
  name: string;
  role?: string;
  metric?: string;
  metricLabel?: string;
  stars?: number;
  avatar?: string;
  variant: "long" | "short" | "italic";
}

const COLUMN_A: Testimonial[] = [
  {
    text: "Antes eu perdia 2 horas por dia copiando dados. Com o LeadsPro, capturo mais de 50 leads por dia em minutos. Meu faturamento triplicou em 60 dias.",
    name: "Carlos M.",
    role: "Corretor de Imóveis",
    metric: "+300%",
    stars: 5,
    variant: "long",
  },
  {
    text: "Sem complicação, conectei meu WhatsApp em 1 minuto e já saí disparando.",
    name: "@thales.vende",
    variant: "short",
  },
  {
    text: "O chatbot IA fechou 3 vendas enquanto eu dormia. Sério, mágico.",
    name: "Patrícia L.",
    role: "Salão de Beleza",
    metric: "24/7",
    stars: 5,
    variant: "long",
  },
  {
    text: "Cancelei o RD Station. O LeadsPro faz tudo num só lugar e sai pela metade do preço.",
    name: "@founder.flowx",
    variant: "italic",
  },
];

const COLUMN_B: Testimonial[] = [
  {
    text: "O disparo em massa pelo WhatsApp transformou minha operação. Meus clientes não acreditam na velocidade que entrego resultados.",
    name: "Amanda S.",
    role: "Consultora de Marketing",
    metric: "200+",
    stars: 5,
    variant: "long",
  },
  {
    text: "Capturei 400 leads de dentistas em 1 hora. INSANO. 🚀",
    name: "@gustavo.crm",
    variant: "italic",
  },
  {
    text: "A calculadora de ROI me mostrou que estava deixando R$ 8 mil/mês na mesa. Assinei na hora.",
    name: "Felipe R.",
    role: "Dono de Agência",
    metric: "R$ 8k/mês",
    stars: 5,
    variant: "long",
  },
  {
    text: "Pipeline Kanban + automação de follow-up = vendi 2x mais sem aumentar minha equipe.",
    name: "Marina T.",
    role: "B2B SaaS",
    metric: "2x",
    stars: 5,
    variant: "long",
  },
];

const COLUMN_C: Testimonial[] = [
  {
    text: "Cancelei 3 ferramentas no primeiro mês. Os follow-ups automáticos sozinhos me trouxeram 40 novos clientes. ROI absurdo.",
    name: "Ricardo O.",
    role: "Dono de Agência Digital",
    metric: "40 clientes",
    stars: 5,
    variant: "long",
  },
  {
    text: "Suporte humano respondendo em minutos, não horas. Diferença gigante.",
    name: "@livia.consultora",
    variant: "short",
  },
  {
    text: "De 10 leads por dia para mais de 80. O investimento se pagou na primeira semana.",
    name: "Juliana C.",
    role: "Vendedora Digital",
    metric: "8x",
    stars: 5,
    variant: "long",
  },
  {
    text: "Finalmente uma ferramenta brasileira que não parece tradução do gringo.",
    name: "@bruno.vendas",
    variant: "italic",
  },
];

function Card({ t }: { t: Testimonial }) {
  if (t.variant === "short") {
    return (
      <div className="p-6 border border-white/5 bg-zinc-900/40 backdrop-blur-sm">
        <p className="text-zinc-400 text-sm font-sans mb-3 leading-relaxed">"{t.text}"</p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/30">
            {t.name.startsWith("@") ? t.name[1].toUpperCase() : t.name[0]}
          </div>
          <span className="text-xs text-zinc-500 font-mono">{t.name}</span>
        </div>
      </div>
    );
  }

  if (t.variant === "italic") {
    return (
      <div className="p-6 border border-zinc-800 border-dashed bg-black/50">
        <p className="text-zinc-300 mb-4 font-sans text-sm italic leading-relaxed">"{t.text}"</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono">{t.name}</span>
        </div>
      </div>
    );
  }

  // Long variant
  return (
    <div className="p-7 border border-zinc-800 border-dashed bg-zinc-900/20 backdrop-blur-sm">
      {t.stars && (
        <div className="flex gap-1 text-primary mb-4">
          {Array.from({ length: t.stars }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      )}
      <p className="text-zinc-300 font-medium font-sans mb-5 leading-relaxed text-sm">
        "{t.text}"
      </p>
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800 border-dashed">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
            {t.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white font-semibold font-display truncate">{t.name}</div>
            {t.role && <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider truncate">{t.role}</div>}
          </div>
        </div>
        {t.metric && (
          <div className="text-right shrink-0">
            <div className="text-base font-medium font-display text-primary tabular-nums leading-none">
              {t.metric}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Track({ direction, baseSpeed, items }: { direction: "up" | "down"; baseSpeed: number; items: Testimonial[] }) {
  return (
    <div className="h-full overflow-hidden relative">
      <div
        className="marquee-track flex flex-col gap-6 will-change-transform"
        data-direction={direction}
        data-speed={baseSpeed}
      >
        {/* Duplicate the content so the loop is seamless */}
        {[...items, ...items].map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialMarquee() {
  // Hooks up all .marquee-track elements with a requestAnimationFrame loop
  // that translates them vertically. Speeds up briefly when the user scrolls
  // the page (decays back to baseline). Effect adapted from the reference.
  useEffect(() => {
    const tracks = Array.from(document.querySelectorAll<HTMLElement>(".marquee-track"));
    if (!tracks.length) return;

    type State = {
      element: HTMLElement;
      direction: 1 | -1;
      baseSpeed: number;
      currentPos: number;
      contentHeight: number;
    };

    const states: State[] = tracks.map((track) => {
      const dir = (track.getAttribute("data-direction") || "up").toLowerCase();
      const baseSpeed = parseFloat(track.getAttribute("data-speed") || "0.5");
      return {
        element: track,
        direction: dir === "down" ? 1 : -1,
        baseSpeed,
        currentPos: 0,
        contentHeight: 0,
      };
    });

    // Re-measure when content is loaded (allows for fonts/images to settle)
    const measure = () => {
      states.forEach((s) => {
        s.contentHeight = s.element.offsetHeight / 2;
      });
    };
    measure();
    setTimeout(measure, 200);
    setTimeout(measure, 600);

    let scrollSpeed = 0;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const now = window.scrollY;
      const delta = now - lastScrollY;
      lastScrollY = now;
      scrollSpeed = Math.max(-15, Math.min(15, delta));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    const tick = () => {
      scrollSpeed *= 0.9;
      if (Math.abs(scrollSpeed) < 0.01) scrollSpeed = 0;

      states.forEach((s) => {
        const speed = s.baseSpeed + scrollSpeed * 0.5;
        s.currentPos += speed * s.direction;

        if (s.direction === -1 && s.contentHeight > 0 && s.currentPos <= -s.contentHeight) {
          s.currentPos += s.contentHeight;
        }
        if (s.direction === 1 && s.contentHeight > 0 && s.currentPos >= 0) {
          s.currentPos -= s.contentHeight;
        }

        s.element.style.transform = `translate3d(0px, ${s.currentPos.toFixed(2)}px, 0px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Honor prefers-reduced-motion: render a flat 3-column grid instead.
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-6">
        {[...COLUMN_A, ...COLUMN_B, ...COLUMN_C].map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden bg-black w-full h-[800px] relative"
      id="marquee-wrapper"
      style={{
        maskImage: "linear-gradient(180deg, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(180deg, transparent, black 12%, black 88%, transparent)",
      }}
    >
      {/* Top + bottom black gradient masks for crisp edges */}
      <div
        className="z-10 pointer-events-none bg-gradient-to-b from-black to-transparent w-full h-32 absolute top-0 left-0"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"
        aria-hidden
      />

      {/* Three-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-full max-w-7xl mx-auto px-6 gap-6">
        <Track direction="up"   baseSpeed={0.5}  items={COLUMN_A} />
        {/* Hide column B on tablet/mobile to keep density readable */}
        <div className="hidden md:block h-full overflow-hidden relative">
          <div
            className="marquee-track flex flex-col gap-6 will-change-transform"
            data-direction="down"
            data-speed="0.6"
          >
            {[...COLUMN_B, ...COLUMN_B].map((t, i) => (
              <Card key={i} t={t} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block h-full overflow-hidden relative">
          <div
            className="marquee-track flex flex-col gap-6 will-change-transform"
            data-direction="up"
            data-speed="0.55"
          >
            {[...COLUMN_C, ...COLUMN_C].map((t, i) => (
              <Card key={i} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
