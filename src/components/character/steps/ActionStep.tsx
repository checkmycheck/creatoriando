import { OptionCard } from "../OptionCard";
import { Hand } from "lucide-react";

interface ActionStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const ActionStep = ({ value, onChange }: ActionStepProps) => {
  const options = [
    { id: "Falando", emoji: "🗣️", title: "Apenas Falando", subtitle: "Comunicação direta" },
    { id: "Apontando", emoji: "👉", title: "Apontando", subtitle: "Indicando algo" },
    { id: "Explicando", emoji: "🤲", title: "Explicando", subtitle: "Gestos abertos" },
    { id: "Pensativo", emoji: "🤔", title: "Pensativo", subtitle: "Mão no queixo" },
    { id: "Mostrando", emoji: "🙌", title: "Mostrando Produto", subtitle: "Apresentando item" },
    { id: "Polegar", emoji: "👍", title: "Positivo", subtitle: "Sinal de OK" },
    { id: "Braços Cruzados", emoji: "🙅", title: "Braços Cruzados", subtitle: "Confiante" },
    { id: "Notebook", emoji: "💻", title: "No Notebook", subtitle: "Trabalhando" },
    { id: "Celular", emoji: "📱", title: "Com Celular", subtitle: "Mobile" },
    { id: "Microfone", emoji: "🎤", title: "Com Microfone", subtitle: "Apresentando" },
    { id: "Café", emoji: "☕", title: "Tomando Café", subtitle: "Casual" },
    { id: "Acenando", emoji: "👋", title: "Acenando", subtitle: "Cumprimento" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Hand className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Ação</h2>
          <p className="text-muted-foreground">O que está fazendo?</p>
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
