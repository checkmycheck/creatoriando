import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={cn(
      "transition-opacity duration-150",
      isTransitioning ? "opacity-0" : "opacity-100"
    )}>
      {children}
    </div>
  );
}
