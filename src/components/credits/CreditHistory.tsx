import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown, ArrowUp, ShoppingCart, Gift, Sparkles } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  payment_status?: string;
}

export const CreditHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="w-4 h-4" />;
      case 'referral_bonus':
        return <Gift className="w-4 h-4" />;
      case 'usage':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <ArrowDown className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string, status?: string) => {
    if (type === 'purchase' && status) {
      const statusColors = {
        'approved': 'bg-green-500/10 text-green-500',
        'pending': 'bg-yellow-500/10 text-yellow-500',
        'rejected': 'bg-red-500/10 text-red-500',
      };
      return (
        <Badge variant="secondary" className={statusColors[status as keyof typeof statusColors] || ''}>
          {status}
        </Badge>
      );
    }

    const typeLabels = {
      'purchase': 'Compra',
      'referral_bonus': 'Bônus',
      'usage': 'Uso',
      'refund': 'Reembolso',
    };

    return (
      <Badge variant="secondary">
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando histórico...</div>;
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma transação ainda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Créditos</CardTitle>
        <CardDescription>Todas as suas transações de créditos</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.amount > 0 ? 'bg-lime/10 text-lime' : 'bg-muted'
                  }`}>
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getTypeBadge(transaction.type, transaction.payment_status)}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.amount > 0 ? 'text-lime' : 'text-muted-foreground'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">créditos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};