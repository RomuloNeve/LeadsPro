import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import avatarCarlos from "@/assets/avatar-carlos.jpg";
import avatarAmanda from "@/assets/avatar-amanda.jpg";
import avatarRicardo from "@/assets/avatar-ricardo.jpg";
import avatarJuliana from "@/assets/avatar-juliana.jpg";
import avatarRomulo from "@/assets/avatar-romulo.jpg";

/**
 * TestimonialMarquee — three vertical scrolling columns of testimonial
 * cards, each at a different speed and direction. Adapted from the
 * creative-agency reference. Content is duplicated inside each track
 * so the loop is seamless.
 *
 * Avatars: 5 curated local portraits (avatarCarlos/Amanda/Ricardo/
 * Juliana/Romulo) for the "named" testimonials + 7 unique realistic
 * portraits from randomuser.me for the rest. All 12 testimonials have
 * a unique face — no repeats.
 */

interface Testimonial {
  text: string;
  name: string;
  role?: string;
  metric?: string;
  metricLabel?: string;
  stars?: number;
  avatar: string;
  variant: "long" | "short" | "italic";
}

// randomuser.me serves real, consenting portraits at deterministic URLs.
// Picked specific IDs to ensure visual variety (age + gender + framing).
const ru = (gender: "men" | "women", id: number) =>
  `https://randomuser.me/api/portraits/${gender}/${id}.jpg`;

// 18 testimonials total — 6 per column. All 18 avatars are unique.
// Local: 5 curated. Remote: 13 distinct randomuser.me IDs.

const COLUMN_A: Testimonial[] = [
  {
    text: "Antes eu perdia 2 horas por dia copiando dados. Com o LeadsPro, capturo mais de 50 leads por dia em minutos. Meu faturamento triplicou em 60 dias.",
    name: "Carlos M.",
    role: "Corretor de Imóveis",
    metric: "+300%",
    stars: 5,
    avatar: avatarCarlos,
    variant: "long",
  },
  {
    text: "Sem complicação, conectei meu WhatsApp em 1 minuto e já saí disparando.",
    name: "Thales R.",
    role: "Founder",
    avatar: ru("men", 32),
    variant: "short",
  },
  {
    text: "O chatbot IA fechou 3 vendas enquanto eu dormia. Sério, mágico.",
    name: "Patrícia L.",
    role: "Salão de Beleza",
    metric: "24/7",
    stars: 5,
    avatar: ru("women", 24),
    variant: "long",
  },
  {
    text: "Cancelei o RD Station. O LeadsPro faz tudo num só lugar e sai pela metade do preço.",
    name: "Diego S.",
    role: "@founder.flowx",
    avatar: ru("men", 47),
    variant: "italic",
  },
  {
    text: "Onde estava essa ferramenta nos últimos 5 anos? Já paguei 3x o que custou.",
    name: "Henrique B.",
    role: "Imobiliária",
    metric: "ROI 3×",
    stars: 5,
    avatar: ru("men", 11),
    variant: "long",
  },
  {
    text: "Configurei a cadência de follow-up domingo, segunda fechei 4 leads frios.",
    name: "Aline V.",
    role: "@aline.consultoria",
    avatar: ru("women", 9),
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
    avatar: avatarAmanda,
    variant: "long",
  },
  {
    text: "Capturei 400 leads de dentistas em 1 hora. INSANO. 🚀",
    name: "Gustavo P.",
    role: "@gustavo.crm",
    avatar: ru("men", 65),
    variant: "italic",
  },
  {
    text: "A calculadora de ROI me mostrou que estava deixando R$ 8 mil/mês na mesa. Assinei na hora.",
    name: "Felipe R.",
    role: "Dono de Agência",
    metric: "R$ 8k/mês",
    stars: 5,
    avatar: avatarRomulo,
    variant: "long",
  },
  {
    text: "Pipeline Kanban + automação de follow-up = vendi 2x mais sem aumentar minha equipe.",
    name: "Marina T.",
    role: "B2B SaaS",
    metric: "2x",
    stars: 5,
    avatar: ru("women", 56),
    variant: "long",
  },
  {
    text: "Importei 3 mil leads de planilha em 1 click. CRM lindo de organizado.",
    name: "Pedro N.",
    role: "Coach Vendas",
    avatar: ru("men", 22),
    variant: "short",
  },
  {
    text: "Lista personalizada por cor + segmentação por categoria. Detalhe que muda tudo.",
    name: "Beatriz O.",
    role: "Agência Local",
    metric: "Top 3",
    stars: 5,
    avatar: ru("women", 38),
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
    avatar: avatarRicardo,
    variant: "long",
  },
  {
    text: "Suporte humano respondendo em minutos, não horas. Diferença gigante.",
    name: "Lívia M.",
    role: "Consultora",
    avatar: ru("women", 79),
    variant: "short",
  },
  {
    text: "De 10 leads por dia para mais de 80. O investimento se pagou na primeira semana.",
    name: "Juliana C.",
    role: "Vendedora Digital",
    metric: "8x",
    stars: 5,
    avatar: avatarJuliana,
    variant: "long",
  },
  {
    text: "Finalmente uma ferramenta brasileira que não parece tradução do gringo.",
    name: "Bruno A.",
    role: "@bruno.vendas",
    avatar: ru("men", 83),
    variant: "italic",
  },
  {
    text: "Vou contratar mais um vendedor só pra atender o volume novo de leads.",
    name: "Rafael S.",
    role: "Construtora",
    metric: "+5 vendas/mês",
    stars: 5,
    avatar: ru("men", 53),
    variant: "long",
  },
  {
    text: "Widget de captura no site começou a gerar leads na primeira hora 😍",
    name: "Camila R.",
    role: "@camila.lead",
    avatar: ru("women", 16),
    variant: "italic",
  },
];

function Card({ t }: { t: Testimonial }) {
  if (t.variant === "short") {
    return (
      <div className="p-6 border border-white/5 bg-zinc-900/40 backdrop-blur-sm">
        <p className="text-zinc-400 text-sm font-sans mb-4 leading-relaxed">"{t.text}"</p>
        <div className="flex items-center gap-2.5">
          <img
            src={t.avatar}
            alt={t.name}
            loading="lazy"
            className="w-7 h-7 object-cover border border-white/10"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white font-medium">{t.name}</span>
            {t.role && <span className="text-[10px] text-zinc-500 font-mono">{t.role}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (t.variant === "italic") {
    return (
      <div className="p-6 border border-zinc-800 border-dashed bg-black/50">
        <p className="text-zinc-300 mb-4 font-sans text-sm italic leading-relaxed">"{t.text}"</p>
        <div className="flex items-center gap-2.5">
          <img
            src={t.avatar}
            alt={t.name}
            loading="lazy"
            className="w-7 h-7 object-cover grayscale border border-white/10"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-white font-medium">{t.name}</span>
            {t.role && <span className="text-[10px] text-zinc-500 font-mono">{t.role}</span>}
          </div>
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
          <img
            src={t.avatar}
            alt={t.name}
            loading="lazy"
            className="w-9 h-9 object-cover border border-white/10 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="text-sm text-white font-semibold font-display truncate">{t.name}</div>
            {t.role && (
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider truncate">
                {t.role}
              </div>
            )}
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
    setTimeout(measure, 1500); // again after remote avatars finish loading

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
        <Track direction="up" baseSpeed={0.5} items={COLUMN_A} />
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
