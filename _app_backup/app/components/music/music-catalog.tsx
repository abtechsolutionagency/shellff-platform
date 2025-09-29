
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Play, Heart, Clock, Music, Shuffle, ListPlus } from "lucide-react";
import { TrackCard } from "./TrackCard";
import { AlbumCard } from "./album-card";
import { ArtistCard } from "./artist-card";
import { SearchFilters } from "./search-filters";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Track {
  id: string;
  title: string;
  duration: number;
  explicit: boolean;
  price?: number;
  playCount: number;
  likeCount: number;
  artist: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  album?: {
    id: string;
    title: string;
    coverArt?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

interface Album {
  id: string;
  title: string;
  coverArt?: string;
  releaseDate?: string;
  albumType: string;
  trackCount: number;
  price?: number;
  artist: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  tags: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  followerCount: number;
  monthlyListeners: number;
  albumCount: number;
  trackCount: number;
}

export function MusicCatalog() {
  const { playTrack, clearQueue, shuffleQueue } = useMusicPlayer();
  
  const [activeTab, setActiveTab] = useState("tracks");
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    genre: "",
    mood: "",
    sort: "latest"
  });
  const [showFilters, setShowFilters] = useState(false);

  // Convert catalog track to music player track format
  const convertTrack = (catalogTrack: Track): import('@/contexts/MusicPlayerContext').Track => ({
    id: catalogTrack.id,
    title: catalogTrack.title,
    artist: catalogTrack.artist.name,
    albumTitle: catalogTrack.album?.title,
    imageUrl: catalogTrack.album?.coverArt,
    duration: catalogTrack.duration,
    audioUrl: `/api/tracks/${catalogTrack.id}/stream`,
    shcCap: catalogTrack.price,
    albumId: catalogTrack.album?.id,
    artistId: catalogTrack.artist.id
  });

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        genre: filters.genre,
        mood: filters.mood,
        sort: filters.sort,
        limit: "20"
      });

      const response = await fetch(`/api/${tab}?${params}`);
      const data = await response.json();

      switch (tab) {
        case "tracks":
          setTracks(data.tracks || []);
          break;
        case "albums":
          setAlbums(data.albums || []);
          break;
        case "artists":
          setArtists(data.artists || []);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(activeTab);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const convertTracksToPlayerFormat = (trackList: Track[]) => {
    return trackList.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      albumTitle: track.album?.title,
      imageUrl: track.album?.coverArt,
      duration: track.duration,
      albumId: track.album?.id,
      artistId: track.artist.id,
    }));
  };

  const handlePlayAll = async (shuffle: boolean = false) => {
    if (tracks.length === 0) return;
    
    const playerTracks = convertTracksToPlayerFormat(tracks);
    await playTrack(playerTracks[0], playerTracks);
    
    if (shuffle) {
      setTimeout(() => shuffleQueue(), 100); // Small delay to let queue set up
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Music className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Music Catalog</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks, albums, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </form>

        {showFilters && (
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        fetchData(value);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="tracks" 
            onClick={() => {
              setActiveTab('tracks');
              fetchData('tracks');
            }}
            className="cursor-pointer"
          >
            Tracks
          </TabsTrigger>
          <TabsTrigger 
            value="albums" 
            onClick={() => {
              setActiveTab('albums');
              fetchData('albums');
            }}
            className="cursor-pointer"
          >
            Albums
          </TabsTrigger>
          <TabsTrigger 
            value="artists" 
            onClick={() => {
              setActiveTab('artists');
              fetchData('artists');
            }}
            className="cursor-pointer"
          >
            Artists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="mt-6">
          {loading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tracks found</p>
                </div>
              ) : (
                <>
                  {/* Play All Controls */}
                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span>{tracks.length} tracks found</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePlayAll(true)}
                        className="gap-2"
                      >
                        <Shuffle className="h-4 w-4" />
                        Shuffle Play
                      </Button>
                      
                      <Button 
                        onClick={() => handlePlayAll(false)}
                        size="sm"
                        className="gap-2 bg-[#9B5DE5] hover:bg-[#9B5DE5]/80"
                      >
                        <Play className="h-4 w-4" />
                        Play All
                      </Button>
                    </div>
                  </div>
                  
                  {/* Track List */}
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <TrackCard key={track.id} track={convertTrack(track)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="albums" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {albums.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No albums found</p>
                </div>
              ) : (
                albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {artists.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No artists found</p>
                </div>
              ) : (
                artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
