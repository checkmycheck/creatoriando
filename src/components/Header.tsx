import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14 md:h-16">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer active:scale-95"
          >
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-lime" />
            <span className="text-lg sm:text-xl font-bold">CriaCreator</span>
          </button>
        </div>
      </div>
    </nav>
  );
};