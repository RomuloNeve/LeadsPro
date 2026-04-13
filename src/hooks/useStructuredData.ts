import { useEffect } from "react";

interface SchemaConfig {
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  videoThumbnail?: string;
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  softwareFeatures?: string[];
  pageUrl: string;
  pageTitle: string;
  pageDescription: string;
}

/**
 * Injects structured data schemas into the page head for SEO.
 * Supports VideoObject, FAQPage, BreadcrumbList schemas.
 */
export function useStructuredData(config: SchemaConfig) {
  useEffect(() => {
    const schemas: any[] = [];
    const siteUrl = "https://leadspro.app";

    // BreadcrumbList
    if (config.breadcrumbs && config.breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          ...config.breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: b.name,
            item: b.url.startsWith("http") ? b.url : `${siteUrl}${b.url}`,
          })),
        ],
      });
    }

    // VideoObject
    if (config.videoUrl) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: config.videoTitle || config.pageTitle,
        description: config.videoDescription || config.pageDescription,
        thumbnailUrl: config.videoThumbnail || `${siteUrl}/og-image.jpg`,
        uploadDate: "2025-01-01",
        contentUrl: config.videoUrl.startsWith("http") ? config.videoUrl : `${siteUrl}${config.videoUrl}`,
        embedUrl: config.videoUrl.startsWith("http") ? config.videoUrl : `${siteUrl}${config.videoUrl}`,
        publisher: {
          "@type": "Organization",
          name: "LeadsPro",
          logo: { "@type": "ImageObject", url: `${siteUrl}/logo-full.png` },
        },
      });
    }

    // FAQPage
    if (config.faqs && config.faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: config.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    // WebPage
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.pageTitle,
      description: config.pageDescription,
      url: config.pageUrl.startsWith("http") ? config.pageUrl : `${siteUrl}${config.pageUrl}`,
      isPartOf: { "@type": "WebSite", name: "LeadsPro", url: siteUrl },
    });

    if (schemas.length === 0) return;

    const scriptId = "page-structured-data";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemas);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [config.pageUrl]);
}
