import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Wand2, Image, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

interface Generator {
  id: string;
  name: string;
  description: string | null;
  scenario_image_url: string | null;
  character_image_url: string | null;
  created_at: string;
}

const Generators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadGenerators();
  }, []);

  const loadGenerators = async () => {
    const { data, error } = await supabase
      .from("custom_generators")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar geradores",
        description: error.message,
      });
    } else {
      setGenerators(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("custom_generators")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    } else {
      toast({
        title: "Gerador excluído",
        description: "O gerador personalizado foi removido.",
      });
      setGenerators(generators.filter(g => g.id !== deleteId));
    }
    setDeleteId(null);
  };

  const handleUseGenerator = (generatorId: string) => {
    navigate(`/create-with-generator/${generatorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Geradores Personalizados</h1>
            <p className="text-muted-foreground mt-1">
              Crie templates com imagens de referência para reutilizar
            </p>
          </div>
          <Button
            onClick={() => navigate("/create-generator")}
            className="bg-lime text-lime-foreground hover:bg-lime/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Gerador
          </Button>
        </div>

        {generators.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wand2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum gerador criado</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Crie seu primeiro gerador personalizado com imagens de referência de cenário e personagem para agilizar suas criações.
              </p>
              <Button
                onClick={() => navigate("/create-generator")}
                className="bg-lime text-lime-foreground hover:bg-lime/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Gerador
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generators.map((generator) => (
              <Card key={generator.id} className="bg-card hover:bg-card/80 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{generator.name}</CardTitle>
                      {generator.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {generator.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(generator.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      {generator.scenario_image_url ? (
                        <img
                          src={generator.scenario_image_url}
                          alt="Cenário"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      {generator.character_image_url ? (
                        <img
                          src={generator.character_image_url}
                          alt="Personagem"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(generator.created_at).toLocaleDateString("pt-BR")}
                  </div>

                  <Button
                    onClick={() => handleUseGenerator(generator.id)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Usar Gerador
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gerador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O gerador será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Generators;
