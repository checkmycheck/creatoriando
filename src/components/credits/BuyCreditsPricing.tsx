import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Check } from "lucide-react";

interface BuyCreditsPricingProps {
  onPurchase: (credits: number) => void;
  loading: boolean;
}

const CREDIT_PACKAGES = [
  { credits: 5, price: 5, popular: false },
  { credits: 10, price: 10, popular: true },
  { credits: 25, price: 25, popular: false },
  { credits: 50, price: 50, popular: false },
];

export function BuyCreditsPricing({ onPurchase, loading }: BuyCreditsPricingProps) {
  const handleBuyCredits = (credits: number) => {
    onPurchase(credits);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Escolha seu pacote
        </CardTitle>
        <CardDescription>
          R$ 1,00 = 1 crédito para gerar vídeos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.credits}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                pkg.popular
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              <div className="text-center space-y-4">
                <div>
                  <div className="text-4xl font-bold">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">créditos</div>
                </div>
                <div className="text-2xl font-semibold">R$ {pkg.price}</div>
                
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{pkg.credits} personagens</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Sem vencimento</span>
                  </li>
                </ul>

                <Button 
                  className="w-full" 
                  onClick={() => handleBuyCredits(pkg.credits)}
                  disabled={loading}
                  variant={pkg.popular ? "default" : "outline"}
                >
                  <Coins className="mr-2 h-4 w-4" />
                  {loading ? "Gerando PIX..." : `Comprar`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
