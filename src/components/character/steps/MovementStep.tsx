import { OptionCard } from "../OptionCard";
import { Video } from "lucide-react";

interface MovementStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const MovementStep = ({ value, onChange }: MovementStepProps) => {
  const options = [
    { id: "Estático", emoji: "📍", title: "Estático", subtitle: "Câmera parada" },
    { id: "ZoomIn", emoji: "🔍", title: "Zoom In", subtitle: "Aproximando devagar" },
    { id: "ZoomOut", emoji: "🔍", title: "Zoom Out", subtitle: "Afastando devagar" },
    { id: "PanEsq", emoji: "↩️", title: "Pan Esquerda", subtitle: "Girando para esquerda" },
    { id: "PanDir", emoji: "➡️", title: "Pan Direita", subtitle: "Girando para direita" },
    { id: "TiltCima", emoji: "⬆️", title: "Tilt Cima", subtitle: "Subindo" },
    { id: "TiltBaixo", emoji: "⬇️", title: "Tilt Baixo", subtitle: "Descendo" },
    { id: "Acompanhando", emoji: "🚶", title: "Acompanhando", subtitle: "Seguindo movimento" },
    { id: "DollyIn", emoji: "📹", title: "Dolly In", subtitle: "Câmera aproximando fisicamente" },
    { id: "DollyOut", emoji: "📹", title: "Dolly Out", subtitle: "Câmera afastando fisicamente" },
    { id: "Orbital", emoji: "🔄", title: "Orbital", subtitle: "Girando ao redor" },
    { id: "Mão", emoji: "📲", title: "Câmera na Mão", subtitle: "Movimento natural leve" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Movimento</h2>
          <p className="text-muted-foreground">A câmera se move?</p>
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
