import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Sparkles, MessageSquare, Video, HelpCircle, Save } from "lucide-react";
import { HeroEditor, HeroEditorRef } from "./cms/HeroEditor";
import { FeaturesEditor, FeaturesEditorRef } from "./cms/FeaturesEditor";
import { TestimonialsEditor, TestimonialsEditorRef } from "./cms/TestimonialsEditor";
import { VideoEditor, VideoEditorRef } from "./cms/VideoEditor";
import { FAQEditor, FAQEditorRef } from "./cms/FAQEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { toast } from "sonner";

export const LandingPageCMS = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const heroRef = useRef<HeroEditorRef>(null);
  const featuresRef = useRef<FeaturesEditorRef>(null);
  const testimonialsRef = useRef<TestimonialsEditorRef>(null);
  const videoRef = useRef<VideoEditorRef>(null);
  const faqRef = useRef<FAQEditorRef>(null);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const refs = [heroRef, featuresRef, testimonialsRef, videoRef, faqRef];
      await Promise.all(refs.map(ref => ref.current?.save()));
      toast.success("Todas as alterações foram salvas com sucesso!");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return [heroRef, featuresRef, testimonialsRef, videoRef, faqRef]
      .some(ref => ref.current?.isDirty());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CMS da Landing Page</h2>
          <p className="text-muted-foreground">
            Gerencie todo o conteúdo da página inicial
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <Home className="w-4 h-4 mr-2" />
          Ver Landing Page
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">
            <Home className="w-4 h-4 mr-2" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="features">
            <Sparkles className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="testimonials">
            <MessageSquare className="w-4 h-4 mr-2" />
            Depoimentos
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Vídeo
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6">
          <HeroEditor ref={heroRef} />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeaturesEditor ref={featuresRef} />
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsEditor ref={testimonialsRef} />
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <VideoEditor ref={videoRef} />
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <FAQEditor ref={faqRef} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Seção de Pacotes de Créditos
          </CardTitle>
          <CardDescription>
            Os pacotes de créditos exibidos na landing page são gerenciados na aba "Pacotes" do admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate("/admin?tab=packages")}>
            <Package className="w-4 h-4 mr-2" />
            Gerenciar Pacotes de Créditos
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <Button 
          size="lg" 
          onClick={handleSaveAll} 
          disabled={isSaving || !hasChanges()}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};
