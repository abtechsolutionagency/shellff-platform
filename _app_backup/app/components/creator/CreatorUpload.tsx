
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadField } from '@/components/upload/UploadField';
import { TrackForm } from '@/components/upload/TrackForm';
import { PublishFeeModal } from '@/components/upload/PublishFeeModal';
import { RoyaltySplitForm } from '@/components/upload/RoyaltySplitForm';
import { ReleaseTypeSelector } from '@/components/creator/ReleaseTypeSelector';
import { PhysicalUnlockToggle } from '@/components/creator/PhysicalUnlockToggle';
import { AlertCircle, Upload as UploadIcon, Music, Clock, Calendar } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  file: File | null;
  duration: string;
  lyrics?: string;
  isExplicit: boolean;
  contributors: Contributor[];
}

interface Contributor {
  id: string;
  name: string;
  sciId: string; // Shellff Creator ID
  role: string;
  royaltyPercentage: number;
}

interface RoyaltySplit {
  userId: string;
  percentage: number;
}

type ReleaseType = 'SINGLE' | 'ALBUM' | 'EP';

export function CreatorUpload() {
  const { data: session } = useSession() || {};
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseType, setReleaseType] = useState<ReleaseType>('SINGLE');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [language, setLanguage] = useState('en');
  const [isExplicit, setIsExplicit] = useState(false);
  const [copyrightYear, setCopyrightYear] = useState(new Date().getFullYear());
  const [releaseDate, setReleaseDate] = useState('');
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string>('');
  
  // Physical Album Unlock System
  const [physicalReleaseType, setPhysicalReleaseType] = useState<string>('digital');
  const [physicalUnlockEnabled, setPhysicalUnlockEnabled] = useState<boolean>(false);
  
  // Tracks and contributors
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', title: '', file: null, duration: '', lyrics: '', isExplicit: false, contributors: [] }
  ]);
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplit[]>([]);
  
  // UI state
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Publishing fees
  const publishingFees = {
    SINGLE: 10,
    ALBUM: 50,
    EP: 25
  };

  // Auto-enable unlock codes for physical-only releases
  useEffect(() => {
    if (physicalReleaseType === 'physical') {
      setPhysicalUnlockEnabled(true);
    }
  }, [physicalReleaseType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Release title is required';
    }

    if (!coverArt) {
      newErrors.coverArt = 'Cover art is required';
    }

    if (!genre) {
      newErrors.genre = 'Genre is required';
    }

    const validTracks = tracks.filter(track => track.title.trim() && track.file);
    if (validTracks.length === 0) {
      newErrors.tracks = 'At least one track is required';
    }

    // Validate track count based on release type
    if (releaseType === 'SINGLE' && validTracks.length > 1) {
      newErrors.tracks = 'Singles can only have 1 track';
    } else if (releaseType === 'EP' && (validTracks.length < 2 || validTracks.length > 6)) {
      newErrors.tracks = 'EPs must have 2-6 tracks';
    } else if (releaseType === 'ALBUM' && validTracks.length < 5) {
      newErrors.tracks = 'Albums must have at least 5 tracks';
    }

    // Validate royalty splits
    const totalPercentage = royaltySplits.reduce((sum, split) => sum + split.percentage, 0);
    if (royaltySplits.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.royalty = 'Royalty splits must total 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoverArtChange = (file: File | null) => {
    setCoverArt(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverArtPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverArtPreview('');
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before publishing');
      return;
    }

    setShowModal(true);
  };

  const handleConfirmPublish = async () => {
    setIsSubmitting(true);
    
    try {
      // First, upload cover art
      let coverArtPath = '';
      if (coverArt) {
        const coverArtFormData = new FormData();
        coverArtFormData.append('file', coverArt);
        coverArtFormData.append('purpose', 'cover_art');
        
        const coverResponse = await fetch('/api/media/upload', {
          method: 'POST',
          body: coverArtFormData,
        });
        
        if (!coverResponse.ok) {
          throw new Error('Failed to upload cover art');
        }
        
        const coverData = await coverResponse.json();
        coverArtPath = coverData.cloudStoragePath;
      }

      // Upload track files
      const tracksWithFiles = tracks.filter(track => track.title.trim() && track.file);
      const trackUploads = await Promise.all(
        tracksWithFiles.map(async (track, index) => {
          if (!track.file) return null;
          
          const trackFormData = new FormData();
          trackFormData.append('file', track.file);
          trackFormData.append('purpose', 'track_audio');
          
          const trackResponse = await fetch('/api/media/upload', {
            method: 'POST',
            body: trackFormData,
          });
          
          if (!trackResponse.ok) {
            throw new Error(`Failed to upload track: ${track.title}`);
          }
          
          const trackData = await trackResponse.json();
          return {
            ...track,
            trackNumber: index + 1,
            audioFile: trackData.cloudStoragePath,
            originalFileName: track.file.name,
          };
        })
      );

      // Create release
      const releaseData = {
        title: title.trim(),
        description: description.trim() || null,
        releaseType,
        coverArt: coverArtPath,
        genre: genre || null,
        mood: mood || null,
        language,
        isExplicit,
        copyrightYear,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        tracks: trackUploads.filter(Boolean),
        royaltySplits,
        publishingFee: publishingFees[releaseType],
        // Physical Album Unlock System
        physicalReleaseType,
        physicalUnlockEnabled,
      };

      const response = await fetch('/api/creator/releases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(releaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create release');
      }

      const result = await response.json();
      
      toast.success('Release created successfully! Processing for publication...');
      
      // Redirect to creator dashboard or release page
      window.location.href = '/creator/releases';
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload release');
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Release Information */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-poppins flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-400" />
            Release Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300 font-inter">
                Release Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your release title"
                className="bg-gray-900/50 border-gray-600 text-white"
              />
              {errors.title && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseType" className="text-gray-300 font-inter">
                Release Type *
              </Label>
              <Select value={releaseType} onValueChange={(value: ReleaseType) => setReleaseType(value)}>
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="EP">EP</SelectItem>
                  <SelectItem value="ALBUM">Album</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300 font-inter">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell listeners about your release..."
              className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-gray-300 font-inter">
                Genre *
              </Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="r&b">R&B</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="reggae">Reggae</SelectItem>
                  <SelectItem value="afrobeat">Afrobeat</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.genre && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.genre}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood" className="text-gray-300 font-inter">
                Mood
              </Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  <SelectItem value="happy">Happy</SelectItem>
                  <SelectItem value="sad">Sad</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="relaxing">Relaxing</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="chill">Chill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-gray-300 font-inter">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                  <SelectItem value="ig">Igbo</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="copyrightYear" className="text-gray-300 font-inter">
                Copyright Year
              </Label>
              <Input
                id="copyrightYear"
                type="number"
                value={copyrightYear}
                onChange={(e) => setCopyrightYear(parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="bg-gray-900/50 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseDate" className="text-gray-300 font-inter">
                Release Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="releaseDate"
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Album Unlock System */}
      <div className="space-y-6">
        <ReleaseTypeSelector 
          value={physicalReleaseType}
          onChange={setPhysicalReleaseType}
          className="bg-gray-800/50 border-gray-700"
        />
        
        <PhysicalUnlockToggle
          enabled={physicalUnlockEnabled}
          onChange={setPhysicalUnlockEnabled}
          releaseType={physicalReleaseType}
          className="bg-gray-800/50 border-gray-700"
        />
      </div>

      {/* Cover Art Upload */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white font-poppins">
            Cover Art *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UploadField
            accept="image/*"
            onFileSelect={handleCoverArtChange}
            preview={coverArtPreview}
            label="Upload Cover Art"
            description="Recommended: 3000x3000px, JPG or PNG, max 10MB"
          />
          {errors.coverArt && (
            <p className="text-sm text-red-400 flex items-center gap-1 mt-2">
              <AlertCircle className="w-4 h-4" />
              {errors.coverArt}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tracks */}
      <TrackForm
        tracks={tracks}
        onChange={setTracks}
        error={errors.tracks}
        releaseType={releaseType}
      />

      {/* Royalty Splits */}
      <RoyaltySplitForm
        splits={royaltySplits}
        onChange={setRoyaltySplits}
        error={errors.royalty}
      />

      {/* Publish Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white font-poppins mb-1">
                Ready to Publish?
              </h3>
              <p className="text-gray-400 font-inter">
                Publishing fee: ${publishingFees[releaseType]} (refundable if rejected)
              </p>
            </div>
            <Button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 min-w-[200px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </div>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Publish Release
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Publish Fee Modal */}
      <PublishFeeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmPublish}
        releaseType={releaseType}
        fee={publishingFees[releaseType]}
      />
    </div>
  );
}
