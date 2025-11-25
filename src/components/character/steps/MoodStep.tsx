import { OptionCard } from "../OptionCard";
import { Smile } from "lucide-react";

interface MoodStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const MoodStep = ({ value, onChange }: MoodStepProps) => {
  const options = [
    { id: "Confiante", emoji: "🤙", title: "Confiante", subtitle: "Seguro de si" },
    { id: "Alegre", emoji: "😊", title: "Alegre", subtitle: "Feliz e otimista" },
    { id: "Sereno", emoji: "😌", title: "Sereno", subtitle: "Calmo e tranquilo" },
    { id: "Entusiasmado", emoji: "🤩", title: "Entusiasmado", subtitle: "Empolgado" },
    { id: "Amigável", emoji: "🤗", title: "Amigável", subtitle: "Acolhedor" },
    { id: "Sério", emoji: "😐", title: "Sério", subtitle: "Profissional" },
    { id: "Pensativo", emoji: "😳", title: "Pensativo", subtitle: "Reflexivo" },
    { id: "Inspirado", emoji: "✨", title: "Inspirado", subtitle: "Motivado" },
    { id: "Determinado", emoji: "🎯", title: "Determinado", subtitle: "Focado no objetivo" },
    { id: "Empático", emoji: "💕", title: "Empático", subtitle: "Compreensivo" },
    { id: "Curioso", emoji: "🤨", title: "Curioso", subtitle: "Interessado" },
    { id: "Relaxado", emoji: "😎", title: "Relaxado", subtitle: "Descontraído" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smile className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Humor</h2>
          <p className="text-muted-foreground">Expressão e energia</p>
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
