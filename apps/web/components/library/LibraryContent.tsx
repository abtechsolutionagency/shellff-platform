
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Loader2, Music2, Users, Coins, MoreHorizontal, Play, Plus, ShoppingBag, Scan, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { BarcodeScanner } from "../redeem/BarcodeScanner";
import { CodeRedemption } from "../redeem/CodeRedemption";

// Mock data for tracks and playlists
const mockTracks = [
  {
    id: "1",
    title: "Eclipse Dreams",
    artist: "Olivia Stevenson",
    duration: "3:42",
    coverUrl: "/images/eclipse-dreams.jpg"
  },
  {
    id: "2",
    title: "Neon Nights",
    artist: "Synthwave Collective",
    duration: "4:18",
    coverUrl: "/images/neon-nights.jpg"
  },
  {
    id: "3",
    title: "Digital Pulse",
    artist: "Echo Chamber",
    duration: "3:56",
    coverUrl: "/images/digital-pulse.jpg"
  }
];

const mockPlaylists = [
  {
    id: "1",
    name: "My Favorites",
    trackCount: 47,
    coverUrl: "/images/cosmic-vibes.jpg"
  },
  {
    id: "2",
    name: "Chill Vibes",
    trackCount: 23,
    coverUrl: "/images/eclipse-dreams.jpg"
  },
  {
    id: "3",
    name: "Workout Mix",
    trackCount: 35,
    coverUrl: "/images/neon-nights.jpg"
  }
];

type ReleaseAccessSource = 'UNLOCK_CODE' | 'PURCHASE' | 'ADMIN_GRANT';

type ReleaseAccessStatus = 'active' | 'expired';

interface LibraryAccessItem {
  accessId: string;
  releaseId: string;
  title: string;
  artist: string;
  cover: string;
  releaseType: string;
  trackCount: number;
  grantedAt: string;
  expiresAt: string | null;
  source: ReleaseAccessSource;
  status: ReleaseAccessStatus;
}

