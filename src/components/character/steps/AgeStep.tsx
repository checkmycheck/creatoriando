import { OptionCard } from "../OptionCard";
import { Cake } from "lucide-react";

interface AgeStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const AgeStep = ({ value, onChange }: AgeStepProps) => {
  const options = [
    { id: "Jovem", emoji: "🧑", title: "Jovem (20-29)", subtitle: "Início de carreira" },
    { id: "Adulto", emoji: "👨", title: "Adulto (30-39)", subtitle: "Profissional estabelecido" },
    { id: "Maduro", emoji: "👨", title: "Maduro (40-49)", subtitle: "Experiência e autoridade" },
    { id: "Sênior", emoji: "👨", title: "Sênior (50-59)", subtitle: "Sabedoria profissional" },
    { id: "Experiente", emoji: "👴", title: "Experiente (60-69)", subtitle: "Grande experiência" },
    { id: "Veterano", emoji: "👴", title: "Veterano (70+)", subtitle: "Referência e respeito" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cake className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Faixa Etária</h2>
          <p className="text-muted-foreground">Qual a idade aparente?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
