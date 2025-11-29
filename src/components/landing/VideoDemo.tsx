import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLandingContent } from "@/hooks/useLandingContent";

export const VideoDemo = () => {
  const { content, loading } = useLandingContent("video");
  const [videoData, setVideoData] = useState({
    title: "Veja o CriaCreator em ação",
    subtitle: "Assista como é fácil criar personagens profissionais",
    videoUrl: "",
    duration: "3:24",
    tip: "💡 Dica: O vídeo mostra todas as 13 etapas do wizard de criação",
  });

  useEffect(() => {
    if (content.length > 0 && content[0].content) {
      setVideoData(content[0].content);
    }
  }, [content]);

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {videoData.title}
          </h2>
          <p className="text-muted-foreground text-lg">
            {videoData.subtitle}
          </p>
        </div>

        <Card className="max-w-5xl mx-auto overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-lime/20 via-background to-background flex items-center justify-center group cursor-pointer hover:from-lime/30 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-lime flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <Play className="w-10 h-10 text-lime-foreground ml-1" fill="currentColor" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-6">
              <p className="text-foreground font-semibold">
                Tutorial: Como criar seu primeiro personagem
              </p>
              <p className="text-sm text-muted-foreground">
                {videoData.duration}
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center text-muted-foreground">
          <p>{videoData.tip}</p>
        </div>
      </div>
    </section>
  );
};
