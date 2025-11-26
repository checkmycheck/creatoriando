import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Users, Video, Activity, TrendingUp, Palette, Loader2, Home } from "lucide-react";
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
  description: string;
  category: string;
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

      const colorLabels: Record<string, { label: string; description: string; category: string }> = {
        background: { 
          label: "Fundo Principal", 
          description: "Cor de fundo de toda a aplicação",
          category: "Fundos"
        },
        foreground: { 
          label: "Texto Principal", 
          description: "Cor do texto sobre o fundo principal",
          category: "Textos"
        },
        card: { 
          label: "Fundo dos Cards", 
          description: "Cor de fundo dos cartões e painéis",
          category: "Fundos"
        },
        "card-foreground": { 
          label: "Texto dos Cards", 
          description: "Cor do texto dentro dos cards",
          category: "Textos"
        },
        "card-hover": { 
          label: "Hover dos Cards", 
          description: "Cor de fundo dos cards ao passar o mouse",
          category: "Componentes"
        },
        "card-selected": { 
          label: "Card Selecionado (Borda)", 
          description: "Cor da borda de cards selecionados",
          category: "Componentes"
        },
        "card-selected-bg": { 
          label: "Card Selecionado (Fundo)", 
          description: "Cor de fundo de cards selecionados",
          category: "Componentes"
        },
        primary: { 
          label: "Botões Primários", 
          description: "Cor principal dos botões e elementos de destaque",
          category: "Botões e Destaques"
        },
        "primary-foreground": { 
          label: "Texto em Botões Primários", 
          description: "Cor do texto sobre botões primários",
          category: "Botões e Destaques"
        },
        secondary: { 
          label: "Botões Secundários", 
          description: "Cor de fundo dos botões secundários",
          category: "Botões e Destaques"
        },
        "secondary-foreground": { 
          label: "Texto em Botões Secundários", 
          description: "Cor do texto sobre botões secundários",
          category: "Botões e Destaques"
        },
        accent: { 
          label: "Cor de Acento (Hover)", 
          description: "Cor usada em hover de botões outline e elementos interativos",
          category: "Botões e Destaques"
        },
        "accent-foreground": { 
          label: "Texto em Acento", 
          description: "Cor do texto sobre áreas com cor de acento",
          category: "Botões e Destaques"
        },
        lime: { 
          label: "Cor de Destaque (Lime)", 
          description: "Cor secundária de destaque e acentos",
          category: "Botões e Destaques"
        },
        "lime-foreground": { 
          label: "Texto em Lime", 
          description: "Cor do texto sobre elementos lime",
          category: "Botões e Destaques"
        },
        border: { 
          label: "Bordas", 
          description: "Cor padrão das bordas de elementos",
          category: "Componentes"
        },
        input: { 
          label: "Campos de Entrada", 
          description: "Cor de borda dos inputs e campos de texto",
          category: "Componentes"
        },
        ring: { 
          label: "Anel de Foco", 
          description: "Cor do anel de foco ao navegar com teclado",
          category: "Componentes"
        },
        "progress-bar": { 
          label: "Barra de Progresso", 
          description: "Cor da barra de progresso nas etapas",
          category: "Componentes"
        },
        muted: { 
          label: "Elementos Sutis", 
          description: "Cor de fundo de elementos menos importantes",
          category: "Componentes"
        },
        "muted-foreground": { 
          label: "Texto Secundário", 
          description: "Cor de textos menos importantes e descrições",
          category: "Textos"
        },
        popover: { 
          label: "Fundo de Popover", 
          description: "Cor de fundo de menus dropdown e popovers",
          category: "Fundos"
        },
        "popover-foreground": { 
          label: "Texto de Popover", 
          description: "Cor do texto em popovers",
          category: "Textos"
        },
        destructive: { 
          label: "Ações Destrutivas", 
          description: "Cor para botões de deletar e ações perigosas",
          category: "Botões e Destaques"
        },
        "destructive-foreground": { 
          label: "Texto em Destrutivo", 
          description: "Cor do texto sobre botões destrutivos",
          category: "Botões e Destaques"
        },
      };

      const colorsWithInfo = data.map((item) => ({
        key: item.setting_key,
        value: item.setting_value,
        label: colorLabels[item.setting_key]?.label || item.setting_key,
        description: colorLabels[item.setting_key]?.description || "",
        category: colorLabels[item.setting_key]?.category || "Outros",
      }));

      setThemeColors(colorsWithInfo);
    } catch (error) {
      console.error("Error loading theme colors:", error);
      toast.error("Erro ao carregar cores do tema");
    }
  };

  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v.replace("%", "")));
      const lightness = l / 100;
      const a = (s * Math.min(lightness, 1 - lightness)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    } catch {
      return "#000000";
    }
  };

  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return "0 0% 0%";
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setThemeColors((prev) =>
      prev.map((color) => (color.key === key ? { ...color, value } : color))
    );
  };

  const handleColorPickerChange = (key: string, hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    handleColorChange(key, hslValue);
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
    <>
      <Header />
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Painel Admin</h1>
            <p className="text-muted-foreground">Gerencie métricas e personalize o tema</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
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
                  Clique na cor para usar o seletor visual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {["Fundos", "Textos", "Botões e Destaques", "Componentes", "Outros"].map((category) => {
                  const categoryColors = themeColors.filter((c) => c.category === category);
                  if (categoryColors.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {categoryColors.map((color) => (
                          <div key={color.key} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <Label htmlFor={color.key} className="text-sm font-medium">
                                  {color.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">{color.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                id={color.key}
                                value={hslToHex(color.value)}
                                onChange={(e) => handleColorPickerChange(color.key, e.target.value)}
                                placeholder="#000000"
                                className="font-mono text-sm"
                              />
                              <input
                                type="color"
                                value={hslToHex(color.value)}
                                onChange={(e) => handleColorPickerChange(color.key, e.target.value)}
                                className="w-12 h-10 rounded border cursor-pointer shrink-0"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

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
    </>
  );
}
