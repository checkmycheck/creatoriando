import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Copy, Download, ArrowLeft, Check, FolderOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";

const PromptResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const prompt = location.state?.prompt || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veo3-prompt.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Prompt baixado!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Prompt Gerado</h1>
            <p className="text-muted-foreground">
              Pronto para usar no Veo3 ou outras plataformas
            </p>
          </div>
        </div>

        <Alert className="bg-lime/10 border-lime">
          <Check className="h-4 w-4 text-lime" />
          <AlertDescription className="text-foreground">
            Personagem salvo com sucesso! Você pode acessá-lo em{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-lime hover:text-lime/80"
              onClick={() => navigate("/characters")}
            >
              Meus Personagens
            </Button>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar XML
          </Button>
          <Button
            onClick={() => window.open("https://labs.google/fx/pt/tools/flow", "_blank")}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Usar no Flow
          </Button>
          <Button
            onClick={() => navigate("/characters")}
            variant="outline"
            className="gap-2 ml-auto"
          >
            <FolderOpen className="w-4 h-4" />
            Meus Personagens
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <pre className="text-sm text-foreground overflow-x-auto whitespace-pre-wrap font-mono">
            {prompt}
          </pre>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Como usar:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Copie o prompt XML gerado acima ou clique em "Usar no Google Flow"</li>
            <li>No Google Flow, cole o prompt no campo apropriado</li>
            <li>Faça upload da sua selfie (se necessário)</li>
            <li>Ajuste os parâmetros finais conforme desejado</li>
            <li>Gere seu vídeo!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PromptResult;
