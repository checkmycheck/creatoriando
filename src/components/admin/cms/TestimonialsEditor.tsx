import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
}

export interface TestimonialsEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const TestimonialsEditor = forwardRef<TestimonialsEditorRef>((props, ref) => {
  const { content, loading, updateContent, createContent } = useLandingContent("testimonials");
  const [isDirty, setIsDirty] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (content.length > 0) {
      setTestimonials(content[0].content.items || []);
    }
  }, [content]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (isDirty) {
        const contentData = { items: testimonials };
        if (content.length > 0) {
          await updateContent(content[0].id, { content: contentData });
        } else {
          await createContent({
            section: "testimonials",
            content: contentData,
            display_order: 0,
            is_active: true,
          });
        }
        setIsDirty(false);
      }
    },
    isDirty: () => isDirty,
  }));

  const handleAdd = () => {
    setTestimonials([
      ...testimonials,
      {
        name: "",
        role: "",
        avatar: "",
        rating: 5,
        text: "",
      },
    ]);
    setIsDirty(true);
  };

  const handleRemove = (index: number) => {
    const newTestimonials = testimonials.filter((_, i) => i !== index);
    setTestimonials(newTestimonials);
    setIsDirty(true);
  };

  const handleChange = (index: number, field: keyof Testimonial, value: any) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setTestimonials(newTestimonials);
    setIsDirty(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depoimentos</CardTitle>
        <CardDescription>
          Gerencie os depoimentos de usuários da landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="space-y-4 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Depoimento {index + 1}</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={testimonial.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  placeholder="Maria Silva"
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={testimonial.role}
                  onChange={(e) => handleChange(index, "role", e.target.value)}
                  placeholder="Criadora de Conteúdo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avatar (Iniciais)</Label>
                <Input
                  value={testimonial.avatar}
                  onChange={(e) => handleChange(index, "avatar", e.target.value)}
                  placeholder="MS"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Avaliação (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonial.rating}
                  onChange={(e) => handleChange(index, "rating", parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea
                value={testimonial.text}
                onChange={(e) => handleChange(index, "text", e.target.value)}
                rows={3}
                placeholder="O Creator IA revolucionou meu trabalho!"
              />
            </div>
          </div>
        ))}

        <Separator />

        <Button onClick={handleAdd} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Depoimento
        </Button>
      </CardContent>
    </Card>
  );
});
