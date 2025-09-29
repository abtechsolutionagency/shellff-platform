
"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Music, User, LogOut, Settings, Library, Wallet, Gift } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const { data: session, status } = useSession() || {};

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return (session?.user as any)?.firstName?.[0]?.toUpperCase() || 'U';
  };

  // Normalize userType to uppercase for consistent checking
  const userType = (session?.user as any)?.userType?.toUpperCase() || 'LISTENER';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-shellff-accent bg-shellff-dark/95 backdrop-blur supports-[backdrop-filter]:bg-shellff-dark/80">
      <div className="container mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center space-x-2 flex-shrink-0">
          <Music className="h-6 w-6 text-shellff-purple" />
          <span className="font-bold text-xl text-white font-poppins">Shellff</span>
        </Link>

        {session?.user && (
          <div className="hidden md:flex items-center space-x-6">
            {/* Common features for all users */}
            <Link href="/catalog" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-purple whitespace-nowrap">
              Catalog
            </Link>
            
            {/* Listener-only features */}
            {userType === 'LISTENER' && (
              <>
                <Link href="/library" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-purple flex items-center space-x-1 whitespace-nowrap">
                  <Library className="h-4 w-4" />
                  <span>My Shellff</span>
                </Link>
                <Link href="/unlock-album" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-teal flex items-center space-x-1 whitespace-nowrap">
                  <Gift className="h-4 w-4" />
                  <span>Unlock Album</span>
                </Link>
              </>
            )}
            
            {/* Creator-only features */}
            {userType === 'CREATOR' && (
              <>
                <Link href="/creator/releases" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-purple flex items-center space-x-1 whitespace-nowrap">
                  <Music className="h-4 w-4" />
                  <span>My Releases</span>
                </Link>
                <Link href="/creator/upload" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-purple whitespace-nowrap">
                  Upload Music
                </Link>
              </>
            )}
            
            <Link href="/wallet" className="text-sm font-medium font-inter text-shellff-neutral transition-colors hover:text-shellff-teal flex items-center space-x-1 whitespace-nowrap">
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </Link>
          </div>
        )}

        {/* Mobile Navigation Dropdown */}
        {session?.user && (
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-shellff-dark border-gray-600">
                {/* Common features for all users in mobile */}
                <DropdownMenuItem asChild>
                  <Link href="/catalog" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-purple">
                    <Music className="h-4 w-4" />
                    Catalog
                  </Link>
                </DropdownMenuItem>
                
                {/* Listener-only features in mobile */}
                {userType === 'LISTENER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/library" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-purple">
                        <Library className="h-4 w-4" />
                        My Shellff
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/unlock-album" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-teal">
                        <Gift className="h-4 w-4" />
                        Unlock Album
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Creator-only features in mobile */}
                {userType === 'CREATOR' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/creator/releases" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-purple">
                        <Music className="h-4 w-4" />
                        My Releases
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/creator/upload" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-purple">
                        <Music className="h-4 w-4" />
                        Upload Music
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="flex items-center gap-2 text-shellff-neutral hover:text-shellff-teal">
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 text-shellff-neutral hover:text-white">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 text-shellff-neutral hover:text-white">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300 focus:text-red-300">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="hidden md:flex items-center space-x-4">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          ) : session?.user ? (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full"
                onClick={() => {
                  // Navigate to profile
                  window.location.href = '/profile';
                }}
                title={`Profile: ${session.user.name || session.user.email}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
