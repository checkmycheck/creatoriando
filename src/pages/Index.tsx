import { Button } from "@/components/ui/button";
import { Sparkles, Video, Zap, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { VideoDemo } from "@/components/landing/VideoDemo";
import { Pricing } from "@/components/landing/Pricing";
import { useState, useEffect } from "react";
import { useLandingContent } from "@/hooks/useLandingContent";

// Mapeia nome do ícone para componente
const iconMap: Record<string, any> = {
  Zap,
  Settings,
  Sparkles,
  Video,
};

const Index = () => {
  const navigate = useNavigate();
  const { content: heroContent } = useLandingContent("hero");
  const { content: featuresContent } = useLandingContent("features");

  const [hero, setHero] = useState({
    badge: "✨ IA para Criadores de Conteúdo",
    title: "Crie personagens de vídeo perfeitos com IA",
    subtitle: "Configure todos os detalhes do seu personagem em minutos e gere prompts profissionais otimizados para Google Flow",
    primaryButton: "Criar Personagem",
    secondaryButton: "Ver Exemplos",
  });

  const [features, setFeatures] = useState({
    title: "Por que escolher Creator IA?",
    subtitle: "Tudo que você precisa para criar vídeos profissionais",
    items: [
      { icon: "Zap", title: "Rápido e Intuitivo", description: "Wizard guiado com 13 etapas simples para configurar cada detalhe" },
      { icon: "Settings", title: "13 Configurações", description: "Controle completo: gênero, idade, ambiente, iluminação, voz e muito mais" },
      { icon: "Sparkles", title: "Prompts Profissionais", description: "Prompts XML otimizados para Veo3 e Google Flow, prontos para usar" },
    ],
  });

  useEffect(() => {
    if (heroContent.length > 0 && heroContent[0].content) {
      setHero(heroContent[0].content);
    }
  }, [heroContent]);

  useEffect(() => {
    if (featuresContent.length > 0 && featuresContent[0].content) {
      setFeatures(featuresContent[0].content);
    }
  }, [featuresContent]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime/5 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="text-center space-y-6 sm:space-y-7 md:space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 border border-lime/20 text-sm">
              <Sparkles className="w-4 h-4 text-lime" />
              <span className="text-lime">{hero.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
              {hero.title}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed px-4">
              {hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
              <Button
                size="lg"
                className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90 text-lg px-8 py-6"
                onClick={() => navigate("/create")}
              >
                <Sparkles className="w-5 h-5" />
                {hero.primaryButton}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg px-8 py-6"
              >
                {hero.secondaryButton}
              </Button>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {features.items.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || Sparkles;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-lime/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-lime" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Testimonials />
      <VideoDemo />
      <Pricing />
      <FAQ />
    </div>
  );
};

export default Index;
