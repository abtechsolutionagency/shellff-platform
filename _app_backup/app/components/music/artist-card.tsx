
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Play, Music2, Users, Headphones } from "lucide-react";
import Image from "next/image";

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

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="text-center pb-4">
        <div className="relative mx-auto">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={artist.avatar} alt={artist.name} />
            <AvatarFallback className="text-lg">
              {getInitials(artist.name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" className="rounded-full h-10 w-10 p-0">
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
            {artist.name}
            {artist.verified && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                ✓
              </Badge>
            )}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-medium">{formatNumber(artist.followerCount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Headphones className="h-3 w-3" />
              <span className="font-medium">{formatNumber(artist.monthlyListeners)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Monthly Listeners</p>
          </div>
        </div>

        {/* Content stats */}
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music2 className="h-3 w-3" />
            {artist.albumCount} albums
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Music2 className="h-3 w-3" />
            {artist.trackCount} tracks
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <UserPlus className="h-3 w-3 mr-1" />
            Follow
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Play className="h-3 w-3 mr-1" />
            Play
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
