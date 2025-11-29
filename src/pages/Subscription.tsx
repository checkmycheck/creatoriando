import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Sparkles, Calendar, CreditCard, Coins, TrendingUp, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PixPaymentModal } from "@/components/credits/PixPaymentModal";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
  description: string | null;
  payment_status: string | null;
  type: string;
}

export default function Subscription() {
  const navigate = useNavigate();
  const { credits, isLoading: subscriptionLoading } = useSubscription();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    loadProfileData();
    loadCreditPackages();
    loadTransactions();
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

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "purchase")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoadingTransactions(false);
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

  const calculateCostPerCredit = (price: number, credits: number) => {
    return (price / credits).toFixed(2);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const colors: Record<string, string> = {
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    const labels: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
    };

    return (
      <Badge variant="outline" className={colors[status] || ""}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleBuyCredits = async (pkg: CreditPackage) => {
    // Prevent multiple simultaneous purchases
    if (processingPackageId) {
      toast.error("Aguarde o processamento do pagamento anterior");
      return;
    }

    setProcessingPackageId(pkg.id);
    
    try {
      // Verify session is valid and get access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida. Por favor, faça login novamente.");
      }

      console.log('Calling create-payment with auth token');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { 
          price: pkg.price_brl,
          credits: pkg.credits,
          description: `${pkg.credits} créditos Creator IA`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Pagamento PIX gerado com sucesso!");
      setPixData(data);
      setIsPixModalOpen(true);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || "Erro ao gerar PIX. Tente novamente.");
    } finally {
      setProcessingPackageId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Seus Créditos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compre pacotes de créditos para criar personagens incríveis
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
            <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                Seus Créditos
                <Badge variant="outline" className="ml-2 text-xs sm:text-sm">
                  {credits} disponíveis
                </Badge>
              </CardTitle>
            </div>
              <CardDescription className="text-xs sm:text-sm">Seus créditos e informações da conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-card rounded-lg border">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-lime flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Créditos Disponíveis</p>
                    <p className="text-xl sm:text-2xl font-bold">{credits.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-card rounded-lg border">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-lime flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Membro desde</p>
                    <p className="text-xs sm:text-sm font-medium">{formatDate(profileData?.created_at || null)}</p>
                  </div>
                </div>
              </div>

              {credits === 0 && (
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-lime mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Compre créditos para criar personagens</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-lime" />
            <h2 className="text-xl sm:text-2xl font-bold">Escolha seu pacote</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
            Escolha o pacote ideal para suas necessidades
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    <Badge className="bg-lime text-lime-foreground text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                  <div className="text-4xl sm:text-5xl font-bold mb-2">{pkg.credits.toLocaleString('pt-BR')}</div>
                  <CardDescription className="text-sm sm:text-base">créditos</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">R$ {pkg.price_brl.toFixed(2)}</div>
                  </div>

                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-lime flex-shrink-0" />
                      <span className="font-semibold">R$ {calculateCostPerCredit(pkg.price_brl, pkg.credits)} por crédito</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-lime flex-shrink-0" />
                      <span>{pkg.credits} personagens</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-lime flex-shrink-0" />
                      <span>Sem vencimento</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-lime flex-shrink-0" />
                      <span>Use quando quiser</span>
                    </li>
                  </ul>

                  <Button
                    className="w-full text-sm sm:text-base"
                    size="sm"
                    variant={pkg.is_popular ? "default" : "outline"}
                    onClick={() => handleBuyCredits(pkg)}
                    disabled={processingPackageId !== null}
                  >
                    <Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {processingPackageId === pkg.id ? "Gerando..." : "Comprar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-lime" />
            <h2 className="text-xl sm:text-2xl font-bold">Histórico de Compras</h2>
          </div>

          {loadingTransactions ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="py-12 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não fez nenhuma compra</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Suas transações aparecerão aqui após a primeira compra
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Últimas transações PIX</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Histórico das suas compras de créditos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-full bg-lime/10 flex-shrink-0">
                            <Coins className="w-4 h-4 text-lime" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {transaction.description || "Compra de créditos"}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                          {getStatusBadge(transaction.payment_status)}
                          <div className="text-right">
                            <p className="text-lg sm:text-xl font-bold text-lime">
                              +{transaction.amount.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground">créditos</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tem dúvidas sobre quantos créditos comprar? Nossa equipe está aqui para ajudar!
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

      <PixPaymentModal
        open={isPixModalOpen}
        onOpenChange={setIsPixModalOpen}
        pixData={pixData}
      />
    </div>
  );
}
