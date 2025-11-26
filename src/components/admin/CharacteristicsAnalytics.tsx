import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface CharacteristicData {
  name: string;
  count: number;
}

const COLORS = [
  'hsl(var(--lime))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981'
];

export const CharacteristicsAnalytics = () => {
  const [genderData, setGenderData] = useState<CharacteristicData[]>([]);
  const [ageData, setAgeData] = useState<CharacteristicData[]>([]);
  const [environmentData, setEnvironmentData] = useState<CharacteristicData[]>([]);
  const [moodData, setMoodData] = useState<CharacteristicData[]>([]);
  const [visualData, setVisualData] = useState<CharacteristicData[]>([]);
  const [lightingData, setLightingData] = useState<CharacteristicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacteristics();
  }, []);

  const aggregateData = (data: any[], field: string): CharacteristicData[] => {
    const counts: { [key: string]: number } = {};
    
    data?.forEach(item => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8
  };

  const fetchCharacteristics = async () => {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("gender, age, environment, mood, visual, lighting");

      if (error) throw error;

      setGenderData(aggregateData(data || [], "gender"));
      setAgeData(aggregateData(data || [], "age"));
      setEnvironmentData(aggregateData(data || [], "environment"));
      setMoodData(aggregateData(data || [], "mood"));
      setVisualData(aggregateData(data || [], "visual"));
      setLightingData(aggregateData(data || [], "lighting"));
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Características Mais Populares</CardTitle>
            <CardDescription>Análise das escolhas mais comuns dos usuários</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Gender and Age */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {genderData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gênero</CardTitle>
              <CardDescription>Distribuição por gênero de personagem</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {ageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Faixa Etária</CardTitle>
              <CardDescription>Distribuição por idade dos personagens</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Personagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Environment and Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {environmentData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ambientes</CardTitle>
              <CardDescription>Cenários mais escolhidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={environmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--lime))" name="Personagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {moodData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expressões/Mood</CardTitle>
              <CardDescription>Humor e expressões mais comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--accent))" name="Personagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visual and Lighting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visualData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estilo Visual</CardTitle>
              <CardDescription>Estilos visuais preferidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visualData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {visualData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {lightingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Iluminação</CardTitle>
              <CardDescription>Tipos de iluminação mais usados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lightingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" name="Personagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
