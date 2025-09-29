
'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Music, CalendarDays } from 'lucide-react';
import { useListeningHistory, useListeningStats } from '@/hooks/useListeningHistory';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TrackListItem } from '@/components/likes/TrackListItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export function ListeningHistoryPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const { history, loading, pagination, fetchHistory, loadMore } = useListeningHistory();
  const { stats, loading: statsLoading, fetchStats } = useListeningStats();
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    fetchHistory({ timeRange, limit: 20 });
    fetchStats(timeRange);
  }, [fetchHistory, fetchStats, timeRange]);

  const handleTimeRangeChange = (newTimeRange: 'day' | 'week' | 'month' | 'year') => {
    setTimeRange(newTimeRange);
  };

  // Convert API track format to TrackListItem format
  const convertToListItemTrack = (track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.albumTitle,
    duration: track.duration,
    coverUrl: track.imageUrl
  });

  const handlePlayTrack = async (track: any) => {
    const trackList = history.map(entry => entry.track);
    await playTrack(track, trackList);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listening History</h1>
          <p className="text-muted-foreground">Track your music listening habits and discover patterns</p>
        </div>
        
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-20 h-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="w-16 h-8" />
                  </CardContent>
                </Card>
              ))
            ) : stats ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Total Plays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.overview.totalPlayEvents}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Listening Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatTime(stats.overview.totalListeningTimeMinutes)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Unique Tracks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.overview.uniqueTracks}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Avg Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatTime(stats.overview.averageSessionLength)}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Top Tracks */}
          <Card>
            <CardHeader>
              <CardTitle>Your Top Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="w-3/4 h-4" />
                        <Skeleton className="w-1/2 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.topTracks.length ? (
                <div className="space-y-2">
                  {stats.topTracks.slice(0, 10).map((track, index) => (
                    <div key={track.id} className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                        {track.imageUrl ? (
                          <Image src={track.imageUrl} alt={track.title} width={40} height={40} className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{track.playCount} plays</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(track.totalTimeMinutes)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No tracks played yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loading && history.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="w-20 h-3" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Listening History</h3>
              <p className="text-muted-foreground">
                Start listening to music to build your history.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.lastPlayed).toLocaleDateString()} at{' '}
                        {new Date(entry.lastPlayed).toLocaleTimeString()}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        {entry.playCount} plays • {formatTime(Math.round(entry.totalTime / 60))} total
                      </div>
                    </div>
                    
                    <TrackListItem
                      track={convertToListItemTrack(entry.track)}
                      onPlay={handlePlayTrack}
                      showIndex={false}
                      showDuration={true}
                      showAlbum={true}
                      className="border-0 shadow-none p-3 hover:bg-muted/50 rounded-lg transition-colors"
                    />
                  </div>
                ))}
              </div>

              {pagination.hasMore && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="w-32 h-6" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="w-3/4 h-4" />
                        <Skeleton className="w-1/2 h-3" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="w-32 h-6" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-full h-64" />
                </CardContent>
              </Card>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Artists */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Artists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topArtists.slice(0, 10).map((artist, index) => (
                      <div key={artist.id} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground w-6 text-center">
                          {index + 1}
                        </span>
                        <div className="w-10 h-10 bg-muted rounded-full overflow-hidden">
                          {artist.avatar ? (
                            <Image
                              src={artist.avatar}
                              alt={artist.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{artist.name}</p>
                          <p className="text-sm text-muted-foreground">{artist.playCount} plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Listening Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Listening Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.listeningActivity.map((day: any, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{day.play_count} plays</span>
                          <span>{formatDuration(day.total_duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
