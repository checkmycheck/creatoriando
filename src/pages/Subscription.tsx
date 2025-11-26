import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Sparkles, Users, Zap, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  subscription_plan: string;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  credits: number;
  created_at: string | null;
  full_name: string | null;
  email: string;
}

const plans = [
  {
    id: "free",
    name: "Gratuito",
    icon: Sparkles,
    price: "R$ 0",
    period: "para sempre",
    description: "Perfeito para testar",
    features: [
      "Até 1 personagem",
      "Todas as 13 configurações",
      "Prompts Veo3 otimizados",
      "Suporte por email",
    ],
    limitations: [
      "Sem personagens ilimitados",
      "Sem sistema de favoritos",
      "Sem templates exclusivos",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "R$ 29",
    period: "por mês",
    description: "Para criadores profissionais",
    popular: true,
    features: [
      "Personagens ilimitados",
      "Sistema de favoritos",
      "Editar personagens salvos",
      "Geração com IA integrada",
      "Suporte prioritário",
      "Templates exclusivos",
    ],
  },
  {
    id: "enterprise",
    name: "Empresarial",
    icon: Users,
    price: "Personalizado",
    period: "contato",
    description: "Para equipes e agências",
    features: [
      "Tudo do plano Pro",
      "Múltiplos usuários",
      "API dedicada",
      "Suporte 24/7",
      "Treinamento personalizado",
      "SLA garantido",
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { plan, credits, isLoading: subscriptionLoading } = useSubscription();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_started_at, subscription_expires_at, subscription_status, credits, created_at, full_name, email")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar dados da assinatura");
    } else {
      setProfileData(data);
    }
    
    setLoading(false);
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case "enterprise":
        return "default";
      case "pro":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleUpgrade = (planId: string) => {
    if (planId === "enterprise") {
      toast.info("Entre em contato: contato@creatorai.com");
      return;
    }
    
    if (planId === "pro") {
      toast.info("Upgrade para plano Pro em breve! Sistema de pagamento em desenvolvimento.");
      return;
    }
    
    toast.info("Este é o plano gratuito. Faça upgrade para Pro para desbloquear todos os recursos!");
  };

  const isCurrentPlan = (planId: string) => planId === plan;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Gerenciar Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano e veja detalhes da sua assinatura
          </p>
        </div>

        {/* Current Plan Card */}
        {loading || subscriptionLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-lime/50 bg-lime/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Seu Plano Atual
                  <Badge variant={getPlanBadgeVariant(plan)} className="ml-2">
                    {plan === "free" ? "Gratuito" : plan === "pro" ? "Pro" : "Enterprise"}
                  </Badge>
                </CardTitle>
                {plan !== "free" && profileData?.subscription_status && (
                  <Badge variant={profileData.subscription_status === "active" ? "default" : "secondary"}>
                    {profileData.subscription_status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                )}
              </div>
              <CardDescription>Informações da sua assinatura atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <CreditCard className="w-8 h-8 text-lime" />
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
                    <p className="text-2xl font-bold">{credits}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <Calendar className="w-8 h-8 text-lime" />
                  <div>
                    <p className="text-sm text-muted-foreground">Membro desde</p>
                    <p className="text-sm font-medium">{formatDate(profileData?.created_at || null)}</p>
                  </div>
                </div>
                
                {plan !== "free" && profileData?.subscription_started_at && (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                      <Calendar className="w-8 h-8 text-lime" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assinatura iniciada em</p>
                        <p className="text-sm font-medium">{formatDate(profileData.subscription_started_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                      <Calendar className="w-8 h-8 text-lime" />
                      <div>
                        <p className="text-sm text-muted-foreground">Próxima renovação</p>
                        <p className="text-sm font-medium">{formatDate(profileData.subscription_expires_at || null)}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {plan === "free" && (
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Zap className="w-5 h-5 text-lime mt-0.5" />
                  <div>
                    <p className="font-medium">Faça upgrade para desbloquear mais recursos</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie personagens ilimitados, acesse templates exclusivos e muito mais!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Plans Comparison */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Planos Disponíveis</h2>
          <p className="text-muted-foreground mb-6">
            Escolha o plano que melhor se adequa às suas necessidades
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((planItem) => {
              const Icon = planItem.icon;
              const isCurrent = isCurrentPlan(planItem.id);
              
              return (
                <Card
                  key={planItem.id}
                  className={`relative ${
                    planItem.popular
                      ? "border-2 border-lime shadow-lg"
                      : isCurrent
                      ? "border-2 border-primary"
                      : ""
                  }`}
                >
                  {planItem.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-lime text-lime-foreground">Mais Popular</Badge>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default">Plano Atual</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="w-6 h-6 text-lime" />
                      <CardTitle>{planItem.name}</CardTitle>
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-bold">{planItem.price}</span>
                      <span className="text-muted-foreground ml-1">/{planItem.period}</span>
                    </div>
                    <CardDescription>{planItem.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {planItem.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-lime mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      
                      {planItem.limitations?.map((limitation, index) => (
                        <li key={`limit-${index}`} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-sm">✗ {limitation}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={planItem.popular ? "default" : "outline"}
                      disabled={isCurrent}
                      onClick={() => handleUpgrade(planItem.id)}
                    >
                      {isCurrent ? "Plano Atual" : planItem.id === "enterprise" ? "Contatar Vendas" : "Fazer Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tem dúvidas sobre qual plano escolher? Nossa equipe está aqui para ajudar!
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Falar com Suporte
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/buy-credits")}>
                Comprar Créditos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
