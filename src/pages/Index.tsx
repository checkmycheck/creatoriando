import { Button } from "@/components/ui/button";
import { Sparkles, Video, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { VideoDemo } from "@/components/landing/VideoDemo";
import { Pricing } from "@/components/landing/Pricing";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime/5 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="text-center space-y-6 sm:space-y-7 md:space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime/10 border border-lime/20 text-sm">
              <Sparkles className="w-4 h-4 text-lime" />
              <span className="text-lime">Crie personagens de vídeo com IA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
              Transforme suas ideias em
              <span className="block text-lime mt-1 sm:mt-2">personagens de vídeo</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed px-4">
              Configure cada detalhe: gênero, idade, visual, ambiente, postura e muito mais. 
              Gere prompts profissionais em minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4">
              <Button
                size="lg"
                className="gap-2 bg-lime text-lime-foreground hover:bg-lime/90 text-lg px-8 py-6"
                onClick={() => navigate("/create")}
              >
                <Sparkles className="w-5 h-5" />
                Criar Personagem
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg px-8 py-6"
              >
                Ver Exemplos
              </Button>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
              <div className="w-12 h-12 rounded-lg bg-lime/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-lime" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Rápido e Intuitivo</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Wizard guiado passo a passo para criar seu personagem em minutos
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-lime/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-lime" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">13 Configurações</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Controle completo sobre cada aspecto do seu personagem de vídeo
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-lime/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lime" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Prompts Profissionais</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Gere prompts otimizados para plataformas de vídeo com IA
              </p>
            </div>
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
