
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Upload, Music2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock data for available tracks
const mockTracks = [
  {
    id: "1",
    title: "Urban Rainfall",
    artist: "City Sounds",
    duration: "3:31",
    coverUrl: "/images/eclipse-dreams.jpg"
  },
  {
    id: "2",
    title: "Digital Horizons",
    artist: "Future Bass",
    duration: "4:07",
    coverUrl: "/images/neon-nights.jpg"
  },
  {
    id: "3",
    title: "Peaceful Morning",
    artist: "Nature Sounds",
    duration: "6:15",
    coverUrl: "/images/digital-pulse.jpg"
  },
  {
    id: "4",
    title: "Velvet Sunset",
    artist: "Chill Lounge",
    duration: "4:44",
    coverUrl: "/images/cosmic-vibes.jpg"
  }
];

export function CreatePlaylistContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [playlistName, setPlaylistName] = useState("Chill Vibes");
  const [selectedTracks, setSelectedTracks] = useState<string[]>(["1", "2", "3", "4"]);
  const [coverArt, setCoverArt] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const getTotalDuration = () => {
    const selectedTrackData = mockTracks.filter(track => selectedTracks.includes(track.id));
    const totalSeconds = selectedTrackData.reduce((total, track) => {
      const [minutes, seconds] = track.duration.split(':').map(Number);
      return total + (minutes * 60) + seconds;
    }, 0);
    
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    // Here you would implement the actual save logic
    console.log("Saving playlist:", {
      name: playlistName,
      tracks: selectedTracks,
      coverArt
    });
    router.push('/library');
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverArt(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/library">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Playlist</h1>
            <p className="text-gray-400">Build your perfect music collection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-purple-400">
          <Music2 className="h-5 w-5" />
          <span className="font-semibold">Shellff</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Playlist Details */}
              <div>
                <div className="mb-6">
                  <label className="block text-white font-medium mb-2">Playlist Name</label>
                  <Input
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter playlist name"
                  />
                </div>
              </div>

              {/* Cover Art */}
              <div>
                <label className="block text-white font-medium mb-2">Cover Art</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Upload cover art</p>
                    <p className="text-gray-400 text-sm">or use first track art</p>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Track Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Select Tracks from Library</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockTracks.map((track) => {
              const isSelected = selectedTracks.includes(track.id);
              return (
                <Card 
                  key={track.id} 
                  className={`border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? "bg-purple-900/30 border-purple-500" 
                      : "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50"
                  }`}
                  onClick={() => toggleTrack(track.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => toggleTrack(track.id)}
                          className="border-gray-600"
                        />
                      </div>
                      
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Music2 className="h-5 w-5 text-purple-400" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">{track.title}</h3>
                        <p className="text-gray-400 text-sm">{track.artist}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-gray-400 text-sm">{track.duration}</p>
                        {isSelected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 h-6 w-6 p-0 mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrack(track.id);
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Selected Tracks Summary */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Selected Tracks</h3>
            <p className="text-gray-400 mb-4">{selectedTracks.length} tracks selected</p>
            <div className="flex justify-between items-center">
              <span className="text-purple-400 font-medium">Total: {getTotalDuration()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleSave}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium"
          >
            Save Playlist ({selectedTracks.length} tracks)
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            asChild
          >
            <Link href="/library">Cancel</Link>
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-gray-900/30 rounded-lg">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>No publishing fees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>No royalties on your account</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
