import { OptionCard } from "../OptionCard";
import { Shirt } from "lucide-react";

interface VisualStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const VisualStep = ({ value, onChange }: VisualStepProps) => {
  const options = [
    { id: "Camiseta", emoji: "👕", title: "Camiseta Tech", subtitle: "Startup" },
    { id: "Moletom", emoji: "🧥", title: "Moletom", subtitle: "Confortável" },
    { id: "Camisa", emoji: "👔", title: "Camisa Casual", subtitle: "Reunião" },
    { id: "Polo", emoji: "👕", title: "Polo Tech", subtitle: "Business casual" },
    { id: "Blazer", emoji: "🧥", title: "Blazer Tech", subtitle: "Apresentação" },
    { id: "Suéter", emoji: "🧶", title: "Suéter", subtitle: "Elegante" },
    { id: "Henley", emoji: "👕", title: "Henley", subtitle: "Casual refinado" },
    { id: "Fleece", emoji: "🧥", title: "Fleece", subtitle: "Conforto" },
    { id: "Preto", emoji: "🖤", title: "Todo Preto", subtitle: "Minimalista" },
    { id: "Jeans", emoji: "👖", title: "Jeans e Camisa", subtitle: "Clássico" },
    { id: "Cardigan", emoji: "🧥", title: "Cardigan", subtitle: "Aconchegante" },
    { id: "Smart", emoji: "👕", title: "Smart Casual", subtitle: "Equilibrado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shirt className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Visual</h2>
          <p className="text-muted-foreground">Como está vestido(a)?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            emoji={option.emoji}
            title={option.title}
            subtitle={option.subtitle}
            selected={value === option.id}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
};
