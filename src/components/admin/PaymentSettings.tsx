import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function PaymentSettings() {
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-config');
      
      if (error) throw error;
      
      setIsConfigured(data?.configured || false);
    } catch (error) {
      console.error("Erro ao verificar configuração:", error);
      setIsConfigured(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken.trim()) {
      toast.error("Por favor, insira o Access Token do Mercado Pago");
      return;
    }

    setIsSaving(true);
    try {
      // Validar credenciais antes de salvar
      const { data, error } = await supabase.functions.invoke('validate-payment-credentials', {
        body: { accessToken }
      });

      if (error) throw error;

      if (!data?.valid) {
        toast.error(data?.error || "Token inválido");
        return;
      }

      // Token validado com sucesso
      toast.success(`Credenciais validadas! Conta: ${data.accountInfo?.email || data.accountInfo?.nickname}`);
      toast.info("Para salvar permanentemente, atualize o secret MERCADOPAGO_ACCESS_TOKEN no Lovable Cloud");
      
      setIsConfigured(true);
      setAccessToken("");
      
    } catch (error: any) {
      console.error("Erro ao validar credenciais:", error);
      toast.error(error.message || "Erro ao validar credenciais");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!isConfigured) {
      toast.error("Configure o Mercado Pago primeiro");
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-config');

      if (error) throw error;

      if (data?.configured) {
        toast.success("Mercado Pago configurado e pronto para uso!");
      } else {
        toast.warning("Mercado Pago não está configurado");
      }
    } catch (error: any) {
      console.error("Erro ao testar conexão:", error);
      toast.error(error.message || "Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configurações de Pagamento
          </CardTitle>
          <CardDescription>
            Configure as credenciais de pagamento para processar transações via PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da configuração */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Mercado Pago Configurado</p>
                    <p className="text-sm text-muted-foreground">
                      As credenciais estão ativas e prontas para uso
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Mercado Pago Não Configurado</p>
                    <p className="text-sm text-muted-foreground">
                      Configure as credenciais para aceitar pagamentos
                    </p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {/* Alerta informativo */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> As credenciais são armazenadas de forma segura usando 
              o sistema de secrets do Lovable Cloud. Nunca compartilhe suas credenciais publicamente.
            </AlertDescription>
          </Alert>

          {/* Formulário de configuração */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mercadopago-token">
                Mercado Pago Access Token
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="mercadopago-token"
                    type={showToken ? "text" : "password"}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxx"
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Você pode obter seu Access Token no painel do Mercado Pago em{" "}
                <a 
                  href="https://www.mercadopago.com.br/developers/panel/app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Credenciais de produção
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !accessToken.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Credenciais"
                )}
              </Button>
              <Button
                onClick={handleTest}
                disabled={!isConfigured || isTesting}
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Testar Conexão"
                )}
              </Button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Como configurar:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Acesse o{" "}
                <a 
                  href="https://www.mercadopago.com.br/developers/panel/app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  painel de desenvolvedores do Mercado Pago
                </a>
              </li>
              <li>Crie ou selecione uma aplicação</li>
              <li>Copie o Access Token de produção (começa com APP_USR-)</li>
              <li>Cole o token no campo acima e clique em "Salvar Credenciais"</li>
              <li>Teste a conexão para verificar se está funcionando</li>
            </ol>
          </div>

          {/* Webhook Info */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Webhook configurado:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-xs break-all">
                https://suinpiejctltkfmczxrw.supabase.co/functions/v1/process-payment-webhook
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no painel do Mercado Pago para receber notificações de pagamento automaticamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
