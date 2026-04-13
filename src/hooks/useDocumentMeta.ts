import { useEffect } from "react";

interface DocumentMeta {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
}

function setMetaTag(selector: string, content: string, attr = "content") {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, content);
}

export function useDocumentMeta({ title, description, ogImage, ogType, twitterCard, canonicalUrl }: DocumentMeta) {
  useEffect(() => {
    document.title = title;

    setMetaTag('meta[name="description"]', description);
    setMetaTag('meta[property="og:title"]', title);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[name="twitter:title"]', title);
    setMetaTag('meta[name="twitter:description"]', description);

    if (ogImage) {
      setMetaTag('meta[property="og:image"]', ogImage);
      setMetaTag('meta[name="twitter:image"]', ogImage);
    }

    if (ogType) {
      setMetaTag('meta[property="og:type"]', ogType);
    }

    if (twitterCard) {
      setMetaTag('meta[name="twitter:card"]', twitterCard);
    }

    if (canonicalUrl) {
      setMetaTag('meta[property="og:url"]', canonicalUrl);
      // Update the <link rel="canonical"> tag dynamically
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonicalUrl;
    }

    return () => {
      document.title = "Ferramenta de Captura de Leads e Automação de Vendas | LeadsPro";
      // Reset canonical to homepage
      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonicalLink) canonicalLink.href = "https://leadspro.app/";
      // Reset OG tags to defaults
      setMetaTag('meta[property="og:type"]', "website");
      setMetaTag('meta[property="og:url"]', "https://leadspro.app/");
      setMetaTag('meta[name="twitter:card"]', "summary_large_image");
      setMetaTag('meta[property="og:image"]', "https://storage.googleapis.com/gpt-engineer-file-uploads/hkXhb27dyBhrOVJ6e2R9wWptsH23/social-images/social-1772722602961-Gestorx_(6).webp");
      setMetaTag('meta[name="twitter:image"]', "https://storage.googleapis.com/gpt-engineer-file-uploads/hkXhb27dyBhrOVJ6e2R9wWptsH23/social-images/social-1772722602961-Gestorx_(6).webp");
    };
  }, [title, description, ogImage, ogType, twitterCard, canonicalUrl]);
}
