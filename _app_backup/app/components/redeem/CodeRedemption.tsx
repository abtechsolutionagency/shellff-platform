
"use client";

import { useState, useRef } from 'react';
import { Camera, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateClientFingerprint } from '@/lib/utils/deviceFingerprinting';

interface AlbumPreview {
  title: string;
  artist: string;
  cover: string;
  type: 'album' | 'single';
  code: string;
}

interface CodeRedemptionProps {
  onScanBarcode: () => void;
}

export const CodeRedemption: React.FC<CodeRedemptionProps> = ({ onScanBarcode }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [validatedAlbum, setValidatedAlbum] = useState<AlbumPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemedAlbums, setRedeemedAlbums] = useState<AlbumPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateCode = async () => {
    if (!code.trim()) {
      setError('Please enter a redemption code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unlock-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidatedAlbum({
          title: data.albumTitle || "Midnight Reflections",
          artist: data.artistName || "Aurora Dreams",
          cover: data.albumCover || "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXIlMjB2aW55bHxlbnwxfHx8fDE3NTc5OTg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
          type: "album",
          code: code.trim().toUpperCase()
        });
        setCode('');
      } else {
        setError(data.error || 'Invalid code format. Please use format: SH1234');
      }
    } catch (error) {
      setError('Failed to validate code. Please try again.');
    }

    setIsLoading(false);
  };

  const handleAddToShellff = async () => {
    if (!validatedAlbum) return;
    
    setIsLoading(true);
    try {
      // Generate device fingerprint for security
      const deviceFingerprint = generateClientFingerprint();
      
      const response = await fetch('/api/unlock-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: validatedAlbum.code,
          deviceFingerprint 
        }),
      });

      if (response.ok) {
        setRedeemedAlbums(prev => [...prev, validatedAlbum]);
        setValidatedAlbum(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add to My Shellff');
      }
    } catch (error) {
      setError('Failed to add to My Shellff. Please try again.');
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateCode();
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#9B5DE5]/10 via-transparent to-[#00F5D4]/5 pointer-events-none"></div>
      
      <div className="relative max-w-4xl mx-auto">
        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-white text-4xl md:text-5xl mb-4 font-bold">
              Redeem Your Code
            </h1>
            <p className="text-gray-400 text-lg">
              Enter your Shellff redemption code to unlock exclusive content
            </p>
          </div>

          {/* Input Section */}
          <div className="w-full max-w-md space-y-4">
            {/* Input Row - Responsive */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter code e.g., SH1234"
                  className={`
                    w-full px-6 py-4 bg-gray-800/50 border-2 rounded-2xl text-white placeholder-gray-400
                    focus:border-purple-500 focus:ring-0 focus:outline-none
                    ${error ? 'border-red-500' : 'border-gray-600'}
                  `}
                />
              </div>
              <div className="sm:w-auto">
                <Button
                  onClick={onScanBarcode}
                  className="w-full sm:w-auto bg-[#9B5DE5] hover:bg-[#00F5D4] text-white px-6 py-4 rounded-2xl whitespace-nowrap"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            {/* Validate Button */}
            <Button
              onClick={validateCode}
              disabled={isLoading || !code.trim()}
              className={`
                w-full px-6 py-4 rounded-2xl transition-all duration-300
                font-medium text-white
                ${isLoading || !code.trim()
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-[#9B5DE5] hover:bg-[#00F5D4] shadow-[0_0_20px_rgba(155,93,229,0.5)] hover:shadow-[0_0_20px_rgba(0,245,212,0.5)] transform hover:scale-105'
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Validating...
                </div>
              ) : (
                'Validate Code'
              )}
            </Button>
          </div>

          {/* Validation Result */}
          {validatedAlbum && (
            <div className="w-full max-w-md mt-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-black/70 backdrop-blur-md border-[#9B5DE5]/30">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={validatedAlbum.cover}
                      alt={validatedAlbum.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">
                        {validatedAlbum.title}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {validatedAlbum.artist}
                      </p>
                      <Badge className="bg-[#9B5DE5]/20 text-[#9B5DE5] mt-1">
                        {validatedAlbum.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAddToShellff}
                    className="w-full bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add to My Shellff'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Success State - Purchases Section */}
          {redeemedAlbums.length > 0 && (
            <div className="w-full max-w-md mt-12 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-white text-2xl mb-6 text-center font-bold">
                Purchases
              </h2>
              <div className="space-y-4">
                {redeemedAlbums.map((album, index) => (
                  <Card key={index} className="bg-gray-900/70 border-gray-700 shadow-[0_0_30px_rgba(155,93,229,0.3)]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-16 h-16 rounded-xl object-cover shadow-lg"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#9B5DE5]/20 to-transparent"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">
                            {album.title}
                          </h3>
                          <p className="text-gray-400 truncate">
                            {album.artist}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="w-3 h-3 bg-[#00F5D4] rounded-full shadow-[0_0_10px_rgba(0,245,212,0.8)]"></div>
                          <span className="text-xs text-[#00F5D4] mt-1">
                            Redeemed
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sample Codes Help */}
          <div className="text-center mt-8 p-4 bg-gray-900/30 rounded-xl border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-2">
              Sample codes to try:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['SH1234', 'SH5678', 'SH9012'].map((sampleCode) => (
                <button
                  key={sampleCode}
                  onClick={() => setCode(sampleCode)}
                  className="px-3 py-1 bg-[#9B5DE5]/20 text-[#9B5DE5] rounded-lg text-sm hover:bg-[#9B5DE5]/30 transition-colors"
                >
                  {sampleCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
