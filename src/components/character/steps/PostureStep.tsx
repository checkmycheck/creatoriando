import { OptionCard } from "../OptionCard";
import { Hand } from "lucide-react";

interface PostureStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const PostureStep = ({ value, onChange }: PostureStepProps) => {
  const options = [
    { id: "Digitando", emoji: "⌨️", title: "Digitando", subtitle: "Codando" },
    { id: "Setup", emoji: "🙅", title: "No Setup", subtitle: "Workstation" },
    { id: "Pensativo", emoji: "😳", title: "Pensativo", subtitle: "Resolvendo bug" },
    { id: "Gesticulando", emoji: "👏", title: "Gesticulando", subtitle: "Explicando código" },
    { id: "DePé", emoji: "🚶", title: "De Pé Casual", subtitle: "Stand-up meeting" },
    { id: "Recostado", emoji: "😌", title: "Recostado", subtitle: "Relaxado pensando" },
    { id: "Café", emoji: "☕", title: "Com Café", subtitle: "Programador típico" },
    { id: "Mostrando", emoji: "📺", title: "Mostrando Tela", subtitle: "Demo" },
    { id: "Braços", emoji: "💪", title: "Braços Cruzados", subtitle: "Confiante" },
    { id: "Whiteboard", emoji: "📝", title: "No Whiteboard", subtitle: "Arquitetando" },
    { id: "Headphones", emoji: "🎧", title: "Com Headphones", subtitle: "Focado" },
    { id: "Streaming", emoji: "📺", title: "Live Streaming", subtitle: "Transmitindo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Hand className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Postura</h2>
          <p className="text-muted-foreground">Como está posicionado(a)?</p>
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
