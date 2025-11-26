import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Sparkles, Calendar, CreditCard, Coins } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  credits: number;
  created_at: string | null;
  full_name: string | null;
  email: string;
}

interface CreditPackage {
  id: string;
  credits: number;
  price_brl: number;
  is_popular: boolean;
  display_order: number;
}

export default function Subscription() {
  const navigate = useNavigate();
  const { plan, credits, isLoading: subscriptionLoading } = useSubscription();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
    loadCreditPackages();
  }, []);

  const loadCreditPackages = async () => {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading credit packages:', error);
      toast.error('Erro ao carregar pacotes');
    } else {
      setCreditPackages(data || []);
    }
  };

  const loadProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("credits, created_at, full_name, email")
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleBuyCredits = async (credits: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          amount: credits,
          description: `${credits} créditos Creator IA`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Pagamento PIX gerado! Redirecionando...");
      navigate('/buy-credits');
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || "Erro ao gerar PIX. Tente novamente.");
    }
  };

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

        {/* Current Credits Card */}
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
                Seus Créditos
                <Badge variant="outline" className="ml-2">
                  {credits} disponíveis
                </Badge>
              </CardTitle>
            </div>
              <CardDescription>Seus créditos e informações da conta</CardDescription>
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
              </div>

              {credits === 0 && (
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-lime mt-0.5" />
                  <div>
                    <p className="font-medium">Compre créditos para criar personagens</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cada crédito permite criar 1 personagem completo com todas as configurações!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Credit Packages */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-6 h-6 text-lime" />
            <h2 className="text-2xl font-bold">Escolha seu pacote</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Escolha o pacote ideal para suas necessidades
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${
                  pkg.is_popular
                    ? "border-2 border-lime shadow-lg bg-lime/5"
                    : ""
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-lime text-lime-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="text-5xl font-bold mb-2">{pkg.credits}</div>
                  <CardDescription className="text-base">créditos</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">R$ {pkg.price_brl.toFixed(2)}</div>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-lime flex-shrink-0" />
                      <span>{pkg.credits} personagens</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-lime flex-shrink-0" />
                      <span>Sem vencimento</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full"
                    variant={pkg.is_popular ? "default" : "outline"}
                    onClick={() => handleBuyCredits(pkg.credits)}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
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
