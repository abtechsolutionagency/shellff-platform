
'use client';

import { useState } from 'react';
import { 
  List, 
  X, 
  Play, 
  Pause, 
  Trash2, 
  Music,
  Shuffle,
  Repeat,
  Repeat1,
  MoreVertical
} from 'lucide-react';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface QueueManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueueManager({ isOpen, onClose }: QueueManagerProps) {
  const {
    currentTrack,
    isPlaying,
    queue,
    isShuffled,
    isRepeated,
    playTrack,
    removeFromQueue,
    clearQueue,
    shuffleQueue,
    toggleShuffle,
    toggleRepeat,
  } = useMusicPlayer();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleTrackClick = (trackIndex: number) => {
    if (queue && queue.tracks[trackIndex]) {
      playTrack(queue.tracks[trackIndex]);
    }
  };

  const handleRemoveTrack = (trackIndex: number) => {
    removeFromQueue(trackIndex);
  };

  const handleClearQueue = () => {
    if (showClearConfirm) {
      clearQueue();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      // Hide confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const queueTracks = queue?.tracks || [];
  const currentIndex = queue?.currentIndex || 0;
  const totalDuration = queueTracks.reduce((acc, track) => acc + track.duration, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-t-3xl md:rounded-2xl w-full max-w-md h-[80vh] md:h-[70vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <List className="w-5 h-5 text-[#9B5DE5]" />
            <div>
              <h2 className="text-white font-semibold">Queue</h2>
              <p className="text-gray-400 text-xs">
                {queueTracks.length} tracks • {formatTime(totalDuration)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 bg-gray-900/50">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShuffle}
              className={cn(
                "transition-colors duration-200",
                isShuffled 
                  ? "text-[#9B5DE5] hover:text-[#9B5DE5]/80" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRepeat}
              className={cn(
                "transition-colors duration-200",
                isRepeated !== 'none'
                  ? "text-[#9B5DE5] hover:text-[#9B5DE5]/80" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              {isRepeated === 'track' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shuffleQueue}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              disabled={queueTracks.length <= 1}
            >
              <Shuffle className="w-4 h-4" />
              <span className="text-xs ml-1">Mix</span>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-gray-700">
              <DropdownMenuItem
                onClick={handleClearQueue}
                className="text-red-400 hover:text-red-300 focus:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {showClearConfirm ? 'Confirm Clear' : 'Clear Queue'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Queue List */}
        <ScrollArea className="flex-1">
          {queueTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Music className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center">No tracks in queue</p>
              <p className="text-xs text-center mt-1">
                Play a track or add songs to get started
              </p>
            </div>
          ) : (
            <div className="p-2">
              {queueTracks.map((track, index) => {
                const isCurrentTrack = index === currentIndex && track.id === currentTrack?.id;
                
                return (
                  <div
                    key={`${track.id}-${index}`}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 group cursor-pointer",
                      isCurrentTrack && "bg-[#9B5DE5]/10 border border-[#9B5DE5]/20"
                    )}
                    onClick={() => handleTrackClick(index)}
                  >
                    {/* Track Image */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {track.imageUrl ? (
                        <Image
                          src={track.imageUrl}
                          alt={track.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {track.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Play/Pause Overlay */}
                      {isCurrentTrack && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-[#9B5DE5]" />
                          ) : (
                            <Play className="w-5 h-5 text-[#9B5DE5]" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Track Info */}
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "font-medium truncate text-sm",
                        isCurrentTrack ? "text-[#9B5DE5]" : "text-white"
                      )}>
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {track.artist}
                        {track.albumTitle && ` • ${track.albumTitle}`}
                      </p>
                    </div>
                    
                    {/* Duration & Actions */}
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-xs font-mono">
                        {formatTime(track.duration)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrack(index);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-auto text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer with Status */}
        {queueTracks.length > 0 && (
          <div className="p-3 border-t border-gray-800 bg-gray-900/30">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                {isShuffled && (
                  <div className="flex items-center space-x-1 text-[#9B5DE5]">
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle</span>
                  </div>
                )}
                {isRepeated !== 'none' && (
                  <div className="flex items-center space-x-1 text-[#9B5DE5]">
                    {isRepeated === 'track' ? (
                      <Repeat1 className="w-3 h-3" />
                    ) : (
                      <Repeat className="w-3 h-3" />
                    )}
                    <span>Repeat {isRepeated}</span>
                  </div>
                )}
              </div>
              
              <span>
                Playing {currentIndex + 1} of {queueTracks.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
