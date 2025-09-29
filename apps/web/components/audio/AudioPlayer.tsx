
"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, Repeat, Shuffle } from 'lucide-react';
import { audioManager, Track } from '@/lib/audio/AudioManager';
import Image from 'next/image';

export function AudioPlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!audioManager) return;

    const handlePlay = (track: Track) => {
      setCurrentTrack(track);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = (data: { currentTime: number; duration: number }) => {
      setCurrentTime(data.currentTime);
      setDuration(data.duration);
    };

    const handleVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
    };

    const handleLoading = (loading: boolean) => {
      setIsLoading(loading);
    };

    audioManager?.on('play', handlePlay);
    audioManager?.on('pause', handlePause);
    audioManager?.on('timeupdate', handleTimeUpdate);
    audioManager?.on('volumechange', handleVolumeChange);
    audioManager?.on('loading', handleLoading);

    // Initialize with current state
    setCurrentTrack(audioManager?.getCurrentTrack() || null);
    setIsPlaying(audioManager?.getIsPlaying() || false);
    setVolume(audioManager?.getVolume() || 1);

    return () => {
      audioManager?.off('play', handlePlay);
      audioManager?.off('pause', handlePause);
      audioManager?.off('timeupdate', handleTimeUpdate);
      audioManager?.off('volumechange', handleVolumeChange);
      audioManager?.off('loading', handleLoading);
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioManager || !currentTrack) return;
    
    if (isPlaying) {
      audioManager.pause();
    } else {
      audioManager.play(currentTrack);
    }
  };

  const handlePrevious = () => {
    if (!audioManager) return;
    audioManager.previous();
  };

  const handleNext = () => {
    if (!audioManager) return;
    audioManager.next();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioManager) return;
    const time = parseFloat(e.target.value);
    audioManager.seek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioManager) return;
    const newVolume = parseFloat(e.target.value);
    audioManager.setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    if (!audioManager) return;
    
    if (isMuted) {
      audioManager.setVolume(volume > 0 ? volume : 0.5);
      setIsMuted(false);
    } else {
      audioManager.setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 px-4 py-3 z-50">
      <div className="flex items-center space-x-4">
        
        {/* Track Info */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="relative w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden">
            {currentTrack.coverArt ? (
              <Image
                src={currentTrack.coverArt}
                alt={`${currentTrack.title} cover`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-teal-400">
                <span className="text-white text-xs font-bold">
                  {currentTrack.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate" 
               style={{ fontFamily: 'Inter, sans-serif' }}>
              {currentTrack.title}
            </p>
            <p className="text-zinc-400 text-xs truncate" 
               style={{ fontFamily: 'Inter, sans-serif' }}>
              {currentTrack.artist}
            </p>
          </div>
          
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
          <div className="flex items-center space-x-4">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Shuffle className="h-4 w-4" />
            </button>
            
            <button 
              onClick={handlePrevious}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 transform active:scale-95 disabled:opacity-50"
              style={{ 
                backgroundColor: isLoading ? '#6b7280' : '#9B5DE5'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#00F5D4';
                  target.style.transform = 'scale(1.05)';
                  target.style.boxShadow = '0 10px 25px rgba(0, 245, 212, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#9B5DE5';
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
            
            <button 
              onClick={handleNext}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Repeat className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-zinc-400 w-10 text-right" 
                  style={{ fontFamily: 'Inter, sans-serif' }}>
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #9B5DE5 0%, #9B5DE5 ${(currentTime / (duration || 1)) * 100}%, #52525b ${(currentTime / (duration || 1)) * 100}%, #52525b 100%)`
              }}
            />
            <span className="text-xs text-zinc-400 w-10" 
                  style={{ fontFamily: 'Inter, sans-serif' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 flex-1 max-w-32">
          <button 
            onClick={handleMuteToggle}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #9B5DE5 0%, #9B5DE5 ${(isMuted ? 0 : volume) * 100}%, #52525b ${(isMuted ? 0 : volume) * 100}%, #52525b 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
