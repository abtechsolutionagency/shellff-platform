
"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

export function SHCBalanceCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-teal-500 p-6 rounded-3xl mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/80 text-sm font-medium">SHC Balance</p>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-xl"></div>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-2 font-poppins">120 SHC</h2>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-green-300" />
          <span className="text-green-300 text-sm font-medium">+12.5%</span>
          <span className="text-white/70 text-sm">from last week</span>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
    </div>
  );
}
