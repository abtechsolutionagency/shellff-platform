
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ShoppingCart, Calendar, Music } from "lucide-react";
import Image from "next/image";

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

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  const getAlbumTypeColor = (type: string) => {
    switch (type) {
      case "ALBUM": return "default";
      case "EP": return "secondary";
      case "SINGLE": return "outline";
      case "COMPILATION": return "destructive";
      default: return "default";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {album.coverArt ? (
            <Image
              src={album.coverArt}
              alt={album.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="lg" className="rounded-full h-16 w-16 p-0">
              <Play className="h-6 w-6" />
            </Button>
          </div>

          {/* Album type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={getAlbumTypeColor(album.albumType) as any} className="text-xs">
              {album.albumType}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Album title */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-1" title={album.title}>
            {album.title}
          </h3>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            {album.artist.name}
            {album.artist.verified && <span>✓</span>}
          </p>
        </div>

        {/* Album info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Music className="h-3 w-3" />
            {album.trackCount} tracks
          </div>
          {album.releaseDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(album.releaseDate)}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {album.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {album.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{album.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Play className="h-3 w-3 mr-1" />
              Play
            </Button>
          </div>
          
          {album.price && (
            <Button size="sm" className="gap-1">
              <ShoppingCart className="h-3 w-3" />
              {album.price} SHC
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
