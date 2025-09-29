
'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle, 
  Repeat, 
  Heart, 
  ChevronDown, 
  MoreHorizontal,
  Repeat1,
  Download
} from 'lucide-react';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { QueueButton } from './QueueButton';
import { OfflineDownloadManager } from './OfflineDownloadManager';

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    isRepeated,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    showFullPlayer,
    setShowFullPlayer,
    queue,
  } = useMusicPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeHover, setIsVolumeHover] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setLocalTime(newTime);
    if (!isDragging) {
      seekTo(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    seekTo(localTime);
  };

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;

  if (!showFullPlayer || !currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#1a1a1a] to-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullPlayer(false)}
          className="text-gray-400 hover:text-white"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wider">
            Playing from {queue ? 'Queue' : 'Track'}
          </p>
          {/* Mode indicators */}
          <div className="flex items-center justify-center space-x-2 mt-1">
            {isShuffled && (
              <div className="flex items-center space-x-1 text-[#9B5DE5] text-xs">
                <Shuffle className="w-3 h-3" />
                <span>Shuffle</span>
              </div>
            )}
            {isRepeated !== 'none' && (
              <div className="flex items-center space-x-1 text-[#9B5DE5] text-xs">
                {isRepeated === 'track' ? (
                  <Repeat1 className="w-3 h-3" />
                ) : (
                  <Repeat className="w-3 h-3" />
                )}
                <span>Repeat {isRepeated}</span>
              </div>
            )}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        {/* Album Art */}
        <div className="relative w-80 h-80 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
          {currentTrack.imageUrl ? (
            <Image
              src={currentTrack.imageUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center">
              <span className="text-white text-6xl font-bold">
                {currentTrack.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-8">
          <h1 className="text-white text-2xl font-bold mb-2 truncate max-w-md mx-auto">
            {currentTrack.title}
          </h1>
          <p className="text-gray-400 text-lg truncate max-w-md mx-auto">
            {currentTrack.artist}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="relative h-2 bg-gray-700 rounded-full group cursor-pointer">
            <div 
              className="absolute top-0 left-0 h-full bg-[#9B5DE5] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={localTime}
              onChange={handleTimeChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400 font-mono">
            <span>{formatTime(localTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShuffle}
            className={cn(
              "p-2 transition-colors duration-200",
              isShuffled 
                ? "text-[#9B5DE5] hover:text-[#9B5DE5]/80" 
                : "text-gray-400 hover:text-white"
            )}
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={previousTrack}
            className="p-3 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <SkipBack className="w-6 h-6" />
          </Button>
          
          <Button
            onClick={togglePlay}
            className="w-16 h-16 bg-[#9B5DE5] hover:bg-[#00F5D4] rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl shadow-[#9B5DE5]/40"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" fill="currentColor" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextTrack}
            className="p-3 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRepeat}
            className={cn(
              "p-2 transition-colors duration-200",
              isRepeated !== 'none'
                ? "text-[#9B5DE5] hover:text-[#9B5DE5]/80" 
                : "text-gray-400 hover:text-white"
            )}
          >
            {isRepeated === 'track' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-[#00F5D4] transition-colors duration-200"
          >
            <Heart className="w-5 h-5" />
          </Button>
          
          <div 
            className="flex items-center space-x-2"
            onMouseEnter={() => setIsVolumeHover(true)}
            onMouseLeave={() => setIsVolumeHover(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            
            <div className={cn(
              "transition-all duration-300 overflow-hidden",
              isVolumeHover ? "w-24 opacity-100" : "w-0 opacity-0"
            )}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-[#9B5DE5]"
              />
            </div>
          </div>
          
          <QueueButton />
          
          <OfflineDownloadManager track={currentTrack || undefined}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-[#00F5D4] transition-colors duration-200"
            >
              <Download className="w-5 h-5" />
            </Button>
          </OfflineDownloadManager>
        </div>
      </div>
    </div>
  );
}
