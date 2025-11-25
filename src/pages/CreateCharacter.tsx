import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { StepProgress } from "@/components/character/StepProgress";
import { CharacterSummary } from "@/components/character/CharacterSummary";
import { GenderStep } from "@/components/character/steps/GenderStep";
import { AgeStep } from "@/components/character/steps/AgeStep";
import { AppearanceStep } from "@/components/character/steps/AppearanceStep";
import { VisualStep } from "@/components/character/steps/VisualStep";
import { EnvironmentStep } from "@/components/character/steps/EnvironmentStep";
import { PostureStep } from "@/components/character/steps/PostureStep";
import { MoodStep } from "@/components/character/steps/MoodStep";
import { ActionStep } from "@/components/character/steps/ActionStep";
import { MovementStep } from "@/components/character/steps/MovementStep";
import { AngleStep } from "@/components/character/steps/AngleStep";
import { LightingStep } from "@/components/character/steps/LightingStep";
import { VoiceToneStep } from "@/components/character/steps/VoiceToneStep";
import { ScriptStep } from "@/components/character/steps/ScriptStep";
import { generateVeo3Prompt } from "@/lib/promptGenerator";

export type CharacterData = {
  gender?: string;
  age?: string;
  appearance?: string;
  visual?: string;
  environment?: string;
  posture?: string;
  mood?: string;
  action?: string;
  movement?: string;
  angle?: string;
  lighting?: string;
  voiceTone?: string;
  script?: string;
};

const TOTAL_STEPS = 13;

const CreateCharacter = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [characterData, setCharacterData] = useState<CharacterData>({});

  const updateCharacter = (field: keyof CharacterData, value: string) => {
    setCharacterData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate final prompt
      const prompt = generateVeo3Prompt(characterData);
      navigate("/prompt-result", { state: { prompt } });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <GenderStep value={characterData.gender} onChange={(v) => updateCharacter("gender", v)} />;
      case 2:
        return <AgeStep value={characterData.age} onChange={(v) => updateCharacter("age", v)} />;
      case 3:
        return <AppearanceStep value={characterData.appearance} onChange={(v) => updateCharacter("appearance", v)} />;
      case 4:
        return <VisualStep value={characterData.visual} onChange={(v) => updateCharacter("visual", v)} />;
      case 5:
        return <EnvironmentStep value={characterData.environment} onChange={(v) => updateCharacter("environment", v)} />;
      case 6:
        return <PostureStep value={characterData.posture} onChange={(v) => updateCharacter("posture", v)} />;
      case 7:
        return <MoodStep value={characterData.mood} onChange={(v) => updateCharacter("mood", v)} />;
      case 8:
        return <ActionStep value={characterData.action} onChange={(v) => updateCharacter("action", v)} />;
      case 9:
        return <MovementStep value={characterData.movement} onChange={(v) => updateCharacter("movement", v)} />;
      case 10:
        return <AngleStep value={characterData.angle} onChange={(v) => updateCharacter("angle", v)} />;
      case 11:
        return <LightingStep value={characterData.lighting} onChange={(v) => updateCharacter("lighting", v)} />;
      case 12:
        return <VoiceToneStep value={characterData.voiceTone} onChange={(v) => updateCharacter("voiceTone", v)} />;
      case 13:
        return <ScriptStep value={characterData.script} onChange={(v) => updateCharacter("script", v)} />;
      default:
        return <div className="text-center text-muted-foreground">Etapa em desenvolvimento...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        
        <div className="mt-8 mb-24">
          {renderStep()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
          <div className="max-w-6xl mx-auto">
            <CharacterSummary data={characterData} />
            
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90"
              >
                {currentStep === TOTAL_STEPS ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Prompt Veo3
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCharacter;
