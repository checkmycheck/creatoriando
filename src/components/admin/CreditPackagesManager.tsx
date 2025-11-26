import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Save, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface CreditPackage {
  id: string;
  credits: number;
  price_brl: number;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
}

export const CreditPackagesManager = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    credits: "",
    price_brl: "",
    is_popular: false,
    display_order: "",
    is_active: true,
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar pacotes",
        description: "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (pkg: CreditPackage) => {
    setEditingId(pkg.id);
    setFormData({
      credits: pkg.credits.toString(),
      price_brl: pkg.price_brl.toString(),
      is_popular: pkg.is_popular,
      display_order: pkg.display_order.toString(),
      is_active: pkg.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      credits: "",
      price_brl: "",
      is_popular: false,
      display_order: "",
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      const packageData = {
        credits: parseInt(formData.credits),
        price_brl: parseFloat(formData.price_brl),
        is_popular: formData.is_popular,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
      };

      if (isCreating) {
        const { error } = await supabase
          .from('credit_packages')
          .insert(packageData);

        if (error) throw error;

        toast({
          title: "Pacote criado!",
          description: "Novo pacote de créditos adicionado com sucesso",
        });
      } else if (editingId) {
        const { error } = await supabase
          .from('credit_packages')
          .update(packageData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Pacote atualizado!",
          description: "Alterações salvas com sucesso",
        });
      }

      cancelEdit();
      loadPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Verifique os dados e tente novamente",
      });
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;

    try {
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', packageToDelete);

      if (error) throw error;

      toast({
        title: "Pacote excluído",
        description: "Pacote removido com sucesso",
      });

      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Tente novamente",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setPackageToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Gerenciar Pacotes de Créditos
              </CardTitle>
              <CardDescription>
                Configure os pacotes e preços disponíveis para compra
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setIsCreating(true);
                setFormData({
                  credits: "",
                  price_brl: "",
                  is_popular: false,
                  display_order: (packages.length + 1).toString(),
                  is_active: true,
                });
              }}
              disabled={isCreating || editingId !== null}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Pacote
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreating && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-credits">Quantidade de Créditos</Label>
                    <Input
                      id="new-credits"
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-price">Preço (R$)</Label>
                    <Input
                      id="new-price"
                      type="number"
                      step="0.01"
                      value={formData.price_brl}
                      onChange={(e) => setFormData({ ...formData, price_brl: e.target.value })}
                      placeholder="Ex: 2.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-order">Ordem de Exibição</Label>
                    <Input
                      id="new-order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-popular">Marcar como Popular</Label>
                      <Switch
                        id="new-popular"
                        checked={formData.is_popular}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-active">Ativo</Label>
                      <Switch
                        id="new-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {packages.map((pkg) => (
            <Card key={pkg.id} className={!pkg.is_active ? "opacity-50" : ""}>
              <CardContent className="pt-6">
                {editingId === pkg.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Quantidade de Créditos</Label>
                        <Input
                          type="number"
                          value={formData.credits}
                          onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price_brl}
                          onChange={(e) => setFormData({ ...formData, price_brl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ordem de Exibição</Label>
                        <Input
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Marcar como Popular</Label>
                          <Switch
                            checked={formData.is_popular}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Ativo</Label>
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{pkg.credits.toLocaleString('pt-BR')} créditos</p>
                          {pkg.is_popular && (
                            <Badge variant="secondary">Popular</Badge>
                          )}
                          {!pkg.is_active && (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-lg text-muted-foreground">
                          R$ {pkg.price_brl.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ordem: {pkg.display_order}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(pkg)}
                        variant="outline"
                        size="icon"
                        disabled={editingId !== null || isCreating}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => confirmDelete(pkg.id)}
                        variant="outline"
                        size="icon"
                        disabled={editingId !== null || isCreating}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {packages.length === 0 && !isCreating && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pacote cadastrado. Clique em "Novo Pacote" para começar.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};