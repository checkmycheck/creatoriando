import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_PACKAGES = [
  { credits: 5, price: 5, popular: false },
  { credits: 10, price: 10, popular: true },
  { credits: 25, price: 25, popular: false },
  { credits: 50, price: 50, popular: false },
];

export function AddCreditsModal({ open, onOpenChange }: AddCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(10);
  const [customValue, setCustomValue] = useState("");
  const navigate = useNavigate();

  const handleCustomValueChange = (value: string) => {
    const numValue = parseFloat(value);
    setCustomValue(value);
    if (numValue >= 5) {
      setSelectedPackage(null);
    }
  };

  const getSelectedCredits = () => {
    if (selectedPackage !== null) {
      return selectedPackage;
    }
    const numValue = parseFloat(customValue);
    return numValue >= 5 ? numValue : 0;
  };

  const getTotal = () => {
    return getSelectedCredits();
  };

  const handlePurchase = () => {
    const credits = getSelectedCredits();
    if (credits > 0) {
      navigate(`/buy-credits?amount=${credits}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Adicionar Créditos
          </DialogTitle>
          <DialogDescription>
            R$ 1,00 = 1 crédito para gerar vídeos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pre-defined packages */}
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.credits}
                onClick={() => {
                  setSelectedPackage(pkg.credits);
                  setCustomValue("");
                }}
                className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedPackage === pkg.credits
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold">{pkg.credits}</div>
                  <div className="text-xs text-muted-foreground mb-2">créditos</div>
                  <div className="text-lg font-semibold">R$ {pkg.price}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Custom value */}
          <div className="space-y-2">
            <div className="text-center text-sm text-muted-foreground">OU</div>
            <div className="space-y-2">
              <Label htmlFor="custom-value">
                Valor personalizado (mínimo R$ 5,00)
              </Label>
              <Input
                id="custom-value"
                type="number"
                min="5"
                step="0.01"
                placeholder="R$ 5,00"
                value={customValue}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                className="text-center text-lg"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Créditos:</span>
              <span className="font-semibold">{getSelectedCredits()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">
                R$ {getTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action button */}
          <Button
            onClick={handlePurchase}
            disabled={getSelectedCredits() < 5}
            className="w-full"
            size="lg"
          >
            Gerar PIX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
