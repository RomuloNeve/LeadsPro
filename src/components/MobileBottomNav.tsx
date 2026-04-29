import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  MessageCircle,
  MoreHorizontal,
  FolderOpen,
  BarChart3,
  Clock,
  Mail,
  Smartphone,
  User,
  LogOut,
  X,
  Bot,
  Kanban,
  Headphones,
  Code,
  Gift,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";

const mainTabs = [
  { title: "Painel", url: "/user-dashboard", icon: LayoutDashboard, end: true },
  { title: "Buscar", url: "/user-dashboard/search", icon: Search },
  { title: "CRM", url: "/user-dashboard/leads", icon: Users },
  { title: "Campanhas", url: "/user-dashboard/campaigns", icon: MessageCircle },
  { title: "Mais", url: "", icon: MoreHorizontal },
];

const moreItems = [
  { title: "Integração via QR Code", url: "/user-dashboard/whatsapp-instance", icon: Smartphone },
  { title: "Pipeline (Funil)", url: "/user-dashboard/kanban", icon: Kanban },
  { title: "Listas", url: "/user-dashboard/lists", icon: FolderOpen },
  { title: "Estatísticas", url: "/user-dashboard/stats", icon: BarChart3 },
  { title: "Caixa de Entrada", url: "/user-dashboard/inbox", icon: WhatsAppIcon },
  { title: "Email Marketing", url: "/user-dashboard/email-campaigns", icon: Mail },
  { title: "Follow-ups", url: "/user-dashboard/followups", icon: Clock },
  { title: "Chatbot IA", url: "/user-dashboard/chatbot", icon: Bot },
  { title: "Atendimento Humano", url: "/user-dashboard/human-support", icon: Headphones },
  { title: "Widget de Captura", url: "/user-dashboard/widget", icon: Code },
  { title: "Programa de Afiliados", url: "/user-dashboard/afiliados", icon: Gift },
  { title: "Faturamento", url: "/user-dashboard/billing", icon: Mail },
  { title: "Perfil", url: "/user-dashboard/profile", icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (url: string, end?: boolean) => {
    if (!url) return false;
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative bg-card border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold font-display text-foreground">Menu</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {moreItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    navigate(item.url);
                    setDrawerOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-colors ${
                    isActive(item.url)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.title}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mainTabs.map((tab) => {
            const active = tab.url ? isActive(tab.url, tab.end) : drawerOpen;
            return (
              <button
                key={tab.title}
                onClick={() => {
                  if (tab.title === "Mais") {
                    setDrawerOpen(!drawerOpen);
                  } else {
                    navigate(tab.url);
                    setDrawerOpen(false);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.title}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
