
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HeroCarousel } from "../hero/HeroCarousel";
import { TrendingSection } from "./TrendingSection";
import { RecentlyPlayedSection } from "./RecentlyPlayedSection";

export function NewDashboardContent() {
  const { data: session } = useSession() || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  // This component is specifically for listeners, so no need for creator logic here
  // The routing in the page.tsx handles showing CreatorDashboardContent for creators

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {/* Hero Carousel - Replaces SHC Balance Card */}
        <HeroCarousel />

        {/* Trending Now Section */}
        <TrendingSection />

        {/* Recently Played Section - Always show for listeners */}
        <RecentlyPlayedSection />
      </main>
    </div>
  );
}
