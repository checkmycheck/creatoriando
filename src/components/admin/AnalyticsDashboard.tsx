import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sparkles, TrendingUp, Star } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PopularCharacters } from "./PopularCharacters";
import { CharacteristicsAnalytics } from "./CharacteristicsAnalytics";

interface AnalyticsData {
  totalUsers: number;
  totalCharacters: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  charactersThisMonth: number;
  charactersLastMonth: number;
  growthRate: number;
}

interface CharacterStats {
  gender: string;
  count: number;
}

interface GrowthData {
  date: string;
  characters: number;
  users: number;
}

const COLORS = ['hsl(var(--lime))', 'hsl(var(--primary))', 'hsl(var(--secondary))'];

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalCharacters: 0,
    freeUsers: 0,
    proUsers: 0,
    enterpriseUsers: 0,
    charactersThisMonth: 0,
    charactersLastMonth: 0,
    growthRate: 0,
  });
  const [characterStats, setCharacterStats] = useState<CharacterStats[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total characters
      const { count: totalCharacters } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true });

      // Users by plan
      const { data: planData } = await supabase
        .from("profiles")
        .select("subscription_plan");

      const freeUsers = planData?.filter(p => p.subscription_plan === "free").length || 0;
      const proUsers = planData?.filter(p => p.subscription_plan === "pro").length || 0;
      const enterpriseUsers = planData?.filter(p => p.subscription_plan === "enterprise").length || 0;

      // Characters this month
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);

      const { count: charactersThisMonth } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonthStart.toISOString());

      // Characters last month
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      lastMonthStart.setHours(0, 0, 0, 0);

      const lastMonthEnd = new Date(thisMonthStart);
      lastMonthEnd.setMilliseconds(-1);

      const { count: charactersLastMonth } = await supabase
        .from("characters")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Calculate growth rate
      const growthRate = charactersLastMonth
        ? ((charactersThisMonth! - charactersLastMonth) / charactersLastMonth) * 100
        : 0;

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalCharacters: totalCharacters || 0,
        freeUsers,
        proUsers,
        enterpriseUsers,
        charactersThisMonth: charactersThisMonth || 0,
        charactersLastMonth: charactersLastMonth || 0,
        growthRate,
      });

      // Character stats by gender
      const { data: genderData } = await supabase
        .from("characters")
        .select("gender");

      const genderStats: { [key: string]: number } = {};
      genderData?.forEach(char => {
        if (char.gender) {
          genderStats[char.gender] = (genderStats[char.gender] || 0) + 1;
        }
      });

      setCharacterStats(
        Object.entries(genderStats).map(([gender, count]) => ({ gender, count }))
      );

      // Growth data (last 7 days)
      const growthDataPoints: GrowthData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const { count: dayCharacters } = await supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString());

        const { count: dayUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", date.toISOString())
          .lt("created_at", nextDay.toISOString());

        growthDataPoints.push({
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          characters: dayCharacters || 0,
          users: dayUsers || 0,
        });
      }

      setGrowthData(growthDataPoints);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-muted-foreground">Carregando analytics...</div>
      </div>
    );
  }

  const planDistribution = [
    { name: "Free", value: analytics.freeUsers },
    { name: "Pro", value: analytics.proUsers },
    { name: "Enterprise", value: analytics.enterpriseUsers },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.freeUsers} free · {analytics.proUsers} pro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Personagens</CardTitle>
            <Sparkles className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCharacters}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.charactersThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.growthRate > 0 ? "+" : ""}
              {analytics.growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. mês anterior ({analytics.charactersLastMonth})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalUsers > 0
                ? (analytics.totalCharacters / analytics.totalUsers).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              personagens/usuário
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento (Últimos 7 dias)</CardTitle>
            <CardDescription>Novos personagens e usuários por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="characters"
                  stroke="hsl(var(--lime))"
                  name="Personagens"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  name="Usuários"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Planos</CardTitle>
            <CardDescription>Usuários por tipo de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
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
      </div>

      {/* Character Stats */}
      {characterStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personagens por Gênero</CardTitle>
            <CardDescription>Distribuição de personagens criados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={characterStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="gender" stroke="hsl(var(--muted-foreground))" />
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

      {/* Popular Characters */}
      <PopularCharacters />

      {/* Characteristics Analytics */}
      <CharacteristicsAnalytics />
    </div>
  );
};
