import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/Header";
import { Trash2, FileText, Plus, Star, Pencil, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface Character {
  id: string;
  name: string;
  gender: string | null;
  age: string | null;
  appearance: string | null;
  created_at: string;
  is_favorite: boolean;
}

const getCachedCharacters = (): Character[] => {
  try {
    const cached = localStorage.getItem('user_characters');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>(getCachedCharacters());
  const [loading, setLoading] = useState(getCachedCharacters().length === 0);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { credits, canCreateMore, isLoading: planLoading } = useSubscription();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const hadCache = characters.length > 0;
    if (!hadCache) {
      setLoading(true);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    let query = supabase
      .from("characters")
      .select("id, name, gender, age, appearance, created_at, is_favorite")
      .eq("user_id", user.id);

    if (showOnlyFavorites) {
      query = query.eq("is_favorite", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar personagens",
        description: error.message,
      });
    } else {
      const newCharacters = data || [];
      setCharacters(newCharacters);
      
      // Update cache
      try {
        localStorage.setItem('user_characters', JSON.stringify(newCharacters));
      } catch (error) {
        console.error('Failed to cache characters:', error);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchCharacters();
  }, [showOnlyFavorites]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: error.message,
      });
    } else {
      toast({
        title: "Personagem deletado",
        description: "O personagem foi removido com sucesso.",
      });
      fetchCharacters();
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error } = await supabase
      .from("characters")
      .update({ is_favorite: !currentFavorite })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar favorito",
        description: error.message,
      });
    } else {
      toast({
        title: currentFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
        description: currentFavorite 
          ? "O personagem foi removido dos favoritos." 
          : "O personagem foi marcado como favorito.",
      });
      fetchCharacters();
    }
  };

  const handleViewPrompt = async (character: Character) => {
    // Fetch full character data
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", character.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar personagem",
        description: error.message,
      });
      return;
    }

    // Navigate to prompt result with character data
    const { generateVeo3Prompt } = await import("@/lib/promptGenerator");
    const prompt = generateVeo3Prompt(data);
    navigate("/prompt-result", { state: { prompt } });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Meus Personagens</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              Gerencie seus personagens criados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showOnlyFavorites ? "default" : "outline"}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className="gap-2"
              size="sm"
            >
              <Star className={`w-3 h-3 md:w-4 md:h-4 ${showOnlyFavorites ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{showOnlyFavorites ? "Todos" : "Favoritos"}</span>
            </Button>
            <Button 
              onClick={() => navigate("/create")}
              disabled={!canCreateMore}
              className={canCreateMore ? "" : "opacity-50 cursor-not-allowed"}
              size="sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden sm:inline">Novo Personagem</span>
            </Button>
          </div>
        </div>

        {!planLoading && !canCreateMore && (
          <Alert className="mb-4 sm:mb-6 border-lime/50 bg-lime/5">
            <Sparkles className="h-4 w-4 text-lime" />
            <AlertDescription className="text-foreground">
              <strong>Sem créditos:</strong> Você não tem créditos disponíveis para criar personagens.
              {!canCreateMore && (
                <span className="block mt-1">
                  Compre <strong className="text-lime">mais créditos</strong> para continuar criando personagens!
                  <Button 
                    variant="link" 
                    className="text-lime p-0 ml-1 h-auto"
                    onClick={() => navigate("/")}
                  >
                    Ver planos →
                  </Button>
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : characters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhum personagem
              </p>
              <Button onClick={() => navigate("/create")}>
                Criar Primeiro Personagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {characters.map((character) => (
              <Card key={character.id} className="relative">
                <button
                  onClick={() => toggleFavorite(character.id, character.is_favorite)}
                  className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform"
                  title={character.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star
                    className={`w-6 h-6 ${
                      character.is_favorite
                        ? "fill-lime text-lime"
                        : "text-muted-foreground hover:text-lime"
                    }`}
                  />
                </button>
                <CardHeader>
                  <CardTitle>{character.name}</CardTitle>
                  <CardDescription>
                    {new Date(character.created_at).toLocaleDateString("pt-BR")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {character.gender && (
                      <Badge variant="secondary">{character.gender}</Badge>
                    )}
                    {character.age && (
                      <Badge variant="secondary">{character.age}</Badge>
                    )}
                    {character.appearance && (
                      <Badge variant="secondary">{character.appearance}</Badge>
                    )}
                   </div>
                   <div className="flex flex-col sm:flex-row gap-2 w-full">
                     <Button
                       variant="outline"
                       className="flex-1 min-w-0"
                       size="sm"
                       onClick={() => navigate(`/create?edit=${character.id}`)}
                     >
                       <Pencil className="w-4 h-4 mr-2 shrink-0" />
                       <span className="truncate">Editar</span>
                     </Button>
                     <Button
                       variant="outline"
                       className="flex-1 min-w-0"
                       size="sm"
                       onClick={() => handleViewPrompt(character)}
                     >
                       <FileText className="w-4 h-4 mr-2 shrink-0" />
                       <span className="truncate">Ver Prompt</span>
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       className="sm:px-3"
                       onClick={() => handleDelete(character.id)}
                     >
                       <Trash2 className="w-4 h-4" />
                       <span className="sm:hidden ml-2">Deletar</span>
                     </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
  );
}
