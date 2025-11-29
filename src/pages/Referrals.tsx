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
    const link = `https://criacreator.online/auth?ref=${referralCode.code}`;
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
    const link = `https://criacreator.online/auth?ref=${referralCode.code}`;
    const message = `Junte-se ao Creator IA e ganhe 3 créditos grátis! Use meu link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Calcular créditos ganhos somando os valores reais do histórico
  const totalCreditsEarned = referralHistory.reduce((sum, item) => sum + item.credits_awarded, 0);
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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-6xl space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold flex items-center gap-2 md:gap-3 leading-tight">
          <Gift className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
          Programa de Indicação
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg font-light leading-relaxed">
          Indique amigos e ganhe créditos grátis para criar mais personagens
        </p>
      </div>

      {/* Main Referral Section */}
      {!referralCode ? (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="font-bold">Comece a Indicar Agora</CardTitle>
            <CardDescription className="font-light">
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
                <CardTitle className="text-2xl font-bold">Seu Link de Indicação</CardTitle>
                <CardDescription className="font-light">
                  Compartilhe este link com amigos e ganhe créditos
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                +3 créditos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://criacreator.online/auth?ref=${referralCode.code}`}
                className="font-mono text-xs md:text-sm"
              />
              <Button
                onClick={copyReferralLink}
                size="icon"
                variant={copied ? "default" : "outline"}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <Button 
                onClick={shareWhatsApp}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="truncate">Compartilhar no WhatsApp</span>
              </Button>
              <Button 
                onClick={copyReferralLink}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                <span className="truncate">Copiar Link</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {referralCode && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                <Users className="w-4 h-4" />
                Indicações Bem-Sucedidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold text-primary">{referralCode.uses.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                <Award className="w-4 h-4" />
                Créditos Ganhos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold">{totalCreditsEarned.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                <TrendingUp className="w-4 h-4" />
                Taxa de Conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-4xl font-bold text-primary">{conversionRate}%</p>
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
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg md:text-xl">
                1
              </div>
              <h3 className="font-semibold text-sm md:text-base">Compartilhe seu link</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-light">
                Envie seu link de indicação para amigos e familiares
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg md:text-xl">
                2
              </div>
              <h3 className="font-semibold text-sm md:text-base">Amigo se cadastra</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-light">
                Quando alguém usar seu link para se cadastrar
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg md:text-xl">
                3
              </div>
              <h3 className="font-semibold text-sm md:text-base">Vocês ganham créditos</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-light">
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
            <CardTitle className="font-bold">Histórico de Indicações</CardTitle>
            <CardDescription className="font-light">
              Suas indicações bem-sucedidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralHistory.map((item) => (
                <div 
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 md:p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">Indicação bem-sucedida</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm md:text-lg shrink-0 w-fit">
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