
"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Don't show prompt if already installed
    if (standalone) {
      return;
    }

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show custom install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000); // Show after 10 seconds
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show prompt if not installed and not dismissed recently
    if (ios && !standalone) {
      const dismissed = localStorage.getItem('shellff-ios-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      if (dismissedTime < oneDayAgo) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 15000); // Show after 15 seconds on iOS
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    }
    
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    // Remember dismissal for iOS users
    if (isIOS) {
      localStorage.setItem('shellff-ios-install-dismissed', Date.now().toString());
    }
  };

  // Don't render if already installed or prompt shouldn't be shown
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          {/* Icon */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-teal-400 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold" 
                  style={{ fontFamily: 'Poppins, sans-serif' }}>
                Install Shellff
              </h3>
              <p className="text-xs text-zinc-400" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Get the full app experience
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-300 mb-4" 
             style={{ fontFamily: 'Inter, sans-serif' }}>
            {isIOS 
              ? "Add Shellff to your home screen for quick access and a better experience."
              : "Install Shellff on your device for offline access and push notifications."
            }
          </p>

          {/* Install Button */}
          <button
            onClick={handleInstallClick}
            className="w-full py-2 px-4 text-white rounded-xl 
                     transition-all duration-300 transform
                     focus:outline-none active:scale-95
                     flex items-center justify-center space-x-2"
            style={{ 
              fontFamily: 'Poppins, sans-serif', 
              fontWeight: '600',
              backgroundColor: '#9B5DE5'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#00F5D4';
              target.style.transform = 'scale(1.02)';
              target.style.boxShadow = '0 10px 25px rgba(0, 245, 212, 0.25)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#9B5DE5';
              target.style.transform = 'scale(1)';
              target.style.boxShadow = 'none';
            }}
          >
            <Download className="h-4 w-4" />
            <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
          </button>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="mt-3 p-3 bg-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-400" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
