import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Skeleton } from "@/components/ui/skeleton";

export interface VideoEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const VideoEditor = forwardRef<VideoEditorRef>((props, ref) => {
  const { content, loading, updateContent } = useLandingContent("video");
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    videoUrl: "",
    duration: "",
    tip: "",
  });

  useEffect(() => {
    if (content.length > 0) {
      const videoContent = content[0].content;
      setFormData({
        title: videoContent.title || "",
        subtitle: videoContent.subtitle || "",
        videoUrl: videoContent.videoUrl || "",
        duration: videoContent.duration || "",
        tip: videoContent.tip || "",
      });
    }
  }, [content]);

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setIsDirty(true);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (content.length > 0 && isDirty) {
        await updateContent(content[0].id, { content: formData });
        setIsDirty(false);
      }
    },
    isDirty: () => isDirty,
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seção Vídeo Demo</CardTitle>
        <CardDescription>Configure o vídeo de demonstração</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-title">Título da Seção</Label>
          <Input
            id="video-title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Veja o CriaCreator em ação"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-subtitle">Subtítulo</Label>
          <Input
            id="video-subtitle"
            value={formData.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="Assista como é fácil criar personagens profissionais"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-url">URL do Vídeo (YouTube/Vimeo)</Label>
          <Input
            id="video-url"
            value={formData.videoUrl}
            onChange={(e) => handleChange("videoUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground">
            Deixe vazio para mostrar apenas o placeholder
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-duration">Duração</Label>
          <Input
            id="video-duration"
            value={formData.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="3:24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-tip">Dica (abaixo do vídeo)</Label>
          <Textarea
            id="video-tip"
            value={formData.tip}
            onChange={(e) => handleChange("tip", e.target.value)}
            placeholder="💡 Dica: O vídeo mostra todas as 13 etapas do wizard de criação"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
});
