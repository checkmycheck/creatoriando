import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const referralCode = searchParams.get('ref');

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 11);
    
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
  };

  useEffect(() => {
    if (referralCode) {
      validateReferralCode(referralCode);
    }
  }, [referralCode]);

  const validateReferralCode = async (code: string) => {
    setValidatingCode(true);
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code, user_id')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCodeValidation({ valid: true, message: 'Código válido! Você receberá 5 créditos grátis.' });
      } else {
        setCodeValidation({ valid: false, message: 'Código de indicação inválido.' });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setCodeValidation({ valid: false, message: 'Erro ao validar código.' });
    } finally {
      setValidatingCode(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CPF
    if (!validateCPF(cpf)) {
      toast({
        variant: "destructive",
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido.",
      });
      return;
    }

    // Validate referral code if present
    if (referralCode && codeValidation && !codeValidation.valid) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "O código de indicação não é válido.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // If signup successful and there's a referral code, apply bonus with delay
      if (data.user && referralCode && codeValidation?.valid) {
        // Delay to ensure profile creation trigger completes
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: bonusApplied, error: bonusError } = await supabase
          .rpc('apply_referral_bonus', {
            referral_code_param: referralCode,
            new_user_id: data.user.id
          });

        if (bonusError) {
          console.error('Error applying referral bonus:', bonusError);
          toast({
            title: "Cadastro realizado!",
            description: "Sua conta foi criada, mas houve um erro ao aplicar o bônus. Entre em contato com o suporte.",
            variant: "destructive",
          });
        } else if (bonusApplied) {
          toast({
            title: "Cadastro realizado com bônus! 🎉",
            description: "Você ganhou 5 créditos grátis pela indicação!",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Sua conta foi criada, mas o código de indicação não pôde ser aplicado.",
          });
        }
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Você já pode fazer login.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
    } else {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Creator IA</CardTitle>
          <CardDescription>
            Crie sua conta e ganhe <strong>1 geração grátis</strong>!
            <br />
            Indique amigos e ganhe <strong>5 gerações</strong> a cada cadastro.
          </CardDescription>
          {referralCode && (
            <Alert className={`mt-4 ${
              validatingCode 
                ? 'border-muted bg-muted/5' 
                : codeValidation?.valid 
                  ? 'border-lime/50 bg-lime/5' 
                  : 'border-destructive/50 bg-destructive/5'
            }`}>
              {validatingCode ? (
                <Gift className="h-4 w-4 text-muted-foreground animate-pulse" />
              ) : codeValidation?.valid ? (
                <CheckCircle className="h-4 w-4 text-lime" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription className="text-foreground">
                {validatingCode ? (
                  'Validando código de indicação...'
                ) : (
                  codeValidation?.message
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
