import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  payment_id: string | null;
  payment_status: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Sem status</Badge>;
    
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      approved: { label: "Aprovado", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      rejected: { label: "Rejeitado", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };

    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      purchase: { label: "Compra", variant: "default" },
      usage: { label: "Uso", variant: "secondary" },
      referral_bonus: { label: "Bônus Referral", variant: "outline" },
      bonus: { label: "Bônus", variant: "outline" },
    };

    const config = typeMap[type] || { label: type, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || transaction.payment_status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalValue = filteredTransactions
    .filter(t => t.type === "purchase" && t.payment_status === "approved")
    .reduce((sum, t) => {
      // Estimar valor baseado nos créditos (2 reais = 10 créditos, proporção)
      const creditsValue = Math.abs(t.amount);
      return sum + (creditsValue * 0.2); // 0.2 reais por crédito (aproximado)
    }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Transações PIX
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todas as transações de créditos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="usage">Uso</SelectItem>
                <SelectItem value="referral_bonus">Bônus Referral</SelectItem>
                <SelectItem value="bonus">Bônus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTransactions.length.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredTransactions.filter(t => t.payment_status === "approved").length.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total (Aprovadas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.profiles?.full_name || "Sem nome"}</span>
                          <span className="text-xs text-muted-foreground">{transaction.profiles?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.amount > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.payment_status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.payment_id ? (
                          <span title={transaction.payment_id}>
                            {transaction.payment_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={transaction.description || ""}>
                        {transaction.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
