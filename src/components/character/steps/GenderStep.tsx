import { OptionCard } from "../OptionCard";
import { User } from "lucide-react";

interface GenderStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const GenderStep = ({ value, onChange }: GenderStepProps) => {
  const options = [
    { id: "Masc", emoji: "👨", title: "Masculino", subtitle: "Apresentador homem" },
    { id: "Fem", emoji: "👩", title: "Feminino", subtitle: "Apresentadora mulher" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Gênero</h2>
          <p className="text-muted-foreground">Quem vai apresentar?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
