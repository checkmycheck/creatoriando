import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  paymentId?: string;
}

export const PixPaymentModal = ({
  open,
  onOpenChange,
  qrCode,
  qrCodeBase64,
  ticketUrl,
  paymentId,
}: PixPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyPixCode = () => {
    if (!qrCode) return;

    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    
    toast({
      title: "Código PIX copiado!",
      description: "Cole no app do seu banco para pagar",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {qrCodeBase64 && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            </div>
          )}

          {qrCode && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ou copie o código PIX:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={qrCode}
                  className="flex-1 px-3 py-2 text-sm font-mono bg-muted rounded-md"
                />
                <Button
                  onClick={copyPixCode}
                  size="icon"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {ticketUrl && (
            <Button
              onClick={() => window.open(ticketUrl, '_blank')}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir no Mercado Pago
            </Button>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Instruções:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar via PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Seus créditos serão adicionados automaticamente após a confirmação</li>
            </ol>
          </div>

          {paymentId && (
            <p className="text-xs text-center text-muted-foreground">
              ID do pagamento: {paymentId}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};