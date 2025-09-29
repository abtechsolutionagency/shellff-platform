

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, TrendingUp, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function CreatorWalletContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeWallet, setActiveWallet] = useState<"purchases" | "earnings">("purchases");
  const [selectedPeriod, setSelectedPeriod] = useState("1W");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !session?.user) return null;

  const creatorWalletData = {
    usdBalance: 56.40, // Purchases wallet balance
    shcBalance: 2847, // Earnings wallet balance (released earnings only)
    monthlyEarnings: 150,
  };

  // Mock creator earnings data
  const creatorEarningsData = {
    totalEarned: 2847, // Only released earnings (PROCESSED status)
    potentialEarnings: 456, // Pending earnings not yet released by admin
    thisWeek: 156,
    avgDaily: 22,
    weeklyChange: 12.5,
    // Chart data reflects potential + released earnings combined for visualization
    weeklyEarnings: [45, 52, 38, 65, 73, 89, 95], // Mon to Sun
    // Potential earnings breakdown for the chart
    weeklyPotentialEarnings: [15, 18, 12, 22, 25, 31, 35], // Pending amounts per day
    transactions: [
      {
        id: "1",
        type: "earn",
        description: "Stream royalties - Eclipse Dreams",
        amount: 45,
        time: "2 hours ago",
        status: "released"
      },
      {
        id: "2",
        type: "pending",
        description: "Pending royalties - Neon Nights", 
        amount: 23,
        time: "5 hours ago",
        status: "pending"
      },
      {
        id: "3",
        type: "earn",
        description: "Monthly creator payout",
        amount: 100,
        time: "1 day ago",
        status: "released"
      },
      {
        id: "4",
        type: "pending",
        description: "Pending royalties - Digital Pulse",
        amount: 67,
        time: "2 days ago", 
        status: "pending"
      },
      {
        id: "5",
        type: "earn",
        description: "Admin-released earnings",
        amount: 34,
        time: "3 days ago",
        status: "released"
      }
    ]
  };
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
            <h1 className="text-2xl font-bold text-white font-poppins">Creator Wallet</h1>
            <p className="text-gray-400 font-inter">Manage your earnings and purchases</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Wallet</h1>
          
          {/* Wallet Type Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeWallet === "purchases" ? "default" : "outline"}
              className={activeWallet === "purchases" ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-gray-600 text-gray-300 hover:bg-gray-800"}
              onClick={() => setActiveWallet("purchases")}
            >
              Purchases Wallet
            </Button>
            <Button
              variant={activeWallet === "earnings" ? "default" : "outline"}
              className={activeWallet === "earnings" ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-gray-600 text-gray-300 hover:bg-gray-800"}
              onClick={() => setActiveWallet("earnings")}
            >
              Earnings Wallet
            </Button>
          </div>

          {/* Balance Card */}
          <Card className="bg-gray-900/50 border-gray-800 mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-400 mb-2 text-sm">Available Balance</p>
                <h2 className="text-5xl font-bold text-white mb-2">
                  {activeWallet === "purchases" 
                    ? `$${creatorWalletData.usdBalance.toFixed(2)}`
                    : `${creatorWalletData.shcBalance} SHC`
                  }
                </h2>
                <p className="text-purple-400 font-medium">
                  {activeWallet === "purchases" ? "USD" : "SHC"}
                </p>
                
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 text-sm">Ready to spend</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-medium"
                  onClick={() => {
                    // TODO: Implement top-up functionality
                    alert("Top-up feature coming soon! This will allow you to add funds to your wallet.");
                  }}
                >
                  Top Up
                </Button>
                <div className="flex flex-col">
                  <Button 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 py-4 rounded-lg font-medium"
                    onClick={() => {
                      // TODO: Implement withdrawal functionality
                      alert("Withdrawal feature coming soon! This will allow you to withdraw your earnings.");
                    }}
                  >
                    Withdraw
                  </Button>
                  <p className="text-xs text-gray-400 mt-2 text-center">Fee: 0.5 SHC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Creator Earnings Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Total Earned</p>
            <h3 className="text-2xl font-bold text-white font-poppins">{creatorEarningsData.totalEarned.toLocaleString()} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5%
            </p>
            <p className="text-gray-500 text-xs mt-1">Released earnings</p>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6 border border-orange-500/20">
            <p className="text-orange-400 text-sm mb-1">Potential Earnings</p>
            <h3 className="text-2xl font-bold text-orange-300 font-poppins">{creatorEarningsData.potentialEarnings.toLocaleString()} SHC</h3>
            <p className="text-orange-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.3%
            </p>
            <p className="text-gray-500 text-xs mt-1">Pending admin release</p>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">This Week</p>
            <h3 className="text-2xl font-bold text-white font-poppins">+{creatorEarningsData.thisWeek} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +23.1%
            </p>
            <p className="text-gray-500 text-xs mt-1">Released this week</p>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Avg. Daily</p>
            <h3 className="text-2xl font-bold text-white font-poppins">{creatorEarningsData.avgDaily} SHC</h3>
            <p className="text-green-400 text-sm flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.2%
            </p>
            <p className="text-gray-500 text-xs mt-1">Daily average</p>
          </div>
        </div>

        {/* Creator Earnings Chart */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white font-poppins">Creator Earnings Chart</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-t from-purple-600 to-teal-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm">Released Earnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full"></div>
                  <span className="text-gray-400 text-sm">Potential Earnings</span>
                </div>
              </div>
            </div>
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
            {creatorEarningsData.weeklyEarnings.map((releasedEarning, index) => {
              const potentialEarning = creatorEarningsData.weeklyPotentialEarnings[index];
              const maxTotal = Math.max(...creatorEarningsData.weeklyEarnings.map((e, i) => 
                e + creatorEarningsData.weeklyPotentialEarnings[i]
              ));
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  {/* Stacked bar chart */}
                  <div className="w-full flex flex-col justify-end" style={{ height: '180px' }}>
                    {/* Potential earnings (top) */}
                    <div 
                      className="w-full bg-gradient-to-t from-orange-500 to-yellow-400 rounded-t-lg transition-all duration-500"
                      style={{ 
                        height: `${(potentialEarning / maxTotal) * 180}px`,
                        minHeight: potentialEarning > 0 ? '3px' : '0px'
                      }}
                      title={`Potential: ${potentialEarning} SHC`}
                    ></div>
                    {/* Released earnings (bottom) */}
                    <div 
                      className="w-full bg-gradient-to-t from-purple-600 to-teal-500 transition-all duration-500"
                      style={{ 
                        height: `${(releasedEarning / maxTotal) * 180}px`,
                        minHeight: releasedEarning > 0 ? '3px' : '0px'
                      }}
                      title={`Released: ${releasedEarning} SHC`}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{weekDays[index]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Creator Transactions */}
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
            {creatorEarningsData.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.status === 'released' 
                      ? 'bg-green-500/20' 
                      : transaction.status === 'pending'
                      ? 'bg-orange-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {transaction.status === 'released' ? (
                      <Plus className="h-5 w-5 text-green-400" />
                    ) : transaction.status === 'pending' ? (
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                    ) : (
                      <Minus className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{transaction.description}</p>
                      {transaction.status === 'pending' && (
                        <Badge variant="outline" className="text-orange-400 border-orange-400/30 bg-orange-400/10 text-xs">
                          Pending
                        </Badge>
                      )}
                      {transaction.status === 'released' && (
                        <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10 text-xs">
                          Released
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{transaction.time}</p>
                  </div>
                </div>
                <div className={`text-right ${
                  transaction.status === 'released' 
                    ? 'text-green-400' 
                    : transaction.status === 'pending'
                    ? 'text-orange-400'
                    : 'text-red-400'
                }`}>
                  <p className="font-bold">
                    {(transaction.status === 'released' || transaction.status === 'pending') ? '+' : ''}{transaction.amount} SHC
                  </p>
                  {transaction.status === 'pending' && (
                    <p className="text-gray-500 text-xs">Awaiting release</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

