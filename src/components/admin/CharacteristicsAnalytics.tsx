import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CharacteristicData {
  name: string;
  count: number;
}

interface CorrelationData {
  name: string;
  [key: string]: string | number;
}

interface RawCharacterData {
  gender?: string;
  age?: string;
  appearance?: string;
  environment?: string;
  posture?: string;
  action?: string;
  mood?: string;
  visual?: string;
  movement?: string;
  angle?: string;
  lighting?: string;
  voice_tone?: string;
  created_at?: string;
}

interface TrendData {
  date: string;
  [key: string]: string | number;
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
  const [appearanceData, setAppearanceData] = useState<CharacteristicData[]>([]);
  const [environmentData, setEnvironmentData] = useState<CharacteristicData[]>([]);
  const [postureData, setPostureData] = useState<CharacteristicData[]>([]);
  const [actionData, setActionData] = useState<CharacteristicData[]>([]);
  const [moodData, setMoodData] = useState<CharacteristicData[]>([]);
  const [visualData, setVisualData] = useState<CharacteristicData[]>([]);
  const [movementData, setMovementData] = useState<CharacteristicData[]>([]);
  const [angleData, setAngleData] = useState<CharacteristicData[]>([]);
  const [lightingData, setLightingData] = useState<CharacteristicData[]>([]);
  const [voiceToneData, setVoiceToneData] = useState<CharacteristicData[]>([]);
  const [rawData, setRawData] = useState<RawCharacterData[]>([]);
  const [correlationEnvPosture, setCorrelationEnvPosture] = useState<CorrelationData[]>([]);
  const [correlationVisualMood, setCorrelationVisualMood] = useState<CorrelationData[]>([]);
  const [correlationMovementAngle, setCorrelationMovementAngle] = useState<CorrelationData[]>([]);
  const [trendGender, setTrendGender] = useState<TrendData[]>([]);
  const [trendEnvironment, setTrendEnvironment] = useState<TrendData[]>([]);
  const [trendVisual, setTrendVisual] = useState<TrendData[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);


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

  const calculateCorrelation = (
    data: RawCharacterData[],
    field1: keyof RawCharacterData,
    field2: keyof RawCharacterData
  ): CorrelationData[] => {
    const correlationMap: { [key: string]: { [key: string]: number } } = {};

    data?.forEach(item => {
      const value1 = item[field1];
      const value2 = item[field2];
      
      if (value1 && value2) {
        if (!correlationMap[value1]) {
          correlationMap[value1] = {};
        }
        correlationMap[value1][value2] = (correlationMap[value1][value2] || 0) + 1;
      }
    });

    // Convert to array format for recharts
    const result: CorrelationData[] = [];
    Object.entries(correlationMap).forEach(([key, values]) => {
      const dataPoint: CorrelationData = { name: key };
      Object.entries(values).forEach(([subKey, count]) => {
        dataPoint[subKey] = count;
      });
      result.push(dataPoint);
    });

    return result.sort((a, b) => {
      const sumA = Object.entries(a).reduce((acc, [key, val]) => 
        key !== 'name' && typeof val === 'number' ? acc + val : acc, 0);
      const sumB = Object.entries(b).reduce((acc, [key, val]) => 
        key !== 'name' && typeof val === 'number' ? acc + val : acc, 0);
      return sumB - sumA;
    }).slice(0, 5); // Top 5 for readability
  };

