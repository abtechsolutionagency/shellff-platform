

"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Music, Clock, Calendar, DollarSign, Users, Eye, Play } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Release {
  id: string;
  title: string;
  releaseType: 'SINGLE' | 'ALBUM' | 'EP';
  status: 'DRAFT' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'REJECTED';
  coverArt?: string;
  publishingFee: number;
  publishingFeeStatus: string;
  totalTracks: number;
  totalDuration: number;
  createdAt: string;
  publishedAt?: string;
  releaseTracks: Array<{
    id: string;
    title: string;
    duration: number;
    trackNumber: number;
  }>;
  royaltySplits: Array<{
    id: string;
    percentage: number;
    user: {
      id: string;
      username: string;
      sciId?: string;
    };
  }>;
}

export function CreatorReleasesContent() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/releases?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      
      const data = await response.json();
      setReleases(data.releases);
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (error) {
      console.error('Fetch releases error:', error);
      toast.error('Failed to load releases');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      <main className="md:ml-60 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold font-poppins bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              My Releases
            </h1>
            <p className="text-xl text-gray-300 font-inter">
              Manage your music catalog and track performance
            </p>
          </div>
          
          <Button
            asChild
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3"
          >
            <Link href="/creator/upload">
              <Plus className="w-5 h-5 mr-2" />
              New Release
            </Link>
          </Button>
        </div>

        {/* Releases List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-300 font-inter">Loading releases...</p>
            </div>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 font-poppins">
              No releases yet
            </h2>
            <p className="text-gray-400 mb-8 font-inter max-w-md mx-auto">
              Start sharing your music with the world. Upload your first single, EP, or album.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3"
            >
              <Link href="/creator/upload">
                <Plus className="w-5 h-5 mr-2" />
                Upload Your First Release
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {releases.map((release) => (
              <Card key={release.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white font-poppins text-lg mb-2 truncate">
                        {release.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(release.status)}
                        <Badge variant="outline" className="text-xs">
                          {release.releaseType}
                        </Badge>
                      </div>
                    </div>
                    {release.coverArt && (
                      <div className="w-16 h-16 bg-gray-900/50 rounded-lg overflow-hidden ml-4">
                        <img
                          src={release.coverArt}
                          alt={`${release.title} cover`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Music className="w-4 h-4" />
                      <span>{release.totalTracks} track{release.totalTracks !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(release.totalDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(release.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span>${release.publishingFee}</span>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {release.royaltySplits.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{release.royaltySplits.length} collaborator{release.royaltySplits.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      asChild
                    >
                      <Link href={`/creator/releases/${release.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    
                    {release.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-600 text-green-400 hover:bg-green-500/20"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

