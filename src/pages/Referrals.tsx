import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Users, Gift, Share2, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralCode {
  id: string;
  code: string;
  uses: number;
  bonus_credits: number;
}

interface ReferralHistory {
  id: string;
  created_at: string;
  credits_awarded: number;
  referred_user_id: string;
}

export default function Referrals() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    const cachedCode = localStorage.getItem('referral_code');
    if (cachedCode) {
      setReferralCode(JSON.parse(cachedCode));
      setLoading(false);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch referral code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (codeData) {
      setReferralCode(codeData);
      localStorage.setItem('referral_code', JSON.stringify(codeData));

      // Fetch referral history
      const { data: historyData } = await supabase
        .from('referral_uses')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyData) {
        setReferralHistory(historyData);
      }
    }

    setLoading(false);
  };

  const createReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      localStorage.setItem('referral_code', JSON.stringify(data));
      
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

  const shareWhatsApp = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/auth?ref=${referralCode.code}`;
    const message = `Junte-se ao Creator IA e ganhe 3 créditos grátis! Use meu link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalCreditsEarned = referralCode ? referralCode.uses * referralCode.bonus_credits : 0;
  const conversionRate = referralCode && referralCode.uses > 0 ? 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Gift className="w-8 h-8 text-primary" />
          Programa de Indicação
        </h1>
        <p className="text-muted-foreground text-lg">
          Indique amigos e ganhe créditos grátis para criar mais personagens
        </p>
      </div>

      {/* Main Referral Section */}
      {!referralCode ? (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle>Comece a Indicar Agora</CardTitle>
            <CardDescription>
              Crie seu código de indicação e comece a ganhar créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createReferralCode} 
              size="lg"
              className="w-full md:w-auto"
            >
              <Gift className="w-5 h-5 mr-2" />
              Criar Meu Código de Indicação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Seu Link de Indicação</CardTitle>
                <CardDescription>
                  Compartilhe este link com amigos e ganhe créditos
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                +3 créditos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex gap-2">
              <Button 
                onClick={shareWhatsApp}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar no WhatsApp
              </Button>
              <Button 
                onClick={copyReferralLink}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {referralCode && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Indicações Bem-Sucedidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{referralCode.uses.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Créditos Ganhos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalCreditsEarned.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Taxa de Conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{conversionRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold">Compartilhe seu link</h3>
              <p className="text-sm text-muted-foreground">
                Envie seu link de indicação para amigos e familiares
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold">Amigo se cadastra</h3>
              <p className="text-sm text-muted-foreground">
                Quando alguém usar seu link para se cadastrar
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold">Vocês ganham créditos</h3>
              <p className="text-sm text-muted-foreground">
                Você e seu amigo recebem 3 créditos cada um
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referralCode && referralHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Indicações</CardTitle>
            <CardDescription>
              Suas indicações bem-sucedidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralHistory.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Indicação bem-sucedida</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    +{item.credits_awarded.toLocaleString('pt-BR')} créditos
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}