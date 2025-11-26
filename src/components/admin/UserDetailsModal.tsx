import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, CreditCard, Video, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_plan: "free" | "pro" | "enterprise";
  credits: number;
  created_at: string;
  subscription_status?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
}

interface UserDetailsModalProps {
  user: Profile;
  open: boolean;
  onClose: () => void;
}

interface CharacterStats {
  total: number;
  favorites: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export function UserDetailsModal({ user, open, onClose }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    total: 0,
    favorites: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (open) {
      loadUserDetails();
    }
  }, [open, user.id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);

      // Get character stats
      const { data: characters } = await supabase
        .from("characters")
        .select("id, is_favorite")
        .eq("user_id", user.id);

      const stats = {
        total: characters?.length || 0,
        favorites: characters?.filter((c) => c.is_favorite).length || 0,
      };
      setCharacterStats(stats);

      // Get recent credit transactions
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("id, amount, type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentTransactions(transactions || []);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast.error("Erro ao carregar detalhes do usuário");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Compra",
      referral_bonus: "Bônus de Indicação",
      usage: "Uso",
      refund: "Reembolso",
    };
    return labels[type] || type;
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "pro":
        return "default";
      case "enterprise":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o usuário e suas atividades
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{user.full_name || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                    {user.subscription_plan.toUpperCase()}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data de Cadastro:</span>
                  <span className="font-medium">{formatDate(user.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Credits & Characters Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{user.credits}</div>
                  <p className="text-xs text-muted-foreground mt-1">Créditos disponíveis</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Personagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{characterStats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {characterStats.favorites} favoritos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Transações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma transação registrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-start p-3 rounded-lg bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {transaction.description || getTransactionTypeLabel(transaction.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <Badge
                          variant={transaction.amount > 0 ? "default" : "outline"}
                          className="font-mono"
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
