import { OptionCard } from "../OptionCard";
import { User } from "lucide-react";

interface AppearanceStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const AppearanceStep = ({ value, onChange }: AppearanceStepProps) => {
  const options = [
    { id: "Branco", emoji: "👱", title: "Caucasiano", subtitle: "Pele clara" },
    { id: "Negro", emoji: "👨🏿", title: "Afrodescendente", subtitle: "Pele escura" },
    { id: "Pardo", emoji: "👨🏽", title: "Pardo", subtitle: "Pele morena" },
    { id: "Asiático", emoji: "👨🏻", title: "Asiático", subtitle: "Traços orientais" },
    { id: "Latino", emoji: "👨🏾", title: "Latino", subtitle: "América Latina" },
    { id: "Indígena", emoji: "👨🏾", title: "Indígena", subtitle: "Nativo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Aparência</h2>
          <p className="text-muted-foreground">Características físicas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
