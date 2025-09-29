
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Play, Camera, AlertCircle, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBarcodeScannerHook } from '@/hooks/useBarcodeScannerHook';
import { generateClientFingerprint } from '@/lib/utils/deviceFingerprinting';

interface AlbumPreview {
  title: string;
  artist: string;
  cover: string;
  type: 'album' | 'single';
  code: string;
}

interface BarcodeScannerProps {
  onClose?: () => void;
  onScanSuccess?: (result: string) => void;
  onAddToShellff?: (albumPreview: AlbumPreview) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onClose, 
  onScanSuccess,
  onAddToShellff
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [albumPreview, setAlbumPreview] = useState<AlbumPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Use the barcode scanner hook
  const {
    isScanning,
    hasPermission,
    permissionStatus,
    error,
    isLoading,
    stream,
    lastResult,
    startScanning,
    stopScanning,
    requestPermissions,
    clearError,
    clearResult
  } = useBarcodeScannerHook();

  // Real camera view with video stream
  const CameraView = () => (
    <div className="absolute inset-0">
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
      {!stream && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.8)_70%)]" />
          </div>
        </div>
      )}
    </div>
  );

  // Single scanning interface with one square and one vertical line
  const ScanOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="relative">
        {/* Single scanning square */}
        <div className="w-64 h-64 border-2 border-[#9B5DE5] rounded-2xl relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#00F5D4] rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#00F5D4] rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#00F5D4] rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#00F5D4] rounded-br-2xl" />
          
          {/* Single animated scanning line moving up and down */}
          {isScanning && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-[#00F5D4] shadow-lg shadow-[#00F5D4]/50"
              animate={{
                y: [0, 256, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Handle barcode scan result
  useEffect(() => {
    if (lastResult && !isValidating) {
      handleScanResult(lastResult.code);
    }
  }, [lastResult]);

  // Start scanning when component mounts
  useEffect(() => {
    if (!hasPermission && !isLoading) {
      requestPermissions();
    }
  }, [hasPermission, isLoading, requestPermissions]);

  // Attach video element to the hook
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle scan result
  const handleScanResult = async (code: string) => {
    setIsValidating(true);
    
    try {
      const response = await fetch('/api/unlock-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        setScanResult(code);
        setShowPreview(true);
        
        // Set album preview from API response
        setAlbumPreview({
          title: data.albumTitle || "Midnight Dreams",
          artist: data.artistName || "Luna Echo", 
          cover: data.albumCover || "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXIlMjB2aW55bHxlbnwxfHx8fDE3NTc5OTg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
          type: "album",
          code
        });
        
        onScanSuccess?.(code);
        stopScanning();
      } else {
        // Handle invalid code
        console.error('Invalid code:', code);
      }
    } catch (error) {
      console.error('Error validating code:', error);
    } finally {
      setIsValidating(false);
      clearResult();
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose?.();
  };

  const handleRescan = () => {
    setScanResult(null);
    setShowPreview(false);
    setAlbumPreview(null);
    clearResult();
    clearError();
    startScanning();
  };

  const handleAddToShellff = async () => {
    if (!albumPreview) return;
    
    setIsValidating(true);
    try {
      // Generate device fingerprint for security
      const deviceFingerprint = generateClientFingerprint();
      
      const response = await fetch('/api/unlock-codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: albumPreview.code,
          deviceFingerprint 
        }),
      });

      if (response.ok) {
        onAddToShellff?.(albumPreview);
        handleClose();
      } else {
        // Handle error response
        const errorData = await response.json();
        console.error('Error redeeming code:', errorData.error);
        // You could show an error alert here
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
    }
    setIsValidating(false);
  };

  // Permission request UI
  const PermissionRequestView = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6">
      <div className="max-w-sm text-center">
        <Camera size={64} className="mx-auto mb-4 text-[#9B5DE5]" />
        <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
        <p className="text-gray-300 mb-6">
          To scan barcodes, we need access to your device camera. This allows you to quickly redeem unlock codes.
        </p>
        
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button 
            onClick={requestPermissions}
            disabled={isLoading}
            className="w-full bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Requesting Access...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Allow Camera Access
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Show permission request if no camera access */}
      {!hasPermission && <PermissionRequestView />}
      
      {/* Show camera and scanning interface if permission granted */}
      {hasPermission && (
        <>
          {/* Camera View Background */}
          <CameraView />
          
          {/* Close Button - Fixed positioning and z-index */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-black/70 text-white hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10"
            aria-label="Close scanner"
            style={{ pointerEvents: 'auto' }}
          >
            <X size={24} strokeWidth={2} />
          </button>

          {/* Manual Start Scanning Button (if not auto-started) */}
          {!isScanning && !showPreview && !isLoading && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
              <Button
                onClick={startScanning}
                size="lg"
                className="bg-[#9B5DE5] hover:bg-[#00F5D4] text-white px-8 py-4 text-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className="absolute inset-0 flex flex-col">
            {/* Scan Overlay - Takes most of the screen */}
            <div className="flex-1 relative">
              <ScanOverlay />
            </div>

            {/* Instructions and Preview Area */}
            <div className="relative z-10 pb-8">
              <AnimatePresence mode="wait">
                {!showPreview ? (
                  <motion.div
                    key="instructions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="px-6 py-8 text-center"
                  >
                    <p className="text-white text-lg sm:text-xl font-bold tracking-wide">
                      {isScanning ? 'Position barcode in scanning area' : 'Ready to scan codes'}
                    </p>
                    <p className="text-gray-300 text-sm mt-2">
                      {isScanning 
                        ? 'Hold your device steady for best results'
                        : 'Tap "Start Scanning" to begin'
                      }
                    </p>
                    {(isValidating || isLoading) && (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        <span className="ml-2 text-purple-400">
                          {isValidating ? 'Validating code...' : 'Starting camera...'}
                        </span>
                      </div>
                    )}
                    
                    {error && (
                      <Alert className="mt-4 bg-red-900/20 border-red-500/50 max-w-sm mx-auto">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="px-6 py-8"
                  >
                    {/* Success Animation */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mx-auto w-16 h-16 bg-[#9B5DE5] rounded-full flex items-center justify-center mb-6"
                    >
                      <Music className="text-white" size={32} />
                    </motion.div>

                    {/* Album Preview Card */}
                    {albumPreview && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/70 backdrop-blur-md rounded-2xl p-6 max-w-sm mx-auto border border-[#9B5DE5]/30"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={albumPreview.cover}
                            alt={albumPreview.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 text-left">
                            <h3 className="text-white font-bold text-lg">
                              {albumPreview.title}
                            </h3>
                            <p className="text-gray-300 text-sm">
                              {albumPreview.artist}
                            </p>
                            <span className="inline-block px-2 py-1 bg-[#9B5DE5]/20 text-[#9B5DE5] text-xs rounded-full mt-1 capitalize">
                              {albumPreview.type}
                            </span>
                          </div>
                          <button className="p-3 bg-[#9B5DE5] hover:bg-[#00F5D4] rounded-full transition-colors duration-200">
                            <Play className="text-white" size={20} />
                          </button>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                          <Button
                            variant="outline"
                            onClick={handleRescan}
                            className="flex-1 border-[#9B5DE5] text-[#9B5DE5] hover:bg-[#9B5DE5] hover:text-white"
                            disabled={isValidating}
                          >
                            Scan Another
                          </Button>
                          <Button
                            onClick={handleAddToShellff}
                            className="flex-1 bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
                            disabled={isValidating}
                          >
                            {isValidating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              'Add to My Shellff'
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
