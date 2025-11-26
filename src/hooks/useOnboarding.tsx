import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface OnboardingStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const useOnboarding = () => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  // Diferentes chaves para diferentes páginas
  const getOnboardingKey = () => {
    if (location.pathname === "/create") {
      return "creator-ia-onboarding-create-completed";
    }
    return "creator-ia-onboarding-completed";
  };

  useEffect(() => {
    const key = getOnboardingKey();
    const completed = localStorage.getItem(key);
    if (!completed) {
      setHasCompletedOnboarding(false);
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsActive(true), 1000);
    } else {
      setHasCompletedOnboarding(true);
      setIsActive(false);
    }
  }, [location.pathname]);

  const startOnboarding = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = (totalSteps: number) => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    const key = getOnboardingKey();
    localStorage.setItem(key, "true");
    setIsActive(false);
    setHasCompletedOnboarding(true);
    setCurrentStep(0);
  };

  const resetOnboarding = () => {
    const key = getOnboardingKey();
    localStorage.removeItem(key);
    setHasCompletedOnboarding(false);
    startOnboarding();
  };

  return {
    isActive,
    currentStep,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};
