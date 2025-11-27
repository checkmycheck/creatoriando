import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export interface FeaturesEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const FeaturesEditor = forwardRef<FeaturesEditorRef>((props, ref) => {
  const { content, loading, updateContent } = useLandingContent("features");
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    items: [
      { icon: "Zap", title: "", description: "" },
      { icon: "Settings", title: "", description: "" },
      { icon: "Sparkles", title: "", description: "" },
    ],
  });

  useEffect(() => {
    if (content.length > 0) {
      const featuresContent = content[0].content;
      setFormData({
        title: featuresContent.title || "",
        subtitle: featuresContent.subtitle || "",
        items: featuresContent.items || formData.items,
      });
    }
  }, [content]);

  const handleChange = (field: string, value: any) => {
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

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    handleChange("items", newItems);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
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
        <CardTitle>Seção Features</CardTitle>
        <CardDescription>Configure os 3 recursos principais destacados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="features-title">Título da Seção</Label>
            <Input
              id="features-title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Por que escolher Creator IA?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="features-subtitle">Subtítulo</Label>
            <Input
              id="features-subtitle"
              value={formData.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              placeholder="Tudo que você precisa para criar vídeos profissionais"
            />
          </div>
        </div>

        <Separator />

        {formData.items.map((item, index) => (
          <div key={index} className="space-y-4 p-4 border border-border rounded-lg">
            <h4 className="font-semibold text-sm">Feature {index + 1}</h4>
            
            <div className="space-y-2">
              <Label htmlFor={`feature-title-${index}`}>Título</Label>
              <Input
                id={`feature-title-${index}`}
                value={item.title}
                onChange={(e) => handleItemChange(index, "title", e.target.value)}
                placeholder="Rápido e Intuitivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`feature-desc-${index}`}>Descrição</Label>
              <Textarea
                id={`feature-desc-${index}`}
                value={item.description}
                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                placeholder="Wizard guiado com 13 etapas simples..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`feature-icon-${index}`}>Ícone (Lucide)</Label>
              <Input
                id={`feature-icon-${index}`}
                value={item.icon}
                onChange={(e) => handleItemChange(index, "icon", e.target.value)}
                placeholder="Zap, Settings, Sparkles, etc."
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
