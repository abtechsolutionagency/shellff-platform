
'use client';

import { useState } from 'react';
import { usePersonalLibrary, ListeningSession } from '@/contexts/PersonalLibraryContext';
import { Clock, Calendar, Smartphone, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LibraryTrackCard } from './LibraryTrackCard';

interface SessionCardProps {
  session: ListeningSession;
}

function SessionCard({ session }: SessionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group p-4 rounded-xl bg-shellff-dark/30 hover:bg-shellff-dark/50 transition-colors border border-shellff-accent/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-shellff-neutral" />
          <span className="text-shellff-neutral font-inter text-sm">
            {formatDate(session.startTime)}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
            +{session.shcEarned.toFixed(2)} SHC
          </Badge>
          
          <span className="text-shellff-neutral font-inter text-sm">
            {formatDuration(session.duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-poppins font-medium text-white truncate">
            {session.track.title}
          </h4>
          <p className="text-shellff-neutral font-inter text-sm truncate">
            {session.track.artist}
          </p>
        </div>
        
        <div className="hidden md:flex items-center space-x-2 text-shellff-neutral text-xs">
          <Smartphone className="h-3 w-3" />
          <span className="truncate max-w-32">
            {session.deviceInfo}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ListeningHistory() {
  const { getListeningHistory, getRecentPlays } = usePersonalLibrary();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'sessions' | 'tracks'>('sessions');

  const filterSessions = (sessions: ListeningSession[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      
      switch (timeFilter) {
        case 'today':
          return sessionDate >= today;
        case 'week':
          return sessionDate >= week;
        case 'month':
          return sessionDate >= month;
        default:
          return true;
      }
    });
  };

  const listeningHistory = getListeningHistory();
  const recentPlays = getRecentPlays();
  const filteredSessions = filterSessions(listeningHistory);

  const todaySessions = filterSessions(listeningHistory.filter(s => 
    new Date(s.startTime).toDateString() === new Date().toDateString()
  ));
  
  const totalTimeToday = todaySessions.reduce((acc, session) => acc + session.duration, 0);
  const totalShcToday = todaySessions.reduce((acc, session) => acc + session.shcEarned, 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-poppins">
            Listening History
          </h2>
          <p className="text-shellff-neutral font-inter mt-1">
            Track your music journey and earnings
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
            <SelectTrigger className="w-32 bg-shellff-accent border-shellff-accent text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-shellff-accent border-shellff-accent">
              <SelectItem value="all" className="text-white hover:bg-shellff-dark/50">All Time</SelectItem>
              <SelectItem value="today" className="text-white hover:bg-shellff-dark/50">Today</SelectItem>
              <SelectItem value="week" className="text-white hover:bg-shellff-dark/50">This Week</SelectItem>
              <SelectItem value="month" className="text-white hover:bg-shellff-dark/50">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-shellff-accent text-shellff-neutral">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          <Button variant="outline" size="sm" className="border-shellff-accent text-shellff-neutral">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-shellff-accent border-shellff-accent glow-purple">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  {todaySessions.length}
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  Sessions Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-accent border-shellff-accent glow-teal">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  {formatTime(totalTimeToday)}
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  Time Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Badge className="bg-orange-500/20 text-orange-400 text-xs p-1">
                  SHC
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  {totalShcToday.toFixed(2)}
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  SHC Earned Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-poppins">
                  7
                </h3>
                <p className="text-shellff-neutral font-inter text-sm">
                  Day Streak
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Content */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-shellff-accent">
          <TabsTrigger 
            value="sessions"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            Sessions ({filteredSessions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="tracks"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-shellff-neutral"
          >
            Recent Tracks ({recentPlays.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card className="bg-shellff-accent border-shellff-accent">
              <CardContent className="text-center py-12">
                <Clock className="h-16 w-16 text-shellff-neutral mx-auto mb-4" />
                <h3 className="text-white font-poppins text-xl mb-2">No listening history</h3>
                <p className="text-shellff-neutral font-inter mb-6">
                  Your listening sessions will appear here
                </p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Start Listening
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <Card className="bg-shellff-accent border-shellff-accent">
            <CardHeader>
              <CardTitle className="text-white font-poppins flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Recent Tracks
              </CardTitle>
              <CardDescription className="text-shellff-neutral font-inter">
                Tracks you&rsquo;ve listened to recently, ordered by last played
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPlays.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-shellff-neutral font-inter">
                    No recent plays yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentPlays.map((track, index) => (
                    <LibraryTrackCard 
                      key={track.id} 
                      track={track}
                      index={index}
                      showStats={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
