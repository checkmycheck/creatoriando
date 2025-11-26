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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { plan, characterCount, characterLimit, canCreateMore } = useSubscription();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
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

  const isPremium = plan === "pro" || plan === "enterprise";
  const creditsUsed = characterCount;
  const creditsAvailable = (user?.credits || 0);
  const creditsFromPlan = isPremium ? "∞" : characterLimit;
  const creditsTotal = isPremium ? "∞" : characterLimit + creditsAvailable;
  const creditsRemaining = isPremium ? "∞" : Math.max(0, characterLimit - characterCount + creditsAvailable);
  const usagePercentage = isPremium ? 0 : ((characterCount - creditsAvailable) / characterLimit) * 100;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações e veja seus créditos
            </p>
          </div>

          {/* Credits Card */}
          <Card className="border-lime/50 bg-gradient-to-br from-lime/5 to-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-lime" />
                    Créditos Disponíveis
                  </CardTitle>
                  <CardDescription>
                    1 crédito = 1 personagem criado
                  </CardDescription>
                </div>
                <Badge 
                  variant={isPremium ? "default" : "secondary"}
                  className={isPremium ? "bg-lime text-lime-foreground" : ""}
                >
                  {plan === "pro" ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Plano Pro
                    </>
                  ) : plan === "enterprise" ? (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Plano Enterprise
                    </>
                  ) : (
                    "Plano Free"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Usados</p>
                  <p className="text-3xl font-bold text-lime">{creditsUsed}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Extras</p>
                  <p className="text-3xl font-bold">{creditsAvailable}</p>
                  <p className="text-xs text-muted-foreground mt-1">+ {creditsFromPlan} do plano</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-bold">{creditsTotal}</p>
                </div>
              </div>

              {!isPremium && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uso</span>
                      <span className="font-medium">{Math.round(usagePercentage)}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>

                  {!canCreateMore && (
                    <Alert className="border-lime/50 bg-lime/5">
                      <Sparkles className="h-4 w-4 text-lime" />
                      <AlertDescription>
                        Você atingiu o limite do plano gratuito. Faça upgrade para criar personagens ilimitados!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={() => navigate("/buy-credits")} 
                    className="w-full bg-lime text-lime-foreground hover:bg-lime/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Comprar Mais Créditos
                  </Button>
                </>
              )}

              {isPremium && (
                <Alert className="border-lime/50 bg-lime/5">
                  <Crown className="h-4 w-4 text-lime" />
                  <AlertDescription>
                    Você tem créditos ilimitados! Crie quantos personagens quiser.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>

              {user?.full_name && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{user.full_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                  <p className="font-medium">
                    {new Date(user?.created_at).toLocaleDateString("pt-BR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Acesso expira em</p>
                  <p className="font-medium">
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
                  <p className="text-xs text-muted-foreground mt-1">
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
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/characters")}
              className="h-auto py-4"
            >
              <div className="text-left w-full">
                <p className="font-semibold mb-1">Meus Personagens</p>
                <p className="text-sm text-muted-foreground">Ver todos os personagens criados</p>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/create")}
              className="h-auto py-4"
              disabled={!canCreateMore}
            >
              <div className="text-left w-full">
                <p className="font-semibold mb-1">Criar Personagem</p>
                <p className="text-sm text-muted-foreground">Usar um crédito para criar</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
  );
}