import { OptionCard } from "../OptionCard";
import { Mic } from "lucide-react";

interface VoiceToneStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const VoiceToneStep = ({ value, onChange }: VoiceToneStepProps) => {
  const options = [
    { id: "Técnico", emoji: "💻", title: "Técnico", subtitle: "Linguagem de dev" },
    { id: "Explicativo", emoji: "📊", title: "Explicativo", subtitle: "Tutorial claro" },
    { id: "Entusiasmado", emoji: "🤩", title: "Entusiasmado", subtitle: "Tech lover" },
    { id: "Casual", emoji: "😎", title: "Casual", subtitle: "Startup vibes" },
    { id: "Solucionador", emoji: "🧩", title: "Solucionador", subtitle: "Foca em resolver" },
    { id: "Inovador", emoji: "🚀", title: "Inovador", subtitle: "Novidades e trends" },
    { id: "Colaborativo", emoji: "👥", title: "Colaborativo", subtitle: "Team player" },
    { id: "Objetivo", emoji: "🎯", title: "Objetivo", subtitle: "Direto ao código" },
    { id: "Mentor", emoji: "👨‍🏫", title: "👍 Mentor", subtitle: "Ensina devs" },
    { id: "CodeReview", emoji: "🔍", title: "Code Review", subtitle: "Feedback técnico" },
    { id: "Demo", emoji: "📹", title: "Demo", subtitle: "Apresentação produto" },
    { id: "Debug", emoji: "🐛", title: "Debug", subtitle: "Investigativo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mic className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Tom de Voz</h2>
          <p className="text-muted-foreground">Como vai falar?</p>
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
