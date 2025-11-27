import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingTourProps {
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isActive: boolean;
}

export const OnboardingTour = ({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  isActive,
}: OnboardingTourProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    // Add transition effect
    setIsTransitioning(true);
    const transitionTimeout = setTimeout(() => setIsTransitioning(false), 400);

    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.target);

      if (!element) {
        // If element not found, retry after a short delay
        const retryTimeout = setTimeout(updatePosition, 200);
        return () => clearTimeout(retryTimeout);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position based on preferred position
        const tooltipWidth = 360;
        const tooltipHeight = 200;
        const padding = 20;

        let top = 0;
        let left = 0;

        switch (step.position || "bottom") {
          case "top":
            top = rect.top - tooltipHeight - padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding;
            break;
        }

        // Keep tooltip within viewport
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

        setTooltipPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(transitionTimeout);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, steps, isActive]);

  if (!isActive || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/50 z-[9998] animate-fade-in transition-all duration-500" />

      {/* Highlight spotlight */}
      {targetRect && (
        <div
          className={`fixed z-[9999] pointer-events-none transition-all duration-700 ease-out ${
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 4px hsl(var(--lime)), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "12px",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[10000] bg-card border-2 border-lime rounded-xl shadow-2xl p-6 transition-all duration-700 ease-out ${
          isTransitioning ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"
        }`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: "360px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-lime animate-pulse" />
          <h3 className="text-lg font-bold text-foreground transition-all duration-500">{step.title}</h3>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed transition-all duration-500">{step.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                  index === currentStep
                    ? "w-8 bg-lime scale-110"
                    : index < currentStep
                    ? "w-1.5 bg-lime/50"
                    : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                className="gap-1 transition-all duration-300 ease-out hover:scale-105 hover:-translate-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              className="gap-1 bg-lime text-lime-foreground hover:bg-lime/90 transition-all duration-300 ease-out hover:scale-105 hover:translate-x-1"
            >
              {isLastStep ? "Finalizar" : "Próximo"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
