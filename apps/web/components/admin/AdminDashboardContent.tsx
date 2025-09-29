
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DiscountManagement from '@/components/admin/DiscountManagement';
import CodeSystemDashboard from '@/components/admin/CodeSystemDashboard';
import RevenueReports from '@/components/admin/RevenueReports';
import CodeManagement from '@/components/admin/CodeManagement';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { 
  Settings, 
  TrendingUp, 
  Users, 
  Music, 
  CreditCard,
  Percent,
  BarChart3,
  Shield,
  Package,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Add top padding to account for the fixed header */}
      <div className="pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 w-fit">
                Beta
              </Badge>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Platform administration and management tools
            </p>
          </div>

          {/* Quick Stats - Mobile Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  +- from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Active Discounts</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  System default rules
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">$-</div>
                <p className="text-xs text-muted-foreground">
                  +- from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Releases</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Total on platform
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Responsive Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile-friendly tabs list */}
            <div className="mb-6">
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 xl:inline-flex h-auto p-1 bg-zinc-900/50">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="code-system" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <Package className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Code System</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="revenue" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Revenue</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="code-management" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <Shield className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Codes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="discounts" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <Percent className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Discounts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Payments</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-2"
                >
                  <Settings className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Platform Activity</CardTitle>
                    <CardDescription className="text-sm">Recent platform statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New Users (24h)</span>
                        <Badge variant="outline" className="text-xs">-</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Code Purchases (24h)</span>
                        <Badge variant="outline" className="text-xs">-</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Streams</span>
                        <Badge variant="outline" className="text-xs">-</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Revenue (24h)</span>
                        <Badge variant="outline" className="text-xs">$-</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">System Health</CardTitle>
                    <CardDescription className="text-sm">Platform operational status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Database</span>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment Processing</span>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                          Operational
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">File Storage</span>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                          Available
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Status</span>
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                          Online
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Recent Administrative Actions</CardTitle>
                  <CardDescription className="text-sm">Track recent admin activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
                    No recent administrative actions recorded.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code-system">
              <CodeSystemDashboard />
            </TabsContent>

            <TabsContent value="revenue">
              <RevenueReports />
            </TabsContent>

            <TabsContent value="code-management">
              <CodeManagement />
            </TabsContent>

            <TabsContent value="discounts">
              <DiscountManagement />
            </TabsContent>

            <TabsContent value="security">
              <SecurityDashboard />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Payment Method Configuration</CardTitle>
                  <CardDescription className="text-sm">
                    Manage payment methods and their base discount rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
                    Payment method management interface coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">System Configuration</CardTitle>
                  <CardDescription className="text-sm">
                    Global platform settings and configurations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm md:text-base">Discount System</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm">Status</span>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                              Active
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm md:text-base">Code Generation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm">Status</span>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                              Available
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="border-t border-zinc-700 pt-4">
                      <h4 className="font-medium mb-2 text-sm md:text-base">Quick Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={() => console.log('Clear Cache clicked')}
                        >
                          Clear Cache
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={() => console.log('Sync Database clicked')}
                        >
                          Sync Database
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs md:text-sm"
                          onClick={() => console.log('Generate Report clicked')}
                        >
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add bottom padding for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </div>
    </div>
  );
}
