import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}

export const OptionCard = ({ emoji, title, subtitle, selected, onClick }: OptionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-6 rounded-xl border-2 transition-all duration-200",
        "hover:border-card-selected/50 hover:bg-card-hover",
        "flex flex-col items-center justify-center gap-2",
        "text-center group",
        selected
          ? "border-card-selected bg-card-selected-bg"
          : "border-border bg-card"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-lime flex items-center justify-center">
          <Check className="w-4 h-4 text-lime-foreground" />
        </div>
      )}
      
      <div className="text-4xl mb-1">{emoji}</div>
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </button>
  );
};
