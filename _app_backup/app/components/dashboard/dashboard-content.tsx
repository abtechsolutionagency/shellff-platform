
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Music, Play, Upload, User, TrendingUp, Clock, Heart, Library, Users, Headphones, Mic, Download } from "lucide-react";
import { DownloadManager } from "@/components/offline/DownloadManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { mockPlaylists, mockTracks } from "@/lib/data/mockMusic";
import { audioManager } from "@/lib/audio/AudioManager";
import { CatalogPreview } from "./catalog-preview";

export function DashboardContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [showDownloadManager, setShowDownloadManager] = useState(false);

  const userType = (session?.user as any)?.userType;
  const firstName = (session?.user as any)?.firstName;
  const isCreator = userType === 'CREATOR';

  const handleQuickPlay = () => {
    if (!audioManager || mockTracks.length === 0) return;
    
    // Play first track and set full library as playlist
    audioManager.setPlaylist(mockTracks, 0);
    audioManager.play(mockTracks[0]);
  };

  const totalTracks = mockTracks.length;
  const totalPlaylists = mockPlaylists.length;
  const totalDuration = Math.floor(mockTracks.reduce((acc, track) => acc + track.duration, 0) / 60);
  const recentPlaylists = mockPlaylists.slice(0, 3);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" 
              style={{ fontFamily: 'Poppins, sans-serif' }}>
            Welcome back{firstName ? `, ${firstName}` : session?.user?.name?.split(' ')[0] ? `, ${session?.user?.name?.split(' ')[0]}` : session?.user?.email?.split('@')[0] ? `, ${session?.user?.email?.split('@')[0]}` : ', Music Lover'}!
          </h1>
          <p className="text-xl text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            {isCreator 
              ? "Ready to create and share your music with the world?" 
              : "Ready to dive into your musical universe?"
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => router.push('/library')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 group glow-purple"
            style={{ backgroundImage: 'linear-gradient(135deg, #9B5DE5 0%, #7C3AED 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Library className="h-8 w-8" />
              <div className="text-right opacity-75 group-hover:opacity-100 transition-opacity">
                <Music className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1 font-poppins">
              My Shellff
            </h3>
            <p className="text-sm opacity-90 font-inter">
              Personal collection & history
            </p>
          </button>

          <button
            onClick={handleQuickPlay}
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 group glow-teal"
            style={{ backgroundImage: 'linear-gradient(135deg, #00F5D4 0%, #00C9A7 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Play className="h-8 w-8" />
              <div className="text-right opacity-75 group-hover:opacity-100 transition-opacity">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1 font-poppins">
              Quick Play
            </h3>
            <p className="text-sm opacity-90 font-inter">
              Start listening now
            </p>
          </button>

          <button
            onClick={() => router.push('/upload')}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 group"
            style={{ backgroundImage: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Upload className="h-8 w-8" />
              <div className="text-right opacity-75 group-hover:opacity-100 transition-opacity">
                <Music className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1 font-poppins">
              {isCreator ? 'Upload Music' : 'Become a Creator'}
            </h3>
            <p className="text-sm opacity-90 font-inter">
              {isCreator ? 'Share your creations' : 'Start creating music'}
            </p>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 group"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <User className="h-8 w-8" />
              <div className="text-right opacity-75 group-hover:opacity-100 transition-opacity">
                <Heart className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1 font-poppins">
              Your Profile
            </h3>
            <p className="text-sm opacity-90 font-inter">
              Manage your account
            </p>
          </button>

          <button
            onClick={() => setShowDownloadManager(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 group"
            style={{ backgroundImage: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Download className="h-8 w-8" />
              <div className="text-right opacity-75 group-hover:opacity-100 transition-opacity">
                <Music className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1 font-poppins">
              Downloads
            </h3>
            <p className="text-sm opacity-90 font-inter">
              Offline music
            </p>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                {isCreator ? <Mic className="h-6 w-6 text-purple-400" /> : <Headphones className="h-6 w-6 text-purple-400" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <Badge variant={isCreator ? "default" : "secondary"} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {userType || 'Listener'}
                  </Badge>
                </h3>
                <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Account Type
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center">
                <Music className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {totalTracks}
                </h3>
                <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {isCreator ? 'Tracks Created' : 'Tracks Available'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Library className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {totalPlaylists}
                </h3>
                <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Playlists Created
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {totalDuration}m
                </h3>
                <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Total Listening Time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Playlists */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              My Playlists
            </h2>
            <button 
              onClick={() => router.push('/music')}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              View all
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentPlaylists.map(playlist => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist}
                size="medium"
                onPlaylistClick={(playlist) => {
                  console.log('Opening playlist:', playlist.name);
                  // TODO: Navigate to playlist detail page
                }}
                onPlayClick={(playlist) => {
                  if (!audioManager) return;
                  audioManager.setPlaylist(playlist.tracks, 0);
                  if (playlist.tracks.length > 0) {
                    audioManager.play(playlist.tracks[0]);
                  }
                }}
              />
            ))}
          </div>
        </section>

        {/* Music Catalog Preview */}
        <section className="mb-12">
          <CatalogPreview />
        </section>

        {/* Platform Status */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Platform Development
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Status</CardTitle>
                <CardDescription className="text-zinc-400">Shellff development progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Foundation (Slice 0)</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Complete ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Music Player (Slice 1)</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Active 🎵</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Social Features (Slice 2)</span>
                    <Badge variant="outline" className="border-zinc-600 text-zinc-400">Planned</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Web3 Integration (Slice 3)</span>
                    <Badge variant="outline" className="border-zinc-600 text-zinc-400">Planned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-400">Your latest actions on Shellff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Play className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">Welcome to Shellff!</p>
                      <p className="text-xs text-zinc-400">Account created</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                      <Music className="h-4 w-4 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">Music Library Available</p>
                      <p className="text-xs text-zinc-400">{totalTracks} tracks ready to play</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Library className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">Playlists Ready</p>
                      <p className="text-xs text-zinc-400">{totalPlaylists} curated playlists</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Download Manager Modal */}
      <DownloadManager 
        open={showDownloadManager}
        onOpenChange={setShowDownloadManager}
      />
    </div>
  );
}
