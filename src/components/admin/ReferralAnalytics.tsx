import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Gift, TrendingUp } from "lucide-react";

interface ReferralStats {
  totalSuccessfulReferrals: number;
  totalReferralCodes: number;
  topCodes: { code: string; uses: number; referrerEmail: string }[];
  conversionRate: number;
}

export function ReferralAnalytics() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      // Get total successful referrals
      const { count: successfulReferrals } = await supabase
        .from('referral_uses')
        .select('*', { count: 'exact', head: true });

      // Get total referral codes
      const { count: totalCodes } = await supabase
        .from('referral_codes')
        .select('*', { count: 'exact', head: true });

      // Get top referral codes with user emails
      const { data: topCodes } = await supabase
        .from('referral_codes')
        .select(`
          code,
          uses,
          user_id,
          profiles!referral_codes_user_id_fkey (email)
        `)
        .order('uses', { ascending: false })
        .limit(5);

      // Get total users for conversion rate calculation
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const topCodesFormatted = topCodes?.map(code => ({
        code: code.code,
        uses: code.uses,
        referrerEmail: (code.profiles as any)?.email || 'Unknown'
      })) || [];

      const conversionRate = totalUsers && successfulReferrals 
        ? (successfulReferrals / totalUsers) * 100 
        : 0;

      setStats({
        totalSuccessfulReferrals: successfulReferrals || 0,
        totalReferralCodes: totalCodes || 0,
        topCodes: topCodesFormatted,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-3/4 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const topCodesData = stats.topCodes.map(code => ({
    name: code.code,
    value: code.uses,
    email: code.referrerEmail
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--lime))'];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicações Bem-Sucedidas</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuccessfulReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários que entraram via indicação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferralCodes}</div>
            <p className="text-xs text-muted-foreground">
              Total de códigos de indicação criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Usuários que entraram via indicação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Códigos Mais Usados</CardTitle>
            <CardDescription>Códigos de indicação com mais conversões</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topCodesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCodesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value} usos`,
                      props.payload.email
                    ]}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum código usado ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Uso</CardTitle>
            <CardDescription>Proporção de uso entre os códigos</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topCodesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCodesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {topCodesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: any, name: any, props: any) => [
                      `${value} usos`,
                      props.payload.email
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum código usado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
