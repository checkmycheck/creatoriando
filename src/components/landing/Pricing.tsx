import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  credits: number;
  price_brl: number;
  is_popular: boolean;
  display_order: number;
}

export const Pricing = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
      toast.error("Erro ao carregar pacotes");
    } finally {
      setLoading(false);
    }
  };

  const calculateCostPerCredit = (price: number, credits: number) => {
    return (price / credits).toFixed(2);
  };

  if (loading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pacotes de Créditos
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o pacote ideal e crie seus personagens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-8 space-y-6 ${
                pkg.is_popular
                  ? "border-2 border-lime shadow-2xl scale-105"
                  : "border border-border"
              }`}
            >
              {pkg.is_popular && (
                <div className="bg-lime text-lime-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block">
                  Mais Popular
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {pkg.credits} Créditos
                </h3>
                <p className="text-muted-foreground">
                  {pkg.credits === 1 ? "1 personagem" : `${pkg.credits} personagens`}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  R$ {pkg.price_brl.toFixed(2)}
                </span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    R$ {calculateCostPerCredit(pkg.price_brl, pkg.credits)} por crédito
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Nunca expira</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Use quando quiser</span>
                </li>
                {pkg.is_popular && (
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">Melhor custo-benefício</span>
                  </li>
                )}
              </ul>

              <Button
                className={`w-full gap-2 ${
                  pkg.is_popular
                    ? "bg-lime text-lime-foreground hover:bg-lime/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                }`}
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Comprar
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-muted-foreground">
          <p>
            🔒 Pagamento seguro via PIX • Créditos creditados automaticamente
          </p>
        </div>
      </div>
    </section>
  );
};
