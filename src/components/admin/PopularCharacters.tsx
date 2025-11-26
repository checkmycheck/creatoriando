import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";

interface PopularCharacter {
  id: string;
  name: string;
  gender: string | null;
  age: string | null;
  created_at: string;
  user_email: string;
}

export const PopularCharacters = () => {
  const [characters, setCharacters] = useState<PopularCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularCharacters();
  }, []);

  const fetchPopularCharacters = async () => {
    try {
      // Get most recently created characters as "popular"
      // In a real app, you'd track views/uses
      const { data, error } = await supabase
        .from("characters")
        .select(`
          id,
          name,
          gender,
          age,
          created_at,
          profiles!inner(email)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedData = data?.map(char => ({
        ...char,
        user_email: (char.profiles as any)?.email || "Unknown",
      })) || [];

      setCharacters(formattedData);
    } catch (error) {
      console.error("Error fetching popular characters:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-lime" />
          Personagens Recentes
        </CardTitle>
        <CardDescription>
          Top 10 personagens criados mais recentemente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {characters.map((character, index) => (
            <div
              key={character.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime/10 text-lime font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{character.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {character.user_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {character.gender && (
                  <Badge variant="secondary" className="text-xs">
                    {character.gender}
                  </Badge>
                )}
                {character.age && (
                  <Badge variant="secondary" className="text-xs">
                    {character.age}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(character.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
