import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Users, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  bonus_credits: number;
}

export const ReferralProgram = () => {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setReferralCode(data);
    setLoading(false);
  };

  const createReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call DB function to generate code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_referral_code');
      
      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: codeData,
          bonus_credits: 3,
        })
        .select()
        .single();

      if (error) throw error;

      setReferralCode(data);
      toast({
        title: "Código criado!",
        description: "Compartilhe com seus amigos e ganhe créditos",
      });
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar código",
        description: "Tente novamente",
      });
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;

    const link = `${window.location.origin}/auth?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <Card className="border-lime/50 bg-gradient-to-br from-lime/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-lime" />
              Programa de Indicação
            </CardTitle>
            <CardDescription>
              Indique amigos e ganhe créditos grátis
            </CardDescription>
          </div>
          <Badge className="bg-lime text-lime-foreground">
            +3 créditos por indicação
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-lime" />
            Como funciona:
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Compartilhe seu link de indicação com amigos</li>
            <li>Quando um amigo se cadastrar usando seu link, vocês dois ganham 3 créditos</li>
            <li>Sem limite de indicações!</li>
          </ol>
        </div>

        {!referralCode ? (
          <Button onClick={createReferralCode} className="w-full bg-lime text-lime-foreground hover:bg-lime/90">
            <Gift className="w-4 h-4 mr-2" />
            Criar Meu Código de Indicação
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Seu código de indicação:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/auth?ref=${referralCode.code}`}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyReferralLink}
                  size="icon"
                  variant={copied ? "default" : "outline"}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Indicações bem-sucedidas</p>
                <p className="text-2xl font-bold text-lime">{referralCode.uses.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Créditos ganhos</p>
                <p className="text-2xl font-bold">{(referralCode.uses * referralCode.bonus_credits).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};