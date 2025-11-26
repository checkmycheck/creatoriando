import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Video, Activity, TrendingUp, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Stats {
  totalUsers: number;
  totalCharacters: number;
  activeUsers: number;
}

interface ChartData {
  date: string;
  usuarios: number;
  personagens: number;
}

interface ThemeColor {
  key: string;
  value: string;
  label: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCharacters: 0, activeUsers: 0 });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [themeColors, setThemeColors] = useState<ThemeColor[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadThemeColors();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);

      // Total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total characters
      const { count: charactersCount } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true });

      // Active users (created characters in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: activeUsersData } = await supabase
        .from("characters")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsersData?.map((c) => c.user_id) || []);

      // Growth chart data (last 7 days)
      const chartDataTemp: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count: dailyUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lte("created_at", nextDate.toISOString());

        const { count: dailyCharacters } = await supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .lte("created_at", nextDate.toISOString());

        chartDataTemp.push({
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          usuarios: dailyUsers || 0,
          personagens: dailyCharacters || 0,
        });
      }

      setStats({
        totalUsers: usersCount || 0,
        totalCharacters: charactersCount || 0,
        activeUsers: uniqueActiveUsers.size,
      });
      setChartData(chartDataTemp);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoadingStats(false);
    }
  };

  const loadThemeColors = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("setting_key, setting_value")
        .order("setting_key");

      if (error) throw error;

      const colorLabels: Record<string, string> = {
        background: "Fundo",
        foreground: "Texto Principal",
        primary: "Cor Primária",
        "primary-foreground": "Texto em Primária",
        card: "Card",
        "card-foreground": "Texto em Card",
        muted: "Muted",
        "muted-foreground": "Texto Muted",
        lime: "Lime (Accent)",
        "progress-bar": "Barra de Progresso",
      };

      setThemeColors(
        data.map((item) => ({
          key: item.setting_key,
          value: item.setting_value,
          label: colorLabels[item.setting_key] || item.setting_key,
        }))
      );
    } catch (error) {
      console.error("Error loading theme colors:", error);
      toast.error("Erro ao carregar cores do tema");
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setThemeColors((prev) =>
      prev.map((color) => (color.key === key ? { ...color, value } : color))
    );
  };

  const handleSaveTheme = async () => {
    try {
      setSaving(true);

      for (const color of themeColors) {
        const { error } = await supabase
          .from("theme_settings")
          .update({ setting_value: color.value })
          .eq("setting_key", color.key);

        if (error) throw error;
      }

      toast.success("Tema atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Painel Admin</h1>
          <p className="text-muted-foreground">Gerencie métricas e personalize o tema</p>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="metrics">
              <Activity className="w-4 h-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="w-4 h-4 mr-2" />
              Tema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Todos os cadastrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personagens Criados</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCharacters}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total de personagens</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Crescimento</CardTitle>
                <CardDescription>Evolução de usuários e personagens nos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="usuarios"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Usuários"
                    />
                    <Line
                      type="monotone"
                      dataKey="personagens"
                      stroke="hsl(var(--lime))"
                      strokeWidth={2}
                      name="Personagens"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cores</CardTitle>
                <CardDescription>
                  Personalize as cores do tema. Todas as mudanças serão aplicadas globalmente para todos os usuários.
                  Use formato HSL (ex: 75 100% 50%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {themeColors.map((color) => (
                    <div key={color.key} className="space-y-2">
                      <Label htmlFor={color.key}>{color.label}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id={color.key}
                          value={color.value}
                          onChange={(e) => handleColorChange(color.key, e.target.value)}
                          placeholder="ex: 75 100% 50%"
                        />
                        <div
                          className="w-10 h-10 rounded border shrink-0"
                          style={{ backgroundColor: `hsl(${color.value})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSaveTheme} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
