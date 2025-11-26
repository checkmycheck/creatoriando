import { Video, Menu, X, LogOut, User, Shield, CreditCard, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useSubscription } from "@/hooks/useSubscription";

export const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Use existing subscription hook for credits with realtime updates
  const { credits } = useSubscription();

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Video className="w-6 h-6 text-lime" />
            <span className="text-xl font-bold">Creator IA</span>
          </button>

          {/* Desktop Navigation */}
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {user && (
                  <Button variant="secondary" size="sm" className="pointer-events-none">
                    <Coins className="w-4 h-4 mr-1.5" />
                    {credits}
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/characters")}>
                  <User className="w-4 h-4 mr-2" />
                  Personagens
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="flex flex-col gap-2 p-4">
              {user ? (
                <>
                  {user && (
                    <div className="flex items-center justify-center py-2">
                      <Button variant="secondary" size="sm" className="pointer-events-none">
                        <Coins className="w-4 h-4 mr-1.5" />
                        {credits} créditos
                      </Button>
                    </div>
                  )}
                  {isAdmin && (
                    <Button variant="secondary" size="sm" onClick={() => {
                      navigate("/admin");
                      setIsMenuOpen(false);
                    }}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => {
                    navigate("/profile");
                    setIsMenuOpen(false);
                  }}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Perfil
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigate("/characters");
                    setIsMenuOpen(false);
                  }}>
                    <User className="w-4 h-4 mr-2" />
                    Personagens
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => {
                  navigate("/auth");
                  setIsMenuOpen(false);
                }}>
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};