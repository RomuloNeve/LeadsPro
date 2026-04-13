// Google Analytics 4 event tracking utility
// Measurement ID: G-MC7HMKPN63

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = "G-MC7HMKPN63";

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};

// ── Conversion Events ──

export const trackSignup = (plan: string) => {
  trackEvent("sign_up", {
    method: "email",
    plan_type: plan,
  });
};

export const trackLogin = () => {
  trackEvent("login", { method: "email" });
};

export const trackCheckoutStart = (plan: string, amount: number) => {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value: amount,
    items: [{ item_name: `Plano ${plan}`, price: amount }],
  });
};

export const trackPixGenerated = (plan: string, amount: number) => {
  trackEvent("add_payment_info", {
    currency: "BRL",
    value: amount,
    payment_type: "pix",
    plan_type: plan,
  });
};

export const trackPurchaseComplete = (plan: string, amount: number) => {
  trackEvent("purchase", {
    currency: "BRL",
    value: amount,
    transaction_id: `pix_${Date.now()}`,
    items: [{ item_name: `Plano ${plan}`, price: amount }],
  });
};

export const trackLicenseActivation = (planType: string) => {
  trackEvent("license_activation", {
    plan_type: planType,
  });
};

export const trackFreeTrialStart = () => {
  trackEvent("free_trial_start", {
    plan_type: "free",
  });
};

export const trackLeadSearch = (query: string) => {
  trackEvent("lead_search", { search_term: query });
};

export const trackCampaignCreated = () => {
  trackEvent("campaign_created");
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });
};
