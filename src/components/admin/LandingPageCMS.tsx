import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Sparkles, MessageSquare, Video, HelpCircle } from "lucide-react";
import { HeroEditor } from "./cms/HeroEditor";
import { FeaturesEditor } from "./cms/FeaturesEditor";
import { TestimonialsEditor } from "./cms/TestimonialsEditor";
import { VideoEditor } from "./cms/VideoEditor";
import { FAQEditor } from "./cms/FAQEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

export const LandingPageCMS = () => {
  const navigate = useNavigate();

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
          <HeroEditor />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeaturesEditor />
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsEditor />
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <VideoEditor />
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <FAQEditor />
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
    </div>
  );
};
