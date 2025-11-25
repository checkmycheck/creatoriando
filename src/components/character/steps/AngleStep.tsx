import { OptionCard } from "../OptionCard";
import { Camera } from "lucide-react";

interface AngleStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const AngleStep = ({ value, onChange }: AngleStepProps) => {
  const options = [
    { id: "Frontal", emoji: "👁️", title: "Frontal", subtitle: "De frente, nível dos olhos" },
    { id: "LevAlto", emoji: "📐", title: "Levemente Alto", subtitle: "Um pouco acima dos olhos" },
    { id: "Alto", emoji: "🔺", title: "Alto", subtitle: "De cima para baixo" },
    { id: "MuitoAlto", emoji: "🦅", title: "Muito Alto", subtitle: "Vista aérea suave" },
    { id: "LevBaixo", emoji: "📐", title: "Levemente Baixo", subtitle: "Um pouco abaixo dos olhos" },
    { id: "Baixo", emoji: "⬇️", title: "Baixo", subtitle: "De baixo para cima" },
    { id: "MuitoBaixo", emoji: "🐕", title: "Muito Baixo", subtitle: "Quase do chão" },
    { id: "LatEsq", emoji: "↩️", title: "Lateral Esquerda", subtitle: "Perfil esquerdo" },
    { id: "LatDir", emoji: "➡️", title: "Lateral Direita", subtitle: "Perfil direito" },
    { id: "3/4Esq", emoji: "↙️", title: "3/4 Esquerda", subtitle: "Entre frontal e perfil" },
    { id: "3/4Dir", emoji: "↘️", title: "3/4 Direita", subtitle: "Entre frontal e perfil" },
    { id: "Dutch", emoji: "📐", title: "Inclinado (Dutch)", subtitle: "Câmera torta" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Camera className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Ângulo</h2>
          <p className="text-muted-foreground">Posição da câmera</p>
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
