import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Video, Activity, TrendingUp, Palette, Home, BarChart3, Search, Package, Layout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { UsersList } from "@/components/admin/UsersList";
import { CreditPackagesManager } from "@/components/admin/CreditPackagesManager";
import { LandingPageCMS } from "@/components/admin/LandingPageCMS";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const [loadingStats, setLoadingStats] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadThemeColors();
      loadUsers();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Paralelizar todas as queries principais
      const [usersResult, charactersResult, activeUsersResult, allProfilesResult, allCharactersResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("characters").select("*", { count: "exact", head: true }),
        supabase.from("characters").select("user_id").gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("profiles").select("created_at"),
        supabase.from("characters").select("created_at"),
      ]);

      const uniqueActiveUsers = new Set(activeUsersResult.data?.map((c) => c.user_id) || []);

      // Processar dados do gráfico localmente
      const chartDataTemp: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dailyUsers = allProfilesResult.data?.filter(
          (p) => new Date(p.created_at!) <= nextDate
        ).length || 0;

        const dailyCharacters = allCharactersResult.data?.filter(
          (c) => new Date(c.created_at!) <= nextDate
        ).length || 0;

        chartDataTemp.push({
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          usuarios: dailyUsers,
          personagens: dailyCharacters,
        });
      }

      setStats({
        totalUsers: usersResult.count || 0,
        totalCharacters: charactersResult.count || 0,
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

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, subscription_plan, credits, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
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
        sidebar: { 
          label: "Fundo do Menu Lateral", 
          description: "Cor de fundo do sidebar de navegação",
          category: "Menu Lateral (Sidebar)"
        },
        "sidebar-foreground": { 
          label: "Texto do Menu Lateral", 
          description: "Cor do texto e ícones dentro do sidebar",
          category: "Menu Lateral (Sidebar)"
        },
        "sidebar-border": { 
          label: "Borda do Menu Lateral", 
          description: "Cor da borda do sidebar",
          category: "Menu Lateral (Sidebar)"
        },
        "sidebar-opacity": { 
          label: "Opacidade do Menu Lateral", 
          description: "Transparência do sidebar (0-100%)",
          category: "Menu Lateral (Sidebar)"
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

  const handleColorChange = async (key: string, value: string) => {
    // Update UI immediately
    setThemeColors((prev) =>
      prev.map((color) => (color.key === key ? { ...color, value } : color))
    );

    // Apply color immediately to document
    document.documentElement.style.setProperty(`--${key}`, value);

    // Clear existing timeout for this key
    if (saveTimeoutRef.current[key]) {
      clearTimeout(saveTimeoutRef.current[key]);
    }

    // Debounce the database save
    saveTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("theme_settings")
          .update({ setting_value: value })
          .eq("setting_key", key);

        if (error) throw error;
      } catch (error) {
        console.error("Error auto-saving theme:", error);
        toast.error("Erro ao salvar cor automaticamente");
      }
    }, 500); // Wait 500ms after user stops typing
  };

  const handleColorPickerChange = (key: string, hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    handleColorChange(key, hslValue);
  };

  if (adminLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Painel Admin</h1>
            <p className="text-muted-foreground">Gerencie métricas, analytics e personalize o tema</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-6">
            <TabsTrigger value="metrics">
              <Activity className="w-4 h-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="packages">
              <Package className="w-4 h-4 mr-2" />
              Pacotes
            </TabsTrigger>
            <TabsTrigger value="landing">
              <Layout className="w-4 h-4 mr-2" />
              Landing Page
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="w-4 h-4 mr-2" />
              Tema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            {loadingStats ? (
              <>
                <div className="grid gap-6 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-9 w-20 mb-1" />
                        <Skeleton className="h-3 w-28" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <Skeleton className="w-full h-full" />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os usuários da plataforma. Clique em um usuário para ver detalhes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por email ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os planos</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingUsers ? (
                    <LoadingSpinner />
                  ) : (
                    <UsersList 
                      users={users.filter((user) => {
                        const matchesSearch = searchTerm === "" || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
                        const matchesPlan = planFilter === "all" || user.subscription_plan === planFilter;
                        return matchesSearch && matchesPlan;
                      })} 
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6 mt-6">
            <CreditPackagesManager />
          </TabsContent>

          <TabsContent value="landing" className="space-y-6 mt-6">
            <LandingPageCMS />
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cores</CardTitle>
                <CardDescription>
                  Personalize as cores do tema. As mudanças são aplicadas automaticamente.
                  Clique na cor para usar o seletor visual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {["Menu Lateral (Sidebar)", "Fundos", "Textos", "Botões e Destaques", "Componentes", "Outros"].map((category) => {
                  const categoryColors = themeColors.filter((c) => c.category === category);
                  if (categoryColors.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {categoryColors.map((color) => {
                          // Special handling for opacity
                          if (color.key === 'sidebar-opacity') {
                            return (
                              <div key={color.key} className="space-y-3 md:col-span-2">
                                <div className="space-y-1">
                                  <Label htmlFor={color.key} className="text-sm font-medium">
                                    {color.label}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">{color.description}</p>
                                </div>
                                <div className="flex gap-4 items-center">
                                  <Slider
                                    id={color.key}
                                    value={[parseInt(color.value) || 100]}
                                    onValueChange={(values) => handleColorChange(color.key, values[0].toString())}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                  />
                                  <Input
                                    value={color.value}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                      handleColorChange(color.key, val.toString());
                                    }}
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="w-20 text-sm"
                                  />
                                  <span className="text-sm text-muted-foreground shrink-0">%</span>
                                </div>
                              </div>
                            );
                          }

                          // Regular color inputs
                          return (
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
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
