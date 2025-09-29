
'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Expand, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { QueueButton } from './QueueButton';

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isShuffled,
    isRepeated,
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setShowFullPlayer,
    showMiniPlayer,
  } = useMusicPlayer();

  const [isDragging, setIsDragging] = useState(false);
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

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    seekTo(localTime);
  };

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;

  if (!showMiniPlayer || !currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-[#1a1a1a] border-t border-gray-800 z-50">
      {/* Progress Bar */}
      <div className="relative h-1 bg-gray-700 group">
        <div 
          className="absolute top-0 left-0 h-full bg-[#9B5DE5] transition-all duration-300"
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
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#9B5DE5] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
              {currentTrack.imageUrl ? (
                <Image
                  src={currentTrack.imageUrl}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {currentTrack.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setShowFullPlayer(true)}>
              <div className="flex items-center space-x-2">
                <p className="text-white font-medium truncate text-sm">
                  {currentTrack.title}
                </p>
                {/* Mode indicators */}
                <div className="flex items-center space-x-1">
                  {isShuffled && (
                    <Shuffle className="w-3 h-3 text-[#9B5DE5]" />
                  )}
                  {isRepeated !== 'none' && (
                    isRepeated === 'track' ? (
                      <Repeat1 className="w-3 h-3 text-[#9B5DE5]" />
                    ) : (
                      <Repeat className="w-3 h-3 text-[#9B5DE5]" />
                    )
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artist}
              </p>
            </div>
            
            <div className="hidden sm:block">
              <QueueButton showCount={false} className="p-2" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 mx-4">
            <button 
              onClick={previousTrack}
              className="p-2 text-gray-400 hover:text-[#00F5D4] transition-colors duration-200 hidden sm:block"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-8 h-8 bg-[#9B5DE5] hover:bg-[#00F5D4] rounded-full flex items-center justify-center transition-all duration-200 shadow-lg shadow-[#9B5DE5]/25"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button 
              onClick={nextTrack}
              className="p-2 text-gray-400 hover:text-[#00F5D4] transition-colors duration-200 hidden sm:block"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time and Expand */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <div className="hidden md:flex items-center space-x-2 text-xs text-gray-400 font-mono">
              <span>{formatTime(localTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-2 text-gray-400 hover:text-[#00F5D4] transition-colors duration-200"
            >
              <Expand className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
