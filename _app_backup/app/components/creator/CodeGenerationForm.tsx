
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, QrCode, AlertTriangle, Info, Download } from 'lucide-react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CryptoPaymentModal } from './CryptoPaymentModal';
import { CodeBundleDownload } from './CodeBundleDownload';
import toast from 'react-hot-toast';

interface CodeBundle {
  id: string;
  batchId: string;
  releaseId: string;
  albumTitle: string;
  artistName: string;
  totalCodes: number;
  generatedAt: string;
  status: 'generating' | 'ready' | 'error';
  downloadUrls?: {
    csv: string;
    pdf: string;
    zip: string;
  };
}

interface PricingData {
  quantity: number;
  totalCost: number;
  pricePerCode: number;
  savings: number;
  summary: {
    displayText: string;
    savingsText: string;
    costPerCode: string;
    totalCost: string;
  };
  validation: {
    isValid: boolean;
    warnings?: string[];
  };
}

interface CodeGenerationFormProps {
  releaseId: string;
  releaseTitle: string;
  artistName: string;
  onSuccess?: (batchId: string) => void;
  className?: string;
}

export function CodeGenerationForm({
  releaseId,
  releaseTitle,
  artistName,
  onSuccess,
  className = ''
}: CodeGenerationFormProps) {
  const [quantity, setQuantity] = useState<string>('');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string>('');
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'crypto'>('wallet');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string>('');
  
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoPaymentData, setCryptoPaymentData] = useState<any>(null);
  
  const [generatedBundles, setGeneratedBundles] = useState<CodeBundle[]>([]);
  const [bundleGenerating, setBundleGenerating] = useState(false);

  // Debounced pricing calculation
  useEffect(() => {
    if (!quantity || parseInt(quantity) <= 0) {
      setPricing(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await calculatePricing(parseInt(quantity));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [quantity]);

  const calculatePricing = async (qty: number) => {
    setPricingLoading(true);
    setPricingError('');

    try {
      const response = await fetch(`/api/creator/code-generation/pricing?quantity=${qty}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to calculate pricing');
      }

      setPricing(data.data);
    } catch (error) {
      console.error('Pricing calculation error:', error);
      setPricingError(error instanceof Error ? error.message : 'Failed to calculate pricing');
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!pricing || !quantity) return;

    setPurchasing(true);
    setPurchaseError('');

    try {
      if (selectedPaymentMethod === 'wallet') {
        // For wallet payments, generate codes immediately
        await generateCodeBundle();
      } else {
        // For crypto payments, first process the payment
        const purchaseData = {
          quantity: parseInt(quantity),
          releaseId,
          paymentMethod: selectedPaymentMethod,
          networkId: selectedPaymentMethod === 'crypto' ? selectedNetwork : undefined
        };

        const response = await fetch('/api/creator/code-generation/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(purchaseData)
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to process purchase');
        }

        // Show crypto payment modal
        setCryptoPaymentData(data.data);
        setShowCryptoModal(true);
      }

    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseError(error instanceof Error ? error.message : 'Failed to process purchase');
      toast.error('Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const generateCodeBundle = async () => {
    if (!quantity) return;

    setBundleGenerating(true);
    
    try {
      const response = await fetch('/api/creator/code-bundles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseId,
          quantity: parseInt(quantity)
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate code bundle');
      }

      // Add the new bundle to the list
      setGeneratedBundles(prev => [data.bundle, ...prev]);
      
      toast.success(`Successfully generated ${quantity} unlock codes!`);
      
      // Reset form
      setQuantity('');
      setPricing(null);
      setSelectedPaymentMethod('wallet');
      setSelectedNetwork('');
      
      onSuccess?.(data.bundle.batchId);

    } catch (error) {
      console.error('Bundle generation error:', error);
      toast.error('Failed to generate code bundle');
    } finally {
      setBundleGenerating(false);
    }
  };

  const handleCryptoPaymentComplete = async (batchId: string) => {
    setShowCryptoModal(false);
    setCryptoPaymentData(null);
    toast.success('Payment confirmed! Generating codes...');
    
    // Generate bundle after crypto payment confirmation
    await generateCodeBundle();
  };

  const isFormValid = pricing?.validation?.isValid && selectedPaymentMethod && 
    (selectedPaymentMethod === 'wallet' || selectedNetwork);
    
  const isProcessing = purchasing || bundleGenerating;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Unlock Codes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create unique unlock codes for "{releaseTitle}"
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Codes</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity (e.g., 1000)"
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              How many physical copies are you planning to sell?
            </p>
          </div>

          {/* Pricing Display */}
          {pricingLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Calculating pricing...</span>
            </div>
          )}

          {pricingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{pricingError}</AlertDescription>
            </Alert>
          )}

          {pricing && (
            <div className="space-y-4">
              <Separator />
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Pricing Breakdown</h3>
                  {pricing.savings > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Save ${pricing.savings.toLocaleString()}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{pricing.summary.displayText}</span>
                    <span className="font-medium">${pricing.totalCost.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price per code:</span>
                    <span>{pricing.summary.costPerCode}</span>
                  </div>
                </div>
              </div>

              {/* Validation Warnings */}
              {pricing.validation.warnings && pricing.validation.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {pricing.validation.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <Separator />
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  selectedNetwork={selectedNetwork}
                  onMethodChange={setSelectedPaymentMethod}
                  onNetworkChange={setSelectedNetwork}
                  totalAmount={pricing.totalCost}
                />
              </div>
            </div>
          )}

          {/* Purchase Error */}
          {purchaseError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{purchaseError}</AlertDescription>
            </Alert>
          )}

          {/* Purchase Button */}
          <div className="flex gap-3">
            <Button
              onClick={handlePurchase}
              disabled={!isFormValid || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {bundleGenerating ? 'Generating Codes...' : 'Processing...'}
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  {pricing ? `Pay $${pricing.totalCost.toLocaleString()}` : 'Generate Codes'}
                </>
              )}
            </Button>
          </div>

          {/* Pricing Tiers Info */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-2">Volume Pricing Tiers:</div>
              <div className="text-blue-700 space-y-1 text-xs">
                <div>• 1-999 codes: $50 each</div>
                <div>• 1,000-4,999 codes: $30 each</div>
                <div>• 5,000+ codes: $20 each</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Bundles */}
      {generatedBundles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Generated Code Bundles</h3>
          </div>
          {generatedBundles.map((bundle) => (
            <CodeBundleDownload 
              key={bundle.id}
              bundle={bundle}
              onRefresh={() => {
                // Refresh bundle status if needed
                console.log('Refreshing bundle:', bundle.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Crypto Payment Modal */}
      {showCryptoModal && cryptoPaymentData && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          paymentData={cryptoPaymentData}
          onPaymentComplete={handleCryptoPaymentComplete}
        />
      )}
    </>
  );
}
