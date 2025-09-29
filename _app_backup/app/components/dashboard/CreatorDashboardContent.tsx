
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Music, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Play, 
  Calendar,
  Clock,
  Plus,
  BarChart3,
  Eye
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Release {
  id: string;
  title: string;
  releaseType: 'SINGLE' | 'ALBUM' | 'EP';
  status: 'DRAFT' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'REJECTED';
  coverArt?: string;
  totalTracks: number;
  createdAt: string;
}

interface Stats {
  totalReleases: number;
  publishedReleases: number;
  totalStreams: number;
  totalRevenue: number;
  monthlyStreams: number;
  monthlyRevenue: number;
}

export function CreatorDashboardContent() {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [recentReleases, setRecentReleases] = useState<Release[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReleases: 0,
    publishedReleases: 0,
    totalStreams: 0,
    totalRevenue: 0,
    monthlyStreams: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent releases
      const releasesResponse = await fetch('/api/creator/releases?limit=3');
      if (releasesResponse.ok) {
        const releasesData = await releasesResponse.json();
        setRecentReleases(releasesData.releases || []);
      }

      // Fetch stats (in a real app, this would be a separate API)
      const statsResponse = await fetch('/api/creator/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PROCESSING: { variant: 'default', label: 'Processing' },
      PUBLISHED: { variant: 'default', label: 'Published' },
      FAILED: { variant: 'destructive', label: 'Failed' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
    };

    const config = variants[status] || variants.DRAFT;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  if (!mounted || !session?.user) return null;

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      <main className="md:ml-60 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-poppins mb-2">
            Creator Dashboard
          </h1>
          <p className="text-gray-400 font-inter">
            Welcome back, {(session.user as any)?.firstName || session.user.name}! Track your music's performance and manage your releases.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 hover:from-purple-700 hover:to-pink-700 transition-all cursor-pointer">
            <Link href="/creator/upload" className="block">
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 text-white mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white font-poppins mb-1">
                  Upload Music
                </h3>
                <p className="text-purple-100 text-sm font-inter">
                  Share your latest tracks
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
            <Link href="/creator/releases" className="block">
              <CardContent className="p-6 text-center">
                <Music className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white font-poppins mb-1">
                  My Releases
                </h3>
                <p className="text-gray-400 text-sm font-inter">
                  Manage your catalog
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white font-poppins mb-1">
                Analytics
              </h3>
              <p className="text-gray-400 text-sm font-inter">
                Track performance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
            <Link href="/wallet" className="block">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white font-poppins mb-1">
                  Earnings
                </h3>
                <p className="text-gray-400 text-sm font-inter">
                  View your revenue
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 font-poppins mb-1">
                {stats.totalReleases}
              </div>
              <p className="text-gray-400 text-sm font-inter">Total Releases</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 font-poppins mb-1">
                {stats.publishedReleases}
              </div>
              <p className="text-gray-400 text-sm font-inter">Published</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 font-poppins mb-1">
                {stats.monthlyStreams.toLocaleString()}
              </div>
              <p className="text-gray-400 text-sm font-inter">Monthly Streams</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 font-poppins mb-1">
                ${stats.monthlyRevenue.toFixed(2)}
              </div>
              <p className="text-gray-400 text-sm font-inter">Monthly Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Releases */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-poppins flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Recent Releases
              </CardTitle>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                asChild
              >
                <Link href="/creator/releases">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-400 font-inter">Loading releases...</p>
              </div>
            ) : recentReleases.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white font-poppins mb-2">
                  No releases yet
                </h3>
                <p className="text-gray-400 font-inter mb-6">
                  Start by uploading your first track
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                  asChild
                >
                  <Link href="/creator/upload">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Now
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReleases.map((release) => (
                  <div key={release.id} className="flex items-center gap-4 p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
                    {release.coverArt ? (
                      <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden">
                        <img
                          src={release.coverArt}
                          alt={`${release.title} cover`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate font-poppins">
                        {release.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(release.status)}
                        <Badge variant="outline" className="text-xs">
                          {release.releaseType}
                        </Badge>
                        <span className="text-gray-400 text-sm font-inter">
                          {release.totalTracks} track{release.totalTracks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm font-inter flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(release.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        asChild
                      >
                        <Link href={`/creator/releases/${release.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      
                      {release.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-400 hover:bg-green-500/20"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
