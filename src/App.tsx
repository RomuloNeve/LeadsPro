import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import CursorTrail from "@/components/CursorTrail";

// Critical path — eagerly loaded
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-loaded pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const UserOverview = lazy(() => import("./pages/user/UserOverview"));
const UserLeads = lazy(() => import("./pages/user/UserLeads"));
const UserStats = lazy(() => import("./pages/user/UserStats"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const UserCampaigns = lazy(() => import("./pages/user/UserCampaigns"));
const UserFollowups = lazy(() => import("./pages/user/UserFollowups"));
const UserCadences = lazy(() => import("./pages/user/UserCadences"));
const UserCadenceDetail = lazy(() => import("./pages/user/UserCadenceDetail"));
const UserSearch = lazy(() => import("./pages/user/UserSearch"));
const UserLists = lazy(() => import("./pages/user/UserLists"));
const UserEmailCampaigns = lazy(() => import("./pages/user/UserEmailCampaigns"));
const UserWhatsAppInstance = lazy(() => import("./pages/user/UserWhatsAppInstance"));
const UserWhatsAppInbox = lazy(() => import("./pages/user/UserWhatsAppInbox"));
const UserChatbot = lazy(() => import("./pages/user/UserChatbot"));
const UserKanban = lazy(() => import("./pages/user/UserKanban"));
const UserWidget = lazy(() => import("./pages/user/UserWidget"));
const UserHumanSupport = lazy(() => import("./pages/user/UserHumanSupport"));
const UserAffiliate = lazy(() => import("./pages/user/UserAffiliate"));
const UserBilling = lazy(() => import("./pages/user/UserBilling"));
const Checkout = lazy(() => import("./pages/Checkout"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const FeatureCRM = lazy(() => import("./pages/features/FeatureCRM"));
const FeatureDisparo = lazy(() => import("./pages/features/FeatureDisparo"));
const FeatureFollowup = lazy(() => import("./pages/features/FeatureFollowup"));
const FeatureBusca = lazy(() => import("./pages/features/FeatureBusca"));
const FeatureEstatisticas = lazy(() => import("./pages/features/FeatureEstatisticas"));
const FeatureListas = lazy(() => import("./pages/features/FeatureListas"));
const FeatureOverview = lazy(() => import("./pages/features/FeatureOverview"));
const FeatureImportacao = lazy(() => import("./pages/features/FeatureImportacao"));
const FeatureEmailMarketing = lazy(() => import("./pages/features/FeatureEmailMarketing"));
const FeatureInbox = lazy(() => import("./pages/features/FeatureInbox"));
const FeatureCriarGrupo = lazy(() => import("./pages/features/FeatureCriarGrupo"));
const FeatureInstancia = lazy(() => import("./pages/features/FeatureInstancia"));
const FeatureChatbot = lazy(() => import("./pages/features/FeatureChatbot"));
const FeaturePipeline = lazy(() => import("./pages/features/FeaturePipeline"));
const FeatureWidget = lazy(() => import("./pages/features/FeatureWidget"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const Glossario = lazy(() => import("./pages/Glossario"));
const AffiliateSignup = lazy(() => import("./pages/AffiliateSignup"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PwaInstallBanner />
        <CursorTrail />
        <BrowserRouter>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recursos/crm" element={<FeatureCRM />} />
            <Route path="/recursos/disparo" element={<FeatureDisparo />} />
            <Route path="/recursos/followup" element={<FeatureFollowup />} />
            <Route path="/recursos/busca" element={<FeatureBusca />} />
            <Route path="/recursos/estatisticas" element={<FeatureEstatisticas />} />
            <Route path="/recursos/listas" element={<FeatureListas />} />
            <Route path="/recursos/painel" element={<FeatureOverview />} />
            <Route path="/recursos/importacao" element={<FeatureImportacao />} />
            <Route path="/recursos/email-marketing" element={<FeatureEmailMarketing />} />
            <Route path="/recursos/caixa-de-entrada" element={<FeatureInbox />} />
            <Route path="/recursos/criar-grupos" element={<FeatureCriarGrupo />} />
            <Route path="/recursos/instancia" element={<FeatureInstancia />} />
            <Route path="/recursos/chatbot-ia" element={<FeatureChatbot />} />
            <Route path="/recursos/pipeline" element={<FeaturePipeline />} />
            <Route path="/recursos/widget" element={<FeatureWidget />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/categoria/:category" element={<BlogCategory />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/glossario" element={<Glossario />} />
            <Route path="/afiliados/cadastro" element={<AffiliateSignup />} />
            <Route path="/user-dashboard" element={<UserLayout />}>
              <Route index element={<UserOverview />} />
              <Route path="search" element={<UserSearch />} />
              <Route path="leads" element={<UserLeads />} />
              <Route path="lists" element={<UserLists />} />
              <Route path="stats" element={<UserStats />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="campaigns" element={<UserCampaigns />} />
              <Route path="followups" element={<UserFollowups />} />
              <Route path="cadences" element={<UserCadences />} />
              <Route path="cadences/:id" element={<UserCadenceDetail />} />
              <Route path="email-campaigns" element={<UserEmailCampaigns />} />
              <Route path="whatsapp-instance" element={<UserWhatsAppInstance />} />
              <Route path="inbox" element={<UserWhatsAppInbox />} />
              <Route path="chatbot" element={<UserChatbot />} />
              <Route path="kanban" element={<UserKanban />} />
              <Route path="widget" element={<UserWidget />} />
              <Route path="human-support" element={<UserHumanSupport />} />
              <Route path="afiliados" element={<UserAffiliate />} />
              <Route path="billing" element={<UserBilling />} />
              
            </Route>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/install" element={<Install />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
