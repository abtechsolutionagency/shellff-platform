
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Play, ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

interface Track {
  id: string;
  number: number;
  title: string;
  duration: string;
  shcCap: number;
}

interface Contributor {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AlbumContentProps {
  albumId?: string;
}

interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  trackCount: number;
  coverUrl: string;
  tracks: Track[];
  contributors: Contributor[];
}

export function AlbumContent({ albumId }: AlbumContentProps) {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  const userType = (session?.user as any)?.userType;
  const isCreator = userType === 'Creator' || userType === 'creator';

  // Mock album data
  const albumData: AlbumData = {
    id: albumId ?? '1',
    title: "Eclipse Dreams",
    artist: "Olivia Stevenson",
    year: 2024,
    genre: "Electronic",
    trackCount: 10,
    coverUrl: "https://cdn.abacus.ai/images/54bba0a5-d7a3-4904-a5e1-103d1a723dfa.png",
    tracks: [
      { id: "1", number: 1, title: "Midnight Reverie", duration: "3:42", shcCap: 50 },
      { id: "2", number: 2, title: "Neon Shadows", duration: "4:18", shcCap: 75 },
      { id: "3", number: 3, title: "Electric Pulse", duration: "3:56", shcCap: 60 },
      { id: "4", number: 4, title: "Digital Dreams", duration: "5:23", shcCap: 90 },
      { id: "5", number: 5, title: "Synthetic Love", duration: "4:07", shcCap: 65 },
      { id: "6", number: 6, title: "Chrome Hearts", duration: "3:29", shcCap: 45 },
      { id: "7", number: 7, title: "Quantum Leap", duration: "4:51", shcCap: 80 },
      { id: "8", number: 8, title: "Holographic Sky", duration: "3:33", shcCap: 55 },
      { id: "9", number: 9, title: "Binary Sunset", duration: "4:44", shcCap: 70 },
      { id: "10", number: 10, title: "Eclipse Dreams", duration: "6:12", shcCap: 100 }
    ],
    contributors: [
      { id: "1", name: "Marcus Chen", role: "Producer", avatar: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Marcus_C.jpg" },
      { id: "2", name: "Sofia Rodriguez", role: "Sound Engineer", avatar: "https://i.ytimg.com/vi/Ud1nCARt4EU/maxresdefault.jpg" },
      { id: "3", name: "James Wilson", role: "Mixing Engineer", avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Engineer_at_audio_console_at_Danish_Broadcasting_Corporation.png/250px-Engineer_at_audio_console_at_Danish_Broadcasting_Corporation.png" },
      { id: "4", name: "Emma Thompson", role: "Mastering Engineer", avatar: "https://i.ytimg.com/vi/38Pzz-q2hSM/maxresdefault.jpg" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {/* Album Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Album Cover */}
          <div className="lg:col-span-1">
            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gray-900">
              <Image
                src={albumData.coverUrl}
                alt={`${albumData.title} by ${albumData.artist}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          </div>

          {/* Album Info */}
          <div className="lg:col-span-2 flex flex-col justify-end">
            <div className="mb-4">
              <Badge variant="outline" className="border-purple-500 text-purple-400 mb-4">
                ALBUM
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 font-poppins">
              {albumData.title}
            </h1>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl text-purple-400 font-medium">by</span>
              <Link href={`/artist/${albumData.artist.toLowerCase().replace(' ', '-')}`} className="text-xl text-purple-400 font-medium hover:underline">
                {albumData.artist}
              </Link>
            </div>

            <div className="flex items-center gap-4 text-gray-300 mb-8">
              <span>{albumData.trackCount} tracks</span>
              <span>•</span>
              <span>{albumData.year}</span>
              <span>•</span>
              <span>{albumData.genre}</span>
            </div>

            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                <Play className="h-5 w-5 mr-2" />
                Play
              </Button>
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300">
                Add to Library
              </Button>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Tracklist</h2>
          
          <div className="space-y-2">
            {albumData.tracks.map((track) => (
              <Card key={track.id} className="bg-transparent border-none hover:bg-gray-900/50 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      <span className="text-gray-400 text-sm group-hover:hidden">
                        {track.number.toString().padStart(2, '0')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hidden group-hover:flex h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-white">{track.title}</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      {!isCreator && (
                        <Badge className="bg-purple-600 text-white">
                          Cap: {track.shcCap} SHC
                        </Badge>
                      )}
                      <span className="text-gray-400 text-sm w-12 text-right">
                        {track.duration}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contributors */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Contributors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {albumData.contributors.map((contributor) => (
              <Card key={contributor.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contributor.avatar} alt={contributor.name} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {contributor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{contributor.name}</h3>
                      <p className="text-gray-400 text-sm">{contributor.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


