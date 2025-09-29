"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image';
import { generateClientFingerprint } from "@/lib/utils/deviceFingerprinting";
import { normalizeUnlockCode } from "@/lib/utils/codeGenerator";

interface ReleasePreview {
  title: string;
  artist: string;
  cover: string;
  type: "album" | "single";
  code: string;
}

interface CodeRedemptionProps {
  onScanBarcode: () => void;
  onRedeemSuccess?: () => void;
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

export const CodeRedemption: React.FC<CodeRedemptionProps> = ({ onScanBarcode, onRedeemSuccess }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [validatedRelease, setValidatedRelease] = useState<ReleasePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemedReleases, setRedeemedReleases] = useState<ReleasePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateCode = async () => {
    if (!code.trim()) {
      setError("Please enter a redemption code");
      return;
    }

    const normalizedCode = normalizeUnlockCode(code);

    setIsLoading(true);
    setError("");
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
        setError(data?.error || "Invalid code format. Please use format: SHF-ABCD-1234");
        return;
      }

      if (data?.alreadyOwned) {
        setValidatedRelease(null);
        setError(data?.error || "You already have access to this release.");
        setInfo("You already have access to this release via My Shellff.");
        return;
      }

      const preview = buildReleasePreview(data, normalizedCode);
      setValidatedRelease(preview);
      setError("");
      setInfo("Release verified. Add it to My Shellff to finish unlocking.");
      setCode("");
    } catch (err) {
      console.error("Code validation error", err);
      setError("Failed to validate code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToShellff = async () => {
    if (!validatedRelease) {
      return;
    }

    setIsLoading(true);
    setError("");
    setInfo("");

    try {
      const deviceFingerprint = generateClientFingerprint();
      const response = await fetch("/api/unlock-codes/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: validatedRelease.code,
          deviceFingerprint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Failed to add to My Shellff");
        return;
      }

      const releaseData = data?.release ?? {};
      const releaseType = releaseData.releaseType
        ? formatReleaseType(releaseData.releaseType)
        : validatedRelease.type;
      const releasePreview: ReleasePreview = {
        title: releaseData.title ?? validatedRelease.title,
        artist: releaseData.artist ?? validatedRelease.artist,
        cover: releaseData.coverArt ?? validatedRelease.cover,
        type: releaseType,
        code: validatedRelease.code,
      };

      setRedeemedReleases((prev) => {
        const filtered = prev.filter((entry) => entry.code !== releasePreview.code);
        return [...filtered, releasePreview];
      });
      onRedeemSuccess?.();

      const grantedAt = data?.access?.grantedAt ? new Date(data.access.grantedAt) : undefined;
      const successMessage = grantedAt
        ? `Release added to My Shellff. Access granted ${grantedAt.toLocaleString()}.`
        : "Release added to My Shellff successfully. Access granted!";

      setValidatedRelease(null);
      setInfo(successMessage);
    } catch (err) {
      console.error("Code redemption error", err);
      setError("Failed to add to My Shellff. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      validateCode();
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-[#9B5DE5]/10 via-transparent to-[#00F5D4]/5 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-white text-4xl md:text-5xl mb-4 font-bold">Redeem Your Code</h1>
            <p className="text-gray-400 text-lg">Enter your Shellff redemption code to unlock exclusive content</p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {info && (
              <Alert className="bg-[#00F5D4]/10 border-[#00F5D4]/30 text-[#00F5D4]">
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-900/20 border-red-500/50">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter code e.g., SHF-A1B2-C3D4"
                  className={`
                    w-full px-6 py-4 bg-gray-800/50 border-2 rounded-2xl text-white placeholder-gray-400
                    focus:border-purple-500 focus:ring-0 focus:outline-none
                    ${error ? "border-red-500" : "border-gray-600"}
                  `}
                />
              </div>
              <div className="sm:w-auto">
                <Button
                  onClick={onScanBarcode}
                  className="w-full sm:w-auto bg-[#9B5DE5] hover:bg-[#00F5D4] text-white px-6 py-4 rounded-2xl whitespace-nowrap"
                  disabled={isLoading}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan
                </Button>
              </div>
            </div>

            <Button
              onClick={validateCode}
              disabled={isLoading || !code.trim()}
              className={`
                w-full px-6 py-4 rounded-2xl transition-all duration-300
                font-medium text-white
                ${isLoading || !code.trim()
                  ? "bg-gray-600 cursor-not-allowed opacity-50"
                  : "bg-[#9B5DE5] hover:bg-[#00F5D4] shadow-[0_0_20px_rgba(155,93,229,0.5)] hover:shadow-[0_0_20px_rgba(0,245,212,0.5)] transform hover:scale-105"
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Validating...
                </div>
              ) : (
                "Validate Code"
              )}
            </Button>
          </div>

          {validatedRelease && (
            <div className="w-full max-w-md mt-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-black/70 backdrop-blur-md border-[#9B5DE5]/30">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={validatedRelease.cover}
                      alt={validatedRelease.title}
                      width={64}
                      height={64}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-bold text-lg">{validatedRelease.title}</h3>
                      <p className="text-gray-300 text-sm">{validatedRelease.artist}</p>
                      <Badge className="bg-[#9B5DE5]/20 text-[#9B5DE5] mt-1 capitalize">
                        {validatedRelease.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#9B5DE5] text-[#9B5DE5] hover:bg-[#9B5DE5] hover:text-white"
                      onClick={() => {
                        setValidatedRelease(null);
                        setInfo("");
                      }}
                      disabled={isLoading}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleAddToShellff}
                      className="flex-1 bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        "Add to My Shellff"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {redeemedReleases.length > 0 && (
            <div className="w-full max-w-md mt-12 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-white text-2xl mb-6 text-center font-bold">My Latest Unlocks</h2>
              <div className="space-y-4">
                {redeemedReleases.map((release) => (
                  <Card key={release.code} className="bg-gray-900/70 border-gray-700 shadow-[0_0_30px_rgba(155,93,229,0.3)]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Image
                            src={release.cover}
                            alt={release.title}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#9B5DE5]/20 to-transparent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">{release.title}</h3>
                          <p className="text-gray-400 truncate">{release.artist}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="w-3 h-3 bg-[#00F5D4] rounded-full shadow-[0_0_10px_rgba(0,245,212,0.8)]" />
                          <span className="text-xs text-[#00F5D4] mt-1">Unlocked</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-8 p-4 bg-gray-900/30 rounded-xl border border-gray-700/50">
            <p className="text-gray-400 text-sm mb-2">Sample codes to try:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["SHF-A1B2-C3D4", "SHF-E5F6-G7H8", "SHF-J9K0-L1M2"].map((sampleCode) => (
                <button
                  key={sampleCode}
                  onClick={() => {
                    setCode(sampleCode);
                    inputRef.current?.focus();
                  }}
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






