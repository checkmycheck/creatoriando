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
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (open && pixData?.payment_id) {
      // Reset timer when modal opens
      setElapsedTime(0);
      
      // Start checking payment status every 3 seconds
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
      
      // Start timer to count elapsed time
      const timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setCheckingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
        if (timerInterval) clearInterval(timerInterval);
      };
    } else {
      if (checkingInterval) {
        clearInterval(checkingInterval);
        setCheckingInterval(null);
      }
      setPaymentStatus('pending');
      setElapsedTime(0);
    }
  }, [open, pixData]);

  const checkPaymentStatus = async () => {
    if (!pixData?.payment_id) return;
    
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
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
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

  const shareViaWhatsApp = () => {
    const message = `💳 *Pagamento PIX - CriaCreator*

Valor: R$ ${pixData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Créditos: ${pixData.credits.toLocaleString('pt-BR')}

📋 *Código PIX Copia e Cola:*
${pixData.qr_code}

✅ *Como pagar:*
1. Abra o app do seu banco
2. Escolha pagar com PIX
3. Cole o código acima
4. Confirme o pagamento

Seus créditos serão adicionados automaticamente após a confirmação!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs}s`;
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

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>Gerado há {formatElapsedTime(elapsedTime)}</span>
            </div>

            {/* Payment Status */}
            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-blue-500/10 rounded-lg text-blue-600">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm font-medium">Aguardando pagamento...</span>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareViaWhatsApp}
                  className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-[#25D366] hover:bg-[#20BA5A] border-[#25D366] hover:border-[#20BA5A]"
                  title="Compartilhar via WhatsApp"
                >
                  <svg 
                    className="h-4 w-4 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
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
