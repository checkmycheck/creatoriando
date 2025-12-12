import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export interface HeroEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const HeroEditor = forwardRef<HeroEditorRef>((props, ref) => {
  const { content, loading, updateContent } = useLandingContent("hero");
  const [isDirty, setIsDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    appName: "",
    faviconUrl: "",
    landingPageEnabled: true,
    showTestimonials: true,
    showVideo: true,
    showPricing: true,
    showFAQ: true,
    badge: "",
    title: "",
    subtitle: "",
    primaryButton: "",
    secondaryButton: "",
  });

  useEffect(() => {
    if (content.length > 0) {
      const heroContent = content[0].content as any;
      setFormData({
        appName: heroContent.appName || "",
        faviconUrl: heroContent.faviconUrl || "",
        landingPageEnabled: heroContent.landingPageEnabled !== false,
        showTestimonials: heroContent.showTestimonials !== false,
        showVideo: heroContent.showVideo !== false,
        showPricing: heroContent.showPricing !== false,
        showFAQ: heroContent.showFAQ !== false,
        badge: heroContent.badge || "",
        title: heroContent.title || "",
        subtitle: heroContent.subtitle || "",
        primaryButton: heroContent.primaryButton || "",
        secondaryButton: heroContent.secondaryButton || "",
      });
    }
  }, [content]);

  const handleChange = (field: string, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setIsDirty(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou ICO.");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 1MB.");
      return;
    }

    setUploading(true);
    try {
      // Delete old favicon if exists
      if (formData.faviconUrl && formData.faviconUrl.includes('site-assets')) {
        const oldPath = formData.faviconUrl.split('/site-assets/')[1];
        if (oldPath) {
          await supabase.storage.from('site-assets').remove([oldPath]);
        }
      }

      // Upload new file
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(data.path);

      handleChange('faviconUrl', publicUrl);
      toast.success("Favicon enviado com sucesso!");
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast.error("Erro ao enviar favicon");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFavicon = () => {
    handleChange('faviconUrl', '');
    toast.success("Favicon removido");
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

        <div className="space-y-3">
          <Label className="text-base font-semibold">Visibilidade</Label>
          
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="landingPageEnabled">Landing Page Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Quando desativada, a página inicial redireciona para /auth
              </p>
            </div>
            <Switch
              id="landingPageEnabled"
              checked={formData.landingPageEnabled}
              onCheckedChange={(checked) => handleChange("landingPageEnabled", checked)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
              <Label htmlFor="showTestimonials">Depoimentos</Label>
              <Switch
                id="showTestimonials"
                checked={formData.showTestimonials}
                onCheckedChange={(checked) => handleChange("showTestimonials", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
              <Label htmlFor="showVideo">Vídeo Demo</Label>
              <Switch
                id="showVideo"
                checked={formData.showVideo}
                onCheckedChange={(checked) => handleChange("showVideo", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
              <Label htmlFor="showPricing">Preços</Label>
              <Switch
                id="showPricing"
                checked={formData.showPricing}
                onCheckedChange={(checked) => handleChange("showPricing", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
              <Label htmlFor="showFAQ">FAQ</Label>
              <Switch
                id="showFAQ"
                checked={formData.showFAQ}
                onCheckedChange={(checked) => handleChange("showFAQ", checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Favicon</Label>
          <div className="space-y-3">
            {formData.faviconUrl && (
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
                <img 
                  src={formData.faviconUrl} 
                  alt="Favicon" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/favicon.ico';
                  }}
                />
                <span className="text-sm flex-1 truncate">{formData.faviconUrl}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFavicon}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('favicon-upload')?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Enviando..." : "Upload de Imagem"}
              </Button>
              <input
                id="favicon-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/x-icon"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="faviconUrl" className="text-sm text-muted-foreground">
                Ou cole a URL:
              </Label>
              <Input
                id="faviconUrl"
                value={formData.faviconUrl}
                onChange={(e) => handleChange("faviconUrl", e.target.value)}
                placeholder="/favicon.ico ou https://..."
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: PNG, JPG, ICO (máx. 1MB)
          </p>
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
