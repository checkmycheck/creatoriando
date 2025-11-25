import { OptionCard } from "../OptionCard";
import { Home } from "lucide-react";

interface EnvironmentStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const EnvironmentStep = ({ value, onChange }: EnvironmentStepProps) => {
  const options = [
    { id: "Escritório", emoji: "💻", title: "Escritório Tech", subtitle: "Startup moderna" },
    { id: "HomeOffice", emoji: "🏠", title: "Home Office Dev", subtitle: "Setup programador" },
    { id: "Coworking", emoji: "👥", title: "Coworking Tech", subtitle: "Espaço inovação" },
    { id: "Servidores", emoji: "🖥️", title: "Sala de Servidores", subtitle: "Data center" },
    { id: "Lab", emoji: "🔬", title: "Lab de Inovação", subtitle: "Experimental" },
    { id: "Telas", emoji: "💻", title: "Múltiplas Telas", subtitle: "Workstation" },
    { id: "Café", emoji: "☕", title: "Café Tech", subtitle: "Área descompressão" },
    { id: "Reunião", emoji: "📊", title: "Sala Reunião Tech", subtitle: "Scrum room" },
    { id: "Hackathon", emoji: "💡", title: "Hackathon", subtitle: "Competição código" },
    { id: "Gaming", emoji: "🎮", title: "Gaming Room", subtitle: "Área gamer" },
    { id: "Streaming", emoji: "📺", title: "Streaming Setup", subtitle: "Live e conteúdo" },
    { id: "Fundo", emoji: "🟪", title: "Fundo Tech", subtitle: "Moderno limpo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Ambiente</h2>
          <p className="text-muted-foreground">Onde está gravando?</p>
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
