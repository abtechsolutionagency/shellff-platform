
import { Track } from '@/contexts/MusicPlayerContext';

export interface PlayEventData {
  trackId: string;
  duration?: number;
  completed?: boolean;
  deviceType?: string;
  platform?: string;
  source?: string;
  sessionId?: string;
  skipPosition?: number;
  bufferCount?: number;
}

export interface ListeningHistoryEntry {
  id: string;
  lastPlayed: string;
  playCount: number;
  totalTime: number;
  track: Track & {
    lastPlayed?: string;
  };
}

export interface ListeningStats {
  overview: {
    totalPlayEvents: number;
    totalListeningTimeMinutes: number;
    uniqueTracks: number;
    averageSessionLength: number;
  };
  topArtists: Array<{
    id: string;
    name: string;
    avatar?: string;
    playCount: number;
  }>;
  topTracks: Array<{
    id: string;
    title: string;
    artist: string;
    artistId: string;
    albumTitle?: string;
    imageUrl?: string;
    playCount: number;
    totalTimeMinutes: number;
  }>;
  listeningActivity: Array<{
    date: string;
    play_count: number;
    total_duration: number;
  }>;
}

class ListeningHistoryService {
  private baseUrl = '/api/listen';
  private currentPlayEventId: string | null = null;
  private sessionId: string;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = window.navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Start a new play event
  async startPlayEvent(data: PlayEventData): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/play-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          deviceType: data.deviceType || this.getDeviceType(),
          platform: data.platform || 'web',
          sessionId: data.sessionId || this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log play event');
      }

      const result = await response.json();
      this.currentPlayEventId = result.playEventId;
      return result.playEventId;
    } catch (error) {
      console.error('Error starting play event:', error);
      return null;
    }
  }

  // Update the current play event
  async updatePlayEvent(data: Partial<PlayEventData> & { playEventId?: string }): Promise<boolean> {
    try {
      const playEventId = data.playEventId || this.currentPlayEventId;
      if (!playEventId) {
        console.warn('No play event ID available for update');
        return false;
      }

      const response = await fetch(`${this.baseUrl}/play-event`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playEventId,
          ...data,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating play event:', error);
      return false;
    }
  }

  // End the current play event
  async endPlayEvent(duration: number, completed: boolean, skipPosition?: number): Promise<boolean> {
    if (!this.currentPlayEventId) return false;

    const success = await this.updatePlayEvent({
      duration,
      completed,
      skipPosition,
    });

    if (success) {
      this.currentPlayEventId = null;
    }

    return success;
  }

  // Get listening history
  async getListeningHistory(params: {
    limit?: number;
    offset?: number;
    timeRange?: 'day' | 'week' | 'month' | 'year';
  } = {}): Promise<{
    history: ListeningHistoryEntry[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  } | null> {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.timeRange) searchParams.set('timeRange', params.timeRange);

      const response = await fetch(`${this.baseUrl}/history?${searchParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch listening history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listening history:', error);
      return null;
    }
  }

  // Get recently played tracks
  async getRecentTracks(limit: number = 10): Promise<Track[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent tracks');
      }

      const result = await response.json();
      return result.recentTracks || [];
    } catch (error) {
      console.error('Error fetching recent tracks:', error);
      return [];
    }
  }

  // Get listening statistics
  async getListeningStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ListeningStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats?timeRange=${timeRange}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch listening stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listening stats:', error);
      return null;
    }
  }

  // Get the current play event ID (useful for external updates)
  getCurrentPlayEventId(): string | null {
    return this.currentPlayEventId;
  }

  // Set the current play event ID (useful when resuming)
  setCurrentPlayEventId(id: string | null): void {
    this.currentPlayEventId = id;
  }
}

export const listeningHistoryService = new ListeningHistoryService();
