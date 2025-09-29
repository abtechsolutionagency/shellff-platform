
'use client';

import { useState } from 'react';
import { usePersonalLibrary } from '@/contexts/PersonalLibraryContext';
import { Sparkles, TrendingUp, Heart, RefreshCw, Play, Shuffle, User, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LibraryTrackCard } from './LibraryTrackCard';

interface RecommendationCategoryProps {
  title: string;
  description: string;
  icon: React.ElementType;
  tracks: any[];
  color: string;
  onPlayAll: () => void;
  onShuffle: () => void;
}

function RecommendationCategory({ 
  title, 
  description, 
  icon: Icon, 
  tracks, 
  color,
  onPlayAll,
  onShuffle 
}: RecommendationCategoryProps) {
  return (
    <Card className="bg-shellff-accent border-shellff-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white font-poppins flex items-center">
              <Icon className={`h-5 w-5 mr-2 ${color}`} />
              {title}
            </CardTitle>
            <CardDescription className="text-shellff-neutral font-inter">
              {description}
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onShuffle}
              className="border-shellff-accent text-shellff-neutral hover:text-white"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
            <Button 
              size="sm" 
              onClick={onPlayAll}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Play All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tracks.slice(0, 5).map((track, index) => (
            <LibraryTrackCard 
              key={track.id} 
              track={track}
              index={index}
              showStats={false}
            />
          ))}
        </div>
        
        {tracks.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" className="text-shellff-neutral hover:text-white">
              View all {tracks.length} tracks
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationsPanel() {
  const { library, refreshRecommendations } = usePersonalLibrary();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('foryou');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRecommendations();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePlayAll = (tracks: any[]) => {
    console.log('Playing all tracks:', tracks.length);
    // TODO: Implement play all functionality
  };

  const handleShuffle = (tracks: any[]) => {
    console.log('Shuffling tracks:', tracks.length);
    // TODO: Implement shuffle functionality
  };

  // Mock different recommendation categories
  const forYouTracks = library.recommendations.slice(0, 8);
  const trendingTracks = library.recommendations.slice(2, 10);
  const basedOnLikes = library.recommendations.slice(1, 9);
  const newReleases = library.recommendations.slice(3, 11);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-poppins flex items-center">
            <Sparkles className="h-6 w-6 mr-3 text-primary" />
            Discover Music
          </h2>
          <p className="text-shellff-neutral font-inter mt-1">
            Personalized recommendations based on your listening habits
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-shellff-accent text-shellff-neutral hover:text-white hover:border-primary"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Discovery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  {library.recommendations.length}
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  New Recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  85%
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  Match Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  12
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  Tracks Discovered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-shellff-accent">
          <TabsTrigger 
            value="foryou"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            For You
          </TabsTrigger>
          <TabsTrigger 
            value="trending"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger 
            value="based"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            Based on Likes
          </TabsTrigger>
          <TabsTrigger 
            value="new"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            New Releases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="foryou" className="space-y-6">
          <RecommendationCategory
            title="Made for You"
            description="Curated picks based on your unique taste profile"
            icon={User}
            tracks={forYouTracks}
            color="text-primary"
            onPlayAll={() => handlePlayAll(forYouTracks)}
            onShuffle={() => handleShuffle(forYouTracks)}
          />
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <RecommendationCategory
            title="Trending Now"
            description="Popular tracks that are making waves right now"
            icon={TrendingUp}
            tracks={trendingTracks}
            color="text-secondary"
            onPlayAll={() => handlePlayAll(trendingTracks)}
            onShuffle={() => handleShuffle(trendingTracks)}
          />
        </TabsContent>

        <TabsContent value="based" className="space-y-6">
          <RecommendationCategory
            title="Because You Liked"
            description="More tracks similar to your favorites"
            icon={Heart}
            tracks={basedOnLikes}
            color="text-red-400"
            onPlayAll={() => handlePlayAll(basedOnLikes)}
            onShuffle={() => handleShuffle(basedOnLikes)}
          />
        </TabsContent>

        <TabsContent value="new" className="space-y-6">
          <RecommendationCategory
            title="Fresh Releases"
            description="Brand new tracks from artists you might love"
            icon={Clock}
            tracks={newReleases}
            color="text-green-400"
            onPlayAll={() => handlePlayAll(newReleases)}
            onShuffle={() => handleShuffle(newReleases)}
          />
        </TabsContent>
      </Tabs>

      {/* Discovery Tips */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-poppins text-lg mb-2">
                Improve Your Recommendations
              </h3>
              <p className="text-shellff-neutral font-inter mb-4">
                The more you listen and interact with tracks, the better we get at finding music you'll love. 
                Like tracks, create playlists, and explore different genres to enhance your discovery experience.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/50 text-primary">
                  Like more tracks
                </Badge>
                <Badge variant="outline" className="border-secondary/50 text-secondary">
                  Listen to full songs
                </Badge>
                <Badge variant="outline" className="border-green-400/50 text-green-400">
                  Explore new genres
                </Badge>
                <Badge variant="outline" className="border-orange-400/50 text-orange-400">
                  Create playlists
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
