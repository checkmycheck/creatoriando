import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Download, DollarSign, TrendingUp, TrendingDown, User } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  payment_id: string | null;
  payment_status: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

type PeriodFilter = "all" | "today" | "week" | "month" | "3months";
type TypeFilter = "all" | "purchase" | "usage" | "referral_bonus" | "refund";
type StatusFilter = "all" | "approved" | "pending" | "rejected";

export const AdminCreditHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    creditsAdded: 0,
    creditsUsed: 0,
  });

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchData();
  }, [currentPage, periodFilter, typeFilter, statusFilter, userFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("credit_transactions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (periodFilter !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (periodFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "3months":
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        query = query.gte("created_at", startDate.toISOString());
      }

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      if (userFilter !== "all") {
        query = query.eq("user_id", userFilter);
      }

      // Fetch paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setTransactions(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Calculate metrics
      const metricsQuery = supabase.from("credit_transactions").select("amount, type");
      
      if (periodFilter !== "all") {
        const now = new Date();
        let startDate = new Date();
        
        switch (periodFilter) {
          case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate.setDate(now.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "3months":
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        metricsQuery.gte("created_at", startDate.toISOString());
      }

      const { data: metricsData } = await metricsQuery;

      if (metricsData) {
        const creditsAdded = metricsData
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const creditsUsed = Math.abs(
          metricsData
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
        );

        setMetrics({
          totalTransactions: metricsData.length,
          creditsAdded,
          creditsUsed,
        });
      }

      // Fetch users for filter
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("email");

      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Data", "Usuário", "Email", "Tipo", "Descrição", "Valor", "Status"],
      ...transactions.map((t) => {
        const user = users.find((u) => u.id === t.user_id);
        return [
          new Date(t.created_at).toLocaleString("pt-BR"),
          user?.full_name || "-",
          user?.email || "-",
          getTypeLabel(t.type),
          t.description || "-",
          t.amount.toString(),
          t.payment_status || "-",
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${new Date().toISOString()}.csv`;
    link.click();
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      purchase: "Compra",
      usage: "Uso",
      referral_bonus: "Bônus de Indicação",
      refund: "Reembolso",
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      purchase: "default",
      usage: "secondary",
      referral_bonus: "outline",
      refund: "destructive",
    };
    return <Badge variant={variants[type] || "secondary"}>{getTypeLabel(type)}</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const colors: Record<string, string> = {
      approved: "bg-green-500/10 text-green-500",
      pending: "bg-yellow-500/10 text-yellow-500",
      rejected: "bg-red-500/10 text-red-500",
    };

    const labels: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
    };

    return (
      <Badge variant="secondary" className={colors[status] || ""}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTransactions.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Adicionados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              +{metrics.creditsAdded.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Usados</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -{metrics.creditsUsed.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Visualize todas as transações de créditos</CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="usage">Uso</SelectItem>
                <SelectItem value="referral_bonus">Bônus</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const user = users.find((u) => u.id === transaction.user_id);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user?.full_name || "-"}</span>
                              <span className="text-xs text-muted-foreground">{user?.email || "-"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {transaction.description || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              transaction.amount > 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount.toLocaleString('pt-BR')}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
