import { LayoutDashboard, Plus, User, LogOut, Shield, Coins } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { AddCreditsModal } from "./credits/AddCreditsModal";
import { Button } from "./ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Criar Novo", url: "/create", icon: Plus },
  { title: "Personagens", url: "/characters", icon: LayoutDashboard },
  { title: "Perfil", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { credits } = useSubscription();
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";
  const shouldShowText = isMobile || !isCollapsed;

  const handleMouseEnter = () => {
    if (!isMobile) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setOpen(false);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <Sidebar
        className={isCollapsed ? "w-14" : "w-60"}
        collapsible="icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className={`px-2 py-3 ${isCollapsed && !isMobile ? 'flex justify-center' : ''}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsCreditsModalOpen(true)}
                      className="w-full cursor-pointer hover:bg-secondary/80"
                    >
                      <Coins className="w-4 h-4" />
                      {shouldShowText && <span className="ml-2">{credits} créditos</span>}
                    </Button>
                  </div>
                </SidebarMenuItem>

                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className="hover:bg-muted/50" 
                        activeClassName="bg-muted text-primary font-medium"
                        onClick={handleNavClick}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {shouldShowText && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/admin" 
                    end 
                    className="hover:bg-muted/50" 
                    activeClassName="bg-muted text-primary font-medium"
                    onClick={handleNavClick}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {shouldShowText && <span>Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {shouldShowText && <span>Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AddCreditsModal 
        open={isCreditsModalOpen} 
        onOpenChange={setIsCreditsModalOpen} 
      />
    </>
  );
}
