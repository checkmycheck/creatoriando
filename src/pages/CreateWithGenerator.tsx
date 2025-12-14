import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, HelpCircle, Image, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { StepProgress } from "@/components/character/StepProgress";
import { CharacterSummary } from "@/components/character/CharacterSummary";
import { PostureStep } from "@/components/character/steps/PostureStep";
import { MoodStep } from "@/components/character/steps/MoodStep";
import { ActionStep } from "@/components/character/steps/ActionStep";
import { MovementStep } from "@/components/character/steps/MovementStep";
import { AngleStep } from "@/components/character/steps/AngleStep";
import { LightingStep } from "@/components/character/steps/LightingStep";
import { VoiceToneStep } from "@/components/character/steps/VoiceToneStep";
import { ScriptStep } from "@/components/character/steps/ScriptStep";
import { generateVeo3Prompt } from "@/lib/promptGenerator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CharacterData } from "./CreateCharacter";

interface Generator {
  id: string;
  name: string;
  description: string | null;
  scenario_image_url: string | null;
  scenario_description: string | null;
  character_image_url: string | null;
  character_description: string | null;
}

// Wizard simplificado: pula Ambiente, Aparência, Visual, Gênero, Idade
// Mantém: Nome, Postura, Humor, Ação, Movimento, Ângulo, Iluminação, Tom de Voz, Script
const TOTAL_STEPS = 8;

const CreateWithGenerator = () => {
  const navigate = useNavigate();
  const { generatorId } = useParams<{ generatorId: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [loading, setLoading] = useState(true);
  const { canCreateMore, refresh: refreshSubscription } = useSubscription();

  useEffect(() => {
    loadData();
  }, [generatorId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    if (!generatorId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Gerador não encontrado.",
      });
      navigate("/generators");
      return;
    }

    const { data, error } = await supabase
      .from("custom_generators")
      .select("*")
      .eq("id", generatorId)
      .single();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar gerador",
        description: error?.message || "Gerador não encontrado.",
      });
      navigate("/generators");
      return;
    }

    setGenerator(data);
    setLoading(false);
  };

  const updateCharacter = (field: keyof CharacterData, value: string) => {
    setCharacterData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Salvar personagem
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado.",
        });
        return;
      }

      if (!characterData.name) {
        toast({
          variant: "destructive",
          title: "Nome obrigatório",
          description: "Dê um nome ao seu personagem.",
        });
        return;
      }

      if (!canCreateMore) {
        toast({
          variant: "destructive",
          title: "Créditos insuficientes",
          description: "Compre mais créditos para continuar.",
        });
        navigate("/subscription");
        return;
      }

      // Mesclar dados do gerador com dados do wizard
      const mergedData: CharacterData = {
        ...characterData,
        // Usar descrições do gerador para ambiente e aparência
        environment: generator?.scenario_description || "Ambiente personalizado",
        appearance: generator?.character_description || "Personagem personalizado",
        visual: generator?.character_description || "Estilo personalizado",
      };

      const { error } = await supabase.from("characters").insert({
        user_id: userId,
        generator_id: generator?.id,
        name: characterData.name,
        environment: mergedData.environment,
        appearance: mergedData.appearance,
        visual: mergedData.visual,
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
        title: "Personagem criado!",
        description: `Criado com o gerador "${generator?.name}".`,
      });

      await refreshSubscription();

      const prompt = generateVeo3Prompt(mergedData);
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
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Nome do Personagem</h2>
              <p className="text-muted-foreground">
                Usando gerador: <span className="text-lime font-medium">{generator?.name}</span>
              </p>
            </div>

            {/* Preview das referências */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-card/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Image className="w-3 h-3" />
                    Cenário
                  </div>
                  {generator?.scenario_image_url ? (
                    <img
                      src={generator.scenario_image_url}
                      alt="Cenário"
                      className="w-full aspect-video object-cover rounded"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Sem imagem</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    Personagem
                  </div>
                  {generator?.character_image_url ? (
                    <img
                      src={generator.character_image_url}
                      alt="Personagem"
                      className="w-full aspect-video object-cover rounded"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Sem imagem</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Ana Silva, João Santos..."
                value={characterData.name || ""}
                onChange={(e) => updateCharacter("name", e.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return <PostureStep value={characterData.posture} onChange={(v) => updateCharacter("posture", v)} />;
      case 2:
        return <MoodStep value={characterData.mood} onChange={(v) => updateCharacter("mood", v)} />;
      case 3:
        return <ActionStep value={characterData.action} onChange={(v) => updateCharacter("action", v)} />;
      case 4:
        return <MovementStep value={characterData.movement} onChange={(v) => updateCharacter("movement", v)} />;
      case 5:
        return <AngleStep value={characterData.angle} onChange={(v) => updateCharacter("angle", v)} />;
      case 6:
        return <LightingStep value={characterData.lighting} onChange={(v) => updateCharacter("lighting", v)} />;
      case 7:
        return <VoiceToneStep value={characterData.voiceTone} onChange={(v) => updateCharacter("voiceTone", v)} />;
      case 8:
        return <ScriptStep value={characterData.script} onChange={(v) => updateCharacter("script", v)} onGeneratePrompt={handleNext} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 mb-32 sm:mb-40 pb-6 sm:pb-8">
          {renderStep()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:p-4">
          <div className="max-w-6xl mx-auto">
            <CharacterSummary data={characterData} />

            <div className="flex justify-between items-center mt-3 sm:mt-4 gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={currentStep === 0 ? () => navigate("/generators") : handlePrevious}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {currentStep === 0 ? "Voltar" : "Anterior"}
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
  );
};

export default CreateWithGenerator;
