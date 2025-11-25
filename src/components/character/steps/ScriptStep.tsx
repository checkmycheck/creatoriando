import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";

interface ScriptStepProps {
  value?: string;
  onChange: (value: string) => void;
}

export const ScriptStep = ({ value, onChange }: ScriptStepProps) => {
  const handleGenerateScript = () => {
    const sampleScript = "Já imaginou fazer vídeos incríveis com IA usando apenas a sua selfie? Com o Selfyai, isso é totalmente possível! Vamos explorar essa tecnologia revolucionária juntos, olha...";
    onChange(sampleScript);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-lime" />
        <div>
          <h2 className="text-2xl font-bold">Roteiro</h2>
          <p className="text-muted-foreground">O que vai falar? (~8 seg)</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite o que o apresentador vai falar... Ou clique em 'Gerar Roteiro de 8s' para criar com IA"
            className="min-h-[200px] bg-card border-border text-foreground resize-none"
          />
          <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
            {value?.length || 0} palavras
          </div>
        </div>

        <Button
          onClick={handleGenerateScript}
          variant="outline"
          className="w-full gap-2 border-lime/30 hover:bg-lime/10"
        >
          <Sparkles className="w-4 h-4 text-lime" />
          Clique para gerar com IA
        </Button>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Dica:</p>
              <p>O roteiro ideal tem cerca de 8 segundos. Foque em uma mensagem clara e direta para melhor impacto visual.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
