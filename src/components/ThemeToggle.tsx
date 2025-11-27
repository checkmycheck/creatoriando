import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("app-theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    
    // Add the appropriate class
    root.classList.add(newTheme);
    
    // Force update CSS variables for the theme
    if (newTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    
    // Trigger a re-render of components that depend on theme
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 transition-transform hover:scale-110 active:scale-95"
      title={theme === "light" ? "Modo escuro" : "Modo claro"}
    >
      <div className="relative w-4 h-4">
        {theme === "light" ? (
          <Moon className="w-4 h-4 absolute inset-0 animate-in spin-in-180 zoom-in-50 duration-300" />
        ) : (
          <Sun className="w-4 h-4 absolute inset-0 animate-in spin-in-180 zoom-in-50 duration-300" />
        )}
      </div>
    </Button>
  );
};