  const calculateTrends = (
    data: RawCharacterData[],
    field: keyof RawCharacterData,
    days: number
  ): TrendData[] => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Filter data by period
    const filteredData = data.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate;
    });

    // Group by date and characteristic value
    const trendMap: { [date: string]: { [value: string]: number } } = {};
    
    filteredData.forEach(item => {
      if (!item.created_at || !item[field]) return;
      
      const date = new Date(item.created_at).toLocaleDateString('pt-BR');
      const value = item[field] as string;
      
      if (!trendMap[date]) {
        trendMap[date] = {};
      }
      trendMap[date][value] = (trendMap[date][value] || 0) + 1;
    });

    // Convert to array format
    const result: TrendData[] = Object.entries(trendMap)
      .map(([date, values]) => ({
        date,
        ...values
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      });

    return result;
  };

  const fetchCharacteristics = async () => {
    try {
      const { data, error } = await supabase
        .from("characters")
        .select("gender, age, appearance, environment, posture, action, mood, visual, movement, angle, lighting, voice_tone, created_at");

      if (error) throw error;

      setRawData(data || []);
      setGenderData(aggregateData(data || [], "gender"));
      setAgeData(aggregateData(data || [], "age"));
      setAppearanceData(aggregateData(data || [], "appearance"));
      setEnvironmentData(aggregateData(data || [], "environment"));
      setPostureData(aggregateData(data || [], "posture"));
      setActionData(aggregateData(data || [], "action"));
      setMoodData(aggregateData(data || [], "mood"));
      setVisualData(aggregateData(data || [], "visual"));
      setMovementData(aggregateData(data || [], "movement"));
      setAngleData(aggregateData(data || [], "angle"));
      setLightingData(aggregateData(data || [], "lighting"));
      setVoiceToneData(aggregateData(data || [], "voice_tone"));

      // Calculate correlations
      setCorrelationEnvPosture(calculateCorrelation(data || [], "environment", "posture"));
      setCorrelationVisualMood(calculateCorrelation(data || [], "visual", "mood"));
      setCorrelationMovementAngle(calculateCorrelation(data || [], "movement", "angle"));

      // Calculate trends based on selected period
      const days = trendPeriod === '7d' ? 7 : trendPeriod === '30d' ? 30 : 90;
      setTrendGender(calculateTrends(data || [], "gender", days));
      setTrendEnvironment(calculateTrends(data || [], "environment", days));
      setTrendVisual(calculateTrends(data || [], "visual", days));
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacteristics();
  }, [trendPeriod]);

  const exportToCSV = () => {
    try {
      const csvData = [
        ["Categoria", "Característica", "Quantidade"],
        ...genderData.map(item => ["Gênero", item.name, item.count]),
        ...ageData.map(item => ["Faixa Etária", item.name, item.count]),
        ...appearanceData.map(item => ["Aparência", item.name, item.count]),
        ...environmentData.map(item => ["Ambiente", item.name, item.count]),
        ...postureData.map(item => ["Postura", item.name, item.count]),
        ...actionData.map(item => ["Ação", item.name, item.count]),
        ...moodData.map(item => ["Expressão", item.name, item.count]),
        ...visualData.map(item => ["Estilo Visual", item.name, item.count]),
        ...movementData.map(item => ["Movimento", item.name, item.count]),
        ...angleData.map(item => ["Ângulo", item.name, item.count]),
        ...lightingData.map(item => ["Iluminação", item.name, item.count]),
        ...voiceToneData.map(item => ["Tom de Voz", item.name, item.count]),
      ];

      const csvContent = csvData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `caracteristicas-populares-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório CSV exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erro ao exportar CSV");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text("Relatório de Características Populares", 14, 20);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

      let yPosition = 35;

      // Helper function to add table
      const addTable = (title: string, data: CharacteristicData[]) => {
        if (data.length === 0) return;
        
        doc.setFontSize(14);
        doc.text(title, 14, yPosition);
        yPosition += 5;

        autoTable(doc, {
          startY: yPosition,
          head: [["Característica", "Quantidade"]],
          body: data.map(item => [item.name, item.count.toLocaleString('pt-BR')]),
          theme: "grid",
          headStyles: { fillColor: [124, 175, 58] },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
        
        // Add new page if needed
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Add all sections
      addTable("Gênero", genderData);
      addTable("Faixa Etária", ageData);
      addTable("Aparência", appearanceData);
      addTable("Ambiente", environmentData);
      addTable("Postura", postureData);
      addTable("Ação", actionData);
      addTable("Expressão", moodData);
      addTable("Estilo Visual", visualData);
      addTable("Movimento de Câmera", movementData);
      addTable("Ângulo de Câmera", angleData);
      addTable("Iluminação", lightingData);
      addTable("Tom de Voz", voiceToneData);

      doc.save(`caracteristicas-populares-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erro ao exportar PDF");
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Características Mais Populares</CardTitle>
                <CardDescription>Análise das escolhas mais comuns dos usuários</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={exportToPDF} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Perfil do Personagem */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Perfil do Personagem</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {genderData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gênero</CardTitle>
                <CardDescription>Distribuição por gênero</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
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
                <CardDescription>Distribuição por idade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
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

          {appearanceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Distribuição por etnia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={appearanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {appearanceData.map((entry, index) => (
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
        </div>
      </div>

      {/* Cenário e Composição */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Cenário e Composição</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {environmentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ambientes</CardTitle>
                <CardDescription>Cenários mais escolhidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={environmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
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

          {postureData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Postura</CardTitle>
                <CardDescription>Posturas mais escolhidas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={postureData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
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

          {actionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ação</CardTitle>
                <CardDescription>Ações mais comuns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={actionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
                    />
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

      {/* Cinematografia */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Cinematografia</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {movementData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Movimento de Câmera</CardTitle>
                <CardDescription>Movimentos preferidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={movementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {movementData.map((entry, index) => (
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

          {angleData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ângulo de Câmera</CardTitle>
                <CardDescription>Ângulos mais usados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={angleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {angleData.map((entry, index) => (
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
                <CardDescription>Tipos de iluminação</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
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
                    <Bar dataKey="count" fill="hsl(var(--lime))" name="Personagens" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Estilo e Áudio */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Estilo e Áudio</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visualData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estilo Visual</CardTitle>
                <CardDescription>Estilos preferidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={visualData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
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

          {moodData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expressão</CardTitle>
                <CardDescription>Expressões mais comuns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={moodData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
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

          {voiceToneData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tom de Voz</CardTitle>
                <CardDescription>Tons de voz escolhidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={voiceToneData}>
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

      {/* Análise de Correlações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Análise de Correlações</h3>
        <p className="text-sm text-muted-foreground">
          Relacionamento entre diferentes características escolhidas pelos usuários
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {correlationEnvPosture.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ambiente × Postura</CardTitle>
                <CardDescription>Quais posturas são mais usadas em cada ambiente</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={correlationEnvPosture}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    {Object.keys(correlationEnvPosture[0] || {})
                      .filter(key => key !== 'name')
                      .map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {correlationVisualMood.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estilo Visual × Expressão</CardTitle>
                <CardDescription>Quais expressões combinam com cada estilo visual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={correlationVisualMood}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    {Object.keys(correlationVisualMood[0] || {})
                      .filter(key => key !== 'name')
                      .map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {correlationMovementAngle.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Movimento × Ângulo de Câmera</CardTitle>
                <CardDescription>Combinações mais comuns de movimento e ângulo de câmera</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={correlationMovementAngle}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    {Object.keys(correlationMovementAngle[0] || {})
                      .filter(key => key !== 'name')
                      .map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tendências Temporais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Tendências Temporais</h3>
            <p className="text-sm text-muted-foreground">Evolução das preferências ao longo do tempo</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={trendPeriod === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('7d')}
            >
              7 dias
            </Button>
            <Button
              variant={trendPeriod === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('30d')}
            >
              30 dias
            </Button>
            <Button
              variant={trendPeriod === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('90d')}
            >
              90 dias
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {trendGender.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Gênero</CardTitle>
                <CardDescription>Como a escolha de gênero mudou ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendGender}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                    <Legend />
                    {Object.keys(trendGender[0] || {})
                      .filter(key => key !== 'date')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {trendEnvironment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Ambientes</CardTitle>
                <CardDescription>Tendência de escolha de cenários ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendEnvironment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                    <Legend />
                    {Object.keys(trendEnvironment[0] || {})
                      .filter(key => key !== 'date')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {trendVisual.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Estilo Visual</CardTitle>
                <CardDescription>Como as preferências de estilo visual mudaram ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendVisual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
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
                    <Legend />
                    {Object.keys(trendVisual[0] || {})
                      .filter(key => key !== 'date')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
