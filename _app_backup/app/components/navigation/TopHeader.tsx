
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function TopHeader() {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return (session?.user as any)?.firstName?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="h-16 bg-black/50 backdrop-blur-sm border-b border-gray-800 px-6 flex items-center justify-between md:justify-center">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center">
        <span className="font-bold text-xl text-white font-poppins">Shellff</span>
      </div>

      {/* Search Bar - Desktop */}
      <div className="hidden md:block flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for artists, albums, tracks..."
            className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Right Section - Desktop */}
      <div className="hidden md:flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
              3
            </Badge>
          </Link>
        </Button>
        
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-white">
            {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User'}
          </span>
        </div>
      </div>

      {/* Mobile Notification */}
      <div className="md:hidden">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
              3
            </Badge>
          </Link>
        </Button>
      </div>
    </header>
  );
}
