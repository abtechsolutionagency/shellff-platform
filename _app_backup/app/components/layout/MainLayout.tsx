
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import { MobileBottomNav } from "../navigation/MobileBottomNav";
import { TopHeader } from "../navigation/TopHeader";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Top Header */}
      <TopHeader />
      
      {/* Main Content */}
      <div className="min-h-screen">
        {children}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