const DEFAULT_ALBUM_COVER = '/api/placeholder/400/400';
export function LibraryContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCodeRedemption, setShowCodeRedemption] = useState(false);
  const [purchases, setPurchases] = useState<LibraryAccessItem[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
  const [purchasesError, setPurchasesError] = useState("");

  const loadReleaseAccess = useCallback(async () => {
    try {
      setIsLoadingPurchases(true);
      setPurchasesError("");
      const response = await fetch("/api/listener/release-access");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load your unlocks.");
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = (items as any[]).map((item) => {
        const cover =
          typeof item?.cover === "string" && item.cover.trim().length > 0
            ? item.cover
            : DEFAULT_ALBUM_COVER;
        const expiresAt = item?.expiresAt ?? null;

        return {
          accessId: item?.accessId ?? `${item?.releaseId ?? "release"}-${item?.grantedAt ?? Date.now()}`,
          releaseId: item?.releaseId ?? "",
          title: item?.title ?? "Untitled Release",
          artist: item?.artist ?? "Unknown Artist",
          cover,
          releaseType: item?.releaseType ?? "album",
          trackCount: typeof item?.trackCount === "number" ? item.trackCount : 0,
          grantedAt: item?.grantedAt ?? new Date().toISOString(),
          expiresAt,
          source: (item?.source ?? "UNLOCK_CODE") as ReleaseAccessSource,
          status: item?.status === "expired" ? "expired" : "active",
        } as LibraryAccessItem;
      });

      setPurchases(normalized);
    } catch (error) {
      console.error("Failed to load release access", error);
      setPurchasesError(error instanceof Error ? error.message : "Failed to load your unlocks.");
    } finally {
      setIsLoadingPurchases(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (session?.user) {
      void loadReleaseAccess();
    }
  }, [session?.user, loadReleaseAccess]);

  if (!mounted || !session?.user) return null;

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return (session?.user as any)?.firstName?.[0]?.toUpperCase() || 'JS';
  };

  const handleScanBarcode = () => {
    setShowBarcodeScanner(true);
  };

  const handleEnterCode = () => {
    setShowCodeRedemption(true);
  };

  const handleScanSuccess = (result: string) => {
    console.log('Scanned code:', result);
  };

  const handleAddToShellff = () => {
    void loadReleaseAccess();
  };
  const userType = (session?.user as any)?.userType;
  const isCreator = userType === 'CREATOR' || userType === 'Creator' || userType === 'creator';

  const getAccessSourceIcon = (source: string) => {
    switch (source) {
      case "UNLOCK_CODE":
        return <FileText className="h-4 w-4" />;
      case "PURCHASE":
        return <ShoppingBag className="h-4 w-4" />;
      case "ADMIN_GRANT":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Scan className="h-4 w-4" />;
    }
  };

  const getAccessSourceLabel = (source: string) => {
    switch (source) {
      case "UNLOCK_CODE":
        return "Unlock Code";
      case "PURCHASE":
        return "Purchase";
      case "ADMIN_GRANT":
        return "Admin Grant";
      default:
        return "Manual Unlock";
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Mobile back button */}
      <div className="md:hidden p-4 border-b border-gray-800">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-purple-500/20">
                <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                <AvatarFallback className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-purple-600 to-pink-600">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button size="sm" className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {session.user.name || 'John Smith'}
              </h1>
              <p className="text-gray-400 text-sm mb-1">
                @{(session?.user as any)?.username || 'johnsmith'} • Member since 2024
              </p>
              <p className="text-gray-300 text-sm mb-4">
                Music enthusiast exploring the future of audio with blockchain technology. Always discovering new sounds.
              </p>

              {/* Stats */}
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-purple-400">
                    <Music2 className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">1,234</p>
                  <p className="text-sm text-gray-400">Tracks Played</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-purple-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-sm text-gray-400">Following</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-purple-400">
                    <Coins className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">2,847</p>
                  <p className="text-sm text-gray-400">SHC Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Purchases Section */}
        <section className="mb-12">
          {/* Mobile Layout */}
          <div className="md:hidden mb-6">
            {/* Buttons centered on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto"
                onClick={handleScanBarcode}
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto"
                onClick={handleEnterCode}
              >
                <FileText className="h-4 w-4 mr-2" />
                Enter Code
              </Button>
            </div>
            {/* Title below buttons on mobile */}
            <h2 className="text-2xl font-bold text-white text-center">My Purchases</h2>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Purchases</h2>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                onClick={handleScanBarcode}
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                onClick={handleEnterCode}
              >
                <FileText className="h-4 w-4 mr-2" />
                Enter Code
              </Button>
            </div>
          </div>

          {isLoadingPurchases ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm">Loading your unlocks...</p>
              </CardContent>
            </Card>
          ) : purchasesError ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 space-y-4 text-center">
                <Alert className="bg-red-900/20 border-red-500/40">
                  <AlertDescription className="text-red-200">
                    {purchasesError}
                  </AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => {
                    void loadReleaseAccess();
                  }}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : purchases.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No unlocks yet</h3>
                <p className="text-gray-400 mb-4">
                  Scan a barcode or enter a code from your physical album to add it to My Shellff instantly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto"
                    onClick={handleScanBarcode}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Barcode
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10 w-full sm:w-auto"
                    onClick={handleEnterCode}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {purchases.map((purchase) => (
                <Card
                  key={purchase.accessId}
                  className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-200 group"
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                      <Image
                        src={purchase.cover}
                        alt={purchase.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                        <Badge className={purchase.status === "active" ? "bg-[#00F5D4]/20 text-[#00F5D4]" : "bg-gray-700 text-gray-300"}>
                          {purchase.status === "active" ? "Active" : "Expired"}
                        </Badge>
                        <Badge className="bg-[#9B5DE5]/20 text-[#9B5DE5] capitalize">
                          {purchase.releaseType}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                          {purchase.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">{purchase.artist}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          {getAccessSourceIcon(purchase.source)}
                          <span>{getAccessSourceLabel(purchase.source)}</span>
                        </div>
                        <span>
                          {purchase.trackCount} {purchase.trackCount === 1 ? "track" : "tracks"}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Access granted: {new Date(purchase.grantedAt).toLocaleDateString()}</p>
                        {purchase.expiresAt ? (
                          <p>Expires: {new Date(purchase.expiresAt).toLocaleDateString()}</p>
                        ) : (
                          <p>Expires: No expiry</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recently Played - Only for non-creators */}
        {!isCreator && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recently Played</h2>
              <Button 
                variant="ghost" 
                className="text-purple-400 hover:text-purple-300"
                onClick={() => router.push('/library/recently-played')}
              >
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTracks.map((track) => (
                <Card key={track.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-square w-16 bg-gray-800 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                          <Music2 className="h-6 w-6 text-purple-400" />
                        </div>
                        <Button 
                          size="sm" 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">{track.title}</h3>
                        <p className="text-gray-400 text-sm">{track.artist}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">{track.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* My Playlists */}
        {!isCreator && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Playlists</h2>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                <Link href="/playlists/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPlaylists.map((playlist) => (
                <Card key={playlist.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative aspect-square w-16 bg-gray-800 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                          <Music2 className="h-6 w-6 text-purple-400" />
                        </div>
                        <Button 
                          size="sm" 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">{playlist.name}</h3>
                        <p className="text-gray-400 text-sm">{playlist.trackCount} tracks</p>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {isCreator ? (
              // Creator-specific activities
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Music2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-purple-400">Published</span> new track &ldquo;Digital Pulse&rdquo;
                    </p>
                    <p className="text-gray-400 text-xs">1h ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-green-400">Received</span> 150 SHC royalties from streams
                    </p>
                    <p className="text-gray-400 text-xs">2h ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-blue-400">Gained</span> 25 new followers
                    </p>
                    <p className="text-gray-400 text-xs">4h ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-yellow-400">Achieved</span> 1,000 streams milestone for &ldquo;Eclipse Dreams&rdquo;
                    </p>
                    <p className="text-gray-400 text-xs">1d ago</p>
                  </div>
                </div>
              </>
            ) : (
              // Listener-specific activities
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Music2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-purple-400">Added</span> Eclipse Dreams to favorites
                    </p>
                    <p className="text-gray-400 text-xs">2h ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-green-400">Earned</span> 45 SHC from listening
                    </p>
                    <p className="text-gray-400 text-xs">3h ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="text-blue-400">Created</span> playlist Chill Vibes
                    </p>
                    <p className="text-gray-400 text-xs">1d ago</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onScanSuccess={handleScanSuccess}
          onAddToShellff={handleAddToShellff}
        />
      )}

      {showCodeRedemption && (
        <div className="fixed inset-0 z-40">
          <CodeRedemption onScanBarcode={() => {
            setShowCodeRedemption(false);
            setShowBarcodeScanner(true);
          }} />
          <button
            onClick={() => setShowCodeRedemption(false)}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-[#00F5D4]/20 hover:text-[#00F5D4] transition-all duration-200 backdrop-blur-sm"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}









