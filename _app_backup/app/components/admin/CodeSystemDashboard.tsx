
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp,
  Activity,
  FileText,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CodeSystemStats {
  totalCodes: number;
  totalRedeemed: number;
  totalRevenue: number;
  activeCreators: number;
  monthlyGrowth: {
    codes: number;
    revenue: number;
    redemptions: number;
  };
  recentActivity: Array<{
    date: string;
    codesGenerated: number;
    codesRedeemed: number;
    revenue: number;
  }>;
  redemptionsByStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  topCreators: Array<{
    id: string;
    name: string;
    codesGenerated: number;
    revenue: number;
  }>;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function CodeSystemDashboard() {
  const [stats, setStats] = useState<CodeSystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/code-system/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <Shield className="h-5 w-5" />
            <span>Error loading dashboard: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-US').format(num);

  const redemptionRate = stats.totalCodes > 0 
    ? ((stats.totalRedeemed / stats.totalCodes) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes Generated</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalCodes)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`${stats.monthlyGrowth.codes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.monthlyGrowth.codes >= 0 ? '+' : ''}{stats.monthlyGrowth.codes}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redemptionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.totalRedeemed)} of {formatNumber(stats.totalCodes)} redeemed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`${stats.monthlyGrowth.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.monthlyGrowth.revenue >= 0 ? '+' : ''}{stats.monthlyGrowth.revenue}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.activeCreators)}</div>
            <p className="text-xs text-muted-foreground">
              Using code generation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activity Timeline (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="codesGenerated" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Codes Generated"
                />
                <Line 
                  type="monotone" 
                  dataKey="codesRedeemed" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Codes Redeemed"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Redemption Status Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Code Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.redemptionsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {stats.redemptionsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Creators */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Creators by Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topCreators.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No creator data available
              </div>
            ) : (
              stats.topCreators.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(creator.codesGenerated)} codes generated
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(creator.revenue)}</div>
                    <div className="text-sm text-muted-foreground">revenue</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
