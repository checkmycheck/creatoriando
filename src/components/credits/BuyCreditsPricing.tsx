import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PixPaymentModal } from "./PixPaymentModal";

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  description: string;
  popular?: boolean;
  bonus?: string;
}

const PACKAGES: CreditPackage[] = [
  { id: 'pack_5', credits: 5, price: 19.90, description: '5 créditos' },
  { id: 'pack_10', credits: 10, price: 34.90, description: '10 créditos', popular: true, bonus: 'Economize 12%' },
  { id: 'pack_20', credits: 20, price: 59.90, description: '20 créditos', bonus: 'Economize 25%' },
  { id: 'pack_50', credits: 50, price: 129.90, description: '50 créditos', bonus: 'Economize 35%' },
];

export const BuyCreditsPricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();

  const handleBuyCredits = async (packageId: string) => {
    try {
      setLoading(packageId);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { packageId, paymentMethodId: 'pix' }
      });

      if (error) throw error;

      // Show PIX payment modal
      if (data.qr_code || data.qr_code_base64) {
        setPaymentData(data);
        setPixModalOpen(true);
        
        toast({
          title: "Pagamento PIX gerado!",
          description: "Escaneie o QR code ou copie o código para pagar",
        });
      } else if (data.ticket_url) {
        window.open(data.ticket_url, '_blank');
        toast({
          title: "Redirecionando para pagamento",
          description: "Complete o pagamento na janela do Mercado Pago",
        });
      }

    } catch (error) {
      console.error('Error buying credits:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PACKAGES.map((pkg) => (
        <Card
          key={pkg.id}
          className={pkg.popular ? "border-lime relative" : "relative"}
        >
          {pkg.popular && (
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-lime text-lime-foreground">
              Mais Popular
            </Badge>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{pkg.credits}</CardTitle>
            <CardDescription>créditos</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                R$ {pkg.price.toFixed(2)}
              </p>
              {pkg.bonus && (
                <Badge variant="secondary" className="mt-2">
                  {pkg.bonus}
                </Badge>
              )}
            </div>

            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-lime" />
                <span>{pkg.credits} personagens</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-lime" />
                <span>Sem vencimento</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-lime" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            <Button
              onClick={() => handleBuyCredits(pkg.id)}
              disabled={loading !== null}
              className="w-full"
              variant={pkg.popular ? "default" : "outline"}
            >
              {loading === pkg.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Comprar Agora"
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>

    <PixPaymentModal
      open={pixModalOpen}
      onOpenChange={setPixModalOpen}
      qrCode={paymentData?.qr_code}
      qrCodeBase64={paymentData?.qr_code_base64}
      ticketUrl={paymentData?.ticket_url}
      paymentId={paymentData?.payment_id}
    />
  </>
  );
};