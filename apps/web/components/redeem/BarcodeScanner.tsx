"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Play, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBarcodeScannerHook } from "@/hooks/useBarcodeScannerHook";
import { generateClientFingerprint } from "@/lib/utils/deviceFingerprinting";
import { normalizeUnlockCode } from "@/lib/utils/codeGenerator";
import Image from "next/image";

interface ReleasePreview {
  title: string;
  artist: string;
  cover: string;
  type: "album" | "single";
  code: string;
}

interface RedeemedReleasePayload {
  release: ReleasePreview;
  access?: {
    releaseId: string;
    grantedAt?: string;
    source?: string;
  };
}

interface BarcodeScannerProps {
  onClose?: () => void;
  onScanSuccess?: (result: string) => void;
  onAddToShellff?: (payload: RedeemedReleasePayload) => void;
}
const FALLBACK_RELEASE: ReleasePreview = {
  title: "Midnight Reflections",
  artist: "Aurora Dreams",
  cover:
    "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
  type: "album",
  code: "",
};

const formatReleaseType = (value?: string): "album" | "single" =>
  value?.toLowerCase() === "single" ? "single" : "album";

const buildReleasePreview = (data: any, fallbackCode: string): ReleasePreview => ({
  title: data?.albumTitle ?? FALLBACK_RELEASE.title,
  artist: data?.artistName ?? FALLBACK_RELEASE.artist,
  cover: data?.albumCover ?? FALLBACK_RELEASE.cover,
  type: formatReleaseType(data?.releaseType),
  code: data?.code ?? fallbackCode,
});

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onClose,
  onScanSuccess,
  onAddToShellff,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [releasePreview, setReleasePreview] = useState<ReleasePreview | null>(null);
  const [info, setInfo] = useState("" );
  const [isValidating, setIsValidating] = useState(false);

  const {
    isScanning,
    hasPermission,
    error,
    isLoading,
    stream,
    lastResult,
    startScanning,
    stopScanning,
    requestPermissions,
    clearError,
    clearResult,
  } = useBarcodeScannerHook();

  useEffect(() => {
    if (!hasPermission && !isLoading) {
      void requestPermissions();
    }
  }, [hasPermission, isLoading, requestPermissions]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream ?? null;
    }
  }, [stream]);

  const startCamera = useCallback(() => {
    setInfo("");
    void startScanning(videoRef.current);
  }, [startScanning]);

  const stopCamera = useCallback(() => {
    stopScanning();
    setReleasePreview(null);
    setShowPreview(false);
    setInfo("");
  }, [stopScanning]);

  const handleScanResult = useCallback(async (rawCode: string) => {
    const normalizedCode = normalizeUnlockCode(rawCode);
    setIsValidating(true);
    setInfo("");

    try {
      const response = await fetch("/api/unlock-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: normalizedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReleasePreview(null);
        setShowPreview(false);
        clearResult();
        clearError();
        throw new Error(data?.error || "Failed to validate code");
      }

      if (data?.alreadyOwned) {
        setReleasePreview(null);
        setShowPreview(false);
        setInfo(data?.error || "You already have access to this release.");
        stopCamera();
        return;
      }

      const preview = buildReleasePreview(data, normalizedCode);
      setReleasePreview(preview);
      setShowPreview(true);
      setInfo("Release found. Add it to My Shellff to unlock.");
      onScanSuccess?.(preview.code);
      stopScanning();
    } catch (err) {
      console.error("Barcode validation error", err);
      setInfo("Failed to validate the scanned code. Try again or use manual entry.");
    } finally {
      setIsValidating(false);
      clearResult();
    }
  }, [clearError, clearResult, onScanSuccess, stopCamera, stopScanning]);

  useEffect(() => {
    if (lastResult && !isValidating) {
      void handleScanResult(lastResult.code);
    }
  }, [handleScanResult, isValidating, lastResult]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };
  const handleRescan = useCallback(() => {
    stopCamera();
    clearResult();
    clearError();
    startCamera();
  }, [clearError, clearResult, startCamera, stopCamera]);
  const handleAddToShellff = async () => {
    if (!releasePreview) {
      return;
    }

    setIsValidating(true);
    setInfo("");

    try {
      const deviceFingerprint = generateClientFingerprint();
      const response = await fetch("/api/unlock-codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: releasePreview.code, deviceFingerprint }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add release to My Shellff");
      }

      const releaseData = data?.release ?? {};
      const unlocked: ReleasePreview = {
        title: releaseData.title ?? releasePreview.title,
        artist: releaseData.artist ?? releasePreview.artist,
        cover: releaseData.cover ?? releasePreview.cover,
        type: formatReleaseType(releaseData.releaseType) ?? releasePreview.type,
        code: releasePreview.code,
      };

      onAddToShellff?.({
        release: unlocked,
        access: data?.access
          ? {
              ...data.access,
              releaseId: data?.access?.releaseId ?? releaseData?.id ?? "",
            }
          : undefined,
      });
      setInfo("Release added to My Shellff. Enjoy the music!");
      setShowPreview(false);
      setReleasePreview(null);
      stopCamera();
    } catch (err) {
      console.error("Redeem via scanner failed", err);
      setInfo((err as Error)?.message || "Unable to add release. Try again later.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {!hasPermission && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6">
          <div className="max-w-sm text-center space-y-6">
            <Camera size={64} className="mx-auto text-[#9B5DE5]" />
            <div>
              <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
              <p className="text-gray-300">
                To scan barcodes, we need access to your device camera. Allow access to quickly redeem unlock codes.
              </p>
            </div>
            {error && (
              <Alert className="bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Button
                onClick={() => void requestPermissions()}
                disabled={isLoading}
                className="w-full bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
              >
                {isLoading ? "Requesting Access..." : "Allow Camera Access"}
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full border-gray-600 text-gray-300">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasPermission && (
        <>
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                stream ? "opacity-100" : "opacity-0"
              }`}
            />
            {!stream && (
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.8)_70%)]" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-black/70 text-white hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 backdrop-blur-sm shadow-lg border border-white/10"
            aria-label="Close scanner"
            style={{ pointerEvents: "auto" }}
          >
            <X size={24} strokeWidth={2} />
          </button>

          {!isScanning && !showPreview && !isLoading && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
              <Button onClick={startCamera} size="lg" className="bg-[#9B5DE5] hover:bg-[#00F5D4] text-white px-8 py-4 text-lg">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-[#9B5DE5] rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#00F5D4] rounded-tl-2xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#00F5D4] rounded-tr-2xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#00F5D4] rounded-bl-2xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#00F5D4] rounded-br-2xl" />
                    {isScanning && (
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-[#00F5D4] shadow-lg shadow-[#00F5D4]/50"
                        animate={{ y: [0, 256, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pb-8">
              <AnimatePresence mode="wait">
                {!showPreview ? (
                  <motion.div
                    key="instructions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="px-6 py-8 text-center space-y-4"
                  >
                    <p className="text-white text-lg sm:text-xl font-bold tracking-wide">
                      {isScanning ? "Position barcode in scanning area" : "Ready to scan codes"}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {isScanning ? "Hold your device steady for best results" : "Tap \"Start Scanning\" to begin"}
                    </p>
                    {(isValidating || isLoading) && (
                      <div className="flex items-center justify-center gap-2 text-purple-400">
                        <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        <span>{isValidating ? "Validating code..." : "Starting camera..."}</span>
                      </div>
                    )}
                    {info && (
                      <Alert className="max-w-sm mx-auto bg-[#00F5D4]/10 border-[#00F5D4]/30 text-[#00F5D4]">
                        <AlertDescription>{info}</AlertDescription>
                      </Alert>
                    )}
                    {error && (
                      <Alert className="max-w-sm mx-auto bg-red-900/20 border-red-500/50">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => void requestPermissions()}
                        className="border-[#9B5DE5] text-[#9B5DE5] hover:bg-[#9B5DE5] hover:text-white"
                        disabled={isLoading}
                      >
                        Recheck Permissions
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Manual Entry
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="px-6 py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mx-auto w-16 h-16 bg-[#9B5DE5] rounded-full flex items-center justify-center mb-6"
                    >
                      <Music className="text-white" size={32} />
                    </motion.div>

                    {releasePreview && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/70 backdrop-blur-md rounded-2xl p-6 max-w-sm mx-auto border border-[#9B5DE5]/30 space-y-6"
                      >
                        <div className="flex items-center space-x-4">
                          <Image
                            src={releasePreview.cover}
                            alt={releasePreview.title}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1 text-left">
                            <h3 className="text-white font-bold text-lg">{releasePreview.title}</h3>
                            <p className="text-gray-300 text-sm">{releasePreview.artist}</p>
                            <span className="inline-block px-2 py-1 bg-[#9B5DE5]/20 text-[#9B5DE5] text-xs rounded-full mt-1 capitalize">
                              {releasePreview.type}
                            </span>
                          </div>
                          <button className="p-3 bg-[#9B5DE5] hover:bg-[#00F5D4] rounded-full transition-colors duration-200">
                            <Play className="text-white" size={20} />
                          </button>
                        </div>

                        <div className="flex gap-3">
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
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Adding...
                              </>
                            ) : (
                              "Add to My Shellff"
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









