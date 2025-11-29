import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Skeleton } from "@/components/ui/skeleton";

export interface HeroEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const HeroEditor = forwardRef<HeroEditorRef>((props, ref) => {
  const { content, loading, updateContent } = useLandingContent("hero");
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    appName: "",
    badge: "",
    title: "",
    subtitle: "",
    primaryButton: "",
    secondaryButton: "",
  });

  useEffect(() => {
    if (content.length > 0) {
      const heroContent = content[0].content;
      setFormData({
        appName: heroContent.appName || "",
        badge: heroContent.badge || "",
        title: heroContent.title || "",
        subtitle: heroContent.subtitle || "",
        primaryButton: heroContent.primaryButton || "",
        secondaryButton: heroContent.secondaryButton || "",
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
        <CardTitle>Seção Hero</CardTitle>
        <CardDescription>
          Configure o conteúdo principal do topo da landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appName">Nome do Aplicativo (Header)</Label>
          <Input
            id="appName"
            value={formData.appName}
            onChange={(e) => handleChange("appName", e.target.value)}
            placeholder="CriaCreator"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge">Badge (Tag)</Label>
          <Input
            id="badge"
            value={formData.badge}
            onChange={(e) => handleChange("badge", e.target.value)}
            placeholder="✨ IA para Criadores de Conteúdo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título Principal</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Crie personagens de vídeo perfeitos com IA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Textarea
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="Configure todos os detalhes do seu personagem..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryButton">Texto do Botão Primário</Label>
          <Input
            id="primaryButton"
            value={formData.primaryButton}
            onChange={(e) => handleChange("primaryButton", e.target.value)}
            placeholder="Criar Personagem"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryButton">Texto do Botão Secundário</Label>
          <Input
            id="secondaryButton"
            value={formData.secondaryButton}
            onChange={(e) => handleChange("secondaryButton", e.target.value)}
            placeholder="Ver Exemplos"
          />
        </div>
      </CardContent>
    </Card>
  );
});
