import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para testar",
    features: [
      "Até 1 personagem",
      "Todas as 13 configurações",
      "Prompts Veo3 otimizados",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    description: "Para criadores profissionais",
    features: [
      "Personagens ilimitados",
      "Sistema de favoritos",
      "Editar personagens salvos",
      "Geração com IA integrada",
      "Suporte prioritário",
      "Templates exclusivos",
    ],
    cta: "Começar Teste Grátis",
    highlighted: true,
  },
  {
    name: "Empresarial",
    price: "Personalizado",
    period: "",
    description: "Para equipes e agências",
    features: [
      "Tudo do plano Pro",
      "Múltiplos usuários",
      "API dedicada",
      "Suporte 24/7",
      "Treinamento personalizado",
      "SLA garantido",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos para todo tipo de criador
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para suas necessidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 space-y-6 ${
                plan.highlighted
                  ? "border-2 border-lime shadow-2xl scale-105"
                  : "border border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="bg-lime text-lime-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block">
                  Mais Popular
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-lime flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full gap-2 ${
                  plan.highlighted
                    ? "bg-lime text-lime-foreground hover:bg-lime/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                }`}
                size="lg"
                onClick={() => navigate("/auth")}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-muted-foreground">
          <p>
            🔒 Todos os planos incluem{" "}
            <strong className="text-foreground">segurança de dados</strong> e{" "}
            <strong className="text-foreground">atualizações gratuitas</strong>
          </p>
        </div>
      </div>
    </section>
  );
};
