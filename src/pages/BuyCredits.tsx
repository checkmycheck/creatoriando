import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuyCreditsPricing } from "@/components/credits/BuyCreditsPricing";
import { CreditHistory } from "@/components/credits/CreditHistory";
import { ReferralProgram } from "@/components/credits/ReferralProgram";
import { ShoppingCart, History, Gift } from "lucide-react";

export default function BuyCredits() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Comprar Créditos</h1>
            <p className="text-muted-foreground">
              Adquira créditos para criar mais personagens
            </p>
          </div>

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
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
                Indicar Amigos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-6">
              <BuyCreditsPricing />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <CreditHistory />
            </TabsContent>

            <TabsContent value="referral" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <ReferralProgram />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}