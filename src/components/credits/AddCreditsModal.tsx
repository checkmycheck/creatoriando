import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, History, Gift } from "lucide-react";
import { BuyCreditsPricing } from "./BuyCreditsPricing";
import { CreditHistory } from "./CreditHistory";
import { ReferralProgram } from "./ReferralProgram";
import { PixPaymentModal } from "./PixPaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCreditsModal({ open, onOpenChange }: AddCreditsModalProps) {
  const { toast } = useToast();
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePayment = async (price: number, credits: number) => {
    setLoading(true);
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
          price: price,
          credits: credits,
          description: `${credits} créditos Creator IA`
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setPixData(data);
      setIsPixModalOpen(true);
      onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl">Gerenciar Créditos</DialogTitle>
            <DialogDescription className="text-sm">
              Compre créditos, veja seu histórico ou indique amigos
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="buy" className="w-full mt-2 sm:mt-4">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="buy" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Comprar</span>
                <span className="xs:hidden">💳</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Histórico</span>
                <span className="xs:hidden">📋</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Indicar</span>
                <span className="xs:hidden">🎁</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-4 sm:mt-6">
              <BuyCreditsPricing onPurchase={handleCreatePayment} loading={loading} />
            </TabsContent>

            <TabsContent value="history" className="mt-4 sm:mt-6">
              <CreditHistory />
            </TabsContent>

            <TabsContent value="referral" className="mt-4 sm:mt-6">
              <ReferralProgram />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PixPaymentModal
        open={isPixModalOpen}
        onOpenChange={setIsPixModalOpen}
        pixData={pixData}
      />
    </>
  );
}
