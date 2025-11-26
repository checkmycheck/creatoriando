import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "./ui/loading-spinner";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background">
          <LoadingSpinner />
        </div>
      )}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </>
  );
}
