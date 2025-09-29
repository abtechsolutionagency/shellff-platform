
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { TrackCard } from "@/components/likes";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  liked?: boolean;
}

export function RecentlyPlayedSection() {
  const [mounted, setMounted] = useState(false);
  const { playTrack } = useMusicPlayer();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Convert track to music player format
  const convertToPlayerTrack = (track: Track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    imageUrl: track.coverUrl,
    duration: 180, // Mock duration (3 minutes)
    audioUrl: `/api/tracks/${track.id}/stream`
  });

  const handlePlayTrack = (track: Track) => {
    const playerTrack = convertToPlayerTrack(track);
    const allPlayerTracks = recentTracks.map(convertToPlayerTrack);
    playTrack(playerTrack, allPlayerTracks);
  };

  // Mock recently played tracks data with like status
  const recentTracks: Track[] = [
    {
      id: "7",
      title: "Eclipse Dreams",
      artist: "Olivia Stevenson",
      coverUrl: "https://cdn.abacus.ai/images/54bba0a5-d7a3-4904-a5e1-103d1a723dfa.png",
      liked: true
    },
    {
      id: "8",
      title: "Neon Nights",
      artist: "Synthwave Collective",
      coverUrl: "https://cdn.abacus.ai/images/94e2cc7d-dba9-45d0-83d9-1c9ec8996080.png",
      liked: false
    },
    {
      id: "9",
      title: "Digital Pulse",
      artist: "Echo Chamber",
      coverUrl: "https://cdn.abacus.ai/images/2b100ce8-407d-46ab-8d4d-0b4c3e6d2e6f.png",
      liked: true
    },
    {
      id: "10",
      title: "Cosmic Vibes",
      artist: "Luna Martinez",
      coverUrl: "https://cdn.abacus.ai/images/8e9aa3fb-0f56-4eed-9901-a0dcc3b8d7b6.png",
      liked: false
    },
    {
      id: "11",
      title: "Electric Dreams",
      artist: "The Synth Riders",
      coverUrl: "https://cdn.abacus.ai/images/3749a7db-b38e-4906-ace8-13790f6555d5.png",
      liked: false
    }
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white font-poppins">Recently Played</h2>
        <Button 
          variant="ghost" 
          className="text-teal-400 hover:text-teal-300 font-medium"
          onClick={() => router.push('/library')}
        >
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {recentTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={handlePlayTrack}
            showDownload={false}
            size="md"
          />
        ))}
      </div>
    </section>
  );
}
