import { useState } from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useUserData } from "@/hooks/useUserData";
import BuyCreditsDialog from "@/components/BuyCreditsDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  LogOut,
  BarChart3,
  MessageCircle,
  Clock,
  User,
  Search,
  Phone,
  Mail,
  Smartphone,
  Bot,
  Kanban,
  Code,
  Headphones,
  Coins,
  Gift,
  CreditCard,
} from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full-text.png";

const mainItems = [
  { title: "Painel", url: "/user-dashboard", icon: LayoutDashboard },
  { title: "Integração via QR Code", url: "/user-dashboard/whatsapp-instance", icon: Smartphone },
  { title: "Faturamento", url: "/user-dashboard/billing", icon: CreditCard },
  { title: "Buscar Leads", url: "/user-dashboard/search", icon: Search },
  { title: "CRM", url: "/user-dashboard/leads", icon: Users },
  { title: "Pipeline", url: "/user-dashboard/kanban", icon: Kanban },
  { title: "Listas", url: "/user-dashboard/lists", icon: FolderOpen },
  { title: "Estatísticas", url: "/user-dashboard/stats", icon: BarChart3 },
  { title: "Disparo WhatsApp", url: "/user-dashboard/campaigns", icon: MessageCircle },
  { title: "Caixa de Entrada", url: "/user-dashboard/inbox", icon: WhatsAppIcon },
  { title: "Email Marketing", url: "/user-dashboard/email-campaigns", icon: Mail },
  { title: "Follow-ups", url: "/user-dashboard/followups", icon: Clock },
  { title: "Chatbot IA", url: "/user-dashboard/chatbot", icon: Bot },
  { title: "Atendimento Humano", url: "/user-dashboard/human-support", icon: Headphones },
  { title: "Widget de Captura", url: "/user-dashboard/widget", icon: Code },
  { title: "Programa de Afiliados", url: "/user-dashboard/afiliados", icon: Gift },
];

const configItems = [
  { title: "Suporte", url: "#support", icon: MessageCircle, isSupport: true },
];

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { license } = useUserData();
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);

  const monthlyCredits = license?.monthly_credits || 0;
  const extraCredits = license?.extra_credits || 0;
  const usedCredits = license?.used_credits || 0;
  const totalCredits = Math.max(0, monthlyCredits + extraCredits - usedCredits);
  const totalPool = monthlyCredits + extraCredits;
  const usagePercent = totalPool > 0 ? Math.round((usedCredits / totalPool) * 100) : 0;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className={`flex items-center justify-center py-4 ${collapsed ? "px-1" : "px-4"}`}>
          {collapsed ? (
            <img src={logoIcon} alt="LeadsPro" className="flex-shrink-0 object-contain h-8 w-8" />
          ) : (
            <img src={logoFull} alt="LeadsPro" className="flex-shrink-0 object-contain h-14" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/user-dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.isSupport ? (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
                        className="flex items-center w-full hover:bg-muted/50"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    ) : (
                      <NavLink
                        to={item.url}
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && license && (
          <div className="px-3 py-2 space-y-2">
            {/* Credit usage card */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Créditos de prospecção</span>
                <span className="text-xs font-bold text-foreground">{totalCredits.toLocaleString("pt-BR")} restantes</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-yellow-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, 100 - usagePercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{usedCredits.toLocaleString("pt-BR")} usados</span>
                <span>{totalPool.toLocaleString("pt-BR")} total</span>
              </div>
            </div>

            {/* Buy credits button */}
            <button
              onClick={() => setBuyCreditsOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl gradient-bg text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow-shadow"
            >
              <Coins className="h-4 w-4" />
              Comprar créditos extras
            </button>
          </div>
        )}
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"} px-2 py-2`}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
      <BuyCreditsDialog open={buyCreditsOpen} onOpenChange={setBuyCreditsOpen} />
    </Sidebar>
  );
}
