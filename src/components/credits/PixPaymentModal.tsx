import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Copy, CheckCircle2, QrCode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixData: any;
}

export function PixPaymentModal({ open, onOpenChange, pixData }: PixPaymentModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'approved' | 'failed'>('pending');
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && pixData?.payment_id) {
      // Start checking payment status every 3 seconds
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
      
      setCheckingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (checkingInterval) {
        clearInterval(checkingInterval);
        setCheckingInterval(null);
      }
      setPaymentStatus('pending');
    }
  }, [open, pixData]);

  const checkPaymentStatus = async () => {
    if (!pixData?.payment_id) return;
    
    setPaymentStatus('checking');
    
    try {
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('payment_status')
        .eq('payment_id', pixData.payment_id.toString())
        .single();

      if (transaction?.payment_status === 'approved') {
        setPaymentStatus('approved');
        if (checkingInterval) {
          clearInterval(checkingInterval);
        }
        
        toast({
          title: "Pagamento confirmado! 🎉",
          description: `Seus créditos foram adicionados à sua conta.`,
        });
        
        setTimeout(() => {
          onOpenChange(false);
          window.location.reload();
        }, 2000);
      } else if (transaction?.payment_status === 'rejected') {
        setPaymentStatus('failed');
        if (checkingInterval) {
          clearInterval(checkingInterval);
        }
      } else {
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('pending');
    }
  };

  const copyPixCode = () => {
    if (!pixData?.qr_code) return;
    
    navigator.clipboard.writeText(pixData.qr_code);
    setCopied(true);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu app de pagamentos.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pixData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
            {paymentStatus === 'approved' ? 'Pagamento Confirmado!' : 'Pagamento via PIX'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {paymentStatus === 'approved' 
              ? 'Seus créditos foram adicionados com sucesso'
              : 'Escaneie o QR Code ou copie o código PIX abaixo'}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'approved' ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4">
            <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
            <p className="text-base sm:text-lg font-semibold text-center">
              Pagamento aprovado!
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
              Seus {pixData.credits.toLocaleString('pt-BR')} créditos já estão disponíveis.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Automatic Recognition Alert */}
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-lime/10 border border-lime/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-lime flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  Reconhecimento Automático
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Assim que você confirmar o pagamento, o sistema reconhece automaticamente e seus créditos são inseridos na conta em poucos segundos.
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-3 sm:p-4 bg-white rounded-lg">
              {pixData?.qr_code_base64 ? (
                <img 
                  src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 sm:w-64 sm:h-64" 
                />
              ) : (
                <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-gray-100 rounded">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Payment Status */}
            {paymentStatus === 'checking' && (
              <div className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-blue-500/10 rounded-lg text-blue-600">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm font-medium">Verificando pagamento...</span>
              </div>
            )}

            {/* Pix Code */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Código PIX Copia e Cola:
              </p>
              <div className="flex gap-2">
                <div className="flex-1 p-2 sm:p-3 bg-muted rounded text-[10px] sm:text-xs font-mono break-all max-h-20 sm:max-h-24 overflow-y-auto">
                  {pixData?.qr_code || ''}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyPixCode}
                  className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 p-3 sm:p-4 bg-muted/50 rounded-lg">
              <p className="text-xs sm:text-sm font-semibold">Como pagar:</p>
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento de R$ {pixData?.amount?.toFixed(2)}</li>
                <li>Aguarde a confirmação automática</li>
              </ol>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span className="text-xs sm:text-sm font-medium">Total a pagar:</span>
              <span className="text-base sm:text-lg font-bold">R$ {pixData?.amount?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
