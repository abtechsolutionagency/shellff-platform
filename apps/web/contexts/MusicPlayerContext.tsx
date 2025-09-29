
'use client';

import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { offlineCache } from '@/lib/offline-cache';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { listeningHistoryService } from '@/lib/services/listening-history';

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumTitle?: string;
  imageUrl?: string;
  duration: number; // in seconds
  audioUrl?: string;
  shcCap?: number;
  albumId?: string;
  artistId?: string;
  creatorId?: string; // To track who created the track
}

export interface PlaybackQueue {
  tracks: Track[];
  currentIndex: number;
}

export interface MusicPlayerContextType {
  // Current state
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  isRepeated: 'none' | 'track' | 'queue';
  isLoading: boolean;
  
  // Queue management
  queue: PlaybackQueue | null;
  
  // S2E eligibility
  isEligibleForS2E: boolean;
  
  // Player actions
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => Promise<void>;
  stopTrack: () => void;
  
  // Seeking
  seekTo: (time: number) => void;
  
  // Volume control
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Queue navigation
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  
  // Queue manipulation
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  
  // Player modes
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Player visibility
  showMiniPlayer: boolean;
  showFullPlayer: boolean;
  setShowFullPlayer: (show: boolean) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession() || {};
  const { sendMessage: sendMessageToSW } = useServiceWorker();
  
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeated, setIsRepeated] = useState<'none' | 'track' | 'queue'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  
  // Listening history tracking state
  const [playStartTime, setPlayStartTime] = useState<number>(0);
  const [totalPlayTime, setTotalPlayTime] = useState<number>(0);
  const [wasPlayingBeforePause, setWasPlayingBeforePause] = useState(false);
  const [trackStartTime, setTrackStartTime] = useState<number>(0);
  
  // Queue state
  const [queue, setQueue] = useState<PlaybackQueue | null>(null);
  
  // S2E eligibility - creators can't earn from their own tracks
  const isEligibleForS2E = !!(
    currentTrack && 
    session?.user && 
    (session.user as any)?.userType !== 'Creator' && 
    (session.user as any)?.userType !== 'creator' &&
    currentTrack.creatorId !== (session.user as any)?.sciId
  );
  
  // Listen for service worker background control events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleSWNextTrack = () => nextTrack();
      const handleSWPreviousTrack = () => previousTrack();
      const handleSWSeek = (event: Event) => {
        const customEvent = event as CustomEvent;
        seekTo(customEvent.detail.time);
      };
      const handleSWSeekBackward = (event: Event) => {
        const customEvent = event as CustomEvent;
        const newTime = Math.max(0, currentTime - customEvent.detail.time);
        seekTo(newTime);
      };
      const handleSWSeekForward = (event: Event) => {
        const customEvent = event as CustomEvent;
        const newTime = Math.min(duration, currentTime + customEvent.detail.time);
        seekTo(newTime);
      };

      window.addEventListener('sw-next-track' as any, handleSWNextTrack);
      window.addEventListener('sw-previous-track' as any, handleSWPreviousTrack);
      window.addEventListener('sw-seek' as any, handleSWSeek);
      window.addEventListener('sw-seek-backward' as any, handleSWSeekBackward);
      window.addEventListener('sw-seek-forward' as any, handleSWSeekForward);

      return () => {
        window.removeEventListener('sw-next-track' as any, handleSWNextTrack);
        window.removeEventListener('sw-previous-track' as any, handleSWPreviousTrack);
        window.removeEventListener('sw-seek' as any, handleSWSeek);
        window.removeEventListener('sw-seek-backward' as any, handleSWSeekBackward);
        window.removeEventListener('sw-seek-forward' as any, handleSWSeekForward);
      };
    }
  }, [currentTime, duration]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      
      // Set up event listeners
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        const currentTimeValue = audio.currentTime;
        setCurrentTime(currentTimeValue);
        
        // Track listening progress for analytics
        if (isPlaying && currentTrack) {
          const now = Date.now();
          const timeDiff = (now - playStartTime) / 1000; // Convert to seconds
          
          // Update total play time (but don't go beyond actual track progression)
          if (timeDiff > 0 && timeDiff < 10) { // Reasonable time diff to avoid skips
            setTotalPlayTime(prev => prev + timeDiff);
          }
          
          setPlayStartTime(now);
        }
        
        // Award S2E tokens periodically if eligible
        if (isEligibleForS2E && currentTimeValue > 0 && Math.floor(currentTimeValue) % 30 === 0) {
          // Award S2E tokens every 30 seconds of listening (for eligible users)
          console.log('S2E: Awarding tokens for listening...');
        }
      };
      
      const handleDurationChange = () => {
        setDuration(audio.duration || 0);
      };
      
      const handleEnded = async () => {
        // Log completion event for listening history
        if (session?.user && currentTrack) {
          const listeningDuration = Math.floor(totalPlayTime);
          await listeningHistoryService.endPlayEvent(listeningDuration, true);
          
          // Award completion bonus if eligible
          if (isEligibleForS2E) {
            console.log('S2E: Track completed, awarding completion bonus...');
          }
        }
        
        // Reset tracking variables
        setTotalPlayTime(0);
        setPlayStartTime(0);
        setTrackStartTime(0);
        
        if (isRepeated === 'track') {
          audio.currentTime = 0;
          audio.play();
        } else {
          nextTrack();
        }
      };
      
      const handleLoadStart = () => {
        setIsLoading(true);
      };
      
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      const handleError = (e: Event) => {
        console.error('Audio error:', e);
        setIsLoading(false);
        setIsPlaying(false);
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      // Set initial volume
      audio.volume = volume;
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.pause();
      };
    }
  }, [volume, isRepeated, isEligibleForS2E, currentTrack]);
  
  const playTrack = async (track: Track, queueTracks?: Track[]) => {
    if (!audioRef.current) return;
    
    try {
      setIsLoading(true);
      
      // Set up queue if provided
      if (queueTracks) {
        const currentIndex = queueTracks.findIndex(t => t.id === track.id);
        setQueue({
          tracks: queueTracks,
          currentIndex: currentIndex >= 0 ? currentIndex : 0
        });
      } else if (!queue) {
        // If no queue exists, create one with just this track
        setQueue({
          tracks: [track],
          currentIndex: 0
        });
      }
      
      // Check for cached track first
      let audioUrl = track.audioUrl || `/api/tracks/${track.id}/stream`;
      let currentTrackWithImage = track;
      
      try {
        const cachedTrack = await offlineCache.getCachedTrack(track.id);
        if (cachedTrack) {
          console.log('Playing from cache:', track.title);
          audioUrl = offlineCache.createAudioURL(cachedTrack.audioBlob);
          
          // Use cached image if available
          if (cachedTrack.imageBlob) {
            const cachedImageUrl = offlineCache.createImageURL(cachedTrack.imageBlob);
            currentTrackWithImage = {
              ...track,
              imageUrl: cachedImageUrl
            };
          }
        }
      } catch (cacheError) {
        console.warn('Failed to check cache, using network:', cacheError);
      }
      
      // Load and play the track
      setCurrentTrack(currentTrackWithImage);
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      
      await audioRef.current.play();
      setIsPlaying(true);
      
      // Initialize tracking variables
      const now = Date.now();
      setPlayStartTime(now);
      setTrackStartTime(now);
      setTotalPlayTime(0);
      
      // Send track info to service worker for background audio support
      sendMessageToSW('PLAY_TRACK', currentTrackWithImage);
      
      // Start play event tracking for logged-in users
      if (session?.user) {
        const playEventId = await listeningHistoryService.startPlayEvent({
          trackId: track.id,
          source: queueTracks ? 'queue' : 'single',
          platform: 'web'
        });
        
        console.log(`Playing track: ${track.title} by ${track.artist}`);
        console.log('Play event started:', playEventId);
        
        if (!isEligibleForS2E) {
          const userType = (session.user as any)?.userType;
          if (userType === 'Creator' || userType === 'creator') {
            console.log('Creator playing own track - S2E disabled for this session');
          }
        }
      }
      
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setWasPlayingBeforePause(true);
      
      // Update play time when pausing
      if (playStartTime > 0) {
        const now = Date.now();
        const timeDiff = (now - playStartTime) / 1000;
        setTotalPlayTime(prev => prev + timeDiff);
        setPlayStartTime(0); // Reset to stop accumulating time while paused
      }
      
      sendMessageToSW('PAUSE_TRACK');
    }
  };
  
  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play();
      setIsPlaying(true);
      setWasPlayingBeforePause(false);
      
      // Restart time tracking
      setPlayStartTime(Date.now());
      
      sendMessageToSW('RESUME_TRACK');
    }
  };
  
  const togglePlay = async () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      resumeTrack();
    }
  };
  
  const stopTrack = async () => {
    if (audioRef.current) {
      // Log incomplete play event before stopping
      if (session?.user && currentTrack && totalPlayTime > 0) {
        const finalDuration = Math.floor(totalPlayTime);
        const skipPosition = Math.floor(audioRef.current.currentTime);
        await listeningHistoryService.endPlayEvent(finalDuration, false, skipPosition);
      }
      
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Reset tracking variables
      setTotalPlayTime(0);
      setPlayStartTime(0);
      setTrackStartTime(0);
      setWasPlayingBeforePause(false);
      
      sendMessageToSW('STOP_TRACK');
    }
  };
  
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    if (clampedVolume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };
  
  const nextTrack = async () => {
    if (!queue) return;
    
    let nextIndex = queue.currentIndex + 1;
    
    if (isShuffled) {
      // Random next track (avoid current)
      const availableIndices = queue.tracks
        .map((_, i) => i)
        .filter(i => i !== queue.currentIndex);
      if (availableIndices.length > 0) {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else if (nextIndex >= queue.tracks.length) {
      if (isRepeated === 'queue') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }
    
    const nextTrack = queue.tracks[nextIndex];
    if (nextTrack) {
      setQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
      await playTrack(nextTrack);
    }
  };
  
  const previousTrack = async () => {
    if (!queue) return;
    
    let prevIndex = queue.currentIndex - 1;
    
    if (isShuffled) {
      // Random previous track (avoid current)
      const availableIndices = queue.tracks
        .map((_, i) => i)
        .filter(i => i !== queue.currentIndex);
      if (availableIndices.length > 0) {
        prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else if (prevIndex < 0) {
      if (isRepeated === 'queue') {
        prevIndex = queue.tracks.length - 1;
      } else {
        return; // Start of queue
      }
    }
    
    const prevTrack = queue.tracks[prevIndex];
    if (prevTrack) {
      setQueue(prev => prev ? { ...prev, currentIndex: prevIndex } : null);
      await playTrack(prevTrack);
    }
  };
  
  const addToQueue = (track: Track) => {
    setQueue(prev => {
      if (!prev) {
        return { tracks: [track], currentIndex: 0 };
      }
      return {
        ...prev,
        tracks: [...prev.tracks, track]
      };
    });
  };
  
  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      if (!prev) return null;
      
      const newTracks = prev.tracks.filter((_, i) => i !== index);
      if (newTracks.length === 0) {
        return null;
      }
      
      let newCurrentIndex = prev.currentIndex;
      if (index < prev.currentIndex) {
        newCurrentIndex = prev.currentIndex - 1;
      } else if (index === prev.currentIndex) {
        newCurrentIndex = Math.min(prev.currentIndex, newTracks.length - 1);
      }
      
      return {
        tracks: newTracks,
        currentIndex: newCurrentIndex
      };
    });
  };
  
  const clearQueue = () => {
    setQueue(null);
    stopTrack();
    setCurrentTrack(null);
  };
  
  const shuffleQueue = () => {
    setQueue(prev => {
      if (!prev) return null;
      
      const currentTrack = prev.tracks[prev.currentIndex];
      const otherTracks = prev.tracks.filter((_, i) => i !== prev.currentIndex);
      
      // Shuffle other tracks
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      
      return {
        tracks: [currentTrack, ...otherTracks],
        currentIndex: 0
      };
    });
  };
  
  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };
  
  const toggleRepeat = () => {
    const modes: ('none' | 'track' | 'queue')[] = ['none', 'track', 'queue'];
    const currentIndex = modes.indexOf(isRepeated);
    const nextIndex = (currentIndex + 1) % modes.length;
    setIsRepeated(modes[nextIndex]);
  };
  
  // Show mini player when there's a current track
  const showMiniPlayer = !!currentTrack && !showFullPlayer;
  
  return (
    <MusicPlayerContext.Provider
      value={{
        // Current state
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffled,
        isRepeated,
        isLoading,
        
        // Queue
        queue,
        
        // S2E eligibility
        isEligibleForS2E,
        
        // Player actions
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlay,
        stopTrack,
        
        // Seeking
        seekTo,
        
        // Volume
        setVolume,
        toggleMute,
        
        // Queue navigation
        nextTrack,
        previousTrack,
        
        // Queue manipulation
        addToQueue,
        removeFromQueue,
        clearQueue,
        shuffleQueue,
        
        // Player modes
        toggleShuffle,
        toggleRepeat,
        
        // Player visibility
        showMiniPlayer,
        showFullPlayer,
        setShowFullPlayer,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
