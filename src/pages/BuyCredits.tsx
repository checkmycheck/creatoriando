import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BuyCreditsPricing } from "@/components/credits/BuyCreditsPricing";
import { CreditHistory } from "@/components/credits/CreditHistory";
import { ReferralProgram } from "@/components/credits/ReferralProgram";
import { PixPaymentModal } from "@/components/credits/PixPaymentModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, History, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BuyCredits() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const amount = searchParams.get('amount');
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (amount) {
      handleCreatePayment(parseFloat(amount));
    }
  }, [amount]);

  const handleCreatePayment = async (credits: number) => {
    setLoading(true);
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

      setPixData(data);
      setIsPixModalOpen(true);
      
      // Clear URL parameters
      navigate('/buy-credits', { replace: true });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PIX",
        description: error.message || "Não foi possível gerar o código PIX. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Comprar Créditos</h1>
            <p className="text-muted-foreground">
              Adquira créditos para criar mais personagens
            </p>
          </div>

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="buy" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-2">
                <Gift className="w-4 h-4" />
                Indicar Amigos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-6">
              <BuyCreditsPricing onPurchase={handleCreatePayment} loading={loading} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <CreditHistory />
            </TabsContent>

            <TabsContent value="referral" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <ReferralProgram />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PixPaymentModal
        open={isPixModalOpen}
        onOpenChange={setIsPixModalOpen}
        pixData={pixData}
      />
    </>
  );
}
