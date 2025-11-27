import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Video className="w-6 h-6 text-lime" />
            <span className="text-xl font-bold">Creator IA</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};