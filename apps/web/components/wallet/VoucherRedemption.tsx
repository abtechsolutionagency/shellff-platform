
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Loader2, Check, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

export function VoucherRedemption() {
  const { redeemVoucher } = useWallet();
  const [voucherCode, setVoucherCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleRedemption = async () => {
    if (!voucherCode.trim()) {
      setRedeemStatus('error');
      setStatusMessage('Please enter a voucher code');
      return;
    }

    setIsRedeeming(true);
    setRedeemStatus('idle');
    
    try {
      const result = await redeemVoucher(voucherCode.trim());
      
      if (result.success) {
        setRedeemStatus('success');
        setStatusMessage('Voucher redeemed successfully!');
        setVoucherCode('');
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setRedeemStatus('idle');
          setStatusMessage('');
        }, 3000);
      } else {
        setRedeemStatus('error');
        setStatusMessage(result.error || 'Failed to redeem voucher');
      }
    } catch (error) {
      setRedeemStatus('error');
      setStatusMessage('Network error occurred');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRedeeming) {
      handleRedemption();
    }
  };

  const getStatusIcon = () => {
    switch (redeemStatus) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (redeemStatus) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card/30 rounded-3xl backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl font-poppins font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Redeem Voucher
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voucher-code" className="font-inter font-medium">
              Voucher Code
            </Label>
            <div className="relative">
              <Input
                id="voucher-code"
                type="text"
                placeholder="Enter your voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="font-mono text-center tracking-wider"
                disabled={isRedeeming}
                maxLength={20}
              />
              
              {/* Status icon in input */}
              {redeemStatus !== 'idle' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getStatusIcon()}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleRedemption}
            disabled={isRedeeming || !voucherCode.trim()}
            className={cn(
              'w-full font-inter font-medium',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'glow-purple transition-all duration-200'
            )}
          >
            {isRedeeming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Redeem Voucher
              </>
            )}
          </Button>

          {/* Status Message */}
          {statusMessage && (
            <div className={cn(
              'p-3 rounded-lg flex items-center gap-2',
              redeemStatus === 'success' && 'bg-green-500/10 border border-green-500/20',
              redeemStatus === 'error' && 'bg-red-500/10 border border-red-500/20'
            )}>
              {getStatusIcon()}
              <p className={cn('text-sm font-inter', getStatusColor())}>
                {statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Voucher Info */}
        <div className="pt-6 border-t border-muted space-y-3">
          <h4 className="font-poppins font-semibold text-foreground">
            How Vouchers Work
          </h4>
          
          <div className="space-y-2 text-sm text-muted-foreground font-inter">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Enter your voucher code to add funds to your Purchases wallet</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Voucher codes are case-insensitive and contain letters and numbers</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Some vouchers may have expiration dates or usage limits</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Funds are added instantly once the voucher is successfully redeemed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
