import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BuyCreditsPricingProps {
  onPurchase: (price: number, credits: number) => void;
  loading: boolean;
}

interface CreditPackage {
  id: string;
  credits: number;
  price_brl: number;
  is_popular: boolean;
  display_order: number;
}

export function BuyCreditsPricing({ onPurchase, loading }: BuyCreditsPricingProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading packages:', error);
      toast.error('Erro ao carregar pacotes');
    } else {
      setPackages(data || []);
    }
    setLoadingPackages(false);
  };

  const handleBuyCredits = (price: number, credits: number) => {
    onPurchase(price, credits);
  };

  if (loadingPackages) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Escolha seu pacote
        </CardTitle>
        <CardDescription>
          Escolha o pacote ideal para suas necessidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                pkg.is_popular
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {pkg.is_popular && (
                <Badge className="absolute -top-2 right-2 bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              <div className="text-center space-y-4">
                <div>
                  <div className="text-4xl font-bold">{pkg.credits.toLocaleString('pt-BR')}</div>
                  <div className="text-sm text-muted-foreground">créditos</div>
                </div>
                <div className="text-2xl font-semibold">R$ {pkg.price_brl.toFixed(2)}</div>
                
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
                  onClick={() => handleBuyCredits(pkg.price_brl, pkg.credits)}
                  disabled={loading}
                  variant={pkg.is_popular ? "default" : "outline"}
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
