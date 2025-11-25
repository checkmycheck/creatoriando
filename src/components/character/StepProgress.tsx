interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress = ({ currentStep, totalSteps }: StepProgressProps) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Etapa {currentStep} de {totalSteps}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-lime transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
