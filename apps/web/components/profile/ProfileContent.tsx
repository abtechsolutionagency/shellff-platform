
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Edit2, Music, Users, TrendingUp, Settings, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitchModal } from "@/components/profile/role-switch-modal";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import Image from "next/image";
import {
  fetchProfile,
  type ProfileApiResponse,
  type ProfileStats,
  type ProfileTrack,
  type ProfilePlaylist,
  type ProfileActivity,
} from "@/lib/profile-client";

export function ProfileContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.email) {
      return;
    }

    const controller = new AbortController();
    let isSubscribed = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProfile(controller.signal);
        if (isSubscribed) {
          setProfile(data);
        }
      } catch (fetchError) {
        if (isSubscribed && (fetchError as Error).name !== "AbortError") {
          setError((fetchError as Error).message);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isSubscribed = false;
      controller.abort();
    };
  }, [session?.user?.email, refreshKey]);

  if (!mounted || !session?.user) return null;

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return (session?.user as any)?.firstName?.[0]?.toUpperCase() || 'U';
  };

  const userType = useMemo(() => {
    const fromProfile = profile?.user?.userType;
    const fromSession = (session?.user as any)?.userType;
    return (fromProfile || fromSession || 'LISTENER').toUpperCase();
  }, [profile?.user?.userType, session?.user]);
  const isCreator = userType === 'CREATOR';

  const displayName = useMemo(() => {
    if (profile?.user?.firstName || profile?.user?.lastName) {
      return `${profile?.user?.firstName ?? ''} ${profile?.user?.lastName ?? ''}`.trim();
    }

    return session.user.name || session.user.email?.split('@')[0] || 'User';
  }, [profile?.user?.firstName, profile?.user?.lastName, session.user]);

  const username = profile?.user?.username
    ? `@${profile.user.username}`
    : (session?.user as any)?.username
      ? `@${(session?.user as any)?.username}`
      : `@${session.user.email?.split('@')[0] ?? 'user'}`;

  const joinDate = profile?.user?.createdAt
    ? new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
        new Date(profile.user.createdAt)
      )
    : null;

  const stats: Required<ProfileStats> = {
    tracksPlayed: profile?.stats?.tracksPlayed ?? 0,
    following: profile?.stats?.following ?? 0,
    shcEarned: profile?.stats?.shcEarned ?? 0,
  };

  const recentlyPlayed: ProfileTrack[] = profile?.recentlyPlayed ?? [];
  const playlists: ProfilePlaylist[] = profile?.playlists ?? [];
  const recentActivity: ProfileActivity[] = profile?.recentActivity ?? [];

  const profileAvatar = profile?.user?.profilePicture || profile?.user?.avatar || session.user.image || undefined;

  const handleRetry = () => {
    setRefreshKey((current) => current + 1);
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
        <header className="p-6 border-b border-gray-800 md:ml-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white md:hidden"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400" disabled>
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400" disabled>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="md:ml-60 p-6" aria-busy="true">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-800 rounded w-48" />
            <div className="h-64 bg-gray-800 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
        <main className="md:ml-60 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-2xl font-semibold text-white">Unable to load your profile</h1>
          <p className="text-gray-400 max-w-md">
            {error}
          </p>
          <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700 text-white">
            Try Again
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <header className="p-6 border-b border-gray-800 md:ml-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <RoleSwitchModal
              currentRole={userType as 'LISTENER' | 'CREATOR'}
              username={profile?.user?.username || (session?.user as any)?.username || session?.user?.email?.split('@')[0] || 'user'}
              sciId={profile?.user?.sciId || (session?.user as any)?.sciId}
              isRoleRestricted={
                session?.user?.email === 'creatoronly@shellff.com' ||
                (session?.user as any)?.settings?.roleRestrictedToCreator === true
              }
            />
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {error && profile && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="ghost" className="text-red-200 hover:text-white" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </div>
        )}
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-purple-500/20">
                <AvatarImage src={profileAvatar} alt={displayName || "User"} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-teal-500 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white font-poppins">
                  {displayName}
                </h1>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col space-y-2 mb-4">
                <p className="text-purple-400 font-medium">{username}</p>
                <p className="text-gray-400 text-sm">
                  {joinDate ? `Member since ${joinDate}` : 'Member since —'}
                </p>
              </div>

              <p className="text-gray-300 mb-6 max-w-md">
                {profile?.user?.bio || 'Add a bio to personalize your profile and share your music journey with others.'}
              </p>

              {/* Stats */}
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="flex items-center space-x-1 text-purple-400 mb-1">
                    <Music className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.tracksPlayed.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">Tracks Played</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center space-x-1 text-teal-400 mb-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.following}</p>
                  <p className="text-gray-400 text-sm">Following</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center space-x-1 text-green-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.shcEarned.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">SHC Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Listener-specific content */}
          {!isCreator && (
            <>
              {/* Recently Played */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white font-poppins">Recently Played</h2>
                  <Button
                    variant="ghost"
                    className="text-teal-400 hover:text-teal-300 font-medium"
                    onClick={() => router.push('/library')}
                  >
                    View All
                  </Button>
                </div>

                {recentlyPlayed.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentlyPlayed.map((track) => (
                      <div key={track.id} className="group cursor-pointer bg-gray-900 rounded-2xl p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                            <Image
                              src={track.coverUrl}
                              alt={`${track.title} by ${track.artist}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <Play className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1">{track.title}</h3>
                            <p className="text-gray-400 text-xs">{track.artist}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">You have not played any tracks recently.</p>
                )}
              </section>

              {/* My Playlists */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white font-poppins">My Playlists</h2>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => router.push('/playlists/create')}
                  >
                    Create Playlist
                  </Button>
                </div>
                
                {playlists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {playlists.map((playlist) => (
                      <div key={playlist.id} className="bg-gray-900 rounded-2xl p-4 hover:bg-gray-800 transition-colors cursor-pointer">
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-500/20 to-teal-500/20 rounded-xl mb-4 flex items-center justify-center">
                          <div className="text-2xl font-bold text-white/50">{playlist.name[0]}</div>
                        </div>
                        <h3 className="font-semibold text-white mb-1">{playlist.name}</h3>
                        <p className="text-gray-400 text-sm">{playlist.trackCount} tracks</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Create playlists to organize your favorite music.</p>
                )}
              </section>
            </>
          )}

          {/* Creator-specific content */}
          {isCreator && (
            <>
              {/* My Releases */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white font-poppins">My Releases</h2>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => router.push('/creator/upload')}
                  >
                    Upload Track
                  </Button>
                </div>
                
                {recentlyPlayed.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentlyPlayed.map((track) => (
                      <div key={track.id} className="group cursor-pointer bg-gray-900 rounded-2xl p-4 hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                            <Image
                              src={track.coverUrl}
                              alt={`${track.title} by ${track.artist}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <Play className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1">{track.title}</h3>
                            <p className="text-gray-400 text-xs">{track.artist}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Upload your first track to start building momentum.</p>
                )}
              </section>

              {/* Creator Analytics Summary */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white font-poppins">Analytics Overview</h2>
                  <Button 
                    variant="ghost" 
                    className="text-teal-400 hover:text-teal-300 font-medium"
                    onClick={() => router.push('/creator/analytics')}
                  >
                    View Details
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-sm text-gray-400">Total Streams</span>
                    </div>
                    <p className="text-2xl font-bold text-white">47.2K</p>
                    <p className="text-sm text-green-400">+12% this month</p>
                  </div>
                  <div className="bg-gray-900 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      <span className="text-sm text-gray-400">Followers</span>
                    </div>
                    <p className="text-2xl font-bold text-white">1.2K</p>
                    <p className="text-sm text-purple-400">+8 this week</p>
                  </div>
                  <div className="bg-gray-900 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-teal-400" />
                      <span className="text-sm text-gray-400">SHC Earned</span>
                    </div>
                    <p className="text-2xl font-bold text-white">2,847</p>
                    <p className="text-sm text-teal-400">+156 this week</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Common Recent Activity */}
          <section>
            <h2 className="text-xl font-bold text-white font-poppins mb-6">Recent Activity</h2>
            
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-900 rounded-xl">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.description}</p>
                      <p className="text-gray-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-900 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">No recent activity yet.</p>
                    <p className="text-gray-400 text-xs">—</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
