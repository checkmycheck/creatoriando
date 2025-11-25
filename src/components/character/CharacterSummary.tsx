import { Badge } from "@/components/ui/badge";
import { CharacterData } from "@/pages/CreateCharacter";
import { X } from "lucide-react";

interface CharacterSummaryProps {
  data: CharacterData;
}

export const CharacterSummary = ({ data }: CharacterSummaryProps) => {
  const entries = Object.entries(data).filter(([, value]) => value);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">SEU PERSONAGEM</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-3 h-3" />
          Limpar e recomeçar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <Badge
            key={key}
            variant="secondary"
            className="bg-secondary text-foreground px-3 py-1 text-sm"
          >
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
};
