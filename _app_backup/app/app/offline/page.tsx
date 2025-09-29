
"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect creators as they don't have offline functionality
  useEffect(() => {
    if (session && (session as any).user?.userType === 'CREATOR') {
      router.push('/creator/releases');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        router.push('/dashboard');
      } else {
        setIsRetrying(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: '#121212' }}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-teal-400/10"></div>
      </div>
      
      {/* Offline Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 shadow-2xl text-center">
          
          {/* Status Icon */}
          <div className="mb-6">
            {isOnline ? (
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wifi className="h-10 w-10 text-green-400" />
              </div>
            ) : (
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <WifiOff className="h-10 w-10 text-red-400" />
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-white mb-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: '700',
                  fontSize: '2rem',
                  lineHeight: '2.25rem'
                }}>
              Shellff
            </h1>
            <div className="w-16 h-1 rounded-full mx-auto"
                 style={{ background: 'linear-gradient(to right, #9B5DE5, #00F5D4)' }}></div>
          </div>

          {/* Status Message */}
          <div className="mb-8">
            {isOnline ? (
              <div>
                <h2 className="text-xl font-semibold text-green-400 mb-2" 
                    style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Back Online!
                </h2>
                <p className="text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Redirecting you back to Shellff...
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-red-400 mb-2" 
                    style={{ fontFamily: 'Poppins, sans-serif' }}>
                  You're Offline
                </h2>
                <p className="text-zinc-300 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Check your internet connection to continue enjoying your music on Shellff.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!isOnline && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-3 px-6 text-white rounded-xl 
                       transition-all duration-300 transform
                       focus:outline-none active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center space-x-2"
              style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontWeight: '600',
                backgroundColor: isRetrying ? '#6b7280' : '#9B5DE5'
              }}
              onMouseEnter={(e) => {
                if (!isRetrying) {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#00F5D4';
                  target.style.transform = 'scale(1.02)';
                  target.style.boxShadow = '0 10px 25px rgba(0, 245, 212, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRetrying) {
                  const target = e.target as HTMLButtonElement;
                  target.style.backgroundColor = '#9B5DE5';
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = 'none';
                }
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking Connection...' : 'Try Again'}</span>
            </button>
          )}

          {/* Offline Features Info */}
          {!isOnline && (
            <div className="mt-6 p-4 bg-zinc-800 rounded-xl">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2" 
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                Available Offline:
              </h3>
              <ul className="text-xs text-zinc-400 space-y-1" 
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                <li>• View cached playlists</li>
                <li>• Access downloaded tracks</li>
                <li>• Browse local music library</li>
                <li>• View profile information</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
