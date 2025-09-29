
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Download, 
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  networkBreakdown: Array<{
    network: string;
    amount: number;
    transactions: number;
    color: string;
  }>;
  creatorRevenue: Array<{
    creatorId: string;
    creatorName: string;
    totalSpent: number;
    transactionCount: number;
    averageOrderValue: number;
  }>;
  revenueGrowth: {
    currentMonth: number;
    previousMonth: number;
    growthPercentage: number;
  };
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RevenueReports() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [exporting, setExporting] = useState(false);

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/revenue/code-sales?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      const data = (await response.json()) as RevenueData;
      setRevenueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    void fetchRevenueData();
  }, [fetchRevenueData]);

  const exportReport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/admin/revenue/export?timeRange=${timeRange}&format=csv`);
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `revenue-report-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-US').format(num);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-700 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
            <FileText className="h-5 w-5" />
            <span>Error loading revenue data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!revenueData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Revenue Reports</h2>
          <p className="text-muted-foreground">Track code generation revenue and payment analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportReport} 
            disabled={exporting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From code generation sales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={`${revenueData.revenueGrowth.growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {revenueData.revenueGrowth.growthPercentage >= 0 ? '+' : ''}{revenueData.revenueGrowth.growthPercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              vs {formatCurrency(revenueData.revenueGrowth.previousMonth)} last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.creatorRevenue.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated codes this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
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
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={revenueData.paymentMethodBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ method, percentage }) => `${method}: ${percentage}%`}
                >
                  {revenueData.paymentMethodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color ?? COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Network Breakdown (if crypto payments exist) */}
      {revenueData.networkBreakdown.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Crypto Network Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {revenueData.networkBreakdown.map((network) => (
                <div key={network.network} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{network.network}</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: network.color }}
                    />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {formatCurrency(network.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(network.transactions)} transactions
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Creators by Revenue */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Creators by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.creatorRevenue.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No creator revenue data available
              </div>
            ) : (
              revenueData.creatorRevenue.slice(0, 10).map((creator, index) => (
                <div key={creator.creatorId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{creator.creatorName}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(creator.transactionCount)} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(creator.totalSpent)}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(creator.averageOrderValue)}
                    </div>
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






