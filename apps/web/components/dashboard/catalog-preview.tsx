
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Play, TrendingUp, Clock, ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { TrackDownloadButton } from "@/components/player/OfflineDownloadManager";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface Track {
  id: string;
  title: string;
  duration: number;
  playCount: number;
  artist: {
    id: string;
    name: string;
    verified: boolean;
  };
  album?: {
    id: string;
    title: string;
    coverArt?: string;
  };
}

export function CatalogPreview() {
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  // Convert track to music player format
  const convertToPlayerTrack = (track: Track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist.name,
    albumTitle: track.album?.title,
    imageUrl: track.album?.coverArt,
    duration: track.duration,
    audioUrl: `/api/tracks/${track.id}/stream`
  });

  const handlePlayTrack = (track: Track, allTracks: Track[]) => {
    const playerTrack = convertToPlayerTrack(track);
    const allPlayerTracks = allTracks.map(convertToPlayerTrack);
    playTrack(playerTrack, allPlayerTracks);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const [popularResponse, recentResponse] = await Promise.all([
        fetch("/api/tracks?sort=popular&limit=5"),
        fetch("/api/tracks?sort=latest&limit=5")
      ]);

      const popularData = await popularResponse.json();
      const recentData = await recentResponse.json();

      setPopularTracks(popularData.tracks || []);
      setRecentTracks(recentData.tracks || []);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Music Catalog</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/music" className="flex items-center gap-2">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Tracks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4" />
              Trending Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularTracks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tracks available</p>
              ) : (
                popularTracks.slice(0, 3).map((track, index) => (
                  <div key={track.id} className="flex items-center gap-3 group hover:bg-accent/50 p-2 -m-2 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 text-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="relative w-10 h-10 rounded bg-muted overflow-hidden">
                      {track.album?.coverArt ? (
                        <Image
                          src={track.album.coverArt}
                          alt={track.album.title || track.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" className="h-6 w-6 rounded-full p-0" onClick={() => handlePlayTrack(track, popularTracks)}>
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{track.title}</p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        {track.artist.name}
                        {track.artist.verified && (
                          <>
                            <BadgeCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                            <span className="sr-only">Verified artist</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TrackDownloadButton track={convertToPlayerTrack(track)} />
                      <span>{formatNumber(track.playCount)} plays</span>
                      <span>{formatDuration(track.duration)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Releases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-4 w-4" />
              Latest Releases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTracks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tracks available</p>
              ) : (
                recentTracks.slice(0, 3).map((track) => (
                  <div key={track.id} className="flex items-center gap-3 group hover:bg-accent/50 p-2 -m-2 rounded-lg transition-colors">
                    <div className="relative w-10 h-10 rounded bg-muted overflow-hidden">
                      {track.album?.coverArt ? (
                        <Image
                          src={track.album.coverArt}
                          alt={track.album.title || track.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" className="h-6 w-6 rounded-full p-0" onClick={() => handlePlayTrack(track, recentTracks)}>
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{track.title}</p>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        {track.artist.name}
                        {track.artist.verified && (
                          <>
                            <BadgeCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                            <span className="sr-only">Verified artist</span>
                          </>
                        )}
                      </p>
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
