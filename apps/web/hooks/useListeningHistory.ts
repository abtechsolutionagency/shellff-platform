
'use client';

import { useState, useEffect } from 'react';
import { listeningHistoryService, ListeningHistoryEntry, ListeningStats } from '@/lib/services/listening-history';
import { Track } from '@/contexts/MusicPlayerContext';

export function useListeningHistory() {
  const [history, setHistory] = useState<ListeningHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const fetchHistory = async (params: {
    limit?: number;
    offset?: number;
    timeRange?: 'day' | 'week' | 'month' | 'year';
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await listeningHistoryService.getListeningHistory(params);
      if (result) {
        if (params.offset === 0 || !params.offset) {
          setHistory(result.history);
        } else {
          setHistory(prev => [...prev, ...result.history]);
        }
        setPagination(result.pagination);
      }
    } catch (err) {
      setError('Failed to fetch listening history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchHistory({
        limit: pagination.limit,
        offset: pagination.offset + pagination.limit
      });
    }
  };

  const refresh = () => {
    fetchHistory({ limit: pagination.limit, offset: 0 });
  };

  return {
    history,
    loading,
    error,
    pagination,
    fetchHistory,
    loadMore,
    refresh
  };
}

export function useRecentTracks() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTracks = async (limit: number = 10) => {
    setLoading(true);
    setError(null);

    try {
      const tracks = await listeningHistoryService.getRecentTracks(limit);
      setRecentTracks(tracks);
    } catch (err) {
      setError('Failed to fetch recent tracks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTracks();
  }, []);

  return {
    recentTracks,
    loading,
    error,
    refresh: fetchRecentTracks
  };
}

export function useListeningStats() {
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const fetchStats = async (range: 'day' | 'week' | 'month' | 'year' = timeRange) => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await listeningHistoryService.getListeningStats(range);
      setStats(statsData);
      setTimeRange(range);
    } catch (err) {
      setError('Failed to fetch listening statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    timeRange,
    fetchStats,
    refresh: () => fetchStats(timeRange)
  };
}
