import { OptionCard } from "../OptionCard";
import { Lightbulb } from "lucide-react";

interface LightingStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const LightingStep = ({ value, onChange }: LightingStepProps) => {
  const options = [
    { id: "Natural", emoji: "☀️", title: "Luz Natural", subtitle: "Janela lateral" },
    { id: "Softbox", emoji: "💡", title: "Softbox Studio", subtitle: "Luz suave difusa" },
    { id: "RingLight", emoji: "⭕", title: "Ring Light", subtitle: "Iluminação frontal" },
    { id: "ThreePoint", emoji: "🔆", title: "3 Pontos", subtitle: "Setup profissional" },
    { id: "Dramático", emoji: "🌗", title: "Dramático", subtitle: "Alto contraste" },
    { id: "Neon", emoji: "🌈", title: "Neon/RGB", subtitle: "Luzes coloridas" },
    { id: "Golden", emoji: "🌅", title: "Golden Hour", subtitle: "Luz dourada" },
    { id: "Cool", emoji: "❄️", title: "Cool Tone", subtitle: "Temperatura fria" },
    { id: "Warm", emoji: "🔥", title: "Warm Tone", subtitle: "Temperatura quente" },
    { id: "Backlight", emoji: "🌟", title: "Backlight", subtitle: "Luz traseira" },
    { id: "Low", emoji: "🌙", title: "Low Key", subtitle: "Sombras dominantes" },
    { id: "High", emoji: "☁️", title: "High Key", subtitle: "Brilho dominante" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Iluminação</h2>
          <p className="text-muted-foreground">Setup de luz</p>
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
