
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeGenerationForm } from '@/components/creator/CodeGenerationForm';
import { 
  QrCode, 
  Music, 
  Plus, 
  Package, 
  TrendingUp, 
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Release {
  id: string;
  title: string;
  artistName: string;
  releaseType: string;
  physicalUnlockEnabled: boolean;
  physicalReleaseType: string;
  status: string;
  coverArt?: string;
  publishedAt?: string;
  createdAt: string;
}

interface CodeBatch {
  id: string;
  batchId: string;
  releaseId: string;
  quantity: number;
  totalCost: number;
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  codesGenerated: number;
  codesRedeemed: number;
  release: {
    title: string;
    coverArt?: string;
  };
}

export function UnlockCodesContent() {
  const { data: session } = useSession() || {};
  const [releases, setReleases] = useState<Release[]>([]);
  const [codeBatches, setCodeBatches] = useState<CodeBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch eligible releases
      const releasesResponse = await fetch('/api/creator/releases/physical-unlock-enabled');
      if (releasesResponse.ok) {
        const releasesData = await releasesResponse.json();
        setReleases(releasesData.data || []);
      }

      // Fetch existing code batches
      const batchesResponse = await fetch('/api/creator/unlock-codes/batches');
      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        setCodeBatches(batchesData.data || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeGenerationSuccess = (batchId: string) => {
    toast.success('Codes generated successfully!');
    fetchData(); // Refresh the data
    setActiveTab('batches'); // Switch to batches tab
  };

  const eligibleReleases = releases.filter(r => 
    r.physicalUnlockEnabled && 
    (r.status === 'PUBLISHED' || r.status === 'PROCESSING')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
        <main className="md:ml-60 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading unlock codes...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      <main className="md:ml-60 p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold font-poppins bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Physical Album Unlock Codes
          </h1>
          <p className="text-xl text-gray-300 font-inter max-w-3xl mx-auto">
            Generate, manage, and track unlock codes for your physical releases. Bridge the gap between physical and digital music sales.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Batches</p>
                  <p className="text-2xl font-bold text-white">{codeBatches.length}</p>
                </div>
                <Package className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Codes Generated</p>
                  <p className="text-2xl font-bold text-white">
                    {codeBatches.reduce((sum, batch) => sum + batch.codesGenerated, 0).toLocaleString()}
                  </p>
                </div>
                <QrCode className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Codes Redeemed</p>
                  <p className="text-2xl font-bold text-white">
                    {codeBatches.reduce((sum, batch) => sum + batch.codesRedeemed, 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Redemption Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {codeBatches.length > 0 ? 
                      `${Math.round(
                        (codeBatches.reduce((sum, batch) => sum + batch.codesRedeemed, 0) / 
                         codeBatches.reduce((sum, batch) => sum + batch.codesGenerated, 0)) * 100
                      )}%` : '0%'
                    }
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-gray-700">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-purple-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="data-[state=active]:bg-purple-600"
            >
              Generate Codes
            </TabsTrigger>
            <TabsTrigger 
              value="batches" 
              className="data-[state=active]:bg-purple-600"
            >
              Manage Batches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {eligibleReleases.length === 0 ? (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  You don't have any releases with physical unlock codes enabled. 
                  Enable physical unlock codes when uploading a new release to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6">
                <h3 className="text-xl font-semibold text-white">Eligible Releases</h3>
                <div className="grid gap-4">
                  {eligibleReleases.map((release) => (
                    <Card key={release.id} className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Music className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-white">{release.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{release.releaseType}</Badge>
                                <Badge variant={release.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                  {release.status}
                                </Badge>
                                <Badge variant="secondary">{release.physicalReleaseType}</Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedRelease(release);
                              setActiveTab('generate');
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Codes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {selectedRelease ? (
              <CodeGenerationForm
                releaseId={selectedRelease.id}
                releaseTitle={selectedRelease.title}
                artistName={selectedRelease.artistName}
                onSuccess={handleCodeGenerationSuccess}
                className="bg-gray-800/50 border-gray-700"
              />
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  Please select a release from the Overview tab to generate unlock codes.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Code Batches</h3>
            
            {codeBatches.length === 0 ? (
              <Alert className="border-gray-200 bg-gray-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-gray-800">
                  No code batches found. Generate your first batch to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {codeBatches.map((batch) => (
                  <Card key={batch.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-gray-300" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-white">{batch.release.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                              <span>{batch.quantity.toLocaleString()} codes</span>
                              <span>${batch.totalCost.toLocaleString()} ({batch.paymentMethod})</span>
                              <span>{batch.codesRedeemed}/{batch.codesGenerated} redeemed</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            batch.status === 'confirmed' ? 'default' : 
                            batch.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {batch.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {batch.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {batch.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
