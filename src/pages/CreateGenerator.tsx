import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Upload, Loader2, Image, User, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { StepProgress } from "@/components/character/StepProgress";

const TOTAL_STEPS = 3;

const CreateGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { credits, canCreateMore, refresh: refreshSubscription } = useSubscription();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scenarioImage, setScenarioImage] = useState<File | null>(null);
  const [scenarioPreview, setScenarioPreview] = useState<string | null>(null);
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [characterDescription, setCharacterDescription] = useState("");
  const [analyzingScenario, setAnalyzingScenario] = useState(false);
  const [analyzingCharacter, setAnalyzingCharacter] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "scenario" | "character"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    if (type === "scenario") {
      setScenarioImage(file);
      setScenarioPreview(previewUrl);
      await analyzeImage(previewUrl, "scenario");
    } else {
      setCharacterImage(file);
      setCharacterPreview(previewUrl);
      await analyzeImage(previewUrl, "character");
    }
  };

  const analyzeImage = async (imageUrl: string, type: "scenario" | "character") => {
    if (type === "scenario") {
      setAnalyzingScenario(true);
    } else {
      setAnalyzingCharacter(true);
    }

    try {
      // Convert blob URL to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl: base64, type },
      });

      if (error) throw error;

      if (data.description) {
        if (type === "scenario") {
          setScenarioDescription(data.description);
        } else {
          setCharacterDescription(data.description);
        }
        toast({
          title: "Imagem analisada!",
          description: "A IA extraiu a descrição automaticamente.",
        });
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: "Não foi possível analisar a imagem. Descreva manualmente.",
      });
    } finally {
      if (type === "scenario") {
        setAnalyzingScenario(false);
      } else {
        setAnalyzingCharacter(false);
      }
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("generator-references")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("generator-references")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Dê um nome ao seu gerador.",
      });
      return;
    }

    if (!canCreateMore) {
      toast({
        variant: "destructive",
        title: "Créditos insuficientes",
        description: "Você precisa de 1 crédito para criar um gerador.",
      });
      navigate("/subscription");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let scenarioUrl = null;
      let characterUrl = null;

      if (scenarioImage) {
        scenarioUrl = await uploadImage(scenarioImage, user.id);
      }
      if (characterImage) {
        characterUrl = await uploadImage(characterImage, user.id);
      }

      const { error } = await supabase.from("custom_generators").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        scenario_image_url: scenarioUrl,
        scenario_description: scenarioDescription.trim() || null,
        character_image_url: characterUrl,
        character_description: characterDescription.trim() || null,
      });

      if (error) throw error;

      // Deduzir crédito
      await supabase
        .from("profiles")
        .update({ credits: credits - 1 })
        .eq("id", user.id);

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -1,
        type: "usage",
        description: `Criação de gerador personalizado: ${name}`,
      });

      await refreshSubscription();

      toast({
        title: "Gerador criado!",
        description: "Seu gerador personalizado está pronto para uso.",
      });

      navigate("/generators");
    } catch (error) {
      console.error("Error saving generator:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Dê um nome ao seu gerador.",
      });
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
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
              <h2 className="text-2xl md:text-3xl font-bold">Nome do Gerador</h2>
              <p className="text-muted-foreground">
                Dê um nome descritivo para identificar este gerador.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Loja de Roupas, Escritório Tech..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste gerador..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Image className="w-7 h-7 text-lime" />
                Imagem de Cenário
              </h2>
              <p className="text-muted-foreground">
                Suba uma foto do cenário/ambiente que será usado como base.
              </p>
            </div>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                {scenarioPreview ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={scenarioPreview}
                        alt="Cenário"
                        className="w-full h-full object-cover"
                      />
                      {analyzingScenario && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-lime">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>IA analisando...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição do Cenário (gerada pela IA)</Label>
                      <Textarea
                        value={scenarioDescription}
                        onChange={(e) => setScenarioDescription(e.target.value)}
                        placeholder="A IA vai preencher automaticamente..."
                        rows={4}
                        disabled={analyzingScenario}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScenarioImage(null);
                        setScenarioPreview(null);
                        setScenarioDescription("");
                      }}
                    >
                      Trocar Imagem
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-lime/50 transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <span className="text-muted-foreground">Clique para upload</span>
                    <span className="text-xs text-muted-foreground/70 mt-1">PNG, JPG até 5MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e, "scenario")}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <User className="w-7 h-7 text-lime" />
                Imagem de Personagem
              </h2>
              <p className="text-muted-foreground">
                Suba uma foto da pessoa que será a referência visual.
              </p>
            </div>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                {characterPreview ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={characterPreview}
                        alt="Personagem"
                        className="w-full h-full object-cover"
                      />
                      {analyzingCharacter && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-lime">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>IA analisando...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição do Personagem (gerada pela IA)</Label>
                      <Textarea
                        value={characterDescription}
                        onChange={(e) => setCharacterDescription(e.target.value)}
                        placeholder="A IA vai preencher automaticamente..."
                        rows={4}
                        disabled={analyzingCharacter}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCharacterImage(null);
                        setCharacterPreview(null);
                        setCharacterDescription("");
                      }}
                    >
                      Trocar Imagem
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-lime/50 transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <span className="text-muted-foreground">Clique para upload</span>
                    <span className="text-xs text-muted-foreground/70 mt-1">PNG, JPG até 5MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e, "character")}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Check className="w-7 h-7 text-lime" />
                Revisão Final
              </h2>
              <p className="text-muted-foreground">
                Confirme os detalhes do seu gerador personalizado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome</Label>
                      <p className="font-medium">{name}</p>
                    </div>
                    {description && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Descrição</Label>
                        <p className="text-sm">{description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Cenário</CardTitle>
                </CardHeader>
                <CardContent>
                  {scenarioPreview ? (
                    <div className="space-y-2">
                      <img
                        src={scenarioPreview}
                        alt="Cenário"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {scenarioDescription}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma imagem</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Personagem</CardTitle>
                </CardHeader>
                <CardContent>
                  {characterPreview ? (
                    <div className="space-y-2">
                      <img
                        src={characterPreview}
                        alt="Personagem"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {characterDescription}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma imagem</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-lime/10 border-lime/30">
                <CardHeader>
                  <CardTitle className="text-lg text-lime">Custo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1 crédito</p>
                  <p className="text-sm text-muted-foreground">
                    Você tem {credits.toLocaleString("pt-BR")} créditos
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <StepProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        <div className="mb-32">{renderStep()}</div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? () => navigate("/generators") : handlePrevious}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep === 0 ? "Cancelar" : "Anterior"}
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving || !canCreateMore}
                className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Criar Gerador
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGenerator;
