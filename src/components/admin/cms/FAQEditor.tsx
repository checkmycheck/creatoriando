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

interface FAQ {
  question: string;
  answer: string;
}

export interface FAQEditorRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

export const FAQEditor = forwardRef<FAQEditorRef>((props, ref) => {
  const { content, loading, updateContent, createContent } = useLandingContent("faq");
  const [isDirty, setIsDirty] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    if (content.length > 0) {
      setFaqs(content[0].content.items || []);
    }
  }, [content]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (isDirty) {
        const contentData = { items: faqs };
        if (content.length > 0) {
          await updateContent(content[0].id, { content: contentData });
        } else {
          await createContent({
            section: "faq",
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
    setFaqs([
      ...faqs,
      {
        question: "",
        answer: "",
      },
    ]);
    setIsDirty(true);
  };

  const handleRemove = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(newFaqs);
    setIsDirty(true);
  };

  const handleChange = (index: number, field: keyof FAQ, value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
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
        <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
        <CardDescription>
          Gerencie as perguntas e respostas da seção FAQ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="space-y-4 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">FAQ {index + 1}</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={faq.question}
                onChange={(e) => handleChange(index, "question", e.target.value)}
                placeholder="Como funciona o CriaCreator?"
              />
            </div>

            <div className="space-y-2">
              <Label>Resposta</Label>
              <Textarea
                value={faq.answer}
                onChange={(e) => handleChange(index, "answer", e.target.value)}
                rows={4}
                placeholder="O CriaCreator é um wizard guiado..."
              />
            </div>
          </div>
        ))}

        <Separator />

        <Button onClick={handleAdd} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Pergunta
        </Button>
      </CardContent>
    </Card>
  );
});
