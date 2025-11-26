import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    checkUserAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUserAccess();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Check if user's access has expired (1 year from creation)
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      const createdAt = new Date(profile.created_at);
      const expirationDate = new Date(createdAt);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      
      if (new Date() > expirationDate) {
        setIsExpired(true);
        await supabase.auth.signOut();
        toast.error("Seu acesso expirou após 1 ano. Entre em contato para renovar.");
        setLoading(false);
        return;
      }
    }

    setUser(session.user);
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || isExpired) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
