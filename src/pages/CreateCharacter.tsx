import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { Header } from "@/components/Header";
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
  name?: string;
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
  const location = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { canCreateMore, characterCount, characterLimit, refresh: refreshSubscription } = useSubscription();
  
  const {
    isActive,
    currentStep: onboardingStep,
    nextStep,
    previousStep,
    skipOnboarding,
    resetOnboarding,
  } = useOnboarding();

  const onboardingSteps = [
    {
      target: '[data-onboarding="step-progress"]',
      title: "Bem-vindo ao Creator IA! 👋",
      description: "Acompanhe seu progresso aqui. São 13 etapas para criar seu personagem de vídeo perfeito. Cada detalhe conta para o resultado final!",
      position: "bottom" as const,
    },
    {
      target: '[data-onboarding="help-button"]',
      title: "Precisa de ajuda? 🆘",
      description: "Clique neste botão a qualquer momento para ver este tour novamente. Estamos aqui para ajudar!",
      position: "bottom" as const,
    },
    {
      target: '[data-onboarding="step-content"]',
      title: "Escolha suas opções 🎯",
      description: "Selecione entre as opções pré-definidas que melhor descrevem seu personagem. Cada escolha influencia o vídeo final!",
      position: "bottom" as const,
    },
    {
      target: '[data-onboarding="character-summary"]',
      title: "Resumo em tempo real 📝",
      description: "Todas as suas escolhas aparecem aqui. Veja seu personagem ganhar vida conforme você avança nas etapas!",
      position: "top" as const,
    },
    {
      target: '[data-onboarding="navigation-buttons"]',
      title: "Navegue entre etapas ⬅️➡️",
      description: "Use Anterior e Próximo para navegar. Na última etapa, você gerará o prompt XML completo para criar seu vídeo!",
      position: "top" as const,
    },
    {
      target: '[data-onboarding="step-progress"]',
      title: "Dica final! 💡",
      description: "Lembre-se: você pode editar seus personagens depois de criá-los. Experimente diferentes combinações para resultados únicos!",
      position: "bottom" as const,
    },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    // Check if we're editing an existing character
    const editId = new URLSearchParams(location.search).get("edit");
    if (editId) {
      setEditingId(editId);
      setIsEditMode(true);
      loadCharacterForEdit(editId);
    }
  }, [location.search]);

  const loadCharacterForEdit = async (characterId: string) => {
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar personagem",
        description: error.message,
      });
      navigate("/characters");
      return;
    }

    if (data) {
      setCharacterData({
        name: data.name,
        gender: data.gender,
        age: data.age,
        appearance: data.appearance,
        visual: data.visual,
        environment: data.environment,
        posture: data.posture,
        mood: data.mood,
        action: data.action,
        movement: data.movement,
        angle: data.angle,
        lighting: data.lighting,
        voiceTone: data.voice_tone,
        script: data.script,
      });
    }
  };

  const updateCharacter = (field: keyof CharacterData, value: string) => {
    setCharacterData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save or update character to database
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para salvar o personagem.",
        });
        return;
      }

      if (!characterData.name) {
        toast({
          variant: "destructive",
          title: "Nome obrigatório",
          description: "Por favor, dê um nome ao seu personagem.",
        });
        return;
      }

      // Check if user can create more characters (only for new characters)
      if (!isEditMode && !canCreateMore) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: `Você atingiu o limite de ${characterLimit} personagem${characterLimit > 1 ? 's' : ''} do plano gratuito. Faça upgrade para o plano Pro para criar personagens ilimitados!`,
        });
        navigate("/");
        return;
      }

      if (isEditMode && editingId) {
        // Update existing character
        const { error } = await supabase
          .from("characters")
          .update({
            name: characterData.name,
            gender: characterData.gender,
            age: characterData.age,
            appearance: characterData.appearance,
            visual: characterData.visual,
            environment: characterData.environment,
            posture: characterData.posture,
            mood: characterData.mood,
            action: characterData.action,
            movement: characterData.movement,
            angle: characterData.angle,
            lighting: characterData.lighting,
            voice_tone: characterData.voiceTone,
            script: characterData.script,
          })
          .eq("id", editingId);

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: error.message,
          });
          return;
        }

        toast({
          title: "Personagem atualizado!",
          description: "Suas alterações foram salvas com sucesso.",
        });
      } else {
        // Insert new character
        const { error } = await supabase.from("characters").insert({
          user_id: userId,
          name: characterData.name,
          gender: characterData.gender,
          age: characterData.age,
          appearance: characterData.appearance,
          visual: characterData.visual,
          environment: characterData.environment,
          posture: characterData.posture,
          mood: characterData.mood,
          action: characterData.action,
          movement: characterData.movement,
          angle: characterData.angle,
          lighting: characterData.lighting,
          voice_tone: characterData.voiceTone,
          script: characterData.script,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: error.message,
          });
          return;
        }

        toast({
          title: "Personagem salvo!",
          description: "Seu personagem foi criado com sucesso.",
        });
        
        refreshSubscription();
      }

      // Generate final prompt
      const prompt = generateVeo3Prompt(characterData);
      navigate("/prompt-result", { state: { prompt } });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">Nome do Personagem</h2>
              <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">Como você quer chamar seu personagem?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="character-name">Nome</Label>
              <Input
                id="character-name"
                placeholder="Ex: Ana Silva, João Santos..."
                value={characterData.name || ""}
                onChange={(e) => updateCharacter("name", e.target.value)}
              />
            </div>
          </div>
        );
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
        return <ScriptStep value={characterData.script} onChange={(v) => updateCharacter("script", v)} onGeneratePrompt={handleNext} />;
      default:
        return <div className="text-center text-muted-foreground">Etapa em desenvolvimento...</div>;
    }
  };

  return (
    <>
      <OnboardingTour
        steps={onboardingSteps}
        currentStep={onboardingStep}
        onNext={() => nextStep(onboardingSteps.length)}
        onPrevious={previousStep}
        onSkip={skipOnboarding}
        isActive={isActive}
      />
      
      <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" data-onboarding="step-progress">
              <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetOnboarding}
              title="Ver tour novamente"
              className="ml-4"
              data-onboarding="help-button"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        
        <div className="mt-6 sm:mt-8 mb-32 sm:mb-40 pb-6 sm:pb-8" data-onboarding="step-content">
          {renderStep()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:p-4">
          <div className="max-w-6xl mx-auto">
            <div data-onboarding="character-summary">
              <CharacterSummary data={characterData} />
            </div>
            
            <div className="flex justify-between items-center mt-3 sm:mt-4 gap-2 sm:gap-4" data-onboarding="navigation-buttons">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {currentStep < TOTAL_STEPS && (
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default CreateCharacter;
