import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDetailsModal } from "./UserDetailsModal";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_plan: "free" | "pro" | "enterprise";
  credits: number;
  created_at: string;
}

interface UsersListProps {
  users: Profile[];
}

export function UsersList({ users }: UsersListProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Data de Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(user.subscription_plan)}>
                      {user.subscription_plan.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserDeleted={() => {
            setSelectedUser(null);
            setRefreshTrigger(prev => prev + 1); // Trigger parent refresh
          }}
        />
      )}
    </>
  );
}
