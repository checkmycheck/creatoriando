import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "./ui/loading-spinner";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loader when route changes
    setIsTransitioning(true);
    
    // Hide loader after a short delay to allow the new component to mount
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isTransitioning) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
