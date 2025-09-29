"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HeroCarousel } from "../hero/HeroCarousel";
import { TrendingSection } from "./TrendingSection";
import { RecentlyPlayedSection } from "./RecentlyPlayedSection";

export function NewDashboardContent() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      <main className="md:ml-60 p-6">
        <HeroCarousel />
        <TrendingSection />
        <RecentlyPlayedSection />
      </main>
    </div>
  );
}
