
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Bitcoin, Loader2, AlertTriangle, DollarSign, Zap } from 'lucide-react';

interface NetworkConfig {
  id: string;
  name: string;
  displayName: string;
  symbol: string;
  isEnabled: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: 'wallet' | 'crypto';
  selectedNetwork: string;
  onMethodChange: (method: 'wallet' | 'crypto') => void;
  onNetworkChange: (network: string) => void;
  totalAmount: number;
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  selectedNetwork,
  onMethodChange,
  onNetworkChange,
  totalAmount,
  className = ''
}: PaymentMethodSelectorProps) {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [networksLoading, setNetworksLoading] = useState(false);
  const [networksError, setNetworksError] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    loadNetworks();
    loadWalletBalance();
  }, []);

  const loadNetworks = async () => {
    setNetworksLoading(true);
    setNetworksError('');

    try {
      const response = await fetch('/api/crypto/networks');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load networks');
      }

      setNetworks(data.data);
      
      // Auto-select first available network
      if (data.data.length > 0 && !selectedNetwork) {
        onNetworkChange(data.data[0].name);
      }
    } catch (error) {
      console.error('Networks loading error:', error);
      setNetworksError(error instanceof Error ? error.message : 'Failed to load networks');
    } finally {
      setNetworksLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    setBalanceLoading(true);

    try {
      // This would be replaced with actual wallet balance API
      // For demo, we'll simulate a balance
      setTimeout(() => {
        setWalletBalance(2500.00); // Demo balance
        setBalanceLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Balance loading error:', error);
      setBalanceLoading(false);
    }
  };

  const hasEnoughBalance = walletBalance >= totalAmount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onMethodChange(value as 'wallet' | 'crypto')}
          className="space-y-4"
        >
          {/* Wallet Payment Option */}
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="wallet" id="wallet" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  Purchases Wallet
                  <Badge variant="outline" className="ml-2">
                    <Zap className="h-3 w-3 mr-1" />
                    Instant
                  </Badge>
                </Label>
                {balanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">
                    ${walletBalance.toLocaleString()} available
                  </span>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                Pay instantly using your Shellff wallet balance
              </p>

              {selectedMethod === 'wallet' && !hasEnoughBalance && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need ${(totalAmount - walletBalance).toLocaleString()} more.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Crypto Payment Option */}
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="crypto" id="crypto" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer">
                <Bitcoin className="h-4 w-4" />
                USDT Crypto Payment
                <Badge variant="secondary">Multiple Networks</Badge>
              </Label>
              
              <p className="text-xs text-muted-foreground mt-1">
                Pay with USDT on your preferred blockchain network
              </p>

              {selectedMethod === 'crypto' && (
                <div className="mt-3 space-y-3">
                  {networksLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading networks...</span>
                    </div>
                  ) : networksError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{networksError}</AlertDescription>
                    </Alert>
                  ) : networks.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No crypto networks are currently enabled. Please contact support.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">Select Network:</Label>
                      <Select value={selectedNetwork} onValueChange={onNetworkChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a network" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((network) => (
                            <SelectItem key={network.id} value={network.name}>
                              <div className="flex items-center gap-2">
                                <span>{network.displayName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {network.symbol}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </RadioGroup>

        {/* Payment Summary */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total Amount:</span>
            <span className="font-semibold text-lg">${totalAmount.toLocaleString()}</span>
          </div>
          
          {selectedMethod === 'wallet' && hasEnoughBalance && (
            <div className="text-xs text-green-600 mt-1">
              ✓ Payment will be processed instantly
            </div>
          )}
          
          {selectedMethod === 'crypto' && selectedNetwork && (
            <div className="text-xs text-blue-600 mt-1">
              ⏱ Payment confirmation may take 5-15 minutes depending on network
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
