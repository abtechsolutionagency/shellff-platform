
/**
 * Code Slice 4: Code Redemption System
 * Dedicated page for album unlock via codes
 */

"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeRedemption } from '@/components/redeem/CodeRedemption';
import { BarcodeScanner } from '@/components/redeem/BarcodeScanner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Scan, Keyboard } from "lucide-react";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export default function UnlockAlbumPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'code' | 'scan'>('code');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/unlock-album');
    }
  }, [router, status]);

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleScanBarcode = () => {
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#9B5DE5]/10 via-transparent to-[#00F5D4]/5 pointer-events-none"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <Gift className="w-6 h-6 text-[#9B5DE5]" />
                  <h1 className="text-xl font-bold text-white">Unlock Album</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
          {/* Welcome Message */}
          <Card className="mb-8 bg-gradient-to-r from-[#9B5DE5]/10 to-[#00F5D4]/10 border-[#9B5DE5]/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Gift className="w-5 h-5 text-[#9B5DE5]" />
                <span>Welcome to Album Unlock</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Have a physical album with a Shellff unlock code? Redeem it here to get instant digital access to the music.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#00F5D4] rounded-full"></div>
                  <span>Instant digital access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#00F5D4] rounded-full"></div>
                  <span>High-quality streaming</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#00F5D4] rounded-full"></div>
                  <span>Permanent ownership</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redemption Interface */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'code' | 'scan')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800/50">
              <TabsTrigger 
                value="code" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#9B5DE5] data-[state=active]:text-white"
              >
                <Keyboard className="w-4 h-4" />
                <span>Enter Code</span>
              </TabsTrigger>
              <TabsTrigger 
                value="scan" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#9B5DE5] data-[state=active]:text-white"
              >
                <Scan className="w-4 h-4" />
                <span>Scan Barcode</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-6">
              <CodeRedemption onScanBarcode={handleScanBarcode} />
            </TabsContent>

            <TabsContent value="scan" className="space-y-6">
              <BarcodeScanner />
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <Card className="mt-12 bg-gray-900/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Where to find your code:</h4>
                <ul className="text-gray-300 text-sm space-y-1 ml-4">
                  <li>â€¢ Look inside your CD case or vinyl sleeve</li>
                  <li>â€¢ Check the back of your USB packaging</li>
                  <li>â€¢ Codes are printed on small cards or stickers</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Code format:</h4>
                <p className="text-gray-300 text-sm">
                  Codes follow the format: <code className="bg-gray-800 px-2 py-1 rounded text-[#00F5D4]">SHF-A1B2-C3D4</code>
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Having trouble?</h4>
                <p className="text-gray-300 text-sm">
                  Make sure your camera has permission to scan barcodes, or try entering the code manually.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
