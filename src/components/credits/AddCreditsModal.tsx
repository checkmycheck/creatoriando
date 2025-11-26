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

  const handleCreatePayment = async (credits: number) => {
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Gerenciar Créditos</DialogTitle>
            <DialogDescription>
              Compre créditos, veja seu histórico ou indique amigos
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="buy" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3">
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
                Indicar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-6">
              <BuyCreditsPricing onPurchase={handleCreatePayment} loading={loading} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <CreditHistory />
            </TabsContent>

            <TabsContent value="referral" className="mt-6">
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
