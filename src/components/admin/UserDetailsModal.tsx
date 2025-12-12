import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, CreditCard, Video, Calendar, Mail, Edit2, X, Save, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

const updateProfileSchema = z.object({
  credits: z.number().int().min(0, "Créditos devem ser positivos").max(10000, "Máximo de 10.000 créditos"),
  subscription_plan: z.enum(["free", "pro", "enterprise"]),
});

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
  onUserDeleted?: () => void;
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

export function UserDetailsModal({ user, open, onClose, onUserDeleted }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editedCredits, setEditedCredits] = useState(user.credits);
  const [editedPlan, setEditedPlan] = useState(user.subscription_plan);
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    total: 0,
    favorites: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (open) {
      loadUserDetails();
      setEditedCredits(user.credits);
      setEditedPlan(user.subscription_plan);
      setIsEditing(false);
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

  const handleSave = async () => {
    try {
      // Validate input
      const validationResult = updateProfileSchema.safeParse({
        credits: editedCredits,
        subscription_plan: editedPlan,
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          credits: editedCredits,
          subscription_plan: editedPlan,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Log transaction if credits changed
      if (editedCredits !== user.credits) {
        const creditDiff = editedCredits - user.credits;
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: creditDiff,
          type: creditDiff > 0 ? "purchase" : "usage",
          description: `Ajuste manual pelo admin: ${creditDiff > 0 ? "+" : ""}${creditDiff} créditos`,
        });
      }

      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      
      // Reload user details
      await loadUserDetails();
      
      // Update parent component
      user.credits = editedCredits;
      user.subscription_plan = editedPlan;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCredits(user.credits);
    setEditedPlan(user.subscription_plan);
    setIsEditing(false);
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);

      // Delete user from auth (will cascade to profiles, characters, etc via foreign keys)
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) throw error;

      toast.success("Usuário deletado com sucesso");
      setShowDeleteDialog(false);
      onUserDeleted?.();
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao deletar usuário: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setResettingPassword(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: "reset_password",
            user_id: user.id,
            password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao redefinir senha");
      }

      toast.success("Senha redefinida com sucesso!");
      setShowResetPasswordDialog(false);
      setNewPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erro ao redefinir senha: " + error.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const calculateExpirationDate = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiration = new Date(created);
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration;
  };

  const isExpired = () => {
    const expirationDate = calculateExpirationDate(user.created_at);
    return new Date() > expirationDate;
  };

  const expirationDate = calculateExpirationDate(user.created_at);
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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

  const getPlanLabel = (plan: string) => {
    return plan.toUpperCase();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Detalhes do Usuário
                </DialogTitle>
                <DialogDescription>
                  Informações completas sobre o usuário e suas atividades
                </DialogDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetPasswordDialog(true)}
                  disabled={loading}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Redefinir Senha
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading || deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </>
                )}
              </div>
            </div>
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
                  {isEditing ? (
                    <Select
                      value={editedPlan}
                      onValueChange={(value: any) => setEditedPlan(value)}
                      disabled={saving}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">FREE</SelectItem>
                        <SelectItem value="pro">PRO</SelectItem>
                        <SelectItem value="enterprise">ENTERPRISE</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                      {getPlanLabel(user.subscription_plan)}
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data de Cadastro:</span>
                  <span className="font-medium">{formatDate(user.created_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Acesso Expira em:</span>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(expirationDate.toISOString())}</p>
                    {isExpired() ? (
                      <Badge variant="destructive" className="text-xs mt-1">Expirado</Badge>
                    ) : daysUntilExpiration <= 30 ? (
                      <Badge variant="outline" className="text-xs mt-1">{daysUntilExpiration} dias restantes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs mt-1">{daysUntilExpiration} dias restantes</Badge>
                    )}
                  </div>
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
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="credits">Quantidade de Créditos</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="0"
                        max="10000"
                        value={editedCredits}
                        onChange={(e) => setEditedCredits(parseInt(e.target.value) || 0)}
                        disabled={saving}
                        className="max-w-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        {editedCredits !== user.credits && (
                          <span className={editedCredits > user.credits ? "text-green-500" : "text-red-500"}>
                            {editedCredits > user.credits ? "+" : ""}
                            {Math.abs(editedCredits - user.credits).toLocaleString('pt-BR')} créditos
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-primary">{user.credits.toLocaleString('pt-BR')}</div>
                      <p className="text-xs text-muted-foreground mt-1">Créditos disponíveis</p>
                    </>
                  )}
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
                  <div className="text-3xl font-bold text-primary">{characterStats.total.toLocaleString('pt-BR')}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {characterStats.favorites.toLocaleString('pt-BR')} favoritos
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
                          {Math.abs(transaction.amount).toLocaleString('pt-BR')}
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

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o usuário <strong>{user.email}</strong>?
            Esta ação é irreversível e irá deletar todos os dados associados (personagens, transações, etc).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              "Deletar Usuário"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showResetPasswordDialog} onOpenChange={(open) => {
      setShowResetPasswordDialog(open);
      if (!open) setNewPassword("");
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Redefinir Senha</AlertDialogTitle>
          <AlertDialogDescription>
            Defina uma nova senha para o usuário <strong>{user.email}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="new-password">Nova Senha</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resettingPassword}
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resettingPassword}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleResetPassword}
            disabled={resettingPassword || newPassword.length < 6}
          >
            {resettingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir Senha"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
