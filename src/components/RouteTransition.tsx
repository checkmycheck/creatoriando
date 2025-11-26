import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "./ui/loading-spinner";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(true);
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    // Show loader when route changes
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      // Minimum display time for the loader
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  if (isTransitioning) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
