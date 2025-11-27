import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Transaction = {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  description: string | null;
  amount: number;
  payment_status: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
  };
};

type User = {
  id: string;
  email: string;
  full_name: string | null;
};

type PeriodFilter = "all" | "today" | "week" | "month" | "7days" | "30days" | "90days";
type TypeFilter = "all" | "purchase" | "usage" | "referral_bonus" | "bonus";
type StatusFilter = "all" | "approved" | "pending" | "rejected";

export default function CreditHistory() {
  const { isAdmin } = useAdmin();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  // Metrics
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);

  useEffect(() => {
    fetchData();
  }, [periodFilter, typeFilter, statusFilter, userFilter, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions
      let query = supabase
        .from("credit_transactions")
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      // Permission-based filtering
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      } else if (userFilter !== "all") {
        query = query.eq("user_id", userFilter);
      }

      // Period filter
      if (periodFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (periodFilter) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "7days":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "30days":
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
          case "90days":
            startDate = new Date(now.setDate(now.getDate() - 90));
            break;
        }
        query = query.gte("created_at", startDate.toISOString());
      }

      // Type filter
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      // Status filter
      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);

      // Calculate metrics
      const total = data?.length || 0;
      const added = data?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
      const used = Math.abs(data?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0) || 0);

      setTotalTransactions(total);
      setCreditsAdded(added);
      setCreditsUsed(used);

      // Fetch users list for admin
      if (isAdmin) {
        const { data: usersData } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .order("email");
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Data", "Hora", isAdmin ? "Usuário" : "", "Tipo", "Descrição", "Créditos", "Status"]
        .filter(Boolean)
        .join(","),
    ];

    transactions.forEach((t) => {
      const row = [
        format(new Date(t.created_at), "dd/MM/yyyy"),
        format(new Date(t.created_at), "HH:mm:ss"),
        isAdmin ? (t.profiles?.email || "-") : "",
        getTypeLabel(t.type),
        `"${t.description?.replace(/"/g, '""') || "-"}"`,
        t.amount.toString(),
        t.payment_status || "-",
      ].filter((_, index) => index !== 2 || isAdmin);

      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-creditos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Compra",
      usage: "Uso",
      referral_bonus: "Bônus Referral",
      bonus: "Bônus",
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      purchase: "default",
      usage: "destructive",
      referral_bonus: "secondary",
      bonus: "secondary",
    };
    return variants[type] || "outline";
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          📊 Histórico de Créditos
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visualize todas as suas transações de créditos
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold">{totalTransactions.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Créditos Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-green-500">
              +{creditsAdded.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Créditos Usados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl sm:text-3xl font-bold text-red-500">
              -{creditsUsed.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as transações por período, tipo e status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            <Select value={periodFilter} onValueChange={(value: PeriodFilter) => setPeriodFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="7days">Últimos 7 Dias</SelectItem>
                <SelectItem value="30days">Últimos 30 Dias</SelectItem>
                <SelectItem value="90days">Últimos 90 Dias</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="usage">Uso</SelectItem>
                <SelectItem value="referral_bonus">Bônus Referral</SelectItem>
                <SelectItem value="bonus">Bônus</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            {/* User Filter (Admin Only) */}
            {isAdmin && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Mostrando {startIndex + 1}-{Math.min(endIndex, transactions.length)} de {transactions.length} transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  {isAdmin && <TableHead>Usuário</TableHead>}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {format(new Date(transaction.created_at), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="text-sm">{transaction.profiles?.full_name || "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.profiles?.email}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={getTypeBadge(transaction.type)}>
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
