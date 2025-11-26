import { Link } from "react-router-dom";
import { Video } from "lucide-react";

export const Header = () => {
  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Video className="w-6 h-6 text-lime" />
            <span className="text-xl font-bold">Creator IA</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
