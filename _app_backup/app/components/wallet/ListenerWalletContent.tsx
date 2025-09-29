

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, TrendingUp, Plus, Minus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ListenerWalletContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1W");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  // Mock wallet data
  const walletData = {
    currentBalance: 120,
    totalEarned: 2847,
    thisWeek: 156,
    avgDaily: 22,
    weeklyChange: 12.5,
    weeklyEarnings: [45, 52, 38, 65, 73, 89, 95], // Mon to Sun
    transactions: [
      {
        id: "1",
        type: "earn",
        description: "Listening rewards - Eclipse Dreams",
        amount: 45,
        time: "2 hours ago"
      },
      {
        id: "2",
        type: "earn",
        description: "Listening rewards - Neon Nights",
        amount: 23,
        time: "5 hours ago"
      },
      {
        id: "3",
        type: "spend",
        description: "Premium track unlock",
        amount: -100,
        time: "1 day ago"
      },
      {
        id: "4",
        type: "earn",
        description: "Weekly listening bonus",
        amount: 67,
        time: "2 days ago"
      },
      {
        id: "5",
        type: "earn",
        description: "Listening rewards - Digital Pulse",
        amount: 34,
        time: "3 days ago"
      }
    ]
  };

  const maxEarning = Math.max(...walletData.weeklyEarnings);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <header className="p-6 border-b border-gray-800 md:ml-60">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white font-poppins">My Wallet</h1>
            <p className="text-gray-400 font-inter">Track your SHC earnings and spending</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-teal-500 p-6 rounded-3xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-2">Current Balance</p>
            <h2 className="text-4xl font-bold text-white mb-4 font-poppins">{walletData.currentBalance} SHC</h2>
            
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-4 w-4 text-green-300" />
              <span className="text-green-300 text-sm font-medium">+{walletData.weeklyChange}%</span>
              <span className="text-white/70 text-sm">this week</span>
            </div>
            
            <div className="text-white/60 text-sm font-mono">
              0x24d435...5f2a1b
              <Button variant="ghost" size="sm" className="ml-2 p-1 text-white/60 hover:text-white">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Total Earned</p>
            <h3 className="text-2xl font-bold text-white font-poppins">{walletData.totalEarned.toLocaleString()} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5%
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">This Week</p>
            <h3 className="text-2xl font-bold text-white font-poppins">+{walletData.thisWeek} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +23.1%
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Avg. Daily</p>
            <h3 className="text-2xl font-bold text-white font-poppins">{walletData.avgDaily} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2%
            </p>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white font-poppins">Earnings Chart</h3>
            <div className="flex space-x-2">
              {["1D", "1W", "1M", "1Y"].map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={`${selectedPeriod === period ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="h-48 flex items-end space-x-2">
            {walletData.weeklyEarnings.map((earning, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-teal-500 rounded-t-lg transition-all duration-500"
                  style={{ 
                    height: `${(earning / maxEarning) * 100}%`,
                    minHeight: '20px'
                  }}
                ></div>
                <p className="text-gray-400 text-xs mt-2">{weekDays[index]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white font-poppins">Recent Transactions</h3>
            <Button 
              variant="ghost" 
              className="text-teal-400 hover:text-teal-300 font-medium"
              onClick={() => router.push('/wallet/transactions')}
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {walletData.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'earn' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {transaction.type === 'earn' ? (
                      <Plus className="h-5 w-5 text-green-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-gray-400 text-sm">{transaction.time}</p>
                  </div>
                </div>
                <div className={`text-right ${
                  transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <p className="font-bold">
                    {transaction.type === 'earn' ? '+' : ''}{transaction.amount} SHC
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

