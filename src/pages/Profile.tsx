import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Mail, Calendar, CreditCard, Crown, Sparkles, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { credits, canCreateMore } = useSubscription();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setUser({
      ...user,
      ...profile
    });
    setLoading(false);
  };

  const creditsAvailable = (user?.credits || 0);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Meu Perfil</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              Gerencie suas informações e veja seus créditos
            </p>
          </div>

          {/* Credits Card */}
          <Card className="border-lime/50 bg-gradient-to-br from-lime/5 to-background">
            {loading ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-4 w-16 mx-auto mb-1" />
                        <Skeleton className="h-9 w-12 mx-auto" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </>
            ) : (
              <>
                  <CardHeader>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-lime" />
                          Créditos Disponíveis
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          1 crédito = 1 personagem criado
                        </CardDescription>
                      </div>
                 </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="text-center py-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Créditos Disponíveis</p>
                <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-lime">{typeof creditsAvailable === 'number' ? creditsAvailable.toLocaleString('pt-BR') : creditsAvailable}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">1 crédito = 1 personagem</p>
              </div>

              {!canCreateMore && (
                <Alert className="border-lime/50 bg-lime/5">
                  <Sparkles className="h-4 w-4 text-lime" />
                  <AlertDescription>
                    Você não tem créditos disponíveis. Compre mais créditos para continuar criando!
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={() => navigate("/pacotes")} 
                className="w-full bg-lime text-lime-foreground hover:bg-lime/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Comprar Mais Créditos
              </Button>
            </CardContent>
            </>
          )}
          </Card>

          {/* User Info Card */}
          <Card>
            {loading ? (
              <>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Informações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm sm:text-base truncate">{user?.email}</p>
                    </div>
                  </div>

                  {user?.full_name && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium text-sm sm:text-base">{user.full_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Membro desde</p>
                      <p className="font-medium text-sm sm:text-base">
                        {new Date(user?.created_at).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">Acesso expira em</p>
                      <p className="font-medium text-sm sm:text-base">
                        {(() => {
                          const created = new Date(user?.created_at);
                          const expiration = new Date(created);
                          expiration.setFullYear(expiration.getFullYear() + 1);
                          return expiration.toLocaleDateString("pt-BR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          });
                        })()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {(() => {
                          const created = new Date(user?.created_at);
                          const expiration = new Date(created);
                          expiration.setFullYear(expiration.getFullYear() + 1);
                          const days = Math.ceil((expiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return days > 0 ? `${days} dias restantes` : "Acesso expirado";
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/characters")}
              className="h-auto py-3 sm:py-4"
            >
              <div className="text-left w-full">
                <p className="font-semibold mb-1 text-sm sm:text-base">Meus Personagens</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Ver todos os personagens criados</p>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/create")}
              className="h-auto py-3 sm:py-4"
              disabled={!canCreateMore}
            >
              <div className="text-left w-full">
                <p className="font-semibold mb-1 text-sm sm:text-base">Criar Personagem</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Usar um crédito para criar</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
  );
}