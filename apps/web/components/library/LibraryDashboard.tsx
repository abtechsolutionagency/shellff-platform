
'use client';

import { useState } from 'react';
import { usePersonalLibrary } from '@/contexts/PersonalLibraryContext';
import { Heart, Clock, List, TrendingUp, Shuffle, Play, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LibraryTrackCard } from './LibraryTrackCard';
import { PlaylistManager } from './PlaylistManager';
import { ListeningHistory } from './ListeningHistory';
import { RecommendationsPanel } from './RecommendationsPanel';

export function LibraryDashboard() {
  const { library, isLoading, syncLibrary, refreshRecommendations } = usePersonalLibrary();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        syncLibrary(),
        refreshRecommendations()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatShc = (amount: number) => {
    return `${amount.toFixed(2)} SHC`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-shellff-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-shellff-neutral font-inter">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shellff-dark p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white font-poppins mb-2">
              Your Library
            </h1>
            <p className="text-shellff-neutral font-inter">
              Your personal music collection and listening insights
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-shellff-accent text-shellff-neutral hover:text-white hover:border-primary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                library.syncStatus === 'synced' ? 'bg-green-400' :
                library.syncStatus === 'syncing' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <span className="text-xs text-shellff-neutral capitalize font-inter">
                {library.syncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-shellff-accent border-shellff-accent glow-purple">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-poppins">
                    {library.likedTracks.length}
                  </h3>
                  <p className="text-shellff-neutral font-inter text-sm">
                    Liked Tracks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-shellff-accent border-shellff-accent glow-teal">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <List className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-poppins">
                    {library.personalPlaylists.length}
                  </h3>
                  <p className="text-shellff-neutral font-inter text-sm">
                    Playlists
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-shellff-accent border-shellff-accent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-poppins">
                    {formatDuration(library.totalListeningTime)}
                  </h3>
                  <p className="text-shellff-neutral font-inter text-sm">
                    Total Time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-shellff-accent border-shellff-accent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-poppins">
                    {formatShc(library.totalShcEarned)}
                  </h3>
                  <p className="text-shellff-neutral font-inter text-sm">
                    Earned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-shellff-accent">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="likes"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
            >
              Likes
            </TabsTrigger>
            <TabsTrigger 
              value="playlists"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
            >
              Playlists
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
            >
              History
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations"
              className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
            >
              For You
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Plays */}
              <Card className="bg-shellff-accent border-shellff-accent">
                <CardHeader>
                  <CardTitle className="text-white font-poppins flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Recent Plays
                  </CardTitle>
                  <CardDescription className="text-shellff-neutral font-inter">
                    Your latest listening activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {library.recentPlays.slice(0, 5).map((track, index) => (
                      <div key={track.id} className="flex items-center space-x-3 p-3 rounded-lg bg-shellff-dark/50 hover:bg-shellff-dark/70 transition-colors">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-poppins text-primary font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-poppins font-medium truncate">
                            {track.title}
                          </p>
                          <p className="text-shellff-neutral font-inter text-sm truncate">
                            {track.artist}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-shellff-accent border-shellff-accent">
                <CardHeader>
                  <CardTitle className="text-white font-poppins flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-secondary" />
                    Quick Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-shellff-dark/50">
                    <span className="text-shellff-neutral font-inter">Sessions Today</span>
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                      {library.listeningHistory.filter(s => 
                        new Date(s.startTime).toDateString() === new Date().toDateString()
                      ).length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-shellff-dark/50">
                    <span className="text-shellff-neutral font-inter">Favorite Genre</span>
                    <Badge variant="outline" className="border-shellff-neutral text-shellff-neutral">
                      Electronic
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-shellff-dark/50">
                    <span className="text-shellff-neutral font-inter">Streak</span>
                    <Badge variant="outline" className="border-orange-400 text-orange-400">
                      7 days
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-shellff-dark/50">
                    <span className="text-shellff-neutral font-inter">Discovery Score</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      85%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="likes">
            <Card className="bg-shellff-accent border-shellff-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white font-poppins flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-primary" />
                      Liked Tracks ({library.likedTracks.length})
                    </CardTitle>
                    <CardDescription className="text-shellff-neutral font-inter">
                      Your favorite tracks from Shellff
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-shellff-accent text-shellff-neutral">
                      <Shuffle className="h-4 w-4 mr-2" />
                      Shuffle
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Play className="h-4 w-4 mr-2" />
                      Play All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {library.likedTracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-shellff-neutral mx-auto mb-4" />
                    <h3 className="text-white font-poppins text-lg mb-2">No liked tracks yet</h3>
                    <p className="text-shellff-neutral font-inter mb-4">
                      Start exploring and like your favorite tracks!
                    </p>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                      Explore Music
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {library.likedTracks.map((track) => (
                      <LibraryTrackCard key={track.id} track={track} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playlists">
            <PlaylistManager />
          </TabsContent>

          <TabsContent value="history">
            <ListeningHistory />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
