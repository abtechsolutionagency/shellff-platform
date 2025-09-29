
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Shield, AlertTriangle, Activity, Lock } from 'lucide-react';
import { SecurityConfiguration } from './SecurityConfiguration';
import { FraudDetectionLogs } from './FraudDetectionLogs';

interface SecurityStats {
  overview: {
    totalFraudLogs: number;
    unresolvedFraudLogs: number;
    fraudDetectionRate: string;
    successRate: string;
    blockedIPs: number;
    deviceLockedCodes: number;
    ipLockedCodes: number;
  };
  trends: {
    last24h: number;
    last7d: number;
    last30d: number;
    fraudByDay: { [key: string]: number };
  };
  topFraudReasons: Array<{
    reason: string;
    count: number;
  }>;
  redemptionStats: {
    total: number;
    failed: number;
    successRate: string;
  };
  securityConfig: {
    deviceLockingEnabled: boolean;
    ipLockingEnabled: boolean;
    fraudDetectionEnabled: boolean;
  };
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/security/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch security dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Security dashboard error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStats}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage code redemption security</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Device Lock</span>
                <Badge variant={stats.securityConfig.deviceLockingEnabled ? "default" : "secondary"}>
                  {stats.securityConfig.deviceLockingEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">IP Lock</span>
                <Badge variant={stats.securityConfig.ipLockingEnabled ? "default" : "secondary"}>
                  {stats.securityConfig.ipLockingEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Fraud Detection</span>
                <Badge variant={stats.securityConfig.fraudDetectionEnabled ? "default" : "secondary"}>
                  {stats.securityConfig.fraudDetectionEnabled ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overview.unresolvedFraudLogs}
            </div>
            <p className="text-xs text-muted-foreground">
              of {stats.overview.totalFraudLogs} total
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.overview.fraudDetectionRate}% detection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Redemption Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.overview.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.redemptionStats.total} total attempts
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.redemptionStats.failed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Locked Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs">Device Locked</span>
                <span className="text-sm font-semibold">{stats.overview.deviceLockedCodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">IP Locked</span>
                <span className="text-sm font-semibold">{stats.overview.ipLockedCodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Blocked IPs</span>
                <span className="text-sm font-semibold">{stats.overview.blockedIPs}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Detection Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.trends.last24h}</div>
              <p className="text-sm text-muted-foreground">Last 24 hours</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.trends.last7d}</div>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.trends.last30d}</div>
              <p className="text-sm text-muted-foreground">Last 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Fraud Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Top Fraud Detection Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topFraudReasons.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No fraud detection logs found
              </p>
            ) : (
              stats.topFraudReasons.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded border">
                  <span className="text-sm">{item.reason}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Configuration and Logs */}
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration">Security Configuration</TabsTrigger>
          <TabsTrigger value="logs">Fraud Detection Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="space-y-4">
          <SecurityConfiguration onConfigUpdate={fetchStats} />
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <FraudDetectionLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
