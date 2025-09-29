
'use client';

import { useState } from 'react';
import { Plus, Trash2, Music, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UploadField } from './UploadField';
import { TrackContributorForm } from './TrackContributorForm';
import { AlertCircle } from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  sciId: string;
  role: string;
  royaltyPercentage: number;
}

interface Track {
  id: string;
  title: string;
  file: File | null;
  duration: string;
  lyrics?: string;
  isExplicit: boolean;
  contributors: Contributor[];
}

interface TrackFormProps {
  tracks: Track[];
  onChange: (tracks: Track[]) => void;
  error?: string;
  releaseType: 'SINGLE' | 'ALBUM' | 'EP';
}

export function TrackForm({ tracks, onChange, error, releaseType }: TrackFormProps) {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set(['1']));

  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      title: '',
      file: null,
      duration: '',
      lyrics: '',
      isExplicit: false,
      contributors: []
    };
    onChange([...tracks, newTrack]);
    
    // Expand the new track
    setExpandedTracks(prev => new Set([...prev, newTrack.id]));
  };

  const removeTrack = (id: string) => {
    if (tracks.length <= 1) return; // Don't allow removing the last track
    
    onChange(tracks.filter(track => track.id !== id));
    setExpandedTracks(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    onChange(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const toggleTrackExpanded = (id: string) => {
    setExpandedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAudioFile = (trackId: string, file: File | null) => {
    updateTrack(trackId, { file });
    
    // If file is selected, try to get duration
    if (file) {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      
      audio.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        updateTrack(trackId, { duration });
        URL.revokeObjectURL(url);
      });
    } else {
      updateTrack(trackId, { duration: '' });
    }
  };

  const getTrackLimits = () => {
    switch (releaseType) {
      case 'SINGLE':
        return { max: 1, description: 'Singles can only have 1 track' };
      case 'EP':
        return { max: 6, description: 'EPs can have 2-6 tracks' };
      case 'ALBUM':
        return { max: 20, description: 'Albums can have 5-20 tracks' };
      default:
        return { max: 20, description: '' };
    }
  };

  const trackLimits = getTrackLimits();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-poppins flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            Tracks ({tracks.filter(t => t.title.trim() && t.file).length}/{tracks.length})
          </CardTitle>
          <Button
            onClick={addTrack}
            variant="outline"
            size="sm"
            disabled={tracks.length >= trackLimits.max}
            className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Track
          </Button>
        </div>
        {trackLimits.description && (
          <p className="text-gray-400 text-sm font-inter">
            {trackLimits.description}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {tracks.map((track, index) => {
          const isExpanded = expandedTracks.has(track.id);
          const isValid = track.title.trim() && track.file;
          
          return (
            <div key={track.id} className="border border-gray-600 rounded-lg">
              {/* Track Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/30"
                onClick={() => toggleTrackExpanded(track.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isValid ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {track.title.trim() || `Track ${index + 1}`}
                    </p>
                    {track.duration && (
                      <p className="text-gray-400 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {track.duration}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {tracks.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrack(track.id);
                      }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Track Details */}
              {isExpanded && (
                <div className="border-t border-gray-600 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-inter">
                        Track Title *
                      </Label>
                      <Input
                        value={track.title}
                        onChange={(e) => updateTrack(track.id, { title: e.target.value })}
                        placeholder="Enter track title"
                        className="bg-gray-900/50 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-inter flex items-center gap-2">
                        <Checkbox
                          checked={track.isExplicit}
                          onCheckedChange={(checked) => updateTrack(track.id, { isExplicit: checked as boolean })}
                        />
                        Explicit Content
                      </Label>
                    </div>
                  </div>

                  {/* Audio File Upload */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 font-inter">
                      Audio File *
                    </Label>
                    <UploadField
                      accept="audio/*"
                      onFileSelect={(file) => handleAudioFile(track.id, file)}
                      label="Upload Audio File"
                      description="MP3, WAV, FLAC - Max 200MB"
                    />
                  </div>

                  {/* Lyrics */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 font-inter">
                      Lyrics (Optional)
                    </Label>
                    <Textarea
                      value={track.lyrics || ''}
                      onChange={(e) => updateTrack(track.id, { lyrics: e.target.value })}
                      placeholder="Enter track lyrics..."
                      className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                    />
                  </div>

                  {/* Track Contributors */}
                  <TrackContributorForm
                    contributors={track.contributors}
                    onChange={(contributors) => updateTrack(track.id, { contributors })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
