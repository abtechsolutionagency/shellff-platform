
"use client";

// Audio Manager for handling audio playback across the app
export class AudioManager {
  private static instance: AudioManager;
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private playlist: Track[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 1;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupEventListeners();
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('loadstart', () => this.emit('loading', true));
    this.audio.addEventListener('loadeddata', () => this.emit('loading', false));
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('play', this.currentTrack);
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('pause', this.currentTrack);
    });
    this.audio.addEventListener('ended', () => {
      this.emit('ended', this.currentTrack);
      this.next();
    });
    this.audio.addEventListener('timeupdate', () => {
      this.emit('timeupdate', {
        currentTime: this.audio?.currentTime || 0,
        duration: this.audio?.duration || 0
      });
    });
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.emit('error', e);
    });
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Playback controls
  async play(track?: Track) {
    if (!this.audio) return;

    if (track && track !== this.currentTrack) {
      this.currentTrack = track;
      this.audio.src = track.audioUrl;
      
      // Find track in current playlist and set index
      const index = this.playlist.findIndex(t => t.id === track.id);
      if (index !== -1) {
        this.currentIndex = index;
      }
    }

    try {
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.emit('error', error);
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  next() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[this.currentIndex];
    if (nextTrack) {
      this.play(nextTrack);
    }
  }

  previous() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = this.currentIndex === 0 ? this.playlist.length - 1 : this.currentIndex - 1;
    const prevTrack = this.playlist[this.currentIndex];
    if (prevTrack) {
      this.play(prevTrack);
    }
  }

  // Playlist management
  setPlaylist(tracks: Track[], startIndex: number = 0) {
    this.playlist = tracks;
    this.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
  }

  addToQueue(track: Track) {
    this.playlist.push(track);
  }

  removeFromQueue(trackId: string) {
    const index = this.playlist.findIndex(t => t.id === trackId);
    if (index !== -1) {
      this.playlist.splice(index, 1);
      if (index <= this.currentIndex && this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
  }

  // Volume and seeking
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.emit('volumechange', this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  seek(time: number) {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
    }
  }

  // Getters
  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getPlaylist(): Track[] {
    return [...this.playlist];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }
}

// Track interface
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  audioUrl: string;
  coverArt?: string;
  genre?: string;
  releaseYear?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Playlist interface
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverArt?: string;
  tracks: Track[];
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export singleton instance
export const audioManager = typeof window !== 'undefined' ? AudioManager.getInstance() : null;
